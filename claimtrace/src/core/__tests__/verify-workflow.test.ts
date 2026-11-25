import { describe, expect, it } from "vitest";
import { inTextLabel } from "../citation/csl";
import type { LibrarySource } from "../model";
import type { ClaimCheck, ScholarlyRecord, SourceVerification } from "../types";
import { decideFreeText, decideStructured } from "../verify/match";
import { parseReferenceText, splitReferenceList } from "../verify/reference-text";
import { buildVerification } from "../verify/steps";
import { evaluateGate } from "../workflow/gate";
import { claimLabel } from "../workflow/labels";
import { computeSourceMix } from "../workflow/source-mix";
import { aiUseStatement } from "../workflow/statement";

const KELES: ScholarlyRecord = {
  doi: "10.1080/02673843.2019.1590851",
  title: "A systematic review: the influence of social media on depression, anxiety and psychological distress in adolescents",
  authors: [{ family: "Keles", given: "Betul" }, { family: "McCrae", given: "Niall" }, { family: "Grealish", given: "Annmarie" }],
  year: 2019,
  foundIn: ["crossref", "openalex"],
  retraction: { retracted: false, flaggedBy: [], updates: [] },
};

describe("verifier: structured references", () => {
  it("verifies a DOI on its own", () => {
    expect(decideStructured({ doi: KELES.doi }, KELES, true).status).toBe("verified");
  });
  it("tolerates a one-year difference (online first vs print)", () => {
    const d = decideStructured({ doi: KELES.doi, title: KELES.title, authors: [{ family: "Keles" }], year: 2020 }, KELES, true);
    expect(d.status).toBe("verified");
  });
  it("gives a close match, not a hard mismatch, when the year is off", () => {
    const d = decideStructured({ title: KELES.title, authors: [{ family: "Keles" }], year: 2016 }, KELES, false);
    expect(d.status).toBe("close_match");
    expect(d.reason).toContain("year differs");
  });
  it("rejects a real DOI attached to a different paper", () => {
    const d = decideStructured({ doi: KELES.doi, title: "Instagram use doubles anxiety in teenagers: a meta-analysis" }, KELES, true);
    expect(d.status).toBe("not_found");
    expect(d.reason).toContain("different paper");
  });
});

describe("verifier: pasted reference strings", () => {
  const raw = "Keles, B., McCrae, N., & Grealish, A. (2020). A systematic review: the influence of social media on depression, anxiety and psychological distress in adolescents. International Journal of Adolescence and Youth, 25(1), 79-93.";
  it("verifies a correct reference", () => {
    expect(decideFreeText(raw, KELES, false).status).toBe("verified");
  });
  it("flags a reference with the wrong year as a close match", () => {
    expect(decideFreeText(raw.replace("2020", "2012"), KELES, false).status).toBe("close_match");
  });
  it("does not offer a close match on shared title words alone", () => {
    const generic: ScholarlyRecord = { ...KELES, title: "Social media and adolescent wellbeing", authors: [{ family: "Yan" }], year: 2025 };
    const fake = "Martinez, L., & Chen, W. (2022). Social media detox and adolescent sleep quality: A randomized controlled trial. Journal of Youth Digital Wellbeing, 8(2), 45-61.";
    expect(decideFreeText(fake, generic, false).status).toBe("not_found");
  });
  it("ignores a match made only through the journal name", () => {
    const editorial: ScholarlyRecord = { title: "Gender and geography at The Lancet Child & Adolescent Health", authors: [{ family: "The Lancet Child & Adolescent Health" }], year: 2019, venue: "The Lancet Child & Adolescent Health", foundIn: ["crossref"] };
    const fake = "Okonkwo, A., & Brennan, S. (2019). Instagram filters and body dissatisfaction: A longitudinal cohort of 3,000 girls. The Lancet Child & Adolescent Health, 3(9), 610-618.";
    expect(decideFreeText(fake, editorial, false).status).toBe("not_found");
  });
  it("catches a swapped author order", () => {
    const swapped = raw.replace("Keles, B., McCrae, N., & Grealish, A.", "McCrae, N., Keles, B., & Grealish, A.");
    const d = decideFreeText(swapped, KELES, false);
    expect(d.status).toBe("close_match");
    expect(d.reason).toContain("author order differs");
  });
  it("rejects an unrelated candidate", () => {
    const fake = "Thompson, R., & Okafor, L. (2021). Instagram use and adolescent anxiety: A meta-analysis of 48 studies. Journal of Adolescent Digital Health, 12(3), 201-219.";
    expect(decideFreeText(fake, KELES, false).status).toBe("not_found");
  });
  it("prefers the original paper over its retraction notice", () => {
    const notice: ScholarlyRecord = { ...KELES, doi: "10.1/notice", title: `Retraction Note: ${KELES.title}` };
    expect(decideFreeText(raw, KELES, false).score).toBeGreaterThan(decideFreeText(raw, notice, false).score);
  });
  it("parses the visible parts of a reference", () => {
    const p = parseReferenceText(raw);
    expect(p).toMatchObject({ year: 2020, authors: [{ family: "Keles" }] });
    expect(p.title?.startsWith("A systematic review")).toBe(true);
  });
  it("splits a pasted bibliography", () => {
    const list = splitReferenceList(`${raw}\n\n${raw.replace("Keles", "Smith")}`);
    expect(list).toHaveLength(2);
  });
});

