/* Echo Werkzeuge: IAT (implicit associations), decision tools with a decision journal, small-talk training. */
const T = Object.assign({ iat: [], dec: [], soc: { lvl: 1, log: [], cur: null }, rp: [] }, LS.get('echo-tools', null) || {});
const saveT = () => { T.updated = Date.now(); LS.set('echo-tools', T); };
const app = document.getElementById('app');
let view = location.hash.slice(1) || 'hub';
addEventListener('hashchange', () => { view = location.hash.slice(1) || 'hub'; render(); scrollTo(0, 0); });
const go = v => { if ((location.hash.slice(1) || 'hub') === v) { render(); return; } location.hash = v === 'hub' ? '' : v; if (v === 'hub') { view = 'hub'; render(); } };
const topBar = (back = 'hub', label = 'Werkzeuge') => `<div class="topbar">${back === 'echo' ? '<a class="link" href="./#games">← Spiele</a>' : `<button class="link" data-act="go" data-v="${back}">← ${esc(label)}</button>`}<span></span></div>`;

/* ================= IAT ================= */
const GOOD = ['Freude', 'Liebe', 'Frieden', 'wunderbar', 'Vergnügen', 'herrlich', 'Lachen', 'glücklich'];
const BAD = ['Qual', 'schrecklich', 'furchtbar', 'böse', 'scheußlich', 'Versagen', 'verletzt', 'Elend'];
const IAT_SETS = [
  { id: 'gk', title: 'Geschlecht & Karriere', em: '💼', A: ['Männer', ['Ben', 'Paul', 'Daniel', 'Jonas', 'Michael', 'Thomas']], B: ['Frauen', ['Anna', 'Julia', 'Lisa', 'Sarah', 'Maria', 'Emily']], X: ['Karriere', ['Management', 'Beruf', 'Firma', 'Gehalt', 'Büro', 'Karriere', 'Geschäft']], Y: ['Familie', ['Zuhause', 'Eltern', 'Kinder', 'Familie', 'Hochzeit', 'Verwandte', 'Ehe']] },
  { id: 'gw', title: 'Geschlecht & Wissenschaft', em: '🔬', A: ['Männlich', ['Mann', 'Junge', 'Vater', 'Bruder', 'Onkel', 'Ehemann']], B: ['Weiblich', ['Frau', 'Mädchen', 'Mutter', 'Schwester', 'Tante', 'Ehefrau']], X: ['Naturwissenschaft', ['Physik', 'Chemie', 'Mathematik', 'Ingenieurwesen', 'Informatik', 'Astronomie']], Y: ['Geisteswissenschaft', ['Kunst', 'Literatur', 'Philosophie', 'Musik', 'Geschichte', 'Sprachen']] },
  { id: 'ps', title: 'Psychische & körperliche Krankheit', em: '🧠', A: ['Psychisch krank', ['Schizophrenie', 'Depression', 'Bipolare Störung', 'Zwangsstörung', 'Psychose', 'Angststörung']], B: ['Körperlich krank', ['Diabetes', 'Asthma', 'Rheuma', 'Arthrose', 'Herzschwäche', 'Bluthochdruck']], X: ['Harmlos', ['harmlos', 'sicher', 'friedlich', 'sanft', 'ruhig', 'ungefährlich']], Y: ['Gefährlich', ['gefährlich', 'bedrohlich', 'gewalttätig', 'unberechenbar', 'aggressiv', 'riskant']] },
  { id: 'gew', title: 'Körpergewicht', em: '⚖️', A: ['Schlank', ['schlank', 'dünn', 'zierlich', 'schmal']], B: ['Dick', ['dick', 'übergewichtig', 'korpulent', 'füllig']], X: ['Gut', GOOD], Y: ['Schlecht', BAD] },
  { id: 'alt', title: 'Alter', em: '⏳', A: ['Jung', ['jung', 'Jugend', 'Teenager', 'jugendlich']], B: ['Alt', ['alt', 'Senior', 'betagt', 'Rentner']], X: ['Gut', GOOD], Y: ['Schlecht', BAD] },
  { id: 'her', title: 'Herkunft (Vornamen)', em: '🌍', A: ['Deutsche Namen', ['Lukas', 'Jan', 'Felix', 'Laura', 'Lena', 'Hannah']], B: ['Türkische Namen', ['Mehmet', 'Emre', 'Ahmet', 'Ayşe', 'Elif', 'Zeynep']], X: ['Gut', GOOD], Y: ['Schlecht', BAD] },
];
let IA = null;
function iatBlocks(o) { // standard seven-block design (Greenwald, Nosek & Banaji 2003), sides of the targets counterbalanced
  const [L1, R1] = o ? ['B', 'A'] : ['A', 'B'];
  return [{ n: 20, L: [L1], R: [R1] }, { n: 20, L: ['X'], R: ['Y'] }, { n: 20, L: [L1, 'X'], R: [R1, 'Y'] }, { n: 40, L: [L1, 'X'], R: [R1, 'Y'] },
    { n: 28, L: [R1], R: [L1] }, { n: 20, L: [R1, 'X'], R: [L1, 'Y'] }, { n: 40, L: [R1, 'X'], R: [L1, 'Y'] }];
}
function iatTrials(set, b) {
  const cats = b.L.concat(b.R), tc = cats.filter(c => c === 'A' || c === 'B'), ac = cats.filter(c => c === 'X' || c === 'Y'), bags = {}, last = { w: null };
  const draw = cs => { const c = cs[Math.floor(Math.random() * cs.length)]; if (!bags[c] || !bags[c].length) bags[c] = shuffle(set[c][1]); let w = bags[c].pop(); if (w === last.w && bags[c].length) { bags[c].unshift(w); w = bags[c].pop(); } last.w = w; return { w, c, side: b.L.includes(c) ? 'L' : 'R', k: tc.includes(c) ? 't' : 'a' }; };
  const out = []; for (let i = 0; i < b.n; i++) out.push(draw(tc.length && ac.length ? (i % 2 ? ac : tc) : tc.length ? tc : ac));
  return out;
}
function iatStart(id) {
  const set = IAT_SETS.find(s => s.id === id), o = Math.random() < 0.5 ? 0 : 1;
  IA = { set, o, blocks: iatBlocks(o), bi: 0, ti: 0, phase: 'instr', rec: [], trials: [], err: false, busy: false };
  document.body.insertAdjacentHTML('beforeend', '<div class="iat" id="iat"></div>'); iatPaint();
}
const catLbl = (set, c) => `<span class="${c === 'A' || c === 'B' ? 't' : 'a'}">${esc(set[c][0])}</span>`;
function iatPaint() {
  const el = document.getElementById('iat'); if (!el) return; const b = IA.blocks[IA.bi], s = IA.set;
  const side = cs => cs.map(c => catLbl(s, c)).join('<span class="or">oder</span>');
  const cats = `<div class="cats"><div>${side(b.L)}</div><div>${side(b.R)}</div></div>`;
  const keys = `<div class="keys"><button data-k="L">links · E</button><button data-k="R">rechts · I</button></div>`;
  if (IA.phase === 'instr') {
    const changed = IA.bi === 4 ? '<p><b>Achtung:</b> Die beiden Gruppen haben die Seiten getauscht.</p>' : IA.bi === 5 ? '<p>Jetzt wieder kombiniert, mit den neuen Seiten.</p>' : '';
    el.innerHTML = `${cats}<div class="instr"><span class="eyebrow">Block ${IA.bi + 1} von 7</span>${changed}<p>Ordne jedes Wort so schnell wie möglich der linken oder rechten Seite zu. Bei einem Fehler erscheint ein rotes ✕: dann einfach die andere Seite wählen.</p><p class="small muted">Tastatur: E für links, I für rechts. Am Handy: die großen Flächen unten. Schnelligkeit zählt, kleine Fehler sind normal.</p><button class="btn primary big" data-k="go">Start</button><button class="link" data-k="quit">Abbrechen</button></div><div></div>`;
    return;
  }
  if (IA.phase === 'run') {
    const tr = IA.trials[IA.ti];
    el.innerHTML = `${cats}<div class="stim ${tr && IA.show ? tr.k : ''}" id="iatStim">${tr && IA.show ? esc(tr.w) : ''}${IA.err ? '<span class="x">✕</span>' : ''}</div>${keys}`;
  }
}
function iatNextTrial() {
  IA.show = false; IA.err = false; iatPaint();
  setTimeout(() => { if (!IA) return; IA.show = true; iatPaint(); requestAnimationFrame(() => { IA.t0 = performance.now(); IA.busy = false; }); }, 250);
}
function iatKey(k) {
  if (!IA) return;
  if (k === 'quit') { document.getElementById('iat').remove(); IA = null; return; }
  if (IA.phase === 'instr') { if (k === 'go') { IA.phase = 'run'; IA.trials = iatTrials(IA.set, IA.blocks[IA.bi]); IA.ti = 0; IA.busy = true; iatNextTrial(); } return; }
  if (IA.phase !== 'run' || IA.busy || !IA.show || (k !== 'L' && k !== 'R')) return;
  const tr = IA.trials[IA.ti];
  if (k !== tr.side) { if (!IA.err) { IA.err = true; IA.hadErr = true; iatPaint(); } return; }
  IA.busy = true; IA.rec.push({ b: IA.bi + 1, rt: Math.round(performance.now() - IA.t0), e: !!IA.hadErr }); IA.hadErr = false;
  if (++IA.ti < IA.trials.length) return iatNextTrial();
  if (++IA.bi < 7) { IA.phase = 'instr'; iatPaint(); return; }
  iatFinish();
}
function sd(a) { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); }
function iatScore(rec, o) { // improved D (Greenwald et al. 2003) with built-in error correction: latency until the correct key, no extra penalty
  const fast = rec.filter(r => r.rt < 300).length / rec.length, use = rec.filter(r => r.rt < 10000), rt = b => use.filter(r => r.b === b).map(r => r.rt);
  const part = (p, q) => (mean(rt(q)) - mean(rt(p))) / sd(rt(p).concat(rt(q)));
  const D = (part(3, 6) + part(4, 7)) / 2; // >0: second pairing slower
  return { D: o ? -D : D, err: rec.filter(r => r.e).length / rec.length, valid: fast <= 0.1 && isFinite(D) };
}
function iatFinish() {
  const sc = iatScore(IA.rec, IA.o), r = { id: uid(), set: IA.set.id, date: today(), t: Date.now(), D: +sc.D.toFixed(3), err: +sc.err.toFixed(3), valid: sc.valid, o: IA.o };
  T.iat.push(r); saveT(); if (r.valid) gainXP('iat', 20);
  document.getElementById('iat').remove(); IA = null; go('iat-' + r.id);
}
const strength = d => { const a = Math.abs(d); return a < 0.15 ? null : a < 0.35 ? 'leicht' : a < 0.65 ? 'mittel' : 'stark'; };
function iatText(set, D) {
  const st = strength(D); if (!st) return 'Keine messbare Präferenz: beide Zuordnungen gingen etwa gleich schnell.';
  const [p, q] = D > 0 ? ['X', 'Y'] : ['Y', 'X'];
  return `${st[0].toUpperCase() + st.slice(1)}e automatische Verknüpfung von <b>${esc(set.A[0])}</b> mit <b>${esc(set[p][0])}</b> (und ${esc(set.B[0])} mit ${esc(set[q][0])}).`;
}
const IAT_INFO = `<details class="card"><summary>Was der Test misst, und was nicht</summary><div class="stack small">
  <p>Der Implizite Assoziationstest misst, wie schnell du zwei Begriffspaare derselben Taste zuordnest. Geht „A + X“ schneller als „A + Y“, sind A und X in deinem Gedächtnis enger verknüpft. Das sagt etwas über gelernte Assoziationen, nicht über deine Überzeugungen.</p>
  <p><b>Grenzen:</b> Ein einzelner Durchgang ist unzuverlässig. Wiederholt man den IAT, korrelieren die Werte nur etwa mit r ≈ 0,5. Für das Verhalten einer einzelnen Person sagt er wenig voraus. Ab dem zweiten Durchgang werden die Effekte durch Übung oft kleiner.</p>
  <p>Deshalb zeigt Echo den Mittelwert aus allen Durchgängen. Mach jeden Test mehrmals an verschiedenen Tagen.</p>
  <p class="muted">Auswertung: verbesserter D-Wert nach Greenwald, Nosek &amp; Banaji (2003). Grenzen 0,15 / 0,35 / 0,65 für leicht / mittel / stark wie bei Project Implicit. Durchgänge mit mehr als 10 % Antworten unter 300 ms werden nicht gewertet.</p></div></details>`;
