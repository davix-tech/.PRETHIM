"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  MousePointer2,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

const COPPER = "#C97C3E";
const BG = "#090604";

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Number({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`select-none text-[clamp(5rem,13vw,11rem)] font-semibold leading-[0.72] tracking-[-0.08em] text-white/[0.045] ${className}`}
    >
      {children}
    </span>
  );
}

function AmbientBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-[-320px] z-0 h-[700px] w-[900px] -translate-x-1/2 rounded-full blur-[150px]"
        style={{
          opacity: 0.11,
          background: `radial-gradient(circle, ${COPPER} 0%, rgba(201,124,62,0) 68%)`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, black, transparent 60%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black, transparent 60%)",
        }}
      />
    </>
  );
}

function BrowserFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#0D0907] shadow-[0_45px_140px_rgba(0,0,0,0.55)]">
      <div className="flex h-9 items-center border-b border-white/[0.07] bg-[#100B09] px-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/[0.12]" />
          <span className="h-2 w-2 rounded-full bg-white/[0.09]" />
          <span className="h-2 w-2 rounded-full bg-white/[0.07]" />
        </div>

        <div className="mx-auto hidden h-5 w-48 items-center justify-center rounded-md border border-white/[0.05] bg-white/[0.025] sm:flex">
          <span className="text-[8px] tracking-[0.08em] text-white/20">
            REDEN
          </span>
        </div>

        <div className="w-12" />
      </div>

      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1000}
        priority={priority}
        className="block h-auto w-full"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.025), transparent 20%, transparent 82%, rgba(0,0,0,0.2))",
        }}
      />
    </div>
  );
}

