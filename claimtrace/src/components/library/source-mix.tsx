"use client";

import { Info, Scale } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Panel, PanelHeader } from "@/components/app/page";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LibrarySource } from "@/core/model";
import { computeSourceMix } from "@/core/workflow/source-mix";
import { checkText } from "@/core/model";

const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return (code: string) => dn.of(code) ?? code;
  } catch {
    return (code: string) => code;
  }
})();

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Panel className="p-4">
      <p className="text-[12.5px] text-ink-500">{label}</p>
      <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em] text-ink-950">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-ink-400">{sub}</p>}
    </Panel>
  );
}

/** Column chart: one series, so no legend; value on each cap; hover gives the exact count. */
function Columns({ data, title, subtitle }: { data: Array<{ label: string; count: number }>; title: string; subtitle: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Panel>
      <PanelHeader title={title} description={subtitle} />
      <div className="px-5 pt-6 pb-5">
        <div className="flex h-44 items-end justify-around gap-2 border-b border-ink-200" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}`}>
          {data.map((d, i) => (
            <Tooltip key={d.label}>
              <TooltipTrigger asChild>
                <div className="flex h-full w-full max-w-16 flex-col items-center justify-end" tabIndex={0}>
                  <span className="mb-1.5 text-[12px] font-medium text-ink-700">{d.count || ""}</span>
                  <motion.div
                    className="w-full max-w-6 rounded-t-[4px] bg-trace-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / max) * 82}%` }}
                    transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {d.label}: {d.count} source{d.count === 1 ? "" : "s"}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="mt-2 flex justify-around gap-2">
          {data.map((d) => (
            <span key={d.label} className="w-full max-w-16 text-center text-[11.5px] text-ink-500">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/** Horizontal bars with the label on the left and the value at the tip. */
function Bars({ data, title, subtitle, empty }: { data: Array<{ label: string; count: number }>; title: string; subtitle: string; empty: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Panel>
      <PanelHeader title={title} description={subtitle} />
      {data.length === 0 ? (
        <p className="px-5 py-6 text-[13px] text-ink-500">{empty}</p>
      ) : (
        <ul className="space-y-2.5 px-5 py-5">
          {data.map((d, i) => (
            <li key={d.label} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3">
              <span className="truncate text-[12.5px] text-ink-600">{d.label}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-2" tabIndex={0}>
                    <motion.span
                      className="h-3.5 rounded-r-[4px] bg-trace-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / max) * 85}%` }}
                      transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <span className="text-[12px] font-medium text-ink-700">{d.count}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {d.label}: {d.count}
                </TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function SourceMixView({ sources }: { sources: LibrarySource[] }) {
  const mix = useMemo(
    () =>
      computeSourceMix(
        sources.map((s) => ({
          year: s.record.year,
          type: s.record.type,
          isOa: s.record.isOa,
          countries: s.record.countries,
          venue: s.record.venue,
          hasText: checkText(s).origin !== "none",
          origin: s.origin,
        })),
      ),
    [sources],
  );
  const pct = (n: number) => (mix.total ? `${Math.round((n / mix.total) * 100)}%` : "–");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Sources" value={String(mix.total)} sub={mix.studentAdded ? `${mix.studentAdded} added by you without a database record` : "All from Crossref or OpenAlex"} />
        <StatTile label="With text to check claims" value={`${mix.withText} of ${mix.total}`} sub="Abstract or text you pasted" />
        <StatTile label="Open access" value={pct(mix.openAccess.open)} sub={`${mix.openAccess.open} open, ${mix.openAccess.closed} closed, ${mix.openAccess.unknown} unknown`} />
        <StatTile label="Publication years" value={mix.oldest ? `${mix.oldest}–${mix.newest}` : "–"} sub={mix.medianYear ? `Median ${mix.medianYear}` : undefined} />
      </div>

      {mix.notes.length > 0 && (
        <Panel className="border-amber-200 bg-amber-50/40 p-4">
          <ul className="space-y-1.5">
            {mix.notes.map((n) => (
              <li key={n} className="flex gap-2 text-[13.5px] text-amber-900">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
                {n}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Columns data={mix.years} title="Publication years" subtitle="Sources per period" />
        <Bars
          data={mix.countries.map((c) => ({ label: regionName(c.code), count: c.count }))}
          title="Author countries"
          subtitle={`From author affiliations (${mix.countryCoverage} of ${mix.total} sources have one)`}
          empty="No country data yet."
        />
        <Bars data={mix.types} title="Source types" subtitle="As recorded in the databases" empty="No sources yet." />
      </div>

      <Panel className="flex gap-3 p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-600 ring-1 ring-ink-200">
          <Scale className="size-4" />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-ink-950">Why there is no credibility score</p>
          <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-500">
            A study can be strong evidence for a narrow claim and weak evidence for a broad one, so ClaimTrace judges fit claim by claim. This view describes your
            sources so you can spot imbalance (old studies, one country, one study type). It does not rank them. Coverage depends on what Crossref and OpenAlex record,
            and their coverage is uneven across languages and regions.
          </p>
        </div>
      </Panel>
    </div>
  );
}
