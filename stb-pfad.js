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
const D = window.STB_PFAD;
const P = Object.assign({ done: {}, cards: {}, days: {}, boss: {}, notes: {}, cal: { n: 0, hit: 0, over: 0 }, caseLast: {}, qa: [], qcards: {} }, LS.get('echo-stbpfad', {}));
const save = () => {
  const ms = D.ROADMAP.filter(m => (D.LESSONS[m.id] || []).length), cur = ms.find(m => D.LESSONS[m.id].some(l => !P.done[l.id])) || ms[ms.length - 1];
  const ls = D.LESSONS[cur.id], n = ls.filter(l => P.done[l.id]).length;
  P.meta = { mod: D.ROADMAP.indexOf(cur) + 1, mods: D.ROADMAP.length, name: cur.n, lesson: Math.min(n + 1, ls.length), of: ls.length, done: Object.keys(P.done).length, total: ms.reduce((a, m) => a + D.LESSONS[m.id].length, 0) };
  P.updated = Date.now(); LS.set('echo-stbpfad', P);
};
const LADDER = [1, 3, 7, 16, 35, 90, 180];
const MASTER = 3; // box 3 = the card survived a gap of a week or more
const LESSONS = []; for (const m of D.ROADMAP) for (const l of (D.LESSONS[m.id] || [])) LESSONS.push(Object.assign({ mod: m.id }, l));
const LBY = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const doneL = () => LESSONS.filter(l => P.done[l.id]);

