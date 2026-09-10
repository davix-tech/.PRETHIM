import Link from "next/link";

export const metadata = {
  title: "Privacy | PRETHIM",
  description:
    "Privacy policy for PRETHIM and REDEN, including how we collect, use, protect, and retain information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#14110D] text-[#81786B] selection:bg-[#C97C3E]/30 selection:text-[#ECE4D8]">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="border-b border-[#252019]">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            aria-label="PRETHIM home"
            className="text-sm font-semibold tracking-[-0.02em] text-[#ECE4D8] outline-none transition-colors hover:text-[#C97C3E] focus-visible:text-[#C97C3E]"
          >
            PRETHIM
          </Link>

          <nav
            aria-label="Privacy navigation"
            className="flex items-center gap-5 sm:gap-8"
          >
            <Link
              href="/docs"
              className="text-[13px] text-[#746C60] outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
            >
              Docs
            </Link>

            <Link
              href="/security"
              className="text-[13px] text-[#746C60] outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
            >
              Security
            </Link>

            <Link
              href="/terms"
              className="text-[13px] text-[#746C60] outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
            >
              Terms
            </Link>
          </nav>
        </div>
      </header>

      {/* =========================================================
          CONTENT
      ========================================================= */}

      <article className="mx-auto max-w-[900px] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-32">
        <div className="border-b border-[#29231C] pb-12">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#C97C3E]">
            LEGAL / PRIVACY
          </p>

          <h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-[#ECE4D8] sm:text-6xl">
            Privacy Policy
          </h1>

          <p className="mt-7 max-w-[650px] text-base leading-[1.8] text-[#7D756A]">
            This Privacy Policy explains how PRETHIM handles information
            collected through its websites, applications, services, and
            REDEN decision infrastructure.
          </p>

          <p className="mt-6 text-xs text-[#575046]">
            Effective date: September 5, 2026
          </p>
        </div>

        <div className="divide-y divide-[#29231C]">
          {/* =======================================================
              01
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              01 / SCOPE
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              About this policy
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                This Privacy Policy applies to PRETHIM and the services
                operated by PRETHIM, including REDEN, its adaptive decision
                infrastructure.
              </p>

              <p>
                It describes what information may be collected, why it is
                processed, how it is protected, and the choices available to
                individuals whose information we process.
              </p>

              <p>
                Where PRETHIM processes information on behalf of a merchant or
                other customer, that customer may determine the purposes and
                means of certain processing. In those circumstances, the
                customer may have additional responsibilities toward the
                individuals whose information it provides to the service.
              </p>
            </div>
          </section>

          {/* =======================================================
              02
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              02 / INFORMATION
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Information we may process
            </h2>

            <div className="mt-6 space-y-6 text-sm leading-[1.85] text-[#7D756A]">
              <div>
                <h3 className="font-medium text-[#ECE4D8]">
                  Account and contact information
                </h3>

                <p className="mt-2">
                  Depending on how you use PRETHIM, this may include your name,
                  email address, organization details, account identifiers, and
                  information necessary to authenticate and manage your
                  account.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[#ECE4D8]">
                  Integration information
                </h3>

                <p className="mt-2">
                  When a customer integrates REDEN, we may process information
                  required to establish and maintain the integration, such as
                  site identifiers, public integration credentials, connection
                  status, configuration information, and related operational
                  records.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[#ECE4D8]">
                  Storefront and behavioral signals
                </h3>

                <p className="mt-2">
                  REDEN may receive events and behavioral signals from an
                  integrated application or storefront. Depending on the
                  customer&apos;s implementation, these signals may include
                  interactions such as page activity, product interactions,
                  cart activity, purchase events, and other events configured
                  by the customer.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[#ECE4D8]">
                  Technical and security information
                </h3>

                <p className="mt-2">
                  We may process information such as IP addresses, browser and
                  device characteristics, request metadata, timestamps, logs,
                  authentication events, and other information required to
                  operate, secure, troubleshoot, and improve the services.
                </p>
              </div>
            </div>
          </section>

          {/* =======================================================
              03
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              03 / USE
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              How we use information
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>We may use information to:</p>

              <ul className="list-disc space-y-3 pl-5 marker:text-[#C97C3E]">
                <li>provide and operate PRETHIM and REDEN;</li>
                <li>authenticate users and integrations;</li>
                <li>evaluate signals and generate configured decisions;</li>
                <li>maintain tenant and connection boundaries;</li>
                <li>monitor system performance and reliability;</li>
                <li>detect, investigate, and prevent abuse or security incidents;</li>
                <li>provide support and communicate about the services;</li>
                <li>maintain operational and audit records;</li>
                <li>comply with applicable legal obligations; and</li>
                <li>improve the reliability and functionality of our services.</li>
              </ul>

              <p>
                We do not sell personal information to third parties.
              </p>
            </div>
          </section>

          {/* =======================================================
              04
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              04 / REDEN
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              REDEN and decision processing
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                REDEN is designed to evaluate application and storefront
                signals in context and determine configured actions.
              </p>

              <p>
                Depending on the integration, information may move through
                stages such as signal collection, contextual evaluation,
                decision selection, action execution, and outcome recording.
              </p>

              <p>
                Customers are responsible for configuring their integrations
                appropriately and for ensuring that their use of REDEN is
                consistent with applicable privacy and data-protection
                requirements.
              </p>
            </div>
          </section>

          {/* =======================================================
              05
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              05 / DISCLOSURE
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              When information may be shared
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                We may share information with service providers that help us
                operate PRETHIM, such as infrastructure, hosting,
                authentication, communications, monitoring, analytics, and
                security providers.
              </p>

              <p>
                Such providers receive information only as reasonably
                necessary to perform services for us or as otherwise permitted
                by applicable law.
              </p>

              <p>
                We may also disclose information where required to comply with
                applicable law, legal process, regulatory requirements, or to
                protect the rights, safety, security, and integrity of PRETHIM,
                our customers, users, or the public.
              </p>
            </div>
          </section>

          {/* =======================================================
              06
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              06 / SECURITY
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Security
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                We use technical and organizational measures designed to
                protect information against unauthorized access, alteration,
                disclosure, loss, or destruction.
              </p>

              <p>
                These measures may include access controls, authentication,
                tenant-specific authorization, encrypted communications,
                monitoring, logging, rate limiting, and operational controls
                appropriate to the services we provide.
              </p>

              <p>
                No internet-based service can guarantee absolute security.
                We therefore continuously assess and improve our security
                practices as the platform evolves.
              </p>

              <p>
                Additional information is available on our{" "}
                <Link
                  href="/security"
                  className="text-[#ECE4D8] underline decoration-[#C97C3E]/50 underline-offset-4 transition-colors hover:text-[#C97C3E]"
                >
                  Security page
                </Link>
                .
              </p>
            </div>
          </section>

          {/* =======================================================
              07
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              07 / RETENTION
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Data retention
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                We retain information only for as long as reasonably necessary
                for the purposes described in this policy, including providing
                the services, maintaining security, resolving disputes,
                enforcing agreements, and satisfying legal or regulatory
                obligations.
              </p>

              <p>
                Retention periods may vary depending on the type of information
                and the purpose for which it was collected.
              </p>

              <p>
                When information is no longer required, it may be deleted,
                anonymized, or otherwise disposed of in accordance with our
                operational and legal requirements.
              </p>
            </div>
          </section>

          {/* =======================================================
              08
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              08 / RIGHTS
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Your privacy rights
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                Depending on applicable law and the circumstances of the
                processing, individuals may have rights relating to their
                personal information, including rights to:
              </p>

              <ul className="list-disc space-y-3 pl-5 marker:text-[#C97C3E]">
                <li>receive information about how their data is processed;</li>
                <li>request access to personal information;</li>
                <li>request correction of inaccurate information;</li>
                <li>request deletion where applicable;</li>
                <li>object to or restrict certain processing;</li>
                <li>request portability where applicable; and</li>
                <li>withdraw consent where processing relies on consent.</li>
              </ul>

              <p>
                Where PRETHIM processes information on behalf of a customer,
                requests may need to be directed to that customer first.
                PRETHIM will assist the customer where appropriate and
                permitted by applicable law.
              </p>
            </div>
          </section>

          {/* =======================================================
              09
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              09 / COOKIES
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Cookies and similar technologies
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                PRETHIM may use cookies and similar technologies where
                necessary to operate websites and applications, maintain
                sessions, remember preferences, understand usage, and protect
                against abuse.
              </p>

              <p>
                The specific technologies used may vary between PRETHIM
                products and services.
              </p>

              <p>
                See our{" "}
                <Link
                  href="/cookies"
                  className="text-[#ECE4D8] underline decoration-[#C97C3E]/50 underline-offset-4 transition-colors hover:text-[#C97C3E]"
                >
                  Cookie Policy
                </Link>{" "}
                for more information.
              </p>
            </div>
          </section>

          {/* =======================================================
              10
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              10 / INTERNATIONAL PROCESSING
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Data transfers
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                PRETHIM and its service providers may process information in
                countries other than the country in which an individual is
                located.
              </p>

              <p>
                Where cross-border processing occurs, we seek to apply
                appropriate safeguards and comply with applicable
                data-protection requirements.
              </p>
            </div>
          </section>

          {/* =======================================================
              11
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              11 / CHILDREN
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Children&apos;s information
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                PRETHIM is intended for businesses, developers, and
                organizations. Our services are not directed toward children
                and we do not knowingly seek to collect personal information
                directly from children through our services.
              </p>

              <p>
                If you believe that a child&apos;s information has been
                provided to us improperly, please contact us so that the
                matter can be reviewed.
              </p>
            </div>
          </section>

          {/* =======================================================
              12
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              12 / CHANGES
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Changes to this policy
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                We may update this Privacy Policy as our services, practices,
                or legal obligations change.
              </p>

              <p>
                When we make material changes, we will update the effective
                date and may provide additional notice where appropriate.
              </p>
            </div>
          </section>

          {/* =======================================================
              13
          ======================================================= */}

          <section className="py-12">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#C97C3E]">
              13 / CONTACT
            </p>

            <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#ECE4D8]">
              Privacy requests
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#7D756A]">
              <p>
                If you have a privacy question or want to exercise an
                applicable data-protection right, contact PRETHIM through the
                official support or privacy contact associated with your
                account or service.
              </p>

              <p>
                Requests may require sufficient information to verify the
                requester&apos;s identity and protect against unauthorized
                disclosure.
              </p>
            </div>
          </section>
        </div>

        {/* =========================================================
            FOOTER NAV
        ========================================================= */}

        <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#29231C] pt-8 text-xs text-[#575046]">
          <Link
            href="/docs"
            className="transition-colors hover:text-[#ECE4D8]"
          >
            Documentation
          </Link>

          <Link
            href="/security"
            className="transition-colors hover:text-[#ECE4D8]"
          >
            Security
          </Link>

          <Link
            href="/cookies"
            className="transition-colors hover:text-[#ECE4D8]"
          >
            Cookies
          </Link>

          <Link
            href="/terms"
            className="transition-colors hover:text-[#ECE4D8]"
          >
            Terms
          </Link>

          <Link
            href="/"
            className="transition-colors hover:text-[#ECE4D8]"
          >
            PRETHIM
          </Link>
        </div>
      </article>
    </main>
  );
}
