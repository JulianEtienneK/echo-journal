'use strict';
/* Skandal-Akten for spiele.html: read the case files, then keep them with retrieval in four ways – a quiz with spaced
   repetition per case, a detective mode (guess the case from clues), and a timeline. Uses spiele.html's globals
   (G, save, gain, beep, esc, shuffle, today, toast, back, view, render) only at call time. Data: skandale-data.js. */

const SK_IV = [0, 1, 3, 7, 21, 60, 150]; // days per box after a correct answer
const SK = { mode: null };
const skCases = () => window.SCANDALS || [];
function skData() { const s = G.sk || (G.sk = {}); s.c ||= {}; s.read ||= {}; s.best ||= {}; return s; }
const skCase = id => skCases().find(c => c.id === id);
const skBox = id => (skData().c[id] || {}).b || 0;
const skState = id => { const b = skBox(id); return !skData().read[id] && !skData().c[id] ? 'neu' : b >= 3 ? 'sicher' : 'lernend'; };
const skKind = c => c.k.split(/ & | \(/)[0];
function skDay() { const k = today(), arr = skCases(); let h = 0; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return arr[h % arr.length]; }
function skRedact(c, text) {
  let out = text; const names = (c.who + ' ' + c.t).split(/[\s\-–,]+/).filter(w => w.length > 3 && /^[A-ZÄÖÜ]/.test(w) && !['Studie', 'Medizin', 'Service', 'Public', 'Health', 'Hospital', 'Research', 'Foundation', 'Chemie', 'Therapeutics', 'Unbekannter', 'Fälscher'].includes(w));
  for (const n of names) out = out.split(n).join('…');
  return out;
}

/* ---------- quiz with spaced repetition ---------- */
function skQuestion(c) {
  const others = shuffle(skCases().filter(x => x.id !== c.id));
  const opts = (right, pool) => { const seen = new Set([right]); const o = [right]; for (const v of pool) { if (o.length >= 4) break; if (v && !seen.has(v)) { seen.add(v); o.push(v); } } return shuffle(o); };
  const types = [
    () => ({ q: `Wer steht im Zentrum von „${c.t}“?`, a: c.who, o: opts(c.who, others.map(x => x.who)) }),
    () => ({ q: `Welcher Fall ist das?\n${skRedact(c, c.what)}`, a: c.t, o: opts(c.t, others.map(x => x.t)) }),
    () => ({ q: `Wie flog „${c.t}“ auf?`, a: c.found, o: opts(c.found, others.map(x => x.found)) }),
    () => ({ q: `Welche Lehre gehört zu „${c.t}“?`, a: c.lesson, o: opts(c.lesson, others.map(x => x.lesson)) }),
    () => ({ q: `Was folgte auf „${c.t}“?`, a: c.out, o: opts(c.out, others.map(x => x.out)) }),
    () => ({ q: `In welchem Jahr wurde „${c.t}“ bekannt? (± ein paar Jahre)`, a: String(c.y), o: opts(String(c.y), shuffle(others.filter(x => Math.abs(x.y - c.y) >= 5).map(x => String(x.y)))) }),
    () => ({ q: `Wo spielte „${c.t}“?`, a: c.c, o: opts(c.c, others.map(x => x.c)) }),
    () => ({ q: `Worum ging es im Kern bei „${c.t}“?`, a: skKind(c), o: opts(skKind(c), others.map(skKind)) }),
  ];
  for (let i = 0; i < 6; i++) { const q = types[Math.floor(Math.random() * types.length)](); if (q.o.length === 4) return Object.assign(q, { id: c.id }); }
  return Object.assign(types[0](), { id: c.id });
}
function skQuizStart() {
  const d = skData(), now = Date.now(), all = skCases();
  const due = shuffle(all.filter(c => d.c[c.id] && d.c[c.id].d <= now));
  const fresh = shuffle(all.filter(c => !d.c[c.id])).sort((a, b) => (d.read[b.id] ? 1 : 0) - (d.read[a.id] ? 1 : 0)); // read-but-unquizzed first
  const rest = shuffle(all.filter(c => !due.includes(c) && !fresh.includes(c)));
  const pick = due.slice(0, 6); let nf = 0;
  for (const c of fresh) { if (pick.length >= 8 || nf >= 3) break; pick.push(c); nf++; }
  for (const c of rest) { if (pick.length >= 8) break; pick.push(c); }
  for (const c of fresh.slice(nf)) { if (pick.length >= 8) break; pick.push(c); }
  SK.mode = 'quiz'; SK.seq = shuffle([...new Set(pick)]).slice(0, 8).map(skQuestion); SK.i = 0; SK.ans = null; SK.ok = 0; SK.xp = 0; SK.wrong = [];
  view = 'skandale'; render();
}
function skAnswer(i) {
  const q = SK.seq[SK.i]; if (SK.ans != null) return;
  SK.ans = q.o[i]; const ok = SK.ans === q.a, d = skData(), st = d.c[q.id] || (d.c[q.id] = { b: 0, d: 0, n: 0, w: 0 });
  if (ok) { st.n++; st.b = Math.min(SK_IV.length - 1, st.b + 1); st.d = Date.now() + SK_IV[st.b] * 864e5; SK.ok++; SK.xp += 8; }
  else { st.w++; st.b = 0; st.d = Date.now() + 10 * 60e3; SK.wrong.push(q.id); }
  q.ok = ok; beep(ok); save(); render(); document.getElementById('sknext')?.focus();
}
function skNext() { SK.i++; SK.ans = null; if (SK.i >= SK.seq.length) gain('skandal', SK.xp + 2); render(); }

/* ---------- detective: guess the case from clues ---------- */
function skDetStart() {
  const d = skData(), all = skCases();
  const known = all.filter(c => d.read[c.id] || d.c[c.id]), pool = shuffle(known.length >= 5 ? known : all);
  SK.mode = 'det'; SK.list = pool.slice(0, 5).map(c => ({ id: c.id, opts: shuffle([c.t, ...shuffle(all.filter(x => x.id !== c.id)).slice(0, 3).map(x => x.t)]) })); SK.i = 0; SK.k = 1; SK.done = false; SK.xp = 0; SK.tries = [];
  view = 'skandale'; render();
}
function skDetGuess(t) {
  const cur = SK.list[SK.i], c = skCase(cur.id); if (SK.done) return;
  if (t === c.t) { const pts = Math.max(1, 6 - SK.k); SK.xp += pts * 2; cur.pts = pts; SK.done = true; beep(true); const st = skData().c[c.id]; if (st && st.b < 2) { st.b++; st.d = Date.now() + SK_IV[st.b] * 864e5; } save(); }
  else { SK.tries.push(t); beep(false); if (SK.k < 5) SK.k++; else { SK.done = true; cur.pts = 0; } }
  render();
}
function skDetNext() { SK.i++; SK.k = 1; SK.done = false; SK.tries = []; if (SK.i >= SK.list.length) gain('skandal', SK.xp + 2); render(); }

/* ---------- timeline ---------- */
function skTimeStart() {
  const all = shuffle(skCases()), pick = [];
  for (const c of all) { if (pick.length >= 5) break; if (pick.every(p => Math.abs(p.y - c.y) >= 2)) pick.push(c); }
  SK.mode = 'time'; SK.items = shuffle(pick).map(c => c.id); SK.order = []; SK.checked = false; view = 'skandale'; render();
}
function skTimeTap(id) { if (SK.checked || SK.order.includes(id)) return; SK.order.push(id); if (SK.order.length === SK.items.length) skTimeCheck(); else render(); }
function skTimeCheck() {
  const right = SK.items.map(skCase).sort((a, b) => a.y - b.y).map(c => c.id);
  SK.right = right; SK.score = SK.order.filter((id, i) => right[i] === id).length; SK.checked = true;
  const xp = SK.score * 3 + 2; gain('skandal', xp); SK.xp = xp; beep(SK.score >= 4); render();
}

/* ---------- views ---------- */
function skCard(c, full) {
  return `<section class="card" style="gap:10px"><div class="row spread"><span class="eyebrow">${esc(c.y + ' · ' + c.f + ' · ' + c.c)}</span><span class="tag">${esc(skKind(c))}</span></div>
    <h3>${esc(c.t)}</h3><span class="small muted">${esc(c.who)}</span>
    <p style="margin:0">${esc(c.what)}</p>
    ${full ? `<div style="display:grid;gap:8px"><div><b class="small">Wie es aufflog</b><p style="margin:2px 0 0">${esc(c.found)}</p></div><div><b class="small">Folgen</b><p style="margin:2px 0 0">${esc(c.out)}</p></div></div>` : ''}
    <div class="fact"><b>Lehre</b><span>${esc(c.lesson)}</span></div></section>`;
}
function viewSk() {
  const d = skData(), all = skCases();
  if (SK.mode === 'case') {
    const c = skCase(SK.id), first = !d.read[c.id];
    return `${back}${skCard(c, true)}
      <button class="btn primary big" data-act="sk-read" data-v="${c.id}">${first ? 'Gelesen · +3 XP' : 'Zurück zu den Akten'}</button>
      <a class="btn" href="./?soc=sci&case=${encodeURIComponent(c.id)}" style="text-decoration:none">🦉 In Echo sokratisch durchdenken</a>`;
  }
  if (SK.mode === 'quiz') {
    if (SK.i >= SK.seq.length) return `${back}<section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">Skandal-Quiz</span><div class="sum">${SK.ok}/${SK.seq.length}</div><p class="muted" style="margin:0">+${SK.xp + 2} XP · falsche Fälle kommen in 10 Minuten wieder, richtige in wachsenden Abständen</p></section>
      ${SK.wrong.length ? `<section class="card"><h3>Nochmal anschauen</h3>${[...new Set(SK.wrong)].map(id => { const c = skCase(id); return `<button class="link" data-act="sk-open" data-v="${id}" style="text-align:left">📁 ${esc(c.t)} · ${esc(c.who)}</button>`; }).join('')}</section>` : ''}
      <button class="btn primary big" data-act="sk-quiz">Nächste Runde</button><button class="btn" data-act="sk-home">Übersicht</button>`;
    const q = SK.seq[SK.i], c = skCase(q.id), [head, ...body] = q.q.split('\n');
    return `${back}<div class="progress">${SK.seq.map((x, i) => `<i class="${i < SK.i ? (x.ok ? 'ok' : 'bad') : i === SK.i ? 'cur' : ''}"></i>`).join('')}</div>
      <span class="eyebrow">🕵️ Skandal-Akten · Quiz</span><div class="q">${esc(head)}</div>${body.length ? `<p class="small" style="margin:0;background:var(--surface-2);border-radius:12px;padding:10px 12px">${esc(body.join(' '))}</p>` : ''}
      <div class="opts" style="grid-template-columns:1fr">${q.o.map((o, i) => { const cls = SK.ans == null ? '' : o === q.a ? 'ok' : o === SK.ans ? 'bad' : ''; return `<button class="opt ${cls}" data-act="sk-ans" data-v="${i}" ${SK.ans == null ? '' : 'disabled'} style="font-weight:${o.length > 60 ? 500 : 700}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`; }).join('')}</div>
      ${SK.ans == null ? '' : `${skCard(c, false)}<button class="btn primary big" data-act="sk-next" id="sknext">Weiter</button>`}`;
  }
  if (SK.mode === 'det') {
    if (SK.i >= SK.list.length) return `${back}<section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">Detektiv</span><div class="sum">${SK.list.filter(x => x.pts).length}/${SK.list.length}</div><p class="muted" style="margin:0">+${SK.xp + 2} XP · je weniger Hinweise, desto mehr Punkte</p></section>
      <button class="btn primary big" data-act="sk-det">Nächste Runde</button><button class="btn" data-act="sk-home">Übersicht</button>`;
    const cur = SK.list[SK.i], c = skCase(cur.id);
    return `${back}<div class="row spread"><span class="eyebrow">🔎 Fall ${SK.i + 1} von ${SK.list.length}</span><span class="small mono muted">Hinweis ${SK.k}/5 · ${Math.max(1, 6 - SK.k) * 2} XP</span></div>
      <section class="card" style="gap:8px">${c.clues.slice(0, SK.k).map((cl, i) => `<div class="row" style="align-items:flex-start"><span class="mono muted">${i + 1}</span><span>${esc(cl)}</span></div>`).join('')}</section>
      <div class="opts" style="grid-template-columns:1fr">${cur.opts.map(o => { const cls = SK.done && o === c.t ? 'ok' : SK.tries.includes(o) ? 'bad' : ''; return `<button class="opt ${cls}" data-act="sk-guess" data-v="${esc(o)}" ${SK.done || SK.tries.includes(o) ? 'disabled' : ''}><span>${esc(o)}</span></button>`; }).join('')}</div>
      ${SK.done ? `${skCard(c, false)}<button class="btn primary big" data-act="sk-detnext" id="sknext">${SK.i + 1 >= SK.list.length ? 'Ergebnis' : 'Nächster Fall'}</button>` : SK.k < 5 ? `<button class="btn" data-act="sk-clue">Nächster Hinweis</button>` : ''}`;
  }
  if (SK.mode === 'time') {
    const items = SK.items.map(skCase);
    return `${back}<span class="eyebrow">⏳ Zeitstrahl</span><div class="q">Tippe die Fälle vom ältesten zum neuesten an.</div>
      <div class="opts" style="grid-template-columns:1fr">${items.map(c => { const pos = SK.order.indexOf(c.id), ok = SK.checked && SK.right[pos] === c.id; return `<button class="opt ${SK.checked ? (ok ? 'ok' : 'bad') : ''}" data-act="sk-tap" data-v="${c.id}" ${SK.checked || pos >= 0 ? 'disabled' : ''}><span class="k">${pos >= 0 ? pos + 1 : '·'}</span><span>${esc(c.t)}${SK.checked ? ` · <b>${c.y}</b>` : ''}</span></button>`; }).join('')}</div>
      ${SK.checked ? `<section class="card" style="gap:6px"><b>${SK.score}/5 an der richtigen Stelle · +${SK.xp} XP</b>${SK.right.map((id, i) => { const c = skCase(id); return `<span class="small">${i + 1}. ${c.y} · ${esc(c.t)}</span>`; }).join('')}</section>
        <button class="btn primary big" data-act="sk-time">Nochmal</button><button class="btn" data-act="sk-home">Übersicht</button>` : `<button class="btn" data-act="sk-time-reset" ${SK.order.length ? '' : 'disabled'}>Zurücksetzen</button>`}`;
  }
  // home
  const now = Date.now(), due = all.filter(c => d.c[c.id] && d.c[c.id].d <= now).length, safe = all.filter(c => skBox(c.id) >= 3).length, read = all.filter(c => d.read[c.id]).length, dc = skDay();
  return `${back}<h2>🕵️ Skandal-Akten</h2>
    <p class="small muted" style="margin:0">Die wichtigsten Skandale der Wissenschaft: was passiert ist, wie es aufflog und was man daraus lernt. Lesen, dann aus dem Gedächtnis abrufen, bis es sitzt.</p>
    <div class="stats"><div class="stat"><span class="small muted">gelesen</span><b>${read}/${all.length}</b></div><div class="stat"><span class="small muted">sicher</span><b>${safe}</b></div><div class="stat"><span class="small muted">fällig</span><b>${due}</b></div></div>
    <button class="card" data-act="sk-open" data-v="${dc.id}" style="text-align:left;cursor:pointer;border:2px solid var(--calm)"><span class="eyebrow">Fall des Tages</span><div class="row spread"><b>📁 ${esc(dc.t)}</b><span class="small muted mono">${dc.y}</span></div><span class="small muted">${esc(dc.who)} · ${esc(dc.f)}</span></button>
    <button class="btn primary big" data-act="sk-quiz">🧠 Quiz${due ? ' · ' + due + ' fällig' : ''}</button>
    <div class="row" style="gap:8px"><button class="btn grow" data-act="sk-det">🔎 Detektiv</button><button class="btn grow" data-act="sk-time">⏳ Zeitstrahl</button></div>
    <section class="card" style="gap:6px"><h3>Alle Akten</h3>
      ${[...all].sort((a, b) => a.y - b.y).map(c => { const st = skState(c.id); return `<button class="link" data-act="sk-open" data-v="${c.id}" style="text-align:left;display:flex;gap:10px;align-items:center;white-space:normal"><span class="mono small muted" style="width:38px">${c.y}</span><span class="grow">${esc(c.t)}</span><span class="tag ${st === 'sicher' ? 'new' : st === 'lernend' ? 'challenge' : ''}">${st}</span></button>`; }).join('')}
    </section>`;
}
function skAct(a, v) {
  if (a === 'sk-home') { SK.mode = null; render(); }
  else if (a === 'sk-open') { SK.mode = 'case'; SK.id = v; render(); scrollTo(0, 0); }
  else if (a === 'sk-read') { const d = skData(); if (!d.read[v]) { d.read[v] = Date.now(); gain('skandal', 3); toast('Akte gelesen · +3 XP'); } SK.mode = null; render(); }
  else if (a === 'sk-quiz') skQuizStart();
  else if (a === 'sk-ans') skAnswer(+v);
  else if (a === 'sk-next') skNext();
  else if (a === 'sk-det') skDetStart();
  else if (a === 'sk-guess') skDetGuess(v);
  else if (a === 'sk-clue') { if (SK.k < 5) { SK.k++; render(); } }
  else if (a === 'sk-detnext') skDetNext();
  else if (a === 'sk-time') skTimeStart();
  else if (a === 'sk-tap') skTimeTap(v);
  else if (a === 'sk-time-reset') { SK.order = []; render(); }
}
function skMeta() { const d = skData(), all = skCases(), due = all.filter(c => d.c[c.id] && d.c[c.id].d <= Date.now()).length; return `${all.filter(c => d.read[c.id]).length}/${all.length} gelesen · ${all.filter(c => skBox(c.id) >= 3).length} sicher${due ? ' · ' + due + ' fällig' : ''}`; }
