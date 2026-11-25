import "server-only";
import { httpCache } from "./cache";
import { config } from "./env";

export class UpstreamError extends Error {
  constructor(
    readonly service: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET JSON from a public API with a timeout, retries on 429/5xx and an
 * in-memory cache. A 404 is a normal answer (status 404, no data), not an error.
 */
export async function getJson<T>(
  url: string,
  opts: { service: string; timeoutMs?: number; retries?: number; cacheTtlMs?: number },
): Promise<{ status: number; data?: T }> {
  const cached = httpCache.get(url);
  if (cached) return cached as { status: number; data?: T };

  const retries = opts.retries ?? 2;
  let lastError = "request failed";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": config.userAgent },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
        cache: "no-store",
      });
      if (res.status === 404) {
        const out = { status: 404 };
        httpCache.set(url, out, opts.cacheTtlMs);
        return out;
      }
      if (res.status === 429 || res.status >= 500) {
        lastError = `${opts.service} responded ${res.status}`;
        const retryAfter = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 4000) : 400 * 2 ** attempt);
        continue;
      }
      if (!res.ok) throw new UpstreamError(opts.service, res.status, `${opts.service} responded ${res.status}`);
      const data = (await res.json()) as T;
      const out = { status: res.status, data };
      httpCache.set(url, out, opts.cacheTtlMs);
      return out;
    } catch (e) {
      if (e instanceof UpstreamError) throw e;
      lastError = e instanceof Error ? e.message : String(e);
      if (attempt < retries) await sleep(400 * 2 ** attempt);
    }
  }
  throw new UpstreamError(opts.service, 503, `${opts.service} is not responding (${lastError}).`);
}
