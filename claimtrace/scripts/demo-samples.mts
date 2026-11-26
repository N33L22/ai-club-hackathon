/**
 * Sample results for the demo project, shown only when the live AI check is
 * unavailable and always labelled "Sample" (never presented as a live check).
 *
 *   npx tsx scripts/demo-samples.mts prepare
 *       Writes src/lib/demo-checks.json from the verdicts below (written by
 *       Team 6). Everything code checks (the evidence sentence, ranking, scope
 *       flags, patchwriting, direct quote) is computed by the real rules in
 *       src/core, and a sample those rules would reject is refused.
 *
 *   npx tsx scripts/demo-samples.mts record [baseUrl]
 *       With an AI key on a running server, records a real Skeptic run of every
 *       demo claim and replaces the prepared samples (provenance "recorded").
 */
import fs from "node:fs";
import path from "node:path";
import { extractClaims, type DocNode } from "../src/core/evidence/claims";
import { judgeReply, prepareCheck, type AiReply } from "../src/core/evidence/judge";
import type { ClaimCheck } from "../src/core/types";

const ROOT = path.join(import.meta.dirname, "..");
const DEMO = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "lib", "demo-data.json"), "utf8"));
const OUT = path.join(ROOT, "src", "lib", "demo-checks.json");

interface SampleFile {
  provenance: "prepared" | "recorded";
  at: string;
  model?: string;
  note: string;
  checks: Record<string, Record<string, ClaimCheck>>;
}

type Source = { id: string; record: { title: string; abstract?: string }; verification?: { status: string } };
const sources: Source[] = DEMO.sources;
const claims = extractClaims(DEMO.project.doc as DocNode);

/** Pairs that need the AI: the reference is usable and there is text to check against. */
function aiPairs() {
  const out: Array<{ claim: (typeof claims)[number]; source: Source }> = [];
  for (const claim of claims) {
    for (const sid of claim.sourceIds) {
      const source = sources.find((s) => s.id === sid);
      const status = source?.verification?.status;
      if (!source || !source.record.abstract || status === "not_found" || status === "retracted") continue;
      out.push({ claim, source });
    }
  }
  return out;
}

/* Team 6's verdicts for the prepared samples (sentence numbers are 1-based, as the AI sees them). */
const PREPARED: Array<{ source: string; claim: string; reply: AiReply; explanation: string }> = [
  {
    source: "demo-src-twenge",
    claim: "In a large US survey study",
    reply: { verdict: "supported", sentence: 1, quote: "" },
    explanation: "The abstract reports that depressive symptoms and suicide rates among U.S. adolescents increased between 2010 and 2015, especially among females.",
  },
  {
    source: "demo-src-twenge",
    claim: "Smartphones and social media caused",
    reply: { verdict: "overreach", sentence: 3, quote: "" },
    explanation: "The source says more time on screen activities 'may account for' the increases. That is an association with a hedge, not evidence that smartphones and social media caused the rise.",
  },
  {
    source: "demo-src-riehm",
    claim: "US adolescents who used social media",
    reply: { verdict: "supported", sentence: 11, quote: "" },
    explanation: "The conclusion says adolescents using social media more than 3 hours a day may be at heightened risk, particularly for internalizing problems.",
  },
  {
    source: "demo-src-kelly",
    claim: "In the UK Millennium Cohort Study",
    reply: { verdict: "supported", sentence: 5, quote: "" },
    explanation: "The findings state that the association between social media use and depressive symptoms was larger for girls than for boys.",
  },
  {
    source: "demo-src-keles",
    claim: "A systematic review of 13 studies",
    reply: { verdict: "supported", sentence: 5, quote: "" },
    explanation: "The review of 13 studies found that all four domains of social media use correlated with depression, anxiety and psychological distress.",
  },
  {
    source: "demo-src-keles",
    claim: "Its authors warn",
    reply: { verdict: "supported", sentence: 6, quote: "" },
    explanation: "The quoted words appear word for word in the abstract.",
  },
  {
    source: "demo-src-przybylski",
    claim: "Moderate screen use",
    reply: { verdict: "overreach", sentence: 4, quote: "" },
    explanation: "The source says moderate use is 'not intrinsically harmful'. Saying it may not be harmful 'at all' is stronger than that.",
  },
];

