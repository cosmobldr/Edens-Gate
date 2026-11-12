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

export function mandala(seed) {
  const R = rng(seed * 7919 + 1), cx = W / 2, cy = 525, n = pick(R, [8, 10, 12, 16]), out = [];
  let r = 26; out.push(`<circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.45).toFixed(1)}"/>`);
  const maxr = 378;
  while (r < maxr - 20) {
    const kind = pick(R, ["petal", "petal", "dots", "scallop", "zig", "leaf2", "arch"]);
    const band = r < 200 ? uni(R, 34, 60) : uni(R, 40, 70), r2 = Math.min(maxr, r + band);
    const k = r > 120 ? n * pick(R, [1, 1, 2]) : n, off = pick(R, [0, PI / k]);
    if (kind === "petal") {
      for (let i = 0; i < k; i++) { const a = off + i * 2 * PI / k; out.push(petal(cx, cy, r, r2, a, PI / k * 0.95)); if (band > 42) out.push(petal(cx, cy, r + band * 0.18, r2 - band * 0.28, a, PI / k * 0.45)); }
    } else if (kind === "leaf2") {
      for (let i = 0; i < k; i++) { const a = off + i * 2 * PI / k; out.push(petal(cx, cy, r, r2, a - PI / k * 0.35, PI / k * 0.4), petal(cx, cy, r, r2, a + PI / k * 0.35, PI / k * 0.4)); }
    } else if (kind === "dots") {
      const rr = (r2 - r) / 2, m = Math.max(k, Math.floor(2 * PI * (r + rr) / (rr * 2.3)));
      for (let i = 0; i < m; i++) { const [x, y] = pol(cx, cy, r + rr, off + i * 2 * PI / m); out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr * 0.75).toFixed(1)}"/>`); if (rr > 14) out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr * 0.32).toFixed(1)}"/>`); }
    } else if (kind === "scallop") {
      const m = k * 2; let d = "";
      for (let i = 0; i < m; i++) { const a0 = off + i * 2 * PI / m, a1 = a0 + 2 * PI / m, am = (a0 + a1) / 2; const [x0, y0] = pol(cx, cy, r, a0), [x1, y1] = pol(cx, cy, r, a1), c = pol(cx, cy, r2 + (r2 - r) * 0.4, am); d += (i === 0 ? `M${P(x0, y0)} ` : "") + `Q${P(...c)} ${P(x1, y1)} `; }
      out.push(`<path d="${d}Z"/>`);
      for (let i = 0; i < m; i++) { const am = off + (i + 0.5) * 2 * PI / m, [x, y] = pol(cx, cy, r + (r2 - r) * 0.45, am); out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${((r2 - r) * 0.18).toFixed(1)}"/>`); }
    } else if (kind === "zig") {
      const m = k * 2, pts = []; for (let i = 0; i < m * 2; i++) pts.push(pol(cx, cy, i % 2 === 0 ? r2 : r, off + i * PI / m));
      out.push(`<path d="M${pts.map((p) => P(...p)).join(" L")}Z"/>`);
    } else {
      for (let i = 0; i < k; i++) {
        const a0 = off + i * 2 * PI / k, a1 = a0 + 2 * PI / k, am = (a0 + a1) / 2;
        const [x0, y0] = pol(cx, cy, r, a0 + 0.02), [x1, y1] = pol(cx, cy, r, a1 - 0.02), top = pol(cx, cy, r2, am), c0 = pol(cx, cy, r2, a0 + 0.05), c1 = pol(cx, cy, r2, a1 - 0.05);
        out.push(`<path d="M${P(x0, y0)} C${P(...c0)} ${P(...top)} ${P(...top)} C${P(...top)} ${P(...c1)} ${P(x1, y1)}"/>`, petal(cx, cy, r + (r2 - r) * 0.15, r + (r2 - r) * 0.75, am, PI / k * 0.35));
      }
    }
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r2.toFixed(1)}"/>`); r = r2;
  }
  for (const [x, y] of [[70, 70], [W - 70, 70], [70, H - 130], [W - 70, H - 130]]) { for (let i = 0; i < 6; i++) out.push(petal(x, y, 6, 46, i * PI / 3, 0.45)); out.push(`<circle cx="${x}" cy="${y}" r="7"/>`); }
  return wrap(out.join(""), `Mandala No. ${seed}`);
}

