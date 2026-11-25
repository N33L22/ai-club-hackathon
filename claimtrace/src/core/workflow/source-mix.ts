/**
 * Source-mix statistics (ethics: biased or narrow sources). Descriptive only:
 * there is deliberately no single "credibility score".
 */
import type { ScholarlyRecord } from "../types";

export interface MixInput {
  year?: number;
  type?: string;
  isOa?: boolean;
  countries?: string[];
  venue?: string;
  hasText: boolean;
  origin: "database" | "student";
}

export interface SourceMix {
  total: number;
  years: Array<{ label: string; count: number }>;
  medianYear?: number;
  oldest?: number;
  newest?: number;
  openAccess: { open: number; closed: number; unknown: number };
  types: Array<{ label: string; count: number }>;
  countries: Array<{ code: string; count: number }>;
  countryCoverage: number; // sources with at least one known country
  withText: number;
  studentAdded: number;
  notes: string[];
}

const TYPE_NAMES: Record<string, string> = {
  article: "Journal article",
  review: "Review",
  preprint: "Preprint",
  "posted-content": "Preprint",
  book: "Book",
  "book-chapter": "Book chapter",
  dissertation: "Thesis",
  report: "Report",
  webpage: "Web page",
  "proceedings-article": "Conference paper",
};

function tally(values: string[]): Array<{ label: string; count: number }> {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function computeSourceMix(items: MixInput[], now = new Date()): SourceMix {
  const years = items.map((i) => i.year).filter((y): y is number => !!y).sort((a, b) => a - b);
  const thisYear = now.getUTCFullYear();
  const buckets: Array<[string, (y: number) => boolean]> = [
    ["Before 2010", (y) => y < 2010],
    ["2010–14", (y) => y >= 2010 && y <= 2014],
    ["2015–19", (y) => y >= 2015 && y <= 2019],
    ["2020–24", (y) => y >= 2020 && y <= 2024],
    [`2025–${String(thisYear).slice(2)}`, (y) => y >= 2025],
  ];
  const yearBuckets = buckets.map(([label, f]) => ({ label, count: years.filter(f).length }));

  const countries = tally(items.flatMap((i) => [...new Set(i.countries ?? [])])).map((c) => ({ code: c.label, count: c.count }));
  const withCountry = items.filter((i) => i.countries?.length).length;
  const oa = {
    open: items.filter((i) => i.isOa === true).length,
    closed: items.filter((i) => i.isOa === false).length,
    unknown: items.filter((i) => i.isOa === undefined).length,
  };
  const types = tally(items.map((i) => TYPE_NAMES[i.type ?? ""] ?? (i.origin === "student" ? "Web page / other" : "Other")));

  const notes: string[] = [];
  const total = items.length;
  if (total >= 3) {
    if (years.length && years.filter((y) => y >= thisYear - 5).length === 0) notes.push("None of your sources are from the last five years.");
    if (years.length >= 3 && years.filter((y) => y < thisYear - 15).length / years.length > 0.5) notes.push("Most of your sources are more than 15 years old.");
    if (countries.length && withCountry >= 3 && countries[0].count / withCountry > 0.75)
      notes.push(`Most of your sources come from authors in one country (${countries[0].code}). Consider other settings.`);
    if (types.length === 1 && total >= 4) notes.push("All your sources are the same type. A review or a primary study could add balance.");
    if (oa.closed > 0 && oa.closed / total > 0.6) notes.push("Most of your sources are not open access, so their full text may be hard to check.");
    if (items.filter((i) => !i.hasText).length / total > 0.4) notes.push("Many sources have no abstract or text to check claims against. Paste text you have read to check them.");
  }

  return {
    total,
    years: yearBuckets,
    medianYear: years.length ? years[Math.floor(years.length / 2)] : undefined,
    oldest: years[0],
    newest: years[years.length - 1],
    openAccess: oa,
    types,
    countries: countries.slice(0, 8),
    countryCoverage: withCountry,
    withText: items.filter((i) => i.hasText).length,
    studentAdded: items.filter((i) => i.origin === "student").length,
    notes,
  };
}

export function mixInputFromRecord(r: Partial<ScholarlyRecord>, origin: "database" | "student", hasText: boolean): MixInput {
  return { year: r.year, type: r.type, isOa: r.isOa, countries: r.countries, venue: r.venue, hasText, origin };
}
