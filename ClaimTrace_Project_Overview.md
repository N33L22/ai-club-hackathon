# ClaimTrace: project overview

**AI Club Hackathon 2026 · Team 6 · Neel, Mohit, Anand**

> **A real reference is not the same as a supporting reference.**
> ClaimTrace is a reference manager and AI research assistant that checks every citation three ways (does it **exist**, do its details **match**, and does the source actually **support** the claim), then shows the student the evidence before they decide.

| | |
|---|---|
| **Status** | Deck built (6 slides, speaker notes). MVP built in [claimtrace/](claimtrace/) and tested end to end with live AI; audit fixes of 25 Nov applied. Claim checks measured live: 19/20 correct, none wrongly Supported. Not yet deployed or pushed |
| **Deck** | [pitch-deck/ClaimTrace_Team6_Pitch.pptx](pitch-deck/ClaimTrace_Team6_Pitch.pptx) (submission) · [pitch-deck/ClaimTrace_Team6_Pitch.html](pitch-deck/ClaimTrace_Team6_Pitch.html) (web version) |
| **Website** | [claimtrace/README.md](claimtrace/README.md) (run, keys, accuracy) · [claimtrace/docs/ARCHITECTURE.md](claimtrace/docs/ARCHITECTURE.md) |
| **Try it** | On Windows, double-click `claimtrace/Start ClaimTrace.cmd` (it opens the browser when the app is ready). A 15-minute test with known answers: [claimtrace/docs/TRY-IT.md](claimtrace/docs/TRY-IT.md) |
| **Brief and rubric** | [DOCS/](DOCS/) |
| **Last updated** | 25 November 2026 |

---

## Contents

