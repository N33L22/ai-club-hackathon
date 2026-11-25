/**
 * Persisted entities (stored in the browser by the repository layer).
 */
import type { DocNode } from "./evidence/claims";
import type { ClaimDecision } from "./workflow/gate";
import type {
  ClaimCheck,
  GroundedSummary,
  ReferenceInput,
  ScholarlyRecord,
  SearchPlan,
  SourceVerification,
} from "./types";

export type CitationStyleId = "apa" | "mla" | "harvard" | "ieee" | "vancouver";

export const CITATION_STYLES: Array<{ id: CitationStyleId; name: string; short: string }> = [
  { id: "apa", name: "APA 7th edition", short: "APA 7" },
  { id: "harvard", name: "Harvard (author-date)", short: "Harvard" },
  { id: "mla", name: "MLA 9th edition", short: "MLA 9" },
  { id: "ieee", name: "IEEE", short: "IEEE" },
  { id: "vancouver", name: "Vancouver", short: "Vancouver" },
];

export interface Project {
  id: string;
  title: string;
  question: string;
  style: CitationStyleId;
  createdAt: string;
  updatedAt: string;
  doc: DocNode;
  plan?: SearchPlan;
  planApprovedAt?: string;
  signOff?: { name: string; at: string };
  statementOverride?: string;
  /** Page or paragraph for each direct quotation, keyed by claim key. */
  quotePages?: Record<string, string>;
  isDemo?: boolean;
}

export interface Folder {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
}

export interface LibrarySource {
  id: string;
  projectId: string;
  origin: "database" | "student";
  record: ScholarlyRecord;
  /** What the student (or a chatbot) originally wrote, kept for close-match review. */
  entered?: ReferenceInput;
  verification?: SourceVerification;
  /** Text the student has read and pasted (gap H2). Stays in the browser except when checked. */
  studentText?: string;
  accessedAt?: string;
  folderId?: string;
  tags: string[];
  notes: string;
  summary?: GroundedSummary;
  addedAt: string;
  approvedAt?: string;
}

export type Actor = "student" | "ai:scout" | "ai:skeptic" | "ai:assistant" | "code:verifier" | "code:skeptic" | "system";

export interface AuditEvent {
  id: string;
  projectId: string;
  at: string;
  actor: Actor;
  action: string;
  summary: string;
  model?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface StoredClaimChecks {
  projectId: string;
  bySource: Record<string, ClaimCheck>;
}

export interface StoredDecision extends ClaimDecision {
  projectId: string;
}

/** Text available to check claims against, and where it came from. */
export function checkText(src: LibrarySource): { text: string; origin: "student_text" | "abstract" | "none" } {
  if (src.studentText?.trim()) return { text: src.studentText.trim(), origin: "student_text" };
  if (src.record.abstract?.trim()) return { text: src.record.abstract.trim(), origin: "abstract" };
  return { text: "", origin: "none" };
}
