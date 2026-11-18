/* Echo · Wege & Anker
   Anker: one tap when the urge comes → energy check → one small action (Yoga Nidra read aloud, tea + five sentences, outside).
          Ausrutscher: one line why + 10-minute timer, no reset, no shame.
   Wege: ten short lessons each on Buddhism and Stoicism (idea, practice for today, journal question).
   Storage: 'echo-wege' (backed up by Echo). Needs tools-common.js and wege-data.js. */
'use strict';
const app = document.getElementById('app');
const XP = { lesson: 40, answer: 20, surf: 30 };
const REWARD = { date: '2026-11-30', text: 'Pullover' };
const W = Object.assign({ done: {}, answers: {}, anker: [], lapses: [], writes: [] }, LS.get('echo-wege', {}));
const save = () => { W.updated = Date.now(); LS.set('echo-wege', W); };
const route = () => location.hash.replace(/^#/, '');
const go = h => { if (route() === h) render(); else location.hash = h; };
const PATHS = { budd: ['☸️', 'Buddhismus', 'Durst, Vergänglichkeit, Achtsamkeit, Mitgefühl'], stoa: ['🏛️', 'Stoa', 'Was in deiner Hand liegt – und Ruhe bei allem anderen'] };
const nextIdx = p => { const i = WEGE[p].findIndex((_, j) => !W.done[p + j]); return i < 0 ? null : i; };
const daysLeft = () => Math.ceil((new Date(REWARD.date + 'T23:59') - new Date()) / 864e5);
const topBar = back => `<div class="topbar"><a class="link" href="${back ? '#' : 'index.html#games'}">← ${back ? 'Wege' : 'Echo'}</a><span class="xp">${LS.get('echo-games', {}).xp || 0} XP</span></div>`;
let A = { energy: null, why: '' }, timer = null, nidra = null;

/* ---------- hub ---------- */
function viewHub() {
  const surfed = W.anker.length, dl = daysLeft();
  return `${topBar()}<div class="stack"><span class="eyebrow">Echo</span><h1>🪷 Wege</h1><p class="muted">Ein Anker für den Moment, in dem der Affe ruft – und zwei alte Schulen, die genau dafür gebaut sind.</p></div>
  <button class="card hub" data-act="go" data-v="anker" style="border:2px solid var(--calm)"><div class="row"><span class="em">🌊</span><div class="stack" style="gap:0"><h3>Anker</h3><span class="small muted">Der Affe ruft? Ein Tipp, dann nur eine kleine Sache.</span></div><span class="xp">+${XP.surf}</span></div>
  <span class="small muted">${surfed ? `${surfed}× gesurft` : 'Noch nicht benutzt'}${dl > 0 ? ` · noch ${dl} Tage bis zum ${REWARD.text} (${fmtDay(REWARD.date)})` : ''}</span></button>
  <a class="card hub" href="verlauf.html" style="text-decoration:none;color:inherit"><div class="row"><span class="em">📈</span><div class="stack" style="gap:0"><h3>Verlauf</h3><span class="small muted">Drang eintragen, Abend-Check-in, alles im Zeitverlauf.</span></div></div></a>
  ${Object.keys(PATHS).map(p => { const n = WEGE[p].filter((_, j) => W.done[p + j]).length, i = nextIdx(p), l = i == null ? null : WEGE[p][i];
    return `<section class="card"><div class="row spread"><div class="stack" style="gap:0"><span class="eyebrow">${PATHS[p][0]} ${PATHS[p][1]} · ${n}/10</span><h3>${l ? l[0] + ' ' + esc(l[1]) : 'Alle Lektionen gelesen ✓'}</h3><span class="small muted">${esc(PATHS[p][2])}</span></div><span class="xp">+${XP.lesson}</span></div>
    <div class="bar" style="height:6px;border-radius:9px;background:var(--surface-2);overflow:hidden"><i style="display:block;height:100%;width:${n * 10}%;background:var(--calm)"></i></div>
    <div class="row" style="gap:8px;flex-wrap:wrap">${l ? `<button class="btn primary" data-act="go" data-v="l-${p}-${i}">Lektion ${i + 1} öffnen</button>` : ''}<button class="btn ghost" data-act="go" data-v="list-${p}">Alle</button></div></section>`; }).join('')}
  ${W.lapses.length || W.anker.length ? `<button class="btn ghost" data-act="go" data-v="log">Verlauf</button>` : ''}
  <p class="small muted">Lektionen sind für einen Tag gedacht: Idee morgens lesen, Übung tagsüber, Frage abends. Du musst nicht täglich eine machen.</p>`;
}

function viewList(p) {
  return `${topBar(1)}<h2>${PATHS[p][0]} ${PATHS[p][1]}</h2>${WEGE[p].map((l, i) => `<button class="card hub" data-act="go" data-v="l-${p}-${i}"><div class="row"><span class="em">${W.done[p + i] ? '✅' : l[0]}</span><div class="stack" style="gap:0"><b>${i + 1}. ${esc(l[1])}</b><span class="small muted">${esc(l[5])}</span></div></div></button>`).join('')}`;
}

function viewLesson(p, i) {
  const l = WEGE[p][i]; if (!l) return viewHub(); const id = p + i, done = W.done[id], ans = W.answers[id] || '';
  return `${topBar(1)}<div class="stack"><span class="eyebrow">${PATHS[p][1]} · Lektion ${i + 1}/10</span><h1>${l[0]} ${esc(l[1])}</h1></div>
  <section class="card"><p style="line-height:1.55">${esc(l[2])}</p><span class="small muted">Quelle: ${esc(l[5])}</span></section>
  <section class="card"><span class="eyebrow">Übung für heute</span><p>${esc(l[3])}</p></section>
  <section class="card"><span class="eyebrow">Frage fürs Journal</span><p><b>${esc(l[4])}</b></p>
  <textarea class="input" id="ans" rows="3" placeholder="Ein, zwei Sätze reichen.">${esc(ans)}</textarea>
  <button class="btn" data-act="answer" data-v="${id}">Antwort speichern${ans ? '' : ' · +' + XP.answer + ' XP'}</button></section>
  ${done ? `<p class="small muted">✅ Gelesen am ${fmtDay(done)}</p>` : `<button class="btn primary big" data-act="lesson" data-v="${id}">Gelesen – Übung nehme ich mit · +${XP.lesson} XP</button>`}
  <div class="row spread">${i > 0 ? `<button class="btn ghost sm" data-act="go" data-v="l-${p}-${i - 1}">← Lektion ${i}</button>` : '<span></span>'}${i < 9 ? `<button class="btn ghost sm" data-act="go" data-v="l-${p}-${i + 1}">Lektion ${i + 2} →</button>` : ''}</div>`;
}

/* ---------- Anker ---------- */
const CHOICES = {
  low: [['nidra', '🛌', 'Yoga Nidra, 10 Minuten', 'Hinlegen, Augen zu, Echo liest vor. Echte Erholung statt Berieselung.'], ['rest', '😌', 'Nur liegen, 10 Minuten', 'Timer läuft, du machst nichts. Auch Nichtstun zählt.']],
  mid: [['tea', '🍵', 'Tee und fünf Sätze', 'Wasser aufsetzen, dann fünf Sätze schreiben: was gerade da ist.'], ['audio', '🎧', 'Liegen und Musik oder Podcast', 'Nur Ton, kein Bild. Augen zu.']],
  high: [['out', '🚶', '10 Minuten raus', 'Jacke an, einmal um den Block. Auf interessante Gedanken achten.'], ['music', '🎹', 'Musik machen', 'Klavier oder Klangwerk. Zehn Minuten reichen.']],
};
function viewAnker() {
  const e = A.energy;
  return `${topBar(1)}<div class="stack"><span class="eyebrow">Anker</span><h1>🌊 Kurz innehalten</h1><p class="muted">Ein Drang ist eine Welle: Er steigt, erreicht eine Spitze und fällt. Du musst nichts gegen ihn tun, nur etwas anderes.</p></div>
  <section class="card"><span class="eyebrow">Wie viel Energie ist gerade da?</span>
  <div class="row" style="gap:8px">${[['low', '🪫', 'wenig'], ['mid', '🔋', 'mittel'], ['high', '⚡', 'viel']].map(([k, em, t]) => `<button class="chip" style="flex:1;padding:12px 6px;font-size:15px" data-act="energy" data-v="${k}" aria-pressed="${e === k}">${em} ${t}</button>`).join('')}</div>
  <input class="input" id="why" placeholder="Was will der Affe gerade? (optional, ein Wort reicht)" value="${esc(A.why)}"></section>
  ${e ? CHOICES[e].map(c => `<button class="card hub" data-act="choose" data-v="${c[0]}"><div class="row"><span class="em">${c[1]}</span><div class="stack" style="gap:0"><h3>${c[2]}</h3><span class="small muted">${c[3]}</span></div><span class="xp">+${XP.surf}</span></div></button>`).join('') : ''}
  <button class="btn ghost" data-act="go" data-v="lapse">Schon passiert – Ausrutscher-Protokoll</button>`;
}
function logSurf(choice) { W.anker.push({ ts: Date.now(), date: today(), energy: A.energy, why: A.why.trim(), choice }); save(); gainXP('wege-surf', XP.surf); }

function viewTea() {
  return `${topBar(1)}<h1>🍵 Fünf Sätze</h1><p class="muted">Wasser ist aufgesetzt? Dann schreib einfach, was gerade da ist. Kein Ziel, keine Form.</p>
  <textarea class="input" id="tea" rows="7" placeholder="1. …"></textarea><button class="btn primary big" data-act="tea-save">Fertig</button>`;
}

function viewTimer(min, label, after) {
  return `${topBar(1)}<div class="stack" style="text-align:center;gap:18px;padding-top:30px"><span class="eyebrow">${esc(label)}</span><div id="clock" style="font:600 64px/1 var(--f-mono)">${min}:00</div><p class="muted" id="tmsg">${esc(after)}</p><button class="btn ghost" data-act="stop">Beenden</button></div>`;
}
function runTimer(min, onEnd) {
  clearInterval(timer); const end = Date.now() + min * 6e4;
  timer = setInterval(() => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)), el = document.getElementById('clock'); if (el) el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (!s) { clearInterval(timer); timer = null; chime(); onEnd && onEnd(); } }, 500);
}
function chime() { try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = 528; g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(.25, c.currentTime + .05); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + 2.5); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 2.6); } catch { /* no audio */ } }

