import { describe, expect, it } from "vitest";
import { inTextLabel } from "../citation/csl";
import { LABELS } from "../labels";
import type { LibrarySource } from "../model";
import { mergeDefined, recordKey } from "../records";
import type { ClaimCheck, ScholarlyRecord, SourceVerification } from "../types";
import { decideFreeText, decideStructured } from "../verify/match";
import { parseReferenceText, splitReferenceList } from "../verify/reference-text";
import { buildVerification, unavailableVerification } from "../verify/steps";
import { evaluateGate } from "../workflow/gate";
import { claimLabel, sourceLabel } from "../workflow/labels";
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

  // CT-05: a BibTeX/RIS entry used to become a close match on title words alone
  const KELLY: ScholarlyRecord = {
    doi: "10.1016/j.eclinm.2018.12.005",
    title: "Social Media Use and Adolescent Mental Health: Findings From the UK Millennium Cohort Study",
    authors: [{ family: "Kelly" }, { family: "Zilanawala" }, { family: "Booker" }, { family: "Sacker" }],
    year: 2018,
    foundIn: ["crossref", "openalex"],
  };
  const fakeTitle = "Social media use and adolescent anxiety: findings from a national cohort";
  it("never turns an invented entry into a different real paper", () => {
    const d = decideStructured({ title: fakeTitle, authors: [{ family: "Thompson" }, { family: "Okafor" }], year: 2021 }, KELLY, false);
    expect(d.status).toBe("not_found");
    expect(d.reason).toContain("different authors");
  });
  it("still offers a close match when an author matches", () => {
    expect(decideStructured({ title: fakeTitle, authors: [{ family: "Kelly" }], year: 2018 }, KELLY, false).status).toBe("close_match");
    expect(decideStructured({ title: fakeTitle, authors: [{ family: "Sacker" }], year: 2018 }, KELLY, false).status).toBe("close_match");
  });
  it("accepts a near-identical title without authors as a close match only with the year", () => {
    expect(decideStructured({ title: KELLY.title.replace("Findings From", "Findings from a"), year: 2015 }, KELLY, false).status).toBe("close_match");
  });
  // Phase 2 case 2: a real DOI on other authors is a Mismatch, never passed because the DOI exists
  it("labels a real DOI with none of the reference's authors a mismatch", () => {
    const d = decideStructured({ doi: KELLY.doi, title: fakeTitle, authors: [{ family: "Thompson" }] }, KELLY, true);
    expect(d.status).toBe("not_found");
    expect(d.mismatch).toBe(true);
    expect(d.reason).toContain("belongs to a different paper");
  });
  it("labels a pasted reference whose DOI belongs to other authors a mismatch", () => {
    const raw = `Hinton, G., & Bengio, Y. (2018). ${KELLY.title}. https://doi.org/${KELLY.doi}`;
    expect(decideFreeText(raw, KELLY, true).mismatch).toBe(true);
  });
  it("does not call a reference without author names a mismatch", () => {
    expect(decideFreeText(`${KELLY.title}. ${KELLY.year}. https://doi.org/${KELLY.doi}`, KELLY, true).mismatch).toBeUndefined();
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
  it("says when a retraction check covered only one database", () => {
    const rec: ScholarlyRecord = { ...KELES, foundIn: ["crossref"] };
    const v = buildVerification(decideStructured({ doi: rec.doi }, rec, true), rec, { failed: ["openalex"] });
    expect(v.status).toBe("verified");
    expect(v.unavailable).toEqual(["openalex"]);
    expect(v.steps[2]).toMatchObject({ state: "warn", title: "Partly checked" });
    expect(v.steps[2].detail).toContain("OpenAlex could not be reached");
  });
  it("never reports an outage as Not found (CT-06)", () => {
    const v = unavailableVerification(["openalex"]);
    expect(v.status).toBe("unavailable");
    expect(sourceLabel(v)).toBe("unavailable");
    expect(v.reason).toContain("not marked Not found");
  });
});

const verified: SourceVerification = { status: "verified", steps: [], reason: "", checkedAt: "" };
const check = (verdict: ClaimCheck["verdict"], textOrigin: ClaimCheck["textOrigin"] = "abstract"): ClaimCheck => ({ verdict, mode: "ai", quoteVerified: verdict !== "unchecked", candidates: [], scopeFlags: [], textOrigin, checkedAt: "" });

describe("claim labels", () => {
  it("lets reference problems outrank the text check", () => {
    expect(claimLabel([{ verification: { ...verified, status: "retracted" } }], [check("supported")])).toBe("retracted");
    expect(claimLabel([undefined], [])).toBe("not_found");
    expect(claimLabel([{ verification: { ...verified, status: "close_match" } }], [check("supported")])).toBe("close_match");
    expect(claimLabel([{ verification: { ...verified, status: "close_match", confirmedByStudent: true } }], [check("supported")])).toBe("supported");
  });
  it("uses the most severe verdict across cited sources", () => {
    expect(claimLabel([{ verification: verified }, { verification: verified }], [check("supported"), check("overreach")])).toBe("overreach");
    expect(claimLabel([{ verification: verified }], [check("unchecked")])).toBe("unchecked");
    expect(claimLabel([{ verification: verified }], [undefined])).toBe("pending");
  });
  it("labels support from pasted text differently, and makes it need an acknowledgement (CT-04)", () => {
    const label = claimLabel([{ verification: verified }], [check("supported", "student_text")]);
    expect(label).toBe("supported_own_text");
    expect(LABELS[label].gate).toBe("acknowledge");
    expect(claimLabel([{ verification: verified }], [check("supported")])).toBe("supported");
  });
  it("keeps a claim citing an unchecked reference out of Supported", () => {
    expect(claimLabel([{ verification: { ...verified, status: "unavailable" } }], [check("supported")])).toBe("unavailable");
    expect(claimLabel([{ verification: { ...verified, status: "unavailable" } }], [check("overreach")])).toBe("overreach");
  });
  it("never shares the reference label Verified with claims", () => {
    expect(LABELS.verified.claim).toBe("");
    expect(LABELS.supported.source).toBe("");
  });
});

