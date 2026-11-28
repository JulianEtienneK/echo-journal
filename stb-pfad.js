/* Echo · StB-Pfad: a year-long red thread towards the Steuerberaterprüfung, 20–30 minutes a day.
   Built on the learning methods with the best evidence:
   retrieval before rereading, spaced repetition with growing intervals, successive relearning (a missed card returns in the same session until it is right once),
   interleaving (reviews and case training mix topics), worked examples that fade into self-solved steps, a question before each lesson (pretesting),
   self-explanation in own words, typed paragraph answers (generation), and confidence ratings to calibrate the feeling of knowing.
   Storage 'echo-stbpfad' = { done: {lessonId: day}, cards: {cardId: {b, due, n, lapses, last}}, days: {day: {sec, rev, act}}, boss: {moduleId: day},
     notes: {lessonId: text}, cal: {n, hit, over}, caseLast: {lessonId: day}, updated }.
   Card ids: '<lessonId>:c<i>' (free recall) and '<lessonId>:n<i>' (paragraph navigation, typed and checked). */
'use strict';
const app = document.getElementById('app');
if (!document.getElementById('trk-css')) { const st = document.createElement('style'); st.id = 'trk-css'; st.textContent = '.tri{display:flex;height:10px;border-radius:6px;overflow:hidden;background:var(--line)}.tri i{display:block;min-width:0}.btn.why{font-size:14px;padding:8px 12px;opacity:.9}'; document.head.appendChild(st); }
const D = window.STB_PFAD;
const CFG = Object.assign({ key: 'echo-stbpfad', title: '⚖️ StB-Pfad', short: 'StB-Pfad', back: 'index.html#games', backLabel: 'Spiele', xp: 'stbpfad', src: 'stb',
  dayMin: 30, extraCard: true, askTopic: 'Steuerrecht allgemein', sys: null, exam: null, examLabel: '', note: null, progress: null }, window.PFAD_CFG || {});
const P = Object.assign({ done: {}, cards: {}, days: {}, boss: {}, notes: {}, cal: { n: 0, hit: 0, over: 0 }, caseLast: {}, qa: [], qcards: {} }, LS.get(CFG.key, {}));
const save = () => {
  const ms = D.ROADMAP.filter(m => (D.LESSONS[m.id] || []).length), cur = ms.find(m => D.LESSONS[m.id].some(l => !P.done[l.id])) || ms[ms.length - 1];
  const ls = D.LESSONS[cur.id], n = ls.filter(l => P.done[l.id]).length;
  P.meta = { mod: D.ROADMAP.indexOf(cur) + 1, mods: D.ROADMAP.length, name: cur.n, lesson: Math.min(n + 1, ls.length), of: ls.length, done: Object.keys(P.done).length, total: ms.reduce((a, m) => a + D.LESSONS[m.id].length, 0) };
  P.updated = Date.now(); LS.set(CFG.key, P);
};
const LADDER = [1, 3, 7, 16, 35, 90, 180];
const MASTER = 3; // box 3 = the card survived a gap of a week or more
const LESSONS = []; for (const m of D.ROADMAP) for (const l of (D.LESSONS[m.id] || [])) LESSONS.push(Object.assign({ mod: m.id }, l));
const LBY = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const doneL = () => LESSONS.filter(l => P.done[l.id]);
for (const l of LESSONS) if (P.done[l.id]) for (const id of l.cards.map((_, i) => l.id + ':c' + i)) if (!P.cards[id]) P.cards[id] = { b: 0, due: new Date().toISOString().slice(0, 10), n: 0, lapses: 0 };

/* ---------- cards ---------- */
function cardDef(id) {
  const [lid, k] = id.split(':'), l = LBY[lid]; if (!l) return null;
  const i = +k.slice(1);
  if (k[0] === 'q') { const c = (P.qcards || {})[id]; return c && { id, lid, type: 'recall', q: c.q, a: c.a, own: true }; }
  if (k[0] === 'c') { const c = l.cards[i]; return c && { id, lid, type: 'recall', q: c[0], a: c[1] }; }
  if (!CFG.navReview) return null; // Fundstellen werden nachgeschlagen, nicht auswendig gelernt (in der StB-Prüfung liegt das Gesetz offen)
  const n = (l.nav || [])[i]; return n && { id, lid, type: 'nav', q: n[0], a: n[1] };
}
const lessonCards = l => [...l.cards.map((_, i) => l.id + ':c' + i), ...(CFG.navReview ? (l.nav || []).map((_, i) => l.id + ':n' + i) : [])];
const dueIds = () => Object.entries(P.cards).filter(([id, c]) => c.due <= today() && cardDef(id)).map(([id]) => id);
const mastered = () => Object.values(P.cards).filter(c => c.b >= MASTER).length;
// interleave: round-robin over lessons, so two cards of the same topic rarely follow each other
function interleave(ids) {
  const g = {}; for (const id of shuffle(ids)) (g[id.split(':')[0]] = g[id.split(':')[0]] || []).push(id);
  const lists = shuffle(Object.values(g)), out = [];
  while (lists.some(x => x.length)) for (const x of lists) if (x.length) out.push(x.shift());
  return out;
}
function rate(id, r, retry) {
  const c = P.cards[id] || (P.cards[id] = { b: 0, due: today(), n: 0, lapses: 0 });
  c.n++; c.last = today();
  if (retry) { if (r === 0) c.due = addDays(1); return; } // a relearning round never pushes the card further out
  if (r === 0) { c.b = 0; c.lapses++; c.due = addDays(1); }
  else if (r === 1) c.due = addDays(Math.max(1, Math.round(LADDER[c.b] / 2)));
  else { c.b = Math.min(c.b + 1, LADDER.length - 1); c.due = addDays(LADDER[c.b]); }
}
// pull a lesson's cards forward after a mistake in a case
function refresh(lid) { const l = LBY[lid]; if (!l) return; for (const id of lessonCards(l)) { const c = P.cards[id]; if (c && c.due > addDays(1)) { c.due = addDays(1); c.b = Math.max(0, c.b - 1); } } }

/* ---------- knowledge tracking: every rated step, card, drill and exam task lands in P.log ----------
   P.log = { key: { t: title, lid, k: kind ('step'|'card'|'drill'|'exam'), n, ok, part, miss, last, h: last results (0/1/2) } }.
   A step rated "nicht gewusst" or "teilweise" becomes its own review card (P.qcards, linked through P.stepCard[key]). */
const KIND = { step: 'Fallschritte', card: 'Karten', drill: 'Rechenaufgaben', exam: 'Klausuraufgaben' };
function track(key, r, info) {
  const L = P.log || (P.log = {}), x = L[key] || (L[key] = { n: 0, ok: 0, part: 0, miss: 0, h: [] });
  Object.assign(x, info || {}); x.n++; x.last = today(); x[r === 2 ? 'ok' : r === 1 ? 'part' : 'miss']++; x.h = [...(x.h || []), r].slice(-6);
  const d = P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 }); d.tr = d.tr || [0, 0, 0]; d.tr[r]++;
}
// a step you did not know becomes a review card; a known step pushes an existing step card further out
function stepCard(key, lid, q, a, r) {
  const m = P.stepCard || (P.stepCard = {}); let id = m[key];
  if (id && !P.cards[id]) id = null;
  if (!id) { if (r === 2) return; id = m[key] = (lid && LBY[lid] ? lid : (LESSONS[0] || {}).id || 'x') + ':q' + uid(); (P.qcards || (P.qcards = {}))[id] = { q, a, d: today(), step: key }; P.cards[id] = { b: 0, due: addDays(1), n: 0, lapses: 0, last: today() }; return; }
  rate(id, r);
}
const R3 = (act, extra = '') => `<div class="rate"><button class="btn" data-act="${act}" data-v="0"${extra}>Nicht gewusst</button><button class="btn" data-act="${act}" data-v="1"${extra}>Teilweise</button><button class="btn primary" data-act="${act}" data-v="2"${extra}>Gewusst</button></div>`;
const whyBtn = () => `<button class="btn why" data-act="why">🤔 Warum so? Tiefer erklärt</button>`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
function knowStats() {
  const L = P.log || {}, by = {}, lessons = {};
  for (const [k, x] of Object.entries(L)) {
    const g = by[x.k || 'step'] || (by[x.k || 'step'] = { n: 0, ok: 0, part: 0, miss: 0 }); for (const f of ['n', 'ok', 'part', 'miss']) g[f] += x[f] || 0;
    if (x.lid && LBY[x.lid]) { const y = lessons[x.lid] || (lessons[x.lid] = { n: 0, score: 0, miss: 0 }); y.n += x.n; y.score += (x.ok || 0) * 2 + (x.part || 0); y.miss += x.miss || 0; }
  }
  // free-recall cards count with their lapses
  for (const [id, c] of Object.entries(P.cards)) { const lid = id.split(':')[0]; if (!LBY[lid] || !c.n) continue; const y = lessons[lid] || (lessons[lid] = { n: 0, score: 0, miss: 0 }); y.n += c.n; y.score += Math.max(0, c.n - (c.lapses || 0)) * 2; y.miss += c.lapses || 0; }
  const ls = Object.entries(lessons).map(([lid, y]) => ({ l: LBY[lid], q: y.score / (2 * y.n), n: y.n, miss: y.miss })).filter(x => x.n >= 2);
  return { by, weak: ls.filter(x => x.q < 0.8).sort((a, b) => a.q - b.q).slice(0, 6), strong: ls.filter(x => x.q >= 0.8).length, all: ls.length };
}
function knowCard() {
  const k = knowStats(), tot = Object.values(k.by).reduce((a, g) => ({ n: a.n + g.n, ok: a.ok + g.ok, part: a.part + g.part, miss: a.miss + g.miss }), { n: 0, ok: 0, part: 0, miss: 0 });
  if (!tot.n) return '';
  const bar = g => `<div class="tri"><i style="flex:${g.ok};background:var(--calm)"></i><i style="flex:${g.part};background:var(--gold)"></i><i style="flex:${g.miss};background:var(--muted)"></i></div>`;
  return `<a class="card" href="#wissen" style="text-decoration:none;color:inherit"><div class="row spread"><h3>📊 Wissensstand</h3><span class="small muted">${pct(tot.ok, tot.n)} % gewusst</span></div>${bar(tot)}
    <span class="small muted">${tot.n} Mal bewertet · ${tot.ok} gewusst · ${tot.part} teilweise · ${tot.miss} nicht gewusst${k.weak.length ? ' · wackelt: ' + esc(k.weak.slice(0, 2).map(x => x.l.t).join(', ')) : ''}</span></a>`;
}
function viewKnow() {
  const k = knowStats(), L = P.log || {};
  const bar = g => `<div class="tri"><i style="flex:${g.ok || 0};background:var(--calm)"></i><i style="flex:${g.part || 0};background:var(--gold)"></i><i style="flex:${g.miss || 0};background:var(--muted)"></i></div>`;
  const recent = Object.entries(L).filter(([, x]) => x.miss || x.part).sort((a, b) => (b[1].last || '').localeCompare(a[1].last || '') || (b[1].miss - a[1].miss)).slice(0, 25);
  const days = Object.entries(P.days).filter(([, d]) => d.tr).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  return `<div class="topbar"><a class="link" href="#">← ${esc(CFG.short)}</a></div>
  <header class="stack" style="gap:4px"><h1>📊 Wissensstand</h1><span class="small muted">Was du nach dem Aufdecken selbst bewertet hast, plus Rechentrainer und Probeklausuren. Grün gewusst, gelb teilweise, grau nicht gewusst.</span></header>
  <section class="card">${Object.entries(k.by).map(([kind, g]) => `<div class="stack" style="gap:4px"><div class="row spread"><b class="small">${KIND[kind] || kind}</b><span class="small muted">${pct(g.ok, g.n)} % · ${g.n}×</span></div>${bar(g)}</div>`).join('')}
    <span class="small muted">${k.strong} von ${k.all} bewerteten Lektionen sitzen (mindestens 80 %).</span></section>
  ${k.weak.length ? `<section class="card"><h3>Wo es hakt</h3>${k.weak.map(x => `<a class="row spread" href="#l-${x.l.id}" style="text-decoration:none;color:inherit"><span class="small">${esc(x.l.t)}</span><span class="small muted mono">${Math.round(x.q * 100)} %</span></a>`).join('')}<span class="small muted">Antippen zum Nachlesen. Nicht gewusste Schritte kommen ohnehin als Karten wieder.</span></section>` : ''}
  ${recent.length ? `<section class="card"><h3>Zuletzt nicht oder halb gewusst</h3>${recent.map(([, x]) => `<div class="stack" style="gap:2px"><span class="small">${mf(String(x.t || '').slice(0, 160))}</span><span class="small muted">${KIND[x.k] || ''} · ${x.h.map(r => ['✗', '½', '✓'][r]).join(' ')} · zuletzt ${x.last}</span></div>`).join('')}</section>` : ''}
  ${days.length ? `<section class="card"><h3>Letzte Tage</h3>${days.map(([d, x]) => `<div class="row spread"><span class="small mono">${d.slice(5)}</span><span class="small muted">✓ ${x.tr[2]} · ½ ${x.tr[1]} · ✗ ${x.tr[0]}</span></div>`).join('')}</section>` : ''}`;
}

