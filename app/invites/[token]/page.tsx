"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  ArrowRight,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type Invite = {
  id: string;
  connectionId: string;
  storeName: string;
  siteId: string;
  expiresAt: string;
};

export default function InvitePage() {
  const params = useParams();
  const { data: session, status: sessionStatus } =
    useSession();

  const token =
    typeof params?.token === "string"
      ? params.token
      : "";

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  /*
   * Validate the invite.
   */
  useEffect(() => {
    if (!token) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }

    async function loadInvite() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/reden/invites?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.valid) {
          throw new Error(
            data?.error ||
              "This invite link is invalid or expired."
          );
        }

        setInvite(data.invite);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load invite."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInvite();
  }, [token]);

  /*
   * Accept after authentication.
   */
  useEffect(() => {
    if (
      !invite ||
      sessionStatus !== "authenticated" ||
      !session?.user?.email ||
      accepted ||
      accepting
    ) {
      return;
    }

    async function acceptInvite() {
      try {
        setAccepting(true);
        setError("");

        const response = await fetch(
          "/api/reden/invites",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to accept this invitation."
          );
        }

        setAccepted(true);

        /*
         * Give the success state a moment to render.
         */
        window.setTimeout(() => {
          window.location.href = "/dashboard";
        }, 700);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to accept invitation."
        );
      } finally {
        setAccepting(false);
      }
    }

    void acceptInvite();
  }, [
    invite,
    sessionStatus,
    session?.user?.email,
    accepted,
    accepting,
    token,
  ]);

  async function continueWithGoogle() {
    if (!token) return;

    /*
     * Preserve the invite token through authentication.
     */
    await signIn("google", {
      callbackUrl: `/invites/${token}`,
    });
  }

  return (
    <main className="min-h-screen bg-[#070706] text-[#d8d2cc]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,90,31,0.055),transparent_38%)]" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff5a1f]/[0.012] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-7">
          <div className="flex items-center gap-2.5 text-[10px] tracking-[0.16em] text-[#e7e2dc]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a1f] shadow-[0_0_12px_rgba(255,90,31,0.35)]" />
            REDEN
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-20">
          <div className="w-full max-w-[430px]">
            {loading ? (
              <div className="flex justify-center">
                <div className="flex items-center gap-3 text-[10px] tracking-[0.08em] text-[#625d58]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  VALIDATING INVITATION
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-white/[0.075] bg-white/[0.018] p-7 backdrop-blur-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff5a1f]/15 bg-[#ff5a1f]/[0.035]">
                  <ShieldCheck className="h-4 w-4 text-[#ff6a35]" />
                </div>

                <div className="mt-6 text-[8px] tracking-[0.18em] text-[#4d4843]">
                  REDEN INVITATION
                </div>

                <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-[#eee8e2]">
                  Invite unavailable
                </h1>

                <p className="mt-3 text-[11px] leading-5 text-[#68625c]">
                  {error}
                </p>
              </div>
            ) : accepted ? (
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#72b77b]/20 bg-[#72b77b]/[0.05]">
                  <Check className="h-4 w-4 text-[#72b77b]" />
                </div>

                <h1 className="mt-6 text-[25px] font-semibold tracking-[-0.04em] text-[#eee8e2]">
                  Access granted
                </h1>

                <p className="mt-3 text-[11px] text-[#625c56]">
                  Taking you to your REDEN dashboard.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff5a1f]/20 bg-[#ff5a1f]/[0.04]">
                    <ShieldCheck className="h-4 w-4 text-[#ff6a35]" />
                  </div>

                  <div className="mt-6 text-[8px] tracking-[0.2em] text-[#514b46]">
                    STOREFRONT ACCESS
                  </div>

                  <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] text-[#eee8e2]">
                    You&apos;ve been invited.
                  </h1>

                  <p className="mx-auto mt-3 max-w-sm text-[11px] leading-5 text-[#69635d]">
                    A developer has invited you to manage
                    this storefront through REDEN.
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.018] backdrop-blur-xl">
                  <div className="border-b border-white/[0.055] px-5 py-4">
                    <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                      STOREFRONT
                    </div>

                    <div className="mt-2 text-[14px] font-medium text-[#ddd7d1]">
                      {invite?.storeName}
                    </div>

                    {invite?.siteId && (
                      <div className="mt-1.5 text-[9px] text-[#514c47]">
                        {invite.siteId}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    {sessionStatus === "loading" ? (
                      <div className="flex h-10 items-center justify-center">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#625d58]" />
                      </div>
                    ) : session?.user?.email ? (
                      <div>
                        <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                          <div className="text-[8px] tracking-[0.12em] text-[#49443f]">
                            SIGNED IN AS
                          </div>

                          <div className="mt-1.5 truncate text-[10px] text-[#aaa39d]">
                            {session.user.email}
                          </div>
                        </div>

                        {accepting ? (
                          <div className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.07] text-[9px] tracking-[0.08em] text-[#77716b]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            GRANTING ACCESS
                          </div>
                        ) : (
                          <div className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff5a1f] text-[9px] font-semibold tracking-[0.08em] text-[#150b07]">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            CONNECTING
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] leading-5 text-[#625c56]">
                          Sign in to securely accept this
                          invitation and access the storefront
                          dashboard.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void continueWithGoogle()
                          }
                          className="mt-5 flex h-10 w-full items-center justify-center gap-3 rounded-lg bg-[#f0ebe6] text-[9px] font-semibold tracking-[0.06em] text-[#151311] transition-colors hover:bg-white"
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              fill="currentColor"
                              d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.4Z"
                            />

                            <path
                              fill="currentColor"
                              d="M12 21.99c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.52A9.74 9.74 0 0 0 12 21.99Z"
                            />

                            <path
                              fill="currentColor"
                              d="M6.54 14.09a5.86 5.86 0 0 1 0-3.75V7.82H3.29a9.99 9.99 0 0 0 0 8.79l3.25-2.52Z"
                            />

                            <path
                              fill="currentColor"
                              d="M12 6.31c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.38 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.71 5.32l3.25 2.52C7.31 8.03 9.46 6.31 12 6.31Z"
                            />
                          </svg>

                          CONTINUE WITH GOOGLE
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </>
                    )}

                    {error && (
                      <div className="mt-4 rounded-lg border border-[#ff7048]/15 bg-[#ff7048]/[0.025] px-3.5 py-3">
                        <p className="text-[9px] leading-5 text-[#ff7048]">
                          {error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-5 text-center text-[8px] leading-5 text-[#403c39]">
                  This invitation is private and expires
                  automatically.
                </p>
              </>
            )}
          </div>
        </div>

        <footer className="mx-auto w-full max-w-6xl px-5 pb-6 text-center">
          <span className="text-[8px] tracking-[0.15em] text-[#35312e]">
            REDEN / REVENUE INFRASTRUCTURE
          </span>
        </footer>
      </div>
    </main>
  );
}