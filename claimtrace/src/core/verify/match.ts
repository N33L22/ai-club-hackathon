/**
 * Verifier decision rules (plain code, no AI).
 * Order of evidence: DOI first, then title/author/year comparison.
 * Near-misses become "close_match" (the student confirms) instead of a hard mismatch.
 */
import { THRESHOLDS } from "../config";
import { surnameIn, surnameMatch, titleCoverage, titleSimilarity } from "../text/similarity";
import { normalizeText } from "../text/normalize";
import { contentWords } from "../text/tokens";
import type { MatchScores, ReferenceInput, ScholarlyRecord, SourceStatus } from "../types";

export interface MatchDecision {
  status: Extract<SourceStatus, "verified" | "close_match" | "not_found">;
  scores: MatchScores;
  differences: string[];
  reason: string;
  score: number; // for ranking candidates
}

function yearMatches(a: number | undefined, b: number | undefined): boolean | null {
  if (!a || !b) return null;
  return Math.abs(a - b) <= THRESHOLDS.yearTolerance;
}

function firstAuthorMatch(input: ReferenceInput, record: ScholarlyRecord): { ok: boolean | null; note?: string } {
  const want = input.authors?.[0]?.family;
  if (!want || !record.authors.length) return { ok: null };
  if (surnameMatch(want, record.authors[0].family)) return { ok: true };
  if (record.authors.some((a) => surnameMatch(want, a.family))) {
    return { ok: false, note: `${want} is an author, but not the first author (the record lists ${record.authors[0].family} first)` };
  }
  return { ok: false, note: `first author differs: you have ${want}, the record has ${record.authors[0].family}` };
}

/** Compare a structured reference (title/authors/year, maybe a DOI) with a database record. */
export function decideStructured(input: ReferenceInput, record: ScholarlyRecord, matchedByDoi: boolean): MatchDecision {
  const differences: string[] = [];
  const title = input.title ? titleSimilarity(input.title, record.title) : undefined;
  const author = firstAuthorMatch(input, record);
  const year = yearMatches(input.year, record.year);

  if (author.ok === false && author.note) differences.push(author.note);
  if (year === false) differences.push(`year differs: you have ${input.year}, the record has ${record.year}`);
  if (title !== undefined && title < THRESHOLDS.titleMatch) differences.push(`title is ${Math.round(title * 100)}% similar`);

  const scores: MatchScores = { title, author: author.ok, year };
  const score = (title ?? (matchedByDoi ? 1 : 0)) * 0.7 + (author.ok ? 0.15 : 0) + (year ? 0.15 : 0) - (isNoticeTitle(record.title) ? 0.3 : 0);

  // A DOI with no title to compare is matched by the DOI itself.
  if (title === undefined) {
    if (!matchedByDoi) {
      return { status: "not_found", scores, differences, score, reason: "No title or DOI to compare with a database record." };
    }
    if (differences.length) {
      return { status: "close_match", scores, differences, score, reason: `Matched by DOI, but ${differences.join("; ")}.` };
    }
    return { status: "verified", scores, differences, score, reason: "Matched by DOI." };
  }

  if (title < THRESHOLDS.titleDifferentPaper) {
    return {
      status: "not_found",
      scores,
      differences,
      score,
      reason: matchedByDoi
        ? `The DOI exists but belongs to a different paper: "${record.title}".`
        : "No record with a similar title was found.",
    };
  }
  if (title >= THRESHOLDS.titleMatch && author.ok !== false && year !== false) {
    return { status: "verified", scores, differences, score, reason: matchedByDoi ? "Matched by DOI; title, author and year agree." : "Title, first author and year match the record." };
  }
  return { status: "close_match", scores, differences, score, reason: `Close match: ${differences.join("; ")}. Confirm this is the paper you mean.` };
}

