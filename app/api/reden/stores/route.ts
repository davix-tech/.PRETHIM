import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin configuration is missing.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/reden/stores
 *
 * Returns storefront connections belonging to the
 * authenticated PRETHIM developer.
 *
 * The developer's email is stored in developer_email.
 * user_email belongs to the storefront owner/client.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Support both PRETHIM sign-in paths: NextAuth (Google) and
    // Supabase Auth (email magic link). Only use the verified server session.
    let developerEmail =
      session?.user?.email?.trim().toLowerCase() || "";

    if (!developerEmail) {
      try {
        const { createClient: createSupabaseServerClient } = await import("@/lib/supabase/server");
        const authClient = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await authClient.auth.getUser();

        if (!authError && user?.email) {
          developerEmail = user.email.trim().toLowerCase();
        }
      } catch (authError) {
        console.error(
          "[REDEN STORES] Supabase session lookup failed:",
          authError instanceof Error ? authError.message : authError
        );
      }
    }

    if (!developerEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
          stores: [],
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
        error instanceof Error ? error.message : error
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Storefront service is not configured correctly.",
          stores: [],
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const {
      data: connections,
      error: queryError,
    } = await supabase
      .from("reden_connections")
      .select(
        "id, store_name, site_id, status, user_email, created_at, updated_at"
      )
      .eq("developer_email", developerEmail)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error(
        "[REDEN STORES] Database query failed:",
        {
          message: queryError.message,
          code: queryError.code,
          details: queryError.details,
          hint: queryError.hint,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Unable to load storefronts.",
          stores: [],
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const stores = (connections ?? []).map((connection) => ({
      id: connection.id,
      name: connection.store_name?.trim() || "Untitled storefront",
      siteId: connection.site_id?.trim() || "",
      status: connection.status || "pending",
      clientEmail: connection.user_email ?? null,
      createdAt: connection.created_at ?? null,
      updatedAt: connection.updated_at ?? null,
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
    console.error(
      "[REDEN STORES] Unexpected error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to load storefronts.",
        stores: [],
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