/* ---------- paragraph check: law name plus the chain of numbers ---------- */
const LAWS = /(estg|esth|estr|lstdv|ao|kstg|gewstg|ustg|hgb|bewg|erbstg|stberg)/;
function normParts(s) {
  s = String(s).toLowerCase().replace(/[§.,]/g, ' ').replace(/buchst\s*([a-z])\b/g, ' b$1 ');
  const law = (s.match(LAWS) || [])[1] || null, pre = /\bh\s+\d/.test(s) ? 'h' : /\br\s+\d/.test(s) ? 'r' : '';
  const nums = (s.replace(LAWS, ' ').match(/\b(?:\d+[a-z]?|b[a-z])\b/g) || []);
  return { law, nums: nums.join('-'), first: nums[0] || '', pre };
}
function checkNorm(given, want) {
  const g = normParts(given), w = normParts(want);
  if (!g.first) return 0;
  const lawOk = !g.law || g.law === w.law;
  if (lawOk && g.nums === w.nums) return 2;
  if (lawOk && g.first === w.first) return 1;
  return 0;
}

/* ---------- time, streak, rank ---------- */
/* live session clock: runs while a session is open and the page is visible; pauses after 3 minutes without any input
   (reading counts, walking away does not); stops when you leave the session. Seconds go into P.days[day].sec. */
let lastInput = Date.now(), CLK = null, RESET = false, DR = null, EX = null;
function tick() { lastInput = Date.now(); }
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, tick, { passive: true }));
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function clock() {
  const on = SS || DR || EX;
  if (on && !CLK) {
    const el = document.createElement('div'); el.id = 'clk';
    el.style.cssText = 'position:fixed;bottom:calc(12px + env(safe-area-inset-bottom));left:12px;z-index:50;background:var(--surface);border:2px solid var(--calm);border-radius:99px;padding:6px 12px;font:600 14px var(--f-mono);box-shadow:0 4px 16px rgba(0,0,0,.15)';
    document.body.appendChild(el);
    CLK = { el, sec: 0, iv: setInterval(() => {
      const idle = Date.now() - lastInput > 180000, hidden = document.visibilityState !== 'visible';
      const shared = CFG.key && CFG.key.startsWith('echo-wiwi-') && (((LS.get('echo-wiwi-free', {}) || {}).run || {}).nr === CFG.short);
      if (!idle && !hidden && !shared) { CLK.sec++; const d = P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 }); d.sec = (d.sec || 0) + 1; if (CLK.sec % 15 === 0) save(); }
      const tm = minToday();
      CLK.el.innerHTML = `${idle || hidden ? '⏸' : '⏱'} ${mmss(CLK.sec)} <span style="color:var(--muted);font-weight:500">· heute ${tm}/${CFG.dayMin}</span>`;
      CLK.el.style.borderColor = tm >= CFG.dayMin ? 'var(--gold)' : 'var(--calm)';
    }, 1000) };
    CLK.el.innerHTML = `⏱ 0:00 <span style="color:var(--muted);font-weight:500">· heute ${minToday()}/${CFG.dayMin}</span>`;
  } else if (!on && CLK) {
    clearInterval(CLK.iv); CLK.el.remove(); const s = CLK.sec; CLK = null; save();
    if (s >= 30) toast(`Session: ${mmss(s)} · heute ${minToday()} min`);
  }
}
const act = () => { (P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 })).act = true; };
function streak() { let n = 0, k = today(); if (!(P.days[k] || {}).act) k = addDays(-1); while ((P.days[k] || {}).act) { n++; k = addDays(-1, new Date(k + 'T12:00')); } return n; }
const minToday = () => Math.round(((P.days[today()] || {}).sec || 0) / 60);
const hoursTotal = () => Object.values(P.days).reduce((a, d) => a + (d.sec || 0), 0) / 3600;
const weekMin = () => { let s = 0; for (let i = 0; i < 7; i++) s += ((P.days[addDays(-i)] || {}).sec || 0); return Math.round(s / 60); };
function rank() { const m = mastered(); let r = D.RANKS[0]; for (const x of D.RANKS) if (m >= x[0]) r = x; const nx = D.RANKS.find(x => x[0] > m); return { name: r[1], m, next: nx }; }
const nextLesson = () => LESSONS.find(l => !P.done[l.id]);
// a new lesson every other day: the day in between belongs to reviews and a case (spacing beats speed)
function lessonDay() {
  const ds = Object.values(P.done); if (ds.includes(today())) return false;
  if (CFG.exam) { const left = LESSONS.filter(l => !P.done[l.id]).length, days = Math.round((new Date(CFG.exam + 'T12:00') - new Date(today() + 'T12:00')) / 864e5); if (left > (days - 21) / 2) return true; }
  return !ds.includes(addDays(-1));
}
const examDays = () => CFG.exam ? Math.round((new Date(CFG.exam + 'T12:00') - new Date(today() + 'T12:00')) / 864e5) : null;

/* ---------- small UI pieces ---------- */
const back = h => `<a class="link" href="${h}">← ${h === CFG.back ? esc(CFG.backLabel) : esc(CFG.short)}</a>`;
const norms = l => l.norms.map(n => `<span class="norm">${esc(n)}</span>`).join(' ');
const phase = (n, cur) => `<div class="phase">${Array.from({ length: n }, (_, i) => `<i class="${i < cur ? 'on' : i === cur ? 'cur' : ''}"></i>`).join('')}</div>`;
const rateBtns = () => `<div class="rate"><button class="btn" data-act="rate" data-v="0">Nicht gewusst</button><button class="btn" data-act="rate" data-v="1">Mit Mühe</button><button class="btn primary" data-act="rate" data-v="2">Gewusst</button></div>`;

/* ---------- session state (memory only) ---------- */
let SS = null;
function startToday() {
  const due = interleave(dueIds()).slice(0, 40);
  SS = { kind: 'today', queue: due.map(id => ({ id })), total: due.length, i: 0, shown: false, conf: null, typed: '', xp: 0 };
  SS.stage = due.length ? 'review' : 'plan';
  location.hash = 'heute'; render();
}
function afterReviews() {
  SS.stage = 'plan'; render();
}
function startLesson(l) {
  SS = Object.assign(SS || { kind: 'today', xp: 0 }, { stage: 'lesson', L: l, k: 0, pre: '', step: 0, guess: '', mine: {}, navI: 0, navGiven: '', navRes: null, note: P.notes[l.id] || '', linkShown: false, recall: null });
  location.hash = 'heute'; render();
}

/* ---------- views ---------- */
function viewHome() {
  const r = rank(), due = dueIds().length, nl = nextLesson(), dl = doneL(), st = streak(), m0 = D.ROADMAP.find(m => (D.LESSONS[m.id] || []).some(l => !P.done[l.id])) || D.ROADMAP[0];
  const plan = due ? `${due} Karte${due === 1 ? '' : 'n'} fällig` : 'Keine Karte fällig';
  const todayL = nl && lessonDay() ? `Neue Lektion: ${esc(nl.t)}` : nl ? 'Heute: Wiederholen und ein Fall (neue Lektion morgen)' : 'Alle verfügbaren Lektionen gelernt';
  const sec = (P.days[today()] || {}).sec || 0;
  const h = hoursTotal(), cal = P.cal.n >= 5 ? Math.round(P.cal.hit / P.cal.n * 100) + ' %' : '–';
  const bosses = D.ROADMAP.filter(m => D.BOSS[m.id] && (D.LESSONS[m.id] || []).length && D.LESSONS[m.id].every(l => P.done[l.id])).sort((a, b) => !!P.boss[a.id] - !!P.boss[b.id]);
  const modRow = m => { const ls = D.LESSONS[m.id] || [], n = ls.filter(l => P.done[l.id]).length, cur = m.id === m0.id;
    return `<div class="mod${ls.length ? '' : ' lock'}"><span class="big">${m.em}</span><div class="stack" style="gap:0;min-width:0"><b>${esc(m.n)}</b><span class="small muted">${m.w ? 'Woche ' + m.w + ' · ' : ''}${esc(m.goal)}</span>${!cur && ls.length ? `<details style="margin-top:4px"><summary class="small muted">${ls.length} Lektionen ansehen</summary><div class="stack" style="gap:2px;margin-top:6px">${ls.map((l, i) => `<a class="small" href="#l-${l.id}" style="color:${P.done[l.id] ? 'var(--ink)' : 'var(--muted)'};text-decoration:none">${P.done[l.id] ? '✓' : '○'} ${i + 1}. ${esc(l.t)}</a>`).join('')}</div></details>` : ''}${cur && ls.length ? `<div class="stack" style="gap:2px;margin-top:6px">${ls.map((l, i) => `<a class="small" href="#l-${l.id}" style="color:${P.done[l.id] ? 'var(--ink)' : 'var(--muted)'};text-decoration:none">${P.done[l.id] ? '✓' : '○'} ${i + 1}. ${esc(l.t)}</a>`).join('')}${D.BOSS[m.id] ? `<span class="small" style="color:${P.boss[m.id] ? 'var(--ink)' : 'var(--muted)'}">${P.boss[m.id] ? '🏆' : '🔒'} Abschlussfall: ${esc(D.BOSS[m.id].t)}</span>` : ''}</div>` : ''}</div><span class="mono small muted">${ls.length ? n + '/' + ls.length : 'bald'}</span></div>`; };
  return `<div class="topbar">${back(CFG.back)}<button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button></div>
  <header class="stack" style="gap:4px"><span class="eyebrow">${esc(r.name)}${r.next ? ' · nächster Rang bei ' + r.next[0] + ' sicheren Karten' : ''}</span><h1>${CFG.title}</h1>${CFG.exam ? `<span class="small" style="color:var(--gold)">📅 ${esc(CFG.examLabel)} in ${examDays()} Tagen</span>` : ''}</header>
  <section class="card" style="border:2px solid var(--calm)"><div class="row spread"><h3>Heute</h3><span class="mono" style="font-size:20px;font-weight:600">⏱ ${mmss(sec)}</span></div>
    <span>${plan} · ${todayL}</span>
    <div class="bar"><i style="width:${Math.min(100, Math.round(sec / (CFG.dayMin * 60) * 100))}%"></i></div><div class="row spread"><span class="small muted">${mmss(sec)} von ${CFG.dayMin}:00 heute${sec >= CFG.dayMin * 60 ? ' ✓' : ''}</span>${sec ? `<button class="link small" data-act="resetday" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--muted)">${RESET ? 'Wirklich auf 0:00?' : '↺ Zeit zurücksetzen'}</button>` : ''}</div>
    <button class="btn primary big" data-act="today">${minToday() ? 'Weitermachen' : 'Starten'}</button></section>
  <section class="card"><div class="row" style="justify-content:space-around;text-align:center">
    <div class="stack" style="gap:0"><b style="font-size:24px">🔥 ${st}</b><span class="small muted">Tage am Stück</span></div>
    <div class="stack" style="gap:0"><b style="font-size:24px">${mastered()}</b><span class="small muted">Karten sitzen</span></div>
    <div class="stack" style="gap:0"><b style="font-size:24px">${cal}</b><span class="small muted">„Sicher“ und richtig</span></div></div>
    <div class="stack" style="gap:4px"><div class="row spread">${(() => { const pr = CFG.progress ? CFG.progress() : { label: 'Jahresziel', text: h.toFixed(1) + ' / 180 h · ' + weekMin() + ' min diese Woche', pct: h / 180 }; return `<span class="small">${esc(pr.label)}</span><span class="small muted mono">${esc(pr.text)}</span></div><div class="bar gold"><i style="width:${Math.min(100, pr.pct * 100)}%"></i></div>`; })()}</div></section>
  ${dl.length >= 2 ? `<a class="card" href="#fall" style="text-decoration:none;color:inherit"><div class="row"><span class="big">🧩</span><div class="stack grow" style="gap:0"><h3>Fall-Training</h3><span class="small muted">Gemischter Fall: erst erkennen, welches Thema greift, dann selbst lösen</span></div></div></a>` : ''}
  ${bosses.map(m => `<a class="card" href="#boss-${m.id}" style="text-decoration:none;color:inherit;${P.boss[m.id] ? '' : 'border:2px solid var(--gold)'}"><div class="row"><span class="big">${P.boss[m.id] ? '🏆' : '👹'}</span><div class="stack grow" style="gap:0"><h3>Abschlussfall: ${esc(D.BOSS[m.id].t)}</h3><span class="small muted">${esc(m.n)} · ${P.boss[m.id] ? 'bestanden, jederzeit wiederholbar' : 'alle Lektionen des Moduls in einem Fall'}</span></div></div></a>`).join('')}
  ${knowCard()}
  ${P.qa.length ? `<a class="card" href="#fragen" style="text-decoration:none;color:inherit"><div class="row"><span class="big">❓</span><div class="stack grow" style="gap:0"><h3>Deine Fragen</h3><span class="small muted">${P.qa.length} gestellt · zuletzt: ${esc(P.qa[P.qa.length - 1].q.slice(0, 70))}</span></div></div></a>` : ''}
  <section class="card"><h3>Der rote Faden</h3>${D.ROADMAP.map(modRow).join('')}</section>
  <section class="card"><h3>Ränge</h3><div class="stack" style="gap:2px">${D.RANKS.map(x => `<span class="small" style="color:${r.m >= x[0] ? 'var(--ink)' : 'var(--muted)'}">${r.m >= x[0] ? '●' : '○'} ${esc(x[1])} <span class="muted">· ab ${x[0]} sicheren Karten</span></span>`).join('')}</div><span class="small muted">„Sicher“ heißt: Die Karte wurde nach einer Pause von mindestens einer Woche noch gewusst. Nur das zählt, nicht wie oft du sie gesehen hast.</span></section>
  <details class="card"><summary>Warum dieser Ablauf?</summary><div class="stack small" style="gap:6px;line-height:1.5;margin-top:8px">
    <span><b>Abrufen vor Nachlesen.</b> Jede Einheit beginnt mit Fragen. Sich erinnern festigt Wissen stärker als erneutes Lesen.</span>
    <span><b>Wachsende Abstände.</b> Eine Karte kommt nach 1, 3, 7, 16, 35, 90 und 180 Tagen wieder, solange du sie weißt. Wer sie vergisst, beginnt wieder vorn.</span>
    <span><b>Bis es einmal sitzt.</b> Eine verpasste Karte kommt in derselben Sitzung noch einmal, bis du sie richtig hast.</span>
    <span><b>Gemischt üben.</b> Wiederholungen und Fälle mischen die Themen. So lernst du zu erkennen, ${CFG.extraCard ? 'welche Norm greift' : 'welches Werkzeug die Aufgabe verlangt'}.</span>
    <span><b>Erst Vorbild, dann selbst.</b> In den ersten Lektionen siehst du den Lösungsweg. Danach schreibst du jeden Schritt zuerst selbst.</span>
    <span><b>Vorab-Frage und eigene Worte.</b> Eine Frage vor der Lektion und ein Satz in eigenen Worten danach machen das Neue besser merkbar.</span>
    <span><b>Sicher oder unsicher?</b> Das Gefühl „kann ich“ trügt. Deshalb zeigt Echo, wie oft du richtig lagst, wenn du dir sicher warst.</span>
    <span><b>Jeden Tag ein wenig.</b> 25 Minuten täglich schlagen drei Stunden am Sonntag, auch weil Schlaf das Gelernte festigt. Neue Lektionen kommen jeden zweiten Tag; dazwischen wird wiederholt.</span>
    <span class="muted">${CFG.note || 'Ehrlich: Ein Jahr mit 30 Minuten am Tag legt das Fundament über alle Prüfungsgebiete. Für die Klausuren selbst planen Repetitorien danach noch einmal 12 bis 15 Monate intensiv, mit Dutzenden Probeklausuren.'}</span></div></details>
  ${CFG.extraCard ? `<a class="card" href="spiele.html#stb" style="text-decoration:none;color:inherit"><div class="row"><span class="big">🎮</span><div class="stack grow" style="gap:0"><h3>Steuer-Akademie</h3><span class="small muted">Die Spiele als Zusatztraining: Sortieren, Fristen, Paragrafen-Jagd</span></div></div></a>` : ''}${drillCard()}${examCard()}${pastCard()}`;
}

function viewReview() {
  const it = SS.queue[SS.i], c = cardDef(it.id), l = LBY[c.lid];
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← ${esc(CFG.short)}</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button><span class="small muted mono">${Math.min(SS.i + 1, SS.queue.length)} / ${SS.queue.length}</span></div>
  <span class="eyebrow">Wiederholung${it.retry ? ' · noch einmal, bis es sitzt' : ''} · ${esc(l.t)}</span>`;
  if (!SS.shown) {
    return `${head}<section class="card"><h2 style="line-height:1.35">${mf(c.q)}</h2>
      <input type="text" id="typed" placeholder="${c.type === 'nav' ? 'z. B. § 9 Abs. 1 EStG' : 'Deine Antwort (Tippen hilft beim Erinnern)'}" value="${esc(SS.typed)}" autocomplete="off">
      ${c.type === 'nav' ? `<button class="btn primary" data-act="check">Prüfen</button>` : `<span class="small muted">Wie sicher bist du?</span><div class="conf"><button class="btn" data-act="conf" data-v="unsure">Unsicher</button><button class="btn" data-act="conf" data-v="sure">Sicher</button></div>`}</section>`;
  }
  const res = c.type === 'nav' ? ['❌ Nicht ganz', '🟡 Richtige Norm, Absatz oder Satz fehlt oder weicht ab', '✅ Genau'][SS.navRes] : '';
  return `${head}<section class="card"><span class="small muted">${esc(c.q)}</span>${SS.typed ? `<span class="small">Du: ${esc(SS.typed)}</span>` : ''}${res ? `<b>${res}</b>` : ''}
    <div class="ans">${mf(c.a)}</div>${whyBtn()}${rateBtns()}</section>`;
}

