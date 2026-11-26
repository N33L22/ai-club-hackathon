"use client";

import { Check, Copy, ExternalLink, FileText, Loader2, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckSteps } from "@/components/trust/check-steps";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { inTextLabel } from "@/core/citation/csl";
import { pastedTextMatch } from "@/core/evidence/text-match";
import { checkText, type LibrarySource } from "@/core/model";
import { stripRetractedPrefix } from "@/core/text/normalize";
import { splitSentences } from "@/core/text/sentences";
import { sourceLabel } from "@/core/workflow/labels";
import { confirmCloseMatch, removeSource, saveStudentText, verifySource } from "@/lib/actions";
import { formatReferences } from "@/lib/citation";
import { useProjectFolders } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { authorLine } from "../search/result-card";
import { SummaryPanel } from "./summary-panel";

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-t border-ink-100 px-6 py-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-medium tracking-wide text-ink-400 uppercase">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? <Check className="text-trace-600" /> : <Copy />}
    </Button>
  );
}

function CloseMatchCompare({ src }: { src: LibrarySource }) {
  const e = src.entered;
  const r = src.record;
  if (!e) return null;
  const rows: Array<[string, string, string]> = [
    ["Title", e.title ?? e.raw ?? "–", r.title],
    ["Authors", e.authors?.map((a) => a.family).join(", ") ?? "(in your text)", authorLine(r, 4)],
    ["Year", e.year ? String(e.year) : (e.raw?.match(/\b(1[89]\d{2}|20\d{2})\b/)?.[0] ?? "–"), r.year ? String(r.year) : "–"],
  ];
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-amber-200">
      <table className="w-full text-left text-[12.5px]">
        <thead className="bg-amber-50 text-amber-900">
          <tr>
            <th className="w-20 px-3 py-2 font-medium" />
            <th className="px-3 py-2 font-medium">You wrote</th>
            <th className="px-3 py-2 font-medium">Database record</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100 bg-white">
          {rows.map(([k, a, b]) => (
            <tr key={k} className="align-top">
              <td className="px-3 py-2 text-ink-500">{k}</td>
              <td className="px-3 py-2 text-ink-800">{a}</td>
              <td className="px-3 py-2 text-ink-800">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TagEditor({ src }: { src: LibrarySource }) {
  const update = useStore((s) => s.updateSource);
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {src.tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-ink-100 py-0.5 pr-1 pl-2 text-[12px] text-ink-700">
          {t}
          <button type="button" className="rounded text-ink-400 hover:text-ink-800" aria-label={`Remove tag ${t}`} onClick={() => update(src.id, { tags: src.tags.filter((x) => x !== t) })}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim().toLowerCase();
          if (t && !src.tags.includes(t)) update(src.id, { tags: [...src.tags, t] });
          setDraft("");
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add tag" className="h-7 w-28 text-[12.5px]" />
      </form>
    </div>
  );
}

function Body({ src, onClose }: { src: LibrarySource; onClose: () => void }) {
  const router = useRouter();
  const folders = useProjectFolders(src.projectId);
  const project = useStore((s) => s.projects[src.projectId]);
  const update = useStore((s) => s.updateSource);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState(src.studentText ?? "");
  const [notes, setNotes] = useState(src.notes);
  const [reference, setReference] = useState<string | null>(null);
  const label = sourceLabel(src.verification);
  const r = src.record;
  const { origin } = checkText(src);
  const abstractSentences = r.abstract ? splitSentences(r.abstract) : [];

  useEffect(() => {
    let live = true;
    formatReferences([src], project?.style ?? "apa")
      .then((list) => live && setReference(list[0]?.text ?? null))
      .catch(() => live && setReference(null));
    return () => {
      live = false;
    };
  }, [src, project?.style]);

  async function reverify() {
    setBusy(true);
    try {
      const outcome = await verifySource(src.id);
      if (outcome === "kept_previous") toast.warning("Could not reach the databases", { description: "The earlier result is kept. Try again in a moment." });
      else toast.success("Checked again against Crossref and OpenAlex");
    } catch {
      toast.error("Could not reach the databases. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }
  const pasted = text.trim().split(/\s+/).length >= 8 ? pastedTextMatch(text, r) : null;

  return (
    <>
      <SheetHeader className="space-y-3 px-6 pt-6 pb-5">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <TrustBadge label={label} context="source" size="lg" />
          {src.origin === "student" && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11.5px] text-ink-600">Web page or report</span>}
        </div>
        <SheetTitle className="font-serif text-[22px] leading-snug font-medium tracking-[-0.01em] text-ink-950">{stripRetractedPrefix(r.title)}</SheetTitle>
        <SheetDescription className="text-[13.5px] text-ink-600">
          {authorLine(r, 6)}
          {r.year ? ` · ${r.year}` : ""}
          {r.venue ? ` · ${r.venue}` : ""}
          {r.volume ? `, ${r.volume}` : ""}
          {r.issue ? `(${r.issue})` : ""}
          {r.pages ? `, ${r.pages}` : ""}
        </SheetDescription>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
          {r.doi && (
            <a className="inline-flex items-center gap-1 font-mono text-trace-700 hover:underline" href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">
              doi:{r.doi} <ExternalLink className="size-3" />
            </a>
          )}
          {!r.doi && r.url && (
            <a className="inline-flex items-center gap-1 text-trace-700 hover:underline" href={r.url} target="_blank" rel="noreferrer">
              {r.url.replace(/^https?:\/\//, "").slice(0, 60)} <ExternalLink className="size-3" />
            </a>
          )}
          {r.openalexId && (
            <a className="inline-flex items-center gap-1 text-ink-500 hover:text-ink-800" href={`https://openalex.org/works/${r.openalexId}`} target="_blank" rel="noreferrer">
              OpenAlex record <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </SheetHeader>

      <Section
        title="Verification (code, no AI)"
        aside={
          src.origin === "database" && (
            <Button size="xs" variant="ghost" onClick={reverify} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Check again
            </Button>
          )
        }
      >
        {src.verification ? <CheckSteps steps={src.verification.steps} /> : <CheckSteps running />}
        {label === "close_match" && (
          <>
            <CloseMatchCompare src={src} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => confirmCloseMatch(src.id)}>
                <Check /> Yes, this is the paper I mean
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push(`/app/search?q=${encodeURIComponent(r.title)}`)}>
                <Search /> Look for the right one
              </Button>
            </div>
            <p className="mt-2 text-[12px] text-ink-500">Confirming fixes your reference to use the database&apos;s details.</p>
          </>
        )}
        {label === "not_found" && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3.5 text-[13px] leading-relaxed text-rose-900 ring-1 ring-rose-200 ring-inset">
            Crossref and OpenAlex both answered, and neither has a record that matches. The reference may be invented (a common problem with AI-generated references), or
            badly garbled. Remove it, or search for the real source.
          </div>
        )}
        {label === "unavailable" && (
          <div className="mt-4 rounded-xl bg-sky-50 p-3.5 text-[13px] leading-relaxed text-sky-900 ring-1 ring-sky-200 ring-inset">
            A database did not answer, so this reference has not been checked. That says nothing about whether it is real. Use <b>Check again</b> in a moment.
          </div>
        )}
        {src.origin === "database" && !src.entered && label === "verified" && (
          <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
            Saved from a database search, so its details come from the record itself. The check confirms the record resolves in Crossref or OpenAlex and looks for
            retraction notices.
          </p>
        )}
        {label === "retracted" && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3.5 text-[13px] leading-relaxed text-rose-900 ring-1 ring-rose-200 ring-inset">
            Retracted papers should not be cited as evidence. If you discuss it, say clearly that it was retracted.
          </div>
        )}
        {src.verification?.confirmedByStudent && <p className="mt-3 text-[12.5px] text-trace-700">You confirmed this close match.</p>}
      </Section>

      <Section title="Text claims are checked against">
        <Tabs defaultValue={src.studentText ? "yours" : "abstract"}>
          <TabsList className="mb-3">
            <TabsTrigger value="abstract">Abstract{abstractSentences.length ? ` (${abstractSentences.length})` : ""}</TabsTrigger>
            <TabsTrigger value="yours">Text you have read{src.studentText ? " ✓" : ""}</TabsTrigger>
          </TabsList>
          <TabsContent value="abstract">
            {abstractSentences.length ? (
              <ol className="max-h-72 space-y-1 overflow-y-auto rounded-xl bg-ink-50 p-3">
                {abstractSentences.map((s, i) => (
                  <li key={i} className="flex gap-2.5 rounded-lg px-2 py-1 font-serif text-[14.5px] leading-relaxed text-ink-700 hover:bg-white">
                    <span className="mt-1 font-mono text-[10.5px] text-ink-400">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-xl bg-sky-50 p-3.5 text-[13px] leading-relaxed text-sky-900 ring-1 ring-sky-200 ring-inset">
                No abstract in OpenAlex or Crossref. Claims citing this source will show <b>Unchecked</b> unless you paste text you have read.
              </p>
            )}
            {r.abstractSource && <p className="mt-2 text-[11.5px] text-ink-400">Source: {r.abstractSource === "openalex" ? "OpenAlex" : "Crossref"}</p>}
          </TabsContent>
          <TabsContent value="yours">
            <Textarea
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the abstract or a passage you have read. Claims citing this source will be checked against it."
              className="font-serif text-[14.5px] leading-relaxed"
            />
            {pasted && !pasted.related && (
              <p className="mt-2 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] leading-relaxed text-amber-900 ring-1 ring-amber-200 ring-inset">
                This text shares few key terms with the paper&apos;s title{r.abstract ? " or abstract" : ""}. Check that it comes from this paper: claims checked against it are
                labelled &ldquo;Supported · your text&rdquo;, and the integrity report shows where the evidence came from.
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="max-w-sm text-[11.5px] leading-relaxed text-ink-400">
                Stays in this browser. Only the sentences needed for a check are sent to the AI. Paste only text from this source that you have actually read.
              </p>
              <div className="flex gap-2">
                {src.studentText && (
                  <Button size="sm" variant="ghost" onClick={() => (setText(""), saveStudentText(src.id, ""))}>
                    Remove
                  </Button>
                )}
                <Button size="sm" disabled={text.trim() === (src.studentText ?? "") || text.trim().split(/\s+/).length < 8} onClick={() => saveStudentText(src.id, text)}>
                  <FileText /> Use this text
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <p className="mt-3 text-[12px] text-ink-500">
          Currently checking against:{" "}
          <span className="font-medium text-ink-800">{origin === "student_text" ? "the text you pasted" : origin === "abstract" ? "the abstract" : "nothing (claims stay Unchecked)"}</span>
        </p>
      </Section>

      <Section title="Explain this paper">
        <SummaryPanel source={src} />
      </Section>

      <Section title="Organise">
        <div className="space-y-3">
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <span className="text-[13px] text-ink-500">Folder</span>
            <Select value={src.folderId ?? "none"} onValueChange={(v) => update(src.id, { folderId: v === "none" ? undefined : v })}>
              <SelectTrigger className="h-8 w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[80px_1fr] items-start gap-3">
            <span className="pt-1 text-[13px] text-ink-500">Tags</span>
            <TagEditor src={src} />
          </div>
          <div className="grid grid-cols-[80px_1fr] items-start gap-3">
            <span className="pt-2 text-[13px] text-ink-500">Notes</span>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== src.notes && update(src.id, { notes })} placeholder="Your notes on this source" />
          </div>
        </div>
      </Section>

      <Section title="Cite">
        <div className="space-y-2 text-[13.5px]">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2">
            <span className="font-mono text-[12.5px] text-ink-800">{inTextLabel(src, project?.style ?? "apa", 1)}</span>
            <CopyButton text={inTextLabel(src, project?.style ?? "apa", 1)} />
          </div>
          <div className="flex items-start justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2.5">
            <span className="text-ink-800">{reference ?? "Formatting…"}</span>
            {reference && <CopyButton text={reference} />}
          </div>
          <p className="text-[12px] text-ink-500">Type @ in the editor to insert this citation into your draft.</p>
        </div>
      </Section>

      <section className="border-t border-ink-100 px-6 py-5">
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          onClick={() => {
            removeSource(src.id);
            onClose();
            toast.success("Removed from the library");
          }}
        >
          <Trash2 /> Remove from library
        </Button>
      </section>
    </>
  );
}

export function SourceSheet({ sourceId, onOpenChange }: { sourceId: string | null; onOpenChange: (open: boolean) => void }) {
  const src = useStore((s) => (sourceId ? s.sources[sourceId] : undefined));
  return (
    <Sheet open={Boolean(sourceId && src)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[600px]">{src && <Body key={src.id} src={src} onClose={() => onOpenChange(false)} />}</SheetContent>
    </Sheet>
  );
}
