/** Typed browser client for the ClaimTrace API. */
import type {
  ClaimCheckRequestBody,
  SearchRequestBody,
  SummaryRequestBody,
} from "@/core/api-schemas";
import type {
  ClaimCheck,
  GroundedSummary,
  ReferenceInput,
  ScholarlyRecord,
  SearchPlan,
  SourceVerification,
} from "@/core/types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function call<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "network", "You appear to be offline. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: { code: string; message: string } }) | null;
  if (!res.ok || !data) {
    throw new ApiError(res.status, data?.error?.code ?? "error", data?.error?.message ?? `Request failed (${res.status}).`);
  }
  return data;
}

export interface VerifyResponse {
  verification: SourceVerification;
  record?: ScholarlyRecord;
  alternatives: ScholarlyRecord[];
}

export interface BatchItem extends Partial<VerifyResponse> {
  raw: string;
  parsed: ReferenceInput;
  error?: string;
}

export interface HealthResponse {
  ok: boolean;
  ai: { configured: boolean; model: string; provider: string };
  sources?: {
    openalexKey: boolean;
    contactEmail: boolean;
    /** Databases refusing requests right now (for example a used-up daily budget). */
    blocked: Array<{ service: string; until: string; reason: string; message: string }>;
  };
  version: string;
}

export const api = {
  health: () => call<HealthResponse>("health"),
  plan: (question: string) => call<{ plan: SearchPlan }>("scout/plan", { question }),
  search: (body: SearchRequestBody, signal?: AbortSignal) => call<{ results: ScholarlyRecord[] }>("sources/search", body, signal),
  verify: (reference: ReferenceInput) => call<VerifyResponse>("sources/verify", { reference }),
  verifyBatch: (references: string[]) => call<{ results: BatchItem[] }>("sources/verify-batch", { references }),
  checkClaim: (body: ClaimCheckRequestBody) => call<{ check: ClaimCheck }>("claims/check", body),
  summary: (body: SummaryRequestBody) => call<{ summary: GroundedSummary }>("assistant/summary", body),
};
