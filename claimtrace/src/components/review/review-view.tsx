"use client";

import { ArrowRight, Cpu, FlaskConical, Loader2, PenLine, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, Page, PageHeader, Panel } from "@/components/app/page";
import { RequireProject } from "@/components/app/require-project";
import { ClaimCard } from "@/components/claims/claim-card";
import { useClaimRunner } from "@/components/claims/use-claim-runner";
import { SourceSheet } from "@/components/library/source-sheet";
import { LabelBar } from "@/components/trust/label-bar";
import { LabelGuide } from "@/components/trust/label-guide";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CLAIM_LABEL_ORDER, LABELS, type TrustLabel } from "@/core/labels";
import type { Project } from "@/core/model";
import { decisionApplies } from "@/core/workflow/gate";
import { loadSampleChecks, sampleCandidates, sampleInfo } from "@/lib/demo";
import { countBy, useAiStatus, useGate, useProjectClaims, type ResolvedClaim } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type Filter = "all" | "decide" | "ack" | "done" | "pending";

/** Claim labels first, then the reference labels a claim card can show, for the "What the labels mean" guide. */
const GUIDE_LABELS: TrustLabel[] = [
  "supported",
  "supported_own_text",
  "overreach",
  "not_supported",
  "unchecked",
  "ai_reasoning",
  "verified",
  "close_match",
  "unavailable",
  "student_added",
  "not_found",
  "retracted",
  "pending",
];

function bucket(c: ResolvedClaim, missingPage: boolean): Exclude<Filter, "all"> {
  const gate = LABELS[c.label].gate;
  if (gate === "pending") return "pending";
  if (missingPage) return "decide";
  if (gate === "decide" && !decisionApplies(c.label, c.decision)) return "decide";
  if (gate === "acknowledge" && !decisionApplies(c.label, c.decision)) return "ack";
  return "done";
}

/** Shown on the demo project when live AI checks are unavailable: labelled sample results instead. */
function SampleBanner({ project, claims, onLoad, busy }: { project: Project; claims: ResolvedClaim[]; onLoad: () => void; busy: boolean }) {
  const aiFailed = claims.some((c) => c.checks.some((k) => k && k.mode === "code" && k.verdict === "unchecked" && k.reason !== "no_text"));
  const available = useMemo(() => sampleCandidates(project.id), [project.id, claims]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!project.isDemo || !available || !aiFailed) return null;
  return (
    <Panel className="mb-4 flex flex-wrap items-center gap-3 border-violet-200 bg-violet-50/50 p-4">
      <FlaskConical className="size-4 shrink-0 text-violet-700" />
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-violet-950">
        <span className="font-semibold">Live AI checks are unavailable.</span> For the demo you can show{" "}
        {sampleInfo.provenance === "recorded" ? `results recorded from a live run of ${sampleInfo.model ?? "the Skeptic"}` : "sample results prepared by Team 6"} for {available} claim
        check{available === 1 ? "" : "s"}. Each is labelled Sample, logged, and counted in the AI-use statement.
      </p>
      <Button size="sm" variant="outline" onClick={onLoad} disabled={busy}>
        <FlaskConical /> Show sample results
      </Button>
    </Panel>
  );
}

