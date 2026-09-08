"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  Code2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Store,
  UserPlus,
  ChevronDown,
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

type Installation = {
  siteId: string;
  apiKey: string;
  name: string;
  connectionId: string;
  platform?: string | null;
};

type VerifyResponse = {
  ok?: boolean;
  connected?: boolean;
  verified?: boolean;
  status?: string;
  error?: string;
};

type InviteResponse = {
  ok?: boolean;
  inviteUrl?: string;
  url?: string;
  error?: string;
};

type FindStoreResponse = {
  ok?: boolean;
  found?: boolean;
  store?: {
    id: string;
    name: string | null;
    siteId: string | null;
    status: string | null;
    clientEmail: string | null;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
};

const EASE = [0.19, 1, 0.22, 1] as const;

function Glass({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.085] bg-white/[0.032] shadow-[0_24px_100px_rgba(0,0,0,0.25)] backdrop-blur-2xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.16] to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

function StatusDot({
  status,
}: {
  status: "live" | "waiting" | "idle";
}) {
  if (status === "live") {
    return (
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#72b77b] opacity-30" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-[#72b77b]" />
      </span>
    );
  }

  if (status === "waiting") {
    return (
      <motion.span
        className="h-1.5 w-1.5 rounded-full bg-[#a08a5f]"
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
    <span className="h-1.5 w-1.5 rounded-full bg-[#4b4642]" />
  );
}

function CopyButton({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 text-[8px] tracking-[0.1em] transition-colors ${
        copied
          ? "text-[#72b77b]"
          : "text-[#625c57] hover:text-[#d0cac4]"
      }`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          COPIED
        </>
      ) : (
        <>
          <Clipboard className="h-3 w-3" />
          COPY
        </>
      )}
    </button>
  );
}

function CodePanel({
  title,
  code,
  copied,
  onCopy,
}: {
  title: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30">
      <div className="flex items-center justify-between border-b border-white/[0.055] px-4 py-2.5">
        <span className="text-[8px] tracking-[0.16em] text-[#46413d]">
          {title}
        </span>

        <CopyButton
          value={code}
          copied={copied}
          onCopy={onCopy}
        />
      </div>

      <pre className="overflow-x-auto p-5 text-[10px] leading-6">
        <code className="text-[#aaa39d]">{code}</code>
      </pre>
    </div>
  );
}

function PlatformGuide({
  platform,
}: {
  platform?: string | null;
}) {
  const normalized = platform?.toLowerCase() ?? "";

  if (normalized.includes("shopify")) {
    return (
      <div className="mt-6 border-t border-white/[0.055] pt-5">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-[10px] text-[#88817a]">
            S
          </div>

          <div>
            <div className="text-[10px] text-[#bcb6b0]">
              Shopify
            </div>

            <p className="mt-1.5 text-[10px] leading-5 text-[#625c56]">
              Add the REDEN SDK to the storefront&apos;s global
              theme/layout. Then use the event-tracking
              instructions below for product, cart, checkout,
              and purchase events.
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "Online Store",
                "Themes",
                "Edit code",
                "theme.liquid",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-white/[0.06] bg-white/[0.018] px-2 py-1 text-[8px] text-[#66605e]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-white/[0.055] pt-5">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-[9px] text-[#88817a]">
          &lt;/&gt;
        </div>

        <div>
          <div className="text-[10px] text-[#bcb6b0]">
            Standard website
          </div>

          <p className="mt-1.5 text-[10px] leading-5 text-[#625c56]">
            Add the SDK once to the storefront&apos;s global
            layout or equivalent shared document.
          </p>
        </div>
      </div>
    </div>
  );
}

function TrackingEvent({
  number,
  name,
  location,
  description,
  code,
  expanded,
  onToggle,
  copied,
  onCopy,
}: {
  number: string;
  name: string;
  location: string;
  description: string;
  code: string;
  expanded: boolean;
  onToggle: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.018]"
      >
        <span className="text-[8px] tracking-[0.14em] text-[#4d4844]">
          {number}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium tracking-[0.04em] text-[#c9c3bd]">
            {name}
          </div>

          <div className="mt-1 text-[8px] tracking-[0.1em] text-[#625c56]">
            {location}
          </div>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#55504b] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="border-t border-white/[0.055] px-4 pb-5 pt-4">
              <p className="text-[9px] leading-5 text-[#625c56]">
                {description}
              </p>

              <CodePanel
                title={`${name} / IMPLEMENTATION`}
                code={code}
                copied={copied}
                onCopy={onCopy}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RedenDeveloperPage() {
  const searchParams = useSearchParams();

  const requestedStore = searchParams.get("store");
  const isNew = searchParams.get("new") === "1";

  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [selectedStore, setSelectedStore] =
    useState<StoreConnection | null>(null);

  const [installation, setInstallation] =
    useState<Installation | null>(null);

  const [storeName, setStoreName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [creatingInvite, setCreatingInvite] =
    useState(false);

  const [connected, setConnected] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  const [copied, setCopied] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  const [openEvent, setOpenEvent] =
    useState<string | null>(null);

  const loadStores = useCallback(async () => {
    try {
      setLoadingStores(true);
      setError("");

      const response = await fetch(
        "/api/reden/stores",
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load storefronts."
        );
      }

      const loadedStores = Array.isArray(data?.stores)
        ? data.stores
        : [];

      setStores(loadedStores);

      if (requestedStore) {
        const match = loadedStores.find(
          (store: StoreConnection) =>
            store.id === requestedStore
        );

        if (match) {
          setSelectedStore(match);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load storefronts."
      );
    } finally {
      setLoadingStores(false);
    }
  }, [requestedStore]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  const openStore = (store: StoreConnection) => {
    setSelectedStore(store);
    setInstallation(null);
    setConnected(store.status === "active");
    setInviteUrl("");
    setError("");
    setShowKey(false);
    setOpenEvent(null);
  };

  const createStore = async () => {
    const name = storeName.trim();
    const email = clientEmail.trim().toLowerCase();

    if (!name) {
      setError("Enter the client storefront.");
      return;
    }

    if (!email) {
      setError("Enter the client's email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid client email address.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      /* =====================================================
         STEP 0 — CHECK FOR AN EXISTING STOREFRONT FIRST

         Prevents onboarding from minting a duplicate REDEN
         site_id for a client/store that's already connected.

         /api/reden/stores/find is scoped to the authenticated
         developer_email server-side, so this can only ever
         surface stores this developer already created.
      ===================================================== */

      const findResponse = await fetch(
        "/api/reden/stores/find",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ storeName: name }),
          cache: "no-store",
        }
      );

      const findData: FindStoreResponse | null =
        await findResponse.json().catch(() => null);

      if (
        findResponse.ok &&
        findData?.ok &&
        findData?.found &&
        findData?.store &&
        typeof findData.store.siteId === "string" &&
        findData.store.siteId.trim().length > 0
      ) {
        const existing = findData.store;

        const existingStore: StoreConnection = {
          id: existing.id,
          name:
            typeof existing.name === "string" &&
            existing.name.trim()
              ? existing.name.trim()
              : name,
          siteId: existing.siteId as string,
          status: existing.status ?? "installing",
        };

        setStores((current) => [
          existingStore,
          ...current.filter(
            (item) => item.id !== existingStore.id
          ),
        ]);

        setStoreName("");
        setClientEmail("");
        setCreating(false);

        /*
         * Route into the existing storefront instead of
         * minting a new one via /api/reden/onboard.
         */
        openStore(existingStore);
        return;
      }

      /* =====================================================
         STEP 1 — NO EXISTING STOREFRONT, PROCEED TO ONBOARD
      ===================================================== */

      const response = await fetch(
        "/api/reden/onboard",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name,
            clientEmail: email,
          }),
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to create storefront."
        );
      }

      const store = data?.store;
      const connection = data?.connection;

      const siteId =
        typeof data?.siteId === "string"
          ? data.siteId.trim()
          : typeof store?.siteId === "string"
            ? store.siteId.trim()
            : typeof connection?.siteId === "string"
              ? connection.siteId.trim()
              : "";

      const apiKey =
        typeof data?.apiKey === "string"
          ? data.apiKey.trim()
          : typeof store?.apiKey === "string"
            ? store.apiKey.trim()
            : "";

      const connectionId =
        typeof store?.id === "string"
          ? store.id.trim()
          : typeof connection?.id === "string"
            ? connection.id.trim()
            : "";

      if (!siteId) {
        throw new Error(
          "REDEN did not return a storefront identity."
        );
      }

      if (!apiKey) {
        throw new Error(
          "REDEN did not return the SDK credential."
        );
      }

      if (!connectionId) {
        throw new Error(
          "REDEN did not return the storefront connection."
        );
      }

      const createdStore: StoreConnection = {
        id: connectionId,
        name:
          typeof store?.name === "string" &&
          store.name.trim()
            ? store.name.trim()
            : typeof connection?.name === "string" &&
                connection.name.trim()
              ? connection.name.trim()
              : typeof data?.name === "string" &&
                  data.name.trim()
                ? data.name.trim()
                : name,
        domain:
          typeof store?.domain === "string"
            ? store.domain
            : typeof connection?.domain === "string"
              ? connection.domain
              : null,
        platform:
          typeof store?.platform === "string"
            ? store.platform
            : typeof connection?.platform === "string"
              ? connection.platform
              : null,
        siteId,
        status:
          typeof store?.status === "string"
            ? store.status
            : typeof connection?.status === "string"
              ? connection.status
              : "pending",
      };

      setStores((current) => [
        createdStore,
        ...current.filter(
          (item) => item.id !== createdStore.id
        ),
      ]);

      setSelectedStore(createdStore);

      setInstallation({
        siteId,
        apiKey,
        name: createdStore.name,
        connectionId,
        platform: createdStore.platform,
      });

      setStoreName("");
      setClientEmail("");
      setConnected(createdStore.status === "active");
      setInviteUrl("");
      setShowKey(false);
      setOpenEvent(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create storefront."
      );
    } finally {
      setCreating(false);
    }
  };

  const checkConnection = useCallback(async () => {
    const siteId = installation?.siteId?.trim();

    if (!siteId) {
      setError(
        "This storefront does not have a valid REDEN identity."
      );
      return;
    }

    if (checking) return;

    setChecking(true);
    setError("");

    try {
      const response = await fetch(
        "/api/reden/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ siteId }),
          cache: "no-store",
        }
      );

      const data: VerifyResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to verify the installation."
        );
      }

      const isConnected =
        Boolean(data?.connected) ||
        Boolean(data?.verified) ||
        data?.status === "connected" ||
        data?.status === "active";

      setConnected(isConnected);

      if (isConnected && selectedStore) {
        setStores((current) =>
          current.map((store) =>
            store.id === selectedStore.id
              ? {
                  ...store,
                  status: "active",
                }
              : store
          )
        );

        setSelectedStore((current) =>
          current
            ? {
                ...current,
                status: "active",
              }
            : current
        );
      }

      if (!isConnected && data?.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the installation."
      );
    } finally {
      setChecking(false);
    }
  }, [
    installation?.siteId,
    checking,
    selectedStore,
  ]);

  useEffect(() => {
    if (!installation?.siteId || connected) {
      return;
    }

    const interval = window.setInterval(() => {
      void checkConnection();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [
    installation?.siteId,
    connected,
    checkConnection,
  ]);

  const createInvite = async () => {
    if (!installation?.connectionId) {
      setError(
        "Select a valid storefront before creating an invite."
      );
      return;
    }

    setCreatingInvite(true);
    setError("");

    try {
      const response = await fetch(
        "/api/reden/invites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            connectionId: installation.connectionId,
          }),
          cache: "no-store",
        }
      );

      const data: InviteResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create the invitation."
        );
      }

      const url =
        typeof data?.inviteUrl === "string"
          ? data.inviteUrl
          : typeof data?.url === "string"
            ? data.url
            : "";

      if (!url) {
        throw new Error(
          "REDEN did not return an invitation link."
        );
      }

      setInviteUrl(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the invitation."
      );
    } finally {
      setCreatingInvite(false);
    }
  };

  const copy = async (
    value: string,
    key: string
  ) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);

      window.setTimeout(
        () => setCopied(""),
        1800
      );
    } catch {
      setError("Unable to copy to clipboard.");
    }
  };

  const sdkCode = useMemo(() => {
    if (
      !installation?.siteId ||
      !installation?.apiKey
    ) {
      return "";
    }

    return `<script
  src="https://reden.dcore.name.ng/sdk.js"
  data-site-id="${installation.siteId}"
  data-api-key="${installation.apiKey}"
></script>`;
  }, [installation]);

  const trackingPrompt = useMemo(() => {
    return `Add REDEN event tracking to this storefront.

REDEN is already loaded globally via its SDK script, so window.Reden is available and exposes:

window.Reden.track(eventName, payload)

Add the following four events at the exact business logic points below.

1. PRODUCT_VIEW

On the product detail page, when the product page loads:

window.Reden?.track("PRODUCT_VIEW", {
  product_id: <the product's id>,
  price: <the product's price>
});

2. ADD_TO_CART

In the Add to Cart action, only AFTER the item has been successfully added to the cart:

window.Reden?.track("ADD_TO_CART", {
  product_id: <the product's id>,
  quantity: <the quantity added>,
  price: <the product's price>
});

Do not fire this event if adding the item to the cart fails.

3. CHECKOUT_STARTED

On the checkout page, when checkout has actually started:

window.Reden?.track("CHECKOUT_STARTED", {
  cart_id: <the cart id>,
  cart_value: <the current cart total>,
  email: <the customer's email if available>
});

4. PURCHASE

On the order confirmation / Thank You page, AFTER the purchase has successfully completed:

window.Reden?.track("PURCHASE", {
  order_id: <the completed order id>,
  revenue: <the final order total>,
  email: <the customer's email if available>
});

IMPORTANT:

- Use the exact event names shown above.
- Use window.Reden?.track(...) with optional chaining.
- Find the actual product page, Add to Cart logic, checkout flow, and order confirmation / Thank You page in this codebase.
- Use the real variables and data structures already used by this storefront.
- Do not invent IDs, prices, cart values, order IDs, or customer data.
- Do not create fake placeholder data in the implementation.
- Do not add the REDEN SDK script again if it is already installed globally.
- Do not fire PURCHASE before the order is successfully completed.
- Do not fire ADD_TO_CART when the cart operation fails.
- Avoid duplicate events caused by React re-renders, repeated effects, or navigation.
- Keep existing storefront behavior unchanged.
- Make the smallest production-safe changes necessary.

After implementation, show me:
1. Which files were modified.
2. Where PRODUCT_VIEW was added.
3. Where ADD_TO_CART was added.
4. Where CHECKOUT_STARTED was added.
5. Where PURCHASE was added.
6. How duplicate PURCHASE events are prevented.`;
  }, []);

  const maskedKey = installation?.apiKey
    ? `${installation.apiKey.slice(0, 7)}${"•".repeat(28)}`
    : "";

  const reset = () => {
    setSelectedStore(null);
    setInstallation(null);
    setConnected(false);
    setInviteUrl("");
    setError("");
    setShowKey(false);
    setOpenEvent(null);
  };

  /*
   * Keep your existing NEW STORE screen here.
   * Keep your existing STORE SELECTED screen here.
   */

  if (isNew && !selectedStore && !installation) {
    return (
      <main className="min-h-screen bg-[#070706] text-[#d8d2cc]">
        {/* KEEP YOUR EXISTING NEW STORE UI */}
        <div className="mx-auto max-w-5xl px-5 py-5">
          <header className="flex h-14 items-center justify-between border-b border-white/[0.065]">
            <Link href="/reden-addstore">
              <img
                src="/reden-logo.png"
                alt="REDEN"
                className="h-7 w-auto object-contain"
              />
            </Link>

            <span className="text-[8px] tracking-[0.18em] text-[#5d5853]">
              NEW INTEGRATION
            </span>
          </header>

          <div className="mx-auto max-w-4xl py-20">
            <Glass className="p-6 md:p-8">
              <div className="text-[8px] tracking-[0.18em] text-[#48433f]">
                STEP 01 / IDENTITY
              </div>

              <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.045em] text-[#f0ebe6]">
                Let&apos;s connect a storefront.
              </h1>

              <p className="mt-4 max-w-xl text-[11px] leading-6 text-[#716b65]">
                Start with the storefront you are
                integrating. REDEN will generate the
                infrastructure identity and guide you
                through installation.
              </p>

              <label
                htmlFor="store-name"
                className="mt-8 block text-[10px] text-[#c4beb8]"
              >
                Storefront
              </label>

              <input
                id="store-name"
                value={storeName}
                autoFocus
                disabled={creating}
                onChange={(event) => {
                  setStoreName(event.target.value);
                  setError("");
                }}
                placeholder="client-store.com"
                className="mt-2.5 h-11 w-full rounded-xl border border-white/[0.09] bg-black/20 px-3.5 text-[11px] text-[#e5dfd9] outline-none placeholder:text-[#3f3a36] focus:border-[#ff5a1f]/50"
              />

              <label
                htmlFor="client-email"
                className="mt-7 block text-[10px] text-[#c4beb8]"
              >
                Client email
              </label>

              <input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={(event) => {
                  setClientEmail(event.target.value);
                  setError("");
                }}
                placeholder="client@example.com"
                className="mt-2.5 h-11 w-full rounded-xl border border-white/[0.09] bg-black/20 px-3.5 text-[11px] text-[#e5dfd9] outline-none placeholder:text-[#3f3a36] focus:border-[#ff5a1f]/50"
              />

              {error && (
                <div className="mt-5 rounded-xl border border-[#ff7048]/15 bg-[#ff7048]/[0.025] px-4 py-3">
                  <p className="text-[10px] text-[#ff7048]">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={() => void createStore()}
                  disabled={
                    creating ||
                    !storeName.trim() ||
                    !clientEmail.trim()
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ff5a1f] px-5 text-[9px] font-semibold tracking-[0.06em] text-[#140b07] disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      CREATING
                    </>
                  ) : (
                    <>
                      CONTINUE
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </Glass>
          </div>
        </div>
      </main>
    );
  }

  /*
   * EXISTING SELECTED STORE STATE
   */

  if (selectedStore && !installation) {
    return (
      <main className="min-h-screen bg-[#070706] text-[#d8d2cc]">
        <div className="mx-auto max-w-5xl px-5 py-5">
          <header className="flex h-14 items-center justify-between border-b border-white/[0.065]">
            <Link href="/reden-addstore">
              <img
                src="/reden-logo.png"
                alt="REDEN"
                className="h-7 w-auto object-contain"
              />
            </Link>

            <span className="text-[8px] tracking-[0.18em] text-[#5d5853]">
              INTEGRATION
            </span>
          </header>

          <div className="mx-auto max-w-4xl py-20">
            <Glass className="p-6 md:p-8">
              <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                STOREFRONT
              </div>

              <h1 className="mt-2 text-xl text-[#ddd8d3]">
                {selectedStore.name}
              </h1>

              <p className="mt-5 text-[10px] leading-5 text-[#625c56]">
                This storefront is already connected
                to your developer environment. Start a
                new REDEN integration to retrieve its
                SDK credentials and installation workflow.
              </p>

              <div className="mt-7 flex gap-3">
                <Link
                  href="/reden-addstore"
                  className="inline-flex h-9 items-center rounded-lg border border-white/[0.08] px-4 text-[8px] tracking-[0.1em] text-[#817a74]"
                >
                  BACK
                </Link>

                <Link
                  href="/reden-developer?new=1"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ff5a1f] px-4 text-[8px] font-semibold tracking-[0.08em] text-[#140b07]"
                >
                  START INTEGRATION
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Glass>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ACTIVE INTEGRATION
   */

  if (selectedStore && installation) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#070706] text-[#d8d2cc]">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(255,90,31,0.06),transparent_38%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-5 sm:px-7 md:px-10">
          <header className="flex h-14 items-center justify-between border-b border-white/[0.065]">
            <Link href="/reden-addstore">
              <img
                src="/reden-logo.png"
                alt="REDEN"
                className="h-7 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-3">
              <StatusDot
                status={connected ? "live" : "waiting"}
              />

              <span
                className={`text-[8px] tracking-[0.15em] ${
                  connected
                    ? "text-[#72b77b]"
                    : "text-[#a08a5f]"
                }`}
              >
                {connected
                  ? "CONNECTED"
                  : "SETUP IN PROGRESS"}
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-4xl pb-24">
            <section className="pt-14">
              <button
                type="button"
                onClick={reset}
                className="mb-7 inline-flex items-center gap-2 text-[8px] tracking-[0.12em] text-[#625d58] hover:text-[#d0cac4]"
              >
                <ArrowLeft className="h-3 w-3" />
                STOREFRONTS
              </button>

              <div className="text-[8px] tracking-[0.18em] text-[#48433f]">
                REDEN INTEGRATION
              </div>

              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] text-[#eee8e2] sm:text-[38px]">
                {installation.name}
              </h1>

              <p className="mt-3 max-w-xl text-[10px] leading-5 text-[#625c56]">
                Install the SDK once, connect the four
                commerce events, verify the integration,
                then hand off access.
              </p>
            </section>

            {/* PROGRESS */}

            <div className="mt-10 grid grid-cols-5 gap-1.5">
              {[
                "CREDENTIALS",
                "SDK",
                "TRACKING",
                "VERIFY",
                "HANDOFF",
              ].map((step, index) => {
                const active =
                  index === 0 ||
                  Boolean(installation) ||
                  (index >= 3 && connected) ||
                  (index === 4 && Boolean(inviteUrl));

                return (
                  <div
                    key={step}
                    className="space-y-2"
                  >
                    <div
                      className={`h-px ${
                        active
                          ? "bg-[#ff5a1f]"
                          : "bg-white/[0.08]"
                      }`}
                    />

                    <span
                      className={`text-[7px] tracking-[0.12em] ${
                        active
                          ? "text-[#8c857e]"
                          : "text-[#403c39]"
                      }`}
                    >
                      0{index + 1} / {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-3">

              {/* 01 CREDENTIALS */}

              <Glass>
                <div className="border-b border-white/[0.055] px-5 py-4 md:px-6">
                  <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                    01 / CREDENTIALS
                  </div>

                  <h2 className="mt-1.5 text-[14px] font-medium text-[#ded8d2]">
                    SDK credential
                  </h2>
                </div>

                <div className="p-5 md:p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                        STOREFRONT ID
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-4">
                        <code className="truncate text-[10px] text-[#aaa39d]">
                          {installation.siteId}
                        </code>

                        <CopyButton
                          value={installation.siteId}
                          copied={copied === "site"}
                          onCopy={() =>
                            void copy(
                              installation.siteId,
                              "site"
                            )
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                        API KEY
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-4">
                        <code className="truncate text-[10px] text-[#aaa39d]">
                          {showKey
                            ? installation.apiKey
                            : maskedKey}
                        </code>

                        <div className="flex shrink-0 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setShowKey((value) => !value)
                            }
                            className="text-[8px] tracking-[0.1em] text-[#625d58]"
                          >
                            {showKey ? "HIDE" : "REVEAL"}
                          </button>

                          <CopyButton
                            value={installation.apiKey}
                            copied={copied === "key"}
                            onCopy={() =>
                              void copy(
                                installation.apiKey,
                                "key"
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-6 border-l border-[#ff5a1f]/30 pl-3 text-[9px] leading-5 text-[#5f5954]">
                    Use these credentials only in the
                    REDEN SDK installation. Do not hard-code
                    them into application business logic.
                  </p>
                </div>
              </Glass>

              {/* 02 SDK INSTALLATION */}

              <Glass>
                <div className="border-b border-white/[0.055] px-5 py-4 md:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                        02 / SDK INSTALLATION
                      </div>

                      <h2 className="mt-1.5 text-[14px] font-medium text-[#ded8d2]">
                        Install REDEN once
                      </h2>
                    </div>

                    <Code2 className="h-3.5 w-3.5 text-[#4e4945]" />
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <p className="max-w-xl text-[10px] leading-5 text-[#625c56]">
                    Add this script once to the storefront&apos;s
                    global layout. You do not need to add the
                    SDK separately to every page.
                  </p>

                  <CodePanel
                    title="SDK / INSTALL ONCE"
                    code={sdkCode}
                    copied={copied === "sdk"}
                    onCopy={() =>
                      void copy(sdkCode, "sdk")
                    }
                  />

                  <PlatformGuide
                    platform={installation.platform}
                  />

                  <div className="mt-6 rounded-xl border border-[#ff5a1f]/15 bg-[#ff5a1f]/[0.025] p-4">
                    <div className="text-[9px] tracking-[0.12em] text-[#ff6a35]">
                      IMPORTANT
                    </div>

                    <p className="mt-2 text-[9px] leading-5 text-[#625c56]">
                      The SDK only makes REDEN available to
                      the storefront. It does not automatically
                      know when a product was viewed, added
                      to cart, checked out, or purchased.
                    </p>

                    <p className="mt-2 text-[9px] leading-5 text-[#625c56]">
                      Those four business events are connected
                      in the next step.
                    </p>
                  </div>
                </div>
              </Glass>

              {/* 03 EVENT TRACKING */}

              <Glass>
                <div className="border-b border-white/[0.055] px-5 py-4 md:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                        03 / EVENT TRACKING
                      </div>

                      <h2 className="mt-1.5 text-[14px] font-medium text-[#ded8d2]">
                        Connect the commerce lifecycle
                      </h2>
                    </div>

                    <span className="shrink-0 text-[7px] tracking-[0.12em] text-[#625c56]">
                      4 EVENTS
                    </span>
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <p className="max-w-2xl text-[10px] leading-5 text-[#625c56]">
                    Add one tracking call at each business
                    event. You can implement these manually,
                    or give the prompt below to Copilot, Cursor,
                    Claude, or another coding assistant.
                  </p>

                  <div className="mt-6 space-y-2">
                    <TrackingEvent
                      number="01"
                      name="PRODUCT_VIEW"
                      location="PRODUCT DETAIL PAGE"
                      description="Fire when the actual product detail page loads and the product data is available."
                      code={`window.Reden?.track("PRODUCT_VIEW", {
  product_id: product.id,
  price: product.price
});`}
                      expanded={openEvent === "product"}
                      onToggle={() =>
                        setOpenEvent(
                          openEvent === "product"
                            ? null
                            : "product"
                        )
                      }
                      copied={copied === "product"}
                      onCopy={() =>
                        void copy(
                          `window.Reden?.track("PRODUCT_VIEW", {
  product_id: product.id,
  price: product.price
});`,
                          "product"
                        )
                      }
                    />

                    <TrackingEvent
                      number="02"
                      name="ADD_TO_CART"
                      location="SUCCESSFUL ADD TO CART"
                      description="Fire only after the storefront confirms that the product was successfully added to the cart."
                      code={`window.Reden?.track("ADD_TO_CART", {
  product_id: product.id,
  quantity: quantity,
  price: product.price
});`}
                      expanded={openEvent === "cart"}
                      onToggle={() =>
                        setOpenEvent(
                          openEvent === "cart"
                            ? null
                            : "cart"
                        )
                      }
                      copied={copied === "cart"}
                      onCopy={() =>
                        void copy(
                          `window.Reden?.track("ADD_TO_CART", {
  product_id: product.id,
  quantity: quantity,
  price: product.price
});`,
                          "cart"
                        )
                      }
                    />

                    <TrackingEvent
                      number="03"
                      name="CHECKOUT_STARTED"
                      location="CHECKOUT"
                      description="Fire when the customer actually enters the checkout flow and the cart information is available."
                      code={`window.Reden?.track("CHECKOUT_STARTED", {
  cart_id: cart.id,
  cart_value: cart.total,
  email: customer?.email
});`}
                      expanded={openEvent === "checkout"}
                      onToggle={() =>
                        setOpenEvent(
                          openEvent === "checkout"
                            ? null
                            : "checkout"
                        )
                      }
                      copied={copied === "checkout"}
                      onCopy={() =>
                        void copy(
                          `window.Reden?.track("CHECKOUT_STARTED", {
  cart_id: cart.id,
  cart_value: cart.total,
  email: customer?.email
});`,
                          "checkout"
                        )
                      }
                    />

                    <TrackingEvent
                      number="04"
                      name="PURCHASE"
                      location="ORDER CONFIRMATION / THANK YOU"
                      description="Fire only after the order has successfully completed. This is the conversion event REDEN uses to recognize completed revenue."
                      code={`window.Reden?.track("PURCHASE", {
  order_id: order.id,
  revenue: order.total,
  email: customer?.email
});`}
                      expanded={openEvent === "purchase"}
                      onToggle={() =>
                        setOpenEvent(
                          openEvent === "purchase"
                            ? null
                            : "purchase"
                        )
                      }
                      copied={copied === "purchase"}
                      onCopy={() =>
                        void copy(
                          `window.Reden?.track("PURCHASE", {
  order_id: order.id,
  revenue: order.total,
  email: customer?.email
});`,
                          "purchase"
                        )
                      }
                    />
                  </div>

                  {/* AI PROMPT */}

                  <div className="mt-6 overflow-hidden rounded-xl border border-[#ff5a1f]/15 bg-[#ff5a1f]/[0.018]">
                    <div className="border-b border-[#ff5a1f]/10 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[8px] tracking-[0.16em] text-[#ff6a35]">
                            AI-ASSISTED INSTALLATION
                          </div>

                          <h3 className="mt-1.5 text-[12px] font-medium text-[#d9d2cc]">
                            Let your coding assistant do it
                          </h3>
                        </div>

                        <Code2 className="h-3.5 w-3.5 text-[#8b5140]" />
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-[9px] leading-5 text-[#625c56]">
                        Using VS Code? Paste this prompt into
                        GitHub Copilot, Cursor, Claude Code, or
                        another coding assistant. It will inspect
                        the storefront and place the events in
                        the correct files.
                      </p>

                      <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-black/35">
                        <div className="flex items-center justify-between border-b border-white/[0.055] px-4 py-2.5">
                          <span className="text-[8px] tracking-[0.16em] text-[#46413d]">
                            REDEN IMPLEMENTATION PROMPT
                          </span>

                          <CopyButton
                            value={trackingPrompt}
                            copied={copied === "prompt"}
                            onCopy={() =>
                              void copy(
                                trackingPrompt,
                                "prompt"
                              )
                            }
                          />
                        </div>

                        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap p-5 text-[9px] leading-5 text-[#8f8982]">
                          {trackingPrompt}
                        </pre>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          "VS CODE",
                          "COPILOT",
                          "CURSOR",
                          "CLAUDE",
                        ].map((tool) => (
                          <span
                            key={tool}
                            className="rounded-md border border-white/[0.06] bg-white/[0.018] px-2 py-1 text-[7px] tracking-[0.1em] text-[#5d5752]"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/[0.055] pt-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5a1f]" />

                      <p className="text-[9px] leading-5 text-[#57514c]">
                        REDEN is considered fully instrumented
                        only when the SDK is installed and all
                        four lifecycle events are connected.
                      </p>
                    </div>
                  </div>
                </div>
              </Glass>

              {/* 04 VERIFICATION */}

              <Glass>
                <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-4 md:px-6">
                  <div>
                    <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                      04 / VERIFICATION
                    </div>

                    <h2 className="mt-1.5 text-[14px] font-medium text-[#ded8d2]">
                      Verify installation
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void checkConnection()
                    }
                    disabled={checking}
                    className="inline-flex items-center gap-2 text-[8px] tracking-[0.1em] text-[#625d58] hover:text-[#d0cac4] disabled:opacity-40"
                  >
                    <RefreshCw
                      className={
                        checking
                          ? "h-3 w-3 animate-spin"
                          : "h-3 w-3"
                      }
                    />
                    CHECK
                  </button>
                </div>

                <div className="p-5 md:p-6">
                  <div className="divide-y divide-white/[0.05]">
                    <div className="flex items-center justify-between py-3 first:pt-0">
                      <div className="flex items-center gap-3">
                        <StatusDot status="live" />
                        <span className="text-[10px] text-[#77716b]">
                          REDEN API
                        </span>
                      </div>

                      <span className="text-[8px] text-[#72b77b]">
                        AVAILABLE
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <StatusDot status="live" />
                        <span className="text-[10px] text-[#77716b]">
                          SDK
                        </span>
                      </div>

                      <span className="text-[8px] text-[#72b77b]">
                        READY
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <StatusDot
                          status={
                            connected
                              ? "live"
                              : "waiting"
                          }
                        />

                        <span className="text-[10px] text-[#77716b]">
                          FIRST REQUEST
                        </span>
                      </div>

                      <span
                        className={`text-[8px] ${
                          connected
                            ? "text-[#72b77b]"
                            : "text-[#a08a5f]"
                        }`}
                      >
                        {connected
                          ? "RECEIVED"
                          : "WAITING"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3 last:pb-0">
                      <div className="flex items-center gap-3">
                        <StatusDot
                          status={
                            connected
                              ? "live"
                              : "idle"
                          }
                        />

                        <span className="text-[10px] text-[#77716b]">
                          EVENT TRACKING
                        </span>
                      </div>

                      <span
                        className={`text-[8px] ${
                          connected
                            ? "text-[#72b77b]"
                            : "text-[#625c56]"
                        }`}
                      >
                        {connected
                          ? "READY"
                          : "PENDING"}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-5 rounded-xl border border-[#ff7048]/15 bg-[#ff7048]/[0.025] px-3.5 py-3">
                      <p className="text-[10px] leading-5 text-[#ff7048]">
                        {error}
                      </p>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {connected ? (
                      <motion.div
                        key="connected"
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="mt-6 rounded-xl border border-[#72b77b]/15 bg-[#72b77b]/[0.025] p-5"
                      >
                        <div className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 text-[#72b77b]" />

                          <div>
                            <div className="text-[10px] font-medium text-[#ddd8d2]">
                              SDK connection verified
                            </div>

                            <p className="mt-1.5 text-[9px] leading-5 text-[#625c56]">
                              REDEN received a request from
                              the storefront. Event tracking
                              should now be tested through the
                              storefront&apos;s actual commerce flow.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="waiting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 border-t border-white/[0.055] pt-5"
                      >
                        <p className="text-[9px] leading-5 text-[#57514c]">
                          Waiting for the storefront to send
                          its first REDEN request.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void checkConnection()
                          }
                          disabled={checking}
                          className="mt-4 inline-flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] px-3.5 text-[8px] tracking-[0.1em] text-[#817a74] disabled:opacity-40"
                        >
                          {checking ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              CHECKING
                            </>
                          ) : (
                            <>
                              CHECK CONNECTION
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Glass>

              {/* 05 HANDOFF */}

              <Glass>
                <div className="border-b border-white/[0.055] px-5 py-4 md:px-6">
                  <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                    05 / HANDOFF
                  </div>

                  <h2 className="mt-1.5 text-[14px] font-medium text-[#ded8d2]">
                    Storefront access
                  </h2>
                </div>

                <div className="p-5 md:p-6">
                  {!inviteUrl ? (
                    <>
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-[#7c756e]">
                          <UserPlus className="h-4 w-4" />
                        </div>

                        <div>
                          <div className="text-[10px] text-[#c7c1bb]">
                            Generate an access invitation.
                          </div>

                          <p className="mt-1.5 max-w-lg text-[9px] leading-5 text-[#625c56]">
                            When the integration is ready,
                            generate a secure invitation for
                            whoever should receive access to
                            this storefront.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void createInvite()
                        }
                        disabled={creatingInvite}
                        className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-[#ff5a1f] px-4 text-[9px] font-semibold tracking-[0.06em] text-[#140b07] disabled:opacity-50"
                      >
                        {creatingInvite ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            CREATING
                          </>
                        ) : (
                          <>
                            CREATE INVITATION
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                    >
                      <div className="flex items-center gap-2 text-[9px] tracking-[0.1em] text-[#72b77b]">
                        <Check className="h-3 w-3" />
                        INVITATION READY
                      </div>

                      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/25 px-4 py-3">
                        <code className="min-w-0 flex-1 truncate text-[9px] text-[#9c958e]">
                          {inviteUrl}
                        </code>

                        <CopyButton
                          value={inviteUrl}
                          copied={copied === "invite"}
                          onCopy={() =>
                            void copy(
                              inviteUrl,
                              "invite"
                            )
                          }
                        />
                      </div>

                      <p className="mt-3 text-[9px] leading-5 text-[#57514c]">
                        Send this invitation through your
                        normal client handoff process.
                      </p>
                    </motion.div>
                  )}
                </div>
              </Glass>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * FALLBACK
   */

  return (
    <main className="min-h-screen bg-[#070706] text-[#d8d2cc]">
      <div className="mx-auto max-w-5xl px-5 py-5">
        <header className="flex h-14 items-center border-b border-white/[0.065]">
          <Link href="/reden-addstore">
            <img
              src="/reden-logo.png"
              alt="REDEN"
              className="h-7 w-auto object-contain"
            />
          </Link>
        </header>

        <div className="mx-auto max-w-4xl py-20">
          <Glass className="p-7">
            {loadingStores ? (
              <div className="flex items-center gap-3 text-[10px] text-[#625d58]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading REDEN
              </div>
            ) : (
              <div>
                <div className="text-[8px] tracking-[0.16em] text-[#48433f]">
                  REDEN DEVELOPER
                </div>

                <h1 className="mt-2 text-[20px] font-medium text-[#ddd8d3]">
                  Select a storefront.
                </h1>

                <div className="mt-6 space-y-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => openStore(store)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.018] px-4 py-4 text-left hover:border-white/[0.13]"
                    >
                      <div>
                        <div className="text-[10px] text-[#c7c1bb]">
                          {store.name}
                        </div>

                        <div className="mt-1 text-[8px] text-[#625c56]">
                          {store.domain || store.siteId}
                        </div>
                      </div>

                      <ArrowRight className="h-3.5 w-3.5 text-[#625c56]" />
                    </button>
                  ))}
                </div>

                <Link
                  href="/reden-addstore"
                  className="mt-6 inline-flex items-center gap-2 text-[8px] tracking-[0.1em] text-[#817a74]"
                >
                  RETURN TO STOREFRONTS
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </Glass>
        </div>
      </div>
    </main>
  );
}