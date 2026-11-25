"use client";

import { Download, ScrollText } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { ACTORS, ActorAvatar } from "@/components/app/activity";
import { EmptyState, Page, PageHeader, Panel } from "@/components/app/page";
import { RequireProject } from "@/components/app/require-project";
import { Button } from "@/components/ui/button";
import type { AuditEvent, Project } from "@/core/model";
import { download, slug } from "@/lib/statement-data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Group = "all" | "student" | "ai" | "code" | "system";
const inGroup = (e: AuditEvent, g: Group) =>
  g === "all" || (g === "student" && e.actor === "student") || (g === "ai" && e.actor.startsWith("ai:")) || (g === "code" && e.actor.startsWith("code:")) || (g === "system" && e.actor === "system");

function toCsv(events: AuditEvent[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["time", "actor", "action", "summary", "model"].join(",")];
  for (const e of events) rows.push([e.at, ACTORS[e.actor].label, e.action, e.summary, e.model ?? ""].map(esc).join(","));
  return rows.join("\n");
}

function Audit({ project }: { project: Project }) {
  const audit = useStore((s) => s.audit);
  const [group, setGroup] = useState<Group>("all");
  const events = useMemo(() => audit.filter((e) => e.projectId === project.id), [audit, project.id]);
  const shown = useMemo(() => events.filter((e) => inGroup(e, group)).reverse(), [events, group]);
  const byDay = useMemo(() => {
    const m = new Map<string, AuditEvent[]>();
    for (const e of shown) {
      const d = new Date(e.at).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      m.set(d, [...(m.get(d) ?? []), e]);
    }
    return [...m.entries()];
  }, [shown]);
  const counts = {
    all: events.length,
    student: events.filter((e) => inGroup(e, "student")).length,
    ai: events.filter((e) => inGroup(e, "ai")).length,
    code: events.filter((e) => inGroup(e, "code")).length,
    system: events.filter((e) => inGroup(e, "system")).length,
  };
  const groups: Array<[Group, string]> = [
    ["all", "Everything"],
    ["student", "Your decisions"],
    ["ai", "AI outputs"],
    ["code", "Code checks"],
    ["system", "System"],
  ];

  return (
    <Page>
      <PageHeader
        eyebrow="Governance"
        title="Audit log"
        description="Every AI output and every decision you make, with the time, who or what acted, and the model used. Share it with your supervisor."
        actions={
          <>
            <Button variant="outline" disabled={!events.length} onClick={() => download(`${slug(project.title)}-audit.csv`, toCsv(events), "text/csv;charset=utf-8")}>
              <Download /> CSV
            </Button>
            <Button variant="outline" disabled={!events.length} onClick={() => download(`${slug(project.title)}-audit.json`, JSON.stringify(events, null, 2), "application/json")}>
              <Download /> JSON
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {groups.map(([g, label]) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors",
              group === g ? "border-ink-950 bg-ink-950 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
            )}
          >
            {label}
            <span className={cn("rounded-full px-1.5 font-mono text-[10.5px]", group === g ? "bg-white/15" : "bg-ink-100 text-ink-500")}>{counts[g]}</span>
          </button>
        ))}
      </div>
      <Panel>
        {!shown.length ? (
          <EmptyState icon={<ScrollText />} title="Nothing logged yet" description="Actions appear here as you search, verify, check claims and make decisions." />
        ) : (
          byDay.map(([day, list]) => (
            <section key={day}>
              <h2 className="sticky top-14 z-10 border-b border-ink-100 bg-white/90 px-5 py-2.5 text-[12px] font-medium text-ink-500 backdrop-blur">{day}</h2>
              <ol className="relative">
                {list.map((e, i) => (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 15) * 0.02 }}
                    className="flex gap-3.5 border-b border-ink-100 px-5 py-3.5 last:border-0"
                  >
                    <ActorAvatar actor={e.actor} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] leading-snug text-ink-800">{e.summary}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink-400">
                        <span>{ACTORS[e.actor].label}</span>
                        <span className="font-mono">{e.action}</span>
                        {e.model && <span className="rounded bg-violet-50 px-1.5 font-mono text-violet-700">{e.model}</span>}
                      </p>
                    </div>
                    <time className="shrink-0 font-mono text-[11.5px] text-ink-400" dateTime={e.at}>
                      {new Date(e.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </motion.li>
                ))}
              </ol>
            </section>
          ))
        )}
      </Panel>
    </Page>
  );
}

export function AuditView() {
  return <RequireProject>{(p) => <Audit key={p.id} project={p} />}</RequireProject>;
}
