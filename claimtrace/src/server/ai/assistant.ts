import "server-only";
import { z } from "zod";
import { checkableSentences } from "@/core/evidence/judge";
import { checkSummaryPoints, keySentences } from "@/core/evidence/summary-check";
import type { GroundedSummary, TextOrigin } from "@/core/types";
import { AiUnavailable, chatJson } from "./client";
import { ASSISTANT_SYSTEM, assistantUser } from "./prompts";

const AssistantReply = z.object({
  points: z
    .array(
      z.object({
        text: z.string().min(3),
        sentences: z.array(z.preprocess((v) => Number(v), z.number().int())).default([]),
      }),
    )
    .min(1)
    .max(8),
});

/**
 * Evidence-backed summary (gap H3). Every point links to source sentences and
 * code checks each link (shared words and the same direction of finding);
 * unlinked points are labelled "AI reasoning".
 */
export async function summarise(args: { title: string; text: string; textOrigin: TextOrigin; textChars?: number }): Promise<GroundedSummary> {
  const createdAt = new Date().toISOString();
  // the same sentence split and length limits as the Skeptic
  const { sentences, truncated } = checkableSentences(args.text, args.textChars);
  if (!sentences.length) return { points: [], mode: "code", textOrigin: args.textOrigin, createdAt, truncated };

  try {
    const { data, model } = await chatJson(
      [
        { role: "system", content: ASSISTANT_SYSTEM },
        {
          role: "user",
          content: assistantUser({ title: args.title, sentences, origin: args.textOrigin === "student_text" ? "text the student pasted" : "abstract" }),
        },
      ],
      AssistantReply,
      { maxTokens: 600 },
    );
    const points = checkSummaryPoints(
      data.points.map((p) => ({ text: p.text, sentences: p.sentences.map((n) => n - 1) })),
      sentences,
    );
    return { points, mode: "ai", model, textOrigin: args.textOrigin, createdAt, truncated };
  } catch (e) {
    if (!(e instanceof AiUnavailable)) throw e;
    const picked = keySentences(sentences, 3);
    return {
      points: picked.map((i) => ({ text: sentences[i], sentences: [i], grounded: true })),
      mode: "code",
      textOrigin: args.textOrigin,
      createdAt,
      truncated,
    };
  }
}
