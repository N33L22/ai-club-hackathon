import "server-only";
import { z } from "zod";
import { LIMITS, THRESHOLDS } from "@/core/config";
import { directQuoteIn, verifyQuote } from "@/core/evidence/quote";
import { rankSentences } from "@/core/evidence/rank";
import { detectScope } from "@/core/evidence/scope";
import { longestCommonRun, withoutQuotes } from "@/core/text/overlap";
import { splitSentences } from "@/core/text/sentences";
import type { ClaimCheck, ClaimVerdict, TextOrigin } from "@/core/types";
import { AiUnavailable, chatJson } from "./client";
import { SKEPTIC_SYSTEM, skepticUser } from "./prompts";

const verdictSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase().replace(/[\s-]+/g, "_") : v),
  z.enum(["supported", "overreach", "not_supported"]),
);

const SkepticReply = z.object({
  verdict: verdictSchema,
  sentence: z.preprocess((v) => (v === null || v === undefined || v === "" ? null : Number(v)), z.number().int().nullable()),
  quote: z.string().default(""),
  explanation: z.string().default(""),
  issues: z.array(z.string()).default([]),
});

export interface SkepticInput {
  claim: string;
  citedAs: string;
  text: string;
  textOrigin: TextOrigin;
}

/**
 * The Skeptic: code prepares and re-checks, the model judges.
 * 1. code ranks candidate sentences and applies scope rules (hints)
 * 2. the model picks a sentence and a verdict
 * 3. code confirms the quoted sentence really exists in the source
 * If the AI is unavailable, the claim stays "Unchecked", never "Verified".
 */
export async function checkClaim(input: SkepticInput): Promise<ClaimCheck> {
  const checkedAt = new Date().toISOString();
  const sentences = splitSentences(input.text.slice(0, LIMITS.sourceTextChars)).slice(0, LIMITS.maxSentences);
  const base = {
    candidates: [] as ClaimCheck["candidates"],
    scopeFlags: [] as ClaimCheck["scopeFlags"],
    quoteVerified: false,
    textOrigin: input.textOrigin,
    checkedAt,
  };

  if (!sentences.length || input.textOrigin === "none") {
    return { ...base, verdict: "unchecked", mode: "code", reason: "no_text", patchwriting: null, directQuote: null };
  }

  const candidates = rankSentences(input.claim, sentences, 5);
  const scopeFlags = detectScope(input.claim, candidates.length ? candidates.slice(0, 3).map((c) => c.text) : sentences);
  const run = longestCommonRun(withoutQuotes(input.claim), input.text);
  const patchwriting = run.words >= THRESHOLDS.patchwritingWords ? { words: run.words, excerpt: run.excerpt } : null;
  const q = directQuoteIn(input.claim);
  const directQuote = q ? { text: q, foundInSource: verifyQuote(q, sentences).ok } : null;
  const shared = { ...base, candidates, scopeFlags, patchwriting, directQuote };

  try {
    const { data, model } = await chatJson(
      [
        { role: "system", content: SKEPTIC_SYSTEM },
        {
          role: "user",
          content: skepticUser({
            claim: input.claim,
            citedAs: input.citedAs,
            hints: scopeFlags.map((f) => f.message),
            sentences,
            origin: input.textOrigin === "student_text" ? "text the student pasted" : "abstract",
          }),
        },
      ],
      SkepticReply,
      { maxTokens: 500 },
    );

    const claimedIndex = data.sentence !== null ? data.sentence - 1 : null;
    const quote = data.quote.trim() || (claimedIndex !== null && sentences[claimedIndex]) || "";
    const qc = quote ? verifyQuote(quote, sentences, claimedIndex) : { ok: false, similarity: 0 };
    const verdict: ClaimVerdict = data.verdict;
    const explanation = data.explanation.trim() || undefined;

    if ((verdict === "supported" || verdict === "overreach") && !qc.ok) {
      // the model's evidence is not in the source: no label beyond "Unchecked"
      return { ...shared, verdict: "unchecked", mode: "ai", reason: "quote_not_in_source", explanation, model };
    }

    return {
      ...shared,
      verdict,
      mode: "ai",
      evidence: qc.ok && qc.index !== undefined ? { index: qc.index, text: sentences[qc.index] } : undefined,
      quoteVerified: qc.ok,
      explanation,
      model,
    };
  } catch (e) {
    if (e instanceof AiUnavailable) {
      return {
        ...shared,
        verdict: "unchecked",
        mode: "code",
        reason: e.reason === "rate_limited" ? "rate_limited" : e.reason === "invalid_output" ? "invalid_ai_output" : "ai_unavailable",
      };
    }
    throw e;
  }
}
