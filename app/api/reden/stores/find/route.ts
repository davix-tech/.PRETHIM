import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/reden/connection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    const developerEmail = session?.user?.email
      ?.trim()
      .toLowerCase();

    if (!developerEmail) {
      return NextResponse.json(
        {
          ok: false,
          found: false,
          error: "You must be signed in to find an existing storefront.",
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const storeName =
      typeof body?.storeName === "string"
        ? body.storeName.trim()
        : "";

    if (!storeName) {
      return NextResponse.json(
        {
          ok: false,
          found: false,
          error: "Enter your store name or domain.",
        },
        { status: 400 }
      );
    }

    let supabase;

    try {
      supabase = getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN FIND] Supabase configuration error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          found: false,
          error: "Supabase is not configured correctly.",
        },
        { status: 500 }
      );
    }

    const { data: connections, error } = await supabase
      .from("reden_connections")
      .select(
        `
          id,
          user_email,
          developer_email,
          store_name,
          site_id,
          status,
          created_at,
          updated_at
        `
      )
      .eq("developer_email", developerEmail)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("[REDEN FIND] Database query failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        developerEmail,
      });

      return NextResponse.json(
        {
          ok: false,
          found: false,
          error: "Unable to search for your storefront.",
        },
        { status: 500 }
      );
    }

    const normalizedSearch = normalize(storeName);

    const match = connections?.find((connection) => {
      if (
        typeof connection.store_name !== "string" ||
        typeof connection.site_id !== "string"
      ) {
        return false;
      }

      return (
        normalize(connection.store_name) === normalizedSearch
      );
    });

    if (!match) {
      return NextResponse.json({
        ok: true,
        found: false,
        error:
          "No storefront linked to this account was found.",
      });
    }

    return NextResponse.json({
      ok: true,
      found: true,
      store: {
        id: match.id,
        name: match.store_name,
        siteId: match.site_id,
        status: match.status,
        clientEmail: match.user_email,
        createdAt: match.created_at,
        updatedAt: match.updated_at,
      },
    });
  } catch (error) {
    console.error("[REDEN FIND] Unexpected route error:", {
      message:
        error instanceof Error ? error.message : String(error),
      stack:
        error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        ok: false,
        found: false,
        error:
          "Something went wrong while finding your storefront.",
      },
      { status: 500 }
    );
  }
}