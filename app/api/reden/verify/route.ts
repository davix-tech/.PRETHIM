import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
 * =========================================================
 * PRETHIM → REDEN VERIFY ROUTE
 *
 * INTEGRATION MODEL
 * =========================================================
 *
 * Developer:
 *   - Must be authenticated in PRETHIM.
 *   - Performs the integration.
 *
 * Client:
 *   - Owns the storefront.
 *   - Does not need to sign in during installation.
 *
 * Ownership:
 *
 *   reden_connections.user_email = CLIENT EMAIL
 *
 * Developer identity:
 *
 *   session.user.email = DEVELOPER EMAIL
 *
 * IMPORTANT:
 *
 * clientEmail is OPTIONAL from the browser.
 *
 * The authoritative client email is resolved from:
 *
 *   siteId → reden_connections.user_email
 *
 * This prevents the browser from choosing an arbitrary
 * storefront owner during verification.
 *
 * =========================================================
 *
 * VERIFICATION RULES
 *
 * 1. Developer must be authenticated.
 * 2. siteId is required.
 * 3. siteId must be syntactically valid.
 * 4. The site must already exist in reden_connections.
 * 5. Client ownership comes from the database.
 * 6. If clientEmail is supplied by the browser, it must
 *    match the database owner.
 * 7. REDEN must verify the exact siteId.
 * 8. REDEN must explicitly confirm SDK connectivity.
 * 9. Failed verification never deactivates an active site.
 * 10. A verified site becomes active.
 * 11. Only the verified client connection is activated.
 * 12. Other active storefronts belonging to the same client
 *     are disabled.
 * 13. API keys are never returned by this route.
 * 14. Developer identity is never used as storefront owner.
 *
 * =========================================================
 */

const REDEN_API_URL =
  "https://reden.dcore.name.ng";

const REDEN_VERIFY_TIMEOUT_MS = 10_000;

const MAX_SITE_ID_LENGTH = 200;
const MAX_NAME_LENGTH = 100;
const MAX_API_KEY_LENGTH = 500;
const MAX_EMAIL_LENGTH = 320;

/* =========================================================
   TYPES
========================================================= */

type VerifyBody = {
  siteId?: unknown;
  apiKey?: unknown;
  name?: unknown;
  clientEmail?: unknown;
};

type VerifyResult = {
  ok?: boolean;
  connected?: boolean;
  verified?: boolean;
  status?: string;
  siteId?: unknown;
  name?: unknown;
  active?: unknown;
  error?: unknown;
  details?: unknown;
  [key: string]: unknown;
};

type ConnectionStatus =
  | "active"
  | "installing"
  | "disabled";

