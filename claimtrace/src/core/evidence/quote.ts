/**
 * The code re-check behind "Quote or it didn't happen": a sentence proposed by
 * the AI only counts as evidence if it really appears in the source text.
 */
import { THRESHOLDS } from "../config";
import { normalizeForQuote } from "../text/normalize";
import { levenshteinRatio } from "../text/similarity";

export interface QuoteCheck {
  ok: boolean;
  index?: number;
  similarity: number;
}

export function verifyQuote(quote: string, sentences: string[], claimedIndex?: number | null): QuoteCheck {
  const q = normalizeForQuote(quote);
  if (q.length < 12 || !sentences.length) return { ok: false, similarity: 0 };
  const norm = sentences.map(normalizeForQuote);

  const test = (i: number): number => {
    const s = norm[i];
    if (!s) return 0;
    if (s.includes(q)) return 1;
    if (q.includes(s) && s.length / q.length > 0.9) return 0.97;
    return levenshteinRatio(q, s);
  };

  if (claimedIndex !== undefined && claimedIndex !== null && claimedIndex >= 0 && claimedIndex < norm.length) {
    const sim = test(claimedIndex);
    if (sim >= THRESHOLDS.quoteMatch) return { ok: true, index: claimedIndex, similarity: sim };
  }

  let best = { index: -1, similarity: 0 };
  for (let i = 0; i < norm.length; i++) {
    const sim = test(i);
    if (sim > best.similarity) best = { index: i, similarity: sim };
  }
  if (best.similarity >= THRESHOLDS.quoteMatch) return { ok: true, index: best.index, similarity: best.similarity };

  // A quote may span a sentence boundary.
  const joined = norm.join(" ");
  if (joined.includes(q)) {
    const at = joined.indexOf(q);
    let acc = 0;
    for (let i = 0; i < norm.length; i++) {
      acc += norm[i].length + 1;
      if (acc > at) return { ok: true, index: i, similarity: 1 };
    }
  }
  return { ok: false, similarity: best.similarity };
}

/** Direct quotations inside a claim ("..." with at least four words). */
export function directQuoteIn(claim: string): string | null {
  const m = claim.match(/["“]([^"”]+)["”]/);
  if (!m) return null;
  return m[1].trim().split(/\s+/).length >= 4 ? m[1].trim() : null;
}
