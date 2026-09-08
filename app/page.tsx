  "use client";

  import React, { useRef } from "react";
  import Image from "next/image";
  import Link from "next/link";
  import {
    ArrowRight,
    ArrowUpRight,
  } from "lucide-react";
  import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
    useSpring,
    Variants,
  } from "framer-motion";

  const EASE = [0.16, 1, 0.3, 1] as const;

  const FONT_BODY = `Inter, "Helvetica Neue", Arial, sans-serif`;

  const STATES = [
    {
      number: "01",
      label: "EVALUATED",
      color: "#7C93A6",
      title: "Understand the moment.",
      text: "Signals become context. Context becomes an evaluation of what is happening now.",
    },
    {
      number: "02",
      label: "ACTIONED",
      color: "#C97C3E",
      title: "Act when it matters.",
      text: "PRETHIM chooses whether a moment deserves action and commits when the value is there.",
    },
    {
      number: "03",
      label: "COMPLETED",
      color: "#7FA382",
      title: "Learn from what happened.",
      text: "Outcomes become new signals, continuously improving the decisions that follow.",
    },
  ];

  /* ---------------------------------------------------------------
    Reveal
  --------------------------------------------------------------- */

  function Reveal({
    children,
    delay = 0,
    className = "",
    distance = 18,
  }: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    distance?: number;
  }) {
    const reducedMotion = useReducedMotion();

    return (
      <motion.div
        initial={{
          opacity: 0,
          y: reducedMotion ? 0 : distance,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          margin: "-100px",
        }}
        transition={{
          duration: reducedMotion ? 0.01 : 0.9,
          delay: reducedMotion ? 0 : delay,
          ease: EASE,
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  /* ---------------------------------------------------------------
    Hero word reveal
  --------------------------------------------------------------- */

  const wordVariants: Variants = {
    hidden: {
      y: "110%",
      opacity: 0,
    },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        duration: 1,
        ease: EASE,
      },
    },
  };

  function HeroHeadline() {
    const reducedMotion = useReducedMotion();

    const lines = ["Software that", "knows what", "to do next."];

    return (
      <h1 className="text-[3.7rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[#ECE4D8] sm:text-[5rem] lg:text-[5.7rem]">
        {lines.map((line, index) => (
          <span
            key={line}
            className="block overflow-hidden"
          >
            <motion.span
              variants={wordVariants}
              initial="hidden"
              animate="visible"
              transition={{
                delay: reducedMotion ? 0 : 0.15 + index * 0.07,
              }}
              className="inline-block"
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h1>
    );
  }

  /* ---------------------------------------------------------------
    Button
  --------------------------------------------------------------- */

  function Button({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    const reducedMotion = useReducedMotion();

    return (
      <Link
        href={href}
        className="group relative inline-flex h-11 items-center gap-3 overflow-hidden bg-[#ECE4D8] px-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#14110D] outline-none transition-[box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110D]"
      >
        {!reducedMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 origin-left bg-[#C97C3E]"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{
              duration: 0.45,
              ease: EASE,
            }}
          />
        )}

        <span className="relative z-10">
          {children}
        </span>

        <ArrowRight
          aria-hidden="true"
          className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
        />
      </Link>
    );
  }

  /* ---------------------------------------------------------------
    Product image
  --------------------------------------------------------------- */

  function ProductImage({
    src,
    alt,
    priority = false,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
  }) {
    const ref = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
      target: ref,
      offset: ["start end", "end start"],
    });

    const y = useTransform(
      scrollYProgress,
      [0, 1],
      reducedMotion ? [0, 0] : [18, -18]
    );

    const scale = useTransform(
      scrollYProgress,
      [0, 0.45, 1],
      reducedMotion ? [1, 1, 1] : [0.985, 1, 0.99]
    );

    const smoothY = useSpring(y, {
      stiffness: 80,
      damping: 24,
      mass: 0.4,
    });

    return (
      <motion.div
        ref={ref}
        style={{
          y: smoothY,
          scale,
        }}
        initial={{
          opacity: 0,
          scale: reducedMotion ? 1 : 0.965,
          y: reducedMotion ? 0 : 24,
        }}
        whileInView={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          margin: "-100px",
        }}
        transition={{
          duration: reducedMotion ? 0.01 : 1.1,
          ease: EASE,
        }}
        className="relative overflow-hidden rounded-xl border border-[#30291F] bg-[#1B1712]"
      >
        <motion.div
          aria-hidden="true"
          className="absolute left-0 right-0 top-0 z-10 h-px bg-[#C97C3E]/30"
          initial={{
            scaleX: 0,
            transformOrigin: "left",
          }}
          whileInView={{
            scaleX: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: reducedMotion ? 0.01 : 1.2,
            delay: reducedMotion ? 0 : 0.25,
            ease: EASE,
          }}
        />

        <motion.div
          initial={{
            scale: reducedMotion ? 1 : 1.025,
          }}
          whileInView={{
            scale: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: reducedMotion ? 0.01 : 1.5,
            ease: EASE,
          }}
        >
          <Image
            src={src}
            alt={alt}
            width={1800}
            height={1100}
            priority={priority}
            className="block h-auto w-full"
          />
        </motion.div>
      </motion.div>
    );
  }

  /* ---------------------------------------------------------------
    Cinematic state row
  --------------------------------------------------------------- */

  function StateRow({
    state,
    index,
  }: {
    state: (typeof STATES)[number];
    index: number;
  }) {
    const reducedMotion = useReducedMotion();

    return (
      <Reveal
        delay={index * 0.08}
        distance={22}
      >
        <motion.div
          whileHover={reducedMotion ? undefined : "hover"}
          className="group relative overflow-hidden border-b border-[#29231C]"
        >
          {/* Cinematic background number */}

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none text-[9rem] font-semibold leading-none tracking-[-0.08em] sm:-right-2 sm:text-[13rem] lg:text-[16rem]"
            style={{
              color: state.color,
            }}
            initial={{
              opacity: 0.025,
              x: 15,
            }}
            variants={{
              hover: {
                opacity: 0.075,
                x: 0,
              },
            }}
            transition={{
              duration: 0.8,
              ease: EASE,
            }}
          >
            {state.number}
          </motion.div>

          <div className="relative grid gap-8 py-12 sm:grid-cols-[120px_1fr] sm:py-16 lg:grid-cols-[180px_1fr] lg:py-20">
            {/* Number */}

            <div className="relative overflow-hidden">
              <motion.div
                initial={{
                  y: reducedMotion ? 0 : "100%",
                }}
                whileInView={{
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: reducedMotion ? 0.01 : 1,
                  delay: reducedMotion ? 0 : index * 0.08,
                  ease: EASE,
                }}
                className="text-[4.5rem] font-semibold leading-none tracking-[-0.07em] text-[#ECE4D8]/90 sm:text-[5.5rem] lg:text-[6.5rem]"
              >
                {state.number}
              </motion.div>

              <motion.div
                initial={{
                  width: 0,
                }}
                whileInView={{
                  width: 42,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: reducedMotion ? 0.01 : 0.7,
                  delay: reducedMotion ? 0 : 0.25 + index * 0.08,
                  ease: EASE,
                }}
                className="mt-5 h-px"
                style={{
                  backgroundColor: state.color,
                }}
              />
            </div>

            {/* Content */}

            <div className="relative max-w-[650px] self-end">
              <div className="mb-4 flex items-center gap-3">
                <motion.span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: state.color,
                  }}
                  variants={{
                    hover: {
                      scale: 1.8,
                    },
                  }}
                  transition={{
                    duration: 0.3,
                    ease: EASE,
                  }}
                />

                <span
                  className="text-[10px] font-semibold tracking-[0.18em]"
                  style={{
                    color: state.color,
                  }}
                >
                  {state.label}
                </span>
              </div>

              <motion.h3
                variants={{
                  hover: {
                    x: 5,
                  },
                }}
                transition={{
                  duration: 0.45,
                  ease: EASE,
                }}
                className="text-2xl font-medium leading-[1.1] tracking-[-0.035em] text-[#ECE4D8] sm:text-3xl lg:text-[2.5rem]"
              >
                {state.title}
              </motion.h3>

              <p className="mt-5 max-w-[560px] text-sm leading-[1.8] text-[#7D756A] sm:text-base">
                {state.text}
              </p>
            </div>
          </div>
        </motion.div>
      </Reveal>
    );
  }

  /* ---------------------------------------------------------------
    Main page
  --------------------------------------------------------------- */

  export default function HomePage() {
    const heroRef = useRef<HTMLElement>(null);
    const reducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
      target: heroRef,
      offset: ["start start", "end start"],
    });

    const heroY = useTransform(
      scrollYProgress,
      [0, 1],
      reducedMotion ? [0, 0] : [0, -45]
    );

    const heroOpacity = useTransform(
      scrollYProgress,
      [0, 0.75],
      reducedMotion ? [1, 1] : [1, 0.35]
    );

    const smoothHeroY = useSpring(heroY, {
      stiffness: 80,
      damping: 25,
      mass: 0.5,
    });

    const smoothOpacity = useSpring(heroOpacity, {
      stiffness: 80,
      damping: 25,
    });

    return (
      <main
        style={{
          fontFamily: FONT_BODY,
        }}
        className="min-h-screen overflow-x-hidden bg-[#14110D] text-[#8F8676] selection:bg-[#C97C3E]/30 selection:text-[#ECE4D8]"
      >
        {/* Subtle grain */}

        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-noise opacity-[0.025] bg-no-repeat"
        />

        <div className="relative z-10">
          {/* ========================================================
              NAVIGATION
          ======================================================== */}

          <motion.header
            initial={{
              opacity: 0,
              y: reducedMotion ? 0 : -12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: reducedMotion ? 0.01 : 0.8,
              ease: EASE,
            }}
            className="border-b border-[#252019]"
          >
            <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8 lg:px-10">
              <Link
                href="/"
                aria-label="PRETHIM home"
                className="group flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#14110D]"
              >
                <Image
                  src="/icon.png"
                  alt="PRETHIM"
                  width={30}
                  height={30}
                  priority
                  className="h-[30px] w-[30px] object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </Link>

              <nav
                aria-label="Primary navigation"
                className="hidden items-center gap-8 md:flex"
              >
                {["Product", "Approach", "Docs"].map(
                  (item, index) => (
                    <motion.div
                      key={item}
                      initial={{
                        opacity: 0,
                        y: reducedMotion ? 0 : -5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: reducedMotion ? 0.01 : 0.6,
                        delay: reducedMotion
                          ? 0
                          : 0.15 + index * 0.05,
                        ease: EASE,
                      }}
                    >
                      <Link
                        href={
                          item === "Docs"
                            ? "/docs"
                            : `#${item.toLowerCase()}`
                        }
                        className="text-[13px] text-[#746C60] outline-none transition-colors duration-300 hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
                      >
                        {item}
                      </Link>
                    </motion.div>
                  )
                )}
              </nav>

              <div className="flex items-center gap-5">
                <Link
                  href="/signin"
                  className="hidden text-[13px] text-[#746C60] outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8] sm:block"
                >
                  Sign in
                </Link>

                <motion.div
                  whileHover={reducedMotion ? undefined : { y: -1 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                >
                  <Link
                    href="/signin"
                    className="inline-flex h-9 items-center gap-2 border border-[#352D24] px-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#ECE4D8] outline-none transition-colors hover:border-[#C97C3E]/60 focus-visible:border-[#C97C3E] focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110D]"
                  >
                    Get started
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-3 w-3"
                    />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.header>

          {/* ========================================================
              HERO
          ======================================================== */}

          <motion.section
            ref={heroRef}
            style={{
              y: smoothHeroY,
              opacity: smoothOpacity,
            }}
            aria-labelledby="hero-heading"
            className="mx-auto max-w-[1200px] px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32 lg:px-10 lg:pt-36"
          >
            <div className="grid gap-16 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:gap-16">
              <div className="max-w-[560px]">
                <Reveal distance={8}>
                  <div className="mb-8 flex items-center gap-3 text-[10px] font-semibold tracking-[0.18em] text-[#71685B]">
                    <motion.span
                      aria-hidden="true"
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: 28,
                      }}
                      transition={{
                        duration: reducedMotion ? 0.01 : 0.8,
                        delay: reducedMotion ? 0 : 0.25,
                        ease: EASE,
                      }}
                      className="h-px bg-[#C97C3E]"
                    />

                    ADAPTIVE DECISION INFRASTRUCTURE
                  </div>
                </Reveal>

                <div id="hero-heading">
                  <HeroHeadline />
                </div>

                <Reveal
                  delay={0.5}
                  distance={12}
                >
                  <p className="mt-8 max-w-[460px] text-[15px] leading-[1.75] text-[#81786B] sm:text-base">
                    PRETHIM gives software a decision layer — turning
                    real-time signals and context into actions that
                    happen when they matter.
                  </p>
                </Reveal>

                <Reveal
                  delay={0.6}
                  distance={10}
                  className="mt-9 flex flex-wrap items-center gap-5"
                >
                  <motion.div
                    whileHover={
                      reducedMotion ? undefined : { y: -1 }
                    }
                    whileTap={
                      reducedMotion ? undefined : { scale: 0.985 }
                    }
                  >
                    <Button href="/signin">
                      Get started
                    </Button>
                  </motion.div>

                  <Link
                    href="/docs"
                    className="group inline-flex h-11 items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#746C60] outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
                  >
                    Read documentation

                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </Reveal>
              </div>

              <motion.div
                initial={{
                  opacity: 0,
                  x: reducedMotion ? 0 : 28,
                  scale: reducedMotion ? 1 : 0.975,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                transition={{
                  duration: reducedMotion ? 0.01 : 1.15,
                  delay: reducedMotion ? 0 : 0.35,
                  ease: EASE,
                }}
                className="relative lg:-mr-[7vw]"
              >
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-20 -z-10 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(201,124,62,0.065), transparent 65%)",
                  }}
                  animate={
                    reducedMotion
                      ? undefined
                      : {
                          opacity: [0.55, 0.8, 0.55],
                          scale: [0.98, 1.03, 0.98],
                        }
                  }
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <ProductImage
                  src="/reden-page.png"
                  alt="REDEN product interface"
                  priority
                />

                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0.01 : 0.8,
                    delay: reducedMotion ? 0 : 1,
                  }}
                  className="mt-3 flex items-center justify-between"
                >
                  <span className="text-[9px] font-semibold tracking-[0.16em] text-[#575046]">
                    REDEN
                  </span>

                  <span className="text-[9px] tracking-[0.12em] text-[#575046]">
                    POWERED BY PRETHIM
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </motion.section>

          {/* ========================================================
              STATEMENT
          ======================================================== */}

          <section
            id="product"
            aria-labelledby="product-heading"
            className="border-y border-[#252019] bg-[#16120F]"
          >
            <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36">
              <div className="grid lg:grid-cols-[0.5fr_1.5fr] lg:gap-24">
                <div />

                <Reveal distance={16}>
                  <h2
                    id="product-heading"
                    className="max-w-[850px] text-[2.25rem] font-medium leading-[1.08] tracking-[-0.04em] text-[#ECE4D8] sm:text-4xl lg:text-[4rem]"
                  >
                    <span className="block">
                      The world changes faster than
                    </span>

                    <span className="mt-1 block text-[#777064]">
                      most software can react.
                    </span>
                  </h2>

                  <p className="mt-9 max-w-[600px] text-base leading-[1.8] text-[#7D756A]">
                    Applications are good at processing requests.
                    They&apos;re less good at deciding what those requests
                    mean in context. PRETHIM is built for that missing
                    layer.
                  </p>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ========================================================
              PRODUCT IMAGE
          ======================================================== */}

          <section
            aria-labelledby="product-view-heading"
            className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36"
          >
            <Reveal distance={10}>
              <div className="mb-12 flex items-end justify-between border-b border-[#252019] pb-8">
                <div>
                  <h2
                    id="product-view-heading"
                    className="text-3xl font-medium tracking-[-0.035em] text-[#ECE4D8] sm:text-4xl"
                  >
                    Built for decisions, not just data.
                  </h2>
                </div>

                <span className="hidden text-[9px] font-semibold tracking-[0.15em] text-[#575046] sm:block">
                  REDEN / PRODUCT VIEW
                </span>
              </div>
            </Reveal>

            <ProductImage
              src="/reden-page2.png"
              alt="REDEN product interface second view"
            />
          </section>

          {/* ========================================================
              APPROACH
          ======================================================== */}

          <section
            id="approach"
            aria-labelledby="approach-heading"
            className="border-y border-[#252019] bg-[#16120F]"
          >
            <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36">
              <Reveal distance={14}>
                <div className="mb-12 max-w-[700px]">
                  <h2
                    id="approach-heading"
                    className="text-4xl font-medium tracking-[-0.04em] text-[#ECE4D8] sm:text-5xl lg:text-6xl"
                  >
                    Evaluate.
                    <br />
                    Act.
                    <br />
                    <span className="text-[#777064]">Learn.</span>
                  </h2>

                  <p className="mt-8 max-w-[500px] text-base leading-[1.8] text-[#7D756A]">
                    Every decision follows the same fundamental loop:
                    understand the moment, commit to the right
                    response, and learn from the result.
                  </p>
                </div>
              </Reveal>

              <div>
                {STATES.map((state, index) => (
                  <StateRow
                    key={state.label}
                    state={state}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ========================================================
              PRINCIPLE
          ======================================================== */}

          <section
            aria-labelledby="principle-heading"
            className="mx-auto max-w-[1200px] px-5 py-28 sm:px-8 sm:py-36 lg:px-10 lg:py-40"
          >
            <Reveal distance={18}>
              <div className="grid lg:grid-cols-[0.5fr_1.5fr] lg:gap-24">
                <div />

                <div>
                  <h2
                    id="principle-heading"
                    className="max-w-[850px] text-[2.7rem] font-semibold leading-[1] tracking-[-0.05em] text-[#ECE4D8] sm:text-5xl lg:text-[5rem]"
                  >
                    Decisions are not a feature.
                    <br />

                    <motion.span
                      initial={{
                        opacity: reducedMotion ? 1 : 0.35,
                      }}
                      whileInView={{
                        opacity: 1,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: reducedMotion ? 0.01 : 1,
                        delay: reducedMotion ? 0 : 0.25,
                        ease: EASE,
                      }}
                      className="text-[#C97C3E]"
                    >
                      They&apos;re the product.
                    </motion.span>
                  </h2>

                  <p className="mt-9 max-w-[560px] text-base leading-[1.8] text-[#7D756A]">
                    PRETHIM is the infrastructure for software that
                    needs to decide what happens next — not simply
                    record what happened before.
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ========================================================
              CTA
          ======================================================== */}

          <section
            aria-labelledby="cta-heading"
            className="border-t border-[#252019]"
          >
            <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-36">
              <Reveal distance={12}>
                <h2
                  id="cta-heading"
                  className="max-w-[800px] text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#ECE4D8] sm:text-6xl lg:text-[5.2rem]"
                >
                  Build software
                  <br />
                  that can{" "}
                  <motion.span
                    initial={{
                      opacity: reducedMotion ? 1 : 0.35,
                    }}
                    whileInView={{
                      opacity: 1,
                    }}
                    viewport={{
                      once: true,
                    }}
                    transition={{
                      duration: reducedMotion ? 0.01 : 1,
                      ease: EASE,
                    }}
                    className="text-[#C97C3E]"
                  >
                    decide.
                  </motion.span>
                </h2>

                <p className="mt-8 max-w-[470px] text-base leading-[1.75] text-[#7D756A]">
                  Put adaptive decision-making underneath the products
                  you already build.
                </p>

                <motion.div
                  className="mt-9"
                  whileHover={
                    reducedMotion ? undefined : { y: -1 }
                  }
                  whileTap={
                    reducedMotion ? undefined : { scale: 0.985 }
                  }
                >
                  <Button href="/signin">
                    Get started
                  </Button>
                </motion.div>
              </Reveal>
            </div>
          </section>

          {/* ========================================================
              FOOTER
          ======================================================== */}

          <footer className="border-t border-[#252019]">
            <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center lg:px-10">
              <div>
                <Link
                  href="/"
                  aria-label="PRETHIM home"
                  className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-[#C97C3E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#14110D]"
                >
                  <Image
                    src="/prethim-watermark.png"
                    alt="PRETHIM"
                    width={150}
                    height={42}
                    className="h-auto w-[112px] object-contain object-left opacity-90"
                  />
                </Link>

                <p className="mt-3 text-xs text-[#575046]">
                  Adaptive decision infrastructure.
                </p>
              </div>

              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap gap-x-7 gap-y-3 text-xs text-[#575046]"
              >
                <Link
                  href="/docs"
                  className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
                >
                  Docs
                </Link>

                <Link
                  href="/signin"
                  className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
                >
                  Sign in
                </Link>

                <Link
                  href="/privacy"
                  className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
                >
                  Privacy
                </Link>

                <Link
                  href="/terms"
                  className="outline-none transition-colors hover:text-[#ECE4D8] focus-visible:text-[#ECE4D8]"
                >
                  Terms
                </Link>

                <span>© 2026 PRETHIM</span>
              </nav>
            </div>
          </footer>
        </div>
      </main>
    );
  }