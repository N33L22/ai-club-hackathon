import { VerifyBatchRequest } from "@/core/api-schemas";
import { parseReferenceText } from "@/core/verify/reference-text";
import { ok, readBody, route } from "@/server/api";
import { verifyReference } from "@/server/verifier";

export const maxDuration = 60;

/** Stop starting new references after this long, so the response always arrives inside maxDuration. */
const TIME_BUDGET_MS = 45_000;

/**
 * Checks a pasted reference list (for example one produced by a chatbot).
 * The app sends a few references per request (LIMITS.batchChunk) so each
 * request finishes quickly; the per-service pools in server/http.ts keep the
 * calls inside Crossref's and OpenAlex's published rate limits.
 */
export const POST = route("lookup", async (req) => {
  const { references } = await readBody(req, VerifyBatchRequest, 120_000);
  const started = Date.now();
  const results: unknown[] = new Array(references.length);
  let next = 0;
  async function worker() {
    while (next < references.length) {
      const i = next++;
      const raw = references[i];
      const parsed = parseReferenceText(raw);
      if (Date.now() - started > TIME_BUDGET_MS) {
        results[i] = { raw, parsed, error: "Not checked: the request ran out of time. Check it again." };
        continue;
      }
      try {
        results[i] = { raw, parsed, ...(await verifyReference({ raw, doi: parsed.doi })) };
      } catch (e) {
        results[i] = { raw, parsed, error: e instanceof Error ? e.message : "Lookup failed" };
      }
    }
  }
  await Promise.all([worker(), worker()]);
  return ok({ results });
});
