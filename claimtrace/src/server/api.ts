import "server-only";
import { z } from "zod";
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

/** Read and validate a JSON body with a size limit. */
export async function readBody<T>(req: Request, schema: z.ZodType<T>, maxBytes = 64_000): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "too_large", "The request is too large.");
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

function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

const limiters = {
  ai: new WindowLimiter(40),
  lookup: new WindowLimiter(120),
};

/**
 * Wraps a route handler: per-client rate limit, typed errors, and no internal
 * details leaked to the browser.
 */
export function route(kind: keyof typeof limiters, handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (!limiters[kind].allow(clientKey(req))) {
      return fail(429, "rate_limited", "Too many requests from this browser. Wait a minute and try again.");
    }
    try {
      return await handler(req);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.code, e.message);
      if (e instanceof UpstreamError) return fail(502, "upstream_unavailable", e.message);
      console.error("[claimtrace] unhandled route error", e);
      return fail(500, "internal_error", "Something went wrong on the server. Please try again.");
    }
  };
}
