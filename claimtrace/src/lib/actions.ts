"use client";

/**
 * Application services: one function per workflow step. Each one calls the
 * API, updates the store and writes the audit log, so components stay thin
 * and every AI output and student decision is recorded.
 */
import { inTextLabel, shortRef } from "@/core/citation/csl";
import type { DraftClaim } from "@/core/evidence/claims";
import { LABELS } from "@/core/labels";
import { checkText, type LibrarySource } from "@/core/model";
import type { ClaimCheck, ReferenceInput, ScholarlyRecord, SearchPlan } from "@/core/types";
import { studentAddedVerification } from "@/core/verify/steps";
import type { DecisionAction } from "@/core/workflow/gate";
import { sourceLabel } from "@/core/workflow/labels";
import { api } from "./api";
import { useStore } from "./store";

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

export async function verifySource(sourceId: string): Promise<void> {
  const src = S().sources[sourceId];
  if (!src) return;
  if (src.origin === "student") {
    S().setVerification(sourceId, studentAddedVerification());
    return;
  }
  const r = src.record;
  const input: ReferenceInput = src.entered ?? { doi: r.doi, title: r.title, authors: r.authors.slice(0, 3), year: r.year };
  const res = await api.verify(input);
  S().setVerification(sourceId, res.verification, res.record);
  S().log({
    projectId: src.projectId,
    actor: "code:verifier",
    action: "source.verified",
    summary: `${shortRef(S().sources[sourceId])}: ${LABELS[sourceLabel(res.verification)].title}. ${res.verification.reason}`,
    meta: { status: res.verification.status },
  });
}

export function saveRecords(projectId: string, records: ScholarlyRecord[], folderId?: string): string[] {
  const at = new Date().toISOString();
  const existing = new Set(
    Object.values(S().sources)
      .filter((s) => s.projectId === projectId)
      .map((s) => s.record.doi ?? s.record.openalexId ?? s.record.title),
  );
  const ids: string[] = [];
  for (const rec of records) {
    const key = rec.doi ?? rec.openalexId ?? rec.title;
    if (existing.has(key)) continue;
    ids.push(S().addSource({ projectId, origin: "database", record: rec, folderId, approvedAt: at }));
  }
  if (ids.length) {
    S().log({ projectId, actor: "student", action: "source.saved", summary: `Approved and saved ${ids.length} source${ids.length === 1 ? "" : "s"} to the library. Checkpoint 1.` });
  }
  // verify in the background, a few at a time
  void runPool(ids, 3, (id) => verifySource(id).catch(() => undefined));
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
  const { summary } = await api.summary({ title: src.record.title, text, textOrigin: origin });
  S().setSummary(sourceId, summary);
  S().log({
    projectId: src.projectId,
    actor: summary.mode === "ai" ? "ai:assistant" : "system",
    action: "summary.generated",
    summary: `${summary.mode === "ai" ? "Assistant explained" : "Code extracted key sentences from"} ${shortRef(src)}: ${summary.points.filter((p) => p.grounded).length} of ${summary.points.length} points linked to the source.`,
    model: summary.model,
  });
}

/* ----------------------- Steps 5 and 6: verify and challenge --------------- */

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
      ({ check } = await api.checkClaim({ claim: claim.text, citedAs, text, textOrigin: origin }));
    }
    S().setClaimCheck(projectId, claim.key, sid, check);
    S().log({
      projectId,
      actor: check.mode === "ai" ? "ai:skeptic" : "code:skeptic",
      action: "claim.checked",
      summary: `"${claim.text.slice(0, 90)}${claim.text.length > 90 ? "…" : ""}" against ${shortRef(src)}: ${check.verdict.replace("_", " ")}${check.mode === "code" ? ` (${check.reason === "no_text" ? "no text to check" : "AI unavailable"})` : ""}.`,
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
