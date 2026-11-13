/* Echo · Kompass: eudaimonic well-being in five keys, kept small enough to use daily.
   1 Werte (ACT): directions per life area, one step a day          → daily card
   2 Stärken (VIA): one signature strength per week, used in a new way → weekly card
   3 Warum-Check (Sheldon & Elliot): why am I pursuing this goal?    → tool
   4 Bestes Ich (King 2001): 15 minutes writing about the best plausible future → tool
   5 Monatsrückblick: growth, values fit, edge, deep conversations    → monthly
   Storage: 'echo-kompass' (backed up by Echo). Needs tools-common.js. */
'use strict';
const app = document.getElementById('app');
const AREAS = [['arbeit', '🔬', 'Arbeit & Forschung', 'z. B. neugierig und gründlich forschen, auch wenn es mühsam wird'], ['nah', '🤝', 'Beziehungen', 'z. B. präsent sein und mich melden, bevor jemand fragt'], ['koerper', '🏐', 'Körper & Gesundheit', 'z. B. meinen Körper so behandeln, dass er mich lange trägt'], ['lernen', '📚', 'Lernen & Wachsen', 'z. B. jede Woche etwas tun, das ich noch nicht kann'], ['frei', '🌲', 'Freizeit & Erleben', 'z. B. Neues ausprobieren statt Zeit totschlagen']];
const VIA = [['Kreativität', 'Eine Alltagsaufgabe auf einem neuen Weg lösen'], ['Neugier', 'Jemanden etwas fragen, das du wirklich wissen willst'], ['Urteilsvermögen', 'Eine eigene Überzeugung gegen das stärkste Gegenargument prüfen'], ['Liebe zum Lernen', '20 Minuten etwas lernen, das nicht nützlich sein muss'], ['Weitsicht', 'Jemandem zuhören und erst danach einen Rat geben'], ['Mut', 'Eine Sache ansprechen, die du sonst schlucken würdest'], ['Ausdauer', 'Eine liegengebliebene Aufgabe zu Ende bringen'], ['Ehrlichkeit', 'Einmal ehrlich sagen, was du denkst, freundlich'], ['Tatendrang', 'Etwas Körperliches draußen machen, mit vollem Einsatz'], ['Liebe', 'Einem nahen Menschen sagen, was er dir bedeutet'], ['Freundlichkeit', 'Jemandem ungefragt helfen'], ['Soziale Intelligenz', 'In einem Gespräch auf die Stimmung hinter den Worten achten'], ['Teamgeist', 'Im Team eine Aufgabe übernehmen, die sonst liegen bleibt'], ['Fairness', 'Jemanden einbeziehen, der übergangen wird'], ['Führung', 'Ein Treffen oder Vorhaben in der Gruppe organisieren'], ['Vergebung', 'Einen alten Groll bewusst loslassen'], ['Bescheidenheit', 'Den Beitrag eines anderen hervorheben statt deinen'], ['Umsicht', 'Vor einer Entscheidung zehn Minuten die Folgen durchdenken'], ['Selbstregulation', 'Einen Impuls bemerken und bewusst nicht nachgeben'], ['Sinn für Schönheit', 'Zehn Minuten etwas Schönes bewusst anschauen oder anhören'], ['Dankbarkeit', 'Jemandem konkret danken'], ['Hoffnung', 'Für ein Problem drei Wege aufschreiben, wie es gut ausgehen kann'], ['Humor', 'Jemanden zum Lachen bringen, der einen schweren Tag hat'], ['Spiritualität', 'Zehn Minuten über das Größere nachdenken, zu dem deine Arbeit beiträgt']];
const XP = { step: 40, edge: 20, strength: 40, why: 20, best: 60, talk: 150, month: 100 };
const K = Object.assign({ values: {}, steps: [], top: [], weekStr: {}, str: [], why: [], best: [], talks: [], months: {} }, LS.get('echo-kompass', {}));
const save = () => { K.updated = Date.now(); LS.set('echo-kompass', K); };
const route = () => location.hash.replace(/^#/, '');
const go = h => { if (route() === h) render(); else location.hash = h; };
const weekKey = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return dk(x); };
const monthKey = (d = new Date()) => dk(d).slice(0, 7);
const area = id => AREAS.find(a => a[0] === id) || AREAS[0];
const hasValues = () => AREAS.some(a => (K.values[a[0]] || '').trim());
const streak = () => { let n = 0, d = new Date(); if (!K.steps.some(s => s.date === today())) d.setDate(d.getDate() - 1); while (K.steps.some(s => s.date === dk(d))) { n++; d.setDate(d.getDate() - 1); } return n; };
const topBar = back => `<div class="topbar"><a class="link" href="${back ? '#' : 'index.html#games'}">← ${back ? 'Kompass' : 'Echo'}</a><span class="xp">${LS.get('echo-games', {}).xp || 0} XP</span></div>`;
let D = { area: null, edge: false }; // draft of today's step