/* ---------- cards ---------- */
function cardDef(id) {
  const [lid, k] = id.split(':'), l = LBY[lid]; if (!l) return null;
  const i = +k.slice(1);
  if (k[0] === 'q') { const c = (P.qcards || {})[id]; return c && { id, lid, type: 'recall', q: c.q, a: c.a, own: true }; }
  if (k[0] === 'c') { const c = l.cards[i]; return c && { id, lid, type: 'recall', q: c[0], a: c[1] }; }
  const n = (l.nav || [])[i]; return n && { id, lid, type: 'nav', q: n[0], a: n[1] };
}
const lessonCards = l => [...l.cards.map((_, i) => l.id + ':c' + i), ...(l.nav || []).map((_, i) => l.id + ':n' + i)];
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
function refresh(lid) { for (const id of lessonCards(LBY[lid])) { const c = P.cards[id]; if (c && c.due > addDays(1)) { c.due = addDays(1); c.b = Math.max(0, c.b - 1); } } }

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
let lastInput = Date.now(), CLK = null, RESET = false;
function tick() { lastInput = Date.now(); }
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, tick, { passive: true }));
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function clock() {
  if (SS && !CLK) {
    const el = document.createElement('div'); el.id = 'clk';
    el.style.cssText = 'position:fixed;bottom:calc(12px + env(safe-area-inset-bottom));left:12px;z-index:50;background:var(--surface);border:2px solid var(--calm);border-radius:99px;padding:6px 12px;font:600 14px var(--f-mono);box-shadow:0 4px 16px rgba(0,0,0,.15)';
    document.body.appendChild(el);
    CLK = { el, sec: 0, iv: setInterval(() => {
      const idle = Date.now() - lastInput > 180000, hidden = document.visibilityState !== 'visible';
      if (!idle && !hidden) { CLK.sec++; const d = P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 }); d.sec = (d.sec || 0) + 1; if (CLK.sec % 15 === 0) save(); }
      const tm = minToday();
      CLK.el.innerHTML = `${idle || hidden ? '⏸' : '⏱'} ${mmss(CLK.sec)} <span style="color:var(--muted);font-weight:500">· heute ${tm}/30</span>`;
      CLK.el.style.borderColor = tm >= 30 ? 'var(--gold)' : 'var(--calm)';
    }, 1000) };
    CLK.el.innerHTML = `⏱ 0:00 <span style="color:var(--muted);font-weight:500">· heute ${minToday()}/30</span>`;
  } else if (!SS && CLK) {
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
function lessonDay() { const ds = Object.values(P.done); return !ds.includes(today()) && !ds.includes(addDays(-1)); }

/* ---------- small UI pieces ---------- */
const back = h => `<a class="link" href="${h}">← ${h === 'index.html#games' ? 'Spiele' : 'StB-Pfad'}</a>`;
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
  SS = Object.assign(SS || { kind: 'today', xp: 0 }, { stage: 'lesson', L: l, k: 0, pre: '', step: 0, guess: '', navI: 0, navGiven: '', navRes: null, note: P.notes[l.id] || '', linkShown: false, recall: null });
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
    return `<div class="mod${ls.length ? '' : ' lock'}"><span class="big">${m.em}</span><div class="stack" style="gap:0;min-width:0"><b>${esc(m.n)}</b><span class="small muted">Woche ${m.w} · ${esc(m.goal)}</span>${!cur && ls.length ? `<details style="margin-top:4px"><summary class="small muted">${ls.length} Lektionen ansehen</summary><div class="stack" style="gap:2px;margin-top:6px">${ls.map((l, i) => `<a class="small" href="#l-${l.id}" style="color:${P.done[l.id] ? 'var(--ink)' : 'var(--muted)'};text-decoration:none">${P.done[l.id] ? '✓' : '○'} ${i + 1}. ${esc(l.t)}</a>`).join('')}</div></details>` : ''}${cur && ls.length ? `<div class="stack" style="gap:2px;margin-top:6px">${ls.map((l, i) => `<a class="small" href="#l-${l.id}" style="color:${P.done[l.id] ? 'var(--ink)' : 'var(--muted)'};text-decoration:none">${P.done[l.id] ? '✓' : '○'} ${i + 1}. ${esc(l.t)}</a>`).join('')}${D.BOSS[m.id] ? `<span class="small" style="color:${P.boss[m.id] ? 'var(--ink)' : 'var(--muted)'}">${P.boss[m.id] ? '🏆' : '🔒'} Abschlussfall: ${esc(D.BOSS[m.id].t)}</span>` : ''}</div>` : ''}</div><span class="mono small muted">${ls.length ? n + '/' + ls.length : 'bald'}</span></div>`; };
  return `<div class="topbar">${back('index.html#games')}<button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button></div>
  <header class="stack" style="gap:4px"><span class="eyebrow">${esc(r.name)}${r.next ? ' · nächster Rang bei ' + r.next[0] + ' sicheren Karten' : ''}</span><h1>⚖️ StB-Pfad</h1></header>
  <section class="card" style="border:2px solid var(--calm)"><div class="row spread"><h3>Heute</h3><span class="mono" style="font-size:20px;font-weight:600">⏱ ${mmss(sec)}</span></div>
    <span>${plan} · ${todayL}</span>
    <div class="bar"><i style="width:${Math.min(100, Math.round(sec / 1800 * 100))}%"></i></div><div class="row spread"><span class="small muted">${mmss(sec)} von 30:00 heute${sec >= 1800 ? ' ✓' : ''}</span>${sec ? `<button class="link small" data-act="resetday" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--muted)">${RESET ? 'Wirklich auf 0:00?' : '↺ Zeit zurücksetzen'}</button>` : ''}</div>
    <button class="btn primary big" data-act="today">${minToday() ? 'Weitermachen' : 'Starten'}</button></section>
  <section class="card"><div class="row" style="justify-content:space-around;text-align:center">
    <div class="stack" style="gap:0"><b style="font-size:24px">🔥 ${st}</b><span class="small muted">Tage am Stück</span></div>
    <div class="stack" style="gap:0"><b style="font-size:24px">${mastered()}</b><span class="small muted">Karten sitzen</span></div>
    <div class="stack" style="gap:0"><b style="font-size:24px">${cal}</b><span class="small muted">„Sicher“ und richtig</span></div></div>
    <div class="stack" style="gap:4px"><div class="row spread"><span class="small">Jahresziel</span><span class="small muted mono">${h.toFixed(1)} / 180 h · ${weekMin()} min diese Woche</span></div><div class="bar gold"><i style="width:${Math.min(100, h / 180 * 100)}%"></i></div></div></section>
  ${dl.length >= 2 ? `<a class="card" href="#fall" style="text-decoration:none;color:inherit"><div class="row"><span class="big">🧩</span><div class="stack grow" style="gap:0"><h3>Fall-Training</h3><span class="small muted">Gemischter Fall: erst erkennen, welches Thema greift, dann selbst lösen</span></div></div></a>` : ''}
  ${bosses.map(m => `<a class="card" href="#boss-${m.id}" style="text-decoration:none;color:inherit;${P.boss[m.id] ? '' : 'border:2px solid var(--gold)'}"><div class="row"><span class="big">${P.boss[m.id] ? '🏆' : '👹'}</span><div class="stack grow" style="gap:0"><h3>Abschlussfall: ${esc(D.BOSS[m.id].t)}</h3><span class="small muted">${esc(m.n)} · ${P.boss[m.id] ? 'bestanden, jederzeit wiederholbar' : 'alle Lektionen des Moduls in einem Fall'}</span></div></div></a>`).join('')}
  ${P.qa.length ? `<a class="card" href="#fragen" style="text-decoration:none;color:inherit"><div class="row"><span class="big">❓</span><div class="stack grow" style="gap:0"><h3>Deine Fragen</h3><span class="small muted">${P.qa.length} gestellt · zuletzt: ${esc(P.qa[P.qa.length - 1].q.slice(0, 70))}</span></div></div></a>` : ''}
  <section class="card"><h3>Der rote Faden</h3>${D.ROADMAP.map(modRow).join('')}</section>
  <section class="card"><h3>Ränge</h3><div class="stack" style="gap:2px">${D.RANKS.map(x => `<span class="small" style="color:${r.m >= x[0] ? 'var(--ink)' : 'var(--muted)'}">${r.m >= x[0] ? '●' : '○'} ${esc(x[1])} <span class="muted">· ab ${x[0]} sicheren Karten</span></span>`).join('')}</div><span class="small muted">„Sicher“ heißt: Die Karte wurde nach einer Pause von mindestens einer Woche noch gewusst. Nur das zählt, nicht wie oft du sie gesehen hast.</span></section>
  <details class="card"><summary>Warum dieser Ablauf?</summary><div class="stack small" style="gap:6px;line-height:1.5;margin-top:8px">
    <span><b>Abrufen vor Nachlesen.</b> Jede Einheit beginnt mit Fragen. Sich erinnern festigt Wissen stärker als erneutes Lesen.</span>
    <span><b>Wachsende Abstände.</b> Eine Karte kommt nach 1, 3, 7, 16, 35, 90 und 180 Tagen wieder, solange du sie weißt. Wer sie vergisst, beginnt wieder vorn.</span>
    <span><b>Bis es einmal sitzt.</b> Eine verpasste Karte kommt in derselben Sitzung noch einmal, bis du sie richtig hast.</span>
    <span><b>Gemischt üben.</b> Wiederholungen und Fälle mischen die Themen. So lernst du zu erkennen, welche Norm greift.</span>
    <span><b>Erst Vorbild, dann selbst.</b> In den ersten Lektionen siehst du den Lösungsweg. Danach schreibst du jeden Schritt zuerst selbst.</span>
    <span><b>Vorab-Frage und eigene Worte.</b> Eine Frage vor der Lektion und ein Satz in eigenen Worten danach machen das Neue besser merkbar.</span>
    <span><b>Sicher oder unsicher?</b> Das Gefühl „kann ich“ trügt. Deshalb zeigt Echo, wie oft du richtig lagst, wenn du dir sicher warst.</span>
    <span><b>Jeden Tag ein wenig.</b> 25 Minuten täglich schlagen drei Stunden am Sonntag, auch weil Schlaf das Gelernte festigt. Neue Lektionen kommen jeden zweiten Tag; dazwischen wird wiederholt.</span>
    <span class="muted">Ehrlich: Ein Jahr mit 30 Minuten am Tag legt das Fundament über alle Prüfungsgebiete. Für die Klausuren selbst planen Repetitorien danach noch einmal 12 bis 15 Monate intensiv, mit Dutzenden Probeklausuren.</span></div></details>
  <a class="card" href="spiele.html#stb" style="text-decoration:none;color:inherit"><div class="row"><span class="big">🎮</span><div class="stack grow" style="gap:0"><h3>Steuer-Akademie</h3><span class="small muted">Die Spiele als Zusatztraining: Sortieren, Fristen, Paragrafen-Jagd</span></div></div></a>`;
}

function viewReview() {
  const it = SS.queue[SS.i], c = cardDef(it.id), l = LBY[c.lid];
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← StB-Pfad</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button><span class="small muted mono">${Math.min(SS.i + 1, SS.queue.length)} / ${SS.queue.length}</span></div>
  <span class="eyebrow">Wiederholung${it.retry ? ' · noch einmal, bis es sitzt' : ''} · ${esc(l.t)}</span>`;
  if (!SS.shown) {
    return `${head}<section class="card"><h2 style="line-height:1.35">${esc(c.q)}</h2>
      <input type="text" id="typed" placeholder="${c.type === 'nav' ? 'z. B. § 9 Abs. 1 EStG' : 'Deine Antwort (Tippen hilft beim Erinnern)'}" value="${esc(SS.typed)}" autocomplete="off">
      ${c.type === 'nav' ? `<button class="btn primary" data-act="check">Prüfen</button>` : `<span class="small muted">Wie sicher bist du?</span><div class="conf"><button class="btn" data-act="conf" data-v="unsure">Unsicher</button><button class="btn" data-act="conf" data-v="sure">Sicher</button></div>`}</section>`;
  }
  const res = c.type === 'nav' ? ['❌ Nicht ganz', '🟡 Richtige Norm, Absatz oder Satz fehlt oder weicht ab', '✅ Genau'][SS.navRes] : '';
  return `${head}<section class="card"><span class="small muted">${esc(c.q)}</span>${SS.typed ? `<span class="small">Du: ${esc(SS.typed)}</span>` : ''}${res ? `<b>${res}</b>` : ''}
    <div class="ans">${esc(c.a)}</div>${rateBtns()}</section>`;
}

