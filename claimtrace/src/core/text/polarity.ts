/**
 * Finding-level negation ("not linked", "no association", "unrelated"): the
 * direction of a finding. Incidental negations ("but not externalizing
 * problems", "compared with no use") are ignored on purpose, so the cue only
 * fires when a finding itself is negated. Used for hints and for the summary
 * grounding check, never on its own to decide a verdict.
 */
const FINDING_TERMS =
  "associat\\w*|link\\w*|relat\\w*|correlat\\w*|significan\\w*|predict\\w*|effects?|impacts?|differ\\w*|chang\\w*|increas\\w*|decreas\\w*|evidence|harm\\w*|benefi\\w*|risks?|influenc\\w*|caus\\w*|affect\\w*|improv\\w*|reduc\\w*";

const FINDING_NEGATION = new RegExp(
  // at most one word between the negation and the finding ("not intrinsically harmful"), so
  // "compared with no use remained significantly associated" does not count as negative
  `(?:\\bnot|n[’']t|\\bnever|\\bneither|\\bnor|\\bno|\\bwithout)\\s+(?:[\\w-]+\\s+)?(?:${FINDING_TERMS})\\b|\\b(?:unrelated|unassociated|non-?significant|insignificant|harmless)\\b`,
  "i",
);

/** The negation cue that makes a finding negative, or null. */
export function negationCue(text: string): string | null {
  const m = text.match(FINDING_NEGATION);
  return m ? m[0].trim() : null;
}

export const isNegated = (text: string): boolean => negationCue(text) !== null;

/** True when exactly one of the two states its finding negatively. */
export function polarityDiffers(a: string, b: string): boolean {
  return isNegated(a) !== isNegated(b);
}
