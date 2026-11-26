/*
 * ClaimTrace pitch deck — single source of truth.
 * Both build_pptx.js and build_html.js render from this file, so the
 * PowerPoint and the HTML deck share identical layout, colours and motion.
 *
 * Units: inches on a 13.333 x 7.5 canvas (16:9 widescreen). Font sizes in pt.
 * Animation: anim = { k: 'up' | 'fade' | 'zoom' | 'left', d: delayMs }
 */

/*
 * Two themes from one layout. Light (white slides, the website's colours) is the default;
 * build with DECK_THEME=dark for the dark version. Accent colours are deeper on white so
 * small text stays readable; "ink" is the text colour on solid brand buttons.
 */
const THEMES = {
  light: {
    C: {
      bg: "FFFFFF", card: "FFFFFF", card2: "F5F7FA", line: "D9DFE9",
      text: "0B1020", muted: "4D566B", dim: "7A849A",
      mint: "0A7F62",   // Supported / brand (the website's trace green)
      sky: "1D6FD8",    // Unchecked / info
      violet: "7C3AED", // AI
      amber: "B45309",  // Overreach / human checkpoint
      rose: "E11D48",   // Not found / retracted
      ink: "FFFFFF",
    },
    shadow: { opacity: 0.12, blur: 16, offset: 3, css: "0 8px 24px rgba(15,23,42,.07),0 1px 3px rgba(15,23,42,.06)" },
    asset: "bg_light",
    chipHi: 82,
  },
  dark: {
    C: {
      bg: "070B19", card: "0F1733", card2: "131D40", line: "26335F",
      text: "EEF2FF", muted: "A3B0D6", dim: "7381AD",
      mint: "2EE6A6", sky: "6EB6FF", violet: "B18CFF", amber: "FFB547", rose: "FF5D7A",
      ink: "0A1022",
    },
    shadow: { opacity: 0.35, blur: 14, offset: 4, css: "0 4px 18px rgba(0,0,0,.35)" },
    asset: "bg",
    chipHi: 72,
  },
};
const THEME_NAME = process.env.DECK_THEME === "dark" ? "dark" : "light";
const THEME = { name: THEME_NAME, ...THEMES[THEME_NAME] };
const C = THEME.C;
const FONTS = { head: "Century Gothic", body: "Calibri", mono: "Consolas" };

// ---------- element helpers ----------
let _id = 0;
const nid = (p) => `${p}-${++_id}`;

function box(x, y, w, h, o = {}) {
  const el = { type: "box", id: nid("box"), x, y, w, h, fill: o.fill ?? C.card, ft: o.ft ?? 0,
    line: o.line ?? null, lt: o.lt ?? 0, lw: o.lw ?? 0.75, r: o.r ?? 0.12,
    shape: o.shape ?? "rect", shadow: o.shadow ?? false, anim: o.anim };
  // On white slides a lightly tinted panel would let the moving background show through its
  // text, so it sits on a solid white base (which carries the shadow). Both animate together.
  if (THEME.name !== "light" || el.ft < 70 || el.fill === C.bg || el.fill === C.card) return el;
  return [{ ...el, id: nid("box"), fill: "FFFFFF", ft: 0, line: null, lt: 0 }, { ...el, shadow: false }];
}
function norm(content) {
  const paras = Array.isArray(content) ? content : [content];
  return paras.map((p) => {
    if (typeof p === "string") return { runs: [{ t: p }] };
    if (Array.isArray(p)) return { runs: p.map((r) => (typeof r === "string" ? { t: r } : r)) };
    if (p.runs) return { ...p, runs: p.runs.map((r) => (typeof r === "string" ? { t: r } : r)) };
    return { runs: [p] };
  });
}
function txt(x, y, w, h, content, o = {}) {
  return { type: "text", id: nid("txt"), x, y, w, h, paras: norm(content),
    size: o.size ?? 14, color: o.color ?? C.text, font: o.font ?? "body", bold: o.bold ?? false,
    italic: o.italic ?? false, align: o.align ?? "left", valign: o.valign ?? "top",
    after: o.after ?? 0, cs: o.cs ?? 0, ph: o.ph, anim: o.anim };
}
function icon(name, x, y, s, color, o = {}) {
  return { type: "icon", id: nid("ico"), name, x, y, w: s, h: s, color, anim: o.anim };
}
function line(x1, y1, x2, y2, o = {}) {
  return { type: "line", id: nid("ln"), x1, y1, x2, y2, color: o.color ?? C.dim, w: o.w ?? 1.25,
    dash: o.dash ?? false, arrow: o.arrow ?? false, anim: o.anim };
}
// apply one animation to a whole group of elements
function g(anim, ...els) {
  return els.flat(Infinity).map((e) => ({ ...e, anim: e.anim ?? anim }));
}
const A = (k, d) => ({ k, d });

// pill / chip: rounded box with centred text
function chip(x, y, w, h, label, color, o = {}) {
  return [
    box(x, y, w, h, { fill: o.fill ?? color, ft: o.ft ?? 86, line: color, lt: o.lt ?? 45, r: h / 2 }),
    txt(x, y, w, h, label, { font: o.font ?? "mono", size: o.size ?? 9.5, bold: true, color: o.textColor ?? color,
      align: "center", valign: "middle", cs: o.cs ?? 0.5 }),
  ];
}
function iconChip(x, y, w, h, ic, label, color, o = {}) {
  const s = o.iconSize ?? h * 0.5;
  return [
    box(x, y, w, h, { fill: o.fill ?? color, ft: o.ft ?? 86, line: color, lt: o.lt ?? 45, r: o.r ?? h / 2 }),
    icon(ic, x + 0.14, y + (h - s) / 2, s, o.iconColor ?? color),
    txt(x + 0.14 + s + 0.08, y, w - s - 0.3, h, label, { font: o.font ?? "mono", size: o.size ?? 9.5,
      bold: true, color: o.textColor ?? color, valign: "middle", cs: o.cs ?? 0.5 }),
  ];
}

