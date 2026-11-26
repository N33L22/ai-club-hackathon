/**
 * Evaluates the claim-support check (the Skeptic) on eval/skeptic-set.json.
 *
 *   npx tsx scripts/eval-skeptic.mts code
 *       No AI, no network: measures how often code's overreach and direction
 *       hints fire (they are hints for the Skeptic, never verdicts).
 *
 *   npx tsx scripts/eval-skeptic.mts live [baseUrl]
 *       Against a running server with an AI key: the full Skeptic, including
 *       code's evidence rules. Refuses to run if the server has no AI.
 *
 * Writes eval/skeptic-hints-RESULTS.md (code), eval/skeptic-RESULTS.md and
 * eval/skeptic-results.json (live), and the summary shown in the app
 * (src/lib/eval-results.json).
 */
import fs from "node:fs";
import path from "node:path";
import { prepareCheck } from "../src/core/evidence/judge";
import type { ClaimCheck, ScopeKind } from "../src/core/types";

const ROOT = path.join(import.meta.dirname, "..");
const SET = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", "skeptic-set.json"), "utf8")) as {
  items: Array<{ id: string; source: string; kind: string; expected: "supported" | "overreach" | "not_supported"; claim: string }>;
};
const DEMO = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "lib", "demo-data.json"), "utf8"));
const SUMMARY = path.join(ROOT, "src", "lib", "eval-results.json");
const sourceOf = (id: string) => DEMO.sources.find((s: { id: string }) => s.id === id) as { record: { title: string; abstract: string } };

const OVERREACH_HINTS: ScopeKind[] = ["causal", "certainty", "generalisation", "magnitude", "population"];

/** Stated with the live numbers: the model setup was picked on this same set. */
const LIVE_NOTE =
  "Development result: the model setup was chosen by comparing four NVIDIA-hosted setups on this same set (eval/skeptic-model-comparison.md). The prompt and the evidence rules were not changed after seeing the results.";

/** Stated with the numbers: the hint rules have seen this set, so these are development results. */
const HINTS_NOTE =
  "Development numbers: after the first run (7 of 8), the generalisation rule was changed to read the whole source for the sample description, which fixed R5. The live Skeptic run has not seen this set.";

function writeSummary(key: "skeptic" | "codeHints", value: unknown) {
  const summary = JSON.parse(fs.readFileSync(SUMMARY, "utf8"));
  summary[key] = value;
  fs.writeFileSync(SUMMARY, `${JSON.stringify(summary, null, 2)}\n`);
}

function codeHints() {
  const rows = SET.items.map((it) => {
    const src = sourceOf(it.source);
    const prep = prepareCheck(it.claim, src.record.abstract);
    const kinds = prep.scopeFlags.map((f) => f.kind);
    return { ...it, kinds, overreachHint: kinds.some((k) => OVERREACH_HINTS.includes(k)), directionHint: kinds.includes("polarity") };
  });
  const by = (e: string) => rows.filter((r) => r.expected === e);
  const result = {
    ranAt: new Date().toISOString(),
    total: rows.length,
    overreach: { total: by("overreach").length, flagged: by("overreach").filter((r) => r.overreachHint).length },
    notSupported: { total: by("not_supported").length, flagged: by("not_supported").filter((r) => r.overreachHint || r.directionHint).length },
    supported: { total: by("supported").length, flagged: by("supported").filter((r) => r.overreachHint || r.directionHint).length },
    note: HINTS_NOTE,
  };
  const md = [
    "# Skeptic evaluation: code hints only",
    "",
    `Run ${result.ranAt}. No AI involved: these are the code rules that flag risky wording for the Skeptic and the student. They are hints, never verdicts.`,
    "",
    `> ${HINTS_NOTE}`,
    "",
    `- Overreaching claims with at least one overreach hint: **${result.overreach.flagged} of ${result.overreach.total}**`,
    `- Unsupported claims with a hint (direction or overreach): ${result.notSupported.flagged} of ${result.notSupported.total}`,
    `- Supported claims with a hint (false alarms): ${result.supported.flagged} of ${result.supported.total}`,
    "",
    "| Id | Kind | Expected | Hints |",
    "|---|---|---|---|",
    ...rows.map((r) => `| ${r.id} | ${r.kind} | ${r.expected} | ${r.kinds.join(", ") || "none"} |`),
    "",
    "The verdict accuracy of the Skeptic itself needs a live AI run: `npx tsx scripts/eval-skeptic.mts live <baseUrl>`.",
  ].join("\n");
  fs.writeFileSync(path.join(ROOT, "eval", "skeptic-hints-RESULTS.md"), `${md}\n`);
  writeSummary("codeHints", result);
  console.log(md);
}

