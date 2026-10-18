import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Enforce authentication on the server as a second layer, independent
  // of middleware and client-side session state.
  try {
    const session = await getServerSession(authOptions);

    if (session?.user) {
      return children;
    }
  } catch {
    // Continue to the Supabase magic-link session check.
  }

  // Preserve the existing Supabase email magic-link sign-in flow.
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return children;
    }
  } catch {
    // Fail closed if neither session can be verified.
  }

  redirect("/signin?callbackUrl=%2Fdashboard");
}
