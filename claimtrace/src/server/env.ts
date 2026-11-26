import "server-only";
import { z } from "zod";

/**
 * Server configuration, validated once. Secrets never leave the server:
 * nothing here is prefixed NEXT_PUBLIC_.
 */
const flag = z.preprocess((v) => (typeof v === "string" ? ["1", "true", "yes"].includes(v.trim().toLowerCase()) : v), z.boolean().optional());

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
/**
 * NVIDIA's current models think before answering unless told not to. With thinking on, the
 * default model was slower and sometimes reasoned past any token budget without answering;
 * with it off, it was the most accurate setup we measured. Applied only on NVIDIA's endpoint
 * (other providers may reject the field); AI_EXTRA_BODY overrides it, and {} sends nothing.
 */
const NVIDIA_DEFAULT_EXTRA = '{"chat_template_kwargs":{"enable_thinking":false}}';

const schema = z.object({
  NVIDIA_API_KEY: z.string().trim().min(1).optional(),
  AI_API_KEY: z.string().trim().min(1).optional(), // any OpenAI-compatible provider
  AI_BASE_URL: z.string().url().default(NVIDIA_BASE_URL),
  /**
   * Chosen on 25 Nov 2026 by comparing four NVIDIA-hosted setups on the 20 labelled claims
   * (eval/skeptic-model-comparison.md). The earlier default, meta/llama-3.3-70b-instruct,
   * reached end of life on NVIDIA on 26 Aug 2026.
   */
  AI_MODEL: z.string().min(1).default(DEFAULT_MODEL),
  AI_PROVIDER_LABEL: z.string().min(1).default("NVIDIA NIM"),
  /** Shared budget for the whole server (the provider's quota is about 40 a minute on NVIDIA's free tier). */
  AI_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(35),
  /** Per browser, so one visitor cannot drain the shared quota. */
  AI_REQUESTS_PER_CLIENT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  AI_REQUESTS_PER_CLIENT_PER_DAY: z.coerce.number().int().positive().default(400),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0),
  /** Below the claim-check route's 45 s limit, so a slow reply still gets an answer or an honest Unchecked. */
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(40000),
  /**
   * Extra fields for every chat request, as a JSON object. Many hosted models think
   * before answering; e.g. {"chat_template_kwargs":{"enable_thinking":false}} turns that off.
   */
  AI_EXTRA_BODY: z.string().optional(),
  /** Reasoning models spend tokens thinking before the answer: multiply every token budget by this. */
  AI_MAX_TOKENS_SCALE: z.coerce.number().min(1).max(20).default(1),
  /** Contact address for the Crossref "polite pool" (higher limits). Strongly recommended. */
  CONTACT_EMAIL: z.string().email().optional(),
  /** Free key from https://openalex.org/settings/api. Without one, a network shares about $0.10 of requests a day. */
  OPENALEX_API_KEY: z.string().trim().min(1).optional(),
  /** Trust x-forwarded-for / x-real-ip (true on Vercel; set it behind your own proxy). */
  TRUST_PROXY: flag,
  /** Extra browser origins allowed to call the API (comma-separated). The app's own origin is always allowed. */
  ALLOWED_ORIGINS: z.string().optional(),
});

const parsed = schema.safeParse({
  ...process.env,
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || undefined,
  AI_API_KEY: process.env.AI_API_KEY || undefined,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || undefined,
  OPENALEX_API_KEY: process.env.OPENALEX_API_KEY || undefined,
  TRUST_PROXY: process.env.TRUST_PROXY || undefined,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || undefined,
});

if (!parsed.success) {
  console.error("[claimtrace] Invalid environment configuration:", z.prettifyError(parsed.error));
}

const env = parsed.success ? parsed.data : schema.parse({});

/** AI_EXTRA_BODY must be a JSON object; anything else is ignored with a warning (never a crash). */
function extraBody(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    const v: unknown = JSON.parse(raw);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  } catch {
    // fall through
  }
  console.error("[claimtrace] AI_EXTRA_BODY is not a JSON object; ignoring it.");
  return {};
}

export const config = {
  ai: {
    apiKey: env.NVIDIA_API_KEY ?? env.AI_API_KEY,
    baseUrl: env.AI_BASE_URL.replace(/\/+$/, ""),
    model: env.AI_MODEL,
    provider: env.AI_PROVIDER_LABEL,
    requestsPerMinute: env.AI_REQUESTS_PER_MINUTE,
    perClientPerMinute: env.AI_REQUESTS_PER_CLIENT_PER_MINUTE,
    perClientPerDay: env.AI_REQUESTS_PER_CLIENT_PER_DAY,
    temperature: env.AI_TEMPERATURE,
    timeoutMs: env.AI_TIMEOUT_MS,
    extraBody: extraBody(env.AI_EXTRA_BODY ?? (env.AI_BASE_URL.replace(/\/+$/, "") === NVIDIA_BASE_URL ? NVIDIA_DEFAULT_EXTRA : undefined)),
    maxTokensScale: env.AI_MAX_TOKENS_SCALE,
  },
  contactEmail: env.CONTACT_EMAIL,
  openalexKey: env.OPENALEX_API_KEY,
  trustProxy: env.TRUST_PROXY ?? Boolean(process.env.VERCEL),
  allowedOrigins: (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  userAgent: `ClaimTrace/1.0 (research-integrity prototype${env.CONTACT_EMAIL ? `; mailto:${env.CONTACT_EMAIL}` : ""})`,
} as const;

export const aiConfigured = () => Boolean(config.ai.apiKey);
