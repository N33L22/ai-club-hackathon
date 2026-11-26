import "server-only";
import { mergeDefined } from "@/core/records";
import { extractDoi } from "@/core/text/normalize";
import type { ReferenceInput, ScholarlyRecord, ScholarlyService, SourceVerification } from "@/core/types";
import { bestCandidate, decideFreeText, decideStructured, type MatchDecision } from "@/core/verify/match";
import { buildVerification, DB_NAMES, unavailableVerification } from "@/core/verify/steps";
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

const both = (failed: ScholarlyService[]) => failed.length === 2;

/**
 * The Verifier (plain code, no AI): EXISTS -> MATCHES -> RETRACTION.
 * DOI first; without a DOI, the best Crossref/OpenAlex candidate is compared.
 * "Not found" requires that the databases answered; if one did not, and the
 * other has no match, the result is "Couldn't check".
 */
export async function verifyReference(input: ReferenceInput): Promise<VerifyResult> {
  const doi = input.doi ?? extractDoi(input.raw);

  if (doi) {
    const { record: rec, failed } = await lookupDoi(doi);
    if (!rec) {
      if (failed.length) {
        const answered = (["crossref", "openalex"] as const).filter((s) => !failed.includes(s));
        return {
          verification: unavailableVerification(
            failed,
            both(failed)
              ? `Crossref and OpenAlex could not be reached, so the DOI ${doi} was not checked. This is not a Not found result. Check again later.`
              : `${answered.map((s) => DB_NAMES[s]).join(" and ")} has no record of the DOI ${doi}, but ${failed.map((s) => DB_NAMES[s]).join(" and ")} could not be reached, so the check did not finish. Check again later.`,
          ),
          alternatives: [],
        };
      }
      return {
        verification: buildVerification(undefined, undefined, { notFoundReason: `The DOI ${doi} is not registered in Crossref or OpenAlex.` }),
        alternatives: [],
      };
    }
    const decision = decide(input, rec, true);
    return { verification: buildVerification(decision, rec, { failed }), record: decision.status === "not_found" ? undefined : rec, alternatives: [] };
  }

  const { records: candidates, failed } = await candidatesFor(input);
  const scored = candidates.map((rec) => ({ rec, decision: decide(input, rec, false) }));
  const best = bestCandidate(scored);
  const alternatives = scored
    .sort((a, b) => b.decision.score - a.decision.score)
    .slice(0, 3)
    .map((s) => s.rec);

  if (!best || best.decision.status === "not_found") {
    if (failed.length) {
      return {
        verification: unavailableVerification(
          failed,
          both(failed)
            ? "Crossref and OpenAlex could not be reached, so this reference was not checked. This is not a Not found result. Check again later."
            : `No match in ${DB_NAMES[failed[0] === "crossref" ? "openalex" : "crossref"]}, but ${DB_NAMES[failed[0]]} could not be reached, so the check did not finish. Check again later.`,
        ),
        alternatives,
      };
    }
    const closest = best?.decision.reason.match(/The closest.*$/)?.[0];
    return {
      verification: buildVerification(undefined, undefined, { notFoundReason: `No matching record in Crossref or OpenAlex.${closest ? ` ${closest}` : ""}` }),
      alternatives,
    };
  }
  // Enrich with both databases (abstract, open access, retraction cross-check), but keep
  // the bibliographic fields that were actually matched: a DOI lookup can return a later
  // version of a record (e.g. an arXiv DOI re-dated to its newest version).
  const enrichment = best.rec.doi ? await lookupDoi(best.rec.doi) : { record: null, failed: [] as ScholarlyService[] };
  const enriched = enrichment.record;
  const full: ScholarlyRecord = enriched
    ? mergeDefined(enriched, {
        title: best.rec.title,
        authors: best.rec.authors.length ? best.rec.authors : enriched.authors,
        year: best.rec.year ?? enriched.year,
        retraction: mergeRetraction(best.rec.retraction, enriched.retraction),
        foundIn: [...new Set([...best.rec.foundIn, ...enriched.foundIn])],
        abstract: enriched.abstract ?? best.rec.abstract,
      })
    : best.rec;
  // a database that failed during the search but answered during enrichment did its job
  const stillFailed = [...new Set([...failed.filter((s) => !full.foundIn.includes(s)), ...enrichment.failed])];
  return {
    verification: buildVerification(decide(input, full, false), full, { failed: stillFailed }),
    record: full,
    alternatives: alternatives.slice(1),
  };
}