/* ---------- hub ---------- */
function viewHub() {
  if (!hasValues()) return viewValues(true);
  const t = today(), done = K.steps.filter(s => s.date === t), wk = weekKey(), ws = K.weekStr[wk], strDone = K.str.some(s => s.date === t), talk = K.talks.find(x => x.week === wk);
  const mk = monthKey(), lastMonth = monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)), dueReview = !K.months[lastMonth] && K.steps.some(s => s.date.startsWith(lastMonth));
  const areas = AREAS.filter(a => (K.values[a[0]] || '').trim());
  return `${topBar()}<div class="stack"><span class="eyebrow">Echo</span><h1>🧭 Kompass</h1><p class="muted">Nach deinen Werten leben und dabei wachsen, in fünf kleinen Bausteinen.</p></div>
  ${dueReview ? `<button class="card hub" data-act="go" data-v="monat" style="border-color:var(--gold)"><div class="row"><span class="em">🗓️</span><div class="stack" style="gap:0"><h3>Monatsrückblick ist dran</h3><span class="small muted">Drei Fragen zum letzten Monat · +${XP.month} XP</span></div></div></button>` : ''}
  <section class="card"><div class="row spread"><div class="stack" style="gap:0"><span class="eyebrow">1 · Heute</span><h3>Ein Schritt in Richtung deiner Werte</h3></div><span class="xp">${streak() ? '🔥 ' + streak() : '+' + XP.step}</span></div>
  ${done.length ? done.map(s => `<div class="note">${area(s.area)[1]} ${esc(s.text)}${s.edge ? ' <span class="xp">an der Grenze</span>' : ''}</div>`).join('') : ''}
  <div class="chips">${areas.map(a => `<button class="chip" data-act="area" data-v="${a[0]}" aria-pressed="${D.area === a[0]}">${a[1]} ${esc(a[2])}</button>`).join('')}</div>
  ${D.area ? `<p class="small muted">Deine Richtung: <i>${esc(K.values[D.area])}</i></p>` : ''}
  <textarea class="input" id="stepText" rows="2" placeholder="${done.length ? 'Noch ein Schritt?' : 'Was hast du heute getan, das dazu passt?'}"></textarea>
  <label class="row small" style="gap:8px"><input type="checkbox" id="stepEdge" ${D.edge ? 'checked' : ''}> War knapp über meinem Können (an der Grenze, +${XP.edge} XP)</label>
  <button class="btn primary" data-act="step">Eintragen</button></section>
  <section class="card"><div class="row spread"><div class="stack" style="gap:0"><span class="eyebrow">2 · Diese Woche</span><h3>${ws ? '💪 ' + esc(ws) : 'Stärke der Woche'}</h3></div><span class="xp">+${XP.strength}</span></div>
  ${!K.top.length ? `<p class="small muted">Wähle zuerst deine fünf Hauptstärken. Am genauesten geht das mit dem kostenlosen VIA-Test (viacharacter.org, rund 15 Minuten).</p><button class="btn" data-act="go" data-v="staerken">Stärken wählen</button>`
    : ws ? `<p class="small">Idee: ${esc((VIA.find(v => v[0] === ws) || [])[1] || '')}. Oder ganz anders, Hauptsache neu.</p>${strDone ? '<div class="note">✓ Heute eingesetzt</div>' : `<div class="row" style="gap:8px"><input class="input grow" id="strText" placeholder="Wie hast du sie heute neu eingesetzt?"><button class="btn primary" data-act="str">✓</button></div>`}<span class="small muted">Diese Woche ${K.str.filter(s => s.week === wk).length} / 7 Tage</span>`
    : `<p class="small muted">Welche deiner Stärken setzt du diese Woche jeden Tag auf eine neue Art ein?</p><div class="chips">${K.top.map(s => `<button class="chip" data-act="weekstr" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>`}
  <div class="row spread" style="margin-top:6px"><span class="small">🗣️ Ein ehrliches, tiefes Gespräch diese Woche</span>${talk ? '<span class="xp">✓</span>' : `<button class="btn sm" data-act="talk">Hatte ich · +${XP.talk}</button>`}</div></section>
  <div class="stack" style="gap:10px"><span class="eyebrow">Werkzeuge</span>
  ${card('warum', '🎯', '3 · Warum-Check', 'Verfolgst du ein Ziel aus eigenem Antrieb oder aus Pflicht? In zwei Minuten geklärt.', K.why.length ? K.why.length + ' Ziele geprüft' : 'Noch keins')}
  ${card('bestes', '🌅', '4 · Bestes Ich', '15 Minuten schreiben: Wie sieht dein Leben in zehn Jahren aus, wenn vieles gut läuft?', K.best.length ? 'Zuletzt ' + fmtDay(K.best[K.best.length - 1].date) : 'Noch nie')}
  ${card('monat', '🗓️', '5 · Monatsrückblick', 'Wo bist du gewachsen, was passte zu deinen Werten, wo warst du an der Grenze?', K.months[mk] ? 'Diesen Monat erledigt' : (K.months[lastMonth] ? 'Letzter Monat erledigt' : 'Offen'))}
  ${card('werte', '✏️', 'Werte bearbeiten', 'Deine Richtungen in fünf Lebensbereichen', areas.length + ' von 5 ausgefüllt')}
  ${card('staerken', '💪', 'Stärken bearbeiten', 'Deine fünf Hauptstärken', K.top.length ? K.top.join(' · ') : 'Noch nicht gewählt')}</div>
  ${statsCard()}`;
}
const card = (v, em, t, sub, meta) => `<button class="card hub" data-act="go" data-v="${v}"><div class="row"><span class="em">${em}</span><div class="stack" style="gap:0"><h3>${t}</h3><span class="small muted">${sub}</span></div></div><span class="small muted">${meta}</span></button>`;
function statsCard() {
  const since = addDays(-29), last = K.steps.filter(s => s.date >= since); if (!last.length) return '';
  const by = AREAS.map(a => [a, last.filter(s => s.area === a[0]).length]).filter(([a]) => (K.values[a[0]] || '').trim()), mx = Math.max(1, ...by.map(x => x[1]));
  return `<details class="card"><summary>Letzte 30 Tage · ${last.length} Schritte, ${last.filter(s => s.edge).length} an der Grenze</summary><div class="stack" style="gap:8px">${by.map(([a, n]) => `<div class="stack" style="gap:3px"><div class="row spread small"><span>${a[1]} ${esc(a[2])}</span><b class="mono">${n}</b></div><div class="bar"><i style="width:${n / mx * 100}%"></i></div></div>`).join('')}
  ${by.some(([, n]) => n === 0) ? `<p class="small muted">Ein Bereich ohne Schritte ist kein Versagen, aber eine Frage: Ist er dir gerade wirklich wichtig, oder kommt er nur unter die Räder?</p>` : ''}</div></details>`;
}

/* ---------- 1 · values ---------- */
function viewValues(first) {
  return `${first ? topBar() : topBar(true)}<div class="stack"><span class="eyebrow">1 · Werte</span><h1>${first ? '🧭 Wofür willst du stehen?' : '✏️ Deine Werte'}</h1><p class="muted">Schreib pro Lebensbereich einen Satz, <b>wie</b> du sein willst, nicht was du erreichen willst. Ein Ziel ist irgendwann erledigt, eine Richtung nicht. Leere Bereiche tauchen im Alltag nicht auf.</p></div>
  ${AREAS.map(([id, em, t, ph]) => `<label class="stack" style="gap:4px"><b>${em} ${t}</b><textarea class="input" rows="2" data-val="${id}" placeholder="${ph}">${esc(K.values[id] || '')}</textarea></label>`).join('')}
  <p class="small muted">Prüffrage für jeden Satz: Würde ich so handeln wollen, auch wenn es niemand mitbekommt?</p>
  <button class="btn primary big" data-act="values-save">Speichern</button>`;
}

/* ---------- 2 · strengths ---------- */
function viewStrengths() {
  return `${topBar(true)}<div class="stack"><span class="eyebrow">2 · Stärken</span><h1>💪 Deine fünf Hauptstärken</h1><p class="muted">Am genauesten mit dem kostenlosen VIA-Test (viacharacter.org): Übernimm dort die ersten fünf. Ohne Test: Nimm die, bei denen du denkst „das bin einfach ich“ und die dir Energie geben, statt sie zu kosten.</p></div>
  <div class="chips">${VIA.map(([n]) => `<button class="chip" data-act="top" data-v="${esc(n)}" aria-pressed="${K.top.includes(n)}">${esc(n)}</button>`).join('')}</div>
  <p class="small muted">${K.top.length} / 5 gewählt</p><button class="btn primary big" data-act="go" data-v="">Fertig</button>
  <div class="note small">In Studien (Seligman 2005, Gander 2013) hob es das Wohlbefinden über Monate, eine Hauptstärke eine Woche lang täglich auf neue Art einzusetzen. Das Neue ist dabei der Kern, nicht das bloße Benutzen.</div>`;
}

/* ---------- 3 · why-check ---------- */
const WHY = [['ext', 'Weil andere es erwarten, oder für Belohnung bzw. Anerkennung', -2], ['intro', 'Weil ich mich sonst schuldig oder schlecht fühlen würde', -1], ['ident', 'Weil ich es wirklich für wichtig halte', 1], ['intr', 'Weil es mir Freude macht oder mich fasziniert', 2]];
let W = null;
function viewWhy() {
  if (!W) W = { goal: '', r: { ext: 3, intro: 3, ident: 3, intr: 3 } };
  const score = WHY.reduce((s, [k, , w]) => s + w * W.r[k], 0);
  const verdict = score >= 6 ? ['Aus eigenem Antrieb', 'Gute Voraussetzungen: Solche Ziele hält man eher durch, und Erreichen macht zufriedener.'] : score >= 0 ? ['Gemischt', 'Frag dich, ob du das Ziel so umformen kannst, dass mehr von dir drinsteckt, oder ob du es bewusst als Pflicht akzeptierst.'] : ['Eher fremdbestimmt', 'Solche Ziele kosten viel Willenskraft und machen selbst bei Erfolg wenig zufrieden. Überleg, ob du es streichen, abgeben oder neu begründen kannst.'];
  return `${topBar(true)}<div class="stack"><span class="eyebrow">3 · Warum-Check</span><h1>🎯 Warum verfolgst du dieses Ziel?</h1><p class="muted">Nach Sheldon & Elliot: Ziele, die zu dir passen, hältst du eher durch, und sie machen dich zufriedener, wenn du sie erreichst.</p></div>
  <input class="input" id="whyGoal" placeholder="Ziel, z. B. Steuerberater werden" value="${esc(W.goal)}">
  ${WHY.map(([k, t]) => `<label class="stack" style="gap:4px"><span class="small">${t}: <b class="mono">${W.r[k]}</b> / 5</span><input type="range" min="1" max="5" step="1" value="${W.r[k]}" data-why="${k}"></label>`).join('')}
  <div class="card flat"><div class="row spread"><b>${verdict[0]}</b><span class="mono">${score > 0 ? '+' : ''}${score}</span></div><span class="small muted">${verdict[1]}</span></div>
  <button class="btn primary big" data-act="why-save">Speichern · +${XP.why} XP</button>
  ${K.why.length ? `<details class="card"><summary>Frühere Checks (${K.why.length})</summary><div class="stack">${K.why.slice().reverse().map(w => `<div class="note"><b>${esc(w.goal)}</b> · ${fmtDay(w.date)} · <span class="mono">${w.score > 0 ? '+' : ''}${w.score}</span></div>`).join('')}</div></details>` : ''}`;
}

/* ---------- 4 · best possible self ---------- */
let BT = null, BS = 0;
function viewBest() {
  const run = BS > 0, left = Math.max(0, 900 - BS);
  return `${topBar(true)}<div class="stack"><span class="eyebrow">4 · Bestes Ich</span><h1>🌅 Dein Leben in zehn Jahren</h1><p class="muted">Stell dir vor, vieles ist gut gelaufen: Du hast hart gearbeitet und erreicht, was dir wichtig ist. Beschreib diesen Alltag so konkret wie möglich. Arbeit, Menschen, Ort, Körper, ein typischer Dienstag. Realistisch-optimistisch, keine Fantasie.</p></div>
  <div class="row spread"><span class="mono" id="bestT" style="font-size:20px;font-weight:700">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</span>${run ? '' : '<button class="btn sm" data-act="best-start">15-Minuten-Uhr starten</button>'}</div>
  <textarea class="input" id="bestText" rows="14" placeholder="Es ist ein Dienstag im Jahr ${new Date().getFullYear() + 10}. Ich wache auf …"></textarea>
  <button class="btn primary big" data-act="best-save">Speichern · +${XP.best} XP</button>
  <div class="note small">King (2001) und Meevissen (2011): Mehrmals über das bestmögliche Selbst schreiben hob Optimismus und Stimmung. Nebenbei siehst du klarer, was dir wichtig ist; danach lohnt ein Blick auf deine Werte.</div>
  ${K.best.length ? `<details class="card"><summary>Frühere Texte (${K.best.length})</summary><div class="stack">${K.best.slice().reverse().map(b => `<div class="note"><b>${fmtDay(b.date)}</b><br>${esc(b.text).replace(/\n/g, '<br>')}</div>`).join('')}</div></details>` : ''}`;
}

/* ---------- 5 · monthly review ---------- */
const MQ = [['gewachsen', 'Wo bist du diesen Monat gewachsen? Was kannst du jetzt, was du vorher nicht konntest?'], ['passend', 'Was hast du getan, das richtig gut zu deinen Werten passte?'], ['quer', 'Wo hast du gegen deine Werte gehandelt, und was änderst du nächsten Monat?'], ['grenze', 'Wo warst du an deiner Grenze, und wo bist du zu bequem geblieben?']];
function viewMonth() {
  const now = new Date(), lastM = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 15)), mk = !K.months[lastM] && now.getDate() <= 10 ? lastM : monthKey(), m = K.months[mk] || {};
  const st = K.steps.filter(s => s.date.startsWith(mk)), name = new Date(mk + '-15').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  return `${topBar(true)}<div class="stack"><span class="eyebrow">5 · Monatsrückblick</span><h1>🗓️ ${name}</h1><p class="muted">Wachstum passiert langsam, ohne Rückblick merkt man es kaum.</p></div>
  <div class="stats"><div class="stat"><span class="small muted">Werte-Schritte</span><b>${st.length}</b></div><div class="stat"><span class="small muted">An der Grenze</span><b>${st.filter(s => s.edge).length}</b></div><div class="stat"><span class="small muted">Tiefe Gespräche</span><b>${K.talks.filter(t => t.date.startsWith(mk)).length}</b></div></div>
  ${st.length ? `<details class="card"><summary>Deine Schritte im ${name.split(' ')[0]}</summary><div class="stack">${st.map(s => `<div class="small">${area(s.area)[1]} ${fmtDay(s.date)} · ${esc(s.text)}</div>`).join('')}</div></details>` : ''}
  ${MQ.map(([k, q]) => `<label class="stack" style="gap:4px"><b class="small">${q}</b><textarea class="input" rows="3" data-mq="${k}">${esc(m[k] || '')}</textarea></label>`).join('')}
  <button class="btn primary big" data-act="month-save" data-v="${mk}">Speichern${K.months[mk] ? '' : ' · +' + XP.month + ' XP'}</button>`;
}

/* ---------- routing + events ---------- */
function render() {
  const r = route(); clearInterval(BT); BT = null; BS = 0;
  app.innerHTML = r === 'werte' ? viewValues() : r === 'staerken' ? viewStrengths() : r === 'warum' ? viewWhy() : r === 'bestes' ? viewBest() : r === 'monat' ? viewMonth() : viewHub();
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
document.addEventListener('input', e => { const k = e.target.dataset.why; if (k && W) { W.r[k] = +e.target.value; W.goal = (document.getElementById('whyGoal') || {}).value || W.goal; const y = scrollY; render(); scrollTo(0, y); } });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act, v = el.dataset.v;
  if (a === 'go') { e.preventDefault(); W = null; go(v); return; }
  if (a === 'area') { D.area = D.area === v ? null : v; D.edge = (document.getElementById('stepEdge') || {}).checked; const txt = (document.getElementById('stepText') || {}).value; render(); if (txt) document.getElementById('stepText').value = txt; return; }
  if (a === 'step') {
    const text = (document.getElementById('stepText').value || '').trim(), edge = document.getElementById('stepEdge').checked;
    if (!D.area) { toast('Wähle zuerst den Bereich'); return; } if (!text) { toast('Schreib kurz auf, was du getan hast'); return; }
    K.steps.push({ id: uid(), date: today(), area: D.area, text: text.slice(0, 500), edge }); save(); const xp = XP.step + (edge ? XP.edge : 0); gainXP('kompass', xp); D = { area: null, edge: false }; toast('Eingetragen · +' + xp + ' XP'); render(); return;
  }
  if (a === 'weekstr') { K.weekStr[weekKey()] = v; save(); render(); return; }
  if (a === 'str') { const t = (document.getElementById('strText').value || '').trim(); if (!t) { toast('Wie hast du sie eingesetzt?'); return; } K.str.push({ date: today(), week: weekKey(), s: K.weekStr[weekKey()], text: t.slice(0, 300) }); save(); gainXP('kompass', XP.strength); toast('Stärke eingesetzt · +' + XP.strength + ' XP'); render(); return; }
  if (a === 'talk') { K.talks.push({ date: today(), week: weekKey() }); save(); gainXP('kompass', XP.talk); toast('Tiefes Gespräch · +' + XP.talk + ' XP'); render(); return; }
  if (a === 'top') { const i = K.top.indexOf(v); if (i >= 0) K.top.splice(i, 1); else if (K.top.length < 5) K.top.push(v); else { toast('Höchstens fünf'); return; } save(); render(); return; }
  if (a === 'values-save') { document.querySelectorAll('[data-val]').forEach(t => { K.values[t.dataset.val] = t.value.trim().slice(0, 300); }); save(); if (!hasValues()) { toast('Mindestens einen Bereich ausfüllen'); return; } toast('Gespeichert'); go(''); return; }
  if (a === 'why-save') { const goal = (document.getElementById('whyGoal').value || '').trim(); if (!goal) { toast('Welches Ziel?'); return; } const score = WHY.reduce((s, [k, , w]) => s + w * W.r[k], 0); K.why.push({ date: today(), goal: goal.slice(0, 200), r: Object.assign({}, W.r), score }); save(); gainXP('kompass', XP.why); toast('Gespeichert · +' + XP.why + ' XP'); W = null; render(); return; }
  if (a === 'best-start') { BS = 1; el.remove(); BT = setInterval(() => { BS++; const left = Math.max(0, 900 - BS), t = document.getElementById('bestT'); if (t) t.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); if (!left) { clearInterval(BT); toast('15 Minuten um. Schreib den Gedanken zu Ende.'); } }, 1000); return; }
  if (a === 'best-save') { const t = (document.getElementById('bestText').value || '').trim(); if (t.length < 80) { toast('Noch etwas mehr: ein paar Sätze reichen'); return; } K.best.push({ date: today(), text: t.slice(0, 8000) }); save(); gainXP('kompass', XP.best); toast('Gespeichert · +' + XP.best + ' XP'); go(''); return; }
  if (a === 'month-save') { const first = !K.months[v], m = {}; document.querySelectorAll('[data-mq]').forEach(t => { m[t.dataset.mq] = t.value.trim().slice(0, 2000); }); if (!Object.values(m).some(Boolean)) { toast('Beantworte mindestens eine Frage'); return; } K.months[v] = Object.assign(m, { at: Date.now() }); save(); if (first) { gainXP('kompass', XP.month); toast('Rückblick gespeichert · +' + XP.month + ' XP'); } else toast('Gespeichert'); go(''); return; }
});
render();
