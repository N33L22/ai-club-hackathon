/**
 * Extracts cited claims from the editor document (ProseMirror/TipTap JSON).
 * A claim is a sentence that contains at least one citation node.
 * Positions are ProseMirror positions so the editor can underline each claim.
 */
import { stableHash } from "../hash";
import { normalizeText, tidy } from "../text/normalize";
import { CITE_MARK, splitSentenceSpans } from "../text/sentences";
import { directQuoteIn } from "./quote";

export interface DocNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
}

export interface DraftClaim {
  key: string;
  text: string;
  sourceIds: string[];
  from: number;
  to: number;
  paragraph: number;
  quote: string | null;
}

export const CITATION_NODE = "citation";
const TEXTBLOCKS = new Set(["paragraph", "heading"]);

function nodeSize(n: DocNode): number {
  if (n.type === "text") return n.text?.length ?? 0;
  if (!n.content || n.content.length === 0) {
    // inline leaves (citation, hardBreak) take one position; empty blocks take two
    return n.type === CITATION_NODE || n.type === "hardBreak" || n.type === "image" ? 1 : 2;
  }
  return 2 + n.content.reduce((s, c) => s + nodeSize(c), 0);
}

export function claimKey(text: string, sourceIds: string[]): string {
  return stableHash(`${normalizeText(text)}|${[...sourceIds].sort().join(",")}`);
}

const hasWords = (s: string) => s.replace(new RegExp(CITE_MARK, "g"), "").replace(/[^a-z0-9]/gi, "").length >= 3;

function processTextblock(block: DocNode, contentStart: number, paragraph: number, out: DraftClaim[]) {
  // `plain` holds the paragraph text with one CITE_MARK character per citation,
  // and posAt maps every character back to its ProseMirror position.
  let plain = "";
  const posAt: number[] = [];
  const citeAt = new Map<number, string>();
  let pos = contentStart;
  for (const child of block.content ?? []) {
    if (child.type === "text" && child.text) {
      for (let i = 0; i < child.text.length; i++) {
        plain += child.text[i];
        posAt.push(pos + i);
      }
      pos += child.text.length;
    } else if (child.type === CITATION_NODE) {
      const id = String(child.attrs?.id ?? "");
      if (id) citeAt.set(plain.length, id);
      plain += CITE_MARK;
      posAt.push(pos);
      pos += 1;
    } else {
      plain += " "; // hard break or unknown inline
      posAt.push(pos);
      pos += nodeSize(child);
    }
  }
  if (!citeAt.size) return;

  const spans = splitSentenceSpans(plain);
  if (!spans.length) return;

  // a span made only of citations ("... anxiety. [cite]") belongs to the sentence before it
  const target = spans.map((s, i) => i);
  for (let i = 0; i < spans.length; i++) {
    if (!hasWords(spans[i].text)) {
      let j = i - 1;
      while (j >= 0 && !hasWords(spans[j].text)) j--;
      if (j < 0) {
        j = i + 1;
        while (j < spans.length && !hasWords(spans[j].text)) j++;
      }
      target[i] = j >= 0 && j < spans.length ? j : i;
    }
  }

  const grouped = new Map<number, string[]>();
  for (const [offset, id] of citeAt) {
    const i = spans.findIndex((s) => offset >= s.start && offset < s.end);
    if (i < 0) continue;
    const t = target[i];
    const list = grouped.get(t) ?? [];
    if (!list.includes(id)) list.push(id);
    grouped.set(t, list);
  }

  for (const [i, ids] of grouped) {
    const span = spans[i];
    if (!hasWords(span.text)) continue;
    const text = tidy(span.text.replace(new RegExp(CITE_MARK, "g"), " "));
    const from = posAt[span.start] ?? contentStart;
    const to = (posAt[span.end - 1] ?? from) + 1;
    out.push({ key: claimKey(text, ids), text, sourceIds: ids, from, to, paragraph, quote: directQuoteIn(text) });
  }
}

export function extractClaims(doc: DocNode | null | undefined): DraftClaim[] {
  const out: DraftClaim[] = [];
  if (!doc?.content) return out;
  let paragraph = 0;
  const walk = (node: DocNode, pos: number) => {
    if (node.type === "heading") return; // a heading is not a claim (its size is still counted by the caller)
    if (TEXTBLOCKS.has(node.type)) {
      processTextblock(node, pos + 1, paragraph++, out);
      return;
    }
    let p = pos + 1;
    for (const c of node.content ?? []) {
      walk(c, p);
      p += nodeSize(c);
    }
  };
  let pos = 0;
  for (const child of doc.content) {
    walk(child, pos);
    pos += nodeSize(child);
  }
  // the same sentence can't appear twice with the same key; keep the first
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
}

/** Plain text of the document with citation nodes rendered by `render`. */
export function docToText(doc: DocNode | null | undefined, render: (id: string) => string): string {
  if (!doc?.content) return "";
  const blocks: string[] = [];
  const walk = (node: DocNode) => {
    if (TEXTBLOCKS.has(node.type)) {
      let s = "";
      for (const c of node.content ?? []) {
        if (c.type === "text") s += c.text ?? "";
        else if (c.type === CITATION_NODE) s += render(String(c.attrs?.id ?? ""));
        else s += " ";
      }
      blocks.push(tidy(s));
      return;
    }
    for (const c of node.content ?? []) walk(c);
  };
  for (const c of doc.content) walk(c);
  return blocks.filter(Boolean).join("\n\n");
}
