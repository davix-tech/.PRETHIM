"use client";

import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Activity,
  Database,
  Network,
  Zap,
  GitBranch,
  type LucideIcon,
} from "lucide-react";

const COPPER = "#C97C3E";
const MUTED = "#8C8178";
const FONT_BODY =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const INFRASTRUCTURE = [
  {
    number: "01",
    title: "Signals",
    description:
      "Software captures what is happening across the application in real time.",
    icon: Activity,
  },
  {
    number: "02",
    title: "Context",
    description:
      "PRETHIM evaluates those signals against the state and conditions that surround them.",
    icon: Database,
  },
  {
    number: "03",
    title: "Action",
    description:
      "A decision returns to the application while the context is still relevant.",
    icon: Zap,
  },
];

const TECHNOLOGIES: { name: string; icon: LucideIcon }[] = [
  { name: "Next.js", icon: GitBranch },
  { name: "PostgreSQL", icon: Database },
  { name: "Redis", icon: Activity },
  { name: "Supabase", icon: Database },
  { name: "Vercel", icon: Zap },
  { name: "Infrastructure", icon: Network },
];

function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "76px 76px",
        maskImage: "linear-gradient(to bottom, black 0%, transparent 72%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, transparent 72%)",
      }}
    />
  );
}

function AmbientGlow() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-[-280px] z-0 h-[760px] w-[1050px] -translate-x-1/2 rounded-full blur-[160px]"
        style={{ backgroundColor: `${COPPER}0B` }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-[-240px] top-[42%] z-0 h-[600px] w-[600px] rounded-full blur-[150px]"
        style={{ backgroundColor: `${COPPER}05` }}
      />
    </>
  );
}

function CursorGlow() {
  const reduced = useReducedMotion();
  const [moved, setMoved] = useState(false);

  const x = useSpring(0, {
    stiffness: 90,
    damping: 32,
    mass: 0.5,
  });

  const y = useSpring(0, {
    stiffness: 90,
    damping: 32,
    mass: 0.5,
  });

  useEffect(() => {
    if (reduced) return;

    const handleMove = (event: MouseEvent) => {
      if (!moved) setMoved(true);

      x.set(event.clientX - 300);
      y.set(event.clientY - 300);
    };

    window.addEventListener("mousemove", handleMove);

    return () => window.removeEventListener("mousemove", handleMove);
  }, [x, y, reduced, moved]);

  if (reduced || !moved) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[600px] w-[600px] rounded-full blur-[120px]"
      style={{
        x,
        y,
        backgroundColor: `${COPPER}08`,
      }}
    />
  );
}