function viewIAT() {
  return `${topBar()}<div class="stack"><span class="eyebrow">Werkzeug</span><h1>🧠 Bias-Check (IAT)</h1><p class="muted">Sieben kurze Blöcke, etwa 5 Minuten. Am besten am Laptop mit Tastatur, am Handy geht es mit beiden Daumen.</p></div>
  ${IAT_INFO}
  ${IAT_SETS.map(s => { const rs = T.iat.filter(r => r.set === s.id && r.valid), m = rs.length ? mean(rs.map(r => r.D)) : null;
    return `<div class="card"><div class="row spread"><div class="row"><span style="font-size:26px">${s.em}</span><div class="stack" style="gap:0"><h3>${esc(s.title)}</h3><span class="small muted">${esc(s.A[0])} / ${esc(s.B[0])} · ${esc(s.X[0])} / ${esc(s.Y[0])}</span></div></div><button class="btn sm primary" data-act="iat-start" data-v="${s.id}">${rs.length ? 'Nochmal' : 'Starten'}</button></div>
    ${m != null ? `<p class="small">${iatText(s, m)} <span class="muted mono">Ø D = ${m.toFixed(2)} aus ${rs.length} ${rs.length === 1 ? 'Durchgang' : 'Durchgängen'}</span></p>` : ''}</div>`; }).join('')}`;
}
function viewIATResult(id) {
  const r = T.iat.find(x => x.id === id); if (!r) return viewIAT(); const s = IAT_SETS.find(x => x.id === r.set), rs = T.iat.filter(x => x.set === r.set && x.valid);
  const pos = Math.max(0, Math.min(100, 50 + r.D / 1.2 * 50));
  return `${topBar('iat', 'Bias-Check')}<div class="card"><span class="eyebrow">${esc(s.title)} · Ergebnis</span>
    ${r.valid ? `<p style="font-size:18px">${iatText(s, r.D)}</p>
    <div class="dscale"><i style="left:${pos}%"></i></div><div class="row spread small muted"><span>${esc(s.A[0])} + ${esc(s.Y[0])}</span><span>neutral</span><span>${esc(s.A[0])} + ${esc(s.X[0])}</span></div>
    <div class="stats"><div class="stat"><span class="small muted">D-Wert</span><b class="mono">${r.D.toFixed(2)}</b></div><div class="stat"><span class="small muted">Fehler</span><b class="mono">${Math.round(r.err * 100)} %</b></div><div class="stat"><span class="small muted">Durchgänge</span><b class="mono">${rs.length}</b></div></div>
    ${rs.length > 1 ? `<p class="small">Mittelwert aus allen ${rs.length} Durchgängen: <b class="mono">D = ${mean(rs.map(x => x.D)).toFixed(2)}</b>. Der ist aussagekräftiger als ein einzelner Wert.</p>` : '<p class="small muted">Ein einzelner Wert schwankt stark. Wiederhole den Test an einem anderen Tag. Echo mittelt dann.</p>'}`
    : '<p>Dieser Durchgang ist nicht auswertbar: Zu viele Antworten kamen schneller als 300 ms. Probier es nochmal in Ruhe.</p>'}
    <p class="small muted">Eine Verknüpfung im Gedächtnis ist keine Meinung. Sie entsteht aus dem, was man oft sieht und hört. Interessant ist, ob sie zu dem passt, was du denkst, und wo du im Alltag genauer hinschauen willst.</p>
    <div class="row wrap"><button class="btn primary" data-act="iat-start" data-v="${s.id}">Nochmal</button><button class="btn" data-act="go" data-v="iat">Alle Tests</button></div></div>`;
}

/* ================= Decisions ================= */
const DTOOLS = [
  { k: 'typ', em: '🚪', t: 'Einbahn- oder Drehtür?', d: 'Jeff Bezos unterscheidet Entscheidungen, die sich kaum rückgängig machen lassen (Einbahntür), von solchen, bei denen man zurückkann (Drehtür). Drehtüren schnell entscheiden, Einbahntüren gründlich.', f: [['rev', 'Kann ich das später rückgängig machen? Was würde es kosten?']] },
  { k: 'ten', em: '⏳', t: '10 / 10 / 10', d: 'Suzy Welch: Wie werde ich mich mit jeder Option in 10 Minuten, 10 Monaten und 10 Jahren fühlen? Das rückt das Gefühl des Augenblicks auf sein richtiges Gewicht.', f: [['m', 'In 10 Minuten …'], ['mo', 'In 10 Monaten …'], ['y', 'In 10 Jahren …']] },
  { k: 'mx', em: '⚖️', t: 'Gewichtete Matrix', d: 'Kriterien festlegen, gewichten (1–5), jede Option je Kriterium bewerten (1–10). Die Summe ist kein Urteil, sondern ein Spiegel: Wie fühlt es sich an, wenn der Sieger feststeht?', f: [] },
  { k: 'pm', em: '⚰️', t: 'Pre-Mortem', d: 'Gary Klein: Stell dir vor, es ist ein Jahr später und die Entscheidung ist krachend gescheitert. Warum? Danach: Was davon kann ich jetzt schon verhindern?', f: [['why', 'Es ist gescheitert, weil …'], ['fix', 'Das verhindere ich, indem …']] },
  { k: 'wrap', em: '🎁', t: 'WRAP', d: 'Chip & Dan Heath (Decisive): Optionen erweitern, an der Wirklichkeit testen, Abstand gewinnen, auf den Irrtum vorbereiten.', f: [['w', 'Wenn keine meiner Optionen ginge: Was würde ich dann tun? Geht „und“ statt „oder“?'], ['r', 'Wie kann ich es klein ausprobieren, bevor ich mich festlege?'], ['a', 'Was würde ich meinem besten Freund in genau dieser Lage raten?'], ['p', 'Stolperdraht: Woran merke ich, dass ich falsch lag, und wann schaue ich nach?']] },
  { k: 'out', em: '📊', t: 'Außensicht', d: 'Daniel Kahneman: Erst fragen, wie so etwas bei anderen in ähnlicher Lage normalerweise ausgeht (Basisrate), dann erst die Besonderheiten deines Falls einrechnen.', f: [['base', 'Bei anderen in dieser Lage geht es meistens so aus …'], ['diff', 'Was ist bei mir anders, und rechtfertigt das wirklich eine Abweichung?']] },
  { k: 'inv', em: '🔄', t: 'Umkehren', d: 'Charlie Munger: Statt „Wie gelingt es?“ fragen „Was würde es garantiert ruinieren?“, und genau das vermeiden.', f: [['x', 'Garantiert schief geht es, wenn ich …']] },
  { k: 'sec', em: '🌊', t: 'Und dann?', d: 'Folgen zweiter Ordnung: Was passiert nach der ersten, offensichtlichen Folge? Und danach?', f: [['x', 'Erste Folge → zweite Folge → dritte Folge']] },
  { k: 'reg', em: '🧓', t: 'Bedauern minimieren', d: 'Jeff Bezos: Mit 80 zurückblickend: Was würde ich mehr bereuen, es getan oder es nicht getan zu haben?', f: [['x', 'Mit 80 würde ich mehr bereuen …']] },
  { k: 'coin', em: '🪙', t: 'Münzwurf', d: 'Nicht um die Münze entscheiden zu lassen: Achte auf dein Gefühl beim Ergebnis. Erleichterung oder Enttäuschung zeigt, was du eigentlich willst.', f: [['feel', 'Mein Gefühl beim Ergebnis war …']] },
];
const REVIEW = [[14, '2 Wochen'], [30, '1 Monat'], [90, '3 Monate'], [180, '6 Monate'], [365, '1 Jahr']];
const decById = id => T.dec.find(d => d.id === id);
const opts = d => (d.opts || []).filter(Boolean);
function mxTotals(d) { const m = (d.tools && d.tools.mx) || {}, cr = (m.crit || []).filter(c => c.n); return opts(d).map((o, i) => ({ o, s: cr.reduce((a, c, j) => a + (+c.w || 0) * (+((m.sc || {})[i + ':' + j]) || 0), 0) })); }
function viewMatrix(d) {
  const m = d.tools.mx || (d.tools.mx = { crit: [{ n: '', w: 3 }, { n: '', w: 3 }], sc: {} }), os = opts(d);
  if (os.length < 2) return '<p class="small muted">Trag oben mindestens zwei Optionen ein.</p>';
  const tot = mxTotals(d), best = Math.max(...tot.map(x => x.s));
  return `<div style="overflow-x:auto"><table class="mx"><tr><th>Kriterium</th><th>Gewicht</th>${os.map(o => `<th>${esc(o)}</th>`).join('')}</tr>
    ${m.crit.map((c, j) => `<tr><td><input data-mx="n" data-j="${j}" value="${esc(c.n)}" placeholder="z. B. Geld" style="width:110px;text-align:left"></td><td><input type="number" min="1" max="5" data-mx="w" data-j="${j}" value="${esc(c.w)}"></td>${os.map((o, i) => `<td><input type="number" min="1" max="10" data-mx="s" data-j="${j}" data-i="${i}" value="${esc((m.sc || {})[i + ':' + j] || '')}"></td>`).join('')}</tr>`).join('')}
    <tr><td><b>Summe</b></td><td></td>${tot.map(x => `<td><b class="mono" style="color:${x.s === best && best > 0 ? 'var(--calm)' : 'inherit'}">${x.s}</b></td>`).join('')}</tr></table></div>
    <button class="btn sm ghost" data-act="mx-add">+ Kriterium</button>`;
}
function viewDecEdit(id) {
  const d = decById(id); if (!d) return viewDecisions(); const kind = (d.tools.typ || {}).kind;
  const rec = kind === 'dreh' ? ['typ', 'coin', 'ten'] : kind === 'einbahn' ? ['typ', 'mx', 'pm', 'wrap', 'out', 'reg'] : ['typ'];
  return `${topBar('entscheiden', 'Entscheidungen')}<div class="card"><span class="eyebrow">Entscheidung</span>
    <input class="input" data-f="title" value="${esc(d.title)}" placeholder="Worum geht es?" style="font-weight:700;font-size:18px">
    <label class="lab">Optionen, eine pro Zeile</label><textarea class="input" data-f="optsText" rows="3" placeholder="Option A&#10;Option B">${esc((d.opts || []).join('\n'))}</textarea></div>
  ${DTOOLS.map(tl => { const v = d.tools[tl.k] || {}, isRec = rec.includes(tl.k) && kind, filled = Object.values(v).some(x => x && typeof x === 'string' && x.trim());
    return `<details class="card" ${tl.k === 'typ' && !kind ? 'open' : ''} data-tool="${tl.k}"><summary>${tl.em} ${esc(tl.t)} ${filled ? '<span class="tag new">✓</span>' : isRec ? '<span class="tag challenge">empfohlen</span>' : ''}</summary>
      <p class="small muted">${esc(tl.d)}</p>
      ${tl.k === 'typ' ? `<div class="chips"><button class="chip" data-act="dec-kind" data-v="dreh" aria-pressed="${kind === 'dreh'}">🔁 Drehtür, umkehrbar</button><button class="chip" data-act="dec-kind" data-v="einbahn" aria-pressed="${kind === 'einbahn'}">⛔ Einbahntür, schwer umkehrbar</button></div>${kind ? `<p class="small">${kind === 'dreh' ? 'Nicht zerdenken: Entscheide in den nächsten Minuten, Münzwurf und 10/10/10 reichen. Wenn es schiefgeht, gehst du zurück.' : 'Nimm dir Zeit: Matrix, Pre-Mortem, WRAP und Außensicht lohnen sich hier. Schlaf mindestens eine Nacht darüber.'}</p>` : ''}` : ''}
      ${tl.k === 'mx' ? viewMatrix(d) : ''}
      ${tl.k === 'coin' ? `<button class="btn sm" data-act="coin">🪙 Werfen</button>${v.res ? `<p>Die Münze sagt: <b>${esc(v.res)}</b></p>` : ''}` : ''}
      ${tl.f.map(([f, q]) => `<label class="lab">${esc(q)}</label><textarea class="input" data-t="${tl.k}.${f}" rows="2">${esc(v[f] || '')}</textarea>`).join('')}</details>`; }).join('')}
  <div class="card"><h3>✅ Entscheiden</h3>
    ${opts(d).length ? `<div class="chips">${opts(d).map(o => `<button class="chip" data-act="dec-choose" data-v="${esc(o)}" aria-pressed="${d.choice === o}">${esc(o)}</button>`).join('')}</div>` : '<p class="small muted">Erst Optionen eintragen.</p>'}
    <label class="lab">Woran erkennst du später, dass es eine gute Wahl war?</label><textarea class="input" data-f="expect" rows="2" placeholder="z. B. Ich bin nach drei Monaten noch froh, gewechselt zu haben">${esc(d.expect || '')}</textarea>
    <label class="lab">Wie sicher bist du, dass das eintritt? <b class="mono" id="confv">${d.conf || 70} %</b></label><input type="range" class="range" min="50" max="99" data-f="conf" value="${d.conf || 70}">
    <label class="lab">Nachschauen in</label><div class="chips">${REVIEW.map(([n, l]) => `<button class="chip" data-act="dec-rev" data-v="${n}" aria-pressed="${(d.revIn || 90) === n}">${l}</button>`).join('')}</div>
    <button class="btn primary big" data-act="dec-save" ${d.choice ? '' : 'disabled'}>${d.decided ? 'Aktualisieren' : 'Entscheidung festhalten · +15 XP'}</button>
    <button class="link" data-act="dec-del" style="justify-self:start">Löschen</button></div>`;
}
const QUAD = { 'yy': ['🏆', 'Verdient', 'Guter Prozess, gutes Ergebnis.'], 'yn': ['🎲', 'Pech gehabt', 'Guter Prozess, schlechtes Ergebnis. Nicht das Ergebnis bestimmt, ob die Entscheidung gut war.'], 'ny': ['🍀', 'Glück gehabt', 'Gutes Ergebnis trotz schwachem Prozess. Nicht darauf verlassen.'], 'nn': ['📘', 'Lektion', 'Schwacher Prozess, schlechtes Ergebnis. Was machst du nächstes Mal anders?'] };
function viewDecReview(id) {
  const d = decById(id); if (!d) return viewDecisions(); const r = d.rv || {};
  return `${topBar('entscheiden', 'Entscheidungen')}<div class="card"><span class="eyebrow">Rückblick · entschieden am ${fmtDay(d.decided)}</span><h2>${esc(d.title)}</h2>
    <p>Gewählt: <b>${esc(d.choice)}</b> · damals ${d.conf} % sicher</p>${d.expect ? `<div class="note"><b>Erwartung:</b> ${esc(d.expect)}</div>` : ''}
    <label class="lab">Wie ist es ausgegangen?</label><textarea class="input" data-rv="text" rows="3">${esc(r.text || '')}</textarea>
    <label class="lab">Ist eingetreten, was du erwartet hast?</label><div class="chips">${[['1', 'Ja'], ['0.5', 'Teils'], ['0', 'Nein']].map(([v, l]) => `<button class="chip" data-act="rv" data-k="hit" data-v="${v}" aria-pressed="${String(r.hit) === v}">${l}</button>`).join('')}</div>
    <label class="lab">Mit dem Wissen von damals: War dein Vorgehen gut?</label><div class="chips">${[['y', 'Ja, gut überlegt'], ['n', 'Nein, zu schnell / zu einseitig']].map(([v, l]) => `<button class="chip" data-act="rv" data-k="proc" data-v="${v}" aria-pressed="${r.proc === v}">${l}</button>`).join('')}</div>
    ${r.proc && r.hit != null ? (() => { const q = QUAD[r.proc + (+r.hit >= 0.5 ? 'y' : 'n')]; return `<div class="fact"><b>${q[0]} ${q[1]}</b><span>${q[2]}</span></div>`; })() : ''}
    <button class="btn primary big" data-act="rv-save" ${r.proc && r.hit != null ? '' : 'disabled'}>${d.reviewed ? 'Aktualisieren' : 'Rückblick speichern · +10 XP'}</button></div>`;
}
function calib() { const rs = T.dec.filter(d => d.reviewed && d.rv && d.rv.hit != null); if (rs.length < 2) return null; return { n: rs.length, conf: mean(rs.map(d => d.conf)), hit: mean(rs.map(d => +d.rv.hit)) * 100, brier: mean(rs.map(d => (d.conf / 100 - +d.rv.hit) ** 2)) }; }
function viewDecisions() {
  const due = T.dec.filter(d => d.decided && !d.reviewed && d.due <= today()), open = T.dec.filter(d => !d.decided), wait = T.dec.filter(d => d.decided && !d.reviewed && d.due > today()), done = T.dec.filter(d => d.reviewed), c = calib();
  const row = (d, act, sub) => `<button class="card hub" data-act="${act}" data-v="${d.id}"><div class="row spread"><b>${esc(d.title || 'Ohne Titel')}</b><span class="small muted">${sub}</span></div></button>`;
  return `${topBar()}<div class="stack"><span class="eyebrow">Werkzeug</span><h1>🧭 Entscheiden</h1><p class="muted">Zehn bewährte Denkwerkzeuge und ein Entscheidungstagebuch. Wer seine Entscheidungen festhält und später ehrlich draufschaut, lernt Prozess und Glück zu trennen.</p></div>
  <button class="btn primary big" data-act="dec-new">+ Neue Entscheidung</button>
  ${due.length ? `<h3>⏰ Rückblick fällig</h3>${due.map(d => row(d, 'dec-review', 'seit ' + fmtDay(d.due))).join('')}` : ''}
  ${open.length ? `<h3>In Arbeit</h3>${open.map(d => row(d, 'dec-open', fmtDay(d.created))).join('')}` : ''}
  ${wait.length ? `<h3>Entschieden</h3>${wait.map(d => row(d, 'dec-open', '→ ' + esc(d.choice) + ' · Rückblick ' + fmtDay(d.due))).join('')}` : ''}
  ${done.length ? `<h3>Abgeschlossen</h3>${done.map(d => row(d, 'dec-review', QUAD[d.rv.proc + (+d.rv.hit >= 0.5 ? 'y' : 'n')].slice(0, 2).join(' '))).join('')}` : ''}
  ${c ? `<div class="card"><h3>🎯 Deine Kalibrierung</h3><p>Du warst im Schnitt zu <b>${Math.round(c.conf)} %</b> sicher, eingetreten ist es zu <b>${Math.round(c.hit)} %</b> (${c.n} Rückblicke). ${c.conf - c.hit > 10 ? 'Du überschätzt dich etwas: Plane mehr Puffer ein.' : c.hit - c.conf > 10 ? 'Du unterschätzt dich: Du darfst dir mehr zutrauen.' : 'Gut kalibriert.'}</p><span class="small muted mono">Brier-Score ${c.brier.toFixed(2)} (0 = perfekt, 0,25 = Raten)</span></div>` : ''}
  <details class="card"><summary>Die Werkzeuge im Überblick</summary><div class="stack small">${DTOOLS.map(tl => `<p><b>${tl.em} ${esc(tl.t)}:</b> ${esc(tl.d)}</p>`).join('')}<p class="muted">Rückblick nach Annie Duke (Thinking in Bets): Ein gutes Ergebnis beweist keine gute Entscheidung und umgekehrt.</p></div></details>`;
}

