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
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#070605]" />;
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
    <main className="min-h-screen bg-[#070605] flex items-center justify-center px-5 py-10 antialiased selection:bg-[#FF5A1F]/20 selection:text-white relative overflow-hidden font-sans">

      {/* Premium Pure Ambient Depth Glow */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(255,90,31,0.04)_0%,transparent_70%)] pointer-events-none z-0 blur-xl" />

      {/* Auth Container Frame */}
      <div className="relative z-10 w-full max-w-[370px] bg-[#0B0A08] border border-[#1C1712] rounded-md shadow-[0_32px_64px_rgba(0,0,0,0.7)] overflow-hidden">

        {/* Top Boundary Highlight Line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#7A3613] to-transparent" />

        <div className="p-7 sm:p-8 pb-7">

          {/* Main Context Typography */}
          <div className="mb-7">
            <h1 className="text-white text-xl font-semibold tracking-tight">
              PRETHIM
            </h1>

            <p className="text-[#6E6358] text-xs leading-relaxed mt-1.5">
              Sign in to your workspace account.
            </p>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/dashboard",
              })
            }
            className="w-full h-10 bg-[#F5F1EA] hover:bg-white text-[#0A0A0A] border-none rounded font-semibold text-xs flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer focus:outline-none"
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
            <div className="flex-1 h-px bg-[#1C1712]" />

            <span className="font-mono text-[10px] text-[#3D362E] select-none">
              or
            </span>

            <div className="flex-1 h-px bg-[#1C1712]" />
          </div>

          {/* Email Magic Link */}
          {emailStatus === "sent" ? (
            <div className="p-3.5 rounded bg-[#0A0604] border border-[#1C1712] text-[#6E6358] text-xs leading-relaxed text-left">
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
                  className="bg-transparent border-none text-[#3D362E] hover:text-[#F5F1EA] text-[11px] underline cursor-pointer p-0 transition-colors duration-150 focus:outline-none"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleMagicLink}
              className="flex flex-col gap-3"
            >
              <div className="space-y-1.5">
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
                  className={`w-full h-10 bg-black border rounded px-3 text-[#F5F1EA] text-xs outline-none transition-all duration-150 focus:border-[#7A3613] focus:ring-4 focus:ring-[#FF5A1F]/5 ${
                    emailStatus === "error"
                      ? "border-[#E5484D]"
                      : "border-[#1C1712]"
                  }`}
                />

                {emailStatus === "error" && (
                  <p className="text-[#E5484D] text-[11px] text-left">
                    {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={emailStatus === "sending"}
                className={`w-full h-10 bg-[#0A0807] hover:bg-[#100D09] text-[#F5F1EA] border border-[#1C1712] hover:border-[#2A2118] rounded font-semibold text-xs transition-all duration-150 focus:outline-none ${
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
        <div className="border-t border-[#1C1712] px-8 py-4 flex items-center justify-between bg-[#090806] select-none">
          <span className="font-mono text-[10px] tracking-wider text-[#3D362E]">
            PRETHIM NETWORK SECURITY
          </span>
        </div>
      </div>
    </main>
  );
}