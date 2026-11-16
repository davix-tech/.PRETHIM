import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  REDEN_API_URL,
  fetchWithTimeout,
  getRedenAdminSecret,
  parseJsonResponse,
  upstreamStatus,
} from "@/lib/reden/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NameCheckResponse = {
  success?: boolean;
  available?: boolean;
  existing?: boolean;
  reason?: string | null;
  error?: unknown;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { ok: false, error },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const developerEmail = cleanString(session?.user?.email).toLowerCase();

    if (!developerEmail) {
      return jsonError("Authentication required.", 401);
    }

    const body = await req.json().catch(() => ({}));
    const name = cleanString(body?.name);
    const clientEmail = cleanString(body?.clientEmail).toLowerCase();

    if (!name) return jsonError("Enter a storefront name.", 400);
    if (name.length > 255) return jsonError("Storefront name is too long.", 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return jsonError("Enter a valid client email address.", 400);
    }

    const adminSecret = getRedenAdminSecret();
    if (!adminSecret) {
      console.error("[REDEN NAME CHECK] REDEN admin secret is not configured");
      return jsonError("Storefront name service is not configured.", 500);
    }

    const response = await fetchWithTimeout(
      `${REDEN_API_URL}/api/v1/name-availability`,
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
      12_000
    );

    const result = await parseJsonResponse<NameCheckResponse>(response);

    if (!response.ok || result.success !== true) {
      const message = cleanString(result.error);
      return jsonError(
        message || "Unable to check storefront name availability.",
        upstreamStatus(response.status)
      );
    }

    return NextResponse.json(
      {
        ok: true,
        available: result.available === true,
        existing: result.existing === true,
        reason: result.reason || null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "[REDEN NAME CHECK] Request failed:",
      error instanceof Error ? error.message : error
    );
    return jsonError("Unable to check storefront name availability.", 502);
  }
}