function viewPlan() {
  const nl = nextLesson(), dl = doneL();
  const reviewed = SS.total ? `<span>✓ ${SS.total} Wiederholung${SS.total === 1 ? '' : 'en'} geschafft.</span>` : '';
  const opts = [];
  if (nl && lessonDay()) opts.push(`<button class="btn primary big" data-act="lesson">Neue Lektion: ${esc(nl.t)}</button>`);
  if (dl.length >= 1) opts.push(`<button class="btn${nl && lessonDay() ? '' : ' primary big'}" data-act="fall">🧩 Fall-Training</button>`);
  if (nl && !lessonDay()) opts.push(`<button class="btn" data-act="lesson">Trotzdem neue Lektion (${esc(nl.t)})</button>`);
  if (!nl && !dl.length) opts.push('<span>Noch keine Lektion vorhanden.</span>');
  return `<div class="topbar"><a class="link" href="#" data-act="home">← ${esc(CFG.short)}</a></div>
  <section class="card"><h2>Weiter geht's</h2>${reviewed}
  ${nl && !lessonDay() ? '<span class="small muted">Gestern gab es eine neue Lektion. Heute festigst du sie: Abstand zwischen den Lektionen hält länger als Tempo.</span>' : ''}
  ${!nl ? '<span class="small muted">Alle verfügbaren Lektionen sind gelernt. Das nächste Modul folgt; bis dahin halten Wiederholungen und Fälle das Wissen frisch.</span>' : ''}
  <div class="stack" style="gap:8px">${opts.join('')}</div><button class="btn" data-act="home">Für heute fertig</button></section>`;
}

/* lesson: 0 pre-question · 1 why, core, schema · 2 worked or self-solved case · 3 paragraph navigation · 4 own words and link · 5 immediate recall · 6 done */
/* Calculator for typed solutions: German numbers (12.950,46 · 1,05), · × * / : ÷ ^ ( ) %, √, ln, exp, ANF(i; n), RBF(i; n), AuF(i; n), AbF(i; n).
   i ≥ 1 in the factor functions counts as percent (ANF(5; 10) = ANF(5 %; 10)). No eval: a small recursive-descent parser. */
