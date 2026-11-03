import crypto from "crypto";
import { cookies } from "next/headers";

export const REDEN_INVITE_COOKIE = "reden_owner_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.REDEN_INVITE_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("REDEN invite session secret is not configured.");
  return value;
}

function signature(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createRedenInviteSession(email: string, connectionId: string) {
  const payload = Buffer.from(JSON.stringify({
    email: email.trim().toLowerCase(),
    connectionId,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString("base64url");
  return { value: payload + "." + signature(payload), maxAge: SESSION_SECONDS };
}

export function verifyRedenInviteSession(value?: string | null): { email: string; connectionId: string } | null {
  if (!value) return null;
  try {
    const [payload, supplied] = value.split(".");
    if (!payload || !supplied) return null;
    const expected = signature(payload);
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.email !== "string" || typeof data.connectionId !== "string" || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return { email: data.email, connectionId: data.connectionId };
  } catch {
    return null;
  }
}

export function getRedenInviteSession() {
  return verifyRedenInviteSession(cookies().get(REDEN_INVITE_COOKIE)?.value);
}
