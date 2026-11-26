import "server-only";
import type { ScholarlyRecord } from "@/core/types";
import { config } from "../env";
import { getJson } from "../http";
import { splitName } from "./names";
import type { SearchOptions, SourceConnector } from "./types";

const BASE = "https://api.openalex.org";
const SELECT = [
  "id", "doi", "display_name", "publication_year", "authorships", "primary_location", "open_access",
  "best_oa_location", "is_retracted", "cited_by_count", "abstract_inverted_index", "type", "language", "biblio",
].join(",");

interface OaAuthorship {
  author?: { display_name?: string };
  raw_author_name?: string;
  countries?: string[];
}
interface OaWork {
  id: string;
  doi?: string | null;
  display_name?: string | null;
  title?: string | null;
  publication_year?: number | null;
  authorships?: OaAuthorship[];
  primary_location?: { landing_page_url?: string | null; source?: { display_name?: string | null; host_organization_name?: string | null } | null } | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
  best_oa_location?: { landing_page_url?: string | null; pdf_url?: string | null } | null;
  is_retracted?: boolean;
  cited_by_count?: number;
  abstract_inverted_index?: Record<string, number[]> | null;
  type?: string | null;
  language?: string | null;
  biblio?: { volume?: string | null; issue?: string | null; first_page?: string | null; last_page?: string | null } | null;
}

function withAuth(params: URLSearchParams): string {
  if (config.contactEmail) params.set("mailto", config.contactEmail);
  if (config.openalexKey) params.set("api_key", config.openalexKey);
  return params.toString();
}

/** OpenAlex ships abstracts as an inverted index (word -> positions). */
export function rebuildAbstract(inv: Record<string, number[]> | null | undefined): string | undefined {
  if (!inv) return undefined;
  const words: string[] = [];
  for (const [w, positions] of Object.entries(inv)) for (const p of positions) words[p] = w;
  const text = words.filter((w) => w !== undefined).join(" ").replace(/\s+/g, " ").trim();
  return text.split(" ").length >= 12 ? text : undefined;
}

export function mapWork(w: OaWork): ScholarlyRecord {
  const b = w.biblio ?? {};
  const pages = b.first_page ? (b.last_page && b.last_page !== b.first_page ? `${b.first_page}-${b.last_page}` : b.first_page) : undefined;
  const countries = [...new Set((w.authorships ?? []).flatMap((a) => a.countries ?? []))];
  const abstract = rebuildAbstract(w.abstract_inverted_index);
  return {
    doi: w.doi ? w.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase() : undefined,
    openalexId: w.id.split("/").pop(),
    title: (w.display_name ?? w.title ?? "Untitled").trim(),
    authors: (w.authorships ?? [])
      .map((a) => a.author?.display_name ?? a.raw_author_name ?? "")
      .filter(Boolean)
      .map(splitName),
    year: w.publication_year ?? undefined,
    venue: w.primary_location?.source?.display_name ?? undefined,
    publisher: w.primary_location?.source?.host_organization_name ?? undefined,
    volume: b.volume ?? undefined,
    issue: b.issue ?? undefined,
    pages,
    type: w.type ?? undefined,
    url: w.primary_location?.landing_page_url ?? undefined,
    abstract,
    abstractSource: abstract ? "openalex" : undefined,
    isOa: w.open_access?.is_oa ?? undefined,
    oaUrl: w.open_access?.oa_url ?? w.best_oa_location?.landing_page_url ?? undefined,
    citedBy: w.cited_by_count ?? undefined,
    countries: countries.length ? countries : undefined,
    language: w.language ?? undefined,
    retraction: { retracted: Boolean(w.is_retracted), flaggedBy: w.is_retracted ? ["openalex"] : [], updates: [] },
    foundIn: ["openalex"],
  };
}

export const openalex: SourceConnector = {
  name: "openalex",

  async byDoi(doi) {
    const url = `${BASE}/works/doi:${encodeURIComponent(doi)}?${withAuth(new URLSearchParams({ select: SELECT }))}`;
    const res = await getJson<OaWork>(url, { service: "OpenAlex", pool: "openalex" });
    return res.status === 200 && res.data ? mapWork(res.data) : null;
  },

  async search(query: string, opts: SearchOptions) {
    const filters: string[] = [];
    if (opts.fromYear) filters.push(`from_publication_date:${opts.fromYear}-01-01`);
    if (opts.toYear) filters.push(`to_publication_date:${opts.toYear}-12-31`);
    if (opts.onlyWithAbstract) filters.push("has_abstract:true");
    filters.push(opts.includeReviews ? "type:article|review|preprint" : "type:article|preprint");
    const params = new URLSearchParams({ search: query, per_page: String(opts.perPage), select: SELECT, filter: filters.join(",") });
    const res = await getJson<{ results: OaWork[] }>(`${BASE}/works?${withAuth(params)}`, { service: "OpenAlex", pool: "openalex" });
    return (res.data?.results ?? []).map(mapWork);
  },

  async match(text: string, rows: number) {
    const params = new URLSearchParams({ search: text.slice(0, 300), per_page: String(rows), select: SELECT });
    const res = await getJson<{ results: OaWork[] }>(`${BASE}/works?${withAuth(params)}`, { service: "OpenAlex", pool: "openalex" });
    return (res.data?.results ?? []).map(mapWork);
  },
};
