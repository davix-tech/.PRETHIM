import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InviteConnection = {
  store_name: string | null;
  site_id: string | null;
};

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function getSessionEmail(session: any) {
  return (
    session?.user?.email?.trim().toLowerCase() || ""
  );
}

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  return createSupabaseClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * ============================================================
 * POST /api/reden/invites
 *
 * Developer creates an invite for one of their storefronts.
 * ============================================================
 */
export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION
    // ---------------------------------------------------------

    const session =
      await getServerSession(authOptions);

    const email =
      getSessionEmail(session);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. REQUEST BODY
    // ---------------------------------------------------------

    const body =
      await req.json().catch(() => null);

    const connectionId =
      typeof body?.connectionId === "string"
        ? body.connectionId.trim()
        : "";

    if (!connectionId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Connection ID is required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. ADMIN SUPABASE CLIENT
    //
    // We use the service-role client because this is a
    // trusted server-side operation.
    //
    // Ownership is STILL enforced explicitly below by:
    //
    // .eq("user_email", email)
    //
    // ---------------------------------------------------------

    let supabase;

    try {
      supabase =
        getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN INVITE] Supabase configuration error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Supabase is not configured correctly.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 4. VERIFY DEVELOPER OWNS STOREFRONT
    // ---------------------------------------------------------

    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from("reden_connections")
      .select(
        `
          id,
          user_email,
          site_id,
          store_name,
          status
        `
      )
      .eq("id", connectionId)
      .eq("user_email", email)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "[REDEN INVITE] Connection lookup failed:",
        {
          message:
            connectionError.message,
          details:
            connectionError.details,
          hint:
            connectionError.hint,
          code:
            connectionError.code,
          email,
          connectionId,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Unable to verify the storefront.",
        },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You do not have permission to create an invite for this storefront.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 5. VALIDATE CONNECTION
    // ---------------------------------------------------------

    if (
      !connection.site_id ||
      !connection.store_name
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This storefront connection is incomplete.",
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // 6. GENERATE SECURE INVITE TOKEN
    // ---------------------------------------------------------

    const token =
      crypto
        .randomBytes(32)
        .toString("hex");

    const tokenHash =
      hashToken(token);

    const now =
      new Date();

    const expiresAt =
      new Date(
        now.getTime() +
          7 *
            24 *
            60 *
            60 *
            1000
      ).toISOString();

    // ---------------------------------------------------------
    // 7. INVALIDATE OLD ACTIVE INVITES
    // ---------------------------------------------------------

    const {
      error: revokeError,
    } = await supabase
      .from("store_invites")
      .update({
        expires_at:
          now.toISOString(),
      })
      .eq(
        "connection_id",
        connection.id
      )
      .is(
        "accepted_at",
        null
      )
      .gt(
        "expires_at",
        now.toISOString()
      );

    if (revokeError) {
      console.error(
        "[REDEN INVITE] Failed to invalidate old invites:",
        {
          message:
            revokeError.message,
          details:
            revokeError.details,
          hint:
            revokeError.hint,
          code:
            revokeError.code,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Unable to prepare the storefront invite.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 8. CREATE INVITE
    // ---------------------------------------------------------

    const {
      data: invite,
      error: inviteError,
    } = await supabase
      .from("store_invites")
      .insert({
        connection_id:
          connection.id,
        token_hash:
          tokenHash,
        created_by:
          email,
        expires_at:
          expiresAt,
      })
      .select(
        `
          id,
          connection_id,
          expires_at,
          created_at
        `
      )
      .single();

    if (inviteError) {
      console.error(
        "[REDEN INVITE] Invite creation failed:",
        {
          message:
            inviteError.message,
          details:
            inviteError.details,
          hint:
            inviteError.hint,
          code:
            inviteError.code,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Unable to create the invite.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 9. BUILD PUBLIC INVITE URL
    //
    // IMPORTANT:
    //
    // Your page is using:
    //
    // /invites/[token]
    //
    // Therefore the generated URL must also be:
    //
    // /invites/[token]
    //
    // ---------------------------------------------------------

    const origin =
      new URL(req.url).origin;

    const inviteUrl =
      `${origin}/invites/${token}`;

    // ---------------------------------------------------------
    // 10. SUCCESS
    // ---------------------------------------------------------

    return NextResponse.json({
      ok: true,

      invite: {
        id: invite.id,

        url: inviteUrl,

        expiresAt:
          invite.expires_at,

        createdAt:
          invite.created_at,

        connectionId:
          connection.id,

        storeName:
          connection.store_name,

        siteId:
          connection.site_id,
      },

      connection: {
        id:
          connection.id,

        storeName:
          connection.store_name,

        siteId:
          connection.site_id,

        status:
          connection.status,
      },
    });
  } catch (error) {
    console.error(
      "[REDEN INVITE] Unexpected error:",
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

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to create the invite.",
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================================
 * GET /api/reden/invites?token=...
 *
 * Public invite validation.
 *
 * The customer does NOT need to be authenticated yet.
 * ============================================================
 */
export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const token =
      searchParams
        .get("token")
        ?.trim() || "";

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Invite token is required.",
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashToken(token);

    let supabase;

    try {
      supabase =
        getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN INVITE] Supabase configuration error:",
        error
      );

      return NextResponse.json(
        {
          valid: false,
          error:
            "Supabase is not configured correctly.",
        },
        { status: 500 }
      );
    }

    const {
      data: invite,
      error: inviteError,
    } = await supabase
      .from("store_invites")
      .select(
        `
          id,
          connection_id,
          expires_at,
          accepted_at,
          reden_connections (
            store_name,
            site_id
          )
        `
      )
      .eq(
        "token_hash",
        tokenHash
      )
      .maybeSingle();

    if (inviteError) {
      console.error(
        "[REDEN INVITE] Validation failed:",
        {
          message:
            inviteError.message,
          details:
            inviteError.details,
          hint:
            inviteError.hint,
          code:
            inviteError.code,
        }
      );

      return NextResponse.json(
        {
          valid: false,
          error:
            "Unable to validate invite.",
        },
        { status: 500 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "This invite link is invalid.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // ALREADY ACCEPTED
    // ---------------------------------------------------------

    if (invite.accepted_at) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "This invite has already been used.",
        },
        { status: 410 }
      );
    }

    // ---------------------------------------------------------
    // EXPIRED
    // ---------------------------------------------------------

    if (
      new Date(
        invite.expires_at
      ).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "This invite has expired.",
        },
        { status: 410 }
      );
    }

    // ---------------------------------------------------------
    // CONNECTION
    // ---------------------------------------------------------

    const rawConnection =
      invite.reden_connections;

    const connection =
      Array.isArray(rawConnection)
        ? (
            rawConnection[0] as
              | InviteConnection
              | undefined
          )
        : (
            rawConnection as
              | InviteConnection
              | null
          );

    if (
      !connection?.site_id
    ) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "This invitation is no longer connected to a storefront.",
        },
        { status: 410 }
      );
    }

    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    return NextResponse.json({
      valid: true,

      invite: {
        id:
          invite.id,

        connectionId:
          invite.connection_id,

        storeName:
          connection.store_name ||
          "Your storefront",

        siteId:
          connection.site_id,

        expiresAt:
          invite.expires_at,
      },
    });
  } catch (error) {
    console.error(
      "[REDEN INVITE] Validation error:",
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

    return NextResponse.json(
      {
        valid: false,
        error:
          "Unable to validate invite.",
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================================
 * PATCH /api/reden/invites
 *
 * Customer accepts an invite.
 * ============================================================
 */
export async function PATCH(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION
    // ---------------------------------------------------------

    const session =
      await getServerSession(authOptions);

    const email =
      getSessionEmail(session);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You must sign in before accepting this invite.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. TOKEN
    // ---------------------------------------------------------

    const body =
      await req.json().catch(() => null);

    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : "";

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invite token is required.",
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashToken(token);

    // ---------------------------------------------------------
    // 3. SUPABASE ADMIN CLIENT
    // ---------------------------------------------------------

    let supabase;

    try {
      supabase =
        getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN INVITE] Supabase configuration error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Supabase is not configured correctly.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 4. LOAD INVITE
    // ---------------------------------------------------------

    const {
      data: invite,
      error: inviteError,
    } = await supabase
      .from("store_invites")
      .select(
        `
          id,
          connection_id,
          expires_at,
          accepted_at
        `
      )
      .eq(
        "token_hash",
        tokenHash
      )
      .maybeSingle();

    if (inviteError) {
      console.error(
        "[REDEN INVITE] Accept lookup failed:",
        {
          message:
            inviteError.message,
          details:
            inviteError.details,
          hint:
            inviteError.hint,
          code:
            inviteError.code,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Unable to validate invite.",
        },
        { status: 500 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This invite is invalid.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 5. CHECK ACCEPTED
    // ---------------------------------------------------------

    if (invite.accepted_at) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This invite has already been used.",
        },
        { status: 410 }
      );
    }

    // ---------------------------------------------------------
    // 6. CHECK EXPIRATION
    // ---------------------------------------------------------

    if (
      new Date(
        invite.expires_at
      ).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This invite has expired.",
        },
        { status: 410 }
      );
    }

    // ---------------------------------------------------------
    // 7. GRANT CUSTOMER ACCESS
    // ---------------------------------------------------------

    const {
      error: memberError,
    } = await supabase
      .from("reden_members")
      .upsert(
        {
          connection_id:
            invite.connection_id,

          user_email:
            email,

          role:
            "store_owner",
        },
        {
          onConflict:
            "connection_id,user_email",
        }
      );

    if (memberError) {
      console.error(
        "[REDEN INVITE] Member creation failed:",
        {
          message:
            memberError.message,
          details:
            memberError.details,
          hint:
            memberError.hint,
          code:
            memberError.code,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Unable to grant storefront access.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 8. MARK INVITE ACCEPTED
    // ---------------------------------------------------------

    const {
      data: finalizedInvite,
      error: updateError,
    } = await supabase
      .from("store_invites")
      .update({
        accepted_at:
          new Date().toISOString(),

        accepted_by:
          email,
      })
      .eq(
        "id",
        invite.id
      )
      .is(
        "accepted_at",
        null
      )
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error(
        "[REDEN INVITE] Finalization failed:",
        {
          message:
            updateError.message,
          details:
            updateError.details,
          hint:
            updateError.hint,
          code:
            updateError.code,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Access was created, but the invite could not be finalized.",
        },
        { status: 500 }
      );
    }

    if (!finalizedInvite) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This invite was already accepted.",
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // 9. SUCCESS
    // ---------------------------------------------------------

    return NextResponse.json({
      ok: true,

      connectionId:
        invite.connection_id,

      role:
        "store_owner",
    });
  } catch (error) {
    console.error(
      "[REDEN INVITE] Accept error:",
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

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to accept invite.",
      },
      { status: 500 }
    );
  }
}