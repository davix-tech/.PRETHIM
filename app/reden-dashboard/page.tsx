"use client";

import Link from "next/link";
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
    icon: Activity,
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

const INITIAL_CONVERSATIONS: Conversation[] = [];

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
  const [metricsError, setMetricsError] = useState<string | null>(null);
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
                Workspace
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
            metricsError={metricsError}
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
  metricsError,
}: {
  onAsk: (question: string) => void;
  onOpenIntelligence: () => void;
  metrics: Metrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
}) {
  const revenueValue = metricsLoading
    ? "—"
    : metricsError || !metrics
    ? "Unavailable"
    : formatNaira(metrics.revenue);

  const visitorsValue = metricsLoading
    ? "—"
    : metricsError || !metrics
    ? "—"
    : formatCount(metrics.visitors);

  const checkoutsValue = metricsLoading
    ? "—"
    : metricsError || !metrics
    ? "—"
    : formatCount(metrics.checkouts);

  const purchasesValue = metricsLoading
    ? "—"
    : metricsError || !metrics
    ? "—"
    : formatCount(metrics.purchases);

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
          <Activity size={14} />
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

        <MetricCard
          number="01"
          label="Revenue"
          value={revenueValue}
          detail="Today"
          icon={CircleDollarSign}
          subdued
        />
      </div>

      {/* REVENUE INTELLIGENCE */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 md:p-6">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Revenue intelligence</div>
          <h2 className="mt-4 text-xl font-medium tracking-[-0.035em] text-white/80">{metricsLoading ? "Reading your store data…" : metricsError || !metrics ? "Business data is unavailable." : metrics.visitors === 0 && metrics.purchases === 0 ? "REDEN is waiting for meaningful activity." : "Your latest store metrics are ready to examine."}</h2>
          <p className="mt-3 max-w-xl text-[12px] leading-6 text-white/35">{metricsError ? "REDEN could not retrieve the current metrics. Check the store connection; unavailable data is not reported as zero." : !metrics && !metricsLoading ? "Connect a storefront and send events to make revenue intelligence available here." : "Ask REDEN to explain the figures and identify changes worth investigating. Answers should stay within what the available evidence supports."}</p>
          <button type="button" onClick={() => onAsk("Give me an evidence-based overview of my store performance and explain what deserves attention.")} className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#C97C3E] transition hover:text-[#DFA16E]">Examine the evidence <ArrowUpRight size={13} /></button>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 md:p-6">
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Signal status</div>
          <div className="mt-4 text-lg font-medium tracking-[-0.03em] text-white/75">{metricsLoading ? "Checking available evidence" : metricsError || !metrics ? "Unable to verify signals" : "No verified signal summary"}</div>
          <p className="mt-3 text-[12px] leading-6 text-white/35">This dashboard currently receives aggregate metrics, not a live signal feed. REDEN will not invent a signal or claim that no signals exist when that feed is unavailable.</p>
        </div>
      </section>

      {/* DECISION HISTORY */}
      <section className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Decision history</div><h2 className="mt-2 text-[15px] font-medium text-white/75">What REDEN decided</h2></div><span className="text-[10px] text-white/25">Live records required</span></div>
        <p className="mt-4 max-w-2xl text-[12px] leading-6 text-white/35">Decision records are not yet available through this dashboard view. No sample actions or invented statuses are shown here.</p>
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
  subdued = false,
}: {
  number: string;
  label: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
  subdued?: boolean;
}) {
  return (
    <div className={["group relative overflow-hidden rounded-3xl border p-4 transition duration-300 md:p-5", subdued ? "border-white/[0.045] bg-white/[0.008]" : "border-white/[0.07] bg-white/[0.018] hover:border-white/[0.11] hover:bg-white/[0.025]"].join(" ")}>
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

      <div className={["relative mt-6 font-semibold tracking-[-0.05em]", subdued ? "text-[19px] text-white/55" : "text-[25px] text-white/90"].join(" ")}>
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
      <div className="mb-10"><div className="mb-4 text-[10px] uppercase tracking-[0.18em] text-white/25">Decisions</div><h1 className="text-[40px] font-semibold leading-[0.98] tracking-[-0.06em] md:text-[55px]">Decisions,<br /><span className="text-white/30">with evidence.</span></h1><p className="mt-5 max-w-xl text-[13px] leading-6 text-white/35">Review what REDEN decided, why it decided, whether an action executed, and what outcome followed.</p></div>
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-6 md:p-8"><div className="text-[13px] font-medium text-white/70">No decision records available</div><p className="mt-2 max-w-xl text-[12px] leading-6 text-white/35">This view is waiting for real decision records from REDEN. Placeholder decisions are intentionally omitted so the dashboard never presents examples as merchant activity.</p></section>
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
  return (
    <div className="relative min-h-[calc(100vh-62px)]">
      <div className="mx-auto flex w-full max-w-[960px] items-center justify-between px-5 pb-4 pt-7 md:px-8">
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-white/25">REDEN / Intelligence</div>
          <div className="mt-1 text-[12px] text-white/55">Business analysis, grounded in your store data</div>
        </div>
        {hasConversation && <button type="button" onClick={() => onSuggestion("Give me a fresh overview of my store using only the available evidence.")} className="rounded-xl border border-white/[0.07] px-3 py-2 text-[10px] text-white/40 transition hover:bg-white/[0.04] hover:text-white/70">New analysis</button>}
      </div>

      {!hasConversation ? (
        <div className="mx-auto flex min-h-[calc(100vh-260px)] w-full max-w-[820px] flex-col justify-center px-5 pb-36 pt-8 md:px-8">
          <div className="max-w-2xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C97C3E]/80">REDEN Intelligence</div>
            <h1 className="mt-4 text-[34px] font-medium leading-[1.08] tracking-[-0.055em] text-white/90 md:text-[48px]">What should we<br /><span className="text-white/35">look into today?</span></h1>
            <p className="mt-4 max-w-xl text-[13px] leading-6 text-white/35">Ask a direct question about your store. REDEN should separate observed facts from interpretation and be clear when the data cannot support a conclusion.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => onSuggestion(suggestion)} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-left text-[10px] text-white/50 transition hover:border-[#C97C3E]/30 hover:bg-[#C97C3E]/[0.05] hover:text-white/80">{suggestion}</button>)}
            </div>
            {conversations.length > 0 && <div className="mt-6 text-[9px] text-white/20">{conversations.length} prompt{conversations.length === 1 ? "" : "s"} asked in this session</div>}
          </div>
        </div>
      ) : (
        <div className="mx-auto min-h-[calc(100vh-220px)] w-full max-w-[820px] px-5 pb-48 pt-8 md:px-8">
          <div className="space-y-10">
            {messages.map((message) => <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex justify-end"><div className="max-w-[88%] rounded-2xl bg-white/[0.07] px-4 py-3 text-[13px] leading-6 text-white/80 md:max-w-[78%]">{message.content}</div></div>
              ) : (
                <div className="max-w-[760px]">
                  <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#C97C3E]/85">REDEN</div>
                  <div className="whitespace-pre-wrap text-[13px] leading-7 text-white/75 md:text-[14px]">{message.content}</div>
                </div>
              )}
            </div>)}
            {isThinking && <div className="max-w-[760px]"><div className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#C97C3E]/85">REDEN</div><div className="flex items-center gap-2 text-[12px] text-white/35"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C97C3E]" />Reviewing available store evidence…</div></div>}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[76px] z-30 border-t border-white/[0.06] bg-[#090807]/95 px-4 py-4 backdrop-blur-2xl lg:bottom-0 lg:px-6">
        <div className="mx-auto max-w-[820px]">
          <Composer input={input} setInput={setInput} onSubmit={onSubmit} isThinking={isThinking} />
          <div className="mt-2 text-center text-[8px] text-white/20">REDEN can only answer from the evidence available to it. Verify important decisions against your store records.</div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({ storeName }: { storeName: string }) {
  return (
    <div className="mx-auto w-full max-w-[920px] px-5 pb-28 pt-8 md:px-8 md:pt-10 lg:pb-16">
      <div className="mb-10">
        <div className="mb-4 text-[10px] uppercase tracking-[0.18em] text-white/25">Settings</div>
        <h1 className="text-[40px] font-semibold leading-[0.98] tracking-[-0.06em] md:text-[55px]">A clear view of<br /><span className="text-white/30">your connection.</span></h1>
        <p className="mt-5 max-w-xl text-[13px] leading-6 text-white/35">Only verified connection details are shown here. Persistent monitoring, notification, billing, and account controls will appear when they are connected to real settings.</p>
      </div>
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 md:p-7">
        <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Connected storefront</div>
        <div className="mt-3 text-xl font-medium tracking-[-0.035em] text-white/80">{storeName}</div>
        <p className="mt-3 max-w-xl text-[12px] leading-6 text-white/35">Store selection and connection diagnostics are handled through the existing storefront connection flow. This screen does not currently save preference changes.</p>
        <Link href="/reden-addstore" className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium text-[#C97C3E] transition hover:text-[#DFA16E]">Manage storefront connection <ArrowUpRight size={13} /></Link>
      </section>
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