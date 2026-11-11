import { audioCtx, decode, cut, toWav, toMp3, fmtTime, parseTime, mb, saveLink, dropZone, modeButton } from "/tools/audio.js?v=1";
modeButton();
const $ = (id) => document.getElementById(id);
const cv = $("wave"), g = cv.getContext("2d");
let buf = null, name = "song", a = 0, b = 0, peaks = null, src = null, playStart = 0, raf = 0, head = -1;
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function setName(n) { name = n.replace(/\.[a-z0-9]{2,4}$/i, ""); $("name").textContent = n; }
async function load(bytes, label) {
  stop(); $("status").textContent = "Opening…";
  try { buf = await decode(bytes); } catch (e) {
    $("status").textContent = "That file couldn't be opened as audio. Try an MP3, WAV or M4A."; return;
  }
  setName(label); a = 0; b = Math.min(buf.duration, 30);
  $("drop").hidden = true; $("work").hidden = false; $("status").textContent = ""; $("save").hidden = true; $("status2").textContent = "";
  peaks = null; draw(); sync();
}
dropZone($("drop"), $("file"), async (files) => { const f = files[0]; load(await f.arrayBuffer(), f.name); });

// open a song straight from the vault: /tools/trim/?ia=<item>&f=<file>
(async () => {
  const p = new URLSearchParams(location.search), ia = p.get("ia"), f = p.get("f");
  if (!ia || !f || !/^[A-Za-z0-9._-]+$/.test(ia)) return;
  $("status").textContent = `Fetching “${p.get("t") || f}” from the vault…`;
  try {
    const r = await fetch(`https://archive.org/download/${ia}/${encodeURIComponent(f)}`); if (!r.ok) throw 0;
    await load(await r.arrayBuffer(), f);
  } catch (e) { $("status").textContent = "Couldn't fetch that song just now. Download it from the vault, then drop it here."; }
})();

function draw() {
  const w = cv.clientWidth, h = 160, dpr = devicePixelRatio || 1;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); peaks = null; }
  cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!peaks) {
    peaks = new Float32Array(w); const d0 = buf.getChannelData(0), d1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : d0, step = buf.length / w;
    for (let x = 0; x < w; x++) { let m = 0; const s = Math.floor(x * step), e = Math.floor((x + 1) * step);
      for (let i = s; i < e; i += 16) { const v = Math.max(Math.abs(d0[i]), Math.abs(d1[i])); if (v > m) m = v; } peaks[x] = m; }
  }
  g.clearRect(0, 0, w, h);
  const xa = (a / buf.duration) * w, xb = (b / buf.duration) * w;
  g.fillStyle = css("--moss"); g.fillRect(0, 0, w, h);
  g.fillStyle = css("--card"); g.fillRect(xa, 0, xb - xa, h);
  for (let x = 0; x < w; x++) { const v = peaks[x] * (h / 2 - 8); g.fillStyle = x >= xa && x <= xb ? css("--lamplight") : css("--line"); g.fillRect(x, h / 2 - v, 1, v * 2 || 1); }
  g.fillStyle = css("--iron");
  for (const x of [xa, xb]) { g.fillRect(x - 1.5, 0, 3, h); g.beginPath(); g.arc(x, h - 12, 9, 0, Math.PI * 2); g.fill(); }
  if (head >= 0) { g.fillStyle = css("--mist"); g.fillRect((head / buf.duration) * w - 1, 0, 2, h); }
}
function sync() {
  $("start").value = fmtTime(a, true); $("end").value = fmtTime(b, true);
  $("len").textContent = `${(b - a).toFixed(1)} s clip`;
  draw();
}
addEventListener("resize", () => buf && draw());

let drag = null;
const toSec = (e) => { const r = cv.getBoundingClientRect(); return Math.max(0, Math.min(buf.duration, ((e.clientX - r.left) / r.width) * buf.duration)); };
cv.addEventListener("pointerdown", (e) => {
  if (!buf) return; const t = toSec(e);
  drag = Math.abs(t - a) <= Math.abs(t - b) ? "a" : "b"; cv.setPointerCapture(e.pointerId); move(e);
});
cv.addEventListener("pointermove", (e) => drag && move(e));
cv.addEventListener("pointerup", () => (drag = null));
function move(e) {
  const t = toSec(e);
  if (drag === "a") a = Math.min(t, b - 0.2); else b = Math.max(t, a + 0.2);
  stop(); sync();
}
for (const [id, set] of [["start", (v) => (a = Math.max(0, Math.min(v, b - 0.2)))], ["end", (v) => (b = Math.min(buf.duration, Math.max(v, a + 0.2)))]])
  $(id).addEventListener("change", (e) => { const v = parseTime(e.target.value); if (!isNaN(v)) set(v); stop(); sync(); });
document.querySelectorAll(".quick button").forEach((btn) => btn.onclick = () => {
  const n = +btn.dataset.len; if (!buf) return;
  if (!n) { a = 0; b = buf.duration; } else { b = Math.min(buf.duration, a + n); if (b - a < n) a = Math.max(0, b - n); }
  stop(); sync();
});

function stop() {
  if (src) { try { src.stop(); } catch (e) {} src = null; }
  cancelAnimationFrame(raf); head = -1; $("play").textContent = "▶ Preview"; if (buf) draw();
}
$("play").onclick = () => {
  if (src) return stop();
  const c = audioCtx(); c.resume();
  const fin = +$("fin").value, fout = +$("fout").value, dur = b - a, gain = c.createGain(), now = c.currentTime + 0.05;
  gain.gain.setValueAtTime(fin ? 0 : 1, now); if (fin) gain.gain.linearRampToValueAtTime(1, now + Math.min(fin, dur));
  if (fout) { gain.gain.setValueAtTime(1, now + Math.max(0, dur - fout)); gain.gain.linearRampToValueAtTime(0, now + dur); }
  src = c.createBufferSource(); src.buffer = buf; src.connect(gain).connect(c.destination);
  src.start(now, a, dur); playStart = now; $("play").textContent = "■ Stop";
  src.onended = () => stop();
  const tick = () => { head = a + (c.currentTime - playStart); draw(); raf = requestAnimationFrame(tick); }; tick();
};

$("run").onclick = async () => {
  stop(); $("run").disabled = true; $("save").hidden = true;
  const clip = cut(buf, a, b, +$("fin").value, +$("fout").value), f = $("fmt").value;
  try {
    let out, ext, type;
    if (f === "wav") { out = toWav(clip); ext = "wav"; type = "audio/wav"; }
    else { out = await toMp3(clip, f === "mp3-320" ? 320 : 192, (p) => ($("status2").textContent = `Making your clip… ${Math.round(p * 100)}%`)); ext = "mp3"; type = "audio/mpeg"; }
    const nm = (t) => { t = Math.round(t); return `${Math.floor(t / 60)}m${String(t % 60).padStart(2, "0")}s`; };
    const file = `${name} (${nm(a)}-${nm(b)}).${ext}`;
    saveLink($("save"), out, file, type); $("save").textContent = `Download (${mb(out.byteLength)})`; $("save").hidden = false;
    $("status2").textContent = `Ready: ${(b - a).toFixed(1)} seconds.`;
    try { window.va?.("event", { name: "trim", data: { secs: Math.round(b - a) } }); } catch (e) {}
  } catch (e) { $("status2").textContent = "Something went wrong making the clip. Try WAV, or a shorter part."; }
  $("run").disabled = false;
};
$("again").onclick = () => { stop(); buf = null; $("work").hidden = true; $("drop").hidden = false; $("file").value = ""; history.replaceState(null, "", location.pathname); };
