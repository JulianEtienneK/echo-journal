/* Echo Spanisch-Programm: adaptive vocabulary (Elo-style rating), grammar drills, link to the interview rounds. */
const ES = Object.assign({ th: null, w: {}, extra: [], gram: {}, gx: {}, days: {}, k: 0, easy: 0, miss: 0 }, LS.get('echo-es', null) || {});
const saveES = () => { ES.updated = Date.now(); LS.set('echo-es', ES); };
const app = document.getElementById('app');
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const lvlIdx = th => Math.max(0, Math.min(5, Math.floor((th == null ? 2.5 : th) - 0.5)));
const cefr = th => CEFR[lvlIdx(th)];
const nrm = s => String(s || '').toLowerCase().trim().replace(/[¿?¡!.,;:"]/g, '').replace(/\s+/g, ' ');
const noAcc = s => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/ñ/g, 'n');
const noArt = s => s.replace(/^(el|la|los|las|un|una) /, '');
function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
const day = () => ES.days[today()] || (ES.days[today()] = {});
const allWords = () => { const seen = new Set(), out = []; for (const w of ES_WORDS.concat(ES.extra || [])) if (!seen.has(w.es)) { seen.add(w.es); out.push(w); } return out; };
const DAY = 864e5, IV = [0, 1, 3, 7, 16, 35];
let VOICE = null;
function say(t) { try { const s = window.speechSynthesis; if (!s) return; s.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'es-ES'; VOICE = VOICE || s.getVoices().filter(v => /^es/i.test(v.lang)).sort((a, b) => (/es-ES/.test(b.lang) ? 1 : 0) - (/es-ES/.test(a.lang) ? 1 : 0))[0]; if (VOICE) u.voice = VOICE; u.rate = 0.9; s.speak(u); } catch { /* no speech */ } }
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { VOICE = null; };

/* ---------- adaptive rating ---------- */
function rate(b, ok) { // Elo-style: the rating moves toward the difficulty of what you can and cannot do
  const th = ES.th == null ? 3 : ES.th, p = 1 / (1 + Math.exp(-1.7 * (th - b))), K = (ES.k || 0) < 30 ? 0.35 : 0.14;
  ES.th = Math.max(0.5, Math.min(6.5, th + (ok ? K * (1 - p) : -K * p))); ES.k = (ES.k || 0) + 1;
  if (ok) { ES.miss = 0; } else { ES.easy = 0; if (++ES.miss >= 3) { ES.th = Math.max(0.5, ES.th - 0.35); ES.miss = 0; S.note = 'Ich mache die nächsten Wörter etwas leichter.'; } }
}
function tooEasy() { ES.th = Math.min(6.5, (ES.th == null ? 3 : ES.th) + 0.12); if (++ES.easy >= 3) { ES.th = Math.min(6.5, ES.th + 0.35); ES.easy = 0; S.note = 'Zu leicht? Die nächsten Wörter werden schwerer.'; } }

/* ---------- vocabulary session ---------- */
const S = { view: 'home', sess: null, note: '', busy: false, g: null };
function newPool(target) { const w = ES.w; return allWords().filter(x => !w[x.es]).map(x => ({ x, d: Math.abs(x.b - target) + Math.random() * 0.6 })).sort((a, b) => a.d - b.d).map(o => o.x); }
function buildSession(place) {
  const now = Date.now(), th = ES.th == null ? 3 : ES.th, items = [];
  if (!place) for (const w of shuffle(allWords().filter(x => ES.w[x.es] && ES.w[x.es].s === 'learning' && ES.w[x.es].due <= now)).slice(0, 6)) items.push({ w, kind: 'prod' });
  const n = place ? 15 : 12 - items.length;
  return { place, items: shuffle(items), nNew: n, i: 0, ok: 0, th0: th, ans: null, log: [] };
}
function nextNew(sess) { // chosen one at a time, so every answer shifts what comes next
  const th = ES.th == null ? 3 : ES.th, used = new Set(sess.items.map(it => it.w.es)), pool = newPool(th + 0.3).filter(x => !used.has(x.es));
  return pool[0] || null;
}
function curItem() { const s = S.sess; if (s.i < s.items.length) return s.items[s.i]; if ((s.newDone || 0) >= s.nNew) return null; const w = nextNew(s); if (!w) return null; const it = { w, kind: 'mc' }; s.items.push(it); return it; }
function mcOpts(w) {
  const pool = shuffle(allWords().filter(x => x.es !== w.es && x.de !== w.de && Math.abs(x.b - w.b) <= 1)), out = [w.de];
  for (const x of pool) { if (out.length >= 4) break; if (!out.includes(x.de)) out.push(x.de); }
  return shuffle(out);
}
function setWord(w, ok, kind) {
  const st = ES.w[w.es] || (ES.w[w.es] = { s: 'learning', box: 0, due: 0, n: 0, ok: 0 }); st.n++; if (ok) st.ok++;
  if (kind === 'mc') { st.box = ok ? 1 : 0; st.due = Date.now() + (ok ? 1 : 0) * DAY; }
  else if (ok) { st.box = Math.min(5, st.box + 1); st.due = Date.now() + IV[st.box] * DAY; if (st.box >= 5) st.s = 'known'; }
  else { st.box = Math.max(0, st.box - 2); st.due = Date.now() + 10 * 60e3; }
}
function checkProd(w, input) {
  const a = noArt(nrm(input)), t = noArt(nrm(w.es)), artOk = !/^(el|la|los|las) /.test(nrm(w.es)) || nrm(input).startsWith(nrm(w.es).split(' ')[0] + ' ') || !/^(el|la|los|las|un|una) /.test(nrm(input));
  if (!a) return { ok: false };
  if (a === t) return { ok: true, note: artOk ? '' : 'Artikel: ' + w.es };
  if (noAcc(a) === noAcc(t)) return { ok: true, note: 'Achte auf den Akzent: ' + w.es };
  if (t.length >= 6 && lev(noAcc(a), noAcc(t)) === 1) return { ok: true, note: 'Fast, kleiner Tippfehler: ' + w.es };
  return { ok: false };
}
function answer(val, easy) {
  const s = S.sess, it = curItem(); if (!it || s.ans) return;
  let ok, note = '';
  if (easy) { ok = true; tooEasy(); ES.w[it.w.es] = { s: 'known', box: 5, due: Date.now() + 60 * DAY, n: 1, ok: 1, easy: true }; s.newDone = (s.newDone || 0) + 1; }
  else if (it.kind === 'mc') { ok = val === it.w.de; rate(it.w.b, ok); setWord(it.w, ok, 'mc'); s.newDone = (s.newDone || 0) + 1; }
  else { const r = checkProd(it.w, val); ok = r.ok; note = r.note || ''; setWord(it.w, ok, 'prod'); }
  if (ok) s.ok++; s.ans = { ok, val, note, easy }; s.log.push({ es: it.w.es, ok }); saveES(); render();
  if (it.kind === 'mc' || !ok) say(it.w.es);
}
function nextCard() { const s = S.sess; s.ans = null; s.i++; S.note = ''; if (!curItem()) finishSession(); else render(); setTimeout(() => document.getElementById('vin')?.focus(), 30); }
function finishSession() {
  const s = S.sess, xp = s.ok * 2 + 5; if (s.place) ES.placed = true;
  const d = day(); d.vok = (d.vok || 0) + 1; saveES(); gainXP('es_vok', xp); s.done = true; s.xp = xp; render();
}
async function aiWords() {
  if (!hasAI()) { toast('Für neue Wörter braucht Echo deinen Anthropic-Schlüssel'); return; }
  S.busy = true; render(); const th = ES.th == null ? 3 : ES.th, lv = cefr(th), have = allWords().map(w => w.es);
  try {
    const arr = parseJSONLoose(await askAI(`You create Spanish vocabulary for a German master's student (nutritional medicine, psychiatry research, lives in Germany, travels to Latin America and Spain). Return ONLY a JSON array of 20 objects {"es": "Spanish word or short expression, nouns with article", "de": "short German translation"}. Level: CEFR ${lv}, a bit above what the student already knows. Mix everyday life, emotions, work and university, health and a few idioms fitting the level. Do not repeat any of these: ${have.slice(-400).join(', ')}`, [{ role: 'user', content: 'Neue Wörter, bitte.' }], 1400));
    const add = arr.filter(x => x && x.es && x.de && !have.includes(String(x.es).trim())).map(x => ({ es: String(x.es).trim(), de: String(x.de).trim(), b: +(th + 0.2).toFixed(2), src: 'ai' }));
    ES.extra = (ES.extra || []).concat(add); saveES(); toast(add.length + ' neue Wörter auf deinem Niveau');
  } catch (e) { toast('KI-Fehler: ' + e.message); }
  S.busy = false; render();
}
function viewVocab() {
  const s = S.sess, it = s.done ? null : curItem();
  if (s.done || !it) {
    const d = (ES.th || 3) - s.th0;
    return `<div class="topbar"><button class="link" data-act="home">← Spanisch</button><span></span></div><div class="card" style="text-align:center"><span class="eyebrow">${s.place ? 'Einstufung' : 'Runde'} fertig</span><div class="big-num">${s.ok} / ${s.items.length}</div>
      <p>Dein Niveau: <b>${cefr(ES.th)}</b> <span class="muted mono">(${(ES.th || 3).toFixed(2)}${Math.abs(d) >= 0.05 ? (d > 0 ? ' ↑' : ' ↓') : ''})</span></p><p class="xp">+${s.xp || 0} XP</p>
      <div class="row wrap" style="justify-content:center"><button class="btn primary" data-act="vocab">Noch eine Runde</button><button class="btn" data-act="home">Fertig</button></div><a class="btn ghost" href="werkzeuge.html#boost">⚡ Merk-Boost zum Festigen</a></div>`;
  }
  const n = Math.max(s.items.length, s.items.filter(x => x.kind === 'prod').length + s.nNew), pos = s.i + 1, a = s.ans;
  const head = `<div class="topbar"><button class="link" data-act="home">← Spanisch</button><span class="small muted mono">${pos} / ${n} · ${cefr(ES.th)}</span></div><div class="bar"><i style="width:${Math.round(s.i / n * 100)}%"></i></div>`;
  if (it.kind === 'mc') {
    const op = it.op || (it.op = mcOpts(it.w));
    return `${head}<div class="card"><span class="eyebrow">${it.w.src === 'interview' ? 'Aus deinem Interview · ' : it.w.src === 'ai' ? 'Neu für dich · ' : ''}Was heißt das?</span>
      <div class="word">${esc(it.w.es)} <button class="link" data-act="say" data-v="${esc(it.w.es)}" aria-label="Vorlesen">🔊</button></div>
      <div class="opts">${op.map(o => `<button class="opt ${a ? (o === it.w.de ? 'ok' : o === a.val ? 'bad' : '') : ''}" data-act="mc" data-v="${esc(o)}" ${a ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${a ? feedback(it, a) : `<button class="btn ghost" data-act="easy">✓ Kenne ich sicher, zu leicht</button>`}${S.note ? `<p class="small muted">${esc(S.note)}</p>` : ''}</div>`;
  }
  return `${head}<div class="card"><span class="eyebrow">Auf Spanisch?</span><div class="word">${esc(it.w.de)}</div>
    <form id="vform" class="row"><input class="input grow" id="vin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="auf Spanisch …" ${a ? 'disabled' : ''} value="${a ? esc(a.val) : ''}"><button class="btn primary" ${a ? 'disabled' : ''}>Prüfen</button></form>
    ${a ? feedback(it, a) : '<button class="link" data-act="dunno" style="justify-self:start">Weiß ich nicht</button>'}</div>`;
}
function feedback(it, a) {
  return `<div class="fb ${a.ok ? 'ok' : 'bad'}"><div class="stack" style="gap:2px"><b>${a.easy ? 'Notiert: kennst du' : a.ok ? 'Richtig' : 'Lösung'}: ${esc(it.w.es)} = ${esc(it.w.de)}</b>${a.note ? `<span class="small">${esc(a.note)}</span>` : ''}${!a.ok && it.kind === 'mc' ? '<span class="small muted">Kommt bald zum Üben zurück.</span>' : ''}</div></div>
    <button class="btn primary" data-act="next" id="nextbtn">Weiter</button>`;
}

/* ---------- grammar ---------- */
const TOPICS = [
  ['pres', 'Presente', 0, 'conj'], ['serestar', 'ser oder estar', 0, 'ctx'], ['indef', 'Pretérito indefinido', 1, 'conj'], ['imperf', 'Imperfecto', 1, 'conj'],
  ['porpara', 'por oder para', 1, 'ctx'], ['pasado', 'Indefinido oder Imperfecto', 2, 'ctx'], ['fut', 'Futuro & Condicional', 2, 'conj'], ['pron', 'Objektpronomen', 2, 'ctx'],
  ['subj', 'Subjuntivo: Formen', 3, 'conj'], ['indsubj', 'Indikativ oder Subjuntivo', 3, 'ctx'],
];
const END = { pres: { ar: s6('o as a amos áis an'), er: s6('o es e emos éis en'), ir: s6('o es e imos ís en') }, indef: { ar: s6('é aste ó amos asteis aron'), er: s6('í iste ió imos isteis ieron') }, imperf: { ar: s6('aba abas aba ábamos abais aban'), er: s6('ía ías ía íamos íais ían') }, subj: { ar: s6('e es e emos éis en'), er: s6('a as a amos áis an') } };
function conj(v, tense, p) {
  const irr = ES_IRR[v] || {}; if (irr[tense]) return irr[tense][p];
  const stem = v.slice(0, -2), cls = v.slice(-2);
  if (tense === 'fut') return (irr.stem || v) + s6('é ás á emos éis án')[p];
  if (tense === 'cond') return (irr.stem || v) + s6('ía ías ía íamos íais ían')[p];
  const e = END[tense]; return stem + (e[cls] || e.er)[p];
}
function genConj(topic) {
  const tense = topic === 'fut' ? (Math.random() < 0.5 ? 'fut' : 'cond') : topic, irrShare = 0.35 + 0.1 * lvlIdx(ES.th);
  const irrVerbs = Object.keys(ES_IRR).filter(v => tense !== 'imperf' || ES_IRR[v].imperf || Math.random() < 0.3);
  const v = Math.random() < irrShare ? irrVerbs[Math.floor(Math.random() * irrVerbs.length)] : ES_REG[Math.floor(Math.random() * ES_REG.length)], p = Math.floor(Math.random() * 6);
  return { kind: 'conj', v, tense, p, a: conj(v, tense, p) };
}
function startGram(topic) {
  const tp = TOPICS.find(t => t[0] === topic), items = [];
  if (tp[3] === 'conj') { const seen = new Set(); while (items.length < 10) { const it = genConj(topic), k = it.v + it.tense + it.p; if (!seen.has(k)) { seen.add(k); items.push(it); } } }
  else for (const c of shuffle(ES_CTX[topic].concat((ES.gx || {})[topic] || [])).slice(0, 10)) items.push({ kind: 'ctx', s: c[0], a: c[1], o: shuffle(c[2]), x: c[3] });
  S.g = { topic, items, i: 0, ok: 0, ans: null }; S.view = 'gram'; render(); setTimeout(() => document.getElementById('gin')?.focus(), 30);
}
function gramAnswer(val) {
  const g = S.g, it = g.items[g.i]; if (g.ans) return;
  let sc;
  if (it.kind === 'ctx') sc = val === it.a ? 1 : 0;
  else { const a = nrm(val), t = nrm(it.a); sc = a === t ? 1 : noAcc(a) === noAcc(t) && a ? 0.5 : 0; }
  g.ok += sc; g.ans = { val, sc };
  const m = ES.gram[g.topic] || (ES.gram[g.topic] = { m: 0, n: 0 }); m.m = m.n ? m.m * 0.85 + sc * 0.15 : sc * 0.5; m.n++; saveES(); render();
}
function gramNext() { const g = S.g; g.ans = null; if (++g.i >= g.items.length) { const xp = Math.round(g.ok) + 5; gainXP('es_gram', xp); const d = day(); d.gram = (d.gram || 0) + 1; saveES(); g.done = true; g.xp = xp; } render(); setTimeout(() => document.getElementById('gin')?.focus(), 30); }
async function aiSentences(topic) {
  if (!hasAI()) { toast('Dafür braucht Echo deinen Anthropic-Schlüssel'); return; }
  const tp = TOPICS.find(t => t[0] === topic); S.busy = true; render();
  const ex = ES_CTX[topic].slice(0, 3).map(c => JSON.stringify({ s: c[0], a: c[1], o: c[2], x: c[3] })).join('\n');
  try {
    const arr = parseJSONLoose(await askAI(`You write Spanish grammar drill items on "${tp[1]}" for a German learner at CEFR ${cefr(ES.th)}. Each item is one natural sentence with exactly one gap "___", the correct answer, 2-3 options including the answer, and a very short German explanation of the rule. Only items with one unambiguously correct option in standard Spanish (Spain or Latin America). Varied everyday, university and health contexts. Return ONLY a JSON array of 10 objects like these examples:\n${ex}`, [{ role: 'user', content: 'Zehn neue Sätze.' }], 1600));
    const add = arr.filter(x => x && x.s && x.a && Array.isArray(x.o) && x.o.includes(x.a) && String(x.s).includes('___')).map(x => [String(x.s), String(x.a), x.o.map(String), String(x.x || '')]);
    ES.gx = ES.gx || {}; ES.gx[topic] = (ES.gx[topic] || []).concat(add).slice(-60); saveES(); toast(add.length + ' neue Sätze'); S.busy = false; startGram(topic); return;
  } catch (e) { toast('KI-Fehler: ' + e.message); }
  S.busy = false; render();
}
function recTopic() { const ui = lvlIdx(ES.th); const el = TOPICS.filter(t => t[2] <= ui + 1); return el.sort((a, b) => ((ES.gram[a[0]] || {}).m || 0) - ((ES.gram[b[0]] || {}).m || 0) || a[2] - b[2])[0]; }
function viewGramList() {
  const rec = recTopic(), ui = lvlIdx(ES.th);
  return `<div class="topbar"><button class="link" data-act="home">← Spanisch</button><span></span></div><div class="stack"><span class="eyebrow">Grammatik</span><h1>Grammatiktraining</h1><p class="muted">Zehn Aufgaben pro Runde. Konjugation tippst du, bei den Entscheidungsfragen wählst du. Fehlt nur der Akzent, gibt es halbe Punkte.</p></div>
  ${TOPICS.map(t => { const m = ES.gram[t[0]], pct = m ? Math.round(m.m * 100) : null; return `<div class="card"><div class="row spread"><div class="stack" style="gap:2px"><b>${esc(t[1])} ${t === rec ? '<span class="tag challenge">empfohlen</span>' : ''}</b><span class="small muted">ab ${CEFR[t[2]]}${t[2] > ui + 1 ? ' · noch etwas früh' : ''}${pct != null ? ' · sitzt zu ' + pct + ' %' : ''}</span></div><div class="row"><button class="btn sm primary" data-act="gram" data-v="${t[0]}">Üben</button>${t[3] === 'ctx' && hasAI() ? `<button class="btn sm ghost" data-act="gram-ai" data-v="${t[0]}" ${S.busy ? 'disabled' : ''}>+ KI</button>` : ''}</div></div>${pct != null ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}</div>`; }).join('')}`;
}
function viewGram() {
  const g = S.g, tp = TOPICS.find(t => t[0] === g.topic);
  if (g.done) return `<div class="topbar"><button class="link" data-act="gramlist">← Grammatik</button><span></span></div><div class="card" style="text-align:center"><span class="eyebrow">${esc(tp[1])}</span><div class="big-num">${g.ok % 1 ? g.ok.toFixed(1) : g.ok} / ${g.items.length}</div><p class="xp">+${g.xp} XP</p><div class="row wrap" style="justify-content:center"><button class="btn primary" data-act="gram" data-v="${g.topic}">Nochmal</button><button class="btn" data-act="gramlist">Andere Themen</button></div><a class="btn ghost" href="werkzeuge.html#boost">⚡ Merk-Boost zum Festigen</a></div>`;
  const it = g.items[g.i], a = g.ans;
  const head = `<div class="topbar"><button class="link" data-act="gramlist">← Grammatik</button><span class="small muted mono">${g.i + 1} / ${g.items.length}</span></div><div class="bar"><i style="width:${Math.round(g.i / g.items.length * 100)}%"></i></div>`;
  if (it.kind === 'ctx') return `${head}<div class="card"><span class="eyebrow">${esc(tp[1])}</span><p class="q">${esc(it.s).replace('___', '<span style="color:var(--gold)">___</span>')}</p>
    <div class="opts">${it.o.map(o => `<button class="opt ${a ? (o === it.a ? 'ok' : o === a.val ? 'bad' : '') : ''}" data-act="gans" data-v="${esc(o)}" ${a ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
    ${a ? `<div class="fb ${a.sc ? 'ok' : 'bad'}"><div class="stack" style="gap:2px"><b>${a.sc ? 'Richtig' : 'Richtig wäre: ' + esc(it.a)}</b><span class="small">${esc(it.x)}</span></div></div><button class="btn primary" data-act="gnext" id="nextbtn">Weiter</button>` : ''}</div>`;
  return `${head}<div class="card"><span class="eyebrow">${esc(ES_TENSES[it.tense])}</span><p class="q"><span class="muted">(${esc(ES_PERS[it.p])})</span> ${esc(it.v)} → ?</p>
    <form id="gform" class="row"><input class="input grow" id="gin" autocomplete="off" autocapitalize="off" spellcheck="false" ${a ? 'disabled' : ''} value="${a ? esc(a.val) : ''}"><button class="btn primary" ${a ? 'disabled' : ''}>Prüfen</button></form>
    ${a ? `<div class="fb ${a.sc === 1 ? 'ok' : 'bad'}"><div class="stack" style="gap:2px"><b>${a.sc === 1 ? 'Richtig' : a.sc ? 'Fast: Akzent! ' + esc(it.a) : 'Richtig wäre: ' + esc(it.a)}</b><span class="small muted">${ES_PERS.map((p, i) => (i === it.p ? '<b>' : '') + esc(conj(it.v, it.tense, i)) + (i === it.p ? '</b>' : '')).join(' · ')}</span></div></div><button class="btn primary" data-act="gnext" id="nextbtn">Weiter</button>` : `<div class="chips">${['á', 'é', 'í', 'ó', 'ú', 'ñ'].map(c => `<button class="chip" data-act="acc" data-v="${c}" type="button">${c}</button>`).join('')}</div>`}</div>`;
}

/* ---------- interview link + home ---------- */
const targets = () => allWords().filter(x => ES.w[x.es] && ES.w[x.es].s === 'learning').sort((a, b) => ES.w[a.es].box - ES.w[b.es].box || ES.w[a.es].due - ES.w[b.es].due).slice(0, 6);
function viewWords() {
  const ws = allWords().filter(x => ES.w[x.es]).sort((a, b) => (ES.w[b.es].due || 0) - (ES.w[a.es].due || 0));
  return `<div class="topbar"><button class="link" data-act="home">← Spanisch</button><span></span></div><h2>Deine Wörter</h2>
  ${ws.length ? `<div class="card"><div class="stack small">${ws.map(x => { const st = ES.w[x.es]; return `<div class="row spread"><span><b>${esc(x.es)}</b> · ${esc(x.de)}</span><span class="skills">${[1, 2, 3, 4, 5].map(n => `<i class="${st.box >= n ? 'on' : ''}"></i>`).join('')}</span></div>`; }).join('')}</div></div>` : '<p class="muted">Noch keine. Starte eine Vokabelrunde.</p>'}`;
}
function viewHome() {
  const th = ES.th, li = lvlIdx(th), all = allWords(), st = Object.values(ES.w), known = st.filter(x => x.s === 'known').length, learning = st.filter(x => x.s === 'learning').length, due = st.filter(x => x.s === 'learning' && x.due <= Date.now()).length;
  const ahead = all.filter(x => !ES.w[x.es] && x.b >= (th || 3) - 0.7 && x.b <= (th || 3) + 1.2).length, d = ES.days[today()] || {}, tw = targets(), rt = recTopic(), lastEs = LS.get('echo-es-level', 'B1');
  const iv = (LS.get('echo-es-int', {}) || {})[today()];
  return `<div class="topbar"><a class="link" href="werkzeuge.html">← Werkzeuge</a><a class="link" href="./#games">Spiele</a></div>
  <div class="stack"><span class="eyebrow">Echo · Español</span><h1>🇪🇸 Spanisch-Programm</h1><p class="muted">Vokabeln, die sich deinem Niveau anpassen, Grammatik zum Drillen, und die schrägen Interviews, die genau diese Wörter einbauen.</p></div>
  <div class="card"><div class="row spread"><div class="row"><div class="lvlbadge">${th == null ? '?' : CEFR[li]}</div><div class="stack" style="gap:0"><h3>${th == null ? 'Noch nicht eingestuft' : 'Dein Niveau: ' + CEFR[li]}</h3><span class="small muted mono">${th == null ? 'Eine kurze Einstufung, 15 Wörter' : 'Wertung ' + th.toFixed(2) + ' · ' + known + ' sicher · ' + learning + ' im Lernen'}</span></div></div></div>
    <div class="lvlrow">${CEFR.map((c, i) => `<i class="${th == null ? '' : i < li ? 'on' : i === li ? 'cur' : ''}" title="${c}"></i>`).join('')}</div>
    ${th == null || !ES.placed ? `<button class="btn primary big" data-act="place">Einstufung starten</button><button class="link" data-act="skip-place" style="justify-self:start">Überspringen und mit B1 anfangen</button>` : ''}</div>
  ${th != null ? `<div class="card"><span class="eyebrow">Heute</span>
    <div class="row spread"><span>${d.vok ? '✅' : '⬜'} Eine Vokabelrunde${due ? ` <span class="small muted">(${due} fällig)</span>` : ''}</span><button class="btn sm primary" data-act="vocab">Start</button></div>
    <div class="row spread"><span>${d.gram ? '✅' : '⬜'} Grammatik: ${esc(rt[1])}</span><button class="btn sm" data-act="gram" data-v="${rt[0]}">Start</button></div>
    <div class="row spread"><span>${iv ? '✅' : '⬜'} Interview mit einer schrägen Figur</span><a class="btn sm" href="./#es">Start</a></div>
    ${S.note ? `<p class="small muted">${esc(S.note)}</p>` : ''}</div>
  <div class="card"><span class="eyebrow">Interview × Programm</span><p class="small">Die Figur im Interview baut deine Lernwörter ein und schafft Situationen für dein schwächstes Grammatikthema. Neue Wörter aus dem Interview landen hier automatisch im Training.</p>
    ${tw.length ? `<div class="chips">${tw.map(x => `<span class="chip">${esc(x.es)}</span>`).join('')}</div>` : '<p class="small muted">Lernwörter erscheinen nach der ersten Vokabelrunde.</p>'}
    <p class="small">Grammatik-Fokus: <b>${esc(rt[1])}</b></p>
    ${CEFR[li] !== lastEs && ['A2', 'B1', 'B2', 'C1'].includes(CEFR[li]) ? `<button class="btn sm ghost" data-act="setlvl" data-v="${CEFR[li]}" style="justify-self:start">Interview-Niveau von ${lastEs} auf ${CEFR[li]} stellen</button>` : `<span class="small muted">Interview-Niveau: ${lastEs}</span>`}</div>
  <div class="row wrap"><button class="btn grow" data-act="gramlist">📐 Grammatik</button><button class="btn grow" data-act="words">📒 Wörter</button></div>
  <div class="card"><div class="row spread"><span class="small">${ahead} neue Wörter auf deinem Niveau übrig${ES.extra && ES.extra.length ? ` · ${ES.extra.length} von KI oder aus Interviews` : ''}</span>${hasAI() ? `<button class="btn sm ghost" data-act="aiwords" ${S.busy ? 'disabled' : ''}>${S.busy ? '…' : '+ 20 mit KI'}</button>` : ''}</div>
    <span class="small muted">Wie es sich anpasst: Jede Antwort verschiebt deine Wertung. Neue Wörter kommen knapp über deinem Stand. Dreimal „zu leicht“ hintereinander macht einen Sprung nach oben, drei Fehler hintereinander nach unten. Gelernte Wörter kommen nach 1, 3, 7, 16 und 35 Tagen zum Abtippen wieder.</span></div>` : ''}`;
}
function render() { app.innerHTML = S.view === 'vocab' ? viewVocab() : S.view === 'gram' ? viewGram() : S.view === 'gramlist' ? viewGramList() : S.view === 'words' ? viewWords() : viewHome(); }
async function startVocab(place) {
  if (place && ES.th == null) ES.th = 3;
  const th = ES.th == null ? 3 : ES.th, ahead = allWords().filter(x => !ES.w[x.es] && x.b >= th - 0.7 && x.b <= th + 1.2).length;
  if (!place && ahead < 6 && hasAI()) await aiWords();
  S.sess = buildSession(place); S.view = 'vocab'; S.note = ''; if (!curItem()) { toast('Gerade nichts zu üben'); S.view = 'home'; } render(); scrollTo(0, 0);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, v = b.dataset.v;
  if (a === 'home') { S.view = 'home'; S.note = ''; render(); scrollTo(0, 0); }
  else if (a === 'place') startVocab(true);
  else if (a === 'skip-place') { ES.th = 3; ES.placed = true; saveES(); render(); }
  else if (a === 'vocab') startVocab(false);
  else if (a === 'mc') answer(v);
  else if (a === 'easy') answer(null, true);
  else if (a === 'dunno') answer('');
  else if (a === 'next') nextCard();
  else if (a === 'say') say(v);
  else if (a === 'aiwords') aiWords();
  else if (a === 'gramlist') { S.view = 'gramlist'; render(); scrollTo(0, 0); }
  else if (a === 'words') { S.view = 'words'; render(); scrollTo(0, 0); }
  else if (a === 'gram') startGram(v);
  else if (a === 'gram-ai') aiSentences(v);
  else if (a === 'gans') gramAnswer(v);
  else if (a === 'gnext') gramNext();
  else if (a === 'acc') { const el = document.getElementById('gin'); if (el) { el.value += v; el.focus(); } }
  else if (a === 'setlvl') { LS.set('echo-es-level', v); toast('Interview-Niveau: ' + v); render(); }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'vform') answer(document.getElementById('vin').value);
  if (e.target.id === 'gform') gramAnswer(document.getElementById('gin').value);
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && document.getElementById('nextbtn') && !(e.target.id === 'vin' || e.target.id === 'gin') ) { e.preventDefault(); document.getElementById('nextbtn').click(); } });
window.ES_TEST = { ES, conj, checkProd, allWords, rate, buildSession, recTopic, targets, cefr };
render();
