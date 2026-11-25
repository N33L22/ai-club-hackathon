/**
 * Grounding check for the evidence-backed summary (gap H3): a summary sentence
 * only counts as grounded if it cites real source sentences AND shares enough
 * content words with them. Anything else is labelled "AI reasoning".
 */
import { THRESHOLDS } from "../config";
import { stems } from "../text/tokens";
import type { SummaryPoint } from "../types";

export function groundingOverlap(text: string, support: string[]): number {
  const want = new Set(stems(text));
  if (!want.size) return 0;
  const have = new Set(support.flatMap((s) => stems(s)));
  let hit = 0;
  for (const w of want) if (have.has(w)) hit++;
  return hit / want.size;
}

export function checkSummaryPoints(
  points: Array<{ text: string; sentences: number[] }>,
  sourceSentences: string[],
): SummaryPoint[] {
  return points.map((p) => {
    const valid = [...new Set(p.sentences)].filter((i) => Number.isInteger(i) && i >= 0 && i < sourceSentences.length);
    const overlap = groundingOverlap(p.text, valid.map((i) => sourceSentences[i]));
    return { text: p.text.trim(), sentences: valid, grounded: valid.length > 0 && overlap >= THRESHOLDS.summaryGrounding };
  });
}

/** Code-only fallback: the most central sentences (similar to many others). */
export function keySentences(sentences: string[], k = 3): number[] {
  if (sentences.length <= k) return sentences.map((_, i) => i);
  const sets = sentences.map((s) => new Set(stems(s)));
  const scores = sets.map((a, i) => {
    let total = 0;
    sets.forEach((b, j) => {
      if (i === j || !a.size || !b.size) return;
      let inter = 0;
      for (const w of a) if (b.has(w)) inter++;
      total += inter / Math.sqrt(a.size * b.size);
    });
    return { i, total: total + (i === 0 ? 0.3 : 0) };
  });
  return scores
    .sort((x, y) => y.total - x.total)
    .slice(0, k)
    .map((s) => s.i)
    .sort((a, b) => a - b);
}
