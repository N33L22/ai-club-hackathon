"use client";

import { Check, Hand } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentProject, useGate, useProjectClaims, useProjectSources } from "@/lib/hooks";
import { sourceLabel } from "@/core/workflow/labels";
import { cn } from "@/lib/utils";

export const STEPS = [
  { n: 1, name: "Ask", href: "/app/overview", who: "You", hint: "Write your research question." },
  { n: 2, name: "Search", href: "/app/search", who: "AI Scout", hint: "Scout plans the search; OpenAlex returns real records." },
  { n: 3, name: "Approve", href: "/app/library", who: "You", hint: "Checkpoint 1: approve the plan and the sources.", checkpoint: true },
  { n: 4, name: "Write", href: "/app/write", who: "You", hint: "Cite sources from your library as you write." },
  { n: 5, name: "Verify", href: "/app/review", who: "Code", hint: "Exists, matches and not retracted: plain code, no AI." },
  { n: 6, name: "Challenge", href: "/app/review", who: "AI Skeptic", hint: "Finds the source sentence; code re-checks the quote." },
  { n: 7, name: "Decide", href: "/app/export", who: "You", hint: "Checkpoints 2 and 3: resolve flags and sign off.", checkpoint: true },
] as const;

export function useWorkflowProgress() {
  const project = useCurrentProject();
  const sources = useProjectSources(project?.id);
  const claims = useProjectClaims(project);
  const gate = useGate(project, claims);
  return useMemo(() => {
    const cited = new Set(claims.flatMap((c) => c.sourceIds));
    const citedSources = sources.filter((s) => cited.has(s.id));
    const done = [
      Boolean(project?.question),
      Boolean(project?.planApprovedAt) || sources.length > 0,
      sources.some((s) => s.approvedAt),
      claims.length > 0,
      claims.length > 0 && citedSources.every((s) => sourceLabel(s.verification) !== "pending"),
      claims.length > 0 && gate.pending === 0,
      Boolean(project?.signOff) && gate.ready,
    ];
    const current = done.findIndex((d) => !d);
    return { done, current: current === -1 ? STEPS.length : current };
  }, [project, sources, claims, gate]);
}

export function WorkflowStepper({ className }: { className?: string }) {
  const { done, current } = useWorkflowProgress();
  const pathname = usePathname();
  return (
    <nav aria-label="Workflow" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isDone = done[i];
          const isCurrent = i === current;
          const onPage = pathname === s.href;
          return (
            <li key={s.n} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={s.href}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "group relative flex h-8 items-center gap-1.5 rounded-full pr-2.5 pl-1 text-[12.5px] font-medium transition-colors",
                      onPage ? "bg-ink-100 text-ink-950" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900",
                    )}
                  >
                    <span
                      className={cn(
                        "relative grid size-6 place-items-center rounded-full font-mono text-[11px] transition-colors",
                        isDone ? "bg-trace-500 text-white" : isCurrent ? "bg-ink-950 text-white" : "bg-white text-ink-500 ring-1 ring-ink-200",
                      )}
                    >
                      {isCurrent && (
                        <motion.span
                          className="absolute inset-0 rounded-full ring-2 ring-ink-950/25"
                          animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0, 0.9] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                      {isDone ? <Check className="size-3.5" strokeWidth={3} /> : s.n}
                    </span>
                    <span className="hidden xl:inline">{s.name}</span>
                    {"checkpoint" in s && s.checkpoint && <Hand className="size-3 text-amber-600" aria-label="Human checkpoint" />}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-56">
                  <span className="font-semibold">
                    {s.n}. {s.name}
                  </span>{" "}
                  <span className="opacity-70">({s.who})</span>
                  <br />
                  {s.hint}
                </TooltipContent>
              </Tooltip>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={cn("mx-0.5 h-px w-3 xl:w-4", done[i] ? "bg-trace-300" : "bg-ink-200")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
