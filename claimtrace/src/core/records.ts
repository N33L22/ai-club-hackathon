/** Small helpers for bibliographic records, shared by the browser and the server. */
import { normalizeText } from "./text/normalize";
import type { ScholarlyRecord } from "./types";

/** One identity per record: DOI first, then the OpenAlex ID, then the normalised title. */
export function recordKey(r: Pick<ScholarlyRecord, "doi" | "openalexId" | "title">): string {
  return r.doi ? `doi:${r.doi.toLowerCase()}` : r.openalexId ? `oa:${r.openalexId}` : `t:${normalizeText(r.title)}`;
}

/**
 * Overlay `next` on `prev`, ignoring fields that are undefined in `next`.
 * A re-check that comes back with fewer fields (for example, Crossref answered
 * but OpenAlex did not, so there is no abstract) must not erase what was known.
 */
export function mergeDefined<T extends object>(prev: T, next: Partial<T>): T {
  const out = { ...prev };
  for (const [k, v] of Object.entries(next) as Array<[keyof T, T[keyof T] | undefined]>) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}
