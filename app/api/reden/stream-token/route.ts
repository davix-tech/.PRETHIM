import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedEmail } from "@/lib/authenticated-email";
import { getActiveConnection } from "@/lib/reden/connection";
import {
  REDEN_API_URL,
  getRedenAdminSecret,
  isValidSiteId,
} from "@/lib/reden/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Issues a short-lived, site-scoped stream ticket.
 *
 * The browser receives neither the permanent REDEN site API key
 * nor the REDEN admin secret. The ticket expires after one hour.
 */
export async function GET() {
  try {
    const ownerEmail = await getAuthenticatedEmail();

    if (!ownerEmail) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const adminSecret = getRedenAdminSecret();
    if (!adminSecret) {
      return NextResponse.json(
        { ok: false, error: "server_configuration_error" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await getActiveConnection(ownerEmail);
    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 500;
      return NextResponse.json(
        {
          ok: false,
          error:
            result.reason === "not_found"
              ? "reden_installation_not_found"
              : "reden_installation_lookup_failed",
        },
        { status, headers: { "Cache-Control": "no-store" } }
      );
    }

    const siteId = result.connection.siteId?.trim() || "";
    if (!siteId || !isValidSiteId(siteId)) {
      return NextResponse.json(
        { ok: false, error: "invalid_active_site_id" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const payload = Buffer.from(
      JSON.stringify({
        siteId,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      })
    ).toString("base64url");

    const signature = createHmac("sha256", adminSecret)
      .update(payload)
      .digest("base64url");

    const token = `${payload}.${signature}`;
    const streamUrl = new URL("/api/v1/stream", REDEN_API_URL);
    streamUrl.searchParams.set("token", token);

    return NextResponse.json(
      { ok: true, streamUrl: streamUrl.toString() },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("[REDEN STREAM TOKEN]", error);
    return NextResponse.json(
      { ok: false, error: "stream_ticket_failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
