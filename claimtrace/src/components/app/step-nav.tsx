"use client";

import { ArrowLeft, ArrowRight, Printer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The workflow pages in the order a student uses them (seven steps across six pages). */
export const FLOW = [
  { href: "/app/overview", name: "Overview", step: "Step 1 of 7 · Ask" },
  { href: "/app/search", name: "Search", step: "Step 2 of 7 · Search" },
  { href: "/app/library", name: "Library", step: "Step 3 of 7 · Approve" },
  { href: "/app/write", name: "Write", step: "Step 4 of 7 · Write" },
  { href: "/app/review", name: "Review claims", step: "Steps 5–6 of 7 · Verify and challenge" },
  { href: "/app/export", name: "Export", step: "Step 7 of 7 · Decide" },
] as const;

/** Previous / Next along the workflow, pinned to the bottom of every workflow page. */
export function StepNav() {
  const pathname = usePathname();
  const i = FLOW.findIndex((f) => f.href === pathname);
  if (i < 0) return null;
  const prev = FLOW[i - 1];
  const next = FLOW[i + 1];
  return (
    <nav aria-label="Workflow steps" className="no-print sticky bottom-0 z-20 border-t border-ink-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 md:px-8">
        {prev ? (
          <Button asChild variant="outline" size="sm">
            <Link href={prev.href}>
              <ArrowLeft />
              <span className="hidden sm:inline">Previous:</span> {prev.name}
            </Link>
          </Button>
        ) : (
          <span className="w-px" />
        )}
        <div className="mx-auto hidden items-center gap-3 md:flex">
          <span className="text-[12px] text-ink-500">{FLOW[i].step}</span>
          <span className="flex gap-1" aria-hidden="true">
            {FLOW.map((f, k) => (
              <span key={f.href} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-5 bg-ink-950" : k < i ? "w-1.5 bg-trace-500" : "w-1.5 bg-ink-200")} />
            ))}
          </span>
        </div>
        {next ? (
          <Button asChild size="sm" className="ml-auto md:ml-0">
            <Link href={next.href}>
              <span className="hidden sm:inline">Next:</span> {next.name}
              <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="ml-auto md:ml-0">
            <Link href="/app/report">
              <Printer /> Integrity report
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
