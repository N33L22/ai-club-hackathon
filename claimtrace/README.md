# ClaimTrace

**Every claim, traced to its source.** A reference manager and AI research assistant that checks every citation: does the paper exist, do its details match, has it been retracted, and does the source actually say what the sentence says?

AI Club Hackathon 2026 · Team 6 · Neel, Mohit and Anand

> AI suggests. Code checks. The student decides.

## What it does

| Workflow step | Who | What happens |
|---|---|---|
| 1. Ask | Student | A project starts from a research question and a citation style. |
| 2. Search | AI Scout | Turns the question into a search plan. OpenAlex returns **real records only**. |
| 3. Approve | Student | **Checkpoint 1:** approve the plan and choose sources; folders, tags, notes. |
| 4. Write | Student | A manuscript editor. Type `@` to cite; every cited sentence becomes a claim, underlined in its label's colour. |
| 5. Verify | Code | Exists, matches (DOI first) and retraction status, against Crossref and OpenAlex. No AI. |
| 6. Challenge | AI Skeptic + code | The Skeptic picks the supporting sentence and a verdict; **code accepts it only if it is a whole sentence of the source and about the claim**. |
| 7. Decide | Student | **Checkpoints 2 and 3:** resolve every flag, then sign off. Only then does export unlock. |

The AI has three narrow roles: the **Scout** plans searches, the **Skeptic** challenges claims, and the **Assistant** explains a source with every point linked to a sentence. None of them can approve a source, write a reference or edit the draft.

Exports: reference list in APA 7, Harvard, MLA 9, IEEE or Vancouver (with a "Reference checks" section listing every reference that is not plainly verified); BibTeX and RIS; the draft with formatted citations; an auto-generated **AI-use statement**; a printable **integrity report**; the full **audit log** (JSON/CSV); a **project file** to move a project between browsers.

**Suggest what to write:** in the editor, the Assistant suggests sentences built only from the abstracts of sources in your library, each naming its source and labelled "AI suggestion". Nothing enters the draft until you click Insert, and inserted sentences are checked on Review like every claim.

**Start from a document:** drop a PDF, Word or text file into **New project** and ClaimTrace suggests the project's title, research question and area from it (labelled as a suggestion; you edit before creating). The text is read in your browser; only the first few thousand characters go to the AI.

Around the workflow: **Previous / Next** buttons at the bottom of each page follow the steps in order; the draft saves as you type, and **Save draft** (Ctrl+S) saves at once; a project can be edited, exported, imported or deleted (deleting asks first and offers to export a copy).

## Trust labels

| On a reference | Meaning |
|---|---|
| **Verified** | A real Crossref/OpenAlex record whose title, first author and year match. About the reference, not what it says. |
| **Close match** | A record was found but details differ. Compare side by side, then confirm. |
| **Not found** | Both databases answered and neither has it (or the DOI belongs to another paper). |
| **Not yet verified** | Couldn't check: a database did not answer, so the check did not finish. Never reported as Not found or Verified. |
| **Retracted** · **Student-added** | Retracted paper; web page or report added without a database record. |

| On a claim | Meaning |
|---|---|
| **Supported** | The AI judged a sentence of the abstract supports it, and code confirmed that whole sentence is in the source and shares the claim's key terms. Sentence found, not "true". |
| **Supported · your text** | The same, but the evidence came from text the student pasted. Needs an acknowledgement, and the report says where it came from. |
| **Overreach** · **Not supported** | The claim goes further than the source, or the source does not say it. Needs a decision with a reason. |
| **Unchecked** | No text to check against, or the AI was unavailable. Never shown as Supported. |

## Phase 2 edge cases: which step of our design handles each

The organisers' test pack (eight pasted references, three requests) runs through the same workflow as the deck: 2 Search (Scout), 3 Approve (checkpoint 1), 5 Verify (code), 6 Challenge (Skeptic), 7 Decide (checkpoints 2 and 3). No rule is written for the pack's references.

