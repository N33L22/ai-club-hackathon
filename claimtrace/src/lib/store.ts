"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DocNode } from "@/core/evidence/claims";
import type {
  AuditEvent,
  CitationStyleId,
  Folder,
  LibrarySource,
  Project,
  StoredClaimChecks,
  StoredDecision,
} from "@/core/model";
import { mergeDefined } from "@/core/records";
import type { ClaimCheck, GroundedSummary, ScholarlyRecord, SourceVerification } from "@/core/types";

/**
 * Client state. Persisted to this browser's localStorage only (privacy by
 * design: nothing is stored on a server). The repository boundary is this
 * file: swapping in Supabase later means replacing the `storage` option.
 */

export const EMPTY_DOC: DocNode = { type: "doc", content: [{ type: "paragraph" }] };

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const now = () => new Date().toISOString();
const AUDIT_CAP = 2500;

export interface Data {
  currentProjectId?: string;
  projects: Record<string, Project>;
  sources: Record<string, LibrarySource>;
  folders: Record<string, Folder>;
  checks: Record<string, StoredClaimChecks>;
  decisions: Record<string, StoredDecision>;
  audit: AuditEvent[];
}

export interface Bundle {
  project: Project;
  sources: LibrarySource[];
  folders: Folder[];
  checks?: Record<string, StoredClaimChecks>;
  decisions?: Record<string, StoredDecision>;
  audit?: AuditEvent[];
}

interface Actions {
  createProject(input: { title: string; question: string; style?: CitationStyleId }): string;
  updateProject(id: string, patch: Partial<Omit<Project, "id" | "createdAt">>): void;
  setDoc(id: string, doc: DocNode): void;
  deleteProject(id: string): void;
  setCurrentProject(id: string | undefined): void;
  importBundle(bundle: Bundle): void;

  addSource(input: Omit<LibrarySource, "id" | "addedAt" | "tags" | "notes"> & Partial<Pick<LibrarySource, "tags" | "notes">>): string;
  updateSource(id: string, patch: Partial<Omit<LibrarySource, "id" | "projectId">>): void;
  setVerification(id: string, verification: SourceVerification, record?: ScholarlyRecord): void;
  setStudentText(id: string, text: string): void;
  setSummary(id: string, summary: GroundedSummary | undefined): void;
  removeSource(id: string): void;

  addFolder(projectId: string, name: string): string;
  renameFolder(id: string, name: string): void;
  deleteFolder(id: string): void;

  setClaimCheck(projectId: string, claimKey: string, sourceId: string, check: ClaimCheck): void;
  setDecision(projectId: string, claimKey: string, decision: Omit<StoredDecision, "projectId"> | null): void;

  log(event: Omit<AuditEvent, "id" | "at"> & { at?: string }): void;
  deleteAllData(): void;
}

export type Store = Data & Actions;

const initial: Data = { projects: {}, sources: {}, folders: {}, checks: {}, decisions: {}, audit: [] };

