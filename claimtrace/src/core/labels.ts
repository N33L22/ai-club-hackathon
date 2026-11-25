/**
 * The trust-label vocabulary. Single source of truth for names, meanings,
 * colour tones and how each label affects the export gate.
 * (Icons and colours are mapped in the UI layer: components/trust.)
 */

export type TrustLabel =
  | "verified"
  | "overreach"
  | "not_supported"
  | "unchecked"
  | "ai_reasoning"
  | "not_found"
  | "retracted"
  | "close_match"
  | "student_added"
  | "pending";

export type LabelTone =
  | "green"
  | "amber"
  | "orange"
  | "blue"
  | "violet"
  | "rose"
  | "crimson"
  | "slate"
  | "neutral";

/** How a label affects the export gate (checkpoints 2 and 3). */
export type GateLevel = "ok" | "acknowledge" | "decide" | "pending";

export interface LabelSpec {
  title: string;
  claim: string; // meaning when shown on a claim
  source: string; // meaning when shown on a reference
  tone: LabelTone;
  gate: GateLevel;
}

export const LABELS: Record<TrustLabel, LabelSpec> = {
  verified: {
    title: "Verified",
    claim: "The supporting sentence was found in the source and confirmed by code. It means the sentence was found, not that the claim is true.",
    source: "A real record in Crossref or OpenAlex, and its authors, title and year match.",
    tone: "green",
    gate: "ok",
  },
  overreach: {
    title: "Overreach",
    claim: "The source is related, but the claim goes further than it does (for example, causal wording for an association).",
    source: "",
    tone: "amber",
    gate: "decide",
  },
  not_supported: {
    title: "Not supported",
    claim: "The source text does not say this.",
    source: "",
    tone: "orange",
    gate: "decide",
  },
  unchecked: {
    title: "Unchecked",
    claim: "The reference is real, but there was no text to check the claim against, or the AI check was unavailable. Never shown as Verified.",
    source: "",
    tone: "blue",
    gate: "acknowledge",
  },
  ai_reasoning: {
    title: "AI reasoning",
    claim: "The AI's own wording or inference. It is not backed by a source sentence.",
    source: "",
    tone: "violet",
    gate: "ok",
  },
  not_found: {
    title: "Not found",
    claim: "The cited reference has no matching record, so the claim cannot be traced.",
    source: "No matching record in Crossref or OpenAlex, or the DOI belongs to a different paper.",
    tone: "rose",
    gate: "decide",
  },
  retracted: {
    title: "Retracted",
    claim: "The cited paper has been retracted, so it should not be used as evidence.",
    source: "The paper exists but has been retracted.",
    tone: "crimson",
    gate: "decide",
  },
  close_match: {
    title: "Close match",
    claim: "The cited reference differs from the closest database record. Confirm it before relying on it.",
    source: "A record was found but some details differ. Confirm it is the paper you mean.",
    tone: "amber",
    gate: "decide",
  },
  student_added: {
    title: "Student-added",
    claim: "Cites a source you added without a database record. Not verified.",
    source: "Added by you without a DOI or database record. Not verified.",
    tone: "slate",
    gate: "acknowledge",
  },
  pending: {
    title: "Not checked yet",
    claim: "Run the checks to see whether the source supports this claim.",
    source: "Checking against Crossref and OpenAlex…",
    tone: "neutral",
    gate: "pending",
  },
};

/** Labels a claim can carry, in the order the review filters show them. */
export const CLAIM_LABEL_ORDER: TrustLabel[] = [
  "retracted",
  "not_found",
  "not_supported",
  "overreach",
  "close_match",
  "unchecked",
  "student_added",
  "verified",
  "pending",
];

export const SOURCE_LABEL_ORDER: TrustLabel[] = [
  "retracted",
  "not_found",
  "close_match",
  "student_added",
  "verified",
  "pending",
];