| Case | What ClaimTrace shows | Step and guardrail |
|---|---|---|
| 1. Invented reference | **Not found**, saying it looked in Crossref and OpenAlex; never swapped for a similar paper | 5 Verify (code) · guardrails 01 retrieval-only and 05 honest Not found |
| 2. Real DOI, wrong paper | **Mismatch**: what you pasted next to what the DOI points to; never passed because the DOI exists | 5 Verify · guardrail 02 metadata must match |
| 3. Small error (e.g. year) | **Close match** with your detail and the record's side by side; **Accept the fix** or **Reject the fix** | 5 Verify, then the student decides (checkpoint) |
| 4. Retracted paper | **Retracted** with date and who flagged it; unticked when adding; red in the `@` menu, exports and report | 5 Verify · guardrail 06 retraction + export gate |
| 5. Duplicate | "Duplicate of #N" with **Merge into #N**: one entry kept; exports never list a paper twice | 3 Approve (checkpoint 1) |
| 6. No source exists | **Ask the assistant** answers **Not found** and shows related real papers, each labelled; it cannot invent a source | 2 Search (Scout plans, OpenAlex returns real records only) · guardrail 01 |
| Bonus: no DOI | Found by title and authors | 5 Verify |
| Bonus: quote not in source | The quote is checked word for word; never confirmed without the text | 6 Challenge (Skeptic + code) · guardrail 03 |
| Bonus: database down | **Not yet verified** (couldn't check, try again) | 5 Verify |
| Bonus: instruction in a note | Notes and source text are data, never commands; a label changes only when a check runs | 5 and 6 |

Every reference shows its label in the library and in exports (copied lists carry it next to each entry), and the AI-use statement counts what was not verified.

## Day-of requirements (26 Nov)

Where each requirement is visible in the app, and what we changed on the day.

| Requirement | Where to see it | Changed on the day, and why |
|---|---|---|
| 1. Fake reference test | **Library → Add sources**: enter a made-up DOI, title or reference. It is checked live against Crossref and OpenAlex and shows **Not found** with the reason; a made-up DOI cannot be added at all. Or **Search → By title or DOI**: a made-up DOI shows **Not found**, and a made-up title gets "No paper has exactly this title". If a database does not answer, the label is **Not yet verified**, never Verified. | "Couldn't check" renamed **Not yet verified**: the brief's own wording for a live check that did not work. New **By title or DOI** search: find one specific paper without the AI. |
| 2. Trust labels on everything | Search results, the library, the editor's `@` menu, claim cards, the export list and the integrity report all show a named label. **What the labels mean** (tap to open) on Search, Library and Review; the full list is in Settings. | Search results now carry **From OpenAlex · not yet checked**; verified references show **Verified** in the export list; the `@` menu names each label instead of a coloured dot; the guide opens with a tap because hover tooltips do not work on phones. |
| 3. The user approves | Search: approve the plan, tick results, **Approve and save**. Add sources: **Add to library** or **Add N**. Nothing is added automatically, and each approval is logged as checkpoint 1. | Already built. |
| 4. Export in APA 7 | **Export → References**: APA 7 is the default; **Copy** or **Download**. | Copy and Download work before sign-off. The copied list ends with a Reference checks note naming every reference that is not verified, so the labels travel with it. With nothing cited yet, the list shows the whole library instead of nothing. The final files (draft, BibTeX, RIS) still unlock only after sign-off: the export gate on slide 4 of our deck. |
| 5. AI-use statement | **Export → AI-use statement**: generated from the audit log, editable, Copy or Download. | Available before sign-off, like the reference list. |
| Phone screens | Every page fits a 390 px wide screen; Previous / Next at the bottom of each step. | Integrity report fixed on phones (labels went off-screen); the library shows sources before folders on phones. |

## Quick start

Requires Node.js 20.9 or later.

**First time only:** make a copy of `.env.example` named `.env.local` and add the keys below. Never copy it again: that would replace your keys with empty ones.

```bash
npm install                    # first time only
npm run local                  # Windows, project inside OneDrive: builds and runs at http://localhost:3000
npm run dev                    # elsewhere (or with OneDrive paused): development server with hot reload
```

On Windows you can also double-click **`Start ClaimTrace.cmd`** in this folder: it runs `npm run local` in its own window and opens the browser by itself once the app is ready (close the window to stop). Until then the page cannot load: that is expected while it builds.

`npm run local` exists because OneDrive locks Next.js's build folder while syncing it, which crashes `npm run dev` with `EPERM` errors. It copies the project (code and `.env.local`, never `node_modules`) to `%LOCALAPPDATA%\claimtrace-run`, installs dependencies there on the first run, builds and starts the app. Run it again after editing code (with the launcher: close its window and double-click it again); stop it with Ctrl+C or by closing the window.

Open the app and choose **Open the demo project**: a short literature review with 11 cited claims, including an overreaching claim, a fabricated reference, a retracted paper, a close match and a student-added web source.

To test a **new project** from scratch, follow [docs/TRY-IT.md](docs/TRY-IT.md): a research question, real and planted references (including a BibTeX file), and a draft where every sentence has a known right answer.

### Keys

| Variable | Needed for | How to get it |
|---|---|---|
| `OPENALEX_API_KEY` | Search and reliable checks. **Required in practice.** Without a key, everyone on a network shares about $0.10 of OpenAlex requests a day (roughly 100 searches); at a venue or on Vercel's shared IPs that runs out. | Free: create an account at [openalex.org](https://openalex.org), then **Settings → API key** ([openalex.org/settings/api](https://openalex.org/settings/api)). Usage: `https://api.openalex.org/rate-limit?api_key=…` |
| `CONTACT_EMAIL` | Crossref's polite pool (the public pool allows about one search a second). | A team email address. |
| `NVIDIA_API_KEY` | The Scout, Skeptic and Assistant. Without it, claims stay **Unchecked** and the demo can show labelled samples. | [build.nvidia.com](https://build.nvidia.com): sign in, open any model, **Get API Key**. One key works for every model NVIDIA hosts. |

Settings in the app shows which of these the server has, and whether a database is currently refusing requests.

### Commands

| Command | What it does |
|---|---|
| `npm run local` | Windows, project inside OneDrive: build and serve a copy outside OneDrive at http://localhost:3000 |
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build and server |
| `npm test` | Unit tests (Vitest): core rules, the Skeptic's evidence rules, the Verifier with mocked databases |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `npm run eval -- http://localhost:3000 testset` | Verifier accuracy on the development set (uses OpenAlex budget) |
| `npm run eval -- http://localhost:3000 holdout` | Verifier accuracy on the held-out set |
| `npm run eval:skeptic -- code` | Code hints on the Skeptic set (no AI, no network) |
| `npm run eval:skeptic -- live http://localhost:3000` | Skeptic verdict accuracy (needs `NVIDIA_API_KEY` on the server) |
| `npm run demo:record -- http://localhost:3000` | Record a live Skeptic run of the demo as the labelled sample fallback |
| `npm run demo:samples` | Rebuild the prepared samples (no AI) |
| `npm run e2e -- http://localhost:3000 <screenshots>` | The full journey in headless Chrome |

### Before a live demo

1. Set `OPENALEX_API_KEY`, `CONTACT_EMAIL` and `NVIDIA_API_KEY` on the host as well as locally (done locally on 25 Nov).
2. Open Settings in the deployed app: AI connection should say Live, and both databases should show their key and email as set.
3. Rehearse the demo once on the venue network, with a phone hotspot as backup. "Check all" on the demo project takes about 15 s with live AI.
4. If you change the model, re-run `npm run eval:skeptic -- live <url>` and `npm run demo:record -- <url>`.

## Accuracy

**Reference checks (the Verifier)**, measured live against Crossref and OpenAlex (`eval/`):

- **Held-out set, run once: 13 of 13** references classified correctly.
- **Development set, rules tuned on it: 33 of 33.**

The sets mix real, fabricated, near-miss (wrong year, author order, rewritten title, real DOI on an invented title) and retracted references. They are small: early evidence, not a guarantee. They measure references only, not claims.

**Claim checks (the Skeptic)**: `eval/skeptic-set.json` has 20 labelled claims about the demo's real abstracts (supported paraphrases; causal, certainty, effect-size, population and generalisation overreach; negation, opposite direction and different findings). Live, with the default model:

- **19 of 20 verdicts correct, none wrongly labelled Supported**, one left Unchecked because code refused the AI's evidence sentence; 3.9 s per check (`eval/skeptic-RESULTS.md`). An earlier run of the same setup scored 17/20: hosted models vary a little from run to run.
- This is a development result: the model was chosen on this same set (below). The prompt and the evidence rules were not changed after seeing the results.
- Code's overreach hints alone flag 8 of 8 overreaching claims with no false alarms on 6 supported ones (also development numbers: the generalisation rule was changed once after the first run; `eval/skeptic-hints-RESULTS.md`).

**The model.** The planned `meta/llama-3.3-70b-instruct` was retired by NVIDIA on 26 Aug 2026 (HTTP 410). Of five hosted models measured on the 20 claims, `nvidia/nemotron-3-ultra-550b-a55b` with its thinking step switched off was the most accurate and fast (`eval/skeptic-model-comparison.md`); it is the default. Changing model is one setting (`AI_MODEL`); re-run `npm run eval:skeptic -- live <url>` after a change.

## Sample results (when the AI is unavailable)

On the demo project only, if live AI checks fail, the review page offers **Show sample results**. Each sample is labelled Sample on the claim, in the integrity report and in the AI-use statement, and logged. The samples were **recorded from a live run** of the default model on 25 Nov 2026 (`npm run demo:record`); real AI results are never replaced by samples. (`npm run demo:samples` rebuilds the earlier, team-prepared examples, which are labelled as such.)

The landing page's animated panel is a scripted replay and is labelled **Sample · scripted replay**.

## How the audit (25 Nov) was addressed

| Finding | Resolution |
|---|---|
| CT-01 OpenAlex keyless budget | `OPENALEX_API_KEY` and `CONTACT_EMAIL` documented as required; a used-up budget opens a breaker that fails fast with a clear message instead of ~12 s of retries; Settings shows the status. |
| CT-02 Flagship check needs live AI | Live AI configured and measured; a labelled sample fallback for the demo, recorded from a live run. |
| CT-03 Weak quote guard | Evidence must be a whole sentence (≥60%, or a substantial part of the sentence the AI named) and about the claim (≥25% of key terms, or code's top-ranked sentence). |
| CT-04 Pasted-text bypass | Separate **Supported · your text** label that needs an acknowledgement; origin shown in the report and counted in the statement; a warning when pasted text does not look like the paper. |
| CT-05 Structured close matches | Structured matches need a matching author, a DOI, or a near-identical title; regression tests. |
| CT-06 Outage shown as Not found | New **Couldn't check** state (named **Not yet verified** since 26 Nov); Not found only when both databases answered; a failed re-check keeps the earlier result. |
| CT-07 "Live demo data" | Relabelled **Sample · scripted replay** with an explanation. |
| CT-08 Deck vs build | Deck updated: browser storage, three AI roles, Couldn't check; speaker notes added. |
| CT-09 Crossref throttling | Per-service pools that follow Crossref's advertised limits; reference lists checked four per request with progress; 45 s time budget per request. |
| CT-10 Re-verify wiped the abstract | Records merge without overwriting known fields with undefined. |
| CT-11 Statement double count | Reference and claim counts are partitions; an edited statement is marked in the report next to the generated one. |
| CT-12 Report showed one source | Every cited source's verdict, evidence, text origin and check mode. |
| CT-13 Negation | Finding-level negation check: a summary point that reverses its sentence is not grounded; direction hints for the Skeptic. |
| CT-14 Silent truncation | Checks say "first N of about M sentences"; long texts are shortened in the browser instead of failing. |
| CT-15 Export without labels | Exported text files list every reference that is not plainly verified, with its label and reason. |
| CT-16 Unmeasured Skeptic | Labelled 20-claim Skeptic set and script, run live: 19/20, none wrongly Supported; the app separates reference accuracy from claim accuracy. |
| CT-17 "Verified" meant two things | References are **Verified**, claims are **Supported**. |
| CT-18, CT-25 Quota abuse, request handling | Cross-site requests refused; per-browser AI limits (20/min, 400/day); body size checked while reading; forwarded IPs trusted only behind a proxy. |
| CT-20 One-click close-match confirm | The claim card opens the side-by-side comparison. |
| CT-21 Long claims in search | Shortened to whole words before searching. |
| CT-22 Data in one browser | Project export and import (validated). |
| CT-23, CT-24 Repo hygiene | `pitch-deck/node_modules` untracked; unused components removed; one shared record key. |
| CT-26 Tab ARIA | Filter chips are toggle buttons with `aria-pressed`. |
| CT-27, CT-29, CT-30 | Multi-source rule explained on the card; effect-size, population and direction hints; per-instance caches documented. |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short: a Next.js app with a pure, unit-tested `core/` (all rules, including the Skeptic's evidence rules), server adapters behind one interface (`server/sources`, `server/ai`), typed API routes validated with zod, and browser-only storage behind a single repository boundary. The deck's "orchestrator" is the workflow code in the browser (`src/lib/actions.ts`, `src/core/workflow/`) plus the API routes that call the AI and the databases.

## Deploy (Vercel)

1. Push the repository to GitHub and import it in Vercel (root directory: `claimtrace`).
2. Add `OPENALEX_API_KEY`, `CONTACT_EMAIL` and `NVIDIA_API_KEY` in Project Settings, Environment Variables.
3. Deploy. No database is needed: research data stays in each user's browser.

## Known limitations

- Abstracts exist for only about half of works in OpenAlex; without text a claim is **Unchecked** unless the student pastes text.
- Support is judged from abstracts or pasted text, never paywalled full text. Only the first 80 sentences of a text are checked, and the check says so.
- The AI can misjudge support; code checks the evidence, and the student sees it and decides. **Supported means the sentence was found, not that the claim is true.**
- Pasted text is taken on trust: code warns when it does not resemble the paper, and the label and report disclose it, but nothing can prove where text came from.
- Caches, rate limits and the AI budget live in each server instance's memory; on serverless hosting they are not global. Recent AI replies are kept for up to 12 hours (not linked to a user).
- Database coverage is uneven across languages and regions.

## Development notes

- This project lives in a OneDrive folder. If `next dev` fails with `EPERM ... .next`, OneDrive was syncing build files: use `npm run local`, or pause OneDrive syncing while developing (a junction for `.next` does not work: Node then resolves the build outside the project and cannot find `node_modules`).
- UI components come from shadcn/ui, Magic UI (Animated Beam, Border Beam, Number Ticker, Dot Pattern) and React Bits (Blur Text, Count Up, Spotlight Card, Shiny Text). 21st.dev hosts the same Magic UI components but requires sign-in to download, so they were installed from Magic UI's public registry.

## Credits

Metadata from [Crossref](https://www.crossref.org) and [OpenAlex](https://openalex.org) (CC0); retraction data from Retraction Watch via Crossref. Citation styles from the [CSL project](https://citationstyles.org) (CC BY-SA 3.0), formatted with citation-js. Icons: Lucide.
