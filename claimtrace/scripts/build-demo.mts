/**
 * Builds the demo project from LIVE Verifier results (no hand-written outputs).
 * Usage: start the app (npm run dev), then: npx tsx scripts/build-demo.mts [baseUrl]
 * Writes src/lib/demo-data.json.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = path.join(import.meta.dirname, "..", "src", "lib", "demo-data.json");

type Ref = { id: string; doi?: string; raw?: string; folder: "core" | "check"; tags: string[]; notes?: string };

const REFS: Ref[] = [
  { id: "twenge", doi: "10.1177/2167702617723376", folder: "core", tags: ["survey", "US"] },
  { id: "riehm", doi: "10.1001/jamapsychiatry.2019.2325", folder: "core", tags: ["cohort", "US"] },
  { id: "kelly", doi: "10.1016/j.eclinm.2018.12.005", folder: "core", tags: ["cohort", "UK"] },
  { id: "keles", doi: "10.1080/02673843.2019.1590851", folder: "core", tags: ["systematic review"] },
  { id: "orben", doi: "10.1038/s41562-018-0506-1", folder: "core", tags: ["large-scale"], notes: "No abstract in OpenAlex. Paste the abstract I read to check claims." },
  {
    id: "przybylski",
    raw: "Przybylski, A. K., & Weinstein, N. (2014). A large-scale test of the Goldilocks hypothesis: Quantifying the relations between digital-screen use and the mental well-being of adolescents. Psychological Science.",
    folder: "check",
    tags: ["screen time"],
    notes: "Reference copied from an old reading list.",
  },
  {
    id: "thompson",
    raw: "Thompson, R., & Okafor, L. (2021). Instagram use and adolescent anxiety: A meta-analysis of 48 studies. Journal of Adolescent Digital Health, 12(3), 201-219. https://doi.org/10.1016/j.jadh.2021.03.007",
    folder: "check",
    tags: ["from chatbot"],
    notes: "Suggested by a chatbot. Check before citing.",
  },
  { id: "lv", doi: "10.3389/fpsyg.2022.859597", folder: "check", tags: ["algorithms"] },
];

async function post(p: string, body: unknown) {
  const res = await fetch(`${BASE}/api/${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(`${p}: ${JSON.stringify(json)}`);
  return json;
}

const at = "2026-11-24T21:00:00.000Z";
const sources: unknown[] = [];

for (const r of REFS) {
  const reference = r.doi ? { doi: r.doi } : { raw: r.raw };
  const res = await post("sources/verify", { reference });
  const parsedYear = r.raw?.match(/\((\d{4})\)/)?.[1];
  const record = res.record ?? {
    title: r.raw!.split(/\(\d{4}\)\.\s*/)[1]?.split(". ")[0] ?? r.raw,
    authors: [{ family: "Thompson", given: "R." }, { family: "Okafor", given: "L." }],
    year: parsedYear ? Number(parsedYear) : undefined,
    venue: "Journal of Adolescent Digital Health",
    doi: "10.1016/j.jadh.2021.03.007",
    foundIn: [],
  };
  sources.push({
    id: `demo-src-${r.id}`,
    projectId: "demo-project",
    origin: "database",
    record,
    entered: r.raw ? { raw: r.raw } : undefined,
    verification: res.verification,
    folderId: `demo-folder-${r.folder}`,
    tags: r.tags,
    notes: r.notes ?? "",
    addedAt: at,
    approvedAt: at,
  });
  console.log(r.id.padEnd(11), res.verification.status, "|", (record.title ?? "").slice(0, 70));
}

sources.push({
  id: "demo-src-who",
  projectId: "demo-project",
  origin: "student",
  record: {
    title: "Mental health of adolescents",
    authors: [{ family: "World Health Organization" }],
    year: 2024,
    url: "https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health",
    venue: "WHO fact sheets",
    type: "webpage",
    foundIn: [],
  },
  verification: {
    status: "student_added",
    reason: "Added by you without a DOI or database record. Not verified.",
    steps: [
      { id: "exists", state: "skip", title: "Not looked up", detail: "Web pages and reports without a DOI are not in Crossref or OpenAlex." },
      { id: "matches", state: "skip", title: "Details", detail: "Entered by you: please double-check the URL, author and date." },
      { id: "retraction", state: "skip", title: "Retraction", detail: "Not applicable." },
    ],
    checkedAt: at,
  },
  accessedAt: "2026-11-24T00:00:00.000Z",
  folderId: "demo-folder-check",
  tags: ["statistics", "web"],
  notes: "",
  addedAt: at,
  approvedAt: at,
});

const t = (text: string) => ({ type: "text", text });
const c = (id: string) => ({ type: "citation", attrs: { id: `demo-src-${id}` } });
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const h = (text: string) => ({ type: "heading", attrs: { level: 2 }, content: [t(text)] });

const doc = {
  type: "doc",
  content: [
    h("Introduction"),
    p(
      t("Concern about adolescents' social media use has grown alongside reports of rising depression. In a large US survey study, depressive symptoms and suicide rates among adolescents rose between 2010 and 2015, especially among girls "),
      c("twenge"),
      t(". Smartphones and social media caused this rise in teenage depression "),
      c("twenge"),
      t("."),
    ),
    h("What longitudinal studies show"),
    p(
      t("US adolescents who used social media for more than three hours a day may be at heightened risk of internalising problems "),
      c("riehm"),
      t(". In the UK Millennium Cohort Study, the association between social media use and depressive symptoms was larger for girls than for boys "),
      c("kelly"),
      t(". A systematic review of 13 studies reported that all domains correlated with depression, anxiety and psychological distress in adolescents "),
      c("keles"),
      t('. Its authors warn of "considerable caveats due to methodological limitations of cross-sectional design, sampling and measures" '),
      c("keles"),
      t("."),
    ),
    h("A smaller effect than headlines suggest"),
    p(
      t("The association between digital technology use and adolescent well-being is negative but small "),
      c("orben"),
      t(". Moderate screen use may not be harmful at all "),
      c("przybylski"),
      t(". A meta-analysis of 48 studies concluded that Instagram use doubles the risk of anxiety in teenagers "),
      c("thompson"),
      t(". Adolescents also resist recommendation algorithms when they feel their freedom is threatened "),
      c("lv"),
      t(". Globally, one in seven 10 to 19-year-olds experiences a mental disorder "),
      c("who"),
      t("."),
    ),
  ],
};

const bundle = {
  project: {
    id: "demo-project",
    title: "Social media and adolescent mental health",
    question: "Does social media use harm adolescents' mental health, and how strong is the evidence?",
    style: "apa",
    createdAt: at,
    updatedAt: at,
    doc,
    isDemo: true,
  },
  sources,
  folders: [
    { id: "demo-folder-core", projectId: "demo-project", name: "Core evidence", createdAt: at },
    { id: "demo-folder-check", projectId: "demo-project", name: "To double-check", createdAt: at },
  ],
};

fs.writeFileSync(OUT, JSON.stringify(bundle, null, 1));
console.log("wrote", OUT, fs.statSync(OUT).size, "bytes");