function viewPlan() {
  const nl = nextLesson(), dl = doneL();
  const reviewed = SS.total ? `<span>✓ ${SS.total} Wiederholung${SS.total === 1 ? '' : 'en'} geschafft.</span>` : '';
  const opts = [];
  if (nl && lessonDay()) opts.push(`<button class="btn primary big" data-act="lesson">Neue Lektion: ${esc(nl.t)}</button>`);
  if (dl.length >= 1) opts.push(`<button class="btn${nl && lessonDay() ? '' : ' primary big'}" data-act="fall">🧩 Fall-Training</button>`);
  if (nl && !lessonDay()) opts.push(`<button class="btn" data-act="lesson">Trotzdem neue Lektion (${esc(nl.t)})</button>`);
  if (!nl && !dl.length) opts.push('<span>Noch keine Lektion vorhanden.</span>');
  return `<div class="topbar"><a class="link" href="#" data-act="home">← StB-Pfad</a></div>
  <section class="card"><h2>Weiter geht's</h2>${reviewed}
  ${nl && !lessonDay() ? '<span class="small muted">Gestern gab es eine neue Lektion. Heute festigst du sie: Abstand zwischen den Lektionen hält länger als Tempo.</span>' : ''}
  ${!nl ? '<span class="small muted">Alle verfügbaren Lektionen sind gelernt. Das nächste Modul folgt; bis dahin halten Wiederholungen und Fälle das Wissen frisch.</span>' : ''}
  <div class="stack" style="gap:8px">${opts.join('')}</div><button class="btn" data-act="home">Für heute fertig</button></section>`;
}

