/**
 * Reads the opening text of a PDF, Word (.docx) or text file in the browser, for
 * "Start from a document". The file itself is never uploaded or stored.
 */

export interface DocumentText {
  text: string;
  /** The title stored in the file's own metadata, when it has one. */
  metaTitle?: string;
  kind: "pdf" | "docx" | "txt";
}

/** A reason the file could not be read, worded for the student. */
export class DocumentReadError extends Error {}

/** Enough for a title, an abstract or a brief; only this much is ever sent for a suggestion. */
export const MAX_CHARS = 6000;
const MAX_BYTES = 25 * 1024 * 1024;

export const ACCEPTED = ".pdf,.docx,.txt,.md,application/pdf,text/plain";

const clip = (s: string) =>
  s
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\n[\s]*/g, "\n")
    .trim()
    .slice(0, MAX_CHARS);

export async function readDocumentText(file: File): Promise<DocumentText> {
  const name = file.name.toLowerCase();
  if (file.size > MAX_BYTES) throw new DocumentReadError("That file is over 25 MB. Try a smaller file, or type the title yourself.");
  if (name.endsWith(".pdf") || file.type === "application/pdf") return readPdf(file);
  if (name.endsWith(".docx")) return readDocx(file);
  if (name.endsWith(".doc")) throw new DocumentReadError("Older Word files (.doc) can't be read here. Save it as .docx or PDF and try again.");
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    const text = clip(await file.text());
    if (text.length < 40) throw new DocumentReadError("That file has too little text to suggest a question from.");
    return { text, kind: "txt" };
  }
  throw new DocumentReadError("Use a PDF, a Word file (.docx) or a text file (.txt).");
}

// ---------- PDF (pdf.js, served from /vendor/pdfjs) ----------

interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
}
interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<{ getTextContent(): Promise<{ items: PdfTextItem[] }> }>;
  getMetadata(): Promise<{ info?: { Title?: string } }>;
  destroy(): Promise<void>;
}
interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { data: ArrayBuffer }): { promise: Promise<PdfDocument> };
}

// pdf.js is copied from pdfjs-dist 4.10.38 (legacy build, Apache-2.0) into public/vendor/pdfjs and
// loaded at run time, so the bundler never processes it. A Function-built import() keeps it that way.
const importUrl = new Function("url", "return import(url)") as (url: string) => Promise<PdfJs>;
let pdfjs: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  pdfjs ??= importUrl(new URL("/vendor/pdfjs/pdf.min.js", window.location.origin).href).then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = new URL("/vendor/pdfjs/pdf.worker.min.js", window.location.origin).href;
    return lib;
  });
  return pdfjs;
}

async function readPdf(file: File): Promise<DocumentText> {
  let lib: PdfJs;
  try {
    lib = await loadPdfJs();
  } catch {
    pdfjs = null;
    throw new DocumentReadError("The PDF reader could not load. Try again, or use a Word or text file.");
  }
  let doc: PdfDocument;
  try {
    doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch {
    throw new DocumentReadError("This PDF could not be opened. It may be damaged or password-protected.");
  }
  try {
    const meta = await doc.getMetadata().catch(() => null);
    let text = "";
    for (let p = 1; p <= Math.min(doc.numPages, 5) && text.length < MAX_CHARS; p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      text += content.items.map((it) => (it.str ?? "") + (it.hasEOL ? "\n" : " ")).join("") + "\n";
    }
    text = clip(text);
    if (text.replace(/\s+/g, "").length < 40) {
      throw new DocumentReadError("This PDF has no readable text: it looks like a scanned image. Use a PDF with selectable text or a Word file, or type the title yourself.");
    }
    return { text, metaTitle: meta?.info?.Title?.trim() || undefined, kind: "pdf" };
  } finally {
    void doc.destroy();
  }
}

// ---------- Word (.docx): a zip; word/document.xml holds the text ----------

const decodeXml = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** Reads one file out of a zip using its central directory (stored or deflate), with the browser's own decompressor. */
async function unzipEntry(zip: Uint8Array<ArrayBuffer>, name: string): Promise<string> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("not a zip file");
  const count = view.getUint16(end + 10, true);
  let p = view.getUint32(end + 16, true);
  const utf8 = new TextDecoder();
  for (let k = 0; k < count && view.getUint32(p, true) === 0x02014b50; k++) {
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    if (utf8.decode(zip.subarray(p + 46, p + 46 + nameLen)) === name) {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const data = zip.subarray(start, start + size);
      if (method === 0) return utf8.decode(data);
      if (method !== 8) throw new Error("unsupported compression");
      return await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} not found`);
}

async function readDocx(file: File): Promise<DocumentText> {
  const zip = new Uint8Array(await file.arrayBuffer());
  let xml: string;
  try {
    xml = await unzipEntry(zip, "word/document.xml");
  } catch {
    throw new DocumentReadError("This Word file could not be read. Save it again as .docx or PDF and try again.");
  }
  const core = await unzipEntry(zip, "docProps/core.xml").catch(() => "");
  const metaTitle = decodeXml(/<dc:title>([^<]*)<\/dc:title>/.exec(core)?.[1] ?? "").trim();
  const text = clip(decodeXml(xml.replace(/<w:tab\/>/g, " ").replace(/<w:br\/>|<\/w:p>/g, "\n").replace(/<[^>]+>/g, "")));
  if (text.length < 40) throw new DocumentReadError("That Word file has too little text to suggest a question from.");
  return { text, metaTitle: metaTitle || undefined, kind: "docx" };
}
