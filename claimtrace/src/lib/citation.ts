/**
 * Reference-list formatting with citation-js (CSL). Loaded lazily, only on
 * the pages that format or import references, to keep other pages light.
 */
import { toCsl } from "@/core/citation/csl";
import type { CitationStyleId, LibrarySource } from "@/core/model";
import type { Person, ReferenceInput } from "@/core/types";

type CiteModule = typeof import("@citation-js/core");
let loading: Promise<CiteModule> | null = null;

async function load(): Promise<CiteModule> {
  if (!loading) {
    loading = (async () => {
      const core = await import("@citation-js/core");
      await import("@citation-js/plugin-csl");
      await import("@citation-js/plugin-bibtex");
      await import("@citation-js/plugin-ris");
      const { MLA_9, IEEE } = await import("./csl/styles");
      const templates = core.plugins.config.get("@csl").templates;
      if (!templates.has("mla9")) templates.add("mla9", MLA_9);
      if (!templates.has("ieee")) templates.add("ieee", IEEE);
      return core;
    })();
  }
  return loading;
}

const TEMPLATE: Record<CitationStyleId, string> = {
  apa: "apa",
  harvard: "harvard1",
  mla: "mla9",
  ieee: "ieee",
  vancouver: "vancouver",
};

export interface FormattedEntry {
  id: string;
  html: string;
  text: string;
}

const ALLOWED = new Set(["I", "EM", "B", "STRONG", "SUP", "SUB", "SPAN"]);
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Rebuilds formatter output from an allow-list (italics, bold, super/subscript,
 * text): titles come from external databases and student input, so no other
 * markup or attributes survive.
 */
function sanitizeInline(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) out += escapeHtml(child.textContent ?? "");
    else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const inner = sanitizeInline(el);
      if (ALLOWED.has(el.tagName) && el.tagName !== "SPAN") out += `<${el.tagName.toLowerCase()}>${inner}</${el.tagName.toLowerCase()}>`;
      else out += el.tagName === "DIV" ? `${inner} ` : inner; // numeric styles put "[1]" in its own block
    }
  });
  return out;
}

/** Formatted reference list, one entry per source, in the style's own order. */
export async function formatReferences(sources: LibrarySource[], style: CitationStyleId): Promise<FormattedEntry[]> {
  if (!sources.length) return [];
  const { Cite } = await load();
  const cite = new Cite(sources.map(toCsl));
  const html = cite.format("bibliography", { format: "html", template: TEMPLATE[style], lang: "en-US" });
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll(".csl-entry")].map((el) => {
    const clean = sanitizeInline(el).replace(/\s+/g, " ").trim();
    const text = clean
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
    return { id: el.getAttribute("data-csl-entry-id") ?? "", html: clean, text };
  });
}

export async function exportFormat(sources: LibrarySource[], format: "bibtex" | "ris"): Promise<string> {
  const { Cite } = await load();
  return new Cite(sources.map(toCsl)).format(format === "bibtex" ? "bibtex" : "ris", { format: "text" });
}

/** Parse a BibTeX or RIS file into references to verify. */
export async function parseImport(text: string): Promise<ReferenceInput[]> {
  const { Cite } = await load();
  const cite = await Cite.async(text);
  return cite.data.map((item) => {
    const authors = (item.author as Array<{ family?: string; given?: string; literal?: string }> | undefined)
      ?.map((a): Person | null => (a.family ? { family: a.family, given: a.given } : a.literal ? { family: a.literal } : null))
      .filter((a): a is Person => a !== null);
    const issued = item.issued as { "date-parts"?: number[][] } | undefined;
    return {
      doi: typeof item.DOI === "string" ? item.DOI : undefined,
      title: typeof item.title === "string" ? item.title : undefined,
      authors: authors?.length ? authors : undefined,
      year: issued?.["date-parts"]?.[0]?.[0],
    };
  });
}
