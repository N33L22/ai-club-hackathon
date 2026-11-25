import { VerifyBatchRequest } from "@/core/api-schemas";
import { parseReferenceText } from "@/core/verify/reference-text";
import { ok, readBody, route } from "@/server/api";
import { verifyReference } from "@/server/verifier";

export const maxDuration = 60;

/** Checks a pasted reference list (for example one produced by a chatbot), three at a time. */
export const POST = route("lookup", async (req) => {
  const { references } = await readBody(req, VerifyBatchRequest, 120_000);
  const results: unknown[] = new Array(references.length);
  let next = 0;
  async function worker() {
    while (next < references.length) {
      const i = next++;
      const raw = references[i];
      const parsed = parseReferenceText(raw);
      try {
        results[i] = { raw, parsed, ...(await verifyReference({ raw, doi: parsed.doi })) };
      } catch (e) {
        results[i] = { raw, parsed, error: e instanceof Error ? e.message : "Lookup failed" };
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  return ok({ results });
});
