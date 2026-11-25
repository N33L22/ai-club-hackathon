import "server-only";
import { extractDoi } from "@/core/text/normalize";
import type { ReferenceInput, ScholarlyRecord, SourceVerification } from "@/core/types";
import { bestCandidate, decideFreeText, decideStructured, type MatchDecision } from "@/core/verify/match";
import { buildVerification } from "@/core/verify/steps";
import { candidatesFor, lookupDoi, mergeRetraction } from "./sources";

export interface VerifyResult {
  verification: SourceVerification;
  record?: ScholarlyRecord;
  /** For close matches and not-found results: the nearest records, so the student can pick. */
  alternatives: ScholarlyRecord[];
}

function decide(input: ReferenceInput, rec: ScholarlyRecord, byDoi: boolean): MatchDecision {
  return input.raw && !input.title ? decideFreeText(input.raw, rec, byDoi) : decideStructured(input, rec, byDoi);
}

/**
 * The Verifier (plain code, no AI): EXISTS -> MATCHES -> RETRACTION.
 * DOI first; without a DOI, the best Crossref/OpenAlex candidate is compared.
 */
export async function verifyReference(input: ReferenceInput): Promise<VerifyResult> {
  const doi = input.doi ?? extractDoi(input.raw);

  if (doi) {
    const rec = await lookupDoi(doi);
    if (!rec) {
      return {
        verification: buildVerification(undefined, undefined, {
          notFoundReason: `The DOI ${doi} is not registered in Crossref or OpenAlex.`,
        }),
        alternatives: [],
      };
    }
    const decision = decide(input, rec, true);
    return { verification: buildVerification(decision, rec), record: decision.status === "not_found" ? undefined : rec, alternatives: [] };
  }

  const candidates = await candidatesFor(input);
  const scored = candidates.map((rec) => ({ rec, decision: decide(input, rec, false) }));
  const best = bestCandidate(scored);
  const alternatives = scored
    .sort((a, b) => b.decision.score - a.decision.score)
    .slice(0, 3)
    .map((s) => s.rec);

  if (!best || best.decision.status === "not_found") {
    return {
      verification: buildVerification(undefined, undefined, { notFoundReason: "No matching record in Crossref or OpenAlex." }),
      alternatives,
    };
  }
  // Enrich with both databases (abstract, open access, retraction cross-check), but keep
  // the bibliographic fields that were actually matched: a DOI lookup can return a later
  // version of a record (e.g. an arXiv DOI re-dated to its newest version).
  const enriched = best.rec.doi ? await lookupDoi(best.rec.doi) : null;
  const full: ScholarlyRecord = enriched
    ? {
        ...enriched,
        title: best.rec.title,
        authors: best.rec.authors.length ? best.rec.authors : enriched.authors,
        year: best.rec.year ?? enriched.year,
        retraction: mergeRetraction(best.rec.retraction, enriched.retraction),
        foundIn: [...new Set([...best.rec.foundIn, ...enriched.foundIn])],
      }
    : best.rec;
  return { verification: buildVerification(decide(input, full, false), full), record: full, alternatives: alternatives.slice(1) };
}
