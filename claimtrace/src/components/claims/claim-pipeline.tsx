"use client";

import { CircleAlert, CircleCheck, CircleDashed, CircleMinus, CircleX, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import type { LibrarySource } from "@/core/model";
import type { ClaimCheck, StepState } from "@/core/types";
import { cn } from "@/lib/utils";

type State = StepState | "running" | "waiting";

const ICON: Record<State, { icon: typeof CircleCheck; cls: string }> = {
  pass: { icon: CircleCheck, cls: "text-trace-600" },
  warn: { icon: CircleAlert, cls: "text-amber-600" },
  fail: { icon: CircleX, cls: "text-rose-600" },
  skip: { icon: CircleMinus, cls: "text-ink-300" },
  running: { icon: LoaderCircle, cls: "animate-spin text-ink-400" },
  waiting: { icon: CircleDashed, cls: "text-ink-300" },
};

function supportState(check: ClaimCheck | undefined, running: boolean): { state: State; text: string } {
  if (running) return { state: "running", text: "Checking" };
  if (!check) return { state: "waiting", text: "Supports" };
  switch (check.verdict) {
    case "supported":
      return { state: "pass", text: "Supported" };
    case "overreach":
      return { state: "warn", text: "Overreach" };
    case "not_supported":
      return { state: "fail", text: "Not supported" };
    default:
      return { state: "skip", text: "Unchecked" };
  }
}

/** Exists -> Matches -> Not retracted -> Supports, as four connected steps. */
export function ClaimPipeline({ source, check, running }: { source?: LibrarySource; check?: ClaimCheck; running?: boolean }) {
  const steps = source?.verification?.steps;
  const verifierRunning = Boolean(source && !source.verification);
  const items: Array<{ name: string; state: State; text: string }> = [
    ...(steps
      ? steps.map((s) => ({ name: s.id === "exists" ? "Exists" : s.id === "matches" ? "Matches" : "Retraction", state: s.state as State, text: s.title }))
      : (["Exists", "Matches", "Retraction"] as const).map((n) => ({ name: n, state: (verifierRunning ? "running" : "fail") as State, text: source ? "Checking" : "Missing" }))),
    { name: "Supports", ...supportState(check, Boolean(running)) },
  ];
  const blocked = steps?.some((s) => s.state === "fail");
  return (
    <ol className="flex flex-wrap items-center gap-y-2" aria-label="Checks for this citation">
      {items.map((it, i) => {
        const st = blocked && i === 3 ? { ...it, state: "skip" as State, text: "Not checked" } : it;
        const Icon = ICON[st.state].icon;
        return (
          <li key={it.name} className="flex items-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 420, damping: 28 }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium",
                st.state === "pass" && "border-trace-200 bg-trace-50 text-trace-800",
                st.state === "warn" && "border-amber-200 bg-amber-50 text-amber-800",
                st.state === "fail" && "border-rose-200 bg-rose-50 text-rose-800",
                (st.state === "skip" || st.state === "waiting" || st.state === "running") && "border-ink-200 bg-white text-ink-500",
              )}
            >
              <Icon className={cn("size-3.5", ICON[st.state].cls)} aria-hidden="true" />
              <span className="font-mono text-[10px] tracking-wider uppercase opacity-60">{it.name}</span>
              {st.text}
            </motion.span>
            {i < items.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-3 bg-ink-200" />}
          </li>
        );
      })}
    </ol>
  );
}
