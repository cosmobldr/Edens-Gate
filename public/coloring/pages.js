// Coloring page designs, drawn by code. Each style + number always gives the same page.
// US Letter: 850 x 1100 units = 8.5 x 11 in.
export const W = 850, H = 1100, SW = 3.2;
const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const uni = (R, a, b) => a + (b - a) * R();
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
const P = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
const pol = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const PI = Math.PI;

function wrap(body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="8.5in" height="11in"><rect width="${W}" height="${H}" fill="#fff"/>` +
    `<g fill="none" stroke="#111" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round">${body}</g>` +
    `<text x="${W / 2}" y="${H - 34}" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="#666">${title} · Eden's Gate · edensgate.art · free to print and share</text></svg>`;
}
function petal(cx, cy, r0, r1, a, w) {
  const [x0, y0] = pol(cx, cy, r0, a), [x1, y1] = pol(cx, cy, r1, a);
  const c1 = pol(cx, cy, r0 + (r1 - r0) * 0.55, a - w), c2 = pol(cx, cy, r0 + (r1 - r0) * 0.55, a + w);
  return `<path d="M${P(x0, y0)} Q${P(...c1)} ${P(x1, y1)} Q${P(...c2)} ${P(x0, y0)}Z"/>`;
}

function star(cx, cy, r, inner, pts, rot = -PI / 2) {
  const p = []; for (let k = 0; k < pts * 2; k++) p.push(pol(cx, cy, k % 2 ? r * inner : r, rot + k * PI / pts));
  return `<path d="M${p.map((q) => P(...q)).join(" L")}Z"/>`;
}
function heart(cx, cy, s, a) {
  const pt = (x, y) => { const c = Math.cos(a), si = Math.sin(a); return P(cx + x * c - y * si, cy + x * si + y * c); };
  return `<path d="M${pt(0, s * 0.35)} C${pt(-s * 0.9, -s * 0.2)} ${pt(-s * 0.45, -s * 0.95)} ${pt(0, -s * 0.45)} C${pt(s * 0.45, -s * 0.95)} ${pt(s * 0.9, -s * 0.2)} ${pt(0, s * 0.35)}Z"/>`;
}
const RINGS = ["petal", "petal", "leaf2", "dots", "scallop", "zig", "arch", "lattice", "teardots", "rays", "waves", "hearts", "triangles", "beads", "lotus", "pinwheel", "stars"];

