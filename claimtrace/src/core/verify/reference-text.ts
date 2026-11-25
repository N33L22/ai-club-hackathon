/**
 * Best-effort parse of a pasted reference string (APA-like or not).
 * Only used to show the student what was read; matching uses the whole string.
 */
import { extractDoi, tidy } from "../text/normalize";
import type { Person, ReferenceInput } from "../types";

export function parseReferenceText(raw: string): ReferenceInput {
  const text = tidy(raw.replace(/^\s*(\[\d+\]|\d+[.)])\s*/, ""));
  const doi = extractDoi(text);
  const yearMatch = text.match(/\((1[89]\d{2}|20\d{2})[a-z]?\)|\b(1[89]\d{2}|20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1] ?? yearMatch[2]) : undefined;

  let title: string | undefined;
  const apa = text.match(/\((?:1[89]\d{2}|20\d{2})[a-z]?(?:,[^)]*)?\)\.\s*(.+?[.?!])\s/);
  if (apa) title = apa[1].replace(/[.]$/, "");
  else {
    const quoted = text.match(/["“]([^"”]{10,})["”]/);
    if (quoted) title = quoted[1].replace(/[.,]$/, "");
  }

  const authors: Person[] = [];
  const authorPart = text.split(/\(\s*(?:1[89]\d{2}|20\d{2})/)[0] ?? "";
  const first = authorPart.match(/^\s*([A-Z][A-Za-zÀ-ɏ'\-]+(?:\s[A-Z][A-Za-zÀ-ɏ'\-]+)?),/);
  if (first) authors.push({ family: first[1] });

  return { raw: text, doi, year, title, authors: authors.length ? authors : undefined };
}

/** Split a pasted bibliography into individual references (one per line or numbered). */
export function splitReferenceList(text: string): string[] {
  return text
    .split(/\n\s*\n|\n(?=\s*(?:\[\d+\]|\d+[.)])\s)|\n(?=[A-Z][A-Za-zÀ-ɏ'\-]+,\s)/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 15);
}
