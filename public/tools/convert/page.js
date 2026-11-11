import { decode, cut, toWav, toMp3, mb, saveLink, dropZone, modeButton } from "/tools/audio.js?v=1";
modeButton();
const $ = (id) => document.getElementById(id);
let fmt = "mp3-192", queue = Promise.resolve();
document.querySelectorAll("#fmts .chip").forEach((b) => (b.onclick = () => {
  fmt = b.dataset.f; document.querySelectorAll("#fmts .chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
}));
dropZone($("drop"), $("file"), (files) => { for (const f of files) add(f); $("file").value = ""; });

function add(file) {
  const li = document.createElement("li"); li.className = "job";
  const n = document.createElement("span"); n.className = "job-n"; n.textContent = file.name;
  const s = document.createElement("span"); s.className = "job-s"; s.textContent = "Waiting…";
  const a = document.createElement("a"); a.className = "btn"; a.hidden = true;
  li.append(n, s, a); $("jobs").append(li);
  const f = fmt, mono = $("mono").checked;
  queue = queue.then(() => run(file, f, mono, s, a));
}
async function run(file, f, mono, s, a) {
  try {
    s.textContent = "Opening…";
    const buf = await decode(await file.arrayBuffer());
    const clip = cut(buf, 0, buf.duration, 0, 0, mono), base = file.name.replace(/\.[a-z0-9]{2,4}$/i, "");
    let out, ext, type;
    if (f === "wav") { s.textContent = "Converting…"; await new Promise((r) => setTimeout(r, 30)); out = toWav(clip); ext = "wav"; type = "audio/wav"; }
    else { out = await toMp3(clip, +f.split("-")[1], (p) => (s.textContent = `Converting… ${Math.round(p * 100)}%`)); ext = "mp3"; type = "audio/mpeg"; }
    saveLink(a, out, `${base}.${ext}`, type); a.textContent = `Download ${ext.toUpperCase()}`; a.hidden = false;
    s.textContent = `${mb(file.size)} → ${mb(out.byteLength)}`;
    try { window.va?.("event", { name: "convert", data: { to: f } }); } catch (e) {}
  } catch (e) { s.textContent = "Couldn't read this file as audio."; }
}
