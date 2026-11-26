import "server-only";
import { z } from "zod";
import { config } from "./env";
import { UpstreamError } from "./http";
import { WindowLimiter } from "./rate-limit";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function fail(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function ok<T>(data: T): Response {
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}

/** Read the body without ever holding more than `maxBytes` (a declared length is checked first). */
async function readCapped(req: Request, maxBytes: number): Promise<string> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new HttpError(413, "too_large", "The request is too large.");
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new HttpError(413, "too_large", "The request is too large.");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** Read and validate a JSON body with a size limit. */
export async function readBody<T>(req: Request, schema: z.ZodType<T>, maxBytes = 64_000): Promise<T> {
  const text = await readCapped(req, maxBytes);
  let json: unknown;
  try {
    json = JSON.parse(text || "{}");
  } catch {
    throw new HttpError(400, "bad_json", "The request body is not valid JSON.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new HttpError(422, "invalid_request", first ? `${first.path.join(".") || "request"}: ${first.message}` : "Invalid request.");
  }
  return parsed.data;
}

/**
 * Who is calling, for the per-client limits. Forwarded addresses are only
 * trusted behind a proxy that sets them (Vercel, or TRUST_PROXY=1); otherwise
 * a client could pick its own address, so every caller shares one bucket.
 */
function clientKey(req: Request): string {
  if (!config.trustProxy) return "shared";
  return req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Browsers say where a request comes from. Another website's page calling this
 * API (to spend the team's AI and OpenAlex quota) is refused. Scripts that send
 * no Origin (the eval and recorder scripts) are allowed, and still rate-limited.
 */
function crossSite(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  const origin = req.headers.get("origin");
  if (!origin) return site === "cross-site";
  const own = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    const o = new URL(origin);
    if (own && o.host === own) return false;
    return !config.allowedOrigins.includes(o.origin);
  } catch {
    return true;
  }
}

const limiters = {
  ai: [new WindowLimiter(config.ai.perClientPerMinute), new WindowLimiter(config.ai.perClientPerDay, 86_400_000)],
  lookup: [new WindowLimiter(120)],
};

/**
 * Wraps a route handler: same-site check, per-client rate limits, typed
 * errors, and no internal details leaked to the browser.
 */
export function route(kind: keyof typeof limiters, handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (crossSite(req)) return fail(403, "cross_site", "This API only answers the ClaimTrace app itself.");
    const key = clientKey(req);
    if (!limiters[kind].every((l) => l.allow(key))) {
      return fail(429, "rate_limited", "Too many requests from this browser. Wait a minute and try again.");
    }
    try {
      return await handler(req);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.code, e.message);
      if (e instanceof UpstreamError) return fail(e.reason === "quota" || e.reason === "rate_limited" ? 503 : 502, `upstream_${e.reason}`, e.message);
      console.error("[claimtrace] unhandled route error", e);
      return fail(500, "internal_error", "Something went wrong on the server. Please try again.");
    }
  };
}
