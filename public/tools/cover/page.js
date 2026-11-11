import { dropZone, modeButton } from "/tools/audio.js?v=1";
modeButton();
const $ = (id) => document.getElementById(id);
const cv = $("cv"), g = cv.getContext("2d");
const PAL = [
  ["#0f2e2a", "#1f5a50", "#d4b25a", "#f3ead2"], ["#1a1033", "#4a1d6b", "#ff5fa2", "#fbe9ff"], ["#0b1726", "#1d3b63", "#6fd3ff", "#e8f6ff"],
  ["#2b0f0f", "#7a1f1f", "#ffb347", "#fff1e0"], ["#f2ebe0", "#e2d3bd", "#b0412e", "#2a1d17"], ["#101010", "#2a2a2a", "#e9ff5c", "#f5f5f5"],
  ["#13261b", "#2f6b3f", "#f2c14e", "#f7f3e3"], ["#ffd6c9", "#ff9aa2", "#5a2a6e", "#2b1035"], ["#06283d", "#1363df", "#dff6ff", "#ffffff"],
  ["#2d1b0e", "#8c5a2b", "#f6d6a8", "#fff8ec"], ["#e9f1ef", "#b9d8d0", "#1f4d47", "#10302b"], ["#1b0b1f", "#3d1240", "#ff8a3d", "#ffe9d6"],
];
const STYLES = {
  gold:    { label: "Gold Leaf", font: "600 {s}px 'EG Cinzel', serif", up: true },
  neon:    { label: "Neon",      font: "{s}px 'EG Bebas', sans-serif", up: true },
  wash:    { label: "Colour Wash", font: "{s}px 'EG Archivo', sans-serif", up: false },
  minimal: { label: "Minimal",   font: "500 {s}px 'EG Cormorant', serif", up: false },
  vinyl:   { label: "Vinyl",     font: "{s}px 'EG Bebas', sans-serif", up: true },
  hand:    { label: "Handwritten", font: "{s}px 'EG Marker', cursive", up: false },
};
let style = "gold", pal = 0, seed = 1, W = 3000, H = 3000, photo = null;

// fonts used on the covers: served from this site so they always load (SIL Open Font License)
const FONTS = [["EG Bebas", "bebas-neue-latin-400-normal", "400"], ["EG Archivo", "archivo-black-latin-400-normal", "400"],
  ["EG Marker", "permanent-marker-latin-400-normal", "400"], ["EG Cinzel", "cinzel-latin-400-normal", "400"], ["EG Cinzel", "cinzel-latin-600-normal", "600"],
  ["EG Cormorant", "cormorant-garamond-latin-500-normal", "500"], ["EG Mono", "jetbrains-mono-latin-400-normal", "400"]];
const fontsReady = Promise.all(FONTS.map(([fam, file, weight]) => new FontFace(fam, `url(/tools/fonts/${file}.woff2)`, { weight }).load()
  .then((f) => document.fonts.add(f)).catch(() => {})));
const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (const [k, v] of Object.entries(STYLES)) {
  const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.dataset.s = k; b.textContent = v.label;
  b.setAttribute("aria-pressed", String(k === style)); b.onclick = () => { style = k; press("#styles", b); draw(); }; $("styles").append(b);
}
document.querySelectorAll("#sizes .chip").forEach((b) => (b.onclick = () => { W = +b.dataset.w; H = +b.dataset.h; press("#sizes", b); draw(); }));
function press(sel, b) { document.querySelectorAll(`${sel} .chip`).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }
$("shuffle").onclick = () => { pal = (pal + 1 + Math.floor(Math.random() * (PAL.length - 1))) % PAL.length; seed = 1 + Math.floor(Math.random() * 1e6); draw(); };
["title", "artist"].forEach((id) => $(id).addEventListener("input", () => draw()));
dropZone($("drop"), $("file"), (files) => {
  const img = new Image(); img.onload = () => { photo = img; $("photo-label").textContent = files[0].name; $("nophoto").hidden = false; draw(); };
  img.src = URL.createObjectURL(files[0]);
});
$("nophoto").onclick = () => { photo = null; $("photo-label").textContent = "Drop a photo here or tap to choose"; $("nophoto").hidden = true; $("file").value = ""; draw(); };