/* ================= Social ================= */
// real-life missions cost real courage, so they pay far more than a quiz round: 360 XP at level 1, +90 per level
const socXP = L => 360 + 90 * (L - 1);
const MISSIONS = [
  ['Blickkontakt und ein kurzes Lächeln bei drei Fremden', 'Jemanden nach der Uhrzeit oder dem Weg fragen', 'An der Kasse „Danke“ plus einen Satz mehr sagen', 'Den Busfahrer oder die Person am Empfang grüßen und „Schönen Tag noch“ sagen'],
  ['Der Bedienung oder dem Barista eine echte Frage stellen („Was empfehlen Sie?“)', 'Jemandem ein Kompliment für etwas machen, das er ausgewählt hat (Jacke, Buch, Hund)', 'In einer Schlange einen Satz zur gemeinsamen Situation sagen', 'Im Supermarkt jemanden um einen Tipp bitten („Kennen Sie die?“)'],
  ['Ein 2-Minuten-Gespräch mit einer fremden Person (Bahn, Wartezimmer, Mensa)', 'In einem Gespräch zwei Folgefragen stellen, bevor du von dir erzählst', 'Beim Volleyball jemanden, den du kaum kennst, nach dem Namen und einer Sache fragen', 'In der Kaffeeküche jemanden aus einer anderen Gruppe ansprechen'],
  ['Ein Gespräch von über 5 Minuten mit einer neuen Person führen', 'Dich einer kleinen Gruppe anschließen, die schon redet', 'Jemandem etwas Persönliches von dir erzählen (Reveal) und schauen, was zurückkommt', 'Ein Gespräch bewusst freundlich beenden („Schön, dich kennenzulernen, ich hol mir noch was“)'],
  ['Mit einer neuen Person Kontakt austauschen', 'Jemanden zu etwas Konkretem einladen (Kaffee, Training, Weihnachtsmarkt)', 'Auf einer Veranstaltung drei neue Leute kennenlernen', 'Ein Gespräch auf Spanisch mit einer fremden Person beginnen'],
];
const LVL_NAME = ['Aufwärmen', 'Kleiner Satz', 'Kurzes Gespräch', 'Längeres Gespräch', 'Verbindung'];
const SOC_INFO = `<details class="card"><summary>Warum es sich lohnt, was die Forschung sagt</summary><div class="stack small">
  <p><b>Wir unterschätzen, wie angenehm es wird.</b> Pendler, die mit Fremden reden sollten, fanden die Fahrt angenehmer als erwartet und als die, die für sich blieben (Epley &amp; Schroeder, 2014).</p>
  <p><b>Wir unterschätzen, wie sehr wir gemocht werden.</b> Nach einem Gespräch mit einer fremden Person glauben Menschen meist, das Gegenüber möge sie weniger, als es tatsächlich tut („Liking Gap“, Boothby et al., 2018).</p>
  <p><b>Folgefragen machen sympathisch.</b> Wer mehr Fragen stellt, vor allem Nachfragen zu dem, was das Gegenüber gerade gesagt hat, wird als sympathischer wahrgenommen (Huang et al., 2017).</p>
  <p><b>Üben senkt die Hürde.</b> Eine Woche mit kleinen Gesprächsaufgaben senkte die Angst vor Gesprächen mit Fremden. Die Teilnehmenden lagen auch danach mit ihren Erwartungen zu pessimistisch (Sandstrom, Boothby &amp; Cooney, 2022). Genau darum fragt Echo vorher und nachher.</p></div></details>
  <details class="card"><summary>Werkzeugkasten für Smalltalk</summary><div class="stack small">
  <p><b>Einstieg über die gemeinsame Situation:</b> Ort, Anlass, Wetter, Warteschlange. „Ist das hier immer so voll?“ ist besser als ein auswendig gelernter Spruch.</p>
  <p><b>ARE (Carol Fleming):</b> Anker (etwas Gemeinsames ansprechen), Reveal (einen kleinen Satz über dich), Encourage (eine offene Frage).</p>
  <p><b>FORD-Themen:</b> Family, Occupation, Recreation, Dreams. Für Ideen, wenn das Gespräch stockt.</p>
  <p><b>Folgefragen statt Themenwechsel:</b> Ein Detail aus der Antwort aufgreifen („Wie bist du dazu gekommen?“). Offene Fragen beginnen mit wie, was, warum.</p>
  <p><b>Namen:</b> Gleich einmal wiederholen („Freut mich, Lena“). Vergessen ist normal, nachfragen auch.</p>
  <p><b>Abschluss:</b> Freundlich und klar: „War schön, mit dir zu reden. Ich schau mal zu den anderen.“</p></div></details>`;