const CALC_FN = { ANF: (i, n) => i === 0 ? 1 / n : i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1), RBF: (i, n) => 1 / CALC_FN.ANF(i, n), AUF: (i, n) => Math.pow(1 + i, n), ABF: (i, n) => Math.pow(1 + i, -n), SQRT: x => Math.sqrt(x), LN: x => Math.log(x), EXP: x => Math.exp(x), LOG: x => Math.log10(x) };
function calcEval(src) {
  const s = String(src).replace(/[·×]/g, '*').replace(/[÷:]/g, '/').replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/[{}]/g, m => m === '{' ? '(' : ')');
  let i = 0; const ws = () => { while (s[i] === ' ' || s[i] === ' ') i++; };
  const fail = () => { throw new Error('x'); };
  const number = () => { ws(); const m = s.slice(i).match(/^(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+|\d+(?:\.\d+)?|,\d+)/); if (!m) return null; i += m[0].length; let t = m[0]; t = /,/.test(t) || /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t; return parseFloat(t.startsWith('.') ? '0' + t : t); };
  const pct = v => { ws(); if (s[i] === '%') { i++; return v / 100; } return v; };
  function args() { ws(); if (s[i] !== '(') fail(); i++; const a = [expr()]; ws(); while (s[i] === ';' || s[i] === ',') { i++; a.push(expr()); ws(); } if (s[i] !== ')') fail(); i++; return a; }
  function primary() {
    ws(); const c = s[i];
    if (c === '(') { i++; const v = expr(); ws(); if (s[i] !== ')') fail(); i++; return v; }
    if (c === '√') { i++; return Math.sqrt(factor()); }
    const fm = s.slice(i).match(/^[A-Za-z]+/);
    if (fm) { const f = CALC_FN[fm[0].toUpperCase()]; if (!f) fail(); i += fm[0].length; const at = i; let a = args();
      if (f.length === 2 && a.length === 1) { const inner = s.slice(at, i).trim().slice(1, -1), k = inner.lastIndexOf(','); if (k < 0) fail(); a = [calcEval(inner.slice(0, k)), calcEval(inner.slice(k + 1))]; } if (f.length === 2 && a.length === 2 && a[0] >= 1) a[0] /= 100; return f(...a); }
    const n = number(); if (n == null) fail(); return n;
  }
  function factor() { ws(); if (s[i] === '-') { i++; return -factor(); } if (s[i] === '+') { i++; return factor(); } let v = pct(primary()); ws(); if (s[i] === '^') { i++; v = Math.pow(v, factor()); } return v; }
  function term() { let v = factor(); for (;;) { ws(); const c = s[i]; if (c === '*') { i++; v *= factor(); } else if (c === '/') { i++; v /= factor(); } else if (c === '(' || c === '√' || /[A-Za-z]/.test(c || '')) { v *= factor(); } else return v; } }
  function expr() { let v = term(); for (;;) { ws(); if (s[i] === '+') { i++; v += term(); } else if (s[i] === '-') { i++; v -= term(); } else return v; } }
  const v = expr(); ws(); if (i < s.length || !isFinite(v)) fail(); return v;
}
const calcFmt = v => v.toLocaleString('de-DE', { maximumFractionDigits: Math.abs(v) >= 100 ? 2 : Math.abs(v) >= 1 ? 4 : 6 });
// Each line: the part after the last '=' that parses (text before it and units after it are ignored).
function calcLines(text) {
  return String(text || '').split('\n').map(line => {
    const segs = line.split('=').map(x => x.trim()).filter(Boolean);
    for (let k = segs.length - 1; k >= 0; k--) {
      let t = segs[k].replace(/^[^0-9(√]*?:\s*/, '').replace(/\s*(GE|€|EUR|Mio\.?|Tsd\.?|Stück|Jahre?|p\. ?a\.)\s*$/i, '').replace(/^[^0-9(√,+\-−A-Za-z]*/, '').replace(/^(?!(?:ANF|RBF|AUF|ABF|SQRT|LN|EXP|LOG)\b)[A-Za-zäöüÄÖÜß*'’ ]+(?=[0-9(√])/i, '');
      try { const v = calcEval(t); return { line: line.trim(), v }; } catch { /* try the segment before */ }
    }
    return null;
  }).filter(Boolean);
}
const calcHTML = text => { const r = calcLines(text); return r.length ? `<div class="calcout">${r.map(x => `<div><span class="small muted">${esc(x.line.length > 60 ? x.line.slice(0, 57) + '…' : x.line)}</span> <b>= ${calcFmt(x.v)}</b></div>`).join('')}</div>` : ''; };
/* Formula text → HTML: \frac{a}{b} stacked, \sqrt{x}, x^{…} / x^2 superscript, x_{…} / x_t subscript (only with CFG.math), line breaks. Input is plain text; it is escaped first. */
(() => { if (document.getElementById('mf-css')) return; const st = document.createElement('style'); st.id = 'mf-css';
  st.textContent = '.mfrac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 .15em;line-height:1.15}.mfrac>span:first-child{border-bottom:1px solid currentColor;padding:0 .2em .1em}.mfrac>span:last-child{padding:.1em .2em 0}.msqrt{border-top:1px solid currentColor;padding:0 .1em}sup,sub{font-size:.72em;line-height:0}.calcout{margin-top:6px;padding:8px 10px;border-radius:10px;background:rgba(127,127,127,.12);display:grid;gap:3px;font-variant-numeric:tabular-nums}.calcrow{display:flex;gap:8px;flex-wrap:wrap}.calcrow .btn{flex:1}';
  document.head.appendChild(st); })();
function mf(raw) {
  let h = esc(raw == null ? '' : String(raw));
  const grp = (s, i) => { if (s[i] !== '{') return null; let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) return [s.slice(i + 1, j), j + 1]; } return null; };
  const walk = s => {
    let out = '', i = 0;
    while (i < s.length) {
      if (s.startsWith('\\frac', i)) { const a = grp(s, i + 5), b = a && grp(s, a[1]); if (a && b) { out += `<span class="mfrac"><span>${walk(a[0])}</span><span>${walk(b[0])}</span></span>`; i = b[1]; continue; } }
      if (s.startsWith('\\sqrt', i)) { const a = grp(s, i + 5); if (a) { out += `√<span class="msqrt">${walk(a[0])}</span>`; i = a[1]; continue; } }
      if ((s[i] === '^' || (s[i] === '_' && CFG.math)) && i > 0) { const tag = s[i] === '^' ? 'sup' : 'sub', a = grp(s, i + 1);
        if (a) { out += `<${tag}>${walk(a[0])}</${tag}>`; i = a[1]; continue; }
        const m = s.slice(i + 1).match(/^[−-]?[0-9A-Za-zα-ωµ*]+(?:[,.][0-9]+)?/); if (m) { out += `<${tag}>${m[0]}</${tag}>`; i += 1 + m[0].length; continue; } }
      out += s[i]; i++;
    }
    return out;
  };
  return walk(h).replace(/\n/g, '<br>');
}
function viewLesson() {
  const l = SS.L, k = SS.k, fading = doneL().length >= 3;
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← ${esc(CFG.short)}</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button><span class="small muted">Lektion ${LESSONS.indexOf(l) + 1}</span></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${esc(l.t)}</h1><div class="row" style="flex-wrap:wrap;gap:6px">${norms(l)}</div>${phase(6, k)}</header>`;
  if (k === 0) return `${head}<section class="card"><span class="eyebrow">Vorab-Frage</span><h2 style="line-height:1.35">${mf(l.cards[0][0])}</h2>
    <span class="small muted">Rate ruhig, bevor du liest. Auch eine falsche Vermutung macht die Antwort danach merkbarer.</span>
    <textarea id="pre" placeholder="Deine Vermutung">${esc(SS.pre)}</textarea><button class="btn primary" data-act="next">Zur Lektion</button></section>`;
  if (k === 1) return `${head}<section class="card"><span class="eyebrow">Roter Faden</span><div class="why">${esc(l.why)}</div></section>
    <section class="card core">${l.core.map(p => `<p>${mf(p)}</p>`).join('')}</section>
    <section class="card"><span class="eyebrow">Prüfschema</span><ol class="schema">${l.schema.map(s => `<li>${mf(s)}</li>`).join('')}</ol></section>
    <section class="card"><span class="eyebrow">Deine Vorab-Frage</span><span class="small muted">${esc(l.cards[0][0])}</span>${SS.pre ? `<span class="small">Du: ${esc(SS.pre)}</span>` : ''}<div class="ans">${mf(l.cards[0][1])}</div>
    <button class="btn primary" data-act="next">Zum Fall</button></section>`;
  if (k === 2) {
    const c = l.case, s = SS.step, done = s >= c.steps.length;
    const mine = SS.mine || {}, shown = c.steps.slice(0, s).map(([q, a], k) => `<div class="step open"><b>${mf(q)}</b>${mine[k] ? `<span class="small" style="white-space:pre-wrap">Du: ${esc(mine[k])}</span>${calcHTML(mine[k])}` : ''}<div class="ans">${mf(a)}</div></div>`).join('');
    const open = SS.open ? `<div class="step open"><b>${mf(c.steps[s][0])}</b>${mine[s] ? `<span class="small" style="white-space:pre-wrap">Du: ${esc(mine[s])}</span>${calcHTML(mine[s])}` : ''}<div class="ans">${mf(c.steps[s][1])}</div>${whyBtn()}<span class="small muted">${fading ? 'Wie gut lag deine Lösung?' : 'Hättest du das selbst gewusst?'}</span>${R3('lrate')}</div>` : '';
    const cur = open ? open : done ? `<div class="ans"><b>Ergebnis:</b> ${mf(c.res)}</div><button class="btn primary" data-act="next">${l.nav && l.nav.length ? (CFG.navReview ? 'Weiter zur Paragrafen-Navigation' : 'Weiter zum Nachschlagen') : 'Weiter'}</button>`
      : fading ? `<div class="step"><b>${mf(c.steps[s][0])}</b><textarea id="guess" placeholder="Erst selbst lösen, dann aufdecken. Rechnungen wie 100.000 · 1,05^2 − 12.950,46 · 2,05 rechnet 🧮 aus.">${esc(SS.guess)}</textarea><div id="calcout"></div><div class="calcrow"><button class="btn" data-act="calc">🧮 Ausrechnen</button><button class="btn primary" data-act="reveal">Aufdecken</button></div></div>`
        : `<div class="step"><b>${esc(c.steps[s][0])}</b><span class="small muted">Überleg kurz selbst, dann deck den Schritt auf.</span><button class="btn primary" data-act="reveal">Schritt zeigen</button></div>`;
    return `${head}<section class="card"><span class="eyebrow">${fading ? 'Fall · selbst lösen' : 'Fall · Lösungsweg zum Mitdenken'}</span><div class="sv">${mf(c.sv)}</div>${shown}${cur}</section>`;
  }
  if (k === 3) {
    const n = l.nav[SS.navI];
    if (!n || (!CFG.navReview && SS.navI > 0)) { SS.k = 4; return viewLesson(); }
    const res = SS.navRes;
    return `${head}<section class="card"><span class="eyebrow">${CFG.navReview ? `Paragrafen-Navigation ${SS.navI + 1}/${l.nav.length}` : 'Nachschlagen wie in der Prüfung'}</span><h2 style="line-height:1.35">${esc(n[0])}</h2>
      <span class="small muted">${CFG.navReview ? 'Tippen, nicht raten: Gesetz, Paragraf, Absatz, Satz, Nummer.' : 'Nicht auswendig: In der Prüfung liegt das Gesetz offen. Schlag nach (Gesetzestext oder gesetze-im-internet.de) und übe, die Stelle schnell zu finden. Wird keine Wiederholungskarte.'}</span>
      <input type="text" id="nav" value="${esc(SS.navGiven)}" placeholder="z. B. § 2 Abs. 5 EStG" autocomplete="off" ${res != null ? 'disabled' : ''}>
      ${res == null ? `<button class="btn primary" data-act="navcheck">Prüfen</button>${CFG.navReview ? '' : '<button class="btn" data-act="navskip">Überspringen</button>'}` : `<b>${['❌ Nicht ganz', '🟡 Richtige Norm, die Fundstelle weicht ab', '✅ Genau'][res]}</b><div class="ans">${esc(n[1])}</div><button class="btn primary" data-act="navnext">Weiter</button>`}</section>`;
  }
  if (k === 4) {
    const lk = (D.LINKS || {})[l.id], ln = lk && LBY[lk[0]];
    return `${head}<section class="card"><span class="eyebrow">In eigenen Worten</span><h3>Was ist der Kern dieser Lektion, und warum ist das so geregelt?</h3>
      <span class="small muted">Ein, zwei Sätze. Wer sich etwas selbst erklärt, behält es länger.</span><textarea id="note" placeholder="Der Kern ist …, weil …">${esc(SS.note)}</textarea></section>
      ${ln ? `<section class="card"><span class="eyebrow">Verknüpfen · ${esc(ln.t)}</span><h3>${esc(lk[1])}</h3><span class="small muted">Erst selbst überlegen (gern in das Feld oben), dann vergleichen.</span>
        ${SS.linkShown ? `<div class="ans">${esc(lk[2])}</div>` : `<button class="btn" data-act="linkshow">Antwort zeigen</button>`}</section>` : ''}
      <button class="btn primary big" data-act="next">Zum Abruf</button>`;
  }
  if (k === 5) {
    const R = SS.recall, it = R.queue[R.i], c = cardDef(it.id);
    return `${head}<section class="card"><span class="eyebrow">Sofort-Abruf ${Math.min(R.i + 1, R.queue.length)}/${R.queue.length}${it.retry ? ' · noch einmal' : ''}</span><h2 style="line-height:1.35">${esc(c.q)}</h2>
      ${R.shown ? `<div class="ans">${esc(c.a)}</div>${whyBtn()}${R3('rrate')}`
        : `<span class="small muted">Nicht zurückblättern: aus dem Kopf.</span><button class="btn primary" data-act="rshow">Aufdecken</button>`}</section>`;
  }
  return `${head}<section class="card" style="text-align:center"><span style="font-size:44px">✅</span><h2>Lektion geschafft</h2>
    <span class="small muted">Die ${lessonCards(l).length} Karten kommen morgen zum ersten Mal wieder, dann in wachsenden Abständen.</span>
    <button class="btn primary" data-act="plan">Weiter</button><button class="btn" data-act="home">Für heute fertig</button></section>`;
}

/* case training and boss: recognise the topic (interleaving), then solve each step yourself */
function startCase() {
  // every learned lesson brings its main case plus the extra cases; the one seen longest ago comes next, another topic than last time where possible
  const pool = []; for (const l of doneL()) { const all = [l.case, ...((D.EXTRA || {})[l.id] || []), ...(l.more || [])]; all.forEach((c, i) => pool.push({ l, c, key: l.id + '#' + i, n: all.length, i })); }
  if (!pool.length) return;
  const seen = P.caseSeen || (P.caseSeen = {});
  pool.sort((a, b) => ((seen[a.key] || 0) - (seen[b.key] || 0)) || ((a.l.id === P.lastCaseL) - (b.l.id === P.lastCaseL)) || Math.random() - 0.5);
  const pick = pool[0], l = pick.l, cs = pick.c, allToday = pool.every(x => seen[x.key] && new Date(seen[x.key]).toDateString() === new Date().toDateString());
  const others = shuffle(LESSONS.filter(x => x.id !== l.id && x.mod === l.mod)).slice(0, 3);
  SS = Object.assign(SS || { xp: 0 }, { stage: 'case', C: { L: l, key: pick.key, idx: pick.i + 1, of: pick.n, repeat: allToday, steps: cs.steps.map(s => [s[0], s[1], l.id]), sv: cs.sv, res: cs.res, opts: shuffle([l, ...others]), pick: null, s: 0, shown: false, guess: '', miss: 0, boss: false } });
  location.hash = 'fall'; render();
}
function startBoss(mid) {
  const ok = x => D.BOSS[x.id] && (D.LESSONS[x.id] || []).length && D.LESSONS[x.id].every(l => P.done[l.id]);
  const m = D.ROADMAP.find(x => x.id === mid && ok(x)) || D.ROADMAP.find(x => ok(x) && !P.boss[x.id]) || D.ROADMAP.find(ok); if (!m) return;
  const b = D.BOSS[m.id];
  SS = Object.assign(SS || { xp: 0 }, { stage: 'case', C: { mod: m.id, title: b.t, steps: b.steps, sv: b.sv, res: b.res, pick: 'skip', s: 0, shown: false, guess: '', miss: 0, boss: true } });
  location.hash = 'boss-' + m.id; render();
}
function viewCase() {
  const C = SS.C, done = C.s >= C.steps.length;
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← ${esc(CFG.short)}</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button><span class="small muted">${C.boss ? 'Abschlussfall' : 'Fall-Training'}</span></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${C.boss ? '👹 ' + esc(C.title) : '🧩 Gemischter Fall'}</h1>${C.boss ? '' : `<span class="small muted">${C.repeat ? 'Alle Fälle zu deinen bisherigen Lektionen hast du heute schon gelöst, das hier ist eine Wiederholung. Mit jeder neuen Lektion kommen neue Fälle dazu.' : `Fall ${C.idx} von ${C.of} zu diesem Thema · ${doneL().length} Lektion${doneL().length === 1 ? '' : 'en'} im Fallpool`}</span>`}${phase(C.steps.length + (C.boss ? 0 : 1), (C.pick ? 1 : 0) * (C.boss ? 0 : 1) + C.s)}</header>
  <section class="card"><div class="sv">${mf(C.sv)}</div></section>`;
  if (!C.pick) return `${head}<section class="card"><h3>Welches Thema steckt im Kern dieses Falls?</h3><span class="small muted">In der Klausur steht nirgends, ${CFG.extraCard ? 'welche Norm' : 'welches Thema'} gefragt ist. Erkennen ist die halbe Lösung.</span>
    <div class="opts">${C.opts.map(o => `<button class="opt" data-act="pick" data-v="${o.id}">${esc(o.t)}</button>`).join('')}</div></section>`;
  const pickFb = C.boss ? '' : `<section class="card"><b>${C.pick === C.L.id ? '✅ Richtig erkannt' : '❌ Gemeint war: ' + esc(C.L.t)}</b></section>`;
  const prev = C.steps.slice(0, C.s).map(st => `<div class="step open"><b>${mf(st[0])}</b><div class="ans">${mf(st[1])}</div></div>`).join('');
  if (done) return `${head}${pickFb}<section class="card">${prev}<div class="ans"><b>Ergebnis:</b> ${mf(C.res)}</div>
    <span class="small muted">${C.miss || C.part ? `${C.miss} nicht gewusst, ${C.part || 0} teilweise. Diese Schritte kommen ab morgen als Karten wieder.` : 'Alle Schritte gewusst.'}</span>
    <button class="btn primary" data-act="casedone">Abschließen</button></section>`;
  const st = C.steps[C.s];
  return `${head}${pickFb}<section class="card">${prev}<div class="step"><b>${esc(st[0])}</b>${st[2] && C.boss ? `<span class="small muted">Thema: ${esc(LBY[st[2]].t)}</span>` : ''}
    ${C.shown ? `${C.guess ? `<span class="small" style="white-space:pre-wrap">Du: ${esc(C.guess)}</span>${calcHTML(C.guess)}` : ''}<div class="ans">${mf(st[1])}</div>${whyBtn()}${R3('step')}`
      : `<textarea id="guess" placeholder="Deine Lösung für diesen Schritt">${esc(C.guess)}</textarea><div id="calcout"></div><div class="calcrow"><button class="btn" data-act="calc">🧮 Ausrechnen</button><button class="btn primary" data-act="sreveal">Aufdecken</button></div>`}</div></section>`;
}

function viewRead(l) {
  return `<div class="topbar"><a class="link" href="#">← ${esc(CFG.short)}</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${esc(l.t)}</h1><div class="row" style="flex-wrap:wrap;gap:6px">${norms(l)}</div></header>
  ${P.done[l.id] ? '' : '<section class="card"><span class="small muted">Diese Lektion kommt noch. Lies ruhig vor, aber am meisten bringt sie, wenn du sie mit Vorab-Frage und Fall im Tagesablauf lernst.</span></section>'}
  <section class="card"><span class="eyebrow">Roter Faden</span><div class="why">${esc(l.why)}</div></section>
  <section class="card core">${l.core.map(p => `<p>${esc(p)}</p>`).join('')}</section>
  <section class="card"><span class="eyebrow">Prüfschema</span><ol class="schema">${l.schema.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
  <details class="card"><summary>Fall mit Lösung</summary><div class="sv" style="margin-top:8px">${mf(l.case.sv)}</div>${l.case.steps.map(([q, a]) => `<div class="step open"><b>${esc(q)}</b><div class="ans">${esc(a)}</div></div>`).join('')}<div class="ans"><b>Ergebnis:</b> ${mf(l.case.res)}</div></details>
  ${qaList(l.id)}
  ${P.notes[l.id] ? `<section class="card"><span class="eyebrow">Deine eigenen Worte</span><span>${esc(P.notes[l.id])}</span></section>` : ''}`;
}

/* ---------- questions: ask about whatever is on screen, the answer is saved and can become a card ---------- */
let ASK = null;
function ctxNow() {
  const h = location.hash.replace(/^#/, '');
  let l = null, item = '';
  if (h.startsWith('l-')) l = LBY[h.slice(2)];
  else if (SS && SS.stage === 'lesson') { l = SS.L; if (SS.k === 2 && SS.L.case.steps[SS.step]) item = 'Aktueller Fallschritt: ' + SS.L.case.steps[SS.step][0] + (SS.open ? ' | Lösung: ' + SS.L.case.steps[SS.step][1] + (SS.mine && SS.mine[SS.step] ? ' | Meine Lösung: ' + SS.mine[SS.step] : '') : ''); if (SS.k === 5 && SS.recall) { const c = cardDef(SS.recall.queue[SS.recall.i].id); if (c) item = 'Abrufkarte: ' + c.q + (SS.recall.shown ? ' | Antwort: ' + c.a : ''); } }
  else if (DR) { item = 'Rechenaufgabe (' + DR.d.t + '): ' + DR.task.q + (DR.res ? ' | Lösung: ' + fmtN(DR.task.a) + ' | Weg: ' + DR.task.steps.join(' / ') + (DR.given ? ' | Meine Eingabe: ' + DR.given : '') : ''); }
  else if (SS && SS.stage === 'review') { const c = cardDef(SS.queue[SS.i].id); l = LBY[c.lid]; item = 'Aktuelle Karte: ' + c.q + (SS.shown ? ' | Lösung: ' + c.a : ''); }
  else if (SS && SS.stage === 'case') { const C = SS.C, st = C.steps[C.s]; l = C.L || (st && LBY[st[2]]) || null; item = 'Sachverhalt: ' + C.sv + (st ? ' | Aktueller Schritt: ' + st[0] + (C.shown ? ' | Lösung: ' + st[1] + (C.guess ? ' | Meine Lösung: ' + C.guess : '') : '') : ''); }
  return { l, item };
}
function ctxText(l, item) {
  const done = doneL().map(x => x.t).join('; ');
  return [l ? `Lektion „${l.t}“ (${l.norms.join(', ')}).\nRoter Faden: ${l.why}\nKern: ${l.core.join(' ')}\nPrüfschema: ${l.schema.join(' → ')}\nFall: ${l.case.sv} Ergebnis: ${l.case.res}` : 'Keine bestimmte Lektion offen.', item, done ? 'Bereits gelernt: ' + done : ''].filter(Boolean).join('\n\n');
}
const WHY = 'Erklär mir diesen Schritt ausführlich und Schritt für Schritt, als hätte ich ihn nicht verstanden: 1. Was genau ist hier gefragt? 2. Welche Regel, Formel oder Norm greift, und warum gerade diese? 3. Wie kommt man auf jede Zahl oder jedes Argument der Lösung (bei Rechnungen: Formel, eingesetzte Werte, Ergebnis)? 4. Welcher typische Fehler passiert hier, und woran erkenne ich in der Klausur, dass dieser Schritt dran ist? Diesmal gern bis 350 Wörter.';
const SYS = 'Du bist ein erfahrener Tutor für die deutsche Steuerberaterprüfung. Rechtsstand 2026. Der Lernende arbeitet sich mit einem Lernpfad ins Steuerrecht ein und stellt eine Verständnisfrage. ' +
  'Antworte auf Deutsch, präzise und knapp (höchstens etwa 200 Wörter), mit Fundstellen (Gesetz, Paragraf, Absatz, Satz; ggf. R/H der Richtlinien oder BFH). Erkläre zuerst das Warum: die Systematik und den Zweck der Regel, dann die Folge, gern mit einem Mini-Beispiel. ' +
  'Erfinde keine Beträge, Fristen oder Urteile. Wenn du dir bei einer Zahl oder einem aktuellen Rechtsstand nicht sicher bist, sag das ausdrücklich und nenne, wo man es nachprüft. ' +
  'Beende die Antwort mit einer eigenen letzten Zeile im Format „KARTE: <kurze Abruffrage> || <Antwort in ein bis zwei Sätzen>“, die den Kern deiner Erklärung als Lernkarte festhält. Kein Markdown außer Absätzen.';
// "Warum so?" without AI: what is asked, the solution in steps, and the lesson's reasoning (roter Faden, Kern, Prüfschema)
function whyHTML() {
  let q = '', a = '', mine = '', l = null, fx = '';
  if (SS && SS.stage === 'lesson') { l = SS.L; if (SS.k === 2 && SS.L.case.steps[SS.step]) { [q, a] = SS.L.case.steps[SS.step]; mine = (SS.mine || {})[SS.step] || ''; q = 'Fall: ' + SS.L.case.sv + '\n→ ' + q; } else if (SS.k === 5 && SS.recall) { const c = cardDef(SS.recall.queue[SS.recall.i].id); if (c) { q = c.q; a = c.a; l = LBY[c.lid] || l; } } }
  else if (DR) { q = DR.task.q; a = DR.task.steps.join('\n') + '\nErgebnis: ' + fmtN(DR.task.a, DR.task.dec ?? 2) + (DR.task.unit ? ' ' + DR.task.unit : ''); fx = DR.d.fx || ''; mine = DR.given || ''; }
  else if (SS && SS.stage === 'review') { const c = cardDef(SS.queue[SS.i].id); if (c) { q = c.q; a = c.a; l = LBY[c.lid]; } }
  else if (SS && SS.stage === 'case') { const C = SS.C, st = C.steps[C.s]; if (st) { q = 'Fall: ' + C.sv + '\n→ ' + st[0]; a = st[1]; mine = C.guess || ''; l = (st[2] && LBY[st[2]]) || C.L || null; } }
  const sec = (h, body) => body ? `<div class="stack" style="gap:4px"><span class="eyebrow">${h}</span><div class="small" style="white-space:pre-wrap;line-height:1.55">${body}</div></div>` : '';
  return `<div class="card flat" style="gap:12px">
    ${sec('1 · Was gefragt ist', mf(q))}
    ${fx ? sec('2 · Formel', mf(fx)) : ''}
    ${sec(fx ? '3 · Rechenweg' : '2 · Lösung', mf(a))}
    ${mine ? sec('Dein Ansatz', esc(mine) + calcHTML(mine)) : ''}
    ${l ? sec('Warum diese Regel (Lektion „' + esc(l.t) + '“)', mf(l.why)) + sec('Was du dafür wissen musst', l.core.map(x => '• ' + mf(x)).join('\n')) + sec('Prüfschema: woran du erkennst, dass der Schritt dran ist', l.schema.map((x, i) => (i + 1) + '. ' + mf(x)).join('\n')) + (l.norms && l.norms.length ? sec('Fundstellen', esc(l.norms.join(' · '))) : '') : ''}
  </div>`;
}
function askOpen() {
  const { l, item } = ctxNow();
  ASK = { lid: l ? l.id : null, ctx: ctxText(l, item), msgs: [], busy: false, err: '', card: null, saved: false, title: l ? l.t : CFG.askTopic };
  askDraw();
}
function askDraw() {
  let o = document.getElementById('askov');
  if (!ASK) { if (o) o.remove(); return; }
  if (!o) { o = document.createElement('div'); o.id = 'askov'; o.className = 'askov'; document.body.appendChild(o); o.addEventListener('click', askClick); }
  const thread = ASK.msgs.map(m => m.role === 'user' ? `<div class="askq">${m.content.endsWith(WHY) ? '🤔 Warum so? Bitte ausführlich erklären.' : esc(m.content.split('\n\nFrage: ').pop())}</div>` : `<div class="aska">${esc(m.shown || m.content).replace(/\n/g, '<br>')}</div>`).join('');
  const key = hasAI();
  o.innerHTML = `<div class="askbox"><div class="row spread"><span class="eyebrow">❓ Frage · ${esc(ASK.title)}</span><button class="link" data-q="close" style="background:none;border:0;font:inherit;cursor:pointer">Schließen</button></div>
    ${ASK.static ? ASK.static + (hasAI() && !ASK.msgs.length ? '<button class="btn" data-q="deep">🤖 Noch tiefer: KI erklärt Schritt für Schritt</button>' : '') : ''}
    ${thread || (ASK.static ? '' : '<span class="small muted">Frag, was dir unklar ist, z. B. warum etwas an dieser Stelle im Schema steht. Die Antwort kennt die Lektion, die gerade offen ist, und wird gespeichert.</span>')}
    ${ASK.busy ? '<span class="small muted">Denkt nach …</span>' : ''}${ASK.err ? `<span class="small" style="color:var(--warn,#b45309)">${esc(ASK.err)}</span>${ASK.retry ? '<button class="btn" data-q="retry">Nochmal versuchen</button>' : ''}` : ''}
    ${ASK.card && !ASK.saved ? `<div class="card flat" style="gap:6px"><span class="eyebrow">Als Lernkarte übernehmen?</span><b class="small">${mf(ASK.card[0])}</b><span class="small muted">${mf(ASK.card[1])}</span><button class="btn" data-q="card">＋ In die Wiederholungen</button></div>` : ASK.saved ? '<span class="small muted">✓ Karte ist in deinen Wiederholungen, zum ersten Mal morgen.</span>' : ''}
    ${key ? `<textarea id="askin" placeholder="${ASK.msgs.length ? 'Nachfrage …' : 'Deine Frage …'}" rows="3"></textarea><div class="row" style="gap:8px"><button class="btn" data-q="mic" aria-label="Diktieren">🎤</button><button class="btn primary grow" data-q="send" ${ASK.busy ? 'disabled' : ''}>Fragen</button></div>`
      : `<span class="small">Für Antworten braucht Echo deinen Anthropic-Schlüssel (Echo → Einstellungen). Bis dahin kannst du die Frage hier notieren; sie wird gespeichert und du kannst sie später stellen.</span><textarea id="askin" placeholder="Deine Frage …" rows="3"></textarea><button class="btn primary" data-q="note">Frage notieren</button>`}</div>`;
  const ta = o.querySelector('#askin'), box = o.querySelector('.askbox');
  if (ASK.static && !ASK.msgs.length && !ASK.busy) return;
  if (ta && !ASK.busy) setTimeout(() => ta.focus({ preventScroll: true }), 30);
  box.scrollTop = box.scrollHeight;
}
async function askSend(text) {
  ASK.busy = true; ASK.err = '';
  const first = !ASK.msgs.length;
  ASK.msgs.push({ role: 'user', content: first ? 'Kontext aus dem Lernpfad:\n' + ASK.ctx + '\n\nFrage: ' + text : text });
  askDraw();
  try {
    const s = LS.get('echo-settings', {});
    const ans = await askAI(CFG.sys ? CFG.sys + ' Beende die Antwort mit einer eigenen letzten Zeile im Format „KARTE: <kurze Abruffrage> || <Antwort in ein bis zwei Sätzen>“, die den Kern deiner Erklärung als Lernkarte festhält. Kein Markdown.' : SYS, ASK.msgs.map(m => ({ role: m.role, content: m.content })), text === WHY ? 2500 : 1500, s.model || s.fastModel);
    if (!ans || !ans.trim()) throw new Error('Die Antwort kam leer zurück (vermutlich zu lang abgebrochen). Bitte nochmal tippen.');
    const m = ans.match(/\n?\s*KARTE:\s*(.+?)\s*\|\|\s*([\s\S]+?)\s*$/);
    const shown = (m ? ans.slice(0, m.index).trim() : ans) || ans;
    ASK.msgs.push({ role: 'assistant', content: ans, shown });
    if (m) { ASK.card = [m[1].trim(), m[2].trim()]; ASK.saved = false; }
    P.qa.push({ d: today(), lid: ASK.lid, q: text, a: shown }); save(); gainXP(CFG.xp + '-frage', 10);
    window.EULE && EULE.push({ src: CFG.src, q: m ? ASK.card[0] : text, a: m ? ASK.card[1] : shown.slice(0, 600) });
  } catch (e) { ASK.err = 'Keine Antwort: ' + e.message; ASK.msgs.pop(); ASK.retry = text; }
  ASK.busy = false; askDraw();
}
function askClick(e) {
  if (e.target.id === 'askov') { ASK = null; askDraw(); return; }
  const b = e.target.closest("[data-q]"); if (!b) return; const k = b.dataset.q;
  const ta = document.getElementById('askin'), text = ta ? ta.value.trim() : '';
  if (k === 'close') { ASK = null; askDraw(); render(); }
  else if (k === 'send') { if (text && !ASK.busy) askSend(text); }
  else if (k === 'deep') { if (!ASK.busy) askSend(WHY); }
  else if (k === 'retry') { const t = ASK.retry; ASK.retry = null; if (t && !ASK.busy) askSend(t); }
  else if (k === 'note') { if (!text) return; P.qa.push({ d: today(), lid: ASK.lid, q: text, a: '' }); save(); toast('Frage notiert'); ASK = null; askDraw(); render(); }
  else if (k === 'mic') dictate('de-DE', t => { const el = document.getElementById('askin'); if (el) el.value = (el.value ? el.value + ' ' : '') + t; });
  else if (k === 'card' && ASK.card) {
    const lid = ASK.lid || (doneL()[0] || LESSONS[0]).id, id = lid + ':q' + uid();
    P.qcards[id] = { q: ASK.card[0], a: ASK.card[1], d: today() }; P.cards[id] = { b: 0, due: addDays(1), n: 0, lapses: 0, last: today() };
    ASK.saved = true; save(); askDraw();
  }
}
function qaList(lid) {
  const xs = P.qa.filter(x => !lid || x.lid === lid); if (!xs.length) return '';
  return `<section class="card"><span class="eyebrow">Deine Fragen</span>${xs.slice().reverse().map(x => `<details><summary class="small">${mf(x.q)}</summary><div class="ans small" style="margin-top:6px">${x.a ? mf(x.a).replace(/\n/g, '<br>') : '<span class="muted">Noch keine Antwort gespeichert.</span>'}</div>${!lid && x.lid && LBY[x.lid] ? `<a class="small muted" href="#l-${x.lid}">${esc(LBY[x.lid].t)}</a>` : ''}</details>`).join('')}</section>`;
}
function viewQA() {
  return `<div class="topbar"><a class="link" href="#">← ${esc(CFG.short)}</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button></div><header class="stack" style="gap:4px"><h1>❓ Deine Fragen</h1><span class="small muted">Gespeichert mit Antwort. Was als Karte übernommen wurde, kommt in den Wiederholungen.</span></header>${qaList(null) || '<section class="card"><span class="muted">Noch keine Fragen.</span></section>'}`;
}

/* ---------- calculation drills: D.DRILLS = [{ id, t, em, sub, gen: () => ({ q, a, tol, unit, steps: [] }) }] ----------
   Every call of gen() builds a fresh task with new numbers, so practice never runs out. */
const num = v => { const t = String(v).trim().replace(/\s|€|%/g, ''); if (!t) return NaN; const x = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t; if (/^[+-]?\d*\.?\d+$/.test(x)) return parseFloat(x); try { return calcEval(String(v).replace(/€/g, '')); } catch { return parseFloat(x); } };
const fmtN = (x, d = 2) => Number(x).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: d });
function drillCard() {
  if (!(D.DRILLS || []).length) return '';
  const st = P.drills || {}, n = Object.values(st).reduce((a, x) => a + x.n, 0), ok = Object.values(st).reduce((a, x) => a + x.ok, 0);
  return `<a class="card" href="#rechnen" style="text-decoration:none;color:inherit"><div class="row"><span class="big">🧮</span><div class="stack grow" style="gap:0"><h3>Rechentrainer</h3><span class="small muted">${D.DRILLS.length} Aufgabentypen, jedes Mal neue Zahlen${n ? ` · ${ok}/${n} richtig` : ''}</span></div></div></a>`;
}
function viewDrills() {
  const st = P.drills || {};
  return `<div class="topbar"><a class="link" href="#">← ${esc(CFG.short)}</a></div><header class="stack" style="gap:4px"><h1>🧮 Rechentrainer</h1><span class="small muted">Erst rechnen, dann prüfen. Falsche Typen kommen öfter dran, wenn du „Gemischt“ wählst.</span></header>
  <a class="card" href="#rechnen-mix" style="text-decoration:none;color:inherit;border:2px solid var(--calm)"><div class="row"><span class="big">🎲</span><div class="stack grow" style="gap:0"><h3>Gemischt</h3><span class="small muted">Schwache Typen häufiger</span></div></div></a>
  ${D.DRILLS.map(d => { const x = st[d.id] || { n: 0, ok: 0 }; return `<a class="card" href="#rechnen-${d.id}" style="text-decoration:none;color:inherit"><div class="row"><span class="big">${d.em || '🧮'}</span><div class="stack grow" style="gap:0"><h3>${esc(d.t)}</h3><span class="small muted">${esc(d.sub || '')}${x.n ? ` · ${x.ok}/${x.n}` : ''}</span></div></div></a>`; }).join('')}`;
}
function pickDrill(id) {
  if (id !== 'mix') return D.DRILLS.find(d => d.id === id);
  const st = P.drills || {}, w = D.DRILLS.map(d => { const x = st[d.id] || { n: 0, ok: 0 }; return 1 + 3 * (1 - (x.ok + 1) / (x.n + 2)); });
  let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return D.DRILLS[i]; } return D.DRILLS[0];
}
function startDrill(id) { const d = pickDrill(id); if (!d) return; DR = { id, d, task: d.gen(), given: '', res: null }; }
function viewDrill() {
  const { d, task, res } = DR;
  return `<div class="topbar"><a class="link" href="#rechnen">← Rechentrainer</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button></div>
  <header class="stack" style="gap:4px"><span class="eyebrow">${d.em || '🧮'} ${esc(d.t)}</span></header>
  <section class="card"><div class="sv" style="white-space:pre-wrap">${mf(task.q)}</div>
    <input type="text" id="drillin" inputmode="decimal" placeholder="Ergebnis${task.unit ? ' in ' + esc(task.unit) : ''}" value="${esc(DR.given)}" ${res ? 'disabled' : ''} autocomplete="off">
    ${res ? `<b>${res === 'ok' ? '✅ Richtig' : '❌ Nicht ganz'} · Lösung: ${fmtN(task.a, task.dec ?? 2)}${task.unit ? ' ' + esc(task.unit) : ''}</b>
      <div class="stack" style="gap:6px">${d.fx ? `<div class="step open"><div class="ans"><b>Formel:</b> ${mf(d.fx)}</div></div>` : ''}<div class="step open"><div class="ans" style="white-space:pre-wrap"><b>Eingesetzt:</b><br>${task.steps.map(x => mf(x)).join('<br>')}</div></div><div class="step open"><div class="ans"><b>Ergebnis:</b> ${fmtN(task.a, task.dec ?? 2)}${task.unit ? ' ' + esc(task.unit) : ''}</div></div></div>
      ${whyBtn()}<div class="row" style="gap:8px"><button class="btn primary grow" data-act="drillnext">Nächste Aufgabe</button><button class="btn" data-act="drillmine">War doch richtig</button></div>`
      : `<button class="btn primary" data-act="drillcheck">Prüfen</button><button class="btn" data-act="drillskip">Lösung zeigen</button>`}</section>`;
}
function drillScore(ok) {
  const st = P.drills || (P.drills = {}), x = st[DR.d.id] || (st[DR.d.id] = { n: 0, ok: 0 }); x.n++; if (ok) { x.ok++; gainXP(CFG.xp, 20); }
  track('drill:' + DR.d.id, ok ? 2 : 0, { t: DR.d.t, k: 'drill' });
  if (!ok) window.EULE && EULE.push({ src: CFG.src, q: DR.task.q, a: (DR.d.fx ? 'Formel: ' + DR.d.fx + '\n' : '') + 'Eingesetzt: ' + DR.task.steps.join('\n') + '\nErgebnis: ' + fmtN(DR.task.a, DR.task.dec ?? 2) + (DR.task.unit ? ' ' + DR.task.unit : '') });
  act(); save();
}

