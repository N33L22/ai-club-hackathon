"use client";

import { ArrowRight, Bot, Check, Hand, Loader2, Plus, Search, Sparkles, TriangleAlert, Wrench, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState, Page, PageHeader, Panel } from "@/components/app/page";
import { RequireProject } from "@/components/app/require-project";
import { LabelGuide } from "@/components/trust/label-guide";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { THRESHOLDS } from "@/core/config";
import type { TrustLabel } from "@/core/labels";
import type { Project } from "@/core/model";
import { recordKey } from "@/core/records";
import { extractDoi } from "@/core/text/normalize";
import { titleSimilarity } from "@/core/text/similarity";
import type { ScholarlyRecord, SearchPlan } from "@/core/types";
import { sourceLabel } from "@/core/workflow/labels";
import { approvePlan, generatePlan, saveRecords } from "@/lib/actions";
import { api, ApiError } from "@/lib/api";
import { useProjectFolders, useProjectSources } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ResultCard, SEARCH_RESULT_LABEL } from "./result-card";

const keyOf = recordKey;

/** What the Search page's labels mean: the results' own label, the AI's plan, and what saving leads to. */
const SEARCH_GUIDE = [
  {
    key: "result",
    chip: <TrustBadge label="pending" context="source" title={SEARCH_RESULT_LABEL.title} withTooltip={false} />,
    meaning: SEARCH_RESULT_LABEL.meaning,
  },
  {
    key: "ai",
    chip: <TrustBadge label="ai_reasoning" title="AI suggestion" withTooltip={false} />,
    meaning: "Written by the AI: the Scout's search plan. Nothing is searched or saved until you edit or approve it.",
  },
];
const SEARCH_GUIDE_LABELS: TrustLabel[] = ["verified", "close_match", "retracted", "not_found", "unavailable"];

