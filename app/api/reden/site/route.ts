import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getActiveConnection } from "@/lib/reden/connection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =========================================================
   GET /api/reden/site

   Resolves the logged-in merchant's currently active
   storefront connection. The dashboard calls this once on
   load, caches the siteId client-side, and passes it
   explicitly into every subsequent metrics / intelligence
   call — so those calls never depend on the fallback lookup.
========================================================= */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const ownerEmail = session?.user?.email?.trim().toLowerCase();

    if (!ownerEmail) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const result = await getActiveConnection(ownerEmail);

    if (!result.ok) {
      const status =
        result.reason === "not_found"
          ? 404
          : result.reason === "invalid"
          ? 502
          : 500;

      const error =
        result.reason === "not_found"
          ? "reden_installation_not_found"
          : result.reason === "invalid"
          ? "invalid_installation_response"
          : result.reason === "config_error"
          ? "server_configuration_error"
          : "reden_installation_lookup_failed";

      return NextResponse.json({ ok: false, error }, { status });
    }

    return NextResponse.json({
      ok: true,
      siteId: result.connection.siteId,
      name: result.connection.name,
      status: result.connection.status,
    });
  } catch (error) {
    console.error(
      "[REDEN SITE ROUTE]",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}