import { audioCtx, modeButton } from "/tools/audio.js?v=1";
modeButton();
const $ = (id) => document.getElementById(id);
const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

// ---------- tuner: autocorrelation pitch detection on the mic signal ----------
let stream = null, analyser = null, raf = 0, smooth = null;
function detect(buf, fs) {
  let rms = 0; for (const v of buf) rms += v * v; rms = Math.sqrt(rms / buf.length); if (rms < 0.01) return -1;
  const n = buf.length, half = Math.floor(n / 2), d = new Float32Array(half);
  for (let tau = 1; tau < half; tau++) { let s = 0; for (let i = 0; i < half; i++) { const x = buf[i] - buf[i + tau]; s += x * x; } d[tau] = s; }
  // cumulative mean normalised difference (YIN)
  let run = 0; d[0] = 1; for (let tau = 1; tau < half; tau++) { run += d[tau]; d[tau] = d[tau] * tau / (run || 1); }
  const minTau = Math.floor(fs / 1500), maxTau = Math.min(half - 1, Math.floor(fs / 40));
  let tau = -1; for (let t = minTau; t < maxTau; t++) if (d[t] < 0.12) { while (t + 1 < maxTau && d[t + 1] < d[t]) t++; tau = t; break; }
  if (tau < 0) return -1;
  const a = d[tau - 1], b = d[tau], c = d[tau + 1], shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return fs / (tau + (isFinite(shift) ? shift : 0));
}
function loop() {
  const buf = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(buf);
  const f = detect(buf, analyser.context.sampleRate);
  if (f > 0) {
    smooth = smooth ? smooth * 0.75 + f * 0.25 : f;
    const ref = +$("ref").value || 440, midi = 69 + 12 * Math.log2(smooth / ref), near = Math.round(midi), cents = Math.round((midi - near) * 100);
    $("note").textContent = NAMES[((near % 12) + 12) % 12] + (Math.floor(near / 12) - 1);
    $("hz").textContent = `${smooth.toFixed(1)} Hz · ${cents > 0 ? "+" : ""}${cents} cents`;
    $("needle2").style.left = `${50 + Math.max(-50, Math.min(50, cents))}%`;
    const ok = Math.abs(cents) <= 5; $("note").classList.toggle("in", ok);
    $("say").textContent = ok ? "In tune ✓" : cents < 0 ? "A little low: tighten / raise it" : "A little high: loosen / lower it";
  }
  raf = requestAnimationFrame(loop);
}
$("mic").onclick = async () => {
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; cancelAnimationFrame(raf); $("mic").textContent = "🎤 Start tuner"; $("say").textContent = "Press Start and play one note."; return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (e) { $("say").textContent = "The tuner needs microphone permission. Allow it in your browser and try again."; return; }
  const ctx = audioCtx(); await ctx.resume();
  analyser = ctx.createAnalyser(); analyser.fftSize = 4096; ctx.createMediaStreamSource(stream).connect(analyser);
  $("mic").textContent = "■ Stop tuner"; $("say").textContent = "Listening… play one note."; smooth = null; loop();
};

// ---------- metronome: Web Audio clicks scheduled a little ahead, so timing stays tight ----------
let on = false, next = 0, beat = 0, timer = 0;
const bpm = () => +$("bpm").value, per = () => +$("per").value;
function dots() { $("dots").innerHTML = Array.from({ length: per() }, (_, i) => `<i class="${i === 0 ? "one" : ""}"></i>`).join(""); }
function click(t, accent) {
  const ctx = audioCtx(), o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = accent ? 1600 : 1000; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.5, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.07);
}
function schedule() {
  const ctx = audioCtx();
  while (next < ctx.currentTime + 0.12) {
    const b = beat; click(next, b === 0);
    setTimeout(() => { const ds = $("dots").children; for (let i = 0; i < ds.length; i++) ds[i].classList.toggle("lit", i === b); }, Math.max(0, (next - ctx.currentTime) * 1000));
    next += 60 / bpm(); beat = (beat + 1) % per();
  }
}
$("metro").onclick = async () => {
  on = !on; $("metro").textContent = on ? "■ Stop" : "▶ Start";
  if (on) { const ctx = audioCtx(); await ctx.resume(); next = ctx.currentTime + 0.05; beat = 0; timer = setInterval(schedule, 25); schedule(); }
  else { clearInterval(timer); [...$("dots").children].forEach((d) => d.classList.remove("lit")); }
};
const setBpm = (v) => { $("bpm").value = Math.max(30, Math.min(240, Math.round(v))); $("bpmv").textContent = $("bpm").value; };
$("bpm").oninput = () => setBpm(bpm());
$("minus").onclick = () => setBpm(bpm() - 1); $("plus").onclick = () => setBpm(bpm() + 1);
$("per").onchange = () => { beat = 0; dots(); };
let taps = [];
$("tap").onclick = () => {
  const now = performance.now(); taps = taps.filter((t) => now - t < 2500); taps.push(now);
  if (taps.length >= 2) { const gaps = taps.slice(1).map((t, i) => t - taps[i]); setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length)); }
};
dots();
