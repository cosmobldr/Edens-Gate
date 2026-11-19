// Free 3D models (The Open Asset Forge). Data: /models.json, built from archive.org by scripts/sync_models.py
const $ = (id) => document.getElementById(id);
const PAGE = 60;
const MV = "/tools/vendor/model-viewer.min.js";
const dl = (m, ext) => `https://archive.org/download/${m.i}/${encodeURIComponent(m.f + ext)}`;
// the 3D view fetches the file from the page, which archive.org only allows through its /cors/ address
const cors = (m, ext) => `https://archive.org/cors/${m.i}/${encodeURIComponent(m.f + ext)}`;
const mb = (b) => (b >= 1e6 ? (b / 1e6).toFixed(b >= 1e7 ? 0 : 1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ");

let all = [], every = [], shown = [], drawn = 0, cat = "", q = "";
// Colour variants share a name before the comma ("Spray paint can, teal"): they show as one card with swatches.
const base = (n) => n.split(", ")[0];
const label = (m) => (m.n.includes(", ") ? m.n.slice(m.n.indexOf(", ") + 2) : "original");

// day / night, shared with the main Eden's Gate page
$("mode").textContent = document.documentElement.dataset.theme === "day" ? "☾" : "☀";
$("mode").onclick = () => {
  const m = document.documentElement.dataset.theme === "day" ? "night" : "day";
  document.documentElement.dataset.theme = m; $("mode").textContent = m === "day" ? "☾" : "☀";
  try { localStorage.setItem("egMode", m); } catch (e) {}
};

function card(m) {
  const li = document.createElement("li"); li.className = "card";
  const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", `${m.n}, ${m.c}`);
  const img = document.createElement("img"); img.loading = "lazy"; img.decoding = "async"; img.width = 360; img.height = 360;
  img.alt = ""; img.src = `/models/t/${m.id}.webp`;
  const meta = document.createElement("div"); meta.className = "meta";
  const n = document.createElement("div"); n.className = "n"; n.textContent = m._g ? base(m.n) : m.n;
  const s = document.createElement("div"); s.className = "s";
  s.append(m._g ? `${m._g.length} colors` : m.id, Object.assign(document.createElement("span"), { className: "sz", textContent: ` · GLB ${mb(m.g)}` }));
  meta.append(n, s); b.append(img, meta); li.append(b);
  b.onclick = () => open(m);
  return li;
}

function draw(reset) {
  if (reset) { $("grid").textContent = ""; drawn = 0; window.scrollY > 600 && $("cats").scrollIntoView({ block: "start" }); }
  const frag = document.createDocumentFragment();
  for (const m of shown.slice(drawn, drawn + PAGE)) frag.append(card(m));
  drawn = Math.min(shown.length, drawn + PAGE);
  $("grid").append(frag);
  const withColors = shown.reduce((n, m) => n + (m._g ? m._g.length : 1), 0);
  $("status").textContent = shown.length
    ? `${shown.length.toLocaleString()} model${shown.length === 1 ? "" : "s"}${withColors > shown.length ? ` · ${withColors.toLocaleString()} including colors` : ""}${q ? ` matching “${q}”` : ""}${cat ? ` in ${cat}` : ""}`
    : "";
  if (!shown.length) {
    const li = document.createElement("li"); li.className = "empty";
    li.textContent = all.length ? "Nothing matches that yet. Try another word." : "The first models are on their way. Check back soon.";
    $("grid").append(li);
  }
}

function filter() {
  const words = norm(q).split(/\s+/).filter(Boolean);
  shown = all.filter((m) => (!cat || m.c === cat) && words.every((w) => m._s.includes(w)));
  draw(true);
  const u = new URL(location.href);
  cat ? u.searchParams.set("c", cat) : u.searchParams.delete("c");
  q ? u.searchParams.set("q", q) : u.searchParams.delete("q");
  history.replaceState(null, "", u);
}

function cats(list) {
  const ul = $("cats"); ul.textContent = "";
  const mk = (name, count, colors) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-pressed", String(cat === name));
    b.append(name || "Everything"); const s = document.createElement("small");
    s.textContent = count.toLocaleString() + (colors > count ? ` · ${colors.toLocaleString()}` : "");
    if (colors > count) b.title = `${count.toLocaleString()} models, ${colors.toLocaleString()} including colors`;
    b.append(s);
    b.onclick = () => { cat = name; cats(list); filter(); };
    li.append(b); ul.append(li);
  };
  mk("", all.length, every.length);
  for (const c of list) mk(c.name, c.count, c.colors);
}

// ---- model view
let current = null;
function open(m, push = true, swap = false) {
  current = m;
  $("v-cat").textContent = m.c; $("v-name").textContent = m.n; $("v-id").textContent = m.id;
  $("v-img").src = dl(m, ".jpg"); $("v-img").alt = `Preview of ${m.n}`; $("v-img").hidden = false;
  $("v-3d").hidden = true; $("v-3d").textContent = ""; $("v-spin").hidden = false; $("v-spin").textContent = "View in 3D";
  $("v-glb").href = dl(m, ".glb"); $("v-glb-s").textContent = mb(m.g);
  $("v-blend").href = dl(m, ".blend"); $("v-blend-s").textContent = mb(m.b);
  const vc = $("v-colors"), sw = vc.querySelector(".v-sw");
  vc.hidden = !m._g;
  if (m._g) {
    vc.querySelector(".v-colors-t").innerHTML = "";
    vc.querySelector(".v-colors-t").append(`${m._g.length} colors · `, Object.assign(document.createElement("b"), { textContent: label(m) }));
    if (sw.dataset.group !== base(m.n) + m.c) {
      sw.textContent = ""; sw.dataset.group = base(m.n) + m.c;
      for (const v of m._g) {
        const b = document.createElement("button"); b.type = "button"; b.title = label(v); b.setAttribute("aria-label", label(v)); b.dataset.id = v.id;
        const im = document.createElement("img"); im.src = `/models/t/${v.id}.webp`; im.alt = ""; im.loading = "lazy"; b.append(im);
        b.onclick = () => open(v, false, true);
        sw.append(b);
      }
    }
    for (const b of sw.children) b.setAttribute("aria-pressed", String(b.dataset.id === m.id));
  }
  if (!$("view").open) $("view").showModal();
  if (push || swap) { const u = new URL(location.href); u.searchParams.set("m", m.id); history[swap ? "replaceState" : "pushState"]({ m: m.id }, "", u); }
  try { window.va?.("event", { name: "model-open", data: { id: m.id } }); } catch (e) {}
}
function close() {
  if ($("view").open) $("view").close();
}
$("view").addEventListener("close", () => {
  $("v-3d").textContent = ""; current = null;
  const u = new URL(location.href);
  if (u.searchParams.has("m")) { u.searchParams.delete("m"); history.replaceState(null, "", u); }
});
$("v-close").onclick = close;
$("view").addEventListener("click", (e) => { if (e.target === $("view")) close(); });
addEventListener("popstate", () => {
  const id = new URL(location.href).searchParams.get("m");
  const m = id && every.find((x) => x.id === id);
  m ? open(m, false) : close();
});

let mvLoading = null;
$("v-spin").onclick = async () => {
  const m = current; if (!m) return;
  $("v-spin").textContent = m.g > 15e6 ? `Loading (${mb(m.g)})…` : "Loading…";
  try {
    self.ModelViewerElement ||= { meshoptDecoderLocation: "/tools/vendor/meshopt_decoder.js" };
    mvLoading ||= import(MV);
    await mvLoading;
  } catch (e) { $("v-spin").textContent = "3D view unavailable"; return; }
  if (current !== m) return;
  const box = $("v-3d"); box.textContent = "";
  const mv = document.createElement("model-viewer");
  mv.setAttribute("src", cors(m, ".glb")); mv.setAttribute("camera-controls", ""); mv.setAttribute("auto-rotate", "");
  mv.setAttribute("shadow-intensity", "0.8"); mv.setAttribute("exposure", "1"); mv.setAttribute("alt", `3D view of ${m.n}`);
  mv.setAttribute("touch-action", "pan-y"); mv.setAttribute("poster", dl(m, ".jpg"));
  mv.addEventListener("load", () => { $("v-spin").hidden = true; });   // the photo stays underneath: it holds the frame's size
  mv.addEventListener("error", () => {
    const msg = document.createElement("div"); msg.className = "msg"; msg.textContent = "The 3D view couldn't load here, but the download works.";
    box.append(msg); $("v-spin").hidden = true;
  });
  box.append(mv); box.hidden = false;
};

$("v-copy").onclick = async () => {
  const u = new URL(location.origin + "/models/"); u.searchParams.set("m", current.id);
  try { await navigator.clipboard.writeText(u.href); $("v-copy").textContent = "Link copied ✓"; }
  catch (e) { prompt("Copy this link:", u.href); }
  setTimeout(() => ($("v-copy").textContent = "Copy link to this model"), 2000);
};

// ---- search + endless scroll
let t = 0;
$("q").addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { q = $("q").value.trim(); filter(); }, 150); });
new IntersectionObserver((e) => { if (e[0].isIntersecting && drawn < shown.length) draw(false); }, { rootMargin: "800px" }).observe($("more"));

