
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type RequestBody = {
  connectionId?: unknown;
  expiresInDays?: unknown;
};

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

type InviteConnection = {
  store_name: string | null;
  site_id: string | null;
};

function getSessionEmail(session: any) {
  return session?.user?.email?.trim().toLowerCase() || "";
}

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


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const email = session.user.email
      ?.trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Your account does not have an email address.",
        },
        { status: 400 }
      );
    }

    const body: RequestBody = await req
      .json()
      .catch(() => ({}));

    const connectionId =
      typeof body.connectionId === "string"
        ? body.connectionId.trim()
        : "";

    if (!connectionId) {
      return NextResponse.json(
        {
          ok: false,
          error: "A connection ID is required.",
        },
        { status: 400 }
      );
    }

    const expiresInDays =
      typeof body.expiresInDays === "number" &&
      Number.isFinite(body.expiresInDays)
        ? Math.min(
            Math.max(body.expiresInDays, 1),
            30
          )
        : 7;

    /*
     * Use the server-side service-role client for this protected
     * operation. The authenticated developer's ownership is still
     * enforced below by matching developer_email to the session.
     *
     * The cookie/anon client can be filtered by Supabase RLS and
     * return no connection even when this developer owns it.
     */
    let supabase: ReturnType<typeof getAdminSupabase>;

    try {
      supabase = getAdminSupabase();
    } catch (error) {
      console.error(
        "[REDEN INVITE] Supabase configuration error:",
        error instanceof Error ? error.message : error
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Supabase is not configured correctly.",
        },
        { status: 500 }
      );
    }

    /*
     * Verify that the authenticated developer owns
     * the requested REDEN connection.
     *
     * IMPORTANT:
     *
     * reden_connections.user_email
     * = storefront/client owner
     *
     * reden_connections.developer_email
     * = PRETHIM developer who manages the connection
     *
     * The authenticated PRETHIM developer must therefore
     * be checked against developer_email.
     */
    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from("reden_connections")
      .select(
        "id, site_id, store_name, user_email, developer_email, status"
      )
      .eq("id", connectionId)
      .eq("developer_email", email)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "[REDEN INVITE] Failed to load connection:",
        connectionError
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

    const clientEmail = connection.user_email?.trim().toLowerCase() || "";
    if (!clientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json(
        { ok: false, error: "This storefront does not have a valid client email address." },
        { status: 400 }
      );
    }

    if (!["active", "connected"].includes((connection.status || "").toLowerCase())) {
      return NextResponse.json(
        { ok: false, error: "Confirm the storefront is connected before sending the access link." },
        { status: 409 }
      );
    }

    /*
     * Generate a cryptographically secure token.
     *
     * Only the SHA-256 hash is stored in Supabase.
     * The raw token exists only in the returned URL.
     */
    const token = crypto
      .randomBytes(32)
      .toString("hex");

    const tokenHash = hashToken(token);

    const expiresAt = new Date(
      Date.now() +
        expiresInDays *
          24 *
          60 *
          60 *
          1000
    ).toISOString();

    /*
     * Expire all previous unaccepted invites
     * belonging to this storefront.
     */
    const { error: revokeError } =
      await supabase
        .from("store_invites")
        .update({
          expires_at: new Date().toISOString(),
        })
        .eq(
          "connection_id",
          connection.id
        )
        .is("accepted_at", null);

    if (revokeError) {
      console.error(
        "[REDEN INVITE] Failed to invalidate previous invites:",
        revokeError
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

    /*
     * Store the hashed token.
     */
    const {
      data: invite,
      error: inviteError,
    } = await supabase
      .from("store_invites")
      .insert({
        connection_id: connection.id,
        token_hash: tokenHash,
        created_by: email,
        expires_at: expiresAt,
      })
      .select(
        "id, expires_at, created_at"
      )
      .single();

    if (inviteError) {
      console.error(
        "[REDEN INVITE] Failed to create invite:",
        inviteError
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

    /*
     * Public invite page.
     *
     * The application uses:
     *
     * /invites/[token]
     *
     * Therefore the generated URL must use:
     *
     * /invites/<token>
     */
    const origin = new URL(req.url).origin;

    const inviteUrl = origin + "/invites/" + token;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      await supabase.from("store_invites")
        .update({ expires_at: new Date().toISOString() })
        .eq("id", invite.id);
      return NextResponse.json(
        { ok: false, error: "Email delivery is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const htmlEscapes: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => htmlEscapes[character] || character);

    const storeName = connection.store_name?.trim() || "your storefront";
    const safeStoreName = escapeHtml(storeName);
    const resend = new Resend(resendApiKey);
    const { error: emailError } = await resend.emails.send({
      from: process.env.PRETHIM_EMAIL_FROM || "PRETHIM <noreply@dcore.name.ng>",
      to: [clientEmail],
      subject: "Your REDEN access for " + storeName,
      text: [
        "You have been invited to access REDEN.",
        "",
        "Storefront: " + storeName,
        "",
        "Open the secure link below to continue. You will need to verify your email before access is granted.",
        inviteUrl,
        "",
        "If you were not expecting this invitation, you can ignore this email.",
      ].join("\n"),
      html: '<div style="margin:0;background:#090806;padding:36px 16px;font-family:Arial,Helvetica,sans-serif;color:#e9e1d8"><div style="max-width:560px;margin:0 auto;border:1px solid #30271f;background:#100d0a;padding:32px"><p style="font-size:11px;letter-spacing:3px;color:#c97c3e;font-weight:700">REDEN</p><h1 style="font-size:25px;line-height:1.3;font-weight:600">You have been invited.</h1><p style="font-size:14px;line-height:1.8;color:#b9aea2">You have been invited to access REDEN for <strong>' + safeStoreName + '</strong>.</p><p style="font-size:14px;line-height:1.8;color:#b9aea2">Open the secure link below to continue. You must verify your email before REDEN access is granted.</p><p style="margin:28px 0"><a href="' + inviteUrl + '" style="display:inline-block;background:#c97c3e;color:#140d08;text-decoration:none;font-size:12px;font-weight:700;padding:14px 20px">CONTINUE TO REDEN</a></p><p style="font-size:11px;line-height:1.7;color:#766b60">If the button does not work, copy this URL into your browser:<br><span style="overflow-wrap:anywhere">' + inviteUrl + '</span></p><p style="margin-top:28px;border-top:1px solid #30271f;padding-top:18px;font-size:11px;color:#766b60">If you were not expecting this invitation, you can ignore this email.</p></div></div>',
    });

    if (emailError) {
      console.error("[REDEN INVITE] Access email failed:", emailError);
      await supabase.from("store_invites")
        .update({ expires_at: new Date().toISOString() })
        .eq("id", invite.id);
      return NextResponse.json(
        { ok: false, error: "The client access email could not be sent. Please try again." },
        { status: 502 }
      );
    }

    // Never return the access URL to the developer dashboard.
    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error(
      "[REDEN INVITE] Unexpected error:",
      error
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
    // 7. VERIFY INVITED CLIENT EMAIL
    // ---------------------------------------------------------

    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from("reden_connections")
      .select("user_email")
      .eq("id", invite.connection_id)
      .maybeSingle();

    if (connectionError) {
      console.error("[REDEN INVITE] Client identity lookup failed:", connectionError);
      return NextResponse.json(
        { ok: false, error: "Unable to verify the invited client." },
        { status: 500 }
      );
    }

    const invitedEmail = connection?.user_email?.trim().toLowerCase() || "";
    if (!invitedEmail || invitedEmail !== email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sign in with the email address that received this invitation.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 8. GRANT CUSTOMER ACCESS
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
    // 9. MARK INVITE ACCEPTED
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
    // 10. SUCCESS
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