// ---------- shared chrome ----------
function header(n, label, title, sub) {
  const tag = `0${n} · ${label}`;
  const w = tag.length * 0.09 + 0.4;
  return [
    ...g(A("fade", 0), chip(0.55, 0.42, w, 0.3, tag, C.mint, { size: 10, cs: 1 })),
    txt(0.55, 0.82, 12.2, 0.6, title, { font: "head", size: 28, bold: true, ph: "title", anim: A("up", 120) }),
    txt(0.55, 1.42, 11.6, 0.6, sub, { size: 14, color: C.muted, anim: A("up", 260) }),
  ];
}
function footer(n) {
  return [
    txt(0.55, 7.0, 7, 0.26, [[{ t: "Claim", b: true, c: C.text }, { t: "Trace", b: true, c: C.mint },
      { t: "   ·   Team 6   ·   AI Club Hackathon 2026", c: C.dim }]], { size: 9.5 }),
    txt(11.28, 7.0, 1.5, 0.26, `0${n} / 06`, { size: 9.5, font: "mono", color: C.dim, align: "right" }),
  ];
}

// ======================================================================
// SLIDE 1 — Title, problem, idea
// ======================================================================
function slide1() {
  const els = [];
  els.push(...g(A("fade", 0), chip(0.6, 0.6, 3.55, 0.32, "AI CLUB HACKATHON 2026  ·  TEAM 6", C.mint, { size: 10, cs: 1 })));
  els.push(txt(0.6, 1.08, 6.8, 1.15, [[{ t: "Claim", c: C.text }, { t: "Trace", c: C.mint }]],
    { font: "head", size: 64, bold: true, ph: "title", anim: A("up", 150) }));
  els.push(txt(0.6, 2.32, 6.5, 0.95, "A real reference is not the same as a supporting reference.",
    { font: "head", size: 21, anim: A("up", 320) }));
  els.push(txt(0.6, 3.28, 6.3, 0.8, "ClaimTrace is a reference manager and AI research assistant that checks every citation three ways, then shows the student the evidence before they decide.",
    { size: 14, color: C.muted, anim: A("up", 460) }));

  const checks = [
    ["EXISTS", "Is it a real record in Crossref or OpenAlex?"],
    ["MATCHES", "Do the authors, title and year match?"],
    ["SUPPORTS", "Does the source actually say what the claim says?"],
  ];
  checks.forEach(([lab, cap], i) => {
    const x = 0.6 + i * 2.22, y = 4.3, d = 640 + i * 160;
    const hi = i === 2;
    els.push(...g(A("zoom", d),
      iconChip(x, y, 1.9, 0.56, "circle-check", lab, C.mint, { size: 12, ft: hi ? THEME.chipHi : 90, lt: hi ? 10 : 50, iconSize: 0.26, r: 0.14 }),
      txt(x, y + 0.66, 1.9, 0.6, cap, { size: 11, color: C.muted })));
    if (i < 2) els.push(line(x + 1.94, y + 0.28, x + 2.18, y + 0.28, { color: C.mint, arrow: true, w: 1.5, anim: A("fade", d + 120) }));
  });

  els.push(txt(0.6, 5.86, 3, 0.25, "TEAM 6", { font: "mono", size: 10, bold: true, color: C.mint, cs: 1.5, anim: A("fade", 1150) }));
  els.push(txt(0.6, 6.12, 6, 0.42, [["Neel", { t: "  ·  ", f: "body", c: C.mint }, "Mohit", { t: "  ·  ", f: "body", c: C.mint }, "Anand"]], { font: "head", size: 18, bold: true, anim: A("up", 1200) }));

  // right column: the problem
  const RX = 7.65, RW = 5.13;
  els.push(txt(RX, 0.6, RW, 0.28, "THE PROBLEM", { font: "mono", size: 10, bold: true, color: C.rose, cs: 1.5, anim: A("fade", 300) }));
  const stats = [
    ["55%", C.rose, "of references written by GPT-3.5 were fabricated (18% for GPT-4).", "Walters & Wilder, Scientific Reports, 2023"],
    ["24%", C.amber, "of GPT-4’s real references still had substantive errors (43% for GPT-3.5).", "Walters & Wilder, Scientific Reports, 2023"],
    ["5.4%", C.sky, "of citations made after a paper was retracted even mentioned the retraction.", "722 of 13,252 · Hsiao & Schneider, QSS, 2021"],
  ];
  stats.forEach(([num, col, body, src], i) => {
    const y = 0.95 + i * 1.25, d = 420 + i * 170;
    els.push(...g(A("left", d),
      box(RX, y, RW, 1.1, { fill: C.card, ft: 12, line: C.line, shadow: true }),
      txt(RX + 0.25, y + 0.14, 1.6, 0.8, num, { font: "head", size: 34, bold: true, color: col, valign: "middle" }),
      txt(RX + 1.9, y + 0.13, 3.05, 0.62, body, { size: 12.5 }),
      txt(RX + 1.9, y + 0.78, 3.05, 0.24, src, { size: 9, color: C.dim, italic: true })));
  });
  els.push(...g(A("up", 1000),
    box(RX, 4.75, RW, 1.78, { fill: C.mint, ft: 89, line: C.mint, lt: 35, shadow: true }),
    icon("search-x", RX + 0.25, 4.95, 0.3, C.mint),
    txt(RX + 0.66, 4.96, 4.2, 0.3, "THE GAP NOBODY CHECKS", { font: "mono", size: 10, bold: true, color: C.mint, cs: 1.2, valign: "middle" }),
    txt(RX + 0.25, 5.4, 4.65, 1.05, [[
      { t: "Zotero and Mendeley organise and format. AI tools find and summarise. " , c: C.muted },
      { t: "Nothing checks whether the source supports the sentence. ", b: true },
      { t: "ClaimTrace does.", b: true, c: C.mint },
    ]], { size: 14 })));
  els.push(...footer(1));
  return { title: "ClaimTrace", layout: "title", els };
}

