import "server-only";
import { httpCache } from "./cache";
import { config } from "./env";

/** Why an upstream call failed: the UI and the Verifier treat these differently from "no record". */
export type UpstreamReason = "quota" | "rate_limited" | "timeout" | "unavailable" | "rejected";

export class UpstreamError extends Error {
  constructor(
    readonly service: string,
    readonly status: number,
    message: string,
    readonly reason: UpstreamReason = "unavailable",
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------------- */
/* Per-service request pools                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Caps concurrency and spaces out request starts for one upstream pool.
 * Crossref publishes its limits in response headers (x-rate-limit-limit,
 * x-rate-limit-interval, x-concurrency-limit) and they differ between list
 * queries and single-record lookups, and between the public and polite pools,
 * so the pool adapts to what the server says. Per server instance: on
 * serverless hosting each instance keeps its own pools.
 */
export class RequestPool {
  private active = 0;
  private waiters: Array<() => void> = [];
  private nextAt = 0;

  constructor(
    public max: number,
    public intervalMs: number,
  ) {}

  async acquire(): Promise<() => void> {
    while (this.active >= this.max) await new Promise<void>((r) => this.waiters.push(r));
    this.active++;
    const now = Date.now();
    const start = Math.max(now, this.nextAt);
    this.nextAt = start + this.intervalMs;
    if (start > now) await sleep(start - now);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      this.waiters.shift()?.();
    };
  }

  /** Follow the limits the server advertises (only ever within sane bounds). */
  adapt(headers: Headers): void {
    const limit = Number(headers.get("x-rate-limit-limit"));
    const interval = headers.get("x-rate-limit-interval");
    const concurrency = Number(headers.get("x-concurrency-limit"));
    const seconds = interval ? Number(interval.replace(/s$/, "")) : NaN;
    if (limit >= 1 && seconds > 0 && seconds <= 60) this.intervalMs = Math.ceil((seconds * 1000) / limit);
    if (concurrency >= 1 && concurrency <= 20) this.max = concurrency;
  }
}

/** Starting limits (Crossref's public pool; OpenAlex allows about 10 requests a second without a key). */
const pools: Record<string, RequestPool> = {
  "crossref-list": new RequestPool(1, 1000),
  "crossref-single": new RequestPool(1, 200),
  openalex: new RequestPool(4, 110),
};

/* ------------------------------------------------------------------------- */
/* Circuit breaker for long outages (e.g. an exhausted daily budget)          */
/* ------------------------------------------------------------------------- */

const breakers = new Map<string, { until: number; message: string; reason: UpstreamReason }>();

/** Services that are refusing requests right now (shown on the Settings page). */
export function blockedServices(): Array<{ service: string; until: string; reason: UpstreamReason; message: string }> {
  const now = Date.now();
  return [...breakers.entries()]
    .filter(([, b]) => b.until > now)
    .map(([service, b]) => ({ service, until: new Date(b.until).toISOString(), reason: b.reason, message: b.message }));
}

function quotaMessage(service: string, body: string): string {
  if (service === "OpenAlex") {
    return config.openalexKey
      ? "OpenAlex's daily budget for this API key is used up (it resets at midnight UTC)."
      : "OpenAlex's free daily budget for keyless requests from this network is used up (it resets at midnight UTC). Add a free OPENALEX_API_KEY on the server to keep searching.";
  }
  return `${service} is refusing requests for now${/daily|quota|budget/i.test(body) ? " (daily limit reached)" : ""}. Try again later.`;
}

/** Test hook: forget open breakers. */
export function resetUpstreamState(): void {
  breakers.clear();
}

/* ------------------------------------------------------------------------- */

/**
 * GET JSON from a public API with a timeout, per-service throttling, retries
 * on 429/5xx and an in-memory cache. A 404 is a normal answer (status 404, no
 * data), not an error. A long Retry-After (a used-up daily budget) opens a
 * breaker, so later calls fail at once with a clear reason instead of each
 * waiting through retries.
 */
export async function getJson<T>(
  url: string,
  opts: { service: string; pool?: string; timeoutMs?: number; retries?: number; cacheTtlMs?: number; headers?: Record<string, string> },
): Promise<{ status: number; data?: T }> {
  const cached = httpCache.get(url);
  if (cached) return cached as { status: number; data?: T };

  const breaker = breakers.get(opts.service);
  if (breaker && breaker.until > Date.now()) throw new UpstreamError(opts.service, 429, breaker.message, breaker.reason);

  const pool = opts.pool ? pools[opts.pool] : undefined;
  const retries = opts.retries ?? 2;
  let lastError = "request failed";
  let reason: UpstreamReason = "unavailable";
  for (let attempt = 0; attempt <= retries; attempt++) {
    const release = pool ? await pool.acquire() : () => undefined;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": config.userAgent, ...opts.headers },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
        cache: "no-store",
      });
    } catch (e) {
      release();
      const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      reason = timedOut ? "timeout" : "unavailable";
      lastError = timedOut ? "timed out" : e instanceof Error ? e.message : String(e);
      if (attempt < retries) await sleep(400 * 2 ** attempt);
      continue;
    }
    release();
    pool?.adapt(res.headers);

    if (res.status === 404) {
      const out = { status: 404 };
      httpCache.set(url, out, opts.cacheTtlMs);
      return out;
    }
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const body = await res.text().catch(() => "");
      const hasRetryAfter = Number.isFinite(retryAfter) && retryAfter > 0;
      // A short Retry-After is ordinary per-second throttling: wait and retry, whatever the body
      // says (keyless OpenAlex replies always mention the daily budget). A long one, or an
      // explicit "budget used up" without a Retry-After, means the quota is gone for now.
      const quotaGone = hasRetryAfter ? retryAfter > 30 : /insufficient budget|budget is used up|daily_budget|quota exceeded/i.test(body);
      if (quotaGone) {
        const message = quotaMessage(opts.service, body);
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 86_400) * 1000 : 15 * 60_000;
        breakers.set(opts.service, { until: Date.now() + wait, message, reason: "quota" });
        throw new UpstreamError(opts.service, 429, message, "quota");
      }
      reason = "rate_limited";
      lastError = `${opts.service} is rate-limiting requests`;
      if (attempt < retries) await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 4000) : 500 * 2 ** attempt);
      continue;
    }
    if (res.status >= 500) {
      reason = "unavailable";
      lastError = `${opts.service} responded ${res.status}`;
      await res.body?.cancel().catch(() => undefined);
      if (attempt < retries) await sleep(400 * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      const keyProblem = (res.status === 401 || res.status === 403) && opts.service === "OpenAlex";
      throw new UpstreamError(
        opts.service,
        res.status,
        keyProblem ? "OpenAlex rejected the API key. Check OPENALEX_API_KEY on the server." : `${opts.service} responded ${res.status}`,
        "rejected",
      );
    }
    const data = (await res.json()) as T;
    const out = { status: res.status, data };
    httpCache.set(url, out, opts.cacheTtlMs);
    return out;
  }
  const message =
    reason === "rate_limited"
      ? `${opts.service} is busy (rate limit). Try again in a minute.`
      : reason === "timeout"
        ? `${opts.service} did not answer in time.`
        : `${opts.service} is not responding (${lastError}).`;
  throw new UpstreamError(opts.service, reason === "rate_limited" ? 429 : 503, message, reason);
}
