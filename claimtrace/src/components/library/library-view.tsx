"use client";

import { BookOpen, FileText, Folder, FolderPlus, Inbox, Plus, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, Page, PageHeader, Panel } from "@/components/app/page";
import { RequireProject } from "@/components/app/require-project";
import { LabelGuide } from "@/components/trust/label-guide";
import { TrustBadge, toneOf } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LABELS, SOURCE_LABEL_ORDER, type TrustLabel } from "@/core/labels";
import { checkText, type LibrarySource, type Project } from "@/core/model";
import { stripRetractedPrefix } from "@/core/text/normalize";
import { sourceLabel } from "@/core/workflow/labels";
import { useProjectFolders, useProjectSources, useSourceCounts } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { authorLine } from "../search/result-card";
import { AddSourceDialog } from "./add-source-dialog";
import { SourceMixView } from "./source-mix";
import { SourceSheet } from "./source-sheet";

type FolderFilter = "all" | "unfiled" | string;

/** Reference labels in reading order for the "What the labels mean" guide. */
const GUIDE_LABELS: TrustLabel[] = ["verified", "close_match", "unavailable", "student_added", "not_found", "retracted", "pending"];

function SourceRow({ src, onOpen, index }: { src: LibrarySource; onOpen: () => void; index: number }) {
  const label = sourceLabel(src.verification);
  const folder = useStore((s) => (src.folderId ? s.folders[src.folderId] : undefined));
  const origin = checkText(src).origin;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.025, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-ink-25 focus-visible:bg-ink-25 focus-visible:outline-none"
      >
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneOf(label).dot)} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[16px] leading-snug text-ink-950 group-hover:text-ink-800">{stripRetractedPrefix(src.record.title)}</span>
          <span className="mt-1 block text-[12.5px] text-ink-500">
            {authorLine(src.record)}
            {src.record.year ? ` · ${src.record.year}` : ""}
            {src.record.venue ? ` · ${src.record.venue}` : ""}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            {folder && (
              <span className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-1.5 py-0.5 text-[11px] text-ink-600 ring-1 ring-ink-200 ring-inset">
                <Folder className="size-3" /> {folder.name}
              </span>
            )}
            {src.tags.map((t) => (
              <span key={t} className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-600">
                {t}
              </span>
            ))}
            <span className={cn("inline-flex items-center gap-1 text-[11px]", origin === "none" ? "text-sky-700" : "text-ink-400")}>
              <FileText className="size-3" />
              {origin === "student_text" ? "Your text" : origin === "abstract" ? "Abstract" : "No text to check"}
            </span>
          </span>
        </span>
        <span className="shrink-0">
          <TrustBadge label={label} context="source" />
        </span>
      </button>
    </motion.li>
  );
}

function FolderButton({ id, name, icon: Icon, active, count, onSelect }: { id: FolderFilter; name: string; icon: typeof Folder; active: boolean; count: number; onSelect: (id: FolderFilter) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "group flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13px] transition-colors",
        active ? "bg-white font-medium text-ink-950 shadow-ring" : "text-ink-600 hover:bg-ink-100/70",
      )}
    >
      <Icon className={cn("size-3.5", active ? "text-trace-600" : "text-ink-400")} />
      <span className="flex-1 truncate">{name}</span>
      <span className="font-mono text-[11px] text-ink-400">{count}</span>
    </button>
  );
}

