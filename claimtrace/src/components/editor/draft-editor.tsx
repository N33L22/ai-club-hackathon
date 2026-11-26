"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AtSign, Bold, Check, Heading2, Italic, List, ListOrdered, Loader2, Plus, Quote, Redo2, Save, Sparkles, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { StatusDot } from "@/components/trust/trust-badge";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { shortRef } from "@/core/citation/csl";
import { CITATION_NODE, extractClaims, type DocNode } from "@/core/evidence/claims";
import type { TrustLabel } from "@/core/labels";
import type { LibrarySource, Project } from "@/core/model";
import { stripRetractedPrefix } from "@/core/text/normalize";
import { sourceLabel } from "@/core/workflow/labels";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CitationContext } from "./citation-context";
import type { CiteItem } from "./cite-menu";
import { Citation, citationSuggestion, ClaimMarks, claimMarksKey, type ClaimMark } from "./extensions";

function toItem(s: LibrarySource): CiteItem {
  return { id: s.id, label: shortRef(s), title: stripRetractedPrefix(s.record.title), status: sourceLabel(s.verification) };
}

function librarySources(projectId: string): LibrarySource[] {
  return Object.values(useStore.getState().sources)
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}

function filterSources(sources: LibrarySource[], query: string): CiteItem[] {
  const q = query.toLowerCase().split(/\s+/).filter(Boolean);
  return sources
    .filter((s) => {
      const hay = `${s.record.title} ${s.record.authors.map((a) => a.family).join(" ")} ${s.record.year ?? ""} ${s.tags.join(" ")}`.toLowerCase();
      return q.every((t) => hay.includes(t));
    })
    .slice(0, 8)
    .map(toItem);
}

function ToolButton({ label, onClick, active, disabled, children }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "grid size-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-30",
            active && "bg-ink-100 text-ink-950",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const timeOf = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function Toolbar({
  editor,
  onCite,
  onSave,
  onSuggest,
  suggesting,
  saved,
  savedAt,
}: {
  editor: Editor;
  onCite: () => void;
  onSave: () => void;
  onSuggest: () => void;
  suggesting: boolean;
  saved: boolean;
  savedAt: Date | null;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      words: e.getText().trim() ? e.getText().trim().split(/\s+/).length : 0,
    }),
  });
  return (
    <div className="sticky top-14 z-20 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-ink-100 bg-white/90 px-3 py-2 backdrop-blur">
      <ToolButton label="Heading" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </ToolButton>
      <ToolButton label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-4" />
      </ToolButton>
      <ToolButton label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-ink-200" />
      <ToolButton label="Bullet list" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-4" />
      </ToolButton>
      <ToolButton label="Numbered list" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </ToolButton>
      <ToolButton label="Block quote" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-ink-200" />
      <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="size-4" />
      </ToolButton>
      <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="size-4" />
      </ToolButton>
      <span className="mx-1 h-5 w-px bg-ink-200" />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCite}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink-950 px-2.5 text-[12.5px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-ink-800"
      >
        <AtSign className="size-3.5" /> Cite a source
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSuggest}
        disabled={suggesting}
        className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-[12.5px] font-medium text-violet-900 hover:bg-violet-100 disabled:opacity-60"
      >
        {suggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} Suggest what to write
      </button>
      <span className="ml-auto flex items-center gap-3 text-[12px] text-ink-400">
        <span className="hidden sm:inline">{state.words} words</span>
        <span className="flex items-center gap-1" role="status" aria-live="polite">
          {saved ? <Check className="size-3.5 text-trace-600" /> : <Loader2 className="size-3.5 animate-spin" />}
          {saved ? (savedAt ? `Saved ${timeOf(savedAt)}` : "Saved in this browser") : "Saving…"}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onSave}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 text-[12.5px] font-medium text-ink-800 hover:border-ink-300 hover:bg-ink-50"
            >
              <Save className="size-3.5" /> Save draft
            </button>
          </TooltipTrigger>
          <TooltipContent>Saves now (Ctrl+S). Your draft also saves itself as you type, in this browser only.</TooltipContent>
        </Tooltip>
      </span>
    </div>
  );
}

export interface DraftEditorProps {
  project: Project;
  sources: LibrarySource[];
  labels: Map<string, TrustLabel>;
  activeKey: string | null;
  focusKey: string | null;
  onOpenSource: (id: string) => void;
}

