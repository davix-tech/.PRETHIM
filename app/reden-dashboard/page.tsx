"use client";

import Image from "next/image";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  Globe2,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";

type Route = "overview" | "decisions" | "intelligence" | "settings";

type Message = {
  id: number;
  role: "user" | "reden";
  content: string;
};

type Conversation = {
  id: number;
  title: string;
  preview: string;
  date: string;
};

type IntelligenceResponse = {
  ok?: boolean;
  answer?: string;
  error?: string;
  details?: unknown;
};

type SiteResponse = {
  ok?: boolean;
  siteId?: string;
  name?: string | null;
  error?: string;
};

type Metrics = {
  revenue: number;
  visitors: number;
  checkouts: number;
  purchases: number;
  conversionRate: number;
};

type MetricsResponse = {
  ok?: boolean;
  siteId?: string;
  metrics?: Metrics;
  generatedAt?: string;
  error?: string;
};

const COPPER = "#C97C3E";

const NAV_ITEMS = [
  {
    key: "overview" as Route,
    label: "Overview",
    icon: LayoutDashboard,
    number: "01",
  },
  {
    key: "decisions" as Route,
    label: "Decisions",
    icon: Zap,
    number: "02",
  },
  {
    key: "intelligence" as Route,
    label: "Intelligence",
    icon: Sparkles,
    number: "03",
  },
  {
    key: "settings" as Route,
    label: "Settings",
    icon: Settings,
    number: "04",
  },
];

const SUGGESTIONS = [
  "How much did I earn today?",
  "What happened today?",
  "Why are sales down?",
  "What should I pay attention to?",
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    title: "Today's business activity",
    preview: "What happened today?",
    date: "Today",
  },
  {
    id: 2,
    title: "Revenue performance",
    preview: "How much did I earn today?",
    date: "Yesterday",
  },
];

/* =========================================================
   FORMATTING HELPERS
========================================================= */