/* ---------- mock exams: D.EXAMS = [{ id, t, min, src, tasks: [{ t, pts, q, sol }] }] ----------
   Timed like the real exam; afterwards each task is scored by its solution, and weak tasks become review cards. */
/* ---------- past exams: D.PAST = [{ id, t, min, pdf, sol, tasks: [[title, pts, lessonId]] }] ----------
   The original exam stays in the project; Echo only times it and keeps the points per task, so weak task types show up in the Wissensstand. */
let PT = null;
function pastCard() {
  if (!(D.PAST || []).length) return '';
  const pp = P.past || {}, n = Object.keys(pp).length;
  return `<a class="card" href="#alt" style="text-decoration:none;color:inherit"><div class="row"><span class="big">📄</span><div class="stack grow" style="gap:0"><h3>Altklausuren</h3><span class="small muted">${D.PAST.length} echte Klausurteile unter Zeit, Punkte je Aufgabe eintragen${n ? ` · ${n} gerechnet` : ''}</span></div></div></a>`;
}
function viewPast() {
  const pp = P.past || {};
  return `<div class="topbar"><a class="link" href="#">← ${esc(CFG.short)}</a></div><header class="stack" style="gap:4px"><h1>📄 Altklausuren</h1><span class="small muted">Die Aufgaben liegen als PDF in deinem Projekt „Growth“ (Claude). Rechne sie wie in der Prüfung: ein Teil = 60 Minuten, nur Taschenrechner. Danach mit den Lösungshinweisen bewerten und die Punkte hier eintragen.</span></header>
  ${D.PAST.map(e => { const r = (pp[e.id] || []).slice(-1)[0], max = e.tasks.reduce((a, t) => a + t[1], 0);
    return `<a class="card" href="#alt-${e.id}" style="text-decoration:none;color:inherit"><div class="row spread"><b>${esc(e.t)}</b><span class="small muted mono">${r ? fmtN(r.sum, 1) + ' / ' + max : max + ' P.'}</span></div><span class="small muted">${e.tasks.map(t => esc(t[0])).join(' · ')}</span></a>`; }).join('')}`;
}
function viewPastOne(e) {
  const pp = (P.past || {})[e.id] || [], max = e.tasks.reduce((a, t) => a + t[1], 0), run = PT && PT.id === e.id;
  const el = run ? Math.floor((Date.now() - PT.t0) / 1000) : 0;
  return `<div class="topbar"><a class="link" href="#alt">← Altklausuren</a><span class="mono small" id="ptclock" style="color:${run && el > e.min * 60 ? 'var(--gold)' : 'var(--muted)'}">${run ? '⏱ ' + mmss(el) + ' / ' + e.min + ':00' : ''}</span></div>
  <header class="stack" style="gap:4px"><h1 style="font-size:24px">📄 ${esc(e.t)}</h1><span class="small muted">Aufgaben: ${esc(e.pdf)} · Lösungen: ${esc(e.sol)} (beides im Projekt)</span></header>
  <section class="card">${run ? `<span class="small">Läuft. Erst rechnen, dann hier bewerten.</span>` : `<button class="btn primary" data-act="ptstart">⏱ ${e.min} Minuten starten</button><span class="small muted">Oder direkt bewerten, wenn du schon gerechnet hast.</span>`}</section>
  <section class="card"><h3>Punkte eintragen</h3>${e.tasks.map((t, i) => `<div class="row spread" style="gap:10px"><span class="small">${i + 1}. ${esc(t[0])}</span><input type="text" inputmode="decimal" data-pt="${i}" placeholder="0–${t[1]}" style="max-width:90px"></div>`).join('')}
    <button class="btn primary" data-act="ptsave">Speichern (max. ${max} P.)</button></section>
  ${pp.length ? `<section class="card"><h3>Bisher</h3>${pp.slice().reverse().map(r => `<div class="row spread"><span class="small mono">${r.d}${r.sec ? ' · ' + mmss(r.sec) : ''}</span><span class="small">${fmtN(r.sum, 1)} / ${max} · ${r.pts.map((x, i) => fmtN(x, 1) + '/' + e.tasks[i][1]).join(' · ')}</span></div>`).join('')}</section>` : ''}`;
}
setInterval(() => { if (!PT) return; const el = document.getElementById('ptclock'), e = (D.PAST || []).find(x => x.id === PT.id); if (!el || !e) return; const s = Math.floor((Date.now() - PT.t0) / 1000); el.textContent = '⏱ ' + mmss(s) + ' / ' + e.min + ':00'; el.style.color = s > e.min * 60 ? 'var(--gold)' : 'var(--muted)'; }, 1000);
function examCard() {
  if (!(D.EXAMS || []).length) return '';
  const best = (P.exams || {}), done = Object.keys(best).length;
  return `<a class="card" href="#klausur" style="text-decoration:none;color:inherit"><div class="row"><span class="big">📝</span><div class="stack grow" style="gap:0"><h3>Probeklausuren</h3><span class="small muted">${D.EXAMS.length} Klausuren auf Zeit${done ? ` · ${done} geschrieben` : ''}</span></div></div></a>`;
}
function viewExams() {
  const ex = P.exams || {};
  return `<div class="topbar"><a class="link" href="#">← ${esc(CFG.short)}</a></div><header class="stack" style="gap:4px"><h1>📝 Probeklausuren</h1><span class="small muted">Unter echten Bedingungen: Zeit läuft, Unterlagen nur so weit erlaubt. Danach bewertest du jede Aufgabe mit der Musterlösung; was unter der Hälfte bleibt, kommt in die Wiederholungen.</span></header>
  ${D.EXAMS.map(e => { const r = (ex[e.id] || []).slice(-1)[0], max = e.pts || e.tasks.reduce((a, t) => a + t.pts, 0); return `<a class="card" href="#klausur-${e.id}" style="text-decoration:none;color:inherit"><div class="row"><span class="big">📝</span><div class="stack grow" style="gap:0"><h3>${esc(e.t)}</h3><span class="small muted">${e.min} min · ${max} Punkte${r ? ` · zuletzt ${r.pts}/${r.max}` : ''}${e.src ? ' · ' + esc(e.src) : ''}</span></div></div></a>`; }).join('')}`;
}
function startExam(id) { let e = D.EXAMS.find(x => x.id === id); if (!e) return; if (e.gen) e = Object.assign({}, e, { tasks: e.gen(P) }); EX = { e, i: 0, ans: {}, tf: {}, t0: Date.now(), phase: 'write', score: {} }; }
/* true/false blocks (as in multiple-choice exams): task.tf = [[statement, isTrue, explanation, lessonId?]]; each correct mark earns pts/len */
const FU = [0, 0.01, 0.1, 0.3, 0.6, 1]; // FernUni x aus 5: 1 richtig 1 %, 2 → 10 %, 3 → 30 %, 4 → 60 %, 5 → 100 %; nichts angekreuzt 0
const tfScore = (t, i) => { const m = EX.tf[i] || {}; const ok = t.tf.filter((x, j) => !!m[j] === !!x[1]).length;
  if (t.fu && t.tf.length === 5) return Object.values(m).some(Boolean) ? Math.round(t.pts * FU[ok] * 100) / 100 : 0;
  return Math.round(t.pts * ok / t.tf.length * 10) / 10; };
