import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Resolve the authenticated PRETHIM developer consistently across
 * storefront listing, credential recovery, name checks and invitations.
 * NextAuth Google is preferred; the verified Supabase Auth user is the
 * fallback for the supported magic-link session.
 */
export async function getAuthenticatedDeveloperEmail(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.trim().toLowerCase();
    if (email) return email;
  } catch {
    // Continue to the verified Supabase Auth session.
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
    // Fail closed when neither server session can be verified.
  }

  return null;
}