/* lesson: 0 pre-question · 1 why, core, schema · 2 worked or self-solved case · 3 paragraph navigation · 4 own words and link · 5 immediate recall · 6 done */
function viewLesson() {
  const l = SS.L, k = SS.k, fading = doneL().length >= 3;
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← StB-Pfad</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button><span class="small muted">Lektion ${LESSONS.indexOf(l) + 1}</span></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${esc(l.t)}</h1><div class="row" style="flex-wrap:wrap;gap:6px">${norms(l)}</div>${phase(6, k)}</header>`;
  if (k === 0) return `${head}<section class="card"><span class="eyebrow">Vorab-Frage</span><h2 style="line-height:1.35">${esc(l.cards[0][0])}</h2>
    <span class="small muted">Rate ruhig, bevor du liest. Auch eine falsche Vermutung macht die Antwort danach merkbarer.</span>
    <textarea id="pre" placeholder="Deine Vermutung">${esc(SS.pre)}</textarea><button class="btn primary" data-act="next">Zur Lektion</button></section>`;
  if (k === 1) return `${head}<section class="card"><span class="eyebrow">Roter Faden</span><div class="why">${esc(l.why)}</div></section>
    <section class="card core">${l.core.map(p => `<p>${esc(p)}</p>`).join('')}</section>
    <section class="card"><span class="eyebrow">Prüfschema</span><ol class="schema">${l.schema.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
    <section class="card"><span class="eyebrow">Deine Vorab-Frage</span><span class="small muted">${esc(l.cards[0][0])}</span>${SS.pre ? `<span class="small">Du: ${esc(SS.pre)}</span>` : ''}<div class="ans">${esc(l.cards[0][1])}</div>
    <button class="btn primary" data-act="next">Zum Fall</button></section>`;
  if (k === 2) {
    const c = l.case, s = SS.step, done = s >= c.steps.length;
    const shown = c.steps.slice(0, s).map(([q, a]) => `<div class="step open"><b>${esc(q)}</b><div class="ans">${esc(a)}</div></div>`).join('');
    const cur = done ? `<div class="ans"><b>Ergebnis:</b> ${esc(c.res)}</div><button class="btn primary" data-act="next">Weiter zur Paragrafen-Navigation</button>`
      : fading ? `<div class="step"><b>${esc(c.steps[s][0])}</b><textarea id="guess" placeholder="Erst selbst lösen, dann aufdecken">${esc(SS.guess)}</textarea><button class="btn primary" data-act="reveal">Aufdecken</button></div>`
        : `<div class="step"><b>${esc(c.steps[s][0])}</b><span class="small muted">Überleg kurz selbst, dann deck den Schritt auf.</span><button class="btn primary" data-act="reveal">Schritt zeigen</button></div>`;
    return `${head}<section class="card"><span class="eyebrow">${fading ? 'Fall · selbst lösen' : 'Fall · Lösungsweg zum Mitdenken'}</span><div class="sv">${esc(c.sv)}</div>${shown}${cur}</section>`;
  }
  if (k === 3) {
    const n = l.nav[SS.navI];
    if (!n) { SS.k = 4; return viewLesson(); }
    const res = SS.navRes;
    return `${head}<section class="card"><span class="eyebrow">Paragrafen-Navigation ${SS.navI + 1}/${l.nav.length}</span><h2 style="line-height:1.35">${esc(n[0])}</h2>
      <span class="small muted">Tippen, nicht raten: Gesetz, Paragraf, Absatz, Satz, Nummer.</span>
      <input type="text" id="nav" value="${esc(SS.navGiven)}" placeholder="z. B. § 2 Abs. 5 EStG" autocomplete="off" ${res != null ? 'disabled' : ''}>
      ${res == null ? '<button class="btn primary" data-act="navcheck">Prüfen</button>' : `<b>${['❌ Nicht ganz', '🟡 Richtige Norm, die Fundstelle weicht ab', '✅ Genau'][res]}</b><div class="ans">${esc(n[1])}</div><button class="btn primary" data-act="navnext">Weiter</button>`}</section>`;
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
      ${R.shown ? `<div class="ans">${esc(c.a)}</div><div class="rate"><button class="btn" data-act="rrate" data-v="0">Nicht gewusst</button><button class="btn primary" data-act="rrate" data-v="2">Gewusst</button></div>`
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
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← StB-Pfad</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button><span class="small muted">${C.boss ? 'Abschlussfall' : 'Fall-Training'}</span></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${C.boss ? '👹 ' + esc(C.title) : '🧩 Gemischter Fall'}</h1>${C.boss ? '' : `<span class="small muted">${C.repeat ? 'Alle Fälle zu deinen bisherigen Lektionen hast du heute schon gelöst, das hier ist eine Wiederholung. Mit jeder neuen Lektion kommen neue Fälle dazu.' : `Fall ${C.idx} von ${C.of} zu diesem Thema · ${doneL().length} Lektion${doneL().length === 1 ? '' : 'en'} im Fallpool`}</span>`}${phase(C.steps.length + (C.boss ? 0 : 1), (C.pick ? 1 : 0) * (C.boss ? 0 : 1) + C.s)}</header>
  <section class="card"><div class="sv">${esc(C.sv)}</div></section>`;
  if (!C.pick) return `${head}<section class="card"><h3>Welches Thema steckt im Kern dieses Falls?</h3><span class="small muted">In der Klausur steht nirgends, welche Norm gefragt ist. Erkennen ist die halbe Lösung.</span>
    <div class="opts">${C.opts.map(o => `<button class="opt" data-act="pick" data-v="${o.id}">${esc(o.t)}</button>`).join('')}</div></section>`;
  const pickFb = C.boss ? '' : `<section class="card"><b>${C.pick === C.L.id ? '✅ Richtig erkannt' : '❌ Gemeint war: ' + esc(C.L.t)}</b></section>`;
  const prev = C.steps.slice(0, C.s).map(st => `<div class="step open"><b>${esc(st[0])}</b><div class="ans">${esc(st[1])}</div></div>`).join('');
  if (done) return `${head}${pickFb}<section class="card">${prev}<div class="ans"><b>Ergebnis:</b> ${esc(C.res)}</div>
    <span class="small muted">${C.miss ? `${C.miss} Schritt${C.miss === 1 ? '' : 'e'} nicht getroffen; die passenden Karten kommen morgen wieder.` : 'Alle Schritte getroffen.'}</span>
    <button class="btn primary" data-act="casedone">Abschließen</button></section>`;
  const st = C.steps[C.s];
  return `${head}${pickFb}<section class="card">${prev}<div class="step"><b>${esc(st[0])}</b>${st[2] && C.boss ? `<span class="small muted">Thema: ${esc(LBY[st[2]].t)}</span>` : ''}
    ${C.shown ? `${C.guess ? `<span class="small">Du: ${esc(C.guess)}</span>` : ''}<div class="ans">${esc(st[1])}</div><div class="rate" style="grid-template-columns:1fr 1fr"><button class="btn" data-act="step" data-v="0">Nicht getroffen</button><button class="btn primary" data-act="step" data-v="1">Getroffen</button></div>`
      : `<textarea id="guess" placeholder="Deine Lösung für diesen Schritt">${esc(C.guess)}</textarea><button class="btn primary" data-act="sreveal">Aufdecken</button>`}</div></section>`;
}

function viewRead(l) {
  return `<div class="topbar"><a class="link" href="#">← StB-Pfad</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${esc(l.t)}</h1><div class="row" style="flex-wrap:wrap;gap:6px">${norms(l)}</div></header>
  ${P.done[l.id] ? '' : '<section class="card"><span class="small muted">Diese Lektion kommt noch. Lies ruhig vor, aber am meisten bringt sie, wenn du sie mit Vorab-Frage und Fall im Tagesablauf lernst.</span></section>'}
  <section class="card"><span class="eyebrow">Roter Faden</span><div class="why">${esc(l.why)}</div></section>
  <section class="card core">${l.core.map(p => `<p>${esc(p)}</p>`).join('')}</section>
  <section class="card"><span class="eyebrow">Prüfschema</span><ol class="schema">${l.schema.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
  <details class="card"><summary>Fall mit Lösung</summary><div class="sv" style="margin-top:8px">${esc(l.case.sv)}</div>${l.case.steps.map(([q, a]) => `<div class="step open"><b>${esc(q)}</b><div class="ans">${esc(a)}</div></div>`).join('')}<div class="ans"><b>Ergebnis:</b> ${esc(l.case.res)}</div></details>
  ${qaList(l.id)}
  ${P.notes[l.id] ? `<section class="card"><span class="eyebrow">Deine eigenen Worte</span><span>${esc(P.notes[l.id])}</span></section>` : ''}`;
}

/* ---------- questions: ask about whatever is on screen, the answer is saved and can become a card ---------- */
let ASK = null;
function ctxNow() {
  const h = location.hash.replace(/^#/, '');
  let l = null, item = '';
  if (h.startsWith('l-')) l = LBY[h.slice(2)];
  else if (SS && SS.stage === 'lesson') { l = SS.L; if (SS.k === 2 && SS.L.case.steps[SS.step]) item = 'Aktueller Fallschritt: ' + SS.L.case.steps[SS.step][0]; }
  else if (SS && SS.stage === 'review') { const c = cardDef(SS.queue[SS.i].id); l = LBY[c.lid]; item = 'Aktuelle Karte: ' + c.q + (SS.shown ? ' | Lösung: ' + c.a : ''); }
  else if (SS && SS.stage === 'case') { const C = SS.C, st = C.steps[C.s]; l = C.L || (st && LBY[st[2]]) || null; item = 'Sachverhalt: ' + C.sv + (st ? ' | Aktueller Schritt: ' + st[0] + (C.shown ? ' | Lösung: ' + st[1] : '') : ''); }
  return { l, item };
}
function ctxText(l, item) {
  const done = doneL().map(x => x.t).join('; ');
  return [l ? `Lektion „${l.t}“ (${l.norms.join(', ')}).\nRoter Faden: ${l.why}\nKern: ${l.core.join(' ')}\nPrüfschema: ${l.schema.join(' → ')}\nFall: ${l.case.sv} Ergebnis: ${l.case.res}` : 'Keine bestimmte Lektion offen.', item, done ? 'Bereits gelernt: ' + done : ''].filter(Boolean).join('\n\n');
}
const SYS = 'Du bist ein erfahrener Tutor für die deutsche Steuerberaterprüfung. Rechtsstand 2026. Der Lernende arbeitet sich mit einem Lernpfad ins Steuerrecht ein und stellt eine Verständnisfrage. ' +
  'Antworte auf Deutsch, präzise und knapp (höchstens etwa 200 Wörter), mit Fundstellen (Gesetz, Paragraf, Absatz, Satz; ggf. R/H der Richtlinien oder BFH). Erkläre zuerst das Warum: die Systematik und den Zweck der Regel, dann die Folge, gern mit einem Mini-Beispiel. ' +
  'Erfinde keine Beträge, Fristen oder Urteile. Wenn du dir bei einer Zahl oder einem aktuellen Rechtsstand nicht sicher bist, sag das ausdrücklich und nenne, wo man es nachprüft. ' +
  'Beende die Antwort mit einer eigenen letzten Zeile im Format „KARTE: <kurze Abruffrage> || <Antwort in ein bis zwei Sätzen>“, die den Kern deiner Erklärung als Lernkarte festhält. Kein Markdown außer Absätzen.';
function askOpen() {
  const { l, item } = ctxNow();
  ASK = { lid: l ? l.id : null, ctx: ctxText(l, item), msgs: [], busy: false, err: '', card: null, saved: false, title: l ? l.t : 'Steuerrecht allgemein' };
  askDraw();
}
function askDraw() {
  let o = document.getElementById('askov');
  if (!ASK) { if (o) o.remove(); return; }
  if (!o) { o = document.createElement('div'); o.id = 'askov'; o.className = 'askov'; document.body.appendChild(o); o.addEventListener('click', askClick); }
  const thread = ASK.msgs.map(m => m.role === 'user' ? `<div class="askq">${esc(m.content.split('\n\nFrage: ').pop())}</div>` : `<div class="aska">${esc(m.shown || m.content).replace(/\n/g, '<br>')}</div>`).join('');
  const key = hasAI();
  o.innerHTML = `<div class="askbox"><div class="row spread"><span class="eyebrow">❓ Frage · ${esc(ASK.title)}</span><button class="link" data-q="close" style="background:none;border:0;font:inherit;cursor:pointer">Schließen</button></div>
    ${thread || '<span class="small muted">Frag, was dir unklar ist, z. B. warum etwas an dieser Stelle im Schema steht. Die Antwort kennt die Lektion, die gerade offen ist, und wird gespeichert.</span>'}
    ${ASK.busy ? '<span class="small muted">Denkt nach …</span>' : ''}${ASK.err ? `<span class="small" style="color:var(--warn,#b45309)">${esc(ASK.err)}</span>` : ''}
    ${ASK.card && !ASK.saved ? `<div class="card flat" style="gap:6px"><span class="eyebrow">Als Lernkarte übernehmen?</span><b class="small">${esc(ASK.card[0])}</b><span class="small muted">${esc(ASK.card[1])}</span><button class="btn" data-q="card">＋ In die Wiederholungen</button></div>` : ASK.saved ? '<span class="small muted">✓ Karte ist in deinen Wiederholungen, zum ersten Mal morgen.</span>' : ''}
    ${key ? `<textarea id="askin" placeholder="${ASK.msgs.length ? 'Nachfrage …' : 'Deine Frage …'}" rows="3"></textarea><div class="row" style="gap:8px"><button class="btn" data-q="mic" aria-label="Diktieren">🎤</button><button class="btn primary grow" data-q="send" ${ASK.busy ? 'disabled' : ''}>Fragen</button></div>`
      : `<span class="small">Für Antworten braucht Echo deinen Anthropic-Schlüssel (Echo → Einstellungen). Bis dahin kannst du die Frage hier notieren; sie wird gespeichert und du kannst sie später stellen.</span><textarea id="askin" placeholder="Deine Frage …" rows="3"></textarea><button class="btn primary" data-q="note">Frage notieren</button>`}</div>`;
  const ta = o.querySelector('#askin'); if (ta && !ASK.busy) setTimeout(() => ta.focus(), 30);
  const box = o.querySelector('.askbox'); box.scrollTop = box.scrollHeight;
}
async function askSend(text) {
  ASK.busy = true; ASK.err = '';
  const first = !ASK.msgs.length;
  ASK.msgs.push({ role: 'user', content: first ? 'Kontext aus dem Lernpfad:\n' + ASK.ctx + '\n\nFrage: ' + text : text });
  askDraw();
  try {
    const s = LS.get('echo-settings', {});
    const ans = await askAI(SYS, ASK.msgs.map(m => ({ role: m.role, content: m.content })), 900, s.model || s.fastModel);
    const m = ans.match(/\n?\s*KARTE:\s*(.+?)\s*\|\|\s*([\s\S]+?)\s*$/);
    const shown = m ? ans.slice(0, m.index).trim() : ans;
    ASK.msgs.push({ role: 'assistant', content: ans, shown });
    if (m) { ASK.card = [m[1].trim(), m[2].trim()]; ASK.saved = false; }
    P.qa.push({ d: today(), lid: ASK.lid, q: text, a: shown }); save(); gainXP('stbpfad-frage', 10);
    window.EULE && EULE.push({ src: 'stb', q: m ? ASK.card[0] : text, a: m ? ASK.card[1] : shown.slice(0, 600) });
  } catch (e) { ASK.err = 'Keine Antwort: ' + e.message; ASK.msgs.pop(); }
  ASK.busy = false; askDraw();
}
function askClick(e) {
  if (e.target.id === 'askov') { ASK = null; askDraw(); return; }
  const b = e.target.closest("[data-q]"); if (!b) return; const k = b.dataset.q;
  const ta = document.getElementById('askin'), text = ta ? ta.value.trim() : '';
  if (k === 'close') { ASK = null; askDraw(); render(); }
  else if (k === 'send') { if (text && !ASK.busy) askSend(text); }
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
  return `<section class="card"><span class="eyebrow">Deine Fragen</span>${xs.slice().reverse().map(x => `<details><summary class="small">${esc(x.q)}</summary><div class="ans small" style="margin-top:6px">${x.a ? esc(x.a).replace(/\n/g, '<br>') : '<span class="muted">Noch keine Antwort gespeichert.</span>'}</div>${!lid && x.lid && LBY[x.lid] ? `<a class="small muted" href="#l-${x.lid}">${esc(LBY[x.lid].t)}</a>` : ''}</details>`).join('')}</section>`;
}
function viewQA() {
  return `<div class="topbar"><a class="link" href="#">← StB-Pfad</a><button class="link" data-act="ask" style="background:none;border:0;cursor:pointer;font:inherit;color:var(--calm)">❓ Frage</button></div><header class="stack" style="gap:4px"><h1>❓ Deine Fragen</h1><span class="small muted">Gespeichert mit Antwort. Was als Karte übernommen wurde, kommt in den Wiederholungen.</span></header>${qaList(null) || '<section class="card"><span class="muted">Noch keine Fragen.</span></section>'}`;
}

/* ---------- render and actions ---------- */
function render() {
  const h = location.hash.replace(/^#/, '');
  let html;
  if (h.startsWith('l-') && LBY[h.slice(2)]) html = viewRead(LBY[h.slice(2)]);
  else if (h === 'fragen') html = viewQA();
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
  for (const id of lessonCards(l)) { const c = cardDef(id); if (c) window.EULE && EULE.push({ src: 'stb', q: c.q, a: c.a, ref: id }); }
  act(); save(); gainXP('stbpfad', 120); SS.xp += 120; SS.k = 6;
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v; tick();
  if (a === 'ask') { askOpen(); return; }
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
    if (SS.conf === 'sure' && !it.retry) { P.cal.n++; if (r === 2) P.cal.hit++; else P.cal.over++; }
    if (r === 0) SS.queue.push({ id: it.id, retry: true }); // successive relearning: back into this session
    if (r < 2 && !it.retry) { const c = cardDef(it.id); window.EULE && EULE.push({ src: 'stb', q: c.q, a: c.a, ref: it.id }); }
    if (!it.retry) { const d = P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 }); d.rev = (d.rev || 0) + 1; gainXP('stbpfad', r === 2 ? 8 : 4); }
    act(); save(); SS.i++; SS.shown = false; SS.typed = ''; SS.conf = null; SS.navRes = null;
    if (SS.i >= SS.queue.length) afterReviews(); else render(); return;
  }
  // lesson
  if (a === 'next') {
    if (SS.k === 0) SS.pre = val('pre');
    if (SS.k === 4) { SS.note = val('note'); const l = SS.L; SS.recall = { queue: shuffle(l.cards.map((_, i) => ({ id: l.id + ':c' + i }))), i: 0, shown: false }; }
    SS.k++; SS.step = 0; SS.guess = ''; render(); return;
  }
  if (a === 'reveal') { SS.guess = ''; SS.step++; render(); return; }
  if (a === 'navcheck') { SS.navGiven = val('nav'); SS.navRes = checkNorm(SS.navGiven, SS.L.nav[SS.navI][1]); render(); return; }
  if (a === 'navnext') { SS.navI++; SS.navGiven = ''; SS.navRes = null; if (SS.navI >= SS.L.nav.length) SS.k = 4; render(); return; }
  if (a === 'linkshow') { SS.note = val('note'); SS.linkShown = true; render(); return; }
  if (a === 'rshow') { SS.recall.shown = true; render(); return; }
  if (a === 'rrate') {
    const R = SS.recall, it = R.queue[R.i];
    if (+v === 0) R.queue.push({ id: it.id, retry: true });
    R.i++; R.shown = false;
    if (R.i >= R.queue.length) finishLesson();
    render(); return;
  }
  // case training and boss
  if (a === 'pick') { SS.C.pick = v; render(); return; }
  if (a === 'sreveal') { SS.C.guess = val('guess'); SS.C.shown = true; render(); return; }
  if (a === 'step') { const C = SS.C; if (+v === 0) { C.miss++; refresh(C.steps[C.s][2] || C.L.id); window.EULE && EULE.push({ src: 'stb', q: 'Fall: ' + C.sv.slice(0, 220) + (C.sv.length > 220 ? ' …' : '') + '\n→ ' + C.steps[C.s][0], a: C.steps[C.s][1] }); } C.s++; C.shown = false; C.guess = ''; render(); return; }
  if (a === 'casedone') {
    const C = SS.C, xp = C.boss ? (C.miss <= 1 ? 300 : 160) : 50 + (C.pick === (C.L || {}).id ? 20 : 0);
    if (C.boss && C.miss <= 1) P.boss[C.mod] = today();
    if (!C.boss) { P.caseLast[C.L.id] = today(); (P.caseSeen || (P.caseSeen = {}))[C.key] = Date.now(); P.lastCaseL = C.L.id; }
    act(); save(); gainXP('stbpfad', xp); toast('+' + xp + ' XP');
    if (SS.kind === 'today') { SS.stage = 'plan'; SS.total = 0; location.hash = 'heute'; } else { SS = null; history.replaceState(null, '', location.pathname); }
    render(); return;
  }
});
app.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  const btn = app.querySelector('[data-act="check"], [data-act="navcheck"], [data-act="conf"][data-v="sure"]'); if (btn) { e.preventDefault(); btn.click(); }
});
window.addEventListener('hashchange', () => { if (!/^#(heute|fall|boss(-\w+)?)$/.test(location.hash) && !location.hash.startsWith('#l-')) SS = null; render(); });
{ const before = JSON.stringify(P.meta || null); const P0 = P.updated; save(); if (before === JSON.stringify(P.meta)) { P.updated = P0; LS.set('echo-stbpfad', P); } }
render();
window.STB_TEST = { P, checkNorm, rate, interleave, LESSONS };