function formatNaira(value: number): string {
  return `₦${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-NG").format(value);
}

/* =========================================================
   PAGE
========================================================= */

export default function RedenDashboardPage() {
  const [activeRoute, setActiveRoute] = useState<Route>("overview");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(
    INITIAL_CONVERSATIONS
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* -------------------------------------------------------
     SITE RESOLUTION
  ------------------------------------------------------- */

  const [siteId, setSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);

  /* -------------------------------------------------------
     METRICS
  ------------------------------------------------------- */

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [, setMetricsError] = useState<string | null>(null);
  const [, setMetricsUpdatedAt] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (resolvedSiteId: string) => {
    setMetricsLoading(true);
    setMetricsError(null);

    try {
      const response = await fetch(
        `/api/reden/metrics?siteId=${encodeURIComponent(resolvedSiteId)}`,
        { cache: "no-store" }
      );

      const raw = await response.text();
      const data: MetricsResponse = raw ? JSON.parse(raw) : {};

      if (!response.ok || !data.ok || !data.metrics) {
        throw new Error(
          data.error || "REDEN could not load your business metrics."
        );
      }

      setMetrics(data.metrics);
      setMetricsUpdatedAt(data.generatedAt ?? new Date().toISOString());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "REDEN could not load your business metrics.";

      setMetricsError(message);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const response = await fetch("/api/reden/site", {
          cache: "no-store",
        });

        const raw = await response.text();
        const data: SiteResponse = raw ? JSON.parse(raw) : {};

        if (cancelled) return;

        if (!response.ok || !data.ok || !data.siteId) {
          setSiteError(
            data.error || "No connected storefront was found."
          );
          setMetricsLoading(false);
          return;
        }

        setSiteId(data.siteId);
        setSiteName(data.name ?? null);

        await fetchMetrics(data.siteId);
      } catch {
        if (!cancelled) {
          setSiteError(
            "Could not reach REDEN to resolve your storefront."
          );
          setMetricsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [fetchMetrics]);

  /* -------------------------------------------------------
     CHAT
  ------------------------------------------------------- */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();

    if (!question || isThinking) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/reden/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          ...(siteId ? { siteId } : {}),
        }),
        cache: "no-store",
      });

      const raw = await response.text();

      let data: IntelligenceResponse;

      try {
        data = raw ? (JSON.parse(raw) as IntelligenceResponse) : {};
      } catch {
        throw new Error("REDEN returned an invalid response.");
      }

      if (!response.ok || !data.ok || !data.answer) {
        throw new Error(
          data.error || "REDEN could not answer the question."
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "reden",
          content: data.answer as string,
        },
      ]);

      setConversations((current) => [
        {
          id: Date.now(),
          title:
            question.length > 38
              ? `${question.slice(0, 38)}...`
              : question,
          preview: question,
          date: "Just now",
        },
        ...current,
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "REDEN could not complete the analysis.";

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "reden",
          content: message,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function askQuestion(question: string) {
    setInput(question);
    setActiveRoute("intelligence");
  }

  function navigate(route: Route) {
    setActiveRoute(route);
    setMobileMenuOpen(false);
  }

  const hasConversation = messages.length > 0;
  const storeLabel = siteName || "Store";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080706] text-white">
      {/* =====================================================
          BACKGROUND ATMOSPHERE
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-[18%] top-[-280px] h-[600px] w-[600px] rounded-full blur-[140px]"
          style={{ background: `${COPPER}08` }}
        />

        <div
          className="absolute bottom-[-320px] right-[-100px] h-[600px] w-[600px] rounded-full blur-[150px]"
          style={{ background: `${COPPER}05` }}
        />
      </div>

      {/* =====================================================
          FLOATING DESKTOP NAVIGATION
      ===================================================== */}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden justify-center px-6 pt-5 lg:flex">
        <header className="pointer-events-auto flex h-[58px] w-full max-w-[1040px] items-center rounded-2xl border border-white/[0.085] bg-[#11100f]/80 px-2 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => navigate("overview")}
            aria-label="Go to REDEN overview"
            className="group flex shrink-0 items-center rounded-xl px-3.5 py-2 transition hover:bg-white/[0.035]"
          >
            <Image
              src="/reden-logo.png"
              alt="REDEN"
              width={150}
              height={40}
              priority
              className="h-auto w-[102px] object-contain opacity-95 transition duration-300 group-hover:opacity-100"
            />
          </button>

          <div className="mx-4 h-6 w-px bg-white/[0.07]" />

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = activeRoute === item.key;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.key)}
                  className={[
                    "group relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 transition-all duration-300",
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-white/35 hover:bg-white/[0.035] hover:text-white/70",
                  ].join(" ")}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.8}
                    className={
                      active
                        ? "text-[#C97C3E]"
                        : "text-white/30 group-hover:text-white/55"
                    }
                  />

                  <span className="text-[11px] font-medium">
                    {item.label}
                  </span>

                  {active && (
                    <span
                      className="absolute bottom-[3px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full"
                      style={{ background: COPPER }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inset-0 animate-ping rounded-full"
                  style={{ background: `${COPPER}66` }}
                />
                <span
                  className="relative h-1.5 w-1.5 rounded-full"
                  style={{ background: COPPER }}
                />
              </span>

              <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/35">
                Connected
              </span>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 transition hover:bg-white/[0.05]"
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ background: `${COPPER}12` }}
              >
                <Store
                  size={12}
                  style={{ color: COPPER }}
                />
              </div>

              <span className="max-w-[100px] truncate text-[10px] font-medium text-white/55">
                {storeLabel}
              </span>
            </button>
          </div>
        </header>
      </div>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 flex h-[62px] items-center justify-between border-b border-white/[0.06] bg-[#090807]/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => navigate("overview")}
          aria-label="Go to REDEN overview"
          className="flex items-center"
        >
          <Image
            src="/reden-logo.png"
            alt="REDEN"
            width={150}
            height={40}
            priority
            className="h-auto w-[92px] object-contain"
          />
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]"
        >
          {mobileMenuOpen ? <X size={17} /> : <MoreHorizontal size={17} />}
        </button>
      </header>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-x-3 top-[70px] z-50 rounded-2xl border border-white/[0.08] bg-[#11100f]/95 p-2 shadow-2xl backdrop-blur-2xl lg:hidden">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4">
            <Image
              src="/icon.png"
              alt="PRETHIM"
              width={40}
              height={40}
              className="h-7 w-7 object-contain opacity-75"
            />

            <div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                PRETHIM
              </div>
              <div className="mt-0.5 text-[10px] text-white/40">
                Decision infrastructure
              </div>
            </div>
          </div>

          <div className="pt-2">
            {NAV_ITEMS.map((item) => {
              const active = activeRoute === item.key;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.key)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition",
                    active
                      ? "bg-[#C97C3E]/[0.08] text-white"
                      : "text-white/40 hover:bg-white/[0.035]",
                  ].join(" ")}
                >
                  <span className="text-[9px] text-white/20">
                    {item.number}
                  </span>

                  <Icon
                    size={16}
                    className={
                      active ? "text-[#C97C3E]" : "text-white/30"
                    }
                  />

                  <span className="text-[12px] font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative min-h-screen lg:pt-[96px]">
        {activeRoute === "overview" && (
          <Overview
            onAsk={askQuestion}
            onOpenIntelligence={() => navigate("intelligence")}
            metrics={metrics}
            metricsLoading={metricsLoading}
          />
        )}

        {activeRoute === "decisions" && <Decisions />}

        {activeRoute === "intelligence" && (
          <Intelligence
            input={input}
            setInput={setInput}
            messages={messages}
            isThinking={isThinking}
            hasConversation={hasConversation}
            conversations={conversations}
            onSubmit={handleSubmit}
            onSuggestion={askQuestion}
          />
        )}

        {activeRoute === "settings" && (
          <SettingsPage storeName={storeLabel} />
        )}

        {/* QUIET PRETHIM BRAND CLOSURE */}

        <div className="pointer-events-none mx-auto flex w-full max-w-[1180px] justify-end px-5 pb-28 pt-4 md:px-8 lg:pb-16">
          <Image
            src="/prethim-watermark.png"
            alt="PRETHIM"
            width={700}
            height={180}
            className="h-auto w-[150px] object-contain opacity-[0.045] md:w-[190px]"
          />
        </div>
      </main>

      {/* =====================================================
          MOBILE BOTTOM NAV
      ===================================================== */}

      <nav className="fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-white/[0.08] bg-[#11100f]/90 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:hidden">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const active = activeRoute === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={[
                  "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition",
                  active ? "bg-white/[0.06]" : "",
                ].join(" ")}
              >
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  className={
                    active ? "text-[#C97C3E]" : "text-white/25"
                  }
                />

                <span
                  className={
                    active
                      ? "text-[9px] font-medium text-white/80"
                      : "text-[9px] font-medium text-white/25"
                  }
                >
                  {item.label}
                </span>

                {active && (
                  <span
                    className="absolute bottom-1 h-[2px] w-3 rounded-full"
                    style={{ background: COPPER }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  onAsk,
  onOpenIntelligence,
  metrics,
  metricsLoading,
}: {
  onAsk: (question: string) => void;
  onOpenIntelligence: () => void;
  metrics: Metrics | null;
  metricsLoading: boolean;
}) {
  const revenueValue = metricsLoading
    ? "—"
    : metrics
    ? formatNaira(metrics.revenue)
    : "₦0";

  const visitorsValue = metricsLoading
    ? "—"
    : metrics
    ? formatCount(metrics.visitors)
    : "0";

  const checkoutsValue = metricsLoading
    ? "—"
    : metrics
    ? formatCount(metrics.checkouts)
    : "0";

  const purchasesValue = metricsLoading
    ? "—"
    : metrics
    ? formatCount(metrics.purchases)
    : "0";

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-28 pt-8 md:px-8 md:pt-10 lg:pb-16">
      {/* HERO */}

      <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/25">
              01 / Overview
            </span>

            <span className="h-px w-8 bg-white/[0.08]" />

            <span
              className="text-[10px]"
              style={{ color: `${COPPER}99` }}
            >
              Today
            </span>
          </div>

          <h1 className="max-w-3xl text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-[54px]">
            The business,
            <br />
            <span className="text-white/35">
              as REDEN sees it.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-[13px] leading-6 text-white/35">
            REDEN continuously evaluates activity across your store and
            surfaces the signals that deserve your attention.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenIntelligence}
          className="group flex w-fit items-center gap-3 rounded-2xl border border-[#C97C3E]/[0.18] bg-[#C97C3E]/[0.045] px-5 py-3.5 text-[11px] font-medium text-[#DFA16E] transition duration-300 hover:border-[#C97C3E]/30 hover:bg-[#C97C3E]/[0.08]"
        >
          <Sparkles size={14} />
          Ask REDEN
          <ChevronRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {/* METRICS */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          number="01"
          label="Revenue"
          value={revenueValue}
          detail="Today"
          icon={CircleDollarSign}
        />

        <MetricCard
          number="02"
          label="Visitors"
          value={visitorsValue}
          detail="Today"
          icon={Users}
        />

        <MetricCard
          number="03"
          label="Checkouts"
          value={checkoutsValue}
          detail="Today"
          icon={Activity}
        />

        <MetricCard
          number="04"
          label="Purchases"
          value={purchasesValue}
          detail="Today"
          icon={TrendingUp}
        />
      </div>

      {/* PERFORMANCE + SIGNAL */}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018]">
          <div className="flex items-start justify-between p-5 md:p-6">
            <div>
              <div className="text-[13px] font-medium text-white/75">
                Business performance
              </div>

              <div className="mt-1 text-[11px] text-white/25">
                Revenue activity over the selected period
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] text-white/30">
              Today
            </div>
          </div>

          <div className="relative mx-5 mb-5 h-[230px] overflow-hidden rounded-2xl border border-white/[0.045] bg-[#090909] md:mx-6 md:mb-6">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />

            <div className="absolute inset-x-0 bottom-9 h-px bg-white/[0.05]" />

            <div className="absolute left-5 top-5 flex items-center gap-2">
              <div
                className="h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(201,124,62,0.7)]"
                style={{ background: COPPER }}
              />

              <span className="text-[9px] uppercase tracking-[0.12em] text-white/25">
                Revenue
              </span>
            </div>

            <div className="absolute inset-x-8 bottom-10 h-[120px]">
              <svg
                viewBox="0 0 800 120"
                preserveAspectRatio="none"
                className="h-full w-full"
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    x2="1"
                    y1="0"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor={COPPER}
                      stopOpacity="0.2"
                    />
                    <stop
                      offset="100%"
                      stopColor={COPPER}
                      stopOpacity="0.9"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 110 C80 110 100 105 160 105 C220 105 250 100 300 100 C360 100 400 106 450 92 C510 76 520 86 580 75 C650 62 690 67 800 38"
                  fill="none"
                  stroke="url(#revenueGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="absolute bottom-3 left-4 text-[8px] text-white/15">
              00:00
            </div>

            <div className="absolute bottom-3 right-4 text-[8px] text-white/15">
              NOW
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-[#C97C3E]/[0.14] bg-[#C97C3E]/[0.025] p-6">
          <div
            className="absolute right-[-60px] top-[-60px] h-[180px] w-[180px] rounded-full blur-[70px]"
            style={{ background: `${COPPER}0D` }}
          />

          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#C97C3E]/[0.14] bg-[#C97C3E]/[0.07]">
                <Sparkles
                  size={14}
                  style={{ color: COPPER }}
                />
              </div>

              <div>
                <div className="text-[12px] font-medium text-white/75">
                  REDEN signal
                </div>

                <div className="text-[9px] text-white/25">
                  Latest observation
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="text-[26px] font-semibold leading-[1.05] tracking-[-0.05em] text-white/90">
                No active
                <br />
                signals yet.
              </div>

              <p className="mt-4 text-[11px] leading-5 text-white/30">
                REDEN will surface meaningful changes once enough business
                activity exists to evaluate.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onAsk("What should I pay attention to?")
              }
              className="group mt-8 flex items-center gap-2 text-[10px] font-medium"
              style={{ color: COPPER }}
            >
              Ask what matters

              <ArrowUpRight
                size={13}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </section>
      </div>

      {/* RECENT DECISIONS */}

      <section className="mt-4 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-5 md:p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/20">
              02 / Activity
            </div>

            <div className="text-[15px] font-medium text-white/75">
              Recent decisions
            </div>

            <div className="mt-1 text-[11px] text-white/25">
              Actions REDEN has evaluated for your business.
            </div>
          </div>

          <span className="hidden text-[10px] text-white/20 sm:block">
            Latest
          </span>
        </div>

        <div className="mt-6 grid gap-2.5 md:grid-cols-3">
          <DecisionItem
            number="01"
            title="No intervention"
            description="Traffic is being monitored."
            status="Monitoring"
          />

          <DecisionItem
            number="02"
            title="Checkout recovery"
            description="No recovery action triggered."
            status="Suppressed"
          />

          <DecisionItem
            number="03"
            title="Offer evaluation"
            description="Waiting for sufficient evidence."
            status="Learning"
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function MetricCard({
  number,
  label,
  value,
  detail,
  icon: Icon,
}: {
  number: string;
  label: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018] p-5 transition duration-500 hover:-translate-y-0.5 hover:border-white/[0.11] hover:bg-white/[0.025]">
      <div className="absolute right-[-15px] top-[-22px] text-[76px] font-semibold leading-none tracking-[-0.08em] text-white/[0.018] transition duration-500 group-hover:text-[#C97C3E]/[0.035]">
        {number}
      </div>

      <div className="relative flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/30">
          {label}
        </span>

        <Icon
          size={14}
          strokeWidth={1.7}
          className="text-white/20 transition"
          style={{
            color: undefined,
          }}
        />
      </div>

      <div className="relative mt-7 text-[25px] font-semibold tracking-[-0.05em] text-white/90">
        {value}
      </div>

      <div className="relative mt-1 text-[9px] text-white/20">
        {detail}
      </div>
    </div>
  );
}

/* =========================================================
   DECISION ITEM
========================================================= */

function DecisionItem({
  number,
  title,
  description,
  status,
}: {
  number: string;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.05] bg-black/20 p-4 transition duration-300 hover:border-[#C97C3E]/[0.1] hover:bg-white/[0.025]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[9px] text-white/15">
          {number}
        </span>

        <span className="rounded-full border border-white/[0.06] px-2 py-1 text-[8px] text-white/25">
          {status}
        </span>
      </div>

      <div className="mt-5 text-[12px] font-medium text-white/65">
        {title}
      </div>

      <div className="mt-1.5 text-[10px] leading-5 text-white/25">
        {description}
      </div>
    </div>
  );
}

/* =========================================================
   DECISIONS
========================================================= */

function Decisions() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 pb-28 pt-8 md:px-8 md:pt-10 lg:pb-16">
      <div className="mb-12">
        <div className="mb-5 text-[10px] uppercase tracking-[0.18em] text-white/25">
          02 / Decisions
        </div>

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-[40px] font-semibold leading-[0.95] tracking-[-0.06em] md:text-[55px]">
              What REDEN
              <br />
              <span className="text-white/30">
                is doing.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[13px] leading-6 text-white/35">
              REDEN evaluates signals before deciding whether intervention is
              useful. Doing nothing is also a decision.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white/25">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: COPPER }}
            />
            Evaluation engine active
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <DecisionRow
          number="01"
          icon={Zap}
          title="Checkout recovery"
          status="Suppressed"
          description="No intervention triggered. Current evidence does not justify action."
        />

        <DecisionRow
          number="02"
          icon={TrendingUp}
          title="Purchase intent"
          status="Monitoring"
          description="REDEN is continuing to observe visitor behaviour before taking action."
        />

        <DecisionRow
          number="03"
          icon={CircleDollarSign}
          title="Offer optimisation"
          status="Learning"
          description="Not enough evidence is available to safely change the current offer."
        />
      </div>
    </div>
  );
}

function DecisionRow({
  number,
  icon: Icon,
  title,
  status,
  description,
}: {
  number: string;
  icon: typeof Zap;
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.018] p-5 transition duration-500 hover:border-white/[0.11] hover:bg-white/[0.025] md:p-7">
      <div className="absolute right-5 top-[-20px] text-[90px] font-semibold leading-none tracking-[-0.08em] text-white/[0.018] transition group-hover:text-[#C97C3E]/[0.035] md:right-8">
        {number}
      </div>

      <div className="relative flex gap-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C97C3E]/[0.12] bg-[#C97C3E]/[0.05]">
          <Icon
            size={16}
            style={{ color: COPPER }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[13px] font-medium text-white/75">
              {title}
            </div>

            <span className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[8px] uppercase tracking-[0.08em] text-white/30">
              {status}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-[11px] leading-5 text-white/30">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INTELLIGENCE
========================================================= */

function Intelligence({
  input,
  setInput,
  messages,
  isThinking,
  hasConversation,
  conversations,
  onSubmit,
  onSuggestion,
}: {
  input: string;
  setInput: (value: string) => void;
  messages: Message[];
  isThinking: boolean;
  hasConversation: boolean;
  conversations: Conversation[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSuggestion: (question: string) => void;
}) {
  const [showHistory, setShowHistory] = useState(true);

  return (
    <div className="relative min-h-[calc(100vh-62px)]">
      {!hasConversation ? (
        <div className="mx-auto flex min-h-[calc(100vh-62px)] w-full max-w-[1100px] flex-col px-5 pb-28 pt-10 md:px-8 md:pt-16 lg:flex-row lg:gap-12">
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
            <div className="mb-8 flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
              <div className="relative h-2 w-2">
                <div
                  className="absolute inset-0 rounded-full blur-[4px]"
                  style={{ background: COPPER }}
                />

                <div
                  className="relative h-2 w-2 rounded-full"
                  style={{ background: COPPER }}
                />
              </div>

              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/40">
                Intelligence
              </span>
            </div>

            <div className="mb-3 text-[9px] uppercase tracking-[0.2em] text-white/20">
              03 / Ask
            </div>

            <h1 className="max-w-3xl text-center text-[40px] font-semibold leading-[0.98] tracking-[-0.065em] md:text-[60px]">
              Ask your
              <br />
              <span className="text-white/30">
                business anything.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-center text-[12px] leading-6 text-white/30">
              REDEN turns activity across your store into answers,
              observations and decisions you can act on.
            </p>

            <div className="mt-10 w-full max-w-[720px]">
              <Composer
                input={input}
                setInput={setInput}
                onSubmit={onSubmit}
                isThinking={isThinking}
              />

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSuggestion(suggestion)}
                    className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-2 text-[10px] text-white/35 transition duration-300 hover:border-[#C97C3E]/20 hover:bg-[#C97C3E]/[0.04] hover:text-white/70"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="mt-12 w-full lg:mt-0 lg:w-[280px] lg:self-end">
            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-4">
              <div className="flex items-center justify-between px-2 py-2">
                <div>
                  <div className="text-[11px] font-medium text-white/55">
                    Previous conversations
                  </div>

                  <div className="mt-1 text-[9px] text-white/20">
                    Your recent intelligence sessions
                  </div>
                </div>

                <Clock3 size={14} className="text-white/20" />
              </div>

              <div className="mt-3 space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      onSuggestion(conversation.preview)
                    }
                    className="group w-full rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="truncate text-[10px] font-medium text-white/50 group-hover:text-white/75">
                        {conversation.title}
                      </span>

                      <ChevronRight
                        size={12}
                        className="shrink-0 text-white/15 transition group-hover:text-[#C97C3E]"
                      />
                    </div>

                    <div className="mt-1 text-[9px] text-white/20">
                      {conversation.date}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-62px)] w-full max-w-[1080px] px-5 pb-32 pt-8 md:px-8">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                  Intelligence / Session
                </div>

                <div className="mt-1 text-[12px] text-white/45">
                  REDEN analysis
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[9px] text-white/30 transition hover:bg-white/[0.04] hover:text-white/60"
              >
                <Clock3 size={12} />
                History
              </button>
            </div>

            <div className="flex gap-8">
              <div className="min-w-0 flex-1">
                <div className="space-y-10">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="max-w-[82%] rounded-2xl border border-white/[0.07] bg-white/[0.055] px-4 py-3 text-[12px] leading-6 text-white/70">
                            {message.content}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <div className="relative flex h-6 w-6 items-center justify-center rounded-full border border-[#C97C3E]/[0.12] bg-[#C97C3E]/[0.04]">
                              <div
                                className="h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(201,124,62,0.7)]"
                                style={{ background: COPPER }}
                              />
                            </div>

                            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                              REDEN
                            </span>
                          </div>

                          <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/65">
                            {message.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-center gap-2 text-[10px] text-white/25">
                      <div
                        className="h-1.5 w-1.5 animate-pulse rounded-full"
                        style={{ background: COPPER }}
                      />

                      REDEN is examining the available evidence...
                    </div>
                  )}
                </div>
              </div>

              {showHistory && (
                <aside className="hidden w-[220px] shrink-0 xl:block">
                  <div className="sticky top-[110px] rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3">
                    <div className="px-2 py-2 text-[9px] uppercase tracking-[0.14em] text-white/20">
                      Previous
                    </div>

                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() =>
                            onSuggestion(conversation.preview)
                          }
                          className="group w-full rounded-xl px-2.5 py-2.5 text-left hover:bg-white/[0.035]"
                        >
                          <div className="truncate text-[9px] text-white/45 group-hover:text-white/70">
                            {conversation.title}
                          </div>

                          <div className="mt-1 text-[8px] text-white/15">
                            {conversation.date}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-[#080706]/90 px-5 py-4 backdrop-blur-xl">
              <div className="mx-auto max-w-[760px]">
                <Composer
                  input={input}
                  setInput={setInput}
                  onSubmit={onSubmit}
                  isThinking={isThinking}
                />

                <div className="mt-2 text-center text-[8px] text-white/15">
                  REDEN answers from your connected business data.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPOSER
========================================================= */

function Composer({
  input,
  setInput,
  onSubmit,
  isThinking,
}: {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isThinking: boolean;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="group flex min-h-[64px] items-center rounded-2xl border border-white/[0.09] bg-[#101010] px-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] transition duration-300 focus-within:border-[#C97C3E]/25 focus-within:shadow-[0_20px_80px_rgba(0,0,0,0.45),0_0_35px_rgba(201,124,62,0.035)]">
        <div className="mr-3 hidden h-7 w-7 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.025] sm:flex">
          <Sparkles size={13} className="text-white/20" />
        </div>

        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isThinking}
          placeholder="Ask REDEN..."
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-1 py-4 text-[13px] text-white outline-none placeholder:text-white/20 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          aria-label="Send question"
          className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-black transition hover:brightness-110 disabled:bg-white/[0.07] disabled:text-white/20"
          style={{ background: COPPER }}
        >
          <ChevronRight size={17} strokeWidth={2.4} />
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({ storeName }: { storeName: string }) {
  const [notifications, setNotifications] = useState(true);
  const [tracking, setTracking] = useState(true);
  const [emailReports, setEmailReports] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1050px] px-5 pb-28 pt-8 md:px-8 md:pt-10 lg:pb-16">
      <div className="mb-12">
        <div className="mb-5 text-[10px] uppercase tracking-[0.18em] text-white/25">
          04 / Settings
        </div>

        <h1 className="text-[40px] font-semibold leading-[0.95] tracking-[-0.06em] md:text-[55px]">
          Control the
          <br />
          <span className="text-white/30">
            REDEN connection.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-[13px] leading-6 text-white/35">
          Manage your store connection, intelligence behaviour and account
          preferences.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4">
          <SettingsSection
            number="01"
            title="Store"
            description="The storefront currently connected to REDEN."
          >
            <SettingsItem
              icon={Store}
              title="Store name"
              description="Your connected business"
              value={storeName}
            />

            <SettingsItem
              icon={Globe2}
              title="Store domain"
              description="The domain REDEN is monitoring"
              value="Connected"
              valueAccent
            />

            <SettingsItem
              icon={Wifi}
              title="Connection"
              description="SDK and event connection status"
              value="Active"
              valueAccent
            />
          </SettingsSection>

          <SettingsSection
            number="02"
            title="Intelligence"
            description="Choose what REDEN is allowed to monitor and surface."
          >
            <ToggleSetting
              icon={Activity}
              title="Behaviour tracking"
              description="Allow REDEN to evaluate storefront activity."
              enabled={tracking}
              onChange={() => setTracking(!tracking)}
            />

            <ToggleSetting
              icon={Bell}
              title="Business signals"
              description="Surface meaningful changes in business activity."
              enabled={notifications}
              onChange={() => setNotifications(!notifications)}
            />

            <ToggleSetting
              icon={BarChart3}
              title="Email summaries"
              description="Receive periodic business intelligence summaries."
              enabled={emailReports}
              onChange={() => setEmailReports(!emailReports)}
            />
          </SettingsSection>

          <SettingsSection
            number="03"
            title="Data"
            description="Understand the data REDEN currently has access to."
          >
            <SettingsItem
              icon={Database}
              title="Business events"
              description="Store activity being evaluated"
              value="Available"
              valueAccent
            />

            <SettingsItem
              icon={ShieldCheck}
              title="Data protection"
              description="REDEN keeps merchant credentials private."
              value="Protected"
            />
          </SettingsSection>
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-[#C97C3E]/[0.14] bg-[#C97C3E]/[0.035] p-6">
            <div
              className="absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full blur-[80px]"
              style={{ background: `${COPPER}0F` }}
            />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-[9px] uppercase tracking-[0.16em] text-[#C97C3E]/60">
                  Current plan
                </div>

                <div className="rounded-full border border-[#C97C3E]/[0.15] bg-[#C97C3E]/[0.06] px-2.5 py-1 text-[8px] font-medium text-[#DFA16E]">
                  FREE
                </div>
              </div>

              <div className="mt-8 text-[30px] font-semibold tracking-[-0.06em]">
                Free
              </div>

              <p className="mt-2 text-[10px] leading-5 text-white/30">
                Core REDEN intelligence for getting your store connected and
                learning from real business activity.
              </p>

              <div className="mt-7 space-y-2">
                <PlanFeature text="Store connection" />
                <PlanFeature text="Revenue intelligence" />
                <PlanFeature text="Decision evaluation" />
                <PlanFeature text="REDEN Intelligence" />
              </div>

              <button
                type="button"
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-[#C97C3E]/[0.15] bg-[#C97C3E]/[0.07] py-3 text-[10px] font-medium text-[#DFA16E] transition hover:bg-[#C97C3E]/[0.11]"
              >
                View plan details
                <ArrowUpRight size={12} />
              </button>
            </div>
          </div>

          <SettingsSection
            number="04"
            title="Account"
            description="Your REDEN account and access."
          >
            <SettingsItem
              icon={User}
              title="Account"
              description="Signed-in merchant account"
              value={storeName}
            />

            <SettingsItem
              icon={CircleDollarSign}
              title="Billing"
              description="Plan and payment settings"
              value="Free"
            />

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-red-500/[0.035]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/[0.06]">
                <LogOut
                  size={13}
                  className="text-red-400/70"
                />
              </div>

              <div>
                <div className="text-[10px] font-medium text-red-400/70">
                  Sign out
                </div>

                <div className="mt-0.5 text-[8px] text-white/20">
                  End this REDEN session
                </div>
              </div>
            </button>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS SECTION
========================================================= */

function SettingsSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-5 md:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div
          className="text-[10px] font-medium"
          style={{ color: `${COPPER}8C` }}
        >
          {number}
        </div>

        <div>
          <div className="text-[13px] font-medium text-white/70">
            {title}
          </div>

          <div className="mt-1 max-w-md text-[9px] leading-5 text-white/25">
            {description}
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/[0.045]">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   SETTINGS ITEM
========================================================= */

function SettingsItem({
  icon: Icon,
  title,
  description,
  value,
  valueAccent = false,
}: {
  icon: typeof Store;
  title: string;
  description: string;
  value: string;
  valueAccent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.025]">
        <Icon
          size={13}
          className="text-white/30"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium text-white/55">
          {title}
        </div>

        <div className="mt-0.5 text-[8px] text-white/20">
          {description}
        </div>
      </div>

      <div
        className={
          valueAccent
            ? "shrink-0 text-[9px] font-medium text-[#C97C3E]/70"
            : "shrink-0 text-[9px] text-white/30"
        }
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function ToggleSetting({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.025]">
        <Icon
          size={13}
          className="text-white/30"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium text-white/55">
          {title}
        </div>

        <div className="mt-0.5 text-[8px] leading-4 text-white/20">
          {description}
        </div>
      </div>

      <button
        type="button"
        onClick={onChange}
        aria-label={`${title}: ${enabled ? "enabled" : "disabled"}`}
        className={[
          "relative h-6 w-10 shrink-0 rounded-full border transition duration-300",
          enabled
            ? "border-[#C97C3E]/30 bg-[#C97C3E]/20"
            : "border-white/[0.08] bg-white/[0.035]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-300",
            enabled
              ? "left-[19px] bg-[#C97C3E] shadow-[0_0_10px_rgba(201,124,62,0.4)]"
              : "left-[3px] bg-white/25",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

/* =========================================================
   PLAN FEATURE
========================================================= */

function PlanFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[9px] text-white/35">
      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#C97C3E]/[0.08]">
        <Check
          size={9}
          style={{ color: COPPER }}
        />
      </div>

      {text}
    </div>
  );
}