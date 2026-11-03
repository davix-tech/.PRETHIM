import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createRedenInviteSession, REDEN_INVITE_COOKIE } from "@/lib/reden-invite-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Database configuration unavailable.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function codeHash(inviteId: string, code: string) {
  const secret = process.env.REDEN_INVITE_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Invite verification secret is not configured.");
  return crypto.createHmac("sha256", secret).update(inviteId + ":" + code).digest("hex");
}
function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, "hex"); const bb = Buffer.from(b, "hex");
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const action = body.action;
    if (!token || !["send", "verify"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid verification request." }, { status: 400 });
    }
    const db = admin();
    const { data: invite, error: inviteError } = await db.from("store_invites")
      .select("id,connection_id,expires_at,accepted_at,reden_connections(user_email,store_name)")
      .eq("token_hash", tokenHash(token)).maybeSingle();
    if (inviteError || !invite) return NextResponse.json({ ok: false, error: "This invitation is invalid." }, { status: 404 });
    if (invite.accepted_at || new Date(invite.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ ok: false, error: "This invitation has expired or has already been used." }, { status: 410 });
    }
    const raw = invite.reden_connections as unknown as { user_email?: string; store_name?: string } | { user_email?: string; store_name?: string }[] | null;
    const connection = Array.isArray(raw) ? raw[0] : raw;
    const email = connection?.user_email?.trim().toLowerCase() || "";
    const storeName = connection?.store_name?.trim() || "your store";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "The registered store-owner email is unavailable." }, { status: 409 });
    }

    if (action === "send") {
      const { data: prior } = await db.from("store_invite_otps").select("sent_at")
        .eq("invite_id", invite.id).maybeSingle();
      if (prior?.sent_at && Date.now() - new Date(prior.sent_at).getTime() < 60_000) {
        return NextResponse.json({ ok: false, error: "Please wait before requesting another code." }, { status: 429 });
      }
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
      const { error: saveError } = await db.from("store_invite_otps").upsert({
        invite_id: invite.id, code_hash: codeHash(invite.id, code), expires_at: expiresAt,
        attempts: 0, sent_at: new Date().toISOString(), consumed_at: null,
      }, { onConflict: "invite_id" });
      if (saveError) throw saveError;
      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (!apiKey) return NextResponse.json({ ok: false, error: "Email verification is temporarily unavailable." }, { status: 503 });
      const resend = new Resend(apiKey);
      const { error: mailError } = await resend.emails.send({
        from: process.env.PRETHIM_EMAIL_FROM?.trim() || "REDEN <noreply@prethim.name.ng>",
        to: [email],
        subject: "Your REDEN verification code",
        text: "Your REDEN verification code is " + code + ". It expires in 10 minutes. If you did not request this, ignore this email.",
        html: '<div style="background:#100d0a;color:#eee8e2;padding:32px;font-family:Arial,sans-serif;max-width:560px;margin:auto"><p style="color:#c97c3e;letter-spacing:3px;font-size:11px">REDEN</p><h1 style="font-size:24px">Verify your store access</h1><p style="color:#b9aea2;line-height:1.7">Use this one-time code to verify ownership of <strong>'+storeName.replace(/[&<>"]/g,"")+'</strong>.</p><div style="font-size:32px;letter-spacing:8px;font-weight:700;padding:20px 0;color:#c97c3e">'+code+'</div><p style="color:#8f8676;font-size:12px">This code expires in 10 minutes and can only be used once.</p></div>',
      });
      if (mailError) {
        console.error("[REDEN OTP] Email delivery failed:", mailError);
        return NextResponse.json({ ok: false, error: "We could not send the verification code. Please try again." }, { status: 502 });
      }
      return NextResponse.json({ ok: true, sent: true, expiresInSeconds: 600 });
    }

    const submitted = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (!/^\d{6}$/.test(submitted)) return NextResponse.json({ ok: false, error: "Enter the six-digit code." }, { status: 400 });
    const { data: otp, error: otpError } = await db.from("store_invite_otps")
      .select("code_hash,expires_at,attempts,consumed_at").eq("invite_id", invite.id).maybeSingle();
    if (otpError || !otp || otp.consumed_at || new Date(otp.expires_at).getTime() <= Date.now() || otp.attempts >= 5) {
      return NextResponse.json({ ok: false, error: "That code has expired. Request a new one." }, { status: 410 });
    }
    if (!safeEqual(otp.code_hash, codeHash(invite.id, submitted))) {
      await db.from("store_invite_otps").update({ attempts: otp.attempts + 1 })
        .eq("invite_id", invite.id).eq("attempts", otp.attempts).is("consumed_at", null);
      return NextResponse.json({ ok: false, error: "Incorrect code. Check it and try again." }, { status: 400 });
    }

    const { error: memberError } = await db.from("reden_members").upsert({
      connection_id: invite.connection_id, user_email: email, role: "store_owner",
    }, { onConflict: "connection_id,user_email" });
    if (memberError) throw memberError;
    const now = new Date().toISOString();
    const { data: consumed, error: consumeError } = await db.from("store_invite_otps")
      .update({ consumed_at: now }).eq("invite_id", invite.id).is("consumed_at", null).select("invite_id").maybeSingle();
    if (consumeError || !consumed) return NextResponse.json({ ok: false, error: "This verification code has already been used." }, { status: 409 });
    const { data: accepted, error: acceptError } = await db.from("store_invites")
      .update({ accepted_at: now, accepted_by: email }).eq("id", invite.id).is("accepted_at", null).select("id").maybeSingle();
    if (acceptError || !accepted) return NextResponse.json({ ok: false, error: "The invitation could not be finalized. Contact your developer." }, { status: 409 });

    const identity = createRedenInviteSession(email, invite.connection_id);
    const response = NextResponse.json({ ok: true, connectionId: invite.connection_id, role: "store_owner" });
    response.cookies.set(REDEN_INVITE_COOKIE, identity.value, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: identity.maxAge,
    });
    return response;
  } catch (error) {
    console.error("[REDEN OTP] Verification flow failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Unable to complete email verification." }, { status: 500 });
  }
}
