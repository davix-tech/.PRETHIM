"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  const supabase = createClient();

  const { status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/reden-dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080706]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,124,62,0.10),transparent_48%)]" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 text-xs text-[#8F8676] shadow-[0_24px_100px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#C97C3E]" />
          Securing your PRETHIM session…
        </div>
      </div>
    );
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setErrorMsg("Enter a valid email address.");
      setEmailStatus("error");
      return;
    }

    setEmailStatus("sending");
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Supabase magic link error:", error);
        setErrorMsg(error.message || "Could not send link. Try again.");
        setEmailStatus("error");
        return;
      }

      setEmailStatus("sent");
    } catch (error) {
      console.error("Magic link error:", error);
      setErrorMsg("Something went wrong. Try again.");
      setEmailStatus("error");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080706] px-5 py-10 antialiased text-[#ECE4D8] selection:bg-[#C97C3E]/25 selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-[-260px] h-[560px] w-[560px] rounded-full bg-[#C97C3E]/[0.075] blur-[145px]" />
        <div className="absolute bottom-[-300px] right-[-140px] h-[520px] w-[520px] rounded-full bg-[#7C93A6]/[0.045] blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,0.018),transparent_58%)]" />
      </div>

      {/* Premium Pure Ambient Depth Glow */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(255,90,31,0.04)_0%,transparent_70%)] pointer-events-none z-0 blur-xl" />

      {/* Auth Container Frame */}
      <div className="relative z-10 w-full max-w-[410px] overflow-hidden rounded-2xl border border-white/[0.085] bg-white/[0.032] shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />

        {/* Top Boundary Highlight Line */}
        <div className="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-white/[0.16] to-transparent" />

        <div className="relative z-10 p-7 pb-8 sm:p-9">

          {/* Main Context Typography */}
          <div className="mb-7">
            <h1 className="text-[22px] font-semibold tracking-[-0.045em] text-[#F5F1EA]">
              PRETHIM
            </h1>

            <p className="mt-2 text-[12px] leading-relaxed text-[#8F8676]">
              Sign in to your workspace account.
            </p>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/reden-dashboard",
              })
            }
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.12] bg-[#F5F1EA] text-xs font-semibold text-[#0A0A0A] shadow-[0_4px_18px_rgba(0,0,0,0.16)] transition-all duration-200 hover:-translate-y-px hover:bg-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97C3E]/60"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              className="shrink-0"
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.65-5.17 3.65-8.58z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 14.24c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.51H1.21C.44 8.05 0 9.77 0 11.6s.44 3.55 1.21 5.09l4.11-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.09l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"
              />
            </svg>

            Continue with Google
          </button>

          {/* Separation Boundary */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-white/[0.09]" />

            <span className="select-none text-[10px] tracking-[0.08em] text-[#68615b]">
              or
            </span>

            <div className="h-px flex-1 bg-white/[0.09]" />
          </div>

          {/* Email Magic Link */}
          {emailStatus === "sent" ? (
            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 text-left text-xs leading-relaxed text-[#8F8676]">
              Check{" "}
              <span className="text-[#F5F1EA] font-medium">
                {email}
              </span>{" "}
              for your secure sign-in link.

              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmailStatus("idle");
                    setEmail("");
                    setErrorMsg("");
                  }}
                  className="cursor-pointer border-none bg-transparent p-0 text-[11px] text-[#8F8676] underline transition-colors duration-150 hover:text-[#F5F1EA] focus:outline-none"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleMagicLink}
              className="flex flex-col gap-3.5"
            >
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (emailStatus === "error") {
                      setEmailStatus("idle");
                      setErrorMsg("");
                    }
                  }}
                  placeholder="name@company.com"
                  autoComplete="email"
                  disabled={emailStatus === "sending"}
                  className={`h-11 w-full rounded-xl border bg-black/25 px-3.5 text-xs text-[#F5F1EA] outline-none transition-all duration-200 placeholder:text-[#625c56] focus:border-[#C97C3E]/50 focus:bg-black/35 focus:ring-4 focus:ring-[#C97C3E]/[0.08] ${
                    emailStatus === "error"
                      ? "border-[#E5484D]/80"
                      : "border-white/[0.10]"
                  }`}
                />

                {emailStatus === "error" && (
                  <p className="text-left text-[11px] text-[#ff8060]">
                    {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={emailStatus === "sending"}
                className={`h-11 w-full rounded-xl border border-white/[0.10] bg-white/[0.025] text-xs font-semibold text-[#F5F1EA] transition-all duration-200 hover:border-white/[0.18] hover:bg-white/[0.055] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C97C3E]/50 ${
                  emailStatus === "sending"
                    ? "opacity-50 cursor-default"
                    : "cursor-pointer"
                }`}
              >
                {emailStatus === "sending"
                  ? "Sending link..."
                  : "Continue with Email"}
              </button>
            </form>
          )}
        </div>

        {/* Technical Perimeter Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.07] bg-black/10 px-7 py-4 select-none sm:px-9">
          <span className="text-[9px] font-medium tracking-[0.16em] text-[#68615b]">
            PRETHIM NETWORK SECURITY
          </span>
        </div>
      </div>
    </main>
  );
}