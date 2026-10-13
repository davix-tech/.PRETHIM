import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

/*
 * =========================================================
 * REDEN CONNECTION RESOLUTION
 * =========================================================
 *
 * This module is the single PRETHIM-side source of truth
 * for resolving a merchant's active REDEN storefront.
 *
 * IMPORTANT:
 *
 * - REDEN's `sites` table is NOT used here.
 * - We only resolve connections belonging to the
 *   authenticated merchant email.
 * - Only `status = "active"` is considered active.
 * - We NEVER invent or transform a site ID.
 * - We NEVER silently fall back to another site.
 * - Multiple active connections are treated as an
 *   ambiguity instead of guessing.
 *
 * This prevents the exact class of bug where:
 *
 *   new site ID
 *        ↓
 *   old site ID selected
 *        ↓
 *   metrics/intelligence query old tenant
 *
 * =========================================================
 */

export const ACTIVE_CONNECTION_STATUS = "active";

const MAX_SITE_ID_LENGTH = 200;
const MAX_OWNER_EMAIL_LENGTH = 320;

/* =========================================================
   TYPES
========================================================= */

export type ActiveConnection = {
  siteId: string;
  name: string | null;
  status: typeof ACTIVE_CONNECTION_STATUS;
};

export type ConnectionLookupResult =
  | {
      ok: true;
      connection: ActiveConnection;
    }
  | {
      ok: false;
      reason:
        | "not_found"
        | "lookup_failed"
        | "invalid"
        | "config_error"
        | "ambiguous";
    };

type ConnectionRow = {
  id: string;
  site_id: string | null;
  store_name: string | null;
  status: string | null;
  updated_at: string | null;
};

/* =========================================================
   SUPABASE CLIENT
========================================================= */

let cachedSupabase: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (cachedSupabase) {
    return cachedSupabase;
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  cachedSupabase =
    createSupabaseClient(
      url,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },

        global: {
          headers: {
            "X-Client-Info":
              "prethim-reden-connection",
          },
        },
      }
    );

  return cachedSupabase;
}

/* =========================================================
   VALIDATION
========================================================= */

function isValidSiteId(
  siteId: string
): boolean {
  if (
    !siteId ||
    siteId.length > MAX_SITE_ID_LENGTH
  ) {
    return false;
  }

  /*
   * REDEN-generated IDs currently follow:
   *
   * site_xxxxxxxxxxxxxxxx
   *
   * We intentionally allow the broader safe character
   * set here because the exact generated suffix should
   * remain REDEN's responsibility.
   *
   * We do NOT generate site IDs in PRETHIM.
   */
  return /^[a-zA-Z0-9._-]+$/.test(
    siteId
  );
}

function normalizeOwnerEmail(
  ownerEmail: string
): string {
  return ownerEmail
    .trim()
    .toLowerCase();
}

function isValidOwnerEmail(
  ownerEmail: string
): boolean {
  if (
    !ownerEmail ||
    ownerEmail.length >
      MAX_OWNER_EMAIL_LENGTH
  ) {
    return false;
  }

  /*
   * This is deliberately not a full RFC email parser.
   * Authentication has already established the identity.
   *
   * We only reject obviously malformed values here.
   */
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    ownerEmail
  );
}

/* =========================================================
   GET ACTIVE CONNECTION
========================================================= */

/**
 * Resolve the merchant's active REDEN connection.
 *
 * IMPORTANT:
 *
 * The lookup key is:
 *
 *     user_email + status = active
 *
 * We do NOT:
 *
 * - search REDEN's `sites` table
 * - select an arbitrary site
 * - use the oldest site
 * - use the newest REDEN site
 * - infer a site from store name
 * - infer a site from email
 *
 * If more than one active connection exists, we return
 * `ambiguous` rather than selecting one automatically.
 *
 * This is intentional. Silent selection of the wrong
 * tenant is worse than returning an error.
 */
