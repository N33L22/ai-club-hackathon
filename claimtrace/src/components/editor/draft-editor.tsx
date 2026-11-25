"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AtSign, Bold, Check, Heading2, Italic, List, ListOrdered, Loader2, Quote, Redo2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusDot } from "@/components/trust/trust-badge";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { shortRef } from "@/core/citation/csl";
import { CITATION_NODE, extractClaims, type DocNode } from "@/core/evidence/claims";
import type { TrustLabel } from "@/core/labels";
import type { LibrarySource, Project } from "@/core/model";
import { stripRetractedPrefix } from "@/core/text/normalize";
import { sourceLabel } from "@/core/workflow/labels";
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

function Toolbar({ editor, onCite, saved }: { editor: Editor; onCite: () => void; saved: boolean }) {
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
      <span className="ml-auto flex items-center gap-3 text-[12px] text-ink-400">
        <span>{state.words} words</span>
        <span className="flex items-center gap-1">
          {saved ? <Check className="size-3.5 text-trace-600" /> : <Loader2 className="size-3.5 animate-spin" />}
          {saved ? "Saved in this browser" : "Saving"}
        </span>
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
  const [citeOpen, setCiteOpen] = useState(false);
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
        setDoc(project.id, e.getJSON() as DocNode);
        setSaved(true);
        setVersion((v) => v + 1);
      }, 350);
    },
  });

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
        {editor ? <Toolbar editor={editor} onCite={() => setCiteOpen(true)} saved={saved} /> : <div className="h-12 border-b border-ink-100" />}
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
