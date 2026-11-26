/*
 * Build ClaimTrace_Team6_Pitch.html from spec.js (same layout + motion as the PPTX).
 * Output is one self-contained HTML file (fonts from Google Fonts as fallbacks only).
 */
const fs = require("fs");
const path = require("path");
const { C, THEME, slides } = require("./spec");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "ClaimTrace_Team6_Pitch.html");
const ICON_DIR = path.join(ROOT, "node_modules", "lucide-static", "icons");
const BG = JSON.parse(fs.readFileSync(path.join(ROOT, "assets", `${THEME.asset}.json`), "utf8"));
const LIGHT = THEME.name === "light";
// page chrome around the slide (the slide itself is drawn from spec.js)
const UI = LIGHT
  ? { scheme: "light", page: "radial-gradient(ellipse at center,#f3f5f9 0%,#e6eaf1 75%)", stage: "0 24px 70px rgba(15,23,42,.16)",
      bar: "rgba(255,255,255,.92)", barLine: "rgba(15,23,42,.10)", barShadow: "0 10px 30px rgba(15,23,42,.12)", hover: "rgba(15,23,42,.06)",
      dlText: "#ffffff", dlHover: "#086a52", sep: "rgba(15,23,42,.14)" }
  : { scheme: "dark", page: `radial-gradient(ellipse at center,#0b1330 0%,#${C.bg} 70%)`, stage: "0 30px 80px rgba(0,0,0,.6)",
      bar: "rgba(15,23,51,.82)", barLine: "rgba(110,182,255,.22)", barShadow: "0 10px 30px rgba(0,0,0,.45)", hover: "rgba(110,182,255,.14)",
      dlText: "#0a1022", dlHover: "#5ff0bd", sep: "rgba(163,176,214,.22)" };
