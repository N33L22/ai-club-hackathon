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
| 6. Challenge | AI Skeptic | Picks the supporting sentence and a verdict; **code confirms the sentence is really in the source**. |
| 7. Decide | Student | **Checkpoints 2 and 3:** resolve every flag, then sign off. Only then does export unlock. |

Exports: reference list in APA 7, Harvard, MLA 9, IEEE or Vancouver; BibTeX and RIS; the draft with formatted citations; an auto-generated **AI-use statement**; a printable **integrity report**; the full **audit log** (JSON/CSV).

## Quick start

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local     # add NVIDIA_API_KEY to enable the AI agents (optional)
npm run dev                    # http://localhost:3000
```

Open the app and choose **Open the demo project**: a short literature review with 11 cited claims, including an overreaching claim, a fabricated reference, a retracted paper, a close match and a student-added web source.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build and server |
| `npm test` | Unit tests for the core rules (Vitest) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run eval -- http://localhost:3000 testset` | Verifier accuracy on the development set |
| `npm run eval -- http://localhost:3000 holdout` | Verifier accuracy on the held-out set |
| `npm run demo:build -- http://localhost:3000` | Rebuild the demo project from live Verifier results |

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NVIDIA_API_KEY` | (none) | Key for the AI agents. Without it, claims stay **Unchecked** (never Verified). |
| `AI_BASE_URL` | `https://integrate.api.nvidia.com/v1` | Any OpenAI-compatible endpoint. |
| `AI_MODEL` | `meta/llama-3.3-70b-instruct` | The model name, in one place. |
| `AI_REQUESTS_PER_MINUTE` | `35` | Budget under NVIDIA's ~40 requests/minute free tier. |
| `CONTACT_EMAIL` | (none) | Optional: joins the Crossref/OpenAlex polite pool. |

## Verifier accuracy

Measured live against Crossref and OpenAlex (`eval/`):

- **Held-out set, run once: 13 of 13** references classified correctly.
- **Development set, rules tuned on it: 33 of 33.**

The sets mix real, fabricated, near-miss (wrong year, author order, rewritten title, real DOI on an invented title) and retracted references. They are small: early evidence, not a guarantee. See `eval/holdout-RESULTS.md` and `eval/testset-RESULTS.md`.

## How the review report's gaps were addressed

| Gap | Resolution |
|---|---|
| C1 Website not started | Built: the full 7-step journey works end to end. |
| H1 Web sources without a DOI | "Web page" form; labelled **Student-added, not verified** through to export. |
| H2 Thin source text | Search defaults to papers with abstracts; students can paste text they have read; every check says what text it used. |
| H3 Assistant role | "Explain this paper": every point links to a source sentence (checked by code), otherwise labelled **AI reasoning**. |
| M1 Label logic | **Retracted** and **Not found** are separate labels. |
| M2 Promises on slide 5 | Source-mix view, "Delete all my data", and page numbers required for direct quotes are built. |
| M3 Brittle matching | DOI first; near-misses become **Close match: confirm?** with a side-by-side comparison. |
| M4 No evaluation | Labelled development and held-out sets with a script and published results. |
| M5 Provider limits | Caching, a request budget, rate limiting, and an honest **Unchecked** fallback. |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short: a Next.js app with a pure, unit-tested `core/` (all rules), server adapters behind one interface (`server/sources`, `server/ai`), typed API routes validated with zod, and browser-only storage behind a single repository boundary.

## Deploy (Vercel)

1. Push the repository to GitHub and import it in Vercel.
2. Add `NVIDIA_API_KEY` (and optionally `CONTACT_EMAIL`) in Project Settings, Environment Variables.
3. Deploy. No database is needed: research data stays in each user's browser.

## Known limitations

- Abstracts exist for only about half of works in OpenAlex; without text a claim is **Unchecked** unless the student pastes text.
- Support is judged from abstracts or pasted text, never paywalled full text.
- The AI can misjudge support; code re-checks every quoted sentence, and the student sees the evidence and decides. **Verified means the sentence was found, not that the claim is true.**
- Database coverage is uneven across languages and regions.

## Development notes

- This project lives in a OneDrive folder. If `next dev` fails with `EPERM ... .next`, OneDrive was syncing build files: delete `.next` and restart, or pause syncing while developing.
- UI components come from shadcn/ui, Magic UI (Animated Beam, Border Beam, Number Ticker, Dot Pattern, Blur Fade) and React Bits (Blur Text, Count Up, Spotlight Card, Shiny Text). 21st.dev hosts the same Magic UI components but requires sign-in to download, so they were installed from Magic UI's public registry.

## Credits

Metadata from [Crossref](https://www.crossref.org) and [OpenAlex](https://openalex.org) (CC0); retraction data from Retraction Watch via Crossref. Citation styles from the [CSL project](https://citationstyles.org) (CC BY-SA 3.0), formatted with citation-js. Icons: Lucide.
