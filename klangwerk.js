/* Echo · Klangwerk: a small groove box for classical motifs over techno / bass house / drum & bass.
   - drums on a 16-step grid (tap to toggle), bass follows a genre pattern on the motif's tonic
   - motifs are public-domain compositions re-played from notes (no recordings)
   - WebAudio synthesis only: kick, clap/snare, hats, saw bass, lead; filter, sidechain pump, reverb
   - beats are saved on the device and can be exported as MIDI for FL Studio
   Storage: 'echo-klang' (backed up by Echo). Needs tools-common.js. */
'use strict';
const app = document.getElementById('app');
const N = null;
// [name, composer, tonic (bass MIDI), notes as [midi | null, length in 16ths]]
const MOTIFS = {
  elise: ['Für Elise', 'Beethoven, 1810', 45, [[76, 2], [75, 2], [76, 2], [75, 2], [76, 2], [71, 2], [74, 2], [72, 2], [69, 4], [N, 2], [60, 2], [64, 2], [69, 2], [71, 4], [N, 2], [64, 2], [68, 2], [71, 2], [72, 4], [N, 4]]],
  mond: ['Mondscheinsonate', 'Beethoven, 1801', 37, [56, 61, 64, 56, 61, 64, 56, 61, 64, 56, 61, 64, 56, 61, 64, 56, 57, 61, 64, 57, 61, 64, 57, 61, 64, 57, 61, 64, 57, 61, 64, 57, 57, 62, 66, 57, 62, 66, 57, 62, 66, 57, 62, 66, 57, 62, 66, 57, 56, 60, 66, 56, 60, 66, 56, 60, 66, 56, 60, 63, 56, 60, 63, 56].map(n => [n + 12, 1])],
  toccata: ['Toccata d-Moll', 'Bach, um 1704', 38, [[81, 1], [79, 1], [81, 6], [N, 4], [79, 1], [77, 1], [76, 1], [74, 1], [73, 4], [74, 12], [N, 32]]],
  berg: ['Halle des Bergkönigs', 'Grieg, 1875', 35, [[71, 2], [73, 2], [74, 2], [76, 2], [78, 2], [74, 2], [78, 4], [77, 2], [73, 2], [77, 4], [76, 2], [72, 2], [76, 4], [71, 2], [73, 2], [74, 2], [76, 2], [78, 2], [74, 2], [78, 2], [83, 2], [81, 2], [78, 2], [74, 2], [78, 2], [81, 8]]],
  kanon: ['Kanon in D', 'Pachelbel, um 1690', 38, [78, 76, 74, 73, 71, 69, 71, 73].map(n => [n, 8])],
  freude: ['Ode an die Freude', 'Beethoven, 1824', 36, [[76, 4], [76, 4], [77, 4], [79, 4], [79, 4], [77, 4], [76, 4], [74, 4], [72, 4], [72, 4], [74, 4], [76, 4], [76, 6], [74, 2], [74, 8]]],
};
const GENRES = {
  techno: ['Techno', 130, { kick: '1000100010001000', clap: '0000100000001000', hat: '1010101010101010', open: '0010001000100010' }, [[1, 0, 1], [2, 0, 1], [3, 0, 1], [5, 0, 1], [6, 0, 1], [7, 0, 1], [9, 0, 1], [10, 0, 1], [11, 0, 1], [13, 0, 1], [14, 12, 1], [15, 0, 1]], false],
  house: ['Bass House', 124, { kick: '1000100010001000', clap: '0000100000001000', hat: '1011101110111011', open: '0010001000100010' }, [[0, 0, 2], [3, 0, 1], [6, 12, 1], [8, 0, 2], [11, 3, 1], [14, -2, 2]], false],
  dnb: ['Drum & Bass', 174, { kick: '1000000000100000', clap: '0000100000001000', hat: '1010101010101010', open: '0000000100000000' }, [[0, 0, 6], [10, 0, 3], [14, -2, 2]], true],
};
const ROWS = [['kick', 'Kick'], ['clap', 'Clap'], ['hat', 'Hi-Hat'], ['open', 'Open Hat']];
const DEF = g => ({ genre: g, motif: 'elise', bpm: GENRES[g][1], grid: Object.fromEntries(ROWS.map(([k]) => [k, GENRES[g][2][k].split('').map(Number)])), bass: true, lead: true, slow: GENRES[g][4], oct: 0, cut: 0.8, pump: 0.6, verb: 0.3 });
const K = Object.assign({ cur: DEF('techno'), saved: [], xpDay: '' }, LS.get('echo-klang', {}));
const save = () => { K.updated = Date.now(); LS.set('echo-klang', K); };
const C = () => K.cur;