function Review({ project }: { project: Project }) {
  const claims = useProjectClaims(project);
  const gate = useGate(project, claims);
  const ai = useAiStatus();
  const { running, progress, runOne, runAll } = useClaimRunner(project.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [openSource, setOpenSource] = useState<string | null>(null);
  const counts = useMemo(() => countBy(claims.map((c) => c.label)), [claims]);
  const missing = (c: ResolvedClaim) => Boolean(c.quote) && !project.quotePages?.[c.key]?.trim();
  const buckets = useMemo(() => countBy(claims.map((c) => bucket(c, missing(c)))), [claims, project.quotePages]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = filter === "all" ? claims : claims.filter((c) => bucket(c, missing(c)) === filter);
  // a claim needs checking while its label is pending (claims citing a missing or retracted
  // source are never support-checked, so their empty checks do not count)
  const unchecked = claims.filter((c) => c.label === "pending");

  const tabs: Array<{ id: Filter; label: string; n: number; tone?: string }> = [
    { id: "all", label: "All claims", n: claims.length },
    { id: "decide", label: "Needs a decision", n: buckets.decide ?? 0, tone: "text-amber-800 bg-amber-100" },
    { id: "ack", label: "To acknowledge", n: buckets.ack ?? 0, tone: "text-sky-800 bg-sky-100" },
    { id: "pending", label: "Not checked", n: buckets.pending ?? 0 },
    { id: "done", label: "Done", n: buckets.done ?? 0, tone: "text-trace-800 bg-trace-100" },
  ];

  const showSamples = () => {
    const n = loadSampleChecks(project.id);
    if (n) toast.success(`Showing ${n} sample result${n === 1 ? "" : "s"}`, { description: "Labelled Sample, not live AI checks." });
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Steps 5 to 7 · Verify, challenge, decide"
        title="Review claims"
        description="Each cited sentence is checked against its source. Code verifies the reference; the Skeptic judges support; code confirms the quoted evidence. You decide."
        actions={
          <>
            <Button onClick={() => runAll(unchecked.length ? unchecked : claims)} disabled={Boolean(progress) || !claims.length}>
              {progress ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {progress ? `Checking ${progress.done} of ${progress.total}` : unchecked.length ? `Check ${unchecked.length} claim${unchecked.length === 1 ? "" : "s"}` : "Check all again"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/export">
                Export <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      <AnimatePresence>
        {progress && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <Progress value={(progress.done / progress.total) * 100} className="h-1.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {ai && !ai.configured && (
        <Panel className="mb-4 flex gap-3 border-sky-200 bg-sky-50/50 p-4">
          <Cpu className="mt-0.5 size-4 shrink-0 text-sky-700" />
          <p className="text-[13px] leading-relaxed text-sky-900">
            <span className="font-semibold">AI checks are offline.</span> The Verifier still checks every reference (it is code). For each claim, code finds the closest
            sentences and flags risky wording, but the claim stays <b>Unchecked</b> until the Skeptic can judge it. Add <code className="rounded bg-white px-1 font-mono text-[12px]">NVIDIA_API_KEY</code> to enable it.
          </p>
        </Panel>
      )}

      <SampleBanner project={project} claims={claims} onLoad={showSamples} busy={Boolean(progress)} />

      {claims.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<PenLine />}
            title="No cited claims yet"
            description="Write your draft and cite sources with @. Every sentence with a citation becomes a claim to check."
            action={
              <Button asChild>
                <Link href="/app/write">
                  <PenLine /> Open the editor
                </Link>
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <Panel className="mb-4 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[12.5px] text-ink-500">Where your claims stand</p>
                <p className="mt-1 text-[15px] text-ink-900">
                  <span className="font-semibold">{gate.needDecision}</span> need a decision · <span className="font-semibold">{gate.needAck}</span> to acknowledge ·{" "}
                  <span className="font-semibold">{gate.pending}</span> not checked
                </p>
              </div>
              <Button asChild size="sm" variant={gate.needDecision + gate.needAck + gate.pending === 0 ? "brand" : "outline"}>
                <Link href="/app/export">
                  {gate.needDecision + gate.needAck + gate.pending === 0 ? "All resolved: sign off" : "See the export gate"} <ArrowRight />
                </Link>
              </Button>
            </div>
            <LabelBar className="mt-4" counts={counts} order={CLAIM_LABEL_ORDER} />
          </Panel>

          <LabelGuide labels={GUIDE_LABELS} context="claim" className="mb-4" />

          <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter claims">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={filter === t.id}
                onClick={() => setFilter(t.id)}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
                  filter === t.id ? "border-ink-950 bg-ink-950 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-950",
                )}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 font-mono text-[10.5px]", filter === t.id ? "bg-white/15 text-white" : (t.tone ?? "bg-ink-100 text-ink-500"))}>{t.n}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {shown.map((c) => (
              <ClaimCard
                key={c.key}
                claim={c}
                project={project}
                index={claims.indexOf(c)}
                running={running.has(c.key)}
                onCheck={() => runOne(c)}
                onOpenSource={setOpenSource}
              />
            ))}
            {shown.length === 0 && (
              <Panel>
                <EmptyState icon={<ShieldCheck />} title="Nothing here" description="No claims match this filter." />
              </Panel>
            )}
          </div>
        </>
      )}

      <SourceSheet sourceId={openSource} onOpenChange={(o) => !o && setOpenSource(null)} />
    </Page>
  );
}

export function ReviewView() {
  return <RequireProject>{(p) => <Review key={p.id} project={p} />}</RequireProject>;
}