const PX = 96;               // px per inch on the 1280 x 720 stage
const PT = 96 / 72;          // px per pt

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rgba = (hex, transparency = 0) => {
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${+(1 - transparency / 100).toFixed(3)})`;
};
const FONT = { head: "var(--f-head)", body: "var(--f-body)", mono: "var(--f-mono)" };

const iconCache = new Map();
function iconSvg(name) {
  if (!iconCache.has(name)) {
    let s = fs.readFileSync(path.join(ICON_DIR, `${name}.svg`), "utf8");
    s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/\s*class="[^"]*"/, "").replace(/\s+width="24"/, ' width="100%"')
      .replace(/\s+height="24"/, ' height="100%"').replace(/\n\s*/g, " ").trim();
    iconCache.set(name, s);
  }
  return iconCache.get(name);
}

function pos(el) {
  return `left:${(el.x * PX).toFixed(1)}px;top:${(el.y * PX).toFixed(1)}px;width:${(el.w * PX).toFixed(1)}px;height:${(el.h * PX).toFixed(1)}px;`;
}
function withDelay(el, style) {
  return el.anim ? `${style}--d:${el.anim.d}ms;` : style;
}

let lineSeq = 0;
function renderEl(el) {
  const k = el.anim ? ` data-k="${el.anim.k}"` : "";
  if (el.type === "box") {
    let st = pos(el) + `background:${rgba(el.fill, el.ft)};`;
    if (el.line) st += `border:1px solid ${rgba(el.line, el.lt)};`;
    st += el.shape === "ellipse" ? "border-radius:50%;" : `border-radius:${(Math.min(el.r, Math.min(el.w, el.h) / 2) * PX).toFixed(1)}px;`;
    if (el.shadow) st += `box-shadow:${THEME.shadow.css};`;
    const glass = el.ft > 0 && el.shadow ? " glass" : "";
    return `<div class="el box${glass}"${k} style="${withDelay(el, st)}"></div>`;
  }
  if (el.type === "text") {
    const jc = { top: "flex-start", middle: "center", bottom: "flex-end" }[el.valign];
    let st = pos(el) + `font-family:${FONT[el.font]};font-size:${(el.size * PT).toFixed(2)}px;color:#${el.color};justify-content:${jc};text-align:${el.align};`;
    if (el.bold) st += "font-weight:700;";
    if (el.italic) st += "font-style:italic;";
    if (el.cs) st += `letter-spacing:${(el.cs * PT).toFixed(2)}px;`;
    const paras = el.paras.map((p, i) => {
      const last = i === el.paras.length - 1;
      const pst = (!last && el.after ? `margin-bottom:${(el.after * PT).toFixed(1)}px;` : "") + (p.align ? `text-align:${p.align};` : "");
      const runs = p.runs.map((r) => {
        let rs = "";
        if (r.c) rs += `color:#${r.c};`;
        if (r.b !== undefined) rs += `font-weight:${r.b ? 700 : 400};`;
        if (r.i !== undefined) rs += `font-style:${r.i ? "italic" : "normal"};`;
        if (r.s) rs += `font-size:${(r.s * PT).toFixed(2)}px;`;
        if (r.f) rs += `font-family:${FONT[r.f]};`;
        return rs ? `<span style="${rs}">${esc(r.t)}</span>` : esc(r.t);
      }).join("");
      return `<p class="${p.bullet ? "bul" : ""}" style="${pst}">${runs}</p>`;
    }).join("");
    const tag = el.ph === "title" ? "h1" : "div";
    return `<${tag} class="el t"${k} style="${withDelay(el, st)}">${paras}</${tag}>`;
  }
  if (el.type === "icon") {
    const st = pos(el) + `color:#${el.color};`;
    return `<div class="el ic"${k} aria-hidden="true" style="${withDelay(el, st)}">${iconSvg(el.name)}</div>`;
  }
  if (el.type === "line") {
    const pad = 10, x = Math.min(el.x1, el.x2) * PX - pad, y = Math.min(el.y1, el.y2) * PX - pad;
    const w = Math.abs(el.x2 - el.x1) * PX + pad * 2, h = Math.abs(el.y2 - el.y1) * PX + pad * 2;
    const id = `ah${++lineSeq}`;
    const sw = (el.w * PT).toFixed(2);
    const st = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;`;
    const marker = el.arrow ? `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#${el.color}"/></marker></defs>` : "";
    return `<svg class="el ln"${k} aria-hidden="true" style="${withDelay(el, st)}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">${marker}` +
      `<line x1="${(el.x1 * PX - x).toFixed(1)}" y1="${(el.y1 * PX - y).toFixed(1)}" x2="${(el.x2 * PX - x).toFixed(1)}" y2="${(el.y2 * PX - y).toFixed(1)}" stroke="#${el.color}" stroke-width="${sw}"${el.dash ? ' stroke-dasharray="6 4"' : ""}${el.arrow ? ` marker-end="url(#${id})"` : ""}/></svg>`;
  }
  return "";
}

