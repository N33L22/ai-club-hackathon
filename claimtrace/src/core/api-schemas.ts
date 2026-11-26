/**
 * Request contracts for the HTTP API, shared by the browser client and the
 * route handlers (validated on the server with these exact schemas).
 */
import { z } from "zod";
import { LIMITS } from "./config";

const person = z.object({ family: z.string().trim().min(1).max(120), given: z.string().trim().max(120).optional() });

export const PlanRequest = z.object({
  question: z.string().trim().min(8, "Write a research question of at least a few words.").max(LIMITS.claimChars),
});

export const SearchRequest = z.object({
  queries: z.array(z.string().trim().min(2).max(200)).min(1).max(LIMITS.maxQueries),
  fromYear: z.number().int().min(1800).max(2100).optional(),
  toYear: z.number().int().min(1800).max(2100).optional(),
  includeReviews: z.boolean().default(true),
  onlyWithAbstract: z.boolean().default(true),
});

export const ReferenceSchema = z
  .object({
    doi: z.string().trim().max(300).optional(),
    title: z.string().trim().max(600).optional(),
    authors: z.array(person).max(50).optional(),
    year: z.number().int().min(1500).max(2100).optional(),
    raw: z.string().trim().max(2000).optional(),
  })
  .refine((r) => r.doi || r.title || r.raw, "Give a DOI, a title or a full reference.");

export const VerifyRequest = z.object({ reference: ReferenceSchema });

export const VerifyBatchRequest = z.object({
  references: z.array(z.string().trim().min(10).max(2000)).min(1).max(LIMITS.bulkReferences),
});

export const ClaimCheckRequest = z.object({
  claim: z.string().trim().min(3).max(LIMITS.claimChars),
  citedAs: z.string().trim().max(400).default(""),
  text: z.string().max(LIMITS.sourceTextChars).default(""),
  textOrigin: z.enum(["student_text", "abstract", "none"]),
  /** Length of the original text when the browser shortened it to the limit. */
  textChars: z.number().int().min(0).max(5_000_000).optional(),
});

export const SummaryRequest = z.object({
  title: z.string().trim().max(600),
  text: z.string().min(1).max(LIMITS.sourceTextChars),
  textOrigin: z.enum(["student_text", "abstract", "none"]),
  textChars: z.number().int().min(0).max(5_000_000).optional(),
});

export type PlanRequestBody = z.input<typeof PlanRequest>;
export type SearchRequestBody = z.input<typeof SearchRequest>;
export type VerifyRequestBody = z.input<typeof VerifyRequest>;
export type ClaimCheckRequestBody = z.input<typeof ClaimCheckRequest>;
export type SummaryRequestBody = z.input<typeof SummaryRequest>;