describe("verification steps", () => {
  it("marks a retracted record red even when details match", () => {
    const rec: ScholarlyRecord = { ...KELES, retraction: { retracted: true, flaggedBy: ["crossref", "openalex"], noticeDoi: "10.1/notice", date: "2010-02-06", updates: [] } };
    const v = buildVerification(decideStructured({ doi: rec.doi }, rec, true), rec);
    expect(v.status).toBe("retracted");
    expect(v.steps.map((s) => s.state)).toEqual(["pass", "pass", "fail"]);
  });
});

const verified: SourceVerification = { status: "verified", steps: [], reason: "", checkedAt: "" };
const check = (verdict: ClaimCheck["verdict"]): ClaimCheck => ({ verdict, mode: "ai", quoteVerified: verdict !== "unchecked", candidates: [], scopeFlags: [], textOrigin: "abstract", checkedAt: "" });

describe("claim labels", () => {
  it("lets reference problems outrank the text check", () => {
    expect(claimLabel([{ verification: { ...verified, status: "retracted" } }], [check("supported")])).toBe("retracted");
    expect(claimLabel([undefined], [])).toBe("not_found");
    expect(claimLabel([{ verification: { ...verified, status: "close_match" } }], [check("supported")])).toBe("close_match");
    expect(claimLabel([{ verification: { ...verified, status: "close_match", confirmedByStudent: true } }], [check("supported")])).toBe("verified");
  });
  it("uses the most severe verdict across cited sources", () => {
    expect(claimLabel([{ verification: verified }, { verification: verified }], [check("supported"), check("overreach")])).toBe("overreach");
    expect(claimLabel([{ verification: verified }], [check("unchecked")])).toBe("unchecked");
    expect(claimLabel([{ verification: verified }], [undefined])).toBe("pending");
  });
});

describe("export gate", () => {
  it("needs decisions, acknowledgements and a sign-off", () => {
    const at = "2026-11-25T10:00:00Z";
    const claims = [
      { key: "a", label: "verified" as const },
      { key: "b", label: "overreach" as const },
      { key: "c", label: "unchecked" as const },
    ];
    expect(evaluateGate(claims, true)).toMatchObject({ ready: false, needDecision: 1, needAck: 1 });
    const decided = [
      claims[0],
      { ...claims[1], decision: { action: "accept_anyway" as const, reason: "Quoted as the authors' own interpretation", label: "overreach" as const, at } },
      { ...claims[2], decision: { action: "acknowledge" as const, label: "unchecked" as const, at } },
    ];
    expect(evaluateGate(decided, false).ready).toBe(false);
    expect(evaluateGate(decided, true).ready).toBe(true);
  });
  it("drops a decision once the label changes", () => {
    const g = evaluateGate([{ key: "b", label: "not_supported", decision: { action: "accept_anyway", reason: "x", label: "overreach", at: "" } }], true);
    expect(g.needDecision).toBe(1);
  });
  it("blocks a direct quote until its page is given", () => {
    const g = evaluateGate([{ key: "q", label: "verified", missingPage: true }], true);
    expect(g).toMatchObject({ ready: false, needDecision: 1, missingPages: 1 });
    expect(evaluateGate([{ key: "q", label: "verified", missingPage: false }], true).ready).toBe(true);
  });
  it("requires a reason to keep a flagged claim", () => {
    const g = evaluateGate([{ key: "b", label: "overreach", decision: { action: "accept_anyway", reason: "  ", label: "overreach", at: "" } }], true);
    expect(g.ready).toBe(false);
  });
});

