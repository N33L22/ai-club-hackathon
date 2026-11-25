"use client";

import { CircleAlert, CircleCheck, CircleMinus, CircleX, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import type { CheckStep, StepState } from "@/core/types";
import { cn } from "@/lib/utils";

const STATE: Record<StepState | "running", { icon: typeof CircleCheck; cls: string }> = {
  pass: { icon: CircleCheck, cls: "text-trace-600" },
  warn: { icon: CircleAlert, cls: "text-amber-600" },
  fail: { icon: CircleX, cls: "text-rose-600" },
  skip: { icon: CircleMinus, cls: "text-ink-300" },
  running: { icon: LoaderCircle, cls: "text-ink-400 animate-spin" },
};

const STEP_NAMES: Record<CheckStep["id"], string> = { exists: "Exists", matches: "Matches", retraction: "Retraction" };

/** The Verifier's three checks, each with what was found. Staggered in on first render. */
export function CheckSteps({ steps, running = false, compact = false }: { steps?: CheckStep[]; running?: boolean; compact?: boolean }) {
  const rows: Array<CheckStep | { id: CheckStep["id"]; state: "running"; title: string; detail: string }> =
    steps ??
    (["exists", "matches", "retraction"] as const).map((id) => ({ id, state: "running" as const, title: STEP_NAMES[id], detail: running ? "Checking…" : "Waiting" }));
  return (
    <ol className={cn("relative", compact ? "space-y-2" : "space-y-3")}>
      {rows.map((s, i) => {
        const st = STATE[s.state];
        const Icon = st.icon;
        return (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-3"
          >
            <span className="relative mt-0.5 flex flex-col items-center">
              <motion.span
                key={s.state}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 26, delay: i * 0.08 }}
              >
                <Icon className={cn("size-[18px]", st.cls)} aria-hidden="true" />
              </motion.span>
              {i < rows.length - 1 && <span className="mt-1 h-full min-h-3 w-px bg-ink-200" />}
            </span>
            <div className="min-w-0 pb-0.5">
              <p className="text-[13px] font-medium text-ink-900">
                <span className="mr-1.5 font-mono text-[10.5px] tracking-wider text-ink-400 uppercase">{STEP_NAMES[s.id]}</span>
                {s.title}
              </p>
              {!compact && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{s.detail}</p>}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
