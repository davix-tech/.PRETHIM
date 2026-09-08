export const REDEN_API_URL = (
  process.env.REDEN_API_URL ||
  "https://reden.dcore.name.ng"
).replace(/\/+$/, "");

const UPSTREAM_TIMEOUT_MS = 15_000;

const MAX_SITE_ID_LENGTH = 200;
const MAX_ADMIN_SECRET_LENGTH = 2_000;

let cachedAdminSecret: string | null = null;

/* =========================================================
   REDEN ADMIN SECRET
========================================================= */

export function getRedenAdminSecret(): string {
  if (cachedAdminSecret !== null) {
    return cachedAdminSecret;
  }

  const secret = (
    process.env.REDEN_ADMIN_SECRET ||
    process.env.ADMIN_SECRET ||
    ""
  ).trim();

  if (secret.length > MAX_ADMIN_SECRET_LENGTH) {
    console.error(
      "[REDEN HTTP] Admin secret exceeds maximum length."
    );

    cachedAdminSecret = "";
    return "";
  }

  cachedAdminSecret = secret;

  return cachedAdminSecret;
}

/* =========================================================
   ERROR NORMALIZATION
========================================================= */

export function errorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error.trim();
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "unknown_error";
  }
}

/* =========================================================
   UPSTREAM FETCH WITH HARD TIMEOUT
========================================================= */

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller =
    new AbortController();

  const timeout = Math.max(
    1_000,
    Math.min(
      timeoutMs,
      60_000
    )
  );

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    /*
     * Caller-provided signals cannot safely be merged by simply
     * overwriting them. If a caller already supplies a signal,
     * aborting this controller would otherwise not cancel it.
     *
     * For the current PRETHIM → REDEN server routes, this helper
     * owns the timeout signal.
     */
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* =========================================================
   SAFE JSON RESPONSE PARSER
========================================================= */

export async function parseJsonResponse<T>(
  response: Response
): Promise<T> {
  const raw = await response.text();

  if (!raw.trim()) {
    return {} as T;
  }

  try {
    const parsed: unknown =
      JSON.parse(raw);

    /*
     * JSON.parse can return primitives, arrays, etc.
     * We leave the generic shape decision to the caller, but
     * reject completely unusable null responses.
     */
    if (parsed === null) {
      throw new Error(
        "invalid_json_response"
      );
    }

    return parsed as T;
  } catch {
    throw new Error(
      "invalid_json_response"
    );
  }
}

/* =========================================================
   UPSTREAM HTTP STATUS NORMALIZATION
========================================================= */

export function upstreamStatus(
  status: number
): number {
  /*
   * Preserve meaningful 4xx responses from REDEN.
   *
   * Never expose arbitrary upstream 5xx statuses through
   * PRETHIM. Those become a controlled 502.
   */
  if (
    Number.isInteger(status) &&
    status >= 400 &&
    status < 500
  ) {
    return status;
  }

  return 502;
}

/* =========================================================
   SITE ID VALIDATION
========================================================= */

export function isValidSiteId(
  siteId: string
): boolean {
  const value =
    typeof siteId === "string"
      ? siteId.trim()
      : "";

  if (!value) {
    return false;
  }

  if (
    value.length > MAX_SITE_ID_LENGTH
  ) {
    return false;
  }

  /*
   * REDEN site IDs are expected to use the format:
   *
   * site_<identifier>
   *
   * Restricting the prefix prevents arbitrary identifiers from
   * being passed into tenant-specific REDEN endpoints.
   */
  return /^site_[a-zA-Z0-9._-]+$/.test(
    value
  );
}