"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  Plus,
  RefreshCw,
  Store,
} from "lucide-react";

type StoreStatus = "active" | "pending" | "disabled" | string;

type StoreConnection = {
  id: string;
  name: string;
  domain?: string | null;
  platform?: string | null;
  siteId: string;
  status?: StoreStatus;
};

const COPPER = "#C97C3E";
const EASE = [0.19, 1, 0.22, 1] as const;

function StatusDot({
  status,
}: {
  status: "live" | "waiting" | "idle";
}) {
  if (status === "live") {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#72B77B] opacity-25" />
        <span className="relative h-2 w-2 rounded-full bg-[#72B77B]" />
      </span>
    );
  }

  if (status === "waiting") {
    return (
      <motion.span
        className="h-2 w-2 rounded-full bg-[#A08A5F]"
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  return (
    <span className="h-2 w-2 rounded-full bg-[#4B4642]" />
  );
}

function SectionNumber({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="pointer-events-none select-none text-[5rem] font-semibold leading-none tracking-[-0.08em] text-white/[0.035] sm:text-[7rem]">
      {children}
    </span>
  );
}

export default function RedenAddStorePage() {
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStores = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reden/stores", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load storefronts."
        );
      }

      const nextStores = Array.isArray(data?.stores)
        ? data.stores
        : [];

      /*
       * Every connected storefront must expose a valid siteId.
       * siteId is the REDEN tenant identifier and is required
       * by subsequent developer/dashboard routes.
       */
      const validStores = nextStores.filter(
        (store: StoreConnection) =>
          typeof store?.siteId === "string" &&
          store.siteId.trim().length > 0
      );

      setStores(validStores);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load storefronts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStores();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090806] text-[#D8D2CC]">
      {/* AMBIENT FIELD */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div
          className="absolute left-1/2 top-[-280px] h-[620px] w-[760px] -translate-x-1/2 rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(201,124,62,0.11), transparent 68%)",
          }}
        />

        <div className="absolute right-[-180px] top-[55%] h-[520px] w-[520px] rounded-full bg-white/[0.012] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1160px] px-5 sm:px-7 lg:px-8">
        {/* HEADER */}
        <header className="flex h-[72px] items-center justify-between border-b border-white/[0.07]">
          <Link
            href="/reden-addstore"
            className="group flex items-center"
          >
            <Image
              src="/reden-logo.png"
              alt="REDEN"
              width={260}
              height={72}
              priority
              className="h-[25px] w-auto object-contain opacity-95 transition-opacity duration-300 group-hover:opacity-70"
            />
          </Link>

          <div className="flex items-center gap-3">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: COPPER,
                boxShadow: `0 0 14px ${COPPER}55`,
              }}
            />

            <span className="hidden text-[9px] font-medium uppercase tracking-[0.2em] text-[#625B55] sm:block">
              Developer environment
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-[960px]">
          {/* INTRO */}
          <section className="pb-16 pt-20 sm:pb-20 sm:pt-28">
            <motion.div
              initial={{
                opacity: 0,
                y: 22,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.75,
                ease: EASE,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-px w-8"
                  style={{ background: COPPER }}
                />

                <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#625B55]">
                  REDEN INTEGRATION
                </span>
              </div>

              <h1 className="mt-7 max-w-[800px] text-[3.2rem] font-semibold leading-[0.92] tracking-[-0.065em] text-[#F1ECE7] sm:text-[4.8rem] lg:text-[5.8rem]">
                Welcome to
                <br />
                <span style={{ color: COPPER }}>REDEN.</span>
              </h1>

              <div className="mt-8 flex max-w-[660px] flex-col gap-5 sm:flex-row sm:items-start">
                <p className="text-sm leading-7 text-[#847B73] sm:text-[15px] sm:leading-7">
                  Adaptive decision infrastructure for the
                  storefronts you build and maintain.
                </p>

                <div className="hidden h-10 w-px bg-white/[0.08] sm:block" />

                <p className="max-w-[290px] text-[11px] leading-6 text-[#554F4A]">
                  Connect a storefront, complete its integration,
                  and manage the decision layer from one place.
                </p>
              </div>
            </motion.div>
          </section>

          {/* PRODUCT MARK */}
          <motion.section
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: EASE,
            }}
            className="relative border-y border-white/[0.06] py-9 sm:py-11"
          >
            <div
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-28 w-64 -translate-y-1/2 rounded-full blur-[90px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(201,124,62,0.10), transparent 70%)",
              }}
            />

            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <Image
                src="/reden-logo.png"
                alt="REDEN"
                width={520}
                height={140}
                className="h-auto w-[240px] object-contain opacity-90 sm:w-[310px]"
              />

              <div className="flex items-center gap-3">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: COPPER }}
                />

                <span className="text-[9px] uppercase tracking-[0.18em] text-[#625B55]">
                  Decision ENGINE
                </span>
              </div>
            </div>
          </motion.section>

          {/* SETUP GUIDE */}
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              ease: EASE,
            }}
            className="flex items-center gap-4 py-8"
          >
            <div className="h-px flex-1 bg-white/[0.055]" />

            <span className="text-center text-[8px] font-medium uppercase tracking-[0.18em] text-[#4B4540]">
              REDEN will guide you through the setup
            </span>

            <div className="h-px flex-1 bg-white/[0.055]" />
          </motion.div>

          {/* STOREFRONTS */}
          <section className="pb-24 pt-8 sm:pb-32">
            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.65,
                delay: 0.45,
                ease: EASE,
              }}
            >
              {/* SECTION HEADING */}
              <div className="relative mb-8">
                <SectionNumber>01</SectionNumber>

                <div className="relative -mt-7 sm:-mt-10">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                      <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#5B544E]">
                        Your environment
                      </span>

                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#E7E1DB] sm:text-3xl">
                        Connected storefronts
                      </h2>

                      <p className="mt-2 max-w-lg text-[11px] leading-6 text-[#655E58]">
                        Select an existing integration or create
                        a new one.
                      </p>
                    </div>

                    {stores.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="h-px w-5 bg-white/[0.08]" />

                        <span className="text-[9px] uppercase tracking-[0.16em] text-[#514B46]">
                          {stores.length}{" "}
                          {stores.length === 1
                            ? "store"
                            : "stores"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LOADING */}
              {loading ? (
                <div className="border border-white/[0.075] bg-white/[0.018]">
                  <div className="flex min-h-[150px] items-center justify-center">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-[#625B55]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading environment
                    </div>
                  </div>
                </div>
              ) : stores.length > 0 ? (
                <div className="overflow-hidden border border-white/[0.075] bg-[#0C0A08]">
                  {stores.map((store, index) => (
                    <motion.div
                      key={store.id || store.siteId}
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.4,
                        delay: 0.5 + index * 0.07,
                        ease: EASE,
                      }}
                    >
                      <Link
                        /*
                         * siteId is the authoritative REDEN tenant
                         * identifier. Do not route using the database
                         * connection id.
                         */
                        href={`/reden-developer?siteId=${encodeURIComponent(
                          store.siteId
                        )}`}
                        className={`group relative flex min-h-[92px] w-full items-center justify-between px-5 py-5 text-left transition-colors duration-300 hover:bg-white/[0.028] sm:px-7 ${
                          index !== stores.length - 1
                            ? "border-b border-white/[0.055]"
                            : ""
                        }`}
                      >
                        {/* HOVER ACCENT */}
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 left-0 top-0 w-px scale-y-0 origin-bottom transition-transform duration-300 group-hover:scale-y-100"
                          style={{ background: COPPER }}
                        />

                        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/[0.08] bg-white/[0.025] text-sm font-semibold uppercase text-[#827A73] transition-colors duration-300 group-hover:border-white/[0.12] group-hover:text-[#B6ADA5]">
                            {(store.name || "S")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium text-[#D9D2CC] transition-colors group-hover:text-[#F0EBE6]">
                              {store.name}
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px] text-[#5E5751]">
                              {store.domain && (
                                <span className="truncate">
                                  {store.domain}
                                </span>
                              )}

                              {store.platform && (
                                <>
                                  {store.domain && (
                                    <span className="text-[#3E3935]">
                                      /
                                    </span>
                                  )}

                                  <span>
                                    {store.platform}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-5 flex shrink-0 items-center gap-5">
                          <span className="hidden items-center gap-2.5 text-[8px] font-medium uppercase tracking-[0.12em] sm:flex">
                            <StatusDot
                              status={
                                store.status === "active"
                                  ? "live"
                                  : store.status === "disabled"
                                  ? "idle"
                                  : "waiting"
                              }
                            />

                            <span
                              className={
                                store.status === "active"
                                  ? "text-[#72B77B]"
                                  : store.status === "disabled"
                                  ? "text-[#4B4642]"
                                  : "text-[#70675F]"
                              }
                            >
                              {store.status === "active"
                                ? "Connected"
                                : store.status === "disabled"
                                ? "Disabled"
                                : "Pending"}
                            </span>
                          </span>

                          <div className="flex h-8 w-8 items-center justify-center border border-white/[0.06] text-[#48423D] transition-all duration-300 group-hover:border-white/[0.12] group-hover:text-[#A39A92]">
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="border border-white/[0.075] bg-[#0C0A08]">
                  <div className="flex min-h-[170px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-11 w-11 items-center justify-center border border-white/[0.08] bg-white/[0.025] text-[#68615B]">
                      <Store className="h-4 w-4" />
                    </div>

                    <div className="mt-5 text-[13px] font-medium text-[#A9A29C]">
                      No storefronts connected.
                    </div>

                    <p className="mt-2 max-w-sm text-[10px] leading-5 text-[#5C554F]">
                      Create your first REDEN integration to
                      begin.
                    </p>
                  </div>
                </div>
              )}

              {/* ADD STORE */}
              <Link
                href="/reden-developer?new=1"
                className="group relative mt-4 flex min-h-[82px] w-full items-center justify-between border border-dashed border-white/[0.10] bg-white/[0.018] px-5 py-5 transition-all duration-300 hover:border-[#C97C3E]/40 hover:bg-[#C97C3E]/[0.025] sm:px-7"
              >
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 top-0 w-px scale-y-0 origin-bottom transition-transform duration-300 group-hover:scale-y-100"
                  style={{ background: COPPER }}
                />

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.025] text-[#635C55] transition-all duration-300 group-hover:border-[#C97C3E]/25 group-hover:text-[#C97C3E]">
                    <Plus className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="text-[12px] font-medium text-[#AAA39D] transition-colors group-hover:text-[#D4CDC6]">
                      Add new storefront
                    </div>

                    <div className="mt-1 text-[9px] text-[#59524C]">
                      Create a new REDEN integration
                    </div>
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center border border-white/[0.06] text-[#45403B] transition-all duration-300 group-hover:border-[#C97C3E]/20 group-hover:text-[#C97C3E]">
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </Link>

              {/* ERROR */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center justify-between border border-[#B9684A]/20 bg-[#B9684A]/[0.025] px-4 py-3.5"
                >
                  <p className="text-[10px] leading-5 text-[#C8795B]">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() => void loadStores()}
                    aria-label="Retry loading storefronts"
                    className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center border border-[#B9684A]/15 text-[#C8795B] transition-colors hover:bg-[#B9684A]/[0.06]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-white/[0.06] py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/icon.png"
                alt="PRETHIM"
                width={32}
                height={32}
                className="h-5 w-5 object-contain opacity-65"
              />

              <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-[#46413C]">
                PRETHIM / REDEN
              </span>
            </div>

            <div className="flex items-center gap-5 text-[8px] font-medium uppercase tracking-[0.12em] text-[#3F3A36]">
              <Link
                href="/docs"
                className="transition-colors hover:text-[#8A8179]"
              >
                Docs
              </Link>

              <span>API</span>

              <span>Status</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}