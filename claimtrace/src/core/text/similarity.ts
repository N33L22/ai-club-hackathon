import { foldDiacritics, normalizeText, stripRetractedPrefix } from "./normalize";
import { contentWords, stem } from "./tokens";

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array<number>(b.length + 1);
  let cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[b.length];
}

/** 1 = identical, 0 = completely different. */
export function levenshteinRatio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const am = new Array<boolean>(a.length).fill(false);
  const bm = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - range);
    const hi = Math.min(i + range + 1, b.length);
    for (let j = lo; j < hi; j++) {
      if (bm[j] || a[i] !== b[j]) continue;
      am[i] = bm[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!am[i]) continue;
    while (!bm[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
  let prefix = 0;
  while (prefix < 4 && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

function sortedTokens(s: string): string {
  return s.split(" ").filter(Boolean).sort().join(" ");
}

/**
 * Similarity of two titles in 0..1. Ignores case, punctuation, diacritics,
 * "RETRACTED:" prefixes and word order, and treats "Title" vs
 * "Title: a subtitle" as a near match.
 */
export function titleSimilarity(a: string, b: string): number {
  const na = normalizeText(stripRetractedPrefix(a));
  const nb = normalizeText(stripRetractedPrefix(b));
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  let score = Math.max(levenshteinRatio(na, nb), levenshteinRatio(sortedTokens(na), sortedTokens(nb)));
  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (short.split(" ").length >= 4 && (long.startsWith(short + " ") || long.endsWith(" " + short))) {
    score = Math.max(score, 0.95);
  }
  return score;
}

/** Fraction of a title's content words that appear somewhere in a free-text reference. */
export function titleCoverage(title: string, raw: string): number {
  const want = [...new Set(contentWords(stripRetractedPrefix(title)).map(stem))];
  if (!want.length) return 0;
  const have = new Set(contentWords(raw).map(stem));
  let hit = 0;
  for (const w of want) if (have.has(w)) hit++;
  return hit / want.length;
}

function surnameKey(s: string): string {
  return foldDiacritics(s).toLowerCase().replace(/[^a-z\s-]/g, "").trim();
}

/** Do two surnames refer to the same person? Tolerates accents, particles and typos. */
export function surnameMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ka = surnameKey(a);
  const kb = surnameKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const pa = ka.split(/[\s-]+/);
  const pb = kb.split(/[\s-]+/);
  if (pa[pa.length - 1] === pb[pb.length - 1] && pa[pa.length - 1].length > 2) return true;
  return jaroWinkler(ka.replace(/[\s-]/g, ""), kb.replace(/[\s-]/g, "")) >= 0.92;
}

/** Is this surname present as a word inside free text? */
export function surnameIn(surname: string | undefined, raw: string): boolean {
  if (!surname) return false;
  const key = normalizeText(surname);
  if (!key) return false;
  const hay = ` ${normalizeText(raw)} `;
  if (hay.includes(` ${key} `)) return true;
  const last = key.split(" ").pop()!;
  return last.length > 2 && hay.includes(` ${last} `);
}
