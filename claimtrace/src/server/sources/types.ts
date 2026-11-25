import type { ScholarlyRecord } from "@/core/types";

export interface SearchOptions {
  fromYear?: number;
  toYear?: number;
  onlyWithAbstract: boolean;
  includeReviews: boolean;
  perPage: number;
}

/**
 * One adapter interface for every scholarly database: fetch by DOI, and
 * optionally search. Add a database (PubMed, arXiv, Semantic Scholar) by
 * implementing this and registering it in sources/index.ts.
 */
export interface SourceConnector {
  readonly name: "crossref" | "openalex";
  byDoi(doi: string): Promise<ScholarlyRecord | null>;
  search?(query: string, opts: SearchOptions): Promise<ScholarlyRecord[]>;
  /** Free-text matching of a pasted reference or a title. */
  match?(text: string, rows: number): Promise<ScholarlyRecord[]>;
}