// ======================================================================
// SLIDE 2 — Workflow
// ======================================================================
function slide2() {
  const els = header(2, "WORKFLOW", "How a student moves through ClaimTrace",
    "Seven steps, three narrow AI roles, one code checker and three human checkpoints. The AI suggests, code checks, the student decides.");
  const ROLE = { student: [C.text, "STUDENT"], scout: [C.violet, "AI · SCOUT AGENT"], code: [C.mint, "CODE · NO AI"], skeptic: [C.violet, "AI · SKEPTIC AGENT"] };
  const steps = [
    ["student", "circle-help", "Ask", "Enters a research question and picks a citation style (APA 7 by default).", null],
    ["scout", "search", "Search", "Turns the question into a search plan; OpenAlex returns real records only, never AI-written ones.", null],
    ["student", "folder-tree", "Approve", "Approves the plan, picks sources and files them with folders, tags and notes.", ["CHECKPOINT 1", C.amber, "hand"]],
    ["student", "pen-line", "Write", "Writes the draft and links each claim to a saved source.", null],
    ["code", "scan-search", "Verify", "Checks the record exists, the details match and it isn’t retracted.", ["CHECK", C.mint, "shield-check"]],
    ["skeptic", "quote", "Challenge", "Finds the exact source sentence behind each claim and flags overreach.", ["CHECK", C.mint, "shield-check"]],
    ["student", "clipboard-check", "Decide", "Accepts, edits or replaces each flagged claim, then exports.", ["CHECKPOINTS 2+3", C.amber, "hand"]],
  ];
  const W = 1.6, GAP = 0.172, Y = 2.2, H = 2.62;
  steps.forEach(([role, ic, title, body, badge], i) => {
    const x = 0.55 + i * (W + GAP), d = 420 + i * 130;
    const [rc, rl] = ROLE[role];
    const grp = [
      box(x, Y, W, H, { fill: C.card, ft: 10, line: badge && badge[1] === C.amber ? C.amber : C.line, lt: badge && badge[1] === C.amber ? 45 : 0, shadow: true }),
      box(x + 0.14, Y + 0.16, 0.36, 0.36, { shape: "ellipse", fill: rc, ft: 84, line: rc, lt: 40 }),
      txt(x + 0.14, Y + 0.16, 0.36, 0.36, String(i + 1), { font: "mono", size: 11, bold: true, color: rc, align: "center", valign: "middle" }),
      icon(ic, x + W - 0.44, Y + 0.19, 0.3, rc),
      txt(x + 0.14, Y + 0.64, W - 0.24, 0.22, rl, { font: "mono", size: 8.5, bold: true, color: rc, cs: 0.3 }),
      txt(x + 0.14, Y + 0.88, W - 0.24, 0.32, title, { font: "head", size: 14, bold: true }),
      txt(x + 0.14, Y + 1.22, W - 0.22, 1.0, body, { size: 11, color: C.muted }),
    ];
    if (badge) grp.push(...iconChip(x + 0.12, Y + H - 0.42, W - 0.24, 0.28, badge[2], badge[0], badge[1], { size: badge[0].length > 12 ? 7.5 : 8.5, iconSize: 0.16, ft: 84, cs: badge[0].length > 12 ? 0 : 0.3 }));
    els.push(...g(A("up", d), grp));
    if (i < steps.length - 1) els.push(line(x + W + 0.02, Y + 0.34, x + W + GAP - 0.02, Y + 0.34, { color: C.dim, w: 1, arrow: true, anim: A("fade", d + 80) }));
  });
  // feedback loop: Challenge -> Search
  const cx6 = 0.55 + 5 * (W + GAP) + W / 2, cx2 = 0.55 + 1 * (W + GAP) + W / 2, ly = 5.12;
  els.push(...g(A("fade", 1500),
    line(cx6, Y + H + 0.02, cx6, ly, { color: C.violet, dash: true, w: 1.25 }),
    line(cx6, ly, cx2, ly, { color: C.violet, dash: true, w: 1.25 }),
    line(cx2, ly, cx2, Y + H + 0.03, { color: C.violet, dash: true, w: 1.25, arrow: true }),
    box(4.45, ly - 0.16, 4.45, 0.32, { fill: C.bg, ft: 0, line: C.violet, lt: 45, r: 0.16 }),
    icon("repeat", 4.6, ly - 0.09, 0.18, C.violet),
    txt(4.86, ly - 0.16, 4.0, 0.32, "Not supported? Scout finds better sources and the loop repeats.", { size: 10, color: C.text, valign: "middle" })));

  const cards = [
    [C.amber, "hand", "Where the student is in control", [
      [{ t: "①  ", b: true, c: C.amber }, { t: "Approve the search plan and sources", c: C.text }],
      [{ t: "②  ", b: true, c: C.amber }, { t: "Resolve every flag on every claim", c: C.text }],
      [{ t: "③  ", b: true, c: C.amber }, { t: "Sign off before export", c: C.text }],
      "Nothing changes without the student’s click.",
    ]],
    [C.mint, "shield-check", "Where answers are checked", "Step 5: code checks existence, metadata and retraction status. Step 6: code re-checks the evidence sentence before any ‘Supported’ label appears."],
    [C.violet, "bot", "Why the AI stays narrow", "Scout only plans searches, Skeptic only challenges claims, Assistant only explains a source. None can approve a source, write a reference or edit the draft."],
  ];
  const CW = (12.23 - 0.4) / 3;
  cards.forEach(([col, ic, h, b], i) => {
    const x = 0.55 + i * (CW + 0.2), y = 5.5, d = 1650 + i * 140;
    els.push(...g(A("up", d),
      box(x, y, CW, 1.32, { fill: col, ft: 91, line: col, lt: 55 }),
      icon(ic, x + 0.22, y + 0.17, 0.28, col),
      txt(x + 0.6, y + 0.15, CW - 0.8, 0.32, h, { font: "head", size: 13, bold: true, valign: "middle" }),
      txt(x + 0.22, y + 0.53, CW - 0.4, 0.75, b, { size: 11, color: C.muted })));
  });
  els.push(...footer(2));
  return { title: "Workflow", layout: "content", els };
}

