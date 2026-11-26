import "server-only";
import { z } from "zod";
import { AiUnavailable, chatJson } from "./client";
import { WRITER_SYSTEM, writerUser } from "./prompts";

const WriterReply = z.object({
  suggestions: z.array(z.object({ text: z.string().trim().min(10).max(600), sourceId: z.string().trim().min(1) })).max(8),
});

export interface DraftSuggestion {
  text: string;
  sourceId: string;
}

/**
 * The Assistant suggests sentences a student could add to their draft. It sees only the abstracts
 * of sources already in the student's library, and code keeps only suggestions that name one of
 * those sources. Nothing enters the draft until the student clicks Insert, and an inserted
 * sentence is a claim like any other: the Skeptic checks it against its source on Review.
 */
export async function suggestDraft(args: {
  question: string;
  draft: string;
  sources: Array<{ id: string; ref: string; title: string; text: string }>;
}): Promise<{ suggestions: DraftSuggestion[]; mode: "ai" | "offline"; model?: string }> {
  try {
    const { data, model } = await chatJson(
      [
        { role: "system", content: WRITER_SYSTEM },
        { role: "user", content: writerUser(args) },
      ],
      WriterReply,
      { maxTokens: 700 },
    );
    const ids = new Set(args.sources.map((s) => s.id));
    // code check: a suggestion must rest on one of the student's own sources, never an invented one
    const suggestions = data.suggestions
      .filter((s) => ids.has(s.sourceId))
      .map((s) => ({ ...s, text: s.text.replace(/\s*\([^)]*\d{4}[^)]*\)\s*/g, " ").trim() }))
      .slice(0, 3);
    return { suggestions, mode: "ai", model };
  } catch (e) {
    if (e instanceof AiUnavailable) return { suggestions: [], mode: "offline" };
    throw e;
  }
}
