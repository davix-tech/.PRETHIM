import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Resolve a verified PRETHIM identity across both supported sign-in
 * methods: NextAuth (Google) and Supabase Auth (email magic link).
 * Never accept an email address supplied by the browser as identity.
 */
export async function getAuthenticatedEmail(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const nextAuthEmail = session?.user?.email?.trim().toLowerCase();

    if (nextAuthEmail) {
      return nextAuthEmail;
    }
  } catch {
    // Continue to the verified Supabase session.
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user?.email?.trim()) {
      return user.email.trim().toLowerCase();
    }
  } catch {
    // Fail closed when neither session can be verified.
  }

  return null;
}
