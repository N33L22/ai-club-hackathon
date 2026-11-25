/** BM25 ranking of source sentences against a claim (plain code). */
import { numbersIn, stems } from "../text/tokens";
import type { EvidenceSentence } from "../types";

const K1 = 1.2;
const B = 0.75;

export function rankSentences(claim: string, sentences: string[], k = 5): EvidenceSentence[] {
  const query = [...new Set(stems(claim))];
  if (!query.length || !sentences.length) return [];
  const docs = sentences.map((s) => stems(s));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const claimNumbers = new Set(numbersIn(claim));

  const scored = docs.map((d, index) => {
    const tf = new Map<string, number>();
    for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const q of query) {
      const f = tf.get(q);
      if (!f) continue;
      const n = df.get(q) ?? 0;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.length) / avg)));
    }
    for (const num of numbersIn(sentences[index])) if (claimNumbers.has(num)) score += 0.6;
    return { index, text: sentences[index], score };
  });

  const max = Math.max(...scored.map((s) => s.score));
  if (max <= 0) return [];
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => ({ ...s, score: Math.round((s.score / max) * 100) / 100 }));
}
