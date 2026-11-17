import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "REDEN installation",
  robots: { index: false, follow: false },
};

export default function PrivateRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
