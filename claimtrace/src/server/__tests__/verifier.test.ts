/**
 * The Verifier against mocked Crossref and OpenAlex answers: a database that
 * does not answer must never turn into "Not found" (CT-06), and a used-up
 * daily budget must fail fast with a clear reason (CT-01).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const DOI = "10.1016/j.eclinm.2018.12.005";
const CROSSREF_ITEM = {
  DOI,
  title: ["Social Media Use and Adolescent Mental Health: Findings From the UK Millennium Cohort Study"],
  author: [{ family: "Kelly", given: "Yvonne" }, { family: "Zilanawala" }, { family: "Booker" }, { family: "Sacker" }],
  issued: { "date-parts": [[2018]] },
  "container-title": ["EClinicalMedicine"],
  type: "journal-article",
};

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };
const json = (r: Reply) => new Response(r.body === undefined ? "" : JSON.stringify(r.body), { status: r.status, headers: { "Content-Type": "application/json", ...r.headers } });

/** Route mocked replies by service. */
function mockApis(replies: { crossref: () => Reply; openalex: () => Reply }) {
  const calls = { crossref: 0, openalex: 0 };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL) => {
      const u = String(url);
      if (u.includes("api.crossref.org")) {
        calls.crossref++;
        return json(replies.crossref());
      }
      calls.openalex++;
      return json(replies.openalex());
    }),
  );
  return calls;
}

async function load() {
  vi.resetModules(); // fresh caches, pools and breakers
  return import("../verifier");
}

afterEach(() => vi.unstubAllGlobals());

describe("Verifier: Not found vs Couldn't check", () => {
  it("reports Not found only when both databases answered", async () => {
    mockApis({ crossref: () => ({ status: 404 }), openalex: () => ({ status: 404 }) });
    const { verifyReference } = await load();
    const r = await verifyReference({ doi: "10.9999/does-not-exist" });
    expect(r.verification.status).toBe("not_found");
  });

  it("reports Couldn't check when one database fails and the other has no record", async () => {
    mockApis({ crossref: () => ({ status: 404 }), openalex: () => ({ status: 503 }) });
    const { verifyReference } = await load();
    const r = await verifyReference({ doi: "10.9999/maybe-real" });
    expect(r.verification.status).toBe("unavailable");
    expect(r.verification.unavailable).toEqual(["openalex"]);
    expect(r.verification.reason).toContain("Crossref has no record");
    expect(r.verification.reason).toContain("OpenAlex could not be reached");
  }, 15_000);

  it("still verifies from one database, and says the other was not checked", async () => {
    mockApis({ crossref: () => ({ status: 200, body: { message: CROSSREF_ITEM } }), openalex: () => ({ status: 503 }) });
    const { verifyReference } = await load();
    const r = await verifyReference({ doi: DOI });
    expect(r.verification.status).toBe("verified");
    expect(r.verification.unavailable).toEqual(["openalex"]);
    expect(r.verification.steps[2].detail).toContain("OpenAlex could not be reached");
  }, 15_000);

  it("reports Couldn't check for a pasted reference when the search fails", async () => {
    mockApis({ crossref: () => ({ status: 200, body: { message: { items: [] } } }), openalex: () => ({ status: 503 }) });
    const { verifyReference } = await load();
    const r = await verifyReference({ raw: "Kelly, Y. (2018). Social media use and adolescent mental health. EClinicalMedicine, 6, 59-68." });
    expect(r.verification.status).toBe("unavailable");
  }, 15_000);
});

describe("upstream limits", () => {
  it("fails fast once OpenAlex's daily budget is used up", async () => {
    const calls = mockApis({
      crossref: () => ({ status: 404 }),
      openalex: () => ({ status: 429, body: { error: "daily_budget" }, headers: { "Retry-After": "30025" } }),
    });
    vi.resetModules();
    const http = await import("../http");
    await expect(http.getJson("https://api.openalex.org/works?search=a", { service: "OpenAlex" })).rejects.toMatchObject({ reason: "quota" });
    await expect(http.getJson("https://api.openalex.org/works?search=b", { service: "OpenAlex" })).rejects.toMatchObject({ reason: "quota" });
    expect(calls.openalex).toBe(1); // the second call never left the server
    expect(http.blockedServices()[0]).toMatchObject({ service: "OpenAlex", reason: "quota" });
  });

  it("treats a short Retry-After as throttling, even when the body mentions the daily budget", async () => {
    let n = 0;
    const calls = mockApis({
      crossref: () => ({ status: 404 }),
      openalex: () =>
        ++n === 1
          ? { status: 429, body: { reason: "requests_per_second", message: "No API key, so this request shares one free daily budget." }, headers: { "Retry-After": "1" } }
          : { status: 200, body: { results: [] } },
    });
    vi.resetModules();
    const http = await import("../http");
    await expect(http.getJson("https://api.openalex.org/works?search=c", { service: "OpenAlex" })).resolves.toMatchObject({ status: 200 });
    expect(calls.openalex).toBe(2);
    expect(http.blockedServices()).toEqual([]);
  });

  it("follows the rate limits Crossref advertises", async () => {
    vi.resetModules();
    const { RequestPool } = await import("../http");
    const pool = new RequestPool(4, 50);
    pool.adapt(new Headers({ "x-rate-limit-limit": "1", "x-rate-limit-interval": "1s", "x-concurrency-limit": "1" }));
    expect(pool.max).toBe(1);
    expect(pool.intervalMs).toBe(1000);
  });
});