/* Yoga Nidra: ElevenLabs voice (Leon or Amy, generated once with the person's own key and kept on this device in IndexedDB),
   otherwise the browser's speech. The key lives only in localStorage 'echo-eleven' – it is not part of Echo's backups. */
const VOICES = { leon: ['Leon', 'MJ0RnG71ty4LH3dvNfSd'], amy: ['Amy', 'xTXZTtb6MuzG0jJR05Y9'] };
const EL = () => Object.assign({ key: '', voice: 'leon' }, LS.get('echo-eleven', {}));
// short body-scan lines are merged into one clip with breaks, so the scan needs a handful of requests instead of sixty
const SEGS = (() => { const out = []; for (const [t, p] of NIDRA) { const last = out[out.length - 1]; if (p <= 2 && last && last.short) { last.el += ' <break time="1.5s" /> ' + t; last.txt += ' · ' + t; last.pause = p; } else out.push({ el: t, txt: t, pause: p, short: p <= 2 }); } return out; })();
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.codePointAt(0)) | 0; return (h >>> 0).toString(36); };
const clipId = (v, seg) => v + ':' + hash(seg.el);
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('echo-audio', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function clipGet(id) { const db = await idb(); return new Promise(res => { const q = db.transaction('clips').objectStore('clips').get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); }
async function clipPut(id, blob) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('clips', 'readwrite'); t.objectStore('clips').put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function readyCount(v) { let n = 0; for (const sg of SEGS) if (await clipGet(clipId(v, sg))) n++; return n; }

function viewNidra() {
  const e = EL();
  return `${topBar(1)}<div class="stack" style="text-align:center;gap:18px;padding-top:24px"><span class="eyebrow">Yoga Nidra · ca. 10 Minuten</span>
  <p id="ntext" style="font-size:20px;line-height:1.5;min-height:120px">Leg dich hin und tippe auf Start. Der Bildschirm darf aus bleiben, solange die Seite offen ist.</p>
  <div class="bar" style="height:4px;border-radius:9px;background:var(--surface-2);overflow:hidden"><i id="nbar" style="display:block;height:100%;width:0;background:var(--calm)"></i></div>
  <div class="row" style="gap:8px;justify-content:center"><button class="btn primary" data-act="nidra-start">▶ Start</button><button class="btn ghost" data-act="stop">Beenden</button></div></div>
  <details class="card" style="margin-top:18px"${e.key ? '' : ' open'}><summary class="small" style="cursor:pointer"><b>Stimme</b> · <span id="vstate">${e.key ? VOICES[e.voice][0] + ' (ElevenLabs)' : 'Browser-Stimme'}</span></summary>
  <div class="chips">${Object.entries(VOICES).map(([k, v]) => `<button class="chip" data-act="voice" data-v="${k}" aria-pressed="${e.voice === k}">${v[0]}</button>`).join('')}</div>
  <input class="input mono" id="elkey" type="password" autocomplete="off" placeholder="ElevenLabs-API-Schlüssel" value="${esc(e.key)}">
  <span class="small muted">Bleibt nur auf diesem Gerät und ist nicht Teil der Echo-Sicherung. Einmal erzeugen kostet rund 3.000 Zeichen Kontingent, danach läuft alles offline.</span>
  <button class="btn" data-act="el-gen">Stimme erzeugen</button><span class="small muted" id="elmsg"></span></details>`;
}
async function genVoice() {
  const msg = t => { const m = document.getElementById('elmsg'); if (m) m.textContent = t; };
  const key = (document.getElementById('elkey').value || '').trim(), e = EL(); if (!key) return msg('Bitte zuerst den Schlüssel einfügen.');
  LS.set('echo-eleven', { key, voice: e.voice }); const vid = VOICES[e.voice][1];
  for (const [i, sg] of SEGS.entries()) {
    const id = clipId(e.voice, sg); if (await clipGet(id)) continue; msg(`Erzeuge ${i + 1} / ${SEGS.length} …`);
    try {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
        body: JSON.stringify({ text: sg.el, model_id: 'eleven_multilingual_v2', voice_settings: { stability: .82, similarity_boost: .75, style: .05, use_speaker_boost: true } }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j.detail && (j.detail.message || j.detail.status)) || 'HTTP ' + r.status); }
      await clipPut(id, await r.blob());
    } catch (err) { return msg('Abgebrochen: ' + err.message + '. Bereits erzeugte Teile bleiben gespeichert, erneut tippen setzt fort.'); }
  }
  msg('Fertig. ' + VOICES[e.voice][0] + ' liest ab jetzt vor, auch offline.'); const v = document.getElementById('vstate'); if (v) v.textContent = VOICES[e.voice][0] + ' (ElevenLabs)';
}
async function startNidra() {
  stopAll(); const e = EL(), useEl = !!e.key && (await readyCount(e.voice)) === SEGS.length;
  const tts = !useEl && 'speechSynthesis' in window, voice = tts ? (speechSynthesis.getVoices().find(v => /^de/i.test(v.lang)) || null) : null;
  const audio = useEl ? new Audio() : null, list = useEl ? SEGS : NIDRA.map(([t, p]) => ({ txt: t, el: t, pause: p }));
  let i = 0, alive = true, url = null; nidra = { stop: () => { alive = false; if (tts) speechSynthesis.cancel(); if (audio) audio.pause(); clearTimeout(nidra && nidra.t); if (url) URL.revokeObjectURL(url); } };
  const step = async () => { if (!alive) return; if (i >= list.length) { chime(); logSurf('nidra'); nidra = null; toast('Welle gesurft 🌊 +' + XP.surf + ' XP'); go(''); return; }
    const sg = list[i++], el = document.getElementById('ntext'), bar = document.getElementById('nbar'); if (el) el.textContent = sg.txt; if (bar) bar.style.width = Math.round(i / list.length * 100) + '%';
    const next = () => { if (nidra) nidra.t = setTimeout(step, sg.pause * 1000); };
    if (useEl) { const b = await clipGet(clipId(e.voice, sg)); if (!alive) return; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b); audio.src = url; audio.onended = next; audio.onerror = next; audio.play().catch(next); }
    else if (tts) { const u = new SpeechSynthesisUtterance(sg.txt); u.lang = 'de-DE'; u.rate = .82; u.pitch = .95; if (voice) u.voice = voice; u.onend = next; u.onerror = next; speechSynthesis.speak(u); }
    else nidra.t = setTimeout(step, (sg.pause + Math.max(2, sg.txt.length / 14)) * 1000); };
  step();
}
function stopAll() { clearInterval(timer); timer = null; if (nidra) { nidra.stop(); nidra = null; } }