async function live(base: string) {
  const health = (await (await fetch(`${base}/api/health`)).json()) as { ai: { configured: boolean; model: string } };
  if (!health.ai.configured) throw new Error("The server has no AI key. Set NVIDIA_API_KEY (or AI_API_KEY) and restart it.");
  const rows: Array<{ id: string; kind: string; expected: string; got: string; reason?: string; evidence?: number; flags: string[]; ms: number }> = [];
  const model: string = health.ai.model;
  for (const it of SET.items) {
    const src = sourceOf(it.source);
    const started = Date.now();
    const res = await fetch(`${base}/api/claims/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: it.claim, citedAs: src.record.title, text: src.record.abstract, textOrigin: "abstract" }),
    });
    const ms = Date.now() - started;
    const json = (await res.json()) as { check?: ClaimCheck; error?: { message: string } };
    if (!res.ok || !json.check) throw new Error(`${it.id}: ${json.error?.message ?? res.status}`);
    // a failed AI call (malformed reply, rate limit) is recorded as Unchecked, not hidden
    rows.push({ id: it.id, kind: it.kind, expected: it.expected, got: json.check.verdict, reason: json.check.reason, evidence: json.check.evidence ? json.check.evidence.index + 1 : undefined, flags: json.check.scopeFlags.map((f) => f.kind), ms });
    console.log(`  ${it.id.padEnd(4)} expected ${it.expected.padEnd(13)} got ${json.check.verdict}${json.check.reason ? ` (${json.check.reason})` : ""}  ${(ms / 1000).toFixed(1)} s`);
  }
  const avgMs = Math.round(rows.reduce((a, r) => a + r.ms, 0) / rows.length);
  const correct = rows.filter((r) => r.got === r.expected).length;
  const unchecked = rows.filter((r) => r.got === "unchecked").length;
  const byExpected: Record<string, { total: number; correct: number }> = {};
  for (const r of rows) {
    byExpected[r.expected] ??= { total: 0, correct: 0 };
    byExpected[r.expected].total++;
    if (r.got === r.expected) byExpected[r.expected].correct++;
  }
  const falseSupport = rows.filter((r) => r.got === "supported" && r.expected !== "supported").length;
  const result = {
    ranAt: new Date().toISOString(),
    model,
    total: rows.length,
    correct,
    unchecked,
    falseSupport,
    avgSeconds: Math.round(avgMs / 100) / 10,
    byExpected,
    mistakes: rows.filter((r) => r.got !== r.expected).map((r) => ({ ref: `${r.id} (${r.kind})`, expected: r.expected, got: r.got })),
    note: LIVE_NOTE,
  };
  fs.writeFileSync(path.join(ROOT, "eval", "skeptic-results.json"), `${JSON.stringify({ ...result, rows }, null, 2)}\n`);
  const md = [
    "# Skeptic evaluation: live run",
    "",
    `Run ${result.ranAt} with ${model}, through the full pipeline (AI verdict, then code's evidence rules).`,
    "",
    `> ${LIVE_NOTE}`,
    "",
    `- Correct verdicts: **${correct} of ${rows.length}**`,
    `- Left Unchecked (code's evidence rules, or a failed AI reply): ${unchecked}`,
    `- Claims wrongly labelled Supported: **${falseSupport}** (the error that matters most)`,
    `- Average time per check: ${result.avgSeconds} s`,
    "",
    "| Id | Kind | Expected | Got | Evidence | Hints | Time |",
    "|---|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.id} | ${r.kind} | ${r.expected} | ${r.got}${r.reason ? ` (${r.reason})` : ""} | ${r.evidence ?? "-"} | ${r.flags.join(", ") || "none"} | ${(r.ms / 1000).toFixed(1)} s |`),
    "",
    "A small set (20 claims on 5 abstracts). Early evidence, not a guarantee.",
  ].join("\n");
  fs.writeFileSync(path.join(ROOT, "eval", "skeptic-RESULTS.md"), `${md}\n`);
  writeSummary("skeptic", result);
  console.log(`\n${correct}/${rows.length} correct, ${unchecked} unchecked, ${falseSupport} false Supported.`);
}

const [mode = "code", base = "http://localhost:3000"] = process.argv.slice(2);
if (mode === "live") await live(base);
else codeHints();
