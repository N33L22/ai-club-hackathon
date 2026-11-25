/**
 * Domain model shared by the browser and the server.
 * Pure types only: no runtime code, no framework imports.
 */

export interface Person {
  family: string;
  given?: string;
}

/** A bibliographic record as returned by a scholarly database (normalised). */
export interface ScholarlyRecord {
  doi?: string; // lower-case, no https://doi.org/ prefix
  openalexId?: string; // e.g. "W2117847125"
  title: string;
  authors: Person[];
  year?: number;
  venue?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  type?: string; // article, review, preprint, book, book-chapter, ...
  url?: string;
  abstract?: string;
  abstractSource?: "openalex" | "crossref";
  isOa?: boolean;
  oaUrl?: string;
  citedBy?: number;
  countries?: string[]; // ISO-3166 alpha-2 codes of author institutions
  language?: string;
  retraction?: RetractionInfo;
  foundIn: Array<"crossref" | "openalex">;
}

export interface RetractionInfo {
  retracted: boolean;
  noticeDoi?: string;
  date?: string;
  flaggedBy: Array<"crossref" | "openalex">;
  /** Other editorial updates (corrections, expressions of concern). */
  updates: Array<{ type: string; doi?: string; date?: string }>;
}

/* ------------------------------------------------------------------ */
/* Verification of a reference (the Verifier: plain code, no AI)       */
/* ------------------------------------------------------------------ */

export type SourceStatus =
  | "verified"
  | "close_match"
  | "not_found"
  | "retracted"
  | "student_added"
  | "pending";

export type StepState = "pass" | "warn" | "fail" | "skip";

export interface CheckStep {
  id: "exists" | "matches" | "retraction";
  state: StepState;
  title: string;
  detail: string;
}

export interface MatchScores {
  title?: number; // 0..1 similarity or coverage
  author?: boolean | null; // null = not provided
  year?: boolean | null;
}

export interface SourceVerification {
  status: SourceStatus;
  steps: CheckStep[];
  reason: string;
  matched?: ScholarlyRecord;
  scores?: MatchScores;
  checkedAt: string;
  confirmedByStudent?: boolean;
}

/** What the student told us about a reference (structured or free text). */
export interface ReferenceInput {
  doi?: string;
  title?: string;
  authors?: Person[];
  year?: number;
  raw?: string; // a pasted reference string
}

/* ------------------------------------------------------------------ */
/* Claims and evidence (the Skeptic: constrained AI + code re-checks)  */
/* ------------------------------------------------------------------ */

export type ClaimVerdict = "supported" | "overreach" | "not_supported" | "unchecked";

export type CheckMode = "ai" | "code" | "sample";

export type TextOrigin = "student_text" | "abstract" | "none";

export interface EvidenceSentence {
  index: number; // 0-based index into the source's sentences
  text: string;
  score?: number;
}

export type ScopeKind = "causal" | "certainty" | "generalisation";

export interface ScopeFlag {
  kind: ScopeKind;
  claimTerm: string;
  evidenceTerm?: string;
  message: string;
}

export interface PatchwritingFlag {
  words: number;
  excerpt: string;
}

export type UncheckedReason =
  | "no_text"
  | "ai_unavailable"
  | "rate_limited"
  | "quote_not_in_source"
  | "invalid_ai_output";

export interface ClaimCheck {
  verdict: ClaimVerdict;
  mode: CheckMode;
  evidence?: EvidenceSentence;
  quoteVerified: boolean;
  candidates: EvidenceSentence[];
  explanation?: string; // the AI's own reasoning: always labelled "AI reasoning"
  scopeFlags: ScopeFlag[];
  patchwriting?: PatchwritingFlag | null;
  directQuote?: { text: string; foundInSource: boolean | null } | null;
  reason?: UncheckedReason;
  textOrigin: TextOrigin;
  model?: string;
  checkedAt: string;
}

/* ------------------------------------------------------------------ */
/* Evidence-backed summary (the assistant role, gap H3)                */
/* ------------------------------------------------------------------ */

export interface SummaryPoint {
  text: string;
  sentences: number[]; // supporting source sentence indexes (0-based)
  grounded: boolean; // code confirmed the link
}

export interface GroundedSummary {
  points: SummaryPoint[];
  mode: CheckMode;
  model?: string;
  textOrigin: TextOrigin;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Scout search plan                                                   */
/* ------------------------------------------------------------------ */

export interface SearchPlan {
  queries: string[];
  keywords: string[];
  fromYear?: number;
  toYear?: number;
  includeReviews: boolean;
  onlyWithAbstract: boolean;
  rationale?: string;
  mode: CheckMode;
  model?: string;
}
