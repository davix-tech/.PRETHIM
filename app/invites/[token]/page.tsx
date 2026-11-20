"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck, Mail } from "lucide-react";

type Invite = { storeName: string; expiresAt: string };
export default function InvitePage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) { setError("This invitation link is invalid."); setLoading(false); return; }
    fetch("/api/reden/invites?token=" + encodeURIComponent(token), { cache: "no-store" })
      .then(async r => { const d = await r.json(); if (!r.ok || !d.valid) throw new Error(d.error || "Invitation unavailable."); setInvite(d.invite); })
      .catch(e => setError(e instanceof Error ? e.message : "Unable to load invitation."))
      .finally(() => setLoading(false));
  }, [token]);

  async function requestCode() {
    setSending(true); setError("");
    try {
      const r = await fetch("/api/reden/invites/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", token }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not send verification code.");
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send verification code."); }
    finally { setSending(false); }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault(); setVerifying(true); setError("");
    try {
      const r = await fetch("/api/reden/invites/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", token, code }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Verification failed.");
      setSuccess(true); window.setTimeout(() => { window.location.href = "/reden-dashboard"; }, 800);
    } catch (e) { setError(e instanceof Error ? e.message : "Verification failed."); }
    finally { setVerifying(false); }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(201,124,62,0.07),transparent_48%),#090806] text-[#e9e1d8]">
      <header className="mx-auto flex h-20 max-w-6xl items-center px-6 sm:px-8">
        <span className="mr-3 h-1.5 w-1.5 rounded-full bg-[#c97c3e]" />
        <span className="text-[11px] font-medium tracking-[.22em] text-[#e9e1d8]/80">REDEN</span>
      </header>

      <section className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl items-center justify-center px-4 pb-12 pt-4 sm:px-8 sm:pb-16">
        <div className="w-full max-w-[660px]">
          {loading ? (
            <div className="flex justify-center gap-3 py-16 text-xs tracking-[.12em] text-[#8f8676]">
              <Loader2 className="h-4 w-4 animate-spin" /> VALIDATING INVITATION
            </div>
          ) : error && !invite ? (
            <div className="rounded-[28px] border border-white/[.09] bg-white/[.035] p-7 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-10">
              <ShieldCheck className="h-5 w-5 text-[#c97c3e]" />
              <h1 className="mt-6 text-2xl font-medium tracking-[-.035em]">Invitation unavailable</h1>
              <p className="mt-3 text-sm leading-7 text-[#a79c90]">{error}</p>
            </div>
          ) : success ? (
            <div className="rounded-[28px] border border-white/[.09] bg-white/[.035] px-7 py-14 text-center shadow-2xl shadow-black/20 backdrop-blur-2xl sm:px-10">
              <Check className="mx-auto h-7 w-7 text-[#7fa382]" />
              <h1 className="mt-6 text-2xl font-medium tracking-[-.035em]">Store access verified</h1>
              <p className="mt-3 text-sm leading-6 text-[#a79c90]">Opening your REDEN workspace…</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-white/[.10] bg-white/[.035] shadow-[0_28px_100px_rgba(0,0,0,.38)] backdrop-blur-2xl">
              <div className="p-6 sm:p-10 md:p-12">
                <div className="text-[10px] font-medium tracking-[.18em] text-[#c97c3e]">STORE ACCESS INVITATION</div>
                <h1 className="mt-5 max-w-[520px] text-[30px] font-medium leading-[1.12] tracking-[-.045em] text-[#f0e9e1] sm:text-[38px]">
                  Meet the intelligence behind your store.
                </h1>
                <p className="mt-5 max-w-[540px] text-[14px] leading-7 text-[#a79c90]">
                  A developer has invited you to access REDEN for <strong className="font-medium text-[#eee8e2]">{invite?.storeName}</strong> — an ecommerce intelligence system designed to help your store convert more opportunities into revenue.
                </p>

                <div className="mt-9 grid gap-x-8 gap-y-8 border-t border-white/[.08] pt-8 sm:grid-cols-2 sm:gap-y-9">
                  <div>
                    <p className="text-[13px] font-medium text-[#eee8e2]">Recover missed purchases</p>
                    <p className="mt-2 text-[12px] leading-6 text-[#8f8676]">Identify abandoned carts and help bring interested shoppers back.</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#eee8e2]">Respond to buying intent</p>
                    <p className="mt-2 text-[12px] leading-6 text-[#8f8676]">Use shopper behaviour to trigger relevant actions, including targeted incentives when appropriate.</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#eee8e2]">Understand revenue opportunities</p>
                    <p className="mt-2 text-[12px] leading-6 text-[#8f8676]">Get practical intelligence about store activity, purchases and conversion opportunities.</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#eee8e2]">Stay informed</p>
                    <p className="mt-2 text-[12px] leading-6 text-[#8f8676]">Receive concise store reports twice daily.</p>
                  </div>
                </div>

                <div className="mt-9 rounded-2xl border border-white/[.07] bg-black/[.14] px-5 py-4 text-[12px] leading-6 text-[#9b9084]">
                  REDEN works alongside your existing ecommerce store. You are not replacing your website or storefront platform.
                </div>

                {!sent ? (
                  <button onClick={requestCode} disabled={sending} className="mt-8 flex h-13 min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#c97c3e] px-5 text-[11px] font-semibold tracking-[.08em] text-[#170f09] transition-colors hover:bg-[#d58b50] disabled:cursor-wait disabled:opacity-60">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    VERIFY STORE OWNER EMAIL
                    {!sending && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                ) : (
                  <form onSubmit={verifyCode} className="mt-8 border-t border-white/[.08] pt-7">
                    <label className="text-[12px] leading-6 text-[#c8bdb1]">Enter the six-digit code sent to the registered store-owner email.</label>
                    <input value={code} onChange={e => setCode(e.target.value.replace(/\\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="mt-4 h-14 w-full rounded-xl border border-white/[.10] bg-black/[.18] px-4 text-center text-xl tracking-[.5em] text-white outline-none transition-colors focus:border-[#c97c3e]/60" />
                    <button disabled={verifying || code.length !== 6} className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#c97c3e] px-5 text-[11px] font-semibold tracking-[.08em] text-[#170f09] transition-colors hover:bg-[#d58b50] disabled:cursor-not-allowed disabled:opacity-50">
                      {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      VERIFY AND OPEN REDEN
                    </button>
                    <button type="button" onClick={requestCode} disabled={sending} className="mt-5 w-full py-2 text-[11px] text-[#9b9084] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#e9e1d8] disabled:opacity-50">Resend verification code</button>
                  </form>
                )}
                {error && <p className="mt-5 rounded-xl border border-[#ff8c70]/20 bg-[#ff8c70]/[.06] px-4 py-3 text-xs leading-6 text-[#ff9b82]">{error}</p>}
              </div>
              <div className="border-t border-white/[.07] px-6 py-5 text-center text-[9px] tracking-[.14em] text-[#71675d]">
                REDEN <span className="mx-2 text-white/20">/</span> ADAPTIVE COMMERCE INTELLIGENCE
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );