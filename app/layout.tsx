import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.prethim.name.ng"),

  title: {
    default: "PRETHIM — Adaptive Decision Infrastructure",
    template: "%s — PRETHIM",
  },

  description:
    "PRETHIM is adaptive decision infrastructure for continuous trajectory evaluation and real-time behavioral optimization.",

  icons: {
    icon: "/icon.png?v=2",
    shortcut: "/icon.png?v=2",
    apple: "/icon.png?v=2",
  },

  keywords: [
    "PRETHIM",
    "Prethim",
    "Adaptive Decision Infrastructure",
    "PRETHIM Tech",
    "REDEN",
  ],

  verification: {
    google: "8qxE80JK7-2PPwqC5S3EIOKvrRZnB7SjUIw7_de-9V8",
  },

  alternates: {
    canonical: "https://www.prethim.name.ng",
  },

  openGraph: {
    title: "PRETHIM — Adaptive Decision Infrastructure",
    description:
      "Adaptive decision infrastructure for continuous trajectory evaluation and real-time behavioral optimization.",
    url: "https://www.prethim.name.ng",
    siteName: "PRETHIM",
    locale: "en_US",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#000000] text-[#f0f4ff] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}