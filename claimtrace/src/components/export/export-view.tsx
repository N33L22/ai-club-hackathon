"use client";

import {
  ArrowRight,
  Check,
  CircleCheck,
  CircleDashed,
  Copy,
  Download,
  FileDown,
  FileText,
  Hand,
  Lock,
  LockOpen,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Page, PageHeader, Panel } from "@/components/app/page";
import { RequireProject } from "@/components/app/require-project";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { inTextLabel } from "@/core/citation/csl";
import { docToText } from "@/core/evidence/claims";
import { CITATION_STYLES, type CitationStyleId, type Project } from "@/core/model";
import { aiUseStatement } from "@/core/workflow/statement";
import { sourceLabel } from "@/core/workflow/labels";
import { revokeSignOff, signOff } from "@/lib/actions";
import { exportFormat, formatReferences, type FormattedEntry } from "@/lib/citation";
import { useAiStatus, useGate, useProjectClaims, useProjectSources } from "@/lib/hooks";
import { download, orderedSources, slug, statementInput } from "@/lib/statement-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function GateRow({ done, title, detail, href }: { done: boolean; title: string; detail: string; href?: string }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <motion.span key={String(done)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 26 }}>
        {done ? <CircleCheck className="size-5 text-trace-600" /> : <CircleDashed className="size-5 text-ink-300" />}
      </motion.span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[14px] font-medium", done ? "text-ink-500 line-through decoration-ink-300" : "text-ink-950")}>{title}</p>
        <p className="mt-0.5 text-[12.5px] text-ink-500">{detail}</p>
      </div>
      {!done && href && (
        <Button asChild size="xs" variant="outline">
          <Link href={href}>
            Resolve <ArrowRight />
          </Link>
        </Button>
      )}
    </li>
  );
}

function CopyDownload({ text, filename, disabled, label = "Copy" }: { text: string; filename: string; disabled: boolean; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || !text}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="text-trace-600" /> : <Copy />} {copied ? "Copied" : label}
      </Button>
      <Button size="sm" variant="outline" disabled={disabled || !text} onClick={() => download(filename, text)}>
        <Download /> Download
      </Button>
    </div>
  );
}

