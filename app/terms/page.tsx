import Link from "next/link";

export const metadata = {
  title: "Terms of Service | PRETHIM",
  description: "Terms governing access to and use of PRETHIM websites, software, APIs, and services.",
};

const sections = [
  {
    title: "1. About these terms",
    paragraphs: [
      "These Terms of Service ("Terms") govern your access to and use of the websites, software, APIs, documentation, and services made available by PRETHIM ("PRETHIM", "we", "us", or "our").",
      "By accessing or using a PRETHIM service, you agree to these Terms. If you use a service for a company or another organisation, you confirm that you have authority to accept these Terms on its behalf. If you do not agree, do not use the service.",
      "A product may have additional terms, a product-specific privacy notice, or a separate written agreement. If those terms conflict with these Terms, the product-specific terms or signed agreement will govern the relevant service to the extent of the conflict."
    ],
  },
  {
    title: "2. Eligibility and accounts",
    paragraphs: [
      "You must be legally able to enter into a binding agreement to use PRETHIM services. You may use a service on behalf of a business only with the authority to do so.",
      "You are responsible for keeping account credentials and access tokens confidential, maintaining accurate account information, and activity carried out through your account. Notify us promptly if you believe an account or credential has been compromised.",
      "Do not share credentials in a way that gives unauthorised people access to an account or service. We may take reasonable steps to protect accounts and services where we detect suspected misuse."
    ],
  },
  {
    title: "3. Permitted use",
    paragraphs: [
      "You may use PRETHIM services only for lawful purposes and in accordance with applicable documentation, these Terms, and any service-specific conditions.",
      "You must not use a service to violate another person's rights, break applicable law, transmit malicious code, interfere with service operation, attempt unauthorised access, bypass usage limits or security controls, or probe systems without permission.",
      "You must not use PRETHIM services to send unlawful, deceptive, unsolicited, or unauthorised communications, or to process information you have no lawful right to provide. You are responsible for obtaining any notices, permissions, consents, and other legal bases required for your use of a service."
    ],
  },
  {
    title: "4. APIs, integrations, and developers",
    paragraphs: [
      "API access, SDKs, integration credentials, rate limits, and technical requirements may vary by service. You must use credentials only for the purpose and environment for which they were issued, protect secret keys, and promptly revoke or rotate credentials that may have been exposed.",
      "If you are a developer, agency, contractor, or other intermediary connecting a PRETHIM service for a client, you must have that client's authority to do so. You must clearly identify the business on whose behalf you act, use only the access the client has authorised, and comply with the client's lawful instructions.",
      "Unless a separate written agreement says otherwise, the client retains its rights in its own business data and remains responsible for its storefront, customer relationships, notices, permissions, and decisions about how the service is used. You must not claim ownership of a client's account or data merely because you performed the integration.",
      "A client may change permissions or revoke an integration. You must respect that decision and stop accessing the client's systems or data when your authority ends. You are responsible for your own acts and omissions and for any commitments you make to a client."
    ],
  },
  {
    title: "5. Customer responsibilities and decisions",
    paragraphs: [
      "You are responsible for evaluating whether a PRETHIM service is suitable for your use case, configuring it correctly, reviewing its outputs, and maintaining any systems and records that remain under your control.",
      "Where a service provides analysis, recommendations, classifications, predictions, or automated actions, those outputs are tools to support your operations; they are not a guarantee of a particular business, financial, legal, or commercial result. You remain responsible for decisions made by you or your organisation, including decisions that affect customers.",
      "You must not rely on a service as a substitute for professional advice where professional review is required. You should test integrations and material changes in an appropriate environment before relying on them in production."
    ],
  },
  {
    title: "6. Fees, plans, and payment",
    paragraphs: [
      "Some services may be free, paid, usage-based, or offered under a separate commercial agreement. The applicable price, billing cycle, usage limits, taxes, and payment terms will be shown at the point of purchase or in the relevant agreement.",
      "You agree to pay charges properly incurred under the plan or agreement you select. Unless applicable law or the relevant offer requires otherwise, fees already paid are non-refundable. Any trial, credit, discount, or introductory offer may be subject to additional conditions.",
      "We will not treat a price or plan as agreed merely because it has been discussed informally. Where a service's pricing or limits change, the change will apply as described in the relevant notice, renewal, or agreement."
    ],
  },
  {
    title: "7. Intellectual property and feedback",
    paragraphs: [
      "PRETHIM and its licensors retain their rights in PRETHIM services, software, APIs, documentation, branding, and related materials. These Terms grant you a limited, non-exclusive, non-transferable right to use the relevant service for its intended purpose while you comply with these Terms. No other rights are transferred to you.",
      "You retain rights in content and data that you lawfully provide to a service. You grant PRETHIM only the permissions reasonably necessary to host, process, transmit, and otherwise use that material to provide, maintain, secure, and support the service, in accordance with the applicable agreement and privacy notice.",
      "If you provide suggestions or feedback, you permit us to use them without restriction or payment, provided that this does not transfer ownership of your confidential information or personal data."
    ],
  },
  {
    title: "8. Third-party services",
    paragraphs: [
      "A PRETHIM service may connect to or depend on third-party platforms, hosting providers, payment services, APIs, or software. Those services may have their own terms, privacy practices, availability limits, and charges.",
      "PRETHIM does not control third-party services and is not responsible for their independent acts, omissions, or changes. You are responsible for reviewing and complying with the terms that apply to services you choose to connect."
    ],
  },
  {
    title: "9. Availability, changes, and suspension",
    paragraphs: [
      "We may maintain, update, modify, or discontinue parts of a service as it develops. We do not promise uninterrupted availability or that every feature will remain unchanged. Where reasonably practicable, we will seek to avoid unnecessary disruption.",
      "We may restrict or suspend access where reasonably necessary to protect users, investigate suspected misuse, address a security or operational risk, comply with law, enforce these Terms, or respond to a third-party platform restriction. Where appropriate and lawful, we will provide notice and an opportunity to address the issue.",
      "You may stop using a service at any time. Ending use does not remove obligations or liabilities that arose before termination or provisions that by their nature should continue."
    ],
  },
  {
    title: "10. Confidentiality and privacy",
    paragraphs: [
      "Each party should protect confidential information received from the other and use it only for the purpose for which it was disclosed. This does not apply to information that is public through no breach, already lawfully known, independently developed, or lawfully received from another source.",
      "Our handling of personal information is described in the PRETHIM Privacy Policy. A product-specific notice or data processing agreement may apply where a service processes information on behalf of a customer. You must not submit personal or confidential information unless you are authorised to do so."
    ],
  },
  {
    title: "11. Disclaimers",
    paragraphs: [
      "To the fullest extent permitted by law, PRETHIM services are provided on an "as available" and "as is" basis. We do not warrant that a service will be uninterrupted, error-free, compatible with every system, or suitable for every purpose.",
      "To the fullest extent permitted by law, we disclaim implied warranties that cannot otherwise be excluded, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement. Nothing in these Terms excludes a warranty or right that cannot lawfully be excluded."
    ],
  },
  {
    title: "12. Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by applicable law, PRETHIM will not be liable for indirect, incidental, special, consequential, exemplary, or punitive loss, or for loss of profits, revenue, business opportunity, goodwill, anticipated savings, or data, arising from or connected with use of a service.",
      "To the fullest extent permitted by law, PRETHIM's total liability for claims arising from a service will be limited to the amount you paid PRETHIM for that service during the three months immediately before the event giving rise to the claim. If you used the service without charge, the limit will be the minimum amount permitted by applicable law.",
      "These limits do not apply to liability that cannot lawfully be limited or excluded. Nothing in these Terms removes any mandatory consumer or statutory protection that applies to you."
    ],
  },
  {
    title: "13. Indemnity",
    paragraphs: [
      "To the extent permitted by law, you are responsible for claims, losses, and reasonable costs arising from your unlawful use of a service, your breach of these Terms, your infringement of another person's rights, or data and instructions you provide without the necessary authority. This does not apply to the extent a claim is caused by PRETHIM's own breach or conduct for which PRETHIM is legally responsible."
    ],
  },
  {
    title: "14. Governing law and disputes",
    paragraphs: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles, except where mandatory law requires otherwise.",
      "The parties will first try to resolve a dispute through good-faith discussions. If it cannot be resolved, it may be brought before a court of competent jurisdiction in Nigeria, subject to any mandatory venue or dispute-resolution rights under applicable law."
    ],
  },
  {
    title: "15. Changes to these Terms",
    paragraphs: [
      "We may revise these Terms to reflect changes to our services, business, or legal obligations. We will update the effective date when we publish a revision. Where required by law, or where a change materially affects an existing paid service, we will provide additional notice.",
      "Your continued use of the relevant service after revised Terms take effect constitutes acceptance where that acceptance is recognised by applicable law. If you do not agree to a change, stop using the affected service."
    ],
  },
  {
    title: "16. General",
    paragraphs: [
      "If a provision of these Terms is found unenforceable, the remaining provisions will continue to apply to the extent permitted by law. A failure to enforce a provision is not a waiver of the right to enforce it later.",
      "You may not transfer your rights or obligations under these Terms without our prior written consent, except where applicable law permits otherwise. PRETHIM may transfer its rights and obligations as part of a reorganisation, merger, or transfer of the relevant service, subject to applicable law.",
      "These Terms and any applicable product-specific terms or signed agreement form the agreement between you and PRETHIM concerning the relevant service. They do not create a partnership, employment, agency, or joint venture relationship."
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#14110D] text-[#81786B] selection:bg-[#C97C3E]/30 selection:text-[#ECE4D8]">
      <header className="border-b border-[#29231C]">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight text-[#ECE4D8] hover:text-[#C97C3E]">
            PRETHIM
          </Link>
          <nav aria-label="Legal navigation" className="flex gap-5 text-sm">
            <Link href="/privacy" className="hover:text-[#ECE4D8]">Privacy</Link>
            <Link href="/terms" aria-current="page" className="text-[#ECE4D8]">Terms</Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="border-b border-[#29231C] pb-8">
          <p className="text-xs text-[#C97C3E]">PRETHIM / LEGAL</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#ECE4D8] sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-sm leading-7">
            These terms set out the basic rules for using PRETHIM websites, software, APIs, and services.
          </p>
          <p className="mt-4 text-xs text-[#81786B]">Effective date: 27 October 2026</p>
        </div>

        <div className="divide-y divide-[#29231C]">
          {sections.map((section) => (
            <section key={section.title} className="py-7">
              <h2 className="text-lg font-semibold text-[#ECE4D8]">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-[#29231C] pt-6 text-sm">
          <p>For questions about these Terms, use the contact channel provided with the PRETHIM service you use.</p>
          <div className="mt-4 flex gap-5 text-xs">
            <Link href="/" className="hover:text-[#ECE4D8]">PRETHIM</Link>
            <Link href="/privacy" className="hover:text-[#ECE4D8]">Privacy Policy</Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
