"use client";

import { Check, FileUp, Globe, Link2, ListChecks, Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
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
import { stripRetractedPrefix } from "@/core/text/normalize";
import type { ReferenceInput } from "@/core/types";
import { splitReferenceList } from "@/core/verify/reference-text";
import { sourceLabel } from "@/core/workflow/labels";
import { addEnteredReference, addWebSource, runPool } from "@/lib/actions";
import { api, ApiError, type BatchItem } from "@/lib/api";
import { parseImport } from "@/lib/citation";
import { authorLine } from "../search/result-card";

interface Checked extends BatchItem {
  include: boolean;
}

function ResultsTable({ items, setItems, onAdd, adding }: { items: Checked[]; setItems: (f: (x: Checked[]) => Checked[]) => void; onAdd: () => void; adding: boolean }) {
  const chosen = items.filter((i) => i.include).length;
  return (
    <div className="mt-4">
      <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {items.map((it, i) => {
          const label = it.verification ? sourceLabel(it.verification) : "not_found";
          return (
            <motion.label
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex cursor-pointer gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-card hover:border-ink-300"
            >
              <Checkbox
                className="mt-0.5"
                checked={it.include}
                onCheckedChange={(v) => setItems((all) => all.map((x, j) => (j === i ? { ...x, include: Boolean(v) } : x)))}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TrustBadge label={it.error ? "pending" : label} context="source" size="sm" />
                  {it.error && <span className="text-[12px] text-rose-700">{it.error}</span>}
                </div>
                <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-700">{it.raw}</p>
                {it.verification && <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{it.verification.reason}</p>}
                {it.record && label !== "not_found" && (
                  <p className="mt-1 text-[12px] text-ink-500">
                    Matched: <span className="font-serif text-[13px] text-ink-800">{stripRetractedPrefix(it.record.title)}</span> ({authorLine(it.record, 2)}, {it.record.year})
                  </p>
                )}
              </div>
            </motion.label>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-ink-500">References that were not found stay unticked. You can still add them; they will carry the Not found label.</p>
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
  const [web, setWeb] = useState({ title: "", author: "", year: "", url: "", site: "", accessed: new Date().toISOString().slice(0, 10) });

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
    try {
      const { results } = await api.verifyBatch(refs);
      setItems(results.map((r) => ({ ...r, include: Boolean(r.verification && ["verified", "close_match", "retracted"].includes(r.verification.status)) })));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not check the references");
    } finally {
      setBusy(false);
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
            out[i] = { raw, parsed: r, ...res, include: res.verification.status !== "not_found" };
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

  function addChecked() {
    const chosen = items.filter((i) => i.include && i.verification);
    for (const it of chosen) {
      // pasted references keep their original text (re-checks compare the same string);
      // file imports keep their structured fields
      const entered: ReferenceInput = it.parsed?.raw ? { raw: it.parsed.raw, doi: it.parsed.doi } : (it.parsed ?? { raw: it.raw });
      addEnteredReference(projectId, entered, it.record, it.verification, folderId);
    }
    toast.success(`Added ${chosen.length} reference${chosen.length === 1 ? "" : "s"} to the library`);
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
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!doiResult.record}
                    onClick={() => {
                      addEnteredReference(projectId, { doi: doiResult.record?.doi }, doiResult.record, doiResult.verification, folderId);
                      toast.success("Added to the library");
                      close();
                    }}
                  >
                    <Plus /> Add to library
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
              <ResultsTable items={items} setItems={setItems} onAdd={addChecked} adding={busy} />
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
              <ResultsTable items={items} setItems={setItems} onAdd={addChecked} adding={busy} />
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
