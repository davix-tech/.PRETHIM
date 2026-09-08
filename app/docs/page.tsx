import Link from "next/link";
import {
ArrowRight,
ArrowUpRight,
BookOpen,
Code2,
Database,
Gauge,
GitBranch,
LockKeyhole,
Terminal,
} from "lucide-react";

export const metadata = {
title: "Documentation | PRETHIM",
description:
"Technical documentation for PRETHIM and REDEN, adaptive decision infrastructure for real-time software.",
};

const SECTIONS = [
{
number: "01",
icon: BookOpen,
label: "START HERE",
title: "Introduction",
description:
"Understand PRETHIM, REDEN, and the decision infrastructure behind adaptive software.",
href: "/docs/reden",
},
{
number: "02",
icon: Terminal,
label: "INTEGRATION",
title: "Getting started",
description:
"Connect your application to REDEN and begin sending real-time behavioral signals.",
href: "/docs/reden",
},
{
number: "03",
icon: Code2,
label: "DEVELOPER",
title: "SDK",
description:
"Install the REDEN SDK, authenticate your storefront, and start collecting events.",
href: "/docs/reden",
},
{
number: "04",
icon: Database,
label: "REFERENCE",
title: "API",
description:
"Explore REDEN endpoints, authentication requirements, events, decisions, and outcomes.",
href: "/docs/reden",
},
{
number: "05",
icon: GitBranch,
label: "ARCHITECTURE",
title: "Integration flow",
description:
"Learn how PRETHIM, REDEN, your application, and storefront telemetry work together.",
href: "/docs/reden",
},
{
number: "06",
icon: Gauge,
label: "INTELLIGENCE",
title: "Decision engine",
description:
"Understand evaluation, action selection, outcomes, and the continuous decision loop.",
href: "/docs/reden",
},
];

const QUICK_LINKS = [
{
label: "REDEN",
description: "Decision infrastructure",
href: "/docs/reden",
},
{
label: "Getting started",
description: "First integration",
href: "/docs/reden",
},
{
label: "API reference",
description: "Endpoints & requests",
href: "/docs/reden",
},
];

