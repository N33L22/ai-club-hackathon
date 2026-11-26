"use client";

import { Download, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { extractClaims } from "@/core/evidence/claims";
import type { Project } from "@/core/model";
import { exportProjectFile } from "@/lib/project-file";
import { download, slug } from "@/lib/statement-data";
import { useStore } from "@/lib/store";

/**
 * Confirms before deleting a project: everything it holds lives only in this
 * browser, so a deleted project cannot be recovered unless it was exported.
 */
export function DeleteProjectDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const deleteProject = useStore((s) => s.deleteProject);
  const sources = useStore((s) => s.sources);
  const counts = useMemo(
    () => ({ sources: Object.values(sources).filter((s) => s.projectId === project.id).length, claims: extractClaims(project.doc).length }),
    [sources, project],
  );

  const remove = () => {
    const wasOpen = useStore.getState().currentProjectId === project.id;
    deleteProject(project.id);
    toast.success(`Deleted "${project.title}"`, { description: "Its draft, sources, checks, decisions and log were removed from this browser." });
    // a deleted project's pages have nothing to show: go back to the project list
    if (wasOpen && pathname !== "/app") router.push("/app");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{project.title}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the draft ({counts.claims} cited claim{counts.claims === 1 ? "" : "s"}), its {counts.sources} source{counts.sources === 1 ? "" : "s"}, the claim checks,
            your decisions and the project&apos;s audit log from this browser. It cannot be undone.
            {project.isDemo ? " You can load the demo project again at any time." : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!project.isDemo && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink-50 px-3.5 py-3 text-[13px] text-ink-600">
            Want a copy first?
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                download(`${slug(project.title)}.claimtrace.json`, exportProjectFile(project.id), "application/json");
                toast.success("Project file downloaded", { description: "Import it from Settings to restore the project." });
              }}
            >
              <Download /> Export project file
            </Button>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-700" onClick={remove}>
            <Trash2 /> Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
