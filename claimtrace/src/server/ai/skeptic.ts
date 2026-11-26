import "server-only";
import { z } from "zod";
import { judgeReply, prepareCheck } from "@/core/evidence/judge";
import type { ClaimCheck, TextOrigin } from "@/core/types";
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
  /** Length of the original text, when the browser had to shorten it. */
  textChars?: number;
}

/**
 * The Skeptic: code prepares and re-checks, the model judges.
 * 1. code ranks candidate sentences and applies scope rules (hints)
 * 2. the model picks a sentence and a verdict
 * 3. code confirms the evidence is a whole sentence of the source and is about
 *    the claim (core/evidence/judge.ts)
 * If the AI is unavailable, the claim stays "Unchecked", never "Supported".
 */
export async function checkClaim(input: SkepticInput): Promise<ClaimCheck> {
  const checkedAt = new Date().toISOString();
  const prep = prepareCheck(input.claim, input.text, input.textChars);
  const base = { candidates: [] as ClaimCheck["candidates"], scopeFlags: [] as ClaimCheck["scopeFlags"], quoteVerified: false, textOrigin: input.textOrigin, checkedAt };

  if (!prep.sentences.length || input.textOrigin === "none") {
    return { ...base, verdict: "unchecked", mode: "code", reason: "no_text", patchwriting: null, directQuote: null, truncated: null };
  }

  const shared = {
    ...base,
    candidates: prep.candidates,
    scopeFlags: prep.scopeFlags,
    patchwriting: prep.patchwriting,
    directQuote: prep.directQuote,
    truncated: prep.truncated,
  };

  try {
    const { data, model } = await chatJson(
      [
        { role: "system", content: SKEPTIC_SYSTEM },
        {
          role: "user",
          content: skepticUser({
            claim: input.claim,
            citedAs: input.citedAs,
            hints: prep.scopeFlags.map((f) => f.message),
            sentences: prep.sentences,
            origin: input.textOrigin === "student_text" ? "text the student pasted" : "abstract",
          }),
        },
      ],
      SkepticReply,
      { maxTokens: 500 },
    );

    const judged = judgeReply(input.claim, prep, data);
    return {
      ...shared,
      verdict: judged.verdict,
      mode: "ai",
      evidence: judged.evidence,
      quoteVerified: judged.quoteVerified,
      reason: judged.reason,
      explanation: data.explanation.trim() || undefined,
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
