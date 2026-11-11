import { dropZone, modeButton } from "/tools/audio.js?v=1";
modeButton();
const $ = (id) => document.getElementById(id);
let rows = [];
const dur = (file) => new Promise((ok) => {
  const a = new Audio(), u = URL.createObjectURL(file); a.preload = "metadata";
  a.onloadedmetadata = () => { URL.revokeObjectURL(u); ok(a.duration); }; a.onerror = () => { URL.revokeObjectURL(u); ok(0); }; a.src = u;
});
function render() {
  const ia = ($("ia").value.trim() || "YOUR-ARCHIVE-ID").replace(/^https?:\/\/archive\.org\/(details|download)\//, "").replace(/\/.*$/, "");
  $("out").value = rows.map((r) => `  ${JSON.stringify([`https://archive.org/download/${ia}/${encodeURIComponent(r.f)}`, r.t, Math.round(r.s)])},`).join("\n");
  const bad = rows.filter((r) => !r.s).length;
  $("count").textContent = `${rows.length} song${rows.length === 1 ? "" : "s"}` + (bad ? ` · ${bad} couldn't be read (length 0): fix those by hand` : "");
  $("out-wrap").hidden = !rows.length;
}
dropZone($("drop"), $("file"), async (files) => {
  for (const f of files) {
    if (rows.some((r) => r.f === f.name)) continue;
    rows.push({ f: f.name, t: f.name.replace(/\.[a-z0-9]{2,4}$/i, "").replace(/_/g, " "), s: await dur(f) });
    render();
  }
  $("file").value = "";
});
$("ia").addEventListener("input", render);
$("copy").onclick = async () => {
  try { await navigator.clipboard.writeText($("out").value); $("copy").textContent = "Copied ✓"; }
  catch (e) { $("out").select(); document.execCommand("copy"); $("copy").textContent = "Copied ✓"; }
  setTimeout(() => ($("copy").textContent = "Copy song list"), 2000);
};
