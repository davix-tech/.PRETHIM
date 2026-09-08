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
     3. QUERY ACTIVE CONNECTIONS
  ======================================================= */

  const {
    data: connections,
    error,
  } = await supabase
    .from("reden_connections")
    .select(
      "site_id, store_name, status, updated_at"
    )
    .eq(
      "user_email",
      normalizedEmail
    )
    .eq(
      "status",
      ACTIVE_CONNECTION_STATUS
    )
    .order(
      "updated_at",
      {
        ascending: false,
        nullsFirst: false,
      }
    )
    /*
     * We only need to know whether there is:
     *
     * 0 connections
     * 1 connection
     * >1 connections
     *
     * Therefore two rows are sufficient.
     */
    .limit(2)
    .returns<ConnectionRow[]>();

  /* =======================================================
     4. HANDLE DATABASE ERROR
  ======================================================= */

  if (error) {
    console.error(
      "[REDEN CONNECTION] Active connection lookup failed:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
      }
    );

    return {
      ok: false,
      reason: "lookup_failed",
    };
  }

  /* =======================================================
     5. NO ACTIVE CONNECTION
  ======================================================= */

  if (
    !connections ||
    connections.length === 0
  ) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  /* =======================================================
     6. MULTIPLE ACTIVE CONNECTIONS
  ======================================================= */

  if (
    connections.length > 1
  ) {
    console.error(
      "[REDEN CONNECTION] Multiple active connections detected:",
      {
        ownerEmail:
          normalizedEmail,
        connections:
          connections.map(
            (row) => ({
              siteId:
                row.site_id,
              storeName:
                row.store_name,
              status:
                row.status,
              updatedAt:
                row.updated_at,
            })
          ),
      }
    );

    /*
     * DO NOT pick connections[0].
     *
     * Picking the most recently updated row was the
     * dangerous behaviour because an old/new storefront
     * could silently become the tenant used by metrics
     * or intelligence.
     */
    return {
      ok: false,
      reason: "ambiguous",
    };
  }

  /* =======================================================
     7. VALIDATE THE SINGLE ROW
  ======================================================= */

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