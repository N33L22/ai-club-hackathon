import type { Person } from "@/core/types";

const PARTICLES = new Set(["van", "von", "de", "der", "den", "da", "del", "della", "di", "du", "la", "le", "dos", "das", "ter", "ten", "bin", "al"]);
const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv"]);

/** Split a display name ("Andrew K. Przybylski", "Kelly, Yvonne J.") into family and given names. */
export function splitName(display: string): Person {
  const name = display.replace(/\s+/g, " ").trim();
  if (!name) return { family: "Unknown" };
  if (name.includes(",")) {
    const [family, given] = name.split(",", 2).map((s) => s.trim());
    return given ? { family, given } : { family };
  }
  const parts = name.split(" ");
  while (parts.length > 1 && SUFFIXES.has(parts[parts.length - 1].toLowerCase())) parts.pop();
  if (parts.length === 1) return { family: parts[0] };
  let i = parts.length - 1;
  while (i > 1 && PARTICLES.has(parts[i - 1].toLowerCase())) i--;
  return { family: parts.slice(i).join(" "), given: parts.slice(0, i).join(" ") };
}
