import "server-only";
import { z } from "zod";

/**
 * Server configuration, validated once. Secrets never leave the server:
 * nothing here is prefixed NEXT_PUBLIC_.
 */
const schema = z.object({
  NVIDIA_API_KEY: z.string().trim().min(1).optional(),
  AI_API_KEY: z.string().trim().min(1).optional(), // any OpenAI-compatible provider
  AI_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  AI_MODEL: z.string().min(1).default("meta/llama-3.3-70b-instruct"),
  AI_PROVIDER_LABEL: z.string().min(1).default("NVIDIA NIM"),
  AI_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(35),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1).default(0),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  /** Optional contact address for the Crossref/OpenAlex "polite pool". */
  CONTACT_EMAIL: z.string().email().optional(),
  OPENALEX_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse({
  ...process.env,
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || undefined,
  AI_API_KEY: process.env.AI_API_KEY || undefined,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || undefined,
  OPENALEX_API_KEY: process.env.OPENALEX_API_KEY || undefined,
});

if (!parsed.success) {
  console.error("[claimtrace] Invalid environment configuration:", z.prettifyError(parsed.error));
}

const env = parsed.success ? parsed.data : schema.parse({});

export const config = {
  ai: {
    apiKey: env.NVIDIA_API_KEY ?? env.AI_API_KEY,
    baseUrl: env.AI_BASE_URL.replace(/\/+$/, ""),
    model: env.AI_MODEL,
    provider: env.AI_PROVIDER_LABEL,
    requestsPerMinute: env.AI_REQUESTS_PER_MINUTE,
    temperature: env.AI_TEMPERATURE,
    timeoutMs: env.AI_TIMEOUT_MS,
  },
  contactEmail: env.CONTACT_EMAIL,
  openalexKey: env.OPENALEX_API_KEY,
  userAgent: `ClaimTrace/1.0 (research-integrity prototype${env.CONTACT_EMAIL ? `; mailto:${env.CONTACT_EMAIL}` : ""})`,
} as const;

export const aiConfigured = () => Boolean(config.ai.apiKey);
