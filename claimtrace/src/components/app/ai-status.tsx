"use client";

import { Cpu } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAiStatus } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function AiStatus({ className, compact = false }: { className?: string; compact?: boolean }) {
  const ai = useAiStatus();
  const live = ai?.configured;
  const label = ai === null ? "Checking AI…" : live ? "AI checks live" : "AI offline";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-card",
            compact && "border-0 bg-transparent px-0 py-0 shadow-none",
            className,
          )}
        >
          <span className="relative grid size-7 place-items-center rounded-lg bg-ink-50 text-ink-600 ring-1 ring-ink-200">
            <Cpu className="size-3.5" />
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white",
                ai === null ? "bg-ink-300" : live ? "bg-trace-500" : "bg-amber-500",
              )}
            />
          </span>
          {!compact && (
            <span className="min-w-0 leading-tight">
              <span className="block text-[12.5px] font-medium text-ink-900">{label}</span>
              <span className="block truncate font-mono text-[10.5px] text-ink-400">{ai?.model || "…"}</span>
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64 leading-relaxed">
        {live
          ? `Scout, Skeptic and Assistant use ${ai?.model} via ${ai?.provider}. Code still makes every final check.`
          : "No AI key is configured. Existence, metadata and retraction checks still run (they are code). Support checks show Unchecked, never Verified."}
      </TooltipContent>
    </Tooltip>
  );
}
