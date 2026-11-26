/**
 * Does any search result actually cover what the student asked the assistant for? Code only, no AI.
 *
 * OpenAlex search is fuzzy: it always returns the closest papers, even for studies that were never
 * written. So before the assistant may say it found something, code checks whether a result is about
 * the request's specific subject. If none is, the answer is "Not found", and the closest papers are
 * shown only as related reading, each with its own label. Nothing here can create a source.
 */
import { normalizeText } from "../text/normalize";
import { contentWords, stem } from "../text/tokens";
import type { ScholarlyRecord } from "../types";

/** Joins capitalised words into one name ("University of Dubai"), only between two capitalised words. */
const CONNECTORS = new Set(["of", "for", "and", "the", "de", "&"]);

/** Words that ask for something rather than say what it is about (topic requests only). */
const ASK_WORDS = new Set(
  (
    "give find show list get need want please tell provide suggest recommend peer reviewed papers sources source references " +
    "reference articles journal journals measure measures measured measuring examine examines examined looked look " +
    "recent published four five six some several good best top quality academic scholarly"
  ).split(" "),
);

export interface Coverage {
  /** Specific names the request mentions ("AI Club Hackathon 2026"); empty for a general topic. */
  terms: string[];
  /** What the request is about, for the answer's wording. */
  subject: string;
  /** Results that cover the request, best first. */
  covering: ScholarlyRecord[];
}

const isCap = (t: string) => /^[A-Z]/.test(t);
const isAcronym = (t: string) => /^[A-Z][A-Z0-9]+$/.test(t);
const isYear = (t: string) => /^(18|19|20|21)\d{2}$/.test(t);

/**
 * The specific things a request names: quoted phrases, and runs of capitalised words or acronyms,
 * with a year kept when it is part of the name ("AI Club Hackathon 2026", "SP Jain Dubai").
 * A capitalised word that only starts a sentence ("Give me ...") is not a name. A year on its own
 * says when, not what, so it is not used as a subject term.
 */
export function specificTerms(request: string): string[] {
  const terms: string[] = [];
  for (const m of request.matchAll(/["“”]([^"“”]{3,120})["“”]/g)) terms.push(m[1].trim());
  const tokens = [...request.replace(/["“”][^"“”]{3,120}["“”]/g, " . ").matchAll(/[A-Za-z0-9][A-Za-z0-9'’-]*|[.!?;:]/g)].map((m) =>
    m[0].replace(/['’]s?$/, ""),
  );
  let run: string[] = [];
  let runStartsSentence = false;
  let sentenceStart = true;
  const close = () => {
    while (run.length && CONNECTORS.has(run[run.length - 1].toLowerCase())) run.pop();
    const single = run.length === 1;
    const drop = run.length === 0 || (single && runStartsSentence && !isAcronym(run[0])) || (single && run[0].length < 2);
    if (!drop) terms.push(run.join(" "));
    run = [];
  };
  tokens.forEach((t, i) => {
    if (/^[.!?;:]$/.test(t)) {
      close();
      sentenceStart = true;
      return;
    }
    const next = tokens[i + 1];
    if (isCap(t) || (isYear(t) && run.length > 0)) {
      if (!run.length) runStartsSentence = sentenceStart;
      run.push(t);
    } else if (run.length && CONNECTORS.has(t.toLowerCase()) && next && isCap(next)) {
      run.push(t);
    } else {
      close();
    }
    sentenceStart = false;
  });
  close();
  // keep each name once, and drop names already inside a longer one
  const seen = new Map<string, string>();
  for (const t of terms) if (normalizeText(t)) seen.set(normalizeText(t), t);
  const norms = [...seen.keys()];
  return norms.filter((n) => !norms.some((o) => o !== n && ` ${o} `.includes(` ${n} `))).map((n) => seen.get(n) ?? n);
}

const textOf = (r: ScholarlyRecord) => ` ${normalizeText(`${r.title} ${r.abstract ?? ""}`)} `;

/**
 * How well a result's title and abstract contain one name: 1 when the whole name appears as a phrase,
 * 0.5 when at least two thirds of its words appear (e.g. "SP Jain" for "SP Jain Dubai"), else 0.
 */
function termScore(term: string, text: string): number {
  const n = normalizeText(term);
  if (!n) return 0;
  if (text.includes(` ${n} `)) return 1;
  const ws = n.split(" ");
  const hit = ws.filter((w) => text.includes(` ${w} `)).length;
  return ws.length >= 2 && hit / ws.length >= 2 / 3 ? 0.5 : 0;
}

/**
 * Which results cover the request.
 * - With named terms: a result covers it when at least one name appears in full and the names
 *   average at least half credit (so a paper on "AI hackathons in Dubai" does not count as a study
 *   of the "AI Club Hackathon 2026 at SP Jain Dubai").
 * - Without names (a general topic): when at least half of the request's topic words appear.
 */
export function requestCoverage(request: string, results: ScholarlyRecord[]): Coverage {
  const terms = specificTerms(request);
  if (terms.length) {
    const scored = results
      .map((r) => {
        const text = textOf(r);
        const scores = terms.map((t) => termScore(t, text));
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { r, avg, covers: scores.some((s) => s === 1) && avg >= 0.5 };
      })
      .filter((x) => x.covers)
      .sort((a, b) => b.avg - a.avg);
    const quoted = terms.map((t) => `“${t}”`);
    const subject = quoted.length > 1 ? `${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]}` : quoted[0];
    return { terms, subject, covering: scored.map((x) => x.r) };
  }
  const want = [...new Set(contentWords(request).filter((w) => !ASK_WORDS.has(w)).map(stem))];
  if (!want.length) return { terms: [], subject: "your request", covering: results };
  const covering = results.filter((r) => {
    const have = new Set(contentWords(`${r.title} ${r.abstract ?? ""}`).map(stem));
    return want.filter((w) => have.has(w)).length / want.length >= 0.5;
  });
  return { terms: [], subject: "your request", covering };
}
