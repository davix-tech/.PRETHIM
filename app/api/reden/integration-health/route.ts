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

const HEALTH_QUESTION = "give me an overview";

type EvidenceEvent = {
  event: string;
  count: number;
};

type IntelligenceEvidence = {
  events?: EvidenceEvent[];
};

type IntelligenceResponse = {
  ok?: boolean;
  evidence?: IntelligenceEvidence;
  error?: string;
};

function eventReceived(
  events: EvidenceEvent[] | undefined,
  name: string
): boolean {
  return (
    events?.some(
      (item) =>
        item.event === name &&
        Number(item.count) > 0
    ) ?? false
  );
}

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

/* =========================================================
   GET /api/reden/integration-health
========================================================= */

export async function GET(req: Request) {
  try {
    /* =====================================================
       1. AUTHENTICATE
    ===================================================== */

    const session =
      await getServerSession(authOptions);

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
        "[REDEN INTEGRATION HEALTH] REDEN admin secret is not configured"
      );

      return jsonError(
        "server_configuration_error",
        500
      );
    }

    /* =====================================================
       3. OPTIONAL REQUESTED SITE ID
    ===================================================== */

    const url =
      new URL(req.url);

    const requestedSiteId =
      url.searchParams
        .get("siteId")
        ?.trim() || "";

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
       4. GET AUTHORITATIVE CONNECTION
    ===================================================== */

    const result =
      await getActiveConnection(
        ownerEmail
      );

    if (!result.ok) {
      const status =
        result.reason === "not_found"
          ? 404
          : result.reason ===
            "config_error"
          ? 500
          : 500;

      const error =
        result.reason === "not_found"
          ? "reden_installation_not_found"
          : result.reason ===
            "config_error"
          ? "server_configuration_error"
          : "reden_installation_lookup_failed";

      console.error(
        "[REDEN INTEGRATION HEALTH] Active connection lookup failed:",
        {
          ownerEmail,
          reason: result.reason,
        }
      );

      return jsonError(
        error,
        status
      );
    }

    /* =====================================================
       5. VALIDATE AUTHORITATIVE SITE ID
    ===================================================== */

    const siteId =
      result.connection.siteId
        ?.trim() || "";

    if (
      !siteId ||
      !isValidSiteId(siteId)
    ) {
      console.error(
        "[REDEN INTEGRATION HEALTH] Invalid active site ID:",
        {
          ownerEmail,
          siteId,
        }
      );

      return jsonError(
        "invalid_active_site_id",
        500
      );
    }

    /* =====================================================
       6. PREVENT CROSS-TENANT ACCESS
    ===================================================== */

    if (
      requestedSiteId &&
      requestedSiteId !== siteId
    ) {
      console.error(
        "[REDEN INTEGRATION HEALTH] Site ID mismatch:",
        {
          ownerEmail,
          requestedSiteId,
          activeSiteId: siteId,
        }
      );

      return jsonError(
        "site_id_mismatch",
        409,
        {
          requestedSiteId,
          activeSiteId: siteId,
        }
      );
    }

    /* =====================================================
       7. ASK EXISTING REDEN INTELLIGENCE ENDPOINT
    ===================================================== */

    let response: Response;

    try {
      response =
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
              question:
                HEALTH_QUESTION,
            }),

            cache: "no-store",
          }
        );
    } catch (error) {
      if (
        error instanceof Error &&
        (
          error.name ===
            "AbortError" ||
          error.name ===
            "TimeoutError"
        )
      ) {
        console.error(
          "[REDEN INTEGRATION HEALTH] Upstream timeout:",
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
        "[REDEN INTEGRATION HEALTH] Network error:",
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
       8. PARSE RESPONSE
    ===================================================== */

    let data:
      IntelligenceResponse;

    try {
      data =
        await parseJsonResponse<IntelligenceResponse>(
          response
        );
    } catch {
      console.error(
        "[REDEN INTEGRATION HEALTH] Invalid JSON response:",
        {
          ownerEmail,
          siteId,
          status:
            response.status,
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
      !response.ok ||
      data.ok !== true
    ) {
      console.error(
        "[REDEN INTEGRATION HEALTH] Upstream failure:",
        {
          ownerEmail,
          siteId,
          status:
            response.status,
          error: data.error,
        }
      );

      return jsonError(
        data.error ||
          "reden_intelligence_failed",
        upstreamStatus(
          response.status
        )
      );
    }

    /* =====================================================
       10. DETERMINE EVENT HEALTH
    ===================================================== */

    const events =
      data.evidence?.events;

    const pageView =
      eventReceived(
        events,
        "PAGE_VIEW"
      );

    const productView =
      eventReceived(
        events,
        "PRODUCT_VIEW"
      );

    const addToCart =
      eventReceived(
        events,
        "ADD_TO_CART"
      );

    const checkoutStarted =
      eventReceived(
        events,
        "CHECKOUT_STARTED"
      );

    const purchase =
      eventReceived(
        events,
        "PURCHASE"
      );

    const sessionEnd =
      eventReceived(
        events,
        "SESSION_END"
      );

    /*
     * PAGE_VIEW proves that the SDK is installed
     * and successfully communicating with REDEN.
     */
    const sdkInstalled =
      pageView;

    /*
     * These are the four business events the
     * developer must explicitly wire.
     *
     * SESSION_START / SESSION_END are SDK lifecycle
     * events and therefore do not determine whether
     * the business integration is complete.
     */
    const businessEventsComplete =
      productView &&
      addToCart &&
      checkoutStarted &&
      purchase;

    /* =====================================================
       11. RETURN HEALTH
    ===================================================== */

    return NextResponse.json(
      {
        ok: true,

        siteId,

        name:
          result.connection.name ??
          null,

        sdkInstalled,

        businessEventsComplete,

        events: {
          PAGE_VIEW:
            pageView,

          PRODUCT_VIEW:
            productView,

          ADD_TO_CART:
            addToCart,

          CHECKOUT_STARTED:
            checkoutStarted,

          PURCHASE:
            purchase,

          SESSION_END:
            sessionEnd,
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "[REDEN INTEGRATION HEALTH ROUTE]",
      errorMessage(error)
    );

    return jsonError(
      "internal_error",
      500
    );
  }
}