export async function getActiveConnection(
  ownerEmail: string
): Promise<ConnectionLookupResult> {
  /* =======================================================
     1. NORMALIZE + VALIDATE OWNER
  ======================================================= */

  const normalizedEmail =
    normalizeOwnerEmail(
      ownerEmail
    );

  if (
    !isValidOwnerEmail(
      normalizedEmail
    )
  ) {
    console.error(
      "[REDEN CONNECTION] Invalid owner email"
    );

    return {
      ok: false,
      reason: "invalid",
    };
  }

  /* =======================================================
     2. GET ADMIN CLIENT
  ======================================================= */

  let supabase: SupabaseClient;

  try {
    supabase =
      getAdminSupabase();
  } catch (error) {
    console.error(
      "[REDEN CONNECTION] Supabase configuration error:",
      error instanceof Error
        ? error.message
        : String(error)
    );

    return {
      ok: false,
      reason: "config_error",
    };
  }

  /* =======================================================
     3. QUERY DIRECT OWNERSHIP
  ======================================================= */

  const {
    data: directConnections,
    error: directError,
  } = await supabase
    .from("reden_connections")
    .select(
      "id, site_id, store_name, status, updated_at"
    )
    .eq("user_email", normalizedEmail)
    .eq("status", ACTIVE_CONNECTION_STATUS)
    .order("updated_at", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(2)
    .returns<ConnectionRow[]>();

  if (directError) {
    console.error(
      "[REDEN CONNECTION] Direct connection lookup failed:",
      {
        message: directError.message,
        details: directError.details,
        hint: directError.hint,
        code: directError.code,
      }
    );

    return {
      ok: false,
      reason: "lookup_failed",
    };
  }

  /* =======================================================
     4. QUERY EXPLICIT INVITE MEMBERSHIP

     Customers who accept a storefront invitation are recorded
     in reden_members. Their email is not necessarily the
     original connection's user_email, so direct-owner lookup
     alone incorrectly reports installation_not_found.
  ======================================================= */

  const {
    data: memberships,
    error: membershipError,
  } = await supabase
    .from("reden_members")
    .select("connection_id")
    .eq("user_email", normalizedEmail)
    .eq("role", "store_owner")
    .limit(100)
    .returns<Array<{ connection_id: string }>>();

  if (membershipError) {
    console.error(
      "[REDEN CONNECTION] Membership lookup failed:",
      {
        message: membershipError.message,
        details: membershipError.details,
        hint: membershipError.hint,
        code: membershipError.code,
      }
    );

    return {
      ok: false,
      reason: "lookup_failed",
    };
  }

  const memberConnectionIds = [
    ...new Set(
      (memberships ?? [])
        .map((membership) => membership.connection_id)
        .filter(
          (connectionId): connectionId is string =>
            typeof connectionId === "string" &&
            connectionId.length > 0
        )
    ),
  ];

  let memberConnections: ConnectionRow[] = [];

  if (memberConnectionIds.length > 0) {
    const {
      data,
      error: memberConnectionError,
    } = await supabase
      .from("reden_connections")
      .select(
        "id, site_id, store_name, status, updated_at"
      )
      .in("id", memberConnectionIds)
      .eq("status", ACTIVE_CONNECTION_STATUS)
      .order("updated_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(2)
      .returns<ConnectionRow[]>();

    if (memberConnectionError) {
      console.error(
        "[REDEN CONNECTION] Member storefront lookup failed:",
        {
          message: memberConnectionError.message,
          details: memberConnectionError.details,
          hint: memberConnectionError.hint,
          code: memberConnectionError.code,
        }
      );

      return {
        ok: false,
        reason: "lookup_failed",
      };
    }

    memberConnections = data ?? [];
  }

  /* =======================================================
     5. COMBINE + DEDUPLICATE AUTHORIZED CONNECTIONS

     A user may be both the direct owner and an explicit member
     of the same connection. Count that connection only once.
     Never guess when multiple distinct active storefronts exist.
  ======================================================= */

  const connectionById = new Map<string, ConnectionRow>();

  for (const connection of [
    ...(directConnections ?? []),
    ...memberConnections,
  ]) {
    if (connection.id) {
      connectionById.set(connection.id, connection);
    }
  }

  const connections = [...connectionById.values()];

  /* =======================================================
     6. NO ACTIVE CONNECTION
  ======================================================= */

  if (connections.length === 0) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  /* =======================================================
     7. MULTIPLE ACTIVE CONNECTIONS
  ======================================================= */

  if (connections.length > 1) {
    console.error(
      "[REDEN CONNECTION] Multiple active connections detected:",
      {
        ownerEmail: normalizedEmail,
        connections: connections.map((row) => ({
          siteId: row.site_id,
          storeName: row.store_name,
          status: row.status,
          updatedAt: row.updated_at,
        })),
      }
    );

    return {
      ok: false,
      reason: "ambiguous",
    };
  }

  const row =
    connections[0];

  if (!row) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  const siteId =
    row.site_id?.trim() || "";

  const status =
    row.status?.trim() || "";

  /* =======================================================
     8. VALIDATE SITE ID
  ======================================================= */

  if (
    !isValidSiteId(siteId)
  ) {
    console.error(
      "[REDEN CONNECTION] Invalid site ID in active connection:",
      {
        ownerEmail:
          normalizedEmail,
        siteId,
      }
    );

    return {
      ok: false,
      reason: "invalid",
    };
  }

  /* =======================================================
     9. VALIDATE STATUS
  ======================================================= */

  /*
   * The query already filters status = active.
   *
   * We still validate the returned row because the
   * application must never assume database data is valid.
   */
  if (
    status !==
    ACTIVE_CONNECTION_STATUS
  ) {
    console.error(
      "[REDEN CONNECTION] Database returned unexpected status:",
      {
        ownerEmail:
          normalizedEmail,
        siteId,
        status,
      }
    );

    return {
      ok: false,
      reason: "invalid",
    };
  }

  /* =======================================================
     10. RETURN AUTHORITATIVE CONNECTION
  ======================================================= */

  return {
    ok: true,

    connection: {
      siteId,

      name:
        typeof row.store_name ===
        "string"
          ? row.store_name.trim() ||
            null
          : null,

      status:
        ACTIVE_CONNECTION_STATUS,
    },
  };
}