function flower(x, y, s, R) {
  const rot = uni(R, 0, 6.28), o = [];
  for (let i = 0; i < 5; i++) {
    const a = rot + i * 2 * PI / 5, cl = pol(x, y, s * 1.15, a - 0.55), cr = pol(x, y, s * 1.15, a + 0.55), notch = pol(x, y, s * 0.82, a);
    o.push(`<path d="M${P(x, y)} C${P(...pol(x, y, s * 0.5, a - 0.9))} ${P(...cl)} ${P(...pol(x, y, s, a - 0.12))} L${P(...notch)} L${P(...pol(x, y, s, a + 0.12))} C${P(...cr)} ${P(...pol(x, y, s * 0.5, a + 0.9))} ${P(x, y)}Z"/>`);
  }
  o.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(s * 0.18).toFixed(1)}"/>`);
  for (let i = 0; i < 5; i++) { const [xx, yy] = pol(x, y, s * 0.38, rot + (i + 0.5) * 2 * PI / 5); o.push(`<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="${(s * 0.05).toFixed(1)}" fill="#111"/>`); }
  return o.join("");
}
export function sakura(seed) {
  const R = rng(seed * 104729 + 3), segs = [], blossoms = [];
  const branch = (x, y, a, length, width, depth) => {
    const pts = [[x, y]]; let cur = a;
    for (let i = 0; i < 4; i++) { cur += uni(R, -0.18, 0.18); x += length / 4 * Math.cos(cur); y += length / 4 * Math.sin(cur); pts.push([x, y]); }
    segs.push([pts, width]);
    if (depth === 0 || width < 5) { blossoms.push([x, y]); return; }
    const kids = pick(R, [2, 2, 3]);
    for (let k = 0; k < kids; k++) { const [bx, by] = pts[pick(R, [2, 3, 4])]; branch(bx, by, cur + (R() < 0.5 ? -1 : 1) * uni(R, 0.35, 0.85), length * uni(R, 0.55, 0.75), width * 0.62, depth - 1); }
    if (R() < 0.7) blossoms.push(pts[2]);
  };
  const fromLeft = R() < 0.5;
  branch(fromLeft ? 28 : W - 28, uni(R, 760, 900), fromLeft ? -0.62 + uni(R, -0.12, 0.12) : PI + 0.62 + uni(R, -0.12, 0.12), 420, 30, 4);
  const path = (pts) => "M" + pts.map((p) => P(...p)).join(" L");
  let lim = segs.map(([p, w]) => `<path d="${path(p)}" stroke-width="${(w + SW * 2).toFixed(1)}"/>`).join("");
  lim += segs.map(([p, w]) => `<path d="${path(p)}" stroke="#fff" stroke-width="${w.toFixed(1)}"/>`).join("");
  const pts = [];
  for (const [x, y] of blossoms) for (let k = 0, n = pick(R, [2, 3, 3]); k < n; k++) {
    const px = x + uni(R, -45, 45), py = y + uni(R, -45, 45), s = uni(R, 24, 38);
    if (px > 60 && px < W - 60 && py > 70 && py < H - 130 && pts.every(([qx, qy, qs]) => (px - qx) ** 2 + (py - qy) ** 2 > (s + qs) ** 2 * 0.85)) pts.push([px, py, s]);
  }
  let fl = pts.map(([x, y, s]) => `<g fill="#fff">${flower(x, y, s, R)}</g>`).join("");
  for (let i = 0; i < 16; i++) { const x = uni(R, 70, W - 70), y = uni(R, 90, H - 150), a = uni(R, 0, 6.28); if (pts.every(([qx, qy, qs]) => (x - qx) ** 2 + (y - qy) ** 2 > (qs + 34) ** 2)) fl += `<g fill="#fff">${petal(x, y, 0, 26, a, 0.5)}</g>`; }
  const id = `c${seed}`;
  return wrap(`<clipPath id="${id}"><rect x="28" y="28" width="${W - 56}" height="${H - 104}" rx="18"/></clipPath><g clip-path="url(#${id})">${lim}${fl}</g><rect x="28" y="28" width="${W - 56}" height="${H - 104}" rx="18"/>`, `Sakura No. ${seed}`);
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

export function stars(seed) {   // a night sky: crescent moon, stars, planets and a few clouds
  const R = rng(seed * 2654435761 + 11), o = [], placed = [];
  const free = (x, y, r) => placed.every(([a, b, c]) => (x - a) ** 2 + (y - b) ** 2 > (r + c + 10) ** 2);
  const mx = uni(R, 220, 630), my = uni(R, 200, 360), mr = uni(R, 110, 150);
  o.push(`<path d="M${P(mx, my - mr)} A${mr},${mr} 0 1 0 ${P(mx, my + mr)} A${mr * 0.55},${mr} 0 1 1 ${P(mx, my - mr)}Z"/>`); placed.push([mx, my, mr]);
  for (let i = 0; i < 3; i++) { const r = uni(R, 34, 58), x = uni(R, 70 + r * 1.8, W - 70 - r * 1.8), y = uni(R, 480, 830); if (!free(x, y, r + 30)) continue; placed.push([x, y, r + 30]);
    o.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 1.8).toFixed(1)}" ry="${(r * 0.45).toFixed(1)}" transform="rotate(${uni(R, -25, 25).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`); }
  for (let tries = 0; tries < 500 && placed.length < 28; tries++) {
    const r = uni(R, 24, 52), x = uni(R, 70, W - 70), y = uni(R, 70, H - 150); if (!free(x, y, r)) continue; placed.push([x, y, r]);
    const pts = []; for (let k = 0; k < 10; k++) pts.push(pol(x, y, k % 2 ? r * 0.45 : r, -PI / 2 + k * PI / 5));
    o.push(`<path d="M${pts.map((p) => P(...p)).join(" L")}Z"/>`);
  }
  for (let i = 0; i < 2; i++) { const x = uni(R, 160, W - 260), y = uni(R, 880, 930); let d = `M${P(x, y)}`; for (let k = 0; k < 4; k++) d += ` a${30 + k * 6},${28 + k * 4} 0 0 1 ${55 + k * 5},0`; o.push(`<path d="${d} L${P(x, y)}Z"/>`); }
  return wrap(o.join(""), `Night Sky No. ${seed}`);
}

export const STYLES = {
  mandala: { name: "Mandalas", fn: mandala, blurb: "Calm, detailed, great for grown-ups" },
  sakura: { name: "Cherry Blossoms", fn: sakura, blurb: "Branches full of flowers" },
  stars: { name: "Night Sky", fn: stars, blurb: "Moons, stars and planets, big shapes for little hands" },
  tiles: { name: "Maze Tiles", fn: tiles, blurb: "Bold curvy paths, quick to color" },
};
