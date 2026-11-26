/**
 * The code half of the Skeptic (pure functions, shared by the API, the
 * scripts and the tests). Code prepares the check before the AI is asked,
 * then decides whether the AI's answer is acceptable:
 *
 *   1. the quoted evidence must really be in the source (verifyQuote),
 *   2. it must be (nearly) a whole sentence, not a fragment that merely exists,
 *   3. it must be about the claim: it shares enough of the claim's key terms,
 *      or it is the sentence code itself ranks most relevant.
 *
 * An answer that fails any rule leaves the claim "Unchecked", never Supported.
 */
import { LIMITS, THRESHOLDS } from "../config";
import { longestCommonRun, withoutQuotes } from "../text/overlap";
import { splitSentences } from "../text/sentences";
import { stems } from "../text/tokens";
import type { ClaimVerdict, EvidenceSentence, PatchwritingFlag, ScopeFlag, UncheckedReason } from "../types";
import { directQuoteIn, verifyQuote } from "./quote";
import { rankSentences } from "./rank";
import { detectScope } from "./scope";

export interface PreparedCheck {
  sentences: string[];
  candidates: EvidenceSentence[];
  scopeFlags: ScopeFlag[];
  patchwriting: PatchwritingFlag | null;
  directQuote: { text: string; foundInSource: boolean | null } | null;
  /** Set when only the first part of a long text could be checked. */
  truncated: { checked: number; total: number } | null;
}

/**
 * The sentences a check may use (the first LIMITS.maxSentences sentences of
 * the first LIMITS.sourceTextChars characters), and whether text was left out.
 * @param fullChars length of the original text, if the caller had to shorten it
 */
export function checkableSentences(text: string, fullChars = text.length): { clipped: string; sentences: string[]; truncated: PreparedCheck["truncated"] } {
  const clipped = text.slice(0, LIMITS.sourceTextChars);
  const all = splitSentences(clipped);
  const sentences = all.slice(0, LIMITS.maxSentences);
  const length = Math.max(fullChars, text.length);
  const charsCut = length > clipped.length;
  const truncated =
    charsCut || all.length > sentences.length
      ? {
          checked: sentences.length,
          // estimate the full count when characters were cut off before splitting
          total: charsCut ? Math.max(all.length + 1, Math.round((all.length * length) / Math.max(clipped.length, 1))) : all.length,
        }
      : null;
  return { clipped, sentences, truncated };
}

/**
 * Code steps before the AI is asked: split into sentences, rank them against
 * the claim (BM25), and run the scope, patchwriting and direct-quote checks.
 * @param fullChars length of the original text, if the caller had to shorten it
 */
export function prepareCheck(claim: string, text: string, fullChars = text.length): PreparedCheck {
  const { clipped, sentences, truncated } = checkableSentences(text, fullChars);
  const candidates = rankSentences(claim, sentences, 5);
  const scopeFlags = detectScope(claim, candidates.length ? candidates.slice(0, 3).map((c) => c.text) : sentences, sentences.join(" "));
  const run = longestCommonRun(withoutQuotes(claim), clipped);
  const patchwriting = run.words >= THRESHOLDS.patchwritingWords ? { words: run.words, excerpt: run.excerpt } : null;
  const q = directQuoteIn(claim);
  const found = q ? verifyQuote(q, sentences).ok : false;
  // a quotation beyond the part that was checked is "unknown", not "not found"
  const directQuote = q ? { text: q, foundInSource: found ? true : truncated ? null : false } : null;
  return { sentences, candidates, scopeFlags, patchwriting, directQuote, truncated };
}

/** Share of the claim's key terms (stems and numbers) that appear in a sentence. */
export function claimOverlap(claim: string, sentence: string): number {
  const want = new Set(stems(claim));
  if (!want.size) return 0;
  const have = new Set(stems(sentence));
  let hit = 0;
  for (const w of want) if (have.has(w)) hit++;
  return hit / want.size;
}

/** Is the sentence about the claim? Enough shared key terms, or code's own top-ranked sentence. */
export function evidenceRelevant(claim: string, index: number, sentences: string[], candidates: EvidenceSentence[]): boolean {
  if (!sentences[index]) return false;
  if (candidates[0]?.index === index) return true;
  return claimOverlap(claim, sentences[index]) >= THRESHOLDS.evidenceOverlap;
}

export interface AiReply {
  verdict: "supported" | "overreach" | "not_supported";
  /** 1-based sentence number, as shown to the model. */
  sentence: number | null;
  quote: string;
}

export interface Judgement {
  verdict: ClaimVerdict;
  evidence?: EvidenceSentence;
  quoteVerified: boolean;
  reason?: UncheckedReason;
}

/** Decide whether the AI's answer stands (see the rules at the top of this file). */
export function judgeReply(claim: string, prep: PreparedCheck, reply: AiReply): Judgement {
  const { sentences } = prep;
  const claimed = reply.sentence !== null && Number.isInteger(reply.sentence) ? reply.sentence - 1 : null;
  const named = claimed !== null && claimed >= 0 && claimed < sentences.length ? claimed : null;
  const quote = reply.quote.trim() || (named !== null ? sentences[named] : "");
  const qc = quote ? verifyQuote(quote, sentences, named) : null;
  const wholeEnough =
    Boolean(qc?.ok) &&
    qc!.index !== undefined &&
    (qc!.coverage >= THRESHOLDS.quoteCoverage || (named === qc!.index && qc!.words >= THRESHOLDS.quoteMinWords));
  const evidence = wholeEnough ? { index: qc!.index!, text: sentences[qc!.index!] } : undefined;

  if (reply.verdict === "not_supported") {
    // "not supported" needs no evidence; the closest sentence is kept only if it is really in the source
    return { verdict: "not_supported", evidence, quoteVerified: Boolean(evidence) };
  }
  if (!evidence) return { verdict: "unchecked", quoteVerified: false, reason: "quote_not_in_source" };
  if (!evidenceRelevant(claim, evidence.index, sentences, prep.candidates)) {
    return { verdict: "unchecked", quoteVerified: false, reason: "evidence_not_relevant" };
  }
  return { verdict: reply.verdict, evidence, quoteVerified: true };
}
