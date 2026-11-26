"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { RequireProject } from "@/components/app/require-project";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { shortRef } from "@/core/citation/csl";
import { SCOPE_TITLES } from "@/core/evidence/scope";
import { pastedTextMatch } from "@/core/evidence/text-match";
import { LABELS } from "@/core/labels";
import { CITATION_STYLES, type LibrarySource, type Project } from "@/core/model";
import type { ClaimCheck } from "@/core/types";
import { aiUseStatement } from "@/core/workflow/statement";
import { sourceLabel } from "@/core/workflow/labels";
import { formatReferences, type FormattedEntry } from "@/lib/citation";
import { useAiStatus, useGate, useProjectClaims, useProjectSources, type ResolvedClaim } from "@/lib/hooks";
import { orderedSources, statementInput } from "@/lib/statement-data";
import { useStore } from "@/lib/store";

const VERDICT: Record<ClaimCheck["verdict"], string> = {
  supported: "supports the claim",
  overreach: "the claim goes beyond it",
  not_supported: "does not support the claim",
  unchecked: "could not be checked",
};

function howChecked(check: ClaimCheck): string {
  const origin =
    check.textOrigin === "student_text" ? "text the student pasted (not a database abstract)" : check.textOrigin === "abstract" ? "the abstract from the database" : "no text";
  const by =
    check.mode === "ai"
      ? `judged by ${check.model ?? "the AI"}; evidence confirmed by code`
      : check.mode === "sample"
        ? check.sample?.provenance === "recorded"
          ? `SAMPLE recorded from ${check.sample.model ?? "the AI"} on ${new Date(check.sample.at).toLocaleDateString()}, not a live check`
          : "SAMPLE prepared by Team 6 for the demo, not a live AI check"
        : "code only";
  return `Checked against ${origin} · ${by}${check.truncated ? ` · first ${check.truncated.checked} of about ${check.truncated.total} sentences` : ""}`;
}

/** One cited source of a claim: its reference label, the verdict, the evidence and where it came from. */
function SourceResult({ source, check }: { source: LibrarySource | undefined; check: ClaimCheck | undefined }) {
  const label = sourceLabel(source?.verification);
  return (
    <div className="mt-2 ml-2 border-l-2 border-ink-200 pl-3 wrap-anywhere sm:ml-5">
      <p className="text-[12px] text-ink-600">
        <span className="font-medium text-ink-800">{source ? shortRef(source) : "Missing source"}</span> · reference {LABELS[label].title.toLowerCase()}
        {check ? <> · {VERDICT[check.verdict]}</> : label === "not_found" || label === "retracted" ? " · not support-checked" : ""}
      </p>
      {check?.evidence && (
        <blockquote className="mt-1 font-serif text-[13.5px] text-ink-700 italic">
          &ldquo;{check.evidence.text}&rdquo; <span className="font-sans text-[11px] text-ink-400 not-italic">(sentence {check.evidence.index + 1})</span>
        </blockquote>
      )}
      {check && <p className="mt-1 text-[11.5px] text-ink-500">{howChecked(check)}</p>}
      {check?.textOrigin === "student_text" && source?.studentText && !pastedTextMatch(source.studentText, source.record).related && (
        <p className="mt-1 text-[11.5px] font-medium text-amber-800">Note: the pasted text shares few key terms with this paper&apos;s title or abstract.</p>
      )}
      {check?.scopeFlags.length ? <p className="mt-1 text-[11.5px] text-amber-800">Flags: {check.scopeFlags.map((f) => SCOPE_TITLES[f.kind]).join(", ")}</p> : null}
      {check?.explanation && (
        <p className="mt-1 text-[12px] text-ink-600">
          {check.mode === "sample" ? "Sample reasoning" : "AI reasoning"}: {check.explanation}
        </p>
      )}
    </div>
  );
}

function ClaimEntry({ claim, index, project }: { claim: ResolvedClaim; index: number; project: Project }) {
  return (
    <li className="break-inside-avoid border-b border-ink-100 pb-5 last:border-0">
      {/* on phones the label goes under the claim instead of beside it */}
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:justify-between sm:gap-4">
        <p className="min-w-0 text-[14px] leading-relaxed text-ink-950 wrap-anywhere">
          <span className="mr-2 font-mono text-[11px] text-ink-400">{index + 1}</span>
          {claim.text}
        </p>
        <TrustBadge label={claim.label} size="sm" withTooltip={false} />
      </div>
      {claim.sourceIds.map((sid, i) => (
        <SourceResult key={sid} source={claim.sources[i]} check={claim.checks[i]} />
      ))}
      {claim.quote && <p className="mt-1.5 pl-5 text-[12px] text-ink-600">Direct quotation, page: {project.quotePages?.[claim.key] || "not given"}</p>}
      {claim.decision && (
        <p className="mt-1.5 pl-5 text-[12.5px] text-ink-800">
          Student decision: {claim.decision.action === "acknowledge" ? "acknowledged" : `kept with the reason "${claim.decision.reason}"`} ({new Date(claim.decision.at).toLocaleDateString()})
        </p>
      )}
    </li>
  );
}