const SCENES = [
  ['wm', '🎄', 'Weihnachtsmarkt', 'Am Glühweinstand in Mannheim steht jemand allein neben dir und wartet auf die Tasse.'],
  ['bahn', '🚆', 'Im Zug', 'ICE nach Mannheim. Die Person neben dir liest ein Buch über Psychologie und seufzt gerade über die Verspätung.'],
  ['kueche', '☕', 'Kaffeeküche am Institut', 'Jemand aus einer anderen Arbeitsgruppe wartet mit dir darauf, dass die Kaffeemaschine fertig ist.'],
  ['volley', '🏐', 'Nach dem Volleyball', 'Nach dem Training packt eine Person ihre Sachen, die heute zum ersten Mal da war.'],
  ['party', '🎉', 'WG-Party', 'Du kennst nur den Gastgeber. Am Snacktisch steht jemand und überlegt, welchen Dip er nimmt.'],
  ['konf', '🎓', 'Kaffeepause auf einer Tagung', 'Psychiatrie-Tagung. Neben dir steht jemand mit dem Namensschild einer anderen Uni.'],
  ['gym', '🏋️', 'Fitnessstudio', 'Ihr wartet beide auf dieselbe Bank.'],
  ['es', '🇨🇴', 'Spanisch-Stammtisch', 'Beim Intercambio sitzt du neben einer Person aus Medellín. Sie spricht Spanisch mit dir.'],
];
const MOODS = ['offen und gesprächig', 'freundlich, aber erst etwas zurückhaltend', 'etwas in Eile, aber höflich', 'schüchtern, taut bei guten Fragen auf'];
const socLog = () => T.soc.log || (T.soc.log = []);
function socMission() { const L = T.soc.lvl || 1, list = MISSIONS[L - 1], i = (T.soc.pick || 0) % list.length; return { L, i, m: list[i] }; }
function viewSocial() {
  const log = socLog(), done = log.filter(x => x.post != null), L = T.soc.lvl || 1, onL = done.filter(x => x.lvl === L).length, cur = T.soc.cur, mi = socMission();
  const gap = done.length ? mean(done.map(x => x.post - x.pre)) : null;
  return `${topBar()}<div class="stack"><span class="eyebrow">Werkzeug</span><h1>💬 Smalltalk & Fremde</h1><p class="muted">Kleine Missionen im echten Leben, Stufe für Stufe, dazu Gesprächsproben mit KI.</p></div>
  <div class="card"><div class="row spread"><span class="eyebrow">Stufe ${L} · ${LVL_NAME[L - 1]}</span><span class="small muted">${onL} / 3 bis zur nächsten Stufe</span></div>
    <div class="lvlrow">${[1, 2, 3, 4, 5].map(n => `<i class="${n < L ? 'on' : n === L ? 'cur' : ''}"></i>`).join('')}</div>
    ${cur ? `<span class="eyebrow">Deine Mission läuft</span><p class="q">${esc(cur.m)}</p><span class="small muted">Vorher erwartet: ${cur.pre} / 10</span>
      <label class="lab">Wie angenehm war es wirklich? <b class="mono" id="postv">${T.soc.postDraft || 6}</b></label><input type="range" class="range" min="1" max="10" id="socPost" value="${T.soc.postDraft || 6}">
      <textarea class="input" id="socNote" rows="2" placeholder="Was ist passiert? (optional)"></textarea>
      <div class="row wrap"><button class="btn primary" data-act="soc-done">Geschafft · +${socXP(T.soc.lvl || 1)} XP</button><button class="btn ghost" data-act="soc-skip">Hat heute nicht geklappt</button></div>`
    : `<span class="eyebrow">Mission für heute</span><p class="q">${esc(mi.m)}</p>
      <label class="lab">Wie angenehm wird es wohl? <b class="mono" id="prev">${T.soc.preDraft || 5}</b></label><input type="range" class="range" min="1" max="10" id="socPre" value="${T.soc.preDraft || 5}">
      <div class="row wrap"><button class="btn primary" data-act="soc-go">Mission annehmen</button><button class="btn ghost" data-act="soc-other">Andere Mission</button>${L > 1 ? '<button class="link" data-act="soc-down">Stufe runter</button>' : ''}</div>`}</div>
  ${done.length ? `<div class="card"><h3>📈 Erwartet vs. erlebt</h3><div class="stats"><div class="stat"><span class="small muted">Missionen</span><b class="mono">${done.length}</b></div><div class="stat"><span class="small muted">Ø vorher</span><b class="mono">${mean(done.map(x => x.pre)).toFixed(1)}</b></div><div class="stat"><span class="small muted">Ø nachher</span><b class="mono">${mean(done.map(x => x.post)).toFixed(1)}</b></div></div>
    <p class="small">${gap > 0.3 ? `Es war im Schnitt <b>${gap.toFixed(1)} Punkte angenehmer</b>, als du erwartet hast. Dein Kopf ist zu pessimistisch, genau wie in den Studien.` : gap < -0.3 ? 'Es war im Schnitt etwas unangenehmer als erwartet. Bleib auf dieser Stufe, bis es sich leichter anfühlt.' : 'Deine Erwartungen treffen ziemlich genau.'}</p>
    <details><summary class="small muted" style="cursor:pointer">Verlauf</summary><div class="stack small" style="margin-top:8px">${done.slice().reverse().slice(0, 20).map(x => `<span>${fmtDay(x.date)} · ${esc(x.m)} · ${x.pre} → <b>${x.post}</b>${x.note ? ' · ' + esc(x.note) : ''}</span>`).join('')}</div></details></div>` : ''}
  <h3>🎭 Gesprächsprobe mit KI</h3><p class="small muted">Du sprichst eine fremde Person an. Sie reagiert realistisch: Bei Ja-Nein-Fragen bleibt sie knapp, bei guten Nachfragen öffnet sie sich. Am Ende bekommst du Feedback.</p>
  ${hasAI() ? `<div class="grid">${SCENES.map(([k, em, t]) => `<button class="card hub" data-act="rp-start" data-v="${k}" style="padding:12px"><span style="font-size:22px">${em}</span><b class="small">${esc(t)}</b></button>`).join('')}</div>` : '<p class="note">Dafür braucht Echo deinen Anthropic-Schlüssel (Echo → Einstellungen).</p>'}
  ${T.rp.filter(r => r.fb).length ? `<details class="card"><summary>Frühere Proben</summary><div class="stack small">${T.rp.filter(r => r.fb).slice().reverse().slice(0, 15).map(r => `<button class="link" data-act="go" data-v="rp-${r.id}" style="text-align:left;white-space:normal">${fmtDay(r.date)} · ${esc((SCENES.find(s => s[0] === r.sc) || [])[2] || '')} · ${r.fb.score || '?'} / 10</button>`).join('')}</div></details>` : ''}
  ${SOC_INFO}`;
}
function rpSystem(r) {
  const sc = SCENES.find(s => s[0] === r.sc), es = r.sc === 'es';
  return `You play a stranger in a short real-life scene so a German student can practise small talk and talking to strangers.
Scene: ${sc[3]}
Your character: invent a believable first name, age (20-60), job and one or two interests that fit the scene. Mood: ${r.mood}.
Rules:
- Speak ${es ? 'Spanish (Colombian, from Medellín) at a B1 level, clear and friendly' : 'casual, natural German (du or Sie as fits the scene and the student)'}. Reply in 1-3 short sentences, like a real person, never a monologue.
- React realistically: if the student only asks yes/no questions, interrogates, or talks only about themselves, stay brief. If they ask good follow-up questions or share something about themselves, open up and occasionally ask something back.
- Do not carry the conversation for them and never coach or comment on their technique during the scene. Stay in role, never mention being an AI.
- If the student wraps up politely, end warmly in one line.`;
}
function viewRP(id) {
  const r = T.rp.find(x => x.id === id); if (!r) return viewSocial(); const sc = SCENES.find(s => s[0] === r.sc), you = r.msgs.filter(m => m.role === 'user').length;
  return `${topBar('sozial', 'Smalltalk')}<div class="card"><span class="eyebrow">${sc[1]} ${esc(sc[2])}</span><p>${esc(sc[3])}</p>${r.msgs.length ? '' : `<p class="small muted">${r.sc === 'es' ? 'Sprich die Person auf Spanisch an.' : 'Du machst den ersten Schritt. Was sagst du?'}</p>`}</div>
  <div class="chat">${r.msgs.map(m => `<div class="bubble ${m.role === 'user' ? 'u' : 'a'}">${esc(m.content)}</div>`).join('')}${RP_BUSY ? '<div class="status"><span class="spin"></span>…</div>' : ''}</div>
  ${r.fb ? `<div class="card"><h3>🧾 Feedback · ${r.fb.score || '?'} / 10</h3>
      <div class="stats"><div class="stat"><span class="small muted">Fragen</span><b class="mono">${r.fb.q ?? '–'}</b></div><div class="stat"><span class="small muted">Folgefragen</span><b class="mono">${r.fb.fu ?? '–'}</b></div><div class="stat"><span class="small muted">Dein Redeanteil</span><b class="mono">${r.fb.share != null ? r.fb.share + ' %' : '–'}</b></div></div>
      ${(r.fb.good || []).length ? `<p><b>Gut:</b> ${r.fb.good.map(esc).join(' · ')}</p>` : ''}${r.fb.tip ? `<div class="fact"><b>Tipp</b><span>${esc(r.fb.tip)}</span></div>` : ''}${r.fb.line ? `<p class="small">Hätte auch gepasst: <i>„${esc(r.fb.line)}“</i></p>` : ''}${r.fb.who ? `<p class="small muted">Die Person: ${esc(r.fb.who)}</p>` : ''}
      <div class="row wrap"><button class="btn primary" data-act="rp-start" data-v="${r.sc}">Gleiche Szene nochmal</button><button class="btn" data-act="go" data-v="sozial">Zurück</button></div></div>`
  : `<div class="card"><textarea class="input" id="rpIn" rows="2" placeholder="${r.sc === 'es' ? 'Hola …' : 'Was sagst du?'}" ${RP_BUSY ? 'disabled' : ''}></textarea>
      <div class="row wrap">${(window.SpeechRecognition || window.webkitSpeechRecognition) ? `<button class="btn sm" data-act="rp-mic">🎤 Sprechen</button>` : ''}<span class="grow"></span><button class="btn sm ghost" data-act="rp-end" ${you < 3 || RP_BUSY ? 'disabled' : ''}>Gespräch beenden</button><button class="btn sm primary" data-act="rp-send" ${RP_BUSY ? 'disabled' : ''}>Senden</button></div>
      ${you < 3 ? `<span class="small muted">Feedback ab drei eigenen Beiträgen (${you} / 3)</span>` : ''}</div>`}`;
}
let RP_BUSY = false;
async function rpSend(r, text) {
  r.msgs.push({ role: 'user', content: text }); RP_BUSY = true; saveT(); render();
  try { r.msgs.push({ role: 'assistant', content: await askAI(rpSystem(r), r.msgs, 300) }); }
  catch (e) { r.msgs.pop(); toast('KI-Fehler: ' + e.message); const el = document.getElementById('rpIn'); RP_BUSY = false; render(); if (el) document.getElementById('rpIn').value = text; return; }
  RP_BUSY = false; saveT(); render(); document.getElementById('rpIn')?.focus();
}
async function rpEnd(r) {
  RP_BUSY = true; render();
  const tr = r.msgs.map(m => (m.role === 'user' ? 'STUDENT: ' : 'STRANGER: ') + m.content).join('\n');
  const uw = r.msgs.filter(m => m.role === 'user').reduce((a, m) => a + m.content.split(/\s+/).length, 0), aw = r.msgs.filter(m => m.role === 'assistant').reduce((a, m) => a + m.content.split(/\s+/).length, 0);
  try {
    const j = parseJSONLoose(await askAI(`You give feedback on a small-talk practice between a German student and a stranger (role-play). Be honest, warm and specific; praise what worked. Return ONLY JSON in German: {"score": 1-10 overall, "questions": number of questions the student asked, "followups": number of those that picked up something the stranger had just said, "good": ["1-3 concrete things that worked, quoting the student briefly"], "tip": "the single most useful improvement for next time, concrete", "line": "one sentence the student could have said at a key moment", "who": "who the stranger was in one short sentence (name, job, interest the student could have discovered)"}`, [{ role: 'user', content: tr }], 600));
    r.fb = { score: +j.score || null, q: j.questions, fu: j.followups, good: (j.good || []).map(String).slice(0, 3), tip: String(j.tip || ''), line: String(j.line || ''), who: String(j.who || ''), share: Math.round(uw / Math.max(1, uw + aw) * 100) };
    gainXP('smalltalk', 15); toast('Gesprächsprobe fertig · +15 XP');
  } catch (e) { toast('Feedback fehlgeschlagen: ' + e.message); }
  RP_BUSY = false; saveT(); render();
}

