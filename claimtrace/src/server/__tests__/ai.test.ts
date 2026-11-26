/**
 * The AI path with a mocked OpenAI-compatible endpoint: proves the parsing,
 * validation, quote re-check and fallbacks without a live key.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ABSTRACT =
  "In two nationally representative surveys of U.S. adolescents (N = 506,820), depressive symptoms and suicide rates increased between 2010 and 2015, especially among females. Adolescents who spent more time on new media were more likely to report mental health issues. Since 2010, iGen adolescents have spent more time on new media screen activities, which may account for the increases in depression and suicide.";

function reply(content: string, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status, headers: { "Content-Type": "application/json" } });
}

async function loadSkeptic() {
  vi.resetModules();
  return import("../ai/skeptic");
}

describe("Skeptic with a mocked model", () => {
  beforeEach(() => {
    process.env.NVIDIA_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NVIDIA_API_KEY;
  });

  it("accepts a verdict whose quote is really in the source", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      reply(
        '```json\n{"verdict":"Overreach","sentence":3,"quote":"Since 2010, iGen adolescents have spent more time on new media screen activities, which may account for the increases in depression and suicide.","explanation":"The source says may account for, not caused.","issues":["causal"]}\n```',
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { checkClaim } = await loadSkeptic();
    const check = await checkClaim({ claim: "Smartphones caused the rise in teen depression.", citedAs: "(Twenge et al., 2017)", text: ABSTRACT, textOrigin: "abstract" });
    expect(check).toMatchObject({ verdict: "overreach", mode: "ai", quoteVerified: true, evidence: { index: 2 } });
    expect(check.explanation).toContain("may account for");
    // the request goes to the configured endpoint with the key and temperature 0
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body).temperature).toBe(0);
    // the source is fenced as data
    expect(JSON.parse(init.body).messages[1].content).toContain('<source kind="abstract">');
  });

  it("downgrades a verdict whose quote is not in the source", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply('{"verdict":"supported","sentence":2,"quote":"Smartphones caused the rise in adolescent depression.","explanation":"x","issues":[]}')),
    );
    const { checkClaim } = await loadSkeptic();
    const check = await checkClaim({ claim: "Smartphones caused the rise in teen depression.", citedAs: "", text: ABSTRACT, textOrigin: "abstract" });
    expect(check).toMatchObject({ verdict: "unchecked", reason: "quote_not_in_source", quoteVerified: false });
  });

  it("gives up on malformed output after one repair attempt", async () => {
    // a fresh Response per call: a body can only be read once
    const fetchMock = vi.fn().mockImplementation(async () => reply("I think it is supported."));
    vi.stubGlobal("fetch", fetchMock);
    const { checkClaim } = await loadSkeptic();
    const check = await checkClaim({ claim: "Teen depression rose after 2010.", citedAs: "", text: ABSTRACT, textOrigin: "abstract" });
    expect(check).toMatchObject({ verdict: "unchecked", mode: "code", reason: "invalid_ai_output" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports rate limiting honestly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("slow down", { status: 429 })));
    const { checkClaim } = await loadSkeptic();
    const check = await checkClaim({ claim: "Teen depression rose after 2010.", citedAs: "", text: ABSTRACT, textOrigin: "abstract" });
    expect(check).toMatchObject({ verdict: "unchecked", reason: "rate_limited" });
    expect(check.candidates.length).toBeGreaterThan(0);
  });

  it("never calls the model when there is no text", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { checkClaim } = await loadSkeptic();
    const check = await checkClaim({ claim: "Anything.", citedAs: "", text: "", textOrigin: "none" });
    expect(check).toMatchObject({ verdict: "unchecked", reason: "no_text" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("reasoning models", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NVIDIA_API_KEY;
    delete process.env.AI_EXTRA_BODY;
    delete process.env.AI_MAX_TOKENS_SCALE;
  });

  it("sends the configured extra fields and a scaled token budget", async () => {
    process.env.NVIDIA_API_KEY = "test-key";
    process.env.AI_EXTRA_BODY = '{"chat_template_kwargs":{"enable_thinking":false}}';
    process.env.AI_MAX_TOKENS_SCALE = "4";
    const fetchMock = vi.fn().mockResolvedValue(reply('{"verdict":"not_supported","sentence":null,"quote":"","explanation":"x","issues":[]}'));
    vi.stubGlobal("fetch", fetchMock);
    const { checkClaim } = await loadSkeptic();
    await checkClaim({ claim: "Teen depression rose after 2010.", citedAs: "", text: ABSTRACT, textOrigin: "abstract" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(body.max_tokens).toBe(2000);
  });

  it("reads the answer after a thinking block", async () => {
    vi.resetModules();
    const { extractJson } = await import("../ai/client");
    expect(extractJson('<think>Maybe {"verdict":"supported"}? No.</think>\n{"verdict":"overreach","sentence":3}')).toEqual({ verdict: "overreach", sentence: 3 });
    expect(extractJson('Reasoning... {"draft":1} done.</think>{"verdict":"not_supported"}')).toEqual({ verdict: "not_supported" });
  });
});

describe("Skeptic without a key", () => {
  it("stays Unchecked and does not call any API", async () => {
    delete process.env.NVIDIA_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { checkClaim } = await loadSkeptic();
    const check = await checkClaim({ claim: "Teen depression rose after 2010.", citedAs: "", text: ABSTRACT, textOrigin: "abstract" });
    expect(check).toMatchObject({ verdict: "unchecked", mode: "code", reason: "ai_unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("Scout and Assistant with a mocked model", () => {
  beforeEach(() => {
    process.env.NVIDIA_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NVIDIA_API_KEY;
  });

  it("cleans the Scout's queries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply('{"queries":["\\"social media\\" AND adolescents","teen depression screen time"],"keywords":["social media"],"fromYear":null,"toYear":null,"includeReviews":true,"rationale":"Two angles."}')),
    );
    vi.resetModules();
    const { planSearch } = await import("../ai/scout");
    const plan = await planSearch("Does social media harm adolescents?");
    expect(plan.mode).toBe("ai");
    expect(plan.queries).toEqual(["social media adolescents", "teen depression screen time"]);
  });

  it("labels unlinked summary points as AI reasoning", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply('{"points":[{"text":"Depressive symptoms and suicide rates rose between 2010 and 2015, especially among females.","sentences":[1]},{"text":"Parents should ban phones.","sentences":[]}]}')),
    );
    vi.resetModules();
    const { summarise } = await import("../ai/assistant");
    const s = await summarise({ title: "Twenge", text: ABSTRACT, textOrigin: "abstract" });
    expect(s.points.map((p) => p.grounded)).toEqual([true, false]);
    expect(s.points[0].sentences).toEqual([0]);
  });
});
