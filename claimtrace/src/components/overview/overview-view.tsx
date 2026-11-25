"use client";

import { ArrowRight, Check, FileCheck2, Hand, Lock, PencilLine, ScrollText } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityList } from "@/components/app/activity";
import { Page, PageHeader, Panel, PanelHeader } from "@/components/app/page";
import { RequireProject } from "@/components/app/require-project";
import { STEPS, useWorkflowProgress } from "@/components/app/workflow-stepper";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { LabelBar } from "@/components/trust/label-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLAIM_LABEL_ORDER, SOURCE_LABEL_ORDER } from "@/core/labels";
import { CITATION_STYLES, type CitationStyleId, type Project } from "@/core/model";
import { countBy, useGate, useProjectClaims, useProjectSources, useSourceCounts } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const WHO_STYLE: Record<string, string> = {
  You: "bg-ink-100 text-ink-700",
  Code: "bg-trace-100 text-trace-800",
  "AI Scout": "bg-violet-100 text-violet-700",
  "AI Skeptic": "bg-violet-100 text-violet-700",
};

function EditProjectDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const update = useStore((s) => s.updateProject);
  const [title, setTitle] = useState(project.title);
  const [question, setQuestion] = useState(project.question);
  const [style, setStyle] = useState<CitationStyleId>(project.style);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Changing the question does not change sources you have already approved.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ep-title">Project name</Label>
            <Input id="ep-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep-q">Research question</Label>
            <Textarea id="ep-q" rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} className="font-serif text-[15px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Citation style</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as CitationStyleId)}>
              <SelectTrigger className="w-full">
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
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={title.trim().length < 2 || question.trim().length < 8}
            onClick={() => {
              update(project.id, { title: title.trim(), question: question.trim(), style });
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, children, href, cta }: { label: string; value: number; children?: React.ReactNode; href: string; cta: string }) {
  return (
    <Panel className="flex flex-col p-5">
      <p className="text-[12.5px] font-medium text-ink-500">{label}</p>
      <NumberTicker value={value} className="mt-1 text-[34px] font-semibold tracking-[-0.03em] normal-nums text-ink-950" />
      <div className="mt-3 flex-1">{children}</div>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-trace-700 hover:text-trace-800">
        {cta} <ArrowRight className="size-3.5" />
      </Link>
    </Panel>
  );
}