// ---- start
(async () => {
  let data = { categories: [], models: [] };
  try { data = await (await fetch("/models.json", { cache: "no-cache" })).json(); } catch (e) {}
  every = data.models.map((m) => ({ ...m }));
  const groups = new Map();
  for (const m of every) { const k = m.c + "|" + base(m.n); groups.has(k) ? groups.get(k).push(m) : groups.set(k, [m]); }
  all = [];
  for (const g of groups.values()) {
    g.sort((a, b) => (a.n.includes(", ") - b.n.includes(", ")) || a.id.localeCompare(b.id));
    if (g.length > 1) for (const m of g) m._g = g;
    const lead = g[0];
    lead._s = norm(g.map((m) => `${m.n} ${m.id}`).join(" ") + " " + lead.c);
    all.push(lead);
  }
  all.sort((a, b) => a.id.localeCompare(b.id));
  $("count").textContent = every.length
    ? (every.length > all.length ? `Every one of these ${all.length.toLocaleString()} models (${every.length.toLocaleString()} including colors)` : `Every one of these ${every.length.toLocaleString()} models`)
    : "Every model";
  const p = new URL(location.href).searchParams;
  cat = data.categories.some((c) => c.name === p.get("c")) ? p.get("c") : "";
  q = p.get("q") || ""; $("q").value = q;
  const cc = new Map(), cv = new Map();
  for (const m of all) cc.set(m.c, (cc.get(m.c) || 0) + 1);
  for (const m of every) cv.set(m.c, (cv.get(m.c) || 0) + 1);
  cats(data.categories.map((c) => ({ name: c.name, count: cc.get(c.name) || 0, colors: cv.get(c.name) || 0 }))); filter();
  const m = p.get("m") && every.find((x) => x.id === p.get("m"));
  if (m) open(m, false);
})();
