# ClaimTrace prompt log

**AI Club Hackathon 2026 · Team 6 · Neel, Mohit, Anand**

The main AI prompts we used to plan and build ClaimTrace, in the order we used them, each with a short summary of the AI's response.

- **Tools:** ChatGPT for our problem research (Phase 0 and Phase 1; the shared conversation is linked in entry 1). Claude Code with Claude Opus 5.5 for the deck, the website, an independent audit in a separate session, and the changes on the day.
- **What is included:** the main prompts only. Short follow-ups (confirmations, "stop", and questions about running the app or setting up keys) are left out. Prompts are quoted as typed; long pasted documents are summarised in brackets.
- **Responses** are summaries of what the AI did, written from its replies in the conversation logs.
- **Times** are local (UTC+4).

## Contents

- **Plan the project and the pitch deck** (Tue 24 Nov): entries 1 to 2
- **Build the website** (Tue 24 Nov): entry 3
- **Independent audit, then fixes** (Wed 25 Nov): entries 4 to 6
- **Polish the deck and the website** (Wed 25 Nov): entries 7 to 11
- **On the day: the new requirements** (Thu 26 Nov): entries 12 to 17

## Plan the project and the pitch deck

### 1. Brief, research and the first deck

*Tue 24 Nov, 9:04 PM to 9:16 PM · Claude Code*

> Check the given documents given in the DOCS folder the path is given below:
> C:\Users\Neel\OneDrive\Desktop\AI CLUB HACKATHON\DOCS\
>
> and for what i have thought check the following link using claude in chrome and let's start building the pitch deck:
> https://chatgpt.com/c/6b05c00d-0940-83eb-b667-1ac3c95f2650
>
> Let's start building and give me the html 6 slide deck with a good ui background animation and everything which can also be downloaded as ppt with the same motion animation and ui use correct applicable colors and select a good color scale qas this is the hackathon keep it easy to understand but also professional and do not use existing claude color pallete search the web if you have to and let's start building the pitch deck:
>
> *[Pasted with it: three excerpts from our ChatGPT planning notes. They set out the ideation pipeline (Understand → Investigate → Discover → Ideate → Attack → Select → Design → Build), with a decision gate at each stage; ask for no artificial complexity and for planning around real API limits; and add an end-of-session review: record the decisions made, keep approved decisions apart from ideas, keep a decision log, and never silently change an approved decision.]*

> i have given the link which is a public link and i also have claude in chrome mcp so use that no building from text and read both the documents from docs folder so you'll understand everything i am trying to build if you don't understand anything ask me do not ignore anything

> https://chatgpt.com/share/6b05c258-d564-83ed-85e4-9870e54832a1 this is the link
> 1. the rules and regulations is just guildlines and rubrics and yes 
> 2.yes this is the only problem statement common for everyone that's why it has to be unique
> 3.Yes on the first slide team name is team 6 and the names are neel mohit and anand

**Response:** Claude read the problem statement and the submission guidelines. It could not open the private ChatGPT link, so before building it asked three questions: were the "rules" the guidelines, was the problem common to every team, and what goes on the title slide? With the shared research link and our answers, it built the 6-slide deck as a PowerPoint and a matching HTML version from one shared slide file, and checked both.

### 2. Project overview document

*Tue 24 Nov, 9:48 PM · Claude Code*

> now create me a .md file showing what is the problem what is our proposed solution how are we approaching the problem why are we going for this the tool stack used and everything about the project in this.md file

**Response:** Created `ClaimTrace_Project_Overview.md`, using the same wording and numbers as the deck. It covers the problem (with checked statistics), why we chose it, the solution and its three checks, our approach, workflow and architecture diagrams, the tool stack, guardrails, ethics, governance, scope, risks, the timeline and a decision log.

## Build the website

### 3. Build the MVP

*Tue 24 Nov, 10:21 PM · Claude Code*

> @DOCS/ClaimTrace_Review_v2.docx use this report on understanding what is left and start building it with a good ui with motion animation make it crisp and professional for researchers i want a good ui interface and not the same black slop i want it in white background the UI should be immpecabble and also use 21st.dev , react bits or any other site for UI and for building follow the .md file and the changes mentioned in the report i want you to build a proper MVP not just some random project with ai slop and ui this mvp should be worth presenting that can be actually used so start building it and make it in such a way that you follow all the rules of syste design and once again i do not want ai slop ui i want a professional website with a specifically good selectted theme of colors , good and sleak designs motions animations and everything

