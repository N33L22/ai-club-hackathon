import { describe, expect, it } from "vitest";
import { extractDoi, normalizeForQuote, normalizeText, stripRetractedPrefix, stripTags } from "../text/normalize";
import { longestCommonRun, withoutQuotes } from "../text/overlap";
import { splitSentences } from "../text/sentences";
import { surnameIn, surnameMatch, titleCoverage, titleSimilarity } from "../text/similarity";
import { stem } from "../text/tokens";

describe("normalisation", () => {
  it("folds case, punctuation and diacritics", () => {
    expect(normalizeText("“Social-media” Use, Café!")).toBe("social media use cafe");
  });
  it("strips RETRACTED prefixes", () => {
    expect(stripRetractedPrefix("RETRACTED: Ileal-lymphoid-nodular hyperplasia")).toBe("Ileal-lymphoid-nodular hyperplasia");
  });
  it("extracts DOIs from URLs and prefixes, keeping balanced brackets", () => {
    expect(extractDoi("https://doi.org/10.1016/S0140-6736(97)11096-0.")).toBe("10.1016/s0140-6736(97)11096-0");
    expect(extractDoi("doi:10.1038/s41562-018-0506-1")).toBe("10.1038/s41562-018-0506-1");
    expect(extractDoi("(see https://doi.org/10.1080/02673843.2019.1590851)")).toBe("10.1080/02673843.2019.1590851");
    expect(extractDoi("no doi here")).toBeUndefined();
  });
  it("strips JATS tags and entities from abstracts", () => {
    expect(stripTags("<jats:p>Adolescents &amp; screens &#8805; 3 h</jats:p>")).toBe("Adolescents & screens ≥ 3 h");
  });
  it("normalises quotes for comparison", () => {
    expect(normalizeForQuote("“All domains correlated with depression.”")).toBe("all domains correlated with depression");
  });
});

describe("stemming", () => {
  it("maps related forms together", () => {
    expect(stem("associated")).toBe(stem("association"));
    expect(stem("depression")).toBe(stem("depressive"));
    expect(stem("adolescents")).toBe(stem("adolescence"));
  });
});

describe("similarity", () => {
  it("scores identical and retracted-prefixed titles as 1", () => {
    expect(titleSimilarity("Social Media Use and Adolescent Mental Health", "social media use and adolescent mental health")).toBe(1);
    expect(titleSimilarity("RETRACTED: A study of X and Y in Z", "A study of X and Y in Z")).toBe(1);
  });
  it("treats a missing subtitle as a near match", () => {
    expect(
      titleSimilarity(
        "Social Media Use and Adolescent Mental Health",
        "Social Media Use and Adolescent Mental Health: Findings From the UK Millennium Cohort Study",
      ),
    ).toBeGreaterThanOrEqual(0.95);
  });
  it("scores different papers low", () => {
    expect(titleSimilarity("Instagram use and adolescent anxiety", "Matching methods for causal inference")).toBeLessThan(0.5);
  });
  it("measures title coverage inside a free-text reference", () => {
    const raw = "Keles, B., McCrae, N., & Grealish, A. (2020). A systematic review: the influence of social media on depression, anxiety and psychological distress in adolescents.";
    expect(titleCoverage("A systematic review: the influence of social media on depression, anxiety and psychological distress in adolescents", raw)).toBe(1);
  });
  it("matches surnames despite accents and typos", () => {
    expect(surnameMatch("Przybylski", "Przybylski")).toBe(true);
    expect(surnameMatch("Müller", "Muller")).toBe(true);
    expect(surnameMatch("Kelly", "Twenge")).toBe(false);
    expect(surnameIn("Grealish", "Keles, B., McCrae, N., & Grealish, A. (2020)")).toBe(true);
  });
});

describe("sentences", () => {
  it("keeps abbreviations, initials and numbers inside sentences", () => {
    const s = splitSentences(
      "Twenge et al. surveyed U.S. adolescents (N = 506,820). Rates rose 2.5 times, e.g. among girls. A. K. Przybylski disagreed! Why?",
    );
    expect(s).toEqual([
      "Twenge et al. surveyed U.S. adolescents (N = 506,820).",
      "Rates rose 2.5 times, e.g. among girls.",
      "A. K. Przybylski disagreed!",
      "Why?",
    ]);
  });
});

describe("patchwriting overlap", () => {
  it("finds the longest shared run of words", () => {
    const r = longestCommonRun(
      "Overall, all domains correlated with depression, anxiety and psychological distress in teens.",
      "All domains correlated with depression, anxiety and psychological distress.",
    );
    expect(r.words).toBe(9);
  });
  it("ignores quoted text", () => {
    expect(withoutQuotes('They found "all domains correlated with depression" overall')).not.toContain("domains");
  });
});
