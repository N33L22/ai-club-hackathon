"use client";

import {
  ArrowUpRight,
  Check,
  FileText,
  Loader2,
  PencilLine,
  Quote,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { shortRef } from "@/core/citation/csl";
import { LABELS } from "@/core/labels";
import type { LibrarySource, Project } from "@/core/model";
import { stripRetractedPrefix } from "@/core/text/normalize";
import type { ClaimCheck } from "@/core/types";
import { decisionApplies } from "@/core/workflow/gate";
import { sourceLabel } from "@/core/workflow/labels";
import { confirmCloseMatch, decide, logIntent, undoDecision } from "@/lib/actions";
import type { ResolvedClaim } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ClaimPipeline } from "./claim-pipeline";

const REASON_TEXT: Record<NonNullable<ClaimCheck["reason"]>, string> = {
  no_text: "There is no abstract or pasted text for this source, so the claim could not be compared with it.",
  ai_unavailable: "The AI check is not available, so code could only rank the closest sentences. It never marks a claim Verified on its own.",
  rate_limited: "The AI request budget was used up. Try again in a minute; nothing is marked Verified meanwhile.",
  quote_not_in_source: "The AI proposed a supporting sentence that is not in the source text, so code rejected it.",
  invalid_ai_output: "The AI reply was not in the required format, so it was discarded.",
};