**Response:** Built the MVP in `claimtrace/` (Next.js, React, TypeScript). The research question becomes an AI search plan, which returns real OpenAlex records. Saved sources go into a library with folders, tags and notes, and a draft editor turns @-citations into claims. The Verifier is code: it checks that a reference exists, its details match and it isn't retracted. The Skeptic is the AI: it gives a verdict, and code must find its evidence sentence in the source. Around them sit trust labels, an export gate with APA 7 and other styles, the AI-use statement, an integrity report and an audit log. 52 unit tests passed.

## Independent audit, then fixes

### 4. Audit the MVP without changing it

*Wed 25 Nov, 7:34 PM · Claude Code, separate review session*

> *[We pasted our audit brief, about 1,100 lines. Its core instructions, quoted:]*
>
> Act as an independent Principal Software Architect, Senior AI Engineer, Product Auditor, Security Reviewer, UX Critic, and adversarial technical reviewer.
>
> You are NOT permitted to implement fixes.
>
> Do not assume that because a feature exists in the UI, it actually works.
>
> Do not assume that because AI produces a response, the response is reliable.
>
> Your objective is to determine the actual state of the product, not to make the project appear better than it is.
>
> Do not edit, repair, rewrite, refactor, implement, or modify anything.

**Response:** A separate session audited the MVP and changed nothing. Typecheck, lint and 60 unit tests passed. It reported 30 numbered findings (CT-01 to CT-30) with recommended changes. The biggest: OpenAlex was refusing our network's requests without a key, the AI check could not run without a key, the evidence guard was too weak, and a database outage could show up as "Not found".

### 5. Fix every finding

*Wed 25 Nov, 8:02 PM · Claude Code*

> Fix the following content given in the audit report
>
> *[pasted: the audit report from entry 4]*
>
> and how to get free open alex key let's build this

**Response:** Fixed every finding and explained how to get a free OpenAlex key. Examples: "Couldn't check" instead of a false "Not found" when a database does not answer; a separate "Supported · your text" label when the evidence is text the student pasted; stricter rules for evidence sentences; request limits that follow Crossref's; project export and import; and a labelled set of 20 claims to measure the AI check. The deck was updated to match.

### 6. Choose the AI model

*Wed 25 Nov, 9:42 PM to 9:46 PM · Claude Code*

> wait i am saying are there other models in nvidia itself instead of llama 3.3 70b instruct

> okay i have added the key make the changes accordingly

**Response:** Claude found that NVIDIA had retired Llama 3.3 70B (its API answered HTTP 410). It measured the hosted replacements on our 20 labelled claims, using the app's real prompt and checks, and switched to Nemotron 3 Ultra with its thinking step off. That setup got 19 of 20 verdicts correct (17 of 20 in an earlier run), never gave a false "Supported" and took about 4 seconds a check. The comparison is in `claimtrace/eval/skeptic-model-comparison.md`.

## Polish the deck and the website

### 7. Run it locally, and a white deck

*Wed 25 Nov, 10:36 PM · Claude Code*

> wonderfull now how do it run it and als can you change the ppt UI and design to white background and not black

