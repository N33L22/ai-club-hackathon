/** Turns raw verification facts into the three human-readable check rows. */
import type { CheckStep, ScholarlyRecord, SourceStatus, SourceVerification } from "../types";
import type { MatchDecision } from "./match";

const DB_NAMES = { crossref: "Crossref", openalex: "OpenAlex" } as const;

export function listDatabases(record: ScholarlyRecord): string {
  return record.foundIn.map((d) => DB_NAMES[d]).join(" and ");
}

export function retractionStep(record: ScholarlyRecord | undefined): CheckStep {
  if (!record) return { id: "retraction", state: "skip", title: "Retraction", detail: "Skipped: no record to check." };
  const r = record.retraction;
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
    return { id: "retraction", state: "warn", title: "Not retracted", detail: `No retraction, but the paper has editorial updates: ${list}.` };
  }
  return {
    id: "retraction",
    state: "pass",
    title: "Not retracted",
    detail: `No retraction notice in ${record.foundIn.includes("crossref") ? "Crossref (incl. Retraction Watch)" : "the record"}${record.foundIn.includes("openalex") ? " or OpenAlex" : ""}.`,
  };
}

export function buildVerification(
  decision: MatchDecision | undefined,
  record: ScholarlyRecord | undefined,
  opts: { notFoundReason?: string; doiChecked?: boolean } = {},
): SourceVerification {
  const checkedAt = new Date().toISOString();
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

  const retraction = decision.status === "not_found" ? retractionStep(undefined) : retractionStep(record);
  let status: SourceStatus = decision.status;
  if (decision.status !== "not_found" && record.retraction?.retracted) status = "retracted";

  return {
    status,
    reason: status === "retracted" ? retraction.detail : decision.reason,
    steps: [exists, matches, retraction],
    matched: decision.status === "not_found" ? undefined : record,
    scores: decision.scores,
    checkedAt,
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
