// 3D Model Shrinker: everything happens in this browser tab. The file is read from disk, shrunk in memory, and handed back.
import { modeButton } from "/tools/audio.js?v=1"; modeButton();
const $ = (id) => document.getElementById(id);
const mb = (b) => (b >= 1e6 ? (b / 1e6).toFixed(b >= 1e7 ? 1 : 2) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
let lib = null, viewer = null, src = null, name = "model", urls = [];

const loadLib = () => (lib ||= import("/tools/vendor/shrink.js?v=1"));
const loadViewer = () => {
  self.ModelViewerElement ||= { meshoptDecoderLocation: "/tools/vendor/meshopt_decoder.js" };
  return (viewer ||= import("/tools/vendor/model-viewer.min.js"));
};

function show(box, bytes) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "model/gltf-binary" })); urls.push(url);
  box.textContent = "";
  const mv = document.createElement("model-viewer");
  mv.setAttribute("src", url); mv.setAttribute("camera-controls", ""); mv.setAttribute("auto-rotate", "");
  mv.setAttribute("shadow-intensity", "0.7"); mv.setAttribute("touch-action", "pan-y"); mv.setAttribute("alt", "3D preview of your model");
  mv.addEventListener("error", () => { const p = document.createElement("p"); p.className = "wait"; p.textContent = "Couldn't draw a preview of this one."; box.append(p); });
  box.append(mv);
}
function reset() {
  urls.forEach(URL.revokeObjectURL); urls = []; src = null;
  $("work").hidden = true; $("drop").hidden = false; $("file").value = ""; $("status").textContent = "";
}

async function open(file) {
  if (!file) return;
  if (!/\.glb$/i.test(file.name)) { $("drop").querySelector(".drop-small").textContent = "That isn't a .glb file. Export as glTF Binary (.glb) and try again."; return; }
  name = file.name.replace(/\.glb$/i, ""); src = new Uint8Array(await file.arrayBuffer());
  $("drop").hidden = true; $("work").hidden = false; $("save").hidden = true; $("run").hidden = false; $("run").disabled = false;
  $("s-before").textContent = mb(src.byteLength); $("s-after").textContent = "—"; $("facts").textContent = "";
  $("v-after").textContent = ""; const w = document.createElement("p"); w.className = "wait"; w.id = "wait"; w.textContent = "Pick your settings, then press Shrink."; $("v-after").append(w);
  $("status").textContent = "Opening…";
  try {
    await loadViewer(); show($("v-before"), src);
    const { inspect } = await loadLib(); const f = await inspect(src);
    const big = f.textures.reduce((m, t) => Math.max(m, t.size[0], t.size[1]), 0);
    $("facts").textContent = `${f.tris.toLocaleString()} triangles · ${f.materials} material${f.materials === 1 ? "" : "s"} · ${f.textures.length} picture${f.textures.length === 1 ? "" : "s"}${big ? ` (largest ${big} px)` : ""}${f.animations ? ` · ${f.animations} animation${f.animations === 1 ? "" : "s"}` : ""}`;
    $("status").textContent = "";
  } catch (e) {
    $("status").textContent = "This file couldn't be read. It may be damaged, or use a format this tool doesn't handle yet (like Draco).";
    $("run").disabled = true;
  }
}

$("run").onclick = async () => {
  if (!src) return;
  $("run").disabled = true; $("save").hidden = true;
  try {
    const { shrink } = await loadLib();
    const out = await shrink(src, { maxTexture: +$("tex").value, geometry: $("geo").checked }, (s) => ($("status").textContent = s));
    if (out.byteLength >= src.byteLength) {
      $("status").textContent = "This model is already about as small as it gets. Nothing to gain here.";
      $("s-after").textContent = mb(src.byteLength); $("run").disabled = false; return;
    }
    show($("v-after"), out);
    const pct = Math.round((1 - out.byteLength / src.byteLength) * 100);
    $("s-after").textContent = `${mb(out.byteLength)} · ${pct}% smaller`;
    const url = URL.createObjectURL(new Blob([out], { type: "model/gltf-binary" })); urls.push(url);
    $("save").href = url; $("save").download = `${name}-small.glb`; $("save").textContent = `Download (${mb(out.byteLength)})`; $("save").hidden = false;
    $("status").textContent = `Done: ${mb(src.byteLength)} → ${mb(out.byteLength)}. Spin both to compare, then download.`;
    try { window.va?.("event", { name: "shrink", data: { pct } }); } catch (e) {}
  } catch (e) {
    $("status").textContent = "Something went wrong while shrinking this model. Try the “Leave pictures alone” setting, or untick “Pack the shape”.";
  }
  $("run").disabled = false;
};
$("again").onclick = reset;
$("file").onchange = (e) => open(e.target.files[0]);
const drop = $("drop");
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => open(e.dataTransfer.files[0]));
drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("file").click(); } });
addEventListener("dragover", (e) => e.preventDefault()); addEventListener("drop", (e) => e.preventDefault());
