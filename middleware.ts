import { createServerClient } from "@supabase/ssr";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";


async function hasValidRedenInviteSession(request: NextRequest) {
  try {
    const value = request.cookies.get("reden_owner_session")?.value || "";
    const [payload, supplied] = value.split(".");
    const secret = process.env.REDEN_INVITE_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
    if (!payload || !supplied || !secret) return false;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    if (expected !== supplied) return false;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    return typeof data.email === "string" && typeof data.connectionId === "string" &&
      typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Accept a verified REDEN store-owner email identity first.\n  if (await hasValidRedenInviteSession(request)) {\n    return NextResponse.next();\n  }\n\n  // Accept a valid NextAuth JWT (Google sign-in).
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      return NextResponse.next();
    }
  } catch {
    // Try the Supabase session before denying access.
  }

  // Accept a verified Supabase user (email magic-link sign-in).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        return response;
      }
    } catch {
      // Fail closed if the session cannot be verified.
    }
  }

  const signInUrl = new URL("/signin", request.url);
  signInUrl.searchParams.set(
    "callbackUrl",
    request.nextUrl.pathname + request.nextUrl.search
  );

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reden/:path*",
    "/reden-addstore/:path*",
    "/reden-dashboard/:path*",
    "/reden-developer/:path*",
    "/reden-install/:path*",
  ],
};
