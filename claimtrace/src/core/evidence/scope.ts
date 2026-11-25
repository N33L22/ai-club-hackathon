/**
 * Scope rules: cheap code triggers for overreach. They never decide a verdict
 * on their own. They are shown to the student and passed to the Skeptic as hints.
 */
import { withoutQuotes } from "../text/overlap";
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

const quoteOf = (m: RegExpMatchArray | null) => (m ? m[0] : "");

export function detectScope(rawClaim: string, evidence: string[]): ScopeFlag[] {
  // words inside quotation marks are the source's own words, not the student's claim
  const claim = withoutQuotes(rawClaim);
  const ev = evidence.join(" ");
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
  const sample = ev.match(SAMPLE);
  if (universal && sample) {
    flags.push({
      kind: "generalisation",
      claimTerm: quoteOf(universal),
      evidenceTerm: quoteOf(sample),
      message: `The claim says "${quoteOf(universal)}", but the source studied a specific sample ("${quoteOf(sample)}").`,
    });
  }
  return flags;
}
