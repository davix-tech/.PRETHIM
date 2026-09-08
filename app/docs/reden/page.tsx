import Link from "next/link";

export const metadata = { title: "REDEN API | PRETHIM" };

export default function RedenDocsPage() {
  return (
    <main className="min-h-screen bg-[#0A0705] px-6 py-16 text-[#9C9188]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-mono text-sm text-[#F5EFE6] hover:text-[#FF5A1F]">PRETHIM</Link>
        <p className="mt-16 font-mono text-xs uppercase tracking-[0.2em] text-[#FF5A1F]">REDEN API</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-[#F5EFE6]">One call. One decision.</h1>
        <p className="mt-6 leading-relaxed">Send session context to REDEN and receive the next best action for that session.</p>
        <div className="mt-10 border border-[#1E1812] bg-[#0E0906] p-6 font-mono text-sm text-[#F5EFE6]">POST /v1/reden/decide</div>
        <Link href="/reden" className="mt-8 inline-block text-sm text-[#FF5A1F]">Back to REDEN</Link>
      </div>
    </main>
  );
}
