// Free 3D models (The Open Asset Forge). Data: /models.json, built from archive.org by scripts/sync_models.py
const $ = (id) => document.getElementById(id);
const PAGE = 60;
const MV = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.4.0/dist/model-viewer.min.js";
const dl = (m, ext) => `https://archive.org/download/${m.i}/${encodeURIComponent(m.f + ext)}`;
const mb = (b) => (b >= 1e6 ? (b / 1e6).toFixed(b >= 1e7 ? 0 : 1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ");

let all = [], shown = [], drawn = 0, cat = "", q = "";

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
  const n = document.createElement("div"); n.className = "n"; n.textContent = m.n;
  const s = document.createElement("div"); s.className = "s"; s.textContent = `${m.id} · GLB ${mb(m.g)}`;
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
  $("status").textContent = shown.length
    ? `${shown.length.toLocaleString()} model${shown.length === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}${cat ? ` in ${cat}` : ""}`
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
  const mk = (name, count) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-pressed", String(cat === name));
    b.append(name || "Everything"); const s = document.createElement("small"); s.textContent = count.toLocaleString(); b.append(s);
    b.onclick = () => { cat = name; cats(list); filter(); };
    li.append(b); ul.append(li);
  };
  mk("", all.length);
  for (const c of list) mk(c.name, c.count);
}

// ---- model view
let current = null;
function open(m, push = true) {
  current = m;
  $("v-cat").textContent = m.c; $("v-name").textContent = m.n; $("v-id").textContent = m.id;
  $("v-img").src = dl(m, ".jpg"); $("v-img").alt = `Preview of ${m.n}`; $("v-img").hidden = false;
  $("v-3d").hidden = true; $("v-3d").textContent = ""; $("v-spin").hidden = false; $("v-spin").textContent = "View in 3D";
  $("v-glb").href = dl(m, ".glb"); $("v-glb-s").textContent = mb(m.g);
  $("v-blend").href = dl(m, ".blend"); $("v-blend-s").textContent = mb(m.b);
  if (!$("view").open) $("view").showModal();
  if (push) { const u = new URL(location.href); u.searchParams.set("m", m.id); history.pushState({ m: m.id }, "", u); }
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
  const m = id && all.find((x) => x.id === id);
  m ? open(m, false) : close();
});

let mvLoading = null;
$("v-spin").onclick = async () => {
  const m = current; if (!m) return;
  $("v-spin").textContent = m.g > 15e6 ? `Loading (${mb(m.g)})…` : "Loading…";
  try {
    mvLoading ||= import(MV);
    await mvLoading;
  } catch (e) { $("v-spin").textContent = "3D view unavailable"; return; }
  if (current !== m) return;
  const box = $("v-3d"); box.textContent = "";
  const mv = document.createElement("model-viewer");
  mv.setAttribute("src", dl(m, ".glb")); mv.setAttribute("camera-controls", ""); mv.setAttribute("auto-rotate", "");
  mv.setAttribute("shadow-intensity", "0.8"); mv.setAttribute("exposure", "1"); mv.setAttribute("alt", `3D view of ${m.n}`);
  mv.setAttribute("touch-action", "pan-y"); mv.setAttribute("poster", dl(m, ".jpg"));
  mv.addEventListener("load", () => { $("v-spin").hidden = true; $("v-img").hidden = true; });
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
  all = data.models.map((m) => ({ ...m, _s: norm(`${m.n} ${m.c} ${m.id}`) }));
  $("count").textContent = all.length ? `Every one of these ${all.length.toLocaleString()} models` : "Every model";
  const p = new URL(location.href).searchParams;
  cat = data.categories.some((c) => c.name === p.get("c")) ? p.get("c") : "";
  q = p.get("q") || ""; $("q").value = q;
  cats(data.categories); filter();
  const m = p.get("m") && all.find((x) => x.id === p.get("m"));
  if (m) open(m, false);
})();
