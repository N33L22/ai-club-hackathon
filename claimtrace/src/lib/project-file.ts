"use client";

/**
 * Project files: move a project to another browser or device, or keep a backup
 * (everything else lives only in this browser's storage). One project per file,
 * validated on import so a damaged or foreign file cannot corrupt saved data.
 */
import { z } from "zod";
import type { Bundle } from "./store";
import { useStore } from "./store";

const FORMAT = "claimtrace-project";

const Id = z.string().min(1).max(200);
const ProjectSchema = z.looseObject({
  id: Id,
  title: z.string().max(500),
  question: z.string().max(5000),
  style: z.enum(["apa", "mla", "harvard", "ieee", "vancouver"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  doc: z.looseObject({ type: z.literal("doc") }),
});
const SourceSchema = z.looseObject({
  id: Id,
  projectId: Id,
  origin: z.enum(["database", "student"]),
  record: z.looseObject({ title: z.string(), authors: z.array(z.looseObject({ family: z.string() })), foundIn: z.array(z.string()) }),
  tags: z.array(z.string()),
  notes: z.string(),
  addedAt: z.string(),
});
const FolderSchema = z.looseObject({ id: Id, projectId: Id, name: z.string(), createdAt: z.string() });
const FileSchema = z.object({
  format: z.literal(FORMAT),
  version: z.literal(1),
  exportedAt: z.string(),
  project: ProjectSchema,
  sources: z.array(SourceSchema).max(2000),
  folders: z.array(FolderSchema).max(500),
  checks: z.record(z.string(), z.looseObject({ projectId: Id, bySource: z.record(z.string(), z.looseObject({ verdict: z.string() })) })),
  decisions: z.record(z.string(), z.looseObject({ projectId: Id, action: z.string(), label: z.string(), at: z.string() })),
  audit: z.array(z.looseObject({ id: Id, projectId: Id, at: z.string(), actor: z.string(), action: z.string(), summary: z.string() })).max(5000),
});

/** Serialise one project with its sources, folders, checks, decisions and audit log. */
export function exportProjectFile(projectId: string): string {
  const s = useStore.getState();
  const project = s.projects[projectId];
  if (!project) throw new Error("No such project.");
  const mine = <T extends { projectId: string }>(map: Record<string, T>) => Object.fromEntries(Object.entries(map).filter(([, v]) => v.projectId === projectId));
  return JSON.stringify(
    {
      format: FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      project,
      sources: Object.values(s.sources).filter((x) => x.projectId === projectId),
      folders: Object.values(s.folders).filter((x) => x.projectId === projectId),
      checks: mine(s.checks),
      decisions: mine(s.decisions),
      audit: s.audit.filter((e) => e.projectId === projectId),
    },
    null,
    2,
  );
}

/** Parse and validate a project file. Throws an Error with a readable message. */
export function parseProjectFile(text: string): Bundle {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const parsed = FileSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`That is not a ClaimTrace project file (${issue?.path.join(".") || "format"}: ${issue?.message ?? "invalid"}).`);
  }
  const f = parsed.data;
  const id = f.project.id;
  const foreign = [...f.sources, ...f.folders, ...Object.values(f.checks), ...Object.values(f.decisions), ...f.audit].some((x) => x.projectId !== id);
  if (foreign) throw new Error("The file mixes data from more than one project.");
  return f as unknown as Bundle;
}

/** Import a validated project, replacing a project with the same id. Returns the project id. */
export function importProjectFile(bundle: Bundle): string {
  const s = useStore.getState();
  if (s.projects[bundle.project.id]) s.deleteProject(bundle.project.id);
  s.importBundle(bundle);
  s.log({ projectId: bundle.project.id, actor: "student", action: "project.imported", summary: `Imported the project "${bundle.project.title}" from a file.` });
  return bundle.project.id;
}