function Report({ project }: { project: Project }) {
  const sources = useProjectSources(project.id);
  const claims = useProjectClaims(project);
  const gate = useGate(project, claims);
  const audit = useStore((s) => s.audit);
  const ai = useAiStatus();
  const [entries, setEntries] = useState<FormattedEntry[]>([]);
  const list = useMemo(() => orderedSources(sources, claims, false), [sources, claims]);
  const byId = new Map(sources.map((s) => [s.id, s]));
  useEffect(() => {
    formatReferences(list, project.style).then(setEntries).catch(() => setEntries([]));
  }, [list, project.style]);
  const generatedStatement = aiUseStatement(statementInput(project, sources, claims, audit, ai?.configured ? { model: ai.model, provider: ai.provider } : undefined));
  const edited = project.statementOverride !== undefined && project.statementOverride.trim() !== generatedStatement.trim();
  const statement = project.statementOverride ?? generatedStatement;
  const generated = new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/export">
            <ArrowLeft /> Back to export
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer /> Print or save as PDF
        </Button>
      </div>

      <article className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-ink-200 pb-6">
          <div className="min-w-0 wrap-anywhere">
            <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">ClaimTrace integrity report</p>
            <h1 className="font-display mt-2 text-[30px] leading-tight text-ink-950">{project.title}</h1>
            <p className="mt-2 font-serif text-[16px] text-ink-600 italic">{project.question}</p>
          </div>
          <LogoMark className="size-9" />
        </header>

        <section className="grid grid-cols-2 gap-4 border-b border-ink-200 py-5 text-[13px] md:grid-cols-4">
          <div>
            <p className="text-ink-500">Generated</p>
            <p className="font-medium text-ink-950">{generated}</p>
          </div>
          <div>
            <p className="text-ink-500">Signed off by</p>
            <p className="font-medium text-ink-950">{project.signOff ? `${project.signOff.name}, ${new Date(project.signOff.at).toLocaleDateString()}` : "Not signed off"}</p>
          </div>
          <div>
            <p className="text-ink-500">Claims</p>
            <p className="font-medium text-ink-950">
              {gate.total} checked · {gate.needDecision + gate.needAck} open
            </p>
          </div>
          <div>
            <p className="text-ink-500">Style</p>
            <p className="font-medium text-ink-950">{CITATION_STYLES.find((s) => s.id === project.style)?.name}</p>
          </div>
        </section>

        <section className="py-6">
          <h2 className="text-[13px] font-semibold tracking-wide text-ink-500 uppercase">Claims and evidence</h2>
          <ol className="mt-4 space-y-5">
            {claims.map((c, i) => (
              <ClaimEntry key={c.key} claim={c} index={i} project={project} />
            ))}
          </ol>
        </section>

        <section className="border-t border-ink-200 py-6">
          <h2 className="text-[13px] font-semibold tracking-wide text-ink-500 uppercase">References and verification</h2>
          <ol className="mt-4 space-y-3">
            {entries.map((e) => {
              const src = byId.get(e.id);
              return (
                <li key={e.id} className="flex flex-col items-start gap-1 text-[13px] leading-relaxed text-ink-800 sm:flex-row sm:justify-between sm:gap-4">
                  <span className="min-w-0 wrap-anywhere [&_i]:italic" dangerouslySetInnerHTML={{ __html: e.html }} />
                  <TrustBadge label={sourceLabel(src?.verification)} context="source" size="sm" withTooltip={false} />
                </li>
              );
            })}
          </ol>
        </section>

        <section className="border-t border-ink-200 py-6">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-ink-500 uppercase">
            AI-use statement
            {edited && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-medium tracking-normal text-amber-900 normal-case">Edited by the student</span>}
          </h2>
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-800">{statement}</p>
          {edited && (
            <div className="mt-3 rounded-lg bg-ink-50 p-3">
              <p className="text-[11.5px] font-medium text-ink-500">The statement ClaimTrace generated from the audit log, for comparison:</p>
              <p className="mt-1 font-serif text-[13.5px] leading-relaxed text-ink-600">{generatedStatement}</p>
            </div>
          )}
        </section>

        <footer className="border-t border-ink-200 pt-5 text-[11.5px] leading-relaxed text-ink-500">
          References were checked against Crossref and OpenAlex by code (existence, matching details, retraction status); &ldquo;Verified&rdquo; is about the reference. Support
          was judged by an AI model only where text was available, and code confirmed every evidence sentence is a whole sentence of that text and about the claim.
          &ldquo;Supported&rdquo; means the supporting sentence was found, not that the claim is true; &ldquo;Supported · your text&rdquo; means the evidence came from text the
          student pasted. Results marked SAMPLE are not live AI checks. The student is responsible for the final text.
        </footer>
      </article>
    </div>
  );
}

export function ReportView() {
  return <RequireProject>{(p) => <Report key={p.id} project={p} />}</RequireProject>;
}