function Export({ project }: { project: Project }) {
  const sources = useProjectSources(project.id);
  const claims = useProjectClaims(project);
  const gate = useGate(project, claims);
  const audit = useStore((s) => s.audit);
  const updateProject = useStore((s) => s.updateProject);
  const ai = useAiStatus();
  const [style, setStyle] = useState<CitationStyleId>(project.style);
  const [includeUncited, setIncludeUncited] = useState(false);
  const [formatted, setFormatted] = useState<{ key: string; entries: FormattedEntry[] } | null>(null);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const locked = !gate.ready;
  const prereqsDone = gate.pending === 0 && gate.needDecision === 0 && gate.needAck === 0;

  const list = useMemo(() => orderedSources(sources, claims, includeUncited), [sources, claims, includeUncited]);
  // results are keyed by request, so a stale list never shows and no state is reset inside the effect
  const requestKey = `${style}|${list.map((s) => `${s.id}:${s.verification?.status ?? ""}`).join(",")}`;
  useEffect(() => {
    let live = true;
    formatReferences(list, style)
      .then((e) => live && setFormatted({ key: requestKey, entries: e }))
      .catch(() => live && setFormatted({ key: requestKey, entries: [] }));
    return () => {
      live = false;
    };
  }, [list, style, requestKey]);
  const entries = formatted?.key === requestKey ? formatted.entries : null;

  const byId = new Map(sources.map((s) => [s.id, s]));
  const numbers = new Map(list.map((s, i) => [s.id, i + 1]));
  const generated = useMemo(
    () => aiUseStatement(statementInput(project, sources, claims, audit, ai?.configured ? { model: ai.model, provider: ai.provider } : undefined)),
    [project, sources, claims, audit, ai],
  );
  const statement = project.statementOverride ?? generated;
  const referencesText = (entries ?? []).map((e) => e.text).join("\n\n");
  const draftText = useMemo(
    () => `${project.title}\n\n${docToText(project.doc, (id) => inTextLabel(byId.get(id), style, numbers.get(id)))}\n\nReferences\n\n${referencesText}\n\nAI-use statement\n\n${statement}\n`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.doc, project.title, style, referencesText, statement],
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Step 7 · Decide and export · checkpoints 2 and 3"
        title="Export"
        description="Export unlocks once every claim is checked, every flag has your decision, and you sign off. You stay the author of record."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/report">
              <Printer /> Integrity report
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Panel className="relative overflow-hidden">
          <div className={cn("absolute inset-x-0 top-0 h-24 transition-colors duration-700", gate.ready ? "bg-gradient-to-b from-trace-50 to-transparent" : "bg-gradient-to-b from-ink-50 to-transparent")} aria-hidden="true" />
          <div className="relative flex items-center gap-4 px-6 pt-6">
            <motion.span
              key={String(gate.ready)}
              initial={{ rotate: -12, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className={cn("grid size-14 place-items-center rounded-2xl shadow-card", gate.ready ? "bg-trace-500 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200")}
            >
              {gate.ready ? <LockOpen className="size-6" /> : <Lock className="size-6" />}
            </motion.span>
            <div>
              <p className="text-[20px] font-semibold tracking-[-0.02em] text-ink-950">{gate.ready ? "Export unlocked" : "Export is locked"}</p>
              <p className="text-[13px] text-ink-500">{gate.ready ? `Signed off by ${project.signOff?.name}` : "Complete the checklist to unlock it."}</p>
            </div>
          </div>
          <ul className="relative divide-y divide-ink-100 px-6 pt-3">
            <GateRow done={gate.pending === 0} title="Every claim has been checked" detail={gate.pending ? `${gate.pending} claim${gate.pending === 1 ? "" : "s"} not checked yet` : `${gate.total} claims checked`} href="/app/review" />
            <GateRow
              done={gate.needDecision === 0}
              title="Every flag has your decision"
              detail={gate.needDecision ? `${gate.needDecision} need a decision (fix, replace or keep with a reason)${gate.missingPages ? `, including ${gate.missingPages} quote${gate.missingPages === 1 ? "" : "s"} without a page` : ""}` : "No open flags"}
              href="/app/review"
            />
            <GateRow done={gate.needAck === 0} title="Unchecked claims acknowledged" detail={gate.needAck ? `${gate.needAck} to acknowledge` : "Nothing left to acknowledge"} href="/app/review" />
            <GateRow done={Boolean(project.signOff)} title="You signed off" detail={project.signOff ? `${project.signOff.name}, ${new Date(project.signOff.at).toLocaleString()}` : "Checkpoint 3: confirm you reviewed every claim"} />
          </ul>
          <div className="relative border-t border-ink-100 bg-ink-25 p-6">
            {project.signOff ? (
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[13px] text-ink-600">
                  <Hand className="size-4 text-amber-600" /> Signed off. Editing the draft can reopen flags.
                </p>
                <Button size="sm" variant="ghost" onClick={() => revokeSignOff(project.id)}>
                  <RotateCcw /> Withdraw sign-off
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  signOff(project.id, name);
                  toast.success("Signed off", { description: "Your decision is recorded in the audit log." });
                }}
                className="space-y-3"
              >
                <p className="flex items-center gap-2 text-[12px] font-medium tracking-wide text-amber-800 uppercase">
                  <Hand className="size-3.5" /> Checkpoint 3 · sign-off
                </p>
                <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-700">
                  <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} disabled={!prereqsDone} className="mt-0.5" />
                  I have read every claim and its evidence. The final wording, sources and decisions are mine, and I take responsibility for them.
                </label>
                <div className="flex gap-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" disabled={!prereqsDone} />
                  <Button type="submit" disabled={!prereqsDone || !agree || name.trim().length < 2}>
                    Sign off
                  </Button>
                </div>
                {!prereqsDone && <p className="text-[12px] text-ink-500">Available once the items above are complete.</p>}
              </form>
            )}
          </div>
        </Panel>

        <Panel className="relative overflow-hidden">
          <Tabs defaultValue="refs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3">
              <TabsList>
                <TabsTrigger value="refs">References</TabsTrigger>
                <TabsTrigger value="statement">AI-use statement</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              {locked && (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500">
                  <Lock className="size-3.5" /> Preview only
                </span>
              )}
            </div>

            <TabsContent value="refs" className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select value={style} onValueChange={(v) => setStyle(v as CitationStyleId)}>
                  <SelectTrigger className="h-9 w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITATION_STYLES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-[13px] text-ink-600">
                  <Switch checked={includeUncited} onCheckedChange={setIncludeUncited} /> Include uncited sources
                </label>
                {style !== project.style && (
                  <Button size="xs" variant="ghost" onClick={() => updateProject(project.id, { style })}>
                    Make {CITATION_STYLES.find((s) => s.id === style)?.short} the project style
                  </Button>
                )}
              </div>
              <ol className={cn("max-h-[420px] space-y-3 overflow-y-auto pr-1", locked && "select-none")}>
                {entries === null
                  ? Array.from({ length: 4 }, (_, i) => <li key={i} className="shimmer h-12 rounded-lg" />)
                  : entries.map((e, i) => {
                      const src = byId.get(e.id);
                      const label = sourceLabel(src?.verification);
                      return (
                        <motion.li key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="group flex items-start gap-3">
                          <div className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-ink-800 [&_i]:italic" dangerouslySetInnerHTML={{ __html: e.html }} />
                          {label !== "verified" && <TrustBadge label={label} context="source" size="sm" />}
                        </motion.li>
                      );
                    })}
              </ol>
              <div className="mt-4 flex justify-end">
                <CopyDownload text={referencesText} filename={`${slug(project.title)}-references.txt`} disabled={locked} />
              </div>
            </TabsContent>

            <TabsContent value="statement" className="p-5">
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                <Sparkles className="size-3.5 text-violet-600" /> Generated from your audit log: which steps used AI, the model, and what you changed.
              </p>
              <Textarea rows={9} value={statement} onChange={(e) => updateProject(project.id, { statementOverride: e.target.value })} className="font-serif text-[14.5px] leading-relaxed" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {project.statementOverride !== undefined ? (
                  <Button size="sm" variant="ghost" onClick={() => updateProject(project.id, { statementOverride: undefined })}>
                    <RotateCcw /> Reset to generated
                  </Button>
                ) : (
                  <span className="text-[12px] text-ink-400">You can edit it; edits are yours to stand behind.</span>
                )}
                <CopyDownload text={statement} filename={`${slug(project.title)}-ai-use-statement.txt`} disabled={locked} />
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-3 p-5">
              {[
                { icon: FileText, title: "Draft with citations", detail: `Your text with ${CITATION_STYLES.find((s) => s.id === style)?.short} citations, the reference list and the AI-use statement (.txt)`, run: () => download(`${slug(project.title)}.txt`, draftText) },
                { icon: FileDown, title: "BibTeX", detail: "For LaTeX, Zotero or Mendeley (.bib)", run: async () => download(`${slug(project.title)}.bib`, await exportFormat(list, "bibtex")) },
                { icon: FileDown, title: "RIS", detail: "For EndNote and most reference managers (.ris)", run: async () => download(`${slug(project.title)}.ris`, await exportFormat(list, "ris")) },
              ].map((f) => (
                <button
                  key={f.title}
                  type="button"
                  disabled={locked}
                  onClick={() => void f.run()}
                  className="flex w-full items-center gap-3 rounded-xl border border-ink-200 p-3.5 text-left shadow-card transition-colors hover:border-ink-300 hover:bg-ink-25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-ink-50 text-ink-600 ring-1 ring-ink-200">
                    <f.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-ink-950">{f.title}</span>
                    <span className="block text-[12px] text-ink-500">{f.detail}</span>
                  </span>
                  <Download className="size-4 text-ink-400" />
                </button>
              ))}
              <Link href="/app/report" className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5 shadow-card transition-colors hover:border-ink-300 hover:bg-ink-25">
                <span className="grid size-9 place-items-center rounded-lg bg-ink-50 text-ink-600 ring-1 ring-ink-200">
                  <Printer className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-ink-950">Integrity report</span>
                  <span className="block text-[12px] text-ink-500">Every claim, its evidence and your decision, for your supervisor (print or save as PDF)</span>
                </span>
                <ArrowRight className="size-4 text-ink-400" />
              </Link>
            </TabsContent>
          </Tabs>
          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
        </Panel>
      </div>
    </Page>
  );
}

export function ExportView() {
  return <RequireProject>{(p) => <Export key={p.id} project={p} />}</RequireProject>;
}
