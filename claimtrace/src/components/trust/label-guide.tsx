"use client";

import { ChevronDown, Info } from "lucide-react";
import { useState, type ReactNode } from "react";
import { labelMeaning, type TrustLabel } from "@/core/labels";
import { cn } from "@/lib/utils";
import { TrustBadge } from "./trust-badge";

export interface GuideExtra {
  key: string;
  chip: ReactNode;
  meaning: string;
}

/**
 * "What the labels mean": every label a page can show, each with its meaning, opened with a
 * tap. Badge tooltips need a mouse, so this is how labels are explained on phones too.
 */
export function LabelGuide({
  labels,
  context,
  extra = [],
  className,
}: {
  labels: TrustLabel[];
  context: "claim" | "source";
  extra?: GuideExtra[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const count = labels.length + extra.length;
  return (
    <section className={cn("rounded-2xl border border-ink-200/80 bg-white shadow-card", className)} aria-label="What the labels mean">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-ink-25"
      >
        <Info className="size-4 shrink-0 text-trace-700" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium text-ink-950">What the labels mean</span>
          <span className="block text-[12px] leading-relaxed text-ink-500">
            Every {context === "claim" ? "claim and reference" : "reference"} carries one of these {count} labels. {open ? "Tap to hide." : "Tap to see what each one means."}
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-ink-400 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ul className="grid gap-x-6 gap-y-3.5 border-t border-ink-100 px-4 py-4 sm:grid-cols-2">
          {extra.map((x) => (
            <li key={x.key} className="space-y-1">
              {x.chip}
              <p className="text-[12.5px] leading-relaxed text-ink-600">{x.meaning}</p>
            </li>
          ))}
          {labels.map((l) => (
            <li key={l} className="space-y-1">
              <TrustBadge label={l} context={context} withTooltip={false} />
              <p className="text-[12.5px] leading-relaxed text-ink-600">{labelMeaning(l, context)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
