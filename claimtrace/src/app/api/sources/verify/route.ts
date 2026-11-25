import { VerifyRequest } from "@/core/api-schemas";
import { extractDoi } from "@/core/text/normalize";
import { HttpError, ok, readBody, route } from "@/server/api";
import { verifyReference } from "@/server/verifier";

export const maxDuration = 30;

/** Verifier (code only): exists, details match, retraction status. */
export const POST = route("lookup", async (req) => {
  const { reference } = await readBody(req, VerifyRequest);
  const doi = reference.doi ? extractDoi(reference.doi) : undefined;
  if (reference.doi && !doi && !reference.title && !reference.raw) {
    throw new HttpError(422, "invalid_doi", "That does not look like a DOI. A DOI starts with 10., for example 10.1038/s41562-018-0506-1.");
  }
  return ok(await verifyReference({ ...reference, doi }));
});
