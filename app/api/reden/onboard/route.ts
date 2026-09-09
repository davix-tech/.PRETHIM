import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/reden/connection";

import {
  REDEN_API_URL,
  errorMessage,
  fetchWithTimeout,
  getRedenAdminSecret,
  isValidSiteId,
  parseJsonResponse,
  upstreamStatus,
} from "@/lib/reden/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 320;
const MAX_BODY_BYTES = 16_384;
const SITE_ID_MAX_LENGTH = 200;
const API_KEY_MAX_LENGTH = 1_000;
const REDEN_ONBOARD_TIMEOUT_MS = 30_000;

const CONNECTION_SELECT =
  "id, user_email, developer_email, site_id, store_name, status, created_at, updated_at";

/* =========================================================
   TYPES
========================================================= */

type RequestBody = {
  name?: unknown;
  clientEmail?: unknown;
};

/*
 * REDEN's /api/v1/onboard nests the created/existing site
 * under `site`, using snake_case keys, e.g.:
 *
 *   {
 *     success: true,
 *     existing: false,
 *     site: {
 *       site_id: "site_...",
 *       api_key: "rd_...",
 *       name: "...",
 *       owner_email: "...",
 *       active: true,
 *       plan: "basic",
 *       subscription_status: "active",
 *       timezone: "Africa/Lagos",
 *       created_at: "..."
 *     }
 *   }
 *
 * There is no top-level siteId/apiKey and no `ok` field --
 * REDEN uses `success`. Reading flat camelCase fields here
 * (the previous bug) silently produces undefined, which then
 * fails validation below and surfaces as
 * reden_returned_invalid_site_id even though REDEN succeeded.
 */
type RedenResponse = {
  success?: boolean;
  existing?: boolean;
  site?: {
    site_id?: unknown;
    api_key?: unknown;
    name?: unknown;
    owner_email?: unknown;
    active?: unknown;
    plan?: unknown;
    subscription_status?: unknown;
    timezone?: unknown;
    created_at?: unknown;
  };
  error?: unknown;
  details?: unknown;
};

type ConnectionRow = {
  id: string;
  user_email: string;
  developer_email: string | null;
  site_id: string;
  store_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string): boolean {
  if (!value || value.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasControlCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function jsonError(
  error: string,
  status: number,
  details?: unknown
) {
  const body: Record<string, unknown> = {
    ok: false,
    error,
  };

  /*
   * Details are intentionally returned only when explicitly
   * supplied by this route. This makes upstream integration
   * failures diagnosable without exposing secrets.
   */
  if (details !== undefined) {
    body.details = details;
  }

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function jsonSuccess(body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function isValidReturnedSiteId(value: unknown): value is string {
  const siteId = cleanString(value);

  if (!siteId || siteId.length > SITE_ID_MAX_LENGTH) {
    return false;
  }

  if (!siteId.startsWith("site_")) {
    return false;
  }

  return isValidSiteId(siteId);
}

function isValidApiKey(value: unknown): value is string {
  const apiKey = cleanString(value);

  if (!apiKey || apiKey.length > API_KEY_MAX_LENGTH) {
    return false;
  }

  if (hasControlCharacters(apiKey)) {
    return false;
  }

  return true;
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");

  /*
   * Legitimate same-origin requests can omit Origin.
   */
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

async function readJsonBody(
  req: Request
): Promise<
  | { ok: true; body: RequestBody }
  | { ok: false; error: string }
> {
  const contentType = req.headers.get("content-type");

  if (
    contentType &&
    !contentType.toLowerCase().startsWith("application/json")
  ) {
    return {
      ok: false,
      error: "invalid_content_type",
    };
  }

  const contentLength = req.headers.get("content-length");

  if (contentLength) {
    const parsedLength = Number(contentLength);

    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      return {
        ok: false,
        error: "invalid_content_length",
      };
    }

    if (parsedLength > MAX_BODY_BYTES) {
      return {
        ok: false,
        error: "request_too_large",
      };
    }
  }

  let rawBody: string;

  try {
    rawBody = await req.text();
  } catch {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  const bodyBytes = new TextEncoder().encode(rawBody).byteLength;

  if (bodyBytes > MAX_BODY_BYTES) {
    return {
      ok: false,
      error: "request_too_large",
    };
  }

  if (!rawBody.trim()) {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  return {
    ok: true,
    body: parsed as RequestBody,
  };
}

/* =========================================================
   POST /api/reden/onboard
========================================================= */

export async function POST(req: Request) {
  try {
    /* =====================================================
       1. AUTHENTICATE PRETHIM USER
    ===================================================== */

    const session = await getServerSession(authOptions);

    const developerEmail = cleanString(
      session?.user?.email
    ).toLowerCase();

    if (!developerEmail) {
      return jsonError("unauthorized", 401);
    }

    /* =====================================================
       2. SAME-ORIGIN PROTECTION
    ===================================================== */

    if (!isSameOrigin(req)) {
      return jsonError("forbidden_origin", 403);
    }

    /* =====================================================
       3. READ + VALIDATE BODY
    ===================================================== */

    const bodyResult = await readJsonBody(req);

    if (!bodyResult.ok) {
      return jsonError(
        bodyResult.error,
        bodyResult.error === "request_too_large"
          ? 413
          : 400
      );
    }

    const body = bodyResult.body;

    const name = cleanString(body.name);

    const clientEmail = cleanString(
      body.clientEmail
    ).toLowerCase();

    /* =====================================================
       4. VALIDATE STOREFRONT NAME
    ===================================================== */

    if (!name) {
      return jsonError(
        "storefront_name_required",
        400
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return jsonError(
        "storefront_name_too_long",
        400
      );
    }

    if (hasControlCharacters(name)) {
      return jsonError(
        "invalid_storefront_name",
        400
      );
    }

    /* =====================================================
       5. VALIDATE CLIENT EMAIL
    ===================================================== */

    if (!clientEmail) {
      return jsonError(
        "client_email_required",
        400
      );
    }

    if (!isValidEmail(clientEmail)) {
      return jsonError(
        "invalid_client_email",
        400
      );
    }

    /* =====================================================
       6. SERVER CONFIGURATION
    ===================================================== */

    const adminSecret = cleanString(
      getRedenAdminSecret()
    );

    if (!adminSecret) {
      console.error(
        "[REDEN ONBOARD] REDEN admin secret is not configured"
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    const redenBaseUrl = cleanString(
      REDEN_API_URL
    ).replace(/\/+$/, "");

    if (!redenBaseUrl) {
      console.error(
        "[REDEN ONBOARD] REDEN API URL is not configured"
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    const redenOnboardUrl =
      `${redenBaseUrl}/api/v1/onboard`;

    /* =====================================================
       7. CALL REDEN

       REDEN is authoritative.

       PRETHIM authenticated user:
         developerEmail

       REDEN storefront owner:
         clientEmail

       REDEN generates:
         site_id
         api_key

       IMPORTANT:
       client_email is sent to REDEN because that is the
       current REDEN onboarding contract.
    ===================================================== */

    let redenResponse: Response;

    try {
      redenResponse = await fetchWithTimeout(
        redenOnboardUrl,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-admin-secret": adminSecret,
          },

          body: JSON.stringify({
            name,
            owner_email: clientEmail,
          }),

          cache: "no-store",
        },
        REDEN_ONBOARD_TIMEOUT_MS
      );
    } catch (error) {
      const message = errorMessage(error);

      console.error(
        "[REDEN ONBOARD] Upstream request failed:",
        {
          message,
          url: redenOnboardUrl,
          developerEmail,
          clientEmail,
        }
      );

      const errorName =
        error instanceof Error
          ? error.name
          : "";

      const lowerMessage =
        message.toLowerCase();

      if (
        errorName === "AbortError" ||
        lowerMessage.includes("timeout") ||
        lowerMessage.includes("aborted")
      ) {
        return jsonError(
          "reden_onboard_timeout",
          504
        );
      }

      return jsonError(
        "reden_onboard_unavailable",
        502
      );
    }

    /* =====================================================
       8. READ REDEN RESPONSE BODY ONCE
    ===================================================== */

    let reden: RedenResponse;

    try {
      reden =
        await parseJsonResponse<RedenResponse>(
          redenResponse
        );
    } catch (error) {
      console.error(
        "[REDEN ONBOARD] REDEN returned invalid JSON:",
        {
          status: redenResponse.status,
          statusText: redenResponse.statusText,
          error: errorMessage(error),
        }
      );

      return jsonError(
        "reden_returned_invalid_json",
        502
      );
    }

    /* =====================================================
       9. HANDLE REDEN FAILURE

       REDEN signals failure with `success: false`, not `ok`.
       !redenResponse.ok (native fetch status check) already
       covers REDEN's non-2xx failure responses; the explicit
       reden.success === false check is a defensive second
       layer in case REDEN ever returns success:false with a
       2xx status.
    ===================================================== */

    if (
      !redenResponse.ok ||
      reden.success === false
    ) {
      const upstreamError =
        cleanString(reden.error);

      const upstreamDetails =
        typeof reden.details === "string"
          ? reden.details
          : undefined;

      console.error(
        "[REDEN ONBOARD] REDEN rejected request:",
        {
          status: redenResponse.status,
          statusText: redenResponse.statusText,
          error: upstreamError,
          details: upstreamDetails,
          developerEmail,
          clientEmail,
        }
      );

      const status =
        redenResponse.status >= 400 &&
        redenResponse.status < 600
          ? upstreamStatus(
              redenResponse.status
            )
          : 502;

      /*
       * Return the actual REDEN error while we finish
       * contract alignment. Never return the admin secret
       * or API key here.
       */
      return jsonError(
        "reden_onboard_failed",
        status,
        upstreamError ||
          upstreamDetails ||
          "REDEN rejected the onboarding request"
      );
    }

    /* =====================================================
       10. VALIDATE REDEN SITE ID

       Read from the nested `site` object -- see RedenResponse
       type comment above for why this is not a top-level field.
    ===================================================== */

    const siteId = cleanString(
      reden.site?.site_id
    );

    if (!isValidReturnedSiteId(siteId)) {
      console.error(
        "[REDEN ONBOARD] REDEN returned invalid siteId:",
        {
          siteId,
          rawSite: reden.site,
          developerEmail,
          clientEmail,
        }
      );

      return jsonError(
        "reden_returned_invalid_site_id",
        502
      );
    }

    /* =====================================================
       11. VALIDATE REDEN API KEY
    ===================================================== */

    const apiKey = cleanString(
      reden.site?.api_key
    );

    if (!isValidApiKey(apiKey)) {
      console.error(
        "[REDEN ONBOARD] REDEN returned invalid apiKey:",
        {
          siteId,
          owner_email: clientEmail,
          existing:
            reden.existing === true,
        }
      );

      return jsonError(
        "reden_returned_invalid_api_key",
        502
      );
    }

    /* =====================================================
       12. SUPABASE ADMIN CLIENT
    ===================================================== */

    let supabase;

    try {
      supabase = getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN ONBOARD] Supabase configuration error:",
        errorMessage(error)
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    /* =====================================================
       13. NORMALIZE REDEN METADATA

       All read from the nested `site` object, matching
       reden.js's actual /api/v1/onboard response shape.
    ===================================================== */

    const storeName =
      cleanString(reden.site?.name) || name;

    const plan =
      cleanString(reden.site?.plan) || "basic";

    const subscriptionStatus =
      cleanString(
        reden.site?.subscription_status
      ) || "active";

    const timestamp =
      cleanString(reden.site?.created_at) ||
      new Date().toISOString();

    /* =====================================================
       14. FIND EXACT CLIENT + SITE CONNECTION
    ===================================================== */

    const {
      data: existingConnection,
      error: existingError,
    } = await supabase
      .from("reden_connections")
      .select(CONNECTION_SELECT)
      .eq("user_email", clientEmail)
      .eq("site_id", siteId)
      .maybeSingle<ConnectionRow>();

    if (existingError) {
      console.error(
        "[REDEN ONBOARD] Existing connection lookup failed:",
        {
          message: existingError.message,
          code: existingError.code,
          siteId,
          clientEmail,
        }
      );

      return jsonError(
        "connection_lookup_failed",
        500
      );
    }

    /* =====================================================
       15. EXISTING CONNECTION
    ===================================================== */

    if (existingConnection) {
      const existingStatus =
        cleanString(
          existingConnection.status
        );

      if (
        cleanString(
          existingConnection.user_email
        ).toLowerCase() !== clientEmail ||
        existingConnection.site_id !== siteId
      ) {
        console.error(
          "[REDEN ONBOARD] Connection ownership mismatch:",
          {
            siteId,
            clientEmail,
          }
        );

        return jsonError(
          "connection_ownership_conflict",
          409
        );
      }

      const {
        data: updatedConnection,
        error: updateError,
      } = await supabase
        .from("reden_connections")
        .update({
          store_name: storeName,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          existingConnection.id
        )
        .eq(
          "user_email",
          clientEmail
        )
        .eq(
          "site_id",
          siteId
        )
        .select(CONNECTION_SELECT)
        .single<ConnectionRow>();

      if (
        updateError ||
        !updatedConnection
      ) {
        console.error(
          "[REDEN ONBOARD] Existing connection update failed:",
          {
            message:
              updateError?.message,
            code:
              updateError?.code,
            siteId,
            clientEmail,
          }
        );

        return jsonError(
          "connection_update_failed",
          500
        );
      }

      return jsonSuccess({
        ok: true,
        existing: true,
        siteId,
        apiKey,
        name:
          cleanString(
            updatedConnection.store_name
          ) || storeName,
        plan,
        subscriptionStatus,

        connection: {
          id: updatedConnection.id,
          siteId:
            updatedConnection.site_id,
          name:
            updatedConnection.store_name,
          status:
            cleanString(
              updatedConnection.status
            ) || existingStatus,
        },

        clientEmail,
        developerEmail,
        timestamp,
      });
    }

    /* =====================================================
       16. SITE OWNERSHIP CHECK
    ===================================================== */

    const {
      data: sameSiteRows,
      error: sameSiteError,
    } = await supabase
      .from("reden_connections")
      .select(
        "id, user_email, site_id, store_name, status"
      )
      .eq("site_id", siteId)
      .limit(100);

    if (sameSiteError) {
      console.error(
        "[REDEN ONBOARD] Site ownership check failed:",
        {
          message:
            sameSiteError.message,
          code:
            sameSiteError.code,
          siteId,
        }
      );

      return jsonError(
        "connection_ownership_check_failed",
        500
      );
    }

    const foreignConnection =
      sameSiteRows?.find(
        (row) =>
          cleanString(
            row.user_email
          ).toLowerCase() !== clientEmail
      );

    if (foreignConnection) {
      console.error(
        "[REDEN ONBOARD] Site ID ownership conflict:",
        {
          siteId,
          clientEmail,
        }
      );

      return jsonError(
        "reden_site_id_ownership_conflict",
        409
      );
    }

    /* =====================================================
       17. CREATE CONNECTION
    ===================================================== */

    const {
      data: newConnection,
      error: insertError,
    } = await supabase
      .from("reden_connections")
      .insert({
        user_email: clientEmail,
        developer_email: developerEmail,
        site_id: siteId,
        store_name: storeName,

        /*
         * Verification activates the connection.
         */
        status: "installing",
      })
      .select(CONNECTION_SELECT)
      .single<ConnectionRow>();

    if (
      insertError ||
      !newConnection
    ) {
      console.error(
        "[REDEN ONBOARD] New connection insert failed:",
        {
          message:
            insertError?.message,
          code:
            insertError?.code,
          siteId,
          clientEmail,
        }
      );

      /* ===================================================
         UNIQUE-CONSTRAINT RACE
      =================================================== */

      if (insertError?.code === "23505") {
        const {
          data: racedConnection,
          error: raceLookupError,
        } = await supabase
          .from("reden_connections")
          .select(CONNECTION_SELECT)
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
          !raceLookupError &&
          racedConnection
        ) {
          return jsonSuccess({
            ok: true,
            existing: true,
            siteId,
            apiKey,
            name:
              cleanString(
                racedConnection.store_name
              ) || storeName,
            plan,
            subscriptionStatus,

            connection: {
              id:
                racedConnection.id,
              siteId:
                racedConnection.site_id,
              name:
                racedConnection.store_name,
              status:
                racedConnection.status,
            },

            clientEmail,
            developerEmail,
            timestamp,
          });
        }
      }

      return jsonError(
        "connection_insert_failed",
        500
      );
    }

    /* =====================================================
       18. FINAL DATABASE INTEGRITY CHECK
    ===================================================== */

    if (
      newConnection.site_id !== siteId ||
      cleanString(
        newConnection.user_email
      ).toLowerCase() !== clientEmail
    ) {
      console.error(
        "[REDEN ONBOARD] Database returned unexpected connection:",
        {
          requestedSiteId:
            siteId,
          storedSiteId:
            newConnection.site_id,
          clientEmail,
          storedOwner:
            newConnection.user_email,
        }
      );

      return jsonError(
        "connection_integrity_error",
        500
      );
    }

    /* =====================================================
       19. SUCCESS
    ===================================================== */

    return jsonSuccess({
      ok: true,

      existing:
        reden.existing === true,

      siteId:
        newConnection.site_id,

      apiKey,

      name:
        cleanString(
          newConnection.store_name
        ) || storeName,

      plan,
      subscriptionStatus,

      /*
       * REDEN storefront owner.
       */
      clientEmail,

      /*
       * Authenticated PRETHIM integration operator.
       */
      developerEmail,

      connection: {
        id: newConnection.id,
        siteId:
          newConnection.site_id,
        name:
          newConnection.store_name,
        status:
          newConnection.status,
      },

      timestamp,
    });
  } catch (error) {
    console.error(
      "[REDEN ONBOARD ROUTE]",
      errorMessage(error)
    );

    return jsonError(
      "internal_error",
      500
    );
  }
}
};

type RedenResponse = {
  ok?: boolean;
  existing?: boolean;
  siteId?: unknown;
  apiKey?: unknown;
  name?: unknown;
  plan?: unknown;
  subscriptionStatus?: unknown;
  error?: unknown;
  details?: unknown;
  timestamp?: unknown;
};

type ConnectionRow = {
  id: string;
  user_email: string;
  developer_email: string | null;
  site_id: string;
  store_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string): boolean {
  if (!value || value.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasControlCharacters(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function jsonError(
  error: string,
  status: number,
  details?: unknown
) {
  const body: Record<string, unknown> = {
    ok: false,
    error,
  };

  /*
   * Details are intentionally returned only when explicitly
   * supplied by this route. This makes upstream integration
   * failures diagnosable without exposing secrets.
   */
  if (details !== undefined) {
    body.details = details;
  }

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function jsonSuccess(body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function isValidReturnedSiteId(value: unknown): value is string {
  const siteId = cleanString(value);

  if (!siteId || siteId.length > SITE_ID_MAX_LENGTH) {
    return false;
  }

  if (!siteId.startsWith("site_")) {
    return false;
  }

  return isValidSiteId(siteId);
}

function isValidApiKey(value: unknown): value is string {
  const apiKey = cleanString(value);

  if (!apiKey || apiKey.length > API_KEY_MAX_LENGTH) {
    return false;
  }

  if (hasControlCharacters(apiKey)) {
    return false;
  }

  return true;
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");

  /*
   * Legitimate same-origin requests can omit Origin.
   */
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

async function readJsonBody(
  req: Request
): Promise<
  | { ok: true; body: RequestBody }
  | { ok: false; error: string }
> {
  const contentType = req.headers.get("content-type");

  if (
    contentType &&
    !contentType.toLowerCase().startsWith("application/json")
  ) {
    return {
      ok: false,
      error: "invalid_content_type",
    };
  }

  const contentLength = req.headers.get("content-length");

  if (contentLength) {
    const parsedLength = Number(contentLength);

    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      return {
        ok: false,
        error: "invalid_content_length",
      };
    }

    if (parsedLength > MAX_BODY_BYTES) {
      return {
        ok: false,
        error: "request_too_large",
      };
    }
  }

  let rawBody: string;

  try {
    rawBody = await req.text();
  } catch {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  const bodyBytes = new TextEncoder().encode(rawBody).byteLength;

  if (bodyBytes > MAX_BODY_BYTES) {
    return {
      ok: false,
      error: "request_too_large",
    };
  }

  if (!rawBody.trim()) {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return {
      ok: false,
      error: "invalid_request_body",
    };
  }

  return {
    ok: true,
    body: parsed as RequestBody,
  };
}

/* =========================================================
   POST /api/reden/onboard
========================================================= */

export async function POST(req: Request) {
  try {
    /* =====================================================
       1. AUTHENTICATE PRETHIM USER
    ===================================================== */

    const session = await getServerSession(authOptions);

    const developerEmail = cleanString(
      session?.user?.email
    ).toLowerCase();

    if (!developerEmail) {
      return jsonError("unauthorized", 401);
    }

    /* =====================================================
       2. SAME-ORIGIN PROTECTION
    ===================================================== */

    if (!isSameOrigin(req)) {
      return jsonError("forbidden_origin", 403);
    }

    /* =====================================================
       3. READ + VALIDATE BODY
    ===================================================== */

    const bodyResult = await readJsonBody(req);

    if (!bodyResult.ok) {
      return jsonError(
        bodyResult.error,
        bodyResult.error === "request_too_large"
          ? 413
          : 400
      );
    }

    const body = bodyResult.body;

    const name = cleanString(body.name);

    const clientEmail = cleanString(
      body.clientEmail
    ).toLowerCase();

    /* =====================================================
       4. VALIDATE STOREFRONT NAME
    ===================================================== */

    if (!name) {
      return jsonError(
        "storefront_name_required",
        400
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return jsonError(
        "storefront_name_too_long",
        400
      );
    }

    if (hasControlCharacters(name)) {
      return jsonError(
        "invalid_storefront_name",
        400
      );
    }

    /* =====================================================
       5. VALIDATE CLIENT EMAIL
    ===================================================== */

    if (!clientEmail) {
      return jsonError(
        "client_email_required",
        400
      );
    }

    if (!isValidEmail(clientEmail)) {
      return jsonError(
        "invalid_client_email",
        400
      );
    }

    /* =====================================================
       6. SERVER CONFIGURATION
    ===================================================== */

    const adminSecret = cleanString(
      getRedenAdminSecret()
    );

    if (!adminSecret) {
      console.error(
        "[REDEN ONBOARD] REDEN admin secret is not configured"
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    const redenBaseUrl = cleanString(
      REDEN_API_URL
    ).replace(/\/+$/, "");

    if (!redenBaseUrl) {
      console.error(
        "[REDEN ONBOARD] REDEN API URL is not configured"
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    const redenOnboardUrl =
      `${redenBaseUrl}/api/v1/onboard`;

    /* =====================================================
       7. CALL REDEN

       REDEN is authoritative.

       PRETHIM authenticated user:
         developerEmail

       REDEN storefront owner:
         clientEmail

       REDEN generates:
         site_id
         api_key

       IMPORTANT:
       client_email is sent to REDEN because that is the
       current REDEN onboarding contract.
    ===================================================== */

    let redenResponse: Response;

    try {
      redenResponse = await fetchWithTimeout(
        redenOnboardUrl,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-admin-secret": adminSecret,
          },

          body: JSON.stringify({
            name,
            owner_email: clientEmail,
          }),

          cache: "no-store",
        },
        REDEN_ONBOARD_TIMEOUT_MS
      );
    } catch (error) {
      const message = errorMessage(error);

      console.error(
        "[REDEN ONBOARD] Upstream request failed:",
        {
          message,
          url: redenOnboardUrl,
          developerEmail,
          clientEmail,
        }
      );

      const errorName =
        error instanceof Error
          ? error.name
          : "";

      const lowerMessage =
        message.toLowerCase();

      if (
        errorName === "AbortError" ||
        lowerMessage.includes("timeout") ||
        lowerMessage.includes("aborted")
      ) {
        return jsonError(
          "reden_onboard_timeout",
          504
        );
      }

      return jsonError(
        "reden_onboard_unavailable",
        502
      );
    }

    /* =====================================================
       8. READ REDEN RESPONSE BODY ONCE
    ===================================================== */

    let reden: RedenResponse;

    try {
      reden =
        await parseJsonResponse<RedenResponse>(
          redenResponse
        );
    } catch (error) {
      console.error(
        "[REDEN ONBOARD] REDEN returned invalid JSON:",
        {
          status: redenResponse.status,
          statusText: redenResponse.statusText,
          error: errorMessage(error),
        }
      );

      return jsonError(
        "reden_returned_invalid_json",
        502
      );
    }

    /* =====================================================
       9. HANDLE REDEN FAILURE
    ===================================================== */

    if (
      !redenResponse.ok ||
      reden.ok === false
    ) {
      const upstreamError =
        cleanString(reden.error);

      const upstreamDetails =
        typeof reden.details === "string"
          ? reden.details
          : undefined;

      console.error(
        "[REDEN ONBOARD] REDEN rejected request:",
        {
          status: redenResponse.status,
          statusText: redenResponse.statusText,
          error: upstreamError,
          details: upstreamDetails,
          developerEmail,
          clientEmail,
        }
      );

      const status =
        redenResponse.status >= 400 &&
        redenResponse.status < 600
          ? upstreamStatus(
              redenResponse.status
            )
          : 502;

      /*
       * Return the actual REDEN error while we finish
       * contract alignment. Never return the admin secret
       * or API key here.
       */
      return jsonError(
        "reden_onboard_failed",
        status,
        upstreamError ||
          upstreamDetails ||
          "REDEN rejected the onboarding request"
      );
    }

    /* =====================================================
       10. VALIDATE REDEN SITE ID
    ===================================================== */

    const siteId = cleanString(
      reden.siteId
    );

    if (!isValidReturnedSiteId(siteId)) {
      console.error(
        "[REDEN ONBOARD] REDEN returned invalid siteId:",
        {
          siteId,
          developerEmail,
          clientEmail,
        }
      );

      return jsonError(
        "reden_returned_invalid_site_id",
        502
      );
    }

    /* =====================================================
       11. VALIDATE REDEN API KEY
    ===================================================== */

    const apiKey = cleanString(
      reden.apiKey
    );

    if (!isValidApiKey(apiKey)) {
      console.error(
        "[REDEN ONBOARD] REDEN returned invalid apiKey:",
        {
          siteId,
          owner_email: clientEmail,
          existing:
            reden.existing === true,
        }
      );

      return jsonError(
        "reden_returned_invalid_api_key",
        502
      );
    }

    /* =====================================================
       12. SUPABASE ADMIN CLIENT
    ===================================================== */

    let supabase;

    try {
      supabase = getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN ONBOARD] Supabase configuration error:",
        errorMessage(error)
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    /* =====================================================
       13. NORMALIZE REDEN METADATA
    ===================================================== */

    const storeName =
      cleanString(reden.name) || name;

    const plan =
      cleanString(reden.plan) || "basic";

    const subscriptionStatus =
      cleanString(
        reden.subscriptionStatus
      ) || "active";

    const timestamp =
      cleanString(reden.timestamp) ||
      new Date().toISOString();

    /* =====================================================
       14. FIND EXACT CLIENT + SITE CONNECTION
    ===================================================== */

    const {
      data: existingConnection,
      error: existingError,
    } = await supabase
      .from("reden_connections")
      .select(CONNECTION_SELECT)
      .eq("user_email", clientEmail)
      .eq("site_id", siteId)
      .maybeSingle<ConnectionRow>();

    if (existingError) {
      console.error(
        "[REDEN ONBOARD] Existing connection lookup failed:",
        {
          message: existingError.message,
          code: existingError.code,
          siteId,
          clientEmail,
        }
      );

      return jsonError(
        "connection_lookup_failed",
        500
      );
    }

    /* =====================================================
       15. EXISTING CONNECTION
    ===================================================== */

    if (existingConnection) {
      const existingStatus =
        cleanString(
          existingConnection.status
        );

      if (
        cleanString(
          existingConnection.user_email
        ).toLowerCase() !== clientEmail ||
        existingConnection.site_id !== siteId
      ) {
        console.error(
          "[REDEN ONBOARD] Connection ownership mismatch:",
          {
            siteId,
            clientEmail,
          }
        );

        return jsonError(
          "connection_ownership_conflict",
          409
        );
      }

      const {
        data: updatedConnection,
        error: updateError,
      } = await supabase
        .from("reden_connections")
        .update({
          store_name: storeName,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          existingConnection.id
        )
        .eq(
          "user_email",
          clientEmail
        )
        .eq(
          "site_id",
          siteId
        )
        .select(CONNECTION_SELECT)
        .single<ConnectionRow>();

      if (
        updateError ||
        !updatedConnection
      ) {
        console.error(
          "[REDEN ONBOARD] Existing connection update failed:",
          {
            message:
              updateError?.message,
            code:
              updateError?.code,
            siteId,
            clientEmail,
          }
        );

        return jsonError(
          "connection_update_failed",
          500
        );
      }

      return jsonSuccess({
        ok: true,
        existing: true,
        siteId,
        apiKey,
        name:
          cleanString(
            updatedConnection.store_name
          ) || storeName,
        plan,
        subscriptionStatus,

        connection: {
          id: updatedConnection.id,
          siteId:
            updatedConnection.site_id,
          name:
            updatedConnection.store_name,
          status:
            cleanString(
              updatedConnection.status
            ) || existingStatus,
        },

        clientEmail,
        developerEmail,
        timestamp,
      });
    }

    /* =====================================================
       16. SITE OWNERSHIP CHECK
    ===================================================== */

    const {
      data: sameSiteRows,
      error: sameSiteError,
    } = await supabase
      .from("reden_connections")
      .select(
        "id, user_email, site_id, store_name, status"
      )
      .eq("site_id", siteId)
      .limit(100);

    if (sameSiteError) {
      console.error(
        "[REDEN ONBOARD] Site ownership check failed:",
        {
          message:
            sameSiteError.message,
          code:
            sameSiteError.code,
          siteId,
        }
      );

      return jsonError(
        "connection_ownership_check_failed",
        500
      );
    }

    const foreignConnection =
      sameSiteRows?.find(
        (row) =>
          cleanString(
            row.user_email
          ).toLowerCase() !== clientEmail
      );

    if (foreignConnection) {
      console.error(
        "[REDEN ONBOARD] Site ID ownership conflict:",
        {
          siteId,
          clientEmail,
        }
      );

      return jsonError(
        "reden_site_id_ownership_conflict",
        409
      );
    }

    /* =====================================================
       17. CREATE CONNECTION
    ===================================================== */

    const {
      data: newConnection,
      error: insertError,
    } = await supabase
      .from("reden_connections")
      .insert({
        user_email: clientEmail,
        developer_email: developerEmail,
        site_id: siteId,
        store_name: storeName,

        /*
         * Verification activates the connection.
         */
        status: "installing",
      })
      .select(CONNECTION_SELECT)
      .single<ConnectionRow>();

    if (
      insertError ||
      !newConnection
    ) {
      console.error(
        "[REDEN ONBOARD] New connection insert failed:",
        {
          message:
            insertError?.message,
          code:
            insertError?.code,
          siteId,
          clientEmail,
        }
      );

      /* ===================================================
         UNIQUE-CONSTRAINT RACE
      =================================================== */

      if (insertError?.code === "23505") {
        const {
          data: racedConnection,
          error: raceLookupError,
        } = await supabase
          .from("reden_connections")
          .select(CONNECTION_SELECT)
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
          !raceLookupError &&
          racedConnection
        ) {
          return jsonSuccess({
            ok: true,
            existing: true,
            siteId,
            apiKey,
            name:
              cleanString(
                racedConnection.store_name
              ) || storeName,
            plan,
            subscriptionStatus,

            connection: {
              id:
                racedConnection.id,
              siteId:
                racedConnection.site_id,
              name:
                racedConnection.store_name,
              status:
                racedConnection.status,
            },

            clientEmail,
            developerEmail,
            timestamp,
          });
        }
      }

      return jsonError(
        "connection_insert_failed",
        500
      );
    }

    /* =====================================================
       18. FINAL DATABASE INTEGRITY CHECK
    ===================================================== */

    if (
      newConnection.site_id !== siteId ||
      cleanString(
        newConnection.user_email
      ).toLowerCase() !== clientEmail
    ) {
      console.error(
        "[REDEN ONBOARD] Database returned unexpected connection:",
        {
          requestedSiteId:
            siteId,
          storedSiteId:
            newConnection.site_id,
          clientEmail,
          storedOwner:
            newConnection.user_email,
        }
      );

      return jsonError(
        "connection_integrity_error",
        500
      );
    }

    /* =====================================================
       19. SUCCESS
    ===================================================== */

    return jsonSuccess({
      ok: true,

      existing:
        reden.existing === true,

      siteId:
        newConnection.site_id,

      apiKey,

      name:
        cleanString(
          newConnection.store_name
        ) || storeName,

      plan,
      subscriptionStatus,

      /*
       * REDEN storefront owner.
       */
      clientEmail,

      /*
       * Authenticated PRETHIM integration operator.
       */
      developerEmail,

      connection: {
        id: newConnection.id,
        siteId:
          newConnection.site_id,
        name:
          newConnection.store_name,
        status:
          newConnection.status,
      },

      timestamp,
    });
  } catch (error) {
    console.error(
      "[REDEN ONBOARD ROUTE]",
      errorMessage(error)
    );

    return jsonError(
      "internal_error",
      500
    );
  }
}
