import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/signin?error=missing_code", requestUrl.origin)
    );
  }

  const supabase = createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase callback error:", error);

    return NextResponse.redirect(
      new URL("/signin?error=auth_callback", requestUrl.origin)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard", requestUrl.origin)
  );
}