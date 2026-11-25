"use client";

import {
  Activity,
  BookOpen,
  ChevronsUpDown,
  FileCheck2,
  LayoutGrid,
  Lock,
  PenLine,
  Plus,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentProject, useGate, useProjectClaims, useProjectSources } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AiStatus } from "./ai-status";

function NavItem({ href, icon: Icon, label, badge, badgeTone = "neutral" }: { href: string; icon: typeof Search; label: string; badge?: React.ReactNode; badgeTone?: "neutral" | "warn" | "ok" }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
        active ? "bg-white text-ink-950 shadow-ring" : "text-ink-600 hover:bg-ink-100/70 hover:text-ink-950",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-trace-600" : "text-ink-400 group-hover:text-ink-600")} />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge !== null && (
        <span
          className={cn(
            "min-w-5 rounded-md px-1.5 py-px text-center font-mono text-[10.5px]",
            badgeTone === "warn" ? "bg-amber-100 text-amber-800" : badgeTone === "ok" ? "bg-trace-100 text-trace-800" : "bg-ink-100 text-ink-500",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function ProjectSwitcher() {
  const project = useCurrentProject();
  const projects = useStore((s) => s.projects);
  const setCurrent = useStore((s) => s.setCurrentProject);
  const router = useRouter();
  const list = Object.values(projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl border border-ink-200 bg-white p-2 text-left shadow-card transition-colors hover:border-ink-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-trace-500/30">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-trace-50 to-trace-100 font-display text-[15px] text-trace-800 ring-1 ring-trace-200">
          {(project?.title ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-semibold text-ink-900">{project?.title ?? "No project open"}</span>
          <span className="block truncate text-[11.5px] text-ink-500">{project ? (project.isDemo ? "Demo project" : "Research project") : "Choose or create one"}</span>
        </span>
        <ChevronsUpDown className="size-4 text-ink-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">Projects</DropdownMenuLabel>
        {list.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onSelect={() => {
              setCurrent(p.id);
              router.push("/app/overview");
            }}
            className={cn("gap-2", p.id === project?.id && "bg-ink-50")}
          >
            <span className="grid size-5 place-items-center rounded bg-ink-100 font-display text-[11px] text-ink-700">{p.title.slice(0, 1).toUpperCase()}</span>
            <span className="truncate">{p.title}</span>
          </DropdownMenuItem>
        ))}
        {list.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onSelect={() => router.push(`/app?new=${Date.now()}`)} className="gap-2">
          <Plus className="size-4" /> New project
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/app")} className="gap-2">
          <LayoutGrid className="size-4" /> All projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const project = useCurrentProject();
  const sources = useProjectSources(project?.id);
  const claims = useProjectClaims(project);
  const gate = useGate(project, claims);
  const flags = gate.needDecision + gate.needAck;

  return (
    <div className="flex h-full flex-col gap-5 px-3 py-4" onClick={(e) => (e.target as HTMLElement).closest("a") && onNavigate?.()}>
      <Link href="/" className="px-1.5 py-1" aria-label="ClaimTrace home">
        <Logo />
      </Link>

      <ProjectSwitcher />

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto" aria-label="Main">
        <div className="space-y-0.5">
          <NavItem href="/app" icon={LayoutGrid} label="Projects" />
        </div>
        {project && (
          <div className="space-y-0.5">
            <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">Research</p>
            <NavItem href="/app/overview" icon={Activity} label="Overview" />
            <NavItem href="/app/search" icon={Search} label="Search" />
            <NavItem href="/app/library" icon={BookOpen} label="Library" badge={sources.length || undefined} />
            <p className="px-2.5 pt-3 pb-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">Write and check</p>
            <NavItem href="/app/write" icon={PenLine} label="Write" badge={claims.length || undefined} />
            <NavItem
              href="/app/review"
              icon={ShieldCheck}
              label="Review claims"
              badge={claims.length ? (flags ? flags : "✓") : undefined}
              badgeTone={flags ? "warn" : "ok"}
            />
            <NavItem href="/app/export" icon={gate.ready ? FileCheck2 : Lock} label="Export" badgeTone={gate.ready ? "ok" : "neutral"} badge={gate.ready ? "ready" : undefined} />
            <p className="px-2.5 pt-3 pb-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">Records</p>
            <NavItem href="/app/audit" icon={ScrollText} label="Audit log" />
          </div>
        )}
      </nav>

      <div className="space-y-2">
        <NavItem href="/app/settings" icon={Settings} label="Settings and privacy" />
        <AiStatus />
      </div>
    </div>
  );
}
