/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, Zap, Shield, Server, GitBranch, Mail, Bell, ExternalLink, Users, Handshake, Building2, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Reden — Abandoned Cart Recovery That Actually Works",
  description: "Stop losing revenue to abandoned carts. Reden detects abandonment at the edge and triggers recovery before the session expires. Free tier available.",
};

export default function RedenPage() {
  return (
    <>
      {/* HEADER - Clean, no nonsense */}
      <header className="sticky top-0 z-50 border-b border-[#1E1812] bg-[#0A0908]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0908]/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-mono text-sm font-medium tracking-[0.15em] text-[#F5F1EA] group-hover:text-[#FF5A1F] transition-colors">
              PRETHIM
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F]" />
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/docs" className="hidden md:inline text-sm text-[#ABA296] hover:text-[#F5F1EA] transition-colors">
              Docs
            </Link>
            <Link href="/signin" className="hidden md:inline text-sm text-[#ABA296] hover:text-[#F5F1EA] transition-colors">
              Sign in
            </Link>
            <Link 
              href="/partner" 
              className="h-9 px-5 flex items-center text-sm font-medium rounded-sm bg-[#FF5A1F] hover:bg-[#e04e14] text-[#0A0908] transition-colors"
            >
              Become a partner
            </Link>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0908] text-[#ABA296]">

        {/* HERO - Direct, no fluff */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A1F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A1F]"></span>
                </span>
                <span className="font-mono text-[10px] tracking-[0.15em] text-[#FF5A1F]">
                  PARTNER PROGRAM
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight text-[#F5F1EA]">
                Build with us.{" "}
                <span className="text-[#FF5A1F]">Grow together.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#ABA296] leading-relaxed max-w-md">
                Join the Prethim partner program. Get early access, dedicated support, 
                and a seat at the table as we build the future of edge recovery.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/partner" 
                  className="h-12 px-8 flex items-center gap-2 text-sm font-semibold rounded-sm bg-[#FF5A1F] hover:bg-[#e04e14] text-[#0A0908] transition-colors"
                >
                  Apply now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="#why-partner" 
                  className="h-12 px-6 flex items-center text-sm font-medium rounded-sm border border-[#1E1812] hover:border-[#332619] text-[#F5F1EA] transition-colors"
                >
                  Why partner with us
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs text-[#6E6358]">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#FF5A1F]" />
                  Join early
                </span>
                <span className="flex items-center gap-1.5">
                  <Handshake className="h-3.5 w-3.5 text-[#FF5A1F]" />
                  Strategic partnership
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#FF5A1F]" />
                  Global reach
                </span>
              </div>
            </div>

            {/* Right side - Partner benefits */}
            <div className="space-y-6 bg-[#110D09] border border-[#1E1812] rounded-sm p-6 md:p-8">
              <div className="flex items-center gap-2 text-xs font-mono text-[#6E6358]">
                <span className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                <span>Partnerships: open</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="h-4 w-4 text-[#FF5A1F]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F1EA]">First-mover advantage</h3>
                    <p className="text-xs text-[#6E6358] leading-relaxed">
                      Get in early. Shape the product. Build your practice before anyone else.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="h-4 w-4 text-[#FF5A1F]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F1EA]">White-glove support</h3>
                    <p className="text-xs text-[#6E6358] leading-relaxed">
                      Dedicated channel to our engineering team. We build together.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Server className="h-4 w-4 text-[#FF5A1F]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F1EA]">Exclusive access</h3>
                    <p className="text-xs text-[#6E6358] leading-relaxed">
                      Preview features. Influence the roadmap. Get what you need.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E1812]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6E6358]">Current partners</span>
                  <span className="font-mono text-[#F5F1EA]">12</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-[#6E6358]">Open spots</span>
                  <span className="font-mono text-[#FF5A1F]">Limited</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY PARTNER - Value prop */}
        <section id="why-partner" className="max-w-6xl mx-auto px-6 py-16 border-t border-[#1E1812]/60">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F1EA] mb-4">
              Why partner with Prethim?
            </h2>
            <p className="text-lg text-[#ABA296] leading-relaxed">
              We're building the edge recovery layer for the next generation of e-commerce. 
              And we don't want to build it alone.
            </p>
            <div className="mt-6 p-6 bg-[#110D09] border border-[#1E1812] rounded-sm">
              <p className="text-sm text-[#ABA296]">
                <span className="text-[#FF5A1F] font-semibold">This isn't a reseller program.</span>{" "}
                It's a partnership. We work together, you shape the product, and we grow 
                alongside each other.
              </p>
            </div>
          </div>
        </section>

        {/* PARTNER BENEFITS - Concrete */}
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[#1E1812]/60">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F1EA] mb-3">
              What you get.
            </h2>
            <p className="text-[#ABA296]">
              Real value. Real relationships. No fluff.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-[#1E1812] bg-[#110D09] rounded-sm">
              <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center mb-4">
                <Handshake className="h-6 w-6 text-[#FF5A1F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F1EA] mb-2">Strategic alignment</h3>
              <p className="text-sm text-[#ABA296] leading-relaxed">
                We don't just want your business. We want your input. Your feedback shapes our roadmap.
              </p>
            </div>

            <div className="p-6 border border-[#1E1812] bg-[#110D09] rounded-sm">
              <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-[#FF5A1F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F1EA] mb-2">Direct engineering access</h3>
              <p className="text-sm text-[#ABA296] leading-relaxed">
                Slack channel with our core team. Questions answered in hours, not days.
              </p>
            </div>

            <div className="p-6 border border-[#1E1812] bg-[#110D09] rounded-sm">
              <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-[#FF5A1F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F1EA] mb-2">Early access</h3>
              <p className="text-sm text-[#ABA296] leading-relaxed">
                Features before anyone else. Beta access. Influence the product direction.
              </p>
            </div>
          </div>
        </section>

        {/* WHO SHOULD PARTNER */}
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[#1E1812]/60">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F1EA] mb-4">
                Who's this for?
              </h2>
              <ul className="space-y-4 text-[#ABA296]">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FF5A1F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F5F1EA]">Agencies & consultancies</span>
                    <p className="text-sm">Build an edge practice before it's mainstream.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FF5A1F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F5F1EA]">Platform providers</span>
                    <p className="text-sm">Integrate Reden natively into your stack.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FF5A1F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F5F1EA]">Enterprise teams</span>
                    <p className="text-sm">Get custom features built for your use case.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FF5A1F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F5F1EA]">Individual builders</span>
                    <p className="text-sm">Shape the product and grow your expertise.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-[#110D09] border border-[#1E1812] rounded-sm p-8">
              <h3 className="text-lg font-semibold text-[#F5F1EA] mb-2">Not sure if you qualify?</h3>
              <p className="text-sm text-[#ABA296] mb-6">
                We're looking for people who believe in edge computing and want to build something meaningful. 
                If that's you, apply.
              </p>
              <Link 
                href="/partner" 
                className="inline-flex items-center gap-2 text-sm font-medium text-[#FF5A1F] hover:text-[#e04e14] transition-colors"
              >
                Start the conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* HOW TO PARTNER - Simple steps */}
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[#1E1812]/60">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F1EA] mb-3">
              Three steps to partner.
            </h2>
            <p className="text-[#ABA296]">
              Simple. Transparent. Human.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-[#1E1812] bg-[#110D09] rounded-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center mx-auto mb-4">
                <span className="font-mono text-xl text-[#FF5A1F]">1</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F5F1EA] mb-2">Apply</h3>
              <p className="text-sm text-[#ABA296] leading-relaxed">
                Tell us about yourself, your work, and why you're interested.
              </p>
            </div>

            <div className="p-6 border border-[#1E1812] bg-[#110D09] rounded-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center mx-auto mb-4">
                <span className="font-mono text-xl text-[#FF5A1F]">2</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F5F1EA] mb-2">Chat</h3>
              <p className="text-sm text-[#ABA296] leading-relaxed">
                We'll meet, discuss your needs, and figure out how we can work together.
              </p>
            </div>

            <div className="p-6 border border-[#1E1812] bg-[#110D09] rounded-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 flex items-center justify-center mx-auto mb-4">
                <span className="font-mono text-xl text-[#FF5A1F]">3</span>
              </div>
              <h3 className="text-lg font-semibold text-[#F5F1EA] mb-2">Build</h3>
              <p className="text-sm text-[#ABA296] leading-relaxed">
                Get access, start building, and shape the future of edge recovery.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ - Because people have questions */}
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-[#1E1812]/60">
          <h2 className="text-3xl font-bold text-[#F5F1EA] mb-8 text-center">
            Questions? We've got answers.
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "What does a Prethim partnership cost?",
                a: "Nothing upfront. We're looking for strategic partners who believe in what we're building. If it's a fit, we figure out the commercial structure together."
              },
              {
                q: "Do I need to be an enterprise to partner?",
                a: "Not at all. We work with agencies, solo developers, platform companies, and everything in between. If you can build with us, we want to talk."
              },
              {
                q: "What's the time commitment?",
                a: "As much or as little as you want. Some partners provide regular feedback. Others build deeply on the platform. We adapt to your pace."
              },
              {
                q: "Can I try the product before partnering?",
                a: "Absolutely. We have a free tier that gives you access to Reden. You can test it, understand it, and then decide if you want to go deeper."
              }
            ].map((item, i) => (
              <details key={i} className="group border border-[#1E1812] rounded-sm">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-[#F5F1EA] font-medium hover:text-[#FF5A1F] transition-colors list-none">
                  {item.q}
                  <ArrowRight className="h-4 w-4 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-sm text-[#ABA296] leading-relaxed border-t border-[#1E1812] pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA - Partner */}
        <section className="max-w-4xl mx-auto px-6 py-20 border-t border-[#1E1812]/60">
          <div className="text-center bg-[#110D09] border border-[#1E1812] rounded-sm p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F1EA] mb-4">
              Let's build the future together.
            </h2>
            <p className="text-[#ABA296] max-w-md mx-auto mb-8">
              Apply to become a partner. We'll get back to you within 48 hours.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link 
                href="/partner" 
                className="h-12 px-8 flex items-center gap-2 text-sm font-semibold rounded-sm bg-[#FF5A1F] hover:bg-[#e04e14] text-[#0A0908] transition-colors"
              >
                Apply now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/reden-install" 
                className="h-12 px-6 flex items-center text-sm font-medium rounded-sm border border-[#1E1812] hover:border-[#332619] text-[#F5F1EA] transition-colors"
              >
                Try Reden first
              </Link>
            </div>
            <p className="text-xs text-[#6E6358] mt-4">
              Not ready to partner? Test the product first with our free tier.
            </p>
          </div>
        </section>

      </main>

      {/* FOOTER - Minimal */}
      <footer className="border-t border-[#1E1812] bg-[#0A0908]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-[0.15em] text-[#F5F1EA]">
              PRETHIM
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F]" />
          </div>
          <nav className="flex items-center gap-6 text-xs text-[#6E6358]">
            <Link href="/docs" className="hover:text-[#F5F1EA] transition-colors">Docs</Link>
            <Link href="/partner" className="hover:text-[#F5F1EA] transition-colors text-[#FF5A1F]">Partner</Link>
            <Link href="/privacy" className="hover:text-[#F5F1EA] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#F5F1EA] transition-colors">Terms</Link>
            <span className="text-[#6E6358]/50">© 2026</span>
          </nav>
        </div>
      </footer>
    </>
  );
}
