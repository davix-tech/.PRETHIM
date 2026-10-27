import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | PRETHIM",
  description:
    "How PRETHIM handles personal information across its website, software, APIs, and services.",
};

const sections = [
  {
    title: "1. Who this policy covers",
    paragraphs: [
      "This Privacy Policy explains how PRETHIM ("PRETHIM", "we", "us", or "our") collects, uses, stores, and shares personal information when you visit our website, contact us, create an account, use our software, or interact with our APIs and other services.",
      "Some PRETHIM products may have a separate privacy notice describing product-specific data and processing. That notice supplements this policy and should be read alongside it.",
      "When an organisation uses a PRETHIM service to process personal information about its own customers, that organisation may decide why and how the information is processed. In those cases, the organisation is responsible for its own legal obligations, and PRETHIM's role depends on the service and the applicable agreement."
    ],
  },
  {
    title: "2. Information we collect",
    paragraphs: [
      "The information collected depends on how you interact with PRETHIM, the features you use, and the information you choose to provide. It may include the following categories."
    ],
    items: [
      ["Contact and account details", "such as your name, email address, organisation name, account identifiers, and information used to create, authenticate, and manage an account."],
      ["Service and integration details", "such as API requests, integration identifiers, configuration settings, connection status, usage records, and support correspondence."],
      ["Technical information", "such as IP address, browser or device information, log entries, timestamps, diagnostic details, and information needed to investigate errors or protect a service."],
      ["Information you submit", "such as messages, feedback, files, or other material you choose to provide when using a service or contacting us."],
      ["Transaction information", "where a paid service is offered, such as plan, billing status, transaction references, and records needed to administer payments. Payment details may be handled by the relevant payment provider."]
    ],
  },
  {
    title: "3. Information received through customer integrations",
    paragraphs: [
      "A PRETHIM product may receive information from a business or an application that the business connects. The categories depend on that product, the business's configuration, and the events or fields it sends.",
      "PRETHIM does not intend this general policy to be a complete description of every product's data collection. The applicable product privacy notice and customer agreement should identify the relevant data flows and responsibilities.",
      "If you are an end user of a business that uses PRETHIM technology, that business is usually the first point of contact for questions about information collected through its website or service. We will direct requests to the relevant business when appropriate and assist as required by law and our agreement."
    ],
  },
  {
    title: "4. How we use information",
    paragraphs: [
      "We may use information to provide and operate services; create and manage accounts; authenticate requests; process integrations; respond to questions; provide technical support; maintain service quality; diagnose errors; monitor usage and enforce applicable limits; detect fraud, abuse, and security incidents; process payments; comply with legal obligations; and establish or defend legal claims.",
      "Where permitted by law, we may use service usage and diagnostic information to understand reliability and improve our services. We will not use personal information for a materially different purpose where applicable law requires additional notice or permission and that requirement has not been met."
    ],
  },
  {
    title: "5. Legal grounds for processing",
    paragraphs: [
      "Where applicable data-protection law requires a lawful basis, the basis depends on the purpose and context. It may include performing a contract or taking steps requested before a contract, complying with a legal obligation, pursuing legitimate interests that are not overridden by individual rights, or consent where consent is required or chosen.",
      "Where we rely on consent, you may withdraw it as permitted by law. Withdrawal does not make processing carried out before withdrawal unlawful."
    ],
  },
  {
    title: "6. When information is shared",
    paragraphs: [
      "We may share information with service providers that support hosting, infrastructure, analytics, communications, payment processing, customer support, or security, to the extent needed for their work. Those providers may process information under their own terms or under contractual arrangements with PRETHIM, depending on the service.",
      "We may disclose information where required by law, valid legal process, or a lawful request from a public authority; where reasonably necessary to protect people, rights, systems, or property; or in connection with a merger, financing, restructuring, or transfer of a business, subject to applicable law.",
      "We do not sell personal information as that term is defined under laws that apply to such activity. We do not disclose information to third parties for their independent purposes except as described in this policy, with your direction, or as otherwise permitted or required by law."
    ],
  },
  {
    title: "7. Retention",
    paragraphs: [
      "We keep personal information for as long as reasonably necessary for the purpose for which it was collected, including to provide services, maintain business and security records, resolve disputes, enforce agreements, and meet legal obligations.",
      "Retention periods vary by data type, service, configuration, and legal requirements. When information is no longer required, we may delete it, anonymise it, or securely dispose of it where appropriate. Copies may remain in routine backups for a limited period before being overwritten or removed."
    ],
  },
  {
    title: "8. Security",
    paragraphs: [
      "We take steps intended to protect information against unauthorised access, loss, misuse, alteration, and disclosure. No method of transmission, storage, or electronic processing is completely secure, and we cannot guarantee absolute security.",
      "You are responsible for protecting your account, API keys, devices, and credentials, and for limiting access to people who need it. If you suspect unauthorised access involving a PRETHIM account or integration, contact us through the support channel associated with that service."
    ],
  },
  {
    title: "9. International processing",
    paragraphs: [
      "PRETHIM and its service providers may process or store information in countries other than the country where you live. Data-protection laws in those countries may differ from the laws where you are located.",
      "Where applicable law requires safeguards for international transfers, we will seek to use an appropriate transfer mechanism or other safeguard for the relevant processing."
    ],
  },
  {
    title: "10. Your rights and choices",
    paragraphs: [
      "Depending on your location and the circumstances, applicable law may give you the right to request access to personal information, correction of inaccurate information, deletion, restriction or objection to certain processing, portability, or withdrawal of consent. You may also have the right to complain to a relevant data-protection authority.",
      "To protect information, we may need to verify your identity before acting on a request. Some rights are subject to legal exceptions. If PRETHIM processes information on behalf of a business, you may need to contact that business directly; we will assist it where required by law and the relevant agreement.",
      "You can stop using a service or close an account where the service provides that option. Some records may need to be retained for legitimate operational or legal reasons."
    ],
  },
  {
    title: "11. Cookies and similar technologies",
    paragraphs: [
      "Our website or services may use cookies or similar technologies where needed for essential functions, session management, preferences, security, or other purposes described by the relevant service. The technologies used may differ between products.",
      "You can control cookies through your browser settings. Blocking certain cookies may affect how a website or service works. Where required, we will provide additional information or obtain consent for non-essential technologies."
    ],
  },
  {
    title: "12. Children's privacy",
    paragraphs: [
      "PRETHIM services are designed primarily for businesses, developers, and organisations and are not directed to children. We do not knowingly seek to collect personal information directly from children in a manner that violates applicable law.",
      "If you believe a child has provided personal information to PRETHIM, contact us through the support channel associated with the relevant service so the matter can be reviewed."
    ],
  },
  {
    title: "13. Third-party websites and services",
    paragraphs: [
      "Our website or services may link to or integrate with third-party websites, software, or platforms. Their privacy practices are governed by their own policies, and PRETHIM is not responsible for how they independently collect or use information. Review their policies before providing information to them."
    ],
  },
  {
    title: "14. Changes to this policy",
    paragraphs: [
      "We may update this policy as our services, processing activities, or legal obligations change. The effective date below indicates when this version was published. Where a change is material, we may provide additional notice where appropriate or required by law."
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#14110D] text-[#81786B] selection:bg-[#C97C3E]/30 selection:text-[#ECE4D8]">
      <header className="border-b border-[#29231C]">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight text-[#ECE4D8] hover:text-[#C97C3E]">
            PRETHIM
          </Link>
          <nav aria-label="Legal navigation" className="flex gap-5 text-sm">
            <Link href="/privacy" aria-current="page" className="text-[#ECE4D8]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#ECE4D8]">Terms</Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="border-b border-[#29231C] pb-8">
          <p className="text-xs text-[#C97C3E]">PRETHIM / LEGAL</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#ECE4D8] sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7">
            This policy explains how PRETHIM handles personal information across its website, software, APIs, and services.
          </p>
          <p className="mt-4 text-xs text-[#81786B]">Effective date: 27 October 2026</p>
        </div>

        <div className="divide-y divide-[#29231C]">
          {sections.map((section) => (
            <section key={section.title} className="py-7">
              <h2 className="text-lg font-semibold text-[#ECE4D8]">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.items.map(([label, detail]) => (
                      <li key={label}><strong className="font-medium text-[#ECE4D8]">{label}:</strong> {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-[#29231C] pt-6 text-sm">
          <p>
            For privacy questions or requests, use the contact channel provided with the PRETHIM service you use. If your request concerns information handled for a business using a PRETHIM product, contact that business first where appropriate.
          </p>
          <div className="mt-4 flex gap-5 text-xs">
            <Link href="/" className="hover:text-[#ECE4D8]">PRETHIM</Link>
            <Link href="/terms" className="hover:text-[#ECE4D8]">Terms of Service</Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