**Response:** Added `npm run local`, which builds and runs a copy of the app outside OneDrive (OneDrive's file locking crashed the development server), and switched the deck to a white theme.

### 8. Design review of the deck

*Wed 25 Nov, 11:04 PM to 11:08 PM · Claude Code, separate review session*

> @pitch-deck/ClaimTrace_Team6_Pitch.pptx review this ppt and tell me what is missing if i approve then fix it and the content is related or UI related only primarily focus on UI

> yes approve all, fix it

**Response:** Reviewed every slide as PowerPoint renders it and listed 10 issues, such as background dots over titles and example buttons not worded like the app's. After our approval it fixed all 10 and re-checked every slide.

### 9. A test project, and how the orchestrator works

*Wed 25 Nov, 11:08 PM · Claude Code*

> can you give me something so i can try by adding a new project and the ppt shows crossref is down how to connect that additionally explain me how the orchestrator works

**Response:** Wrote `claimtrace/docs/TRY-IT.md`: a 15-minute test project with real and planted references and a draft where every sentence has a known right answer, checked against the live databases. Explained that Crossref was working (the slide describes what happens when a database is down) and how the orchestrator runs the workflow.

### 10. Delete a project, Previous / Next, Save draft

*Wed 25 Nov, 11:23 PM · Claude Code*

> there is no way to delete the project is there if not add and can you also add buttons like next previous save draft like that if it's possible

**Response:** Added deleting a project, with a confirmation that offers to export a copy first; a Save draft button with Ctrl+S; and Previous / Next buttons along the workflow. Tested end to end.

### 11. Bring the deck and docs up to date

*Wed 25 Nov, 11:44 PM · Claude Code*

> wonderfull now update the pitchdeck docs and everything according to the updated project and let's sign off

**Response:** Updated slide 3 (the orchestrator is the browser workflow plus the API routes), slide 5 (privacy) and the speaker notes, as well as the overview, README and architecture docs, so everything matches the app. Re-checked the slides in PowerPoint.

## On the day: the new requirements

### 12. What is missing?

*Thu 26 Nov, 12:09 PM · Claude Code*

> *[pasted: the organisers' day-of requirements: the fake reference test, trust labels on everything, one-click user approval, APA 7 export, an AI-use statement, and a core journey that works on a phone screen]*
>
> Analyse what is missing and report it to me do not make any changes now

**Response:** Checked each requirement without changing anything. Made-up references were tested live (all "Not found"; a real DOI was "Verified") and every page was checked at phone width. Gaps found: search results, and verified references in the export list, had no label; label meanings appeared only on mouse hover, so not on phones; the APA list and the AI-use statement could only be copied after sign-off; the integrity report overflowed on phones; the local API keys were missing; and the code was not yet pushed or deployed.

### 13. Implement the requirements

*Thu 26 Nov, 12:17 PM · Claude Code*

> go ahead with all of them, start with the keys

**Response:** Restored the keys and renamed "Couldn't check" to "Not yet verified", the brief's wording. Added labels to search results, "Verified" badges in the export list, label names in the @ citation menu and a tap-to-open "What the labels mean" guide. The APA list and the AI-use statement can now be copied before sign-off; the final files still unlock only after it. Fixed the report on phones. Tested: typecheck, lint, 94 unit tests, a production build, the end-to-end browser test (11 of 11 with live AI) and every page at phone width.

### 14. Find a paper by its title or DOI

*Thu 26 Nov, 1:07 PM · Claude Code*

> can you do 2 final things for me in the paper search also add where you can search the name of references also […]

*The rest of this message asked us to shorten this prompt log.*

**Response:** Added a "By title or DOI" tab to Search, with no AI involved. A title is searched in OpenAlex; the paper with that exact title is confirmed and listed first, and if no paper has it, the page warns that the reference may not exist. A DOI is checked in Crossref and OpenAlex, so a made-up DOI shows "Not found". Results carry labels and are saved only with Approve and save.

### 15. Audit against the organisers' Phase 2 brief

*Thu 26 Nov, 1:36 PM · Claude Code*

> @"claimtrace/Phase 2.pdf" 
> Assume you are a professional auditor audit the project and then compare it with the given pdf and check what is missing from the document in the project additionally, do not make any changes now just list them out based on my approval you will start building you have 10mins for that start now

**Response:** Ran the organisers' test pack of eight references through the live app without changing anything. The invented reference ("Not found", saying where it looked), the retracted paper, the correct references and the paper without a DOI already worked. Gaps found: the wrong year showed as a close match with no way to reject the fix; a real DOI on other authors showed as a close match instead of a mismatch; the duplicate would have been saved twice; and there was nowhere to type a request to the assistant. Proposed seven fixes for approval.

### 16. Phase 2 fixes, and start a project from a document

*Thu 26 Nov, 2:10 PM · Claude Code*

> Perform the above changes accordingly , additionally
> 1. with the option of adding a manual title we also have an option of where the user uploads a certain document maybe pdf,word or txt where it searches the pdf and on that basis it provides us with the title and the question or area of research 
> do that quickly we have only 20mins and it should be a bit more user friendly 
> In the hackathon everything has the same idea and the working so give me something unique and not a generalised ai slop that everyone is presenting something out of the box and the features which keep us apart from the rest of the crowd and increase our chances of winning

**Response:** Built in parallel, then tested together. A Mismatch label shows what was pasted next to what the DOI points to. Small errors get Accept the fix or Reject the fix. Duplicates are detected and merged (one entry kept; exports list each paper once). Every unverified entry carries its label in exports, and risky references start unticked. An "Ask the assistant" tab answers "Not found" when no real paper covers a request and lists related real papers, each labelled. "Start from a document" reads a PDF, Word or text file and suggests the project's title, research question and area for the student to edit.

### 17. The Assistant suggests what to write

*Thu 26 Nov, 2:49 PM · Claude Code*

> ! more change i want you to give me an agent where in the draft we write the researchers don't always have the content so i want you to help them suggest that this is what they can write in their draft and do it quick this is just for mvp and you have the api key do it in 5-7mins as we are out of time i just have to show that ai can suggest content

**Response:** Added "Suggest what to write" to the draft editor. The Assistant reads only the abstracts of sources in the student's library and suggests sentences that state what those sources say, each naming the source it rests on; code drops any suggestion that does not name one of the student's own sources. Suggestions are labelled "AI suggestion", nothing enters the draft until the student clicks Insert, and an inserted sentence carries its citation and is checked by the Skeptic on Review like every claim.