function Evidence({ check, source }: { check: ClaimCheck; source: LibrarySource }) {
  const origin = check.textOrigin === "student_text" ? "the text you pasted" : "the abstract";
  return (
    <div className="space-y-3">
      {check.evidence && (
        <figure className="relative rounded-xl bg-gradient-to-br from-ink-50 to-white p-4 ring-1 ring-ink-200/70">
          <Quote className="absolute top-3 right-3 size-4 text-ink-200" aria-hidden="true" />
          <blockquote className="pr-6 font-serif text-[15.5px] leading-relaxed text-ink-800 italic">&ldquo;{check.evidence.text}&rdquo;</blockquote>
          <figcaption className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
            <span>
              Sentence {check.evidence.index + 1} of {origin} · {shortRef(source)}
            </span>
            {check.quoteVerified && (
              <span className="inline-flex items-center gap-1 font-medium text-trace-700">
                <Check className="size-3" strokeWidth={3} /> Found in the source by code
              </span>
            )}
          </figcaption>
        </figure>
      )}

      {!check.evidence && check.candidates.length > 0 && check.verdict === "unchecked" && (
        <div className="rounded-xl border border-dashed border-ink-200 p-3.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-ink-400 uppercase">
            <Wrench className="size-3" /> Closest sentences found by code (not judged)
          </p>
          <ul className="mt-2 space-y-1.5">
            {check.candidates.slice(0, 2).map((c) => (
              <li key={c.index} className="font-serif text-[14px] leading-relaxed text-ink-600">
                <span className="mr-1.5 font-mono text-[10.5px] text-ink-400 not-italic">S{c.index + 1}</span>
                {c.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {check.scopeFlags.length > 0 && (
        <ul className="space-y-1.5">
          {check.scopeFlags.map((f) => (
            <li key={f.kind} className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-900 ring-1 ring-amber-200 ring-inset">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
              <span>
                <span className="font-medium">{f.kind === "causal" ? "Causal wording" : f.kind === "certainty" ? "Stronger certainty" : "Wider population"}:</span> {f.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {check.patchwriting && (
        <p className="flex gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[13px] leading-relaxed text-sky-900 ring-1 ring-sky-200 ring-inset">
          <FileText className="mt-0.5 size-3.5 shrink-0 text-sky-600" />
          <span>
            <span className="font-medium">Close to the source&apos;s wording:</span> {check.patchwriting.words} words in a row match {origin} (&ldquo;{check.patchwriting.excerpt}&rdquo;). Put them in quotation
            marks with a page number, or rewrite in your own words.
          </span>
        </p>
      )}

      {check.explanation && (
        <p className="flex gap-2 text-[13px] leading-relaxed text-ink-600">
          <span className="mt-px inline-flex h-5 shrink-0 items-center gap-1 rounded-md bg-violet-50 px-1.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200 ring-inset">
            <Sparkles className="size-3" /> AI reasoning
          </span>
          <span>{check.explanation}</span>
        </p>
      )}

      {check.reason && <p className="text-[12.5px] leading-relaxed text-ink-500">{REASON_TEXT[check.reason]}</p>}

      <p className="text-[11.5px] text-ink-400">
        {check.mode === "ai" ? `Judged by the Skeptic (${check.model}); quote re-checked by code` : check.mode === "sample" ? "Sample result, not a live AI check" : "Code-only check"} ·{" "}
        {new Date(check.checkedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
}

function KeepDialog({ claim, open, onOpenChange, onConfirm }: { claim: ResolvedClaim; open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const ok = reason.trim().length >= 10;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <p className="font-mono text-[11px] tracking-[0.14em] text-amber-700 uppercase">Checkpoint 2 · your decision</p>
          <DialogTitle>Keep this {LABELS[claim.label].title.toLowerCase()} claim?</DialogTitle>
          <DialogDescription>
            You are the author, so you can keep it. Say why: your reason is saved in the audit log and counted in the AI-use statement your supervisor sees.
          </DialogDescription>
        </DialogHeader>
        <blockquote className="rounded-xl bg-ink-50 p-3 font-serif text-[15px] leading-relaxed text-ink-800">{claim.text}</blockquote>
        <Textarea autoFocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I present this as the authors' interpretation, not as an established fact." />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              onConfirm(reason.trim());
              onOpenChange(false);
              setReason("");
            }}
          >
            Keep with this reason
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClaimCard({
  claim,
  project,
  index,
  running,
  onCheck,
  onOpenSource,
}: {
  claim: ResolvedClaim;
  project: Project;
  index: number;
  running: boolean;
  onCheck: () => void;
  onOpenSource: (id: string) => void;
}) {
  const router = useRouter();
  const updateProject = useStore((s) => s.updateProject);
  const [keeping, setKeeping] = useState(false);
  const gate = LABELS[claim.label].gate;
  const resolved = decisionApplies(claim.label, claim.decision);
  const page = project.quotePages?.[claim.key] ?? "";

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      id={`claim-${claim.key}`}
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-card",
        claim.label === "retracted" || claim.label === "not_found" ? "border-rose-200" : gate === "decide" && !resolved ? "border-amber-200" : "border-ink-200/80",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <TrustBadge label={claim.label} size="lg" />
          <span className="font-mono text-[11px] text-ink-400">Claim {index + 1}</span>
          {resolved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11.5px] font-medium text-ink-700">
              <Check className="size-3" /> {claim.decision?.action === "acknowledge" ? "Acknowledged" : "Kept with a reason"}
            </span>
          )}
        </div>
        <Button size="xs" variant="ghost" onClick={onCheck} disabled={running}>
          {running ? <Loader2 className="animate-spin" /> : <RefreshCw />} {claim.checks.some(Boolean) ? "Check again" : "Check"}
        </Button>
      </div>

      <p className="px-5 pt-3 text-[15.5px] leading-relaxed text-ink-950">{claim.text}</p>

      {claim.quote && (
        <div className="mx-5 mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[12.5px] text-ink-600">
          <Quote className="size-3.5 text-ink-400" /> Direct quotation.
          {claim.checks.find((c) => c?.directQuote)?.directQuote?.foundInSource === true && <span className="font-medium text-trace-700">Found word for word in the source.</span>}
          {claim.checks.find((c) => c?.directQuote)?.directQuote?.foundInSource === false && <span className="font-medium text-rose-700">Not found word for word in the source text.</span>}
          <span className="ml-auto flex items-center gap-2">
            <label htmlFor={`page-${claim.key}`} className={cn(!page.trim() && "font-medium text-amber-800")}>
              Page or paragraph{!page.trim() && " (required)"}
            </label>
            <Input
              id={`page-${claim.key}`}
              value={page}
              onChange={(e) => updateProject(project.id, { quotePages: { ...project.quotePages, [claim.key]: e.target.value } })}
              placeholder="p. 81"
              className="h-7 w-24 bg-white text-[12.5px]"
            />
          </span>
        </div>
      )}

      <div className="mt-4 space-y-4 border-t border-ink-100 px-5 py-4">
        {claim.sourceIds.map((sid, i) => {
          const src = claim.sources[i];
          const check = claim.checks[i];
          const sl = sourceLabel(src?.verification);
          return (
            <div key={sid} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {src ? (
                  <button type="button" onClick={() => onOpenSource(sid)} className="group min-w-0 text-left">
                    <span className="text-[12px] text-ink-500">Cited source · {shortRef(src)}</span>
                    <span className="block truncate font-serif text-[15px] text-ink-900 group-hover:underline">{stripRetractedPrefix(src.record.title)}</span>
                  </button>
                ) : (
                  <span className="text-[13px] text-rose-700">This citation points to a source that is no longer in your library.</span>
                )}
                {src && <TrustBadge label={sl} context="source" size="sm" />}
              </div>
              <ClaimPipeline source={src} check={check} running={running} />
              {sl === "close_match" && src && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900 ring-1 ring-amber-200 ring-inset">
                  {src.verification?.reason}
                  <Button size="xs" variant="outline" className="ml-auto" onClick={() => confirmCloseMatch(sid)}>
                    <Check /> Confirm the match
                  </Button>
                </div>
              )}
              {(sl === "not_found" || sl === "retracted") && src && <p className="text-[12.5px] leading-relaxed text-rose-800">{src.verification?.reason}</p>}
              {check && src && <Evidence check={check} source={src} />}
              {check?.reason === "no_text" && src && (
                <Button size="xs" variant="outline" onClick={() => onOpenSource(sid)}>
                  <FileText /> Add text you have read
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 bg-ink-25 px-5 py-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            logIntent(project.id, claim, "edit");
            router.push(`/app/write?claim=${claim.key}`);
          }}
        >
          <PencilLine /> Edit in draft
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            logIntent(project.id, claim, "replace");
            router.push(`/app/search?q=${encodeURIComponent(claim.text)}`);
          }}
        >
          <Search /> Find a better source
        </Button>
        <span className="flex-1" />
        {resolved ? (
          <Button size="sm" variant="ghost" onClick={() => undoDecision(project.id, claim)}>
            <RotateCcw /> Reopen
          </Button>
        ) : gate === "decide" ? (
          <Button size="sm" variant="secondary" onClick={() => setKeeping(true)}>
            Keep anyway…
          </Button>
        ) : gate === "acknowledge" ? (
          <Button size="sm" variant="secondary" onClick={() => decide(project.id, claim, claim.label, "acknowledge")}>
            <Check /> Acknowledge
          </Button>
        ) : claim.label === "verified" ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-trace-700">
            <ArrowUpRight className="size-3.5" /> No action needed
          </span>
        ) : null}
      </div>

      <KeepDialog claim={claim} open={keeping} onOpenChange={setKeeping} onConfirm={(reason) => decide(project.id, claim, claim.label, "accept_anyway", reason)} />
    </motion.article>
  );
}
