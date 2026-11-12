import { modeButton } from "/tools/audio.js?v=1";
modeButton();
// channel packs from the vault
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const zipUrl = (c) => `https://archive.org/compress/${c.ia}/formats=VBR%20MP3&file=/${encodeURIComponent(c.ia)}.zip`;
(async () => {
  const ul = document.getElementById("packs");
  try {
    const d = await (await fetch("/library.json")).json();
    ul.innerHTML = d.channels.filter((c) => c.tracks.length).map((c) =>
      `<li><a href="${zipUrl(c)}"><span>${esc(c.name)}</span><small>${c.tracks.length} songs · zip</small></a></li>`).join("");
  } catch (e) { ul.innerHTML = `<li class="status">Couldn't load the channel list. <a href="/">Browse the vault</a> instead.</li>`; }
})();
// view the printed cases in 3D
let mv = null;
document.querySelectorAll(".view3d").forEach((b) => b.addEventListener("click", async () => {
  const fig = b.closest(".case"), media = fig.querySelector("img");
  b.textContent = "Loading…"; b.disabled = true;
  self.ModelViewerElement ||= { meshoptDecoderLocation: "/tools/vendor/meshopt_decoder.js" };
  try { await (mv ||= import("/tools/vendor/model-viewer.min.js")); } catch (e) { b.textContent = "3D view unavailable"; return; }
  const v = document.createElement("model-viewer");
  v.setAttribute("src", b.dataset.glb); v.setAttribute("camera-controls", ""); v.setAttribute("auto-rotate", "");
  v.setAttribute("shadow-intensity", "1"); v.setAttribute("touch-action", "pan-y"); v.setAttribute("camera-orbit", "25deg 75deg auto");
  v.setAttribute("alt", media.alt); v.className = "case-3d";
  v.addEventListener("load", () => { b.remove(); });
  v.addEventListener("error", () => { b.textContent = "3D view unavailable"; });
  media.replaceWith(v);
}));