// ======================================================================
// SLIDE 3 — Architecture
// ======================================================================
function slide3() {
  const els = header(3, "ARCHITECTURE", "Architecture: small, modular and buildable",
    "One web app, one AI provider and two free scholarly databases; the student’s data stays in their browser. AI has three narrow roles; every other check is plain code.");
  // tier 1: web app
  els.push(...g(A("up", 400),
    box(0.55, 2.2, 8.0, 1.0, { fill: C.card, ft: 10, line: C.sky, lt: 50, shadow: true }),
    icon("monitor-smartphone", 0.77, 2.4, 0.34, C.sky),
    txt(1.25, 2.33, 3.0, 0.32, "Web app", { font: "head", size: 14, bold: true }),
    txt(1.25, 2.68, 3.0, 0.3, "Next.js + React, hosted on Vercel", { size: 10.5, color: C.muted }),
    ...(() => {
      // chip width follows its label, so "Claim panel" gets the same side padding as the rest
      const labels = ["Library", "Editor", "Claim panel", "Export"];
      const ws = labels.map((l) => +(l.length * 0.083 + 0.34).toFixed(2));
      let x = 8.4 - ws.reduce((a, b) => a + b, 0) - 0.1 * (labels.length - 1);
      return labels.flatMap((l, i) => { const c = chip(x, 2.52, ws[i], 0.36, l, C.sky, { size: 9.5, ft: 88, cs: 0.3 }); x += ws[i] + 0.1; return c; });
    })()));
  // arrows tier1 <-> tier2
  els.push(...g(A("fade", 620),
    line(2.6, 3.24, 2.6, 3.52, { color: C.sky, arrow: true, w: 1.5 }),
    txt(2.72, 3.25, 2.6, 0.26, "question · claims · decisions", { size: 9.5, color: C.dim, valign: "middle" }),
    line(6.0, 3.52, 6.0, 3.24, { color: C.mint, arrow: true, w: 1.5 }),
    txt(6.12, 3.25, 2.4, 0.26, "sources · labels · evidence", { size: 9.5, color: C.dim, valign: "middle" })));
  // tier 2: orchestrator
  els.push(...g(A("up", 720),
    box(0.55, 3.56, 8.0, 0.92, { fill: C.card, ft: 10, line: C.mint, lt: 45, shadow: true }),
    icon("workflow", 0.77, 3.76, 0.34, C.mint),
    // as built: the workflow code runs in the browser next to the student's data (src/lib/actions.ts,
    // src/core/workflow/gate.ts); the API routes only call the AI and the databases
    txt(1.25, 3.64, 7.1, 0.32, [["Orchestrator", { t: "  ·  ", f: "body", c: C.mint }, "browser workflow + Next.js API routes"]], { font: "head", size: 14, bold: true }),
    txt(1.25, 3.96, 7.1, 0.46, [
      "In the browser: runs the 7 steps in order, enforces the 3 checkpoints, logs every action.",
      "On the server: API routes call the AI and the databases, so the keys never reach the browser.",
    ], { size: 10.5, color: C.muted })));
  // tier 3
  const comps = [
    [C.violet, "cpu", "AI model", "NVIDIA NIM API", "Nemotron 3 Ultra in three roles: Scout, Skeptic, Assistant. JSON output, temperature 0."],
    [C.mint, "scan-search", "Verifier", "PLAIN CODE · NO AI", "Fuzzy title and author match, evidence checks and retraction flag."],
    [C.sky, "globe", "Scholarly APIs", "OPENALEX + CROSSREF", "Real records: DOIs, authors, abstracts, open-access links, retractions."],
    [C.amber, "hard-drive", "Storage", "BROWSER · NO ACCOUNTS", "Library, claims, evidence and audit log stay on the student’s device. No server database."],
  ];
  comps.forEach(([col, ic, h, sub, b], i) => {
    const x = 0.55 + i * 2.05, y = 4.86, d = 900 + i * 130;
    els.push(line(x + 0.925, 4.5, x + 0.925, 4.84, { color: col, arrow: true, w: 1.25, anim: A("fade", d - 60) }));
    els.push(...g(A("up", d),
      box(x, y, 1.85, 1.96, { fill: C.card, ft: 10, line: col, lt: 50, shadow: true }),
      icon(ic, x + 0.18, y + 0.18, 0.3, col),
      txt(x + 0.18, y + 0.56, 1.55, 0.3, h, { font: "head", size: 12.5, bold: true }),
      txt(x + 0.18, y + 0.86, 1.62, 0.22, sub, { font: "mono", size: 8.5, bold: true, color: col, cs: 0.2 }),
      txt(x + 0.18, y + 1.12, 1.55, 0.8, b, { size: 10, color: C.muted })));
  });
  // right column
  const RX = 8.95, RW = 3.83;
  els.push(...g(A("left", 1350),
    box(RX, 2.2, RW, 2.85, { fill: C.card, ft: 10, line: C.line, shadow: true }),
    icon("arrow-right-left", RX + 0.22, 2.38, 0.26, C.mint),
    txt(RX + 0.58, 2.35, 3.0, 0.32, "Data flow", { font: "head", size: 14, bold: true, valign: "middle" })));
  const flow = [
    "Question → Scout (NIM) → search terms",
    "Terms → OpenAlex → real records only",
    "Student approves → library in their browser",
    "Claim + source text → Verifier + Skeptic → label and evidence sentence",
    "Student decision → audit log → APA 7 export",
  ];
  const flowY = [2.8, 3.24, 3.68, 4.12, 4.66]; // step 4 wraps to two lines, so step 5 sits lower
  flow.forEach((f, i) => {
    const y = flowY[i], d = 1450 + i * 110;
    els.push(...g(A("fade", d),
      box(RX + 0.22, y + 0.02, 0.26, 0.26, { shape: "ellipse", fill: C.mint, ft: 82, line: C.mint, lt: 40 }),
      txt(RX + 0.22, y + 0.02, 0.26, 0.26, String(i + 1), { font: "mono", size: 9, bold: true, color: C.mint, align: "center", valign: "middle" }),
      txt(RX + 0.6, y, 3.08, 0.44, f, { size: 10.5 })));
  });
  els.push(...g(A("up", 2050),
    box(RX, 5.23, RW, 1.59, { fill: C.mint, ft: 90, line: C.mint, lt: 50 }),
    icon("plug-zap", RX + 0.22, 5.38, 0.26, C.mint),
    txt(RX + 0.58, 5.35, 3.1, 0.32, "Built for day-of changes", { font: "head", size: 13, bold: true, valign: "middle" }),
    txt(RX + 0.22, 5.74, 3.44, 1.02, [[
      { t: "The first version already runs end to end, so the 90 minutes go on adapting it. ", b: true, c: C.text },
      { t: "Each check is its own function: a new rule, source or style plugs in without a rewrite. AI or database down: ‘Unchecked’ or ‘Couldn’t check’, never a fake result." },
    ]], { size: 10, color: C.muted })));
  els.push(...footer(3));
  return { title: "Architecture", layout: "content", els };
}

