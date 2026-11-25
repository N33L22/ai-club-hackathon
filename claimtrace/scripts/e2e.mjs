/**
 * End-to-end smoke test of the full research journey in a real browser.
 *
 *   node scripts/e2e.mjs [baseUrl] [screenshotDir]
 *
 * Needs a running app (npm run build && npm start) and Google Chrome.
 * Set CHROME_PATH if Chrome is not in the default Windows location.
 * Exits non-zero if a step fails or the page logs an error.
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOTS = process.argv[3];
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

let failed = 0;
async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    console.log(`  ok   ${name} (${Date.now() - t} ms)`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}: ${e.message}`);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `fail-${name.replace(/\W+/g, "-")}.png`) });
  }
}
const shot = async (name, full = false) => SHOTS && page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
// visible text plus the contents of text areas, case-insensitive (CSS may upper-case headings)
const pageText = () =>
  `${document.body.innerText}\n${[...document.querySelectorAll("textarea")].map((t) => t.value).join("\n")}`.toLowerCase();
const text = () => page.evaluate(pageText);
const waitText = (t, timeout = 30000) =>
  page.waitForFunction(new Function("s", `return (${pageText.toString()})().includes(s)`), { timeout }, t.toLowerCase());
async function click(label, { exact = false, nth = 0 } = {}) {
  const el = await page.waitForFunction(
    (l, ex, n) => {
      const els = [...document.querySelectorAll("button, a, [role=tab], [role=menuitem], [role=option]")].filter((e) => {
        const t = e.textContent?.replace(/\s+/g, " ").trim() ?? "";
        return (ex ? t === l : t.includes(l)) && e.getBoundingClientRect().width > 0 && !e.disabled;
      });
      return els[n] ?? null;
    },
    { timeout: 20000 },
    label,
    exact,
    nth,
  );
  const handle = el.asElement();
  // tabs (Radix) activate on pointer down, so they need a real click; elsewhere a DOM click
  // is safer because cards resize while results stream in and coordinates can go stale
  if ((await handle.evaluate((b) => b.getAttribute("role"))) === "tab") await handle.click();
  else await handle.evaluate((b) => b.click());
}
const count = (label) =>
  page.evaluate((l) => [...document.querySelectorAll("button")].filter((b) => b.textContent?.includes(l) && !b.disabled).length, label);

console.log(`ClaimTrace end-to-end test against ${BASE}`);

await step("landing page renders", async () => {
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await waitText("traced");
  await shot("01-landing");
});

await step("demo project opens from the landing page", async () => {
  await click("See it check a real draft");
  await page.waitForFunction(() => location.pathname === "/app/overview", { timeout: 20000 });
  await waitText("Social media and adolescent mental health");
  await shot("02-overview");
});

await step("search: plan, approve, save two sources", async () => {
  await page.goto(`${BASE}/app/search`, { waitUntil: "networkidle2" });
  await click("Plan the search");
  await waitText("Approve plan and search");
  await click("Approve plan and search");
  await waitText("real records from OpenAlex", 60000);
  const boxes = await page.$$("button[role=checkbox]");
  if (boxes.length < 2) throw new Error("fewer than two selectable results");
  await boxes[0].evaluate((b) => b.click());
  await boxes[1].evaluate((b) => b.click());
  await shot("03-search");
  await click("Approve and save");
  await waitText("Saved 2 sources");
});

await step("library: paste a chatbot reference list and add it", async () => {
  await page.goto(`${BASE}/app/library`, { waitUntil: "networkidle2" });
  await click("Add sources");
  await click("Reference list");
  await page.type(
    "textarea",
    "Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263-291.\n\nMartinez, L., & Chen, W. (2022). Social media detox and adolescent sleep quality: A randomized controlled trial of 1,200 students. Journal of Youth Digital Wellbeing, 8(2), 45-61.",
  );
  await click("Check references");
  await waitText("No matching record", 60000);
  const t = await text();
  if (!t.includes("verified")) throw new Error("the real reference was not verified");
  await shot("04-reference-list");
  await click("Add 1");
  await waitText("Added 1 reference");
});

await step("review: check all claims", async () => {
  await page.goto(`${BASE}/app/review`, { waitUntil: "networkidle2" });
  // the button reads "Check N claims": only claims whose sources can be support-checked are counted
  const n = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /^Check \d+ claims?$/.test(x.textContent?.trim() ?? ""));
    b?.click();
    return Number(b?.textContent?.match(/\d+/)?.[0] ?? 0);
  });
  if (!n) throw new Error("no 'Check N claims' button");
  await waitText(`Checked ${n} claim`, 120000);
  await shot("05-review", true);
});

await step("review: resolve every flag (checkpoint 2)", async () => {
  // page number for the direct quotation
  const page_ = await page.$("input[placeholder='p. 81']");
  if (!page_) throw new Error("no page-number field for the direct quote");
  await page_.type("p. 84");
  // acknowledge every unchecked or student-added claim
  for (let i = 0; i < 15; i++) {
    const before = await count("Acknowledge");
    if (!before) break;
    await click("Acknowledge", { exact: true });
    // wait for the decision to register (cards animate to their new state)
    await page.waitForFunction((n) => [...document.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "Acknowledge").length < n, { timeout: 5000 }, before);
  }
  // keep every remaining flag with a reason
  for (let i = 0; i < 8 && (await count("Keep anyway")); i++) {
    await click("Keep anyway");
    await page.waitForSelector("[role=dialog] textarea");
    await page.type("[role=dialog] textarea", "Kept for the e2e test: discussed as a flagged example in the essay.");
    await click("Keep with this reason");
    await page.waitForFunction(() => !document.querySelector("[role=dialog]"), { timeout: 5000 });
  }
  await waitText("0 need a decision");
});

await step("export: sign off unlocks export (checkpoint 3)", async () => {
  await page.goto(`${BASE}/app/export`, { waitUntil: "networkidle2" });
  await page.$eval("button[role=checkbox]", (b) => b.click());
  await page.type("input[placeholder='Your full name']", "Team 6 tester");
  await click("Sign off", { exact: true });
  await waitText("Export unlocked");
  await click("AI-use statement");
  await waitText("All final wording");
  await shot("06-export");
});

await step("integrity report renders", async () => {
  await page.goto(`${BASE}/app/report`, { waitUntil: "networkidle2" });
  await waitText("References and verification");
  await shot("07-report", true);
});

await step("audit log recorded the journey", async () => {
  await page.goto(`${BASE}/app/audit`, { waitUntil: "networkidle2" });
  const t = await text();
  for (const s of ["checkpoint 1", "signed off", "kept the"]) if (!t.includes(s)) throw new Error(`audit log is missing "${s}"`);
  await shot("08-audit");
});

const real = errors.filter((e) => !/Download the React DevTools/.test(e));
if (real.length) {
  failed++;
  console.log(`  FAIL browser console errors:\n    ${[...new Set(real)].slice(0, 8).join("\n    ")}`);
} else console.log("  ok   no browser console errors");

await browser.close();
console.log(failed ? `\n${failed} step(s) failed` : "\nAll steps passed");
process.exit(failed ? 1 : 0);
