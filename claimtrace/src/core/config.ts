/**
 * Every tunable threshold in one place, so the evaluation set (eval/) and
 * the "About the checks" page always describe the rules the code really uses.
 */
export const THRESHOLDS = {
  /** Title similarity needed for a structured reference to count as a match. */
  titleMatch: 0.9,
  /** Below this, a DOI is treated as pointing to a different paper. */
  titleDifferentPaper: 0.5,
  /** Coverage of the record's title words inside a pasted reference string. */
  freeTextVerified: 0.85,
  freeTextClose: 0.55,
  /** Publication years may differ by this much (online-first vs print, preprints). */
  yearTolerance: 1,
  /** Name similarity (Jaro-Winkler) for first-author surnames. */
  surnameMatch: 0.9,
  /** A quoted evidence sentence must match the source sentence this closely. */
  quoteMatch: 0.95,
  /** Consecutive words shared with the source that trigger the patchwriting flag. */
  patchwritingWords: 8,
  /** Minimum content-word overlap for a summary sentence to count as grounded. */
  summaryGrounding: 0.3,
} as const;

export const LIMITS = {
  claimChars: 1200,
  sourceTextChars: 20000,
  maxSentences: 80,
  maxQueries: 4,
  searchPerQuery: 12,
  bulkReferences: 40,
} as const;
