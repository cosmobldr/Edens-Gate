// Shared audio helpers for the Eden's Gate tools. Everything runs in this browser tab; nothing is uploaded.
let ctx = null;
export function audioCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  try { ctx = new AC({ sampleRate: 44100 }); } catch (e) { ctx = new AC(); }
  return ctx;
}
export async function decode(bytes) {
  const c = audioCtx();
  return await new Promise((ok, bad) => {
    const p = c.decodeAudioData(bytes, ok, bad);
    if (p && p.then) p.then(ok, bad);
  });
}
// Cut [start, end) seconds out of an AudioBuffer, with optional fades. Returns plain Float32Arrays per channel.
export function cut(buf, start = 0, end = buf.duration, fadeIn = 0, fadeOut = 0, mono = false) {
  const sr = buf.sampleRate, a = Math.max(0, Math.floor(start * sr)), b = Math.min(buf.length, Math.ceil(end * sr)), n = Math.max(0, b - a);
  let chans = [];
  for (let c = 0; c < Math.min(2, buf.numberOfChannels); c++) chans.push(buf.getChannelData(c).slice(a, b));
  if (mono && chans.length === 2) { const m = new Float32Array(n); for (let i = 0; i < n; i++) m[i] = (chans[0][i] + chans[1][i]) / 2; chans = [m]; }
  const fi = Math.min(n, Math.floor(fadeIn * sr)), fo = Math.min(n, Math.floor(fadeOut * sr));
  for (const d of chans) {
    for (let i = 0; i < fi; i++) d[i] *= Math.pow(i / fi, 2);
    for (let i = 0; i < fo; i++) d[n - 1 - i] *= Math.pow(i / fo, 2);
  }
  return { channels: chans, sampleRate: sr };
}
export function toWav({ channels, sampleRate }) {
  const ch = channels.length, n = channels[0].length, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); out.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, sampleRate, true); out.setUint32(28, sampleRate * ch * 2, true);
  out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, "data"); out.setUint32(40, n * ch * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, channels[c][i])); out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Uint8Array(out.buffer);
}
export function toMp3({ channels, sampleRate }, kbps = 192, onProgress = () => {}) {
  return new Promise((ok, bad) => {
    const wk = new Worker("/tools/vendor/mp3-worker.js");
    wk.onmessage = ({ data }) => { if (data.done) { wk.terminate(); ok(data.done); } else onProgress(data.progress); };
    wk.onerror = (e) => { wk.terminate(); bad(e); };
    wk.postMessage({ channels, sampleRate, kbps });
  });
}
export const fmtTime = (s, tenths = false) => {
  s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60;
  return `${m}:${tenths ? r.toFixed(1).padStart(4, "0") : String(Math.floor(r)).padStart(2, "0")}`;
};
export const parseTime = (v) => {
  const p = String(v).trim().split(":").map(Number); if (p.some(isNaN)) return NaN;
  return p.length === 1 ? p[0] : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2];
};
export const mb = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
export function saveLink(a, bytes, name, type) {
  if (a.href.startsWith("blob:")) URL.revokeObjectURL(a.href);
  a.href = URL.createObjectURL(new Blob([bytes], { type })); a.download = name;
}
// Wire a drop zone + hidden file input to a callback.
export function dropZone(zone, input, onFiles) {
  input.onchange = () => input.files.length && onFiles([...input.files]);
  ["dragenter", "dragover"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove("over"); }));
  zone.addEventListener("drop", (e) => e.dataTransfer.files.length && onFiles([...e.dataTransfer.files]));
  zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  addEventListener("dragover", (e) => e.preventDefault()); addEventListener("drop", (e) => e.preventDefault());
}
export function modeButton() {
  const b = document.getElementById("mode"), r = document.documentElement; if (!b) return;
  const s = () => (b.textContent = r.dataset.theme === "day" ? "☾" : "☀"); s();
  b.onclick = () => { r.dataset.theme = r.dataset.theme === "day" ? "night" : "day"; s(); try { localStorage.setItem("egMode", r.dataset.theme); } catch (e) {} };
}
