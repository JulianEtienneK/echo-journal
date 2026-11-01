'use strict';
/* Kopfrechnen for spiele.html: five modes (sprint, time trial, survival, chain, estimate), four difficulties that adapt
   within a round, task families incl. tax and everyday maths, trick lessons, a review queue for misses, a daily
   challenge, per-type stats and an on-screen keypad. Loaded before spiele.html's main script and uses its globals
   (G, save, gain, beep, esc, shuffle, today, toast, app, back, view, render) only at call time. */

const RC_CATS = { mix: 'Mix', add: 'Plus & Minus', mul: 'Mal', div: 'Geteilt', pct: 'Prozent', frac: 'Brüche & Dezimal', pow: 'Potenzen & Wurzeln', tax: 'Steuer & Alltag', nut: 'Ernährung & Einheiten', est: 'Schätzen', chain: 'Ketten', trick: 'Tricks' };
const RC_PICK = ['mix', 'add', 'mul', 'div', 'pct', 'frac', 'pow', 'tax', 'nut'];
const RC_SHORT = { mix: 'Mix', add: '+ −', mul: '×', div: '÷', pct: '%', frac: 'Brüche', pow: 'x²  √', tax: 'Steuer', nut: 'Ernährung' };
const RC_DIFF = ['Leicht', 'Mittel', 'Schwer', 'Profi'], RC_MULT = [1, 1.5, 2, 3];
const RC_MODES = {
  sprint: ['Sprint', 'So viele Aufgaben wie möglich, bevor die Zeit abläuft.'],
  trial: ['Zeitfahren', '20 Aufgaben so schnell wie möglich. Überspringen kostet 5 Sekunden.'],
  survival: ['Überleben', '3 Leben. Jede Aufgabe hat ein Zeitlimit, das immer knapper wird.'],
  chain: ['Kettenrechnen', 'Startzahl merken, dann Schritt für Schritt im Kopf weiterrechnen. 5 Ketten.'],
  estimate: ['Schätzen', '12 Aufgaben, ungefähr reicht: Leicht ±10 %, Mittel ±5 %, Schwer ±3 %, Profi ±2 %.'],
};
const RC_DUR = [30, 60, 120, 300];
const MIX = [['add', 2], ['mul', 2], ['div', 1.5], ['pct', 1.5], ['frac', 1.2], ['pow', 1.2], ['tax', 2.5], ['nut', 1.2]];

/* RNG, helpers, task banks (genTask) and TRICKS live in rechnen-gen.js, loaded first. */

/* ---------- persistent data ---------- */
function rcData() {
  const r = G.rechnen || (G.rechnen = {});
  r.bests ||= {}; r.stats ||= {}; r.review ||= []; r.tricks ||= {}; r.daily ||= {};
  r.cfg ||= { mode: 'sprint', d: 0, dur: 60, cat: 'mix' };
  if (r.pad == null) r.pad = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  return r;
}
const bestKey = c => [c.mode, c.mode === 'sprint' ? c.dur : '', c.d, ['chain', 'estimate'].includes(c.mode) ? '' : c.cat].join('|');

