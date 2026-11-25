"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import { extractClaims, type DraftClaim } from "@/core/evidence/claims";
import type { TrustLabel } from "@/core/labels";
import type { LibrarySource, Project, StoredDecision } from "@/core/model";
import type { ClaimCheck } from "@/core/types";
import { evaluateGate } from "@/core/workflow/gate";
import { claimLabel, sourceLabel } from "@/core/workflow/labels";
import { api, type HealthResponse } from "./api";
import { useStore } from "./store";

/* ------------------------- persistence hydration --------------------------- */

const hydration = {
  subscribe(cb: () => void) {
    const unsub = useStore.persist.onFinishHydration(cb);
    return unsub;
  },
  get: () => useStore.persist.hasHydrated(),
  server: () => false,
};

/** True once the browser's saved data has been loaded (never during SSR). */
export function useHydrated(): boolean {
  const hydrated = useSyncExternalStore(hydration.subscribe, hydration.get, hydration.server);
  useEffect(() => {
    if (!useStore.persist.hasHydrated()) void useStore.persist.rehydrate();
  }, []);
  return hydrated;
}

/* --------------------------------- data ------------------------------------ */

export function useCurrentProject(): Project | undefined {
  return useStore((s) => (s.currentProjectId ? s.projects[s.currentProjectId] : undefined));
}

export function useProjectSources(projectId: string | undefined): LibrarySource[] {
  return useStore(
    useShallow((s) =>
      projectId
        ? Object.values(s.sources)
            .filter((x) => x.projectId === projectId)
            .sort((a, b) => a.addedAt.localeCompare(b.addedAt))
        : [],
    ),
  );
}

export function useProjectFolders(projectId: string | undefined) {
  return useStore(
    useShallow((s) =>
      projectId
        ? Object.values(s.folders)
            .filter((f) => f.projectId === projectId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        : [],
    ),
  );
}

export interface ResolvedClaim extends DraftClaim {
  sources: Array<LibrarySource | undefined>;
  checks: Array<ClaimCheck | undefined>;
  label: TrustLabel;
  decision?: StoredDecision;
}

export function useProjectClaims(project: Project | undefined): ResolvedClaim[] {
  const doc = project?.doc;
  const drafted = useMemo(() => extractClaims(doc), [doc]);
  const { sources, checks, decisions } = useStore(useShallow((s) => ({ sources: s.sources, checks: s.checks, decisions: s.decisions })));
  return useMemo(
    () =>
      drafted.map((c) => {
        const srcs = c.sourceIds.map((id) => sources[id]);
        const chks = c.sourceIds.map((id) => checks[c.key]?.bySource[id]);
        return { ...c, sources: srcs, checks: chks, label: claimLabel(srcs, chks), decision: decisions[c.key] };
      }),
    [drafted, sources, checks, decisions],
  );
}

export function useGate(project: Project | undefined, claims: ResolvedClaim[]) {
  const pages = project?.quotePages;
  return useMemo(
    () =>
      evaluateGate(
        claims.map((c) => ({ key: c.key, label: c.label, decision: c.decision, missingPage: Boolean(c.quote) && !pages?.[c.key]?.trim() })),
        Boolean(project?.signOff),
      ),
    [claims, project?.signOff, pages],
  );
}

export function countBy<T extends string>(items: T[]): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {};
  for (const i of items) out[i] = (out[i] ?? 0) + 1;
  return out;
}

export function useSourceCounts(sources: LibrarySource[]) {
  return useMemo(() => countBy(sources.map((s) => sourceLabel(s.verification))), [sources]);
}

/* ------------------------------ AI status ---------------------------------- */

let healthPromise: Promise<HealthResponse> | null = null;

export function useAiStatus(): HealthResponse["ai"] | null {
  const [ai, setAi] = useState<HealthResponse["ai"] | null>(null);
  useEffect(() => {
    let live = true;
    healthPromise ??= api.health().catch(() => ({ ok: false, version: "", ai: { configured: false, model: "", provider: "" } }));
    void healthPromise.then((h) => live && setAi(h.ai));
    return () => {
      live = false;
    };
  }, []);
  return ai;
}
