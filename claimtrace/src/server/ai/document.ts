import "server-only";
import { z } from "zod";
import { codeDocumentIdea, type DocumentIdea } from "@/core/document-idea";
import { AiUnavailable, chatJson } from "./client";
import { DOCUMENT_SYSTEM, documentUser } from "./prompts";

const DocumentReply = z.object({
  title: z.string().trim().min(2),
  question: z.string().trim().min(8),
  area: z.string().trim().min(2),
});

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}…` : s);

/**
 * The Scout reads the opening of a document the student chose and suggests a project title,
 * a research question and the research area. The student edits them before anything is
 * created. Without the AI, the suggestion comes from the document's own text (code).
 */
export async function ideaFromDocument(args: { text: string; metaTitle?: string; fileName?: string }): Promise<DocumentIdea> {
  try {
    const { data, model } = await chatJson(
      [
        { role: "system", content: DOCUMENT_SYSTEM },
        { role: "user", content: documentUser(args) },
      ],
      DocumentReply,
      { maxTokens: 300 },
    );
    const question = clip(data.question, 300);
    return {
      title: clip(data.title, 90),
      question: /[?]$/.test(question) ? question : `${question.replace(/[.!]+$/, "")}?`,
      area: clip(data.area, 80),
      mode: "ai",
      model,
    };
  } catch (e) {
    if (e instanceof AiUnavailable) return codeDocumentIdea(args.text, args.metaTitle, args.fileName);
    throw e;
  }
}
