/*
 * Build ClaimTrace_Team6_Pitch.pptx from spec.js
 *  1. pptxgenjs renders every element (native, editable shapes and text)
 *  2. the deck theme gets the ClaimTrace palette
 *  3. post-process: fade transition + auto-playing entrance animations
 *     (same order, delays and motion as the HTML deck) and media de-duplication
 */
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pptxgen = require("pptxgenjs");
const JSZip = require("jszip");
const sharp = require("sharp");
const { C, FONTS, THEME: DECK, slides } = require("./spec");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "ClaimTrace_Team6_Pitch.pptx");
const ICON_DIR = path.join(ROOT, "node_modules", "lucide-static", "icons");
const SKILL_THEME = process.env.APPLY_THEME_JS;

// PowerPoint theme slots: dark 1 / light 1 are the text and background colours of the deck
const THEME = {
  name: "ClaimTrace", headFontFace: FONTS.head, bodyFontFace: FONTS.body,
  colors:
    DECK.name === "light"
      ? { dk1: C.text, lt1: "FFFFFF", dk2: "252C3F", lt2: C.card2, accent1: C.mint, accent2: C.sky,
        accent3: C.violet, accent4: C.amber, accent5: C.rose, accent6: C.muted, hlink: C.sky, folHlink: C.violet }
      : { dk1: C.bg, lt1: "FFFFFF", dk2: C.card, lt2: C.text, accent1: C.mint, accent2: C.sky,
        accent3: C.violet, accent4: C.amber, accent5: C.rose, accent6: C.muted, hlink: C.sky, folHlink: C.violet },
};

const iconCache = new Map();
async function iconPng(name, color) {
  const key = `${name}-${color}`;
  if (!iconCache.has(key)) {
    let svg = fs.readFileSync(path.join(ICON_DIR, `${name}.svg`), "utf8");
    svg = svg.replace(/currentColor/g, `#${color}`).replace(/width="24"/, 'width="256"').replace(/height="24"/, 'height="256"');
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    iconCache.set(key, "image/png;base64," + buf.toString("base64"));
  }
  return iconCache.get(key);
}

function runsFor(el) {
  const out = [];
  el.paras.forEach((p, pi) => {
    p.runs.forEach((r, ri) => {
      const o = {
        color: r.c ?? el.color, bold: r.b ?? el.bold, italic: r.i ?? el.italic,
        fontFace: FONTS[r.f ?? el.font], fontSize: r.s ?? el.size, align: p.align ?? el.align,
      };
      if (el.cs) o.charSpacing = el.cs;
      if (p.bullet) o.bullet = { indent: 13 };
      if (el.after) o.paraSpaceAfter = el.after;
      if (ri === p.runs.length - 1 && pi < el.paras.length - 1) o.breakLine = true;
      out.push({ text: r.t, options: o });
    });
  });
  return out;
}

async function render(pres, s, el) {
  const name = el.id;
  if (el.type === "box") {
    const shape = el.shape === "ellipse" ? pres.ShapeType.ellipse : (el.r > 0 ? pres.ShapeType.roundRect : pres.ShapeType.rect);
    const o = { x: el.x, y: el.y, w: el.w, h: el.h, objectName: name,
      fill: { color: el.fill, transparency: el.ft },
      line: el.line ? { color: el.line, width: el.lw, transparency: el.lt } : { type: "none" } };
    if (shape === pres.ShapeType.roundRect) o.rectRadius = Math.min(el.r, Math.min(el.w, el.h) / 2);
    if (el.shadow) o.shadow = { type: "outer", blur: DECK.shadow.blur, offset: DECK.shadow.offset, angle: 90, color: DECK.name === "light" ? "0F172A" : "000000", opacity: DECK.shadow.opacity };
    s.addShape(shape, o);
  } else if (el.type === "text") {
    const o = { x: el.x, y: el.y, w: el.w, h: el.h, margin: 0, valign: el.valign, align: el.align,
      fit: "none", wrap: true, objectName: name, isTextBox: true };
    if (el.ph) { s.addText(runsFor(el), { placeholder: "title" }); return; }
    s.addText(runsFor(el), o);
  } else if (el.type === "icon") {
    s.addImage({ data: await iconPng(el.name, el.color), x: el.x, y: el.y, w: el.w, h: el.h, objectName: name, altText: el.name });
  } else if (el.type === "line") {
    const o = { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1),
      objectName: name, line: { color: el.color, width: el.w } };
    if (el.dash) o.line.dashType = "dash";
    if (el.arrow) o.line.endArrowType = "triangle";
    if (el.x2 < el.x1) o.flipH = true;
    if (el.y2 < el.y1) o.flipV = true;
    s.addShape(pres.ShapeType.line, o);
  }
}

