/**
 * The AI-use statement attached to every export (governance: AI disclosure).
 * Template-based so wording can change on the day without touching logic.
 *
 * Counts are partitions: every reference falls in exactly one reference bucket
 * and every claim in exactly one claim bucket, so the numbers always add up.
 */

export interface StatementInput {
  model?: string;
  provider?: string;
  uses: { scout: number; skeptic: number; assistant: number };
  firstUse?: string;
  lastUse?: string;
  refs: {
    total: number;
    /** Matched a database record outright. */
    verified: number;
    /** A close match the student confirmed after comparing. */
    confirmedClose: number;
    /** A close match not (yet) confirmed. */
    closeMatch: number;
    notFound: number;
    retracted: number;
    /** A database could not be reached, so the check did not finish. */
    unavailable: number;
    studentAdded: number;
    pending: number;
  };
  claims: {
    total: number;
    /** Supported by an abstract from a database. */
    supported: number;
    /** Supported by text the student pasted. */
    supportedOwnText: number;
    overreach: number;
    notSupported: number;
    unchecked: number;
    /** Claims citing a reference that was not found or is retracted. */
    refNotFound: number;
    /** Claims citing a close match the student has not confirmed. */
    refUnconfirmed: number;
    /** Claims citing a source the student added without a database record. */
    refStudentAdded: number;
    /** Claims citing a reference a database could not check. */
    refUnavailable: number;
    pending: number;
    /** Sample results shown (never live AI checks). */
    sample: number;
  };
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
    parts.push(`I used ClaimTrace's code-only checks${when}; no live generative AI was used.`);
  }

  const r = i.refs;
  if (r.total) {
    const bits = [`${r.verified} verified`];
    if (r.confirmedClose) bits.push(`${plural(r.confirmedClose, "close match", "close matches")} I confirmed after comparing the details`);
    if (r.closeMatch) bits.push(`${plural(r.closeMatch, "close match", "close matches")} I have not confirmed`);
    if (r.notFound) bits.push(`${r.notFound} not found`);
    if (r.retracted) bits.push(`${r.retracted} retracted`);
    if (r.unavailable) bits.push(`${r.unavailable} that could not be checked because a database was unavailable`);
    if (r.studentAdded) bits.push(`${r.studentAdded} added by me without a database record`);
    if (r.pending) bits.push(`${r.pending} still being checked`);
    parts.push(`It checked ${plural(r.total, "reference")} against Crossref and OpenAlex (${list(bits)}).`);
  }

  const c = i.claims;
  if (c.total) {
    const was = (n: number) => (n === 1 ? "was" : "were");
    const cite = (n: number) => (n === 1 ? "cites" : "cite");
    const supported = c.supported + c.supportedOwnText;
    const bits = [
      `${supported} ${was(supported)} supported by the source text${c.supportedOwnText ? ` (${c.supportedOwnText} of ${supported === 1 ? "it" : "them"} by text I pasted myself rather than a database abstract)` : ""}`,
    ];
    if (c.overreach) bits.push(`${c.overreach} went beyond the source`);
    if (c.notSupported) bits.push(`${c.notSupported} ${was(c.notSupported)} not supported`);
    if (c.unchecked) bits.push(`${c.unchecked} could not be checked`);
    if (c.refNotFound) bits.push(`${c.refNotFound} ${cite(c.refNotFound)} a reference that was not found or has been retracted`);
    if (c.refUnconfirmed) bits.push(`${c.refUnconfirmed} ${cite(c.refUnconfirmed)} a close match I have not confirmed`);
    if (c.refStudentAdded) bits.push(`${c.refStudentAdded} ${cite(c.refStudentAdded)} a source I added without a database record`);
    if (c.refUnavailable) bits.push(`${c.refUnavailable} ${cite(c.refUnavailable)} a reference the databases could not check at the time`);
    if (c.pending) bits.push(`${c.pending} ${c.pending === 1 ? "has" : "have"} not been checked yet`);
    parts.push(`Of my ${plural(c.total, "cited claim")}, ${list(bits)}.`);
    if (c.sample) parts.push(`${plural(c.sample, "result")} shown during the session ${c.sample === 1 ? "was a labelled sample" : "were labelled samples"}, not live AI checks.`);
  }

  const d = i.decisions;
  const acts: string[] = [];
  if (d.edited) acts.push(`edited ${plural(d.edited, "claim")}`);
  if (d.replaced) acts.push(`looked for better sources for ${plural(d.replaced, "claim")}`);
  if (d.removed) acts.push(`removed ${plural(d.removed, "citation")}`);
  if (d.acceptedAnyway) acts.push(`kept ${plural(d.acceptedAnyway, "flagged claim")} with a stated reason`);
  if (d.acknowledged) acts.push(`acknowledged ${plural(d.acknowledged, "claim")} that could not be fully checked`);
  if (acts.length) parts.push(`In response, I ${list(acts)}.`);

  parts.push("All final wording, sources and decisions are my own, and I am responsible for them.");
  return parts.join(" ");
}