/* ---------- round state ---------- */
const R = { on: false, result: null };
const eff = () => R.d * 3 + R.s;
const timed = () => R.mode === 'survival' || R.mode === 'estimate';
function taskLimit() { return R.mode === 'estimate' ? [14, 11, 9, 7][R.d] * 1000 : Math.max(4, 14 - R.n * 0.3 - R.d * 1.5) * 1000; }
function newTask() {
  let q;
  if (R.kind === 'review') q = R.rq[R.done % R.rq.length];
  else {
    // Variety: never the same task twice in a round, and in Mix never the same type three times in a row.
    for (let i = 0; i < 15; i++) {
      if (R.kind === 'trick') { q = TRICKS.find(x => x.id === R.trick).gen(); q.c = 'trick'; }
      else if (R.mode === 'estimate') { q = genTask('est', eff()); q.c = 'est'; }
      else {
        let c = R.cat === 'mix' ? wpick(MIX) : R.cat;
        if (R.cat === 'mix' && R.lastC.length >= 2 && R.lastC.every(x => x === c)) c = wpick(MIX.filter(([k]) => k !== c));
        q = genTask(c, eff()); q.c = c;
      }
      if (!R.recent.includes(q.t)) break;
    }
    R.recent.push(q.t); if (R.recent.length > 60) R.recent.shift();
    R.lastC.push(q.c); if (R.lastC.length > 2) R.lastC.shift();
  }
  R.q = q; R.qStart = Date.now(); R.qLim = timed() ? taskLimit() : 0; R.qEnd = R.qLim ? Date.now() + R.qLim : 0;
}
function start(o) {
  const rc = rcData();
  Object.assign(R, { on: true, result: null, kind: 'play', mode: rc.cfg.mode, d: rc.cfg.d, dur: rc.cfg.dur, cat: rc.cfg.cat, daily: false, trick: null, rq: null }, o || {},
    { s: 0, streak: 0, n: 0, wrong: 0, done: 0, lives: 3, penalty: 0, miss: [], fb: null, rev: null, recent: [], lastC: [], start: Date.now() });
  R.total = R.kind === 'trick' ? 8 : R.kind === 'review' ? R.rq.length : R.mode === 'trial' ? 20 : R.mode === 'estimate' ? 12 : R.mode === 'chain' ? 5 : 0;
  R.end = R.mode === 'sprint' ? Date.now() + R.dur * 1000 : 0;
  // Only the scored first attempt of the day uses the day's fixed tasks; practice runs afterwards get fresh ones.
  RNG = R.daily && rc.daily.date !== today() ? seeded('echo-rechnen-' + today()) : Math.random;
  if (R.mode === 'chain' && R.kind === 'play') newChain(); else newTask();
  clearInterval(R.timer); R.timer = setInterval(tick, 100);
  view = 'rechnen'; render();
}

/* chain mode */
function newChain() {
  const d = R.d, steps = [4, 6, 8, 10][d], cap = [100, 300, 1000, 5000][d], add = [20, 50, 100, 300][d], mul = [5, 9, 12, 19][d];
  let v = ri(2, [9, 20, 50, 99][d]); const startV = v, ops = [];
  while (ops.length < steps) {
    const k = RNG(); let op = null;
    if (d === 3 && k > .92 && v <= 30) op = ['²', 0];
    else if (k < .3) op = ['+', ri(2, add)];
    else if (k < .55) { if (v > 3) op = ['−', ri(1, Math.min(v - 1, add))]; }
    else if (k < .8) { const x = ri(2, mul); if (v * x <= cap) op = ['×', x]; }
    else { const divs = []; for (let x = 2; x <= 12; x++) if (v % x === 0 && v / x >= 2) divs.push(x); if (divs.length) op = ['÷', pick(divs)]; }
    if (!op) continue;
    v = op[0] === '+' ? v + op[1] : op[0] === '−' ? v - op[1] : op[0] === '×' ? v * op[1] : op[0] === '÷' ? v / op[1] : v * v;
    ops.push(op);
  }
  R.chain = { startV, ops, res: v, i: -1, phase: 'show', stepEnd: Date.now() + 1800 };
  let cur = startV; const w = [`Start: ${fmt(startV)}`];
  for (const op of ops) { const nx = op[0] === '+' ? cur + op[1] : op[0] === '−' ? cur - op[1] : op[0] === '×' ? cur * op[1] : op[0] === '÷' ? cur / op[1] : cur * cur; w.push(`${fmt(cur)} ${opText(op)} = ${fmt(nx)}`); cur = nx; }
  R.q = { t: 'Kette', a: v, c: 'chain', w }; R.qStart = Date.now(); R.qEnd = 0; R.qLim = 0;
}
const opText = op => op[0] === '²' ? 'hoch 2' : `${op[0]} ${fmt(op[1])}`;
function chainStep() {
  const ch = R.chain; ch.i++;
  if (ch.i >= ch.ops.length) { ch.phase = 'ask'; R.qStart = Date.now(); }
  else ch.stepEnd = Date.now() + [3000, 2400, 1900, 1500][R.d];
  render();
}

