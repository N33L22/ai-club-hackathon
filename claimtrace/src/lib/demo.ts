"use client";

import type { Bundle } from "./store";
import { useStore } from "./store";
import data from "./demo-data.json";

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