/* ---------- audio ---------- */
let ac = null, out = null, lp = null, duck = null, rev = null, revGain = null, noise = null, playing = false, step = 0, nextT = 0, tick = null, queue = [];
function initAudio() {
  if (ac) return; ac = new (window.AudioContext || window.webkitAudioContext)();
  out = ac.createGain(); out.gain.value = .8; lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2; duck = ac.createGain();
  rev = ac.createConvolver(); const len = ac.sampleRate * 2.2, ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  rev.buffer = ir; revGain = ac.createGain();
  duck.connect(lp); duck.connect(revGain); revGain.connect(rev); rev.connect(lp); lp.connect(out); out.connect(ac.destination);
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  applyKnobs();
}
function applyKnobs() { if (!ac) return; lp.frequency.setTargetAtTime(120 * Math.pow(150, C().cut), ac.currentTime, .05); revGain.gain.setTargetAtTime(C().verb * .7, ac.currentTime, .05); }
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
function kick(t) {
  const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); env(g, t, .002, 1, .38); o.connect(g).connect(lp); o.start(t); o.stop(t + .45);
  const p = C().pump; if (p > 0) { duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(1 - p * .85, t); duck.gain.linearRampToValueAtTime(1, t + 60 / C().bpm * .9); }
}
function hit(t, f, q, dur, vol, type = 'bandpass') { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q; env(g, t, .001, vol, dur); s.connect(fl).connect(g).connect(lp); s.start(t); s.stop(t + dur + .05); }
function bass(t, m, dur) {
  const g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(160, t + dur);
  [-8, 8].forEach(dt => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + .05); });
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.32, t + .01); g.gain.setValueAtTime(.32, t + dur * .8); g.gain.exponentialRampToValueAtTime(.0001, t + dur); f.connect(g).connect(duck);
}
function lead(t, m, dur) {
  const g = ac.createGain(); [['square', 0], ['sawtooth', 7]].forEach(([ty, dt]) => { const o = ac.createOscillator(); o.type = ty; o.frequency.value = hz(m); o.detune.value = dt; o.connect(g); o.start(t); o.stop(t + dur + .3); });
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09, t + .015); g.gain.setValueAtTime(.09, t + Math.max(.02, dur * .7)); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .25); g.connect(duck);
}
// motif → map of step → [midi, len] over its own loop length (multiple of 16)
function motifMap() {
  const c = C(), mul = c.slow ? 2 : 1, map = {}; let s = 0;
  for (const [n, l] of MOTIFS[c.motif][3]) { if (n != null) map[s] = [n + 12 * c.oct, l * mul]; s += l * mul; }
  return { map, len: Math.ceil(s / 16) * 16 };
}
let MM = null;
function schedule(i, t) {
  const c = C(), s = i % 16, sp = 60 / c.bpm / 4;
  if (c.grid.kick[s]) kick(t);
  if (c.grid.clap[s]) c.genre === 'dnb' ? hit(t, 1800, .8, .18, .7) : hit(t, 1200, 1.2, .14, .8);
  if (c.grid.hat[s]) hit(t, 9000, .7, .04, .25, 'highpass');
  if (c.grid.open[s]) hit(t, 8000, .7, .22, .22, 'highpass');
  if (c.bass) for (const [bs, semi, l] of GENRES[c.genre][3]) if (bs === s) bass(t, MOTIFS[c.motif][2] + semi, l * sp);
  if (c.lead) { const e = MM.map[i % MM.len]; if (e) lead(t, e[0], e[1] * sp * .95); }
  queue.push([i % 16, t]);
}
function loop() { const sp = 60 / C().bpm / 4; while (nextT < ac.currentTime + .12) { schedule(step, nextT); step++; nextT += sp; } }
function play() { initAudio(); ac.resume(); MM = motifMap(); step = 0; nextT = ac.currentTime + .05; queue = []; playing = true; tick = setInterval(loop, 25); requestAnimationFrame(draw); render(); }
function stop() { playing = false; clearInterval(tick); tick = null; render(); }
function draw() {
  if (!playing) { document.querySelectorAll('.st.now').forEach(x => x.classList.remove('now')); return; }
  let cur = null; while (queue.length && queue[0][1] <= ac.currentTime) cur = queue.shift()[0];
  if (cur != null) document.querySelectorAll('.st').forEach(x => x.classList.toggle('now', +x.dataset.s === cur));
  requestAnimationFrame(draw);
}

