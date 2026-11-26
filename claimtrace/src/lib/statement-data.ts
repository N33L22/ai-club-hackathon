"use client";

import { shortRef } from "@/core/citation/csl";
import { LABELS } from "@/core/labels";
import type { AuditEvent, LibrarySource, Project } from "@/core/model";
import { sourceLabel } from "@/core/workflow/labels";
import type { StatementInput } from "@/core/workflow/statement";
import type { ResolvedClaim } from "./hooks";

/** Builds the AI-use statement inputs from what actually happened (audit log + current labels). */
export function statementInput(project: Project, sources: LibrarySource[], claims: ResolvedClaim[], audit: AuditEvent[], fallbackModel?: { model: string; provider: string }): StatementInput {
  const events = audit.filter((e) => e.projectId === project.id);
  const ai = events.filter((e) => e.actor.startsWith("ai:"));
  const model = ai.find((e) => e.model)?.model ?? (ai.length ? fallbackModel?.model : undefined);
  const count = (pred: (e: AuditEvent) => boolean) => events.filter(pred).length;
  const confirmedClose = (s: LibrarySource) => s.verification?.status === "close_match" && Boolean(s.verification.confirmedByStudent);
  const labels = sources.map((s) => sourceLabel(s.verification));
  const n = (l: string) => labels.filter((x) => x === l).length;
  const claimChecks = claims.flatMap((c) => c.checks).filter(Boolean);
  const claimsWith = (...ls: string[]) => claims.filter((c) => ls.includes(c.label)).length;

  return {
    model,
    provider: model ? (fallbackModel?.provider ?? "NVIDIA NIM") : undefined,
    uses: {
      scout: count((e) => e.actor === "ai:scout"),
      skeptic: count((e) => e.actor === "ai:skeptic"),
      assistant: count((e) => e.actor === "ai:assistant"),
    },
    firstUse: ai[0]?.at,
    lastUse: ai[ai.length - 1]?.at,
    // each reference lands in exactly one bucket (a confirmed close match is not also "verified")
    refs: {
      total: sources.length,
      verified: n("verified") - sources.filter(confirmedClose).length,
      confirmedClose: sources.filter(confirmedClose).length,
      closeMatch: n("close_match"),
      notFound: n("not_found"),
      retracted: n("retracted"),
      unavailable: n("unavailable"),
      studentAdded: n("student_added"),
      pending: n("pending"),
    },
    // each claim lands in exactly one bucket (its label)
    claims: {
      total: claims.length,
      supported: claimsWith("supported"),
      supportedOwnText: claimsWith("supported_own_text"),
      overreach: claimsWith("overreach"),
      notSupported: claimsWith("not_supported"),
      unchecked: claimsWith("unchecked"),
      refNotFound: claimsWith("not_found", "retracted"),
      refUnconfirmed: claimsWith("close_match"),
      refStudentAdded: claimsWith("student_added"),
      refUnavailable: claimsWith("unavailable"),
      pending: claimsWith("pending"),
      sample: claimChecks.filter((c) => c?.mode === "sample").length,
    },
    decisions: {
      edited: count((e) => e.action === "claim.edit"),
      replaced: count((e) => e.action === "claim.replace"),
      removed: count((e) => e.action === "claim.remove"),
      acceptedAnyway: claims.filter((c) => c.decision?.action === "accept_anyway").length,
      acknowledged: claims.filter((c) => c.decision?.action === "acknowledge").length,
    },
  };
}

/**
 * Trust labels for exported text files: every reference that is not plainly
 * verified is listed with its label and reason, so a Student-added or kept
 * Not found reference never leaves the app looking like a checked one.
 */
export function verificationNotes(list: LibrarySource[]): string {
  if (!list.length) return "";
  const lines = list
    .map((s) => {
      const label = sourceLabel(s.verification);
      const confirmed = s.verification?.status === "close_match" && s.verification.confirmedByStudent;
      if (label === "verified" && !confirmed) return null;
      const why = confirmed ? "A close match the student confirmed after comparing the details." : (s.verification?.reason ?? LABELS[label].source);
      return `- ${shortRef(s)}, "${s.record.title}": ${confirmed ? "Verified (confirmed close match)" : LABELS[label].title}. ${why}`;
    })
    .filter((l): l is string => Boolean(l));
  return lines.length
    ? `Reference checks (ClaimTrace)\n${lines.join("\n")}\nAll other references were verified against Crossref or OpenAlex.`
    : `Reference checks (ClaimTrace): all ${list.length} references were verified against Crossref or OpenAlex.`;
}

export function download(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "claimtrace";
}

/** Sources in order of first citation in the draft, then the rest of the library. */
export function orderedSources(sources: LibrarySource[], claims: ResolvedClaim[], includeUncited: boolean): LibrarySource[] {
  const order: string[] = [];
  for (const c of claims) for (const id of c.sourceIds) if (!order.includes(id)) order.push(id);
  const byId = new Map(sources.map((s) => [s.id, s]));
  const cited = order.map((id) => byId.get(id)).filter((s): s is LibrarySource => Boolean(s));
  return includeUncited ? [...cited, ...sources.filter((s) => !order.includes(s.id))] : cited;
}
