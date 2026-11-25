import { ClaimCheckRequest } from "@/core/api-schemas";
import { checkClaim } from "@/server/ai/skeptic";
import { ok, readBody, route } from "@/server/api";

export const maxDuration = 45;

/** Skeptic: does the source text support the claim? Code re-checks every quote. */
export const POST = route("ai", async (req) => {
  const body = await readBody(req, ClaimCheckRequest);
  return ok({ check: await checkClaim(body) });
});
