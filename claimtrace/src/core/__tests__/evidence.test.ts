import { describe, expect, it } from "vitest";
import { extractClaims, type DocNode } from "../evidence/claims";
import { directQuoteIn, verifyQuote } from "../evidence/quote";
import { rankSentences } from "../evidence/rank";
import { detectScope } from "../evidence/scope";
import { checkSummaryPoints, keySentences } from "../evidence/summary-check";
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