// ======================================================================
// SLIDE 4 — Guardrails
// ======================================================================
function slide4() {
  const els = header(4, "GUARDRAILS", "Guardrails: six mechanisms that keep it honest",
    [[{ t: "Code checks every citation against the databases, and ‘Supported’ needs the exact source sentence as proof. " },
      { t: "Tested on 20 labelled claims: 17–19 judged correctly across two runs, none wrongly marked ‘Supported’.", b: true, c: C.text }]]);
  const rails = [
    [C.mint, "database", "Retrieval-only references", "The AI can’t write a citation. Each one needs a DOI or OpenAlex ID returned by the database."],
    [C.mint, "scan-search", "Metadata must match", "Title ≥90% similar, plus first author and year (±1). Near-misses become ‘Close match’ to compare and confirm."],
    [C.mint, "quote", "Quote or it didn’t happen", "‘Supported’ needs a whole source sentence that code finds in the text and that shares the claim’s key terms."],
    [C.amber, "scale", "Scope check", "Flags overreach such as ‘causes’, ‘all’, ‘proves’, ‘triples’ or the wrong population when the study shows less."],
    [C.rose, "search-x", "Honest ‘Not found’", "‘Not found’ only when both databases answered. Database down: ‘Couldn’t check’. No text: ‘Unchecked’."],
    [C.rose, "lock", "Retraction + export gate", "Retracted papers turn red. Export stays locked until every red flag is fixed or knowingly overridden."],
  ];
  rails.forEach(([col, ic, h, b], i) => {
    const cx = i % 2, ry = Math.floor(i / 2);
    const x = 0.55 + cx * 3.29, y = 2.2 + ry * 1.55, d = 420 + i * 120;
    els.push(...g(A("up", d),
      box(x, y, 3.14, 1.42, { fill: C.card, ft: 10, line: C.line, shadow: true }),
      txt(x + 0.2, y + 0.16, 0.6, 0.24, `0${i + 1}`, { font: "mono", size: 10, bold: true, color: col }),
      icon(ic, x + 2.68, y + 0.14, 0.28, col),
      txt(x + 0.2, y + 0.42, 2.75, 0.32, h, { font: "head", size: 13, bold: true }),
      txt(x + 0.2, y + 0.76, 2.8, 0.64, b, { size: 10.5, color: C.muted })));
  });
  // example claim card
  const X = 7.2, Y = 2.2, W = 5.58;
  els.push(...g(A("zoom", 1150),
    box(X, Y, W, 3.22, { fill: C.card2, ft: 4, line: C.line, shadow: true }),
    txt(X + 0.25, Y + 0.17, 5.0, 0.24, "ILLUSTRATIVE EXAMPLE  ·  FICTIONAL PAPER", { font: "mono", size: 9, bold: true, color: C.dim, cs: 1 }),
    txt(X + 0.25, Y + 0.46, 5.1, 0.55, [[{ t: "“Social media use causes anxiety in teenagers” ", i: true }, { t: "(Lee & Park, 2021)", c: C.sky }]], { size: 13.5 })));
  [["EXISTS", 1.18], ["MATCHES", 1.32], ["NOT RETRACTED", 1.86]].reduce((x, [l, w], i) => {
    els.push(...g(A("zoom", 1350 + i * 130), iconChip(x, Y + 1.06, w, 0.32, "circle-check", l, C.mint, { size: 9, iconSize: 0.17 })));
    return x + w + 0.12;
  }, X + 0.25);
  els.push(...g(A("up", 1800),
    box(X + 0.25, Y + 1.5, W - 0.5, 1.12, { fill: C.amber, ft: 89, line: C.amber, lt: 40 }),
    icon("triangle-alert", X + 0.43, Y + 1.63, 0.24, C.amber),
    txt(X + 0.76, Y + 1.63, 3.6, 0.24, "OVERREACH", { font: "mono", size: 10, bold: true, color: C.amber, cs: 1, valign: "middle" }),
    txt(X + 0.43, Y + 1.94, W - 0.85, 0.4, [[{ t: "Source says: ", b: true }, { t: "“Among 312 students at two schools, heavy use was associated with higher anxiety scores.”", i: true }]], { size: 10.5 }),
    txt(X + 0.43, Y + 2.34, W - 0.85, 0.24, "The claim says ‘causes’ and stretches the finding to all teenagers.", { size: 10.5, color: C.amber })));
  // the claim card's action row, worded and styled as in the app (claim-card.tsx)
  const btn = (bx, bw, ic, label, o = {}) => [
    box(bx, Y + 2.74, bw, 0.34, { fill: o.fill ?? C.card, ft: 0, line: o.line ?? C.line, lt: 0, r: 0.08 }),
    ...(ic ? [icon(ic, bx + 0.15, Y + 2.83, 0.16, C.text)] : []),
    txt(ic ? bx + 0.38 : bx, Y + 2.74, ic ? bw - 0.46 : bw, 0.34, label, { size: 10, bold: true, color: C.text, align: ic ? "left" : "center", valign: "middle" }),
  ];
  els.push(...g(A("fade", 2050),
    btn(X + 0.25, 1.4, "pencil-line", "Edit in draft"),
    btn(X + 1.75, 1.85, "search", "Find a better source"),
    btn(X + W - 0.25 - 1.3, 1.3, null, "Keep anyway…", { fill: THEME.name === "light" ? "EEF1F6" : C.card2, line: THEME.name === "light" ? "EEF1F6" : C.line })));
  // trust labels legend: the app's label names and colours (core/labels.ts, trust-badge.tsx)
  els.push(txt(X, 5.58, W, 0.24, "TRUST LABELS ON EVERY CLAIM  ·  AS IN THE APP", { font: "mono", size: 9.5, bold: true, color: C.dim, cs: 1.2, anim: A("fade", 2200) }));
  const T = THEME.name === "light"
    ? { green: C.mint, lime: "3F6212", amber: "B45309", orange: "C2410C", blue: "0369A1", violet: "6D28D9", rose: "BE123C" }
    : { green: C.mint, lime: "A3E635", amber: C.amber, orange: "FB923C", blue: C.sky, violet: C.violet, rose: C.rose };
  const labels = [
    [T.green, "Supported", "source sentence found"],
    [T.lime, "Supported · your text", "pasted by you"],
    [T.amber, "Overreach", "goes beyond the source"],
    [T.orange, "Not supported", "source doesn’t say it"],
    [T.violet, "AI reasoning", "the AI’s own inference"],
    [T.blue, "Unchecked", "no text to check yet"],
    [T.blue, "Couldn’t check", "database down: retry"],
    [T.rose, "Not found · Retracted", "fake or withdrawn"],
  ];
  labels.forEach(([col, l, m], i) => {
    const c2 = i >= 4, x = X + (c2 ? 2.72 : 0), y = 5.86 + (i % 4) * 0.235, d = 2280 + i * 80;
    els.push(...g(A("fade", d),
      box(x, y + 0.06, 0.12, 0.12, { shape: "ellipse", fill: col, ft: 0 }),
      txt(x + 0.2, y, c2 ? 2.66 : 2.5, 0.24, [[{ t: l, b: true, c: col }, { t: `  ${m}`, c: C.muted }]], { size: 9.5, valign: "middle" })));
  });
  els.push(...footer(4));
  return { title: "Guardrails", layout: "content", els };
}