/* ================= Merk-Boost: arousal right after learning, with a self-experiment ================= */
const BOOSTS = {
  schreck: ['⚡', 'Überraschungs-Schreck', 'Du schreibst aus dem Kopf auf, was du gerade gelernt hast, und irgendwann mitten im Schreiben passiert etwas: eines von acht Szenarien. Wann und welches, weißt du vorher nicht.'],
  move: ['🏃', '90 Sekunden Vollgas', 'Burpees, Hampelmänner, Treppen hoch: 90 Sekunden so intensiv, wie es sicher geht. Der am besten untersuchte Weg.'],
  kalt: ['🧊', 'Kälte-Reiz', 'Hände bis zum Handgelenk 1 bis 3 Minuten in sehr kaltes Wasser (mit Eiswürfeln). So wird Stress in Studien ausgelöst. Nicht bei Herzproblemen, Raynaud oder offenen Wunden.'],
};
const BOOST_INFO = `<details class="card"><summary>Was dahintersteckt, und wie gut das belegt ist</summary><div class="stack small">
  <p><b>Der Mechanismus ist gut belegt:</b> Aufregung kurz <i>nach</i> dem Lernen setzt Noradrenalin frei, die Amygdala verstärkt dann die Festigung frischer Erinnerungen (McGaugh, Übersichten 2004 und 2013). Darum bleiben aufregende Erlebnisse besonders gut hängen.</p>
  <p><b>Beim Menschen gezeigt:</b> Ein aufwühlendes Video 30 bis 45 Minuten nach dem Lernen verbesserte das Behalten von Wörtern eine Woche später (Nielson &amp; Powless, 2007). Hände in Eiswasser nach dem Lernen verbesserten die Erinnerung, aber nur an emotionale Bilder, nicht an neutrale (Cahill, Gorski &amp; Le, 2003). 6 Minuten Radfahren nach dem Lernen halfen älteren Menschen beim Erinnern (Segal, Cotman &amp; Cahill, 2012). Sport 4 Stunden nach dem Lernen verbesserte das Behalten nach zwei Tagen (van Dongen et al., 2016).</p>
  <p><b>Die ehrliche Grenze:</b> Die Effekte sind klein und schwanken. Bei neutralem Stoff wie Karteikarten sind sie unsicher. Einen kurzen Schreck allein hat meines Wissens niemand direkt getestet, und Schrecks verlieren schnell an Wirkung, wenn man sie erwartet. Echo variiert deshalb Zeitpunkt und Art. Ob es dir etwas bringt, zeigt der Selbstversuch unten.</p>
  <p><b>Was sicher hilft:</b> Nach dem Boost 10 Minuten nichts Neues aufnehmen, also kein Handy und kein Video. Ruhiges Wachsein nach dem Lernen verbessert das Behalten (Dewar et al., 2012). Und abrufen statt nochmal lesen.</p></div></details>`;
const boosts = () => T.boost || (T.boost = []);
let BO = null;
function viewBoost() {
  const L = boosts(), pend = L.filter(x => !x.rec && Date.now() - x.t > 20 * 3600e3 && Date.now() - x.t < 7 * 864e5), done = L.filter(x => x.rec != null);
  const g = k => done.filter(x => (k === 'ctl') === (x.type === 'ctl')), mb = mean(g('b').map(x => x.rec)), mc = mean(g('ctl').map(x => x.rec)), last = T.boostTopic || '';
  return `${topBar()}<div class="stack"><span class="eyebrow">Werkzeug</span><h1>⚡ Merk-Boost</h1><p class="muted">Direkt nach dem Lernen kurz den Puls hochjagen, damit das Gelernte besser hängen bleibt. Nach Anki, Vokabeln oder einer Lernsitzung.</p></div>
  ${pend.length ? `<div class="card"><span class="eyebrow">⏰ Gedächtnis-Check</span>${pend.map(x => `<div class="stack"><p>Wie viel weißt du noch von <b>${esc(x.topic || 'deiner Lernsitzung')}</b> (${fmtDay(x.date)})? Erst versuchen abzurufen, dann ehrlich schätzen.</p><div class="chips">${[0, 2, 4, 6, 8, 10].map(n => `<button class="chip" data-act="boost-rec" data-v="${x.id}" data-n="${n}">${n}</button>`).join('')}</div></div>`).join('')}<span class="small muted">0 = nichts mehr, 10 = alles. Wenn du in Anki lernst, nimm deine Trefferquote der Wiederholungen.</span></div>` : ''}
  <div class="card"><label class="lab">Was hast du gerade gelernt?</label><input class="input" id="boostTopic" value="${esc(last)}" placeholder="z. B. 40 Anki-Karten Ernährungsmedizin">
    ${Object.entries(BOOSTS).map(([k, [em, t, d]]) => `<button class="card hub" data-act="boost-go" data-v="${k}" style="padding:14px;background:var(--surface-2);box-shadow:none"><div class="row"><span style="font-size:24px">${em}</span><div class="stack" style="gap:2px"><b>${t}</b><span class="small muted">${d}</span></div></div></button>`).join('')}
    <button class="btn" data-act="boost-coin">🎲 Selbstversuch: Zufall entscheidet, Boost oder Kontrolle</button>
    <span class="small muted">Für einen fairen Vergleich lost Echo aus. Bei „Kontrolle“ lernst du ganz normal ohne Boost weiter. Am nächsten Tag fragt Echo bei beiden, wie viel noch sitzt.</span></div>
  ${done.length ? `<div class="card"><h3>🧪 Dein Selbstversuch</h3><div class="stats"><div class="stat"><span class="small muted">Mit Boost</span><b class="mono">${g('b').length ? mb.toFixed(1) : '–'}</b><span class="small muted">${g('b').length}×</span></div><div class="stat"><span class="small muted">Ohne</span><b class="mono">${g('ctl').length ? mc.toFixed(1) : '–'}</b><span class="small muted">${g('ctl').length}×</span></div><div class="stat"><span class="small muted">Unterschied</span><b class="mono">${g('b').length && g('ctl').length ? (mb - mc > 0 ? '+' : '') + (mb - mc).toFixed(1) : '–'}</b></div></div>
    <p class="small">${g('b').length >= 5 && g('ctl').length >= 5 ? (Math.abs(mb - mc) < 0.8 ? 'Bisher kein klarer Unterschied. Bei so wenigen Durchgängen ist das gut möglich, auch wenn ein kleiner Effekt da ist.' : mb > mc ? 'Mit Boost erinnerst du dich im Schnitt besser. Bei so wenigen Durchgängen ist das noch ein Hinweis, kein Beweis.' : 'Ohne Boost lief es bisher besser. Vielleicht stört dich der Boost, oder es ist Zufall.') : 'Ab je 5 Durchgängen mit und ohne Boost lohnt ein erster Blick. Gleiche Lernmenge und Tageszeit machen den Vergleich fairer.'}</p></div>` : ''}
  <details class="card"><summary>Szenarien einzeln ansehen (nimmt die Überraschung)</summary><div class="stack small"><p class="muted">Im echten Durchgang lost Echo aus und meidet die letzten vier. Hier kannst du jedes sofort abspielen, mit Ton.</p><div class="chips">${SCARE.list.map(k => `<button class="chip" data-act="boost-demo" data-v="${k}">${SCARE.names[k]}</button>`).join('')}</div></div></details>
  ${BOOST_INFO}`;
}
// ---- sounds: short, varied, loud enough to surprise but capped (never at full volume on headphones)
let BAC = null;
function boom(kind) {
  try {
    BAC = BAC || new (window.AudioContext || window.webkitAudioContext)(); const ac = BAC, t = ac.currentTime, out = ac.createGain(); out.gain.value = 0.55; out.connect(ac.destination);
    const noise = (dur, f, q) => { const n = ac.createBufferSource(), buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2); n.buffer = buf; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; n.connect(bp); bp.connect(out); n.start(t); };
    const tone = (f1, f2, dur, type) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur); };
    if (kind === 0) { noise(0.7, 900, 0.4); tone(120, 40, 0.5, 'sine'); }          // crash
    else if (kind === 1) { tone(440, 445, 0.9, 'square'); tone(554, 560, 0.9, 'square'); } // horn
    else if (kind === 2) { noise(0.25, 2500, 1); tone(1800, 300, 0.35, 'sawtooth'); }     // snap
    else { tone(900, 1400, 0.15, 'square'); setTimeout(() => boom(2), 160); }              // double alarm
  } catch { /* no audio */ }
}
function boostOverlay(html) { let el = document.getElementById('boostov'); if (!el) { document.body.insertAdjacentHTML('beforeend', '<div class="iat" id="boostov" style="background:#0F1211;color:#E8ECE7;grid-template-rows:1fr"></div>'); el = document.getElementById('boostov'); } el.innerHTML = html; }
function boostEnd(log) {
  clearTimeout(BO && BO.t); clearInterval(BO && BO.iv); SCARE.cancel(); document.getElementById('boostov')?.remove();
  if (log) { boosts().push({ id: uid(), date: today(), t: Date.now(), type: BO.kind, sc: BO.sc, topic: BO.topic, recall: (BO.recall || '').slice(0, 2000) }); if (boosts().length > 300) T.boost = boosts().slice(-300); saveT(); if (BO.kind !== 'ctl') gainXP('boost', 5); }
  BO = null; render();
}
const AFTER = `<div class="instr"><span style="font-size:48px">✓</span><h2>Geschafft</h2><p>Jetzt <b>10 Minuten nichts Neues</b>: kein Handy, kein Video. Lieber aus dem Fenster schauen, aufräumen oder kurz gehen. So kann sich das Gelernte setzen. Noch stärker festigt ein Lern-Nap (Werkzeuge → Ruhen).</p><p class="small" style="opacity:.7">Morgen fragt Echo, wie viel noch sitzt.</p><button class="btn primary big" data-act="boost-fin">Fertig</button></div>`;
function boostStart(kind) {
  BO = { kind, topic: (document.getElementById('boostTopic') || {}).value || T.boostTopic || '' }; T.boostTopic = BO.topic; saveT();
  if (kind === 'ctl') { boostOverlay(`<div class="instr"><span style="font-size:48px">🎲</span><h2>Heute: Kontrolle</h2><p>Kein Boost diesmal. Mach einfach normal weiter. Morgen vergleicht Echo, wie viel ohne Boost hängen geblieben ist.</p><button class="btn primary big" data-act="boost-fin">Okay</button></div>`); return; }
  if (kind === 'schreck') {
    try { BAC = BAC || new (window.AudioContext || window.webkitAudioContext)(); BAC.resume(); } catch { /* no audio */ } // unlock audio inside the tap
    SCARE.unlock();
    if (!T.boostSeen) { T.boostSeen = true; saveT(); boostOverlay(`<div class="instr"><span style="font-size:48px">🔊</span><h2>Einmal vorab</h2><p>Stell den <b>Handylautsprecher laut</b>. Mit Kopfhörern höchstens mittlere Lautstärke, das Geräusch ist bewusst hart.</p><p class="small" style="opacity:.7">Ab dem nächsten Mal geht es ohne diesen Hinweis direkt los.</p><button class="btn primary big" data-act="boost-go" data-v="schreck">Verstanden, los</button><button class="link" data-act="boost-cancel" style="color:#95A09A">Abbrechen</button></div>`); return; }
    const wait = 4000 + Math.min(41000, -Math.log(1 - Math.random()) * 12000); // 4–45 s, about 15 s on average; exponential, so waiting longer never makes it more predictable
    boostOverlay(`<div class="instr" style="text-align:left"><span class="eyebrow" style="color:#95A09A">Abruf</span><h2>Was weißt du noch?</h2><p class="small" style="opacity:.75">Schreib aus dem Kopf auf, was du gerade gelernt hast${BO.topic ? ` (${esc(BO.topic)})` : ''}: Begriffe, Zusammenhänge, alles, was dir einfällt.</p><textarea class="input" id="boostRecall" rows="7" placeholder="…"></textarea><button class="link" data-act="boost-cancel" style="color:#95A09A">Abbrechen</button></div>`);
    setTimeout(() => document.getElementById('boostRecall')?.focus(), 50);
    BO.t = setTimeout(() => {
      BO.recall = (document.getElementById('boostRecall') || {}).value || '';
      const el = document.getElementById('boostov'); if (!el) return;
      BO.sc = SCARE.choose(T.boostHist); T.boostHist = [...(T.boostHist || []), BO.sc].slice(-4); saveT();
      SCARE.run(BO.sc, el, () => { if (!BO) return; el.style.background = '#0F1211'; el.style.color = '#E8ECE7'; el.innerHTML = AFTER; });
    }, wait);
    return;
  }
  const total = kind === 'move' ? 90 : 120; let left = total;
  const paint = () => boostOverlay(`<div class="instr"><span style="font-size:56px">${BOOSTS[kind][0]}</span><h2>${kind === 'move' ? 'Vollgas!' : 'Hände ins kalte Wasser'}</h2><div class="big-num mono">${left}</div><p class="small" style="opacity:.7">${kind === 'move' ? 'Burpees, Hampelmänner, Treppen. Alle 30 Sekunden ein Piep.' : '1 bis 3 Minuten. Brennt es zu stark, raus damit, das zählt trotzdem.'}</p><button class="link" data-act="boost-early" style="color:#95A09A">${kind === 'kalt' ? 'Jetzt raus (fertig)' : 'Abbrechen'}</button></div>`);
  paint(); try { BAC = BAC || new (window.AudioContext || window.webkitAudioContext)(); BAC.resume(); } catch { /* no audio */ }
  BO.iv = setInterval(() => { left--; if (left % 30 === 0 && left > 0) boom(2); if (left <= 0) { clearInterval(BO.iv); boom(1); boostOverlay(AFTER); return; } paint(); }, 1000);
}

