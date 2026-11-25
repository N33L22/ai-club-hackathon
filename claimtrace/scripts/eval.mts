/**
 * Verifier evaluation (gap M4): runs the labelled test set through the live
 * Verifier API and reports accuracy per expected status.
 *
 * Usage: start the app (npm run dev), then:
 *   npm run eval -- http://localhost:3100 testset   (development set: the rules were tuned on it)
 *   npm run eval -- http://localhost:3100 holdout   (held-out set: run once, rules not changed after)
 * Writes eval/<set>-results.json, eval/<set>-RESULTS.md and src/lib/eval-results.json (shown in the app).
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const SET = process.argv[3] ?? "testset"; // or "holdout"
const ROOT = path.join(import.meta.dirname, "..");
const set = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", `${SET}.json`), "utf8")) as {
  references: Array<{ expected: string; kind: string; ref: string }>;
};

const res = await fetch(`${BASE}/api/sources/verify-batch`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ references: set.references.map((r) => r.ref) }),
});
if (!res.ok) throw new Error(`verify-batch failed: ${res.status} ${await res.text()}`);
const { results } = (await res.json()) as { results: Array<{ raw: string; verification?: { status: string; reason: string }; error?: string }> };

const rows = set.references.map((r, i) => {
  const got = results[i]?.verification?.status ?? `error: ${results[i]?.error}`;
  return { ...r, got, ok: got === r.expected, reason: results[i]?.verification?.reason ?? "" };
});

const byExpected: Record<string, { total: number; correct: number }> = {};
for (const r of rows) {
  byExpected[r.expected] ??= { total: 0, correct: 0 };
  byExpected[r.expected].total++;
  if (r.ok) byExpected[r.expected].correct++;
}
const correct = rows.filter((r) => r.ok).length;
const summary = {
  ranAt: new Date().toISOString(),
  total: rows.length,
  correct,
  byExpected,
  mistakes: rows.filter((r) => !r.ok).map((r) => ({ ref: r.ref, expected: r.expected, got: r.got })),
};

fs.writeFileSync(path.join(ROOT, "eval", `${SET}-results.json`), JSON.stringify({ summary, rows }, null, 2));
// the app shows both sets: the development set (rules were tuned on it) and the held-out set
const shownPath = path.join(ROOT, "src", "lib", "eval-results.json");
const shown = fs.existsSync(shownPath) ? JSON.parse(fs.readFileSync(shownPath, "utf8")) : {};
if (SET === "holdout") shown.holdout = { ranAt: summary.ranAt, total: summary.total, correct: summary.correct, byExpected, mistakes: summary.mistakes };
else Object.assign(shown, summary);
fs.writeFileSync(shownPath, JSON.stringify(shown, null, 2));

const md = [
  SET === "holdout" ? "# Verifier evaluation: held-out set" : "# Verifier evaluation: development set",
  "",
  `Run on ${summary.ranAt} against the live Crossref and OpenAlex APIs.`,
  "",
  `**${correct} of ${rows.length} references classified correctly (${Math.round((correct / rows.length) * 100)}%).**`,
  "",
  "| Expected | Correct |",
  "|---|---|",
  ...Object.entries(byExpected).map(([k, v]) => `| ${k} | ${v.correct}/${v.total} |`),
  "",
  "## Every reference",
  "",
  "| # | Kind | Expected | Got | Reason given |",
  "|---|---|---|---|---|",
  ...rows.map((r, i) => `| ${i + 1} | ${r.kind} | ${r.expected} | ${r.ok ? r.got : `**${r.got}**`} | ${r.reason.replace(/\|/g, "/").slice(0, 160)} |`),
  "",
].join("\n");
fs.writeFileSync(path.join(ROOT, "eval", `${SET}-RESULTS.md`), md);

console.log(`${correct}/${rows.length} correct`);
for (const [k, v] of Object.entries(byExpected)) console.log(`  ${k.padEnd(12)} ${v.correct}/${v.total}`);
for (const m of summary.mistakes) console.log(`  MISS expected ${m.expected}, got ${m.got}: ${m.ref.slice(0, 90)}`);
