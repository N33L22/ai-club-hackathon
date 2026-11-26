import { normalizeText } from "./normalize";

export const STOPWORDS = new Set(
  (
    "a about above after again against all am an and any are as at be because been before being below between both but by " +
    "can could did do does doing down during each few for from further had has have having he her here hers herself him " +
    "himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our " +
    "ours ourselves out over own same she should so some such than that the their theirs them themselves then there these " +
    "they this those through to too under until up very was we were what when where which while who whom why will with " +
    "would you your yours yourself yourselves also however thus therefore whereas within among amongst via per et al " +
    "using used use may might one two three study studies paper research results result findings finding found show shows " +
    "showed shown suggest suggests suggested evidence data analysis article review"
  ).split(" "),
);

const SUFFIXES = [
  "ational", "ation", "ating", "ated", "ates", "ate", "ence", "ance", "ness", "ment", "ive",
  "ing", "ion", "ity", "ent", "ed", "ly", "er", "al", "e",
];

/**
 * Light English stemmer. Consistency matters more than linguistics here:
 * "associated", "association" and "associate" all become "associ".
 */
export function stem(word: string): string {
  let w = word;
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (/(sses|xes|ches|shes|zes)$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && !/(ss|us|is|ys)$/.test(w)) w = w.slice(0, -1);
  for (const suf of SUFFIXES) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) return w.slice(0, -suf.length);
  }
  return w;
}

export function words(s: string): string[] {
  const n = normalizeText(s);
  return n ? n.split(" ") : [];
}

export function contentWords(s: string): string[] {
  return words(s).filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Words that findings use interchangeably ("teen" and "adolescent", "rose" and
 * "increased"). Folding them together lets the evidence checks see that
 * "teen depression rose" and "adolescents' depression increased" are about the
 * same thing. Used only by stems() (evidence ranking, relevance and grounding),
 * never by the Verifier's title and author matching, which must stay literal.
 */
const CONCEPTS: Record<string, string> = {};
for (const [canonical, forms] of Object.entries({
  adolesc: ["teen", "teenag", "adolesc", "youth", "igen"],
  increas: ["rise", "rose", "rising", "risen", "increas", "grow", "grew", "growth", "climb"],
  decreas: ["decreas", "declin", "drop", "dropp", "fall", "fell", "reduc", "reduct"],
  child: ["child", "children", "kid"],
  associ: ["associ", "correl", "link", "relat"],
  anxi: ["anxi", "anxious"],
  girl: ["girl", "femal"],
  boy: ["boy", "male"],
})) {
  for (const f of forms) CONCEPTS[f] = canonical;
}

/** Content-word stems for evidence matching, with interchangeable findings words folded together. */
export function stems(s: string): string[] {
  return contentWords(s).map((w) => {
    const st = stem(w);
    return CONCEPTS[st] ?? st;
  });
}

export function numbersIn(s: string): string[] {
  return (s.replace(/(\d),(\d{3})/g, "$1$2").match(/\d+(\.\d+)?/g) ?? []).filter((n) => n.length > 1 || Number(n) > 0);
}
