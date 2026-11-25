import { SearchRequest } from "@/core/api-schemas";
import { ok, readBody, route } from "@/server/api";
import { searchWorks } from "@/server/sources";

export const maxDuration = 30;

/** Runs an approved search plan against OpenAlex. Returns real records only. */
export const POST = route("lookup", async (req) => {
  const body = await readBody(req, SearchRequest);
  const results = await searchWorks(body.queries, {
    fromYear: body.fromYear,
    toYear: body.toYear,
    includeReviews: body.includeReviews,
    onlyWithAbstract: body.onlyWithAbstract,
  });
  return ok({ results });
});
