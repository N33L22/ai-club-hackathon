import "server-only";
import { z } from "zod";
import { contentWords } from "@/core/text/tokens";
import type { SearchPlan } from "@/core/types";
import { AiUnavailable, chatJson } from "./client";
import { SCOUT_SYSTEM } from "./prompts";

const ScoutReply = z.object({
  queries: z.array(z.string().min(2)).min(1).max(6),
  keywords: z.array(z.string()).default([]),
  fromYear: z.preprocess((v) => (v === null || v === "" ? undefined : Number(v)), z.number().int().min(1800).max(2100).optional()),
  toYear: z.preprocess((v) => (v === null || v === "" ? undefined : Number(v)), z.number().int().min(1800).max(2100).optional()),
  includeReviews: z.boolean().default(true),
  rationale: z.string().default(""),
});

const GENERIC = new Set(["effect", "effects", "impact", "impacts", "affect", "affects", "influence", "role", "relationship", "relation", "does", "how", "what", "why", "whether", "extent", "factors", "among"]);

/** Code fallback: the question's key words become a single query. */
export function codePlan(question: string): SearchPlan {
  const kw = [...new Set(contentWords(question).filter((w) => !GENERIC.has(w)))].slice(0, 7);
  return {
    queries: [kw.join(" ") || question.slice(0, 120)],
    keywords: kw,
    includeReviews: true,
    onlyWithAbstract: true,
    rationale: "Built by code from the key words in your question, because the AI planner is not available.",
    mode: "code",
  };
}

/** The Scout: turns a question into a search plan. It can search, nothing else. */
export async function planSearch(question: string): Promise<SearchPlan> {
  try {
    const { data, model } = await chatJson(
      [
        { role: "system", content: SCOUT_SYSTEM },
        { role: "user", content: `RESEARCH QUESTION: ${question}` },
      ],
      ScoutReply,
      { maxTokens: 400 },
    );
    const queries = [...new Set(data.queries.map((q) => q.replace(/["()]/g, " ").replace(/\b(AND|OR|NOT)\b/g, " ").replace(/\s+/g, " ").trim()))]
      .filter((q) => q.length > 2)
      .slice(0, 4);
    if (!queries.length) return codePlan(question);
    const thisYear = new Date().getUTCFullYear();
    return {
      queries,
      keywords: data.keywords.slice(0, 10),
      fromYear: data.fromYear && data.fromYear <= thisYear ? data.fromYear : undefined,
      toYear: data.toYear && data.toYear <= thisYear + 1 ? data.toYear : undefined,
      includeReviews: data.includeReviews,
      onlyWithAbstract: true,
      rationale: data.rationale || undefined,
      mode: "ai",
      model,
    };
  } catch (e) {
    if (e instanceof AiUnavailable) return codePlan(question);
    throw e;
  }
}
