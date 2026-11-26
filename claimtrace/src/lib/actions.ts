"use client";

/**
 * Application services: one function per workflow step. Each one calls the
 * API, updates the store and writes the audit log, so components stay thin
 * and every AI output and student decision is recorded.
 */
import { inTextLabel, shortRef } from "@/core/citation/csl";
import { LIMITS } from "@/core/config";
import type { DraftClaim } from "@/core/evidence/claims";
import { LABELS } from "@/core/labels";
import { checkText, type LibrarySource } from "@/core/model";
import { recordKey } from "@/core/records";
import type { ClaimCheck, ReferenceInput, ScholarlyRecord, SearchPlan } from "@/core/types";
import { parseReferenceText } from "@/core/verify/reference-text";
import { studentAddedVerification } from "@/core/verify/steps";
import type { DecisionAction } from "@/core/workflow/gate";
import { sourceLabel } from "@/core/workflow/labels";
import { api, ApiError, type BatchItem } from "./api";
import { useStore } from "./store";

/** Text for a check, shortened to what the API accepts; the original length lets the server say what was left out. */
function textForCheck(text: string): { text: string; textChars?: number } {
  return text.length > LIMITS.sourceTextChars ? { text: text.slice(0, LIMITS.sourceTextChars), textChars: text.length } : { text };
}

const S = () => useStore.getState();

/* ------------------------------ Step 2: Scout ------------------------------ */

export async function generatePlan(projectId: string, question: string): Promise<SearchPlan> {
  const { plan } = await api.plan(question);
  S().log({
    projectId,
    actor: plan.mode === "ai" ? "ai:scout" : "system",
    action: "plan.generated",
    summary: plan.mode === "ai" ? `Scout proposed ${plan.queries.length} search queries.` : "Code built a search plan from the question (AI offline).",
    model: plan.model,
    meta: { queries: plan.queries.join(" | ") },
  });
  return plan;
}

export function approvePlan(projectId: string, plan: SearchPlan) {
  S().updateProject(projectId, { plan, planApprovedAt: new Date().toISOString() });
  S().log({ projectId, actor: "student", action: "plan.approved", summary: `Approved the search plan (${plan.queries.length} queries). Checkpoint 1.`, meta: { queries: plan.queries.join(" | ") } });
}

/* --------------------------- Step 3: library ------------------------------- */

/**
 * Re-runs the Verifier for a library source. If the databases cannot be
 * reached, an earlier finished result is kept (a failed re-check must not
 * replace "Verified" or "Retracted" with "Couldn't check").
 */
export async function verifySource(sourceId: string): Promise<"updated" | "kept_previous"> {
  const src = S().sources[sourceId];
  if (!src) return "updated";
  if (src.origin === "student") {
    S().setVerification(sourceId, studentAddedVerification());
    return "updated";
  }
  const r = src.record;
  const input: ReferenceInput = src.entered ?? { doi: r.doi, title: r.title, authors: r.authors.slice(0, 3), year: r.year };
  const res = await api.verify(input);
  const previous = src.verification;
  if (res.verification.status === "unavailable" && previous && previous.status !== "unavailable") {
    S().log({
      projectId: src.projectId,
      actor: "code:verifier",
      action: "source.recheck_unavailable",
      summary: `${shortRef(src)}: could not re-check (${res.verification.reason}) The earlier result (${LABELS[sourceLabel(previous)].title}) was kept.`,
    });
    return "kept_previous";
  }
  S().setVerification(sourceId, res.verification, res.record);
  S().log({
    projectId: src.projectId,
    actor: "code:verifier",
    action: "source.verified",
    summary: `${shortRef(S().sources[sourceId])}: ${LABELS[sourceLabel(res.verification)].title}. ${res.verification.reason}`,
    meta: { status: res.verification.status },
  });
  return "updated";
}

/** Sources whose check is running in this tab (so a resume never runs one twice). */
const inFlight = new Set<string>();

async function verifyOnce(sourceId: string): Promise<void> {
  if (inFlight.has(sourceId)) return;
  inFlight.add(sourceId);
  try {
    await verifySource(sourceId);
  } catch {
    // stays "Not checked yet"; it is retried on the next load
  } finally {
    inFlight.delete(sourceId);
  }
}

/**
 * Checks started in the background stop if the page is closed or reloaded,
 * which would leave a source "Not checked yet" for good. Called once the
 * saved data has loaded: resumes every unfinished check, a few at a time.
 */
export function resumePendingVerifications(): number {
  const pending = Object.values(S().sources).filter((s) => !s.verification && s.origin === "database" && !inFlight.has(s.id));
  void runPool(pending.map((s) => s.id), 2, verifyOnce);
  return pending.length;
}

