"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CITATION_STYLES, type CitationStyleId } from "@/core/model";
import { useStore } from "@/lib/store";

export function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createProject = useStore((s) => s.createProject);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [style, setStyle] = useState<CitationStyleId>("apa");
  const valid = title.trim().length > 1 && question.trim().length >= 8;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    createProject({ title, question, style });
    onOpenChange(false);
    setTitle("");
    setQuestion("");
    router.push("/app/search");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={submit}>
          <DialogHeader>
            <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">Step 1 · Ask</p>
            <DialogTitle className="text-xl tracking-[-0.02em]">Start a research project</DialogTitle>
            <DialogDescription>Your question guides the Scout&apos;s search plan. You can change it later.</DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-4">
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