/* ================= Erlebnisliste: things to do around Mannheim ================= */
const BUCKET_SEED = [
  ['🏒', 'Adler Mannheim live in der SAP Arena', 'Derby Fr 18.12. vs. Frankfurt oder Mi 09.12. vs. München', 'Stehplatz ermäßigt 14,40 € (Studi-Ausweis zeigen), Sitz Kat. 4 ermäßigt 22 €. Abendkasse 90 Min. vor Spielbeginn, wenn nicht ausverkauft.'],
  ['⚽', 'Waldhof Mannheim gegen Hansa Rostock', '29.–31.01.2027 (genauer Tag folgt)', 'Vorher daheim: Sa 28.11. 14 Uhr vs. VfB Stuttgart II, 11.–13.12. vs. Jahn Regensburg.'],
  ['⚽', 'Hoffenheim gegen Sturm Graz (Europa League)', 'Do 26.11., 21 Uhr, Sinsheim', 'Das Ticket gilt als Fahrkarte im VRN. Rückfahrt vorher in der DB-App prüfen.'],
  ['⚽', 'Hoffenheim gegen Bayern: Ticket ergattern', '11.–13.12. (Anstoß folgt)', 'Offizielle TSG-Ticketbörse täglich checken, kurz vor dem Spiel kommen oft Karten zurück. Keine überteuerten Drittanbieter.'],
  ['♨️', 'Therme', 'an einem Werktag (günstiger)', 'Miramar Weinheim: Therme + Bad 38,90 €, mit Sauna 43,90 €, am nächsten. Badewelt Sinsheim (Palmen, groß): 4 Std. ab 23 €, Tag ab 39 €, nur mit Online-Ticket für ein festes Datum.'],
  ['🧗', 'Heidelberg: Himmelsleiter zum Königstuhl', '', 'Rund 1.200 Stufen, runter mit der Bergbahn. Dazu Thingstätte und Heiligenberg, und unterwegs Geocaches oder Adventure Labs mitnehmen.'],
  ['🇫🇷', 'Frankreich: Wissembourg', 'ein Samstag', 'Mit dem Deutschlandticket bis Wissembourg. Elsass-Städtchen, im Advent mit Weihnachtsmarkt.'],
  ['🎄', 'Straßburg im Advent', 'ein Wochenende', 'Bis Kehl mit dem Deutschlandticket. Für das letzte Stück ein eigenes Ticket oder am Wochenende das Ticketplus Alsace.'],
  ['🏙️', 'Frankfurt', '', 'Main Tower, Kleinmarkthalle, Apfelwein in Sachsenhausen, Senckenberg-Museum, Dialogmuseum (im Dunkeln), oder ein Löwen-Frankfurt-Spiel.'],
  ['👨‍👩‍👧', 'Speyer mit der Familie: Technik-Museum + Dom', '', 'Raumfähre Buran, Flugzeuge, U-Boot.'],
];
const BUCKET_V2 = [ // after Julian's answers: alone, likes doing sport and hiking, comedy under 30 €, in Mannheim until 19.12.
  ['🧗', 'Bouldern im Studio Bloc Mannheim', '', 'Allein ideal: Routen nach Farbe, Leute kommen von selbst ins Gespräch.'],
  ['🥾', 'Felsenmeer im Odenwald', 'trockener Tag', 'Ein Hang voller riesiger Felsblöcke zum Klettern, Anfahrt über Bensheim mit Bus. Mit Melibokus und Burgensteig zu einer Tagestour verbinden.'],
  ['🥾', 'Neckarsteig: Neckargemünd – Dilsberg – Neckarsteinach', '', 'Burgdorf Dilsberg, vier Burgen über dem Neckar, Start und Ziel an der S-Bahn.'],
  ['⛸️', 'Eislaufen im Eisstadion Herzogenried', '', 'Öffentliche Laufzeiten vorher auf der Seite prüfen.'],
  ['🤾', 'Rhein-Neckar Löwen (Handball) in der SAP Arena', '', 'Erste Liga, direkt in Mannheim. Termine im Spielplan der Löwen.'],
  ['🎤', 'Comedy unter 30 €: Open Mic oder Schatzkistl', '', 'Open-Mic-Abende sind oft frei oder sehr günstig. Das Schatzkistl ist eine kleine Kabarettbühne in Mannheim.'],
];
const STAR = /Adler|Therme|Heidelberg/;
const bucket = () => {
  if (!T.bucket) { T.bucket = BUCKET_SEED.map(([em, t, when, note]) => ({ id: uid(), em, t, when, note, done: null })); saveT(); }
  if ((T.bucketV || 1) < 2) {
    T.bucket = T.bucket.filter(x => x.done || !/Sturm Graz/.test(x.t));
    for (const x of T.bucket) if (/Rostock/.test(x.t) && !x.done) { x.t = 'Waldhof Mannheim im Carl-Benz-Stadion'; x.when = 'Sa 28.11. 14 Uhr vs. VfB Stuttgart II oder 11.–13.12. vs. Jahn Regensburg'; x.note = 'Gegen Rostock (Ende Januar) bist du nicht mehr in Mannheim.'; }
    for (const x of T.bucket) if (STAR.test(x.t)) { x.star = true; if (/Therme/.test(x.t)) { x.t = 'Therme mit Palmen: Badewelt Sinsheim'; x.note = 'Palmenparadies: 4 Std. ab 23 €, Tag ab 39 €, werktags günstiger. Nur mit Online-Ticket für ein festes Datum. Anreise mit der S5 und dem Bus 771, am Wochenende Ruftaxi. Näher und kleiner: Miramar Weinheim, Therme + Bad 38,90 €.'; } if (/Heidelberg/.test(x.t)) x.t = 'Heidelberg: Geocaching + Himmelsleiter zum Königstuhl'; }
    const have = new Set(T.bucket.map(x => x.t)); for (const [em, t, when, note] of BUCKET_V2) if (!have.has(t)) T.bucket.push({ id: uid(), em, t, when, note, done: null });
    T.bucketV = 2; saveT();
  }
  return T.bucket;
};
function viewBucket() {
  const L = bucket(), open = L.filter(x => !x.done).sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0)), done = L.filter(x => x.done);
  const row = x => `<div class="card" style="gap:6px"><div class="row spread" style="align-items:flex-start"><button class="link" data-act="bk-toggle" data-v="${x.id}" style="text-align:left;white-space:normal;color:inherit;padding:0;display:flex;gap:10px;align-items:flex-start"><span style="font-size:22px">${x.done ? '✅' : '⬜'}</span><span class="stack" style="gap:2px"><b style="${x.done ? 'text-decoration:line-through;opacity:.6' : ''}">${x.em ? esc(x.em) + ' ' : ''}${esc(x.t)}${x.star ? ' <span class="tag challenge">⭐ vorgemerkt</span>' : ''}</b>${x.when ? `<span class="small" style="color:var(--gold)">${esc(x.when)}</span>` : ''}${x.note ? `<span class="small muted">${esc(x.note)}</span>` : ''}${x.done ? `<span class="small muted">erledigt am ${fmtDay(x.done)}</span>` : ''}</span></button><button class="link" data-act="bk-del" data-v="${x.id}" aria-label="Löschen">✕</button></div></div>`;
  return `${topBar()}<div class="stack"><span class="eyebrow">Werkzeug</span><h1>🗺️ Erlebnisliste</h1><p class="muted">Was du bis zum 19.12. in Mannheim und Umgebung noch erleben willst. Antippen hakt ab, ⭐ steht oben.</p></div>
  ${open.map(row).join('')}
  <div class="card"><b>+ Neuer Eintrag</b><input class="input" id="bkT" placeholder="Was?"><input class="input" id="bkW" placeholder="Wann? (optional)"><input class="input" id="bkN" placeholder="Notiz, Preis, Link (optional)"><button class="btn primary" data-act="bk-add">Hinzufügen</button></div>
  ${done.length ? `<h3>Erlebt (${done.length})</h3>${done.map(row).join('')}` : ''}`;
}

/* ================= Ruhen & Powernap ================= */
const REST_INFO = `<details class="card"><summary>Was belegt ist, und was nicht</summary><div class="stack small">
  <p><b>10 Minuten Nap für Wachheit: gut belegt.</b> Im direkten Vergleich von 5, 10, 20 und 30 Minuten Schlaf war 10 Minuten am besten: sofort wacher, Wirkung hielt rund 2,5 Stunden. 5 Minuten brachten kaum etwas. Nach 20 bis 30 Minuten war man erst eine Weile benommen (Schlaftrunkenheit), danach ähnlich gut (Brooks &amp; Lack, 2006). Gezählt wird die <i>geschlafene</i> Zeit, Einschlafen also einrechnen.</p>
  <p><b>Warum es wirkt:</b> Im Wachen sammelt sich Adenosin an und erzeugt Schlafdruck. Schon kurzer Schlaf baut etwas davon ab. Darum macht ein Nap wacher, und darum hilft Koffein, das die Adenosin-Rezeptoren blockiert.</p>
  <p><b>Koffein-Nap: mittel belegt, wenige Studien.</b> Kaffee trinken und sofort 15 bis 20 Minuten hinlegen. Das Koffein wirkt etwa beim Aufwachen, die Kombination war in Studien besser als beides allein (Reyner &amp; Horne, 1997; Hayashi et al., 2003).</p>
  <p><b>Nap nach dem Lernen: belegt, Effekt klein bis mittel.</b> Schlaf nach dem Lernen verbessert das Behalten, in einer Studie schon wenige Minuten Schlaf (Lahl et al., 2008). Die Aussage „60 Minuten Nap = ganze Nacht“ stammt aus Mednick et al. (2003) und galt für eine bestimmte Sehaufgabe, nicht für Lernstoff allgemein. 60 bis 90 Minuten, ein ganzer Schlafzyklus mit Tiefschlaf, sind für die Festigung am stärksten, und man wacht weniger benommen auf als nach 40 Minuten.</p>
  <p><b>Nap vor dem Lernen: belegt, aber eher lang.</b> 90 Minuten Mittagsschlaf verbesserten die Lernfähigkeit am Abend (Mander et al., 2011). Eine Stunde Nap war so gut wie eine Stunde zusätzliches Lernen (Cousins et al., 2019). Für genau „30 Minuten vor dem Lernen“ kenne ich keine Studie.</p>
  <p><b>Nur die Augen schließen: hilft dem Gedächtnis etwas, der Energie weniger.</b> 10 Minuten ruhiges Wachsein nach dem Lernen verbesserten das Behalten, aber nicht in jeder Wiederholungsstudie gleich stark (Dewar et al., 2012). Gegen Müdigkeit wirkt echter Schlaf deutlich stärker als nur ruhen. Schläfst du nicht ein, ist die Pause trotzdem nicht verloren.</p>
  <p><b>„Reinigung des Gehirns“ über das Nervenwasser: spannend, aber umstritten.</b> Bei Mäusen weitete sich im Schlaf der Raum zwischen den Zellen, und Abfallstoffe wurden schneller ausgespült (Xie et al., 2013). Beim Menschen gibt es nur indirekte Hinweise, nämlich Wellen von Nervenwasser im Tiefschlaf (Fultz et al., 2019). Eine Mausstudie von 2024 fand sogar weniger Ausspülung im Schlaf (Miao et al.). Für einen 10-Minuten-Nap spielt das ohnehin kaum eine Rolle, weil man dabei selten in den Tiefschlaf kommt.</p>
  <p><b>Bodyscan bis „kein Ich“:</b> Das sind Stufen klassischer Meditation: Körper spüren, dann offenes Gewahrsein, dann Gedanken nicht mehr kommentieren, dann den Beobachter loslassen. Als Erholung entspricht das ruhigem Wachsein. Dass gerade die späten Stufen mehr Energie geben, ist nicht untersucht. Vielen hilft der Ablauf aber, überhaupt abzuschalten oder einzuschlafen.</p></div></details>`;