function Overview({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);
  const sources = useProjectSources(project.id);
  const claims = useProjectClaims(project);
  const gate = useGate(project, claims);
  const { done, current } = useWorkflowProgress();
  const sourceCounts = useSourceCounts(sources);
  const claimCounts = useMemo(() => countBy(claims.map((c) => c.label)), [claims]);
  const audit = useStore((s) => s.audit);
  const recent = useMemo(() => audit.filter((e) => e.projectId === project.id).slice(-6).reverse(), [audit, project.id]);
  const next = STEPS[Math.min(current, STEPS.length - 1)];
  const style = CITATION_STYLES.find((s) => s.id === project.style)?.short;

  return (
    <Page>
      <PageHeader
        eyebrow={project.isDemo ? "Overview · demo project" : "Overview"}
        title={project.title}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilLine /> Edit
            </Button>
            {current < STEPS.length && (
              <Button asChild>
                <Link href={next.href}>
                  Continue: {next.name} <ArrowRight />
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-trace-100/60 blur-3xl" aria-hidden="true" />
          <p className="font-mono text-[11px] tracking-[0.14em] text-ink-400 uppercase">Research question</p>
          <p className="font-display relative mt-3 text-[25px] leading-snug text-ink-950 md:text-[28px]">{project.question}</p>
          <p className="mt-4 text-[12.5px] text-ink-500">
            Citation style <span className="font-medium text-ink-800">{style}</span>
          </p>
        </Panel>
        <Panel className="flex flex-col justify-between p-6">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] text-ink-400 uppercase">Next step</p>
            {current < STEPS.length ? (
              <>
                <p className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-ink-950">
                  {next.n}. {next.name}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{next.hint}</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-ink-950">Ready to export</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">Every claim has a decision and you have signed off.</p>
              </>
            )}
          </div>
          <Button asChild className="mt-5 w-full" variant={current < STEPS.length ? "default" : "brand"}>
            <Link href={current < STEPS.length ? next.href : "/app/export"}>
              {current < STEPS.length ? `Go to ${next.name}` : "Open export"} <ArrowRight />
            </Link>
          </Button>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Workflow" description="Seven steps. The AI suggests, code checks, you decide." />
        <ol className="grid gap-px overflow-hidden rounded-b-2xl bg-ink-100 sm:grid-cols-2 lg:grid-cols-7">
          {STEPS.map((s, i) => {
            const isDone = done[i];
            const isCurrent = i === current;
            return (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={cn("relative bg-white p-4", isCurrent && "bg-gradient-to-b from-trace-50/70 to-white")}
              >
                <Link href={s.href} className="block">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full font-mono text-[12px]",
                        isDone ? "bg-trace-500 text-white" : isCurrent ? "bg-ink-950 text-white" : "bg-white text-ink-500 ring-1 ring-ink-200",
                      )}
                    >
                      {isDone ? <Check className="size-3.5" strokeWidth={3} /> : s.n}
                    </span>
                    {"checkpoint" in s && s.checkpoint && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-800 ring-1 ring-amber-200 ring-inset">
                        <Hand className="size-3" /> Checkpoint
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[14px] font-semibold text-ink-950">{s.name}</p>
                  <span className={cn("mt-1 inline-block rounded px-1.5 py-px text-[10.5px] font-medium", WHO_STYLE[s.who])}>{s.who}</span>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-500">{s.hint}</p>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </Panel>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Stat label="Sources in library" value={sources.length} href="/app/library" cta="Open library">
          <LabelBar counts={sourceCounts} order={SOURCE_LABEL_ORDER} />
        </Stat>
        <Stat label="Cited claims in draft" value={claims.length} href="/app/review" cta="Review claims">
          <LabelBar counts={claimCounts} order={CLAIM_LABEL_ORDER} />
        </Stat>
        <Panel className="flex flex-col p-5">
          <p className="text-[12.5px] font-medium text-ink-500">Export gate</p>
          <div className="mt-2 flex items-center gap-3">
            <span className={cn("grid size-11 place-items-center rounded-xl", gate.ready ? "bg-trace-100 text-trace-700" : "bg-ink-100 text-ink-600")}>
              {gate.ready ? <FileCheck2 className="size-5" /> : <Lock className="size-5" />}
            </span>
            <div>
              <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink-950">{gate.ready ? "Unlocked" : "Locked"}</p>
              <p className="text-[12.5px] text-ink-500">{gate.ready ? "You signed off every claim." : "Until every flag has a decision."}</p>
            </div>
          </div>
          <ul className="mt-4 flex-1 space-y-1.5 text-[12.5px] text-ink-600">
            <li className="flex justify-between">
              Not checked yet <span className="font-mono">{gate.pending}</span>
            </li>
            <li className="flex justify-between">
              Flags needing a decision <span className="font-mono">{gate.needDecision}</span>
            </li>
            <li className="flex justify-between">
              To acknowledge <span className="font-mono">{gate.needAck}</span>
            </li>
            <li className="flex justify-between">
              Signed off <span className="font-mono">{project.signOff ? "yes" : "no"}</span>
            </li>
          </ul>
          <Link href="/app/export" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-trace-700 hover:text-trace-800">
            Open export <ArrowRight className="size-3.5" />
          </Link>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader
          icon={<ScrollText />}
          title="Recent activity"
          description="Every AI output and every decision you make is logged."
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/audit">
                Full audit log <ArrowRight />
              </Link>
            </Button>
          }
        />
        <ActivityList events={recent} />
      </Panel>

      <EditProjectDialog key={`${project.id}-${editing}`} project={project} open={editing} onOpenChange={setEditing} />
    </Page>
  );
}

export function OverviewView() {
  return <RequireProject>{(p) => <Overview project={p} />}</RequireProject>;
}
