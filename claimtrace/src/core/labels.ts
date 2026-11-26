/**
 * The trust-label vocabulary. Single source of truth for names, meanings,
 * colour tones and how each label affects the export gate.
 * (Icons and colours are mapped in the UI layer: components/trust.)
 *
 * References and claims use different positive labels on purpose:
 * a reference is "Verified" (code matched it to a database record), a claim is
 * "Supported" (the AI judged a source sentence supports it and code confirmed
 * that sentence). They are different kinds of evidence and never share a name.
 */

export type TrustLabel =
  | "verified"
  | "supported"
  | "supported_own_text"
  | "overreach"
  | "not_supported"
  | "unchecked"
  | "ai_reasoning"
  | "not_found"
  | "retracted"
  | "close_match"
  | "student_added"
  | "unavailable"
  | "pending";

export type LabelTone =
  | "green"
  | "lime"
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
  claim: string; // meaning when shown on a claim ("" = not a claim label)
  source: string; // meaning when shown on a reference ("" = not a reference label)
  tone: LabelTone;
  gate: GateLevel;
}

export const LABELS: Record<TrustLabel, LabelSpec> = {
  verified: {
    title: "Verified",
    claim: "",
    source: "A real record in Crossref or OpenAlex, and its authors, title and year match. This is about the reference, not about what it says.",
    tone: "green",
    gate: "ok",
  },
  supported: {
    title: "Supported",
    claim:
      "The AI judged that a sentence in the source's abstract states this, and code confirmed that whole sentence is in the source and shares the claim's key terms. It means the sentence was found, not that the claim is true.",
    source: "",
    tone: "green",
    gate: "ok",
  },
  supported_own_text: {
    title: "Supported · your text",
    claim:
      "Supported by text you pasted yourself, not by an abstract from a database. Acknowledge it to confirm the text comes from the cited source; your supervisor sees where the evidence came from.",
    source: "",
    tone: "lime",
    gate: "acknowledge",
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
    claim: "The reference is real, but there was no text to check the claim against, or the AI check was unavailable. Never shown as Supported.",
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
    source: "Crossref and OpenAlex both answered, and neither has a matching record, or the DOI belongs to a different paper.",
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
    claim: "The cited reference differs from the closest database record. Compare and confirm it before relying on it.",
    source: "A record was found but some details differ. Compare them and confirm it is the paper you mean.",
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
  unavailable: {
    // "Not yet verified" is the hackathon brief's wording for a reference whose live check did not work
    title: "Not yet verified",
    claim: "Couldn't check: a database could not be reached when the cited reference was checked, so it is not yet verified. Check the reference again later.",
    source: "Couldn't check: Crossref or OpenAlex could not be reached, so this reference is not yet verified. It is never reported as Not found. Check it again later.",
    tone: "blue",
    gate: "acknowledge",
  },
  pending: {
    title: "Not yet checked",
    claim: "Run the checks to see whether the source supports this claim.",
    source: "Checking against Crossref and OpenAlex…",
    tone: "neutral",
    gate: "pending",
  },
};

/** The meaning of a label in a context, falling back to the other context. */
export function labelMeaning(label: TrustLabel, context: "claim" | "source"): string {
  const spec = LABELS[label];
  return (context === "source" ? spec.source || spec.claim : spec.claim || spec.source) || "";
}

/** Labels a claim can carry, in the order the review filters show them. */
export const CLAIM_LABEL_ORDER: TrustLabel[] = [
  "retracted",
  "not_found",
  "not_supported",
  "overreach",
  "close_match",
  "unavailable",
  "unchecked",
  "student_added",
  "supported_own_text",
  "supported",
  "pending",
];

export const SOURCE_LABEL_ORDER: TrustLabel[] = [
  "retracted",
  "not_found",
  "close_match",
  "unavailable",
  "student_added",
  "verified",
  "pending",
];
