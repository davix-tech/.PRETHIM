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

const OVERVIEW_QUESTION = "give me an overview";

/* =========================================================
   TYPES
========================================================= */

type EvidenceEvent = {
  event: string;
  count: number;
};

type IntelligenceEvidence = {
  visitors?: number;
  events?: EvidenceEvent[];
  decisions?: {
    completed?: number;
    conversions?: number;
    conversionRate?: number;
    revenue?: number;
  };
  purchaseRevenue?: number;
};

type IntelligenceResponse = {
  ok?: boolean;
  answer?: string;
  evidence?: IntelligenceEvidence;
  error?: string;
};

function eventCount(
  events: EvidenceEvent[] | undefined,
  name: string
): number {
  return events?.find((item) => item.event === name)?.count ?? 0;
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
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}

/* =========================================================
   GET /api/reden/metrics
========================================================= */

export async function GET(req: Request) {
  try {
    /* =====================================================
       1. AUTHENTICATE
    ===================================================== */

    const session = await getServerSession(authOptions);
    const ownerEmail = session?.user?.email?.trim().toLowerCase();

    if (!ownerEmail) {
      return jsonError("unauthorized", 401);
    }

    /* =====================================================
       2. VERIFY SERVER CONFIGURATION
    ===================================================== */

    const adminSecret = getRedenAdminSecret();

    if (!adminSecret) {
      console.error(
        "[REDEN METRICS] REDEN admin secret is not configured"
      );

      return jsonError("server_configuration_error", 500);
    }

    /* =====================================================
       3. GET REQUESTED SITE ID
    ===================================================== */

    const url = new URL(req.url);
    const requestedSiteId =
      url.searchParams.get("siteId")?.trim() || "";

    if (
      requestedSiteId &&
      !isValidSiteId(requestedSiteId)
    ) {
      return jsonError("invalid_site_id", 400);
    }

    /* =====================================================
       4. RESOLVE AUTHORITATIVE CONNECTION
       
       The authenticated account's active connection is
       always the source of truth for tenant ownership.
    ===================================================== */

    const result = await getActiveConnection(ownerEmail);

    if (!result.ok) {
      const status =
        result.reason === "not_found"
          ? 404
          : result.reason === "config_error"
          ? 500
          : 500;

      const error =
        result.reason === "not_found"
          ? "reden_installation_not_found"
          : result.reason === "config_error"
          ? "server_configuration_error"
          : "reden_installation_lookup_failed";

      console.error(
        "[REDEN METRICS] Active connection lookup failed:",
        {
          ownerEmail,
          reason: result.reason,
        }
      );

      return jsonError(error, status);
    }

    /* =====================================================
       5. VALIDATE AUTHORITATIVE SITE ID
    ===================================================== */

    const activeSiteId =
      result.connection.siteId?.trim() || "";

    if (
      !activeSiteId ||
      !isValidSiteId(activeSiteId)
    ) {
      console.error(
        "[REDEN METRICS] Invalid active site ID:",
        {
          ownerEmail,
          siteId: activeSiteId,
        }
      );

      return jsonError(
        "invalid_active_site_id",
        500
      );
    }

    /* =====================================================
       6. CHECK REQUESTED SITE OWNERSHIP
       
       A browser-supplied siteId is only accepted when it
       matches the authenticated account's active connection.
    ===================================================== */

    if (
      requestedSiteId &&
      requestedSiteId !== activeSiteId
    ) {
      console.error(
        "[REDEN METRICS] Site ID mismatch:",
        {
          ownerEmail,
          requestedSiteId,
          activeSiteId,
        }
      );

      return jsonError(
        "site_id_mismatch",
        409,
        {
          requestedSiteId,
          activeSiteId,
        }
      );
    }

    /* =====================================================
       7. USE SERVER-AUTHORITATIVE SITE ID
    ===================================================== */

    const siteId = activeSiteId;

    /* =====================================================
       8. ASK REDEN
    ===================================================== */

    let response: Response;

    try {
      response = await fetchWithTimeout(
        `${REDEN_API_URL}/api/v1/intelligence`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-admin-secret": adminSecret,
          },
          body: JSON.stringify({
            siteId,
            question: OVERVIEW_QUESTION,
          }),
          cache: "no-store",
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (
          error.name === "AbortError" ||
          error.name === "TimeoutError"
        )
      ) {
        console.error(
          "[REDEN METRICS] Upstream request timeout:",
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
        "[REDEN METRICS] Network error:",
        {
          ownerEmail,
          siteId,
          error: errorMessage(error),
        }
      );

      return jsonError(
        "reden_intelligence_unavailable",
        502
      );
    }

    /* =====================================================
       9. PARSE REDEN RESPONSE
    ===================================================== */

    let data: IntelligenceResponse;

    try {
      data =
        await parseJsonResponse<IntelligenceResponse>(
          response
        );
    } catch {
      console.error(
        "[REDEN METRICS] Invalid JSON response:",
        {
          ownerEmail,
          siteId,
          status: response.status,
        }
      );

      return jsonError(
        "reden_returned_invalid_json",
        502
      );
    }

    /* =====================================================
       10. VALIDATE UPSTREAM RESPONSE
    ===================================================== */

    if (
      !response.ok ||
      data.ok !== true
    ) {
      console.error(
        "[REDEN METRICS] Upstream failure:",
        {
          ownerEmail,
          siteId,
          status: response.status,
          error: data.error,
        }
      );

      return jsonError(
        data.error ||
          "reden_intelligence_failed",
        upstreamStatus(response.status)
      );
    }

    /* =====================================================
       11. EXTRACT STRUCTURED METRICS
    ===================================================== */

    const evidence =
      data.evidence || {};

    /*
     * Prefer real storefront-reported purchase revenue
     * from session_summaries over bandit-attribution
     * revenue from the decisions table.
     */
    const revenue = Number(
      evidence.purchaseRevenue ??
        evidence.decisions?.revenue ??
        0
    );

    const visitors = Number(
      evidence.visitors ?? 0
    );

    const checkouts = eventCount(
      evidence.events,
      "CHECKOUT_STARTED"
    );

    const purchases = eventCount(
      evidence.events,
      "PURCHASE"
    );

    const conversionRate = Number(
      evidence.decisions?.conversionRate ??
        0
    );

    /* =====================================================
       12. RETURN METRICS
    ===================================================== */

    return NextResponse.json(
      {
        ok: true,
        siteId,
        metrics: {
          revenue,
          visitors,
          checkouts,
          purchases,
          conversionRate,
        },
        generatedAt:
          new Date().toISOString(),
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
      "[REDEN METRICS ROUTE]",
      errorMessage(error)
    );

    return jsonError(
      "internal_error",
      500
    );
  }
}