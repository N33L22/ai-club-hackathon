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
  /**
   * The AI's quoted evidence must cover at least this share of the source sentence
   * (a short fragment proves the words exist, not what the sentence says), unless
   * the AI also named that exact sentence and quoted at least `quoteMinWords` words of it.
   */
  quoteCoverage: 0.6,
  quoteMinWords: 6,
  /**
   * Evidence must be about the claim: it shares at least this share of the claim's
   * key terms, or it is the sentence code itself ranks most relevant.
   */
  evidenceOverlap: 0.25,
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
  /** References per verify-batch request: small batches finish well inside the route's time limit. */
  batchChunk: 4,
  /** Characters of a claim used as a search question ("Find a better source"). */
  searchQuestionChars: 300,
} as const;
