"use client";

import { Loader2, Sparkles, Wrench } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { checkText, type LibrarySource } from "@/core/model";
import { splitSentences } from "@/core/text/sentences";
import { explainSource } from "@/lib/actions";
import { ApiError } from "@/lib/api";

/** Evidence-backed summary: each point links to source sentences; unlinked points are labelled AI reasoning. */
export function SummaryPanel({ source }: { source: LibrarySource }) {
  const [busy, setBusy] = useState(false);
  const { text, origin } = checkText(source);
  const sentences = text ? splitSentences(text) : [];
  const summary = source.summary;

  async function run() {
    setBusy(true);
    try {
      await explainSource(source.id);
    } catch (e) {
      toast.error("Could not explain this source", { description: e instanceof ApiError ? e.message : "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (!text) {
    return <p className="text-[13px] text-ink-500">Add an abstract or paste text you have read to get an explanation linked to its sentences.</p>;
  }

  return (
    <div>
      {!summary ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-ink-200 p-4">
          <p className="max-w-xs text-[13px] leading-relaxed text-ink-500">
            A plain-English explanation of the {origin === "student_text" ? "text you pasted" : "abstract"}. Every point must link to a sentence in it.
          </p>
          <Button size="sm" variant="outline" onClick={run} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles className="text-violet-600" />} Explain this paper
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-500">
              {summary.mode === "ai" ? <Sparkles className="size-3.5 text-violet-600" /> : <Wrench className="size-3.5" />}
              {summary.mode === "ai" ? `AI Assistant (${summary.model})` : "Key sentences picked by code (AI offline)"}
            </span>
            <Button size="xs" variant="ghost" onClick={run} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null} Regenerate
            </Button>
          </div>
          <ol className="space-y-2.5">
            {summary.points.map((p, i) => (
              <motion.li
                key={`${i}-${p.text.slice(0, 20)}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 rounded-xl border border-ink-200/80 bg-white p-3 text-[13.5px] leading-relaxed text-ink-800 shadow-card"
              >
                <span className="mt-0.5 font-mono text-[11px] text-ink-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p>{p.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {p.grounded ? (
                      p.sentences.map((s) => (
                        <HoverCard key={s} openDelay={120}>
                          <HoverCardTrigger asChild>
                            <button type="button" className="rounded-md bg-trace-50 px-1.5 py-0.5 font-mono text-[10.5px] text-trace-800 ring-1 ring-trace-200 ring-inset hover:bg-trace-100">
                              Sentence {s + 1}
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 font-serif text-[14px] leading-relaxed text-ink-700">{sentences[s]}</HoverCardContent>
                        </HoverCard>
                      ))
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200 ring-inset">
                        <Sparkles className="size-3" /> AI reasoning: not linked to a sentence
                      </span>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
