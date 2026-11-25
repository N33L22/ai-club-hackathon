"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { RequireProject } from "@/components/app/require-project";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { shortRef } from "@/core/citation/csl";
import { CITATION_STYLES, type Project } from "@/core/model";
import { aiUseStatement } from "@/core/workflow/statement";
import { sourceLabel } from "@/core/workflow/labels";
import { formatReferences, type FormattedEntry } from "@/lib/citation";
import { useAiStatus, useGate, useProjectClaims, useProjectSources } from "@/lib/hooks";
import { orderedSources, statementInput } from "@/lib/statement-data";
import { useStore } from "@/lib/store";

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
  const statement = project.statementOverride ?? aiUseStatement(statementInput(project, sources, claims, audit, ai?.configured ? { model: ai.model, provider: ai.provider } : undefined));
  const generated = new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
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

      <article className="rounded-2xl border border-ink-200 bg-white p-10 shadow-card print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-ink-200 pb-6">
          <div>
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
            {claims.map((c, i) => {
              const check = c.checks.find(Boolean);
              return (
                <li key={c.key} className="break-inside-avoid border-b border-ink-100 pb-5 last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[14px] leading-relaxed text-ink-950">
                      <span className="mr-2 font-mono text-[11px] text-ink-400">{i + 1}</span>
                      {c.text}
                    </p>
                    <TrustBadge label={c.label} size="sm" withTooltip={false} />
                  </div>
                  <p className="mt-1.5 pl-5 text-[12px] text-ink-500">Cites {c.sources.map((s) => shortRef(s)).join("; ")}</p>
                  {check?.evidence && (
                    <blockquote className="mt-2 ml-5 border-l-2 border-ink-200 pl-3 font-serif text-[13.5px] text-ink-700 italic">
                      &ldquo;{check.evidence.text}&rdquo; <span className="font-sans text-[11px] text-ink-400 not-italic">(sentence {check.evidence.index + 1}, confirmed in source by code)</span>
                    </blockquote>
                  )}
                  {check?.explanation && <p className="mt-2 pl-5 text-[12.5px] text-ink-600">AI reasoning: {check.explanation}</p>}
                  {c.quote && <p className="mt-1.5 pl-5 text-[12px] text-ink-600">Direct quotation, page: {project.quotePages?.[c.key] || "not given"}</p>}
                  {c.decision && (
                    <p className="mt-1.5 pl-5 text-[12.5px] text-ink-800">
                      Student decision: {c.decision.action === "acknowledge" ? "acknowledged" : `kept with the reason "${c.decision.reason}"`} ({new Date(c.decision.at).toLocaleDateString()})
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="border-t border-ink-200 py-6">
          <h2 className="text-[13px] font-semibold tracking-wide text-ink-500 uppercase">References and verification</h2>
          <ol className="mt-4 space-y-3">
            {entries.map((e) => {
              const src = byId.get(e.id);
              return (
                <li key={e.id} className="flex items-start justify-between gap-4 text-[13px] leading-relaxed text-ink-800">
                  <span className="[&_i]:italic" dangerouslySetInnerHTML={{ __html: e.html }} />
                  <TrustBadge label={sourceLabel(src?.verification)} context="source" size="sm" withTooltip={false} />
                </li>
              );
            })}
          </ol>
        </section>

        <section className="border-t border-ink-200 py-6">
          <h2 className="text-[13px] font-semibold tracking-wide text-ink-500 uppercase">AI-use statement</h2>
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-800">{statement}</p>
        </section>

        <footer className="border-t border-ink-200 pt-5 text-[11.5px] leading-relaxed text-ink-500">
          References were checked against Crossref and OpenAlex by code (existence, matching details, retraction status). Support was judged by an AI model only where text was
          available, and every quoted sentence was confirmed in the source by code. &ldquo;Verified&rdquo; means the supporting sentence was found, not that the claim is true. The
          student is responsible for the final text.
        </footer>
      </article>
    </div>
  );
}

export function ReportView() {
  return <RequireProject>{(p) => <Report key={p.id} project={p} />}</RequireProject>;
}