function Library({ project }: { project: Project }) {
  const sources = useProjectSources(project.id);
  const folders = useProjectFolders(project.id);
  const counts = useSourceCounts(sources);
  const addFolder = useStore((s) => s.addFolder);
  const deleteFolder = useStore((s) => s.deleteFolder);
  const [folder, setFolder] = useState<FolderFilter>("all");
  const [status, setStatus] = useState<TrustLabel | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newFolder, setNewFolder] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((s) => {
      if (folder === "unfiled" && s.folderId) return false;
      if (folder !== "all" && folder !== "unfiled" && s.folderId !== folder) return false;
      if (status !== "all" && sourceLabel(s.verification) !== status) return false;
      if (q && !`${s.record.title} ${s.record.authors.map((a) => a.family).join(" ")} ${s.record.year ?? ""} ${s.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sources, folder, status, query]);

  const folderCount = (id: FolderFilter) =>
    id === "all" ? sources.length : id === "unfiled" ? sources.filter((s) => !s.folderId).length : sources.filter((s) => s.folderId === id).length;
  const folderProps = (id: FolderFilter) => ({ id, active: folder === id, count: folderCount(id), onSelect: setFolder });

  return (
    <Page wide>
      <PageHeader
        eyebrow="Step 3 · Approve and organise"
        title="Library"
        description="Every source is checked against Crossref and OpenAlex: does it exist, do the details match, has it been retracted?"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/app/search">
                <Search /> Search more
              </Link>
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus /> Add sources
            </Button>
          </>
        }
      />

      <LabelGuide labels={GUIDE_LABELS} context="source" className="mb-5" />

      <Tabs defaultValue="sources">
        <TabsList className="mb-5">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="mix">Source mix</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            {/* on phones the sources come first, folders and filters after them */}
            <aside className="order-last space-y-6 lg:order-0">
              <div className="space-y-0.5">
                <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">Folders</p>
                <FolderButton {...folderProps("all")} name="All sources" icon={BookOpen} />
                <FolderButton {...folderProps("unfiled")} name="Unfiled" icon={Inbox} />
                {folders.map((f) => (
                  <div key={f.id} className="group/f relative">
                    <FolderButton {...folderProps(f.id)} name={f.name} icon={Folder} />
                    <button
                      type="button"
                      onClick={() => {
                        deleteFolder(f.id);
                        if (folder === f.id) setFolder("all");
                      }}
                      className="absolute top-1.5 right-8 hidden rounded p-0.5 text-ink-400 group-hover/f:block hover:text-rose-600"
                      aria-label={`Delete folder ${f.name} (sources stay in the library)`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {newFolder === null ? (
                  <button type="button" onClick={() => setNewFolder("")} className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[13px] text-ink-500 hover:bg-ink-100/70 hover:text-ink-800">
                    <FolderPlus className="size-3.5" /> New folder
                  </button>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newFolder.trim()) setFolder(addFolder(project.id, newFolder));
                      setNewFolder(null);
                    }}
                  >
                    <Input autoFocus value={newFolder} onChange={(e) => setNewFolder(e.target.value)} onBlur={() => !newFolder.trim() && setNewFolder(null)} placeholder="Folder name" className="h-8 text-[13px]" />
                  </form>
                )}
              </div>
              <div className="space-y-1">
                <p className="px-2.5 pb-1 text-[11px] font-medium tracking-wide text-ink-400 uppercase">Verification</p>
                <button type="button" onClick={() => setStatus("all")} className={cn("flex h-8 w-full items-center rounded-lg px-2.5 text-[13px]", status === "all" ? "bg-white font-medium shadow-ring" : "text-ink-600 hover:bg-ink-100/70")}>
                  Any status
                </button>
                {SOURCE_LABEL_ORDER.filter((l) => counts[l]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setStatus(status === l ? "all" : l)}
                    className={cn("flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[13px]", status === l ? "bg-white font-medium shadow-ring" : "text-ink-600 hover:bg-ink-100/70")}
                  >
                    <span className={cn("size-2 rounded-full", toneOf(l).dot)} />
                    <span className="flex-1 text-left">{LABELS[l].title}</span>
                    <span className="font-mono text-[11px] text-ink-400">{counts[l]}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by title, author, year or tag" className="pl-9" />
                </div>
              </div>
              <Panel>
                {sources.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen />}
                    title="Your library is empty"
                    description="Search the literature, paste a reference list, or import a BibTeX file. Every source is verified before it is added."
                    action={
                      <>
                        <Button asChild>
                          <Link href="/app/search">
                            <Search /> Search
                          </Link>
                        </Button>
                        <Button variant="outline" onClick={() => setAdding(true)}>
                          <Plus /> Add sources
                        </Button>
                      </>
                    }
                  />
                ) : filtered.length === 0 ? (
                  <EmptyState icon={<Search />} title="Nothing matches these filters" description="Clear the folder, status or text filter to see all sources." />
                ) : (
                  <ul className="divide-y divide-ink-100">
                    <AnimatePresence initial={false}>
                      {filtered.map((s, i) => (
                        <SourceRow key={s.id} src={s} index={i} onOpen={() => setOpenId(s.id)} />
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mix">
          <SourceMixView sources={sources} />
        </TabsContent>
      </Tabs>

      <SourceSheet sourceId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
      <AddSourceDialog projectId={project.id} folderId={folder !== "all" && folder !== "unfiled" ? folder : undefined} open={adding} onOpenChange={setAdding} />
    </Page>
  );
}

export function LibraryView() {
  return <RequireProject>{(p) => <Library key={p.id} project={p} />}</RequireProject>;
}