describe("AI-use statement", () => {
  it("reports AI use, check results and the student's responses", () => {
    const s = aiUseStatement({
      model: "meta/llama-3.3-70b-instruct",
      provider: "NVIDIA NIM",
      uses: { scout: 1, skeptic: 5, assistant: 0 },
      firstUse: "2026-11-25T09:00:00Z",
      lastUse: "2026-11-25T11:00:00Z",
      refs: { total: 7, verified: 4, closeMatch: 1, notFound: 1, retracted: 1, studentAdded: 0 },
      claims: { total: 7, verified: 3, overreach: 1, notSupported: 0, unchecked: 2, refIssues: 1, sample: 0 },
      decisions: { edited: 1, replaced: 1, removed: 0, acceptedAnyway: 0, acknowledged: 2 },
    });
    expect(s).toContain("meta/llama-3.3-70b-instruct");
    expect(s).toContain("on 25 November 2026");
    expect(s).toContain("1 retracted");
    expect(s).toContain("Of my 7 cited claims, 3 were supported by the source text, 1 went beyond the source, 2 could not be checked and 1 cites a reference");
    expect(s).toContain("edited 1 claim");
    expect(s).toContain("my own");
  });
  it("says when no generative AI was used", () => {
    const s = aiUseStatement({
      uses: { scout: 0, skeptic: 0, assistant: 0 },
      refs: { total: 0, verified: 0, closeMatch: 0, notFound: 0, retracted: 0, studentAdded: 0 },
      claims: { total: 0, verified: 0, overreach: 0, notSupported: 0, unchecked: 0, sample: 0 },
      decisions: { edited: 0, replaced: 0, removed: 0, acceptedAnyway: 0, acknowledged: 0 },
    });
    expect(s).toContain("no generative AI was used");
  });
});

describe("source mix and citations", () => {
  it("summarises years, access and countries without scoring credibility", () => {
    const mix = computeSourceMix(
      [
        { year: 2018, isOa: true, countries: ["GB"], hasText: true, origin: "database", type: "article" },
        { year: 2019, isOa: true, countries: ["US"], hasText: true, origin: "database", type: "review" },
        { year: 2017, isOa: false, countries: ["US"], hasText: true, origin: "database", type: "article" },
        { year: 2024, hasText: false, origin: "student", type: "webpage" },
      ],
      new Date("2026-11-25"),
    );
    expect(mix.total).toBe(4);
    expect(mix.openAccess).toEqual({ open: 2, closed: 1, unknown: 1 });
    expect(mix.countries[0]).toEqual({ code: "US", count: 2 });
    expect(mix.studentAdded).toBe(1);
  });
  it("formats in-text citations per style", () => {
    const src = (authors: string[], year?: number) => ({ record: { title: "T", authors: authors.map((family) => ({ family })), year, foundIn: [] } }) as unknown as LibrarySource;
    expect(inTextLabel(src(["Kelly"], 2018), "apa")).toBe("(Kelly, 2018)");
    expect(inTextLabel(src(["Orben", "Przybylski"], 2019), "apa")).toBe("(Orben & Przybylski, 2019)");
    expect(inTextLabel(src(["Riehm", "Feder", "Tormohlen"], 2019), "harvard")).toBe("(Riehm et al., 2019)");
    expect(inTextLabel(src(["Riehm", "Feder"], undefined), "mla")).toBe("(Riehm and Feder)");
    expect(inTextLabel(src(["Kelly"], 2018), "ieee", 3)).toBe("[3]");
  });
});
