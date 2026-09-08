import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getActiveConnection } from "@/lib/reden/connection";
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

const MAX_QUESTION_LENGTH = 2_000;

/* =========================================================
   TYPES
========================================================= */

type RequestBody = {
  question?: unknown;
  siteId?: unknown;
};

type IntelligenceResponse = {
  ok?: boolean;
  answer?: string;
  evidence?: unknown;
  site?: unknown;
  error?: string;
  details?: unknown;
};

type InstallationData = {
  installation?: {
    site_id?: string;
    store_name?: string | null;
    name?: string | null;
    status?: string;
    active?: boolean;
    plan?: string;
    subscription_status?: string;
  };
};

/* =========================================================
   HELPERS
========================================================= */

function jsonError(
  error: string,
  status: number,
  details: unknown = null
) {
  return NextResponse.json(
    {
      ok: false,
      error,
      details,
    },
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

function normalizeQuestion(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isAbortError(
  error: unknown
): boolean {
  return (
    error instanceof Error &&
    (
      error.name === "AbortError" ||
      error.name === "TimeoutError"
    )
  );
}

/* =========================================================
   AUTHORITATIVE SITE RESOLUTION
========================================================= */

/*
 * IMPORTANT:
 *
 * REDEN site IDs are tenant identifiers.
 *
 * We NEVER trust a browser-supplied siteId as proof of
 * ownership.
 *
 * The authenticated PRETHIM account's active connection
 * remains the authoritative source.
 *
 * If the browser sends a siteId, it must match the
 * authenticated account's active connection.
 */

async function resolveSite(
  requestedSiteId: string,
  ownerEmail: string
): Promise<
  | {
      ok: true;
      siteId: string;
      installationData: InstallationData;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  /* =======================================================
     1. LOOK UP AUTHORITATIVE CONNECTION
  ======================================================= */

  const result =
    await getActiveConnection(ownerEmail);

  if (!result.ok) {
    const status =
      result.reason === "not_found"
        ? 404
        : result.reason === "invalid"
        ? 502
        : result.reason === "config_error"
        ? 500
        : 500;

    const error =
      result.reason === "not_found"
        ? "reden_installation_not_found"
        : result.reason === "invalid"
        ? "invalid_installation_response"
        : result.reason === "config_error"
        ? "server_configuration_error"
        : "reden_installation_lookup_failed";

    console.error(
      "[REDEN INTELLIGENCE] Active connection lookup failed:",
      {
        ownerEmail,
        reason: result.reason,
      }
    );

    return {
      ok: false,
      response: jsonError(error, status),
    };
  }

  const connection =
    result.connection;

  const activeSiteId =
    connection.siteId?.trim() || "";

  if (
    !activeSiteId ||
    !isValidSiteId(activeSiteId)
  ) {
    console.error(
      "[REDEN INTELLIGENCE] Invalid active site ID:",
      {
        ownerEmail,
        siteId: activeSiteId,
      }
    );

    return {
      ok: false,
      response: jsonError(
        "invalid_active_site_id",
        500
      ),
    };
  }

  /* =======================================================
     2. CHECK BROWSER-SUPPLIED SITE ID
  ======================================================= */

  if (
    requestedSiteId &&
    requestedSiteId !== activeSiteId
  ) {
    console.error(
      "[REDEN INTELLIGENCE] Site ID mismatch:",
      {
        ownerEmail,
        requestedSiteId,
        activeSiteId,
      }
    );

    return {
      ok: false,
      response: jsonError(
        "site_id_mismatch",
        409,
        {
          requestedSiteId,
          activeSiteId,
        }
      ),
    };
  }

  /* =======================================================
     3. RETURN SERVER-AUTHORITATIVE SITE
  ======================================================= */

  return {
    ok: true,

    siteId: activeSiteId,

    installationData: {
      installation: {
        site_id: activeSiteId,
        store_name:
          connection.name,
        name:
          connection.name,
        status:
          connection.status,
        active:
          connection.status === "active",
      },
    },
  };
}

/* =========================================================
   POST /api/reden/intelligence
========================================================= */

export async function POST(
  req: Request
) {
  try {
    /* =====================================================
       1. AUTHENTICATE USER
    ===================================================== */

    const session =
      await getServerSession(
        authOptions
      );

    const ownerEmail =
      session?.user?.email
        ?.trim()
        .toLowerCase();

    if (!ownerEmail) {
      return jsonError(
        "unauthorized",
        401
      );
    }

    /* =====================================================
       2. VERIFY SERVER CONFIGURATION
    ===================================================== */

    const adminSecret =
      getRedenAdminSecret();

    if (!adminSecret) {
      console.error(
        "[REDEN INTELLIGENCE] REDEN admin secret is not configured"
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    /* =====================================================
       3. READ REQUEST BODY
    ===================================================== */

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonError(
        "invalid_request_body",
        400
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError(
        "invalid_request_body",
        400
      );
    }

    const payload =
      body as RequestBody;

    /* =====================================================
       4. VALIDATE QUESTION
    ===================================================== */

    const question =
      normalizeQuestion(
        payload.question
      );

    if (!question) {
      return jsonError(
        "question_required",
        400
      );
    }

    if (
      question.length >
      MAX_QUESTION_LENGTH
    ) {
      return jsonError(
        "question_too_long",
        400
      );
    }

    /* =====================================================
       5. VALIDATE OPTIONAL SITE ID
    ===================================================== */

    const requestedSiteId =
      typeof payload.siteId === "string"
        ? payload.siteId.trim()
        : "";

    if (
      requestedSiteId &&
      !isValidSiteId(
        requestedSiteId
      )
    ) {
      return jsonError(
        "invalid_site_id",
        400
      );
    }

    /* =====================================================
       6. RESOLVE AUTHORITATIVE SITE
    ===================================================== */

    const resolution =
      await resolveSite(
        requestedSiteId,
        ownerEmail
      );

    if (!resolution.ok) {
      return resolution.response;
    }

    const {
      siteId,
      installationData,
    } = resolution;

    if (
      !siteId ||
      !isValidSiteId(siteId)
    ) {
      return jsonError(
        "reden_installation_not_found",
        404
      );
    }

    /* =====================================================
       7. ASK REDEN INTELLIGENCE
    ===================================================== */

    let intelligenceResponse:
      Response;

    try {
      intelligenceResponse =
        await fetchWithTimeout(
          `${REDEN_API_URL}/api/v1/intelligence`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
              "x-admin-secret":
                adminSecret,
            },

            body: JSON.stringify({
              siteId,
              question,
            }),

            cache: "no-store",
          }
        );
    } catch (error) {
      if (
        isAbortError(error)
      ) {
        console.error(
          "[REDEN INTELLIGENCE] Upstream request timeout:",
          {
            ownerEmail,
            siteId,
          }
        );

        return jsonError(
          "reden_intelligence_timeout",
          504
        );
      }

      console.error(
        "[REDEN INTELLIGENCE] Network error:",
        {
          ownerEmail,
          siteId,
          error:
            errorMessage(error),
        }
      );

      return jsonError(
        "reden_intelligence_unavailable",
        502
      );
    }

    /* =====================================================
       8. PARSE REDEN RESPONSE
    ===================================================== */

    let intelligenceData:
      IntelligenceResponse;

    try {
      intelligenceData =
        await parseJsonResponse<
          IntelligenceResponse
        >(intelligenceResponse);
    } catch {
      console.error(
        "[REDEN INTELLIGENCE] Invalid REDEN JSON:",
        {
          ownerEmail,
          siteId,
          status:
            intelligenceResponse.status,
        }
      );

      return jsonError(
        "reden_returned_invalid_json",
        502
      );
    }

    /* =====================================================
       9. VALIDATE UPSTREAM RESPONSE
    ===================================================== */

    if (
      !intelligenceResponse.ok ||
      intelligenceData.ok !== true
    ) {
      console.error(
        "[REDEN INTELLIGENCE] Upstream failure:",
        {
          ownerEmail,
          siteId,
          status:
            intelligenceResponse.status,
          error:
            intelligenceData.error,
          details:
            intelligenceData.details,
        }
      );

      return jsonError(
        intelligenceData.error ||
          "reden_intelligence_failed",
        upstreamStatus(
          intelligenceResponse.status
        ),
        intelligenceData.details ??
          null
      );
    }

    /* =====================================================
       10. GUARANTEE VALID ANSWER
    ===================================================== */

    const answer =
      typeof intelligenceData.answer ===
      "string"
        ? intelligenceData.answer.trim()
        : "";

    if (!answer) {
      console.error(
        "[REDEN INTELLIGENCE] REDEN returned no answer:",
        {
          ownerEmail,
          siteId,
        }
      );

      return jsonError(
        "reden_returned_no_answer",
        502
      );
    }

    /* =====================================================
       11. RETURN CLEAN RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        ok: true,

        answer,

        evidence:
          intelligenceData.evidence ??
          null,

        site:
          intelligenceData.site ??
          installationData.installation ??
          {
            site_id: siteId,
          },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "[REDEN INTELLIGENCE ROUTE]",
      {
        message:
          error instanceof Error
            ? error.message
            : String(error),

        stack:
          error instanceof Error
            ? error.stack
            : undefined,
      }
    );

    return jsonError(
      "internal_error",
      500
    );
  }
}