1. [The problem](#1-the-problem)
2. [Why we chose this problem](#2-why-we-chose-this-problem)
3. [Our solution](#3-our-solution-claimtrace)
4. [How we are approaching it](#4-how-we-are-approaching-it)
5. [Workflow](#5-workflow)
6. [Architecture](#6-architecture)
7. [Tool stack](#7-tool-stack)
8. [Guardrails](#8-guardrails)
9. [Ethical considerations](#9-ethical-considerations)
10. [Governance](#10-governance)
11. [MVP scope and demo](#11-mvp-scope-and-demo)
12. [Preparing for the day-of requirements](#12-preparing-for-the-day-of-requirements)
13. [Known limitations and risks](#13-known-limitations-and-risks)
14. [Timeline, deliverables and scoring](#14-timeline-deliverables-and-scoring)
15. [Decision log](#15-decision-log)
16. [References](#16-references)

---

## 1. The problem

### The brief

The hackathon asks every team for the same thing: a website that helps researchers **find, organise and cite sources** like a reference manager (Zotero, Mendeley, EndNote), and also acts as an **AI research assistant**, without the invented references AI is known for. A student must be able to trust that **every reference is real and every claim can be traced back to its source**, and must stay in charge of the final decisions.

### What goes wrong today

AI is fast, but it fails in ways a polished assignment can hide. The student is responsible for every one of these errors:

| Failure | Example | How often (published evidence) |
|---|---|---|
| **Invented reference** | A DOI or paper that does not exist | 55% of GPT‑3.5 references and 18% of GPT‑4 references were fabricated (Walters & Wilder, 2023) |
| **Wrong details on a real reference** | Real paper, wrong author, year or title | 43% of GPT‑3.5's real references and 24% of GPT‑4's had substantive errors (same study) |
| **Real reference, wrong claim** | The paper exists but doesn't say what the sentence claims, or says something narrower | The hardest to spot; no mainstream tool checks it |
| **Retracted source** | Citing a paper that has been withdrawn | Only 5.4% of citations made after a retraction mentioned it (722 of 13,252; Hsiao & Schneider, 2021) |

> The 2023 figures describe specific older models. They show the failure types are real, not how today's models perform.

### The gap in existing tools

| Tool | What it does well | What it leaves to the student |
|---|---|---|
| Zotero, Mendeley, EndNote | Save, organise, tag, format APA 7 | Does the source support my sentence? |
| ResearchRabbit | Discovers related papers and connections | Is my claim faithful to the paper? |
| SciSpace / AI assistants | Explain and summarise papers fast | Can invent or distort; summaries drop caveats |
| Citation formatters | Correct formatting | Formatting says nothing about accuracy |

**The gap:** reference managers organise and format. AI tools find and summarise. **Nothing checks whether the source supports the sentence.** ClaimTrace does.

---

## 2. Why we chose this problem

### It came out of research, not a feature list

Before choosing an idea, we ran a structured discovery process (Phase 0: rules; Phase 1: problem research). We mapped the research workflow stage by stage, from defining the question through to final verification, and ranked the problems we found:

| Rank | Research problem | Severity | Frequency | Consequence | Feasibility |
|---|---|---|---|---|---|
| **1** | **The claim does not match the cited evidence** | High | High | High | Medium |
| 2 | Synthesising conflicting research | High | High | High | Low |
| 3 | Incomplete or biased literature discovery | High | High | High | Low |
| 4 | AI-generated fabricated or inaccurate references | High | Medium | High | High |
| 5 | Losing context during extraction and writing | High | High | High | Medium |
| 6 | Missing retractions and corrections | Medium | Medium | High | Medium |
| 7 | Reference organisation and formatting | Low | High | Medium | High |

ClaimTrace targets **problem #1** and builds in **#4** and **#6** along the way. Problems #2 and #3 matter just as much, but we judged them too hard to demonstrate reliably in a hackathon MVP.

### Five findings that shaped the product

1. **A source existing does not make it relevant.** A real paper can be cited for something it never establishes.
2. **Credibility depends on the claim.** A study can be excellent for a narrow question and wrong for a broad one, so we give no universal "credibility score".
3. **Bibliographic checks and evidence checks are different problems.** Existence and metadata checks can be done with plain code. Whether a source supports a claim needs reading and judgement.
4. **AI errors happen at many stages:** discovery, summarising, interpretation and citation, not only invented references.
5. **The underlying human skill is research judgement.** The tool should support it, not replace it.

### Why this helps us stand out

Every team gets the same brief, and its own hints (Crossref/OpenAlex checks, trust labels) push teams towards the same build: **"check the reference exists, then format it."** We go one step further than most teams are likely to: **does the source actually say what the claim says?** That step:

- matches the brief's own words: "every claim can be traced back to its source"
- scores directly on the **"Honesty and verification in action"** criterion (10 points), with a visible check, not just a green badge
- is hard to dismiss as a chatbot wrapper, because most of the checking is deterministic code with evidence shown on screen

---

## 3. Our solution: ClaimTrace

### Three checks on every citation

| Check | Question | How it's answered |
|---|---|---|
| ✅ **EXISTS** | Is it a real record? | The DOI or OpenAlex ID resolves in Crossref / OpenAlex (code) |
| ✅ **MATCHES** | Do the authors, title and year match the record? | Fuzzy metadata comparison (code) |
| ✅ **SUPPORTS** | Does the source actually say what the claim says? | The Skeptic agent finds the source sentence; code confirms it is a whole sentence of the source text and is about the claim |

There is also a **retraction check**: retracted papers are flagged red.

### Trust labels on every claim

| Label | Colour | Meaning |
|---|---|---|
| **Supported** | 🟢 green | The reference is real and matches, and the supporting sentence was found in the source (a reference on its own is **Verified**) |
| **Supported · your text** | 🟢 lime | As above, but the evidence came from text the student pasted; it needs an acknowledgement and is disclosed |
| **Overreach** | 🟠 amber | The source is related, but the claim goes beyond it (e.g. "causes" when the study shows an association) |
| **Not supported** | 🟠 orange | The source text does not say this |
| **Unchecked** | 🔵 blue | The reference is real, but there is no readable text to check the claim against, or the AI was unavailable |
| **Not yet verified** | 🔵 blue | Couldn't check: a database did not answer, so the reference is not confirmed yet; never reported as Not found or Verified (called "Couldn't check" until 26 Nov) |
| **AI reasoning** | 🟣 violet | The AI's own inference, not backed by a source |
| **Close match** · **Student-added** | 🟠 amber · ⚪ grey | The record's details differ (compare, then confirm) · a web page or report added without a database record |
| **Not found / Retracted** | 🔴 red | No matching record exists, or the paper has been withdrawn |

The colours and names are the ones the website uses (`claimtrace/src/core/labels.ts`).

**"Supported" means "we found the sentence", not "this is true".** The label is honest about what was checked.

### Illustrative example (fictional paper)

> **Claim in draft:** *"Social media use causes anxiety in teenagers" (Lee & Park, 2021)*
>
> ✅ EXISTS · ✅ MATCHES · ✅ NOT RETRACTED
>
> ⚠️ **OVERREACH**. Source says: *"Among 312 students at two schools, heavy use was associated with higher anxiety scores."* The claim says "causes" and stretches the finding to all teenagers.
>
> **[Edit in draft]** · **[Find a better source]** · **[Keep anyway…]** *(asks for a reason; logged)*

---

## 4. How we are approaching it

### Core principle

> **AI suggests. Code checks. The student decides.**

### Working principles

| Principle | What it means in practice |
|---|---|
| **Problem before product** | We chose the problem from research, then designed features to solve it |
| **Evidence before claims** | We never claim a verification capability we cannot demonstrate live |
| **Demo before complexity** | One complete journey that works beats many features that don't (the rubric says the same) |
| **Deterministic where possible** | Existence, metadata, retraction, quote presence and export gating are plain code. The AI is used only where language understanding is needed |
| **The AI has to earn its place** | Three narrow roles with distinct jobs (plan a search, challenge a claim, explain a source), because each needs language understanding; no agent swarm for show |
| **Honest by default** | When something can't be checked, we say "Unchecked" or "Not yet verified", never a best guess; "Not found" only when both databases answered |
| **Modular for change** | Every check is its own function, so the 1:15 PM requirements can be absorbed without a rewrite |

### Process we are following

```
Understand → Investigate → Discover → Ideate → Attack → Select → Design → Build → Stress-test → Demo
   (Phase 0–1 done)            (concept selected)        (deck done) (MVP built, audited, fixed) (next)
```

Each stage has a decision gate. Approved decisions are tracked separately from brainstormed ideas in the [decision log](#15-decision-log).

---

## 5. Workflow

Seven steps, three narrow AI roles, one code checker and three human checkpoints.

| # | Step | Who | What happens | Control / check |
|---|---|---|---|---|
| 1 | **Ask** | Student | Enters a research question and picks a citation style (APA 7 by default) | |
| 2 | **Search** | 🤖 Scout agent | Turns the question into a search plan; OpenAlex **returns real records only** (Crossref is used to verify them) | |
| 3 | **Approve** | Student | Approves the plan, picks sources and files them with folders, tags and notes | ✋ **Checkpoint 1** |
| 4 | **Write** | Student | Writes the draft and links each claim to a saved source | |
| 5 | **Verify** | ⚙️ Code (no AI) | Checks the record exists, the details match and it isn't retracted | 🛡️ **Check** |
| 6 | **Challenge** | 🤖 Skeptic agent | Finds the exact source sentence behind each claim and flags overreach; code re-checks that the sentence exists | 🛡️ **Check** |
| 7 | **Decide** | Student | Accepts, edits or replaces each flagged claim, then exports | ✋ **Checkpoints 2 + 3** |

**Feedback loop:** if a claim isn't supported, Scout suggests better sources and the student goes back round the loop (step 6 → step 2). Research isn't linear, so the workflow isn't either.

```mermaid
flowchart LR
    A[1 Ask<br/>Student] --> B[2 Search<br/>AI Scout]
    B --> C{{3 Approve<br/>Checkpoint 1}}
    C --> D[4 Write<br/>Student]
    D --> E[5 Verify<br/>Code]
    E --> F[6 Challenge<br/>AI Skeptic]
    F --> G{{7 Decide<br/>Checkpoints 2 + 3}}
    F -. not supported .-> B
    G --> H[Export<br/>APA 7 + AI-use statement]
```

**Where the student is in control:** ① approve the search plan and sources, ② resolve every flag, ③ sign off before export. Nothing is saved, changed or exported without a click.

**In the website,** a Previous / Next bar at the bottom of each page follows these steps in order (Overview → Search → Library → Write → Review claims → Export).

**Why the AI stays narrow:** the Scout only plans searches, the Skeptic only challenges claims, and the Assistant only explains a source with every point linked to a sentence. None of them can approve a source, write a reference or edit the draft.

---

## 6. Architecture

One web app, one AI provider and two free scholarly databases. The student's data stays in their browser (no accounts, no server database). **The AI has three narrow roles**; every other check is plain code.

```mermaid
flowchart TB
    subgraph Browser["Web app · Next.js + React (Vercel) · data stored in the browser"]
        L[Library] --- E[Editor] --- CP[Claim panel] --- X[Export]
    end
    Browser -- "question · claims · decisions" --> O
    O -- "sources · labels · evidence" --> Browser
    O["Orchestrator · browser workflow + Next.js API routes<br/>browser: runs the 7 steps, enforces checkpoints, writes the audit log<br/>server: calls the AI and the databases (keys stay there)"]
    O --> AI["AI model · NVIDIA NIM<br/>Nemotron 3 Ultra (thinking off)<br/>Scout · Skeptic · Assistant"]
    O --> V["Verifier · plain code<br/>fuzzy match · evidence checks · retraction flag"]
    O --> S["Scholarly APIs<br/>OpenAlex + Crossref"]
```

### Components

| Component | Responsibility |
|---|---|
| **Web app** | Library (folders, tags, notes) · Editor (draft with linked claims) · Claim panel (labels, evidence, actions) · Export. Stores the library, drafts, checks, decisions and audit log in the browser |
| **Orchestrator** | Two halves. **In the browser**, the workflow code (`src/lib/actions.ts`, `src/core/workflow/gate.ts`) runs the 7 steps in order, enforces the 3 checkpoints and writes every action to the audit log, next to the student's data. **On the server**, the API routes (`src/app/api/`) call the AI and the databases, so the keys never reach the browser |
| **AI model** (NVIDIA NIM) | **Scout:** search plans. **Skeptic:** evidence sentence plus support verdict. **Assistant:** explains a source, every point linked to a sentence. JSON output, temperature 0 |
| **Verifier** (code) | Title/author/year matching, evidence checks (whole sentence, about the claim), retraction flag, export gate |
| **Scholarly APIs** | OpenAlex and Crossref: real records, DOIs, authors, abstracts, open-access links, retraction data |

### Data flow

1. Question → Scout (NIM) → search terms
2. Terms → OpenAlex → real records only
3. Student approves → library in their browser
4. Claim + source text → Verifier + Skeptic → label and evidence sentence
5. Student decision → audit log → APA 7 export

### Failure handling

| If… | Then… |
|---|---|
| The AI is rate-limited or offline | Claims show **Unchecked**, never a fake **Supported**; existence and metadata checks still run, because they are code |
| No abstract or open text is available | **Unchecked** ("real, but no text to check") |
| Both databases answered and neither has the paper | **Not found** |
| A database did not answer | **Not yet verified** (couldn't check), never Not found; the student checks again later |
| The AI's evidence is not a whole sentence of the source, or is not about the claim | Rejected by code; the claim stays **Unchecked** |
| A live AI call isn't possible in the demo | Labelled **Sample** results (prepared by the team, or recorded from a live run) |

---

## 7. Tool stack

Everything is free or free-tier. No paid APIs, enterprise databases or proprietary datasets.

| Layer | Tool | Why we chose it | Status |
|---|---|---|---|
| Front end | **Next.js 16 + React 19** (TypeScript, Tailwind) | One codebase for UI and API routes; fast to build | Built |
| Hosting | **Vercel** | Free tier, one-command deploys, gives a live link for judges | Planned (not deployed yet) |
| Orchestration | **Workflow code in the browser** + **Next.js API routes** (TypeScript, zod-validated) | The workflow lives next to the student's data; the routes keep the keys on the server; no separate server to run | Built |
| AI model | **NVIDIA NIM API** · `nvidia/nemotron-3-ultra-550b-a55b`, thinking switched off | Team has NVIDIA API keys; OpenAI-compatible endpoint (`integrate.api.nvidia.com/v1`). Chosen by measuring five hosted models on 20 labelled claims ([comparison](claimtrace/eval/skeptic-model-comparison.md)); the planned Llama 3.3 70B was retired by NVIDIA on 26 Aug 2026 | Built and live |
| Scholarly data | **OpenAlex API** (free API key) | Free, open (CC0), search, abstracts, open-access links, `is_retracted` flag | Built. Needs a free key: without one a network shares about $0.10 of requests a day |
| Scholarly data | **Crossref REST API** | Authoritative DOI metadata; includes Retraction Watch data | Built (contact email recommended for the polite pool) |
| Storage | **Browser storage** (localStorage, Zustand) | No accounts and no server database: private by design and nothing to run. Project files move a project between browsers | Built (replaced the Supabase proposal; see decision log) |
| Citation export | **citation-js** (CSL) | APA 7, Harvard, MLA 9, IEEE, Vancouver, BibTeX and RIS from the same record | Built |
| Fuzzy matching | Own code (Jaro-Winkler, Levenshtein, token coverage) | Deterministic title and author matching, thresholds in one config file | Built |
| Pitch deck | **pptxgenjs**, **lucide** icons, **Pillow** (animated background) | One spec builds both the PPTX and the HTML deck | Done |
| Planning / build assistant | Claude, ChatGPT | Planning and coding help; main prompts go in the required prompt log | In use |

**NVIDIA free-tier constraint:** around **40 requests per minute**, according to developers on NVIDIA's forums (not official documentation). This is why the AI has only three narrow roles, why results are cached per claim and source, why each browser is limited to 20 AI requests a minute, and why the app degrades to "Unchecked" rather than failing.

---

## 8. Guardrails

Six specific mechanisms that keep the website honest:

| # | Guardrail | Mechanism | Type |
|---|---|---|---|
| 01 | **Retrieval-only references** | The AI can't write a citation. Each one needs a DOI or OpenAlex ID returned by the database; anything else is rejected | Code |
| 02 | **Metadata must match** | Title at least 90% similar, plus first author and year (±1). Near-misses become "Close match" for the student to compare side by side and confirm; title words alone never make a match | Code |
| 03 | **Quote or it didn't happen** | "Supported" needs a whole source sentence that code finds in the source text and that shares the claim's key terms. Support from text the student pasted is labelled "Supported · your text" | AI + code |
| 04 | **Scope check** | Flags overreach such as "causes", "all", "proves", an effect size ("triples") or a different population when the study shows less | AI + keyword rules |
| 05 | **Honest "Not found"** | "Not found" only when both databases answered. A database outage is "Not yet verified". No readable text means "Unchecked". Never a best guess | Code |
| 06 | **Retraction + export gate** | Retracted papers turn red. Export stays locked until every red flag is fixed or knowingly overridden (overrides are logged) | Code |

Supporting rules: the AI gets structured JSON prompts at temperature 0; every AI output is labelled; AI-suggested text stays **"AI reasoning"** until it is linked to a verified source.

---

## 9. Ethical considerations

Every risk is handled by a specific feature, not by a promise.

| Risk | Why it matters | How ClaimTrace responds |
|---|---|---|
| **Invented citations** | AI writes convincing references that don't exist | Retrieval-only references: every citation comes from OpenAlex or Crossref, and its details must match the record |
| **Misrepresented research** | A real paper is cited for something it never says | The Skeptic shows the exact source sentence beside the claim and flags overreach; the student makes the call |
| **Plagiarism and patchwriting** | Wording is copied too closely from the source | Quotes need quote marks and a page number; sentences that reuse long runs of source wording are flagged to quote or rewrite |
| **Privacy** | Drafts and research topics are personal | Drafts stay in the student's browser. Only the claim and source text go to the AI, never names, emails or whole drafts. The student can delete one project (with an offer to export a copy first) or everything |
| **Biased or narrow sources** | Databases over-represent some regions, languages and journals | A source-mix view shows years, countries and open-access share. No single "credibility score": fit is judged claim by claim |
| **Over-reliance on AI** | Students accept AI output without thinking it through | The AI never decides: three checkpoints, every flag needs a click, and "Supported" means "sentence found", not "this is true" |

---

## 10. Governance

| Area | Commitment |
|---|---|
| **Accountability** | The student is the author of record and makes every final decision. ClaimTrace gives evidence, not verdicts, and shows its known limits in the app. Every AI output and human decision is logged with time, model and action. Team 6 owns the system's behaviour and fixes reported errors |
| **AI disclosure** | Inline labels separate AI reasoning from verified sources. Every export includes an auto-generated **AI-use statement** (which steps used AI, the model, the date, and what the student changed). Any demo output that isn't a live AI call is labelled "Sample" |
| **Policies followed** | SP Jain academic integrity and AI-use policy · APA 7, including APA guidance on citing generative AI · UNESCO *Guidance for Generative AI in Education and Research* (2023) · data minimisation in line with GDPR principles · OpenAlex, Crossref and NVIDIA terms of use |

**Sample AI-use statement (generated on export):**

> *"I used ClaimTrace (Nemotron 3 Ultra via NVIDIA NIM) on 26 Nov 2026 to plan literature searches and to check whether my 14 cited sources support my claims. It flagged 3 claims: I rewrote 2 and replaced 1 source. All final wording and decisions are my own."*

---

## 11. MVP scope and demo

The rubric is explicit: **one core journey that works well beats many features that don't.**

### In scope for the MVP (built; the journey passes an end-to-end browser test)

- [x] Research question → Scout search plan → OpenAlex results
- [x] Approve sources → library with folders, tags and notes
- [x] Draft editor where each claim links to a saved source
- [x] Verifier: exists, metadata match, retraction flag, and "Not yet verified" when a database is down
- [x] Skeptic: evidence sentence plus Supported / Overreach / Not supported / Unchecked, with code checking the evidence is a whole sentence about the claim
- [x] Claim panel with trust labels and Edit in draft / Find a better source / Keep anyway… actions
- [x] Export gate, five citation styles, BibTeX/RIS, AI-use statement and integrity report
- [x] Audit log
- [x] Live AI run and the live Skeptic evaluation (19/20 on 20 labelled claims, none wrongly Supported)
- [x] Projects: create, edit, export and import a project file, delete (asks first and offers an export)
- [x] Guided navigation: Previous / Next through the steps; the draft saves as you type, and **Save draft** (Ctrl+S) saves at once

### Out of scope (deliberately)

- Cross-paper contradiction analysis (very hard to demo reliably)
- Full-text PDF parsing of paywalled papers
- Chatbot-style free conversation
- Multi-user collaboration or a supervisor dashboard
- A universal "credibility score"

### Demo storyline (draft)

1. Ask a real research question and approve Scout's plan and sources.
2. Open the demo draft containing planted claims:
   - one **supported** claim → Supported
   - one **overreaching** claim → Overreach, with the source sentence shown
   - one **fabricated reference** → Not found
   - one **retracted paper** → red flag
3. Fix the flags, watch export unlock, and download the APA 7 list plus the AI-use statement.
4. Show the audit log.

For a rehearsal with a new project, [claimtrace/docs/TRY-IT.md](claimtrace/docs/TRY-IT.md) gives a research question, real and planted references, and a draft where every sentence has a known right answer.

---

## 12. Preparing for the day-of requirements

At **1:15 PM on 26 November** the organisers will add new requirements, and there are **90 minutes** to adapt. Judges score how well we adapt while still following this design.

- **Each check is its own function.** A new rule, source or citation style plugs in without a rewrite.
- **Citation styles are CSL files.** Adding Harvard, MLA or IEEE is a config change.
- **The source connectors are swappable,** so another free API (e.g. Semantic Scholar) can be added beside OpenAlex and Crossref.
- **Labels and the AI-use statement are templates,** so new disclosure or policy wording is a text change.
- **The working first version must be ready before the event.** The 90 minutes are for adapting, not building.

---

## 13. Known limitations and risks

We would rather state these openly than have the judges find them.

| Limitation / risk | Impact | Mitigation |
|---|---|---|
| OpenAlex has abstracts for only about 45–60% of works (fewer for older papers) | Some claims can't be checked for support | Honest **Unchecked** label; open-access full text where OpenAlex links it |
| Paywalled full text isn't accessible | Support checks rely on the abstract | Label what was checked ("abstract only") |
| The LLM's support judgement can be wrong | False Supported or false Overreach | The evidence must be a whole sentence of the source and about the claim (code check); the student sees the evidence and decides. Measured: 19/20 correct on 20 labelled claims (17/20 in an earlier run), never a false Supported |
| Hosted AI models get retired (NVIDIA retired Llama 3.3 70B on 26 Aug 2026) | The AI step stops working | The model is one setting; `npm run eval:skeptic -- live` re-measures a replacement in minutes, as we did on 25 Nov |
| NVIDIA free tier is about 40 requests/min (community-reported) | Slowdowns during the demo | Three narrow AI roles, caching, graceful "Unchecked", labelled sample results for the demo |
| OpenAlex without an API key: about $0.10 of requests a day per network (roughly 100 searches) | Search fails at a busy venue | Free key (`OPENALEX_API_KEY`); a used-up budget fails fast with a clear message; references show "Not yet verified", never "Not found" |
| Students can paste text that is not from the source | A false "Supported" | Separate "Supported · your text" label that needs an acknowledgement, a warning when the text does not resemble the paper, and disclosure in the report and statement |
| OpenAlex's `is_retracted` field had a misclassification bug in early 2024 (since fixed) | Possible false retraction flags | Cross-check with Crossref retraction data before flagging red |
| Fuzzy metadata matching can produce false matches or misses | Wrong Exists/Matches result | Conservative thresholds; show the matched record so the student can compare |
| Database coverage favours some languages and regions | Biased discovery | Source-mix view; coverage limits disclosed |

---

## 14. Timeline, deliverables and scoring

### Timeline

| When | What |
|---|---|
| 24–26 Nov | Phase 1: design and build the first working version |
| **Thu 26 Nov, 9:00 AM** | **Ideation deck due** (PowerPoint, max 6 slides; late decks are not scored) |
| Thu 26 Nov, 1:15 PM | Additional requirements announced |
| 1:15 PM to 3:00 PM | 90-minute adaptation window |
| **Thu 26 Nov, 3:00 PM** | **Phase 2 submission locks** |

### Deliverables

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Ideation deck (≤ 6 slides, PPTX) | ✅ Built, updated 25 Nov to match the website, with speaker notes: [pitch-deck/ClaimTrace_Team6_Pitch.pptx](pitch-deck/ClaimTrace_Team6_Pitch.pptx) |
| 2 | GitHub repository (accessible to organisers) | ⏳ Local git repo exists (`pitch-deck/node_modules` no longer tracked); not pushed |
| 2 | Prompt log: main AI prompts in the order used | ✅ [PROMPT_LOG.md](PROMPT_LOG.md), up to 12:01 PM on 26 Nov; add the day-of prompts before 3:00 PM |
| 2 | Live website link (or a declared local demo) | ⏳ Works locally with all keys; needs a Vercel deploy with `OPENALEX_API_KEY`, `CONTACT_EMAIL` and `NVIDIA_API_KEY` set there |

Submit on the hackathon platform: <https://ai-hackathon-tau-green.vercel.app/> (sign in with your SP Jain email and the team code).

### How we score (100 points)

**Phase 1: ideation deck (30)**

| Criterion | Points | Where we cover it |
|---|---|---|
| Workflow | 8 | Slide 2 · [Section 5](#5-workflow) |
| Architecture | 6 | Slide 3 · [Section 6](#6-architecture) |
| Ethical considerations | 5 | Slide 5 · [Section 9](#9-ethical-considerations) |
| Governance | 5 | Slide 6 · [Section 10](#10-governance) |
| Guardrails | 6 | Slide 4 · [Section 8](#8-guardrails) |

**AI quiz (5):** points by team ranking.

**Phase 2: website and presentation (65)**

| Criterion | Points | Our plan |
|---|---|---|
| Working MVP | 15 | One end-to-end journey (Section 11) |
| Research and citation features | 12 | Search, library, linked claims, APA 7 export |
| Honesty and verification in action | 10 | Live Verifier + Skeptic with evidence on screen |
| Day-of requirements | 8 | Modular checks (Section 12) |
| User experience | 8 | Trust labels and one-click actions; usable without instructions |
| Presentation and Q&A | 12 | Every member presents a part (to be assigned) |

---

## 15. Decision log

Approved decisions are kept separate from proposals. **Nothing here changes without the team agreeing.**

### ✅ Approved

| Date | Decision | Reason |
|---|---|---|
| 24 Nov | Problem focus: **claim–evidence mismatch** (plus existence, metadata and retraction checks) | Ranked #1 in Phase 1 research; distinctive; demonstrable |
| 24 Nov | Product name: **ClaimTrace** | Plain and descriptive: every claim traced to its source |
| 24 Nov | Team: **Team 6**, Neel, Mohit, Anand | — |
| 24 Nov | AI used in only two places (Scout, Skeptic); all other checks deterministic | Reliability, rate limits, honesty. **Superseded in the build:** an Assistant role was added (see "Changed during the build") |
| 24 Nov | Data sources: OpenAlex + Crossref | Free, open, named in the brief |
| 24 Nov | Ideation deck structure: 6 slides mapped to the 5 rubric areas | Rubric |

### 🔁 Changed during the build: needs team confirmation

These were decided while building and are reflected in the website and the deck. Confirm or reverse them.

| Date | Change | Why |
|---|---|---|
| 24 Nov | **Three AI roles**: an Assistant explains a source, every point linked to a sentence (unlinked points are labelled AI reasoning) | Review v2 gap H3 asked for an assistant role |
| 24 Nov | **Browser storage instead of Supabase**: no accounts, no server database; project files move a project between browsers | Simpler to run and privacy by design; the deck now says so |
| 24 Nov | **"Close match"** for near-misses (compare and confirm) instead of a hard "Mismatch" | Review v2 gap M3 |
| 25 Nov | References are **Verified**, claims are **Supported**; pasted-text evidence is **Supported · your text** | Audit CT-17 and CT-04: one word for two kinds of evidence misled readers |
| 25 Nov | **Couldn't check** when a database does not answer, never Not found | Audit CT-06: a false "may be invented" is the worst error an integrity tool can make |
| 25 Nov | Labelled **sample** results for the demo when live AI is unavailable | Audit CT-02; the rubric allows labelled samples |
| 25 Nov | **AI model: Nemotron 3 Ultra** (`nvidia/nemotron-3-ultra-550b-a55b`, thinking off) instead of Llama 3.3 70B | NVIDIA retired Llama 3.3 70B on 26 Aug 2026 (HTTP 410). Of five hosted models measured on 20 labelled claims, it was the most accurate (17/20 in the comparison, 19/20 in the published run, none wrongly Supported) and fast (~4 s a check). See `claimtrace/eval/skeptic-model-comparison.md` |
| 25 Nov | **Orchestration runs in the browser**: workflow code next to the student's data runs the steps, the checkpoints and the audit log; the API routes only call the AI and the databases | Follows from browser storage (there is no server database to orchestrate from); the keys stay on the server. Deck slide 3 now says "browser workflow + Next.js API routes" |
| 25 Nov | **Navigation and project controls**: Previous / Next through the steps, Save draft (Ctrl+S), delete a project with a confirmation | Asked for after hands-on testing; additive, no rule or label changed |
| 26 Nov | **"Couldn't check" renamed "Not yet verified"** (meaning unchanged) | Day-of requirement 1 asks for exactly this label when a live check does not work |
| 26 Nov | **Labels on search results** ("From OpenAlex · not yet checked") and a tap-to-open **What the labels mean** guide on Search, Library and Review | Day-of requirement 2: every reference shown must carry a label, explained on screen, also on phones |
| 26 Nov | **Reference list and AI-use statement can be copied before sign-off**; the final files (draft, BibTeX, RIS) still unlock only after sign-off | Day-of requirements 4 and 5. The copied list ends with a Reference checks note on every unverified reference, so the guardrail's labels travel with it. The deck's export gate (slide 4) still holds for the final files |

### 🟡 Proposed: needs team confirmation

| Item | Current proposal | Open question |
|---|---|---|
| Matching thresholds | Title ≥ 90%, year ±1 (tuned on a 33-reference development set, 13/13 on a held-out set) | Keep? |
| Patchwriting rule | Flag 8+ consecutive words shared with the source | Keep? |
| Policy name | "SP Jain academic integrity and AI-use policy" | Confirm the exact policy title |
| Presentation roles | — | Who presents which part? |

### 💭 Ideas parked (not requirements)

- Cross-paper contradiction explainer
- Citation-dependency detection (several sources relying on one original study)
- Research uncertainty map
- Browser extension for one-click saving

---

## 16. References

- Walters, W. H., & Wilder, E. I. (2023). Fabrication and errors in the bibliographic citations generated by ChatGPT. *Scientific Reports, 13*, 14045. <https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980>
- Hsiao, T.-K., & Schneider, J. (2021). Continued use of retracted papers: Temporal trends in citations and (lack of) awareness of retractions shown in citation contexts in biomedicine. *Quantitative Science Studies*. <https://pmc.ncbi.nlm.nih.gov/articles/PMC9520488/>
- OpenAlex. Work object documentation (`is_retracted`, `abstract_inverted_index`). <https://docs.openalex.org/api-entities/works/work-object>
- Crossref (2023). Retraction Watch retractions now in the Crossref API. <https://www.crossref.org/blog/retraction-watch-retractions-now-in-the-crossref-api/>
- (Non-)retracted academic papers in OpenAlex (2024). <https://arxiv.org/abs/2403.13339>
- NVIDIA Developer Forums: NIM API rate-limit discussions (community-reported 40 RPM). <https://forums.developer.nvidia.com/t/api-rate-limit-increase-is-not-granted-by-requesting-it-here/368420>
- AI Club Hackathon 2026: Problem Statement; Submission Guidelines and Rubrics ([DOCS/](DOCS/))
