/** Turns raw verification facts into the three human-readable check rows. */
import type { CheckStep, ScholarlyRecord, ScholarlyService, SourceStatus, SourceVerification } from "../types";
import type { MatchDecision } from "./match";

export const DB_NAMES: Record<ScholarlyService, string> = { crossref: "Crossref", openalex: "OpenAlex" };

export function listDatabases(record: ScholarlyRecord): string {
  return record.foundIn.map((d) => DB_NAMES[d]).join(" and ");
}

const names = (services: ScholarlyService[]) => services.map((s) => DB_NAMES[s]).join(" and ");

export function retractionStep(record: ScholarlyRecord | undefined, failed: ScholarlyService[] = []): CheckStep {
  if (!record) return { id: "retraction", state: "skip", title: "Retraction", detail: "Skipped: no record to check." };
  const r = record.retraction;
  const partial = failed.length ? ` ${names(failed)} could not be reached, so its retraction data was not checked.` : "";
  if (r?.retracted) {
    const by = r.flaggedBy.map((d) => (d === "crossref" ? "Crossref (Retraction Watch data)" : "OpenAlex")).join(" and ");
    const when = r.date ? ` on ${r.date}` : "";
    const notice = r.noticeDoi ? ` Notice: ${r.noticeDoi}.` : "";
    const single = r.flaggedBy.length === 1 ? " Only one database flags it, so check the publisher's page." : "";
    return { id: "retraction", state: "fail", title: "Retracted", detail: `Retracted${when}, flagged by ${by}.${notice}${single}` };
  }
  const notes = r?.updates.filter((u) => u.type !== "retraction") ?? [];
  if (notes.length) {
    const list = notes.map((u) => `${u.type.replace(/_/g, " ")}${u.date ? ` (${u.date})` : ""}`).join(", ");
    return { id: "retraction", state: "warn", title: "Not retracted", detail: `No retraction, but the paper has editorial updates: ${list}.${partial}` };
  }
  const checked = [record.foundIn.includes("crossref") && "Crossref (incl. Retraction Watch)", record.foundIn.includes("openalex") && "OpenAlex"].filter(Boolean).join(" or ");
  return {
    id: "retraction",
    state: failed.length ? "warn" : "pass",
    title: failed.length ? "Partly checked" : "Not retracted",
    detail: `No retraction notice in ${checked || "the record"}.${partial}`,
  };
}

export function buildVerification(
  decision: MatchDecision | undefined,
  record: ScholarlyRecord | undefined,
  opts: { notFoundReason?: string; failed?: ScholarlyService[] } = {},
): SourceVerification {
  const checkedAt = new Date().toISOString();
  const failed = opts.failed?.length ? [...new Set(opts.failed)] : undefined;
  if (!decision || !record) {
    return {
      status: "not_found",
      reason: opts.notFoundReason ?? "No matching record in Crossref or OpenAlex.",
      steps: [
        { id: "exists", state: "fail", title: "Not found", detail: opts.notFoundReason ?? "No matching record in Crossref or OpenAlex." },
        { id: "matches", state: "skip", title: "Details", detail: "Skipped: nothing to compare against." },
        retractionStep(undefined),
      ],
      checkedAt,
    };
  }

  const exists: CheckStep =
    decision.status === "not_found"
      ? { id: "exists", state: "fail", title: "Not found as cited", detail: "No paper matches this reference as written." }
      : { id: "exists", state: "pass", title: "Exists", detail: `Found in ${listDatabases(record)}${record.doi ? ` (DOI ${record.doi})` : ""}.` };

  const matches: CheckStep =
    decision.status === "verified"
      ? { id: "matches", state: "pass", title: "Details match", detail: decision.reason }
      : decision.status === "close_match"
        ? { id: "matches", state: "warn", title: "Close match", detail: decision.reason }
        : { id: "matches", state: "fail", title: "Different paper", detail: decision.reason };

  const retraction = decision.status === "not_found" ? retractionStep(undefined) : retractionStep(record, failed);
  let status: SourceStatus = decision.status;
  if (decision.status !== "not_found" && record.retraction?.retracted) status = "retracted";

  return {
    status,
    reason: status === "retracted" ? retraction.detail : decision.reason,
    steps: [exists, matches, retraction],
    matched: decision.status === "not_found" ? undefined : record,
    scores: decision.scores,
    checkedAt,
    unavailable: failed,
  };
}

/**
 * A lookup that could not finish because a database did not answer. This is
 * never reported as "Not found": that label means both databases answered and
 * neither had the paper. A false "may be invented" is the worst error an
 * integrity tool can make.
 */
export function unavailableVerification(failed: ScholarlyService[], detail?: string): SourceVerification {
  const who = failed.length ? names(failed) : "A database";
  const reason = detail ?? `${who} could not be reached, so ClaimTrace could not finish checking this reference. It is not marked Not found. Check again later.`;
  return {
    status: "unavailable",
    reason,
    steps: [
      { id: "exists", state: "warn", title: "Couldn't check", detail: reason },
      { id: "matches", state: "skip", title: "Details", detail: "Skipped: the lookup did not finish." },
      { id: "retraction", state: "skip", title: "Retraction", detail: "Skipped: the lookup did not finish." },
    ],
    checkedAt: new Date().toISOString(),
    unavailable: failed.length ? [...new Set(failed)] : undefined,
  };
}

/** Student-added sources (web pages, reports without a DOI) are labelled, not verified. */
export function studentAddedVerification(): SourceVerification {
  return {
    status: "student_added",
    reason: "Added by you without a DOI or database record. Not verified.",
    steps: [
      { id: "exists", state: "skip", title: "Not looked up", detail: "Web pages and reports without a DOI are not in Crossref or OpenAlex." },
      { id: "matches", state: "skip", title: "Details", detail: "Entered by you: please double-check the URL, author and date." },
      { id: "retraction", state: "skip", title: "Retraction", detail: "Not applicable." },
    ],
    checkedAt: new Date().toISOString(),
  };
}