// ======================================================================
// SLIDE 5 — Ethical considerations
// ======================================================================
function slide5() {
  const els = header(5, "ETHICAL CONSIDERATIONS", "Ethical risks, and how the design answers each one",
    "Every risk is handled by a specific feature in the product, not by a promise.");
  els.push(...g(A("fade", 380),
    txt(1.15, 2.12, 2.4, 0.24, "RISK", { font: "mono", size: 9.5, bold: true, color: C.dim, cs: 1.2 }),
    txt(3.7, 2.12, 2.6, 0.24, "WHY IT MATTERS", { font: "mono", size: 9.5, bold: true, color: C.dim, cs: 1.2 }),
    txt(7.05, 2.12, 5.5, 0.24, "HOW CLAIMTRACE RESPONDS", { font: "mono", size: 9.5, bold: true, color: C.mint, cs: 1.2 })));
  const rows = [
    [C.rose, "ban", "Invented citations", "AI writes convincing references that don’t exist.", "Retrieval-only references: every citation comes from OpenAlex or Crossref, and its details must match the record."],
    [C.amber, "book-open", "Misrepresented research", "A real paper is cited for something it never says.", "The Skeptic shows the exact source sentence beside the claim and flags overreach; the student makes the call."],
    [C.sky, "copy", "Plagiarism and patchwriting", "Wording is copied too closely from the source.", "Quotes need quote marks and a page number; sentences that reuse long runs of source wording are flagged to quote or rewrite."],
    [C.violet, "fingerprint", "Privacy", "Drafts and research topics are personal.", "Drafts stay in the student’s browser. Only the claim and source text go to the AI, never names or whole drafts. Students can delete one project or everything."],
    [C.sky, "scale", "Biased or narrow sources", "Databases over-represent some regions, languages and journals.", "A source-mix view shows years, countries and open-access share. No single ‘credibility score’: fit is judged claim by claim."],
    [C.mint, "brain-circuit", "Over-reliance on AI", "Students accept AI output without thinking it through.", "The AI never decides: three checkpoints, every flag needs a click, and ‘Supported’ means ‘sentence found’, not ‘this is true’."],
  ];
  rows.forEach(([col, ic, risk, why, resp], i) => {
    const y = 2.44 + i * 0.735, d = 480 + i * 130;
    els.push(...g(A("left", d),
      box(0.55, y, 12.23, 0.66, { fill: C.card, ft: 10, line: C.line }),
      box(0.72, y + 0.14, 0.38, 0.38, { shape: "ellipse", fill: col, ft: 84, line: col, lt: 45 }),
      icon(ic, 0.81, y + 0.23, 0.2, col),
      txt(1.25, y, 2.35, 0.66, risk, { font: "head", size: 12, bold: true, valign: "middle" }),
      txt(3.7, y, 2.85, 0.66, why, { size: 10.5, color: C.muted, valign: "middle" }),
      icon("arrow-right", 6.62, y + 0.22, 0.22, C.mint),
      box(6.95, y + 0.07, 5.73, 0.52, { fill: C.mint, ft: 93, r: 0.08 }),
      txt(7.07, y + 0.07, 5.52, 0.52, resp, { size: 10.5, valign: "middle" })));
  });
  els.push(...footer(5));
  return { title: "Ethical considerations", layout: "content", els };
}