function HeroScreenshot() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rawY = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [80, 0, -50]
  );

  const y = useSpring(rawY, {
    stiffness: 75,
    damping: 20,
    mass: 0.8,
  });

  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [5, 0, -2]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.96, 1, 0.985]
  );

  return (
    <div ref={ref} className="relative mt-16 sm:mt-20">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-[130px]"
        style={{
          background: `radial-gradient(circle, rgba(201,124,62,0.19), transparent 68%)`,
        }}
      />

      <motion.div
        style={{
          y,
          scale,
          rotateX,
          transformPerspective: 1400,
        }}
        className="relative mx-auto w-[calc(100%-8px)] max-w-[1160px]"
      >
        <BrowserFrame
          src="/reden-page.png"
          alt="REDEN product dashboard"
          priority
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/[0.08] bg-[#0D0907]/90 px-4 py-2.5 backdrop-blur-xl sm:flex"
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: COPPER }}
          />

          <span className="text-[9px] uppercase tracking-[0.2em] text-[#8D8278]">
            REDEN evaluates user&apos;s signal
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SignalVisualization() {
  const signals = [
    "product_view",
    "cart_activity",
    "returning_user",
    "session_intent",
    "checkout_state",
  ];

  return (
    <div className="relative h-[330px] overflow-hidden border border-white/[0.07] bg-[#0D0907]">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px]"
        style={{
          background: "rgba(201,124,62,0.11)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-[#C97C3E]/30 bg-[#C97C3E]/[0.08]"
        >
          <div
            className="absolute h-3 w-3 rounded-full shadow-[0_0_30px_rgba(201,124,62,0.75)]"
            style={{ background: COPPER }}
          />

          <div className="absolute inset-[-18px] rounded-full border border-[#C97C3E]/10" />
          <div className="absolute inset-[-38px] rounded-full border border-[#C97C3E]/[0.06]" />
        </motion.div>

        {signals.map((signal, index) => {
          const angle = (index / signals.length) * Math.PI * 2;
          const x = Math.cos(angle) * 125;
          const y = Math.sin(angle) * 115;

          return (
            <motion.div
              key={signal}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.12,
                duration: 0.5,
              }}
              className="absolute left-1/2 top-1/2"
              style={{
                marginLeft: x,
                marginTop: y,
              }}
            >
              <div className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-white/[0.07] bg-[#100C09] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Radio
                    className="h-3 w-3"
                    style={{ color: COPPER }}
                  />

                  <span className="text-[9px] uppercase tracking-[0.12em] text-[#81766D]">
                    {signal}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionLoop() {
  const steps = [
    {
      number: "01",
      title: "Signals arrive",
      text: "REDEN receives the context surrounding a live customer session.",
    },
    {
      number: "02",
      title: "Context is evaluated",
      text: "The system weighs what is happening instead of treating every visitor the same.",
    },
    {
      number: "03",
      title: "A decision resolves",
      text: "The signal becomes a concrete decision your application can understand.",
    },
    {
      number: "04",
      title: "Your product acts",
      text: "Execution stays with you. REDEN supplies the decision layer.",
    },
  ];

  return (
    <div className="grid border border-white/[0.07] md:grid-cols-4">
      {steps.map((step, index) => (
        <Reveal key={step.number} delay={index * 0.08}>
          <div className="group relative min-h-[240px] border-b border-white/[0.07] bg-[#0D0907] p-7 md:border-b-0 md:border-r last:md:border-r-0">
            <div className="flex items-start justify-between">
              <span
                className="text-[11px] font-semibold tracking-[0.12em]"
                style={{ color: COPPER }}
              >
                {step.number}
              </span>

              <ChevronDown
                className="h-4 w-4 text-white/10 transition-all duration-300 group-hover:translate-y-1"
                style={{
                  color: undefined,
                }}
              />
            </div>

            <h3 className="mt-16 text-lg font-semibold tracking-[-0.025em] text-[#F5EFE6]">
              {step.title}
            </h3>

            <p className="mt-3 text-xs leading-6 text-[#6E6358]">
              {step.text}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function PricingSection() {
  const freeFeatures = [
    "Install REDEN on your store",
    "Connect your store to the decision engine",
    "Start with real-time customer signals",
    "Access the REDEN control surface",
  ];

  const proFeatures = [
    "Advanced decision capabilities",
    "Deeper revenue intelligence",
    "Expanded controls and insights",
    "Built for growing teams",
  ];

  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <div className="max-w-2xl">
            <span
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: COPPER }}
            >
              Choose your starting point
            </span>

            <h2 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
              Start with REDEN FREE.
              <br />
              <span className="text-[#6E6358]">
                Scale when you need more.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-sm leading-7 text-[#8F847A] sm:text-base">
              Start with the foundation for connecting your store to REDEN
              and turning live customer signals into decisions. Pro is being
              built for teams that need deeper control and intelligence.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden border border-[#C97C3E]/35 bg-[#100B08] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:p-9">
              <div
                aria-hidden="true"
                className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-[90px]"
                style={{
                  background: "rgba(201,124,62,0.11)",
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: COPPER }}
                  >
                    REDEN
                  </span>

                  <span className="border border-[#C97C3E]/25 bg-[#C97C3E]/[0.07] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-[#D59668]">
                    Available now
                  </span>
                </div>

                <h3 className="mt-12 text-3xl font-semibold tracking-[-0.04em] text-[#F5EFE6]">
                  Free
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-6 text-[#7E7369]">
                  Everything you need to connect your store to REDEN and begin
                  learning from real customer behavior.
                </p>

                <div className="my-8 h-px bg-white/[0.07]" />

                <div className="space-y-4">
                  {freeFeatures.map((item) => (
                    <div key={item} className="flex gap-3">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: COPPER }}
                      />

                      <span className="text-xs leading-5 text-[#A09890]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/reden-addstore"
                  className="group mt-10 flex h-12 w-full items-center justify-center gap-3 bg-[#C97C3E] text-xs font-bold uppercase tracking-[0.1em] text-[#120B07] transition-all duration-300 hover:bg-[#D58A4C] hover:shadow-[0_0_35px_rgba(201,124,62,0.14)]"
                >
                  Proceed with Free

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative h-full overflow-hidden border border-white/[0.07] bg-[#0D0907] p-7 sm:p-9">
              <div className="absolute right-0 top-0 h-48 w-48 bg-white/[0.015] blur-[80px]" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#756A61]">
                    REDEN PRO
                  </span>

                  <span className="border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-[#6E6358]">
                    Coming soon
                  </span>
                </div>

                <h3 className="mt-12 text-3xl font-semibold tracking-[-0.04em] text-[#D9D1C8]">
                  Pro
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-6 text-[#655B53]">
                  A more powerful REDEN experience for teams that need deeper
                  control, more intelligence, and more room to scale.
                </p>

                <div className="my-8 h-px bg-white/[0.05]" />

                <div className="space-y-4">
                  {proFeatures.map((item) => (
                    <div key={item} className="flex gap-3">
                      <Circle className="mt-1 h-3 w-3 shrink-0 text-white/10" />

                      <span className="text-xs leading-5 text-[#5E554E]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-10">
                  <div className="flex items-center gap-3 border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                    <Sparkles className="h-4 w-4 text-[#5E554E]" />

                    <span className="text-[10px] uppercase tracking-[0.14em] text-[#665C54]">
                      We are building this next
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function RedenPage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden text-[#9C9188]"
      style={{ background: BG }}
    >
      <AmbientBackground />

      <div className="relative z-10">
        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#090604]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-6">
            <Link
              href="/"
              aria-label="PRETHIM home"
              className="group flex items-center"
            >
              <Image
                src="/icon.png"
                alt="PRETHIM"
                width={34}
                height={34}
                priority
                className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-[1.04]"
              />
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/docs"
                className="hidden text-xs text-[#756B63] transition-colors hover:text-[#F5EFE6] sm:block"
              >
                Documentation
              </Link>

              <Link
                href="/reden-addstore"
                className="flex h-9 items-center gap-2 border border-[#C97C3E]/30 bg-[#C97C3E]/[0.07] px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#F5EFE6] transition-all duration-300 hover:border-[#C97C3E]/50 hover:bg-[#C97C3E]/[0.12]"
              >
                Start free

                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="mx-auto max-w-[1180px] px-5 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-28">
          <div className="max-w-[950px]">
            <Reveal>
              <div className="flex items-center gap-3">
                <span
                  className="h-px w-9"
                  style={{ background: COPPER }}
                />

                <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6358]">
                  REDEN / Revenue Decision Engine
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="mt-7">
                <div className="relative h-14 w-[230px] sm:h-20 sm:w-[320px]">
                  <Image
                    src="/reden-logo.png"
                    alt="REDEN"
                    fill
                    priority
                    className="object-contain object-left"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <h1 className="mt-7 text-[3.35rem] font-semibold leading-[0.9] tracking-[-0.065em] text-[#F5EFE6] sm:text-7xl md:text-[6.5rem]">
                Your store
                <br />
                <span style={{ color: COPPER }}>should decide.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.22}>
              <p className="mt-8 max-w-2xl text-base leading-7 text-[#91867D] sm:text-lg sm:leading-8">
                REDEN turns the behavior happening inside your store into
                decisions your application can act on. It connects live
                signals, customer context, and revenue logic while the
                opportunity is still active.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/reden-addstore"
                  className="group flex h-12 items-center gap-3 bg-[#C97C3E] px-6 text-xs font-bold uppercase tracking-[0.08em] text-[#120B07] transition-all duration-300 hover:bg-[#D58A4C] hover:shadow-[0_0_35px_rgba(201,124,62,0.14)]"
                >
                  Add your store

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#how-reden-works"
                  className="flex h-12 items-center gap-2 border border-white/[0.08] px-6 text-xs font-medium text-[#E8E0D7] transition-colors hover:border-white/[0.15] hover:bg-white/[0.025]"
                >
                  See how it works

                  <ChevronDown className="h-3.5 w-3.5" />
                </a>
              </div>
            </Reveal>
          </div>

          <HeroScreenshot />
        </section>

        {/* SIGNALS */}
        <section className="border-y border-white/[0.06]">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-24 sm:px-6 sm:py-32 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <Reveal>
              <div className="relative">
                <Number className="absolute -left-1 -top-8">
                  01
                </Number>

                <div className="relative pt-16">
                  <span
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: COPPER }}
                  >
                    Signals become context
                  </span>

                  <h2 className="mt-5 max-w-md text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#F5EFE6] sm:text-5xl">
                    Your customers are already telling you what matters.
                  </h2>

                  <p className="mt-6 max-w-md text-sm leading-7 text-[#756B63]">
                    Every product view, cart change, return visit and checkout
                    interaction is a piece of context. REDEN brings those
                    signals together so your store can respond to the state
                    of the session.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <SignalVisualization />
            </Reveal>
          </div>
        </section>

        {/* DECISION LOOP */}
        <section
          id="how-reden-works"
          className="mx-auto max-w-[1180px] px-5 py-24 sm:px-6 sm:py-32"
        >
          <Reveal>
            <div className="relative max-w-3xl">
              <Number className="absolute -left-1 -top-10">
                02
              </Number>

              <div className="relative pt-20">
                <span
                  className="text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: COPPER }}
                >
                  The REDEN loop
                </span>

                <h2 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
                  Signal in.
                  <br />
                  <span className="text-[#6E6358]">
                    Decision out.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl text-sm leading-7 text-[#766C64] sm:text-base">
                  REDEN sits between what is happening and what your store
                  should do about it.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="mt-16">
            <DecisionLoop />
          </div>
        </section>

        {/* INTELLIGENCE */}
        <section className="border-y border-white/[0.06] bg-[#0C0806]">
          <div className="mx-auto grid max-w-[1180px] gap-14 px-5 py-24 sm:px-6 sm:py-32 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <Reveal>
              <div className="relative">
                <Number className="absolute -left-1 -top-8">
                  03
                </Number>

                <div className="relative pt-16">
                  <span
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: COPPER }}
                  >
                    See the intelligence
                  </span>

                  <h2 className="mt-5 text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#F5EFE6] sm:text-5xl">
                    Not another analytics screen.
                  </h2>

                  <p className="mt-6 max-w-md text-sm leading-7 text-[#71675F]">
                    REDEN gives you a live view of the decisions your system
                    is making. See signals, pathways and outcomes without
                    forcing your store to become an analytics project.
                  </p>

                  <div className="mt-8 flex items-center gap-3">
                    <Zap
                      className="h-4 w-4"
                      style={{ color: COPPER }}
                    />

                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#70665D]">
                      Built around action
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 30, rotate: 1 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    rotate: 0,
                  }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <BrowserFrame
                    src="/reden-page2.png"
                    alt="REDEN decisions and intelligence interface"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.35,
                    duration: 0.6,
                  }}
                  className="absolute -bottom-7 -left-5 hidden w-60 border border-white/[0.08] bg-[#0D0907]/95 p-5 backdrop-blur-xl sm:block"
                >
                  <div className="flex items-center gap-2">
                    <MousePointer2
                      className="h-3.5 w-3.5"
                      style={{ color: COPPER }}
                    />

                    <span className="text-[9px] uppercase tracking-[0.16em] text-[#6E6358]">
                      Decision resolved
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium text-[#EDE5DC]">
                    Every session gets a next step.
                  </p>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* WHY IT MATTERS */}
        <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-6 sm:py-32">
          <Reveal>
            <div className="relative max-w-3xl">
              <Number className="absolute -left-1 -top-8">
                04
              </Number>

              <div className="relative pt-16">
                <span
                  className="text-[10px] uppercase tracking-[0.22em]"
                  style={{ color: COPPER }}
                >
                  The point
                </span>

                <h2 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
                  Revenue shouldn&apos;t wait
                  <br />
                  <span className="text-[#6E6358]">
                    for a report.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl text-sm leading-7 text-[#766C64] sm:text-base">
                  REDEN is designed for the moment the decision matters —
                  while the customer is still there, while the opportunity is
                  still alive, and while your application can still act.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-14 grid border border-white/[0.07] md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Understand",
                  text: "See the state of the customer and the session.",
                },
                {
                  number: "02",
                  title: "Decide",
                  text: "Turn context into a concrete revenue pathway.",
                },
                {
                  number: "03",
                  title: "Act",
                  text: "Let your store respond while the moment is live.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border-b border-white/[0.07] bg-[#0D0907] p-7 md:border-b-0 md:border-r last:md:border-r-0 sm:p-9"
                >
                  <span
                    className="text-[10px]"
                    style={{ color: COPPER }}
                  >
                    {item.number}
                  </span>

                  <h3 className="mt-12 text-xl font-semibold tracking-[-0.03em] text-[#F5EFE6]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-xs leading-6 text-[#6C625A]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* PRICING */}
        <PricingSection />

        {/* FINAL CTA */}
        <section className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-6 sm:py-32">
            <Reveal>
              <div className="relative overflow-hidden border border-white/[0.07] bg-[#0D0907] px-7 py-12 sm:px-12 sm:py-16">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full blur-[110px]"
                  style={{
                    background: "rgba(201,124,62,0.08)",
                  }}
                />

                <div className="relative flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <span
                      className="text-[10px] uppercase tracking-[0.22em]"
                      style={{ color: COPPER }}
                    >
                      Start with REDEN
                    </span>

                    <h2 className="mt-5 text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#F5EFE6] sm:text-5xl">
                      Give your store
                      <br />
                      a decision layer.
                    </h2>

                    <p className="mt-5 max-w-xl text-sm leading-7 text-[#756B63]">
                      Connect your store to REDEN and start turning live
                      customer signals into actionable decisions.
                    </p>
                  </div>

                  <Link
                    href="/reden-addstore"
                    className="group flex h-12 w-fit shrink-0 items-center gap-3 bg-[#C97C3E] px-6 text-xs font-bold uppercase tracking-[0.08em] text-[#120B07] transition-all duration-300 hover:bg-[#D58A4C] hover:shadow-[0_0_40px_rgba(201,124,62,0.16)]"
                  >
                    Add your store

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/[0.06]">
          <div className="mx-auto max-w-[1180px] px-5 pb-8 pt-14 sm:px-6">
            <div className="flex flex-col gap-10">
              <div className="relative h-12 w-[180px] opacity-70 sm:h-14 sm:w-[220px]">
                <Image
                  src="/prethim-watermark.png"
                  alt="PRETHIM"
                  fill
                  className="object-contain object-left"
                />
              </div>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs leading-6 text-[#5F564F]">
                    Decision infrastructure for products that want to act.
                  </p>

                  <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#49413B]">
                    REDEN by PRETHIM
                  </p>
                </div>

                <nav className="flex flex-wrap items-center gap-6 text-xs text-[#5F564F]">
                  <Link
                    href="/docs"
                    className="transition-colors hover:text-[#F5EFE6]"
                  >
                    Docs
                  </Link>

                  <Link
                    href="/"
                    className="transition-colors hover:text-[#F5EFE6]"
                  >
                    PRETHIM
                  </Link>

                  <Link
                    href="/privacy"
                    className="transition-colors hover:text-[#F5EFE6]"
                  >
                    Privacy
                  </Link>

                  <Link
                    href="/terms"
                    className="transition-colors hover:text-[#F5EFE6]"
                  >
                    Terms
                  </Link>

                  <span>© 2026</span>
                </nav>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}