/* ---------- answering ---------- */
function parseNum(s) {
  s = String(s).trim().replace(/\s/g, '').replace(/−/g, '-');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return s === '' || s === '-' ? NaN : Number(s);
}
const isRight = (q, v) => !Number.isNaN(v) && (q.tol ? Math.abs(v - q.a) <= q.tol * Math.abs(q.a) : Math.abs(v - q.a) <= 1e-6 * Math.max(1, Math.abs(q.a)));
function record(ok) {
  const rc = rcData(), q = R.q, st = rc.stats[q.c] || (rc.stats[q.c] = { n: 0, ok: 0, ms: 0 });
  st.n++; if (ok) { st.ok++; st.ms += Math.min(30e3, Date.now() - R.qStart); }
  if (ok) { if (++R.streak >= 3 && R.s < 2) { R.s++; R.streak = 0; } }
  else {
    R.s = Math.max(0, R.s - 1); R.streak = 0;
    if (!R.miss.some(m => m.t === q.t)) R.miss.push(q);
    if (R.kind !== 'review' && q.c !== 'chain' && !rc.review.some(m => m.t === q.t)) { rc.review.push({ t: q.t, a: q.a, tol: q.tol, c: q.c, x: q.x, w: q.w }); if (rc.review.length > 60) rc.review.shift(); }
  }
}
function advance() {
  R.done++;
  if (R.total && R.done >= R.total) return finish();
  if (R.mode === 'chain' && R.kind === 'play') newChain(); else newTask();
  render();
}
function right() {
  beep(true); record(true); R.n++; R.fb = null;
  if (R.kind === 'review') { const rc = rcData(); rc.review = rc.review.filter(m => m.t !== R.q.t); }
  if (R.mode === 'chain' && R.kind === 'play') { R.chain.phase = 'fb'; R.chain.ok = true; render(); return; }
  advance();
}
function miss(skip) {
  beep(false); record(false);
  R.fb = { t: R.q.t, a: R.q.a, x: R.q.x, skip };
  if (R.mode === 'trial' && R.kind === 'play') R.penalty += 5000;
  if (R.mode === 'survival' && R.kind === 'play' && --R.lives <= 0) return finish();
  if (R.mode === 'chain' && R.kind === 'play') { R.chain.phase = 'fb'; R.chain.ok = false; render(); return; }
  if (R.mode === 'sprint' || R.mode === 'survival') { R.wrong++; newTask(); render(); return; }
  advance();
}
function rechnenInput(v) {
  if (!R.on || R.rev || R.q.tol || (R.chain && R.chain.phase !== 'ask' && R.mode === 'chain' && R.kind === 'play')) return;
  if (isRight(R.q, parseNum(v))) right();
}
function submit() {
  if (!R.on) return;
  if (R.rev) return afterReveal();
  if (R.mode === 'chain' && R.kind === 'play') { const ph = R.chain.phase; if (ph === 'show') return chainStep(); if (ph === 'fb') return advance(); }
  const el = document.getElementById('rin'), v = parseNum(el ? el.value : '');
  if (Number.isNaN(v)) { if (R.q.tol || R.mode === 'chain') return; return miss(true); }
  if (isRight(R.q, v)) right(); else { if (el) el.classList.add('shake'); miss(false); }
}
/* Reveal: show the answer and a simpler way to compute it. Counts as a miss (lands in the review queue). */
function reveal() {
  if (!R.on || R.rev) return;
  if (R.mode === 'chain' && R.kind === 'play') { if (R.chain.phase !== 'ask') return; record(false); R.chain.phase = 'fb'; R.chain.ok = false; R.chain.revealed = true; render(); return; }
  record(false); R.rev = R.q; R.qEnd = 0;
  if (R.mode === 'trial' && R.kind === 'play') R.penalty += 5000;
  if (R.mode === 'survival' && R.kind === 'play') R.lives--;
  render();
}
function afterReveal() {
  R.rev = null; R.fb = null;
  if (R.mode === 'survival' && R.kind === 'play' && R.lives <= 0) return finish();
  if ((R.mode === 'sprint' || R.mode === 'survival') && R.kind === 'play') { R.wrong++; newTask(); render(); return; }
  advance();
}
function rechnenPad(k) {
  const el = document.getElementById('rin'); if (!el) return submit();
  if (k === 'ok') return submit();
  let v = el.value;
  if (k === 'bs') v = v.slice(0, -1); else if (k === '-') v = v.startsWith('-') ? v.slice(1) : '-' + v; else if (v.length < 14) v += k;
  el.value = v; el.focus(); rechnenInput(v);
}
function rechnenKey(e) {
  if (!R.on) return;
  if (e.key === 'Enter') { e.preventDefault(); submit(); }
  else if (e.key === 'Escape') finish();
}