// ======================================================================
// SLIDE 6 — Governance
// ======================================================================
function slide6() {
  const els = header(6, "GOVERNANCE", "Governance: the student stays the author",
    "Clear accountability, automatic AI disclosure and named policies, so a supervisor can see exactly what the AI did and what the student decided.");
  const cols = [
    [C.mint, "user-check", "Accountability", [
      "The student is the author of record and makes every final decision.",
      "ClaimTrace gives evidence, not verdicts. Its known limits are shown in the app.",
      "Every AI output and human decision is logged with time, model and action.",
      "Team 6 owns the system’s behaviour and fixes reported errors.",
    ]],
    [C.violet, "eye", "AI disclosure", [
      "Inline labels separate AI reasoning from verified sources.",
      "Every export includes an AI-use statement: steps that used AI, the model, the date and what the student changed.",
      "Any demo output that is not a live AI call is labelled ‘Sample’.",
    ]],
    [C.sky, "landmark", "Policies followed", [
      "SP Jain academic integrity and AI-use policy",
      "APA 7, including APA guidance on citing generative AI",
      "UNESCO guidance on generative AI in education and research (2023)",
      "Data minimisation in line with GDPR principles",
      "OpenAlex, Crossref and NVIDIA terms of use",
    ]],
  ];
  const CW = (12.23 - 0.4) / 3;
  cols.forEach(([col, ic, h, items], i) => {
    const x = 0.55 + i * (CW + 0.2), y = 2.2, d = 420 + i * 160;
    els.push(...g(A("up", d),
      box(x, y, CW, 2.64, { fill: C.card, ft: 10, line: col, lt: 55, shadow: true }),
      box(x + 0.25, y + 0.22, 0.5, 0.5, { shape: "ellipse", fill: col, ft: 84, line: col, lt: 45 }),
      icon(ic, x + 0.36, y + 0.33, 0.28, col),
      txt(x + 0.9, y + 0.22, CW - 1.05, 0.5, h, { font: "head", size: 15, bold: true, valign: "middle" }),
      txt(x + 0.25, y + 0.9, CW - 0.45, 1.85, items.map((t) => ({ runs: [{ t }], bullet: true })), { size: 11, color: C.muted, after: 4 })));
  });
  els.push(...g(A("up", 1000),
    box(0.55, 5.04, 7.95, 1.5, { fill: C.violet, ft: 91, line: C.violet, lt: 50 }),
    icon("file-text", 0.78, 5.2, 0.24, C.violet),
    txt(1.1, 5.2, 6.5, 0.24, "AUTO-GENERATED AI-USE STATEMENT  ·  SAMPLE", { font: "mono", size: 9.5, bold: true, color: C.violet, cs: 1, valign: "middle" }),
    txt(0.78, 5.56, 7.5, 0.9, "“I used ClaimTrace (Nemotron 3 Ultra via NVIDIA NIM) on 26 Nov 2026 to plan literature searches and to check whether my 14 cited sources support my claims. It flagged 3 claims: I rewrote 2 and replaced 1 source. All final wording and decisions are my own.”", { size: 12.5, italic: true })));
  els.push(...g(A("zoom", 1250),
    box(8.7, 5.04, 4.08, 1.5, { fill: C.mint, ft: 88, line: C.mint, lt: 30, shadow: true }),
    txt(8.98, 5.2, 3.6, 0.8, [[{ t: "AI suggests. " }, { t: "Code checks." }], [{ t: "The student decides.", c: C.mint }]], { font: "head", size: 19, bold: true }),
    txt(8.98, 6.1, 3.6, 0.3, "Team 6 · Neel · Mohit · Anand", { size: 10.5, color: C.muted })));
  els.push(...footer(6));
  return { title: "Governance", layout: "content", els };
}

