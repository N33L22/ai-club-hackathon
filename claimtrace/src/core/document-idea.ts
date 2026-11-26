/**
 * "Start from a document": a project title, research question and research area for a
 * document the student uploads. The Scout suggests them; this file holds the shared type
 * and the code fallback (taken from the document's own text) used when the AI is not
 * available. Pure, so the server route and the browser share it.
 */
import { contentWords } from "./text/tokens";

export interface DocumentIdea {
  title: string;
  question: string;
  area: string;
  /** "ai": suggested by the Scout; "code": taken from the document's own text. */
  mode: "ai" | "code";
  model?: string;
}

/** Words too common in assignments and papers to describe a research area. */
const GENERIC = new Set([
  "page", "pages", "abstract", "introduction", "contents", "chapter", "section", "figure", "table", "appendix",
  "student", "students", "university", "assignment", "module", "course", "words", "count", "submission", "date",
  "name", "also", "used", "using", "however", "therefore", "study", "studies", "research", "paper", "results",
  "data", "will", "would", "could", "should", "must", "within", "based", "first", "second", "third",
  "brief", "essay", "report", "write", "marks", "deadline", "sources", "references",
]);
const JUNK_TITLE = /^(untitled|microsoft word|document\s*\d*|title|abstract|introduction|contents|table of contents)\b/i;

function cleanTitle(s: string): string {
  return s
    .replace(/^microsoft word\s*-\s*/i, "")
    .replace(/\.(docx?|pdf|txt|md)$/i, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function usableTitle(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const t = cleanTitle(s);
  const words = t.split(" ").filter(Boolean);
  if (words.length < 2 || words.length > 24 || t.length > 180) return undefined;
  if (JUNK_TITLE.test(t) || !/[a-z]{3}/i.test(t) || /^(page|p\.)\s*\d+/i.test(t)) return undefined;
  return t;
}

function shorten(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}…` : s;
}

/** Lower-cases the first letter unless the first word is an acronym or a name-like word. */
function lowerFirst(s: string): string {
  const first = s.split(" ")[0] ?? "";
  return /^[A-Z][a-z]+$/.test(first) ? s[0].toLowerCase() + s.slice(1) : s;
}

/** Code fallback: title from the file's metadata or its first title-like line; area from its most frequent words. */
export function codeDocumentIdea(text: string, metaTitle?: string, fileName?: string): DocumentIdea {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 40);
  const fromLines = lines.map(usableTitle).find((t) => t && t.split(" ").length >= 3);
  const fromFile = fileName ? usableTitle(fileName.replace(/-+/g, " ")) : undefined;
  const title = shorten(usableTitle(metaTitle) ?? fromLines ?? fromFile ?? "Research project", 90);

  const counts = new Map<string, number>();
  for (const w of contentWords(text)) {
    if (w.length > 3 && !GENERIC.has(w) && !/\d/.test(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w);

  return {
    title,
    question: `What does the research say about ${lowerFirst(title.replace(/[.?!:;…]+$/, ""))}?`,
    area: top.length ? top.join(", ") : "Not clear from the text",
    mode: "code",
  };
}