// ---------- animation XML ----------
const PRESET = { up: [42, 0], left: [42, 0], fade: [10, 0], zoom: [53, 16] };
function behaviours(k, spid, next, dur) {
  const tgt = `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>`;
  const anim = (attr, from, to) => `<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${next()}" dur="${dur}" decel="100000" fill="hold"/>${tgt}<p:attrNameLst><p:attrName>${attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${from}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${to}"/></p:val></p:tav></p:tavLst></p:anim>`;
  let x = `<p:set><p:cBhvr><p:cTn id="${next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`;
  x += `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${next()}" dur="${dur}"/>${tgt}</p:cBhvr></p:animEffect>`;
  if (k === "up") x += anim("ppt_x", "#ppt_x", "#ppt_x") + anim("ppt_y", "#ppt_y+.05", "#ppt_y");
  if (k === "left") x += anim("ppt_x", "#ppt_x-.03", "#ppt_x") + anim("ppt_y", "#ppt_y", "#ppt_y");
  if (k === "zoom") x += anim("ppt_w", "#ppt_w*.88", "#ppt_w") + anim("ppt_h", "#ppt_h*.88", "#ppt_h");
  return x;
}
function timingXml(items) {
  let id = 4;
  const next = () => ++id;
  const effects = items.map((it, i) => {
    const [preset, sub] = PRESET[it.k];
    const cid = next();
    const node = i === 0 ? "afterEffect" : "withEffect";
    const grp = it.bld ? ' grpId="0"' : "";
    return `<p:par><p:cTn id="${cid}" presetID="${preset}" presetClass="entr" presetSubtype="${sub}" fill="hold"${grp} nodeType="${node}"><p:stCondLst><p:cond delay="${it.d}"/></p:stCondLst><p:childTnLst>${behaviours(it.k, it.spid, next, it.k === "fade" ? 600 : 700)}</p:childTnLst></p:cTn></p:par>`;
  }).join("");
  const bld = items.filter((it) => it.bld).map((it) => `<p:bldP spid="${it.spid}" grpId="0" animBg="1"/>`).join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>` +
    `<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>` +
    `<p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${effects}</p:childTnLst></p:cTn></p:par>` +
    `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` +
    `</p:childTnLst></p:cTn></p:par></p:tnLst>${bld ? `<p:bldLst>${bld}</p:bldLst>` : ""}</p:timing>`;
}

async function postProcess(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  // 1) animations + transitions
  for (let i = 0; i < slides.length; i++) {
    const p = `ppt/slides/slide${i + 1}.xml`;
    let xml = await zip.file(p).async("string");
    // map element name -> {id, kind}; title placeholder found by <p:ph type="title">
    const shapes = [];
    const re = /<p:(sp|pic|cxnSp)>([\s\S]*?)<\/p:\1>/g;
    let m;
    while ((m = re.exec(xml))) {
      const idm = /<p:cNvPr id="(\d+)" name="([^"]*)"/.exec(m[2]);
      if (!idm) continue;
      shapes.push({ kind: m[1], id: idm[1], name: idm[2], isTitle: /<p:ph\b[^>]*type="title"/.test(m[2]), hasTx: /<p:txBody>/.test(m[2]) });
    }
    const byName = new Map(shapes.map((s) => [s.name, s]));
    const titleShape = shapes.find((s) => s.isTitle);
    const items = [];
    for (const el of slides[i].els) {
      if (!el.anim) continue;
      const sh = el.ph ? titleShape : byName.get(el.id);
      if (!sh) { console.warn(`slide ${i + 1}: no shape for ${el.id}`); continue; }
      items.push({ spid: sh.id, k: el.anim.k, d: el.anim.d, bld: sh.kind === "sp" && sh.hasTx });
    }
    items.sort((a, b) => a.d - b.d);
    const extra = `<p:transition spd="slow"><p:fade/></p:transition>` + (items.length ? timingXml(items) : "");
    xml = xml.replace(/(<\/p:clrMapOvr>)/, `$1${extra}`);
    if (!xml.includes("<p:transition")) throw new Error(`could not insert timing in ${p}`);
    zip.file(p, xml);
  }
  // 2) de-duplicate identical media (the background GIF is added on every slide)
  const media = Object.keys(zip.files).filter((f) => f.startsWith("ppt/media/") && !zip.files[f].dir);
  const byHash = new Map(), rename = new Map();
  for (const f of media) {
    const h = crypto.createHash("sha1").update(await zip.file(f).async("nodebuffer")).digest("hex");
    if (byHash.has(h)) rename.set(f, byHash.get(h)); else byHash.set(h, f);
  }
  const rels = Object.keys(zip.files).filter((f) => /^ppt\/(slides|slideLayouts|slideMasters)\/_rels\/.*\.rels$/.test(f));
  for (const r of rels) {
    let x = await zip.file(r).async("string"), changed = false;
    for (const [dup, keep] of rename) {
      const from = `../media/${path.posix.basename(dup)}`, to = `../media/${path.posix.basename(keep)}`;
      if (x.includes(`"${from}"`)) { x = x.split(`"${from}"`).join(`"${to}"`); changed = true; }
    }
    if (changed) zip.file(r, x);
  }
  for (const dup of rename.keys()) zip.remove(dup);
  // 3) re-pack without folder entries (they break opening via cloud services like OneDrive)
  const clean = new JSZip();
  for (const [name, f] of Object.entries(zip.files)) {
    if (!f.dir) clean.file(name, await f.async("nodebuffer"), { createFolders: false });
  }
  const buf = await clean.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  fs.writeFileSync(file, buf);
  console.log(`media: ${media.length} -> ${media.length - rename.size} files`);
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "ClaimTrace — Team 6 ideation deck";
  pres.author = "Team 6 (Neel, Mohit, Anand)";
  pres.subject = "AI Club Hackathon 2026";
  pres.theme = { headFontFace: FONTS.head, bodyFontFace: FONTS.body };
  const titlePh = (x, y, w, h, size) => ({ placeholder: { options: { name: "title", type: "title", x, y, w, h, margin: 0,
    fontFace: FONTS.head, fontSize: size, bold: true, color: C.text, valign: "top", align: "left" }, text: "" } });
  pres.defineSlideMaster({ title: "CT_TITLE", background: { color: C.bg }, objects: [titlePh(0.6, 1.08, 6.8, 1.15, 64)] });
  pres.defineSlideMaster({ title: "CT_CONTENT", background: { color: C.bg }, objects: [titlePh(0.55, 0.82, 12.2, 0.6, 28)] });

  const bgGif = path.join(ROOT, "assets", `${DECK.asset}.gif`);
  for (const sl of slides) {
    pres.addSection({ title: sl.title });
    const s = pres.addSlide({ masterName: sl.layout === "title" ? "CT_TITLE" : "CT_CONTENT", sectionTitle: sl.title });
    s.addImage({ path: bgGif, x: 0, y: 0, w: 13.333, h: 7.5, objectName: "Animated background", altText: "Animated citation-network background" });
    for (const el of sl.els) await render(pres, s, el);
    if (sl.notes) s.addNotes(sl.notes);
  }
  await pres.writeFile({ fileName: OUT });
  if (SKILL_THEME) await require(SKILL_THEME).applyTheme(OUT, THEME);
  await postProcess(OUT);
  console.log("wrote", OUT, (fs.statSync(OUT).size / 1e6).toFixed(2), "MB");
})().catch((e) => { console.error(e); process.exit(1); });
