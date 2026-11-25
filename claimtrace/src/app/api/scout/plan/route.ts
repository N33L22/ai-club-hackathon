import { PlanRequest } from "@/core/api-schemas";
import { planSearch } from "@/server/ai/scout";
import { ok, readBody, route } from "@/server/api";

export const maxDuration = 30;

/** Scout: research question -> search plan (the student approves it before any search runs). */
export const POST = route("ai", async (req) => {
  const { question } = await readBody(req, PlanRequest);
  return ok({ plan: await planSearch(question) });
});
