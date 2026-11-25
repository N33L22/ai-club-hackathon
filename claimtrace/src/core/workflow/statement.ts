/**
 * The AI-use statement attached to every export (governance: AI disclosure).
 * Template-based so wording can change on the day without touching logic.
 */

export interface StatementInput {
  model?: string;
  provider?: string;
  uses: { scout: number; skeptic: number; assistant: number };
  firstUse?: string;
  lastUse?: string;
  refs: { total: number; verified: number; closeMatch: number; notFound: number; retracted: number; studentAdded: number };
  /** refIssues: claims citing a reference that is not found, retracted, an unconfirmed close match or student-added. */
  claims: { total: number; verified: number; overreach: number; notSupported: number; unchecked: number; refIssues?: number; sample: number };
  decisions: { edited: number; replaced: number; removed: number; acceptedAnyway: number; acknowledged: number };
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function date(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function list(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function aiUseStatement(i: StatementInput): string {
  const tasks: string[] = [];
  if (i.uses.scout) tasks.push("plan literature searches");
  if (i.uses.skeptic) tasks.push("check whether my cited sources support my claims");
  if (i.uses.assistant) tasks.push("explain sources through summaries linked to their abstracts");

  const when =
    i.firstUse && i.lastUse
      ? date(i.firstUse) === date(i.lastUse)
        ? ` on ${date(i.firstUse)}`
        : ` between ${date(i.firstUse)} and ${date(i.lastUse)}`
      : "";

  const parts: string[] = [];
  if (tasks.length) {
    parts.push(
      `I used ClaimTrace${i.model ? ` with the AI model ${i.model}${i.provider ? ` (via ${i.provider})` : ""}` : ""}${when} to ${list(tasks)}.`,
    );
  } else {
    parts.push(`I used ClaimTrace's code-only checks${when}; no generative AI was used.`);
  }

  if (i.refs.total) {
    const refBits = [`${i.refs.verified} verified`];
    if (i.refs.closeMatch) refBits.push(`${i.refs.closeMatch} close ${i.refs.closeMatch === 1 ? "match" : "matches"} I confirmed or reviewed`);
    if (i.refs.notFound) refBits.push(`${i.refs.notFound} not found`);
    if (i.refs.retracted) refBits.push(`${i.refs.retracted} retracted`);
    if (i.refs.studentAdded) refBits.push(`${i.refs.studentAdded} added by me without a database record`);
    parts.push(`It checked ${plural(i.refs.total, "reference")} against Crossref and OpenAlex (${list(refBits)}).`);
  }

  if (i.claims.total) {
    const was = (n: number) => (n === 1 ? "was" : "were");
    const c = [`${i.claims.verified} ${was(i.claims.verified)} supported by the source text`];
    if (i.claims.overreach) c.push(`${i.claims.overreach} went beyond the source`);
    if (i.claims.notSupported) c.push(`${i.claims.notSupported} ${was(i.claims.notSupported)} not supported`);
    if (i.claims.unchecked) c.push(`${i.claims.unchecked} could not be checked`);
    if (i.claims.refIssues) c.push(`${i.claims.refIssues} cite${i.claims.refIssues === 1 ? "s" : ""} a reference that was not found, retracted, unconfirmed or added by me`);
    parts.push(`Of my ${plural(i.claims.total, "cited claim")}, ${list(c)}.`);
    if (i.claims.sample) parts.push(`${plural(i.claims.sample, "result")} shown during the session were labelled samples rather than live AI checks.`);
  }

  const d = i.decisions;
  const acts: string[] = [];
  if (d.edited) acts.push(`edited ${plural(d.edited, "claim")}`);
  if (d.replaced) acts.push(`looked for better sources for ${plural(d.replaced, "claim")}`);
  if (d.removed) acts.push(`removed ${plural(d.removed, "citation")}`);
  if (d.acceptedAnyway) acts.push(`kept ${plural(d.acceptedAnyway, "flagged claim")} with a stated reason`);
  if (d.acknowledged) acts.push(`acknowledged ${plural(d.acknowledged, "claim")} that could not be checked`);
  if (acts.length) parts.push(`In response, I ${list(acts)}.`);

  parts.push("All final wording, sources and decisions are my own, and I am responsible for them.");
  return parts.join(" ");
}
