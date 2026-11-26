/**
 * Scope rules: cheap code triggers for overreach. They never decide a verdict
 * on their own. They are shown to the student and passed to the Skeptic as hints.
 */
import { withoutQuotes } from "../text/overlap";
import { negationCue } from "../text/polarity";
import type { ScopeFlag } from "../types";

const CAUSAL =
  /\b(caus(?:e|es|ed|ing)|causal(?:ly)?|leads? to|led to|leading to|results? in|resulted in|drives?|driving|drove|triggers?|triggered|is responsible for|are responsible for|because of|due to)\b/i;
const ASSOCIATIONAL =
  /\b(associat\w*|correlat\w*|linked|links? (?:between|with)|relationship|related to|predict\w*|odds ratio|cross-sectional|observational|more likely|less likely)\b/i;
const CAUSAL_DESIGN = /\b(randomi[sz]ed|randomly assigned|controlled trial|rct|experiment(?:al|s)?|intervention|causal effect|caused)\b/i;
const CERTAIN =
  /\b(prove[sd]?|proven|proof|definitely|certainly|undeniabl[ey]|conclusively|clearly (?:shows?|demonstrates?)|establishe[sd]|without (?:a )?doubt|always|never|guarantee[sd]?)\b/i;
const HEDGE = /\b(may|might|could|suggest\w*|possibl[ey]|potential(?:ly)?|preliminary|appears? to|appeared to|tentative|limited|caveats?|putative)\b/i;
const UNIVERSAL =
  /\b(?:all|every|any|most)\s+(?:teen\w*|adolescent\w*|young people|youth|child\w*|kids|students?|people|users?|adults?|patients?|parents?|women|men|girls|boys|individuals|humans?)\b|\b(?:everyone|everybody|universally|in all (?:cases|countries))\b/i;
const SAMPLE =
  /\bN\s*=\s*\d[\d,]*|\b\d[\d,]*\s+(?:participants|students|patients|adolescents|children|adults|respondents|parents|subjects|people|individuals|women|men|girls|boys|youth|teenagers|schools|households)\b|\bsample of\b|\bcohort\b|\bin (?:one|a single|two|three) (?:school|city|country|state|region|hospital)s?\b/i;

/* ----------------------------- magnitude --------------------------------- */

const MULTIPLIERS: Array<[RegExp, string]> = [
  [/\b(?:doubl(?:e|es|ed|ing)|twice|two-?fold|2-?fold|two times|2 times)\b/i, "x2"],
  [/\b(?:tripl(?:e|es|ed|ing)|three-?fold|3-?fold|three times|3 times)\b/i, "x3"],
  [/\b(?:quadrupl\w*|four-?fold|4-?fold|four times|4 times)\b/i, "x4"],
  [/\b(?:halv(?:e|es|ed|ing)|cut in half)\b/i, "x0.5"],
];
const N_FOLD = /\b(\d+(?:\.\d+)?)[- ]?(?:fold|times (?:more|higher|greater|larger|as (?:likely|high|large)))\b/gi;
const PERCENT = /(\d+(?:\.\d+)?)\s?(?:%|percent\b|per cent\b)/gi;

/** Effect sizes named in a text, normalised ("doubles" and "2-fold" are both "x2"; "40 %" is "40%"). */
export function magnitudes(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const [re, key] of MULTIPLIERS) {
    const m = text.match(re);
    if (m) out.set(key, m[0]);
  }
  for (const m of text.matchAll(N_FOLD)) out.set(`x${Number(m[1])}`, m[0]);
  for (const m of text.matchAll(PERCENT)) out.set(`${Number(m[1])}%`, m[0]);
  return out;
}

/* ----------------------------- population -------------------------------- */

type Group = { name: string; re: RegExp[] };
const PLACES: Group[] = [
  { name: "UK", re: [/(?<![A-Za-z])U\.?K\.?(?![A-Za-z])/, /\b(?:united kingdom|great britain|britain|british|england|english|scotland|scottish|wales|welsh)\b/i] },
  { name: "US", re: [/(?<![A-Za-z])(?:USA?|U\.S\.(?:A\.)?)(?![A-Za-z])/, /\b(?:united states|america|americans?)\b/i] },
  { name: "Canadian", re: [/\bcanad(?:a|ian|ians)\b/i] },
  { name: "Australian", re: [/\baustralian?s?\b/i] },
  { name: "Chinese", re: [/\b(?:china|chinese)\b/i] },
  { name: "Indian", re: [/\b(?:india|indians?)\b/i] },
  { name: "Japanese", re: [/\b(?:japan|japanese)\b/i] },
  { name: "Korean", re: [/\b(?:korea|koreans?)\b/i] },
  { name: "German", re: [/\b(?:germany|germans?)\b/i] },
  { name: "French", re: [/\b(?:france|french)\b/i] },
  { name: "Dutch", re: [/\b(?:netherlands|dutch)\b/i] },
  { name: "European", re: [/\b(?:europe|europeans?)\b/i] },
];
const AGES: Group[] = [
  { name: "children", re: [/\b(?:child|children|kids?|preschool(?:ers)?|toddlers?|infants?|primary[- ]school\w*)\b/i] },
  { name: "adolescents", re: [/\b(?:adolescen\w*|teen\w*|youths?|young people|high[- ]school\w*|secondary[- ]school\w*|grades? \d+|1\d[- ]year[- ]olds?|igen)\b/i] },
  { name: "university students", re: [/\b(?:undergraduates?|university students|college students|graduate students)\b/i] },
  { name: "adults", re: [/\b(?:adults?|elderly|older people|seniors)\b/i] },
];

