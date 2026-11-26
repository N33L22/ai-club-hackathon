"use client";

import { extractClaims } from "@/core/evidence/claims";
import type { ClaimCheck } from "@/core/types";
import samples from "./demo-checks.json";
import data from "./demo-data.json";
import type { Bundle } from "./store";
import { useStore } from "./store";

export const DEMO_PROJECT_ID = "demo-project";

/**
 * Loads (or resets) the demo project. Its references and their verification
 * results were produced by the live Verifier (scripts/build-demo.mts).
 * Claim checks are not pre-filled: they run live when you click "Check".
 */
export function loadDemo(): string {
  const bundle = structuredClone(data) as unknown as Bundle;
  const s = useStore.getState();
  if (s.projects[DEMO_PROJECT_ID]) s.deleteProject(DEMO_PROJECT_ID);
  s.importBundle(bundle);
  s.log({
    projectId: DEMO_PROJECT_ID,
    actor: "system",
    action: "project.demo_loaded",
    summary: "Loaded the demo project: 9 references (verified live against Crossref and OpenAlex) and a short draft with 11 cited claims.",
  });
  return DEMO_PROJECT_ID;
}

type SampleFile = { provenance: "prepared" | "recorded"; at: string; model?: string; note: string; checks: Record<string, Record<string, ClaimCheck>> };
const SAMPLES = samples as unknown as SampleFile;

export const sampleInfo = { provenance: SAMPLES.provenance, at: SAMPLES.at, model: SAMPLES.model, note: SAMPLES.note };

/** A check whose AI step failed (a sample may stand in for it); real AI results are never replaced. */
const aiFailed = (c: ClaimCheck | undefined) => !c || (c.verdict === "unchecked" && c.mode === "code" && c.reason !== "no_text");

/** How many claim/source pairs in the current draft could show a sample instead of a failed AI check. */
export function sampleCandidates(projectId: string): number {
  const s = useStore.getState();
  const project = s.projects[projectId];
  if (!project?.isDemo && projectId !== DEMO_PROJECT_ID) return 0;
  let n = 0;
  for (const c of extractClaims(project?.doc)) {
    for (const [sid] of Object.entries(SAMPLES.checks[c.key] ?? {})) if (aiFailed(s.checks[c.key]?.bySource[sid])) n++;
  }
  return n;
}

/**
 * Fills in the demo's sample results where the live AI check is unavailable.
 * Each one is marked mode "sample" with its provenance, shown with a Sample
 * label, logged, and counted in the AI-use statement. Demo project only.
 */
export function loadSampleChecks(projectId: string): number {
  const s = useStore.getState();
  const project = s.projects[projectId];
  if (!project || (projectId !== DEMO_PROJECT_ID && !project.isDemo)) return 0;
  let n = 0;
  for (const c of extractClaims(project.doc)) {
    for (const [sid, check] of Object.entries(SAMPLES.checks[c.key] ?? {})) {
      if (!aiFailed(useStore.getState().checks[c.key]?.bySource[sid])) continue;
      s.setClaimCheck(projectId, c.key, sid, {
        ...check,
        mode: "sample",
        sample: { provenance: SAMPLES.provenance, at: SAMPLES.at, model: SAMPLES.model ?? check.model },
      });
      n++;
    }
  }
  if (n) {
    s.log({
      projectId,
      actor: "system",
      action: "claim.samples_loaded",
      summary: `Loaded ${n} sample result${n === 1 ? "" : "s"} because live AI checks were unavailable (${SAMPLES.provenance === "recorded" ? `recorded from ${SAMPLES.model ?? "the AI"} on ${new Date(SAMPLES.at).toLocaleDateString()}` : "prepared by Team 6"}). They are labelled Sample and are not live AI checks.`,
    });
  }
  return n;
}