const NAPS = [
  [10, '⚡', 'Energie-Nap', 'Am besten untersucht für Wachheit. Kaum Benommenheit danach.'],
  [20, '☕', 'Koffein-Nap', 'Vorher einen Kaffee trinken, dann sofort hinlegen.'],
  [90, '🧠', 'Lern-Nap', 'Nach dem Lernen: ein ganzer Schlafzyklus mit Tiefschlaf zur Festigung.'],
];
const rests = () => T.rest || (T.rest = []);
let RS = null;
function restScript(min) { // guided: body scan → passive flow → no narrator → no self → silence → return
  const S = min * 60, f = x => Math.round(S * x), lines = [];
  const parts = ['die Füße', 'die Unterschenkel und die Knie', 'die Oberschenkel', 'das Becken und den unteren Rücken', 'den Bauch, wie er sich mit dem Atem hebt und senkt', 'die Brust', 'die Hände und die Arme', 'die Schultern. Lass sie sinken', 'den Nacken', 'das Gesicht. Lös den Kiefer, die Stirn wird weich', 'den ganzen Körper auf einmal'];
  lines.push([0, 'Leg oder setz dich bequem hin und schließe die Augen. Du musst jetzt nichts leisten.']);
  lines.push([8, 'Atme einmal tief aus.']);
  parts.forEach((p, i) => lines.push([18 + Math.round(i * (f(0.32) - 18) / parts.length), 'Spür ' + p + '.']));
  lines.push([f(0.34), 'Hör jetzt auf, irgendetwas zu tun. Geräusche, Empfindungen und Gedanken dürfen kommen und gehen, wie Wolken. Nichts festhalten.']);
  lines.push([f(0.46), 'Du musst nicht steuern. Es atmet von selbst.']);
  lines.push([f(0.55), 'Wenn ein Gedanke kommt, bemerk ihn kurz: denken. Und lass ihn weiterziehen. Kein Kommentar nötig.']);
  lines.push([f(0.65), 'Kein Erzähler. Nur das, was gerade da ist.']);
  lines.push([f(0.74), 'Lass jetzt auch den Beobachter los. Empfindungen geschehen von selbst. Niemand muss sie machen.']);
  lines.push([f(0.92), 'Langsam zurückkommen. Bewege Finger und Zehen.']);
  lines.push([S - 6, 'Atme tief ein. Und öffne die Augen, wenn du bereit bist.']);
  return lines;
}
function chime(n = 1, vol = 0.25) {
  try {
    BAC = BAC || new (window.AudioContext || window.webkitAudioContext)(); const ac = BAC;
    for (let k = 0; k < n; k++) for (const [f, d] of [[528, 0], [792, 0.02], [1056, 0.04]]) { const t = ac.currentTime + k * 1.6 + d, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 2.5); }
  } catch { /* no audio */ }
}
function speak(t) { try { if (!RS || !RS.voice || !window.speechSynthesis) return; const u = new SpeechSynthesisUtterance(t); u.lang = 'de-DE'; u.rate = 0.82; u.pitch = 0.95; const v = speechSynthesis.getVoices().find(x => /^de/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch { /* none */ } }
async function wake(on) { try { if (on && navigator.wakeLock) RS.lock = await navigator.wakeLock.request('screen'); else if (!on && RS && RS.lock) { RS.lock.release(); RS.lock = null; } } catch { /* not allowed */ } }
const mmss = s => Math.floor(s / 60) + ':' + String(Math.max(0, Math.floor(s % 60))).padStart(2, '0');
function viewRest() {
  const L = rests(), done = L.filter(x => x.after != null), gain = done.length ? mean(done.map(x => x.after - x.before)) : null, buf = T.napBuf == null ? 5 : T.napBuf, voice = T.restVoice !== false;
  return `${topBar()}<div class="stack"><span class="eyebrow">Werkzeug</span><h1>😴 Ruhen & Powernap</h1><p class="muted">Für Energie zwischendurch und zum Festigen nach dem Lernen. Echo hält den Bildschirm wach und weckt dich sanft.</p></div>
  <div class="card"><label class="lab">Wie wach bist du gerade? <b class="mono" id="enV">${T.enDraft || 5}</b> / 10</label><input type="range" class="range" min="1" max="10" id="enB" value="${T.enDraft || 5}"></div>
  <h3>Powernap</h3>
  ${NAPS.map(([m, em, t, d]) => `<button class="card hub" data-act="nap" data-v="${m}"><div class="row"><span style="font-size:24px">${em}</span><div class="stack" style="gap:2px"><b>${t} · ${m} Min. Schlaf</b><span class="small muted">${d}</span></div></div></button>`).join('')}
  <div class="card"><label class="lab">Einschlafzeit dazurechnen: <b class="mono" id="bufV">${buf} Min.</b></label><input type="range" class="range" min="0" max="15" id="napBuf" value="${buf}"><span class="small muted">Der Wecker klingelt nach Schlafdauer plus Einschlafzeit. Die meisten brauchen 5 bis 10 Minuten.</span></div>
  <h3>Geführtes Ruhen</h3>
  <div class="card"><p class="small">Bodyscan → passives Fließen → kein Erzähler → kein Ich → zurückkommen. Für die Pause zwischen Lernblöcken, oder um in den Nap zu gleiten.</p>
    <div class="chips">${[10, 15, 20].map(m => `<button class="chip" data-act="rest" data-v="${m}">${m} Min.</button>`).join('')}</div>
    <label class="check small"><input type="checkbox" id="restVoice" ${voice ? 'checked' : ''}> Mit Stimme (sonst nur Text und Klang)</label></div>
  ${done.length ? `<div class="card"><h3>📈 Dein Effekt</h3><p class="small">Im Schnitt <b>${gain > 0 ? '+' : ''}${gain.toFixed(1)}</b> Punkte wacher nach ${done.length} Pausen.${done.filter(x => x.kind === 'nap').length >= 3 && done.filter(x => x.kind === 'rest').length >= 3 ? ` Nap: ${mean(done.filter(x => x.kind === 'nap').map(x => x.after - x.before)).toFixed(1)}, geführtes Ruhen: ${mean(done.filter(x => x.kind === 'rest').map(x => x.after - x.before)).toFixed(1)}.` : ''}</p>
    <details><summary class="small muted" style="cursor:pointer">Verlauf</summary><div class="stack small" style="margin-top:8px">${done.slice().reverse().slice(0, 20).map(x => `<span>${fmtDay(x.date)} · ${x.kind === 'nap' ? 'Nap ' : 'Ruhen '}${x.min} Min.${x.slept ? ' · eingeschlafen' : x.slept === false ? ' · nur geruht' : ''} · ${x.before} → <b>${x.after}</b></span>`).join('')}</div></details></div>` : ''}
  ${REST_INFO}`;
}
function restStart(kind, min) {
  try { BAC = BAC || new (window.AudioContext || window.webkitAudioContext)(); BAC.resume(); } catch { /* none */ }
  const buf = kind === 'nap' ? (T.napBuf == null ? 5 : T.napBuf) : 0, total = (min + buf) * 60;
  RS = { kind, min, total, t0: Date.now(), before: T.enDraft || 5, voice: kind === 'rest' && T.restVoice !== false, script: kind === 'rest' ? restScript(min) : [], next: 0, ring: null };
  wake(true); restPaint(); RS.iv = setInterval(restTick, 500);
  if (kind === 'nap') speak('Schlaf gut.');
}
function restPaint() {
  const left = Math.max(0, RS.total - (Date.now() - RS.t0) / 1000), cur = RS.script.filter(l => l[0] <= (Date.now() - RS.t0) / 1000).slice(-1)[0];
  boostOverlay(RS.ring ? `<div class="instr"><span style="font-size:56px">🌅</span><h2>Aufwachen</h2><p style="opacity:.7">Kurz strecken, Licht an, ein Glas Wasser. Die Benommenheit vergeht in ein paar Minuten.</p><button class="btn primary big" data-act="rest-up">Ich bin wach</button></div>`
    : `<div class="instr" style="opacity:.55"><span style="font-size:40px">${RS.kind === 'nap' ? '🌙' : '🫶'}</span><div class="big-num mono" id="restT" style="font-weight:500">${mmss(left)}</div><p id="restL" style="min-height:3em">${cur ? esc(cur[1]) : RS.kind === 'nap' ? 'Augen zu. Wenn du nicht einschläfst, ist das in Ordnung: Ruhen hilft auch.' : ''}</p><button class="link" data-act="rest-stop" style="color:#95A09A">Beenden</button></div>`);
}
function restTick() {
  if (!RS) return; const el = (Date.now() - RS.t0) / 1000;
  while (RS.next < RS.script.length && RS.script[RS.next][0] <= el) { const l = RS.script[RS.next++]; speak(l[1]); const p = document.getElementById('restL'); if (p) p.textContent = l[1]; if (RS.next === 1 || RS.next === RS.script.length) chime(1, 0.12); }
  const t = document.getElementById('restT'); if (t) t.textContent = mmss(Math.max(0, RS.total - el));
  if (el >= RS.total && !RS.ring) { RS.ring = 1; restPaint(); chime(2, 0.15); RS.rv = setInterval(() => { RS.ring = Math.min(6, RS.ring + 1); chime(2, 0.1 + RS.ring * 0.06); try { navigator.vibrate && navigator.vibrate([300, 200, 300]); } catch { /* none */ } }, 9000); } // gentle, then louder until you tap
}
function restEnd(ok) {
  clearInterval(RS && RS.iv); clearInterval(RS && RS.rv); try { speechSynthesis.cancel(); } catch { /* none */ } wake(false);
  if (!ok) { document.getElementById('boostov')?.remove(); RS = null; render(); return; }
  const r = RS; boostOverlay(`<div class="instr"><h2>Wie wach bist du jetzt?</h2><div class="chips" style="justify-content:center">${[2, 4, 5, 6, 7, 8, 10].map(n => `<button class="chip" data-act="rest-rate" data-v="${n}">${n}</button>`).join('')}</div>${r.kind === 'nap' ? `<p class="small" style="opacity:.7">Bist du eingeschlafen?</p><div class="chips" style="justify-content:center"><button class="chip" data-act="rest-slept" data-v="1" aria-pressed="${r.slept === true}">Ja</button><button class="chip" data-act="rest-slept" data-v="0" aria-pressed="${r.slept === false}">Nein, nur geruht</button></div>` : ''}<p class="small" style="opacity:.6">Vergleich mit vorher: ${r.before} / 10</p></div>`);
}

/* ================= Hub ================= */
function viewHub() {
  const due = T.dec.filter(d => d.decided && !d.reviewed && d.due <= today()).length, L = T.soc.lvl || 1, iats = T.iat.filter(r => r.valid).length;
  const card = (v, em, t, sub, meta) => `<button class="card hub" data-act="go" data-v="${v}"><div class="row"><span class="em">${em}</span><div class="stack" style="gap:0"><h3>${t}</h3><span class="small muted">${sub}</span></div></div><span class="small muted">${meta}</span></button>`;
  return `${topBar('echo')}<div class="stack"><span class="eyebrow">Echo</span><h1>Werkzeuge</h1><p class="muted">Werkzeuge, die dich im Alltag schärfer machen: eigene Denkmuster erkennen, besser entscheiden, leichter ins Gespräch kommen.</p></div>
  ${card('liste', '🗺️', 'Erlebnisliste', 'Was du in Mannheim und Umgebung noch erleben willst', bucket().filter(x => !x.done).length + ' offen · ' + bucket().filter(x => x.done).length + ' erlebt')}
  ${card('ruhe', '😴', 'Ruhen & Powernap', 'Geführtes Ruhen, Energie-, Koffein- und Lern-Nap mit sanftem Wecker', rests().filter(x => x.after != null).length + ' Pausen')}
  ${card('boost', '⚡', 'Merk-Boost', 'Nach dem Lernen kurz erschrecken oder auspowern, dazu ein Selbstversuch', boosts().filter(x => x.type !== 'ctl').length + ' Boosts')}
  ${card('iat', '🧠', 'Bias-Check (IAT)', 'Implizite Assoziationen messen, sechs Tests', iats ? iats + ' Durchgänge' : 'Noch kein Durchgang')}
  ${card('entscheiden', '🧭', 'Entscheiden', '10 Denkwerkzeuge + Entscheidungstagebuch', due ? '⏰ ' + due + ' Rückblick fällig' : T.dec.length + ' Entscheidungen')}
  ${card('sozial', '💬', 'Smalltalk & Fremde', 'Missionen im echten Leben + Gesprächsproben', 'Stufe ' + L + ' · ' + LVL_NAME[L - 1])}
  <a class="card hub" href="spanisch.html"><div class="row"><span class="em">🇪🇸</span><div class="stack" style="gap:0"><h3>Spanisch-Programm</h3><span class="small muted">Adaptive Vokabeln, Grammatik, Interviews</span></div></div></a>`;
}
function render() {
  const v = view;
  app.innerHTML = v === 'iat' ? viewIAT() : v.startsWith('iat-') ? viewIATResult(v.slice(4)) : v === 'entscheiden' ? viewDecisions() : v.startsWith('dec-') ? viewDecEdit(v.slice(4)) : v.startsWith('rev-') ? viewDecReview(v.slice(4)) : v === 'sozial' ? viewSocial() : v.startsWith('rp-') ? viewRP(v.slice(3)) : v === 'boost' ? viewBoost() : v === 'liste' ? viewBucket() : v === 'ruhe' ? viewRest() : viewHub();
}

/* ================= events ================= */
document.addEventListener('click', e => {
  const k = e.target.closest('[data-k]'); if (k && IA) { if (k.dataset.k === 'go' || k.dataset.k === 'quit') iatKey(k.dataset.k); return; }
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, v = b.dataset.v;
  const d = view.startsWith('dec-') ? decById(view.slice(4)) : view.startsWith('rev-') ? decById(view.slice(4)) : null;
  if (a === 'go') return go(v);
  if (a === 'iat-start') return iatStart(v);
  if (a === 'bk-toggle') { const x = bucket().find(y => y.id === v); if (x) { x.done = x.done ? null : today(); if (x.done) { gainXP('erlebnis', 600); toast('Erlebt · +600 XP'); } saveT(); render(); } return; }
  if (a === 'bk-del') { if (!confirm('Eintrag löschen?')) return; T.bucket = bucket().filter(y => y.id !== v); saveT(); render(); return; }
  if (a === 'bk-add') { const t = document.getElementById('bkT').value.trim(); if (!t) { toast('Was willst du erleben?'); return; } bucket().unshift({ id: uid(), em: '', t, when: document.getElementById('bkW').value.trim(), note: document.getElementById('bkN').value.trim(), done: null }); saveT(); render(); return; }
  if (a === 'nap') return restStart('nap', +v);
  if (a === 'rest') return restStart('rest', +v);
  if (a === 'rest-stop') { const el = RS ? (Date.now() - RS.t0) / 1000 : 0; return restEnd(el > 120); }
  if (a === 'rest-up') return restEnd(true);
  if (a === 'rest-slept') { if (RS) { RS.slept = v === '1'; restEnd(true); } return; }
  if (a === 'rest-rate') { if (!RS) return; rests().push({ id: uid(), date: today(), kind: RS.kind, min: RS.min, before: RS.before, after: +v, slept: RS.slept }); if (rests().length > 300) T.rest = rests().slice(-300); saveT(); gainXP('rest', 5); toast('Notiert · +5 XP'); document.getElementById('boostov')?.remove(); RS = null; render(); return; }
  if (a === 'boost-go') return boostStart(v);
  if (a === 'boost-demo') { BO = { kind: 'demo' }; boostOverlay(`<div class="instr" style="text-align:left"><span class="eyebrow" style="color:#95A09A">Abruf</span><h2>Was weißt du noch?</h2><p class="small" style="opacity:.75">Vorschau: So sieht der Bildschirm aus, kurz bevor es passiert.</p><textarea class="input" id="boostRecall" rows="7">Glykolyse, Citratzyklus, Atmungskette …</textarea><button class="link" data-act="boost-cancel" style="color:#95A09A">Abbrechen</button></div>`); SCARE.unlock(); BO.t = setTimeout(() => { const el = document.getElementById('boostov'); if (el) SCARE.run(v, el, () => boostEnd(false)); }, 900); return; }
  if (a === 'boost-coin') return boostStart(Math.random() < 0.5 ? ['schreck', 'move'][Math.floor(Math.random() * 2)] : 'ctl');
  if (a === 'boost-fin') return boostEnd(true);
  if (a === 'boost-cancel') return boostEnd(false);
  if (a === 'boost-early') { if (BO && BO.kind === 'kalt') { clearInterval(BO.iv); boostOverlay(AFTER); } else boostEnd(false); return; }
  if (a === 'boost-rec') { const x = boosts().find(y => y.id === v); if (x) { x.rec = +b.dataset.n; saveT(); toast('Notiert'); render(); } return; }
  if (a === 'dec-new') { const nd = { id: uid(), title: '', opts: [], tools: {}, created: today(), conf: 70, revIn: 90 }; T.dec.push(nd); saveT(); return go('dec-' + nd.id); }
  if (a === 'dec-open') return go('dec-' + v);
  if (a === 'dec-review') return go('rev-' + v);
  if (!d) {
    if (a === 'soc-go') { const mi = socMission(); T.soc.cur = { m: mi.m, lvl: mi.L, pre: +(document.getElementById('socPre') || {}).value || 5, date: today() }; saveT(); render(); return; }
    if (a === 'soc-other') { T.soc.pick = (T.soc.pick || 0) + 1; saveT(); render(); return; }
    if (a === 'soc-down') { T.soc.lvl = Math.max(1, (T.soc.lvl || 1) - 1); saveT(); render(); return; }
    if (a === 'soc-done' || a === 'soc-skip') {
      const c = T.soc.cur; if (!c) return; const ok = a === 'soc-done';
      socLog().push({ id: uid(), date: today(), lvl: c.lvl, m: c.m, pre: c.pre, post: ok ? +document.getElementById('socPost').value : null, note: (document.getElementById('socNote') || {}).value || '' });
      T.soc.cur = null; T.soc.pick = (T.soc.pick || 0) + 1;
      if (ok) { const L = T.soc.lvl || 1, mxp = socXP(L); gainXP('smalltalk', mxp); if (L < 5 && socLog().filter(x => x.post != null && x.lvl === L).length >= 3) { T.soc.lvl = L + 1; toast('🎉 Stufe ' + (L + 1) + ': ' + LVL_NAME[L]); } else toast('Stark · +' + mxp + ' XP'); }
      else toast('Kein Problem. Morgen ist eine neue Mission.');
      saveT(); render(); return;
    }
    if (a === 'rp-start') { const r = { id: uid(), sc: v, date: today(), mood: MOODS[Math.floor(Math.random() * MOODS.length)], msgs: [] }; T.rp.push(r); if (T.rp.length > 60) T.rp = T.rp.slice(-60); saveT(); return go('rp-' + r.id); }
    const r = view.startsWith('rp-') ? T.rp.find(x => x.id === view.slice(3)) : null;
    if (r && a === 'rp-send') { const el = document.getElementById('rpIn'), t = el.value.trim(); if (t && !RP_BUSY) rpSend(r, t); return; }
    if (r && a === 'rp-end') { if (!RP_BUSY) rpEnd(r); return; }
    if (r && a === 'rp-mic') { b.textContent = '🎤 …'; dictate(r.sc === 'es' ? 'es-ES' : 'de-DE', t => { const el = document.getElementById('rpIn'); if (el) el.value = (el.value + ' ' + t).trim(); }, () => { b.textContent = '🎤 Sprechen'; }); return; }
    return;
  }
  if (a === 'dec-kind') { d.tools.typ = Object.assign(d.tools.typ || {}, { kind: v }); saveT(); render(); return; }
  if (a === 'mx-add') { d.tools.mx.crit.push({ n: '', w: 3 }); saveT(); render(); return; }
  if (a === 'coin') { const os = opts(d); if (os.length < 2) { toast('Erst zwei Optionen eintragen'); return; } d.tools.coin = Object.assign(d.tools.coin || {}, { res: os[Math.floor(Math.random() * os.length)] }); saveT(); render(); return; }
  if (a === 'dec-choose') { d.choice = v; saveT(); render(); return; }
  if (a === 'dec-rev') { d.revIn = +v; saveT(); render(); return; }
  if (a === 'dec-save') { if (!d.title.trim()) { toast('Gib der Entscheidung einen Titel'); return; } const first = !d.decided; d.decided = d.decided || today(); d.due = addDays(d.revIn || 90, new Date(d.decided + 'T12:00')); saveT(); if (first) { gainXP('decide', 15); toast('Festgehalten · +15 XP · Rückblick am ' + fmtDay(d.due)); } return go('entscheiden'); }
  if (a === 'dec-del') { if (!confirm('Diese Entscheidung löschen?')) return; T.dec = T.dec.filter(x => x !== d); saveT(); return go('entscheiden'); }
  if (a === 'rv') { d.rv = Object.assign(d.rv || {}, { [b.dataset.k]: b.dataset.k === 'hit' ? +v : v }); saveT(); render(); return; }
  if (a === 'rv-save') { const first = !d.reviewed; d.reviewed = today(); saveT(); if (first) { gainXP('decide', 10); toast('Rückblick gespeichert · +10 XP'); } return go('entscheiden'); }
});
document.addEventListener('pointerdown', e => { const k = e.target.closest('.iat [data-k]'); if (k && (k.dataset.k === 'L' || k.dataset.k === 'R')) { e.preventDefault(); iatKey(k.dataset.k); } });
document.addEventListener('keydown', e => {
  if (IA) { const key = e.key.toLowerCase(); if (key === 'e' || e.key === 'ArrowLeft') iatKey('L'); else if (key === 'i' || e.key === 'ArrowRight') iatKey('R'); else if ((e.key === ' ' || e.key === 'Enter') && IA.phase === 'instr') { e.preventDefault(); iatKey('go'); } return; }
  if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'rpIn') { e.preventDefault(); document.querySelector('[data-act=rp-send]')?.click(); }
});
document.addEventListener('input', e => {
  const el = e.target, d = view.startsWith('dec-') ? decById(view.slice(4)) : view.startsWith('rev-') ? decById(view.slice(4)) : null;
  if (el.id === 'enB') { T.enDraft = +el.value; document.getElementById('enV').textContent = el.value; saveT(); return; }
  if (el.id === 'napBuf') { T.napBuf = +el.value; document.getElementById('bufV').textContent = el.value + ' Min.'; saveT(); return; }
  if (el.id === 'restVoice') { T.restVoice = el.checked; saveT(); return; }
  if (el.id === 'socPre') { T.soc.preDraft = +el.value; document.getElementById('prev').textContent = el.value; saveT(); return; }
  if (el.id === 'socPost') { T.soc.postDraft = +el.value; document.getElementById('postv').textContent = el.value; saveT(); return; }
  if (!d) return;
  if (el.dataset.f === 'optsText') { d.opts = el.value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 6); saveT(); return; }
  if (el.dataset.f === 'conf') { d.conf = +el.value; document.getElementById('confv').textContent = el.value + ' %'; saveT(); return; }
  if (el.dataset.f) { d[el.dataset.f] = el.value; saveT(); return; }
  if (el.dataset.t) { const [tk, f] = el.dataset.t.split('.'); d.tools[tk] = Object.assign(d.tools[tk] || {}, { [f]: el.value }); saveT(); return; }
  if (el.dataset.rv) { d.rv = Object.assign(d.rv || {}, { [el.dataset.rv]: el.value }); saveT(); return; }
  if (el.dataset.mx) { const m = d.tools.mx, j = +el.dataset.j; if (el.dataset.mx === 'n') m.crit[j].n = el.value; else if (el.dataset.mx === 'w') m.crit[j].w = Math.max(1, Math.min(5, +el.value || 1)); else { m.sc = m.sc || {}; m.sc[el.dataset.i + ':' + j] = Math.max(0, Math.min(10, +el.value || 0)); } saveT(); }
});
// options and matrix numbers change the layout of other cards: re-render when leaving the field (keeps the keyboard while typing)
document.addEventListener('change', e => { if (e.target.dataset.f === 'optsText' || e.target.dataset.mx) { const open = [...document.querySelectorAll('details[data-tool][open]')].map(x => x.dataset.tool); render(); open.forEach(k => document.querySelector(`details[data-tool="${k}"]`)?.setAttribute('open', '')); } });
window.TOOLS_TEST = { boostStart, boosts, T, iatScore, iatBlocks, iatTrials, IAT_SETS, mxTotals };
render();