function groupsIn(text: string, groups: Group[]): string[] {
  return groups.filter((g) => g.re.some((r) => r.test(text))).map((g) => g.name);
}

/** "UK children" vs "US adolescents": the claim names a population the source does not describe. */
function populationFlag(claim: string, source: string): ScopeFlag | null {
  const claimSide: string[] = [];
  const sourceSide: string[] = [];
  for (const groups of [PLACES, AGES]) {
    const c = groupsIn(claim, groups);
    const s = groupsIn(source, groups);
    if (c.length && s.length && !c.some((x) => s.includes(x))) {
      claimSide.push(c.join(" and "));
      sourceSide.push(s.join(" and "));
    }
  }
  if (!claimSide.length) return null;
  const claimTerm = claimSide.join(" ");
  const evidenceTerm = sourceSide.join(" ");
  return {
    kind: "population",
    claimTerm,
    evidenceTerm,
    message: `The claim is about ${claimTerm}, but the source describes ${evidenceTerm}.`,
  };
}

/* ------------------------------------------------------------------------- */

const quoteOf = (m: RegExpMatchArray | null) => (m ? m[0] : "");

/**
 * @param evidence the most relevant source sentences (best first)
 * @param fullText the whole source text (population and effect sizes may be stated anywhere in it)
 */
export function detectScope(rawClaim: string, evidence: string[], fullText?: string): ScopeFlag[] {
  // words inside quotation marks are the source's own words, not the student's claim
  const claim = withoutQuotes(rawClaim);
  const ev = evidence.join(" ");
  const all = fullText ?? ev;
  const flags: ScopeFlag[] = [];

  const causal = claim.match(CAUSAL);
  if (causal && !CAUSAL_DESIGN.test(ev)) {
    const assoc = ev.match(ASSOCIATIONAL) ?? ev.match(HEDGE);
    if (assoc) {
      flags.push({
        kind: "causal",
        claimTerm: quoteOf(causal),
        evidenceTerm: quoteOf(assoc),
        message: `The claim says "${quoteOf(causal)}", but the source reports "${quoteOf(assoc)}". An association does not show cause.`,
      });
    }
  }

  const certain = claim.match(CERTAIN);
  const hedge = ev.match(HEDGE);
  if (certain && hedge) {
    flags.push({
      kind: "certainty",
      claimTerm: quoteOf(certain),
      evidenceTerm: quoteOf(hedge),
      message: `The claim says "${quoteOf(certain)}", but the source is hedged ("${quoteOf(hedge)}").`,
    });
  }

  const universal = claim.match(UNIVERSAL);
  // a study usually describes its sample in the methods sentence, not the finding: read the whole source
  const sample = ev.match(SAMPLE) ?? all.match(SAMPLE);
  if (universal && sample) {
    flags.push({
      kind: "generalisation",
      claimTerm: quoteOf(universal),
      evidenceTerm: quoteOf(sample),
      message: `The claim says "${quoteOf(universal)}", but the source studied a specific sample ("${quoteOf(sample)}").`,
    });
  }

  const claimSizes = magnitudes(claim);
  if (claimSizes.size) {
    const sourceSizes = magnitudes(all);
    if (![...claimSizes.keys()].some((k) => sourceSizes.has(k))) {
      const term = [...claimSizes.values()][0];
      flags.push({
        kind: "magnitude",
        claimTerm: term,
        message: `The claim states an effect size ("${term}") that the source text does not state.`,
      });
    }
  }

  if (all.trim()) {
    const pop = populationFlag(claim, all);
    if (pop) flags.push(pop);
  }

  const top = evidence[0];
  if (top) {
    const inClaim = negationCue(claim);
    const inSource = negationCue(top);
    if (Boolean(inClaim) !== Boolean(inSource)) {
      flags.push({
        kind: "polarity",
        claimTerm: inClaim ?? "",
        evidenceTerm: inSource ?? undefined,
        message: inClaim
          ? `The claim is negative ("${inClaim}"), but the closest source sentence is not. Check the direction of the finding.`
          : `The closest source sentence is negative ("${inSource}"), but the claim is not. Check the direction of the finding.`,
      });
    }
  }
  return flags;
}

export const SCOPE_TITLES: Record<ScopeFlag["kind"], string> = {
  causal: "Causal wording",
  certainty: "Stronger certainty",
  generalisation: "Wider population",
  magnitude: "Effect size",
  population: "Different population",
  polarity: "Opposite direction?",
};
