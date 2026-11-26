"use client";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  Database,
  FileCheck2,
  Globe,
  Hand,
  Lock,
  PenLine,
  Quote,
  ScanSearch,
  SearchX,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";
import BlurText from "@/components/reactbits/BlurText";
import CountUp from "@/components/reactbits/CountUp";
import ShinyText from "@/components/reactbits/ShinyText";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { STEPS } from "@/components/app/workflow-stepper";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { LABELS, labelMeaning, type TrustLabel } from "@/core/labels";
import evaluation from "@/lib/eval-results.json";
import { useAiStatus } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { LiveCheck } from "./live-check";

/** The model the server is actually configured with ("vendor/model-name" -> "model-name"), never a hard-coded name. */
function useModelName(): { model?: string; provider: string } {
  const ai = useAiStatus();
  return { model: ai?.model ? ai.model.split("/").pop() : undefined, provider: ai?.provider || "NVIDIA NIM" };
}

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-ink-200/70 bg-white/80 backdrop-blur-md" : "border-b border-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5">
        <Link href="/" aria-label="ClaimTrace home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-[13.5px] text-ink-600 md:flex" aria-label="Sections">
          <a href="#checks" className="hover:text-ink-950">The checks</a>
          <a href="#how" className="hover:text-ink-950">How it works</a>
          <a href="#labels" className="hover:text-ink-950">Trust labels</a>
          <a href="#honest" className="hover:text-ink-950">Honest by design</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/app?demo=1">Try the demo</Link>
          </Button>
          <Button asChild>
            <Link href="/app">
              Open workspace <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <DotPattern className="text-ink-300/60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" width={22} height={22} cr={1} />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-trace-100/70 to-transparent blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 py-1 pr-3 pl-1 text-[12.5px] shadow-card backdrop-blur">
              <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[11px] font-medium text-white">Team 6</span>
              <ShinyText text="AI Club Hackathon 2026 · research integrity" color="#4d566b" shineColor="#0b1020" speed={3} />
            </span>
          </motion.div>
          <h1 className="font-display mt-6 text-[48px] leading-[1.04] text-ink-950 sm:text-[60px] lg:text-[68px]">
            <BlurText text="Every claim," animateBy="words" delay={90} trigger="load" className="block" />
            <span className="block">
              <motion.span initial={{ opacity: 0, filter: "blur(8px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.35, duration: 0.7 }} className="text-trace-700 italic">
                traced
              </motion.span>{" "}
              <motion.span initial={{ opacity: 0, filter: "blur(8px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.5, duration: 0.7 }}>
                to its source.
              </motion.span>
            </span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-500">
            ClaimTrace is a reference manager and AI research assistant that checks every citation: does the paper exist, do its details match, has it been retracted,
            and does it actually say what your sentence says?
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.6 }} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/app?demo=1">
                See it check a real draft <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/app?new=1">Start your own project</Link>
            </Button>
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-ink-500">
            {["Crossref and OpenAlex", "Retraction Watch data", "No account needed", "Drafts stay in your browser"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-trace-600" /> {t}
              </li>
            ))}
          </motion.ul>
        </div>
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <LiveCheck />
        </motion.div>
      </div>
    </section>
  );
}

function Problem() {
  const stats = [
    { to: 55, suffix: "%", text: "of references written by GPT-3.5 were fabricated (18% for GPT-4).", src: "Walters & Wilder, Scientific Reports, 2023" },
    { to: 24, suffix: "%", text: "of GPT-4's real references still had substantive errors (43% for GPT-3.5).", src: "Walters & Wilder, Scientific Reports, 2023" },
    { to: 5.4, suffix: "%", decimals: 1, text: "of citations made after a paper's retraction mentioned it, in biomedicine (722 of 13,252).", src: "Hsiao & Schneider, Quantitative Science Studies, 2021" },
  ];
  return (
    <section className="border-y border-ink-200/70 bg-ink-25 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.14em] text-rose-700 uppercase">The problem</p>
          <h2 className="font-display mt-3 text-[38px] leading-tight text-ink-950">A real reference is not the same as a supporting reference.</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">
            Reference managers organise and format. AI tools find and summarise. Nothing checks whether the source supports your sentence, and a polished essay hides
            the errors. The student is responsible for every one.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div key={s.src + s.to} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card">
              <p className="text-[52px] leading-none font-semibold tracking-[-0.04em] text-ink-950">
                <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} duration={1.6} trigger="view" />
              </p>
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink-700">{s.text}</p>
              <p className="mt-3 text-[12px] text-ink-400 italic">{s.src}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-5 text-[12.5px] text-ink-400">The 2023 figures describe specific older models. They show the failure types are real, not how today&apos;s models perform.</p>
      </div>
    </section>
  );
}