function TechnologyStrip() {
  const items = [...TECHNOLOGIES, ...TECHNOLOGIES];

  return (
    <section
      aria-label="Infrastructure technologies"
      className="relative overflow-hidden border-y border-white/[0.06] py-8"
    >
      <motion.div
        className="flex w-max items-center gap-16 px-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 34,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {items.map((technology, index) => {
          const Icon = technology.icon;

          return (
            <div
              key={`${technology.name}-${index}`}
              className="flex shrink-0 items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#746A62]"
            >
              <Icon
                aria-hidden="true"
                className="h-3.5 w-3.5"
                style={{ color: `${COPPER}CC` }}
              />

              {technology.name}
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}

function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const reduced = useReducedMotion();

  const initial =
    direction === "left"
      ? { opacity: 0, x: -35 }
      : direction === "right"
        ? { opacity: 0, x: 35 }
        : { opacity: 0, y: 35 };

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: reduced ? 0.2 : 0.8,
        delay: reduced ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function InfrastructureRow({
  number,
  title,
  description,
  icon: Icon,
  index,
}: {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{
        duration: 0.8,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative border-t border-white/[0.07] py-12 sm:py-16"
    >
      <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-12">
        <div className="relative">
          <span
            aria-hidden="true"
            className="block text-[90px] font-semibold leading-[0.72] tracking-[-0.08em] text-white/[0.045] sm:text-[120px]"
          >
            {number}
          </span>

          <div className="absolute left-1 top-8 flex items-center gap-2 sm:top-10">
            <Icon
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1"
              style={{ color: COPPER }}
            />

            <span className="text-xs uppercase tracking-[0.14em] text-[#81766D]">
              Layer
            </span>
          </div>
        </div>

        <div className="max-w-3xl">
          <h3 className="text-4xl font-semibold leading-none tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
            {title}
          </h3>

          <p className="mt-6 max-w-2xl text-base leading-8 text-[#8B8077] sm:text-lg">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ProductReveal({
  image,
  alt,
  className = "",
  priority = false,
}: {
  image: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [110, -60]);

  const scale = useTransform(
    scrollYProgress,
    [0, 0.35, 0.8, 1],
    [0.92, 1, 1, 0.97]
  );

  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [5, 0, -2]
  );

  return (
    <motion.div
      ref={ref}
      style={{
        y,
        scale,
        rotateX,
        transformPerspective: 1600,
      }}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-10 rounded-[32px] blur-3xl"
        style={{ backgroundColor: `${COPPER}0B` }}
      />

      <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#100B08] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="flex h-10 items-center border-b border-white/[0.06] px-4">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.10]" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.05]" />
          </div>

          <div
            aria-hidden="true"
            className="mx-auto hidden h-5 w-48 rounded-md border border-white/[0.05] bg-white/[0.015] sm:block"
          />
        </div>

        <Image
          src={image}
          alt={alt}
          width={1600}
          height={1000}
          priority={priority}
          className="block h-auto w-full"
        />
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(heroProgress, [0, 1], [0, -80]);

  const heroScale = useTransform(
    heroProgress,
    [0, 1],
    [1, 0.94]
  );

  const heroOpacity = useTransform(
    heroProgress,
    [0, 0.72, 1],
    [1, 1, 0]
  );

  const { scrollYProgress: productProgress } = useScroll({
    target: productRef,
    offset: ["start end", "end start"],
  });

  const productY = useTransform(
    productProgress,
    [0, 0.45, 1],
    [120, 0, -40]
  );

  const productRotate = useTransform(
    productProgress,
    [0, 0.45, 1],
    [4, 0, -1]
  );

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#090604] text-[#9C9188] selection:bg-[#C97C3E]/30 selection:text-white"
      style={{ fontFamily: FONT_BODY }}
    >
      <CursorGlow />
      <GridBackground />
      <AmbientGlow />

      <div className="relative z-10 mx-auto max-w-[1240px]">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#090604]/80 px-5 py-5 backdrop-blur-xl sm:px-8"
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="PRETHIM home"
              className="group flex items-center gap-3"
            >
              <Image
                src="/icon.png"
                alt=""
                width={30}
                height={30}
                priority
                className="h-[30px] w-[30px] object-contain transition-transform duration-500 group-hover:scale-105"
              />

              <span className="text-[13px] font-semibold tracking-[0.18em] text-[#F5EFE6] transition-colors group-hover:text-[#C97C3E]">
                PRETHIM
              </span>
            </Link>

            <nav
              aria-label="Primary navigation"
              className="flex items-center gap-6"
            >
              <Link
                href="/docs"
                className="hidden text-xs text-[#756B63] transition-colors hover:text-[#F5EFE6] sm:block"
              >
                Documentation
              </Link>

              <Link
                href="/reden"
                className="group flex items-center gap-2 text-xs text-[#F5EFE6]"
              >
                REDEN

                <ArrowRight
                  aria-hidden="true"
                  className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </nav>
          </div>
        </motion.header>

        {/* HERO */}
        <motion.section
          ref={heroRef}
          style={{
            y: heroY,
            scale: heroScale,
            opacity: heroOpacity,
          }}
          className="px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-32 lg:pt-40"
        >
          <div className="max-w-[1000px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-8 flex items-center gap-4"
            >
              <Image
                src="/icon.png"
                alt=""
                width={26}
                height={26}
                className="h-[26px] w-[26px] object-contain opacity-85"
              />

              <span
                className="h-px w-12"
                style={{ backgroundColor: COPPER }}
              />

              <span className="text-xs uppercase tracking-[0.18em] text-[#766C64]">
                Adaptive Decision Infrastructure
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 45 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="max-w-[980px] text-[3.35rem] font-semibold leading-[0.92] tracking-[-0.06em] text-[#F5EFE6] sm:text-6xl md:text-[6.6rem] lg:text-[7.4rem]"
            >
              Infrastructure
              <br />
              for software
              <br />
              <span style={{ color: COPPER }}>that adapts.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
            >
              <p className="max-w-[540px] text-lg leading-8 text-[#8B8077] sm:text-xl">
                PRETHIM builds the infrastructure between what is happening
                inside an application and what that application should do
                next.
              </p>

              <Link
                href="#infrastructure"
                className="group inline-flex w-fit items-center gap-3 text-xs font-medium uppercase tracking-[0.12em] text-[#F5EFE6]"
              >
                Discover the infrastructure

                <ArrowDown
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-1"
                />
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* TECHNOLOGY STRIP */}
        <TechnologyStrip />

        {/* INFRASTRUCTURE */}
        <section
          id="infrastructure"
          className="px-5 py-32 sm:px-8 sm:py-44"
        >
          <div className="grid gap-20 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
            <Reveal>
              <div className="sticky top-32">
                <p
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: COPPER }}
                >
                  The PRETHIM layer
                </p>

                <h2 className="mt-7 max-w-md text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
                  Software should respond to context.
                </h2>

                <p className="mt-7 max-w-sm text-base leading-7 text-[#756B63]">
                  PRETHIM provides the infrastructure for applications that
                  need to interpret changing conditions and respond
                  accordingly.
                </p>
              </div>
            </Reveal>

            <div>
              {INFRASTRUCTURE.map((item, index) => (
                <InfrastructureRow
                  key={item.number}
                  {...item}
                  index={index}
                />
              ))}

              <div className="border-t border-white/[0.07]" />
            </div>
          </div>
        </section>

        {/* BRAND TRANSITION */}
        <section className="relative overflow-hidden px-5 pb-32 sm:px-8 sm:pb-44">
          <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-[#C97C3E]/50 via-white/[0.08] to-transparent sm:inset-x-8" />

          <div className="pt-24 sm:pt-32">
            <Reveal>
              <div className="flex items-center gap-4">
                <span
                  className="h-px w-14"
                  style={{ backgroundColor: COPPER }}
                />

                <span className="text-xs uppercase tracking-[0.18em] text-[#756B63]">
                  First product
                </span>
              </div>
            </Reveal>

            <motion.div
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-14"
            >
              <div className="mb-8">
                <span
                  className="text-[110px] font-semibold leading-[0.7] tracking-[-0.08em] text-white/[0.035] sm:text-[170px]"
                  aria-hidden="true"
                >
                  01
                </span>
              </div>

              <Image
                src="/reden-logo.png"
                alt="REDEN"
                width={500}
                height={140}
                className="h-auto w-[250px] object-contain object-left sm:w-[390px]"
              />

              <div className="mt-8 max-w-3xl">
                <h2 className="text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#F5EFE6] sm:text-5xl">
                  Revenue Decision Engine
                </h2>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8C8178] sm:text-xl">
                  The decision layer for applications that need to turn live
                  signals into meaningful action.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* REDEN INTRO */}
        <section
          id="reden"
          className="relative px-5 pb-24 sm:px-8 sm:pb-32"
        >
          <div className="grid gap-16 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
            <Reveal direction="left">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: COPPER }}
                >
                  PRETHIM / REDEN
                </p>

                <h2 className="mt-7 max-w-lg text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
                  From live signals to a decision.
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div>
                <p className="max-w-2xl text-xl leading-9 text-[#9B9087] sm:text-2xl">
                  REDEN evaluates application context and determines what
                  should happen next.
                </p>

                <p className="mt-7 max-w-xl text-base leading-8 text-[#70665E]">
                  Built on PRETHIM&apos;s adaptive infrastructure, REDEN gives
                  applications a decision layer that can operate while the
                  user is still in the session.
                </p>

                <Link
                  href="/reden"
                  aria-label="Explore REDEN, the Revenue Decision Engine"
                  className="group mt-9 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.12em] text-[#F5EFE6]"
                >
                  Explore REDEN

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* REDEN SCREENSHOT 1 */}
        <section className="overflow-hidden px-5 pb-36 sm:px-8 sm:pb-48">
          <ProductReveal
            image="/reden-page.png"
            alt="REDEN dashboard showing adaptive revenue decisions"
            priority
            className="mx-auto max-w-[1140px]"
          />
        </section>

        {/* REDEN STORY */}
        <section className="px-5 pb-32 sm:px-8 sm:pb-44">
          <div className="grid gap-16 lg:grid-cols-[1fr_0.75fr] lg:items-end lg:gap-24">
            <Reveal>
              <div>
                <p
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: COPPER }}
                >
                  The decision layer
                </p>

                <h2 className="mt-7 max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
                  The right response, while the context still matters.
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="max-w-md text-base leading-8 text-[#7E746C]">
                REDEN sits close to the application layer, where signals can
                be evaluated and decisions can influence what happens next.
              </p>
            </Reveal>
          </div>
        </section>

        {/* REDEN SCREENSHOT 2 */}
        <section
          ref={productRef}
          className="relative overflow-hidden px-5 pb-36 sm:px-8 sm:pb-48"
        >
          <motion.div
            style={{
              y: productY,
              rotateX: productRotate,
              transformPerspective: 1600,
            }}
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative mx-auto max-w-[1140px]"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-16 rounded-full blur-[110px]"
              style={{ backgroundColor: `${COPPER}08` }}
            />

            <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#100B08] shadow-[0_50px_140px_rgba(0,0,0,0.6)]">
              <Image
                src="/reden-page2.png"
                alt="REDEN product interface"
                width={1600}
                height={1000}
                className="block h-auto w-full"
              />
            </div>
          </motion.div>
        </section>

        {/* REDEN CTA */}
        <section className="px-5 pb-36 sm:px-8 sm:pb-48">
          <div className="border-t border-white/[0.07] pt-20 sm:pt-28">
            <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
              <Reveal>
                <div>
                  <Image
                    src="/reden-logo.png"
                    alt="REDEN"
                    width={500}
                    height={140}
                    className="h-auto w-[210px] object-contain object-left sm:w-[280px]"
                  />

                  <h2 className="mt-8 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#F5EFE6] sm:text-6xl">
                    The decision engine built on PRETHIM.
                  </h2>
                </div>
              </Reveal>

              <Reveal direction="right">
                <Link
                  href="/reden"
                  aria-label="Open REDEN"
                  className="group flex w-fit items-center gap-4 border border-white/[0.10] px-6 py-4 text-xs font-medium uppercase tracking-[0.12em] text-[#F5EFE6] transition-colors hover:border-[#C97C3E]/50 hover:text-[#C97C3E]"
                >
                  Open REDEN

                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* PARTNER INVITATION */}
        <section className="px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-32">
          <Reveal>
            <div className="border-t border-white/[0.07] pt-16 sm:pt-20">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-medium leading-[1.08] tracking-[-0.04em] text-[#F5EFE6] sm:text-4xl">
                  Do you want to build with PRETHIM?
                </h2>

                <p className="mt-5 max-w-lg text-sm leading-7 text-[#756B63] sm:text-base">
                  We&apos;re working with teams building software that needs
                  to make better decisions in real time.
                </p>

                <Link
                  href="/partnership"
                  className="group mt-7 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#C98B59] transition-colors hover:text-[#E0A16D]"
                >
                  Become a partner

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-8 sm:py-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Image
                src="/prethim-watermark.png"
                alt="PRETHIM"
                width={150}
                height={42}
                className="h-auto w-[120px] object-contain object-left opacity-90"
              />

              <p className="mt-4 text-xs leading-6 text-[#554D47]">
                Infrastructure for software that adapts.
              </p>
            </div>

            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-[#5F5650]"
            >
              <Link
                href="/docs"
                className="transition-colors hover:text-[#F5EFE6]"
              >
                Docs
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
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}