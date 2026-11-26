"use client";

import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { resumePendingVerifications } from "@/lib/actions";
import { useCurrentProject, useHydrated } from "@/lib/hooks";
import { Sidebar } from "./sidebar";
import { StepNav } from "./step-nav";
import { WorkflowStepper } from "./workflow-stepper";

function ShellSkeleton() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[260px_1fr]" aria-busy="true" aria-label="Loading your workspace">
      <aside className="hidden border-r border-ink-200/70 bg-ink-25 p-4 lg:block">
        <Skeleton className="h-7 w-32 shimmer" />
        <Skeleton className="mt-6 h-12 w-full rounded-xl shimmer" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full shimmer" />
          ))}
        </div>
      </aside>
      <main className="p-8">
        <Skeleton className="h-8 w-72 shimmer" />
        <Skeleton className="mt-3 h-4 w-96 shimmer" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const project = useCurrentProject();
  const [open, setOpen] = useState(false);

  // finish reference checks that a closed or reloaded page left unfinished
  useEffect(() => {
    if (hydrated) resumePendingVerifications();
  }, [hydrated]);

  if (!hydrated) return <ShellSkeleton />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[260px_1fr]">
      <aside className="no-print sticky top-0 hidden h-dvh border-r border-ink-200/70 bg-ink-25 lg:block">
        <Sidebar />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] bg-ink-25 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-200/70 bg-white/80 px-4 backdrop-blur-md md:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <LogoMark className="size-6 lg:hidden" />
          {project ? (
            <WorkflowStepper className="ml-auto overflow-x-auto lg:ml-0" />
          ) : (
            <p className="text-[13px] text-ink-500">Open or create a project to start the workflow.</p>
          )}
        </header>
        <main className="flex-1">{children}</main>
        {project && <StepNav />}
      </div>
    </div>
  );
}
