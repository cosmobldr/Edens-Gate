// Song Check analysis: loudness (ITU-R BS.1770 / EBU R128 integrated LUFS), peak, tempo and key.
// Pure functions on Float32Array channels so they can run anywhere.

function biquad(x, b0, b1, b2, a0, a1, a2) {
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
function kWeight(x, fs) {
  // stage 1: high shelf (+4 dB above ~1.7 kHz); stage 2: high pass at ~38 Hz. Same constants as BS.1770 / pyloudnorm.
  let G = 3.999843853973347, Q = 0.7071752369554196, fc = 1681.974450955533;
  let A = Math.pow(10, G / 40), w = 2 * Math.PI * fc / fs, c = Math.cos(w), al = Math.sin(w) / (2 * Q), sA = Math.sqrt(A);
  let y = biquad(x, A * ((A + 1) + (A - 1) * c + 2 * sA * al), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - 2 * sA * al),
    (A + 1) - (A - 1) * c + 2 * sA * al, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - 2 * sA * al);
  Q = 0.5003270373238773; fc = 38.13547087602444; w = 2 * Math.PI * fc / fs; c = Math.cos(w); al = Math.sin(w) / (2 * Q);
  return biquad(y, (1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al);
}
export function loudness(channels, fs) {
  const k = channels.slice(0, 2).map((ch) => kWeight(ch, fs)), n = k[0].length;
  const blk = Math.round(0.4 * fs), hop = Math.round(0.1 * fs), z = [];
  for (let s = 0; s + blk <= n; s += hop) {
    let sum = 0;
    for (const ch of k) { let m = 0; for (let i = s; i < s + blk; i++) m += ch[i] * ch[i]; sum += m / blk; }
    z.push(sum);
  }
  const L = (v) => -0.691 + 10 * Math.log10(v);
  const abs = z.filter((v) => L(v) > -70); if (!abs.length) return -Infinity;
  const rel = L(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const g = abs.filter((v) => L(v) > rel);
  return L(g.reduce((a, b) => a + b, 0) / g.length);
}
export function peakDb(channels) {
  let p = 0; for (const ch of channels) for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > p) p = a; }
  return 20 * Math.log10(p || 1e-9);
}

// ---- tempo: onset strength, then autocorrelation over 60-200 BPM
function mono(channels, from, to) {
  const n = to - from, m = new Float32Array(n);
  for (const ch of channels) for (let i = 0; i < n; i++) m[i] += ch[from + i] / channels.length;
  return m;
}
export function tempo(channels, fs) {
  const len = channels[0].length, from = Math.min(Math.floor(len * 0.15), Math.max(0, len - fs * 60)), to = Math.min(len, from + fs * 90);
  const x = mono(channels, from, to), hop = 512, frame = 1024, env = [];
  let prev = 0;
  for (let s = 0; s + frame <= x.length; s += hop) {
    let e = 0; for (let i = s; i < s + frame; i++) e += x[i] * x[i];
    e = Math.log(1e-9 + e); env.push(Math.max(0, e - prev)); prev = e;
  }
  const mean = env.reduce((a, b) => a + b, 0) / env.length; for (let i = 0; i < env.length; i++) env[i] -= mean;
  const rate = fs / hop; let best = 0, bestBpm = 0; const scores = [];
  for (let bpm = 60; bpm <= 200; bpm += 0.5) {
    const lag = rate * 60 / bpm, l0 = Math.floor(lag), fr = lag - l0; let s = 0;
    for (let i = 0; i + l0 + 1 < env.length; i++) s += env[i] * (env[i + l0] * (1 - fr) + env[i + l0 + 1] * fr);
    const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / 1.0, 2));   // gentle preference for common tempos
    scores.push([bpm, s * w]); if (s * w > best) { best = s * w; bestBpm = bpm; }
  }
  return Math.round(bestBpm);
}

// ---- key: chroma from FFT frames, matched to Krumhansl-Kessler major/minor profiles
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) { const a = i + j, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
const NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const CAMELOT_MAJ = ["8B", "3B", "10B", "5B", "12B", "7B", "2B", "9B", "4B", "11B", "6B", "1B"];
const CAMELOT_MIN = ["5A", "12A", "7A", "2A", "9A", "4A", "11A", "6A", "1A", "8A", "3A", "10A"];
function corr(a, b) { const ma = a.reduce((s, v) => s + v, 0) / 12, mb = b.reduce((s, v) => s + v, 0) / 12; let n = 0, da = 0, db = 0; for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db || 1); }
export function key(channels, fs) {
  const N = 8192, chroma = new Float64Array(12), len = channels[0].length, step = Math.max(N, Math.floor(fs * 0.5));
  const win = new Float32Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
  const kmin = Math.ceil(55 * N / fs), kmax = Math.floor(2000 * N / fs), pc = new Int8Array(kmax + 1);
  for (let k = kmin; k <= kmax; k++) pc[k] = ((Math.round(12 * Math.log2(k * fs / N / 440)) % 12) + 12 + 9) % 12;   // A = 9
  for (let s = 0; s + N <= len; s += step) {
    const re = new Float32Array(N), im = new Float32Array(N);
    for (let i = 0; i < N; i++) { let v = 0; for (const ch of channels) v += ch[s + i]; re[i] = v * win[i]; }
    fft(re, im);
    for (let k = kmin; k <= kmax; k++) chroma[pc[k]] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
  }
  let best = { r: -2 }, second = -2;
  for (let t = 0; t < 12; t++) for (const [prof, mode] of [[MAJ, "major"], [MIN, "minor"]]) {
    const rot = Array.from({ length: 12 }, (_, i) => prof[(i - t + 12) % 12]), r = corr(Array.from(chroma), rot);
    if (r > best.r) { second = best.r; best = { r, tonic: t, mode }; } else if (r > second) second = r;
  }
  return { name: `${NAMES[best.tonic]} ${best.mode}`, camelot: best.mode === "major" ? CAMELOT_MAJ[best.tonic] : CAMELOT_MIN[best.tonic], confidence: best.r - second };
}