/* ---------- MIDI export (format 0, 480 ticks per quarter, 4 bars or the motif length) ---------- */
function midi() {
  const c = C(), mm = motifMap(), bars = Math.max(4, mm.len / 16), T = 120, ev = [];
  const add = (st, len, ch, n, v) => { ev.push([st * T, 0x90 | ch, n, v]); ev.push([st * T + Math.max(1, Math.round(len * T)) - 1, 0x80 | ch, n, 0]); };
  for (let b = 0; b < bars; b++) for (let s = 0; s < 16; s++) { const i = b * 16 + s;
    [['kick', 36], ['clap', 39], ['hat', 42], ['open', 46]].forEach(([k, n]) => c.grid[k][s] && add(i, .5, 9, n, 100));
    if (c.bass) for (const [bs, semi, l] of GENRES[c.genre][3]) if (bs === s) add(i, l, 0, MOTIFS[c.motif][2] + semi, 100);
    if (c.lead) { const e = mm.map[i % mm.len]; if (e) add(i, e[1], 1, e[0], 90); } }
  ev.sort((a, b) => a[0] - b[0] || (a[1] & 0xF0) - (b[1] & 0xF0));
  const vlq = n => { const b = [n & 0x7F]; while ((n >>= 7)) b.unshift((n & 0x7F) | 0x80); return b; };
  const tempo = Math.round(6e7 / c.bpm), trk = [0, 0xFF, 0x51, 3, tempo >> 16 & 255, tempo >> 8 & 255, tempo & 255, 0, 0xC1, 81]; let last = 0;
  for (const [t, st, n, v] of ev) { trk.push(...vlq(t - last), st, n, v); last = t; }
  trk.push(0, 0xFF, 0x2F, 0);
  const u32 = n => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255];
  const bytes = new Uint8Array([0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 1, 0xE0, 0x4D, 0x54, 0x72, 0x6B, ...u32(trk.length), ...trk]);
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' })); a.download = `klangwerk-${c.genre}-${c.motif}.mid`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('MIDI gespeichert · in FL Studio einfach ins Fenster ziehen');
}

