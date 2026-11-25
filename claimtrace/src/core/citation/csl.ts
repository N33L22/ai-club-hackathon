/**
 * CSL-JSON conversion (for citation-js) and lightweight in-text citation labels
 * (used by editor chips, which must render synchronously).
 */
import type { CitationStyleId, LibrarySource } from "../model";
import { stripRetractedPrefix } from "../text/normalize";
import type { Person } from "../types";

export interface CslName {
  family?: string;
  given?: string;
  literal?: string;
}

export interface CslItem {
  id: string;
  type: string;
  title: string;
  author?: CslName[];
  issued?: { "date-parts": number[][] };
  accessed?: { "date-parts": number[][] };
  "container-title"?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  DOI?: string;
  URL?: string;
}

const CSL_TYPES: Record<string, string> = {
  article: "article-journal",
  review: "article-journal",
  "journal-article": "article-journal",
  preprint: "article",
  "posted-content": "article",
  book: "book",
  "book-chapter": "chapter",
  "proceedings-article": "paper-conference",
  dissertation: "thesis",
  report: "report",
  webpage: "webpage",
  dataset: "dataset",
};

function cslName(p: Person): CslName {
  return p.given ? { family: p.family, given: p.given } : { literal: p.family };
}

function dateParts(iso?: string): number[][] | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : [[d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]];
}

export function toCsl(src: LibrarySource): CslItem {
  const r = src.record;
  const type = src.origin === "student" ? CSL_TYPES[r.type ?? "webpage"] ?? "webpage" : CSL_TYPES[r.type ?? ""] ?? "article-journal";
  const item: CslItem = {
    id: src.id,
    type,
    title: stripRetractedPrefix(r.title),
    author: r.authors.length ? r.authors.map(cslName) : undefined,
    issued: r.year ? { "date-parts": [[r.year]] } : undefined,
    "container-title": r.venue,
    publisher: r.publisher,
    volume: r.volume,
    issue: r.issue,
    page: r.pages,
    DOI: r.doi,
    URL: r.doi ? undefined : r.url,
  };
  if (type === "webpage" && src.accessedAt) item.accessed = { "date-parts": dateParts(src.accessedAt)! };
  return item;
}

function names(authors: Person[], join: string): string {
  if (!authors.length) return "";
  if (authors.length === 1) return authors[0].family;
  if (authors.length === 2) return `${authors[0].family} ${join} ${authors[1].family}`;
  return `${authors[0].family} et al.`;
}

/** In-text citation, e.g. (Kelly et al., 2018) or [3]. */
export function inTextLabel(src: Pick<LibrarySource, "record"> | undefined, style: CitationStyleId, number?: number): string {
  if (!src) return "(missing source)";
  const a = src.record.authors;
  const year = src.record.year ? String(src.record.year) : "n.d.";
  const shortTitle = stripRetractedPrefix(src.record.title).split(/[:.?]/)[0].split(/\s+/).slice(0, 4).join(" ");
  switch (style) {
    case "ieee":
    case "vancouver":
      return `[${number ?? "?"}]`;
    case "mla":
      return `(${names(a, "and") || `"${shortTitle}"`})`;
    case "harvard":
      return `(${names(a, "and") || shortTitle}, ${year})`;
    case "apa":
    default:
      return `(${names(a, "&") || shortTitle}, ${year})`;
  }
}

/** Short reference line for lists and chips: "Kelly et al. (2018)". */
export function shortRef(src: Pick<LibrarySource, "record"> | undefined): string {
  if (!src) return "Missing source";
  const n = names(src.record.authors, "&") || stripRetractedPrefix(src.record.title).slice(0, 40);
  return `${n} (${src.record.year ?? "n.d."})`;
}
