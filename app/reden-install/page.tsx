"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";

type Installation = {
  siteId: string;
  apiKey: string;
  name: string;
};

type VerifyResponse = {
  ok?: boolean;
  connected?: boolean;
  verified?: boolean;
  status?: string;
  error?: string;
};

const EASE = [
  0.19,
  1,
  0.22,
  1,
] as const;

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
      {children}
    </div>
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
      className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.08em] text-[#68615b] transition-colors hover:text-[#ddd7d1]"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#72b77b]" />
          <span className="text-[#72b77b]">
            COPIED
          </span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          COPY
        </>
      )}
    </button>
  );
}

function StatusDot({
  connected,
}: {
  connected: boolean;
}) {
  if (connected) {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#72b77b] opacity-35" />
        <span className="relative h-2 w-2 rounded-full bg-[#72b77b]" />
      </span>
    );
  }

  return (
    <motion.span
      className="h-2 w-2 rounded-full bg-[#a08a5f]"
      animate={{
        opacity: [1, 0.35, 1],
      }}
      transition={{
        duration: 1.7,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-[#ff7048]/20 bg-[#ff7048]/[0.035] px-4 py-3.5">
      <p className="text-[11px] font-medium leading-5 text-[#ff8060]">
        {message}
      </p>
    </div>
  );
}

function SdkSnippet({
  siteId,
  apiKey,
}: {
  siteId: string;
  apiKey: string;
}) {
  return (
    <pre className="overflow-x-auto p-6 text-[12px] font-medium leading-7">
      <code>
        <span className="text-[#759bc7]">
          &lt;script
        </span>
        {"\n  "}
        <span className="text-[#c49368]">
          src
        </span>
        <span className="text-[#68625c]">
          =
        </span>
        <span className="text-[#8eaa7c]">
          &quot;https://reden.dcore.name.ng/sdk.js&quot;
        </span>
        {"\n  "}
        <span className="text-[#c49368]">
          data-site-id
        </span>
        <span className="text-[#68625c]">
          =
        </span>
        <span className="text-[#8eaa7c]">
          &quot;{siteId}&quot;
        </span>
        {"\n  "}
        <span className="text-[#c49368]">
          data-api-key
        </span>
        <span className="text-[#68625c]">
          =
        </span>
        <span className="text-[#8eaa7c]">
          &quot;{apiKey}&quot;
        </span>
        {"\n"}
        <span className="text-[#759bc7]">
          &gt;&lt;/script&gt;
        </span>
      </code>
    </pre>
  );
}

export default function RedenInstallPage() {
  const [
    installation,
    setInstallation,
  ] =
    useState<Installation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [connected, setConnected] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState("");

  const [showKey, setShowKey] =
    useState(false);

  useEffect(() => {
    try {
      const raw =
        window.sessionStorage.getItem(
          "reden_installation"
        );

      if (!raw) {
        setError(
          "No storefront installation was found. Start by adding a storefront."
        );
        return;
      }

      const parsed: unknown =
        JSON.parse(raw);

      if (
        typeof parsed !== "object" ||
        parsed === null
      ) {
        throw new Error(
          "The installation data is invalid."
        );
      }

      const data =
        parsed as Record<
          string,
          unknown
        >;

      const siteId =
        typeof data.siteId ===
        "string"
          ? data.siteId.trim()
          : "";

      const apiKey =
        typeof data.apiKey ===
        "string"
          ? data.apiKey.trim()
          : "";

      const name =
        typeof data.name ===
        "string"
          ? data.name.trim()
          : "";

      if (!siteId || !apiKey) {
        throw new Error(
          "The installation credentials are incomplete. Please start the storefront setup again."
        );
      }

      setInstallation({
        siteId,
        apiKey,
        name:
          name || "Your storefront",
      });
    } catch (err) {
      console.error(
        "[REDEN INSTALL]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the installation."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const sdkCode = useMemo(() => {
    if (!installation) {
      return "";
    }

    return `<script
  src="https://reden.dcore.name.ng/sdk.js"
  data-site-id="${installation.siteId}"
  data-api-key="${installation.apiKey}"
></script>`;
  }, [installation]);

  const maskedKey = useMemo(() => {
    if (!installation?.apiKey) {
      return "";
    }

    if (
      installation.apiKey.length <= 8
    ) {
      return "•".repeat(
        installation.apiKey.length
      );
    }

    return `${installation.apiKey.slice(
      0,
      7
    )}${"•".repeat(24)}`;
  }, [installation]);

  async function copyValue(
    value: string,
    type: string
  ) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(type);

      window.setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch (err) {
      console.error(
        "[REDEN COPY]",
        err
      );

      setError(
        "Unable to copy. Select and copy the value manually."
      );
    }
  }

  async function checkConnection() {
    if (
      !installation?.siteId ||
      checking
    ) {
      return;
    }

    setChecking(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/reden/verify",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              siteId:
                installation.siteId,
            }),
            cache: "no-store",
          }
        );

      const data: VerifyResponse =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to verify the installation."
        );
      }

      const isConnected =
        data.connected === true ||
        data.verified === true ||
        data.status ===
          "connected" ||
        data.status === "active";

      setConnected(isConnected);

      if (isConnected) {
        setError("");
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error(
        "[REDEN VERIFY]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the installation."
      );
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (
      !installation ||
      connected
    ) {
      return;
    }

    const interval =
      window.setInterval(() => {
        void checkConnection();
      }, 10000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    installation,
    connected,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070706] text-[#d8d2cc]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.1em] text-[#68615b]">
            <Loader2 className="h-4 w-4 animate-spin" />
            LOADING REDEN
          </div>
        </div>
      </main>
    );
  }

  if (!installation) {
    return (
      <main className="min-h-screen bg-[#070706] text-[#d8d2cc]">
        <div className="mx-auto flex min-h-screen max-w-xl items-center px-6">
          <GlassPanel className="w-full p-8 md:p-9">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-[#514c47]">
              REDEN / INSTALL
            </div>

            <h1 className="mt-5 text-[30px] font-semibold tracking-[-0.04em] text-[#eee9e4]">
              Installation unavailable
            </h1>

            <p className="mt-4 text-[13px] font-medium leading-6 text-[#706963]">
              {error ||
                "No storefront installation was found."}
            </p>

            <Link
              href="/reden-addstore"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-[#ff5a1f] px-5 text-[11px] font-bold tracking-[0.04em] text-[#160b07] transition-colors hover:bg-[#ff6d38]"
            >
              BACK TO STOREFRONT
              <ArrowRight className="h-4 w-4" />
            </Link>
          </GlassPanel>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070706] text-[#d8d2cc]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,90,31,0.07),transparent_38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(255,255,255,0.025),transparent_32%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-5 sm:px-7 md:px-10">
        <header className="flex h-14 items-center justify-between border-b border-white/[0.07]">
          <Link
            href="/reden-addstore"
            className="group flex items-center gap-3 text-[12px] font-semibold tracking-[0.14em] text-[#eee9e4]"
          >
            <span className="h-2 w-2 rounded-full bg-[#ff5a1f] shadow-[0_0_14px_rgba(255,90,31,0.25)]" />
            REDEN
          </Link>

          <span className="text-[10px] font-semibold tracking-[0.1em] text-[#4e4945]">
            INSTALL
          </span>
        </header>

        <div className="mx-auto max-w-3xl">
          <section className="pb-12 pt-20 md:pt-24">
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
                ease: EASE,
              }}
            >
              <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-[#706963]">
                <span className="h-px w-7 bg-[#ff5a1f]" />
                STOREFRONT INSTALLATION
              </div>

              <h1 className="mt-6 text-[42px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#f0ebe6] sm:text-[54px]">
                Install REDEN.
              </h1>

              <p className="mt-6 max-w-2xl text-[15px] font-medium leading-7 text-[#77706a]">
                Add the REDEN SDK to your storefront.
                Once your storefront sends its first
                request, the connection will become active.
              </p>
            </motion.div>
          </section>

          <section className="space-y-4 pb-24">
            <GlassPanel>
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
                <div>
                  <div className="text-[9px] font-semibold tracking-[0.14em] text-[#514c47]">
                    STOREFRONT
                  </div>

                  <div className="mt-2 text-[16px] font-semibold text-[#e2dcd6]">
                    {installation.name}
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] ${
                    connected
                      ? "text-[#72b77b]"
                      : "text-[#a08a5f]"
                  }`}
                >
                  <StatusDot
                    connected={connected}
                  />

                  {connected
                    ? "CONNECTED"
                    : "WAITING"}
                </div>
              </div>

              <div className="grid md:grid-cols-2">
                <div className="border-b border-white/[0.06] p-6 md:border-b-0 md:border-r">
                  <div className="text-[9px] font-semibold tracking-[0.14em] text-[#514c47]">
                    STOREFRONT ID
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="truncate text-[12px] font-medium text-[#aaa39d]">
                      {installation.siteId}
                    </div>

                    <CopyButton
                      value={
                        installation.siteId
                      }
                      copied={
                        copied === "site"
                      }
                      onCopy={() =>
                        void copyValue(
                          installation.siteId,
                          "site"
                        )
                      }
                    />
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-[9px] font-semibold tracking-[0.14em] text-[#514c47]">
                    STATUS
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <StatusDot
                      connected={connected}
                    />

                    <span
                      className={`text-[12px] font-medium ${
                        connected
                          ? "text-[#72b77b]"
                          : "text-[#a08a5f]"
                      }`}
                    >
                      {connected
                        ? "Connection received"
                        : "Waiting for first request"}
                    </span>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="border-b border-white/[0.06] px-6 py-5">
                <div className="text-[9px] font-semibold tracking-[0.14em] text-[#514c47]">
                  01 / SDK CREDENTIAL
                </div>

                <h2 className="mt-2 text-[16px] font-semibold text-[#e2dcd6]">
                  API key
                </h2>
              </div>

              <div className="p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold tracking-[0.14em] text-[#514c47]">
                      KEY
                    </div>

                    <div className="mt-3 break-all text-[12px] font-medium leading-6 text-[#aaa39d]">
                      {showKey
                        ? installation.apiKey
                        : maskedKey}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    <button
                      type="button"
                      onClick={() =>
                        setShowKey(
                          (value) =>
                            !value
                        )
                      }
                      className="text-[10px] font-semibold tracking-[0.08em] text-[#68615b] transition-colors hover:text-[#d0cac4]"
                    >
                      {showKey
                        ? "HIDE"
                        : "REVEAL"}
                    </button>

                    <CopyButton
                      value={
                        installation.apiKey
                      }
                      copied={
                        copied === "key"
                      }
                      onCopy={() =>
                        void copyValue(
                          installation.apiKey,
                          "key"
                        )
                      }
                    />
                  </div>
                </div>

                <p className="mt-6 border-l border-[#ff5a1f]/30 pl-4 text-[11px] font-medium leading-6 text-[#625c56]">
                  This credential identifies this
                  storefront to the REDEN browser SDK.
                </p>
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="border-b border-white/[0.06] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-semibold tracking-[0.14em] text-[#514c47]">
                      02 / INSTALLATION
                    </div>

                    <h2 className="mt-2 text-[16px] font-semibold text-[#e2dcd6]">
                      Add the REDEN SDK
                    </h2>
                  </div>

                  <span className="text-[9px] font-semibold tracking-[0.1em] text-[#4e4945]">
                    JAVASCRIPT
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className="max-w-2xl text-[12px] font-medium leading-6 text-[#706963]">
                  Paste this snippet immediately before
                  the closing{" "}
                  <code className="mx-1 text-[#aaa39d]">
                    &lt;/body&gt;
                  </code>{" "}
                  tag on your storefront.
                </p>

                <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08] bg-black/35">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                    <span className="text-[9px] font-semibold tracking-[0.14em] text-[#4e4945]">
                      SDK SNIPPET
                    </span>

                    <CopyButton
                      value={sdkCode}
                      copied={
                        copied === "sdk"
                      }
                      onCopy={() =>
                        void copyValue(
                          sdkCode,
                          "sdk"
                        )
                      }
                    />
                  </div>

                  <SdkSnippet
                    siteId={
                      installation.siteId
                    }
                    apiKey={
                      installation.apiKey
                    }
                  />
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] font-medium leading-5 text-[#625c56]">
                    After installing, open your
                    storefront once so REDEN can receive
                    its first request.
                  </p>

                  <Link
                    href="/docs"
                    className="inline-flex shrink-0 items-center gap-2 text-[10px] font-semibold tracking-[0.08em] text-[#77706a] transition-colors hover:text-[#d0cac4]"
                  >
                    INSTALLATION DOCS
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="border-b border-white/[0.06] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-semibold tracking-[0.14em] text-[#514c47]">
                      03 / CONNECTION
                    </div>

                    <h2 className="mt-2 text-[16px] font-semibold text-[#e2dcd6]">
                      Verify the connection
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void checkConnection()
                    }
                    disabled={checking}
                    className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.08em] text-[#68615b] transition-colors hover:text-[#d0cac4] disabled:opacity-40"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        checking
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    CHECK
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] px-5 py-5">
                  <div className="flex items-center gap-3">
                    <StatusDot
                      connected={connected}
                    />

                    <div>
                      <div className="text-[11px] font-semibold text-[#88817a]">
                        FIRST REQUEST
                      </div>

                      <div className="mt-1 text-[10px] font-medium text-[#514c47]">
                        {connected
                          ? "REDEN has received your storefront request."
                          : "Waiting for your storefront to connect."}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold tracking-[0.08em] ${
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

                {error && (
                  <ErrorBox
                    message={error}
                  />
                )}

                {connected ? (
                  <div className="mt-5 rounded-xl border border-[#72b77b]/15 bg-[#72b77b]/[0.025] p-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <StatusDot connected />
                      </div>

                      <div>
                        <div className="text-[12px] font-semibold text-[#ddd8d2]">
                          REDEN is connected.
                        </div>

                        <p className="mt-2 text-[11px] font-medium leading-5 text-[#625c56]">
                          Your storefront has successfully
                          sent its first request.
                        </p>

                        <Link
                          href="/reden-dashboard"
                          className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.08em] text-[#ff7040] transition-colors hover:text-[#ff906d]"
                        >
                          OPEN DASHBOARD
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-[11px] font-medium leading-5 text-[#625c56]">
                      Install the snippet, open your
                      storefront, then check the connection.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void checkConnection()
                      }
                      disabled={checking}
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/[0.09] px-4 text-[10px] font-bold tracking-[0.08em] text-[#817a74] transition-colors hover:border-[#ff5a1f]/35 hover:text-[#ddd7d1] disabled:opacity-40"
                    >
                      {checking ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          CHECKING
                        </>
                      ) : (
                        <>
                          CHECK CONNECTION
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </section>
        </div>

        <footer className="border-t border-white/[0.06] py-7">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold tracking-[0.12em] text-[#3f3b38]">
              REDEN / REVENUE INFRASTRUCTURE
            </span>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[9px] font-semibold tracking-[0.08em] text-[#3f3b38] transition-colors hover:text-[#89827b]"
            >
              DASHBOARD
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}