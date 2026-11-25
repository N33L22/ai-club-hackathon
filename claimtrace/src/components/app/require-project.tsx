"use client";

import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Project } from "@/core/model";
import { useCurrentProject } from "@/lib/hooks";
import { EmptyState, Page } from "./page";

/** Renders children with the open project, or a friendly prompt to open one. */
export function RequireProject({ children }: { children: (project: Project) => React.ReactNode }) {
  const project = useCurrentProject();
  if (!project) {
    return (
      <Page>
        <EmptyState
          icon={<FolderOpen />}
          title="No project is open"
          description="Open a project, or try the demo project to see every check in action."
          action={
            <Button asChild>
              <Link href="/app">Go to projects</Link>
            </Button>
          }
        />
      </Page>
    );
  }
  return <>{children(project)}</>;
}