const slidesHtml = slides.map((s, i) =>
  `<section class="slide" id="s${i + 1}" aria-label="Slide ${i + 1}: ${esc(s.title)}"${i ? ' aria-hidden="true"' : ""}>${s.els.map(renderEl).join("")}</section>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ClaimTrace · Team 6</title>
<meta name="description" content="ClaimTrace: a reference manager and AI research assistant that checks every citation exists, matches and supports the claim. AI Club Hackathon 2026, Team 6.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@500;700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#${C.bg};--card:#${C.card};--text:#${C.text};--muted:#${C.muted};--dim:#${C.dim};
  --mint:#${C.mint};--sky:#${C.sky};--violet:#${C.violet};--amber:#${C.amber};--rose:#${C.rose};
  --f-head:"Century Gothic","Poppins",system-ui,sans-serif;
  --f-body:"Calibri","Carlito","Segoe UI",system-ui,sans-serif;
  --f-mono:"Consolas","JetBrains Mono",ui-monospace,monospace;
  --ease:cubic-bezier(.33,1,.68,1);
  color-scheme:${UI.scheme};
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--text);overflow:hidden;font-family:var(--f-body)}
#viewport{position:fixed;inset:0;display:grid;place-items:center;background:${UI.page}}
#stage{position:relative;width:1280px;height:720px;flex:none;transform-origin:center center;overflow:hidden;background:var(--bg);box-shadow:${UI.stage}}
#bg{position:absolute;inset:0;width:1280px;height:720px}
.slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .9s ease,visibility 0s linear .9s}
.slide.on{opacity:1;visibility:visible;transition:opacity .9s ease,visibility 0s}
.el{position:absolute}
.t{display:flex;flex-direction:column;line-height:1.2;white-space:pre-wrap;overflow-wrap:break-word;font-weight:400}
h1.t{font-size:inherit}
.t p.bul{position:relative;padding-left:17px}
.t p.bul::before{content:"";position:absolute;left:3px;top:.52em;width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.8}
.ic svg{display:block;width:100%;height:100%}
.ln{overflow:visible}
.glass{backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
/* entrance motion (mirrors the PowerPoint timing: float-in 5% / 3%, zoom 88%, fade) */
.slide [data-k]{opacity:0}
.slide.play [data-k]{animation-duration:.7s;animation-timing-function:var(--ease);animation-fill-mode:both;animation-delay:var(--d,0ms)}
.slide.play [data-k=up]{animation-name:k-up}
.slide.play [data-k=left]{animation-name:k-left}
.slide.play [data-k=zoom]{animation-name:k-zoom}
.slide.play [data-k=fade]{animation-name:k-fade;animation-duration:.6s}
@keyframes k-up{from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:none}}
@keyframes k-left{from{opacity:0;transform:translateX(-38px)}to{opacity:1;transform:none}}
@keyframes k-zoom{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
@keyframes k-fade{from{opacity:0}to{opacity:1}}
.static .slide [data-k]{opacity:1!important;animation:none!important}
/* chrome */
#progress{position:fixed;left:0;top:0;height:3px;background:var(--mint);box-shadow:0 0 12px var(--mint);transition:width .5s var(--ease);z-index:5}
#controls{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px;border-radius:999px;
  background:${UI.bar};border:1px solid ${UI.barLine};backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  box-shadow:${UI.barShadow};transition:opacity .35s ease,transform .35s ease;z-index:6}
#controls.hide{opacity:0;transform:translate(-50%,12px);pointer-events:none}
#controls button,#controls a{display:inline-flex;align-items:center;gap:7px;height:36px;min-width:36px;padding:0 10px;border:0;border-radius:999px;
  background:transparent;color:var(--text);font:600 13px var(--f-body);text-decoration:none;cursor:pointer}
#controls button:hover,#controls a:hover{background:${UI.hover}}
#controls button:focus-visible,#controls a:focus-visible{outline:2px solid var(--mint);outline-offset:2px}
#controls .dl{background:var(--mint);color:${UI.dlText}}
#controls .dl:hover{background:${UI.dlHover}}
#controls svg{width:17px;height:17px}
#count{font:600 12px var(--f-mono);color:var(--muted);padding:0 6px;min-width:58px;text-align:center}
.sep{width:1px;height:20px;background:${UI.sep};margin:0 2px}
@media (max-width:640px){#controls .lbl{display:none}#controls{bottom:10px}}
@media (prefers-reduced-motion:reduce){.slide,.slide.on{transition:none}.slide.play [data-k]{animation:none;opacity:1}}
@media print{
  @page{size:1280px 720px;margin:0}
  html,body{overflow:visible;height:auto}
  #viewport{position:static;display:block;background:none}
  #stage{transform:none!important;overflow:visible;height:auto;box-shadow:none;background:none}
  #bg,#controls,#progress{display:none}
  .slide{position:relative;opacity:1;visibility:visible;width:1280px;height:720px;page-break-after:always;break-after:page;
    background:#${C.bg} url("assets/${THEME.asset}_poster.png") center/cover;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .slide [data-k]{opacity:1!important;animation:none!important}
}
</style>
</head>
<body>
<div id="viewport">
  <main id="stage">
    <canvas id="bg" aria-hidden="true"></canvas>
${slidesHtml}
  </main>
</div>
<div id="progress"></div>
<nav id="controls" aria-label="Slide controls">
  <button id="prev" aria-label="Previous slide">${iconSvg("chevron-left")}</button>
  <span id="count" aria-live="polite">1 / ${slides.length}</span>
  <button id="next" aria-label="Next slide">${iconSvg("chevron-right")}</button>
  <span class="sep"></span>
  <button id="replay" aria-label="Replay animation">${iconSvg("rotate-ccw")}</button>
  <button id="fs" aria-label="Toggle full screen">${iconSvg("maximize")}</button>
  <a class="dl" href="ClaimTrace_Team6_Pitch.pptx" download aria-label="Download PowerPoint">${iconSvg("download")}<span class="lbl">PowerPoint</span></a>
</nav>
<script>
(() => {
  const BG = ${JSON.stringify(BG)};
  const qs = new URLSearchParams(location.search);
  const STATIC = qs.has("static");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (STATIC) document.documentElement.classList.add("static");

  // ---- stage scaling ----
  const stage = document.getElementById("stage");
  function fit() {
    const s = Math.min(innerWidth / 1280, innerHeight / 720);
    stage.style.transform = "scale(" + s + ")";
    sizeCanvas(s);
  }

  // ---- animated citation-network background (same data as the PowerPoint GIF) ----
  const cv = document.getElementById("bg"), ctx = cv.getContext("2d");
  const col = (n, a) => "rgba(" + BG.palette[n].join(",") + "," + a + ")";
  const A = Object.assign({ grid: .035, link: .2, pulse: .45, halo: .11, dot: .78 }, BG.alpha || {});
  let k = 1, base = null;
  function sizeCanvas(s) {
    k = Math.min(2.5, Math.max(1, s * (devicePixelRatio || 1)));
    cv.width = Math.round(1280 * k); cv.height = Math.round(720 * k);
    base = document.createElement("canvas"); base.width = cv.width; base.height = cv.height;
    const b = base.getContext("2d"); b.scale(k, k);
    b.fillStyle = "rgb(" + BG.bg.join(",") + ")"; b.fillRect(0, 0, 1280, 720);
    for (const g of BG.glows) {
      const gr = b.createRadialGradient(g.x * 1280, g.y * 720, 0, g.x * 1280, g.y * 720, g.r);
      [[0, 1], [.25, .5625], [.5, .25], [.75, .0625], [1, 0]].forEach(([o, m]) => gr.addColorStop(o, col(g.c, g.a * m)));
      b.fillStyle = gr; b.fillRect(0, 0, 1280, 720);
    }
    b.strokeStyle = col("sky", A.grid); b.lineWidth = 1; b.beginPath();
    for (let x = 0.5; x < 1280; x += 48) { b.moveTo(x, 0); b.lineTo(x, 720); }
    for (let y = 0.5; y < 720; y += 48) { b.moveTo(0, y); b.lineTo(1280, y); }
    b.stroke();
    if (reduce || STATIC) draw(0);
  }
  function pos(n, t) {
    const a = Math.PI * 2 * n.k * t;
    return [n.x + n.ax * Math.sin(a + n.p1), n.y + n.ay * Math.cos(a + n.p2)];
  }
  // quiet zones (see make_bg.py): the network fades out where slide text sits
  const QZ = BG.quiet || [], QR = BG.quietRamp || 26;
  function quiet(x, y) {
    let s = 0;
    for (const [x0, y0, x1, y1] of QZ) {
      const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
      const v = Math.max(0, 1 - Math.hypot(dx, dy) / QR);
      s = Math.max(s, v * v * (3 - 2 * v));
    }
    return 1 - s;
  }
  const quietSeg = (ax, ay, bx, by) => Math.min(...[0, .2, .4, .6, .8, 1].map(f => quiet(ax + (bx - ax) * f, ay + (by - ay) * f)));
  const quietRing = (x, y, r) => Math.min(quiet(x, y), ...Array.from({ length: 12 }, (_, i) => quiet(x + r * Math.cos(i * Math.PI / 6), y + r * Math.sin(i * Math.PI / 6))));
  function draw(now) {
    const t = (now % BG.periodMs) / BG.periodMs;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const P = BG.nodes.map(n => pos(n, t)), N = BG.nodes, L = BG.linkDist;
    ctx.lineWidth = 1;
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
      if (d < L) {
        const q = quietSeg(P[i][0], P[i][1], P[j][0], P[j][1]);
        if (q <= 0) continue;
        ctx.strokeStyle = col(N[i].c === "mint" && N[j].c === "mint" ? "mint" : "ink", (A.link * (1 - d / L) * q).toFixed(3));
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
      }
    }
    for (const p of BG.pulses) {
      const u = (t + p.off) % 1, [x, y] = P[p.n];
      const q = quietRing(x, y, 6 + 64 * u);
      if (q <= 0) continue;
      ctx.strokeStyle = col(N[p.n].c, (A.pulse * (1 - u) * q).toFixed(3));
      ctx.beginPath(); ctx.arc(x, y, 6 + 64 * u, 0, Math.PI * 2); ctx.stroke();
    }
    N.forEach((n, i) => {
      const [x, y] = P[i], q = quietRing(x, y, n.r * 2.6);
      if (q <= 0) return;
      ctx.fillStyle = col(n.c, A.halo * q); ctx.beginPath(); ctx.arc(x, y, n.r * 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col(n.c, A.dot * q); ctx.beginPath(); ctx.arc(x, y, n.r, 0, Math.PI * 2); ctx.fill();
    });
  }
  function loop(now) { if (!document.hidden) draw(now); requestAnimationFrame(loop); }

  // ---- navigation ----
  const slides = [...document.querySelectorAll(".slide")];
  const count = document.getElementById("count"), bar = document.getElementById("progress");
  let cur = -1;
  function go(i, replay) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur && !replay) return;
    slides.forEach((s, j) => {
      const on = j === i;
      s.classList.toggle("on", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      s.classList.remove("play");
    });
    void slides[i].offsetWidth;            // restart entrance animations
    slides[i].classList.add("play");
    cur = i;
    count.textContent = (i + 1) + " / " + slides.length;
    bar.style.width = ((i + 1) / slides.length * 100) + "%";
    if (location.hash !== "#" + (i + 1)) history.replaceState(null, "", "#" + (i + 1));
  }
  const next = () => go(cur + 1), prev = () => go(cur - 1);
  document.getElementById("next").onclick = next;
  document.getElementById("prev").onclick = prev;
  document.getElementById("replay").onclick = () => go(cur, true);
  document.getElementById("fs").onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  addEventListener("keydown", e => {
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "Home") go(0); else if (e.key === "End") go(slides.length - 1);
    else if (e.key.toLowerCase() === "f") document.getElementById("fs").click();
  });
  stage.addEventListener("click", e => { (e.clientX < innerWidth * .3 ? prev : next)(); });
  let tx = null;
  addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) (dx < 0 ? next : prev)(); tx = null; });
  addEventListener("hashchange", () => go((parseInt(location.hash.slice(1), 10) || 1) - 1));

  // auto-hide controls while presenting
  const ctr = document.getElementById("controls"); let idle;
  const wake = () => { ctr.classList.remove("hide"); clearTimeout(idle); if (!STATIC) idle = setTimeout(() => ctr.classList.add("hide"), 2600); };
  ["mousemove", "touchstart", "keydown"].forEach(ev => addEventListener(ev, wake, { passive: true }));
  if (STATIC) ctr.style.display = "none";

  addEventListener("resize", fit);
  fit();
  go((parseInt(location.hash.slice(1), 10) || 1) - 1);
  wake();
  if (!reduce && !STATIC) requestAnimationFrame(loop);
})();
</script>
</body>
</html>
`;
fs.writeFileSync(OUT, html);
console.log("wrote", OUT, (fs.statSync(OUT).size / 1024).toFixed(0), "KB");
