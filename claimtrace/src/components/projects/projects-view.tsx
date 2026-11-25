"use client";

import { ArrowRight, BookOpen, FlaskConical, MoreHorizontal, PenLine, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app/page";
import { StatusDot } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { extractClaims } from "@/core/evidence/claims";
import type { Project } from "@/core/model";
import { sourceLabel } from "@/core/workflow/labels";
import { loadDemo } from "@/lib/demo";
import { useStore } from "@/lib/store";
import { NewProjectDialog } from "./new-project-dialog";

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const router = useRouter();
  const setCurrent = useStore((s) => s.setCurrentProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const sources = useStore((s) => s.sources);
  const stats = useMemo(() => {
    const list = Object.values(sources).filter((x) => x.projectId === project.id);
    const flagged = list.filter((x) => ["not_found", "retracted", "close_match"].includes(sourceLabel(x.verification))).length;
    return { sources: list.length, flagged, claims: extractClaims(project.doc).length };
  }, [sources, project]);

  const open = () => {
    setCurrent(project.id);
    router.push("/app/overview");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-trace-50 to-trace-100 font-display text-lg text-trace-800 ring-1 ring-trace-200">
          {project.title.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex items-center gap-1.5">
          {project.isDemo && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200 ring-inset">Demo</span>}
          <DropdownMenu>
            <DropdownMenuTrigger className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Project actions">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-rose-700 focus:text-rose-700"
                onSelect={() => {
                  deleteProject(project.id);
                  toast.success(`Deleted "${project.title}" and its data from this browser.`);
                }}
              >
                <Trash2 className="size-4" /> Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <button type="button" onClick={open} className="mt-4 text-left after:absolute after:inset-0 after:content-['']">
        <h3 className="text-[16px] font-semibold tracking-[-0.015em] text-ink-950">{project.title}</h3>
      </button>
      <p className="mt-1.5 line-clamp-2 font-serif text-[15px] leading-snug text-ink-600 italic">{project.question}</p>
      <div className="mt-5 flex items-center gap-4 border-t border-ink-100 pt-4 text-[12.5px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <BookOpen className="size-3.5" /> {stats.sources} sources
        </span>
        <span className="flex items-center gap-1.5">
          <PenLine className="size-3.5" /> {stats.claims} claims
        </span>
        {stats.flagged > 0 && (
          <span className="flex items-center gap-1.5 text-rose-700">
            <StatusDot label="not_found" /> {stats.flagged} flagged
          </span>
        )}
        <span className="ml-auto">{relative(project.updatedAt)}</span>
      </div>
    </motion.div>
  );
}

function Onboarding({ onNew, onDemo }: { onNew: () => void; onDemo: () => void }) {
  const steps = [
    { icon: FlaskConical, title: "Find real sources", text: "The Scout plans a search; OpenAlex returns real records. You approve what goes in." },
    { icon: PenLine, title: "Write and cite", text: "Type @ to cite from your library. Every cited sentence becomes a claim." },
    { icon: ShieldCheck, title: "See the evidence", text: "Each citation is checked three ways, plus a retraction flag, before you export." },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-200/80 bg-white shadow-card">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" aria-hidden="true" />
      <div className="relative grid gap-10 p-8 md:grid-cols-[1.1fr_1fr] md:p-12">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] text-trace-700 uppercase">Welcome to ClaimTrace</p>
          <h2 className="font-display mt-3 text-[38px] leading-[1.08] text-ink-950 md:text-[44px]">
            Start with a question. <span className="text-trace-700 italic">End with evidence.</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-500">
            The demo project is a short literature review with eleven cited claims. Some are supported, some go too far, one cites a fabricated paper and one cites a retracted paper.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button size="lg" onClick={onDemo}>
              Open the demo project <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" onClick={onNew}>
              <Plus /> New project
            </Button>
          </div>
        </div>
        <ol className="space-y-3 self-center">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-4 rounded-2xl border border-ink-200/70 bg-white/80 p-4 shadow-card backdrop-blur"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-950 text-white">
                <s.icon className="size-4" />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-ink-950">{s.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-500">{s.text}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ProjectsInner() {
  const projects = useStore((s) => s.projects);
  const setCurrent = useStore((s) => s.setCurrentProject);
  const router = useRouter();
  const params = useSearchParams();
  // "?new=<key>" opens the new-project dialog (from the landing page or the sidebar); each key opens it once
  const newKey = params.get("new");
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const open = manualOpen || (newKey !== null && newKey !== dismissedKey);
  const setOpen = (o: boolean) => {
    setManualOpen(o);
    if (!o && newKey) setDismissedKey(newKey);
  };
  const list = Object.values(projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const openDemo = () => {
    const id = loadDemo();
    setCurrent(id);
    toast.success("Demo project loaded", { description: "Nine references were verified live against Crossref and OpenAlex." });
    router.push("/app/overview");
  };

  // the landing page's "see it check a real draft" link: /app?demo=1 opens the demo project
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current || params.get("demo") !== "1") return;
    handled.current = true;
    openDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <Page>
      <PageHeader
        eyebrow="Workspace"
        title="Your research projects"
        description="Projects are stored only in this browser. Nothing you write is saved on a server."
        actions={
          list.length > 0 && (
            <>
              <Button variant="outline" onClick={openDemo}>
                <FlaskConical /> {projects["demo-project"] ? "Reset demo project" : "Open demo project"}
              </Button>
              <Button onClick={() => setOpen(true)}>
                <Plus /> New project
              </Button>
            </>
          )
        }
      />
      {list.length === 0 ? (
        <Onboarding onNew={() => setOpen(true)} onDemo={openDemo} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
      <NewProjectDialog open={open} onOpenChange={setOpen} />
    </Page>
  );
}

export function ProjectsView() {
  return (
    <Suspense>
      <ProjectsInner />
    </Suspense>
  );
}
