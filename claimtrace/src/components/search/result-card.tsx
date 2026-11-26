"use client";

import { Check, ChevronDown, ExternalLink, FileText, LockOpen, OctagonX, Quote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { TrustLabel } from "@/core/labels";
import { stripRetractedPrefix } from "@/core/text/normalize";
import { splitSentences } from "@/core/text/sentences";
import type { ScholarlyRecord } from "@/core/types";
import { cn } from "@/lib/utils";

/** The label every search result carries until it is saved and verified. */
export const SEARCH_RESULT_LABEL = {
  title: "From OpenAlex · not yet checked",
  meaning:
    "A real record returned by OpenAlex; the AI never writes references. When you approve and save it, ClaimTrace checks it against Crossref (details and retraction status) and labels it Verified, Close match or Retracted.",
};

export function authorLine(r: Pick<ScholarlyRecord, "authors">, max = 3): string {
  const names = r.authors.map((a) => (a.given ? `${a.given.split(/\s+/).map((g) => g[0]).join("")} ${a.family}` : a.family));
  if (!names.length) return "Unknown authors";
  return names.length > max ? `${names.slice(0, max).join(", ")} et al.` : names.join(", ");
}

const TYPE_LABEL: Record<string, string> = { review: "Review", preprint: "Preprint", article: "Article", "book-chapter": "Book chapter", book: "Book" };

export function RecordMeta({ record, className }: { record: ScholarlyRecord; className?: string }) {
  return (
    <p className={cn("text-[13px] text-ink-500", className)}>
      <span className="text-ink-700">{authorLine(record)}</span>
      {record.year && <span> · {record.year}</span>}
      {record.venue && <span className="italic"> · {record.venue}</span>}
    </p>
  );
}

export function ResultCard({
  record,
  selected,
  inLibrary,
  knownLabel,
  onToggle,
  index,
}: {
  record: ScholarlyRecord;
  selected: boolean;
  inLibrary: boolean;
  /** A label already known for this record: its library copy's, or a DOI check's. */
  knownLabel?: TrustLabel;
  onToggle: () => void;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const retracted = record.retraction?.retracted;
  const sentences = record.abstract ? splitSentences(record.abstract) : [];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.035, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group rounded-2xl border bg-white p-4 shadow-card transition-[border-color,box-shadow] md:p-5",
        selected ? "border-trace-400 ring-2 ring-trace-200" : "border-ink-200/80 hover:border-ink-300",
        retracted && "border-rose-200",
      )}
    >
      <div className="flex gap-3.5">
        <div className="pt-1">
          {inLibrary ? (
            <span className="grid size-4 place-items-center rounded bg-trace-500 text-white" title="Already in your library">
              <Check className="size-3" strokeWidth={3} />
            </span>
          ) : (
            <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select "${record.title}"`} className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {retracted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-900 px-2 py-0.5 text-[11px] font-medium text-white">
                <OctagonX className="size-3" /> Retracted
              </span>
            ) : knownLabel ? (
              <TrustBadge label={knownLabel} context="source" size="sm" />
            ) : (
              <TrustBadge label="pending" context="source" size="sm" title={SEARCH_RESULT_LABEL.title} meaning={SEARCH_RESULT_LABEL.meaning} />
            )}
            {record.type && TYPE_LABEL[record.type] && record.type !== "article" && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">{TYPE_LABEL[record.type]}</span>
            )}
            {record.abstract ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-trace-50 px-2 py-0.5 text-[11px] font-medium text-trace-800 ring-1 ring-trace-200 ring-inset">
                <FileText className="size-3" /> Abstract, can be checked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800 ring-1 ring-sky-200 ring-inset">No abstract</span>
            )}
            {record.isOa && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-700 ring-1 ring-ink-200 ring-inset">
                <LockOpen className="size-3" /> Open access
              </span>
            )}
            {inLibrary && <span className="text-[11.5px] font-medium text-trace-700">In your library</span>}
          </div>
          <h3 className="mt-2 font-serif text-[17.5px] leading-snug font-medium text-ink-950">
            <button type="button" onClick={onToggle} disabled={inLibrary} className="text-left disabled:cursor-default">
              {stripRetractedPrefix(record.title)}
            </button>
          </h3>
          <RecordMeta record={record} className="mt-1" />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-400">
            {record.citedBy !== undefined && (
              <span className="flex items-center gap-1">
                <Quote className="size-3" /> Cited by {record.citedBy.toLocaleString()}
              </span>
            )}
            {record.doi && <span className="font-mono text-[11.5px]">doi:{record.doi}</span>}
            {sentences.length > 0 && (
              <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 font-medium text-ink-600 hover:text-ink-950" aria-expanded={open}>
                {open ? "Hide abstract" : `Read abstract (${sentences.length} sentences)`}
                <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
              </button>
            )}
            {(record.url || record.doi) && (
              <a href={record.doi ? `https://doi.org/${record.doi}` : record.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink-700">
                Publisher <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <p className="mt-3 rounded-xl bg-ink-50 p-4 font-serif text-[14.5px] leading-relaxed text-ink-700">{record.abstract}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}