/** The manuscript editor: TipTap with @-citations and claim underlines. */
export function DraftEditor({ project, sources, labels, activeKey, focusKey, onOpenSource }: DraftEditorProps) {
  const setDoc = useStore((s) => s.setDoc);
  const [saved, setSaved] = useState(true);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [citeOpen, setCiteOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ text: string; sourceId: string }> | null>(null);
  const [suggestNote, setSuggestNote] = useState("");
  const [version, setVersion] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectId = project.id;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2] }, code: false, codeBlock: false, horizontalRule: false, link: false, strike: false, underline: false }),
      Placeholder.configure({ placeholder: "Start writing your draft. Type @ to cite a source from your library." }),
      Citation.configure({
        HTMLAttributes: { class: "citation" },
        renderText: ({ node }) => `(${node.attrs.label ?? "citation"})`,
        // read the library when the menu opens, so it is always current
        suggestion: citationSuggestion((q) => filterSources(librarySources(projectId), q)),
      }),
      ClaimMarks,
    ],
    content: project.doc,
    editorProps: { attributes: { class: "px-8 py-10 md:px-14 md:py-12", spellcheck: "true", "aria-label": "Draft" } },
    onUpdate: ({ editor: e }) => {
      setSaved(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        setDoc(project.id, e.getJSON() as DocNode);
        setSaved(true);
        setSavedAt(new Date());
        setVersion((v) => v + 1);
      }, 350);
    },
  });

  /** "Save draft" (and Ctrl+S): write the document now, whether or not an autosave is pending. */
  const saveNow = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setDoc(projectId, editor.getJSON() as DocNode);
    const at = new Date();
    setSaved(true);
    setSavedAt(at);
    setVersion((v) => v + 1);
    toast.success("Draft saved", { description: `Saved in this browser at ${timeOf(at)}.` });
  }, [editor, projectId, setDoc]);

  // Ctrl+S / Cmd+S saves the draft instead of opening the browser's "save page" dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow]);

  // flush a pending save when leaving the page
  useEffect(
    () => () => {
      if (timer.current && editor) {
        clearTimeout(timer.current);
        setDoc(project.id, editor.getJSON() as DocNode);
      }
    },
    [editor, project.id, setDoc],
  );

  // underline each claim in its trust-label colour (positions come from the live document)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const live = extractClaims(editor.getJSON() as DocNode);
    const marks: ClaimMark[] = live.map((c) => ({ key: c.key, from: c.from, to: c.to, label: labels.get(c.key) ?? "pending", active: c.key === activeKey }));
    editor.view.dispatch(editor.state.tr.setMeta(claimMarksKey, marks));
  }, [editor, labels, activeKey, version]);

  // scroll to a claim when asked (rail click, or "Edit in draft" from Review)
  useEffect(() => {
    if (!editor || editor.isDestroyed || !focusKey) return;
    const c = extractClaims(editor.getJSON() as DocNode).find((x) => x.key === focusKey);
    if (!c) return;
    editor.chain().focus().setTextSelection({ from: c.from, to: c.to }).scrollIntoView().run();
  }, [editor, focusKey]);

  const numbers = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of extractClaims(project.doc)) for (const id of c.sourceIds) if (!m.has(id)) m.set(id, m.size + 1);
    return m;
  }, [project.doc]);

  /** The Assistant suggests sentences from the abstracts of the student's own sources; the student decides. */
  async function suggest() {
    if (!editor) return;
    const usable = sources
      .filter((s) => !["not_found", "mismatch", "retracted"].includes(sourceLabel(s.verification)) && (s.record.abstract ?? "").length >= 40)
      .slice(0, 6);
    setSuggestOpen(true);
    setSuggestions(null);
    if (!usable.length) {
      setSuggestions([]);
      setSuggestNote("Add sources with abstracts to your library first: suggestions are written only from your own sources.");
      return;
    }
    setSuggesting(true);
    setSuggestNote("");
    try {
      const res = await api.suggest({
        question: project.question ?? "",
        draft: editor.getText().slice(-2500),
        sources: usable.map((s) => ({ id: s.id, ref: shortRef(s), title: stripRetractedPrefix(s.record.title).slice(0, 380), text: (s.record.abstract ?? "").slice(0, 2400) })),
      });
      setSuggestions(res.suggestions);
      if (res.mode === "offline") setSuggestNote("The AI is offline, so there are no suggestions right now. Your sources and draft are unchanged.");
      else if (!res.suggestions.length) setSuggestNote("No suggestion could be tied to one of your sources, so none is shown.");
      useStore.getState().log({
        projectId,
        actor: "ai:assistant",
        action: "draft.suggested",
        summary: `The Assistant suggested ${res.suggestions.length} sentence${res.suggestions.length === 1 ? "" : "s"} for the draft, each based on a library source${res.model ? ` (${res.model})` : ""}.`,
      });
    } catch (e) {
      setSuggestions([]);
      setSuggestNote(e instanceof ApiError ? e.message : "Could not reach the Assistant. Please try again.");
    } finally {
      setSuggesting(false);
    }
  }

  function insertSuggestion(text: string, src: LibrarySource) {
    const body = text.trim().replace(/[.!?]+$/, "");
    editor
      ?.chain()
      .focus()
      .insertContent([
        { type: "text", text: `${body} ` },
        { type: CITATION_NODE, attrs: { id: src.id, label: shortRef(src) } },
        { type: "text", text: ". " },
      ])
      .run();
    setSuggestions((all) => (all ?? []).filter((x) => x.text !== text));
    useStore.getState().log({
      projectId,
      actor: "student",
      action: "draft.suggestion_inserted",
      summary: `Inserted a suggested sentence citing ${shortRef(src)}. It is checked on Review like every claim.`,
    });
    toast.success("Added to your draft", { description: "It is a claim like any other: check it on Review." });
  }

  function insertCitation(src: LibrarySource) {
    editor
      ?.chain()
      .focus()
      .insertContent([
        { type: CITATION_NODE, attrs: { id: src.id, label: shortRef(src) } },
        { type: "text", text: " " },
      ])
      .run();
    setCiteOpen(false);
  }

  return (
    <CitationContext.Provider value={{ style: project.style, numbers, onOpenSource }}>
      <div className="manuscript rounded-2xl border border-ink-200/80 bg-white shadow-card">
        {editor ? (
          <Toolbar editor={editor} onCite={() => setCiteOpen(true)} onSave={saveNow} onSuggest={() => void suggest()} suggesting={suggesting} saved={saved} savedAt={savedAt} />
        ) : (
          <div className="h-12 border-b border-ink-100" />
        )}
        {suggestOpen && (
          <div className="border-b border-violet-100 bg-violet-50/40 px-4 py-4 md:px-6">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-600" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-violet-950">What you could write next · AI suggestion</p>
                <p className="text-[12px] leading-relaxed text-violet-900/80">
                  Written only from the abstracts of sources in your library. Nothing is added until you click Insert, and every inserted sentence is checked against its
                  source on Review.
                </p>
              </div>
              <button type="button" onClick={() => setSuggestOpen(false)} aria-label="Close suggestions" className="grid size-7 place-items-center rounded-md text-violet-700 hover:bg-violet-100">
                <X className="size-4" />
              </button>
            </div>
            {suggesting ? (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-violet-900">
                <Loader2 className="size-4 animate-spin" /> The Assistant is reading your sources…
              </p>
            ) : (
              <>
                {suggestNote && <p className="mt-3 text-[13px] text-ink-600">{suggestNote}</p>}
                <ul className="mt-3 space-y-2">
                  {(suggestions ?? []).map((s, i) => {
                    const src = sources.find((x) => x.id === s.sourceId);
                    if (!src) return null;
                    return (
                      <li key={i} className="rounded-xl bg-white p-3 ring-1 ring-violet-200">
                        <p className="font-serif text-[15px] leading-relaxed text-ink-900">{s.text}</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[12px] text-ink-500">
                            Based on <span className="font-medium text-ink-700">{shortRef(src)}</span> · AI suggestion, not yet checked
                          </span>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertSuggestion(s.text, src)}
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-ink-950 px-2.5 text-[12px] font-medium text-white hover:bg-ink-800"
                          >
                            <Plus className="size-3.5" /> Insert
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
        {editor ? <EditorContent editor={editor} /> : <div className="shimmer m-10 h-64 rounded-xl" />}
      </div>
      <CommandDialog open={citeOpen} onOpenChange={setCiteOpen} title="Cite a source" description="Choose a source from your library">
        <CommandInput placeholder="Search your library by author, title or year" />
        <CommandList>
          <CommandEmpty>No source matches. Add it to your library first.</CommandEmpty>
          <CommandGroup heading="Library">
            {sources.map((s) => (
              <CommandItem key={s.id} value={`${shortRef(s)} ${s.record.title}`} onSelect={() => insertCitation(s)} className="items-start gap-2.5 py-2">
                <StatusDot label={sourceLabel(s.verification)} className="mt-1.5" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{shortRef(s)}</span>
                  <span className="block truncate font-serif text-[13px] text-ink-500">{stripRetractedPrefix(s.record.title)}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </CitationContext.Provider>
  );
}
