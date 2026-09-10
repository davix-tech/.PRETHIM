
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
     * createClient() is synchronous.
     *
     * Do NOT use:
     *
     * const supabase = await createClient();
     */
    const supabase = createClient();

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

    const inviteUrl =
      `${origin}/invites/${token}`;

    return NextResponse.json({
      ok: true,

      invite: {
        id: invite.id,
        url: inviteUrl,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
      },

      connection: {
        id: connection.id,
        siteId: connection.site_id,
        storeName: connection.store_name,
      },
    });
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
