"use client";

import { Cpu, Database, Download, FlaskConical, Landmark, Scale, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { Page, PageHeader, Panel, PanelHeader } from "@/components/app/page";
import { TrustBadge } from "@/components/trust/trust-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { THRESHOLDS } from "@/core/config";
import { LABELS, type TrustLabel } from "@/core/labels";
import { useAiStatus } from "@/lib/hooks";
import { download } from "@/lib/statement-data";
import { storedBytes, useStore } from "@/lib/store";
import evaluation from "@/lib/eval-results.json";

const LIMITATIONS = [
  ["Abstracts are missing for many papers", "OpenAlex has abstracts for roughly half of all works. Without text, claims stay Unchecked unless you paste text you have read."],
  ["Paywalled full text is not read", "Support checks use the abstract or your pasted text, never a paper the tool cannot legally access."],
  ["The AI can misjudge support", "Every evidence sentence is re-checked by code, and you see the evidence and decide. Verified means the sentence was found, not that the claim is true."],
  ["Free AI tier limits", "NVIDIA's free tier allows about 40 requests a minute (community-reported). Results are cached; when the budget runs out, claims show Unchecked."],
  ["Database coverage is uneven", "Crossref and OpenAlex over-represent some languages and regions. The source-mix view helps you notice imbalance."],
  ["Fuzzy matching is not perfect", "Thresholds are tuned on a test set (below). Near-misses become Close match so you can compare and confirm."],
];

const ORDER: TrustLabel[] = ["verified", "overreach", "not_supported", "unchecked", "ai_reasoning", "not_found", "retracted", "close_match", "student_added"];

type EvalSummary = {
  ranAt?: string;
  total: number;
  correct: number;
  byExpected: Record<string, { total: number; correct: number }>;
  mistakes: Array<{ ref: string; expected: string; got: string }>;
};
type EvalResults = EvalSummary & { holdout?: EvalSummary };

export function SettingsView() {
  const ai = useAiStatus();
  const router = useRouter();
  const deleteAll = useStore((s) => s.deleteAllData);
  const projects = useStore((s) => s.projects);
  const sources = useStore((s) => s.sources);
  const audit = useStore((s) => s.audit);
  const bytes = useMemo(() => storedBytes(), [projects, sources, audit]); // eslint-disable-line react-hooks/exhaustive-deps
  const ev = evaluation as unknown as EvalResults;

  return (
    <Page>
      <PageHeader eyebrow="Settings" title="Privacy, AI and the checks" description="What ClaimTrace sends where, what it stores, and exactly how each check decides." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={<Cpu />} title="AI connection" description="Two narrow agents and an assistant. Code makes every final check." />
          <div className="space-y-4 px-5 py-4 text-[13.5px]">
            <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
              <span className="text-ink-600">Status</span>
              <span className="font-medium text-ink-950">{ai === null ? "Checking…" : ai.configured ? "Live" : "Offline (no key configured)"}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
              <span className="text-ink-600">Model</span>
              <span className="font-mono text-[12.5px] text-ink-950">{ai?.model ?? "…"}</span>
            </div>
            <div>
              <p className="font-medium text-ink-900">What is sent to the AI</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-600">
                <li>The single claim being checked, and the numbered sentences of the abstract or of text you pasted.</li>
                <li>Your research question, when the Scout plans a search.</li>
                <li>Never your name, email, other claims or your whole draft.</li>
              </ul>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-500">
              The key lives only on the server (<code className="font-mono">NVIDIA_API_KEY</code>). Any OpenAI-compatible provider works by changing <code className="font-mono">AI_BASE_URL</code> and{" "}
              <code className="font-mono">AI_MODEL</code>.
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader icon={<Database />} title="Your data" description="Stored only in this browser. There is no account and no server database." />
          <div className="space-y-4 px-5 py-4 text-[13.5px]">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Projects", Object.keys(projects).length],
                ["Sources", Object.keys(sources).length],
                ["Log entries", audit.length],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-ink-50 px-3 py-3">
                  <p className="text-[20px] font-semibold text-ink-950">{v}</p>
                  <p className="text-[12px] text-ink-500">{k}</p>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-ink-500">About {(bytes / 1024).toFixed(0)} KB in this browser&apos;s local storage. Clearing your browser data also removes it.</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const s = useStore.getState();
                  download(
                    "claimtrace-data.json",
                    JSON.stringify({ exportedAt: new Date().toISOString(), projects: s.projects, sources: s.sources, folders: s.folders, checks: s.checks, decisions: s.decisions, audit: s.audit }, null, 2),
                    "application/json",
                  );
                }}
              >
                <Download /> Download all my data
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-rose-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800">
                    <Trash2 /> Delete all my data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete everything ClaimTrace stored in this browser?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes all projects, sources, drafts, checks, decisions and the audit log. It cannot be undone. Download your data first if you need it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 hover:bg-rose-700"
                      onClick={() => {
                        deleteAll();
                        toast.success("All ClaimTrace data was deleted from this browser.");
                        router.push("/app");
                      }}
                    >
                      Delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader icon={<ShieldCheck />} title="How the checks decide" description="These are the exact rules the code uses (src/core/config.ts)." />
        <div className="grid gap-x-8 gap-y-3 px-5 py-4 text-[13.5px] md:grid-cols-2">
          {[
            ["DOI first", "A DOI that resolves in Crossref or OpenAlex is the strongest match. A real DOI attached to a different title is Not found."],
            ["Title match", `At least ${Math.round(THRESHOLDS.titleMatch * 100)}% similar (ignoring case, punctuation, word order and "RETRACTED:"). Below ${Math.round(THRESHOLDS.titleDifferentPaper * 100)}% means a different paper.`],
            ["First author and year", `Surnames match despite accents and typos; years may differ by ${THRESHOLDS.yearTolerance} (online first vs print). Differences give a Close match.`],
            ["Pasted references", `At least ${Math.round(THRESHOLDS.freeTextVerified * 100)}% of the record's title words, the first author and the year must appear. ${Math.round(THRESHOLDS.freeTextClose * 100)}% or more is a Close match.`],
            ["Retractions", "Crossref (including Retraction Watch data) and OpenAlex are both checked. The label says which database flagged it."],
            ["Evidence quotes", `An AI-proposed sentence counts only if code finds it in the source (at least ${Math.round(THRESHOLDS.quoteMatch * 100)}% identical).`],
            ["Patchwriting", `${THRESHOLDS.patchwritingWords} or more consecutive words shared with the source (outside quotation marks) are flagged.`],
            ["Overreach hints", "Code flags causal wording for associations, certainty the source does not express, and claims about everyone from one sample. The Skeptic judges them."],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-ink-100 pb-3">
              <p className="font-medium text-ink-950">{k}</p>
              <p className="mt-0.5 leading-relaxed text-ink-600">{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader icon={<FlaskConical />} title="Verifier accuracy" description="Measured on a labelled test set of real, fabricated, mismatched and retracted references (npm run eval)." />
          <div className="px-5 py-4">
            {ev.total ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {ev.holdout && (
                    <div className="rounded-xl bg-trace-50 px-4 py-3 ring-1 ring-trace-200 ring-inset">
                      <p className="text-[12px] text-trace-800">Held-out set (run once)</p>
                      <p className="mt-0.5 text-[26px] font-semibold tracking-[-0.03em] text-ink-950">
                        {ev.holdout.correct} of {ev.holdout.total}
                      </p>
                    </div>
                  )}
                  <div className="rounded-xl bg-ink-50 px-4 py-3">
                    <p className="text-[12px] text-ink-500">Development set (rules tuned on it)</p>
                    <p className="mt-0.5 text-[26px] font-semibold tracking-[-0.03em] text-ink-950">
                      {ev.correct} of {ev.total}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                  The held-out references were written after the rules were tuned and run once. Both sets are small, so treat these as early evidence, not a
                  guarantee.
                </p>
                <ul className="mt-3 space-y-1.5 text-[13px]">
                  {Object.entries(ev.byExpected).map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between gap-3 border-b border-ink-100 pb-1.5">
                      <TrustBadge label={k as TrustLabel} context="source" size="sm" />
                      <span className="font-mono text-[12px] text-ink-600">
                        {v.correct}/{v.total}
                      </span>
                    </li>
                  ))}
                </ul>
                {ev.mistakes.length > 0 && (
                  <details className="mt-3 text-[12.5px] text-ink-600">
                    <summary className="cursor-pointer font-medium">Misclassified ({ev.mistakes.length})</summary>
                    <ul className="mt-2 space-y-1.5">
                      {ev.mistakes.map((m) => (
                        <li key={m.ref}>
                          {m.ref.slice(0, 90)}… expected {m.expected}, got {m.got}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {ev.ranAt && <p className="mt-3 text-[11.5px] text-ink-400">Run on {new Date(ev.ranAt).toLocaleString()} against the live Crossref and OpenAlex APIs.</p>}
              </>
            ) : (
              <p className="text-[13px] text-ink-500">No evaluation results yet. Run npm run eval.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader icon={<Scale />} title="Known limitations" description="Stated openly, so nobody mistakes a label for a guarantee." />
          <ul className="space-y-3 px-5 py-4">
            {LIMITATIONS.map(([k, v]) => (
              <li key={k} className="text-[13px] leading-relaxed">
                <span className="font-medium text-ink-950">{k}.</span> <span className="text-ink-600">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <PanelHeader title="Trust labels" description="Every label is shown with an icon and its name, never colour alone." />
          <ul className="divide-y divide-ink-100">
            {ORDER.map((l) => (
              <li key={l} className="flex gap-4 px-5 py-3">
                <span className="w-32 shrink-0">
                  <TrustBadge label={l} withTooltip={false} />
                </span>
                <span className="text-[13px] leading-relaxed text-ink-600">{LABELS[l].claim}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader icon={<Landmark />} title="Governance" description="Who is accountable, and the rules ClaimTrace follows." />
          <div className="space-y-4 px-5 py-4 text-[13px] leading-relaxed text-ink-600">
            <p>
              <span className="font-medium text-ink-950">The student is the author of record</span> and makes every final decision. ClaimTrace gives evidence, not verdicts, and logs
              every AI output and decision. Team 6 owns the system&apos;s behaviour and fixes reported errors.
            </p>
            <p>
              <span className="font-medium text-ink-950">AI disclosure.</span> Inline labels separate AI reasoning from verified sources, and every export includes an AI-use
              statement. Output that is not a live AI call is labelled Sample.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>SP Jain academic integrity and AI-use policy</li>
              <li>APA 7, including APA guidance on citing generative AI</li>
              <li>UNESCO guidance on generative AI in education and research (2023)</li>
              <li>Data minimisation in line with GDPR principles</li>
              <li>OpenAlex, Crossref and NVIDIA terms of use</li>
            </ul>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
