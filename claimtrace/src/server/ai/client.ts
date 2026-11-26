import "server-only";
import type { z } from "zod";
import { stableHash } from "@/core/hash";
import { aiCache } from "../cache";
import { aiConfigured, config } from "../env";
import { TokenBucket } from "../rate-limit";

export type AiFailure = "not_configured" | "rate_limited" | "upstream" | "invalid_output";

export class AiUnavailable extends Error {
  constructor(
    readonly reason: AiFailure,
    message: string,
  ) {
    super(message);
    this.name = "AiUnavailable";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Shared per-minute budget for the provider's quota (about 40 requests a minute on NVIDIA's free tier). */
const budget = new TokenBucket(config.ai.requestsPerMinute, config.ai.requestsPerMinute);

/** Pull the first JSON object out of a model reply (tolerates thinking blocks, code fences and chatter). */
export function extractJson(text: string): unknown {
  const visible = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*<\/think>/i, "");
  const fenced = visible.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : visible;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in the reply");
  return JSON.parse(body.slice(start, end + 1));
}

async function complete(messages: ChatMessage[], maxTokens: number): Promise<string> {
  if (!aiConfigured()) throw new AiUnavailable("not_configured", "No AI key is configured on the server.");
  if (!budget.take()) throw new AiUnavailable("rate_limited", "The AI request budget for this minute is used up.");

  let res: Response;
  try {
    res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.ai.apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model: config.ai.model,
        messages,
        temperature: config.ai.temperature,
        top_p: 1,
        max_tokens: Math.round(maxTokens * config.ai.maxTokensScale),
        stream: false,
        ...config.ai.extraBody,
      }),
      signal: AbortSignal.timeout(config.ai.timeoutMs),
      cache: "no-store",
    });
  } catch (e) {
    throw new AiUnavailable("upstream", `The AI provider could not be reached (${e instanceof Error ? e.message : String(e)}).`);
  }
  if (res.status === 429) throw new AiUnavailable("rate_limited", "The AI provider is rate-limiting requests.");
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new AiUnavailable("upstream", `The AI provider responded ${res.status}${detail ? `: ${detail}` : ""}.`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new AiUnavailable("invalid_output", "The AI returned an empty reply.");
  return content;
}

/**
 * Ask for a JSON object and validate it against a schema. One repair attempt
 * on malformed output; results are cached so repeated checks cost nothing.
 */
export async function chatJson<T>(
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  opts: { maxTokens?: number } = {},
): Promise<{ data: T; model: string; cached: boolean }> {
  const key = stableHash(`${config.ai.model}|${JSON.stringify(messages)}`);
  const hit = aiCache.get(key) as T | undefined;
  if (hit !== undefined) return { data: hit, model: config.ai.model, cached: true };

  let problem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const msgs: ChatMessage[] =
      attempt === 0
        ? messages
        : [...messages, { role: "user", content: `That reply was not valid for the required JSON format (${problem}). Reply again with only the JSON object.` }];
    const text = await complete(msgs, opts.maxTokens ?? 700);
    try {
      const parsed = schema.safeParse(extractJson(text));
      if (parsed.success) {
        aiCache.set(key, parsed.data);
        return { data: parsed.data, model: config.ai.model, cached: false };
      }
      problem = parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
        .join("; ");
    } catch (e) {
      problem = e instanceof Error ? e.message : "unparseable reply";
    }
  }
  throw new AiUnavailable("invalid_output", `The AI reply was not in the required format (${problem}).`);
}

export function aiInfo() {
  return { configured: aiConfigured(), model: config.ai.model, provider: config.ai.provider };
}
