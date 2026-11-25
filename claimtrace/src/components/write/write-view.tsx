"use client";

import { ArrowRight, AtSign, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Page, PageHeader, Panel } from "@/components/app/page";
import { RequireProject } from "@/components/app/require-project";
import { useClaimRunner } from "@/components/claims/use-claim-runner";
import { DraftEditor } from "@/components/editor/draft-editor";
import { SourceSheet } from "@/components/library/source-sheet";
import { LabelBar } from "@/components/trust/label-bar";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { shortRef } from "@/core/citation/csl";
import { CLAIM_LABEL_ORDER, type TrustLabel } from "@/core/labels";
import type { Project } from "@/core/model";
import { countBy, useProjectClaims, useProjectSources } from "@/lib/hooks";
import { cn } from "@/lib/utils";

function Write({ project }: { project: Project }) {
  const params = useSearchParams();
  const sources = useProjectSources(project.id);
  const claims = useProjectClaims(project);
  const { running, progress, runAll } = useClaimRunner(project.id);
  const [active, setActive] = useState<string | null>(params.get("claim"));
  const [focus, setFocus] = useState<string | null>(params.get("claim"));
  const [openSource, setOpenSource] = useState<string | null>(null);
  const labels = useMemo(() => new Map<string, TrustLabel>(claims.map((c) => [c.key, c.label])), [claims]);
  const counts = useMemo(() => countBy(claims.map((c) => c.label)), [claims]);
  // a claim needs checking while its label is pending (claims citing a missing or retracted
  // source are never support-checked, so their empty checks do not count)
  const unchecked = claims.filter((c) => c.label === "pending");

  return (
    <Page wide>
      <PageHeader
        eyebrow="Step 4 · Write"
        title="Draft"
        description="Write in your own words and cite sources from your library. Every sentence with a citation becomes a claim, underlined in the colour of its check."
        actions={
          <>
            <Button variant="outline" onClick={() => runAll(unchecked.length ? unchecked : claims)} disabled={!claims.length || Boolean(progress)}>
              {progress ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {progress ? `Checking ${progress.done} of ${progress.total}` : `Check ${unchecked.length || claims.length} claim${(unchecked.length || claims.length) === 1 ? "" : "s"}`}
            </Button>
            <Button asChild>
              <Link href="/app/review">
                Review claims <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {sources.length === 0 && (
            <Panel className="mb-4 flex items-center justify-between gap-3 border-amber-200 bg-amber-50/50 p-4">
              <p className="text-[13px] text-amber-900">Your library is empty, so there is nothing to cite yet.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/app/search">Find sources</Link>
              </Button>
            </Panel>
          )}
          <DraftEditor key={project.id} project={project} sources={sources} labels={labels} activeKey={active} focusKey={focus} onOpenSource={setOpenSource} />
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-ink-400">
            <AtSign className="size-3.5" /> Type @ to cite. The AI never writes references: you can only cite records in your library.
          </p>
        </div>

        <aside className="xl:sticky xl:top-20">
          <Panel>
            <div className="border-b border-ink-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[14.5px] font-semibold text-ink-950">Claims in this draft</h2>
                <span className="font-mono text-[12px] text-ink-400">{claims.length}</span>
              </div>
              <LabelBar className="mt-3" counts={counts} order={CLAIM_LABEL_ORDER} />
            </div>
            {claims.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] leading-relaxed text-ink-500">Cite a source in a sentence and it will appear here as a claim to check.</p>
            ) : (
              <ul className="max-h-[calc(100dvh-280px)] divide-y divide-ink-100 overflow-y-auto">
                {claims.map((c, i) => (
                  <motion.li key={c.key} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 10) * 0.02 }}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(c.key)}
                      onMouseLeave={() => setActive(focus)}
                      onClick={() => {
                        setFocus(c.key);
                        setActive(c.key);
                      }}
                      className={cn("w-full px-5 py-3.5 text-left transition-colors hover:bg-ink-25", active === c.key && "bg-trace-50/40")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <TrustBadge label={c.label} size="sm" withTooltip={false} />
                        {running.has(c.key) && <Loader2 className="size-3.5 animate-spin text-ink-400" />}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-800">{c.text}</p>
                      <p className="mt-1 truncate text-[11.5px] text-ink-400">{c.sources.map((s) => shortRef(s)).join("; ")}</p>
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
            {claims.length > 0 && (
              <div className="border-t border-ink-100 p-3">
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href="/app/review">
                    See evidence and decide <ArrowRight />
                  </Link>
                </Button>
              </div>
            )}
          </Panel>
        </aside>
      </div>

      <SourceSheet sourceId={openSource} onOpenChange={(o) => !o && setOpenSource(null)} />
    </Page>
  );
}

export function WriteView() {
  return (
    <RequireProject>
      {(p) => (
        <Suspense>
          <Write key={p.id} project={p} />
        </Suspense>
      )}
    </RequireProject>
  );
}
