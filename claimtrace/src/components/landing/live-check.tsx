"use client";

import { Check, CircleCheck, CircleMinus, CircleX, LoaderCircle, Quote, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { TrustBadge } from "@/components/trust/trust-badge";
import type { TrustLabel } from "@/core/labels";
import { cn } from "@/lib/utils";

type S = "pass" | "warn" | "fail" | "skip";
interface Scenario {
  claim: string;
  cite: string;
  dot: string;
  steps: Array<{ name: string; state: S; text: string }>;
  label: TrustLabel;
  evidence?: string;
  note?: { tone: "amber" | "rose"; text: string };
}

/* Real results from the demo project (live Crossref/OpenAlex lookups and real abstract sentences). */
const SCENARIOS: Scenario[] = [
  {
    claim: "Smartphones and social media caused the rise in teenage depression",
    cite: "(Twenge et al., 2017)",
    dot: "bg-trace-500",
    steps: [
      { name: "Exists", state: "pass", text: "Found" },
      { name: "Matches", state: "pass", text: "DOI matches" },
      { name: "Retraction", state: "warn", text: "Corrected only" },
      { name: "Supports", state: "warn", text: "Overreach" },
    ],
    label: "overreach",
    evidence: "…which may account for the increases in depression and suicide.",
    note: { tone: "amber", text: "The claim says “caused”; the source only says “may account for”." },
  },
  {
    claim: "In a UK cohort, the link between social media use and depressive symptoms was larger for girls than for boys",
    cite: "(Kelly et al., 2018)",
    dot: "bg-trace-500",
    steps: [
      { name: "Exists", state: "pass", text: "Found" },
      { name: "Matches", state: "pass", text: "DOI matches" },
      { name: "Retraction", state: "pass", text: "Not retracted" },
      { name: "Supports", state: "pass", text: "Supported" },
    ],
    label: "verified",
    evidence: "The magnitude of association between social media use and depressive symptoms was larger for girls than for boys.",
  },
  {
    claim: "Adolescents resist recommendation algorithms when they feel their freedom is threatened",
    cite: "(Lv et al., 2022)",
    dot: "bg-rose-800",
    steps: [
      { name: "Exists", state: "pass", text: "Found" },
      { name: "Matches", state: "pass", text: "DOI matches" },
      { name: "Retraction", state: "fail", text: "Retracted" },
      { name: "Supports", state: "skip", text: "Not used" },
    ],
    label: "retracted",
    note: { tone: "rose", text: "Retracted on 7 August 2025. Flagged by Crossref (Retraction Watch data) and OpenAlex." },
  },
  {
    claim: "A meta-analysis of 48 studies found Instagram doubles the risk of anxiety in teenagers",
    cite: "(Thompson & Okafor, 2021)",
    dot: "bg-rose-500",
    steps: [
      { name: "Exists", state: "fail", text: "Not found" },
      { name: "Matches", state: "skip", text: "Skipped" },
      { name: "Retraction", state: "skip", text: "Skipped" },
      { name: "Supports", state: "skip", text: "Skipped" },
    ],
    label: "not_found",
    note: { tone: "rose", text: "The DOI 10.1016/j.jadh.2021.03.007 is not registered in Crossref or OpenAlex. The reference appears to be invented." },
  },
];

const ICON: Record<S | "run", { icon: typeof CircleCheck; cls: string; chip: string }> = {
  pass: { icon: CircleCheck, cls: "text-trace-600", chip: "border-trace-200 bg-trace-50 text-trace-800" },
  warn: { icon: TriangleAlert, cls: "text-amber-600", chip: "border-amber-200 bg-amber-50 text-amber-800" },
  fail: { icon: CircleX, cls: "text-rose-600", chip: "border-rose-200 bg-rose-50 text-rose-800" },
  skip: { icon: CircleMinus, cls: "text-ink-300", chip: "border-ink-200 bg-white text-ink-400" },
  run: { icon: LoaderCircle, cls: "animate-spin text-ink-400", chip: "border-ink-200 bg-white text-ink-500" },
};

/** The landing page's live demo: one claim travelling through the checks. */
export function LiveCheck() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState(reduce ? 9 : 0);
  const sc = SCENARIOS[i];

  useEffect(() => {
    if (reduce) return;
    const timers = [450, 900, 1350, 1900, 2500, 3000].map((t, k) => setTimeout(() => setPhase(k + 1), t));
    timers.push(setTimeout(() => {
      setPhase(0);
      setI((x) => (x + 1) % SCENARIOS.length);
    }, 7600));
    return () => timers.forEach(clearTimeout);
  }, [i, reduce]);

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-trace-100/70 via-white to-sky-100/50 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl border border-ink-200/80 bg-white shadow-pop">
        <BorderBeam size={120} duration={7} colorFrom="#34cc9f" colorTo="#6eb6ff" borderWidth={1.5} />
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-ink-200" />
            <span className="size-2.5 rounded-full bg-ink-200" />
            <span className="size-2.5 rounded-full bg-ink-200" />
            <span className="ml-2 font-mono text-[11px] text-ink-400">claim check · live demo data</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span key={`${i}-${phase >= 4}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.25 }}>
              <TrustBadge label={phase >= 4 ? sc.label : "pending"} withTooltip={false} />
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="min-h-[360px] p-6">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <p className="font-serif text-[19px] leading-relaxed text-ink-950">
                {sc.claim}{" "}
                <span className="relative -top-0.5 inline-flex items-center gap-1 rounded-md bg-ink-50 px-1.5 py-px align-middle font-sans text-[12.5px] font-medium text-ink-700 ring-1 ring-ink-200 ring-inset">
                  <span className={cn("size-1.5 rounded-full", sc.dot)} />
                  {sc.cite}
                </span>
                .
              </p>

              <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {sc.steps.map((st, k) => {
                  const shown = phase > k;
                  const running = phase === k;
                  const v = shown ? ICON[st.state] : running ? ICON.run : ICON.skip;
                  const Icon = v.icon;
                  return (
                    <li key={st.name}>
                      <motion.div
                        animate={{ scale: shown ? [0.96, 1.03, 1] : 1 }}
                        transition={{ duration: 0.35 }}
                        className={cn("flex h-full flex-col gap-1 rounded-xl border px-3 py-2.5 transition-colors duration-300", shown ? v.chip : "border-ink-200 bg-white text-ink-400")}
                      >
                        <span className="font-mono text-[10px] tracking-wider uppercase opacity-70">{st.name}</span>
                        <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
                          <Icon className={cn("size-3.5", v.cls)} />
                          {shown ? st.text : running ? "Checking" : "Waiting"}
                        </span>
                      </motion.div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-5 space-y-3">
                <AnimatePresence>
                  {phase >= 5 && sc.evidence && (
                    <motion.figure initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200/70">
                      <Quote className="absolute top-3 right-3 size-4 text-ink-200" />
                      <blockquote className="pr-6 font-serif text-[15px] leading-relaxed text-ink-800 italic">&ldquo;{sc.evidence}&rdquo;</blockquote>
                      <figcaption className="mt-2 flex items-center gap-1 text-[11.5px] font-medium text-trace-700">
                        <Check className="size-3" strokeWidth={3} /> Sentence found in the abstract by code
                      </figcaption>
                    </motion.figure>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {phase >= 6 && sc.note && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2 rounded-lg px-3 py-2.5 text-[13px] leading-relaxed ring-1 ring-inset",
                        sc.note.tone === "amber" ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-rose-50 text-rose-900 ring-rose-200",
                      )}
                    >
                      <TriangleAlert className={cn("mt-0.5 size-3.5 shrink-0", sc.note.tone === "amber" ? "text-amber-600" : "text-rose-600")} />
                      {sc.note.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-25 px-5 py-3 text-[12px] text-ink-500">
          <span>Code checks the reference · the AI judges support · you decide</span>
          <span className="flex gap-1.5" aria-hidden="true">
            {SCENARIOS.map((_, k) => (
              <span key={k} className={cn("h-1.5 rounded-full transition-all duration-500", k === i ? "w-5 bg-ink-950" : "w-1.5 bg-ink-200")} />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
