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
const P = Object.assign({ done: {}, cards: {}, days: {}, boss: {}, notes: {}, cal: { n: 0, hit: 0, over: 0 }, caseLast: {} }, LS.get('echo-stbpfad', {}));
const save = () => { P.updated = Date.now(); LS.set('echo-stbpfad', P); };
const LADDER = [1, 3, 7, 16, 35, 90, 180];
const MASTER = 3; // box 3 = the card survived a gap of a week or more
const LESSONS = []; for (const m of D.ROADMAP) for (const l of (D.LESSONS[m.id] || [])) LESSONS.push(Object.assign({ mod: m.id }, l));
const LBY = Object.fromEntries(LESSONS.map(l => [l.id, l]));
const doneL = () => LESSONS.filter(l => P.done[l.id]);

/* ---------- cards ---------- */
function cardDef(id) {
  const [lid, k] = id.split(':'), l = LBY[lid]; if (!l) return null;
  const i = +k.slice(1);
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
let lastTick = 0;
function tick() {
  const t = Date.now(), d = P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 });
  if (lastTick && t - lastTick < 180000) d.sec = Math.round((d.sec || 0) + (t - lastTick) / 1000);
  lastTick = t;
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
  const est = Math.round(due * 0.5 + (nl && lessonDay() ? 15 : 8));
  const h = hoursTotal(), cal = P.cal.n >= 5 ? Math.round(P.cal.hit / P.cal.n * 100) + ' %' : '–';
  const bossOpen = D.BOSS[m0.id] && (D.LESSONS[m0.id] || []).every(l => P.done[l.id]);
  const modRow = m => { const ls = D.LESSONS[m.id] || [], n = ls.filter(l => P.done[l.id]).length, cur = m.id === m0.id;
    return `<div class="mod${ls.length ? '' : ' lock'}"><span class="big">${m.em}</span><div class="stack" style="gap:0;min-width:0"><b>${esc(m.n)}</b><span class="small muted">Woche ${m.w} · ${esc(m.goal)}</span>${cur && ls.length ? `<div class="stack" style="gap:2px;margin-top:6px">${ls.map((l, i) => `<a class="small" href="#l-${l.id}" style="color:${P.done[l.id] ? 'var(--ink)' : 'var(--muted)'};text-decoration:none">${P.done[l.id] ? '✓' : '○'} ${i + 1}. ${esc(l.t)}</a>`).join('')}${D.BOSS[m.id] ? `<span class="small" style="color:${P.boss[m.id] ? 'var(--ink)' : 'var(--muted)'}">${P.boss[m.id] ? '🏆' : '🔒'} Abschlussfall: ${esc(D.BOSS[m.id].t)}</span>` : ''}</div>` : ''}</div><span class="mono small muted">${ls.length ? n + '/' + ls.length : 'bald'}</span></div>`; };
  return `<div class="topbar">${back('index.html#games')}</div>
  <header class="stack" style="gap:4px"><span class="eyebrow">${esc(r.name)}${r.next ? ' · nächster Rang bei ' + r.next[0] + ' sicheren Karten' : ''}</span><h1>⚖️ StB-Pfad</h1></header>
  <section class="card" style="border:2px solid var(--calm)"><div class="row spread"><h3>Heute</h3><span class="small muted mono">~${est} min</span></div>
    <span>${plan} · ${todayL}</span>
    <div class="bar"><i style="width:${Math.min(100, Math.round(minToday() / 30 * 100))}%"></i></div><span class="small muted">${minToday()} von 30 min heute</span>
    <button class="btn primary big" data-act="today">${minToday() ? 'Weitermachen' : 'Starten'}</button></section>
  <section class="card"><div class="row" style="justify-content:space-around;text-align:center">
    <div class="stack" style="gap:0"><b style="font-size:24px">🔥 ${st}</b><span class="small muted">Tage am Stück</span></div>
    <div class="stack" style="gap:0"><b style="font-size:24px">${mastered()}</b><span class="small muted">Karten sitzen</span></div>
    <div class="stack" style="gap:0"><b style="font-size:24px">${cal}</b><span class="small muted">„Sicher“ und richtig</span></div></div>
    <div class="stack" style="gap:4px"><div class="row spread"><span class="small">Jahresziel</span><span class="small muted mono">${h.toFixed(1)} / 180 h · ${weekMin()} min diese Woche</span></div><div class="bar gold"><i style="width:${Math.min(100, h / 180 * 100)}%"></i></div></div></section>
  ${dl.length >= 2 ? `<a class="card" href="#fall" style="text-decoration:none;color:inherit"><div class="row"><span class="big">🧩</span><div class="stack grow" style="gap:0"><h3>Fall-Training</h3><span class="small muted">Gemischter Fall: erst erkennen, welches Thema greift, dann selbst lösen</span></div></div></a>` : ''}
  ${bossOpen ? `<a class="card" href="#boss" style="text-decoration:none;color:inherit;border:2px solid var(--gold)"><div class="row"><span class="big">${P.boss[m0.id] ? '🏆' : '👹'}</span><div class="stack grow" style="gap:0"><h3>Abschlussfall: ${esc(D.BOSS[m0.id].t)}</h3><span class="small muted">${P.boss[m0.id] ? 'Bestanden, jederzeit wiederholbar' : 'Alle Lektionen des Moduls in einem Fall'}</span></div></div></a>` : ''}
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
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← StB-Pfad</a><span class="small muted mono">${Math.min(SS.i + 1, SS.queue.length)} / ${SS.queue.length}</span></div>
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
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← StB-Pfad</a><span class="small muted">Lektion ${LESSONS.indexOf(l) + 1}</span></div>
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
    const ln = l.link && LBY[l.link];
    return `${head}<section class="card"><span class="eyebrow">In eigenen Worten</span><h3>Was ist der Kern dieser Lektion, und warum ist das so geregelt?</h3>
      <span class="small muted">Ein, zwei Sätze. Wer sich etwas selbst erklärt, behält es länger.</span><textarea id="note" placeholder="Der Kern ist …, weil …">${esc(SS.note)}</textarea></section>
      ${ln ? `<section class="card"><span class="eyebrow">Verknüpfen · ${esc(ln.t)}</span><h3>Wie hängt das mit „${esc(ln.t)}“ zusammen?</h3><span class="small muted">Erst denken, dann zur Erinnerung die Kernfrage von damals:</span>
        ${SS.linkShown ? `<span class="small">${esc(ln.cards[0][0])}</span><div class="ans">${esc(ln.cards[0][1])}</div>` : `<button class="btn" data-act="linkshow">${esc(ln.cards[0][0])} · aufdecken</button>`}</section>` : ''}
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
  const pool = doneL(); if (!pool.length) return;
  pool.sort((a, b) => (P.caseLast[a.id] || '').localeCompare(P.caseLast[b.id] || '') || Math.random() - 0.5);
  const l = pool[Math.floor(Math.random() * Math.min(3, pool.length))];
  const others = shuffle(LESSONS.filter(x => x.id !== l.id && x.mod === l.mod)).slice(0, 3);
  SS = Object.assign(SS || { xp: 0 }, { stage: 'case', C: { L: l, steps: l.case.steps.map(s => [s[0], s[1], l.id]), sv: l.case.sv, res: l.case.res, opts: shuffle([l, ...others]), pick: null, s: 0, shown: false, guess: '', miss: 0, boss: false } });
  location.hash = 'fall'; render();
}
function startBoss() {
  const m = D.ROADMAP.find(x => D.BOSS[x.id] && (D.LESSONS[x.id] || []).every(l => P.done[l.id])); if (!m) return;
  const b = D.BOSS[m.id];
  SS = Object.assign(SS || { xp: 0 }, { stage: 'case', C: { mod: m.id, title: b.t, steps: b.steps, sv: b.sv, res: b.res, pick: 'skip', s: 0, shown: false, guess: '', miss: 0, boss: true } });
  location.hash = 'boss'; render();
}
function viewCase() {
  const C = SS.C, done = C.s >= C.steps.length;
  const head = `<div class="topbar"><a class="link" href="#" data-act="home">← StB-Pfad</a><span class="small muted">${C.boss ? 'Abschlussfall' : 'Fall-Training'}</span></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${C.boss ? '👹 ' + esc(C.title) : '🧩 Gemischter Fall'}</h1>${phase(C.steps.length + (C.boss ? 0 : 1), (C.pick ? 1 : 0) * (C.boss ? 0 : 1) + C.s)}</header>
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
  return `<div class="topbar"><a class="link" href="#">← StB-Pfad</a></div>
  <header class="stack" style="gap:6px"><h1 style="font-size:26px">${esc(l.t)}</h1><div class="row" style="flex-wrap:wrap;gap:6px">${norms(l)}</div></header>
  ${P.done[l.id] ? '' : '<section class="card"><span class="small muted">Diese Lektion kommt noch. Lies ruhig vor, aber am meisten bringt sie, wenn du sie mit Vorab-Frage und Fall im Tagesablauf lernst.</span></section>'}
  <section class="card"><span class="eyebrow">Roter Faden</span><div class="why">${esc(l.why)}</div></section>
  <section class="card core">${l.core.map(p => `<p>${esc(p)}</p>`).join('')}</section>
  <section class="card"><span class="eyebrow">Prüfschema</span><ol class="schema">${l.schema.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
  <details class="card"><summary>Fall mit Lösung</summary><div class="sv" style="margin-top:8px">${esc(l.case.sv)}</div>${l.case.steps.map(([q, a]) => `<div class="step open"><b>${esc(q)}</b><div class="ans">${esc(a)}</div></div>`).join('')}<div class="ans"><b>Ergebnis:</b> ${esc(l.case.res)}</div></details>
  ${P.notes[l.id] ? `<section class="card"><span class="eyebrow">Deine eigenen Worte</span><span>${esc(P.notes[l.id])}</span></section>` : ''}`;
}

/* ---------- render and actions ---------- */
function render() {
  const h = location.hash.replace(/^#/, '');
  let html;
  if (h.startsWith('l-') && LBY[h.slice(2)]) html = viewRead(LBY[h.slice(2)]);
  else if (SS && h === 'heute') html = SS.stage === 'review' ? viewReview() : SS.stage === 'lesson' ? viewLesson() : SS.stage === 'case' ? viewCase() : viewPlan();
  else if (SS && SS.stage === 'case' && (h === 'fall' || h === 'boss')) html = viewCase();
  else if (h === 'fall' && doneL().length) { startCase(); return; }
  else if (h === 'boss') { startBoss(); if (SS && SS.stage === 'case') return; html = viewHome(); }
  else html = viewHome();
  app.innerHTML = html; window.scrollTo(0, 0);
  const f = app.querySelector('#typed, #nav, #guess, #pre'); if (f && !f.disabled && matchMedia('(pointer:fine)').matches) f.focus();
}
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
function finishLesson() {
  const l = SS.L; P.done[l.id] = today(); if (SS.note) P.notes[l.id] = SS.note;
  for (const id of lessonCards(l)) if (!P.cards[id]) P.cards[id] = { b: 0, due: addDays(1), n: 1, lapses: 0, last: today() };
  act(); save(); gainXP('stbpfad', 60); SS.xp += 60; SS.k = 6;
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v; tick();
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
    if (!it.retry) { const d = P.days[today()] || (P.days[today()] = { sec: 0, rev: 0 }); d.rev = (d.rev || 0) + 1; gainXP('stbpfad', r === 2 ? 4 : 2); }
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
  if (a === 'step') { const C = SS.C; if (+v === 0) { C.miss++; refresh(C.steps[C.s][2] || C.L.id); } C.s++; C.shown = false; C.guess = ''; render(); return; }
  if (a === 'casedone') {
    const C = SS.C, xp = C.boss ? (C.miss <= 1 ? 150 : 80) : 25 + (C.pick === (C.L || {}).id ? 10 : 0);
    if (C.boss && C.miss <= 1) P.boss[C.mod] = today();
    if (!C.boss) P.caseLast[C.L.id] = today();
    act(); save(); gainXP('stbpfad', xp); toast('+' + xp + ' XP');
    if (SS.kind === 'today') { SS.stage = 'plan'; SS.total = 0; location.hash = 'heute'; } else { SS = null; history.replaceState(null, '', location.pathname); }
    render(); return;
  }
});
app.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  const btn = app.querySelector('[data-act="check"], [data-act="navcheck"], [data-act="conf"][data-v="sure"]'); if (btn) { e.preventDefault(); btn.click(); }
});
window.addEventListener('hashchange', () => { if (!/^#(heute|fall|boss)$/.test(location.hash) && !location.hash.startsWith('#l-')) SS = null; render(); });
render();
window.STB_TEST = { P, checkNorm, rate, interleave, LESSONS };
