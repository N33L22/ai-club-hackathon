"use client";

import { Check, FileUp, GitMerge, Globe, Link2, ListChecks, Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/core/config";
import type { TrustLabel } from "@/core/labels";
import { recordKey } from "@/core/records";
import { stripRetractedPrefix } from "@/core/text/normalize";
import type { ReferenceInput } from "@/core/types";
import { splitReferenceList } from "@/core/verify/reference-text";
import { sourceLabel } from "@/core/workflow/labels";
import { addEnteredReference, addWebSource, runPool, verifyReferenceList } from "@/lib/actions";
import { api, ApiError, type BatchItem } from "@/lib/api";
import { parseImport } from "@/lib/citation";
import { useProjectSources } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { authorLine } from "../search/result-card";

interface Checked extends BatchItem {
  include: boolean;
  /** The student merged this duplicate into the entry that is kept. */
  merged?: boolean;
}

/** Tick only references that resolved to the paper they cite; Not found, Mismatch, Retracted and Not yet verified start unticked. */
const usable = (it: Pick<BatchItem, "verification">) => Boolean(it.verification && ["verified", "close_match"].includes(it.verification.status));

/** Which paper an item is: the record's paper when the reference resolved to it; otherwise only the very same text matches. */
function itemKey(it: BatchItem): string {
  const status = it.verification?.status ?? "";
  if (it.record && ["verified", "close_match", "retracted"].includes(status)) return recordKey(it.record);
  return recordKey({ title: it.parsed?.title ?? it.parsed?.raw ?? it.raw });
}

interface Dup {
  /** Index of the earlier reference in the list that is the same paper. */
  of?: number;
  /** The same paper is already in this project's library. */
  inLibrary: boolean;
}

/** Duplicates inside the list (later copies point to the first one) and against the library. */
function findDuplicates(items: (BatchItem | undefined)[], libraryKeys: Set<string>): Dup[] {
  const first = new Map<string, number>();
  return items.map((it, i) => {
    if (!it) return { inLibrary: false };
    const key = itemKey(it);
    if (libraryKeys.has(key)) return { inLibrary: true };
    const f = first.get(key);
    if (f !== undefined) return { of: f, inLibrary: false };
    first.set(key, i);
    return { inLibrary: false };
  });
}
const blocked = (d: Dup | undefined) => Boolean(d && (d.of !== undefined || d.inLibrary));

function ResultsTable({
  items,
  dups,
  setItems,
  onMerge,
  onAdd,
  adding,
  progress,
}: {
  items: Checked[];
  dups: Dup[];
  setItems: (f: (x: Checked[]) => Checked[]) => void;
  onMerge: (index: number) => void;
  onAdd: () => void;
  adding: boolean;
  progress: { done: number; total: number } | null;
}) {
  const chosen = items.filter((it, i) => it.include && !blocked(dups[i])).length;
  return (
    <div className="mt-4">
      {progress && (
        <div className="mb-3 flex items-center gap-2 text-[12.5px] text-ink-600" role="status">
          <Loader2 className="size-3.5 animate-spin text-ink-400" /> Checked {progress.done} of {progress.total}. Crossref allows about one search a second, so long lists take a
          little while.
        </div>
      )}
      <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {items.map((it, i) => {
          const label: TrustLabel = it.verification ? sourceLabel(it.verification) : "pending";
          const isMismatch = (label as string) === "mismatch";
          const dup = dups[i];
          const isDup = blocked(dup);
          const of = dup?.of !== undefined ? dup.of + 1 : 0;
          return (
            <motion.label
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "flex gap-3 rounded-xl border bg-white p-3 shadow-card",
                isDup ? "border-dashed border-amber-300" : "cursor-pointer border-ink-200 hover:border-ink-300",
              )}
            >
              <Checkbox
                className="mt-0.5"
                checked={it.include && !isDup}
                disabled={isDup}
                aria-label={`Add reference ${i + 1}`}
                onCheckedChange={(v) => setItems((all) => all.map((x, j) => (j === i ? { ...x, include: Boolean(v) } : x)))}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-ink-400">{i + 1}</span>
                  <TrustBadge label={it.error ? "pending" : label} context="source" size="sm" />
                  {it.error && <span className="text-[12px] text-rose-700">{it.error}</span>}
                </div>
                {isMismatch ? (
                  // what the student pasted next to what the DOI really points to
                  <div className="mt-2 grid gap-2 text-[12px] sm:grid-cols-2">
                    <div className="rounded-lg bg-ink-50 p-2.5 ring-1 ring-ink-200 ring-inset">
                      <p className="font-medium text-ink-800">You pasted</p>
                      <p className="mt-0.5 text-ink-600 wrap-anywhere">{it.raw}</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-2.5 ring-1 ring-orange-200 ring-inset">
                      <p className="font-medium text-orange-900">The DOI points to</p>
                      <p className="mt-0.5 text-orange-950 wrap-anywhere">
                        {it.record ? (
                          <>
                            <span className="font-serif text-[13px]">{stripRetractedPrefix(it.record.title)}</span> ({authorLine(it.record, 2)}, {it.record.year})
                          </>
                        ) : (
                          // the checker names the DOI's real paper in its reason
                          (it.verification?.reason ?? "").replace(/^Mismatch: the DOI exists but belongs to a different paper, /, "").replace(/\.$/, "")
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-700">{it.raw}</p>
                )}
                {it.verification && !isMismatch && <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{it.verification.reason}</p>}
                {isMismatch && <p className="mt-1 text-[12px] leading-relaxed text-ink-500">The DOI exists but belongs to a different paper. ClaimTrace will not pass it because the DOI exists, and will not swap it for that paper.</p>}
                {it.record && label !== "not_found" && !isMismatch && (
                  <p className="mt-1 text-[12px] text-ink-500">
                    Matched: <span className="font-serif text-[13px] text-ink-800">{stripRetractedPrefix(it.record.title)}</span> ({authorLine(it.record, 2)}, {it.record.year})
                  </p>
                )}
                {isDup && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[12px] text-amber-950 ring-1 ring-amber-200 ring-inset">
                    <GitMerge className="size-3.5 shrink-0 text-amber-700" aria-hidden="true" />
                    {it.merged ? (
                      <span className="font-medium">
                        {dup?.inLibrary ? "Merged with the entry already in your library: no second copy." : `Merged into reference ${of}: one entry kept.`}
                      </span>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1">
                          {dup?.inLibrary ? "Already in your library: the same paper." : `Duplicate of reference ${of}: the same paper in another format.`} It is never added twice.
                        </span>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onMerge(i);
                          }}
                        >
                          <GitMerge /> {dup?.inLibrary ? "Merge with library entry" : `Merge into ${of}`}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.label>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-ink-500">
          Not found, Mismatch, Retracted and Not yet verified references start unticked. You can still add them; they keep their label. A paper is never added twice.
        </p>
        <Button onClick={onAdd} disabled={!chosen || adding}>
          {adding ? <Loader2 className="animate-spin" /> : <Check />} Add {chosen}
        </Button>
      </div>
    </div>
  );
}

export function AddSourceDialog({ projectId, folderId, open, onOpenChange }: { projectId: string; folderId?: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [doi, setDoi] = useState("");
  const [doiResult, setDoiResult] = useState<BatchItem | null>(null);
  const [list, setList] = useState("");
  const [items, setItems] = useState<Checked[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [web, setWeb] = useState({ title: "", author: "", year: "", url: "", site: "", accessed: new Date().toISOString().slice(0, 10) });
  const library = useProjectSources(projectId);
  // a library entry matches by its record, or by the exact text a not-found reference was saved with
  const libraryKeys = useMemo(() => new Set(library.flatMap((s) => [recordKey(s.record), recordKey({ title: s.record.title })])), [library]);
  const dups = useMemo(() => findDuplicates(items, libraryKeys), [items, libraryKeys]);
  const doiInLibrary = doiResult?.record ? libraryKeys.has(recordKey(doiResult.record)) : false;

  const reset = () => {
    setDoi("");
    setDoiResult(null);
    setList("");
    setItems([]);
  };
  const close = () => {
    onOpenChange(false);
    reset();
  };

  async function lookDoi() {
    setBusy(true);
    setDoiResult(null);
    try {
      const res = await api.verify({ doi: doi.trim() });
      setDoiResult({ raw: doi.trim(), parsed: { doi: doi.trim() }, ...res });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  async function checkList() {
    const refs = splitReferenceList(list).slice(0, LIMITS.bulkReferences);
    if (!refs.length) {
      toast.error("Paste at least one full reference.");
      return;
    }
    setBusy(true);
    setProgress({ done: 0, total: refs.length });
    try {
      // a few references per request: results appear as they are ready
      await verifyReferenceList(refs, (results, done) => {
        setItems((prev) =>
          results.map((r, i) => {
            const same = prev[i]?.raw === r.raw;
            return { ...r, include: same ? prev[i].include : usable(r), merged: same ? prev[i].merged : undefined };
          }),
        );
        setProgress({ done, total: refs.length });
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not check the references");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    try {
      const refs = (await parseImport(await file.text())).slice(0, LIMITS.bulkReferences);
      if (!refs.length) throw new Error("No references found in that file.");
      const out: Checked[] = new Array(refs.length);
      await runPool(
        refs.map((r, i) => [r, i] as const),
        3,
        async ([r, i]) => {
          const raw = [r.authors?.map((a) => a.family).join(", "), r.year && `(${r.year})`, r.title, r.doi && `doi:${r.doi}`].filter(Boolean).join(" ");
          try {
            const res = await api.verify(r);
            out[i] = { raw, parsed: r, ...res, include: usable(res) };
          } catch (e) {
            out[i] = { raw, parsed: r, error: e instanceof ApiError ? e.message : "Lookup failed", include: false };
          }
        },
      );
      setItems(out);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file");
    } finally {
      setBusy(false);
    }
  }

  /** The student confirms a duplicate is the same paper: it is merged into the entry that is kept, never added twice. */
  function merge(i: number) {
    const it = items[i];
    const dup = dups[i];
    if (!it || !blocked(dup)) return;
    setItems((all) => all.map((x, j) => (j === i ? { ...x, merged: true, include: false } : x)));
    const what = (it.record ? stripRetractedPrefix(it.record.title) : it.raw).slice(0, 90);
    useStore.getState().log({
      projectId,
      actor: "student",
      action: "source.merged",
      summary: dup?.inLibrary
        ? `Merged a duplicate of "${what}" into the entry already in the library; no second copy added.`
        : `Merged reference ${i + 1} into reference ${(dup?.of ?? 0) + 1} ("${what}"); one entry kept.`,
    });
  }

  function addChecked() {
    const chosen = items.filter((it, i) => it.include && it.verification && !blocked(dups[i]));
    for (const it of chosen) {
      // pasted references keep their original text (re-checks compare the same string);
      // file imports keep their structured fields
      const entered: ReferenceInput = it.parsed?.raw ? { raw: it.parsed.raw, doi: it.parsed.doi } : (it.parsed ?? { raw: it.raw });
      addEnteredReference(projectId, entered, it.record, it.verification, folderId);
    }
    const merged = items.filter((x) => x.merged).length;
    toast.success(
      `Added ${chosen.length} reference${chosen.length === 1 ? "" : "s"} to the library`,
      merged ? { description: `${merged} duplicate${merged === 1 ? "" : "s"} merged: one entry kept for each paper.` } : undefined,
    );
    close();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">Checkpoint 1 · you approve every source</p>
          <DialogTitle className="text-xl tracking-[-0.02em]">Add sources</DialogTitle>
          <DialogDescription>Everything is checked against Crossref and OpenAlex before you add it. Nothing is added without your click.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="doi" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="doi" className="gap-1.5">
              <Link2 className="size-3.5" /> DOI
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <ListChecks className="size-3.5" /> Reference list
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-1.5">
              <FileUp className="size-3.5" /> BibTeX / RIS
            </TabsTrigger>
            <TabsTrigger value="web" className="gap-1.5">
              <Globe className="size-3.5" /> Web page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doi" className="mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void lookDoi();
              }}
              className="flex gap-2"
            >
              <Input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.1038/s41562-018-0506-1 or https://doi.org/…" className="font-mono text-[13px]" autoFocus />
              <Button type="submit" disabled={busy || doi.trim().length < 6}>
                {busy ? <Loader2 className="animate-spin" /> : null} Look up
              </Button>
            </form>
            {doiResult?.verification && (
              <div className="mt-4 rounded-xl border border-ink-200 p-4 shadow-card">
                <TrustBadge label={sourceLabel(doiResult.verification)} context="source" />
                {doiResult.record ? (
                  <>
                    <p className="mt-2 font-serif text-[16px] leading-snug text-ink-950">{stripRetractedPrefix(doiResult.record.title)}</p>
                    <p className="mt-1 text-[12.5px] text-ink-500">
                      {authorLine(doiResult.record)} · {doiResult.record.year} · {doiResult.record.venue}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[13px] text-ink-600">{doiResult.verification.reason}</p>
                )}
                {doiInLibrary && (
                  <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-amber-800">
                    <GitMerge className="size-3.5" aria-hidden="true" /> This paper is already in your library, so it is not added twice.
                  </p>
                )}
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!doiResult.record || doiInLibrary}
                    onClick={() => {
                      addEnteredReference(projectId, { doi: doiResult.record?.doi }, doiResult.record, doiResult.verification, folderId);
                      toast.success("Added to the library");
                      close();
                    }}
                  >
                    <Plus /> {doiInLibrary ? "Already in your library" : "Add to library"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            {!items.length ? (
              <>
                <Textarea
                  rows={8}
                  value={list}
                  onChange={(e) => setList(e.target.value)}
                  placeholder={"Paste references, one per line or numbered. For example a list a chatbot gave you:\n\nKelly, Y., Zilanawala, A., Booker, C., & Sacker, A. (2018). Social media use and adolescent mental health: Findings from the UK Millennium Cohort Study. EClinicalMedicine, 6, 59-68."}
                  className="text-[13px] leading-relaxed"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[12.5px] text-ink-500">Each reference is matched in Crossref and OpenAlex (title, first author, year). Up to {LIMITS.bulkReferences} at a time.</p>
                  <Button onClick={checkList} disabled={busy || list.trim().length < 20}>
                    {busy ? <Loader2 className="animate-spin" /> : <ListChecks />} Check references
                  </Button>
                </div>
              </>
            ) : (
              <ResultsTable items={items} dups={dups} setItems={setItems} onMerge={merge} onAdd={addChecked} adding={busy} progress={progress} />
            )}
          </TabsContent>

          <TabsContent value="file" className="mt-4">
            {!items.length ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 px-6 py-12 text-center transition-colors hover:border-trace-300 hover:bg-trace-50/40">
                {busy ? <Loader2 className="size-6 animate-spin text-ink-400" /> : <FileUp className="size-6 text-ink-400" />}
                <span className="mt-3 text-[14px] font-medium text-ink-900">{busy ? "Checking each reference…" : "Choose a .bib or .ris file"}</span>
                <span className="mt-1 text-[12.5px] text-ink-500">Exported from Zotero, Mendeley or EndNote. Every entry is verified before import.</span>
                <input type="file" accept=".bib,.ris,.txt" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && void importFile(e.target.files[0])} />
              </label>
            ) : (
              <ResultsTable items={items} dups={dups} setItems={setItems} onMerge={merge} onAdd={addChecked} adding={busy} progress={progress} />
            )}
          </TabsContent>

          <TabsContent value="web" className="mt-4">
            <p className="mb-4 rounded-xl bg-slate-50 p-3 text-[12.5px] leading-relaxed text-slate-700 ring-1 ring-slate-200 ring-inset">
              Web pages, reports and books without a DOI are not in Crossref or OpenAlex, so they are labelled <b>Student-added, not verified</b>. The label carries through to your export.
            </p>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                addWebSource(projectId, { ...web, year: Number(web.year) || undefined, accessed: new Date(web.accessed).toISOString() }, folderId);
                toast.success("Added as a student-added source");
                setWeb({ title: "", author: "", year: "", url: "", site: "", accessed: new Date().toISOString().slice(0, 10) });
                close();
              }}
            >
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="w-title">Title</Label>
                <Input id="w-title" required value={web.title} onChange={(e) => setWeb({ ...web, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-author">Author or organisation</Label>
                <Input id="w-author" value={web.author} onChange={(e) => setWeb({ ...web, author: e.target.value })} placeholder="World Health Organization" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-year">Year published</Label>
                <Input id="w-year" inputMode="numeric" value={web.year} onChange={(e) => setWeb({ ...web, year: e.target.value })} placeholder="2024" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="w-url">URL</Label>
                <Input id="w-url" type="url" required value={web.url} onChange={(e) => setWeb({ ...web, url: e.target.value })} placeholder="https://" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-site">Website name</Label>
                <Input id="w-site" value={web.site} onChange={(e) => setWeb({ ...web, site: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-acc">Date accessed</Label>
                <Input id="w-acc" type="date" value={web.accessed} onChange={(e) => setWeb({ ...web, accessed: e.target.value })} />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" disabled={!web.title.trim() || !web.url.trim()}>
                  <Plus /> Add web source
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
