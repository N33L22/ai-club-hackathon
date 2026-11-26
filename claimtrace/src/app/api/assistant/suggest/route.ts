import { SuggestRequest } from "@/core/api-schemas";
import { suggestDraft } from "@/server/ai/writer";
import { ok, readBody, route } from "@/server/api";

export const maxDuration = 45;

/** Assistant: suggested sentences for the draft, each based on one of the student's library sources (the student decides). */
export const POST = route("ai", async (req) => {
  const body = await readBody(req, SuggestRequest);
  return ok(await suggestDraft(body));
});