function PlanEditor({ plan, onChange, onApprove, busy }: { plan: SearchPlan; onChange: (p: SearchPlan) => void; onApprove: () => void; busy: boolean }) {
  const [draft, setDraft] = useState("");
  const addQuery = () => {
    const q = draft.trim();
    if (q.length < 2 || plan.queries.includes(q) || plan.queries.length >= 4) return;
    onChange({ ...plan, queries: [...plan.queries, q] });
    setDraft("");
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-gradient-to-r from-violet-50/60 to-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className={cn("grid size-9 place-items-center rounded-xl", plan.mode === "ai" ? "bg-violet-100 text-violet-700" : "bg-ink-100 text-ink-600")}>
              {plan.mode === "ai" ? <Bot className="size-4" /> : <Wrench className="size-4" />}
            </span>
            <div>
              <p className="text-[14.5px] font-semibold text-ink-950">{plan.mode === "ai" ? "Search plan from the Scout" : "Search plan from code"}</p>
              <p className="text-[12.5px] text-ink-500">{plan.mode === "ai" ? `AI suggestion (${plan.model}). Edit anything before you approve.` : "The AI planner is offline, so code used your question's key words."}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-medium text-amber-800 ring-1 ring-amber-200 ring-inset">
            <Hand className="size-3.5" /> Checkpoint 1: you approve the plan
          </span>
        </div>
        <div className="space-y-5 p-5">
          {plan.rationale && (
            <p className="flex gap-2 text-[13.5px] leading-relaxed text-ink-600">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-500" aria-label="AI reasoning" />
              <span>
                <span className="mr-1.5 rounded bg-violet-50 px-1.5 py-px text-[11px] font-medium text-violet-700">{plan.mode === "ai" ? "AI reasoning" : "Note"}</span>
                {plan.rationale}
              </span>
            </p>
          )}
          <div>
            <Label className="text-[12.5px] text-ink-600">Search queries (sent to OpenAlex)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {plan.queries.map((q) => (
                  <motion.span
                    key={q}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white py-1.5 pr-1.5 pl-3 text-[13.5px] text-ink-900 shadow-card"
                  >
                    <Search className="size-3.5 text-ink-400" />
                    {q}
                    <button
                      type="button"
                      onClick={() => onChange({ ...plan, queries: plan.queries.filter((x) => x !== q) })}
                      disabled={plan.queries.length === 1}
                      className="grid size-5 place-items-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30"
                      aria-label={`Remove query ${q}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {plan.queries.length < 4 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addQuery();
                  }}
                  className="flex items-center gap-1"
                >
                  <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a query" className="h-9 w-48" />
                  <Button type="submit" size="icon-sm" variant="outline" aria-label="Add query">
                    <Plus />
                  </Button>
                </form>
              )}
            </div>
          </div>
          {plan.keywords.length > 0 && (
            <div>
              <Label className="text-[12.5px] text-ink-600">Key concepts</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.keywords.map((k) => (
                  <span key={k} className="rounded-md bg-ink-50 px-2 py-0.5 text-[12.5px] text-ink-600 ring-1 ring-ink-200 ring-inset">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="from" className="text-[12.5px] text-ink-600">From year</Label>
              <Input id="from" inputMode="numeric" value={plan.fromYear ?? ""} placeholder="Any" onChange={(e) => onChange({ ...plan, fromYear: Number(e.target.value) || undefined })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to" className="text-[12.5px] text-ink-600">To year</Label>
              <Input id="to" inputMode="numeric" value={plan.toYear ?? ""} placeholder="Any" onChange={(e) => onChange({ ...plan, toYear: Number(e.target.value) || undefined })} />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2">
              <span className="text-[13px] text-ink-700">Include reviews</span>
              <Switch checked={plan.includeReviews} onCheckedChange={(v) => onChange({ ...plan, includeReviews: v })} />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2">
              <span className="text-[13px] text-ink-700">Only with abstracts</span>
              <Switch checked={plan.onlyWithAbstract} onCheckedChange={(v) => onChange({ ...plan, onlyWithAbstract: v })} />
            </label>
          </div>
          <p className="text-[12.5px] text-ink-500">
            &ldquo;Only with abstracts&rdquo; is recommended: claims can only be checked against text the database provides (or text you paste).
          </p>
        </div>
        <div className="flex justify-end border-t border-ink-100 bg-ink-25 px-5 py-3.5">
          <Button onClick={onApprove} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Check />} Approve plan and search
          </Button>
        </div>
      </Panel>
    </motion.div>
  );
}

function SearchInner({ project }: { project: Project }) {
  const params = useSearchParams();
  const router = useRouter();
  const forClaim = params.get("q");
  const [question, setQuestion] = useState(forClaim ?? project.question);
  const [plan, setPlan] = useState<SearchPlan | null>(forClaim ? null : (project.plan ?? null));
  const [planning, setPlanning] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ScholarlyRecord[] | null>(null);
  const [searchError, setSearchError] = useState<{ message: string; quota: boolean } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [folderId, setFolderId] = useState<string>("none");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [mode, setMode] = useState<"question" | "name">("question");
  const [name, setName] = useState("");
  // where the shown results came from, and what a DOI lookup found
  const [resultsFrom, setResultsFrom] = useState<"plan" | "title" | "doi">("plan");
  const [lookup, setLookup] = useState<{ label: TrustLabel; reason: string } | null>(null);
  const [checkedLabels, setCheckedLabels] = useState<Map<string, TrustLabel>>(new Map());
  // title search: does a result have the title the student typed (same rule as the Verifier)?
  const [titleMatch, setTitleMatch] = useState<boolean | null>(null);
  const library = useProjectSources(project.id);
  const folders = useProjectFolders(project.id);
  const inLibrary = useMemo(() => new Set(library.map((s) => recordKey(s.record))), [library]);
  const libraryLabels = useMemo(() => new Map(library.map((s) => [recordKey(s.record), sourceLabel(s.verification)])), [library]);
  const abortRef = useRef<AbortController | null>(null);
  const autoPlanned = useRef(false);

  async function makePlan() {
    setPlanning(true);
    try {
      setPlan(await generatePlan(project.id, question));
      setResults(null);
    } catch (e) {
      toast.error("Could not plan the search", { description: e instanceof ApiError ? e.message : "Please try again." });
    } finally {
      setPlanning(false);
    }
  }

  useEffect(() => {
    if (forClaim && !autoPlanned.current) {
      autoPlanned.current = true;
      void makePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forClaim]);

  /** Clears the last results and returns a signal that a newer search aborts. */
  function startSearch(from: "plan" | "title" | "doi") {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    setResults(null);
    setSearchError(null);
    setSelected(new Set());
    setLookup(null);
    setCheckedLabels(new Map());
    setTitleMatch(null);
    setResultsFrom(from);
    return ctrl.signal;
  }

  function searchFailed(e: unknown) {
    if ((e as Error).name === "AbortError") return;
    const message = e instanceof ApiError ? e.message : "The search could not reach the server. Please try again.";
    // the message stays on the page: a toast is easy to miss, and the reason matters
    setSearchError({ message, quota: e instanceof ApiError && e.code === "upstream_quota" });
    toast.error("Search failed", { description: message });
  }

  async function runSearch(p: SearchPlan) {
    const signal = startSearch("plan");
    try {
      const { results } = await api.search(
        { queries: p.queries, fromYear: p.fromYear, toYear: p.toYear, includeReviews: p.includeReviews, onlyWithAbstract: p.onlyWithAbstract },
        signal,
      );
      setResults(results);
      useStore.getState().log({ projectId: project.id, actor: "system", action: "search.run", summary: `OpenAlex returned ${results.length} records for ${p.queries.length} quer${p.queries.length === 1 ? "y" : "ies"}.` });
    } catch (e) {
      searchFailed(e);
    } finally {
      setSearching(false);
    }
  }

  /** Find one specific paper by its title (OpenAlex search) or its DOI (checked in Crossref and OpenAlex). No AI. */
  async function findByName() {
    const text = name.trim();
    const doi = extractDoi(text);
    const signal = startSearch(doi ? "doi" : "title");
    try {
      if (doi) {
        const res = await api.verify({ doi });
        if (signal.aborted) return;
        const label = sourceLabel(res.verification);
        setLookup({ label, reason: res.verification.reason });
        if (res.record) setCheckedLabels(new Map([[keyOf(res.record), label]]));
        setResults(res.record ? [res.record] : []);
        useStore.getState().log({ projectId: project.id, actor: "system", action: "search.run", summary: `Looked up DOI ${doi}: ${res.record ? "found" : "no record"} in Crossref and OpenAlex.` });
      } else {
        // whole words, within the search API's 200-character limit
        const query = text.length > 200 ? text.slice(0, 200).replace(/\s+\S*$/, "") : text;
        const { results } = await api.search({ queries: [query], includeReviews: true, onlyWithAbstract: false }, signal);
        // the paper with this exact title goes first; if none has it, the page says so
        const i = results.findIndex((r) => titleSimilarity(r.title, query) >= THRESHOLDS.titleMatch);
        setTitleMatch(i >= 0);
        setResults(i > 0 ? [results[i], ...results.slice(0, i), ...results.slice(i + 1)] : results);
        useStore.getState().log({ projectId: project.id, actor: "system", action: "search.run", summary: `OpenAlex returned ${results.length} records for the title "${query.slice(0, 80)}".` });
      }
    } catch (e) {
      searchFailed(e);
    } finally {
      setSearching(false);
    }
  }

  const shown = useMemo(() => (results ?? []).filter((r) => !onlyOpen || r.isOa), [results, onlyOpen]);

  function save() {
    const recs = (results ?? []).filter((r) => selected.has(keyOf(r)));
    const ids = saveRecords(project.id, recs, folderId === "none" ? undefined : folderId);
    toast.success(`Saved ${ids.length} source${ids.length === 1 ? "" : "s"} to your library`, {
      description: "Each one is now being verified against Crossref and OpenAlex.",
      action: { label: "Open library", onClick: () => router.push("/app/library") },
    });
    setSelected(new Set());
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Steps 2 and 3 · Search and approve"
        title={forClaim ? "Find a better source" : "Search the literature"}
        description="The Scout turns your question into a search plan, or you look up one paper by its title or DOI. OpenAlex returns real, existing records: the AI never writes a reference."
        actions={
          <Button asChild variant="outline">
            <Link href="/app/library">
              Library ({library.length}) <ArrowRight />
            </Link>
          </Button>
        }
      />

      <Panel className="p-5">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "question" | "name")}>
          <TabsList className="mb-4">
            <TabsTrigger value="question" className="gap-1.5">
              <Bot /> {forClaim ? "From the claim" : "From your question"}
            </TabsTrigger>
            <TabsTrigger value="name" className="gap-1.5">
              <Search /> By title or DOI
            </TabsTrigger>
          </TabsList>
          <TabsContent value="question">
            <Label htmlFor="q" className="text-[12.5px] text-ink-600">
              {forClaim ? "Claim that needs a better source" : "Research question"}
            </Label>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start">
              <Textarea id="q" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} className="min-h-[60px] flex-1 font-serif text-[16px] leading-relaxed" />
              <Button onClick={makePlan} disabled={planning || question.trim().length < 8} className="md:mt-0.5">
                {planning ? <Loader2 className="animate-spin" /> : <Bot />} {plan ? "Re-plan" : "Plan the search"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="name">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void findByName();
              }}
            >
              <Label htmlFor="ref-name" className="text-[12.5px] text-ink-600">
                Title of the paper, or its DOI
              </Label>
              <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  id="ref-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Causes and consequences of sleepiness among college students"
                  className="h-10 flex-1 font-serif text-[15px]"
                />
                <Button type="submit" disabled={searching || name.trim().length < 4}>
                  {searching ? <Loader2 className="animate-spin" /> : <Search />} Find the paper
                </Button>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
                No AI: a title is searched in OpenAlex, a DOI is checked in Crossref and OpenAlex. A reference a chatbot invented will not be found. Nothing is saved until you approve it.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </Panel>

      <div className="mt-4">
        {mode === "question" && planning && (
          <Panel className="p-5">
            <div className="flex items-center gap-3 text-[13.5px] text-ink-600">
              <Loader2 className="size-4 animate-spin text-violet-600" /> The Scout is planning your search…
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-9 w-56 shimmer" />
              <Skeleton className="h-9 w-48 shimmer" />
              <Skeleton className="h-9 w-40 shimmer" />
            </div>
          </Panel>
        )}
        {mode === "question" && !planning && plan && (
          <PlanEditor
            plan={plan}
            onChange={setPlan}
            busy={searching}
            onApprove={() => {
              approvePlan(project.id, plan);
              void runSearch(plan);
            }}
          />
        )}
      </div>

      <section className="mt-8" aria-live="polite">
        {searchError && !searching && (
          <Panel className="flex gap-3 border-amber-200 bg-amber-50/60 p-4" role="alert">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <div className="min-w-0 text-[13px] leading-relaxed text-amber-950">
              <p className="font-semibold">The search did not run.</p>
              <p className="mt-0.5">{searchError.message}</p>
              {searchError.quota && (
                <p className="mt-1.5 text-amber-900">
                  Nothing is wrong with your plan. Whoever runs this ClaimTrace server can add a free OpenAlex key (see{" "}
                  <Link href="/app/settings" className="font-medium underline underline-offset-2">
                    Settings
                  </Link>
                  ). Meanwhile you can still add sources by DOI or as a reference list: Crossref keeps answering, and anything it cannot finish shows Not yet verified,
                  never Not found.
                </p>
              )}
            </div>
          </Panel>
        )}
        {searching && (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Panel key={i} className="p-5">
                <Skeleton className="h-4 w-40 shimmer" />
                <Skeleton className="mt-3 h-5 w-3/4 shimmer" />
                <Skeleton className="mt-2 h-4 w-1/2 shimmer" />
              </Panel>
            ))}
          </div>
        )}
        {results && !searching && (
          <>
            {resultsFrom === "title" && results.length > 0 && titleMatch !== null && (
              <Panel className={cn("mb-3 flex gap-3 p-4", titleMatch ? "border-trace-200 bg-trace-50/50" : "border-amber-200 bg-amber-50/60")} role="status">
                {titleMatch ? <Check className="mt-0.5 size-4 shrink-0 text-trace-700" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />}
                <p className={cn("min-w-0 text-[13px] leading-relaxed", titleMatch ? "text-trace-950" : "text-amber-950")}>
                  {titleMatch
                    ? "A paper with this title exists in OpenAlex: it is the first result. Approve and save it, and ClaimTrace checks its details and retraction status against Crossref."
                    : "No paper has exactly this title. These are the closest real papers in OpenAlex: check whether one is the paper you mean. If a chatbot gave you this reference, it may not exist."}
                </p>
              </Panel>
            )}
            {lookup && (
              <Panel className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 p-4">
                <TrustBadge label={lookup.label} context="source" />
                <p className="min-w-0 flex-1 basis-60 text-[13px] leading-relaxed text-ink-700 wrap-anywhere">{lookup.reason}</p>
              </Panel>
            )}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] text-ink-600">
                {resultsFrom === "plan" || shown.length > 0 ? (
                  <>
                    <span className="font-semibold text-ink-950">{shown.length}</span>{" "}
                    {resultsFrom === "plan"
                      ? "real records from OpenAlex. Select the ones you want to read and cite."
                      : resultsFrom === "title"
                        ? `real record${shown.length === 1 ? "" : "s"} from OpenAlex for that title, closest match first. Select the one you mean.`
                        : `record${shown.length === 1 ? "" : "s"} found by DOI.`}
                  </>
                ) : resultsFrom === "title" ? (
                  "No record in OpenAlex for that title."
                ) : (
                  "No record found for that DOI."
                )}
              </p>
              <label className="flex items-center gap-2 text-[13px] text-ink-600">
                <Switch checked={onlyOpen} onCheckedChange={setOnlyOpen} /> Open access only
              </label>
            </div>
            <LabelGuide labels={SEARCH_GUIDE_LABELS} context="source" extra={SEARCH_GUIDE} className="mb-3" />
            {shown.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={<Search />}
                  title={resultsFrom === "plan" ? "No records matched" : "No paper found"}
                  description={
                    resultsFrom === "plan"
                      ? "Try broader queries, remove the year limits, or include reviews."
                      : resultsFrom === "title"
                        ? "OpenAlex has no paper with that title. Check the spelling, or paste the full reference in Library → Add sources to check it against Crossref too. If a chatbot gave you this reference, it may not exist."
                        : "No paper has this DOI in Crossref or OpenAlex. If a chatbot gave you this reference, it may not exist."
                  }
                />
              </Panel>
            ) : (
              <div className="space-y-3 pb-28">
                {shown.map((r, i) => (
                  <ResultCard
                    key={keyOf(r)}
                    record={r}
                    index={i}
                    inLibrary={inLibrary.has(keyOf(r))}
                    knownLabel={libraryLabels.get(keyOf(r)) ?? checkedLabels.get(keyOf(r))}
                    selected={selected.has(keyOf(r))}
                    onToggle={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (n.has(keyOf(r))) n.delete(keyOf(r));
                        else n.add(keyOf(r));
                        return n;
                      })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-[min(640px,calc(100%-2rem))] items-center gap-3 rounded-2xl border border-ink-200 bg-white/95 p-3 pl-5 shadow-pop backdrop-blur"
          >
            <span className="flex items-center gap-2 text-[13.5px] text-ink-700">
              <Hand className="size-4 text-amber-600" />
              <span>
                <span className="font-semibold text-ink-950">{selected.size}</span> selected
              </span>
            </span>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="ml-auto h-9 w-40">
                <SelectValue placeholder="Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={save}>
              <Check /> Approve and save
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}

export function SearchView() {
  return (
    <RequireProject>
      {(p) => (
        <Suspense>
          <SearchInner key={p.id} project={p} />
        </Suspense>
      )}
    </RequireProject>
  );
}
