export default function VerifyRequestPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <span className="text-white text-xl font-medium tracking-widest uppercase">
            Prethim
          </span>
        </div>
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-8">
          <div className="w-10 h-10 rounded-full bg-[#ea580c]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-[#ea580c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-white text-lg font-medium mb-2">Check your inbox</h1>
          <p className="text-[#555] text-sm leading-relaxed">
            A sign-in link has been sent to your email address. Click the link to continue.
          </p>
        </div>
      </div>
    </main>
  );
}