/* ---------- clock ---------- */
function tick() {
  if (!R.on) { clearInterval(R.timer); return; }
  const now = Date.now(), clock = document.getElementById('rclock');
  if (R.mode === 'sprint' && R.kind === 'play') { const s = Math.ceil((R.end - now) / 1000); if (s <= 0) return finish(); if (clock) clock.textContent = '⏱ ' + s + ' s'; }
  else if (clock) clock.textContent = '⏱ ' + fmtSec(now - R.start + R.penalty);
  if (R.mode === 'chain' && R.kind === 'play' && R.chain.phase === 'show' && now >= R.chain.stepEnd) return chainStep();
  if (R.qEnd && R.kind === 'play' && !R.rev) {
    const bar = document.getElementById('rbar'), left = R.qEnd - now;
    if (bar) bar.style.width = Math.max(0, 100 * left / R.qLim) + '%';
    if (left <= 0) miss(true);
  }
}
const fmtSec = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' s';

/* ---------- end of round ---------- */
function finish() {
  if (!R.on) return; R.on = false; clearInterval(R.timer); RNG = Math.random;
  const rc = rcData(), mult = RC_MULT[R.d], cfg = { mode: R.mode, d: R.d, dur: R.dur, cat: R.cat };
  let xp = 0, score = R.n, best = false, label = R.n + ' richtig', extra = '';
  if (R.kind === 'trick') {
    const t = TRICKS.find(x => x.id === R.trick), all = R.n === R.total, first = all && !rc.tricks[t.id];
    if (all) rc.tricks[t.id] = (rc.tricks[t.id] || 0) + 1;
    xp = first ? 20 : R.n * 2; label = `${R.n} / ${R.total}`; extra = all ? (first ? 'Trick gelernt!' : 'Wieder sicher') : 'Für „gelernt“ braucht es alle 8';
  } else if (R.kind === 'review') { xp = R.n * 3; label = `${R.n} / ${R.total} gelöst`; extra = rc.review.length ? rc.review.length + ' noch offen' : 'Alle Fehler erledigt'; }
  else {
    const k = bestKey(cfg), old = rc.bests[k];
    if (R.mode === 'trial') {
      const ms = Date.now() - R.start + R.penalty; score = Math.round(ms / 100) / 10; label = fmtSec(ms); extra = R.n + ' / 20 richtig';
      if (R.done >= 20 && (old == null || score < old)) { rc.bests[k] = score; best = old != null; }
      xp = Math.round(R.n * 1.5 * mult);
    } else {
      if (old == null || score > old) { rc.bests[k] = score; best = old != null && score > 0; }
      xp = Math.round(score * (R.mode === 'chain' ? 6 : R.mode === 'estimate' ? 3 : 2) * mult);
      if (R.mode === 'chain') label = `${R.n} / 5 Ketten`; if (R.mode === 'estimate') label = `${R.n} / 12 Treffer`;
    }
    if (R.daily) {
      const dd = rc.daily;
      if (dd.date !== today()) {
        const y = new Date(); y.setDate(y.getDate() - 1); const yk = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
        dd.streak = dd.date === yk ? (dd.streak || 0) + 1 : 1; dd.date = today(); dd.score = score; dd.best = Math.max(dd.best || 0, score); xp = score * 3 + 10;
        extra = `Tages-Challenge · Serie ${dd.streak} 🔥`;
      } else extra = 'Heute schon gewertet: ' + dd.score + ' · das hier war Übung';
    }
  }
  xp = Math.max(2, xp); gain('rechnen', xp);
  R.result = { label, xp, best, extra, miss: R.miss.slice(0, 12), again: { kind: R.kind, trick: R.trick, daily: R.daily, rq: null } };
  render();
}

