"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, ShieldCheck, Zap, Mail, ShoppingCart, TrendingUp, Clock3 } from "lucide-react";

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

  return <main className="min-h-screen bg-[#090806] text-[#e9e1d8]">
    <header className="mx-auto flex h-16 max-w-6xl items-center px-6"><span className="h-1.5 w-1.5 rounded-full bg-[#c97c3e] mr-3"/><span className="text-[10px] tracking-[.2em]">REDEN</span></header>
    <section className="mx-auto flex min-h-[calc(100vh-100px)] max-w-[520px] items-center px-5 py-12">
      <div className="w-full">
        {loading ? <div className="flex justify-center gap-3 text-xs text-[#8f8676]"><Loader2 className="h-4 w-4 animate-spin"/> VALIDATING INVITATION</div> :
        error && !invite ? <div className="rounded-2xl border border-white/10 bg-white/[.02] p-7"><ShieldCheck className="h-6 w-6 text-[#c97c3e]"/><h1 className="mt-5 text-2xl font-semibold">Invitation unavailable</h1><p className="mt-3 text-sm text-[#8f8676]">{error}</p></div> :
        success ? <div className="text-center"><Check className="mx-auto h-10 w-10 text-[#7fa382]"/><h1 className="mt-5 text-2xl font-semibold">Store access verified</h1><p className="mt-2 text-sm text-[#8f8676]">Opening your REDEN workspace…</p></div> :
        <div className="overflow-hidden rounded-2xl border border-white/[.09] bg-[#14110d]">
          <div className="p-7 sm:p-9">
            <div className="text-[9px] tracking-[.2em] text-[#c97c3e]">YOUR STOREFRONT HAS BEEN INVITED</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Meet the intelligence behind your store.</h1>
            <p className="mt-3 text-sm leading-6 text-[#a79c90]">A developer has invited you to access REDEN for <strong className="text-[#eee8e2]">{invite?.storeName}</strong> — an ecommerce intelligence system designed to help your store convert more opportunities into revenue.</p>
            <div className="mt-7 space-y-4">
              <div className="flex gap-3"><ShoppingCart className="mt-1 h-4 w-4 shrink-0 text-[#c97c3e]"/><div><p className="text-sm font-medium">Recover missed purchases</p><p className="mt-1 text-xs leading-5 text-[#8f8676]">Identify abandoned carts and help bring interested shoppers back.</p></div></div>
              <div className="flex gap-3"><Zap className="mt-1 h-4 w-4 shrink-0 text-[#c97c3e]"/><div><p className="text-sm font-medium">Respond to buying intent</p><p className="mt-1 text-xs leading-5 text-[#8f8676]">Use shopper behaviour to trigger relevant actions, including targeted incentives when appropriate.</p></div></div>
              <div className="flex gap-3"><TrendingUp className="mt-1 h-4 w-4 shrink-0 text-[#c97c3e]"/><div><p className="text-sm font-medium">Understand revenue opportunities</p><p className="mt-1 text-xs leading-5 text-[#8f8676]">Get practical intelligence about store activity, purchases and conversion opportunities.</p></div></div>
              <div className="flex gap-3"><Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#c97c3e]"/><div><p className="text-sm font-medium">Stay informed</p><p className="mt-1 text-xs leading-5 text-[#8f8676]">Receive concise store reports twice daily.</p></div></div>
            </div>
            <div className="mt-6 rounded-xl border border-white/[.07] bg-black/20 p-4 text-xs leading-5 text-[#8f8676]">REDEN works alongside your existing ecommerce store. You are not replacing your website or storefront platform.</div>
            {!sent ? <button onClick={requestCode} disabled={sending} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c97c3e] text-xs font-semibold tracking-wide text-[#170f09] disabled:opacity-60">{sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Mail className="h-4 w-4"/>} VERIFY STORE OWNER EMAIL <ArrowRight className="h-3.5 w-3.5"/></button> :
            <form onSubmit={verifyCode} className="mt-7">
              <label className="text-xs text-[#c8bdb1]">Enter the six-digit code sent to the registered store-owner email.</label>
              <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="mt-3 h-14 w-full rounded-lg border border-white/10 bg-black/30 px-4 text-center text-xl tracking-[.5em] text-white outline-none focus:border-[#c97c3e]" />
              <button disabled={verifying || code.length!==6} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#c97c3e] text-xs font-semibold text-[#170f09] disabled:opacity-50">{verifying ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4"/>} VERIFY AND OPEN REDEN</button>
              <button type="button" onClick={requestCode} disabled={sending} className="mt-3 w-full text-xs text-[#8f8676] underline underline-offset-4">Resend verification code</button>
            </form>}
            {error && <p className="mt-4 text-xs leading-5 text-[#ff8c70]">{error}</p>}
          </div>
          <div className="border-t border-white/[.06] px-7 py-4 text-center text-[9px] tracking-[.12em] text-[#62594f]">REDEN / ADAPTIVE COMMERCE INTELLIGENCE</div>
        </div>}
      </div>
    </section>
  </main>;
}
