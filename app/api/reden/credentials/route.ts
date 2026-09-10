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

const REDEN_ONBOARD_TIMEOUT_MS = 30_000;
const SITE_ID_MAX_LENGTH = 200;

/*
 * REDEN's /api/v1/onboard is idempotent on (owner_email, name):
 * calling it again for a connection that already exists returns
 * `existing: true` and the SAME site_id / api_key instead of
 * creating a new site. That's what makes this route possible --
 * PRETHIM never stores api_key itself (see reden_connections
 * schema, which has no api_key column by design), so recovering
 * it means asking REDEN for it again the same way it was first
 * obtained.
 */
type RedenResponse = {
  success?: boolean;
  existing?: boolean;
  site?: {
    site_id?: unknown;
    api_key?: unknown;
    name?: unknown;
    plan?: unknown;
    subscription_status?: unknown;
  };
  error?: unknown;
  details?: unknown;
};

type ConnectionRow = {
  id: string;
  user_email: string;
  developer_email: string | null;
  store_name: string | null;
  site_id: string | null;
  status: string | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function jsonError(
  error: string,
  status: number,
  details?: unknown
) {
  const body: Record<string, unknown> = {
    ok: false,
    error,
  };

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

/* =========================================================
   GET /api/reden/credentials?siteId=site_xxx
========================================================= */

export async function GET(req: Request) {
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
       2. READ + VALIDATE siteId
    ===================================================== */

    const { searchParams } = new URL(req.url);

    const siteId = cleanString(searchParams.get("siteId"));

    if (!isValidReturnedSiteId(siteId)) {
      return jsonError("valid_site_id_required", 400);
    }

    /* =====================================================
       3. SUPABASE ADMIN CLIENT
    ===================================================== */

    let supabase;

    try {
      supabase = getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN CREDENTIALS] Supabase configuration error:",
        errorMessage(error)
      );

      return jsonError("server_configuration_error", 500);
    }

    /* =====================================================
       4. OWNERSHIP CHECK

       Only the developer who owns this connection can pull
       its credentials back. Matches the ownership model
       already used by /api/reden/stores (filter by
       developer_email).
    ===================================================== */

    const { data: connection, error: lookupError } =
      await supabase
        .from("reden_connections")
        .select(
          "id, user_email, developer_email, store_name, site_id, status"
        )
        .eq("site_id", siteId)
        .eq("developer_email", developerEmail)
        .maybeSingle<ConnectionRow>();

    if (lookupError) {
      console.error(
        "[REDEN CREDENTIALS] Connection lookup failed:",
        {
          message: lookupError.message,
          code: lookupError.code,
          siteId,
          developerEmail,
        }
      );

      return jsonError("connection_lookup_failed", 500);
    }

    if (!connection) {
      return jsonError("connection_not_found", 404);
    }

    const clientEmail = cleanString(
      connection.user_email
    ).toLowerCase();

    const storeName = cleanString(connection.store_name);

    if (!clientEmail || !storeName) {
      console.error(
        "[REDEN CREDENTIALS] Connection missing required fields:",
        { siteId, connection }
      );

      return jsonError("connection_incomplete", 500);
    }

    /* =====================================================
       5. SERVER CONFIGURATION
    ===================================================== */

    const adminSecret = cleanString(getRedenAdminSecret());

    if (!adminSecret) {
      console.error(
        "[REDEN CREDENTIALS] REDEN admin secret is not configured"
      );

      return jsonError("server_configuration_error", 500);
    }

    const redenBaseUrl = cleanString(REDEN_API_URL).replace(
      /\/+$/,
      ""
    );

    if (!redenBaseUrl) {
      console.error(
        "[REDEN CREDENTIALS] REDEN API URL is not configured"
      );

      return jsonError("server_configuration_error", 500);
    }

    const redenOnboardUrl = `${redenBaseUrl}/api/v1/onboard`;

    /* =====================================================
       6. RE-CALL REDEN ONBOARD (idempotent existing lookup)

       Same name + owner_email as the original creation call.
       REDEN matches on (LOWER(owner_email), LOWER(name)) and
       returns the SAME site_id / api_key rather than minting
       a new site.
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
            name: storeName,
            owner_email: clientEmail,
          }),

          cache: "no-store",
        },
        REDEN_ONBOARD_TIMEOUT_MS
      );
    } catch (error) {
      const message = errorMessage(error);

      console.error(
        "[REDEN CREDENTIALS] Upstream request failed:",
        { message, url: redenOnboardUrl, siteId, developerEmail }
      );

      const errorName =
        error instanceof Error ? error.name : "";

      const lowerMessage = message.toLowerCase();

      if (
        errorName === "AbortError" ||
        lowerMessage.includes("timeout") ||
        lowerMessage.includes("aborted")
      ) {
        return jsonError("reden_credentials_timeout", 504);
      }

      return jsonError("reden_credentials_unavailable", 502);
    }

    /* =====================================================
       7. READ REDEN RESPONSE BODY ONCE
    ===================================================== */

    let reden: RedenResponse;

    try {
      reden = await parseJsonResponse<RedenResponse>(
        redenResponse
      );
    } catch (error) {
      console.error(
        "[REDEN CREDENTIALS] REDEN returned invalid JSON:",
        {
          status: redenResponse.status,
          error: errorMessage(error),
        }
      );

      return jsonError("reden_returned_invalid_json", 502);
    }

    /* =====================================================
       8. HANDLE REDEN FAILURE
    ===================================================== */

    if (!redenResponse.ok || reden.success === false) {
      const upstreamError = cleanString(reden.error);

      console.error(
        "[REDEN CREDENTIALS] REDEN rejected request:", {
          status: redenResponse.status,
          error: upstreamError,
          siteId,
          developerEmail,
        }
      );

      const status =
        redenResponse.status >= 400 &&
        redenResponse.status < 600
          ? upstreamStatus(redenResponse.status)
          : 502;

      return jsonError(
        "reden_credentials_failed",
        status,
        upstreamError || "REDEN rejected the credentials request"
      );
    }

    /* =====================================================
       9. VALIDATE RETURNED SITE MATCHES REQUESTED SITE

       Defends against a name/email edit between creation and
       recovery causing REDEN to mint or return a DIFFERENT
       site than the one this route was asked for.
    ===================================================== */

    const returnedSiteId = cleanString(reden.site?.site_id);

    if (returnedSiteId !== siteId) {
      console.error(
        "[REDEN CREDENTIALS] REDEN returned a different siteId:",
        { requestedSiteId: siteId, returnedSiteId, developerEmail }
      );

      return jsonError("reden_site_id_mismatch", 502);
    }

    const apiKey = cleanString(reden.site?.api_key);

    if (!apiKey) {
      console.error(
        "[REDEN CREDENTIALS] REDEN returned invalid apiKey:",
        { siteId, developerEmail }
      );

      return jsonError("reden_returned_invalid_api_key", 502);
    }

    /* =====================================================
       10. SUCCESS

       apiKey is returned ONLY to the authenticated owning
       developer, over HTTPS, and is never written back to
       Supabase.
    ===================================================== */

    return jsonSuccess({
      ok: true,
      siteId,
      apiKey,
      name: storeName,
      plan: cleanString(reden.site?.plan) || "basic",
      subscriptionStatus:
        cleanString(reden.site?.subscription_status) ||
        "active",
      status: connection.status ?? "installing",
    });
  } catch (error) {
    console.error(
      "[REDEN CREDENTIALS ROUTE]",
      errorMessage(error)
    );

    return jsonError("internal_error", 500);
  }
}
