import "server-only";
import { cleanMarkup, stripTags } from "@/core/text/normalize";
import type { RetractionInfo, ScholarlyRecord } from "@/core/types";
import { config } from "../env";
import { getJson } from "../http";
import type { SourceConnector } from "./types";

const BASE = "https://api.crossref.org";

interface CrDate {
  "date-parts"?: Array<Array<number | null>>;
  "date-time"?: string;
}
interface CrUpdate {
  DOI?: string;
  type?: string;
  label?: string;
  source?: string;
  updated?: CrDate;
}
interface CrItem {
  DOI: string;
  title?: string[];
  subtitle?: string[];
  author?: Array<{ family?: string; given?: string; name?: string }>;
  issued?: CrDate;
  published?: CrDate;
  "published-print"?: CrDate;
  "published-online"?: CrDate;
  "container-title"?: string[];
  publisher?: string;
  volume?: string;
  issue?: string;
  page?: string;
  type?: string;
  URL?: string;
  abstract?: string;
  "updated-by"?: CrUpdate[];
}

const TYPES: Record<string, string> = {
  "journal-article": "article",
  "posted-content": "preprint",
  "book-chapter": "book-chapter",
  "proceedings-article": "proceedings-article",
  book: "book",
  monograph: "book",
  "edited-book": "book",
  report: "report",
  dataset: "dataset",
  dissertation: "dissertation",
};

function yearOf(...dates: Array<CrDate | undefined>): number | undefined {
  for (const d of dates) {
    const y = d?.["date-parts"]?.[0]?.[0];
    if (y) return y;
  }
  return undefined;
}

function isoDate(d: CrDate | undefined): string | undefined {
  if (d?.["date-time"]) return d["date-time"].slice(0, 10);
  const p = d?.["date-parts"]?.[0];
  if (!p?.[0]) return undefined;
  return [p[0], p[1], p[2]].filter(Boolean).map((n, i) => (i ? String(n).padStart(2, "0") : String(n))).join("-");
}

export function retractionFromUpdates(updates: CrUpdate[] | undefined): RetractionInfo {
  const list = (updates ?? []).map((u) => ({ type: (u.type ?? "update").toLowerCase().replace(/\s+/g, "_"), doi: u.DOI?.toLowerCase(), date: isoDate(u.updated) }));
  const retraction = list.find((u) => u.type === "retraction" || u.type === "withdrawal" || u.type === "removal");
  return {
    retracted: Boolean(retraction),
    noticeDoi: retraction?.doi,
    date: retraction?.date,
    flaggedBy: retraction ? ["crossref"] : [],
    updates: list.filter((u) => u !== retraction),
  };
}

export function mapItem(m: CrItem): ScholarlyRecord {
  const main = cleanMarkup(m.title?.[0] ?? "Untitled");
  const sub = m.subtitle?.[0] ? cleanMarkup(m.subtitle[0]) : undefined;
  const title = sub && !main.toLowerCase().includes(sub.toLowerCase()) ? `${main}: ${sub}` : main;
  const abstract = m.abstract ? stripTags(m.abstract) : undefined;
  return {
    doi: m.DOI.toLowerCase(),
    title,
    authors: (m.author ?? [])
      .map((a) => (a.family ? { family: a.family.trim(), given: a.given?.trim() } : a.name ? { family: a.name.trim() } : null))
      .filter((a): a is NonNullable<typeof a> => a !== null),
    year: yearOf(m.issued, m["published-print"], m["published-online"], m.published),
    venue: m["container-title"]?.[0] ? cleanMarkup(m["container-title"][0]) : undefined,
    publisher: m.publisher ? cleanMarkup(m.publisher) : undefined,
    volume: m.volume,
    issue: m.issue,
    pages: m.page,
    type: m.type ? TYPES[m.type] ?? m.type : undefined,
    url: m.URL,
    abstract: abstract && abstract.split(" ").length >= 12 ? abstract : undefined,
    abstractSource: abstract ? "crossref" : undefined,
    retraction: retractionFromUpdates(m["updated-by"]),
    foundIn: ["crossref"],
  };
}

function polite(params: URLSearchParams): string {
  if (config.contactEmail) params.set("mailto", config.contactEmail);
  return params.toString();
}

export const crossref: SourceConnector = {
  name: "crossref",

  async byDoi(doi) {
    const res = await getJson<{ message: CrItem }>(`${BASE}/works/${encodeURIComponent(doi)}?${polite(new URLSearchParams())}`, {
      service: "Crossref",
    });
    return res.status === 200 && res.data?.message ? mapItem(res.data.message) : null;
  },

  async match(text: string, rows: number) {
    const params = new URLSearchParams({
      "query.bibliographic": text.slice(0, 500),
      rows: String(rows),
      select: "DOI,title,subtitle,author,issued,published,published-print,published-online,container-title,publisher,volume,issue,page,type,URL,updated-by",
    });
    const res = await getJson<{ message: { items: CrItem[] } }>(`${BASE}/works?${polite(params)}`, { service: "Crossref" });
    return (res.data?.message.items ?? []).map(mapItem);
  },
};
