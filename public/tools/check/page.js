import { decode, dropZone, modeButton, fmtTime } from "/tools/audio.js?v=1";
import { loudness, peakDb, tempo, key } from "/tools/check/analyze.js?v=1";
modeButton();
const $ = (id) => document.getElementById(id);
const tick = () => new Promise((r) => setTimeout(r, 30));
async function run(file) {
  $("status").textContent = "Opening…"; $("out").hidden = true;
  let buf; try { buf = await decode(await file.arrayBuffer()); } catch (e) { $("status").textContent = "That file couldn't be opened as audio."; return; }
  const ch = Array.from({ length: Math.min(2, buf.numberOfChannels) }, (_, i) => buf.getChannelData(i)), fs = buf.sampleRate;
  $("status").textContent = "Measuring loudness…"; await tick(); const L = loudness(ch, fs), pk = peakDb(ch);
  $("status").textContent = "Finding the tempo…"; await tick(); const bpm = tempo(ch, fs);
  $("status").textContent = "Finding the key…"; await tick(); const k = key(ch, fs);
  $("status").textContent = ""; $("drop").hidden = true; $("out").hidden = false; $("name").textContent = file.name;
  $("lufs").textContent = isFinite(L) ? `${L.toFixed(1)} LUFS` : "Silent";
  $("needle").style.left = `${Math.max(0, Math.min(100, (L + 24) / 18 * 100))}%`;
  $("lufs-say").textContent = !isFinite(L) ? "No sound found." :
    L > -11 ? `Loud. Spotify and YouTube will turn this down about ${Math.round(L + 14)} dB, so making it louder won't make it louder for listeners. A gentler master can keep more punch.` :
    L >= -16 ? "Right in the zone for streaming. It'll play at about the same level as everything else." :
    `On the quiet side, about ${Math.round(-14 - L)} dB under Spotify's target. Some apps may turn it up a little; others will just play it quieter.`;
  $("peak").textContent = `${pk.toFixed(1)} dB`;
  $("peak-say").textContent = pk > -1 ? "Very close to the max. Leave about 1 dB of room so it doesn't crackle after streaming sites convert it." : "Good. There's room to spare, so it won't clip when converted.";
  $("bpm").textContent = `${bpm} BPM`;
  $("bpm-say").textContent = `If it feels off, try ${Math.round(bpm / 2)} or ${bpm * 2}.`;
  const sure = k.confidence > 0.02;
  $("key").textContent = sure ? k.name : "Not sure";
  $("key-say").textContent = sure ? `Camelot ${k.camelot}, for DJs mixing in key.` : `Best guess ${k.name} (${k.camelot}), but this song doesn't sit clearly in one key.`;
  $("len").textContent = fmtTime(buf.duration);
  $("len-say").textContent = `${(fs / 1000).toFixed(1)} kHz · ${buf.numberOfChannels === 1 ? "mono" : "stereo"}`;
  try { window.va?.("event", { name: "song-check" }); } catch (e) {}
}
dropZone($("drop"), $("file"), (f) => run(f[0]));
$("again").onclick = () => { $("out").hidden = true; $("drop").hidden = false; $("file").value = ""; };