function Checks() {
  const items = [
    { icon: Database, name: "Exists", who: "Code", text: "Is it a real record? The DOI or the reference is looked up in Crossref and OpenAlex. The AI is never trusted to say a paper is real." },
    { icon: ScanSearch, name: "Matches", who: "Code", text: "Do the title, first author and year match the record? Near-misses become a Close match you can compare and confirm." },
    { icon: Quote, name: "Supports", who: "AI, checked by code", text: "Does the source actually say it? The Skeptic picks the supporting sentence; code confirms it is a whole sentence of the source and about the claim." },
    { icon: Lock, name: "Retraction flag", who: "Code", text: "Has the paper been retracted or corrected? Crossref's Retraction Watch data and OpenAlex are cross-checked." },
  ];
  return (
    <section id="checks" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">The checks</p>
          <h2 className="font-display mt-3 text-[38px] leading-tight text-ink-950">Three checks on every citation, plus a retraction flag.</h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div key={it.name} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
              <SpotlightCard theme="light" spotlightColor="#13b086" intensity={0.5} className="h-full !rounded-2xl !p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-ink-950 text-white">
                  <it.icon className="size-[18px]" />
                </span>
                <p className="mt-5 text-[17px] font-semibold tracking-[-0.015em] text-ink-950">{it.name}</p>
                <span className={cn("mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium", it.who === "Code" ? "bg-trace-100 text-trace-800" : "bg-violet-100 text-violet-700")}>{it.who}</span>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500">{it.text}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Node({ refEl, icon: Icon, title, sub, tone = "white" }: { refEl: React.RefObject<HTMLDivElement | null>; icon: typeof Globe; title: string; sub: string; tone?: "white" | "ink" | "violet" | "trace" }) {
  return (
    <div ref={refEl} className={cn("relative z-10 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-card", tone === "ink" ? "border-ink-900 bg-ink-950 text-white" : "border-ink-200 bg-white")}>
      <span className={cn("grid size-9 place-items-center rounded-xl", tone === "ink" ? "bg-white/10" : tone === "violet" ? "bg-violet-50 text-violet-700" : tone === "trace" ? "bg-trace-50 text-trace-700" : "bg-ink-50 text-ink-700")}>
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-[13.5px] font-semibold">{title}</span>
        <span className={cn("block text-[11.5px]", tone === "ink" ? "text-white/60" : "text-ink-500")}>{sub}</span>
      </span>
    </div>
  );
}

const BEAM_IN = { gradientStartColor: "#34cc9f", gradientStopColor: "#0b735a", pathColor: "#cbd2de" };
const BEAM_AI = { gradientStartColor: "#a78bfa", gradientStopColor: "#6d28d9", pathColor: "#cbd2de" };

function Architecture() {
  const container = useRef<HTMLDivElement>(null);
  const lib = useRef<HTMLDivElement>(null);
  const draft = useRef<HTMLDivElement>(null);
  const decide = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const crossref = useRef<HTMLDivElement>(null);
  const openalex = useRef<HTMLDivElement>(null);
  const nim = useRef<HTMLDivElement>(null);
  const { model, provider } = useModelName();
  return (
    <div ref={container} className="relative mt-12 grid items-center gap-10 rounded-3xl border border-ink-200/80 bg-white p-8 shadow-card md:grid-cols-3 md:p-12">
      <div className="space-y-4">
        <p className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">Your browser</p>
        <Node refEl={lib} icon={BookOpen} title="Library" sub="Folders, tags, notes" />
        <Node refEl={draft} icon={PenLine} title="Draft" sub="@-citations become claims" />
        <Node refEl={decide} icon={Hand} title="Your decisions" sub="Checkpoints 1 to 3" />
      </div>
      <div className="flex justify-center">
        <div ref={hub} className="relative z-10 flex flex-col items-center gap-3 rounded-3xl border border-ink-200 bg-white px-7 py-6 text-center shadow-lift">
          <LogoMark className="size-12" />
          <span className="text-[15px] font-semibold text-ink-950">Orchestrator</span>
          <span className="max-w-[180px] text-[12px] leading-relaxed text-ink-500">Runs the 7 steps, enforces checkpoints, writes the audit log</span>
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">Checked against</p>
        <Node refEl={crossref} icon={Database} title="Crossref" sub="DOI registry, Retraction Watch" tone="trace" />
        <Node refEl={openalex} icon={Globe} title="OpenAlex" sub="Records, abstracts, open access" tone="trace" />
        <Node refEl={nim} icon={Bot} title={provider} sub={model ? `${model}: Scout, Skeptic, Assistant` : "Scout, Skeptic, Assistant"} tone="violet" />
      </div>
      <AnimatedBeam containerRef={container} fromRef={lib} toRef={hub} curvature={-40} duration={4} delay={0} {...BEAM_IN} />
      <AnimatedBeam containerRef={container} fromRef={draft} toRef={hub} curvature={0} duration={4} delay={0.4} {...BEAM_IN} />
      <AnimatedBeam containerRef={container} fromRef={decide} toRef={hub} curvature={40} duration={4} delay={0.8} {...BEAM_IN} />
      <AnimatedBeam containerRef={container} fromRef={hub} toRef={crossref} curvature={-40} duration={4} delay={1} {...BEAM_IN} />
      <AnimatedBeam containerRef={container} fromRef={hub} toRef={openalex} curvature={0} duration={4} delay={1.4} {...BEAM_IN} />
      <AnimatedBeam containerRef={container} fromRef={hub} toRef={nim} curvature={40} duration={4} delay={1.8} {...BEAM_AI} />
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-y border-ink-200/70 bg-ink-25 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">How it works</p>
          <h2 className="font-display mt-3 text-[38px] leading-tight text-ink-950">The AI suggests. Code checks. You decide.</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">
            Seven steps, three narrow AI roles, one code checker and three human checkpoints. The Scout can only plan a search, the Skeptic can only challenge a claim, and the
            Assistant can only explain a source, sentence by sentence.
          </p>
        </motion.div>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {STEPS.map((s, i) => (
            <motion.li key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="relative rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="grid size-7 place-items-center rounded-full bg-ink-950 font-mono text-[12px] text-white">{s.n}</span>
                {"checkpoint" in s && s.checkpoint && <Hand className="size-4 text-amber-600" aria-label="Human checkpoint" />}
              </div>
              <p className="mt-3 text-[15px] font-semibold text-ink-950">{s.name}</p>
              <span className={cn("mt-1 inline-block rounded px-1.5 py-px text-[10.5px] font-medium", s.who === "You" ? "bg-ink-100 text-ink-700" : s.who === "Code" ? "bg-trace-100 text-trace-800" : "bg-violet-100 text-violet-700")}>{s.who}</span>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-500">{s.hint}</p>
            </motion.li>
          ))}
        </ol>
        <Architecture />
        <p className="mt-4 text-center text-[13px] text-ink-500">
          The AI has three narrow roles and decides nothing on its own. Existence, metadata, retraction, evidence checks and the export gate are plain code. Your library and
          drafts stay in your browser: there are no accounts and no server database.
        </p>
      </div>
    </section>
  );
}

const LABEL_GRID: TrustLabel[] = [
  "supported",
  "supported_own_text",
  "overreach",
  "not_supported",
  "unchecked",
  "ai_reasoning",
  "verified",
  "close_match",
  "not_found",
  "retracted",
  "unavailable",
  "student_added",
];

function Labels() {
  return (
    <section id="labels" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">Trust labels</p>
          <h2 className="font-display mt-3 text-[38px] leading-tight text-ink-950">Every claim says how far you can trust it.</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">
            Each label has an icon and a name, never colour alone. A reference is <b className="font-medium text-ink-700">Verified</b> when it matches a real record; a claim is{" "}
            <b className="font-medium text-ink-700">Supported</b> when a source sentence backs it. Neither means the claim is true.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LABEL_GRID.map((l, i) => (
            <motion.div key={l} {...reveal} transition={{ ...reveal.transition, delay: (i % 3) * 0.08 }} className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <TrustBadge label={l} size="lg" withTooltip={false} />
                <span className="font-mono text-[10.5px] tracking-wide text-ink-400 uppercase">{LABELS[l].claim ? "claim" : "reference"}</span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink-600">{labelMeaning(l, "claim")}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

type EvalSummary = {
  total: number;
  correct: number;
  holdout?: { total: number; correct: number };
  skeptic?: { total: number; correct: number; falseSupport: number; model?: string } | null;
  codeHints?: { overreach: { total: number; flagged: number }; supported: { total: number; flagged: number } };
};

function Honest() {
  const ev = evaluation as EvalSummary;
  const guardrails = [
    { icon: Database, t: "Retrieval-only references", d: "The AI cannot write a citation. Every one comes from Crossref or OpenAlex." },
    { icon: ScanSearch, t: "Details must match", d: "DOI first, then title, first author and year. Near-misses ask you to compare and confirm." },
    { icon: Quote, t: "Quote or it didn't happen", d: "Supported needs a whole source sentence that code finds in the text and that is about the claim." },
    { icon: Sparkles, t: "Scope check", d: "Causal wording, extra certainty, effect sizes and the wrong population are flagged for the Skeptic." },
    { icon: SearchX, t: "Honest Not found", d: "Not found only when both databases answered. A database outage is Not yet verified; no text is Unchecked." },
    { icon: FileCheck2, t: "Export gate", d: "The final files unlock only when every flag has your decision and you sign off." },
  ];
  return (
    <section id="honest" className="border-t border-ink-200/70 bg-ink-25 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1fr_1.2fr]">
        <motion.div {...reveal}>
          <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">Honest by design</p>
          <h2 className="font-display mt-3 text-[38px] leading-tight text-ink-950">Six guardrails, measured where we can.</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">
            If the AI is offline or rate-limited, references are still verified by code and claims show Unchecked, never a fake Supported. Every AI output and every decision
            is logged for your supervisor.
          </p>
          {ev.total > 0 && (
            <div className="mt-8 rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card">
              <p className="text-[12.5px] font-medium text-ink-700">Reference checks (the Verifier)</p>
              <p className="text-[12.5px] text-ink-500">Labelled references, checked live against Crossref and OpenAlex</p>
              <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                {ev.holdout && (
                  <p className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-ink-950">
                    {ev.holdout.correct}/{ev.holdout.total}
                    <span className="mt-1.5 block text-[12.5px] font-medium tracking-normal text-trace-700">held-out set, run once</span>
                  </p>
                )}
                <p className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-ink-950">
                  {ev.correct}/{ev.total}
                  <span className="mt-1.5 block text-[12.5px] font-medium tracking-normal text-ink-500">development set (rules tuned on it)</span>
                </p>
              </div>
              <p className="mt-3 text-[12.5px] text-ink-400">Real, fabricated, mismatched and retracted references. These numbers are about references only, not claims.</p>

              <div className="mt-5 border-t border-ink-100 pt-4">
                <p className="text-[12.5px] font-medium text-ink-700">Claim checks (the Skeptic)</p>
                {ev.skeptic ? (
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                    <span className="font-semibold text-ink-950">
                      {ev.skeptic.correct}/{ev.skeptic.total}
                    </span>{" "}
                    correct verdicts on a labelled set of claims ({ev.skeptic.model}); {ev.skeptic.falseSupport} wrongly marked Supported.
                  </p>
                ) : (
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                    Not measured yet: the verdict accuracy needs a live AI run on our labelled set of 20 claims.
                    {ev.codeHints && (
                      <>
                        {" "}
                        Code&apos;s overreach hints flag {ev.codeHints.overreach.flagged} of {ev.codeHints.overreach.total} overreaching test claims, with{" "}
                        {ev.codeHints.supported.flagged === 0 ? "no" : ev.codeHints.supported.flagged} false alarms on {ev.codeHints.supported.total} supported ones (a
                        development set).
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
        <div className="grid gap-3 sm:grid-cols-2">
          {guardrails.map((g, i) => (
            <motion.div key={g.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card">
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-ink-400">0{i + 1}</span>
                <g.icon className="size-4 text-trace-600" />
              </span>
              <p className="mt-3 text-[15px] font-semibold text-ink-950">{g.t}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{g.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] bg-gradient-to-t from-trace-50 to-transparent" aria-hidden="true" />
      <motion.div {...reveal} className="relative mx-auto max-w-3xl px-5 text-center">
        <ShieldCheck className="mx-auto size-10 text-trace-600" />
        <h2 className="font-display mt-5 text-[44px] leading-tight text-ink-950">See it check a real draft in under a minute.</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink-500">
          The demo project is a short literature review with eleven cited claims and nine references, including one invented reference, one retracted paper and a
          near-miss citation.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/app?demo=1">
              Open the demo project <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/app?new=1">Start your own</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  const { model, provider } = useModelName();
  return (
    <footer className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-2 text-[12.5px] text-ink-500">Team 6 · Neel, Mohit and Anand · AI Club Hackathon 2026</p>
        </div>
        <p className="max-w-md text-[12px] leading-relaxed text-ink-400">
          Metadata from Crossref and OpenAlex (CC0). Retraction data from Retraction Watch via Crossref. AI checks by {model ? `${model} on ` : "an open model on "}
          {provider}. The student is responsible for the final text.
        </p>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="bg-white">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Checks />
        <HowItWorks />
        <Labels />
        <Honest />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
