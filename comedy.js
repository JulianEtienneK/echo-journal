/* Echo · Comedy-Session: Humor trainieren, indem man Witze auseinandernimmt.
   Pro Moment: Was war es? → Welche Erwartung hat das Setup gebaut? → Wie wurde sie gebrochen (Technik)? → Warum ist es lustig?
   Danach optional: eine eigene Pointe zu einem Setup drehen. Zwei analysierte Momente = Session erledigt (tickt das Wochenziel in Echo).
   Grundlage: Inkongruenz-Auflösung (Setup baut eine Annahme, die Pointe enthüllt eine zweite Deutung) und Benign Violation (eine Verletzung, die zugleich harmlos ist).
   Storage: 'echo-comedy' (in Echos Sicherung). Needs tools-common.js. */
'use strict';
const app = document.getElementById('app');
const NEED = 2, XP = { moment: 15, twist: 20, session: 25 };
const TECH = [
  ['reint', 'Umdeutung', 'Das Setup legt eine Deutung nahe, die Pointe zeigt eine zweite, die auch passt. Der Kern fast jeden Witzes.'],
  ['doppel', 'Doppeldeutigkeit', 'Ein Wort oder Satz hat zwei Bedeutungen; die Pointe springt auf die andere.'],
  ['woertl', 'Wörtlich genommen', 'Eine Redewendung oder Bitte wird buchstäblich verstanden.'],
  ['fehl', 'Fehlleitung', 'Du wirst bewusst in eine Richtung geführt, die Pointe kommt von der Seite.'],
  ['drei', 'Dreierregel', 'Zwei normale Elemente bauen ein Muster, das dritte bricht es.'],
  ['ueber', 'Übertreibung', 'Etwas Wahres wird so weit gesteigert, dass es absurd wird.'],
  ['unter', 'Untertreibung', 'Etwas Großes wird trocken klein geredet.'],
  ['logik', 'Absurde Logik', 'Eine falsche Prämisse wird völlig konsequent zu Ende gedacht.'],
  ['vergl', 'Vergleich', 'Zwei Dinge, die nicht zusammengehören, werden treffend gleichgesetzt.'],
  ['status', 'Statuswechsel', 'Oben und unten tauschen; der Mächtige blamiert sich, der Kleine gewinnt.'],
  ['selbst', 'Selbstironie', 'Der Witz geht auf eigene Kosten; nimmt Druck raus und schafft Nähe.'],
  ['beob', 'Beobachtung', 'Etwas Alltägliches, das alle kennen, aber keiner ausspricht.'],
  ['call', 'Callback', 'Eine frühere Pointe kommt in neuem Zusammenhang zurück.'],
  ['act', 'Act-out und Timing', 'Stimme, Mimik, Pause: Die Pointe sitzt durch die Art, nicht nur durch den Text.'],
];
const WHY = [['ueberr', 'Überraschung, die im Nachhinein Sinn ergibt'], ['harmlos', 'Verletzung einer Norm, aber harmlos'], ['wahr', 'Ertappt: es stimmt einfach'], ['span', 'Spannung aufgebaut und gelöst'], ['ueberl', 'Gefühl, schlauer zu sein als jemand'], ['bild', 'Absurdes Bild im Kopf']];
// Quellen ohne YouTube (Detox). Verfügbarkeit bei Streamingdiensten wechselt; im Zweifel suchen.
const SRC = [
  ['🎤', 'Mitch Hedberg, Comedy-Alben', 'Audio, z. B. Spotify', 'Einzeiler mit sauberer Mechanik, ideal für Erwartung und Bruch.'],
  ['🎤', 'Hazel Brugger, Bühnenprogramm', 'Streaming, Deutsch', 'Trockene Untertreibung und Statuswechsel.'],
  ['🎤', 'John Mulaney, „Kid Gorgeous“', 'Netflix', 'Lange Geschichten mit Callbacks und Act-out.'],
  ['🎤', 'Taylor Tomlinson, Specials', 'Netflix', 'Dichte Pointen, viel Selbstironie.'],
  ['🎤', 'Felix Lobrecht, Specials', 'Streaming, Deutsch', 'Beobachtung und Milieu, Timing.'],
  ['🎤', 'Ali Wong, Specials', 'Netflix', 'Übertreibung und Tabubruch, der harmlos bleibt.'],
  ['📰', 'Der Postillon', 'Text, kostenlos', 'Satire-Schlagzeilen: Die Schlagzeile ist das Setup und die Pointe in einem.'],
  ['📰', 'The Onion', 'Text, Englisch', 'Absurde Logik im Nachrichtenton.'],
  ['📖', 'Loriot, Dramatische Werke', 'Buch', 'Statuswechsel und Sprache, die an der Situation vorbeiredet.'],
  ['📖', 'Heinz Erhardt, Gedichte', 'Buch', 'Doppeldeutigkeit und Wortspiel.'],
  ['🎧', 'Ein Comedy-Podcast deiner Wahl', 'Audio', 'Gespräch statt Bühne: Pointen entstehen spontan, Callbacks besonders gut zu sehen.'],
  ['👥', 'Ein Gespräch von heute', 'Alltag', 'Wer hat heute gelacht und warum? Alltagshumor ist das beste Material.'],
];
const C = Object.assign({ days: {}, xp: 0 }, LS.get('echo-comedy', {}));
const save = () => { C.updated = Date.now(); LS.set('echo-comedy', C); };
const day = () => C.days[today()] || (C.days[today()] = { moments: [], twists: [], src: null, done: false });
const srcOfDay = () => { const d = new Date(), n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); return SRC[n % SRC.length]; };
const streak = () => { let n = 0, d = new Date(); if (!(C.days[today()] || {}).done) d.setDate(d.getDate() - 1); while ((C.days[dk(d)] || {}).done) { n++; d.setDate(d.getDate() - 1); } return n; };
const route = () => location.hash.replace(/^#/, '');
const go = h => { if (route() === h) render(); else location.hash = h; };
const topBar = back => `<div class="topbar"><a class="link" href="${back ? '#' : 'index.html#games'}">← ${back ? 'Comedy' : 'Echo'}</a><span class="xp">${streak() ? '🔥 ' + streak() + ' · ' : ''}${LS.get('echo-games', {}).xp || 0} XP</span></div>`;
let F = { step: 0, m: {} }; // draft of the moment being analysed

function viewHub() {
  const d = C.days[today()] || { moments: [], twists: [] }, s = d.src ? SRC.find(x => x[1] === d.src) || srcOfDay() : srcOfDay();
  const all = Object.values(C.days).flatMap(x => x.moments || []), tc = {};
  for (const m of all) for (const t of m.tech || []) tc[t] = (tc[t] || 0) + 1;
  const top = Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recent = Object.entries(C.days).sort((a, b) => b[0].localeCompare(a[0])).flatMap(([k, x]) => (x.moments || []).map(m => ({ k, m }))).slice(0, 6);
  return `${topBar()}<div class="stack"><span class="eyebrow">Echo · täglich</span><h1>😂 Comedy-Session</h1><p class="muted">Humor ist Handwerk: Jeder Witz baut eine Erwartung und bricht sie so, dass es im Nachhinein Sinn ergibt. Wer das an fremden Witzen sieht, findet es auch in eigenen Gesprächen.</p></div>
  <section class="card"><div class="row spread"><div class="stack" style="gap:0"><span class="eyebrow">Heute</span><h3>${d.done ? '✓ Session erledigt' : `${(d.moments || []).length} von ${NEED} Momenten`}</h3></div><span class="xp">${d.done ? '+' + XP.session : '10 min'}</span></div>
    <div class="bar"><i style="width:${Math.min(100, Math.round(100 * (d.moments || []).length / NEED))}%"></i></div>
    <div class="note"><b>${s[0]} Quelle des Tages:</b> ${esc(s[1])} <span class="small muted">(${esc(s[2])})</span><br><span class="small">${esc(s[3])}</span></div>
    <span class="small muted">Kein YouTube. Andere Quelle? Egal, Hauptsache du schaust oder hörst 5 bis 10 Minuten bewusst zu.</span>
    <button class="btn primary" data-act="new">${(d.moments || []).length ? 'Nächsten Moment auseinandernehmen' : 'Ersten Moment auseinandernehmen'}</button>
    ${(d.moments || []).length ? `<button class="btn" data-act="go" data-v="twist">Selbst drehen: eigene Pointe (+${XP.twist})</button>` : ''}</section>
  <section class="card"><span class="eyebrow">Der Ablauf</span>
    <div class="note"><b>1 · Erwartung:</b> Was hast du nach dem Setup angenommen? Welches Bild, welche Bedeutung, welcher Fortgang?</div>
    <div class="note"><b>2 · Bruch:</b> Wie wurde die Annahme umgeworfen, und mit welcher Technik?</div>
    <div class="note"><b>3 · Warum lustig:</b> Was macht den Bruch angenehm statt nur verwirrend? Meist: überraschend, aber im Nachhinein logisch, und die Verletzung bleibt harmlos.</div></section>
  ${top.length ? `<section class="card"><span class="eyebrow">Deine Techniken bisher</span><div class="chips">${top.map(([k, n]) => `<span class="chip">${esc((TECH.find(t => t[0] === k) || [, k])[1])} · ${n}</span>`).join('')}</div><span class="small muted">${all.length} Momente analysiert. Techniken, die selten auftauchen, lohnt es sich gezielt zu suchen.</span></section>` : ''}
  ${recent.length ? `<section class="card"><span class="eyebrow">Zuletzt</span>${recent.map(({ k, m }) => `<div class="note"><span class="small muted">${esc(new Date(k + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }))} · ${['🙂', '😄', '😂', '🤣'][m.laugh || 0]}</span><br><b>${esc(m.what)}</b><br><span class="small">Erwartung: ${esc(m.exp)}<br>Bruch: ${esc(m.brk)}</span></div>`).join('')}</section>` : ''}
  <section class="card"><span class="eyebrow">Zum Weiterlesen</span><span class="small">Steve Kaplan, „The Hidden Tools of Comedy“ (2013) · Joe Toplyn, „Comedy Writing for Late-Night TV“ (2014) · McGraw und Warner, „The Humor Code“ (2014, Benign-Violation-Theorie) · Greg Dean, „Step by Step to Stand-Up Comedy“ (2000, Erwartung und Umdeutung als Methode) · John Vorhaus, „The Comic Toolbox“ (1994)</span></section>`;
}

function viewMoment() {
  const m = F.m, st = F.step;
  const head = `${topBar(true)}<div class="stack"><span class="eyebrow">Moment ${((C.days[today()] || {}).moments || []).length + 1} · Schritt ${st + 1} von 4</span><h1>${['Was war es?', 'Erwartung', 'Bruch', 'Warum lustig?'][st]}</h1></div>`;
  if (st === 0) return `${head}<section class="card"><p class="muted">Die Pointe oder den Moment in Stichworten, so dass du ihn in einer Woche wiedererkennst.</p>
    <textarea class="input" id="f" rows="3" placeholder="z. B. „Ich hab mir ein Laufband gekauft. Jetzt bin ich zu Hause nicht mehr der Einzige, der nichts erreicht.“">${esc(m.what || '')}</textarea>
    <button class="btn primary" data-act="next">Weiter</button></section>`;
  if (st === 1) return `${head}<section class="card"><p class="muted">Halt kurz an der Stelle vor der Pointe an: Was hast du da erwartet? Welche Bedeutung, welches Bild, welche Fortsetzung lag nahe?</p>
    <div class="note small">Beispiel: „Laufband gekauft“ → ich erwarte eine Fitness-Geschichte, Erfolg oder Ausrede.</div>
    <textarea class="input" id="f" rows="3" placeholder="Ich habe angenommen, dass …">${esc(m.exp || '')}</textarea>
    <button class="btn primary" data-act="next">Weiter</button></section>`;
  if (st === 2) return `${head}<section class="card"><p class="muted">Was ist stattdessen passiert, und mit welcher Technik? Mehrere möglich.</p>
    <textarea class="input" id="f" rows="2" placeholder="Stattdessen …">${esc(m.brk || '')}</textarea>
    <div class="chips">${TECH.map(t => `<button class="chip" data-act="tech" data-v="${t[0]}" aria-pressed="${(m.tech || []).includes(t[0])}" title="${esc(t[2])}">${esc(t[1])}</button>`).join('')}</div>
    ${(m.tech || []).length ? `<div class="note small">${(m.tech || []).map(k => { const t = TECH.find(x => x[0] === k); return `<b>${esc(t[1])}:</b> ${esc(t[2])}`; }).join('<br>')}</div>` : '<span class="small muted">Tipp: Fast immer passt „Umdeutung“; die Frage ist, wodurch sie ausgelöst wird.</span>'}
    <button class="btn primary" data-act="next">Weiter</button></section>`;
  return `${head}<section class="card"><p class="muted">Warum ist der Bruch angenehm und nicht nur verwirrend? Ein Satz reicht.</p>
    <div class="chips">${WHY.map(w => `<button class="chip" data-act="why" data-v="${w[0]}" aria-pressed="${(m.why || []).includes(w[0])}">${esc(w[1])}</button>`).join('')}</div>
    <textarea class="input" id="f" rows="2" placeholder="Lustig, weil …">${esc(m.note || '')}</textarea>
    <span class="small muted">Wie sehr hast du gelacht?</span>
    <div class="chips">${[[0, '🙂 geschmunzelt'], [1, '😄 gelacht'], [2, '😂 laut'], [3, '🤣 Tränen']].map(([v, l]) => `<button class="chip" data-act="laugh" data-v="${v}" aria-pressed="${m.laugh === v}">${l}</button>`).join('')}</div>
    <button class="btn primary" data-act="save">Speichern (+${XP.moment} XP)</button></section>`;
}

function viewTwist() {
  const d = C.days[today()] || { moments: [] }, last = (d.moments || []).slice(-1)[0];
  return `${topBar(true)}<div class="stack"><span class="eyebrow">Bonus</span><h1>Selbst drehen</h1><p class="muted">Nimm ein Setup, finde eine zweite Deutung und schreib eine eigene Pointe. Gleiches Setup, anderer Bruch. Schlecht ist erlaubt, Menge schlägt Qualität.</p></div>
  <section class="card">${last ? `<div class="note small"><b>Setup von eben:</b> ${esc(last.what)}<br><b>Erwartung:</b> ${esc(last.exp)}</div>` : ''}
    <div class="note small"><b>So geht's:</b> 1. Welche Annahme macht das Publikum? 2. Was könnte das Setup noch bedeuten (anderes Wort, andere Person, anderer Grund)? 3. Die Pointe verrät nur diese zweite Deutung, so kurz wie möglich.</div>
    <textarea class="input" id="tw" rows="3" placeholder="Setup … / Pointe …"></textarea>
    <button class="btn primary" data-act="twist">Speichern (+${XP.twist} XP)</button></section>
  ${(d.twists || []).length ? `<section class="card"><span class="eyebrow">Heute gedreht</span>${d.twists.map(x => `<div class="note">${esc(x)}</div>`).join('')}</section>` : ''}`;
}

function render() {
  const r = route();
  app.innerHTML = r === 'moment' ? viewMoment() : r === 'twist' ? viewTwist() : viewHub();
  const f = app.querySelector('textarea'); if (f && matchMedia('(pointer:fine)').matches) f.focus();
}
const val = () => ((document.getElementById('f') || {}).value || '').trim();
function keep() { const v = val(); if (F.step === 0) F.m.what = v; else if (F.step === 1) F.m.exp = v; else if (F.step === 2) F.m.brk = v; else F.m.note = v; }
app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, v = el.dataset.v;
  if (a === 'go') return go(v);
  if (a === 'new') { F = { step: 0, m: { tech: [], why: [] } }; return go('moment'); }
  if (a === 'next') { keep(); if (!val()) { toast(['Kurz in Stichworten, was es war', 'Was hast du erwartet?', 'Was ist stattdessen passiert?'][F.step]); return; } if (F.step === 2 && !F.m.tech.length) { toast('Wähl mindestens eine Technik'); return; } F.step++; render(); return; }
  if (a === 'tech' || a === 'why') { keep(); const k = a, arr = F.m[k] || (F.m[k] = []), i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); render(); return; }
  if (a === 'laugh') { keep(); F.m.laugh = +v; render(); return; }
  if (a === 'save') {
    keep(); if (!F.m.note && !F.m.why.length) { toast('Ein Grund reicht: antippen oder ein Satz'); return; }
    const d = day(); d.moments.push(Object.assign({ at: Date.now() }, F.m)); d.src = d.src || srcOfDay()[1];
    let xp = XP.moment; if (!d.done && d.moments.length >= NEED) { d.done = true; xp += XP.session; }
    C.xp += xp; save(); gainXP('comedy', xp); toast((d.done && d.moments.length === NEED ? 'Session erledigt · ' : 'Gespeichert · ') + '+' + xp + ' XP'); F = { step: 0, m: {} }; go(''); return;
  }
  if (a === 'twist') { const t = (document.getElementById('tw').value || '').trim(); if (!t) { toast('Setup und Pointe, auch wenn sie schlecht ist'); return; } const d = day(); d.twists.push(t.slice(0, 600)); C.xp += XP.twist; save(); gainXP('comedy', XP.twist); toast('Gedreht · +' + XP.twist + ' XP'); render(); return; }
});
addEventListener('hashchange', render);
if (route() === 'moment' && !F.m.tech) history.replaceState(null, '', location.pathname);
render();