describe("export gate", () => {
  it("needs decisions, acknowledgements and a sign-off", () => {
    const at = "2026-11-25T10:00:00Z";
    const claims = [
      { key: "a", label: "supported" as const },
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
    const g = evaluateGate([{ key: "q", label: "supported", missingPage: true }], true);
    expect(g).toMatchObject({ ready: false, needDecision: 1, missingPages: 1 });
    expect(evaluateGate([{ key: "q", label: "supported", missingPage: false }], true).ready).toBe(true);
  });
  it("requires a reason to keep a flagged claim", () => {
    const g = evaluateGate([{ key: "b", label: "overreach", decision: { action: "accept_anyway", reason: "  ", label: "overreach", at: "" } }], true);
    expect(g.ready).toBe(false);
  });
});

const noRefs = { total: 0, verified: 0, confirmedClose: 0, closeMatch: 0, notFound: 0, retracted: 0, unavailable: 0, studentAdded: 0, pending: 0 };
const noClaims = { total: 0, supported: 0, supportedOwnText: 0, overreach: 0, notSupported: 0, unchecked: 0, refNotFound: 0, refUnconfirmed: 0, refStudentAdded: 0, refUnavailable: 0, pending: 0, sample: 0 };
const noDecisions = { edited: 0, replaced: 0, removed: 0, acceptedAnyway: 0, acknowledged: 0 };

describe("AI-use statement", () => {
  it("reports AI use, check results and the student's responses", () => {
    const s = aiUseStatement({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      provider: "NVIDIA NIM",
      uses: { scout: 1, skeptic: 5, assistant: 0 },
      firstUse: "2026-11-25T09:00:00Z",
      lastUse: "2026-11-25T11:00:00Z",
      refs: { ...noRefs, total: 7, verified: 4, closeMatch: 1, notFound: 1, retracted: 1 },
      claims: { ...noClaims, total: 7, supported: 3, overreach: 1, unchecked: 2, refNotFound: 1 },
      decisions: { ...noDecisions, edited: 1, replaced: 1, acknowledged: 2 },
    });
    expect(s).toContain("nvidia/nemotron-3-ultra-550b-a55b");
    expect(s).toContain("on 25 November 2026");
    expect(s).toContain("1 retracted");
    expect(s).toContain("Of my 7 cited claims, 3 were supported by the source text, 1 went beyond the source, 2 could not be checked and 1 cites a reference that was not found");
    expect(s).toContain("edited 1 claim");
    expect(s).toContain("my own");
  });
  it("counts a confirmed close match once, not also as verified (CT-11)", () => {
    const s = aiUseStatement({ uses: { scout: 0, skeptic: 0, assistant: 0 }, refs: { ...noRefs, total: 3, verified: 2, confirmedClose: 1 }, claims: noClaims, decisions: noDecisions });
    expect(s).toContain("3 references against Crossref and OpenAlex (2 verified and 1 close match I confirmed after comparing the details)");
  });
  it("discloses support that came from pasted text, outages and samples", () => {
    const s = aiUseStatement({
      uses: { scout: 0, skeptic: 3, assistant: 0 },
      refs: { ...noRefs, total: 2, verified: 1, unavailable: 1 },
      claims: { ...noClaims, total: 4, supported: 1, supportedOwnText: 1, refUnavailable: 1, refUnconfirmed: 1, sample: 2 },
      decisions: noDecisions,
    });
    expect(s).toContain("1 that could not be checked because a database was unavailable");
    expect(s).toContain("2 were supported by the source text (1 of them by text I pasted myself rather than a database abstract)");
    expect(s).toContain("1 cites a reference the databases could not check at the time");
    expect(s).toContain("1 cites a close match I have not confirmed");
    expect(s).toContain("2 results shown during the session were labelled samples");
  });
  it("says when no generative AI was used", () => {
    const s = aiUseStatement({ uses: { scout: 0, skeptic: 0, assistant: 0 }, refs: noRefs, claims: noClaims, decisions: noDecisions });
    expect(s).toContain("no live generative AI was used");
  });
});

describe("records", () => {
  it("keeps known fields when a re-check returns fewer (CT-10)", () => {
    const stored: ScholarlyRecord = { ...KELES, abstract: "A known abstract with enough words to be kept as it is.", abstractSource: "openalex" };
    const recheck: ScholarlyRecord = { ...KELES, abstract: undefined, abstractSource: undefined, foundIn: ["crossref"] };
    const merged = mergeDefined(stored, recheck);
    expect(merged.abstract).toBe(stored.abstract);
    expect(merged.abstractSource).toBe("openalex");
    expect(merged.foundIn).toEqual(["crossref"]);
  });
  it("gives one key per record", () => {
    expect(recordKey({ doi: "10.1/AbC", title: "x" })).toBe("doi:10.1/abc");
    expect(recordKey({ openalexId: "W1", title: "x" })).toBe("oa:W1");
    expect(recordKey({ title: "A Title!" })).toBe(recordKey({ title: "a title" }));
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
