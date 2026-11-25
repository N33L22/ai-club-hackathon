"use client";

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
  const labels = sources.map((s) => sourceLabel(s.verification));
  const claimChecks = claims.flatMap((c) => c.checks).filter(Boolean);

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
    refs: {
      total: sources.length,
      verified: labels.filter((l) => l === "verified").length,
      closeMatch: sources.filter((s) => s.verification?.status === "close_match").length,
      notFound: labels.filter((l) => l === "not_found").length,
      retracted: labels.filter((l) => l === "retracted").length,
      studentAdded: labels.filter((l) => l === "student_added").length,
    },
    claims: {
      total: claims.length,
      verified: claims.filter((c) => c.label === "verified").length,
      overreach: claims.filter((c) => c.label === "overreach").length,
      notSupported: claims.filter((c) => c.label === "not_supported").length,
      unchecked: claims.filter((c) => c.label === "unchecked").length,
      refIssues: claims.filter((c) => ["not_found", "retracted", "close_match", "student_added"].includes(c.label)).length,
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
