# ClaimTrace prompt log

**AI Club Hackathon 2026 · Team 6 · Neel, Mohit, Anand**

These are the AI prompts we used to plan and build ClaimTrace (the pitch deck and the website), in the order we used them, including the prompts we used on the day of the event (from prompt 28).

- **Tool:** Claude Code in VS Code. All replies came from Claude Opus 5.5, except prompt 8, which Claude Haiku 5.5 answered. Model switches are noted in italics where they happened.
- **Two conversations:** the **Build conversation** planned the project and built the deck, the overview document and the website. The **Review conversation** audited the website without changing it, and reviewed the deck's design.
- **Before these prompts**, we did our problem research (Phase 0 and Phase 1) in ChatGPT. That conversation is shared at the link in prompt 4.
- **Exactly as typed:** prompts are copied from the Claude Code logs, typos included. Long pasted documents are collapsed; click to expand them. Each prompt has a one-line note of what it produced.
- **Times** are local time (UTC+4).
- **Not in this log:** the prompts the website itself sends to the AI. They are part of the product, in `claimtrace/src/server/ai/`.

| # | When | Conversation | Prompt (shortened) |
|---|---|---|---|
| [1](#prompt-1) | Tue 24 Nov, 9:04 PM | Build conversation | Check the given documents given in the DOCS folder the path is given below:… |
| [2](#prompt-2) | Tue 24 Nov, 9:06 PM | Build conversation | stop |
| [3](#prompt-3) | Tue 24 Nov, 9:07 PM | Build conversation | i have given the link which is a public link and i also have claude in chrome mcp so… |
| [4](#prompt-4) | Tue 24 Nov, 9:16 PM | Build conversation | https://chatgpt.com/share/6b05c258-d564-83ed-85e4-9870e54832a1 this is the link 1. the… |
| [5](#prompt-5) | Tue 24 Nov, 9:48 PM | Build conversation | now create me a .md file showing what is the problem what is our proposed solution how… |
| [6](#prompt-6) | Tue 24 Nov, 10:21 PM | Build conversation | @DOCS/ClaimTrace_Review_v2.docx use this report on understanding what is left and… |
| [7](#prompt-7) | Wed 25 Nov, 12:09 AM | Build conversation | let's stop here for now we will continue it tommorow just list what all is left |
| [8](#prompt-8) | Wed 25 Nov, 12:10 AM | Build conversation | just list what is left then we continue it tommorow |
| [9](#prompt-9) | Wed 25 Nov, 7:34 PM | Review conversation | [pasted: the master MVP audit brief, audit only, no changes] |
| [10](#prompt-10) | Wed 25 Nov, 8:00 PM | Review conversation | can you explain everything in a simple and short summary in layman terms |
| [11](#prompt-11) | Wed 25 Nov, 8:02 PM | Build conversation | Fix the following content given in the audit report [pasted report] and how to get… |
| [12](#prompt-12) | Wed 25 Nov, 9:09 PM | Build conversation | i want to ask can i have my personal email in contact_email |
| [13](#prompt-13) | Wed 25 Nov, 9:31 PM | Build conversation | i don't have meta llama api key what else should i use i don't think i have any from… |
| [14](#prompt-14) | Wed 25 Nov, 9:39 PM | Build conversation | i have other nvidia keys but not llama 3.3 70b |
| [15](#prompt-15) | Wed 25 Nov, 9:42 PM | Build conversation | wait i am saying are there other models in nvidia itself instead of llama 3.3 70b instruct |
| [16](#prompt-16) | Wed 25 Nov, 9:46 PM | Build conversation | okay i have added the key make the changes accordingly |
| [17](#prompt-17) | Wed 25 Nov, 9:53 PM | Build conversation | saved the key now, go ahead |
| [18](#prompt-18) | Wed 25 Nov, 10:05 PM | Build conversation | okay wait for it and then finish everything |
| [19](#prompt-19) | Wed 25 Nov, 10:36 PM | Build conversation | wonderfull now how do it run it and als can you change the ppt UI and design to white… |
| [20](#prompt-20) | Wed 25 Nov, 11:02 PM | Build conversation | the code is not running when open local host it shows dailed to load page |
| [21](#prompt-21) | Wed 25 Nov, 11:04 PM | Review conversation | @pitch-deck/ClaimTrace_Team6_Pitch.pptx review this ppt and tell me what is missing if… |
| [22](#prompt-22) | Wed 25 Nov, 11:08 PM | Build conversation | can you give me something so i can try by adding a new project and the ppt shows… |
| [23](#prompt-23) | Wed 25 Nov, 11:08 PM | Review conversation | yes approve all, fix it |
| [24](#prompt-24) | Wed 25 Nov, 11:23 PM | Build conversation | there is no way to delete the project is there if not add and can you also add buttons… |
| [25](#prompt-25) | Wed 25 Nov, 11:44 PM | Build conversation | wonderfull now update the pitchdeck docs and everything according to the updated… |
| [26](#prompt-26) | Thu 26 Nov, 11:56 AM | Build conversation | how to run the cope the npm command is on which doc |
| [27](#prompt-27) | Thu 26 Nov, 12:01 PM | Build conversation | create me a prompts list .md of the converstation we had apparently i have to submit… |
| [28](#prompt-28) | Thu 26 Nov, 12:09 PM | Build conversation | [pasted: the day-of requirements] Analyse what is missing and report it to me do not… |
| [29](#prompt-29) | Thu 26 Nov, 12:17 PM | Build conversation | go ahead with all of them, start with the keys |

---

<a id="prompt-1"></a>

## 1 · Tue 24 Nov, 9:04 PM · Build conversation

> Check the given documents given in the DOCS folder the path is given below:
> C:\Users\Neel\OneDrive\Desktop\AI CLUB HACKATHON\DOCS\
>
> and for what i have thought check the following link using claude in chrome and let's start building the pitch deck:
> https://chatgpt.com/c/6b05c00d-0940-83eb-b667-1ac3c95f2650
>
> Let's start building and give me the html 6 slide deck with a good ui background animation and everything which can also be downloaded as ppt with the same motion animation and ui use correct applicable colors and select a good color scale qas this is the hackathon keep it easy to understand but also professional and do not use existing claude color pallete search the web if you have to and let's start building the pitch deck:
>
> *[pasted: 3 excerpts of planning notes from our ChatGPT conversation, shown below]*

<details>
<summary>Pasted with this prompt: planning notes from our ChatGPT conversation (1 of 3) · 98 lines</summary>

```text
The workflow instead forces:
The ideation pipeline
Understand → Investigate → Discover → Ideate → Attack → Select → Design → Build
Each stage has a decision gate. No rushing into implementation just because AI can generate React code at frightening speed.
C. It separates novelty from complexity
A common hackathon trap is creating a system with:
- 8 agents
- 3 vector databases
- 4 APIs
- 12 dashboard sections
- A graph visualization
- A chatbot
And absolutely no reason for the user to need it.

Your prompt specifically instructs Claude to reject artificial complexity.

A project with one excellent capability that solves a real research failure is potentially much stronger than an unnecessarily complex platform.
D. It forces technical realism with your NVIDIA API keys
Your nvapi keys are an asset, but the prompt prevents Claude from treating NVIDIA's ecosystem as a magical free unlimited inference buffet.

The architecture must be based on actual:
- Available models
- Supported endpoints
- Quotas
- Rate limits
- API compatibility
- Inference latency
We should also avoid making the project dependent on one external LLM call for every action. Your citation verification, source metadata matching, evidence extraction and status logic should have deterministic components wherever possible.
E. It prepares for the surprise phase
This is one of the most important parts of the hackathon.

Your product shouldn't be a fragile demo where changing one requirement requires rewriting the application.

We should build the core around modular components so, when the judges introduce a new constraint, we can modify the relevant component rather than dismantle the entire project. Humans invented hackathons, then added surprise requirements, apparently because normal deadlines weren't entertaining enough.

4. The part that will actually make your project unique
Even this prompt cannot guarantee uniqueness. No prompt can. If another team independently discovers the same problem and builds a similar solution, you can still converge.

Your actual competitive advantage needs to come from how deeply we investigate the problem, which problem we choose, and how convincingly we implement it.

For this hackathon, I would specifically encourage Claude to investigate problems beyond simply detecting hallucinated citations.

Research contradictions

Identifying where credible research disagrees, and explaining whether the disagreement comes from methodology, population, assumptions, or results.

Evidence distortion

Detecting when an AI-generated statement is technically related to a paper but overstates, misinterprets, or misrepresents its actual findings.

Citation dependency

Discovering when apparently multiple sources rely on the same foundational paper, dataset, or original finding instead of providing independent corroboration.

Research uncertainty mapping

Showing what a researcher knows, what the evidence supports, what remains uncertain, and where additional research is actually needed.

Methodology-aware evidence

Comparing research findings while accounting for differences in study design, sample size, conditions, variables, and limitations rather than treating every paper as equal.

These are directions worth investigating, not the features I would immediately commit to building. Some are already explored in existing research tools, and some could be technically difficult to demonstrate reliably. We need to validate them before choosing.

5. How I recommend we use Claude throughout this hackathon
Don't use Claude as a one-shot project generator. Use it as a persistent project partner with separate stages.
Stage 1
Discover

Understand the rubric, research the problems, and identify opportunities.

Stage 2
Challenge

Generate concepts, attack them, identify competitors, and eliminate weak ideas.

Stage 3
Commit

Lock the problem, solution, scope, product features, and demo.

Stage 4
Engineer

Architecture, database, APIs, models, UI, verification, and implementation.

Stage 5
Stress-test

Break the system, test edge cases, challenge evidence integrity, and fix failures.

Stage 6
Win the demo

Create the presentation, narrative, demo script, fallback, and judge defense.

6. One additional instruction I would add to Claude
At the end of every brainstorming session, use this instruction to prevent Claude from giving you a pile of ideas and leaving you to figure out which ones are actually useful.
```

</details>

<details>
<summary>Pasted with this prompt: planning notes from our ChatGPT conversation (2 of 3) · 18 lines</summary>

```text
### END-OF-SESSION STRATEGIC REVIEW

Before concluding any session, perform the following:

1. Summarize the decisions we actually made.
2. Separate approved decisions from unresolved ideas.
3. Identify any assumptions we have not validated.
4. Identify the weakest part of our current thinking.
5. Identify what competitors could easily replicate.
6. Identify any technical risks or dependencies.
7. Record what must be preserved for the next session.
8. Recommend the single most valuable next action.

Do not silently change previously approved decisions.

Maintain a project decision log and update it whenever a decision is approved, reversed, or modified.

Never confuse a brainstormed idea with an approved project requirement.
```

</details>

<details>
<summary>Pasted with this prompt: planning notes from our ChatGPT conversation (3 of 3) · 24 lines</summary>

```text
7. My recommendation for your starting strategy
Given your constraints, I would not start by deciding that we're building a multi-agent research assistant.

Instead, I would try to find a very specific failure in the research process that:
- Is genuinely frustrating to students.
- Has meaningful consequences.
- Is not adequately solved by simply asking ChatGPT to summarize a PDF.
- Can be demonstrated using real research papers.
- Has a technically measurable result.
- Can work using free resources.
- Has a visually compelling demonstration.
- Can be built into a functioning product in the available time.
- Is difficult for judges to dismiss as another chatbot wrapper.
The multi-agent architecture should be earned by the problem. If three agents genuinely provide different forms of reasoning or independent validation, use them. If one deterministic pipeline and one LLM outperform three agents, use that instead. Judges are evaluating the solution, not the number of artificial employees you've hired.
What I would do next
1. Put the master prompt into Claude.
2. Upload the Rules and Regulations document.
3. Upload the Submission Guidelines and Rubrics document.
4. Upload the problem statement.
5. Let Claude complete Phase 0 only.
6. Review the rubric and restrictions before brainstorming.
The strongest approach here is to avoid settling on a project idea tonight. Spend the initial ideation effort finding a problem other teams are likely to overlook. Once we identify that problem, we can build the product around it rather than inventing features first and desperately searching for a reason they should exist.

The goal isn't to build the most AI-heavy project at the hackathon. It's to make the judges realize there's a problem they hadn't properly considered, and then show them that your solution actually solves it.
```

</details>

**Result:** Claude started reading the DOCS folder; stopped by the next prompt.

<a id="prompt-2"></a>

## 2 · Tue 24 Nov, 9:06 PM · Build conversation

> stop

**Result:** Stopped the first run, to add instructions.

<a id="prompt-3"></a>

## 3 · Tue 24 Nov, 9:07 PM · Build conversation

> i have given the link which is a public link and i also have claude in chrome mcp so use that no building from text and read both the documents from docs folder so you'll understand everything i am trying to build if you don't understand anything ask me do not ignore anything

**Result:** Claude read the problem statement and the submission guidelines. The ChatGPT link was a private `chatgpt.com/c/` link and Claude in Chrome was not connected, so Claude asked for a public share link and asked three questions.

<a id="prompt-4"></a>

## 4 · Tue 24 Nov, 9:16 PM · Build conversation

> https://chatgpt.com/share/6b05c258-d564-83ed-85e4-9870e54832a1 this is the link
> 1. the rules and regulations is just guildlines and rubrics and yes 
> 2.yes this is the only problem statement common for everyone that's why it has to be unique
> 3.Yes on the first slide team name is team 6 and the names are neel mohit and anand

**Result:** Claude read our ChatGPT research and built the first 6-slide ClaimTrace deck, as a PowerPoint and an HTML version made from one shared slide file, and checked it in PowerPoint and Chrome.

<a id="prompt-5"></a>

## 5 · Tue 24 Nov, 9:48 PM · Build conversation

> now create me a .md file showing what is the problem what is our proposed solution how are we approaching the problem why are we going for this the tool stack used and everything about the project in this.md file

**Result:** Created `ClaimTrace_Project_Overview.md`: problem, solution, approach, workflow, architecture, tool stack, guardrails, ethics, governance and a decision log.

<a id="prompt-6"></a>

## 6 · Tue 24 Nov, 10:21 PM · Build conversation

> @DOCS/ClaimTrace_Review_v2.docx use this report on understanding what is left and start building it with a good ui with motion animation make it crisp and professional for researchers i want a good ui interface and not the same black slop i want it in white background the UI should be immpecabble and also use 21st.dev , react bits or any other site for UI and for building follow the .md file and the changes mentioned in the report i want you to build a proper MVP not just some random project with ai slop and ui this mvp should be worth presenting that can be actually used so start building it and make it in such a way that you follow all the rules of syste design and once again i do not want ai slop ui i want a professional website with a specifically good selectted theme of colors , good and sleak designs motions animations and everything

**Result:** Built the website MVP in `claimtrace/` (Next.js + React): library, search, an editor where citations become claims, the reference Verifier, the Skeptic claim check, review, export gate and audit log. 52 unit tests passed. Stopped during the phone-layout check.

<a id="prompt-7"></a>

## 7 · Wed 25 Nov, 12:09 AM · Build conversation

> let's stop here for now we will continue it tommorow just list what all is left

**Result:** No reply; the model was switched and the request repeated (next prompt).

*Wed 25 Nov, 12:10 AM: switched the model to Claude Haiku 5.5.*

<a id="prompt-8"></a>

## 8 · Wed 25 Nov, 12:10 AM · Build conversation

> just list what is left then we continue it tommorow

**Result:** Listed what was left: deck notes, a fresh end-to-end test, phone layouts, the live AI path and the evaluation sets.

*Wed 25 Nov, 7:30 PM: switched the model to Claude Opus 5.5.*

<a id="prompt-9"></a>

## 9 · Wed 25 Nov, 7:34 PM · Review conversation

> *[pasted: the audit brief, shown below]*

<details>
<summary>Pasted with this prompt: the audit brief · 1137 lines</summary>

```text
# CLAIMTRACE — MASTER MVP FORENSIC AUDIT & TECHNICAL REVIEW

## ROLE

Act as an independent Principal Software Architect, Senior AI Engineer, Product Auditor, Security Reviewer, UX Critic, and adversarial technical reviewer.

You are conducting a comprehensive audit of the existing ClaimTrace project.

You are NOT the developer assigned to improve it.

You are NOT permitted to implement fixes.

Your responsibility is to deeply inspect the existing project, understand what has actually been built, determine whether the MVP achieves its intended purpose, identify weaknesses, expose technical and product failures, and produce a prioritized list of recommended changes.

Approach this as if you were reviewing a product before it is presented to hackathon judges, users, investors, or a technical review panel.

Be independent, skeptical, evidence-driven, and technically rigorous.

Do not assume that because something has been implemented, it is correct.

Do not assume that because a feature exists in the UI, it actually works.

Do not assume that because the application runs, the architecture is sound.

Do not assume that because AI produces a response, the response is reliable.

Your objective is to determine the actual state of the product, not to make the project appear better than it is.

---

# 1. PROJECT CONTEXT

## Product

ClaimTrace is an AI-assisted academic research platform designed to help researchers manage research material, evaluate evidence, understand research sources, and maintain citation integrity.

The hackathon problem emphasizes the following fundamental issues:

- AI-generated fabricated references
- Incorrect bibliographic metadata
- Claims attributed to sources that do not support them
- Misinterpreted research findings
- Unsupported statements presented as facts
- Lack of transparency regarding what is verified and what is uncertain
- Difficulty tracing claims back to original evidence

The intended direction is to combine research assistance with trustworthy evidence handling, source traceability, research organization, and human oversight.

However, do not treat the above description as proof that the current implementation actually achieves these objectives.

You must audit the implementation against the intended product goals.

---

# 2. STRICT AUDIT-ONLY MODE

This is an inspection and analysis task only.

## ABSOLUTELY PROHIBITED

Do not:

- Modify any source code
- Modify any configuration files
- Modify any database schemas
- Modify any dependencies
- Install packages
- Upgrade or downgrade packages
- Delete files
- Rename files
- Move files
- Generate replacement source files
- Apply patches
- Refactor code
- Fix bugs
- Run code formatting that modifies files
- Run migrations
- Modify environment variables
- Change API configurations
- Commit changes
- Create branches
- Change Git state
- Modify the project in any way

Do not attempt to fix an issue while investigating it.

Do not automatically execute commands that may modify the project or its environment.

Read-only inspection, static analysis, safe diagnostic commands, and non-mutating testing are permitted where appropriate.

If a diagnostic or test could modify project data, databases, files, caches, or configuration, do not run it without first assessing its potential side effects.

If you are uncertain whether an operation is destructive or mutating, do not execute it.

## AUDIT BOUNDARY

You must remain an auditor throughout this task.

Your output must contain findings, evidence, analysis, recommendations, priorities, and proposed changes.

You must NOT implement any of the proposed changes.

Do not interpret my request to audit the project as permission to make improvements.

At the end, explicitly confirm whether any files were modified during your audit.

---

# 3. ESTABLISH THE ACTUAL PROJECT STATE

Before forming opinions, inspect the project comprehensively.

Examine the project structure and determine:

- What files exist
- How the project is organized
- Which components exist
- Which components are missing
- How the application starts
- The entry points
- The backend architecture
- The frontend architecture
- The data layer
- The database
- The AI integration
- The API integrations
- The authentication and authorization mechanisms, if present
- The environment configuration
- The dependencies
- The deployment configuration
- The documentation
- The tests
- The implementation status of features

Do not limit yourself to the README or documentation.

Inspect the actual source code.

Documentation may be outdated, incomplete, misleading, or inconsistent with the current implementation.

Establish the difference between:

1. Implemented and demonstrably functional
2. Implemented but unverified
3. Partially implemented
4. UI-only or simulated
5. Placeholder implementation
6. Planned but not implemented
7. Broken
8. Unclear due to insufficient evidence

Create an implementation inventory.

For each major feature, identify the relevant files and explain what the implementation actually does.

Do not claim that a feature works unless you have sufficient evidence.

---

# 4. PRODUCT AND MVP AUDIT

Determine whether the MVP actually solves a meaningful research problem.

Evaluate the product from the perspective of a real student or researcher using it for an academic assignment or research project.

Investigate the following.

## A. Problem-solution alignment

- Does the application solve the core problem in the hackathon statement?
- Is the problem clearly defined within the product?
- Is the solution meaningfully different from a generic AI chatbot?
- Does the MVP solve an actual user pain point?
- Is the product focused or overloaded with unrelated features?
- Are its features connected to a coherent product objective?
- Does the implementation deliver the value proposition it claims?

## B. Feature completeness

For every major feature:

- What is the intended purpose?
- What has actually been implemented?
- What inputs does it accept?
- What outputs does it produce?
- What happens under normal conditions?
- What happens when inputs are invalid?
- What happens when data is missing?
- What happens when an external API fails?
- What happens when the AI returns malformed or incorrect results?
- Is the workflow complete from start to finish?
- Does the feature provide actual utility or merely create the appearance of functionality?

Identify incomplete workflows, disconnected components, redundant features, missing functionality, and features that are unnecessary for the MVP.

## C. User experience

Evaluate the application as a first-time user.

Inspect:

- Navigation
- Information hierarchy
- Onboarding
- Discoverability
- User flow
- Interaction consistency
- Visual hierarchy
- Readability
- Feedback
- Error messages
- Loading states
- Empty states
- Responsiveness
- Accessibility
- Cognitive load
- Confusing terminology
- Unnecessary interactions
- Dead ends
- Unclear system status

Determine whether the UI is helping the user accomplish the task or simply displaying features.

Identify usability issues with specific evidence.

---

# 5. AI SYSTEM AND INTELLIGENCE AUDIT

Conduct a rigorous review of every AI-related component.

Identify:

- Which models are used
- Where inference occurs
- Which prompts are used
- How context is assembled
- How user inputs are processed
- Whether the system uses retrieval
- How retrieved content is ranked
- How sources are selected
- How AI output is structured
- How AI responses are validated
- How errors are handled
- Whether AI calls are unnecessarily repeated
- Whether deterministic logic would be more reliable
- Whether the model is being used for tasks it is poorly suited to perform

## Hallucination and reliability risks

Investigate whether the application can:

- Invent citations
- Invent authors
- Invent titles
- Invent DOI identifiers
- Misattribute claims
- Misinterpret abstracts
- Misinterpret full-text content
- Confuse correlation and causation
- Ignore methodology limitations
- Misrepresent a source's conclusion
- Generate unsupported information
- Treat an AI inference as a verified fact

Determine whether the architecture actively prevents these failures, detects them, or simply relies on the model to behave.

Do not accept a prompt containing "do not hallucinate" as a technical safeguard.

## Evidence integrity

Determine whether verification is actually granular.

Distinguish:

- Source existence
- Metadata validity
- Content availability
- Evidence retrieval
- Claim-to-source relevance
- Claim entailment
- Quote accuracy
- Interpretation accuracy
- Contradiction handling

Determine whether the system incorrectly conflates these verification stages.

Investigate whether a valid paper is automatically treated as support for a claim.

Identify cases where the system might produce a technically valid citation that nevertheless misleads the researcher.

## AI architecture quality

Evaluate:

- Prompt design
- Context management
- Structured outputs
- Schema validation
- Retry logic
- Model fallback
- Token usage
- Latency
- Cost or quota management
- Provider dependencies
- Model limitations
- Reproducibility
- AI observability
- Error handling

Identify where the AI architecture is unnecessarily complex, too simplistic, unreliable, or poorly separated from deterministic logic.

---

# 6. RESEARCH SOURCE AND CITATION PIPELINE AUDIT

Trace the complete citation workflow from input to final output.

Inspect the actual implementation of:

- Source discovery
- Search
- Metadata extraction
- DOI resolution
- Bibliographic matching
- Duplicate detection
- Source ingestion
- PDF handling
- Document parsing
- Text extraction
- Chunking
- Embeddings, if used
- Retrieval
- Source selection
- Citation formatting
- Claim generation
- Evidence linking
- Citation validation
- Export

Identify the precise points where data can be corrupted, lost, misidentified, misrepresented, or incorrectly attributed.

Investigate:

- DOI mismatches
- Duplicate references
- Incorrect metadata
- Missing authors
- Incorrect publication years
- Incomplete metadata
- Ambiguous titles
- Multiple papers with similar titles
- Preprints versus published versions
- Retracted papers
- Unavailable source content
- Broken references
- Invalid citation formatting
- Unsupported claims
- Incorrect quotations
- Citation style errors

Determine whether source verification is real, superficial, or dependent on assumptions.

For every significant weakness, identify the relevant implementation files and explain the consequences.

---

# 7. ARCHITECTURE AND ENGINEERING AUDIT

Conduct a full technical review of the system.

## Architecture

Evaluate:

- Separation of concerns
- Modularity
- Component coupling
- Cohesion
- Abstraction
- Reusability
- Maintainability
- Extensibility
- Scalability
- Architectural consistency
- Dependency management

Determine whether the architecture is appropriate for the actual MVP.

Identify:

- Overengineering
- Underengineering
- Unnecessary abstraction
- Monolithic components
- Circular dependencies
- Fragile dependencies
- Tight coupling
- Architectural bottlenecks
- Inconsistent patterns
- Technical debt

## Backend

Evaluate:

- API structure
- Validation
- Business logic
- Error handling
- Async behavior
- Concurrency
- Timeouts
- Rate limits
- Data processing
- Logging
- Service boundaries

## Frontend

Evaluate:

- Component structure
- State management
- API communication
- Data consistency
- Loading behavior
- Error states
- UI/backend synchronization
- Unnecessary complexity
- Performance

## Database and persistence

Evaluate:

- Schema design
- Data integrity
- Relationships
- Constraints
- Indexing
- Duplicate handling
- Persistence behavior
- Migration strategy
- Data consistency
- Storage efficiency

Determine whether information is actually persisted or merely retained temporarily in application state.

## API and integrations

Review all integrations.

For each integration, identify:

- Purpose
- Dependency
- Required credentials
- Free-tier constraints, if known from configuration or documentation
- Rate-limit handling
- Failure handling
- Fallback behavior
- Data dependencies
- Fragility

Identify any critical feature that becomes unusable when one external service fails.

---

# 8. SECURITY, PRIVACY, AND DATA GOVERNANCE AUDIT

Review the implementation for realistic security and privacy risks.

Inspect:

- API key handling
- Secret management
- Environment files
- Exposed credentials
- Frontend secret exposure
- Input validation
- File uploads
- File processing
- Path traversal risks
- Injection risks
- SQL injection
- XSS
- SSRF
- Unsafe document parsing
- Insecure API calls
- Authentication
- Authorization
- Session handling
- User data exposure
- Logging of sensitive data
- Dependency vulnerabilities
- Unnecessary permissions

Do not assume the application requires enterprise-grade security for a hackathon MVP.

Instead, classify risks based on the current product, its users, its deployment environment, and the data it actually processes.

Clearly distinguish:

- Confirmed vulnerabilities
- Potential vulnerabilities
- Security hardening recommendations
- Risks that are not currently relevant to the MVP

Never expose the contents of secrets or API keys in your report.

If a secret appears to be exposed, identify its location and the severity without reproducing the secret itself.

---

# 9. TESTING AND RELIABILITY AUDIT

Determine whether the MVP can be trusted to work consistently.

Inspect the available tests.

Evaluate:

- Unit test coverage
- Integration test coverage
- End-to-end coverage
- API tests
- Data validation tests
- AI output validation
- Citation validation
- Error handling tests
- Edge cases
- Regression tests

Do not equate the existence of tests with adequate testing.

Identify the most important untested paths.

If safe, run read-only or non-destructive diagnostics and tests.

Before running any test, assess whether it may modify databases, files, external services, or project state.

Do not run destructive tests.

If tests cannot be run, explain exactly why and distinguish static findings from runtime findings.

Identify failure scenarios such as:

- Network failure
- API rate limits
- API timeouts
- Invalid user input
- Empty research results
- Malformed PDF
- Unsupported document
- Missing DOI
- Duplicate papers
- Incorrect AI output
- Invalid structured response
- Large files
- Slow processing
- Interrupted workflow

Assess whether the application has graceful degradation or simply fails.

---

# 10. PERFORMANCE AND RESOURCE EFFICIENCY

Evaluate the product under realistic hackathon constraints.

Identify:

- Slow workflows
- Unnecessary API calls
- Repeated inference
- Inefficient processing
- Large memory usage
- Expensive operations
- Poor caching
- Unnecessary model usage
- Excessive token consumption
- Bottlenecks
- Potential concurrency problems

Determine whether performance issues are likely to affect a live demonstration.

Do not invent performance metrics.

If performance has not been measured, classify it as unverified and recommend what should be measured.

---

# 11. UX, PRODUCT DIFFERENTIATION, AND HACKATHON COMPETITIVENESS

Audit ClaimTrace not only as software, but as a hackathon product.

Evaluate whether it:

- Is memorable
- Has a clear identity
- Has a compelling use case
- Solves a meaningful problem
- Demonstrates something competitors are unlikely to show
- Makes its value obvious within 60 seconds
- Has a strong demonstration narrative
- Provides an observable and convincing result
- Is sufficiently differentiated from ChatGPT, Zotero, Mendeley, SciSpace, and generic AI research assistants

Identify whether the current product is vulnerable to being described as:

- Another AI chatbot
- Another PDF summarizer
- Another citation generator
- Another research dashboard
- A superficial AI wrapper
- A collection of disconnected features

Do not criticize the product merely because it resembles existing tools.

Critique it based on whether it provides genuine value, differentiated functionality, and credible implementation.

Determine:

1. What is genuinely innovative in the current MVP?
2. What is not innovative?
3. What is easily replicated?
4. What is missing for the product to stand out?
5. What is its strongest potential differentiator?
6. What should be removed to strengthen its focus?
7. What should be improved to make the demo compelling?

---

# 12. DESIGN AND UI AUDIT

Evaluate the visual design independently of the product functionality.

Inspect:

- Typography
- Color system
- Spacing
- Layout
- Consistency
- Hierarchy
- Density
- Component design
- Dashboard structure
- Navigation
- Interaction design
- Responsiveness
- Accessibility
- Visual polish

Determine whether the design looks:

- Professional
- Cohesive
- Modern
- Research-oriented
- Trustworthy
- Distinctive

Identify design decisions that make the product appear generic, unfinished, confusing, overly complex, or untrustworthy.

Do not recommend cosmetic changes that have no meaningful impact unless they are necessary for the hackathon presentation.

---

# 13. CODE QUALITY AND TECHNICAL DEBT

Inspect the codebase for:

- Duplicate code
- Dead code
- Unused dependencies
- Unused components
- Poor naming
- Inconsistent coding patterns
- Excessively large files
- Poorly structured functions
- Hardcoded values
- Hidden assumptions
- Fragile logic
- Incomplete abstractions
- Excessive complexity
- Poor separation of concerns
- Missing type safety
- Inadequate validation
- Poor error handling
- Technical debt

For every major finding:

- Explain the issue
- Identify where it occurs
- Explain why it matters
- Describe the potential impact
- Recommend the direction of improvement

Do not refactor.

Do not generate replacement code.

---

# 14. CROSS-COMPONENT AND END-TO-END AUDIT

This section is critical.

Do not audit every file in isolation.

Trace the most important user journeys across the entire system.

For each workflow, trace:

USER INPUT
→ FRONTEND
→ API
→ BUSINESS LOGIC
→ DATA PROCESSING
→ AI OR EXTERNAL SERVICE
→ VALIDATION
→ DATABASE
→ RESPONSE
→ UI PRESENTATION

Identify:

- Broken links between components
- Data mismatches
- Inconsistent assumptions
- Incorrect state transitions
- Missing validation
- Lost information
- Duplicate processing
- Unexpected side effects
- Failure propagation
- Features that work individually but fail when combined

Determine whether the system works as a cohesive product or merely as a collection of components.

---

# 15. FINDINGS CLASSIFICATION

Classify every finding using the following severity levels.

## CRITICAL

A problem that makes the product fundamentally unusable, creates a severe security or integrity failure, or invalidates a core product capability.

## HIGH

A significant issue affecting core functionality, reliability, research integrity, security, or the ability to deliver a credible demonstration.

## MEDIUM

A meaningful weakness that reduces quality, usability, maintainability, reliability, or product effectiveness but does not immediately invalidate the MVP.

## LOW

A minor issue, polish opportunity, or non-blocking improvement.

## INFORMATIONAL

An observation, design trade-off, or opportunity that is not necessarily a defect.

Do not inflate severity.

Severity must reflect actual impact, not how interesting a finding is.

---

# 16. EVIDENCE REQUIREMENTS

Every finding must be evidence-based.

For each finding, include:

- Finding ID
- Title
- Severity
- Category
- Location
- Evidence
- Explanation
- Impact
- Recommended direction
- Confidence

## Location

Specify:

- File path
- Function, class, component, or section
- Line number, if available

## Evidence

Provide a specific reference to the implementation.

Do not say:

"The architecture is poor."

Instead explain:

- What implementation exists
- Where it exists
- Why it creates a problem
- What happens because of it

## Confidence

Use:

- HIGH: directly confirmed by implementation or reproducible evidence
- MEDIUM: strong evidence but some behavior remains unverified
- LOW: plausible risk that requires further investigation

Do not present speculation as a confirmed defect.

---

# 17. REQUIRED FINAL REPORT

Your final report must follow this structure.

## SECTION 1: EXECUTIVE SUMMARY

Provide:

- Overall MVP assessment
- Current maturity
- Biggest strengths
- Biggest weaknesses
- Core product risks
- Whether the MVP is ready for demonstration
- Whether it is ready for judging

Provide a candid verdict.

Do not artificially praise the project.

---

## SECTION 2: ACTUAL IMPLEMENTATION INVENTORY

Create a table:

| Feature | Intended Purpose | Actual Implementation | Status | Evidence |
|---|---|---|---|

Use status labels:

- Functional and verified
- Implemented but unverified
- Partially functional
- UI-only
- Placeholder
- Broken
- Missing

---

## SECTION 3: TOP CRITICAL ISSUES

List the highest-impact problems first.

For each issue provide:

- ID
- Severity
- Problem
- Evidence
- Consequence
- Recommended direction

Prioritize product-breaking issues, evidence integrity, reliability, and security over cosmetic improvements.

---

## SECTION 4: DETAILED AUDIT FINDINGS

Organize findings under:

1. Product and MVP
2. AI architecture
3. Research integrity
4. Citation and evidence pipeline
5. Backend
6. Frontend
7. Database and persistence
8. APIs and integrations
9. Security and privacy
10. Testing and reliability
11. Performance
12. UX and design
13. Code quality
14. Architecture
15. End-to-end workflows
16. Hackathon competitiveness

For every finding, use the evidence format defined above.

---

## SECTION 5: WHAT IS MISSING

Identify capabilities or architectural components that are genuinely absent and necessary for the MVP to deliver its core value.

Separate:

- Essential missing functionality
- Important but non-essential functionality
- Future enhancements
- Features that should not be built

Do not turn the MVP into an unrealistic enterprise product.

---

## SECTION 6: WHAT SHOULD BE REMOVED OR SIMPLIFIED

Identify:

- Unnecessary features
- Overengineering
- Redundant functionality
- Features that create complexity without meaningful value
- UI elements that distract from the core workflow
- AI usage that could be replaced by deterministic logic
- Components that should be simplified

Explain why removing or simplifying each item could improve the product.

---

## SECTION 7: RECOMMENDED CHANGE REGISTER

Create a prioritized change register.

| Priority | Change ID | Recommended Change | Reason | Dependencies | Effort | Impact |
||---|---|---|---|---|

Use the following priority levels:

### P0: Must fix

Issues that threaten core functionality, research integrity, security, or demo viability.

### P1: High value

Changes that substantially improve the product, reliability, usability, or competitive differentiation.

### P2: Improvements

Useful refinements that are not essential for the MVP.

### P3: Future

Long-term capabilities that should not consume hackathon time.

Estimate effort using:

- XS
- S
- M
- L
- XL

These estimates must be relative and must not pretend to be precise time measurements without enough information.

Do not implement any of these changes.

---

## SECTION 8: MVP IMPROVEMENT ROADMAP

Create a recommended order of implementation.

Group changes into:

### Stage A: Stabilization

Fix problems that prevent the application from functioning correctly.

### Stage B: Integrity

Address the risks that undermine trust, evidence, citations, and AI correctness.

### Stage C: Core value

Improve the primary user workflow.

### Stage D: Differentiation

Strengthen the product's unique capability.

### Stage E: Demo readiness

Improve the visual presentation, demo scenario, responsiveness, and reliability.

For each stage, identify dependencies and explain why the order matters.

---

## SECTION 9: THE 10 MOST IMPORTANT TESTS

List the 10 tests that should be performed before considering the MVP ready.

Include:

- Test scenario
- Expected behavior
- What failure would indicate
- Priority

Focus on the tests most likely to uncover serious defects.

---

## SECTION 10: HACKATHON JUDGE PERSPECTIVE

Pretend you are a skeptical judge evaluating ClaimTrace.

Answer:

- What would impress you?
- What would immediately disappoint you?
- What would you question?
- What claims would you not believe?
- What would appear superficial?
- What would make the project memorable?
- What would cause you to score it poorly?
- What changes would most increase its chances of winning?

Be candid.

---

## SECTION 11: FINAL VERDICT

Conclude with:

### Current MVP status

Choose one:

- Fundamentally broken
- Major gaps
- Functional but weak
- Promising but requires refinement
- Strong MVP
- Demo-ready
- Submission-ready

### The five most important changes

Rank the five changes that would deliver the greatest improvement.

### The single biggest weakness

Identify the one problem that currently most threatens the success of ClaimTrace.

### The single strongest opportunity

Identify the most promising improvement that could significantly differentiate ClaimTrace.

### Recommended next action

Identify the single next action the team should take after reviewing this audit.

---

# 18. AUDIT DISCIPLINE

Throughout this audit:

- Remain independent.
- Be skeptical.
- Be evidence-driven.
- Do not make assumptions about uninspected files.
- Do not fabricate functionality.
- Do not invent test results.
- Do not invent performance metrics.
- Do not invent vulnerabilities.
- Distinguish confirmed issues from risks.
- Distinguish implementation problems from product decisions.
- Distinguish missing functionality from intentional scope limitations.
- Avoid generic advice.
- Avoid recommending unnecessary technology.
- Avoid adding AI to problems that deterministic logic can solve.
- Prioritize user value and reliability.
- Prioritize issues that could cause the product to fail during judging.

If the project is too large to inspect fully within the available context, explicitly state what was inspected, what was not inspected, and what conclusions cannot yet be made.

Do not silently skip parts of the project.

---

# 19. FINAL SAFETY CHECK

Before returning the report, verify:

- [ ] The project structure was inspected.
- [ ] The actual implementation was reviewed.
- [ ] Major workflows were traced.
- [ ] AI components were audited.
- [ ] Citation and evidence integrity were examined.
- [ ] Architecture was reviewed.
- [ ] Security risks were examined.
- [ ] Testing and reliability were assessed.
- [ ] UI and UX were reviewed.
- [ ] Product differentiation was evaluated.
- [ ] Findings have specific evidence.
- [ ] Findings are prioritized.
- [ ] Recommendations are actionable.
- [ ] No changes were made to the project.

If any item cannot be completed, report it transparently.

## FINAL INSTRUCTION

Perform the audit only.

Do not edit, repair, rewrite, refactor, implement, or modify anything.

I want to understand the actual problems in the current MVP, why those problems matter, and exactly what changes should be made before I decide which improvements to approve.

Your task ends when the complete audit report and recommended change register have been delivered.

Nothing should be changed automatically.
```

</details>

**Result:** Independent, read-only audit of the MVP. Claude changed nothing and produced an audit report with numbered findings (CT-01 to CT-30) and recommended changes (CR-01 to CR-24). Main problems: OpenAlex refusing requests without a key, no AI key so the main check could not run, and a quote guard that was too weak.

<a id="prompt-10"></a>

## 10 · Wed 25 Nov, 8:00 PM · Review conversation

> can you explain everything in a simple and short summary in layman terms

**Result:** A short plain-language summary of the audit.

<a id="prompt-11"></a>

## 11 · Wed 25 Nov, 8:02 PM · Build conversation

> Fix the following content given in the audit report
>
> *[pasted: the audit report from prompt 9, shown below]*
>
> and how to get free open alex key let's build this

<details>
<summary>Pasted with this prompt: the ClaimTrace MVP audit report · 424 lines</summary>

```text
# ClaimTrace MVP audit report

**How I audited it:** I only read and inspected. I opened all files in `claimtrace/src/core`, `src/server`, `src/lib` and the API routes, plus the main UI components (claim card, review, export, report, library, source sheet, search, editor, write view, landing demo panel). I also read the README, the architecture doc, the eval results, the hackathon brief and rubric, and the deck spec.

**What I ran:**
- **Typecheck:** passed. I ran it with incremental mode off so it would not rewrite `tsconfig.tsbuildinfo`.
- **ESLint:** passed, with no cache and no autofix.
- **Unit tests:** 60 of 60 passed, with the cache off.
- **Probe script:** a small script in my scratch folder (outside the project) that called the pure core functions directly.
- **External APIs:** one anonymous request each to OpenAlex and Crossref. I sent no project or personal data.

**What I did not run:**
- `npm run dev` or `next build`, because they write `.next/`.
- `npm run eval` and `npm run demo:build`, because they overwrite `eval/*.json` and `src/lib/*.json`.
- `scripts/e2e.mjs`, because it needs a running server.

So **I never rendered the UI**. All UX and design findings come from reading the code.

---

## Section 1: Executive summary

**Overall:** the engineering is unusually solid for a hackathon MVP:
- Pure, tested domain rules.
- zod-validated routes.
- Labels that degrade honestly when the AI is unavailable.
- A real export gate.
- A well-thought-out three-step reference check (exists, matches, retraction).

But the product's **headline promise, "does the source actually say what the claim says?", is the weakest-guarded and least-tested part.** In the current environment, **it cannot run at all.**

**Maturity:** a feature-complete prototype. The logic is verified by unit tests, but the full journey has not been shown to work against live services in this environment.

**Biggest strengths**
- Clean layering: `core` (pure rules) → `server` adapters → thin routes → client actions → UI.
- The Verifier is deterministic and explainable. It checks DOI first, has a "Close match" state, separates retractions from notices, and shows its thresholds.
- Honest degradation: with no AI, claims show "Unchecked", never "Verified".
- The export gate, the student decisions with reasons, the audit log and the generated AI-use statement fit the brief and rubric very closely.

**Biggest weaknesses**
1. **OpenAlex now rejects keyless requests from your network.** I observed HTTP 429 with Retry-After ≈ 8.3 h, and no key is configured. Search (step 2) is broken right now. DOI lookups lose their OpenAlex abstracts.
2. **No AI key exists anywhere in this environment.** The demo project ships with **no pre-computed claim checks**. Without a live NVIDIA call, every demo claim shows "Unchecked".
3. **"Verified" on a claim is mostly an AI judgement.** The "code confirms the quote" step accepts any 3+ word fragment, or simply a sentence number. It proves the text exists, not that it supports the claim.
4. **A student can paste any text as the source** and get a green "Verified". Nothing in the label, report or statement says the evidence came from text the student pasted.
5. **The landing page panel says "live demo data" but is a scripted animation.** This breaks the rubric rule on labelling sample output and your own deck's governance promise.
6. **The deck does not match the app.** The deck describes Supabase Postgres and "AI in two places". The app uses browser storage and three AI roles. The rubric says the website must follow the deck, and the deck is due 9:00 AM tomorrow.

**Ready to demo?** Not in its current environment. With keys configured and one full live rehearsal, mostly yes.
**Ready for judging?** Not until P0 items CR-01 to CR-04 are done (all XS effort).

---

## Section 2: Actual implementation inventory

| Feature | Intended purpose | Actual implementation | Status | Evidence |
|---|---|---|---|---|
| Projects + demo project | Start from a question; showcase | Zustand store in localStorage; demo bundle with 9 pre-verified references and 11 claims; **no claim checks pre-filled** | Implemented but unverified | [store.ts](claimtrace/src/lib/store.ts), [demo.ts:9-13](claimtrace/src/lib/demo.ts#L9-L13) |
| Scout search plan | Question → queries (AI) | NIM chat → zod → cleaned queries; code fallback builds one keyword query | Implemented but unverified (mock tests only; no key, so the fallback runs) | [scout.ts](claimtrace/src/server/ai/scout.ts) |
| Literature search | Real records only | OpenAlex `search`, merged across queries by reciprocal rank | **Broken in current environment** (keyless 429) | [openalex.ts:94-103](claimtrace/src/server/sources/openalex.ts#L94-L103), live probe |
| Library: folders, tags, notes | Reference-manager basics | Store actions plus source sheet UI | Implemented but unverified | [source-sheet.tsx](claimtrace/src/components/library/source-sheet.tsx) |
| Add by DOI | Verify, then add | Crossref and OpenAlex by DOI in parallel, then merged | Partially functional (Crossref answers; OpenAlex 429, so no OA abstract or OA retraction cross-check) | [sources/index.ts:52-58](claimtrace/src/server/sources/index.ts#L52-L58) |
| Paste reference list | Check chatbot references | `verify-batch`: up to 40 refs, 3 workers, free-text matching | Implemented but unverified; at risk (CT-06, CT-09) | [verify-batch/route.ts](claimtrace/src/app/api/sources/verify-batch/route.ts) |
| BibTeX/RIS import | Import from Zotero etc. | citation-js parse, then **structured** verify per entry | Implemented, but with a matching flaw (CT-05) | [add-source-dialog.tsx:125-150](claimtrace/src/components/library/add-source-dialog.tsx#L125-L150) |
| Web source | Non-DOI sources | Always labelled "Student-added" | Implemented but unverified | [actions.ts:102-122](claimtrace/src/lib/actions.ts#L102-L122) |
| Verifier rules | Exists → matches → retraction | Deterministic rules, thresholds in one config file | Functional and verified (unit tests; team eval 46/46 on 24 Nov, not re-run by me) | [match.ts](claimtrace/src/core/verify/match.ts), [eval/](claimtrace/eval/) |
| Editor and claim extraction | Cite with `@`; each cited sentence becomes a claim | TipTap with citation node; claims taken from the editor JSON | Extraction verified by unit tests; editor UI unverified | [claims.ts](claimtrace/src/core/evidence/claims.ts) |
| Skeptic claim check | Does the source support the claim? | BM25 ranking, scope hints, LLM verdict and quote, code quote check | Implemented but unverified live; no key, so always "Unchecked" | [skeptic.ts](claimtrace/src/server/ai/skeptic.ts) |
| Scope, patchwriting, direct-quote checks | Catch overreach and copying | Regex scope rules (hints only), longest shared run of words, exact quote check | Functional and verified (unit tests) | [scope.ts](claimtrace/src/core/evidence/scope.ts) |
| Assistant "Explain this paper" | Summary grounded in sentences | LLM points plus a word-overlap grounding check; fallback picks key sentences | Implemented but unverified live | [assistant.ts](claimtrace/src/server/ai/assistant.ts) |
| Review, decisions, export gate | Checkpoints 2 and 3 | Labels → gate; decisions are tied to the label they were made against; sign-off | Gate logic verified by unit tests; UI unverified | [gate.ts](claimtrace/src/core/workflow/gate.ts) |
| Reference formatting and export | 5 styles, BibTeX, RIS, draft .txt | citation-js with CSL; output rebuilt through an allow-list sanitiser | Implemented but unverified | [citation.ts](claimtrace/src/lib/citation.ts) |
| AI-use statement | Disclosure | Template filled from the audit log | Partially functional (double counting, CT-11) | [statement.ts](claimtrace/src/core/workflow/statement.ts) |
| Integrity report | For the supervisor | Printable page | Partially functional (shows only the first source's evidence, CT-12) | [report-view.tsx:82](claimtrace/src/components/report/report-view.tsx#L82) |
| Source mix | Bias awareness | Descriptive statistics | Logic verified by unit tests; UI unverified | [source-mix.ts](claimtrace/src/core/workflow/source-mix.ts) |
| Landing "live demo" panel | Show the checks | **Hard-coded scenarios on timers**, labelled "live demo data" | UI-only (scripted) | [live-check.tsx:22-23, 114](claimtrace/src/components/landing/live-check.tsx#L22-L23) |
| Server database (Supabase) | Per the deck | None; localStorage only | Missing (but the deck says it exists) | [spec.js:220, 245](pitch-deck/src/spec.js#L220) |
| Auth, PDF/full-text ingestion | Not in scope | None | Missing (intentional) | README "Known limitations" |
| Skeptic accuracy evaluation | Prove the differentiator | None; the eval covers only the Verifier | Missing | [eval/](claimtrace/eval/) |

---

## Section 3: Top critical issues

**CT-01 · CRITICAL · OpenAlex rejects keyless calls; no key is configured**
- **Evidence:**
  - Live probe: `GET api.openalex.org/works?search=…` returned **HTTP 429**: "no API key… free daily budget shared by everyone on your network's IP address… used up… Keys are free". Headers showed `Retry-After: 30025`.
  - The key is only added if set ([openalex.ts:37-41](claimtrace/src/server/sources/openalex.ts#L37-L41)), and no env var or `.env.local` exists.
  - On a 429, [http.ts:43-47](claimtrace/src/server/http.ts#L43-L47) sleeps `min(retryAfter, 4s)` up to 3 times (about 12 s), then throws.
- **Consequence:**
  - Step 2 (search) returns 502.
  - DOI lookups drop the OpenAlex abstracts that most claim checks need.
  - Every OpenAlex call wastes about 12 s before failing.
  - At the venue (one shared NAT IP across many teams using OpenAlex, since everyone has the same brief) and on Vercel (shared egress IPs), the keyless budget is very likely to be exhausted. (That part is inferred from the observed per-IP policy.)
- **Recommended direction:** get a free OpenAlex key; set `OPENALEX_API_KEY` and `CONTACT_EMAIL` locally and on the host; document both as required, not optional.

**CT-02 · HIGH · The flagship check needs a live NVIDIA call, and there is no labelled fallback**
- **Evidence:**
  - There is no `NVIDIA_API_KEY` in the environment or in `.env.local` (which does not exist).
  - [demo.ts:12](claimtrace/src/lib/demo.ts#L12): "Claim checks are not pre-filled".
  - The demo data has 0 `bySource` entries.
  - The `"sample"` check mode exists in the types but is never produced ([types.ts:97](claimtrace/src/core/types.ts#L97)).
- **Consequence:** if the key is missing, NIM is slow or down, or the quota runs out during judging, the overreach demo shows 11 "Unchecked" claims. "Honesty and verification in action" (10 points) and "Working MVP" (15 points) both depend on it.
- **Recommended direction:**
  - Configure the key.
  - Record one real Skeptic run of the demo as a **clearly labelled "Sample"** fallback, using the existing `sample` mode.
  - Rehearse the demo live.

**CT-03 · HIGH · The quote re-check proves the text exists, not that it supports the claim**
- **Evidence:**
  - [quote.ts:17-23](claimtrace/src/core/evidence/quote.ts#L17-L23) accepts any normalised quote of 12 or more characters that appears inside a sentence.
  - [skeptic.ts:83](claimtrace/src/server/ai/skeptic.ts#L83) substitutes the full sentence when the model returns only an index.
  - Probe results:
    - The quote "mental health issues" passed with `ok: true, similarity 1`.
    - An index-only reply passed trivially.
  - The verdict comes from the model alone; the scope flags are only hints ([skeptic.ts:88-100](claimtrace/src/server/ai/skeptic.ts#L88-L100)).
- **Consequence:** whenever the model judges wrongly but picks or quotes real text, the claim gets a green "Verified" with the caption "Found in the source by code". The guarantee in the deck and README ("code confirms…") is narrower than it sounds.
- **Recommended direction:**
  - Require the evidence to be a near-whole sentence.
  - Require minimum word overlap between claim and evidence, or the evidence to be among the code's top-ranked sentences.
  - Rename the claim-level label to something like "Supported: evidence sentence found (AI-judged)".

**CT-04 · HIGH · Student-pasted text can produce "Verified", and this is never disclosed**
- **Evidence:**
  - `checkText` prefers `studentText` over the abstract ([model.ts:91-95](claimtrace/src/core/model.ts#L91-L95)).
  - The claim label ignores the text's origin ([labels.ts](claimtrace/src/core/workflow/labels.ts)).
  - The report says "confirmed in source by code" without mentioning where the text came from ([report-view.tsx:95](claimtrace/src/components/report/report-view.tsx#L95)).
  - The statement does not count claims checked against pasted text.
- **Consequence:** a one-step bypass. Paste text that agrees with the claim, get "Verified", export. A judge who asks "what stops a student pasting fake text?" has no good answer.
- **Recommended direction:**
  - Give "verified against pasted text" a distinct badge (for example "Supported by text you supplied").
  - Show the text's origin in the report and count it in the AI-use statement.

**CT-05 · HIGH · BibTeX/RIS import can turn a fabricated reference into a different real paper**
- **Evidence:**
  - `decideStructured` returns `close_match` for any title similarity from 0.5 to 0.9, regardless of author or year ([match.ts:60-74](claimtrace/src/core/verify/match.ts#L60-L74)).
  - The free-text path requires the same authors ([match.ts:119-125](claimtrace/src/core/verify/match.ts#L119-L125)).
  - Probe: a fabricated "Thompson 2021" title that was 72% similar to Kelly 2018 came back as **close_match** through the structured path and **not_found** as free text.
  - Imports use the structured path and pre-tick anything that is not "not_found" ([add-source-dialog.tsx:138](claimtrace/src/components/library/add-source-dialog.tsx#L138)).
  - One click on "Confirm" becomes "Verified" and replaces the metadata with the other paper's ([labels.ts:11](claimtrace/src/core/workflow/labels.ts#L11), [store.ts:151](claimtrace/src/lib/store.ts#L151)).
  - The eval only exercises the free-text batch path.
- **Consequence:** an invented reference gets "corrected" into an unrelated real paper, and the claim then cites a paper that never made it.
- **Recommended direction:** apply the free-text identity rule to the structured path too; add a test; make confirmation always go through the side-by-side comparison (see CT-20).

**CT-06 · HIGH · A database outage is reported as "Not found / may be invented"**
- **Evidence:**
  - `lookupDoi` uses `allSettled` and returns `null` unless **both** sources failed ([sources/index.ts:52-58](claimtrace/src/server/sources/index.ts#L52-L58)). So if one database errors and the other genuinely lacks the DOI, the result is "The DOI … is not registered" ([verifier.ts:28-35](claimtrace/src/server/verifier.ts#L28-L35)).
  - `candidatesFor` behaves the same way ([sources/index.ts:90-97](claimtrace/src/server/sources/index.ts#L90-L97)).
  - The UI then says the reference "may be invented" ([source-sheet.tsx:215](claimtrace/src/components/library/source-sheet.tsx#L215)).
- **Consequence:** a false accusation of fabrication, which is the worst failure for an integrity tool. It becomes more likely while OpenAlex is returning 429 and Crossref is throttled (CT-09). Confidence MEDIUM: the code path is certain; how often it happens is unmeasured.
- **Recommended direction:** if any source errored, return a distinct "Couldn't check: database unavailable" state that the gate treats like Unchecked, never "Not found".

**CT-07 · HIGH · The scripted landing demo is labelled "live demo data"**
- **Evidence:**
  - [live-check.tsx:22-77](claimtrace/src/components/landing/live-check.tsx#L22-L77) hard-codes the verdicts and evidence, which are revealed on timers (lines 96-100).
  - The header says "claim check · live demo data" (line 114).
  - It shows "Sentence found in the abstract by code" (line 166).
  - Rubric: "If part of your website shows sample AI output… label it clearly as a sample." The deck's Governance slide: "Any demo output that is not a live AI call is labelled 'Sample'."
- **Consequence:** a judge who spots it will discount the honesty narrative. This is the cheapest fix in the report.
- **Recommended direction:** relabel it "Sample: recorded results" and drop "live".

**CT-08 · HIGH · The deck contradicts the build, and the deck is due 9:00 AM**
- **Evidence:**
  - The deck shows a "SUPABASE POSTGRES" database ([spec.js:245](pitch-deck/src/spec.js#L245)) and says "AI runs in only two places" (line 220).
  - The app uses localStorage only ([store.ts:17-21](claimtrace/src/lib/store.ts#L17-L21)) and has **three** AI call sites (Scout, Skeptic, Assistant).
  - The Overview doc still lists Supabase as "Proposed / or browser storage?".
- **Consequence:** the rubric requires the website to follow the deck, and judges also score Architecture realism.
- **Recommended direction:** change the deck, not the code. Say "browser storage, no accounts (privacy by design)" and "three narrow AI roles".

---

## Section 4: Detailed audit findings

Confidence is shown as H, M or L (high, medium, low).

### 1. Product and MVP
| ID | Title | Sev | Location | Evidence → impact | Direction | Conf |
|---|---|---|---|---|---|---|
| CT-02 | Flagship check depends on live AI | HIGH | see §3 | — | — | H |
| CT-16 | The differentiator is unmeasured | MED | [eval/](claimtrace/eval/), [landing.tsx:326-346](claimtrace/src/components/landing/landing.tsx#L326) | "A measured accuracy" on the landing page refers only to the Verifier (46 references). The Skeptic, which is what makes ClaimTrace different from other teams' citation checkers, has no labelled test. Judges may assume the 100% figure covers claims. | Build a 15–20 item claim/abstract set covering supported, overreach, negation and wrong-sentence cases; publish the result honestly. | H |
| CT-27 | Multi-source claim takes the worst verdict | INFO | [labels.ts:26-29](claimtrace/src/core/workflow/labels.ts#L26-L29) | A claim citing A (supports) and B (doesn't) is shown as "Not supported". This is a defensible, conservative product choice. | Explain it in the UI tooltip. | H |

### 2. AI architecture
| ID | Title | Sev | Location | Evidence → impact | Direction | Conf |
|---|---|---|---|---|---|---|
| CT-03 | Weak quote guard | HIGH | see §3 | — | — | H |
| CT-29 | Scope rules cover only causal wording, certainty and "all/every" | INFO | [scope.ts](claimtrace/src/core/evidence/scope.ts) | Probe: "triples the risk" (magnitude) and "UK children" vs US adolescents (population) produce no flag. They are hints only, so the model may still catch them. | Optional: add simple magnitude and population cues. | H |
| — | Strengths | INFO | [client.ts](claimtrace/src/server/ai/client.ts) | Temperature 0, zod schemas, one repair attempt, a cache keyed on a hash of the prompt, a per-minute token budget, typed failure reasons, source text fenced as data. Well done. | Keep. | H |
| CT-30 | Caches and token budget are per instance | INFO | [cache.ts](claimtrace/src/server/cache.ts), [rate-limit.ts](claimtrace/src/server/rate-limit.ts) | On serverless hosting each instance has its own budget, so the "35/min" cap isn't global. Fine for an MVP. | Document it. | H |

### 3. Research integrity
| ID | Title | Sev | Location | Evidence → impact | Direction | Conf |
|---|---|---|---|---|---|---|
| CT-04 | Pasted-text bypass | HIGH | see §3 | — | — | H |
| CT-13 | Grounding and ranking ignore negation | MED | [tokens.ts:5-13](claimtrace/src/core/text/tokens.ts#L5-L13), [summary-check.ts](claimtrace/src/core/evidence/summary-check.ts) | "no", "not" and "nor" are stopwords. Probe: "…was **not** linked to mental health issues" gets grounding 0.86 against the positive sentence, so it is shown as linked to "Sentence 2". The Assistant can therefore show a contradicted point as grounded. | Keep negation words for grounding and flag polarity mismatches as AI reasoning. | H |
| CT-17 | "Verified" means two different things | MED | [labels.ts:42-48](claimtrace/src/core/labels.ts#L42-L48) | The same green "Verified" is used for a real reference and for an AI-judged supported claim. The caveat ("sentence found, not that the claim is true") sits in tooltips and the footer. | Use a distinct claim-level label (see CT-03). | H |
| CT-14 | Long text is cut off silently | MED | [skeptic.ts:42](claimtrace/src/server/ai/skeptic.ts#L42), [config.ts:27-28](claimtrace/src/core/config.ts#L27-L28) | Only the first 80 sentences or 20k characters are checked. A long pasted section can get "Not supported" when the evidence is further down, and nothing tells the student. | Show "checked the first N sentences". | H |

### 4. Citation and evidence pipeline
| ID | Title | Sev | Location | Evidence → impact | Direction | Conf |
|---|---|---|---|---|---|---|
| CT-05 | Structured/free-text matching differ | HIGH | see §3 | — | — | H |
| CT-06 | Outage shown as Not found | HIGH | see §3 | — | — | M |
| CT-10 | Re-verifying wipes the stored abstract | MED | [store.ts:151](claimtrace/src/lib/store.ts#L151), [crossref.ts:100](claimtrace/src/server/sources/crossref.ts#L100) | `{...src.record, ...record}` copies `abstract: undefined` from a Crossref-only result. "Check again" while OpenAlex is down erases the abstract, so later claim checks get "no text". | Merge only fields that are defined. | H |
| CT-15 | Exported files have no trust labels | MED | [export-view.tsx:125](claimtrace/src/components/export/export-view.tsx#L125) | The .txt, .bib and .ris files contain plain references. A "Student-added" or kept "Not found" reference exports like any other. The README says labels carry "through to export"; only the printed report shows them. | Annotate unverified entries in the .txt, or correct the README. | H |
| CT-20 | One-click close-match confirm skips the comparison | LOW | [claim-card.tsx:251-256](claimtrace/src/components/claims/claim-card.tsx#L251-L256) | The claim card confirms directly; only the source sheet shows the side-by-side table. This makes CT-05 worse. | Open the comparison instead of confirming. | H |
| — | Search results are checked against themselves | INFO | [actions.ts:51](claimtrace/src/lib/actions.ts#L51) | A saved OpenAlex record is verified using its own metadata, so "Verified" mainly reflects the DOI and retraction checks. That is acceptable. | Say so in the tooltip. | H |

### 5. Backend
| ID | Title | Sev | Location | Evidence → impact | Direction | Conf |
|---|---|---|---|---|---|---|
| CT-09 | Crossref throttling vs parallel workers | MED | [verify-batch/route.ts:25](claimtrace/src/app/api/sources/verify-batch/route.ts#L25), [actions.ts:80](claimtrace/src/lib/actions.ts#L80) | Probe: the public pool allows **1 request/second, concurrency 1**. The code runs 3 workers, each making parallel Crossref calls, with 400/800 ms backoff. A 40-reference batch could exceed `maxDuration = 60` and lose all results. No `CONTACT_EMAIL` is set. | Set `CONTACT_EMAIL`; limit concurrency per service; honour Retry-After; measure a 40-reference batch. | M |
| CT-25 | Request handling hardening | LOW | [api.ts:25-27, 42-44](claimtrace/src/server/api.ts#L25-L27) | The body is fully read before the size check. The per-IP limiter trusts `x-forwarded-for`. | Check Content-Length first; rely on the platform's IP. | H |

### 6. Frontend
| ID | Title | Sev | Location | Evidence → impact | Direction | Conf |
|---|---|---|---|---|---|---|
| CT-21 | "Find a better source" fails for long claims | LOW | [claim-card.tsx:286](claimtrace/src/components/claims/claim-card.tsx#L286), [api-schemas.ts:11](claimtrace/src/core/api-schemas.ts#L11) | Claims can be up to 1,200 characters but the plan request allows 500, so long claims get a 422 error. | Truncate before sending. | H |
| CT-26 | Filter tabs lack panels | LOW | [review-view.tsx:129-146](claimtrace/src/components/review/review-view.tsx#L129-L146) | `role="tab"` without `tabpanel`/`aria-controls`. | Use the existing Tabs component or plain buttons. | H |

### 7. Database and persistence
| ID | Title | Sev | Location | Evidence → impact | Direction | Conf |
|---|---|---|---|---|---|---|
| CT-22 | Data lives only in one browser | LOW | [store.ts](claimtrace/src/lib/store.ts) | No project export or import; clearing site data loses everything; judges on their own devices start empty (the demo button mitigates this). The deck mismatch is CT-08. | Add an "Export/import project (.json)" option using the existing `importBundle`. | H |

### 8. APIs and integrations
| Integration | Purpose | Credentials | Observed limits | Failure handling | Fragility |
|---|---|---|---|---|---|
| OpenAlex | Search, abstracts, retraction cross-check, OA status | `OPENALEX_API_KEY` (optional in the code, **required in practice**) | Keyless: per-IP daily budget, **exhausted now** | Retries, then 502; DOI path falls back to Crossref-only | **Critical** (CT-01) |
| Crossref | DOI registry, bibliographic match, Retraction Watch "updated-by" | None; `CONTACT_EMAIL` for the polite pool | Public: 1 req/s, concurrency 1 | Retries on 429/5xx; 404 cached for 6 h | High (CT-09) |
| NVIDIA NIM (Llama 3.3 70B) | Scout, Skeptic, Assistant | `NVIDIA_API_KEY` (not set) | ~40 RPM (community-reported) | Honest "Unchecked" or code fallback | High for the demo (CT-02) |

CT-18 · MED · Public, unauthenticated routes spend the team's NIM and OpenAlex quotas. Anyone can drain them during judging. Direction: an origin check or a simple shared demo token, and lower AI limits. Conf M.

### 9. Security and privacy
- **Confirmed fine:**
  - No secrets in tracked files (pattern scan; only `.env.example` is tracked).
  - Secrets are server-only, with no `NEXT_PUBLIC_` variables.
  - zod validation on every route.
  - Internal errors are not leaked.
  - `dangerouslySetInnerHTML` is fed only allow-list-rebuilt CSL output ([citation.ts:51-63](claimtrace/src/lib/citation.ts#L51-L63)).
- **Potential:**
  - Quota abuse (CT-18).
  - Prompt injection through student-pasted text. It is bounded by the schema and the quote check, but the real issue is CT-04.
  - Student-entered `javascript:` URLs would only affect the student's own browser; there is no sharing path. Not relevant to the MVP.
- **Privacy:** only the claim, the source label and the source text go to NIM. The server AI cache holds replies for 12 h in memory, so "Delete all my data" does not reach it. Informational.

### 10. Testing and reliability
CT-19 · MED · 60 unit tests cover the core rules and the AI parsing (with mocked fetch). **Untested:**
- Fragment and index-only quotes (CT-03).
- Structured close-match identity (CT-05).
- Partial upstream failure (CT-06).
- Abstract overwrite (CT-10).
- Connector mappers (`mapItem`, `mapWork`, `rebuildAbstract`).
- API routes.
- Store and actions.
- Any UI.

The e2e script exists but needs live services. The eval was run once, on 24 Nov, against live APIs that now behave differently. Conf H.

### 11. Performance
Unmeasured. Expected hotspots:
- About 12 s of wasted retries per OpenAlex 429 (CT-01).
- The 40-reference batch within 60 s (CT-09).
- "Check all" on the demo: about 13 claim/source pairs, 2 at a time, on a 70B model. Probably 30–90 s, **unverified**.

Measure all three before the demo.

### 12. UX and design (static review only)
- **Strong points:** a coherent 7-step model with checkpoints; every label has an icon and a name; good empty and "AI offline" states; clear "why Unchecked" reasons.
- **Risks** (LOW–MED, conf L because I never rendered it):
  - 10 workspace pages plus a landing page against a rubric line of "one core journey that works well".
  - Internal vocabulary ("Scout", "Skeptic", "Checkpoint 2") a first-time student must learn.
  - When the AI is offline the gate becomes N clicks of "Acknowledge" (CT-17-adjacent), which can look like honesty theatre.
  - Heavy use of Magic UI / React Bits motion may read as template polish.

### 13. Code quality
- **CT-23 · LOW:** `pitch-deck/node_modules` is committed (5,118 of 5,309 tracked files). Organisers will open this repo.
- **CT-24 · LOW:** dead code. The `"sample"` mode is never produced, and these components are unused: RotatingText, BlurFade, accordion, collapsible, kbd, toggle-group, scroll-area, alert.
- **Duplication:** the same record-key logic is defined in three places ([sources/index.ts:60](claimtrace/src/server/sources/index.ts#L60), [actions.ts:72](claimtrace/src/lib/actions.ts#L72), [search-view.tsx:27](claimtrace/src/components/search/search-view.tsx#L27)).
- **Otherwise:** strict TypeScript and lint are clean, and the naming is good.

### 14. Architecture
A strength. The layers are respected, the connector interface makes adding databases cheap, and the rules sit in one testable place. There is no over-engineering of note. The one structural gap is that **"lookup failed" is not a distinct verification state**, which is the root cause of CT-06.

### 15. End-to-end workflows (traced through the code)
1. **Demo → Review → Check → Decide → Export.** The claim card calls `checkClaim` in actions, which calls `/api/claims/check`, then the Skeptic, then `chatJson`. With no key, the check returns `unchecked/ai_unavailable` and the student must Acknowledge every claim, then sign off, then export. **Works, but the value (verdicts) is absent without a key** (CT-02).
2. **Question → Scout → Search → Save.** `/api/scout/plan` falls back to the code plan. `/api/sources/search` hits OpenAlex, gets 429 and returns **502**. **Breaks now** (CT-01).
3. **Paste chatbot references.** The batch is split into individual references and `verify-batch` runs free-text matching. The logic is sound, but it is exposed to CT-06 and CT-09 under load.
4. **BibTeX import.** Structured verification produces close matches that are pre-ticked; one-click confirm then marks them "Verified". **Integrity hole** (CT-05).
5. **Write → claims.** Editor JSON is turned into claims keyed by the sentence text and its sources. Edits correctly invalidate old checks. **Sound.**

### 16. Hackathon competitiveness
See Section 10.

---

## Section 5: What is missing

- **Essential:**
  - An OpenAlex key and contact email in config.
  - A labelled sample fallback for the Skeptic demo.
  - A "lookup unavailable" verification state.
  - Text-origin disclosure on claims.
  - A minimal Skeptic evaluation.
- **Important but not essential:**
  - Project export and import.
  - Labels inside exported files.
  - A notice when source text is truncated.
  - Negation-aware grounding.
- **Future:**
  - Server persistence with auth.
  - Retrieval of open-access full text.
  - An entailment (NLI) check alongside the LLM.
  - PubMed and Semantic Scholar connectors.
- **Should not be built:** a chat interface, a "credibility score", or more AI agents.

## Section 6: What should be removed or simplified

- **Landing "live" animation:** keep it, but label it as a sample. Honesty beats polish here.
- **Unused vendored components and the `sample` type:** remove them if they stay unused, or use `sample` properly (CR-06).
- **Committed `pitch-deck/node_modules`:** untrack it.
- **Demo path:** consider a single guided path ("Open demo → Review → Export") on the landing page so judges don't wander through 10 pages.
- **Scope rules:** keep them as code. They are a good example of deterministic logic doing a job that doesn't need the LLM.

## Section 7: Recommended change register

| Priority | ID | Recommended change | Reason | Depends on | Effort | Impact |
|---|---|---|---|---|---|---|
| P0 | CR-01 | Get a free OpenAlex key; set `OPENALEX_API_KEY` and `CONTACT_EMAIL` locally and on the host; mark them required in the README | CT-01, CT-09 | — | XS | Very high |
| P0 | CR-02 | Set `NVIDIA_API_KEY` locally and on the host; run every demo claim live once | CT-02 | — | XS | Very high |
| P0 | CR-03 | Relabel the landing animation as "Sample: recorded results" | CT-07 | — | XS | High |
| P0 | CR-04 | Fix the deck before 9:00 AM: browser storage instead of Supabase, three AI roles | CT-08 | — | XS | High |
| P0 | CR-05 | Add a "database unavailable" state; never show Not found when any lookup errored | CT-06 | — | S | High |
| P0 | CR-06 | Keep a recorded live Skeptic run of the demo as a visibly labelled `sample` fallback | CT-02 | CR-02 | S | High |
| P1 | CR-07 | Distinct label, report line and statement count for checks against pasted text | CT-04 | — | S | High |
| P1 | CR-08 | Strengthen the quote guard: near-whole sentence plus a minimum claim/evidence overlap | CT-03 | — | S | High |
| P1 | CR-09 | Apply the free-text identity rule to structured matches; add tests | CT-05 | — | XS–S | High |
| P1 | CR-10 | Merge records without overwriting defined fields with `undefined` | CT-10 | — | XS | Med |
| P1 | CR-11 | Fix the statement double count; mark an edited statement in the report | CT-11 | — | XS | Med |
| P1 | CR-12 | Show every source's evidence and text origin in the report | CT-12 | CR-07 | XS | Med |
| P1 | CR-13 | Rename the claim-level "Verified" label | CT-17 | CR-08 | XS | Med |
| P1 | CR-14 | Per-service concurrency limits and Retry-After handling; time a 40-reference batch | CT-09 | CR-01 | S | Med |
| P1 | CR-15 | Small labelled Skeptic eval, published honestly | CT-16 | CR-02 | M | High (differentiation) |
| P1 | CR-16 | Regression tests for CT-03, CT-05, CT-06 and CT-10 | CT-19 | CR-05, CR-08–CR-10 | S | Med |
| P1 | CR-17 | Close-match confirm in the claim card opens the comparison | CT-20 | — | XS | Med |
| P2 | CR-18 | Truncation notice | CT-14 | — | XS | Low–Med |
| P2 | CR-19 | Negation-aware grounding | CT-13 | — | S | Med |
| P2 | CR-20 | Labels in the exported .txt, or correct the README | CT-15 | — | XS | Low–Med |
| P2 | CR-21 | Project JSON export and import | CT-22 | — | S | Low–Med |
| P2 | CR-22 | Origin check or demo token on the API; lower AI limits | CT-18 | — | S | Med |
| P2 | CR-23 | Untrack `pitch-deck/node_modules`; remove dead code; truncate long claims for search; fix tab ARIA | CT-21, CT-23, CT-24, CT-26 | — | XS | Low |
| P3 | CR-24 | Supabase persistence with auth, open-access full text, an NLI check, more databases | Future | — | L–XL | — |

## Section 8: MVP improvement roadmap

- **Stage A: Stabilisation (tonight).** CR-01, CR-02, CR-04 (hard deadline 9:00 AM), CR-03. Configuration first, because every later check needs live services to be meaningful.
- **Stage B: Integrity.** CR-05, CR-09, CR-08, CR-07, CR-10. These close the paths that produce false "Not found" or false "Verified" results. Do them before any polish, because they are what a sharp judge will probe.
- **Stage C: Core value.** CR-06, CR-11, CR-12, CR-13, CR-17. Make the demo journey robust and the artifacts it produces accurate.
- **Stage D: Differentiation.** CR-15, CR-19. A measured claim-support result is something other teams are unlikely to have.
- **Stage E: Demo readiness.** CR-14, CR-22, CR-23, then a timed full rehearsal on the venue network, using a phone hotspot as backup. Leave the 90 minutes on the day for the 1:15 PM requirements, not for fixes.

## Section 9: The 10 most important tests

| # | Scenario | Expected | A failure would indicate | Priority |
|---|---|---|---|---|
| 1 | Run search with the key set, on the venue network | Results in under ~5 s | Quota or config issue (CT-01) | P0 |
| 2 | Demo "Check all" with a live key, timed | Correct overreach, retraction and not-found labels in under ~90 s | AI path or latency risk (CT-02) | P0 |
| 3 | Block OpenAlex (bad key), then verify a Crossref-only DOI | "Unavailable", never "Not found" | CT-06 | P0 |
| 4 | Import a .bib with a fabricated entry whose title resembles a real paper | Not found | CT-05 | P0 |
| 5 | Mock a Skeptic reply of "supported" with a 3-word fragment, or with only a sentence index for an irrelevant sentence | Rejected or downgraded | CT-03 | P0 |
| 6 | Paste fabricated supportive text for a source, then check | A distinct "pasted text" label, shown in the report | CT-04 | P1 |
| 7 | Paste a 40-reference chatbot list | Finishes under 60 s, with no false Not found | CT-09, CT-06 | P1 |
| 8 | "Check again" on a demo source while OpenAlex fails | Abstract preserved | CT-10 | P1 |
| 9 | AI key removed mid-demo | Every claim shows "Unchecked" with a clear reason, and the export gate still works | Degradation path | P1 |
| 10 | Confirm a close match, then export | Statement counts are consistent, and the report shows all evidence | CT-11, CT-12 | P2 |

## Section 10: Hackathon judge perspective

- **Would impress me:**
  - Pasting a chatbot's reference list and watching a fabricated DOI, a retraction and a wrong year each get a different, explained label.
  - The export lock and the generated AI-use statement.
  - "Verified means sentence found, not true" stated openly.
- **Would disappoint me immediately:**
  - Search failing with an error.
  - Every claim showing "Unchecked" because the key or quota failed.
  - Discovering that the "live demo data" panel is scripted.
- **Would question:**
  - "What stops a student pasting fake source text?"
  - "Your 100% accuracy: does it cover the claim checks?"
  - "The deck says Supabase. Where's the database?"
  - "Why is a reference flagged as possibly invented when it's real?"
- **Would not believe:** "Code confirms the evidence", if I learned that a 3-word fragment passes.
- **Would look superficial:** the animation libraries, and the number of pages compared with how deep the core check goes.
- **Would make it memorable:** one claim travelling live from draft to "Overreach", with the exact sentence highlighted, then the export gate refusing until the student decides.
- **Would score poorly on:** a broken live journey (15 points) and "Honesty in action" undercut by a mislabelled sample (10 points).
- **Would most raise its chances:** CR-01 to CR-06 plus one rehearsed, timed demo script that covers all four rubric Phase 2 criteria.

## Section 11: Final verdict

**Current MVP status: Promising but requires refinement.** The code is strong. The current environment cannot run the core journey, and three integrity holes undercut the main claim.

**The five most important changes**
1. CR-01 + CR-02: configure the OpenAlex key, contact email and NVIDIA key, then rehearse live.
2. CR-04 + CR-03: make the deck and the landing page honest and consistent with the build (deck before 9:00 AM).
3. CR-05: a database outage must never become "Not found".
4. CR-07 + CR-08: close the pasted-text and fragment-quote paths to "Verified".
5. CR-06: a labelled sample fallback so the flagship demo survives an AI outage.

**The single biggest weakness:** the headline feature depends on external services that are unconfigured or currently refusing requests (OpenAlex 429, no NVIDIA key), and there is no honest fallback. As things stand, the core journey cannot be demonstrated.

**The single strongest opportunity:** make claim-level evidence the measured, visible centrepiece. That means whole-sentence evidence, text-origin disclosure and a small published Skeptic accuracy result. Most teams will stop at "does the reference exist"; ClaimTrace can credibly show "does the source say it".

**Recommended next action:** get the free OpenAlex key, set all three environment variables, and run the full demo journey once against live services, noting every failure. In parallel, correct the two deck statements before the 9:00 AM deadline.

---

**Files modified during the audit:** none in the project. `git status` shows 0 changes, and `tsconfig.tsbuildinfo` and the eval files keep their original timestamps. The only writes were:
- A probe script in my scratch folder (outside the repo): `C:\Users\Neel\AppData\Local\Temp\claude\779d66052901ebb2\ff26ccaa-5bc2-42a3-896c-68d0b3d9d4fe\scratchpad\probe.mts`
- One note added to my own project memory (outside the repo).

**What I didn't fully cover:**
- Read only partly or by search: `landing.tsx`, `overview-view.tsx`, `projects-view.tsx`, `library-view.tsx`, `audit-view.tsx`, the sidebar and app shell, the trust and editor sub-components, `result-card.tsx`, `settings-view.tsx` (beyond the top), `globals.css`, the CSL style data, `build-demo.mts`, `e2e.mjs`, and the eval set contents.
- Not read: `ClaimTrace_Review_v2.docx` and the body of the Overview doc.
- No runtime UI, responsiveness or performance measurements were possible without starting the dev server, which writes to `.next/`.
```

</details>

**Result:** Fixed every audit finding, for example: a "Couldn't check" label so a database outage is never shown as "Not found"; a separate "Supported · your text" label; stricter evidence rules; request limits that follow Crossref's rules; project export and import. Updated the deck to match, and explained how to get a free OpenAlex key.

<a id="prompt-12"></a>

## 12 · Wed 25 Nov, 9:09 PM · Build conversation

> i want to ask can i have my personal email in contact_email

**Result:** Yes: the contact email stays on the server (in `.env.local` and the host's settings), is only sent to Crossref and OpenAlex, and never goes in the repository.

<a id="prompt-13"></a>

## 13 · Wed 25 Nov, 9:31 PM · Build conversation

> i don't have meta llama api key what else should i use i don't think i have any from meta itself

**Result:** Explained that the Llama model is hosted by NVIDIA, so the key comes from build.nvidia.com, not from Meta.

<a id="prompt-14"></a>

## 14 · Wed 25 Nov, 9:39 PM · Build conversation

> i have other nvidia keys but not llama 3.3 70b

**Result:** Explained how to use an existing NVIDIA key and what each possible error code would mean.

<a id="prompt-15"></a>

## 15 · Wed 25 Nov, 9:42 PM · Build conversation

> wait i am saying are there other models in nvidia itself instead of llama 3.3 70b instruct

**Result:** Checked NVIDIA's live model list: Llama 3.3 70B was no longer listed. Proposed other NVIDIA-hosted models.

<a id="prompt-16"></a>

## 16 · Wed 25 Nov, 9:46 PM · Build conversation

> okay i have added the key make the changes accordingly

**Result:** Confirmed that NVIDIA retired Llama 3.3 70B on 26 Aug 2026 (HTTP 410) and that the candidate models were live.

<a id="prompt-17"></a>

## 17 · Wed 25 Nov, 9:53 PM · Build conversation

> saved the key now, go ahead

**Result:** Started measuring the candidate models on our 20 labelled test claims.

<a id="prompt-18"></a>

## 18 · Wed 25 Nov, 10:05 PM · Build conversation

> okay wait for it and then finish everything

**Result:** Finished the comparison and switched the app to Nemotron 3 Ultra with its thinking step off: 19 of 20 correct (17 of 20 in an earlier run), none wrongly marked Supported, about 4 s a check. Rebuilt the deck with the new model.

<a id="prompt-19"></a>

## 19 · Wed 25 Nov, 10:36 PM · Build conversation

> wonderfull now how do it run it and als can you change the ppt UI and design to white background and not black

**Result:** Added `npm run local`, which avoids a OneDrive file-locking crash, and switched the deck to a white background.

<a id="prompt-20"></a>

## 20 · Wed 25 Nov, 11:02 PM · Build conversation

> the code is not running when open local host it shows dailed to load page

**Result:** Found that nothing was running. Added `Start ClaimTrace.cmd`, which builds the app and opens the browser once it is ready.

<a id="prompt-21"></a>

## 21 · Wed 25 Nov, 11:04 PM · Review conversation

> @pitch-deck/ClaimTrace_Team6_Pitch.pptx review this ppt and tell me what is missing if i approve then fix it and the content is related or UI related only primarily focus on UI

**Result:** Reviewed the deck with a focus on design. It found 10 issues, for example background dots over titles and example buttons whose wording differed from the app's.

<a id="prompt-22"></a>

## 22 · Wed 25 Nov, 11:08 PM · Build conversation

> can you give me something so i can try by adding a new project and the ppt shows crossref is down how to connect that additionally explain me how the orchestrator works

**Result:** Added `docs/TRY-IT.md`, a 15-minute test project with known answers. Explained that Crossref was not down (the slide describes what happens if a database is down) and how the orchestrator works.

<a id="prompt-23"></a>

## 23 · Wed 25 Nov, 11:08 PM · Review conversation

> yes approve all, fix it

**Result:** Made all 10 approved deck changes and checked every slide in PowerPoint.

<a id="prompt-24"></a>

## 24 · Wed 25 Nov, 11:23 PM · Build conversation

> there is no way to delete the project is there if not add and can you also add buttons like next previous save draft like that if it's possible

**Result:** Added deleting a project (with a confirmation that offers an export first), a Save draft button with Ctrl+S, and Previous / Next buttons through the workflow steps. Tested end to end.

*Wed 25 Nov, 11:43 PM: switched the model to Claude Sonnet 5.5.*

*Wed 25 Nov, 11:43 PM: switched the model to Claude Opus 5.5.*

<a id="prompt-25"></a>

## 25 · Wed 25 Nov, 11:44 PM · Build conversation

> wonderfull now update the pitchdeck docs and everything according to the updated project and let's sign off

**Result:** Updated the deck (slide 3 orchestrator, slide 5 privacy, speaker notes), the project overview, the README and the architecture doc to match the app.

<a id="prompt-26"></a>

## 26 · Thu 26 Nov, 11:56 AM · Build conversation

> how to run the cope the npm command is on which doc

**Result:** Pointed to the README's Quick start section: double-click `Start ClaimTrace.cmd`, or run `npm run local`.

<a id="prompt-27"></a>

## 27 · Thu 26 Nov, 12:01 PM · Build conversation

> create me a prompts list .md of the converstation we had apparently i have to submit that as well

**Result:** Created this prompt log.

---

# On the day: Thu 26 Nov

The organisers' new requirements arrived; these prompts adapted the website to them.

<a id="prompt-28"></a>

## 28 · Thu 26 Nov, 12:09 PM · Build conversation

> Analyse what is missing and report it to me do not make any changes now
>
> *[pasted: the day-of requirements from the organisers, shown below]*

<details>
<summary>Pasted with this prompt: the day-of requirements from the organisers · 38 lines</summary>

```text
Your website is built. Now make it stronger. You have 90 minutes, from 1:30 to 3:00 PM, to add the requirements below. The judges will test them live during your demo.

Every team must add all of these. Keep them simple: a basic version that works beats a polished one that doesn't.

1. The fake reference test
The judges will enter a reference that does not exist, such as a made-up title, author or DOI. Your website must not accept it as real, and must clearly show that it could not be verified.
Best: check it live against a free scholarly database such as Crossref, doi.org or OpenAlex.
If your live check does not work, your website must at least label the reference "Not yet verified", never "Verified". In your demo, explain exactly which source you would check and how.

2. Trust labels on everything
Every reference and every claim your website shows must carry a visible label that tells the user how far to trust it, for example: Verified, Not yet checked, AI suggestion or Not found. Explain what your labels mean on screen.

3. The user approves
Before any source is added to the user's reference list, the user must approve it with one click. Nothing is added automatically.

4. Export in APA 7
The user can copy or download their reference list formatted in APA 7th edition.

5. AI use statement
Your website generates a short statement the user can paste into an assignment, explaining how AI was used in their research.

CONSTRAINT
Your core journey must also work on a phone screen. The judges may open your website on a phone. If you demo from your laptop, show the phone view using your browser's mobile view.

YOUR DEMO (8 minutes)
Show:
- the core journey of your website, from start to finish
- each of the five requirements working (show them inside your journey where you can, to save time)
- what you changed today, and why

The judges then have 2 minutes for questions, and may try the fake reference test themselves.

SUBMIT BY 3:00 PM ON THE HACKATHON PLATFORM
- your website link, or tick that you will demo from your laptop
- your code or project link
- your prompt log, including the prompts you used today

Submissions lock automatically at 3:00 PM. Good luck
```

</details>

**Result:** Claude checked the app against each requirement without changing anything. It read the code, tested made-up references live (all Not found; a real DOI was Verified) and checked every page at phone width. Gaps found: the local API keys were missing; search results, and verified references in the export list, had no label; label meanings appeared only on mouse hover, so not on phones; the APA list and the AI-use statement could only be copied after sign-off; the integrity report overflowed on phones; the code was not yet pushed or deployed.

<a id="prompt-29"></a>

## 29 · Thu 26 Nov, 12:17 PM · Build conversation

> go ahead with all of them, start with the keys

**Result:** Restored the keys. Renamed "Couldn't check" to "Not yet verified". Added labels to search results, Verified badges in the export list, label names in the `@` citation menu, and a tap-to-open "What the labels mean" guide on Search, Library and Review. Made the reference list and the AI-use statement copyable before sign-off; the final files still unlock only after sign-off. Fixed the integrity report on phones and updated the docs. Tested: typecheck, lint, 94 unit tests, production build, the end-to-end browser test (11 of 11 with live AI) and every page at phone width. Then committed everything for GitHub.

---

*Generated from the Claude Code logs on Thu 26 Nov, 12:35 PM. Prompts typed after that are not included.*
