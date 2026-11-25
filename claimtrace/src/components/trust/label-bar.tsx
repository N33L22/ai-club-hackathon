"use client";

import { motion } from "motion/react";
import { LABELS, type TrustLabel } from "@/core/labels";
import { cn } from "@/lib/utils";
import { toneOf } from "./trust-badge";

/** A stacked bar of trust labels with a legend. Labels are always named, never colour-only. */
export function LabelBar({ counts, order, className }: { counts: Partial<Record<TrustLabel, number>>; order: TrustLabel[]; className?: string }) {
  const items = order.map((l) => ({ label: l, n: counts[l] ?? 0 })).filter((i) => i.n > 0);
  const total = items.reduce((s, i) => s + i.n, 0);
  return (
    <div className={className}>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-ink-100" role="img" aria-label={items.map((i) => `${i.n} ${LABELS[i.label].title}`).join(", ") || "No items yet"}>
        {items.map((i, idx) => (
          <motion.span
            key={i.label}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", toneOf(i.label).dot)}
            initial={{ width: 0 }}
            animate={{ width: `${(i.n / total) * 100}%` }}
            transition={{ delay: 0.1 + idx * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      {items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {items.map((i) => (
            <li key={i.label} className="flex items-center gap-1.5 text-[12.5px] text-ink-600">
              <span className={cn("size-2 rounded-full", toneOf(i.label).dot)} aria-hidden="true" />
              {LABELS[i.label].title}
              <span className="font-mono text-[11.5px] text-ink-400">{i.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