type ConnectionRow = {
  id: string;
  user_email: string;
  site_id: string;
  store_name: string | null;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeEmail(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function isValidEmail(email: string): boolean {
  if (!email) {
    return false;
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSiteId(siteId: string): boolean {
  if (!siteId) {
    return false;
  }

  if (siteId.length > MAX_SITE_ID_LENGTH) {
    return false;
  }

  return /^site_[a-zA-Z0-9._-]+$/.test(siteId);
}

function isValidApiKey(apiKey: string): boolean {
  if (!apiKey) {
    return false;
  }

  if (apiKey.length > MAX_API_KEY_LENGTH) {
    return false;
  }

  /*
   * REDEN owns the API-key format.
   */
  return true;
}

function getAdminSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  return createSupabaseClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}

function errorResponse(
  error: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return jsonResponse(
    {
      ok: false,
      connected: false,
      verified: false,
      error,
      ...extra,
    },
    status
  );
}

/* =========================================================
   REDEN VERIFICATION
========================================================= */

async function callRedenVerify(input: {
  siteId: string;
  clientEmail: string;
  apiKey: string;
  name: string;
}) {
  const params =
    new URLSearchParams();

  params.set(
    "siteId",
    input.siteId
  );

  /*
   * REDEN receives the CLIENT email.
   *
   * It must NOT receive the developer email.
   */
  params.set(
    "owner_email",
    input.clientEmail
  );

  if (input.apiKey) {
    params.set(
      "apiKey",
      input.apiKey
    );
  }

  if (input.name) {
    params.set(
      "name",
      input.name
    );
  }

  const url =
    `${REDEN_API_URL}/api/v1/verify?${params.toString()}`;

  let response: Response;

  try {
    response = await fetch(
      url,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",
        },

        cache: "no-store",

        signal:
          AbortSignal.timeout(
            REDEN_VERIFY_TIMEOUT_MS
          ),
      }
    );
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (
        error.name ===
          "TimeoutError" ||
        error.name ===
          "AbortError"
      );

    console.error(
      "[PRETHIM VERIFY] REDEN request failed:",
      {
        siteId:
          input.siteId,

        clientEmail:
          input.clientEmail,

        reason:
          isTimeout
            ? "timeout"
            : "network_error",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      }
    );

    return {
      ok: false as const,

      response: errorResponse(
        isTimeout
          ? "reden_verification_timeout"
          : "reden_api_unreachable",
        isTimeout
          ? 504
          : 502
      ),
    };
  }

  const raw =
    await response.text();

  let data: VerifyResult = {};

  if (raw.trim()) {
    try {
      data =
        JSON.parse(
          raw
        ) as VerifyResult;
    } catch {
      console.error(
        "[PRETHIM VERIFY] REDEN returned invalid JSON:",
        {
          status:
            response.status,

          body:
            raw.slice(
              0,
              2_000
            ),
        }
      );

      return {
        ok: false as const,

        response: errorResponse(
          "invalid_verification_response",
          502
        ),
      };
    }
  }

  return {
    ok: true as const,
    response,
    data,
  };
}

/* =========================================================
   SDK CONNECTION STATE
========================================================= */

function isSdkConnected(
  data: VerifyResult
): boolean {
  return (
    data.connected === true ||
    data.verified === true ||
    data.status === "connected"
  );
}

/* =========================================================
   VERIFY INSTALLATION
========================================================= */

async function verifyInstallation(
  input: {
    siteId: string;
    apiKey: string;
    name: string;
    clientEmail?: string;
  }
) {
  /* =======================================================
     1. AUTHENTICATE DEVELOPER
  ======================================================= */

  const session =
    await getServerSession(
      authOptions
    );

  /*
   * This is the DEVELOPER.
   *
   * It is intentionally NOT used as the storefront owner.
   */
  const developerEmail =
    normalizeEmail(
      session?.user?.email
    );

  if (!developerEmail) {
    return errorResponse(
      "unauthorized",
      401
    );
  }

  /* =======================================================
     2. VALIDATE SITE ID
  ======================================================= */

  const siteId =
    cleanString(
      input.siteId
    );

  if (!siteId) {
    return errorResponse(
      "site_id_required",
      400
    );
  }

  if (
    !isValidSiteId(
      siteId
    )
  ) {
    return errorResponse(
      "invalid_site_id",
      400
    );
  }

  /* =======================================================
     3. SUPABASE ADMIN CLIENT
  ======================================================= */

  let supabase;

  try {
    supabase =
      getAdminSupabase();
  } catch (error) {
    console.error(
      "[PRETHIM VERIFY] Supabase configuration error:",
      error instanceof Error
        ? error.message
        : String(error)
    );

    return errorResponse(
      "server_configuration_error",
      500
    );
  }

  /* =======================================================
     4. RESOLVE CLIENT OWNER FROM SITE
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * The browser does NOT need to supply clientEmail.
   *
   * The authoritative owner is already stored against
   * this site in reden_connections.
   */

  const {
    data: ownerConnection,
    error:
      ownerLookupError,
  } = await supabase
    .from(
      "reden_connections"
    )
    .select(
      `
        id,
        user_email,
        site_id,
        store_name,
        status,
        created_at,
        updated_at
      `
    )
    .eq(
      "site_id",
      siteId
    )
    .maybeSingle<ConnectionRow>();

  if (ownerLookupError) {
    console.error(
      "[PRETHIM VERIFY] Failed to resolve site owner:",
      {
        message:
          ownerLookupError.message,

        details:
          ownerLookupError.details,

        hint:
          ownerLookupError.hint,

        code:
          ownerLookupError.code,

        siteId,
      }
    );

    return errorResponse(
      "connection_lookup_failed",
      500
    );
  }

  if (!ownerConnection) {
    return errorResponse(
      "storefront_not_linked",
      404
    );
  }

  const databaseClientEmail =
    normalizeEmail(
      ownerConnection.user_email
    );

  if (
    !databaseClientEmail ||
    !isValidEmail(
      databaseClientEmail
    )
  ) {
    console.error(
      "[PRETHIM VERIFY] Connection has invalid owner email:",
      {
        siteId,
        connectionId:
          ownerConnection.id,
      }
    );

    return errorResponse(
      "invalid_connection_owner",
      500
    );
  }

  /*
   * Optional browser-supplied email.
   *
   * If present, it MUST match the database owner.
   */
  const suppliedClientEmail =
    normalizeEmail(
      input.clientEmail
    );

  if (
    suppliedClientEmail &&
    suppliedClientEmail !==
      databaseClientEmail
  ) {
    console.error(
      "[PRETHIM VERIFY] Client email mismatch:",
      {
        siteId,

        suppliedEmail:
          suppliedClientEmail,

        databaseEmail:
          databaseClientEmail,
      }
    );

    return errorResponse(
      "client_email_mismatch",
      409
    );
  }

  /*
   * DATABASE IS AUTHORITATIVE.
   */
  const clientEmail =
    databaseClientEmail;

  /* =======================================================
     5. VALIDATE API KEY
  ======================================================= */

  const apiKey =
    cleanString(
      input.apiKey
    );

  if (!apiKey) {
    return errorResponse(
      "api_key_required",
      400
    );
  }

  if (
    !isValidApiKey(
      apiKey
    )
  ) {
    return errorResponse(
      "invalid_api_key",
      400
    );
  }

  /* =======================================================
     6. VALIDATE STORE NAME
  ======================================================= */

  const name =
    cleanString(
      input.name
    );

  if (
    name &&
    name.length >
      MAX_NAME_LENGTH
  ) {
    return errorResponse(
      "invalid_store_name",
      400
    );
  }

  /* =======================================================
     7. FIND EXACT CLIENT + SITE CONNECTION
  ======================================================= */

  /*
   * We now use the authoritative client email resolved
   * from the database.
   */

  const {
    data: connection,
    error:
      connectionError,
  } = await supabase
    .from(
      "reden_connections"
    )
    .select(
      `
        id,
        user_email,
        site_id,
        store_name,
        status,
        created_at,
        updated_at
      `
    )
    .eq(
      "user_email",
      clientEmail
    )
    .eq(
      "site_id",
      siteId
    )
    .maybeSingle<ConnectionRow>();

  if (
    connectionError
  ) {
    console.error(
      "[PRETHIM VERIFY] Connection lookup failed:",
      {
        message:
          connectionError.message,

        details:
          connectionError.details,

        hint:
          connectionError.hint,

        code:
          connectionError.code,

        developerEmail,
        clientEmail,
        siteId,
      }
    );

    return errorResponse(
      "connection_lookup_failed",
      500
    );
  }

  /*
   * The developer cannot verify a site that was not
   * created/linked for this client.
   */
  if (!connection) {
    return errorResponse(
      "storefront_not_linked",
      404
    );
  }

  /* =======================================================
     8. DATABASE OWNERSHIP GUARDS
  ======================================================= */

  if (
    normalizeEmail(
      connection.user_email
    ) !== clientEmail
  ) {
    console.error(
      "[PRETHIM VERIFY] Client ownership mismatch:",
      {
        connectionId:
          connection.id,

        clientEmail,

        databaseEmail:
          connection.user_email,

        siteId,
      }
    );

    return errorResponse(
      "storefront_not_linked",
      403
    );
  }

  if (
    connection.site_id.trim() !==
    siteId
  ) {
    console.error(
      "[PRETHIM VERIFY] Site ID mismatch:",
      {
        connectionId:
          connection.id,

        requestedSiteId:
          siteId,

        databaseSiteId:
          connection.site_id,
      }
    );

    return errorResponse(
      "site_id_mismatch",
      409
    );
  }

  /* =======================================================
     9. CALL REDEN
  ======================================================= */

  const redenResult =
    await callRedenVerify({
      siteId,
      clientEmail,
      apiKey,
      name,
    });

  if (
    !redenResult.ok
  ) {
    return redenResult.response;
  }

  const {
    response:
      redenResponse,

    data:
      redenData,
  } = redenResult;

  /* =======================================================
     10. REDEN HTTP FAILURE
  ======================================================= */

  if (
    !redenResponse.ok
  ) {
    console.error(
      "[PRETHIM VERIFY] REDEN rejected verification:",
      {
        status:
          redenResponse.status,

        siteId,

        clientEmail,

        developerEmail,

        error:
          redenData.error,

        details:
          redenData.details,
      }
    );

    const status =
      redenResponse.status >=
        400 &&
      redenResponse.status <
        600
        ? redenResponse.status
        : 502;

    /*
     * Do not expose REDEN internals.
     */
    return errorResponse(
      "reden_verification_failed",
      status,
      {
        connection: {
          id:
            connection.id,

          siteId:
            connection.site_id,

          name:
            connection.store_name,

          status:
            connection.status,
        },
      }
    );
  }

  /* =======================================================
     11. REDEN SITE ID MUST MATCH
  ======================================================= */

  const returnedSiteId =
    cleanString(
      redenData.siteId
    );

  if (
    !returnedSiteId
  ) {
    console.error(
      "[PRETHIM VERIFY] REDEN returned no siteId:",
      {
        requestedSiteId:
          siteId,

        clientEmail,
      }
    );

    return errorResponse(
      "invalid_verification_response",
      502
    );
  }

  if (
    returnedSiteId !==
    siteId
  ) {
    console.error(
      "[PRETHIM VERIFY] REDEN returned different site:",
      {
        requestedSiteId:
          siteId,

        returnedSiteId,

        clientEmail,
      }
    );

    return errorResponse(
      "reden_site_id_mismatch",
      502
    );
  }

  /* =======================================================
     12. DETERMINE SDK STATE
  ======================================================= */

  const connected =
    isSdkConnected(
      redenData
    );

  /* =======================================================
     13. REDEN SAYS INACTIVE
  ======================================================= */

  if (
    redenData.active ===
    false
  ) {
    return jsonResponse({
      ok: true,

      connected: false,

      verified: false,

      connection: {
        id:
          connection.id,

        siteId:
          connection.site_id,

        name:
          connection.store_name,

        status:
          connection.status,
      },
    });
  }

  /* =======================================================
     14. SDK NOT CONNECTED
  ======================================================= */

  if (!connected) {
    /*
     * DO NOT change state.
     *
     * installing → installing
     * active     → active
     * disabled   → disabled
     */

    return jsonResponse({
      ok: true,

      connected: false,

      verified: false,

      connection: {
        id:
          connection.id,

        siteId:
          connection.site_id,

        name:
          connection.store_name,

        status:
          connection.status,
      },
    });
  }

  /* =======================================================
     15. VERIFIED
  ======================================================= */

  /*
   * REDEN has confirmed the exact site.
   *
   * PRETHIM can now activate the CLIENT'S storefront.
   */

  const now =
    new Date().toISOString();

  /* =======================================================
     16. RETIRE OTHER CLIENT STOREFRONTS
  ======================================================= */

  /*
   * One active storefront per CLIENT.
   *
   * We NEVER touch another client's connections.
   */

  const {
    error:
      retireError,
  } = await supabase
    .from(
      "reden_connections"
    )
    .update({
      status:
        "disabled",

      updated_at:
        now,
    })
    .eq(
      "user_email",
      clientEmail
    )
    .eq(
      "status",
      "active"
    )
    .neq(
      "site_id",
      siteId
    );

  if (
    retireError
  ) {
    console.error(
      "[PRETHIM VERIFY] Failed to retire previous client storefronts:",
      {
        message:
          retireError.message,

        details:
          retireError.details,

        code:
          retireError.code,

        clientEmail,

        siteId,
      }
    );

    return jsonResponse(
      {
        ok: false,

        connected: true,

        verified: true,

        error:
          "storefront_verified_but_previous_connection_could_not_be_retired",
      },
      500
    );
  }

  /* =======================================================
     17. ACTIVATE EXACT CLIENT CONNECTION
  ======================================================= */

  const {
    data:
      updatedConnection,

    error:
      updateError,
  } = await supabase
    .from(
      "reden_connections"
    )
    .update({
      status:
        "active",

      updated_at:
        now,
    })
    .eq(
      "id",
      connection.id
    )
    .eq(
      "user_email",
      clientEmail
    )
    .eq(
      "site_id",
      siteId
    )
    .select(
      `
        id,
        user_email,
        site_id,
        store_name,
        status,
        created_at,
        updated_at
      `
    )
    .single<ConnectionRow>();

  if (
    updateError ||
    !updatedConnection
  ) {
    console.error(
      "[PRETHIM VERIFY] Failed to activate client storefront:",
      {
        message:
          updateError?.message,

        details:
          updateError?.details,

        code:
          updateError?.code,

        clientEmail,

        siteId,
      }
    );

    return jsonResponse(
      {
        ok: false,

        connected: true,

        verified: true,

        error:
          "storefront_verified_but_activation_failed",
      },
      500
    );
  }

  /* =======================================================
     18. FINAL STATE GUARD
  ======================================================= */

  if (
    updatedConnection.status !==
    "active"
  ) {
    console.error(
      "[PRETHIM VERIFY] Unexpected final state:",
      {
        siteId,

        clientEmail,

        status:
          updatedConnection.status,
      }
    );

    return jsonResponse(
      {
        ok: false,

        connected: true,

        verified: true,

        error:
          "invalid_connection_state_after_activation",
      },
      500
    );
  }

  /* =======================================================
     19. SUCCESS
  ======================================================= */

  /*
   * Return the client/storefront identity.
   *
   * API key is intentionally NOT returned.
   *
   * Developer identity is intentionally NOT returned.
   */

  return jsonResponse({
    ok: true,

    connected: true,

    verified: true,

    siteId:
      updatedConnection.site_id,

    name:
      updatedConnection.store_name,

    clientEmail,

    connection: {
      id:
        updatedConnection.id,

      siteId:
        updatedConnection.site_id,

      name:
        updatedConnection.store_name,

      status:
        updatedConnection.status,
    },
  });
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  req: Request
) {
  try {
    let body: VerifyBody;

    try {
      const parsed =
        await req.json();

      if (
        !parsed ||
        typeof parsed !==
          "object" ||
        Array.isArray(parsed)
      ) {
        return errorResponse(
          "invalid_request_body",
          400
        );
      }

      body =
        parsed as VerifyBody;
    } catch {
      return errorResponse(
        "invalid_request_body",
        400
      );
    }

    return await verifyInstallation({
      siteId:
        cleanString(
          body.siteId
        ),

      apiKey:
        cleanString(
          body.apiKey
        ),

      name:
        cleanString(
          body.name
        ),

      /*
       * OPTIONAL.
       *
       * The server will resolve the authoritative
       * client email from Supabase using siteId.
       */
      clientEmail:
        normalizeEmail(
          body.clientEmail
        ),
    });
  } catch (error) {
    console.error(
      "[PRETHIM VERIFY POST]",
      error instanceof Error
        ? {
            message:
              error.message,

            stack:
              error.stack,
          }
        : error
    );

    return errorResponse(
      "verification_failed",
      500
    );
  }
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req: Request
) {
  try {
    const {
      searchParams,
    } = new URL(
      req.url
    );

    return await verifyInstallation({
      siteId:
        searchParams.get(
          "siteId"
        )?.trim() || "",

      apiKey:
        searchParams.get(
          "apiKey"
        )?.trim() || "",

      name:
        searchParams.get(
          "name"
        )?.trim() || "",

      /*
       * OPTIONAL.
       *
       * If omitted, the owner is resolved from Supabase.
       */
      clientEmail:
        normalizeEmail(
          searchParams.get(
            "clientEmail"
          )
        ),
    });
  } catch (error) {
    console.error(
      "[PRETHIM VERIFY GET]",
      error instanceof Error
        ? {
            message:
              error.message,

            stack:
              error.stack,
          }
        : error
    );

    return errorResponse(
      "verification_failed",
      500
    );
  }
}