export function mandala(seed) {
  const R = rng(seed * 7919 + 1), cx = W / 2, cy = 525, n = pick(R, [6, 8, 8, 10, 12, 12, 16, 18, 24]), out = [];
  // centre
  let r = 26;
  const centre = pick(R, ["circle", "flower", "star", "eye"]);
  if (centre === "circle") out.push(`<circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.45).toFixed(1)}"/>`);
  else if (centre === "flower") { r = 38; for (let i = 0; i < 6; i++) out.push(petal(cx, cy, 8, r, i * PI / 3, 0.5)); out.push(`<circle cx="${cx}" cy="${cy}" r="9"/><circle cx="${cx}" cy="${cy}" r="${r}"/>`); }
  else if (centre === "star") { r = 40; out.push(star(cx, cy, r, 0.45, pick(R, [5, 6, 8])), `<circle cx="${cx}" cy="${cy}" r="10"/>`, `<circle cx="${cx}" cy="${cy}" r="${r + 6}"/>`); r += 6; }
  else { r = 34; out.push(`<circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="20"/><circle cx="${cx}" cy="${cy}" r="8"/>`); }
  const maxr = 372; let last = "";
  while (r < maxr - 22) {
    let kind; do kind = pick(R, RINGS); while (kind === last && R() < 0.85); last = kind;
    const band = r < 200 ? uni(R, 34, 60) : uni(R, 40, 72), r2 = Math.min(maxr, r + band);
    const k = r > 200 ? n * (n <= 12 ? pick(R, [1, 1, 2]) : 1) : r > 120 ? n : Math.min(n, r < 80 ? 8 : 12), off = pick(R, [0, PI / k]), step = 2 * PI / k, bw = r2 - r;
    switch (kind) {
      case "petal": for (let i = 0; i < k; i++) { const a = off + i * step; out.push(petal(cx, cy, r, r2, a, PI / k * 0.95)); if (band > 42) out.push(petal(cx, cy, r + bw * 0.18, r2 - bw * 0.28, a, PI / k * 0.45)); } break;
      case "leaf2": for (let i = 0; i < k; i++) { const a = off + i * step; out.push(petal(cx, cy, r, r2, a - PI / k * 0.35, PI / k * 0.4), petal(cx, cy, r, r2, a + PI / k * 0.35, PI / k * 0.4)); } break;
      case "dots": { const rr = bw / 2, m = Math.max(k, Math.floor(2 * PI * (r + rr) / (rr * 2.3)));
        for (let i = 0; i < m; i++) { const [x, y] = pol(cx, cy, r + rr, off + i * 2 * PI / m); out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr * 0.75).toFixed(1)}"/>`); if (rr > 14) out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr * 0.32).toFixed(1)}"/>`); } break; }
      case "beads": { const rr = bw / 2, m = Math.max(k, Math.floor(2 * PI * (r + rr) / (rr * 1.9))) & ~1;
        for (let i = 0; i < m; i++) { const [x, y] = pol(cx, cy, r + rr, off + i * 2 * PI / m); out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr * (i % 2 ? 0.4 : 0.8)).toFixed(1)}"/>`); } break; }
      case "scallop": { const m = k * 2; let d = "";
        for (let i = 0; i < m; i++) { const a0 = off + i * 2 * PI / m, a1 = a0 + 2 * PI / m, am = (a0 + a1) / 2; const [x0, y0] = pol(cx, cy, r, a0), [x1, y1] = pol(cx, cy, r, a1), c = pol(cx, cy, r2 + bw * 0.4, am); d += (i === 0 ? `M${P(x0, y0)} ` : "") + `Q${P(...c)} ${P(x1, y1)} `; }
        out.push(`<path d="${d}Z"/>`);
        for (let i = 0; i < m; i++) { const [x, y] = pol(cx, cy, r + bw * 0.45, off + (i + 0.5) * 2 * PI / m); out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(bw * 0.18).toFixed(1)}"/>`); } break; }
      case "zig": { const m = k * 2, pts = []; for (let i = 0; i < m * 2; i++) pts.push(pol(cx, cy, i % 2 === 0 ? r2 : r, off + i * PI / m)); out.push(`<path d="M${pts.map((q) => P(...q)).join(" L")}Z"/>`); break; }
      case "lattice": { const m = k * 2, A = [], B = [];
        for (let i = 0; i < m * 2; i++) { const a = off + i * PI / m; A.push(pol(cx, cy, i % 2 === 0 ? r2 : r, a)); B.push(pol(cx, cy, i % 2 === 0 ? r : r2, a)); }
        out.push(`<path d="M${A.map((q) => P(...q)).join(" L")}Z"/>`, `<path d="M${B.map((q) => P(...q)).join(" L")}Z"/>`); break; }
      case "teardots": for (let i = 0; i < k; i++) { const a = off + i * step; out.push(petal(cx, cy, r, r2 - bw * 0.22, a, PI / k * 0.6)); const [x, y] = pol(cx, cy, r2 - bw * 0.1, a); out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.min(bw * 0.12, PI * r2 / k * 0.35).toFixed(1)}"/>`); } break;
      case "rays": for (let i = 0; i < k * 2; i++) { const a = off + i * step / 2, long = i % 2 === 0; out.push(petal(cx, cy, r, long ? r2 : r + bw * 0.6, a, PI / k * (long ? 0.28 : 0.2))); } break;
      case "waves": { const m = k * 2; for (const [lo, hi] of [[r + bw * 0.1, r + bw * 0.55], [r + bw * 0.45, r2 - bw * 0.05]]) {
        const pts = []; for (let i = 0; i <= 360; i++) { const a = off + i / 360 * 2 * PI; pts.push(pol(cx, cy, (lo + hi) / 2 + (hi - lo) / 2 * Math.sin(a * m), a)); }
        out.push(`<path d="M${pts.map((q) => P(...q)).join(" L")}Z"/>`); } break; }
      case "hearts": for (let i = 0; i < k; i++) { const a = off + i * step, [x, y] = pol(cx, cy, (r + r2) / 2, a); out.push(heart(x, y, Math.min(bw * 0.42, PI * (r + r2) / k * 0.42), a + PI / 2)); } break;
      case "triangles": for (let i = 0; i < k; i++) { const a = off + i * step, w2 = PI / k * 0.9;
        const T = (r0, r1, w) => `<path d="M${P(...pol(cx, cy, r0, a - w))} L${P(...pol(cx, cy, r1, a))} L${P(...pol(cx, cy, r0, a + w))}Z"/>`;
        out.push(T(r, r2, w2), T(r + bw * 0.22, r2 - bw * 0.28, w2 * 0.45)); } break;
      case "lotus": for (let i = 0; i < k; i++) { const a = off + i * step; out.push(petal(cx, cy, r, r2, a, PI / k * 1.05), petal(cx, cy, r, r2 - bw * 0.2, a, PI / k * 0.62), petal(cx, cy, r, r2 - bw * 0.42, a, PI / k * 0.25)); } break;
      case "pinwheel": for (let i = 0; i < k; i++) { const a = off + i * step, [x0, y0] = pol(cx, cy, r, a), [x1, y1] = pol(cx, cy, r2, a + step * 0.55), c1 = pol(cx, cy, (r + r2) / 2, a - step * 0.15), c2 = pol(cx, cy, (r + r2) / 2, a + step * 0.75);
        out.push(`<path d="M${P(x0, y0)} Q${P(...c1)} ${P(x1, y1)} Q${P(...c2)} ${P(...pol(cx, cy, r, a + step * 0.5))}Z"/>`); } break;
      case "stars": { const m = Math.max(k, Math.floor(2 * PI * (r + bw / 2) / (bw * 1.15)));
        for (let i = 0; i < m; i++) { const [x, y] = pol(cx, cy, r + bw / 2, off + i * 2 * PI / m); out.push(star(x, y, Math.min(bw * 0.45, PI * (r + bw / 2) / m * 0.9), 0.45, 5, off + i * 2 * PI / m)); } break; }
      default: for (let i = 0; i < k; i++) { // arch
        const a0 = off + i * step, a1 = a0 + step, am = (a0 + a1) / 2;
        const [x0, y0] = pol(cx, cy, r, a0 + 0.02), [x1, y1] = pol(cx, cy, r, a1 - 0.02), top = pol(cx, cy, r2, am), c0 = pol(cx, cy, r2, a0 + 0.05), c1 = pol(cx, cy, r2, a1 - 0.05);
        out.push(`<path d="M${P(x0, y0)} C${P(...c0)} ${P(...top)} ${P(...top)} C${P(...top)} ${P(...c1)} ${P(x1, y1)}"/>`, petal(cx, cy, r + bw * 0.15, r + bw * 0.75, am, PI / k * 0.35)); }
    }
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r2.toFixed(1)}"/>`); r = r2;
  }
  // page frame
  const frame = pick(R, ["corners", "corners", "border", "square", "sky", "halo"]);
  if (frame === "corners") for (const [x, y] of [[70, 70], [W - 70, 70], [70, H - 130], [W - 70, H - 130]]) { for (let i = 0; i < 6; i++) out.push(petal(x, y, 6, 46, i * PI / 3, 0.45)); out.push(`<circle cx="${x}" cy="${y}" r="7"/>`); }
  else if (frame === "border") { out.push(`<rect x="34" y="34" width="${W - 68}" height="${H - 116}" rx="22"/>`); for (const [x, y] of [[34, 34], [W - 34, 34], [34, H - 82], [W - 34, H - 82]]) out.push(`<circle cx="${x}" cy="${y}" r="16" fill="#fff"/>`); }
  else if (frame === "square") { out.push(`<rect x="30" y="30" width="${W - 60}" height="${H - 108}"/>`, `<rect x="44" y="44" width="${W - 88}" height="${H - 136}"/>`); }
  else if (frame === "sky") { const S2 = rng(seed); for (const [x, y] of [[90, 110], [W - 95, 140], [110, H - 180], [W - 100, H - 200], [W / 2, 95], [180, 300], [W - 170, 760]]) { const sx = x + uni(S2, -20, 20), sy = y + uni(S2, -20, 20), sr = uni(S2, 18, 30); if (Math.hypot(sx - cx, sy - cy) > maxr + sr + 30) out.push(star(sx, sy, sr, 0.45, 5)); } }
  else { out.push(`<circle cx="${cx}" cy="${cy}" r="${maxr + 22}"/>`); const m = 48; for (let i = 0; i < m; i++) { const [x, y] = pol(cx, cy, maxr + 38, i * 2 * PI / m); out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/>`); } }
  return wrap(out.join(""), `Mandala No. ${seed}`);
}

export function tiles(seed) {
  const R = rng(seed * 15485863 + 7), s = pick(R, [85, 85, 106]), cols = Math.floor((W - 60) / s), rows = Math.floor((H - 120) / s), x0 = (W - cols * s) / 2, y0 = 40, o = [];
  o.push(`<rect x="${x0}" y="${y0}" width="${cols * s}" height="${rows * s}"/>`);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = x0 + i * s, y = y0 + j * s, h = s / 2;
    o.push(R() < 0.5
      ? `<path d="M${x + h},${y} A${h},${h} 0 0 1 ${x},${y + h} M${x + s},${y + h} A${h},${h} 0 0 0 ${x + h},${y + s}"/>`
      : `<path d="M${x + h},${y} A${h},${h} 0 0 0 ${x + s},${y + h} M${x},${y + h} A${h},${h} 0 0 1 ${x + h},${y + s}"/>`);
  }
  return wrap(o.join(""), `Maze Tiles No. ${seed}`);
}

// ---------- stained glass: Voronoi panes with thick "lead" lines ----------
function clipHalf(poly, ax, ay, bx, by) {   // keep the side of the perpendicular bisector closer to a
  const mx = (ax + bx) / 2, my = (ay + by) / 2, nx = bx - ax, ny = by - ay, out = [];
  const side = ([x, y]) => (x - mx) * nx + (y - my) * ny;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], sp = side(p), sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
function voronoi(sites, box) {
  return sites.map(([ax, ay], i) => { let poly = box.slice(); sites.forEach(([bx, by], j) => { if (i !== j && poly.length) poly = clipHalf(poly, ax, ay, bx, by); }); return poly; });
}
const centroid = (poly) => { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; };
function inset(poly, d) { const [cx, cy] = centroid(poly); return poly.map(([x, y]) => { const dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy) || 1, k = Math.max(0, (L - d) / L); return [cx + dx * k, cy + dy * k]; }); }
export function glass(seed) {
  const R = rng(seed * 48271 + 5), x0 = 50, y0 = 50, x1 = W - 50, y1 = H - 130;
  const mode = pick(R, ["rose", "rose", "scatter", "arch"]), arch = mode === "arch", box = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const rcx = W / 2, rcy = (y0 + y1) / 2, RR = Math.min(x1 - x0, y1 - y0) / 2 - 20;
  let sites;
  if (mode === "rose") {
    const sym = pick(R, [8, 10, 12]), rings = [[0.24, sym], [0.5, sym * 2], [0.78, sym * 2]], tw = pick(R, [0, 0.5]);
    sites = [[rcx, rcy]];
    rings.forEach(([f, m], ri) => { for (let i = 0; i < m; i++) sites.push(pol(rcx, rcy, RR * f, (i + (ri % 2 ? tw : 0)) * 2 * PI / m)); });
    for (let i = 0; i < 16; i++) sites.push(pol(rcx, rcy, RR * 1.35, i * 2 * PI / 16));
    for (const [x, y] of [[x0 + 40, y0 + 40], [x1 - 40, y0 + 40], [x0 + 40, y1 - 40], [x1 - 40, y1 - 40]]) sites.push([x, y]);
  } else {
    sites = Array.from({ length: Math.floor(uni(R, 38, 70)) }, () => [uni(R, x0, x1), uni(R, y0, y1)]);
    for (let it = 0; it < 3; it++) sites = voronoi(sites, box).map((c, i) => (c.length ? centroid(c) : sites[i]));   // relax for even panes
  }
  const cells = voronoi(sites, box), o = [];
  const id = `g${seed}`, shape = arch
    ? `M${x0},${y1} L${x0},${y0 + 200} A${(x1 - x0) / 2},${200} 0 0 1 ${x1},${y0 + 200} L${x1},${y1}Z`
    : `M${x0},${y0} H${x1} V${y1} H${x0}Z`;
  o.push(`<clipPath id="${id}"><path d="${shape}"/></clipPath><g clip-path="url(#${id})" stroke-width="7">`);
  for (const c of cells) if (c.length > 2) {
    o.push(`<path d="M${c.map((p) => P(...p)).join(" L")}Z"/>`);
    const a = c.reduce((s, p, i) => { const q = c[(i + 1) % c.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
    if (Math.abs(a) > 9000 && R() < 0.35) { const ins = inset(c, 22); o.push(`<path stroke-width="3.2" d="M${ins.map((p) => P(...p)).join(" L")}Z"/>`); }
  }
  if (mode === "rose") o.push(`<circle cx="${rcx}" cy="${rcy}" r="${(RR * 1.06).toFixed(1)}" stroke-width="10"/>`);
  o.push(`</g><path d="${shape}" stroke-width="12"/>`);
  return wrap(o.join(""), `Stained Glass No. ${seed}`);
}

// ---------- star tiles: interlocking 8-point stars and crosses (Moroccan / Islamic style) ----------
export function startiles(seed) {
  // 8-point stars whose side tips touch their neighbours; the gaps between four stars become small squares (khatam pattern)
  const R = rng(seed * 69621 + 9), s = pick(R, [130, 150, 170, 200]), o = [];
  const cols = Math.ceil((W - 80) / s) + 2, rows = Math.ceil((H - 160) / s) + 2, ox = W / 2 - Math.floor(cols / 2) * s, oy = (H - 80) / 2 - Math.floor(rows / 2) * s;
  const id = `t${seed}`, inner = pick(R, [0.72, 0.76, 0.8]), fill = pick(R, ["ring", "petals", "star", "rosette"]), half = s * 0.2071 / Math.SQRT2;
  o.push(`<clipPath id="${id}"><rect x="40" y="40" width="${W - 80}" height="${H - 160}"/></clipPath><g clip-path="url(#${id})">`);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const cx = ox + i * s, cy = oy + j * s, r = s / 2;
    o.push(star(cx, cy, r, inner, 8, 0));
    if (fill === "ring") o.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * inner * 0.7).toFixed(1)}"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.12).toFixed(1)}"/>`);
    else if (fill === "petals") { for (let k = 0; k < 8; k++) o.push(petal(cx, cy, r * 0.1, r * inner * 0.92, k * PI / 4 + PI / 8, 0.24)); o.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.1).toFixed(1)}"/>`); }
    else if (fill === "star") o.push(star(cx, cy, r * inner * 0.8, 0.55, 8, PI / 8), `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.14).toFixed(1)}"/>`);
    else { o.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * inner * 0.75).toFixed(1)}"/>`); for (let k = 0; k < 8; k++) { const [x, y] = pol(cx, cy, r * inner * 0.45, k * PI / 4); o.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * inner * 0.22).toFixed(1)}"/>`); } }
    // the gap between four stars: a small square whose corners meet the stars' diagonal tips
    const gx = cx + s / 2, gy = cy + s / 2;
    o.push(`<rect x="${(gx - half).toFixed(1)}" y="${(gy - half).toFixed(1)}" width="${(half * 2).toFixed(1)}" height="${(half * 2).toFixed(1)}"/>`);
  }
  o.push(`</g><rect x="40" y="40" width="${W - 80}" height="${H - 160}" stroke-width="6"/>`);
  return wrap(o.join(""), `Star Tiles No. ${seed}`);
}

export const STYLES = {
  mandala: { name: "Mandalas", fn: mandala, blurb: "Calm, detailed, great for grown-ups. 17 ring patterns, every number different" },
  glass: { name: "Stained Glass", fn: glass, blurb: "Bold panes like a church window. Big shapes, easy for any age" },
  startiles: { name: "Star Tiles", fn: startiles, blurb: "Interlocking stars like Moroccan tilework" },
  tiles: { name: "Maze Tiles", fn: tiles, blurb: "Bold curvy paths, quick to color" },
};