function viewLapse() {
  return `${topBar(1)}<h1>🧭 Ausrutscher-Protokoll</h1><p class="muted">Ein Ausrutscher ist ein Datenpunkt, kein Rückfall. Kein Reset, keine Strafe. Gefährlich ist nur das „jetzt ist es eh egal“ danach.</p>
  <section class="card"><span class="eyebrow">Warum gerade?</span><input class="input" id="lwhy" placeholder="z. B. müde nach der Arbeit, Hunger, allein"><span class="small muted">Ein Wort reicht. Es landet im Verlauf, damit Muster sichtbar werden.</span></section>
  <button class="btn primary big" data-act="lapse-start">10-Minuten-Timer starten</button><p class="small muted">Wenn er klingelt: Laptop zu, aufstehen, ein Glas Wasser. Dann geht der Tag ganz normal weiter.</p>`;
}

function viewLog() {
  const rows = [...W.anker.map(x => ({ ...x, k: 'surf' })), ...W.lapses.map(x => ({ ...x, k: 'lapse' }))].sort((a, b) => b.ts - a.ts).slice(0, 60);
  const lbl = { nidra: 'Yoga Nidra', rest: 'Liegen', tea: 'Tee + Sätze', audio: 'Musik/Podcast', out: 'Raus', music: 'Musik machen' };
  return `${topBar(1)}<h2>Verlauf</h2><p class="small muted">${W.anker.length}× gesurft · ${W.lapses.length} Ausrutscher</p>${rows.map(r => `<div class="note">${r.k === 'surf' ? '🌊' : '🧭'} ${fmtDay(r.date)} · ${new Date(r.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · ${r.k === 'surf' ? esc(lbl[r.choice] || r.choice) : 'Ausrutscher'}${r.why ? ' · <i>' + esc(r.why) + '</i>' : ''}</div>`).join('')}`;
}

/* ---------- routing ---------- */
function render() {
  const r = route(); let m;
  if (!['nidra', 'timer'].includes(r)) stopAll();
  if (r === 'anker') app.innerHTML = viewAnker();
  else if (r === 'tea') app.innerHTML = viewTea();
  else if (r === 'nidra') app.innerHTML = viewNidra();
  else if (r === 'lapse') app.innerHTML = viewLapse();
  else if (r === 'log') app.innerHTML = viewLog();
  else if ((m = r.match(/^list-(budd|stoa)$/))) app.innerHTML = viewList(m[1]);
  else if ((m = r.match(/^l-(budd|stoa)-(\d)$/))) app.innerHTML = viewLesson(m[1], +m[2]);
  else app.innerHTML = viewHub();
  window.scrollTo(0, 0);
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const v = b.dataset.v, why = document.getElementById('why'); if (why) A.why = why.value;
  switch (b.dataset.act) {
    case 'go': go(v); break;
    case 'energy': A.energy = v; render(); break;
    case 'choose':
      if (v === 'nidra') go('nidra');
      else if (v === 'tea') go('tea');
      else { const lab = { rest: ['Nur liegen', 'Augen zu. Nichts tun ist erlaubt.'], audio: ['Nur Ton', 'Liegen, Augen zu, zuhören.'], out: ['Draußen', 'Handy darf zu Hause bleiben.'], music: ['Musik', 'Einfach spielen, nichts muss gut klingen.'] }[v];
        logSurf(v); app.innerHTML = viewTimer(10, lab[0], lab[1]); history.replaceState(null, '', '#timer'); runTimer(10, () => { const m = document.getElementById('tmsg'); if (m) m.textContent = 'Geschafft. Die Welle ist vorbei. 🌊'; }); toast('+' + XP.surf + ' XP · gut gemacht'); }
      break;
    case 'tea-save': { const t = document.getElementById('tea').value.trim(); if (t) W.writes.push({ ts: Date.now(), date: today(), text: t }); logSurf('tea'); toast('Welle gesurft 🌊 +' + XP.surf + ' XP'); go(''); break; }
    case 'nidra-start': startNidra(); break;
    case 'voice': { const k = document.getElementById('elkey'); LS.set('echo-eleven', Object.assign(EL(), { voice: v }, k ? { key: k.value.trim() } : {})); document.querySelectorAll('[data-act=voice]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === v)); break; }
    case 'el-gen': genVoice(); break;
    case 'stop': stopAll(); go(''); break;
    case 'lapse-start': { const w = document.getElementById('lwhy').value.trim(); W.lapses.push({ ts: Date.now(), date: today(), why: w }); save();
      app.innerHTML = viewTimer(10, 'Noch 10 Minuten', 'Wenn es klingelt: Laptop zu, aufstehen, Wasser.'); history.replaceState(null, '', '#timer');
      runTimer(10, () => { const m = document.getElementById('tmsg'); if (m) m.textContent = 'Zeit um. Laptop zu, aufstehen, ein Glas Wasser. Der Tag geht normal weiter.'; }); break; }
    case 'lesson': if (!W.done[v]) { W.done[v] = today(); save(); gainXP('wege-lesson', XP.lesson); toast('+' + XP.lesson + ' XP'); } render(); break;
    case 'answer': { const t = document.getElementById('ans').value.trim(); if (!t) return; const first = !W.answers[v]; W.answers[v] = t; save(); if (first) gainXP('wege-answer', XP.answer); toast(first ? '+' + XP.answer + ' XP · gespeichert' : 'Gespeichert'); render(); break; }
  }
});
window.addEventListener('hashchange', render);
if ('speechSynthesis' in window) speechSynthesis.getVoices(); // warm up the voice list
render();