function prepare(): SampleFile {
  const at = new Date().toISOString();
  const checks: SampleFile["checks"] = {};
  const pairs = aiPairs();
  for (const p of PREPARED) {
    const pair = pairs.find((x) => x.source.id === p.source && x.claim.text.startsWith(p.claim));
    if (!pair) throw new Error(`No demo claim starting "${p.claim}" citing ${p.source}`);
    const text = pair.source.record.abstract!;
    const prep = prepareCheck(pair.claim.text, text);
    const judged = judgeReply(pair.claim.text, prep, p.reply);
    if (judged.verdict !== p.reply.verdict) {
      throw new Error(`The code rules reject the prepared sample for "${p.claim}" (${judged.reason}). Fix the sample, not the rules.`);
    }
    checks[pair.claim.key] ??= {};
    checks[pair.claim.key][pair.source.id] = {
      verdict: judged.verdict,
      mode: "sample",
      evidence: judged.evidence,
      quoteVerified: judged.quoteVerified,
      candidates: prep.candidates,
      explanation: p.explanation,
      scopeFlags: prep.scopeFlags,
      patchwriting: prep.patchwriting,
      directQuote: prep.directQuote,
      textOrigin: "abstract",
      checkedAt: at,
      truncated: prep.truncated,
      sample: { provenance: "prepared", at },
    };
  }
  const missing = pairs.filter((x) => !checks[x.claim.key]?.[x.source.id]);
  if (missing.length) throw new Error(`No prepared sample for: ${missing.map((m) => m.claim.text.slice(0, 40)).join(" | ")}`);
  return {
    provenance: "prepared",
    at,
    note: "Prepared by Team 6 as an example of the Skeptic's output. The evidence sentences and every code check are real; the verdicts and explanations were written by the team, not by a live AI call.",
    checks,
  };
}

async function record(base: string): Promise<SampleFile> {
  const checks: SampleFile["checks"] = {};
  let model: string | undefined;
  const health = (await (await fetch(`${base}/api/health`)).json()) as { ai: { configured: boolean } };
  if (!health.ai.configured) throw new Error("The server has no AI key. Set NVIDIA_API_KEY and restart it; code-only results are never recorded as samples.");
  for (const { claim, source } of aiPairs()) {
    let check: ClaimCheck | undefined;
    // a reply can occasionally be malformed or rate-limited: try again before giving up
    for (let attempt = 1; attempt <= 3 && check?.mode !== "ai"; attempt++) {
      const res = await fetch(`${base}/api/claims/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claim.text, citedAs: source.record.title, text: source.record.abstract, textOrigin: "abstract" }),
      });
      const json = (await res.json()) as { check?: ClaimCheck; error?: { message: string } };
      if (!res.ok || !json.check) throw new Error(`check failed: ${json.error?.message ?? res.status}`);
      check = json.check;
      if (check.mode !== "ai") await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
    if (!check || check.mode !== "ai") throw new Error(`The AI did not answer for "${claim.text.slice(0, 50)}" (${check?.reason}). Nothing was recorded; try again.`);
    model = check.model;
    checks[claim.key] ??= {};
    checks[claim.key][source.id] = check;
    console.log(`  ${check.verdict.padEnd(13)} ${claim.text.slice(0, 70)}`);
  }
  return {
    provenance: "recorded",
    at: new Date().toISOString(),
    model,
    note: `Recorded from a live Skeptic run (${model}). Shown as a labelled sample only when live AI checks are unavailable.`,
    checks,
  };
}

const [mode = "prepare", base = "http://localhost:3000"] = process.argv.slice(2);
const file = mode === "record" ? await record(base) : prepare();
fs.writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`);
const n = Object.values(file.checks).reduce((a, c) => a + Object.keys(c).length, 0);
console.log(`Wrote ${path.relative(ROOT, OUT)}: ${n} ${file.provenance} sample results.`);