function viewExam() {
  const { e, phase } = EX, max = e.tasks.reduce((a, t) => a + t.pts, 0);
  const left = Math.max(0, e.min * 60 - Math.floor((Date.now() - EX.t0) / 1000));
  const head = `<div class="topbar"><a class="link" href="#klausur">← Klausuren</a><span class="mono small" id="exleft" style="color:${left < 600 ? 'var(--gold)' : 'var(--muted)'}">${phase === 'write' ? '⏳ ' + mmss(left) : ''}</span></div><header class="stack" style="gap:4px"><h1 style="font-size:24px">📝 ${esc(e.t)}</h1></header>`;
  if (phase === 'write') return `${head}${e.tasks.map((t, i) => `<section class="card"><div class="row spread"><b>Aufgabe ${i + 1}: ${esc(t.t)}</b><span class="small muted">${t.pts} P.</span></div><div class="sv" style="white-space:pre-wrap">${mf(t.q)}</div>${t.tf ? `<span class="small muted">Ankreuzen, was richtig ist. Nicht angekreuzt heißt falsch.${t.fu ? ' Bewertung x aus 5: 4 richtig = 60 %, 3 = 30 %.' : ''}</span>${t.tf.map((x, j) => `<label class="row" style="gap:10px;align-items:flex-start;line-height:1.5"><input type="checkbox" data-tf="${i}:${j}" ${(EX.tf[i] || {})[j] ? 'checked' : ''} style="margin-top:4px;width:20px;height:20px;flex:none"><span><b>${'ABCDE'[j] || j + 1}</b> ${esc(x[0])}</span></label>`).join('')}` : `<textarea data-ex="${i}" placeholder="Lösung (Rechenweg, Ergebnis, Begründung)" style="min-height:110px">${esc(EX.ans[i] || '')}</textarea>`}</section>`).join('')}
    <button class="btn primary big" data-act="examend">Abgeben und auswerten</button>`;
  if (phase === 'grade') return `${head}<section class="card"><span class="small muted">${e.tasks.every(t => t.tf) ? 'Automatisch ausgewertet. Eine richtige Aussage, die du nicht angekreuzt hast, zählt wie in der Klausur als Fehler.' : 'Vergleiche jede Aufgabe mit der Lösung und vergib ehrlich Punkte. Gezählt wird nur, was du in der Zeit geschrieben hast.'}</span></section>
    ${e.tasks.map((t, i) => t.tf ? `<section class="card"><div class="row spread"><b>Aufgabe ${i + 1}: ${esc(t.t)}</b><span class="small muted">${fmtN(tfScore(t, i), 1)} / ${t.pts} P.</span></div>${t.tf.map((x, j) => { const m = !!(EX.tf[i] || {})[j], ok = m === !!x[1]; return `<div class="step open" style="border-color:${ok ? 'var(--calm)' : 'var(--gold)'}"><span><b>${'ABCDE'[j] || j + 1}</b> ${ok ? '✅' : '❌'} ${esc(x[0])}</span><div class="ans"><b>${x[1] ? 'Richtig' : 'Falsch'}.</b> ${esc(x[2] || '')}</div></div>`; }).join('')}<input type="hidden" data-sc="${i}" value="${tfScore(t, i)}"></section>` : `<section class="card"><div class="row spread"><b>Aufgabe ${i + 1}: ${esc(t.t)}</b><span class="small muted">max. ${t.pts} P.</span></div>
      <details><summary class="small">Aufgabe und deine Lösung</summary><div class="sv" style="white-space:pre-wrap;margin-top:6px">${esc(t.q)}</div><div class="small" style="white-space:pre-wrap;margin-top:6px">${esc(EX.ans[i] || '–')}</div></details>
      <div class="ans" style="white-space:pre-wrap">${mf(t.sol)}</div>
      <input type="text" inputmode="decimal" data-sc="${i}" placeholder="Deine Punkte (0–${t.pts})" value="${EX.score[i] ?? ''}"></section>`).join('')}
    <button class="btn primary big" data-act="examscore">Ergebnis speichern</button>`;
  const pts = Object.values(EX.score).reduce((a, b) => a + b, 0);
  return `${head}<section class="card" style="text-align:center"><span style="font-size:44px">${pts / max >= (e.tasks.every(t => t.tf) ? 0.75 : 0.5) ? '🎉' : '💪'}</span><h2>${fmtN(pts, 1)} von ${max} Punkten</h2><span class="small muted">${e.tasks.every(t => t.tf) ? (pts / max >= 0.75 ? 'Stark. ' : pts / max >= 0.6 ? 'Solide, aber Raten bringt bei richtig/falsch schon 50 %; ab etwa 75 % bist du sicher. ' : 'Bei richtig/falsch bringt Raten schon die Hälfte; dein Ziel sind 75 % und mehr. ') + 'Die echte Klausur rechnet Rohpunkte wegen der Ratewahrscheinlichkeit noch um.' : pts / max >= 0.5 ? 'Bestanden (Grenze meist 50 %).' : 'Noch unter 50 %. Die schwachen Aufgaben sind jetzt Wiederholungskarten.'} ${EX.weak} ${e.tasks.some(t => t.tf) ? 'falsch beantwortete Aussage' + (EX.weak === 1 ? '' : 'n') : 'Aufgabe' + (EX.weak === 1 ? '' : 'n')} in die Wiederholungen.</span>
    <button class="btn primary" data-act="home">Zum Pfad</button></section>`;
}
function examTick() {
  if (!EX || EX.phase !== 'write') return;
  const el = document.getElementById('exleft'); if (!el) return;
  const left = Math.max(0, EX.e.min * 60 - Math.floor((Date.now() - EX.t0) / 1000));
  el.textContent = '⏳ ' + mmss(left); el.style.color = left < 600 ? 'var(--gold)' : 'var(--muted)';
  if (left === 0) { toast('Zeit ist um'); collectExam(); EX.phase = 'grade'; render(); }
}
setInterval(examTick, 1000);
function collectExam() { app.querySelectorAll('[data-ex]').forEach(t => { EX.ans[t.dataset.ex] = t.value; }); app.querySelectorAll('[data-tf]').forEach(c => { const [i, j] = c.dataset.tf.split(':'); (EX.tf[i] || (EX.tf[i] = {}))[j] = c.checked; }); }