/* ---------- views ---------- */
const chip = (act, v, label, on) => `<button class="chip" data-act="${act}" data-v="${v}" aria-pressed="${on}">${esc(label)}</button>`;
function viewRechnen() {
  const rc = rcData();
  if (R.on) return viewPlay(rc);
  if (R.result) return viewResult(rc);
  return viewSetup(rc);
}
function viewSetup(rc) {
  const c = rc.cfg, best = rc.bests[bestKey(c)], catOn = !['chain', 'estimate'].includes(c.mode);
  const bestTxt = best == null ? 'Noch kein Bestwert für diese Einstellung' : 'Bestwert: ' + (c.mode === 'trial' ? fmt(best) + ' s' : best);
  const dd = rc.daily, doneToday = dd.date === today();
  const stats = Object.entries(rc.stats).filter(([k, s]) => s.n >= 3 && RC_CATS[k]).map(([k, s]) => ({ k, s, acc: s.ok / s.n, avg: s.ok ? s.ms / s.ok / 1000 : 99 }));
  const weak = stats.filter(x => RC_PICK.includes(x.k)).sort((a, b) => a.acc - b.acc || b.avg - a.avg)[0];
  return `${back}<h2>Kopfrechnen</h2>
  <section class="card">
    <span class="eyebrow">Modus</span><div class="chips">${Object.entries(RC_MODES).map(([k, m]) => chip('r-mode', k, m[0], c.mode === k)).join('')}</div>
    <p class="small muted" style="margin:0">${esc(RC_MODES[c.mode][1])}</p>
    <span class="eyebrow">Schwierigkeit</span><div class="chips">${RC_DIFF.map((n, i) => chip('r-diff', i, n, c.d === i)).join('')}</div>
    ${c.mode === 'sprint' ? `<span class="eyebrow">Länge</span><div class="chips">${RC_DUR.map(s => chip('r-dur', s, s < 60 ? s + ' s' : s / 60 + ' min', c.dur === s)).join('')}</div>` : ''}
    ${catOn ? `<span class="eyebrow">Rechenart</span><div class="chips">${RC_PICK.map(k => chip('r-cat', k, RC_SHORT[k], c.cat === k)).join('')}</div>` : ''}
    <p class="small muted" style="margin:0">${esc(bestTxt)} · Innerhalb der Runde wird es schwerer, solange du triffst.</p>
    <button class="btn primary big" data-act="r-go" id="rgo">Start</button>
  </section>
  <section class="card">
    <div class="row spread"><div style="display:grid;gap:2px"><span class="eyebrow">Jeden Tag neu</span><h3>Tages-Challenge</h3></div><span class="small muted mono">🔥 ${dd.date === today() || isYesterday(dd.date) ? dd.streak || 0 : 0} · Best ${dd.best || 0}</span></div>
    <p class="small muted" style="margin:0">60 Sekunden Mix auf Mittel, mit Steuer-Aufgaben. Gewertet wird der erste Versuch des Tages.</p>
    <button class="btn ${doneToday ? '' : 'primary'}" data-act="r-daily">${doneToday ? 'Heute: ' + dd.score + ' · nochmal üben' : 'Challenge starten · +10 XP Bonus'}</button>
  </section>
  <section class="card">
    <div class="row spread"><h3>Rechentricks</h3><span class="small muted mono">${TRICKS.filter(t => rc.tricks[t.id]).length}/${TRICKS.length} gelernt</span></div>
    <div class="chips">${TRICKS.map(t => `<button class="chip" data-act="r-trick" data-v="${t.id}">${rc.tricks[t.id] ? '✓ ' : ''}${esc(t.name)}</button>`).join('')}</div>
  </section>
  <section class="card">
    <div class="row spread"><h3>Fehler wiederholen</h3><span class="small muted mono">${rc.review.length} offen</span></div>
    <p class="small muted" style="margin:0">Falsch beantwortete und übersprungene Aufgaben landen hier, bis du sie einmal richtig hast.</p>
    <button class="btn" data-act="r-review" ${rc.review.length ? '' : 'disabled'}>${rc.review.length ? 'Bis zu 10 wiederholen' : 'Nichts offen'}</button>
  </section>
  <section class="card">
    <h3>Statistik</h3>
    ${stats.length ? `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:6px 14px;font-size:14px;align-items:center">
      <span class="small muted">Rechenart</span><span class="small muted">Treffer</span><span class="small muted">Ø Zeit</span><span class="small muted">Aufgaben</span>
      ${stats.sort((a, b) => b.s.n - a.s.n).map(x => `<span>${x === weak ? '<b>' + esc(RC_CATS[x.k]) + '</b> ·<span class="small muted"> schwächste</span>' : esc(RC_CATS[x.k])}</span><span class="mono">${Math.round(x.acc * 100)} %</span><span class="mono">${x.s.ok ? fmt(rnd(x.avg, 1)) + ' s' : '–'}</span><span class="mono muted">${x.s.n}</span>`).join('')}</div>
      ${weak ? `<button class="btn" data-act="r-weak" data-v="${weak.k}">Schwächste üben: ${esc(RC_CATS[weak.k])}</button>` : ''}` : '<p class="small muted" style="margin:0">Ab drei Aufgaben pro Rechenart siehst du hier Trefferquote und Tempo.</p>'}
  </section>
  <div class="row"><button class="chip" data-act="r-pad" aria-pressed="${rc.pad}">Ziffernblock am Bildschirm</button></div>`;
}
function isYesterday(k) { if (!k) return false; const y = new Date(); y.setDate(y.getDate() - 1); return k === y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); }
function padHTML(rc, ask) {
  if (!rc.pad || !ask) return '';
  const k = (v, l, cls) => `<button class="pk ${cls || ''}" data-pad="${v}" aria-label="${esc(l)}">${esc(l)}</button>`;
  return `<div class="pad">${['7', '8', '9'].map(d => k(d, d)).join('')}${k('bs', '⌫', 'fn')}${['4', '5', '6'].map(d => k(d, d)).join('')}${k('-', '±', 'fn')}${['1', '2', '3'].map(d => k(d, d)).join('')}${k(',', ',', 'fn')}${k('0', '0', 'wide')}${k('ok', '✓', 'ok wide')}</div>`;
}
function viewPlay(rc) {
  const q = R.q, kindLbl = R.kind === 'trick' ? TRICKS.find(t => t.id === R.trick).name : R.kind === 'review' ? 'Fehler wiederholen' : R.daily ? 'Tages-Challenge' : RC_MODES[R.mode][0];
  const lvl = R.kind === 'play' && R.mode !== 'chain' ? ` · ${RC_DIFF[R.d]}${R.s ? ' +' + R.s : ''}` : '';
  const prog = R.total ? `${Math.min(R.done + 1, R.total)} / ${R.total}` : `${R.n} richtig`;
  const lives = R.mode === 'survival' && R.kind === 'play' ? ' · ' + '♥'.repeat(R.lives) + '♡'.repeat(3 - R.lives) : '';
  const clock = (R.mode === 'sprint' && R.kind === 'play') ? '⏱ ' + Math.max(0, Math.ceil((R.end - Date.now()) / 1000)) + ' s' : '⏱ ' + fmtSec(Date.now() - R.start + R.penalty);
  const top = `<div class="topbar"><button class="link" data-act="r-quit">← Beenden</button><button class="link" data-act="sound">${G.sound === false ? '🔇' : '🔊'}</button></div>
    <div class="row spread"><span class="mono" id="rclock">${clock}</span><span class="mono small">${esc(kindLbl + lvl)} · ${prog}${lives}</span></div>`;
  const bar = R.qEnd && R.kind === 'play' ? `<div class="bar gold"><i id="rbar" style="width:${Math.max(0, 100 * (R.qEnd - Date.now()) / R.qLim)}%"></i></div>` : '';
  const fb = R.fb ? `<div class="expl small" style="border-left:0"><b style="color:var(--rec)">${R.fb.skip ? 'Übersprungen' : 'Daneben'}:</b> ${esc(R.fb.t.replace(' ≈ ?', ''))} = <b>${esc(fmt(rnd(R.fb.a, 2)))}</b>${R.fb.x ? ' · ' + esc(R.fb.x) : ''}</div>` : '';
  const trick = R.kind === 'trick' ? (t => `<div class="fact"><b>Trick</b><span>${esc(t.rule)}<br><span class="small muted">${esc(t.ex)}</span></span></div>`)(TRICKS.find(t => t.id === R.trick)) : '';
  if (R.mode === 'chain' && R.kind === 'play') {
    const ch = R.chain;
    if (ch.phase === 'show') return `${top}<div class="progress">${[-1, ...ch.ops.map((_, i) => i)].map(i => `<i class="${i < ch.i ? 'ok' : i === ch.i ? 'cur' : ''}"></i>`).join('')}</div>
      <span class="eyebrow" style="text-align:center">${ch.i < 0 ? 'Startzahl' : 'Schritt ' + (ch.i + 1) + ' von ' + ch.ops.length}</span>
      <div class="sum" style="padding:34px 0;font-size:64px">${esc(ch.i < 0 ? fmt(ch.startV) : opText(ch.ops[ch.i]))}</div>
      <button class="btn" data-act="r-step">Weiter (Enter)</button>`;
    if (ch.phase === 'fb') return `${top}<section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">${ch.ok ? '✓ Richtig' : '✗ Daneben'}</span>
      <div class="sum" style="font-size:34px">${esc(fmt(ch.res))}</div>
      <ol class="way" style="text-align:left;justify-self:stretch">${R.q.w.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
      <button class="btn primary big" data-act="r-step" id="rgo">${R.done + 1 >= R.total ? 'Ergebnis' : 'Nächste Kette'}</button>`;
    return `${top}<span class="eyebrow" style="text-align:center">Kette ${R.done + 1} von 5</span><div class="sum" style="padding:24px 0">Ergebnis?</div>
      <input class="numin" id="rin" inputmode="${rc.pad ? 'none' : 'decimal'}" autocomplete="off" aria-label="Ergebnis">${padHTML(rc, true)}
      <div class="row" style="justify-content:flex-end"><button class="link" data-act="r-reveal">Aufdecken</button></div>`;
  }
  const long = q.t.length > 24;
  const exact = !q.tol;
  if (R.rev) return `${top}${trick}
    <div class="sum" style="padding:${long ? '14px 0' : '20px 0'};${long ? 'font-size:24px;line-height:1.25' : 'font-size:36px'}">${esc(q.t)}${q.t.includes('?') ? '' : ' = ?'}</div>
    <section class="card"><span class="eyebrow">Lösung</span><div class="sum" style="text-align:left;font-size:34px">${esc(fmt(rnd(q.a, q.tol ? 2 : 6)))}</div>
      ${q.w && q.w.length ? `<span class="eyebrow">So geht's im Kopf</span><ol class="way">${q.w.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
      ${q.x ? `<p class="small muted" style="margin:0">${esc(q.x)}</p>` : ''}</section>
    <button class="btn primary big" data-act="r-next" id="rgo">Weiter (Enter)</button>`;
  return `${top}${bar}${trick}${fb}
    <div class="sum" style="padding:${long ? '18px 0' : '26px 0'};${long ? 'font-size:26px;line-height:1.25' : ''}">${esc(q.t)}${q.t.includes('?') ? '' : ' = ?'}</div>
    <input class="numin" id="rin" inputmode="${rc.pad ? 'none' : 'decimal'}" autocomplete="off" aria-label="Ergebnis">
    ${padHTML(rc, true)}
    <div class="row spread"><span class="hint">${exact ? 'Richtige Antworten werden sofort erkannt.' : 'Mit ✓ oder Enter bestätigen.'}</span><span class="row" style="gap:14px"><button class="link" data-act="r-reveal">Aufdecken</button>${exact ? '<button class="link" data-act="r-skip">Überspringen</button>' : ''}</span></div>`;
}
function viewResult(rc) {
  const r = R.result;
  return `${back}<h2>Kopfrechnen</h2>
  <section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">Ergebnis</span><div class="sum">${esc(r.label)}</div>
    <p class="muted" style="margin:0">${r.best ? 'Neuer Bestwert! · ' : ''}+${r.xp} XP${r.extra ? ' · ' + esc(r.extra) : ''}</p>
    <div class="row" style="gap:8px;width:100%"><button class="btn primary grow" data-act="r-again" id="rgo">Nochmal</button><button class="btn grow" data-act="r-setup">Einstellungen</button></div></section>
  ${r.miss.length ? `<section class="card"><h3>Das waren die Knackpunkte</h3><p class="small muted" style="margin:0">Sie kommen unter „Fehler wiederholen“ wieder.</p>
    ${r.miss.map(m => `<div style="display:grid;gap:2px"><span><b>${esc(m.t.replace(' ≈ ?', ''))}</b> = ${esc(m.c === 'chain' ? fmt(m.a) : fmt(rnd(m.a, 2)))}</span>${m.w && m.w.length && m.c !== 'chain' ? `<span class="small muted">${esc(m.w.join('  →  '))}</span>` : m.x ? `<span class="small muted">${esc(m.x)}</span>` : ''}</div>`).join('')}</section>` : ''}`;
}

/* ---------- actions ---------- */
function rechnenAct(a, v) {
  const rc = rcData(), c = rc.cfg;
  if (a === 'r-mode') { c.mode = v; save(); render(); }
  else if (a === 'r-diff') { c.d = +v; save(); render(); }
  else if (a === 'r-dur') { c.dur = +v; save(); render(); }
  else if (a === 'r-cat') { c.cat = v; save(); render(); }
  else if (a === 'r-pad') { rc.pad = !rc.pad; save(); render(); }
  else if (a === 'r-go') start();
  else if (a === 'r-daily') start({ mode: 'sprint', d: 1, dur: 60, cat: 'mix', daily: true });
  else if (a === 'r-trick') start({ kind: 'trick', trick: v, mode: 'trial', d: 1 });
  else if (a === 'r-review') start({ kind: 'review', mode: 'trial', rq: shuffle(rc.review).slice(0, 10) });
  else if (a === 'r-weak') start({ mode: 'sprint', dur: 60, cat: v });
  else if (a === 'r-skip') { if (R.on && !R.rev) miss(true); }
  else if (a === 'r-reveal') reveal();
  else if (a === 'r-next') { if (R.rev) afterReveal(); }
  else if (a === 'r-step') submit();
  else if (a === 'r-quit') finish();
  else if (a === 'r-setup') { R.result = null; render(); }
  else if (a === 'r-again') {
    const g = R.result && R.result.again; R.result = null;
    if (!g) return render();
    if (g.kind === 'trick') start({ kind: 'trick', trick: g.trick, mode: 'trial', d: 1 });
    else if (g.kind === 'review') { if (rc.review.length) start({ kind: 'review', mode: 'trial', rq: shuffle(rc.review).slice(0, 10) }); else render(); }
    else if (g.daily) start({ mode: 'sprint', d: 1, dur: 60, cat: 'mix', daily: true });
    else start();
  }
}
function rechnenMeta() {
  const rc = rcData(), dd = rc.daily;
  return dd.date === today() ? `Tages-Challenge ✓ ${dd.score} · Serie ${dd.streak}` : `Tages-Challenge offen${dd.streak && isYesterday(dd.date) ? ' · Serie ' + dd.streak : ''}`;
}
