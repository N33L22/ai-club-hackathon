# Try ClaimTrace with a new project (about 15 minutes)

A ready-made test: a real research question, real and planted references, and a short draft where every sentence has a known right answer. Every reference result below was checked against the live databases on 25 Nov 2026, and claims 1–7 and 10 were run through the live AI check with the results shown. Hosted AI models can vary a little from run to run.

Start the app first: double-click **`Start ClaimTrace.cmd`** (or run `npm run local`) and wait for the browser to open.

## 1. Create the project

**Projects → New project**

- Title: `Sleep and academic performance`
- Research question: `How does sleep affect the academic performance of university students?`
- Citation style: APA 7

## 2. Search (optional)

**Search → Plan the search** (the Scout proposes queries) → edit if you like → **Approve plan and search** → tick one or two results → **Approve and save**. That is checkpoint 1: nothing enters the library without your click.

## 3. Add the test references

**Library → Add sources**

### a. By DOI (one at a time, then **Add to library**)

| DOI | Expected |
|---|---|
| `10.1080/07448481.2010.483708` | **Verified** (Gaultney 2010, has an abstract) |
| `10.1016/j.smrv.2009.10.004` | **Verified** (Dewald 2010, but **no abstract**) |
| `10.1016/S0140-6736(97)11096-0` | **Retracted** (Wakefield 1998) |

### b. Reference list (paste all four, then **Check references**)

These imitate a chatbot's reference list:

```
Okano, K., Kaczmarzyk, J. R., Dave, N., Gabrieli, J. D. E., & Grossman, J. C. (2017). Sleep quality, duration, and consistency are associated with better academic performance in college students. npj Science of Learning, 4, 16.

Hershner, S. D., & Chervin, R. D. (2014). Causes and consequences of sleepiness among college students. Nature and Science of Sleep, 6, 73-84.

Patel, R., & Nguyen, T. (2021). Sleep duration and GPA in university students: A meta-analysis of 52 studies. Journal of Student Sleep Research, 9(2), 101-118. https://doi.org/10.1016/j.jssr.2021.02.004

Morrison, L., & Ahmed, S. (2022). Smartphone use at bedtime and next-day exam performance: A randomised trial with 900 undergraduates. Journal of Sleep and Learning, 14(1), 22-37.
```

| Reference | Expected | Why |
|---|---|---|
| Okano | **Close match** | Real paper, wrong year (2017; the record says 2019) |
| Hershner | **Verified** | Title, first author and year match |
| Patel | **Not found** | The DOI is not registered anywhere (invented) |
| Morrison | **Not found** | No such paper (invented) |

Not-found references start unticked. **Tick Patel anyway** so you can see what happens when you cite an invented source, then **Add**.

### c. BibTeX file

**BibTeX / RIS** tab → choose `docs/try-it-references.bib` from this project.

| Entry | Expected |
|---|---|
| Wolfson 1998 | **Verified** |
| Brennan 2020 | **Not found**: its title imitates Wolfson's, but the authors differ, so it is never "corrected" into the real paper |

### d. A web page

**Web page** tab → any page you have actually read (for example a health agency's page on sleep) → it is labelled **Student-added, not verified**.

## 4. Write the draft

**Write** → type each sentence; just before its full stop, type **`@`**, start typing the author's name, press **Enter** to insert the citation, then type the full stop. Every sentence with a citation becomes a claim.

| # | Sentence | Cite | Expected after checking |
|---|---|---|---|
| 1 | In a study of 88 college chemistry students, better quality, longer and more consistent sleep correlated with better grades. | Okano | **Close match** until you confirm the paper (step 5), then **Supported** |
| 2 | Getting more sleep causes students to earn higher grades. | Okano | **Overreach**: the source reports a correlation, not a cause |
| 3 | At one large US public university, more than a quarter of students were at risk of a sleep disorder. | Gaultney | **Supported** (the abstract says 27% of 1,845 students at one university) |
| 3b | About a quarter of all college students are at risk for at least one sleep disorder. | Gaultney | **Overreach**: one university's 27% is stretched to all college students; also "close to the source's wording" |
| 4 | Students who sleep poorly are three times more likely to fail their courses. | Gaultney | **Overreach** or **Not supported**, with an "Effect size" hint: the source states no such figure |
| 5 | Half of college students report daytime sleepiness. | Hershner | **Supported** (50%) |
| 6 | Hershner and Chervin note that sleep problems "are not often considered as a risk factor for depression and academic failure". | Hershner | **Supported**, plus "Direct quotation: page required" |
| 7 | Students at risk for sleep disorders were overrepresented among students in academic jeopardy. | Gaultney | **Supported**, plus a "Close to the source's wording" flag (copied phrasing) |
| 8 | Sleep quality, sleep duration and sleepiness are all related to school performance in young people. | Dewald | **Unchecked**: no abstract to check against |
| 9 | A meta-analysis of 52 studies found that every extra hour of sleep raises GPA by 0.2 points. | Patel | **Not found** |
| 10 | Insufficient sleep is common among students and is linked to lower grades. | Hershner, then also Gaultney | A claim citing **two sources**: it shows the more serious of the two results |
| 11 | One much-cited 1998 case series still circulates in online health debates. | Wakefield | **Retracted** |

## 5. Review the claims

**Review claims → Check N claims** (about 15–30 seconds with live AI). Then try:

- **Claim 1**: click **Compare and confirm** → the side-by-side table shows the year difference → **Yes, this is the paper I mean** → **Check again** on the claim → **Supported**.
- **Claim 8**: open the source (**Add text you have read**) and paste a passage you have read from that paper → **Use this text** → **Check again**. If it supports the claim, the label becomes **Supported · your text**, which needs an acknowledgement. Paste unrelated text instead and you will see a warning that it does not look like the paper.
- **Claim 6**: type a page number (for example `p. 81`) in the box.
- Flags (Overreach, Not found, Retracted, Close match): **Keep anyway…** asks for a reason; or **Edit in draft** / **Find a better source**.
- Unchecked, Student-added, "your text": **Acknowledge**.

## 6. Export

**Export**: the checklist must be complete, then tick the statement, type your name and **Sign off**. Look at:

- **AI-use statement**: generated from what actually happened (model, checks, your decisions).
- **Files → Draft with citations (.txt)**: ends with a "Reference checks" section listing every reference that is not plainly verified.
- **Integrity report**: every claim, every cited source's evidence and where it came from, and your decisions.

## 7. Also worth trying

- **Previous / Next**: the bar at the bottom of every step page walks you through Overview → Search → Library → Write → Review claims → Export.
- **Save draft**: the button in the editor's toolbar (or Ctrl+S). The draft also saves itself as you type; the toolbar shows the time of the last save.
- **Delete a project**: the **⋯** on its card in Projects, the project switcher at the top of the sidebar, or **Overview → Edit**. It asks first and offers to export a copy.
- **Audit log**: every AI output and every decision, with times.
- **Settings**: which keys the server has, how each check decides, and the measured accuracy.
- **Settings → Export this project / Import a project file**: move the project to another browser.
- Reopen a decision, edit a claim's wording, and watch its old check disappear (the claim changed, so it must be checked again).
