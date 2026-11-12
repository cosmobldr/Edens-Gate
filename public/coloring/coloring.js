import { STYLES } from "/coloring/pages.js?v=6";
import { modeButton } from "/tools/audio.js?v=1";
modeButton();
const $ = (id) => document.getElementById(id);
const p = new URLSearchParams(location.search);
let style = STYLES[p.get("s")] ? p.get("s") : "mandala", no = Math.max(1, Math.min(99999, parseInt(p.get("n")) || 1));

for (const [k, v] of Object.entries(STYLES)) {
  const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = v.name; b.dataset.s = k;
  b.onclick = () => { style = k; no = 1; show(); }; $("styles").append(b);
}
function show() {
  document.querySelectorAll("#styles .chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s === style)));
  $("blurb").textContent = STYLES[style].blurb;
  $("sheet").innerHTML = STYLES[style].fn(no);
  $("no").value = no;
  const u = new URL(location.href); u.searchParams.set("s", style); u.searchParams.set("n", no); history.replaceState(null, "", u);
  $("thumbs").innerHTML = "";
  for (let i = 1; i <= 8; i++) {
    const n = no + i, li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", `${STYLES[style].name} number ${n}`); b.innerHTML = STYLES[style].fn(n);
    const cap = document.createElement("span"); cap.textContent = `No. ${n}`; b.append(cap);
    b.onclick = () => { no = n; show(); scrollTo({ top: $("sheet").getBoundingClientRect().top + scrollY - 20, behavior: "smooth" }); };
    li.append(b); $("thumbs").append(li);
  }
}
$("prev").onclick = () => { no = Math.max(1, no - 1); show(); };
$("next").onclick = () => { no = Math.min(99999, no + 1); show(); };
$("rand").onclick = () => { no = 1 + Math.floor(Math.random() * 9999); show(); };
$("no").onchange = (e) => { no = Math.max(1, Math.min(99999, parseInt(e.target.value) || 1)); show(); };
addEventListener("keydown", (e) => { if (e.target.tagName === "INPUT") return; if (e.key === "ArrowRight") $("next").click(); if (e.key === "ArrowLeft") $("prev").click(); });

function printPages(nums) {
  $("print-area").innerHTML = nums.map((n) => `<div class="print-page">${STYLES[style].fn(n)}</div>`).join("");
  try { window.va?.("event", { name: "coloring-print", data: { style, pages: nums.length } }); } catch (e) {}
  setTimeout(() => print(), 50);
}
$("print1").onclick = () => printPages([no]);
$("print10").onclick = () => printPages(Array.from({ length: 10 }, (_, i) => no + i));
addEventListener("afterprint", () => ($("print-area").innerHTML = ""));

const save = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const fname = (ext) => `${STYLES[style].name.toLowerCase().replace(/\s+/g, "-")}-${no}-edensgate.${ext}`;
$("svg").onclick = () => save(new Blob([STYLES[style].fn(no)], { type: "image/svg+xml" }), fname("svg"));
$("png").onclick = () => {
  const svg = STYLES[style].fn(no).replace('width="8.5in" height="11in"', 'width="2550" height="3300"');   // 300 dpi
  const img = new Image(); img.onload = () => {
    const c = document.createElement("canvas"); c.width = 2550; c.height = 3300; const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((b) => save(b, fname("png")), "image/png");
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
};
show();
