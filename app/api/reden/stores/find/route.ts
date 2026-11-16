import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/reden/connection";
import { getAuthenticatedDeveloperEmail } from "@/lib/reden/developer-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const developerEmail = (await getAuthenticatedDeveloperEmail()) || "";

    if (!developerEmail) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const storeName = cleanString(body?.storeName);
    const clientEmail = cleanString(body?.clientEmail).toLowerCase();

    if (!storeName) {
      return NextResponse.json(
        { ok: false, error: "A storefront name is required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json(
        { ok: false, error: "A valid client email is required." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();
    const pattern = storeName.replace(/[\\%_]/g, "\\$&");

    const { data: connection, error } = await supabase
      .from("reden_connections")
      .select("id, store_name, site_id, status, user_email, created_at, updated_at")
      .eq("developer_email", developerEmail)
      .eq("user_email", clientEmail)
      .ilike("store_name", pattern)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[REDEN STORE FIND] Database lookup failed:", {
        message: error.message,
        code: error.code,
      });
      return NextResponse.json(
        { ok: false, error: "Unable to look up this storefront." },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        { ok: true, found: false, store: null },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        found: true,
        store: {
          id: connection.id,
          name: connection.store_name,
          siteId: connection.site_id,
          status: connection.status,
          clientEmail: connection.user_email,
          createdAt: connection.created_at,
          updatedAt: connection.updated_at,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "[REDEN STORE FIND] Unexpected error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { ok: false, error: "Unable to look up this storefront." },
      { status: 500 }
    );
  }
}
