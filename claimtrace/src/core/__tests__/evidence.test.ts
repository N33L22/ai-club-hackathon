import { describe, expect, it } from "vitest";
import { LIMITS } from "../config";
import { extractClaims, type DocNode } from "../evidence/claims";
import { judgeReply, prepareCheck } from "../evidence/judge";
import { directQuoteIn, verifyQuote } from "../evidence/quote";
import { rankSentences } from "../evidence/rank";
import { detectScope, magnitudes } from "../evidence/scope";
import { checkSummaryPoints, keySentences } from "../evidence/summary-check";
import { pastedTextMatch } from "../evidence/text-match";
import { isNegated } from "../text/polarity";
import { splitSentences } from "../text/sentences";

const TWENGE = splitSentences(
  "In two nationally representative surveys of U.S. adolescents in grades 8 through 12 (N = 506,820) and national statistics on suicide deaths for those ages 13 to 18, adolescents' depressive symptoms, suicide-related outcomes, and suicide rates increased between 2010 and 2015, especially among females. Adolescents who spent more time on new media (including social media and electronic devices such as smartphones) were more likely to report mental health issues, and adolescents who spent more time on nonscreen activities were less likely. Since 2010, iGen adolescents have spent more time on new media screen activities and less time on nonscreen activities, which may account for the increases in depression and suicide.",
);

describe("evidence ranking", () => {
  it("puts the most relevant sentence first", () => {
    const top = rankSentences("Teenagers who spend more time on social media and smartphones report more mental health issues.", TWENGE, 3);
    expect(top[0].index).toBe(1);
    expect(top[0].score).toBe(1);
  });
});

describe("quote re-check", () => {
  it("accepts a sentence that is really in the source", () => {
    const q = "Adolescents who spent more time on new media (including social media and electronic devices such as smartphones) were more likely to report mental health issues";
    expect(verifyQuote(q, TWENGE, 1)).toMatchObject({ ok: true, index: 1 });
  });
  it("finds the sentence even when the claimed index is wrong", () => {
    const q = "which may account for the increases in depression and suicide";
    expect(verifyQuote(q, TWENGE, 0)).toMatchObject({ ok: true, index: 2 });
  });
  it("rejects an invented quote", () => {
    const q = "Smartphones caused the rise in adolescent depression after 2010.";
    expect(verifyQuote(q, TWENGE).ok).toBe(false);
  });
  it("detects direct quotations in a claim", () => {
    expect(directQuoteIn('They note "considerable caveats due to methodological limitations" (Keles, 2020).')).toBe(
      "considerable caveats due to methodological limitations",
    );
    expect(directQuoteIn('A "short" quote.')).toBeNull();
  });
});

describe("scope rules", () => {
  it("flags causal wording backed by associational evidence", () => {
    const flags = detectScope("Smartphones caused the rise in teen depression after 2010.", TWENGE);
    expect(flags.map((f) => f.kind)).toContain("causal");
  });
  it("flags generalising from a sample to everyone", () => {
    const flags = detectScope("All teenagers are harmed by social media.", ["Among 312 students at two schools, heavy use was associated with anxiety."]);
    expect(flags.map((f) => f.kind)).toContain("generalisation");
  });
  it("ignores wording inside a direct quotation", () => {
    const flags = detectScope('Its authors warn of "considerable caveats due to methodological limitations of cross-sectional design".', [
      "However, there are considerable caveats due to methodological limitations of cross-sectional design, sampling and measures.",
    ]);
    expect(flags).toEqual([]);
  });
  it("does not flag a careful paraphrase", () => {
    expect(detectScope("Heavier new-media use was associated with more reported mental health issues.", TWENGE)).toEqual([]);
  });
  it("flags an effect size the source does not state (CT-29)", () => {
    const flags = detectScope("Heavy social media use triples the risk of depression.", TWENGE, TWENGE.join(" "));
    expect(flags.find((f) => f.kind === "magnitude")?.claimTerm).toBe("triples");
    expect(magnitudes("a 50% increase, twice as likely, 2.5-fold")).toEqual(new Map([["x2", "twice"], ["x2.5", "2.5-fold"], ["50%", "50%"]]));
    // the same size stated in the source is fine
    expect(detectScope("Scores rose by 50% for girls.", ["Scores rose 50% vs 35% for girls and boys."]).some((f) => f.kind === "magnitude")).toBe(false);
  });
  it("flags a different population (CT-29)", () => {
    const flags = detectScope("Social media use is linked to depression in UK children.", TWENGE, TWENGE.join(" "));
    const pop = flags.find((f) => f.kind === "population");
    expect(pop?.message).toBe("The claim is about UK children, but the source describes US adolescents.");
    expect(detectScope("US adolescents who used new media were more likely to report mental health issues.", TWENGE, TWENGE.join(" ")).some((f) => f.kind === "population")).toBe(false);
  });
  it("hints at an opposite direction of finding", () => {
    const flags = detectScope("Unemployment was linked to adolescent suicide rates.", ["Economic factors such as unemployment were not linked to depressive symptoms or suicide rates."]);
    expect(flags.map((f) => f.kind)).toContain("polarity");
  });
});

describe("negation", () => {
  it("only counts negated findings", () => {
    expect(isNegated("were not linked to depressive symptoms")).toBe(true);
    expect(isNegated("moderate use is not intrinsically harmful")).toBe(true);
    expect(isNegated("there was no significant association")).toBe(true);
    expect(isNegated("compared with no use remained significantly associated")).toBe(false);
    expect(isNegated("but not externalizing problems alone")).toBe(false);
  });
});