/* ---------- view ---------- */
const knob = (k, label, min, max, st, val, fmt) => `<label class="stack" style="gap:2px"><span class="small muted">${label}: <b id="v-${k}">${fmt(val)}</b></span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${st}" value="${val}"></label>`;
function render() {
  const c = C();
  app.innerHTML = `<div class="topbar"><a class="link" href="index.html#games">← Echo</a><span class="xp">${LS.get('echo-games', {}).xp || 0} XP</span></div>
  <div class="stack"><span class="eyebrow">Echo</span><h1>🎛️ Klangwerk</h1><p class="muted">Klassik trifft Beat. Genre wählen, Motiv wählen, Play – dann Kästchen antippen und an den Reglern drehen.</p></div>
  <section class="card"><span class="eyebrow">Genre</span><div class="chips">${Object.entries(GENRES).map(([k, g]) => `<button class="chip" data-act="genre" data-v="${k}" aria-pressed="${c.genre === k}">${g[0]} · ${g[1]}</button>`).join('')}</div>
  <span class="eyebrow">Klassik-Motiv</span><div class="chips">${Object.entries(MOTIFS).map(([k, m]) => `<button class="chip" data-act="motif" data-v="${k}" aria-pressed="${c.motif === k}" title="${m[1]}">${m[0]}</button>`).join('')}</div>
  <span class="small muted">${MOTIFS[c.motif][0]} · ${MOTIFS[c.motif][1]} · gemeinfrei, aus Noten nachgespielt</span></section>
  <button class="btn ${playing ? '' : 'primary'} big" data-act="${playing ? 'stop' : 'play'}">${playing ? '■ Stopp' : '▶ Play'}</button>
  <section class="card" data-noswipe><span class="eyebrow">Drums · 16 Schritte = 1 Takt</span>
  ${ROWS.map(([k, l]) => `<div class="stack" style="gap:3px"><span class="small muted">${l}</span><div class="grid16">${c.grid[k].map((v, s) => `<button class="st${v ? ' on' : ''}${s % 4 === 0 ? ' beat' : ''}" data-act="cell" data-r="${k}" data-s="${s}" aria-label="${l} ${s + 1}"></button>`).join('')}</div></div>`).join('')}
  <div class="chips"><button class="chip" data-act="tog" data-v="bass" aria-pressed="${c.bass}">🔊 Bass</button><button class="chip" data-act="tog" data-v="lead" aria-pressed="${c.lead}">🎻 Motiv</button><button class="chip" data-act="tog" data-v="slow" aria-pressed="${c.slow}">🐢 Motiv halbes Tempo</button><button class="chip" data-act="reset">↺ Genre-Vorlage</button></div></section>
  <section class="card" data-noswipe><span class="eyebrow">Regler</span>
  ${knob('bpm', 'Tempo', 90, 180, 1, c.bpm, v => v + ' BPM')}${knob('cut', 'Filter', 0.2, 1, .01, c.cut, v => Math.round(v * 100) + ' %')}${knob('pump', 'Sidechain-Pumpen', 0, 1, .05, c.pump, v => Math.round(v * 100) + ' %')}${knob('verb', 'Hall', 0, 1, .05, c.verb, v => Math.round(v * 100) + ' %')}${knob('oct', 'Motiv-Oktave', -2, 1, 1, c.oct, v => (v > 0 ? '+' : '') + v)}
  <span class="small muted">Tipp: Filter runter, Play, dann langsam hochziehen – das ist der klassische Aufbau vor dem Drop.</span></section>
  <section class="card"><span class="eyebrow">Speichern</span><div class="row"><input class="input" id="nm" placeholder="Name des Beats"><button class="btn primary" data-act="save">Speichern</button></div>
  ${K.saved.length ? K.saved.map((s, i) => `<div class="row spread note"><span>${esc(s.name)} <span class="small muted">· ${GENRES[s.cur.genre][0]} · ${MOTIFS[s.cur.motif][0]}</span></span><span class="row" style="gap:6px"><button class="btn sm" data-act="load" data-v="${i}">Laden</button><button class="btn ghost sm" data-act="del" data-v="${i}">✕</button></span></div>`).join('') : ''}
  <button class="btn ghost" data-act="midi">⬇ Als MIDI exportieren (für FL Studio)</button>
  <span class="small muted">In FL Studio: MIDI-Datei ins Programm ziehen. Kanal 10 sind die Drums, Kanal 1 der Bass, Kanal 2 das Motiv – jedem einen eigenen Klang geben.</span></section>`;
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const v = b.dataset.v, c = C();
  switch (b.dataset.act) {
    case 'play': play(); break;
    case 'stop': stop(); break;
    case 'genre': { const keep = { motif: c.motif, oct: c.oct, cut: c.cut, pump: c.pump, verb: c.verb }; K.cur = Object.assign(DEF(v), keep); save(); if (playing) MM = motifMap(); render(); break; }
    case 'motif': c.motif = v; save(); if (playing) { MM = motifMap(); } render(); break;
    case 'cell': { const r = b.dataset.r, s = +b.dataset.s; c.grid[r][s] = c.grid[r][s] ? 0 : 1; b.classList.toggle('on'); save(); break; }
    case 'tog': c[v] = !c[v]; save(); if (playing) MM = motifMap(); render(); break;
    case 'reset': K.cur = Object.assign(DEF(c.genre), { motif: c.motif }); save(); if (playing) MM = motifMap(); render(); break;
    case 'save': { const n = document.getElementById('nm').value.trim() || `${GENRES[c.genre][0]} × ${MOTIFS[c.motif][0]}`; K.saved.unshift({ name: n, cur: JSON.parse(JSON.stringify(c)), ts: Date.now() }); let msg = 'Gespeichert';
      if (K.xpDay !== today()) { K.xpDay = today(); gainXP('klang', 60); msg += ' · +60 XP'; } save(); toast(msg); render(); break; }
    case 'load': K.cur = JSON.parse(JSON.stringify(K.saved[+v].cur)); save(); if (playing) MM = motifMap(); render(); break;
    case 'del': K.saved.splice(+v, 1); save(); render(); break;
    case 'midi': midi(); break;
  }
});
app.addEventListener('input', e => {
  const k = e.target.dataset.k; if (!k) return; const c = C(), v = +e.target.value; c[k] = v; save();
  const lab = document.getElementById('v-' + k); if (lab) lab.textContent = { bpm: v + ' BPM', oct: (v > 0 ? '+' : '') + v }[k] || Math.round(v * 100) + ' %';
  if (k === 'oct' && playing) MM = motifMap(); applyKnobs();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
render();
