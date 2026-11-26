"use client";

import { FileUp, Loader2, Sparkles, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { codeDocumentIdea, type DocumentIdea } from "@/core/document-idea";
import { CITATION_STYLES, type CitationStyleId } from "@/core/model";
import { api } from "@/lib/api";
import { ACCEPTED, DocumentReadError, readDocumentText } from "@/lib/document-text";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type DocState =
  | { status: "idle" }
  | { status: "reading" | "thinking"; name: string }
  | { status: "done"; name: string; idea: DocumentIdea }
  | { status: "error"; message: string };

/** "Start from a document": drop or choose a file; the title and question fields are filled in as a suggestion. */
function DocumentDrop({ state, onFile, onClear }: { state: DocState; onFile: (f: File) => void; onClear: () => void }) {
  const [over, setOver] = useState(false);
  const busy = state.status === "reading" || state.status === "thinking";
  return (
    <div>
      <label
        htmlFor="np-file"
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) onFile(f);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3.5 transition-colors",
          over ? "border-trace-500 bg-trace-50" : "border-ink-300 bg-ink-25 hover:border-trace-400 hover:bg-trace-50/40",
          busy && "pointer-events-none",
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-trace-700 ring-1 ring-ink-200">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-ink-950">
            {state.status === "reading"
              ? `Reading ${state.name}…`
              : state.status === "thinking"
                ? "Suggesting a title and a research question…"
                : "Start from a document (optional)"}
          </span>
          <span className="block text-[12px] leading-relaxed text-ink-500">
            Drop or choose a PDF, Word (.docx) or text file, such as your assignment brief or a draft. ClaimTrace suggests a title and a research question for you to edit.
          </span>
        </span>
        <input
          id="np-file"
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />
      </label>
      {state.status === "done" && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-violet-50 px-3 py-2 text-[12px] leading-relaxed text-violet-950 ring-1 ring-violet-200 ring-inset" role="status">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-700" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <b>Suggested from {state.name}</b> ·{" "}
            {state.idea.mode === "ai" ? `AI suggestion (${state.idea.model ?? "the Scout"})` : "taken from the document's own text (AI offline)"}. Research area:{" "}
            <b>{state.idea.area}</b>. Edit anything below before you create the project. The file is not stored
            {state.idea.mode === "ai" ? "; only its opening text was sent to the AI, to make this suggestion." : "."}
          </span>
          <button type="button" onClick={onClear} className="rounded p-0.5 text-violet-700 hover:bg-violet-100" aria-label="Clear the suggestion">
            <X className="size-3.5" />
          </button>
        </div>
      )}
      {state.status === "error" && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[12px] leading-relaxed text-rose-900 ring-1 ring-rose-200 ring-inset" role="alert">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {state.message}
        </p>
      )}
    </div>
  );
}

export function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createProject = useStore((s) => s.createProject);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [style, setStyle] = useState<CitationStyleId>("apa");
  const [doc, setDoc] = useState<DocState>({ status: "idle" });
  const busy = doc.status === "reading" || doc.status === "thinking";
  const valid = title.trim().length > 1 && question.trim().length >= 8 && !busy;

  async function fromDocument(file: File) {
    setDoc({ status: "reading", name: file.name });
    try {
      const { text, metaTitle } = await readDocumentText(file);
      setDoc({ status: "thinking", name: file.name });
      let idea: DocumentIdea;
      try {
        idea = (await api.documentIdea({ text, metaTitle, fileName: file.name })).idea;
      } catch {
        // the server could not be reached: suggest from the document's own text instead
        idea = codeDocumentIdea(text, metaTitle, file.name);
      }
      setTitle(idea.title);
      setQuestion(idea.question);
      setDoc({ status: "done", name: file.name, idea });
    } catch (e) {
      setDoc({
        status: "error",
        message: e instanceof DocumentReadError ? e.message : "That file could not be read. Try another file, or type the title and question yourself.",
      });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const id = createProject({ title, question, style });
    if (doc.status === "done") {
      useStore.getState().log({
        projectId: id,
        actor: doc.idea.mode === "ai" ? "ai:scout" : "system",
        action: "project.from_document",
        model: doc.idea.model,
        summary: `Title and research question suggested from "${doc.name}" (${doc.idea.mode === "ai" ? "AI suggestion" : "taken from the document's text"}; research area: ${doc.idea.area}). The student reviewed them before creating the project.`,
      });
    }
    onOpenChange(false);
    setTitle("");
    setQuestion("");
    setDoc({ status: "idle" });
    router.push("/app/search");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">Step 1 · Ask</p>
            <DialogTitle className="text-xl tracking-[-0.02em]">Start a research project</DialogTitle>
            <DialogDescription>Your question guides the Scout&apos;s search plan. You can change it later.</DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-4">
            <DocumentDrop state={doc} onFile={(f) => void fromDocument(f)} onClear={() => setDoc({ status: "idle" })} />
            <div className="space-y-1.5">
              <Label htmlFor="np-title">Project name</Label>
              <Input id="np-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sleep and exam performance" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-question">Research question</Label>
              <Textarea
                id="np-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                className="font-serif text-[15px] leading-relaxed"
                placeholder="e.g. Does sleep duration affect university students' exam performance?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Citation style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as CitationStyleId)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITATION_STYLES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Create and plan the search
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
