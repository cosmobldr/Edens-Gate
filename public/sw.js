// Eden's Gate offline helper: keeps a copy of the pages you've visited so the vault (and its tools) open with no signal.
// Saved songs live in their own cache ("eg-songs-v1"), filled from the page when you press "Save these to play offline".
const SHELL = "eg-shell-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/", "/library.json", "/favicon.svg"])).catch(() => {})); });
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET" || u.origin !== location.origin) return;           // songs on archive.org are handled by the page
  if (u.pathname.endsWith(".glb") || u.pathname.startsWith("/_vercel") || u.pathname.endsWith(".zip") || u.pathname.endsWith(".pdf")) return;
  e.respondWith(
    fetch(req).then((r) => {
      if (r.ok && r.type === "basic") { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(req).then((m) => m || (req.mode === "navigate" ? caches.match("/") : Response.error())))
  );
});
