"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { DraftClaim } from "@/core/evidence/claims";
import { checkClaim, runPool } from "@/lib/actions";
import { ApiError } from "@/lib/api";

/** Runs claim checks (two at a time) and tracks which claims are in flight. */
export function useClaimRunner(projectId: string) {
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const mark = (key: string, on: boolean) =>
    setRunning((s) => {
      const n = new Set(s);
      if (on) n.add(key);
      else n.delete(key);
      return n;
    });

  const runOne = useCallback(
    async (claim: DraftClaim) => {
      mark(claim.key, true);
      try {
        await checkClaim(projectId, claim);
      } catch (e) {
        toast.error("Check failed", { description: e instanceof ApiError ? e.message : "Please try again." });
      } finally {
        mark(claim.key, false);
      }
    },
    [projectId],
  );

  const runAll = useCallback(
    async (claims: DraftClaim[]) => {
      if (!claims.length) return;
      setProgress({ done: 0, total: claims.length });
      let failed = 0;
      await runPool(claims, 2, async (c) => {
        mark(c.key, true);
        try {
          await checkClaim(projectId, c);
        } catch {
          failed++;
        } finally {
          mark(c.key, false);
          setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
        }
      });
      setProgress(null);
      if (failed) toast.error(`${failed} check${failed === 1 ? "" : "s"} failed. You can run them again.`);
      else toast.success(`Checked ${claims.length} claim${claims.length === 1 ? "" : "s"}`);
    },
    [projectId],
  );

  return { running, progress, runOne, runAll };
}