/* CT-03: code must check that the AI's evidence is a whole sentence and about the claim */
describe("evidence rules (the Skeptic's code half)", () => {
  const ABSTRACT = TWENGE.join(" ");
  const claim = "Smartphones caused the rise in teen depression.";
  const prep = prepareCheck(claim, ABSTRACT);

  it("accepts a whole sentence that is about the claim", () => {
    const j = judgeReply(claim, prep, { verdict: "overreach", sentence: 3, quote: TWENGE[2] });
    expect(j).toMatchObject({ verdict: "overreach", quoteVerified: true, evidence: { index: 2 } });
  });
  it("rejects a short fragment that merely exists in the source", () => {
    const j = judgeReply(claim, prep, { verdict: "supported", sentence: null, quote: "mental health issues" });
    expect(j).toMatchObject({ verdict: "unchecked", reason: "quote_not_in_source", quoteVerified: false });
  });
  it("rejects a sentence number pointing at a sentence that is not about the claim", () => {
    const other = "Students who exercise more sleep better at night.";
    const j = judgeReply(other, prepareCheck(other, ABSTRACT), { verdict: "supported", sentence: 1, quote: "" });
    expect(j).toMatchObject({ verdict: "unchecked", reason: "evidence_not_relevant" });
  });
  it("accepts a substantial part of the exact sentence the AI named", () => {
    const j = judgeReply(claim, prep, { verdict: "overreach", sentence: 3, quote: "which may account for the increases in depression and suicide" });
    expect(j.verdict).toBe("overreach");
  });
  it("needs no evidence to say Not supported", () => {
    expect(judgeReply(claim, prep, { verdict: "not_supported", sentence: null, quote: "" })).toMatchObject({ verdict: "not_supported", quoteVerified: false });
  });
  it("says when a long text was cut (CT-14)", () => {
    const long = Array.from({ length: LIMITS.maxSentences + 20 }, (_, i) => `Sentence number ${i} reports a finding about adolescents.`).join(" ");
    expect(prepareCheck(claim, long).truncated).toEqual({ checked: LIMITS.maxSentences, total: LIMITS.maxSentences + 20 });
    expect(prepareCheck(claim, ABSTRACT).truncated).toBeNull();
    expect(prepareCheck(claim, ABSTRACT.slice(0, 300), 900).truncated?.total).toBeGreaterThan(1);
  });
});

describe("pasted text", () => {
  it("warns when pasted text does not look like the paper", () => {
    const record = { title: "Increases in depressive symptoms, suicide-related outcomes, and suicide rates among U.S. adolescents", abstract: TWENGE.join(" ") };
    expect(pastedTextMatch(TWENGE[1], record).related).toBe(true);
    expect(pastedTextMatch("Regular exercise improves sleep quality in older adults, according to this randomised trial.", record).related).toBe(false);
  });
});

describe("summary grounding", () => {
  it("marks unsupported summary sentences as AI reasoning", () => {
    const pts = checkSummaryPoints(
      [
        { text: "Depressive symptoms and suicide rates among US adolescents rose between 2010 and 2015.", sentences: [0] },
        { text: "Parents should ban phones at night.", sentences: [2] },
        { text: "Made-up link.", sentences: [9] },
      ],
      TWENGE,
    );
    expect(pts.map((p) => p.grounded)).toEqual([true, false, false]);
    expect(pts[2].sentences).toEqual([]);
  });
  it("extracts key sentences without AI", () => {
    expect(keySentences(TWENGE, 2)).toHaveLength(2);
  });
  it("does not ground a point that reverses its sentence (CT-13)", () => {
    const pts = checkSummaryPoints([{ text: "Adolescents who spent more time on new media were not linked to mental health issues.", sentences: [1] }], TWENGE);
    expect(pts[0].grounded).toBe(false);
  });
});

const cite = (id: string): DocNode => ({ type: "citation", attrs: { id } });
const text = (t: string): DocNode => ({ type: "text", text: t });
const para = (...content: DocNode[]): DocNode => ({ type: "paragraph", content });

describe("claim extraction", () => {
  it("turns each cited sentence into a claim with editor positions", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        para(text("Uncited opener. Social media causes anxiety "), cite("s1"), text(". Another uncited sentence.")),
        para(cite("s2"), text(" found a small association. It was small, "), cite("s3"), text(".")),
        para(text("Screen time rose. "), cite("s4")),
      ],
    };
    const claims = extractClaims(doc);
    expect(claims.map((c) => [c.text, c.sourceIds])).toEqual([
      ["Social media causes anxiety.", ["s1"]],
      ["found a small association.", ["s2"]],
      ["It was small.", ["s3"]],
      ["Screen time rose.", ["s4"]],
    ]);
    // ProseMirror positions: paragraph 1 content starts at 1
    const first = claims[0];
    expect(first.from).toBe(1 + "Uncited opener. ".length);
    expect(first.to).toBe(1 + "Uncited opener. Social media causes anxiety ".length + 1 + 1);
  });
  it("ignores citations in headings but keeps positions right", () => {
    const doc: DocNode = {
      type: "doc",
      content: [{ type: "heading", attrs: { level: 2 }, content: [text("Intro "), cite("h")] }, para(text("Real claim "), cite("p"), text("."))],
    };
    const claims = extractClaims(doc);
    expect(claims.map((c) => c.sourceIds)).toEqual([["p"]]);
    // heading: open(1) + "Intro "(6) + cite(1) + close(1) = 9; paragraph content starts at 10
    expect(claims[0].from).toBe(10);
  });
  it("keeps keys stable for the same text and sources", () => {
    const d = (t: string): DocNode => ({ type: "doc", content: [para(text(t), cite("a"), text("."))] });
    expect(extractClaims(d("Same claim "))[0].key).toBe(extractClaims(d("Same claim  "))[0].key);
    expect(extractClaims(d("Same claim "))[0].key).not.toBe(extractClaims(d("Different claim "))[0].key);
  });
});