export function saveRecords(projectId: string, records: ScholarlyRecord[], folderId?: string): string[] {
  const at = new Date().toISOString();
  const existing = new Set(
    Object.values(S().sources)
      .filter((s) => s.projectId === projectId)
      .map((s) => recordKey(s.record)),
  );
  const ids: string[] = [];
  for (const rec of records) {
    const key = recordKey(rec);
    if (existing.has(key)) continue;
    existing.add(key);
    ids.push(S().addSource({ projectId, origin: "database", record: rec, folderId, approvedAt: at }));
  }
  if (ids.length) {
    S().log({ projectId, actor: "student", action: "source.saved", summary: `Approved and saved ${ids.length} source${ids.length === 1 ? "" : "s"} to the library. Checkpoint 1.` });
  }
  // verify in the background, a few at a time (resumed on the next load if the page closes first)
  void runPool(ids, 3, verifyOnce);
  return ids;
}

export function addEnteredReference(projectId: string, entered: ReferenceInput, record: ScholarlyRecord | undefined, verification: LibrarySource["verification"], folderId?: string): string {
  const rec: ScholarlyRecord = record ?? {
    title: entered.title ?? entered.raw ?? "Untitled reference",
    authors: entered.authors ?? [],
    year: entered.year,
    doi: entered.doi,
    foundIn: [],
  };
  // never two entries for one paper: the entry already in the library is kept. A reference counts as its
  // record's paper only when it resolved to it; otherwise only the very same text is a duplicate.
  const status: string = verification?.status ?? "";
  const key = record && ["verified", "close_match", "retracted"].includes(status) ? recordKey(record) : recordKey({ title: rec.title });
  const existing = Object.values(S().sources).find((s) => s.projectId === projectId && (recordKey(s.record) === key || recordKey({ title: s.record.title }) === key));
  if (existing) return existing.id;
  const id = S().addSource({ projectId, origin: "database", record: rec, entered, verification, folderId, approvedAt: new Date().toISOString() });
  S().log({
    projectId,
    actor: "student",
    action: "source.added",
    summary: `Added ${shortRef(S().sources[id])} (${verification ? LABELS[sourceLabel(verification)].title : "checking"}).`,
  });
  return id;
}

export function addWebSource(projectId: string, input: { title: string; author: string; year?: number; url: string; site?: string; accessed: string }, folderId?: string): string {
  const id = S().addSource({
    projectId,
    origin: "student",
    record: {
      title: input.title.trim(),
      authors: input.author.trim() ? [{ family: input.author.trim() }] : [],
      year: input.year,
      url: input.url.trim(),
      venue: input.site?.trim() || undefined,
      type: "webpage",
      foundIn: [],
    },
    verification: studentAddedVerification(),
    accessedAt: input.accessed,
    folderId,
    approvedAt: new Date().toISOString(),
  });
  S().log({ projectId, actor: "student", action: "source.added", summary: `Added the web source "${input.title.trim()}" (student-added, not verified).` });
  return id;
}

export function confirmCloseMatch(sourceId: string) {
  const src = S().sources[sourceId];
  if (!src?.verification) return;
  S().setVerification(sourceId, { ...src.verification, confirmedByStudent: true });
  S().log({ projectId: src.projectId, actor: "student", action: "source.confirmed", summary: `Confirmed the close match for ${shortRef(src)}.` });
}

export function removeSource(sourceId: string) {
  const src = S().sources[sourceId];
  if (!src) return;
  S().removeSource(sourceId);
  S().log({ projectId: src.projectId, actor: "student", action: "source.removed", summary: `Removed ${shortRef(src)} from the library.` });
}

export function saveStudentText(sourceId: string, text: string) {
  const src = S().sources[sourceId];
  if (!src) return;
  S().setStudentText(sourceId, text);
  S().log({
    projectId: src.projectId,
    actor: "student",
    action: "source.text_added",
    summary: text.trim() ? `Added text they had read for ${shortRef(src)} (${text.trim().split(/\s+/).length} words).` : `Removed their pasted text for ${shortRef(src)}.`,
  });
}

export async function explainSource(sourceId: string): Promise<void> {
  const src = S().sources[sourceId];
  if (!src) return;
  const { text, origin } = checkText(src);
  if (!text) return;
  const { summary } = await api.summary({ title: src.record.title, ...textForCheck(text), textOrigin: origin });
  S().setSummary(sourceId, summary);
  S().log({
    projectId: src.projectId,
    actor: summary.mode === "ai" ? "ai:assistant" : "system",
    action: "summary.generated",
    summary: `${summary.mode === "ai" ? "Assistant explained" : "Code extracted key sentences from"} ${shortRef(src)}: ${summary.points.filter((p) => p.grounded).length} of ${summary.points.length} points linked to the source.`,
    model: summary.model,
  });
}

/**
 * Checks a pasted reference list a few references per request, so every request
 * finishes well inside the server's time limit and results arrive as they are
 * ready. A failed request marks only its own references, never as "Not found".
 */
