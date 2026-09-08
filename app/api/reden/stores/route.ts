import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminSupabase } from "@/lib/reden/connection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConnectionRow = {
  id: string;
  user_email: string;
  developer_email: string | null;
  store_name: string | null;
  site_id: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const developerEmail = session?.user?.email
      ?.trim()
      .toLowerCase();

    if (!developerEmail) {
      return NextResponse.json(
        {
          ok: false,
          stores: [],
          error: "Your session has expired. Please sign in again.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    let supabase;

    try {
      supabase = getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN STORES] Supabase configuration error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          stores: [],
          error: "Supabase is not configured correctly.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
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
      console.error("[REDEN STORES] Database query failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        developerEmail,
      });

      return NextResponse.json(
        {
          ok: false,
          stores: [],
          error: "Unable to load your storefronts.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const stores = ((connections ?? []) as ConnectionRow[])
      .filter(
        (connection) =>
          typeof connection.site_id === "string" &&
          connection.site_id.trim().length > 0 &&
          typeof connection.store_name === "string" &&
          connection.store_name.trim().length > 0
      )
      .map((connection) => ({
        id: connection.id,
        name: connection.store_name,
        siteId: connection.site_id,
        status: connection.status ?? "installing",
        clientEmail: connection.user_email,
        createdAt: connection.created_at,
        updatedAt: connection.updated_at,
      }));

    return NextResponse.json(
      {
        ok: true,
        stores,
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
    console.error("[REDEN STORES] Unexpected route error:", {
      message:
        error instanceof Error ? error.message : String(error),
      stack:
        error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        ok: false,
        stores: [],
        error: "Something went wrong while loading your storefronts.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}