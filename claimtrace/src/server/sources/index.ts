import "server-only";
import { LIMITS } from "@/core/config";
import { recordKey } from "@/core/records";
import type { ReferenceInput, RetractionInfo, ScholarlyRecord, ScholarlyService } from "@/core/types";
import { parseReferenceText } from "@/core/verify/reference-text";
import { crossref } from "./crossref";
import { openalex } from "./openalex";
import type { SearchOptions } from "./types";

/**
 * Scholarly gateway: the only module the rest of the server talks to.
 * Crossref is authoritative for bibliographic metadata (it is the DOI
 * registry); OpenAlex adds abstracts, open-access status and countries.
 * Retractions are cross-checked in both.
 *
 * Lookups report which databases failed. "Neither database has it" and "a
 * database did not answer" are different results, and only the first may ever
 * become "Not found".
 */

export function mergeRetraction(a?: RetractionInfo, b?: RetractionInfo): RetractionInfo {
  return {
    retracted: Boolean(a?.retracted || b?.retracted),
    noticeDoi: a?.noticeDoi ?? b?.noticeDoi,
    date: a?.date ?? b?.date,
    flaggedBy: [...new Set([...(a?.flaggedBy ?? []), ...(b?.flaggedBy ?? [])])],
    updates: [...(a?.updates ?? []), ...(b?.updates ?? [])],
  };
}

export function mergeRecords(cr: ScholarlyRecord | null, oa: ScholarlyRecord | null): ScholarlyRecord | null {
  if (!cr) return oa;
  if (!oa) return cr;
  const abstract = oa.abstract ?? cr.abstract;
  return {
    ...oa,
    ...cr,
    authors: cr.authors.length ? cr.authors : oa.authors,
    year: cr.year ?? oa.year,
    venue: cr.venue ?? oa.venue,
    type: oa.type === "review" ? "review" : cr.type ?? oa.type,
    openalexId: oa.openalexId,
    abstract,
    abstractSource: oa.abstract ? "openalex" : cr.abstract ? "crossref" : undefined,
    isOa: oa.isOa,
    oaUrl: oa.oaUrl,
    citedBy: oa.citedBy,
    countries: oa.countries,
    language: oa.language,
    retraction: mergeRetraction(cr.retraction, oa.retraction),
    foundIn: ["crossref", "openalex"],
  };
}

export interface DoiLookup {
  record: ScholarlyRecord | null;
  /** Databases that did not answer (their silence is not evidence of absence). */
  failed: ScholarlyService[];
}

/** Look a DOI up in both databases in parallel. Never throws: failures are reported in `failed`. */
export async function lookupDoi(doi: string): Promise<DoiLookup> {
  const [cr, oa] = await Promise.allSettled([crossref.byDoi(doi), openalex.byDoi(doi)]);
  const failed: ScholarlyService[] = [];
  if (cr.status === "rejected") failed.push("crossref");
  if (oa.status === "rejected") failed.push("openalex");
  return { record: mergeRecords(cr.status === "fulfilled" ? cr.value : null, oa.status === "fulfilled" ? oa.value : null), failed };
}

/** Run every planned query in OpenAlex and merge by reciprocal rank. Throws only if every query failed. */
export async function searchWorks(queries: string[], opts: Omit<SearchOptions, "perPage">): Promise<ScholarlyRecord[]> {
  const settled = await Promise.allSettled(
    queries.slice(0, LIMITS.maxQueries).map((q) => openalex.search!(q, { ...opts, perPage: LIMITS.searchPerQuery })),
  );
  const lists = settled.filter((s): s is PromiseFulfilledResult<ScholarlyRecord[]> => s.status === "fulfilled").map((s) => s.value);
  if (!lists.length) throw (settled.find((s) => s.status === "rejected") as PromiseRejectedResult).reason;
  const score = new Map<string, { rec: ScholarlyRecord; score: number }>();
  for (const list of lists) {
    list.forEach((rec, rank) => {
      const k = recordKey(rec);
      const entry = score.get(k) ?? { rec, score: 0 };
      entry.score += 1 / (rank + 3);
      score.set(k, entry);
    });
  }
  return [...score.values()]
    .sort((a, b) => b.score - a.score || (b.rec.citedBy ?? 0) - (a.rec.citedBy ?? 0))
    .map((e) => e.rec)
    .slice(0, 30);
}

export interface CandidateLookup {
  records: ScholarlyRecord[];
  failed: ScholarlyService[];
}

/** Candidate records for a reference with no DOI: Crossref bibliographic search plus OpenAlex. Never throws. */
export async function candidatesFor(input: ReferenceInput): Promise<CandidateLookup> {
  const text =
    input.raw ??
    [input.authors?.map((a) => a.family).join(", "), input.year, input.title].filter(Boolean).join(" ");
  if (!text.trim()) return { records: [], failed: [] };
  // OpenAlex search works best on the title alone: use the parsed title of a pasted reference
  const titleQuery = input.title ?? (input.raw ? parseReferenceText(input.raw).title : undefined) ?? text.slice(0, 200);
  const [cr, oa] = await Promise.allSettled([crossref.match!(text, 5), openalex.match!(titleQuery, 4)]);
  const failed: ScholarlyService[] = [];
  if (cr.status === "rejected") failed.push("crossref");
  if (oa.status === "rejected") failed.push("openalex");
  const out = new Map<string, ScholarlyRecord>();
  for (const r of [...(cr.status === "fulfilled" ? cr.value : []), ...(oa.status === "fulfilled" ? oa.value : [])]) {
    const k = recordKey(r);
    if (!out.has(k)) out.set(k, r);
  }
  return { records: [...out.values()], failed };
}
