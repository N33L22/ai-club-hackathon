import { SummaryRequest } from "@/core/api-schemas";
import { summarise } from "@/server/ai/assistant";
import { ok, readBody, route } from "@/server/api";

export const maxDuration = 45;

/** Evidence-backed summary: every point linked to a source sentence, or labelled AI reasoning. */
export const POST = route("ai", async (req) => {
  const body = await readBody(req, SummaryRequest);
  return ok({ summary: await summarise(body) });
});
