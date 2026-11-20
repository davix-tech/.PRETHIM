"use client";

import Link from "next/link";
import Image from "next/image";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
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

type Route = "overview" | "intelligence";

type Message = {
  id: number;
  role: "user" | "reden";
  content: string;
};

type ConversationHistory = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
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
  },
  {
    key: "intelligence" as Route,
    label: "Intelligence",
    icon: Activity,
  },
];

const SUGGESTIONS = [
  "How much did I earn today?",
  "What happened today?",
  "Why are sales down?",
  "What should I pay attention to?",
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
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [historySiteId, setHistorySiteId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const conversationIdRef = useRef<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  /* -------------------------------------------------------
     SITE RESOLUTION
  ------------------------------------------------------- */

  const [siteId, setSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;
    try {
      const stored = window.localStorage.getItem(`reden-chat-history:${siteId}`);
      const parsed = stored ? (JSON.parse(stored) as ConversationHistory[]) : [];
      setConversations(Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === "string" && Array.isArray(item.messages)).slice(0, 30) : []);
    } catch {
      // Local history is optional; storage failure must not block chat.
      setConversations([]);
    } finally {
      setHistorySiteId(siteId);
    }
  }, [siteId]);

  useEffect(() => {
    if (!siteId || historySiteId !== siteId) return;
    try {
      window.localStorage.setItem(`reden-chat-history:${siteId}`, JSON.stringify(conversations.slice(0, 30)));
    } catch {
      // Storage can be unavailable or full. Live chat remains usable.
    }
  }, [siteId, historySiteId, conversations]);

  useEffect(() => {
    if (!activeConversationId || messages.length === 0) return;
    const firstQuestion = messages.find((message) => message.role === "user")?.content || "New conversation";
    const updated: ConversationHistory = {
      id: activeConversationId,
      title: firstQuestion.length > 54 ? `${firstQuestion.slice(0, 51)}…` : firstQuestion,
      updatedAt: Date.now(),
      messages,
    };
    setConversations((current) => [updated, ...current.filter((item) => item.id !== activeConversationId)].slice(0, 30));
  }, [activeConversationId, messages]);

  /* -------------------------------------------------------
     METRICS
  ------------------------------------------------------- */

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [, setMetricsUpdatedAt] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (
    resolvedSiteId: string,
    showLoading = true
  ) => {
    if (showLoading) setMetricsLoading(true);
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
      const message = !navigator.onLine
        ? "Your device is offline. Reconnect to refresh your store data."
        : error instanceof Error && /timeout|timed out/i.test(error.message)
        ? "REDEN is taking longer than expected to retrieve your store data. Try again shortly."
        : "REDEN couldn't retrieve your store data right now. Your existing figures have not been replaced.";

      setMetricsError(message);
    } finally {
      if (showLoading) setMetricsLoading(false);
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
     LIVE COMMERCE UPDATES
  ------------------------------------------------------- */

  useEffect(() => {
    if (!siteId) return;

    let disposed = false;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let refreshTimer: number | null = null;
    let reconnectDelay = 1_000;

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null) return;

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, reconnectDelay);

      reconnectDelay = Math.min(reconnectDelay * 2, 15_000);
    };

    const connect = async () => {
      try {
        const ticketResponse = await fetch("/api/reden/stream-token", {
          cache: "no-store",
        });
        const ticket = await ticketResponse.json();

        if (
          disposed ||
          !ticketResponse.ok ||
          !ticket.ok ||
          typeof ticket.streamUrl !== "string"
        ) {
          throw new Error(ticket.error || "Live updates are unavailable.");
        }

        source?.close();
        source = new EventSource(ticket.streamUrl);

        source.onopen = () => {
          reconnectDelay = 1_000;
          // Reconcile after every connection/reconnection so a
          // dropped stream never leaves the dashboard stale.
          void fetchMetrics(siteId, false);
        };

        source.onmessage = () => {
          if (refreshTimer !== null) {
            window.clearTimeout(refreshTimer);
          }

          // Collapse bursts of SDK events into one authoritative
          // metrics read instead of issuing a request per event.
          refreshTimer = window.setTimeout(() => {
            refreshTimer = null;
            void fetchMetrics(siteId, false);
          }, 300);
        };

        source.onerror = () => {
          source?.close();
          source = null;
          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      disposed = true;
      source?.close();

      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }

      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, [siteId, fetchMetrics]);

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

    if (!navigator.onLine) {
      setIsOnline(false);
      setRequestError("You're offline. Reconnect to the internet and send your question again.");
      return;
    }

    setRequestError(null);
    const isRetry = messages[messages.length - 1]?.role === "user" && messages[messages.length - 1]?.content === question;
    if (!isRetry) setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsThinking(true);

    if (!conversationIdRef.current) {
      conversationIdRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `reden-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setActiveConversationId(conversationIdRef.current);
    }

    try {
      const response = await fetch("/api/reden/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          conversationId: conversationIdRef.current,
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
        if (response.status === 401) throw new Error("AUTH_REQUIRED");
        if (response.status === 404) throw new Error("STORE_NOT_CONNECTED");
        if (response.status === 504 || /timeout/i.test(data.error || "")) throw new Error("REQUEST_TIMEOUT");
        if (response.status >= 500 || /unavailable|failed/i.test(data.error || "")) throw new Error("SERVICE_UNAVAILABLE");
        throw new Error("REQUEST_NOT_COMPLETED");
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "reden",
          content: data.answer as string,
        },
      ]);

    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const message = !navigator.onLine
        ? "Your connection dropped before REDEN could finish. Your question is still here; reconnect and send it again."
        : /failed to fetch|networkerror|load failed/i.test(code)
        ? "I couldn't reach REDEN just now. Your question wasn't analysed; check your connection and try again."
        : code === "AUTH_REQUIRED"
        ? "Your session needs to be refreshed. Sign in again, then retry your question."
        : code === "STORE_NOT_CONNECTED"
        ? "I couldn't find an active store connection. Reconnect your storefront before asking about its activity."
        : code === "REQUEST_TIMEOUT"
        ? "This is taking longer than expected. I couldn't complete the analysis, so I haven't drawn a conclusion. Please try again."
        : code === "SERVICE_UNAVAILABLE"
        ? "REDEN is temporarily unreachable. Your store data hasn't been analysed for this request. Please try again shortly."
        : "I couldn't complete that response. No new analysis was produced. Please try again.";

      setInput(question);
      setRequestError(message);
    } finally {
      setIsThinking(false);
    }
  }

  function startNewConversation() {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `reden-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    conversationIdRef.current = id;
    setActiveConversationId(id);
    setMessages([]);
    setInput("");
    setRequestError(null);
    setHistoryOpen(false);
    setActiveRoute("intelligence");
  }

  function openConversation(conversation: ConversationHistory) {
    conversationIdRef.current = conversation.id;
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setInput("");
    setRequestError(null);
    setHistoryOpen(false);
    setActiveRoute("intelligence");
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


      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className={["relative min-h-screen lg:pt-[96px]", activeRoute === "intelligence" ? "h-[calc(100dvh-138px)] min-h-0 overflow-hidden lg:h-[calc(100dvh-96px)]" : ""].join(" ")}>
        {activeRoute === "overview" && (
          <Overview
            onAsk={askQuestion}
            onOpenIntelligence={() => navigate("intelligence")}
            metrics={metrics}
            metricsLoading={metricsLoading}
            metricsError={metricsError}
          />
        )}

        {activeRoute === "intelligence" && (
          <Intelligence
            input={input}
            setInput={setInput}
            messages={messages}
            isThinking={isThinking}
            requestError={requestError}
            isOnline={isOnline}
            hasConversation={hasConversation}
            conversations={conversations}
            activeConversationId={activeConversationId}
            historyOpen={historyOpen}
            historyCollapsed={historyCollapsed}
            onToggleHistory={() => setHistoryOpen((current) => !current)}
            onToggleCollapsed={() => setHistoryCollapsed((current) => !current)}
            onNewConversation={startNewConversation}
            onSelectConversation={openConversation}
            onSubmit={handleSubmit}
            onSuggestion={askQuestion}
          />
        )}

      </main>

      {/* QUIET PRETHIM SIGNATURE */}
      <div className="pointer-events-none fixed bottom-[88px] right-5 z-20 md:right-8 lg:bottom-5">
        <Image
          src="/prethim-watermark.png"
          alt="PRETHIM"
          width={700}
          height={180}
          className="h-auto w-[118px] object-contain opacity-[0.055] md:w-[150px]"
        />
      </div>

      {/* =====================================================
          MOBILE BOTTOM NAV
      ===================================================== */}

      <nav className={["fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-white/[0.08] bg-[#11100f]/90 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:hidden", activeRoute === "intelligence" ? "hidden" : ""].join(" ")}>
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
  const revenueValue = metricsLoading ? "—" : metricsError || !metrics ? "Unavailable" : formatNaira(metrics.revenue);
  const visitorsValue = metricsLoading ? "—" : metricsError || !metrics ? "—" : formatCount(metrics.visitors);
  const purchasesValue = metricsLoading ? "—" : metricsError || !metrics ? "—" : formatCount(metrics.purchases);

  const questionGroups = [
    { title: "Sales & revenue", questions: [
      "How much did I earn today?", "How much revenue did my store make this week?", "How much did I earn this month?", "How many purchases did I make today?", "How many orders have I received this week?", "What is my revenue so far?", "Are my sales increasing or decreasing?", "What does my revenue tell me?", "Why might my revenue be low?", "What should I focus on to increase sales?", "How are sales performing today?", "How did sales perform yesterday?", "Compare today's sales with yesterday's.", "Compare this week's sales with last week.", "What periods have had the most sales?", "Are purchases happening consistently?", "What can I learn from my recent sales?", "What should I investigate about my revenue?", "What are the strongest sales signals?", "What could be holding back my sales?", "How can I improve the number of purchases?", "What is happening with my orders?", "What do my purchase numbers mean?", "Is there enough data to understand my sales?", "Give me a summary of my store's sales."
    ]},
    { title: "Visitors & traffic", questions: [
      "How many people visited my store today?", "How many visitors did I have this week?", "How many visitors did I have this month?", "Is my traffic growing?", "Why might visitor numbers be low?", "What does my visitor count tell me?", "Are people visiting but not buying?", "How is visitor activity today?", "Compare visitors today and yesterday.", "Compare traffic this week and last week.", "What should I do to attract more visitors?", "Are visitors showing interest in my store?", "What can I learn from the traffic I have?", "Is my store getting enough visitors to make sales?", "What could cause a drop in visits?", "What should I investigate about my traffic?", "When has my store received more visitors?", "What does visitor activity suggest?", "How can I improve store traffic?", "Are visitors reaching my store consistently?", "Give me a visitor summary.", "What traffic patterns can you identify?", "What should I prioritize to get more visitors?", "Can my current traffic support more sales?", "How has store activity changed?"
    ]},
    { title: "Conversion & purchase behaviour", questions: [
      "How many visitors actually bought something?", "What is my conversion rate?", "Are visitors converting into buyers?", "Why are visitors not purchasing?", "What could improve my conversion rate?", "What does my purchase rate mean?", "Are my visitors showing buying intent?", "What happens between visiting and purchasing?", "Are there signs of purchase interest?", "How can I turn more visitors into customers?", "Is my conversion performance improving?", "What should I examine if purchases are low?", "Do my visitors seem ready to buy?", "What might prevent a visitor from purchasing?", "How can I encourage hesitant buyers?", "What do my purchases say about customer demand?", "Is there a gap between traffic and sales?", "What can I do with low conversion?", "What does the available behaviour suggest about buying?", "Are customers completing purchases?", "What should I watch in conversion?", "Explain my conversion rate simply.", "What could be affecting purchase decisions?", "How can I improve the customer buying journey?", "Summarize my conversion performance."
    ]},
    { title: "Customer intent & behaviour", questions: [
      "What customer behaviour is happening in my store?", "Are shoppers showing buying intent?", "What behaviour suggests a customer is interested?", "What behaviour suggests someone may be hesitant?", "What are customers doing before buying?", "What actions suggest a visitor is considering a purchase?", "How can I understand customer interest?", "What behaviour should I pay attention to?", "What does customer activity suggest?", "Are customers interacting with products?", "What patterns in visitor behaviour can you see?", "What can behaviour tell me about sales?", "How do customers move through my store?", "What behaviour could be worth acting on?", "Are there signs customers are losing interest?", "What should I know about shopper intent?", "How can I respond to customer hesitation?", "What customer signals matter most?", "Explain the behaviour recorded in my store.", "What actions are customers taking?", "How should I interpret shopper activity?", "What might customer actions mean for my business?", "What behaviour could lead to a sale?", "What should I investigate in customer behaviour?", "Summarize the customer behaviour you can see."
    ]},
    { title: "Cart activity & recovery", questions: [
      "Are customers adding products to their carts?", "What does cart activity tell me?", "Are there signs of abandoned carts?", "Why might shoppers abandon their carts?", "How can I recover abandoned carts?", "What should I know about cart abandonment?", "Are shoppers showing cart intent?", "What can I do when customers leave without buying?", "How does cart activity relate to sales?", "What should I investigate about carts?", "What could encourage shoppers to complete their orders?", "What behaviour happens before a cart is abandoned?", "Are cart actions leading to purchases?", "How can cart recovery improve sales?", "What does the available cart data show?", "What can I learn from cart activity?", "How should I respond to abandoned cart signals?", "What may be stopping shoppers at the cart?", "What is happening with customer carts?", "How can I reduce abandoned carts?", "What cart behaviour deserves attention?", "Are customers adding items but not buying?", "Explain my cart activity.", "What should I pay attention to around carts?", "Summarize cart-related activity."
    ]},
    { title: "Discounts & incentives", questions: [
      "When might a discount help me make a sale?", "How can I encourage a hesitant buyer?", "Would a discount be worth considering?", "What is low purchase intent?", "How can incentives help conversion?", "What should I consider before offering a discount?", "Could a discount encourage more purchases?", "How can I avoid discounting unnecessarily?", "What behaviour may indicate a shopper needs an incentive?", "How do incentives relate to customer intent?", "What can REDEN do when purchase intent is low?", "How should I think about discounts?", "When should I avoid offering discounts?", "What could motivate a customer to buy?", "How can I use incentives thoughtfully?", "What does low intent suggest?", "What signals could justify a promotion?", "How can I make an incentive more relevant?", "What should I know about REDEN's incentive actions?", "How do discounts fit into conversion?", "What can I learn about incentive-related activity?", "How can I encourage a purchase without over-discounting?", "What customer signals could inform an incentive?", "Explain incentive decisions in simple terms.", "Summarize what I should consider about discounts."
    ]},
    { title: "Store performance & diagnosis", questions: [
      "How is my store doing?", "What happened in my store today?", "What should I pay attention to?", "What is going well in my store?", "What needs improvement?", "What is the biggest issue visible in my data?", "What should I do next?", "Give me a business performance summary.", "What does my current data tell me?", "What are the important changes in my store?", "What could explain low sales?", "What should I investigate first?", "Where might I be losing sales?", "What opportunities can I identify?", "What is the most useful action to take today?", "What is happening with my store activity?", "Explain my store performance.", "What should I improve first?", "What risks are visible in my store data?", "What patterns can you identify?", "What is the strongest insight from my data?", "How can I improve my store?", "What is holding my store back?", "What should I monitor going forward?", "Summarize what is happening in my business."
    ]},
    { title: "REDEN actions & understanding", questions: [
      "What can REDEN do for my store?", "How does REDEN help me improve sales?", "What does REDEN analyse?", "How does REDEN understand customer intent?", "How does REDEN respond to abandoned carts?", "What actions can REDEN take?", "What data does REDEN use to answer me?", "Can REDEN explain its recommendations?", "How does REDEN decide when to act?", "What is REDEN monitoring in my store?", "What does REDEN know about my store today?", "How can I ask REDEN better questions?", "Can REDEN help me understand my customers?", "What does REDEN do when it sees low intent?", "How does REDEN help merchants?", "What should I ask REDEN?", "Can REDEN explain my store data in simple language?", "What are REDEN's current capabilities?", "What store questions can REDEN investigate?", "What does REDEN need to provide a reliable answer?", "How does REDEN avoid guessing?", "What does REDEN do with store behaviour signals?", "Can REDEN help me decide what to do next?", "What can I learn using REDEN?", "Explain REDEN's role in my store."
    ]},
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-28 pt-8 md:px-8 md:pt-10 lg:pb-16">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3"><span className="text-[10px]" style={{ color: `${COPPER}99` }}>Today</span></div>
        <h1 className="max-w-3xl text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-[54px]">The business,<br /><span className="text-white/35">as REDEN sees it.</span></h1>
        <p className="mt-4 max-w-xl text-[13px] leading-6 text-white/40">A live view of visits, purchases and revenue recorded by your connected store.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard label="Visitors" value={visitorsValue} detail="People visiting today" icon={Users} />
        <MetricCard label="Purchases" value={purchasesValue} detail="Orders recorded today" icon={TrendingUp} />
      </div>
      <div className="mt-3">
        <MetricCard label="Revenue" value={revenueValue} detail="Sales value recorded today" icon={CircleDollarSign} subdued />
      </div>

      <button type="button" onClick={onOpenIntelligence} className="group mt-4 flex w-full items-center justify-between rounded-2xl border border-[#C97C3E]/[0.2] bg-[#C97C3E]/[0.055] px-5 py-4 text-left transition hover:border-[#C97C3E]/35 hover:bg-[#C97C3E]/[0.09]">
        <span className="flex items-center gap-3"><Activity size={16} className="text-[#DFA16E]" /><span><span className="block text-[13px] font-medium text-[#DFA16E]">Ask REDEN</span><span className="mt-1 block text-[11px] text-white/35">Understand sales, customer behaviour and what to do next.</span></span></span><ChevronRight size={16} className="text-[#DFA16E] transition-transform group-hover:translate-x-1" />
      </button>

      <details className="mt-6 group rounded-2xl border border-white/[0.08] bg-white/[0.018]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden">
          <span><span className="block text-[14px] font-medium text-white/80">Questions REDEN can help answer</span><span className="mt-1 block text-[11px] text-white/35">Browse 200 example questions, grouped by topic.</span></span>
          <ChevronRight size={18} className="shrink-0 text-white/35 transition-transform group-open:rotate-90" />
        </summary>
        <div className="border-t border-white/[0.06] px-4 py-4 md:px-5">
          <div className="space-y-3">
            {questionGroups.map((group) => <details key={group.title} className="rounded-xl bg-black/20 px-3 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] font-medium text-white/65 [&::-webkit-details-marker]:hidden">{group.title}<span className="text-[10px] text-white/25">{group.questions.length} questions</span></summary>
              <div className="mt-3 space-y-1">
                {group.questions.map((question) => <button key={question} type="button" onClick={() => onAsk(question)} className="block w-full rounded-lg px-3 py-2.5 text-left text-[11px] leading-5 text-white/45 transition hover:bg-white/[0.035] hover:text-white/80">{question}</button>)}
              </div>
            </details>)}
          </div>
          <p className="mt-4 text-[10px] leading-5 text-white/25">Examples are prompts to explore. REDEN&apos;s answer depends on the data available for your store and its current capabilities.</p>
        </div>
      </details>

      <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5 md:p-6">
        <h2 className="text-[13px] font-medium text-white/75">Store data</h2>
        <p className="mt-2 text-[12px] leading-6 text-white/40">{metricsLoading ? "Refreshing today's store figures." : metricsError ? "Metrics couldn't be refreshed. Check your connection; unavailable figures aren't treated as zero." : !metrics ? "Connect your store to begin seeing activity." : metrics.visitors === 0 && metrics.purchases === 0 ? "No visitor or purchase activity has been recorded today yet." : "These figures reflect activity recorded today. Ask REDEN to explore the numbers, behaviour and possible next steps."}</p>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  subdued = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
  subdued?: boolean;
}) {
  return (
    <div className={["group relative overflow-hidden rounded-3xl border p-4 transition duration-300 md:p-5", subdued ? "border-white/[0.045] bg-white/[0.008]" : "border-white/[0.07] bg-white/[0.018] hover:border-white/[0.11] hover:bg-white/[0.025]"].join(" ")}>
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
  input, setInput, messages, isThinking, requestError, isOnline, hasConversation,
  conversations, activeConversationId, historyOpen, historyCollapsed, onToggleHistory,
  onToggleCollapsed, onNewConversation, onSelectConversation, onSubmit, onSuggestion,
}: {
  input: string; setInput: (value: string) => void; messages: Message[]; isThinking: boolean;
  requestError: string | null; isOnline: boolean; hasConversation: boolean;
  conversations: ConversationHistory[]; activeConversationId: string | null; historyOpen: boolean;
  historyCollapsed: boolean; onToggleHistory: () => void; onToggleCollapsed: () => void; onNewConversation: () => void;
  onSelectConversation: (conversation: ConversationHistory) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onSuggestion: (question: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking, requestError]);

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden">
      <aside className={["fixed inset-y-[62px] left-0 z-40 w-[276px] border-r border-white/[0.07] bg-[#0d0b09] p-4 transition-all duration-200 lg:sticky lg:top-0 lg:z-10 lg:block lg:h-full lg:translate-x-0", historyCollapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[276px]", historyOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"].join(" ")}>
        <div className={["flex items-center", historyCollapsed ? "justify-center" : "justify-between"].join(" ")}>
          {!historyCollapsed && <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/35">Intelligence</div>}
          <button type="button" onClick={onToggleCollapsed} className="hidden rounded-lg p-2 text-white/35 transition hover:bg-white/[0.05] hover:text-white/70 lg:block" aria-label={historyCollapsed ? "Expand conversation sidebar" : "Collapse conversation sidebar"} title={historyCollapsed ? "Expand sidebar" : "Collapse sidebar"}><ChevronRight size={15} className={historyCollapsed ? "" : "rotate-180"} /></button>
          <button type="button" onClick={onToggleHistory} className="rounded-lg p-2 text-white/35 hover:bg-white/[0.05] lg:hidden" aria-label="Close history"><X size={15} /></button>
        </div>
        <button type="button" onClick={onNewConversation} disabled={isThinking} title="New conversation" className={["mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#C97C3E]/25 bg-[#C97C3E]/[0.08] px-3 py-3 text-[11px] font-medium text-[#D99A69] transition hover:bg-[#C97C3E]/[0.13] disabled:cursor-not-allowed disabled:opacity-40", historyCollapsed ? "lg:px-0" : ""].join(" ")}><span className="text-base leading-none">+</span>{!historyCollapsed && <span>New conversation</span>}</button>
        {!historyCollapsed && <div className="mt-7 flex items-center justify-between px-1"><span className="text-[9px] uppercase tracking-[0.13em] text-white/25">Recent conversations</span><span className="text-[9px] tabular-nums text-white/20">{conversations.length}</span></div>}
        <div className="mt-3 space-y-1 overflow-y-auto pb-6 lg:max-h-[calc(100%-125px)]">
          {conversations.length === 0 ? <p className="px-2 py-4 text-[10px] leading-5 text-white/25">Your conversations will appear here on this browser.</p> : conversations.map((conversation) => (
            <button key={conversation.id} type="button" title={conversation.title} disabled={isThinking} onClick={() => onSelectConversation(conversation)} className={["w-full rounded-xl px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40", historyCollapsed ? "lg:px-0 lg:text-center" : "", activeConversationId === conversation.id ? "bg-white/[0.07] text-white/80" : "text-white/40 hover:bg-white/[0.035] hover:text-white/65"].join(" ")}>
              {historyCollapsed ? <span className="text-[11px] font-medium">{conversation.title.slice(0, 1).toUpperCase()}</span> : <><div className="truncate text-[11px]">{conversation.title}</div><div className="mt-1 text-[9px] text-white/20">{new Date(conversation.updatedAt).toLocaleDateString()}</div></>}
            </button>
          ))}
        </div>
        {!historyCollapsed && <div className="absolute bottom-4 left-4 right-4 border-t border-white/[0.06] pt-3 text-[9px] leading-4 text-white/20">History is stored in this browser for this storefront.</div>}
      </aside>
      {historyOpen && <button type="button" aria-label="Close conversation history" onClick={onToggleHistory} className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}
      <section className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-white/[0.06] px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onToggleHistory} className="rounded-lg border border-white/[0.07] p-2 text-white/45 hover:bg-white/[0.04] lg:hidden" aria-label="Open conversation history"><MoreHorizontal size={16} /></button>
            <div><div className="text-[12px] font-medium text-white/75">Intelligence</div><div className="mt-0.5 text-[10px] text-white/30">Business analysis, grounded in your store data</div></div>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-white/30"><span className={["h-1.5 w-1.5 rounded-full", isOnline ? "bg-emerald-400/60" : "bg-white/20"].join(" ")} />{isOnline ? "Connected" : "Offline"}</div>
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-8 md:px-8">
          {!hasConversation ? (
            <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col justify-center py-8">
              <div className="max-w-2xl">
                <h1 className="text-[34px] font-medium leading-[1.08] tracking-[-0.055em] text-white/90 md:text-[48px]">What should we<br /><span className="text-white/35">look into today?</span></h1>
                <p className="mt-4 max-w-xl text-[13px] leading-6 text-white/35">Ask a direct question about your store. REDEN separates observed facts from interpretation and identifies where the available evidence has limits.</p>
                <div className="mt-7 grid gap-2 sm:grid-cols-2">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => onSuggestion(suggestion)} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left text-[11px] text-white/50 transition hover:border-[#C97C3E]/30 hover:bg-[#C97C3E]/[0.05] hover:text-white/80">{suggestion}</button>)}</div>
                <div className="mt-8"><Composer input={input} setInput={setInput} onSubmit={onSubmit} isThinking={isThinking} /><div className="mt-2 text-center text-[8px] text-white/20">Answers are grounded in the store evidence currently available.</div></div>
                {requestError && <div role="status" className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-[11px] leading-6 text-white/45">{requestError}</div>}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[760px] space-y-10 pb-6">
              {!isOnline && <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-[11px] leading-5 text-white/45">You&apos;re offline. REDEN will be available again when your connection returns.</div>}
              {messages.map((message) => <div key={message.id}>{message.role === "user" ? <div className="flex justify-end"><div className="max-w-[88%] rounded-2xl bg-white/[0.07] px-4 py-3 text-[13px] leading-6 text-white/80 md:max-w-[78%]">{message.content}</div></div> : <div className="max-w-[760px]"><RichAnswer content={message.content} /></div>}</div>)}
              {isThinking && <div className="flex items-center gap-2 py-1 text-[11px] text-white/30"><span className="h-1 w-1 animate-pulse rounded-full bg-[#C97C3E]/70" />Reviewing your question…</div>}
              {requestError && <div role="status" className="max-w-[760px] rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-[11px] leading-6 text-white/45">{requestError}</div>}
            </div>
          )}
        </div>
        {hasConversation && <div className="shrink-0 border-t border-white/[0.06] bg-[#090807]/95 px-4 py-3 backdrop-blur-2xl lg:px-6">
          <div className="mx-auto max-w-[760px]"><Composer input={input} setInput={setInput} onSubmit={onSubmit} isThinking={isThinking} /><div className="mt-2 text-center text-[8px] text-white/20">Answers are grounded in the store evidence currently available.</div></div>
        </div>}
      </section>
    </div>
  );
}

function RichAnswer({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const renderInline = (value: string) => value.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index} className="font-semibold text-white/90">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[0.9em] text-[#D9A477]">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
  return <div className="space-y-3 text-[14px] leading-7 text-white/75 md:text-[15px]">{lines.map((line, index) => {
    const value = line.trim();
    if (!value) return <div key={index} className="h-1" />;
    if (/^###\s/.test(value)) return <h3 key={index} className="pt-2 text-[14px] font-semibold text-white/90">{renderInline(value.replace(/^###\s/, ""))}</h3>;
    if (/^##\s/.test(value)) return <h2 key={index} className="pt-3 text-[17px] font-semibold tracking-[-0.02em] text-white/90">{renderInline(value.replace(/^##\s/, ""))}</h2>;
    if (/^#\s/.test(value)) return <h2 key={index} className="pt-3 text-[19px] font-semibold tracking-[-0.03em] text-white/90">{renderInline(value.replace(/^#\s/, ""))}</h2>;
    if (/^[-*]\s/.test(value)) return <div key={index} className="flex gap-3 pl-1"><span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-[#C97C3E]/80" /><div className="min-w-0 flex-1">{renderInline(value.replace(/^[-*]\s/, ""))}</div></div>;
    if (/^\d+[.)]\s/.test(value)) return <div key={index} className="flex gap-3 pl-1"><span className="shrink-0 text-[12px] font-medium text-[#D49A6B]">{value.match(/^\d+[.)]/)?.[0]}</span><div className="min-w-0 flex-1">{renderInline(value.replace(/^\d+[.)]\s/, ""))}</div></div>;
    if (/^---+$/.test(value)) return <div key={index} className="my-3 border-t border-white/[0.08]" />;
    return <p key={index}>{renderInline(value)}</p>;
  })}</div>;
}

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
      <div className="group flex min-h-[64px] items-center rounded-[28px] border border-white/[0.10] bg-[#12100f] px-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)] transition duration-300 focus-within:border-[#C97C3E]/35 focus-within:bg-[#151210]">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isThinking}
          placeholder="Ask REDEN..."
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-1 py-5 text-[14px] text-white outline-none placeholder:text-white/25 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          aria-label="Send question"
          className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-black transition hover:brightness-110 disabled:bg-white/[0.07] disabled:text-white/20"
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