export default function DocsPage() {
return ( <main className="min-h-screen overflow-x-hidden bg-[#14110D] text-[#81786B] selection:bg-[#C97C3E]/30 selection:text-[#ECE4D8]">
{/* =========================================================
HEADER
========================================================= */}

```
  <header className="border-b border-[#252019]">
    <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8 lg:px-10">
      <Link
        href="/"
        aria-label="PRETHIM home"
        className="group flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#14110D]"
      >
        <span className="text-sm font-semibold tracking-[-0.02em] text-[#ECE4D8] transition-colors duration-300 group-hover:text-[#C97C3E]">
          PRETHIM
        </span>
      </Link>

      <nav
        aria-label="Documentation navigation"
        className="flex items-center gap-5 sm:gap-8"
      >
        <Link
          href="/"
          className="text-[13px] text-[#746C60] outline-none transition-colors duration-300 hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
        >
          Home
        </Link>

        <Link
          href="/signin"
          className="text-[13px] text-[#746C60] outline-none transition-colors duration-300 hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
        >
          Sign in
        </Link>

        <Link
          href="/signin"
          className="inline-flex h-9 items-center gap-2 border border-[#352D24] px-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#ECE4D8] outline-none transition-colors hover:border-[#C97C3E]/60 focus-visible:border-[#C97C3E] focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110D]"
        >
          Get started
          <ArrowUpRight
            aria-hidden="true"
            className="h-3 w-3"
          />
        </Link>
      </nav>
    </div>
  </header>

  {/* =========================================================
      HERO
  ========================================================= */}

  <section
    aria-labelledby="docs-heading"
    className="border-b border-[#252019]"
  >
    <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div>
          <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.18em] text-[#71685B]">
            <span
              aria-hidden="true"
              className="h-px w-7 bg-[#C97C3E]"
            />
            DEVELOPER DOCUMENTATION
          </div>

          <p className="mt-8 text-[10px] font-semibold tracking-[0.16em] text-[#575046]">
            PRETHIM / DOCS
          </p>
        </div>

        <div>
          <h1
            id="docs-heading"
            className="max-w-[850px] text-[3.1rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#ECE4D8] sm:text-5xl lg:text-[5.4rem]"
          >
            Build with
            <br />
            adaptive
            <br />
            <span className="text-[#C97C3E]">
              decisions.
            </span>
          </h1>

          <p className="mt-9 max-w-[610px] text-base leading-[1.8] text-[#7D756A] sm:text-lg">
            Technical documentation for PRETHIM and REDEN —
            infrastructure for software that evaluates context,
            takes action, and learns from outcomes.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/docs/reden"
              className="group inline-flex h-11 items-center gap-3 bg-[#ECE4D8] px-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#14110D] outline-none transition-colors hover:bg-[#C97C3E] focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110D]"
            >
              Start with REDEN
              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/"
              className="group inline-flex h-11 items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#746C60] outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
            >
              Explore PRETHIM
              <ArrowUpRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* =========================================================
      QUICK ACCESS
  ========================================================= */}

  <section
    aria-labelledby="quick-access-heading"
    className="border-b border-[#252019] bg-[#16120F]"
  >
    <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 lg:px-10">
      <div className="grid gap-px overflow-hidden border border-[#29231C] bg-[#29231C] sm:grid-cols-3">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group bg-[#16120F] p-6 outline-none transition-colors duration-300 hover:bg-[#1B1712] focus-visible:bg-[#1B1712]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#ECE4D8]">
                {item.label}
              </span>

              <ArrowUpRight
                aria-hidden="true"
                className="h-3.5 w-3.5 text-[#575046] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#C97C3E]"
              />
            </div>

            <p className="mt-2 text-xs text-[#71685B]">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  </section>

  {/* =========================================================
      DOCUMENTATION SECTIONS
  ========================================================= */}

  <section
    aria-labelledby="documentation-sections-heading"
    className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36"
  >
    <div className="mb-14 grid gap-8 lg:grid-cols-[0.5fr_1.5fr] lg:gap-24">
      <div>
        <p
          id="documentation-sections-heading"
          className="text-[10px] font-semibold tracking-[0.18em] text-[#C97C3E]"
        >
          DOCUMENTATION
        </p>
      </div>

      <div>
        <h2 className="max-w-[760px] text-3xl font-medium leading-[1.08] tracking-[-0.04em] text-[#ECE4D8] sm:text-4xl lg:text-5xl">
          Everything you need to integrate the decision layer.
        </h2>

        <p className="mt-6 max-w-[600px] text-base leading-[1.8] text-[#7D756A]">
          Start with the fundamentals, then move into the
          integration and API details required to connect
          REDEN to your application.
        </p>
      </div>
    </div>

    <div className="border-t border-[#29231C]">
      {SECTIONS.map((section) => {
        const Icon = section.icon;

        return (
          <Link
            key={section.number}
            href={section.href}
            className="group grid gap-8 border-b border-[#29231C] py-10 outline-none transition-colors duration-300 hover:bg-[#16120F] focus-visible:bg-[#16120F] sm:grid-cols-[100px_1fr_auto] sm:items-center sm:gap-10"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold tracking-[-0.03em] text-[#575046]">
                {section.number}
              </span>

              <Icon
                aria-hidden="true"
                className="h-4 w-4 text-[#575046] transition-colors duration-300 group-hover:text-[#C97C3E]"
              />
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
                {section.label}
              </div>

              <h3 className="text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8] transition-transform duration-300 group-hover:translate-x-1">
                {section.title}
              </h3>

              <p className="mt-3 max-w-[600px] text-sm leading-[1.75] text-[#71685B]">
                {section.description}
              </p>
            </div>

            <div className="hidden sm:block">
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 text-[#575046] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#C97C3E]"
              />
            </div>
          </Link>
        );
      })}
    </div>
  </section>

  {/* =========================================================
      ARCHITECTURE STATEMENT
  ========================================================= */}

  <section
    aria-labelledby="architecture-heading"
    className="border-y border-[#252019] bg-[#16120F]"
  >
    <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36">
      <div className="grid gap-12 lg:grid-cols-[0.5fr_1.5fr] lg:gap-24">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#71685B]">
            THE LOOP
          </p>
        </div>

        <div>
          <h2
            id="architecture-heading"
            className="max-w-[800px] text-[2.7rem] font-semibold leading-[1] tracking-[-0.05em] text-[#ECE4D8] sm:text-5xl lg:text-[4.7rem]"
          >
            Signal.
            <br />
            Context.
            <br />
            <span className="text-[#C97C3E]">
              Decision.
            </span>
          </h2>

          <p className="mt-9 max-w-[590px] text-base leading-[1.8] text-[#7D756A]">
            REDEN receives real-time signals, evaluates them
            against context, selects an appropriate action,
            and uses the resulting outcome as a future signal.
          </p>

          <div className="mt-10 grid max-w-[700px] gap-px border border-[#29231C] bg-[#29231C] sm:grid-cols-3">
            <div className="bg-[#16120F] p-5">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#7C93A6]">
                01 / EVALUATED
              </p>
              <p className="mt-3 text-xs leading-[1.7] text-[#71685B]">
                Understand what is happening now.
              </p>
            </div>

            <div className="bg-[#16120F] p-5">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#C97C3E]">
                02 / ACTIONED
              </p>
              <p className="mt-3 text-xs leading-[1.7] text-[#71685B]">
                Commit when the value is there.
              </p>
            </div>

            <div className="bg-[#16120F] p-5">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[#7FA382]">
                03 / COMPLETED
              </p>
              <p className="mt-3 text-xs leading-[1.7] text-[#71685B]">
                Learn from what happened.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* =========================================================
      SECURITY
  ========================================================= */}

  <section
    aria-labelledby="security-heading"
    className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36"
  >
    <div className="grid gap-10 lg:grid-cols-[0.5fr_1.5fr] lg:gap-24">
      <div className="flex items-start">
        <LockKeyhole
          aria-hidden="true"
          className="h-5 w-5 text-[#C97C3E]"
        />
      </div>

      <div>
        <p className="text-[10px] font-semibold tracking-[0.18em] text-[#71685B]">
          SECURITY
        </p>

        <h2
          id="security-heading"
          className="mt-5 max-w-[700px] text-3xl font-medium leading-[1.1] tracking-[-0.04em] text-[#ECE4D8] sm:text-4xl"
        >
          Built with clear boundaries.
        </h2>

        <p className="mt-6 max-w-[600px] text-base leading-[1.8] text-[#7D756A]">
          PRETHIM is designed around authenticated integrations,
          tenant-specific decisioning, controlled access, and
          auditable system behavior.
        </p>

        <Link
          href="/security"
          className="group mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#ECE4D8] outline-none transition-colors hover:text-[#C97C3E] focus-visible:text-[#C97C3E]"
        >
          Read security documentation
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </div>
  </section>

  {/* =========================================================
      CTA
  ========================================================= */}

  <section
    aria-labelledby="docs-cta-heading"
    className="border-t border-[#252019]"
  >
    <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36">
      <div className="max-w-[850px]">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-[#C97C3E]">
          READY
        </p>

        <h2
          id="docs-cta-heading"
          className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.05em] text-[#ECE4D8] sm:text-6xl lg:text-[5rem]"
        >
          Put decisions
          <br />
          into your software.
        </h2>

        <p className="mt-8 max-w-[500px] text-base leading-[1.75] text-[#7D756A]">
          Start with REDEN and connect adaptive decision-making
          to the products you already build.
        </p>

        <Link
          href="/docs/reden"
          className="group mt-9 inline-flex h-11 items-center gap-3 bg-[#ECE4D8] px-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#14110D] outline-none transition-colors hover:bg-[#C97C3E] focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110D]"
        >
          Read REDEN docs
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </div>
  </section>

  {/* =========================================================
      PAGE FOOTER
  ========================================================= */}

  <footer className="border-t border-[#252019]">
    <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center lg:px-10">
      <div>
        <Link
          href="/"
          aria-label="PRETHIM home"
          className="text-sm font-semibold tracking-[-0.02em] text-[#ECE4D8] outline-none transition-colors hover:text-[#C97C3E] focus-visible:text-[#C97C3E]"
        >
          PRETHIM
        </Link>

        <p className="mt-3 text-xs text-[#575046]">
          Adaptive decision infrastructure.
        </p>
      </div>

      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap gap-x-7 gap-y-3 text-xs text-[#575046]"
      >
        <Link
          href="/docs"
          className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
        >
          Docs
        </Link>

        <Link
          href="/signin"
          className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
        >
          Sign in
        </Link>

        <Link
          href="/privacy"
          className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
        >
          Privacy
        </Link>

        <Link
          href="/terms"
          className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
        >
          Terms
        </Link>

        <span>© {new Date().getFullYear()} PRETHIM</span>
      </nav>
    </div>
  </footer>
</main>


);
}
