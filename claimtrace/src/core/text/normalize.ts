/** Text normalisation helpers. Pure and deterministic. */

const QUOTES: Array<[RegExp, string]> = [
  [/[‘’‚‛′]/g, "'"],
  [/[“”„‟″]/g, '"'],
  [/[‐-―−]/g, "-"],
  [/…/g, "..."],
  [/[    ]/g, " "],
];

/** Curly quotes, dashes, ellipses and odd spaces to plain ASCII equivalents. */
export function unifyPunctuation(s: string): string {
  let out = s;
  for (const [re, rep] of QUOTES) out = out.replace(re, rep);
  return out;
}

export function foldDiacritics(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/** Lower-case words and digits separated by single spaces: for fuzzy comparisons. */
export function normalizeText(s: string): string {
  return foldDiacritics(unifyPunctuation(s))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Keeps punctuation but folds case, quotes and whitespace: for quote comparisons. */
export function normalizeForQuote(s: string): string {
  return unifyPunctuation(s)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/^["'\s]+|["'\s.]+$/g, "")
    .trim();
}

/** Database titles of retracted papers often start with "RETRACTED:". */
export function stripRetractedPrefix(title: string): string {
  return title.replace(/^\s*(retracted|withdrawn|retraction|expression of concern)\s*(article)?\s*[:\-–—.]\s*/i, "");
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Remove HTML/JATS tags and decode common entities (titles and abstracts). */
export function cleanMarkup(html: string): string {
  return html
    .replace(/<jats:title>[^<]*<\/jats:title>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[code.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Abstract text: markup removed, plus any leading "Abstract" label. */
export function stripTags(html: string): string {
  return cleanMarkup(html).replace(/^(abstract|summary)\s*[:.]?\s+/i, "").trim();
}

const DOI_RE = /10\.\d{4,9}\/[^\s"<>]+/i;

/** Find a DOI inside any string (URL, "doi:" prefix or bare). Lower-cased. */
export function extractDoi(text: string | undefined | null): string | undefined {
  if (!text) return undefined;
  let decoded = text;
  try {
    decoded = decodeURIComponent(text.replace(/%(?![0-9a-f]{2})/gi, "%25"));
  } catch {
    // malformed escape sequence: search the raw text instead
  }
  const m = DOI_RE.exec(decoded);
  if (!m) return undefined;
  let doi = m[0].replace(/[.,;:\]}>'"]+$/, "");
  // DOIs may contain brackets, e.g. 10.1016/S0140-6736(97)11096-0: only drop an unbalanced ")"
  const count = (ch: string) => doi.split(ch).length - 1;
  while (doi.endsWith(")") && count(")") > count("(")) doi = doi.slice(0, -1).replace(/[.,;:]+$/, "");
  return doi.toLowerCase();
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}

/** Collapse whitespace and tidy spaces before punctuation (display text). */
export function tidy(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\s+([,.;:!?)])/g, "$1").replace(/[,;:]+\./g, ".").replace(/\(\s+/g, "(").trim();
}
