/**
 * A plausibility check on text the student pastes for a source: does it look
 * like it comes from that paper? It cannot prove where text came from (nothing
 * can), but it catches the obvious bypass of pasting text that merely agrees
 * with a claim. Shown as a warning and in the integrity report; it never
 * blocks the student.
 */
import { stems } from "../text/tokens";

export interface PastedTextMatch {
  related: boolean;
  /** Share of the title's key terms found in the pasted text. */
  titleTerms: number;
  /** Share of the pasted text's key terms that also appear in the abstract (when there is one). */
  abstractOverlap?: number;
}

export function pastedTextMatch(text: string, record: { title: string; abstract?: string }): PastedTextMatch {
  const pasted = new Set(stems(text));
  const title = [...new Set(stems(record.title))];
  const titleTerms = title.length ? title.filter((s) => pasted.has(s)).length / title.length : 0;
  let abstractOverlap: number | undefined;
  if (record.abstract?.trim() && pasted.size) {
    const abs = new Set(stems(record.abstract));
    abstractOverlap = [...pasted].filter((s) => abs.has(s)).length / pasted.size;
  }
  const related = titleTerms >= 0.3 || (abstractOverlap ?? 0) >= 0.25;
  return { related, titleTerms, abstractOverlap };
}
