import { words } from "./tokens";

/** Remove text inside quotation marks (a direct quote is not patchwriting). */
export function withoutQuotes(s: string): string {
  return s.replace(/["“][^"”]{3,}["”]/g, " ");
}

/**
 * Longest run of consecutive words shared by `a` and `b` (case, punctuation
 * and diacritics ignored). Used for the patchwriting check.
 */
export function longestCommonRun(a: string, b: string): { words: number; excerpt: string } {
  const aw = words(a);
  const bw = words(b);
  if (!aw.length || !bw.length) return { words: 0, excerpt: "" };
  let best = 0;
  let bestEnd = 0;
  let prev = new Array<number>(bw.length + 1).fill(0);
  let cur = new Array<number>(bw.length + 1).fill(0);
  for (let i = 1; i <= aw.length; i++) {
    for (let j = 1; j <= bw.length; j++) {
      cur[j] = aw[i - 1] === bw[j - 1] ? prev[j - 1] + 1 : 0;
      if (cur[j] > best) {
        best = cur[j];
        bestEnd = i;
      }
    }
    [prev, cur] = [cur, prev];
    cur.fill(0);
  }
  return { words: best, excerpt: aw.slice(bestEnd - best, bestEnd).join(" ") };
}