/* ---------- render and actions ---------- */
function render() {
  const h = location.hash.replace(/^#/, '');
  let html;
  if (h.startsWith('l-') && LBY[h.slice(2)]) html = viewRead(LBY[h.slice(2)]);
  else if (h === 'fragen') html = viewQA();
  else if (h === 'wissen') html = viewKnow();
  else if (h === 'alt' && (D.PAST || []).length) html = viewPast();
  else if (h.startsWith('alt-') && (D.PAST || []).find(x => x.id === h.slice(4))) html = viewPastOne(D.PAST.find(x => x.id === h.slice(4)));
  else if (h === 'rechnen' && (D.DRILLS || []).length) html = viewDrills();
  else if (h.startsWith('rechnen-') && (D.DRILLS || []).length) { if (!DR || DR.id !== h.slice(8)) startDrill(h.slice(8)); html = DR ? viewDrill() : viewDrills(); }
  else if (h === 'klausur' && (D.EXAMS || []).length) html = viewExams();
  else if (h.startsWith('klausur-') && (D.EXAMS || []).length) { if (!EX || EX.e.id !== h.slice(8)) startExam(h.slice(8)); html = EX ? viewExam() : viewExams(); }
  else if (SS && h === 'heute') html = SS.stage === 'review' ? viewReview() : SS.stage === 'lesson' ? viewLesson() : SS.stage === 'case' ? viewCase() : viewPlan();
  else if (SS && SS.stage === 'case' && (h === 'fall' || h.startsWith('boss'))) html = viewCase();
  else if (h === 'fall' && doneL().length) { startCase(); return; }
  else if (h.startsWith('boss')) { startBoss(h.slice(5)); if (SS && SS.stage === 'case') return; html = viewHome(); }
  else html = viewHome();
  app.innerHTML = html; window.scrollTo(0, 0); clock();
  const f = app.querySelector('#typed, #nav, #guess, #pre'); if (f && !f.disabled && matchMedia('(pointer:fine)').matches) f.focus();
}
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
function finishLesson() {
  const l = SS.L; P.done[l.id] = today(); if (SS.note) P.notes[l.id] = SS.note;
  for (const id of lessonCards(l)) if (!P.cards[id]) P.cards[id] = { b: 0, due: addDays(1), n: 1, lapses: 0, last: today() };
  for (const id of lessonCards(l)) { const c = cardDef(id); if (c) window.EULE && EULE.push({ src: CFG.src, q: c.q, a: c.a, ref: id }); }
  act(); save(); gainXP(CFG.xp, 120); SS.xp += 120; SS.k = 6;
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v; tick();
  if (a === 'ask') { askOpen(); return; }
  if (a === 'why') { askOpen(); ASK.static = whyHTML(); ASK.title = 'Warum so?'; askDraw(); const box = document.querySelector('.askbox'); if (box) box.scrollTop = 0; return; }
  if (a === 'drillcheck' || a === 'drillskip') { DR.given = val('drillin'); const g = num(DR.given), t = DR.task; const ok = a === 'drillcheck' && isFinite(g) && Math.abs(g - t.a) <= (t.tol ?? Math.max(0.01, Math.abs(t.a) * 0.002)); DR.res = ok ? 'ok' : 'no'; drillScore(ok); render(); return; }
  if (a === 'drillmine') { const x = (P.drills || {})[DR.d.id], y = (P.log || {})['drill:' + DR.d.id]; if (x && DR.res === 'no') { x.ok++; if (y && y.miss) { y.miss--; y.ok++; y.h[y.h.length - 1] = 2; } gainXP(CFG.xp, 20); save(); } startDrill(DR.id); render(); return; }
  if (a === 'drillnext') { startDrill(DR.id); render(); return; }
  if (a === 'ptstart') { PT = { id: location.hash.slice(5), t0: Date.now() }; render(); return; }
  if (a === 'ptsave') {
    const e = D.PAST.find(x => x.id === location.hash.slice(5)); if (!e) return;
    const pts = e.tasks.map((t, i) => { const el = app.querySelector(`[data-pt="${i}"]`); return Math.max(0, Math.min(t[1], num(el ? el.value : '') || 0)); });
    const sum = pts.reduce((x, y) => x + y, 0), sec = PT && PT.id === e.id ? Math.floor((Date.now() - PT.t0) / 1000) : 0;
    ((P.past || (P.past = {}))[e.id] = (P.past[e.id] || [])).push({ d: today(), pts, sum, sec });
    e.tasks.forEach((t, i) => { const q = pts[i] / t[1]; track('past:' + e.id + ':' + i, q >= 0.8 ? 2 : q >= 0.5 ? 1 : 0, { t: e.t + ' · ' + t[0], lid: t[2] && LBY[t[2]] ? t[2] : null, k: 'exam' }); });
    PT = null; act(); save(); gainXP(CFG.xp, Math.round(sum * 2) + 100); toast(fmtN(sum, 1) + ' von ' + e.tasks.reduce((x, t) => x + t[1], 0) + ' Punkten gespeichert'); render(); return;
  }
  if (a === 'examend') { collectExam(); EX.phase = 'grade'; render(); return; }
  if (a === 'examscore') {
    const e = EX.e; let weak = 0;
    app.querySelectorAll('[data-sc]').forEach(inp => { const i = +inp.dataset.sc, t = e.tasks[i], v = Math.max(0, Math.min(t.pts, num(inp.value) || 0)); EX.score[i] = v;
      if (t.tf) { t.tf.forEach((x, j) => { track('exam:' + e.id + ':' + i + ':' + j, !!(EX.tf[i] || {})[j] === !!x[1] ? 2 : 0, { t: x[0], lid: x[3] && LBY[x[3]] ? x[3] : null, k: 'exam' }); if (!!(EX.tf[i] || {})[j] !== !!x[1]) { weak++; const lid = x[3] && LBY[x[3]] ? x[3] : (LESSONS[0] || {}).id || 'x', id = lid + ':q' + uid(); (P.qcards || (P.qcards = {}))[id] = { q: 'Richtig oder falsch? ' + x[0], a: (x[1] ? 'Richtig. ' : 'Falsch. ') + (x[2] || ''), d: today() }; P.cards[id] = { b: 0, due: addDays(1), n: 0, lapses: 0, last: today() }; } }); return; }
      { const q = v / t.pts; track('exam:' + e.id + ':' + i, q >= 0.8 ? 2 : q >= 0.5 ? 1 : 0, { t: e.t + ' · ' + t.t, k: 'exam' }); }
      if (v < t.pts / 2) { weak++; const lid = (LESSONS[0] || {}).id || 'x', id = lid + ':q' + uid(); (P.qcards || (P.qcards = {}))[id] = { q: e.t + ' · ' + t.t + ': ' + t.q.slice(0, 300), a: t.sol.slice(0, 700), d: today() }; P.cards[id] = { b: 0, due: addDays(1), n: 0, lapses: 0, last: today() }; } });
    const pts = Object.values(EX.score).reduce((x, y) => x + y, 0), max = e.tasks.reduce((x, t) => x + t.pts, 0);
    (P.exams || (P.exams = {}))[e.id] = [...((P.exams || {})[e.id] || []), { d: today(), pts, max }];
    EX.weak = weak; EX.phase = 'done'; act(); save(); gainXP(CFG.xp, Math.round(pts * 2) + 100); toast('+' + (Math.round(pts * 2) + 100) + ' XP'); render(); return;
  }
  if (a === 'resetday') { if (!RESET) { RESET = true; render(); setTimeout(() => { RESET = false; if (!SS) render(); }, 4000); return; } RESET = false; const d = P.days[today()]; if (d) { d.sec = 0; save(); } toast('Zeit für heute auf 0:00'); render(); return; }
  if (a === 'home') { e.preventDefault(); SS = null; history.replaceState(null, '', location.pathname); save(); render(); return; }
  if (a === 'today') { startToday(); return; }
  if (a === 'plan') { SS.stage = 'plan'; SS.total = 0; render(); return; }
  if (a === 'lesson') { startLesson(nextLesson()); return; }
  if (a === 'fall') { startCase(); return; }
  // reviews
  if (a === 'conf' || a === 'check') {
    SS.typed = val('typed'); SS.conf = a === 'conf' ? v : null;
    const c = cardDef(SS.queue[SS.i].id);
    if (c.type === 'nav') { SS.navRes = checkNorm(SS.typed, c.a); SS.conf = 'sure'; }
    SS.shown = true; render(); return;
  }
  if (a === 'rate') {
    const it = SS.queue[SS.i], r = +v;
    rate(it.id, r, it.retry);
    if (!it.retry) { const cd = cardDef(it.id); track(it.id, r, { t: cd.q, lid: cd.lid, k: 'card' }); }
    if (SS.conf === 'sure' && !it.retry) { P.cal.n++; if (r === 2) P.cal.hit++; else P.cal.over++; }
    if (r === 0) SS.queue.push({ id: it.id, retry: true }); // successive relearning: back into this session
    if (r < 2 && !it.retry) { const c = cardDef(it.id); window.EULE && EULE.push({ src: CFG.src, q: c.q, a: c.a, ref: it.id }); }
    if (!it.retry) { const d = P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 }); d.rev = (d.rev || 0) + 1; gainXP(CFG.xp, r === 2 ? 8 : 4); }
    act(); save(); SS.i++; SS.shown = false; SS.typed = ''; SS.conf = null; SS.navRes = null;
    if (SS.i >= SS.queue.length) afterReviews(); else render(); return;
  }
  // lesson
  if (a === 'next') {
    if (SS.k === 0) SS.pre = val('pre');
    if (SS.k === 4) { SS.note = val('note'); const l = SS.L; SS.recall = { queue: shuffle(l.cards.map((_, i) => ({ id: l.id + ':c' + i }))), i: 0, shown: false }; }
    SS.k++; SS.step = 0; SS.guess = ''; SS.open = false; render(); return;
  }
  if (a === 'reveal') { const g = val('guess'); if (g && g.trim()) (SS.mine || (SS.mine = {}))[SS.step] = g.trim(); SS.guess = ''; SS.open = true; render(); return; }
  if (a === 'lrate') {
    const l = SS.L, st = l.case.steps[SS.step], key = l.id + ':s' + SS.step, r = +v;
    track(key, r, { t: st[0], lid: l.id, k: 'step' });
    stepCard(key, l.id, 'Fall: ' + l.case.sv.slice(0, 260) + (l.case.sv.length > 260 ? ' …' : '') + '\n→ ' + st[0], st[1], r);
    if (r < 2) window.EULE && EULE.push({ src: CFG.src, q: 'Fall: ' + l.case.sv.slice(0, 220) + '\n→ ' + st[0], a: st[1] });
    act(); save(); SS.open = false; SS.step++; render(); return;
  }
  if (a === 'calc') { const out = document.getElementById('calcout'), g = val('guess'); if (out) out.innerHTML = calcHTML(g) || '<div class="calcout small muted">Keine Rechnung erkannt. Beispiel: 100.000 · ANF(5 %; 10)</div>'; return; }
  if (a === 'navcheck') { SS.navGiven = val('nav'); SS.navRes = checkNorm(SS.navGiven, SS.L.nav[SS.navI][1]); render(); return; }
  if (a === 'navskip') { SS.k = 4; render(); return; }
  if (a === 'navnext') { SS.navI++; SS.navGiven = ''; SS.navRes = null; if (SS.navI >= SS.L.nav.length) SS.k = 4; render(); return; }
  if (a === 'linkshow') { SS.note = val('note'); SS.linkShown = true; render(); return; }
  if (a === 'rshow') { SS.recall.shown = true; render(); return; }
  if (a === 'rrate') {
    const R = SS.recall, it = R.queue[R.i];
    if (!it.retry) { const cd = cardDef(it.id); track(it.id, +v, { t: cd.q, lid: cd.lid, k: 'card' }); save(); }
    if (+v === 0) R.queue.push({ id: it.id, retry: true });
    R.i++; R.shown = false;
    if (R.i >= R.queue.length) finishLesson();
    render(); return;
  }
  // case training and boss
  if (a === 'pick') { SS.C.pick = v; render(); return; }
  if (a === 'sreveal') { SS.C.guess = val('guess'); SS.C.shown = true; render(); return; }
  if (a === 'step') {
    const C = SS.C, st = C.steps[C.s], r = +v, lid = st[2] || (C.L && C.L.id), key = (C.boss ? 'boss-' + C.mod : C.key) + ':' + C.s;
    track(key, r, { t: st[0], lid, k: 'step' });
    stepCard(key, lid, 'Fall: ' + C.sv.slice(0, 260) + (C.sv.length > 260 ? ' …' : '') + '\n→ ' + st[0], st[1], r);
    if (r === 0) { C.miss++; refresh(lid); }
    if (r < 2) { C.part = (C.part || 0) + (r === 1); window.EULE && EULE.push({ src: CFG.src, q: 'Fall: ' + C.sv.slice(0, 220) + (C.sv.length > 220 ? ' …' : '') + '\n→ ' + st[0], a: st[1] }); }
    act(); save(); C.s++; C.shown = false; C.guess = ''; render(); return;
  }
  if (a === 'casedone') {
    const C = SS.C, xp = C.boss ? (C.miss <= 1 ? 300 : 160) : 50 + (C.pick === (C.L || {}).id ? 20 : 0);
    if (C.boss && C.miss <= 1) P.boss[C.mod] = today();
    if (!C.boss) { P.caseLast[C.L.id] = today(); (P.caseSeen || (P.caseSeen = {}))[C.key] = Date.now(); P.lastCaseL = C.L.id; }
    act(); save(); gainXP(CFG.xp, xp); toast('+' + xp + ' XP');
    if (SS.kind === 'today') { SS.stage = 'plan'; SS.total = 0; location.hash = 'heute'; } else { SS = null; history.replaceState(null, '', location.pathname); }
    render(); return;
  }
});
app.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  const btn = app.querySelector('[data-act="check"], [data-act="navcheck"], [data-act="drillcheck"], [data-act="conf"][data-v="sure"]'); if (btn) { e.preventDefault(); btn.click(); }
});
window.addEventListener('hashchange', () => { if (!/^#(heute|fall|boss(-\w+)?)$/.test(location.hash) && !location.hash.startsWith('#l-')) SS = null; if (!location.hash.startsWith('#rechnen-')) DR = null; if (!location.hash.startsWith('#klausur-')) { if (EX && EX.phase === 'write') collectExam(); EX = null; } render(); });
{ const before = JSON.stringify(P.meta || null); const P0 = P.updated; save(); if (before === JSON.stringify(P.meta)) { P.updated = P0; LS.set(CFG.key, P); } }
render();
window.STB_TEST = { P, checkNorm, rate, interleave, LESSONS, track, knowStats };
