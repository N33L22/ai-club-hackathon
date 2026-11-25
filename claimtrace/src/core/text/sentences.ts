/**
 * Sentence splitting tuned for academic prose: keeps "et al.", "e.g.",
 * initials ("A. K. Przybylski"), decimals and "Fig. 2" inside one sentence.
 */

const ABBREVIATIONS = new Set([
  "al", "e.g", "eg", "i.e", "ie", "fig", "figs", "vs", "approx", "ca", "cf", "dr", "mr", "mrs", "ms", "prof",
  "no", "nos", "vol", "vols", "pp", "p", "st", "jr", "sr", "inc", "ltd", "co", "eq", "eqs", "ref", "refs",
  "resp", "est", "dept", "univ", "u.s", "u.k", "e.u", "etc", "ch", "sec", "suppl", "ed", "eds", "jan", "feb",
  "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec", "n.d",
]);

export interface Span {
  start: number;
  end: number; // exclusive, excludes trailing whitespace
  text: string;
}

/** Placeholder the editor uses for an inline citation when splitting sentences. */
export const CITE_MARK = "";

export function splitSentenceSpans(text: string): Span[] {
  const spans: Span[] = [];
  // closing quotes/brackets, and a citation placed right after the full stop, stay with the sentence
  const boundary = /[.!?]+["'’”)\]]*(?=\s+|$)/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(text))) {
    const punctEnd = m.index + m[0].length;
    const before = text.slice(start, m.index);
    const lastWord = (before.match(/(\S+)$/)?.[1] ?? "").replace(/^[("'\[]+/, "");
    const after = text.slice(punctEnd);
    const next = after.match(/^\s+(\S)/)?.[1];

    if (m[0].startsWith(".")) {
      const lw = lastWord.toLowerCase().replace(/\.$/, "");
      if (ABBREVIATIONS.has(lw)) continue;
      if (/^[A-Z]$/.test(lastWord)) continue; // initial: "A. K. Przybylski"
      if (/^([A-Za-z]\.){1,3}[A-Za-z]?$/.test(lastWord)) continue; // "U.S", "e.g"
    }
    if (next !== undefined && /[a-z]/.test(next)) continue; // sentence would start lower-case

    const raw = text.slice(start, punctEnd);
    const lead = raw.length - raw.trimStart().length;
    if (raw.trim()) spans.push({ start: start + lead, end: punctEnd, text: raw.trim() });
    start = punctEnd;
  }
  const tail = text.slice(start);
  if (tail.trim()) {
    const lead = tail.length - tail.trimStart().length;
    const trimmed = tail.trim();
    spans.push({ start: start + lead, end: start + lead + trimmed.length, text: trimmed });
  }
  return spans;
}

export function splitSentences(text: string): string[] {
  return splitSentenceSpans(text.replace(/\s+/g, " ").trim()).map((s) => s.text);
}