// wrap text into at most 3 lines, shrinking until it fits
function fit(c, text, fontTpl, maxW, start, minS, maxLines = 3) {
  let s = start;
  for (; s > minS; s *= 0.93) {
    c.font = fontTpl.replace("{s}", Math.round(s));
    const words = text.split(/\s+/).filter(Boolean), lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    if (lines.length <= maxLines && lines.every((l) => c.measureText(l).width <= maxW)) return { lines, s };
  }
  c.font = fontTpl.replace("{s}", Math.round(minS)); return { lines: [text], s: minS };
}
function cover(c, w, h) {
  const [bg1, bg2, acc, ink] = PAL[pal], r = rnd(seed), m = Math.min(w, h), st = STYLES[style];
  const tall = h > w * 1.3, wide = w > h * 1.3;
  let title = ($("title").value || " ").trim(), artist = ($("artist").value || "").trim();
  if (st.up) { title = title.toUpperCase(); artist = artist.toUpperCase(); }
  c.save(); c.clearRect(0, 0, w, h);
  // background
  const lg = c.createLinearGradient(0, 0, w * 0.3, h); lg.addColorStop(0, bg2); lg.addColorStop(1, bg1); c.fillStyle = lg; c.fillRect(0, 0, w, h);
  if (photo) {
    const k = Math.max(w / photo.width, h / photo.height); c.drawImage(photo, (w - photo.width * k) / 2, (h - photo.height * k) / 2, photo.width * k, photo.height * k);
    const sh = c.createLinearGradient(0, h * 0.35, 0, h); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.7)"); c.fillStyle = sh; c.fillRect(0, 0, w, h);
  }
  let ty = h * 0.5, tcol = ink, align = "center", tx = w / 2, maxW = w * 0.8;
  if (style === "gold") {
    if (!photo) { const rg = c.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, m * 0.7); rg.addColorStop(0, bg2); rg.addColorStop(1, bg1); c.fillStyle = rg; c.fillRect(0, 0, w, h); }
    c.strokeStyle = acc; c.lineWidth = m * 0.008; c.strokeRect(m * 0.05, m * 0.05, w - m * 0.1, h - m * 0.1);
    c.lineWidth = m * 0.003; c.strokeRect(m * 0.07, m * 0.07, w - m * 0.14, h - m * 0.14);
    for (const [x, y] of [[m * 0.07, m * 0.07], [w - m * 0.07, m * 0.07], [m * 0.07, h - m * 0.07], [w - m * 0.07, h - m * 0.07]]) {
      c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillStyle = acc; c.fillRect(-m * 0.018, -m * 0.018, m * 0.036, m * 0.036); c.restore(); }
    c.fillStyle = acc; c.font = `${m * 0.05}px 'EG Cinzel', serif`; c.textAlign = "center"; c.fillText("✦", w / 2, h * 0.3);
    tcol = acc; ty = h * 0.5;
  } else if (style === "neon") {
    if (!photo) { c.fillStyle = bg1; c.fillRect(0, 0, w, h); }
    c.save(); c.strokeStyle = acc; c.globalAlpha = 0.35; c.lineWidth = m * 0.002; const hz = h * 0.68;
    for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(w / 2 + i * w * 0.02, hz); c.lineTo(w / 2 + i * w * 0.2, h); c.stroke(); }
    for (let i = 1; i < 12; i++) { const y = hz + (h - hz) * Math.pow(i / 12, 2); c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.restore();
    const sun = c.createLinearGradient(0, h * 0.2, 0, h * 0.66); sun.addColorStop(0, acc); sun.addColorStop(1, bg2);
    c.fillStyle = sun; c.beginPath(); c.arc(w / 2, h * 0.5, m * 0.2, Math.PI, 0); c.fill();
    c.fillStyle = bg1; for (let i = 0; i < 5; i++) c.fillRect(w / 2 - m * 0.2, h * 0.5 - m * (0.03 + i * 0.035), m * 0.4, m * 0.008 + i * m * 0.002);
    ty = h * 0.78; tcol = ink; c.shadowColor = acc; c.shadowBlur = m * 0.03;
  } else if (style === "wash") {
    if (!photo) { c.fillStyle = bg1; c.fillRect(0, 0, w, h);
      c.filter = `blur(${Math.round(m * 0.08)}px)`;
      for (let i = 0; i < 6; i++) { c.fillStyle = [bg2, acc, ink, bg2, acc, bg1][i]; c.globalAlpha = 0.75; c.beginPath(); c.arc(r() * w, r() * h, m * (0.2 + r() * 0.3), 0, Math.PI * 2); c.fill(); }
      c.filter = "none"; c.globalAlpha = 1; }
    align = "left"; tx = w * 0.08; ty = h * 0.8; tcol = "#fff"; c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = m * 0.02; maxW = w * 0.84;
  } else if (style === "minimal") {
    if (!photo) { c.fillStyle = bg1; c.fillRect(0, 0, w, h); c.fillStyle = acc; c.beginPath(); c.arc(w * (0.35 + r() * 0.3), h * (0.3 + r() * 0.15), m * 0.16, 0, Math.PI * 2); c.fill(); }
    align = "left"; tx = w * 0.08; ty = h * 0.84; tcol = photo ? "#fff" : ink; maxW = w * 0.84;
  } else if (style === "vinyl") {
    if (!photo) { c.fillStyle = bg2; c.fillRect(0, 0, w, h); }
    const cx = w / 2, cy = tall ? h * 0.36 : h * 0.37, R = m * (wide ? 0.24 : 0.27); c.fillStyle = "#0d0d0d"; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = m * 0.0015; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(cx, cy, R * (0.4 + i * 0.015), 0, Math.PI * 2); c.stroke(); }
    const sheen = c.createConicGradient ? c.createConicGradient(0.6, cx, cy) : null;
    if (sheen) { sheen.addColorStop(0, "rgba(255,255,255,0)"); sheen.addColorStop(0.08, "rgba(255,255,255,.12)"); sheen.addColorStop(0.16, "rgba(255,255,255,0)"); sheen.addColorStop(0.58, "rgba(255,255,255,0)"); sheen.addColorStop(0.66, "rgba(255,255,255,.12)"); sheen.addColorStop(0.74, "rgba(255,255,255,0)"); c.fillStyle = sheen; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = acc; c.beginPath(); c.arc(cx, cy, R * 0.33, 0, Math.PI * 2); c.fill(); c.fillStyle = bg2; c.beginPath(); c.arc(cx, cy, R * 0.03, 0, Math.PI * 2); c.fill();
    ty = h * 0.86; tcol = ink;
  } else if (style === "hand") {
    if (!photo) { c.fillStyle = bg1; c.fillRect(0, 0, w, h);
      c.strokeStyle = acc; c.lineCap = "round"; c.lineWidth = m * 0.012;
      for (let i = 0; i < 9; i++) { c.globalAlpha = 0.25 + r() * 0.3; c.beginPath(); const x = r() * w, y = r() * h; c.moveTo(x, y); c.bezierCurveTo(x + (r() - 0.5) * m * 0.6, y + (r() - 0.5) * m * 0.6, x + (r() - 0.5) * m * 0.6, y + (r() - 0.5) * m * 0.6, x + (r() - 0.5) * m * 0.5, y + (r() - 0.5) * m * 0.5); c.stroke(); }
      c.globalAlpha = 1; }
    ty = h * 0.5; tcol = ink; c.save(); c.translate(w / 2, h / 2); c.rotate(-0.06); c.translate(-w / 2, -h / 2);
  }
  // grain
  c.save(); c.globalAlpha = 0.06; const gr = rnd(seed + 7);
  for (let i = 0; i < 1800; i++) { c.fillStyle = gr() > 0.5 ? "#fff" : "#000"; c.fillRect(gr() * w, gr() * h, m * 0.002, m * 0.002); }
  c.restore();
  // title + artist
  const f = fit(c, title, st.font, maxW, m * (wide ? 0.2 : 0.15), m * 0.04, tall ? 5 : 4), lh = f.s * (style === "neon" || style === "vinyl" ? 0.95 : 1.1);
  c.textAlign = align; c.textBaseline = "alphabetic"; c.fillStyle = tcol;
  const n = f.lines.length, base = (style === "wash" || style === "minimal" || style === "vinyl" || style === "neon") ? ty - (n - 1) * lh : ty - ((n - 1) * lh) / 2 + f.s * 0.35;
  f.lines.forEach((l, i) => c.fillText(l, tx, base + i * lh));
  c.shadowBlur = 0;
  if (artist) {
    c.font = `${style === "gold" ? "400 " : ""}${Math.round(m * (wide ? 0.05 : 0.042))}px ${style === "gold" ? "'EG Cinzel', serif" : "'EG Mono', monospace"}`;
    c.fillStyle = style === "gold" ? ink : tcol; c.globalAlpha = 0.85;
    const ay = style === "wash" || style === "minimal" ? base - f.s * 0.95 - (tall ? m * 0.02 : 0) : base + (n - 1) * lh + m * 0.075;
    if ("letterSpacing" in c) c.letterSpacing = `${Math.round(m * 0.006)}px`;
    c.fillText(artist, tx, ay); if ("letterSpacing" in c) c.letterSpacing = "0px";
  }
  c.restore(); if (style === "hand") c.restore();
}
function draw() {
  const box = 1000, k = box / Math.max(W, H);
  cv.width = Math.round(W * k); cv.height = Math.round(H * k);
  cover(g, cv.width, cv.height);
}
$("save").onclick = async () => {
  await fontsReady;
  const off = document.createElement("canvas"); off.width = W; off.height = H; cover(off.getContext("2d"), W, H);
  off.toBlob((b) => {
    const a = document.createElement("a"), name = ($("title").value || "cover").trim().replace(/[\\/:*?"<>|]+/g, "").slice(0, 60) || "cover";
    a.href = URL.createObjectURL(b); a.download = `${name} cover ${W}x${H}.jpg`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $("status").textContent = `Saved at ${W}×${H}.`;
    try { window.va?.("event", { name: "cover", data: { style } }); } catch (e) {}
  }, "image/jpeg", 0.92);
};
draw();
fontsReady.then(draw);
