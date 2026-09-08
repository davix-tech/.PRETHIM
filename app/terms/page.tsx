import Link from "next/link";

export const metadata = { title: "Terms | PRETHIM" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0705] px-6 py-16 text-[#9C9188]">
      <article className="mx-auto max-w-2xl leading-relaxed">
        <Link href="/" className="font-mono text-sm text-[#F5EFE6] hover:text-[#FF5A1F]">PRETHIM</Link>
        <h1 className="mt-16 text-4xl font-semibold text-[#F5EFE6]">Terms</h1>
        <p className="mt-6">Use PRETHIM lawfully and keep your account credentials secure. You are responsible for activity performed through your account.</p>
        <p className="mt-4">Service availability and pricing may change as the product evolves. Contact support with questions about an active agreement.</p>
      </article>
    </main>
  );
}
