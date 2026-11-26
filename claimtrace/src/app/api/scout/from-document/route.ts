import { DocumentIdeaRequest } from "@/core/api-schemas";
import { ideaFromDocument } from "@/server/ai/document";
import { ok, readBody, route } from "@/server/api";

export const maxDuration = 30;

/** Scout: a document's opening text -> suggested project title, research question and area (the student edits them). */
export const POST = route("ai", async (req) => {
  const body = await readBody(req, DocumentIdeaRequest);
  return ok({ idea: await ideaFromDocument(body) });
});