export async function verifyReferenceList(refs: string[], onBatch?: (items: BatchItem[], done: number) => void): Promise<BatchItem[]> {
  const out: BatchItem[] = [];
  for (let i = 0; i < refs.length; i += LIMITS.batchChunk) {
    const chunk = refs.slice(i, i + LIMITS.batchChunk);
    try {
      const { results } = await api.verifyBatch(chunk);
      out.push(...results);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Lookup failed";
      out.push(...chunk.map((raw) => ({ raw, parsed: parseReferenceText(raw), error: `Not checked: ${message}` })));
    }
    onBatch?.([...out], Math.min(i + LIMITS.batchChunk, refs.length));
  }
  return out;
}

/* ----------------------- Steps 5 and 6: verify and challenge --------------- */

const UNCHECKED_LOG: Record<NonNullable<ClaimCheck["reason"]>, string> = {
  no_text: "no text to check",
  ai_unavailable: "AI unavailable",
  rate_limited: "AI rate limit reached",
  quote_not_in_source: "the AI's evidence was not a sentence of the source",
  evidence_not_relevant: "the AI's evidence sentence was not about the claim",
  invalid_ai_output: "the AI reply was malformed",
};

export async function checkClaim(projectId: string, claim: DraftClaim): Promise<void> {
  const state = S();
  const project = state.projects[projectId];
  for (const sid of claim.sourceIds) {
    const src = state.sources[sid];
    if (!src) continue;
    const label = sourceLabel(src.verification);
    if (label === "not_found" || label === "retracted" || label === "pending") continue; // the reference itself decides the label
    const { text, origin } = checkText(src);
    let check: ClaimCheck;
    if (!text) {
      check = { verdict: "unchecked", mode: "code", reason: "no_text", candidates: [], scopeFlags: [], quoteVerified: false, textOrigin: "none", checkedAt: new Date().toISOString() };
    } else {
      const citedAs = `${inTextLabel(src, project?.style ?? "apa")} "${src.record.title}"`;
      ({ check } = await api.checkClaim({ claim: claim.text, citedAs, ...textForCheck(text), textOrigin: origin }));
    }
    S().setClaimCheck(projectId, claim.key, sid, check);
    S().log({
      projectId,
      actor: check.mode === "ai" ? "ai:skeptic" : "code:skeptic",
      action: "claim.checked",
      summary: `"${claim.text.slice(0, 90)}${claim.text.length > 90 ? "…" : ""}" against ${shortRef(src)}${origin === "student_text" ? " (text the student pasted)" : ""}: ${check.verdict.replace("_", " ")}${check.reason ? ` (${UNCHECKED_LOG[check.reason]})` : ""}.`,
      model: check.model,
      meta: { verdict: check.verdict, quoteVerified: check.quoteVerified, claim: claim.key },
    });
  }
}

export async function checkClaims(projectId: string, claims: DraftClaim[], onProgress?: (done: number) => void): Promise<void> {
  let done = 0;
  await runPool(claims, 2, async (c) => {
    await checkClaim(projectId, c).catch(() => undefined);
    onProgress?.(++done);
  });
}

/* ---------------------------- Step 7: decide -------------------------------- */

export function decide(projectId: string, claim: DraftClaim, label: keyof typeof LABELS, action: DecisionAction, reason?: string) {
  S().setDecision(projectId, claim.key, { action, reason, label, at: new Date().toISOString() });
  S().log({
    projectId,
    actor: "student",
    action: "claim.decision",
    summary:
      action === "acknowledge"
        ? `Acknowledged that "${claim.text.slice(0, 80)}" is ${LABELS[label].title.toLowerCase()}.`
        : `Kept the ${LABELS[label].title.toLowerCase()} claim "${claim.text.slice(0, 80)}" with the reason: ${reason}`,
    meta: { decision: action, label, claim: claim.key },
  });
}

export function undoDecision(projectId: string, claim: DraftClaim) {
  S().setDecision(projectId, claim.key, null);
  S().log({ projectId, actor: "student", action: "claim.decision_undone", summary: `Reopened "${claim.text.slice(0, 80)}" for review.` });
}

export function logIntent(projectId: string, claim: DraftClaim, intent: "edit" | "replace" | "remove") {
  const verb = { edit: "chose to edit", replace: "looked for a better source for", remove: "removed the citation from" }[intent];
  S().log({ projectId, actor: "student", action: `claim.${intent}`, summary: `${verb[0].toUpperCase()}${verb.slice(1)} "${claim.text.slice(0, 80)}".`, meta: { claim: claim.key } });
}

export function signOff(projectId: string, name: string) {
  S().updateProject(projectId, { signOff: { name: name.trim(), at: new Date().toISOString() } });
  S().log({ projectId, actor: "student", action: "export.signed_off", summary: `${name.trim()} signed off the final check. Checkpoint 3.` });
}

export function revokeSignOff(projectId: string) {
  S().updateProject(projectId, { signOff: undefined });
}

/* ------------------------------- helpers ----------------------------------- */

export async function runPool<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  });
  await Promise.all(workers);
}
