import Link from "next/link";

const productLinks = [
  { label: "REDEN", href: "/reden" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "SDK", href: "/docs/sdk" },
  { label: "API", href: "/docs/api" },
];

const developerLinks = [
  { label: "Documentation", href: "/docs" },
  { label: "Getting Started", href: "/docs/getting-started" },
  { label: "API Reference", href: "/docs/api" },
  { label: "Changelog", href: "/docs/changelog" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Security", href: "/security" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-[#737373]">
        {title}
      </h3>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-[#a3a3a3] transition-colors duration-200 hover:text-[#f0f4ff]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#000000]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="PRETHIM home"
              className="inline-flex items-center"
            >
              <img
                src="/icon.png"
                alt="PRETHIM"
                className="h-9 w-9 object-contain"
              />
            </Link>

            <p className="mt-5 text-sm leading-6 text-[#737373]">
              Adaptive decision infrastructure for continuous trajectory
              evaluation and real-time behavioral optimization.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 border border-white/[0.08] bg-white/[0.02] px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b87333]" />
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#737373]">
                PRETHIM
              </span>
            </div>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Developers" links={developerLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#525252]">
            © {new Date().getFullYear()} PRETHIM. All rights reserved.
          </p>

          <p className="text-xs text-[#525252]">
            Adaptive Decision Infrastructure
          </p>
        </div>
      </div>
    </footer>
  );
}