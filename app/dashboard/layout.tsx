import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Temporary direct-access window. Restore the original session checks
  // from backup/prethim-auth-before-temporary-dashboard-access after use.
  return children;
}