// ======================================================================
// Speaker notes (PowerPoint presenter view)
// ======================================================================
const NOTES = [
  "Most citation tools ask whether a reference exists. ClaimTrace asks whether the cited source actually says what the student's sentence says. " +
    "The problem is real: in one 2023 study, 55% of GPT-3.5's references were fabricated, and even GPT-4's real references often had errors. Retracted papers keep being cited. " +
    "ClaimTrace checks every citation three ways (exists, matches, supports) plus a retraction flag, and shows the student the exact evidence before they decide.",
  "Seven steps. The student asks a question; the Scout turns it into a search plan, and OpenAlex returns real records only. The student approves sources (checkpoint 1) and writes. " +
    "Code verifies each reference; the Skeptic finds the source sentence behind each claim and flags overreach; code re-checks that sentence. " +
    "The student decides every flag and signs off (checkpoints 2 and 3). The AI has three narrow roles: Scout, Skeptic, and an Assistant that explains a source sentence by sentence. None of them can approve a source, write a reference or edit the draft. " +
    "In the app, Previous and Next buttons follow this same order.",
  "One Next.js app on Vercel. The orchestrator has two halves: workflow code in the browser runs the steps in order, enforces the checkpoints and writes the audit log next to the student's data; " +
    "the API routes on the server call the AI and the databases, so the keys never reach the browser. Crossref and OpenAlex are free; the Verifier is plain code. " +
    "Nemotron 3 Ultra on NVIDIA NIM runs the three AI roles at temperature 0 with its thinking step switched off, and code validates every JSON reply. " +
    "We chose it by measuring the hosted models on 20 labelled claims: it judged 17 to 19 correctly across two runs and never marked a bad claim Supported. The Llama model we first planned was retired by NVIDIA in August. " +
    "There is no server database: the library, drafts and audit log stay in the student's browser, which keeps the build small and the data private. " +
    "If the AI or a database is down, the labels say so: Unchecked or Couldn't check, never a fake Supported or Not found.",
  "Six guardrails. References come only from the databases. Metadata must match, and near-misses ask the student to compare and confirm. " +
    "Supported needs a whole source sentence that code finds in the text and that is about the claim. Scope rules flag causal wording, certainty, effect sizes and the wrong population. " +
    "Not found is only said when both databases answered. Export stays locked until every flag has a decision. " +
    "The example shows a typical overreach: 'causes' where the study found an association in one sample; its buttons and the trust labels below use the same names and colours as the app. " +
    "We measured the AI check on 20 labelled claims: 17 to 19 judged correctly across two runs, and it never marked a bad claim Supported.",
  "Each ethical risk maps to a feature. Invented citations: retrieval-only references. Misrepresented research: the exact sentence beside the claim. " +
    "Patchwriting: quotation and page checks. Privacy: nothing stored on a server, minimal data to the AI, and the student can delete one project or everything. " +
    "Biased sources: a descriptive source-mix view, with no credibility score. Over-reliance: the AI never decides, and Supported means sentence found, not true.",
  "The student is the author of record. Every AI output and every decision is logged with time and model, and every export includes an AI-use statement generated from that log, like the sample shown. " +
    "Any output that is not a live AI call is labelled Sample. We follow SP Jain's academic integrity and AI-use policy, APA 7 including its guidance on citing generative AI, " +
    "UNESCO's 2023 guidance, data minimisation in line with GDPR principles, and the databases' and NVIDIA's terms of use.",
];

const slides = [slide1(), slide2(), slide3(), slide4(), slide5(), slide6()].map((s, i) => ({ ...s, notes: NOTES[i] }));
module.exports = { C, FONTS, THEME, slides, SLIDE_W: 13.333, SLIDE_H: 7.5 };