/** Compare a pasted reference string (e.g. copied from a chatbot) with a candidate record. */
export function decideFreeText(rawText: string, record: ScholarlyRecord, matchedByDoi: boolean): MatchDecision {
  const differences: string[] = [];
  // Compare against the reference without the record's own journal name: an editorial whose
  // author or title is the journal must not match just because the reference names that journal.
  const venue = record.venue ? normalizeText(record.venue) : "";
  const raw = venue.split(" ").length >= 2 ? ` ${normalizeText(rawText)} `.split(` ${venue} `).join(" ") : rawText;
  // a reference may quote the title with or without its subtitle
  const main = record.title.split(/[:?]/)[0];
  const coverage = Math.max(titleCoverage(record.title, raw), contentWords(main).length >= 3 ? titleCoverage(main, raw) : 0);
  const firstAuthor = record.authors[0]?.family;
  let author = firstAuthor ? surnameIn(firstAuthor, raw) : null;
  // the first author must also come first: another author of the record listed earlier is an error
  if (author && record.authors.length > 1) {
    const hay = ` ${normalizeText(raw)} `;
    const at = (family: string) => hay.indexOf(` ${normalizeText(family).split(" ").pop()} `);
    const first = at(firstAuthor!);
    const earlier = record.authors.slice(1, 8).find((a) => {
      const p = at(a.family);
      return p !== -1 && first !== -1 && p < first;
    });
    if (earlier) {
      author = false;
      differences.push(`author order differs: the record lists ${firstAuthor} first, your reference lists ${earlier.family} first`);
    }
  }
  const years = (raw.match(/\b(1[89]\d{2}|20\d{2})\b/g) ?? []).map(Number);
  const year = record.year && years.length ? years.some((y) => Math.abs(y - record.year!) <= THRESHOLDS.yearTolerance) : null;

  if (author === false && !differences.some((d) => d.startsWith("author order"))) differences.push(`the record's first author (${firstAuthor}) is not in your reference`);
  if (year === false) differences.push(`year differs: your reference has ${years[0]}, the record has ${record.year}`);
  if (coverage < THRESHOLDS.freeTextVerified) differences.push(`only ${Math.round(coverage * 100)}% of the record's title words appear in your reference`);

  const scores: MatchScores = { title: coverage, author, year };
  const score = coverage * 0.7 + (author ? 0.15 : 0) + (year ? 0.15 : 0) - (isNoticeTitle(record.title) ? 0.3 : 0);

  if (matchedByDoi && coverage < THRESHOLDS.titleDifferentPaper) {
    return { status: "not_found", scores, differences, score, reason: `The DOI exists but belongs to a different paper: "${record.title}".` };
  }
  if (coverage >= THRESHOLDS.freeTextVerified && author === true && year !== false) {
    return { status: "verified", scores, differences, score, reason: matchedByDoi ? "Matched by DOI; title, author and year agree." : "Title, first author and year match a database record." };
  }
  // Title words alone are not evidence of identity (a long reference string shares
  // words with many generic titles). A close match also needs the right author(s),
  // or, for a near-identical title, the right year.
  const sameAuthors = author === true || differences.some((d) => d.startsWith("author order"));
  if ((coverage >= THRESHOLDS.freeTextVerified && (sameAuthors || year === true)) || (coverage >= THRESHOLDS.freeTextClose && sameAuthors)) {
    return { status: "close_match", scores, differences, score, reason: `Close match: ${differences.join("; ") || "some details differ"}. Confirm this is the paper you mean.` };
  }
  return {
    status: "not_found",
    scores,
    differences,
    score,
    reason: coverage >= THRESHOLDS.freeTextClose ? `No database record matches this reference. The closest, "${record.title}", is by different authors.` : "No database record matches this reference.",
  };
}

/** Editorial notices about a paper (not the paper itself) must not win a match. */
const NOTICE = /^\s*(retraction(\s+(note|notice))?\b|notice of retraction|retraction of\b|expression of concern|correction\b|erratum|corrigendum)/i;
export const isNoticeTitle = (title: string) => NOTICE.test(title);

/** Pick the best-scoring candidate. */
export function bestCandidate<T extends { decision: MatchDecision }>(cands: T[]): T | undefined {
  return [...cands].sort((a, b) => b.decision.score - a.decision.score)[0];
}
