"use client";

import { Bot, Cpu, ScanSearch, Sparkles, User, Wrench } from "lucide-react";
import type { Actor, AuditEvent } from "@/core/model";
import { cn } from "@/lib/utils";

export const ACTORS: Record<Actor, { label: string; icon: typeof User; cls: string }> = {
  student: { label: "You", icon: User, cls: "bg-ink-950 text-white" },
  "ai:scout": { label: "AI Scout", icon: Bot, cls: "bg-violet-100 text-violet-700" },
  "ai:skeptic": { label: "AI Skeptic", icon: Sparkles, cls: "bg-violet-100 text-violet-700" },
  "ai:assistant": { label: "AI Assistant", icon: Sparkles, cls: "bg-violet-100 text-violet-700" },
  "code:verifier": { label: "Verifier (code)", icon: ScanSearch, cls: "bg-trace-100 text-trace-800" },
  "code:skeptic": { label: "Code check", icon: Cpu, cls: "bg-trace-100 text-trace-800" },
  system: { label: "System", icon: Wrench, cls: "bg-ink-100 text-ink-600" },
};

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function ActorAvatar({ actor, className }: { actor: Actor; className?: string }) {
  const a = ACTORS[actor];
  return (
    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", a.cls, className)} title={a.label}>
      <a.icon className="size-3.5" />
    </span>
  );
}

export function ActivityList({ events, empty = "No activity yet." }: { events: AuditEvent[]; empty?: string }) {
  if (!events.length) return <p className="px-5 py-6 text-[13px] text-ink-500">{empty}</p>;
  return (
    <ul className="divide-y divide-ink-100">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 px-5 py-3.5">
          <ActorAvatar actor={e.actor} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-snug text-ink-800">{e.summary}</p>
            <p className="mt-1 text-[11.5px] text-ink-400">
              {ACTORS[e.actor].label}
              {e.model ? ` · ${e.model}` : ""} · {timeAgo(e.at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