function without<T>(map: Record<string, T>, pred: (v: T) => boolean): Record<string, T> {
  return Object.fromEntries(Object.entries(map).filter(([, v]) => !pred(v)));
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,

      createProject({ title, question, style = "apa" }) {
        const id = uid();
        const t = now();
        set((s) => ({
          projects: { ...s.projects, [id]: { id, title: title.trim() || "Untitled project", question: question.trim(), style, createdAt: t, updatedAt: t, doc: EMPTY_DOC } },
          currentProjectId: id,
        }));
        get().log({ projectId: id, actor: "student", action: "project.created", summary: `Created the project "${title.trim() || "Untitled project"}".` });
        return id;
      },

      updateProject(id, patch) {
        set((s) => (s.projects[id] ? { projects: { ...s.projects, [id]: { ...s.projects[id], ...patch, updatedAt: now() } } } : s));
      },

      setDoc(id, doc) {
        set((s) => (s.projects[id] ? { projects: { ...s.projects, [id]: { ...s.projects[id], doc, updatedAt: now() } } } : s));
      },

      deleteProject(id) {
        set((s) => ({
          projects: without(s.projects, (p) => p.id === id),
          sources: without(s.sources, (x) => x.projectId === id),
          folders: without(s.folders, (x) => x.projectId === id),
          checks: without(s.checks, (x) => x.projectId === id),
          decisions: without(s.decisions, (x) => x.projectId === id),
          audit: s.audit.filter((e) => e.projectId !== id),
          currentProjectId: s.currentProjectId === id ? undefined : s.currentProjectId,
        }));
      },

      setCurrentProject(id) {
        set({ currentProjectId: id });
      },

      importBundle(b) {
        set((s) => ({
          projects: { ...s.projects, [b.project.id]: b.project },
          sources: { ...s.sources, ...Object.fromEntries(b.sources.map((x) => [x.id, x])) },
          folders: { ...s.folders, ...Object.fromEntries(b.folders.map((x) => [x.id, x])) },
          checks: { ...s.checks, ...(b.checks ?? {}) },
          decisions: { ...s.decisions, ...(b.decisions ?? {}) },
          audit: [...s.audit, ...(b.audit ?? [])].slice(-AUDIT_CAP),
          currentProjectId: b.project.id,
        }));
      },

      addSource(input) {
        const id = uid();
        set((s) => ({ sources: { ...s.sources, [id]: { tags: [], notes: "", ...input, id, addedAt: now() } } }));
        return id;
      },

      updateSource(id, patch) {
        set((s) => (s.sources[id] ? { sources: { ...s.sources, [id]: { ...s.sources[id], ...patch } } } : s));
      },

      setVerification(id, verification, record) {
        set((s) => {
          const src = s.sources[id];
          if (!src) return s;
          // keep the student's own entry for student-added sources; otherwise adopt the database record,
          // without letting a partial answer (e.g. no abstract because OpenAlex was down) erase known fields
          const merged = record && src.origin === "database" ? mergeDefined(src.record, record) : src.record;
          return { sources: { ...s.sources, [id]: { ...src, verification, record: merged } } };
        });
      },

      setStudentText(id, text) {
        set((s) => {
          const src = s.sources[id];
          if (!src) return s;
          // checks made against the old text are no longer valid
          const checks = Object.fromEntries(
            Object.entries(s.checks).map(([k, v]) => {
              if (!v.bySource[id]) return [k, v];
              const bySource = { ...v.bySource };
              delete bySource[id];
              return [k, { ...v, bySource }];
            }),
          );
          return { sources: { ...s.sources, [id]: { ...src, studentText: text.trim() || undefined, summary: undefined } }, checks };
        });
      },

      setSummary(id, summary) {
        set((s) => (s.sources[id] ? { sources: { ...s.sources, [id]: { ...s.sources[id], summary } } } : s));
      },

      removeSource(id) {
        set((s) => ({ sources: without(s.sources, (x) => x.id === id) }));
      },

      addFolder(projectId, name) {
        const id = uid();
        set((s) => ({ folders: { ...s.folders, [id]: { id, projectId, name: name.trim() || "New folder", createdAt: now() } } }));
        return id;
      },

      renameFolder(id, name) {
        set((s) => (s.folders[id] ? { folders: { ...s.folders, [id]: { ...s.folders[id], name: name.trim() || s.folders[id].name } } } : s));
      },

      deleteFolder(id) {
        set((s) => ({
          folders: without(s.folders, (f) => f.id === id),
          sources: Object.fromEntries(Object.entries(s.sources).map(([k, v]) => [k, v.folderId === id ? { ...v, folderId: undefined } : v])),
        }));
      },

      setClaimCheck(projectId, claimKey, sourceId, check) {
        set((s) => {
          const prev = s.checks[claimKey] ?? { projectId, bySource: {} };
          return { checks: { ...s.checks, [claimKey]: { projectId, bySource: { ...prev.bySource, [sourceId]: check } } } };
        });
      },

      setDecision(projectId, claimKey, decision) {
        set((s) => {
          if (!decision) {
            const next = { ...s.decisions };
            delete next[claimKey];
            return { decisions: next };
          }
          return { decisions: { ...s.decisions, [claimKey]: { ...decision, projectId } } };
        });
      },

      log(event) {
        set((s) => ({ audit: [...s.audit, { ...event, id: uid(), at: event.at ?? now() }].slice(-AUDIT_CAP) }));
      },

      deleteAllData() {
        set({ ...initial, currentProjectId: undefined });
        try {
          localStorage.removeItem("claimtrace-v1");
        } catch {
          // storage unavailable: in-memory state is already cleared
        }
      },
    }),
    {
      name: "claimtrace-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s): Data => ({
        currentProjectId: s.currentProjectId,
        projects: s.projects,
        sources: s.sources,
        folders: s.folders,
        checks: s.checks,
        decisions: s.decisions,
        audit: s.audit,
      }),
    },
  ),
);

/** Rough size of what this browser stores for ClaimTrace (bytes). */
export function storedBytes(): number {
  try {
    return (localStorage.getItem("claimtrace-v1") ?? "").length * 2;
  } catch {
    return 0;
  }
}
