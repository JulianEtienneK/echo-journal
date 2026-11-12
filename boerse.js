/* Echo · Börsen-Akademie: five games around reading and valuing companies.
   Akademie (levelled quiz), Mythos oder Regel, Kennzahl-Sprint, Schnäppchen oder Falle, Zeitmaschine (8-year simulation).
   All companies are invented; nothing here is investment advice. Needs tools-common.js and boerse-data.js. */
'use strict';
const app = document.getElementById('app');
const B = Object.assign({ lv: {}, myth: { best: 0, w: {} }, sprint: {}, deal: { best: 0, n: 0 }, sim: { n: 0, best: null, beat: 0 }, open: false }, LS.get('echo-boerse', {}));
const saveB = () => { B.updated = Date.now(); LS.set('echo-boerse', B); };
const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
const nf = (x, d = 0) => x.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const nfa = x => nf(x, Math.abs(x - Math.round(x)) < 0.005 ? 0 : Math.abs(x * 10 - Math.round(x * 10)) < 0.05 ? 1 : 2); // as few decimals as needed
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const route = () => location.hash.replace(/^#/, '');
const go = h => { if (route() === h) render(); else location.hash = h; };
const topBar = back => `<div class="topbar"><a class="link" href="${back === 'hub' ? '#' : 'index.html#games'}" ${back === 'hub' ? 'data-act="go" data-v=""' : ''}>← ${back === 'hub' ? 'Börse' : 'Spiele'}</a><span class="xp">${LS.get('echo-games', {}).xp || 0} XP</span></div>`;
let S = null, TICK = null; // S = running session of whichever game is open
const stopTick = () => { clearInterval(TICK); TICK = null; };

/* ================= quiz core (Akademie + Schnäppchen) ================= */
const mkQ = ([q, opts, why]) => { const o = shuffle(opts.map((t, i) => ({ t, ok: i === 0 }))); return { q, o, why }; };
function quizView(head) {
  const it = S.items[S.i], done = S.pick != null;
  return `${topBar('hub')}<div class="progress">${S.items.map((x, i) => `<i class="${i < S.i ? (x.res ? 'ok' : 'bad') : i === S.i ? (done ? (x.res ? 'ok' : 'bad') : 'cur') : ''}"></i>`).join('')}</div>
  <span class="eyebrow">${head} · ${S.i + 1} / ${S.items.length}</span>${it.pre || ''}<div class="q">${esc(it.q)}</div>
  <div class="opts"${it.o.some(o => o.t.length > 44) ? ' style="grid-template-columns:1fr"' : ''}>${it.o.map((o, i) => `<button class="opt ${done ? (o.ok ? 'ok' : i === S.pick ? 'bad' : '') : ''}" data-act="ans" data-v="${i}" ${done ? 'disabled' : ''}>${esc(o.t)}</button>`).join('')}</div>
  ${done ? `<div class="fb ${it.res ? 'ok' : 'bad'}"><div class="stack" style="gap:4px"><b>${it.res ? pick(['Richtig.', 'Sitzt.', 'Genau.']) : 'Nicht ganz.'}</b><span>${it.why}</span></div></div><button class="btn primary big" data-act="next">${S.i + 1 < S.items.length ? 'Weiter' : 'Auswertung'}</button>` : ''}`;
}
function quizAnswer(i) { if (S.pick != null) return; const it = S.items[S.i]; S.pick = i; it.res = !!it.o[i].ok; if (it.res) S.right++; render(); }
function quizNext() { S.pick = null; S.i++; if (S.i >= S.items.length) S.finish(); render(); window.scrollTo(0, 0); }

/* ================= 1 · Akademie ================= */
const lvPassed = n => (B.lv[n] || {}).best >= 8, lvOpen = n => n === 1 || B.open || lvPassed(n - 1);
function lvStart(n) {
  const L = BX_LEVELS[n - 1], seen = (B.lv[n] || {}).seen || {};
  // questions answered wrong or never seen come first
  const order = shuffle(L.q.map((q, i) => i)).sort((a, b) => (seen[a] || 0) - (seen[b] || 0)).slice(0, 10);
  S = { kind: 'lv', n, i: 0, right: 0, pick: null, items: shuffle(order).map(i => Object.assign(mkQ(L.q[i]), { idx: i })), finish() {
    const r = B.lv[n] || (B.lv[n] = { best: 0, runs: 0, seen: {} }); r.seen = r.seen || {};
    S.items.forEach(it => { r.seen[it.idx] = it.res ? (r.seen[it.idx] || 0) + 1 : 0; });
    S.firstPass = S.right >= 8 && r.best < 8; r.best = Math.max(r.best, S.right); r.runs++; S.xp = S.right * 5 + (S.right >= 8 ? 20 : 0) + (S.right === 10 ? 15 : 0);
    gainXP('boerse', S.xp); saveB(); S.done = true;
  } };
}
function viewLv() {
  const L = BX_LEVELS[S.n - 1];
  if (!S.done) return quizView(`${L.em} Level ${L.n} · ${L.name}`);
  const stars = S.right === 10 ? 3 : S.right >= 8 ? 2 : S.right >= 6 ? 1 : 0, next = BX_LEVELS[S.n];
  return `${topBar('hub')}<div class="card" style="text-align:center"><span style="font-size:44px">${'⭐'.repeat(stars) || '📚'}</span><div class="big-num">${S.right} / 10</div><h2>${stars === 3 ? 'Makellos' : stars === 2 ? 'Bestanden' : stars === 1 ? 'Knapp daneben' : 'Noch einmal'}</h2>
  <p class="muted">${S.firstPass && next ? `Level ${next.n} „${next.name}“ ist freigeschaltet.` : S.right >= 8 ? 'Ab 8 von 10 gilt ein Level als bestanden.' : 'Ab 8 von 10 ist das Level bestanden. Die falschen Fragen kommen beim nächsten Mal zuerst.'}</p><span class="xp">+${S.xp} XP</span></div>
  ${S.items.filter(x => !x.res).length ? `<details class="card" open><summary>Das nimmst du mit (${S.items.filter(x => !x.res).length})</summary><div class="stack">${S.items.filter(x => !x.res).map(x => `<div class="note"><b>${esc(x.q)}</b><br>${esc(x.o.find(o => o.ok).t)}<br><span class="muted">${x.why}</span></div>`).join('')}</div></details>` : ''}
  ${S.firstPass && next ? `<button class="btn primary big" data-act="lv" data-v="${next.n}">Weiter mit Level ${next.n}</button>` : ''}<button class="btn ${S.firstPass && next ? '' : 'primary'} big" data-act="lv" data-v="${S.n}">Noch eine Runde</button><button class="btn ghost big" data-act="go" data-v="">Zur Übersicht</button>`;
}

/* ================= 2 · Mythos oder Regel ================= */
function mythStart() {
  const w = B.myth.w || {}; // weight: wrong or unseen statements first
  const idx = shuffle(BX_MYTHS.map((m, i) => i)).sort((a, b) => (w[a] || 0) - (w[b] || 0)).slice(0, 12);
  S = { kind: 'myth', i: 0, right: 0, streak: 0, maxStreak: 0, pick: null, items: shuffle(idx) };
}
function viewMyth() {
  if (S.done) return `${topBar('hub')}<div class="card" style="text-align:center"><span style="font-size:44px">${S.right >= 11 ? '🦉' : S.right >= 8 ? '👍' : '🧐'}</span><div class="big-num">${S.right} / 12</div><h2>${S.right >= 11 ? 'Lässt sich nichts erzählen' : S.right >= 8 ? 'Guter Riecher' : 'Ein paar Märchen geglaubt'}</h2><p class="muted">Längste Serie: ${S.maxStreak} · Bestwert: ${B.myth.best} / 12</p><span class="xp">+${S.xp} XP</span></div>
  <button class="btn primary big" data-act="myth">Noch eine Runde</button><button class="btn ghost big" data-act="go" data-v="">Zur Übersicht</button>`;
  const [text, rule, why] = BX_MYTHS[S.items[S.i]], done = S.pick != null, ok = done && S.pick === rule;
  return `${topBar('hub')}<div class="row spread"><span class="eyebrow">Mythos oder Regel · ${S.i + 1} / 12</span><span class="combo">${S.streak >= 2 ? '🔥 ' + S.streak + ' in Folge' : ''}</span></div>
  <div class="card" style="min-height:190px;align-content:center;text-align:center"><div class="q">„${esc(text)}“</div></div>
  ${done ? `<div class="fb ${ok ? 'ok' : 'bad'}"><div class="stack" style="gap:4px"><b>${rule ? 'Stimmt.' : 'Mythos.'} ${ok ? '' : 'Du lagst daneben.'}</b><span>${why}</span></div></div><button class="btn primary big" data-act="myth-next">Weiter</button>`
    : `<div class="row" style="gap:10px"><button class="btn big" data-act="myth-ans" data-v="0" style="background:var(--rec-soft);color:var(--rec)">🙅 Mythos</button><button class="btn big" data-act="myth-ans" data-v="1" style="background:var(--calm-soft);color:var(--calm)">✅ Stimmt</button></div>`}`;
}
function mythAnswer(v) {
  if (S.pick != null) return; const i = S.items[S.i], rule = BX_MYTHS[i][1]; S.pick = !!v; const ok = S.pick === rule;
  B.myth.w = B.myth.w || {}; B.myth.w[i] = ok ? (B.myth.w[i] || 0) + 1 : 0;
  if (ok) { S.right++; S.streak++; S.maxStreak = Math.max(S.maxStreak, S.streak); } else S.streak = 0; saveB(); render();
}
function mythNext() { S.pick = null; S.i++; if (S.i >= 12) { S.done = true; B.myth.best = Math.max(B.myth.best || 0, S.right); S.xp = S.right * 3 + (S.maxStreak >= 6 ? 10 : 0); gainXP('boerse', S.xp); saveB(); } render(); }

/* ================= 3 · Kennzahl-Sprint ================= */
// each generator returns [question, value, unit]
const GEN = {
  1: [
    () => { const p = pick([5, 12, 20, 40, 75, 120, 250, 400]), s = pick([10, 25, 50, 80, 200, 500, 900]); return [`Kurs ${p} €, ${s} Mio. Aktien. Börsenwert?`, p * s / 1000, 'Mrd. €']; },
    () => { const e = pick([1, 2, 2.5, 4, 5, 8, 12]), k = pick([6, 8, 10, 12, 15, 18, 20, 25, 30, 40]); return [`Kurs ${nfa(e * k)} €, Gewinn je Aktie ${nfa(e)} €. KGV?`, k, '']; },
    () => { const p = pick([20, 40, 50, 80, 100, 200]), y = pick([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]); return [`Kurs ${p} €, Dividende ${nf(p * y / 100, 2)} €. Dividendenrendite?`, y, '%']; },
    () => { const k = pick([8, 10, 12.5, 16, 20, 25, 40, 50]); return [`KGV ${nfa(k)}. Gewinnrendite?`, 100 / k, '%']; },
    () => { const r = pick([3, 4, 6, 8, 9, 12]); return [`72er-Regel: ${r} % Rendite pro Jahr. Verdopplung nach?`, 72 / r, 'Jahren']; },
    () => { const u = pick([2, 4, 5, 8, 10, 20]), m = pick([5, 8, 10, 12, 15, 20, 25, 30]); return [`Umsatz ${u} Mrd. €, Gewinn ${nfa(u * m * 10)} Mio. €. Nettomarge?`, m, '%']; },
  ],
  2: [
    () => { const g = pick([5, 8, 10, 12, 15, 20, 25, 30]), pg = pick([0.5, 0.8, 1, 1.5, 2, 2.5, 3]); return [`KGV ${nfa(g * pg)}, Gewinnwachstum ${g} % pro Jahr. PEG?`, pg, '']; },
    () => { const e = pick([2, 4, 5, 8, 10]), q = pick([25, 40, 50, 60, 80, 120, 150]); return [`Gewinn je Aktie ${e} €, Dividende ${nf(e * q / 100, 2)} €. Ausschüttungsquote?`, q, '%']; },
    () => { const m = pick([8, 12, 20, 35, 50]), d = pick([2, 4, 6, 10, 15]), c = pick([1, 2, 3, 5]); return [`Börsenwert ${m} Mrd. €, Schulden ${d} Mrd. €, Cash ${c} Mrd. €. Enterprise Value?`, m + d - c, 'Mrd. €']; },
    () => { const x = pick([6, 8, 10, 12, 15, 20]), e = pick([0.5, 1, 2, 4]), d = pick([1, 2, 3, 4]), c = pick([0, 1, 2]), m = x * e - d + c; return m > 0 ? [`Börsenwert ${nfa(m)} Mrd. €, Schulden ${d} Mrd. €, Cash ${c} Mrd. €, EBITDA ${nfa(e)} Mrd. €. EV/EBITDA?`, x, ''] : GEN[2][0](); },
    () => { const k = pick([0.5, 0.8, 1.5, 2, 4, 6, 10, 20]), u = pick([1, 2, 5, 10]); return [`Börsenwert ${nfa(k * u)} Mrd. €, Umsatz ${u} Mrd. €. KUV?`, k, '']; },
    () => { const l = pick([20, 25, 50, 60, 75, 80]); return [`Die Aktie fällt um ${l} %. Welcher Anstieg bringt sie zurück auf den alten Kurs?`, l / (100 - l) * 100, '%']; },
    () => { const m = pick([4, 10, 20, 50]), y = pick([2, 3, 4, 5, 8, 10]); return [`Börsenwert ${m} Mrd. €, Free Cashflow ${nfa(m * y * 10)} Mio. €. FCF-Rendite?`, y, '%']; },
  ],
  3: [
    () => { const d = pick([1, 2, 3, 4]), r = pick([7, 8, 9, 10]), g = pick([2, 3, 4]); return [`Gordon-Modell: Dividende ${d} €, verlangte Rendite ${r} %, Wachstum ${g} %. Wert?`, d / (r - g) * 100, '€']; },
    () => { const v = pick([40, 60, 80, 100, 120, 160, 200]), m = pick([20, 25, 30, 40, 50]); return [`Innerer Wert ${v} €, gewünschte Sicherheitsmarge ${m} %. Kaufen bis?`, v * (1 - m / 100), '€']; },
    () => { const [e, b, n] = pick([[4, 10, 30], [5, 18, 45], [6, 15, 45], [8, 20, 60], [10, 25, 75], [12, 30, 90]]); return [`Graham-Zahl: Gewinn je Aktie ${e} €, Buchwert je Aktie ${b} €. √(22,5 × ${e} × ${b}) = ?`, n, '€']; },
    () => { const b = pick([10, 20, 25, 40, 50]), q = pick([2, 3, 4, 5, 6, 8]); return [`Cash ${b * q} Mio. €, Verbrauch ${b} Mio. € pro Quartal. Runway?`, q * 3, 'Monate']; },
    () => { const e = pick([0.5, 1, 2, 4]), x = pick([0.5, 1, 2, 3, 4.5, 6]), c = pick([0.5, 1, 2]); return [`Schulden ${nfa(x * e + c)} Mrd. €, Cash ${nfa(c)} Mrd. €, EBITDA ${nfa(e)} Mrd. €. Nettoschulden / EBITDA?`, x, '']; },
    () => { const z = pick([20, 40, 50, 100]), x = pick([1.5, 2, 4, 5, 8, 12]); return [`EBIT ${nfa(z * x)} Mio. €, Zinsaufwand ${z} Mio. €. Zinsdeckung?`, x, '']; },
    () => { const g = pick([10, 20, 25, 35, 50]), m = pick([-20, -10, 5, 10, 15, 25]); return [`Software: Umsatzwachstum ${g} %, Marge ${m} %. Rule-of-40-Wert?`, g + m, '']; },
    () => { const n = pick([6, 8, 9, 12, 18, 24]); return [`Dein Geld soll sich in ${n} Jahren verdoppeln. Nötige Rendite nach der 72er-Regel?`, 72 / n, '%']; },
  ],
};
function sprintQ() {
  const [q, a, unit] = pick(GEN[S.lvl])(), f = x => nfa(x) + (unit ? ' ' + unit : ''), opts = new Set([f(a)]);
  const mult = shuffle([0.5, 2, 0.8, 1.25, 1.5, 0.1, 10, 0.67, 3, 0.4]);
  for (const m of mult) { if (opts.size >= 4) break; opts.add(f(a * m)); }
  S.cur = { q, ok: f(a), o: shuffle([...opts]) }; S.flash = null;
}
function sprintStart(lvl) { S = { kind: 'sprint', lvl, left: 60, score: 0, wrong: 0 }; sprintQ(); stopTick(); TICK = setInterval(() => { S.left--; if (S.left <= 0) sprintEnd(); else { const el = document.getElementById('spT'); if (el) { el.textContent = S.left + ' s'; document.getElementById('spB').style.width = S.left / 60 * 100 + '%'; } } }, 1000); }
function sprintEnd() { stopTick(); S.done = true; const b = B.sprint[S.lvl] || 0; S.record = S.score > b; B.sprint[S.lvl] = Math.max(b, S.score); S.xp = S.score * 3; gainXP('boerse', S.xp); saveB(); render(); }
function viewSprint() {
  if (!S || S.kind !== 'sprint') return `${topBar('hub')}<div class="stack"><span class="eyebrow">Kennzahl-Sprint</span><h1>⚡ 60 Sekunden rechnen</h1><p class="muted">Kennzahlen im Kopf überschlagen, so viele wie möglich. Ein Fehler kostet drei Sekunden.</p></div>
  ${[[1, 'Einsteiger', 'Börsenwert, KGV, Dividendenrendite, 72er-Regel'], [2, 'Analyst', 'PEG, Enterprise Value, EV/EBITDA, FCF-Rendite'], [3, 'Profi', 'Gordon-Modell, Sicherheitsmarge, Graham-Zahl, Runway']].map(([n, t, s]) => `<button class="card hub" data-act="sprint" data-v="${n}"><div class="row spread"><h3>${t}</h3><span class="xp">Bestwert ${B.sprint[n] || 0}</span></div><span class="small muted">${s}</span></button>`).join('')}`;
  if (S.done) return `${topBar('hub')}<div class="card" style="text-align:center"><span style="font-size:44px">${S.record ? '🏆' : '⏱️'}</span><div class="big-num">${S.score}</div><h2>${S.record ? 'Neuer Bestwert' : 'richtige Antworten'}</h2><p class="muted">${S.wrong} Fehler · Bestwert ${B.sprint[S.lvl]}</p><span class="xp">+${S.xp} XP</span></div>
  <button class="btn primary big" data-act="sprint" data-v="${S.lvl}">Nochmal</button><button class="btn ghost big" data-act="go" data-v="sprint">Stufe wechseln</button>`;
  return `<div class="row spread"><button class="link" data-act="sprint-quit">Abbrechen</button><span class="mono" id="spT" style="font-size:20px;font-weight:700">${S.left} s</span><span class="xp">${S.score} ✓</span></div><div class="bar gold"><i id="spB" style="width:${S.left / 60 * 100}%"></i></div>
  <div class="card" style="min-height:150px;align-content:center"><div class="q">${esc(S.cur.q)}</div></div>
  <div class="opts" style="grid-template-columns:1fr 1fr">${S.cur.o.map(o => `<button class="opt ${S.flash && o === S.cur.ok ? 'ok' : S.flash === o ? 'bad' : ''}" data-act="sp-ans" data-v="${esc(o)}" style="justify-content:center;font-size:18px;font-weight:700" ${S.flash ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>`;
}
function sprintAnswer(v) {
  if (S.flash || S.done) return;
  if (v === S.cur.ok) { S.score++; sprintQ(); render(); return; }
  S.wrong++; S.left = Math.max(1, S.left - 3); S.flash = v; render(); setTimeout(() => { if (S && S.kind === 'sprint' && !S.done) { sprintQ(); render(); } }, 900);
}

/* ================= 4 · Schnäppchen oder Falle ================= */
const NAME_A = ['Nord', 'Alt', 'Vega', 'Lumen', 'Terra', 'Kron', 'Havel', 'Sol', 'Arcus', 'Brise', 'Quant', 'Mira', 'Ferro', 'Tessa', 'Nimbus', 'Delta', 'Onyx', 'Falken', 'Linde', 'Zenit'];
const coName = suf => pick(NAME_A) + pick(suf);
const VERD = { deal: 'Solides Schnäppchen', qual: 'Qualität zum fairen Preis', trap: 'Value-Falle', hype: 'Hype ohne Substanz', cyc: 'Zykliker am Gipfel', debt: 'Schuldenrisiko' };
const pc = (a, b, d = 0) => nf(rnd(a, b), d);
function dealCase(k) {
  const r = (kgv, kuv, grow, mNow, mAvg, roic, nd, cov, div, pay, fcf) => [['KGV', kgv], ['KUV', kuv], ['Umsatz, 3 Jahre p. a.', grow], ['Marge heute / 10-J.-Schnitt', mNow + ' / ' + mAvg], ['Kapitalrendite (ROIC)', roic], ['Nettoschulden / EBITDA', nd], ['Zinsdeckung', cov], ['Dividendenrendite / Quote', div + ' / ' + pay], ['Cashflow im Verhältnis zum Gewinn', fcf]];
  const m = +pc(9, 13);
  if (k === 'deal') return { name: coName(['werk AG', ' Maschinenbau', ' Logistik', 'tec SE']), sec: pick(['Spezialmaschinen', 'Verpackung', 'Logistik', 'Industriegase']), news: pick(['Seit Jahren kaum in den Medien', 'Analysten: „solide, aber langweilig“', 'Familie hält 40 % der Aktien']), rows: r(pc(8, 12), pc(0.8, 1.6, 1), '+' + pc(4, 9) + ' %', m + ' %', (m + ri(-1, 1)) + ' %', pc(14, 22) + ' %', pc(0.2, 1.5, 1), pc(8, 20) + '×', pc(2.5, 4.5, 1) + ' %', pc(30, 50) + ' %', pc(90, 115) + ' %'), why: 'Niedriges KGV bei wachsendem Umsatz, normaler Marge, ordentlicher Kapitalrendite und wenig Schulden. Der Gewinn kommt als Cash an und die Dividende ist gedeckt. Billig ohne erkennbaren Haken.' };
  if (k === 'qual') { const q = +pc(24, 32); return { name: coName(['Med SE', ' Systems', 'soft AG', ' Diagnostics']), sec: pick(['Medizintechnik', 'Unternehmenssoftware', 'Diagnostik', 'Zahlungsabwicklung']), news: pick(['Marktführer in seiner Nische', 'Kunden wechseln so gut wie nie', 'Preise seit zehn Jahren jährlich erhöht']), rows: r(pc(24, 32), pc(6, 10, 1), '+' + pc(12, 18) + ' %', q + ' %', (q - ri(0, 2)) + ' %', pc(28, 45) + ' %', pc(-0.5, 0.5, 1), pc(25, 60) + '×', pc(0.5, 1.2, 1) + ' %', pc(15, 30) + ' %', pc(100, 120) + ' %'), why: 'Das KGV ist hoch, aber dahinter stehen zweistelliges Wachstum, sehr hohe Kapitalrendite, stabile Marge und praktisch keine Schulden. Teuer im Vielfachen, vertretbar durch Qualität.' }; }
  if (k === 'trap') return { name: coName(['kauf AG', ' Print', ' Kabel', ' Warenhaus']), sec: pick(['Kaufhauskette', 'Zeitungsverlag', 'Kabelfernsehen', 'Tabakwaren-Großhandel']), news: pick(['„So billig wie seit 20 Jahren nicht“', 'Dividende bisher nie gekürzt', 'Dritter Sparplan in vier Jahren']), rows: r(pc(5, 8), pc(0.3, 0.6, 1), '−' + pc(4, 10) + ' %', pc(4, 6) + ' %', pc(9, 11) + ' %', pc(3, 6) + ' %', pc(3, 4.2, 1), pc(2, 3.5, 1) + '×', pc(8, 12, 1) + ' %', pc(110, 170) + ' %', pc(50, 80) + ' %'), why: 'Optisch spottbillig, aber der Umsatz schrumpft, die Marge hat sich halbiert, die Kapitalrendite liegt unter den Kapitalkosten und die Dividende übersteigt den Gewinn. Der Gewinn im Nenner des KGV ist auf dem Rückzug.' };
  if (k === 'hype') return { name: coName(['.ai', ' Robotics', 'verse', ' Quantum']), sec: pick(['KI-Plattform', 'Flugtaxis', 'Quantencomputer', 'Laborfleisch']), news: pick(['Kurs in sechs Monaten verfünffacht', 'Gründer: „Wir definieren die Branche neu“', 'Meistdiskutierte Aktie in den Foren']), rows: r('kein Gewinn', pc(28, 60), '+' + pc(45, 90) + ' %', '−' + pc(15, 40) + ' %', 'n. v.', 'negativ', 'Nettokasse', 'n. v.', '0 % / 0 %', '', 'Cash reicht ' + ri(9, 14) + ' Monate').map(x => x[0].startsWith('Dividenden') ? ['Dividendenrendite / Quote', '0 % / 0 %'] : x), why: 'Dutzendfacher Umsatz als Preis, tiefrote Marge und Geld für rund ein Jahr. Das Wachstum ist echt, aber im Kurs steckt schon die perfekte Zukunft, und die nächste Kapitalerhöhung ist absehbar.' };
  if (k === 'cyc') return { name: coName([' Stahl AG', ' Chemie', ' Reederei', ' Memory']), sec: pick(['Stahl', 'Basischemie', 'Containerreederei', 'Speicherchips']), news: pick(['Rekordgewinn im zweiten Jahr in Folge', 'Preise auf Allzeithoch, Kapazitäten werden ausgebaut', 'Sonderdividende angekündigt']), rows: r(pc(3.5, 5.5, 1), pc(0.5, 0.9, 1), '+' + pc(25, 40) + ' %', pc(22, 28) + ' %', pc(8, 11) + ' %', pc(30, 40) + ' %', pc(0.5, 1.5, 1), pc(15, 30) + '×', pc(7, 10, 1) + ' %', pc(35, 45) + ' %', pc(90, 110) + ' %'), why: 'Alles sieht glänzend aus, aber die Marge liegt beim Zwei- bis Dreifachen des langjährigen Schnitts. In zyklischen Branchen ist das KGV am Gewinnhoch am niedrigsten. Der Markt preist den Rückgang schon ein.' };
  return { name: coName([' Holding', ' Kliniken', ' Telekom', ' Immobilien']), sec: pick(['Klinikbetreiber', 'Kabelnetz', 'Gewerbeimmobilien', 'Kreuzfahrten']), news: pick(['Große Anleihe wird nächstes Jahr fällig', 'Übernahme auf Kredit vor zwei Jahren', 'Rating-Agentur senkt den Ausblick']), rows: r(pc(9, 13), pc(0.9, 1.5, 1), '+' + pc(2, 6) + ' %', m + ' %', (m + ri(-1, 1)) + ' %', pc(7, 10) + ' %', pc(5, 7, 1), pc(1.2, 1.8, 1) + '×', pc(4, 6, 1) + ' %', pc(70, 90) + ' %', pc(60, 90) + ' %'), why: 'Das Geschäft selbst ist in Ordnung, aber die Schulden betragen das Fünf- bis Siebenfache des operativen Ergebnisses und die Zinsen fressen fast alles auf. Eine teurere Refinanzierung reicht, und für Aktionäre bleibt nichts.' };
}
function dealStart() {
  const kinds = shuffle([...Object.keys(VERD), ...shuffle(Object.keys(VERD)).slice(0, 2)]);
  S = { kind: 'deal', i: 0, right: 0, pick: null, items: kinds.map(k => { const c = dealCase(k), others = shuffle(Object.keys(VERD).filter(x => x !== k)).slice(0, 3);
    return { q: 'Wie ordnest du die Aktie ein?', o: shuffle([{ t: VERD[k], ok: true }, ...others.map(x => ({ t: VERD[x] }))]), why: c.why,
      pre: `<div class="card"><div class="row spread"><div class="stack" style="gap:0"><h3>${esc(c.name)}</h3><span class="small muted">${c.sec}</span></div><span style="font-size:26px">🏢</span></div><div class="note">📰 ${c.news}</div><table class="mx">${c.rows.map(([l, v]) => `<tr><td>${l}</td><td class="mono" style="text-align:right">${v}</td></tr>`).join('')}</table></div>` }; }),
    finish() { S.done = true; B.deal.best = Math.max(B.deal.best || 0, S.right); B.deal.n = (B.deal.n || 0) + 1; S.xp = S.right * 6 + (S.right >= 7 ? 15 : 0); gainXP('boerse', S.xp); saveB(); } };
}
function viewDeal() {
  if (!S.done) return quizView('Schnäppchen oder Falle');
  return `${topBar('hub')}<div class="card" style="text-align:center"><span style="font-size:44px">${S.right >= 7 ? '🕵️' : S.right >= 5 ? '🔎' : '🙈'}</span><div class="big-num">${S.right} / 8</div><h2>${S.right >= 7 ? 'Scharfer Blick' : S.right >= 5 ? 'Meist durchschaut' : 'Die Fallen haben zugeschnappt'}</h2><p class="muted">Merkhilfe: erst Schulden und Cashflow, dann Marge gegen den langjährigen Schnitt, erst zum Schluss das KGV.</p><span class="xp">+${S.xp} XP</span></div>
  <button class="btn primary big" data-act="deal">Neue Firmen</button><button class="btn ghost big" data-act="go" data-v="">Zur Übersicht</button>`;
}

/* ================= 5 · Zeitmaschine ================= */
const SIM_YEARS = 8;
function simStart() {
  const nm = shuffle(NAME_A);
  const cos = shuffle([
    { k: 'qual', name: nm[0] + ' Med', sec: 'Medizintechnik', eps: 4, pe: 24, fair: 24, g: 0.1, vol: 0.05, news: ['Auftragsbuch voll', 'Neue Produktlinie läuft gut an', 'Wieder zweistellig gewachsen', 'Unauffälliges Jahr'] },
    { k: 'hype', name: nm[1] + '.ai', sec: 'KI-Plattform', eps: 1, pe: 95, fair: 32, g: 0.3, vol: 0.14, news: ['Analysten erhöhen das Kursziel erneut', '„Die nächste Billionenfirma?“', 'Wachstum verlangsamt sich etwas', 'Konkurrenz zieht mit eigenem Produkt nach'] },
    { k: 'trap', name: nm[2] + ' Warenhaus', sec: 'Kaufhauskette', eps: 6, pe: 6, fair: 5.5, g: -0.09, vol: 0.07, news: ['„So billig wie nie“', 'Neuer Chef verspricht die Wende', 'Weitere Filialen schließen', 'Dividende „vorerst stabil“'] },
    { k: 'deal', name: nm[3] + 'werk', sec: 'Spezialmaschinen', eps: 5, pe: 9, fair: 13, g: 0.05, vol: 0.06, news: ['Kaum jemand berichtet darüber', 'Solide Zahlen, wenig Fantasie', 'Erhöht still die Dividende', 'Großauftrag aus Asien'] },
    { k: 'cyc', name: nm[4] + ' Stahl', sec: 'Stahl', phase: Math.PI / 2, news: [] },
  ]);
  cos.forEach(c => { if (c.k === 'cyc') cycSet(c); else c.price = c.eps * c.pe; c.p0 = c.price; c.last = null; c.lastG = null; });
  S = { kind: 'sim', year: 1, cos, etf: 100, cash: 10000, val: 10000, alloc: {}, crash: ri(3, 6), hist: [10000], etfOnly: 10000, eq: 10000, log: null, minVal: 10000 };
  cos.forEach(c => { S.alloc[c.k] = 0; }); S.alloc.etf = 0;
}
// cyclical: earnings follow a six-year wave, the price runs ahead of them
function cycSet(c, noise = 0) { c.eps = 4 * (1 + 0.9 * Math.sin(c.phase)) + 0.3; c.price = 28 * (1 + 0.5 * Math.sin(c.phase + 0.9)) * (1 + noise); c.pe = c.price / c.eps; }
function simStep() {
  const crash = S.year === S.crash, rebound = S.year === S.crash + 1, rets = {};
  S.cos.forEach(c => {
    const p = c.price, e = c.eps;
    if (c.k === 'cyc') { c.phase += Math.PI / 3; cycSet(c, gauss() * 0.06); if (crash) c.price *= 0.75; }
    else {
      c.eps = Math.max(0.2, c.eps * (1 + c.g + gauss() * c.vol)); if (c.k === 'hype') c.g *= 0.72;
      c.pe = Math.max(3, c.pe + (c.fair - c.pe) * 0.3 + c.pe * gauss() * 0.07); if (crash) c.pe *= 0.68; if (rebound) c.pe *= 1.22;
      c.price = c.eps * c.pe;
    }
    c.last = c.price / p - 1; c.lastG = c.eps / e - 1; rets[c.k] = c.last;
  });
  const er = crash ? -0.3 : rebound ? 0.3 : 0.075 + gauss() * 0.09; rets.etf = er; S.etf *= 1 + er;
  const cashShare = 1 - Object.values(S.alloc).reduce((a, b) => a + b, 0) / 100;
  const total = Object.keys(S.alloc).reduce((s, k) => s + S.alloc[k] / 100 * rets[k], 0) + cashShare * 0.02;
  const before = S.val; S.val *= 1 + total; S.etfOnly *= 1 + er; S.eq *= 1 + (S.cos.reduce((s, c) => s + rets[c.k], 0) + er) / 6;
  S.hist.push(S.val); S.minVal = Math.min(S.minVal, S.val);
  S.log = { year: S.year, total, before, rets, crash, rebound, alloc: Object.assign({}, S.alloc), cashShare };
  S.year++; if (S.year > SIM_YEARS) simEnd();
}
function simEnd() {
  S.done = true; const beat = S.val > S.etfOnly; B.sim.n = (B.sim.n || 0) + 1; if (beat) B.sim.beat = (B.sim.beat || 0) + 1; B.sim.best = Math.max(B.sim.best || 0, Math.round(S.val));
  S.xp = 30 + (beat ? 30 : 0) + (S.val > 10000 ? 10 : 0); gainXP('boerse', S.xp); saveB();
}
const pct = (x, d = 0) => (x >= 0 ? '+' : '−') + nf(Math.abs(x) * 100, d) + ' %';
const col = x => `color:var(${x >= 0 ? '--calm' : '--rec'})`;
const spark = h => { const mx = Math.max(...h), mn = Math.min(...h), w = 300, hh = 60; return `<svg viewBox="0 0 ${w} ${hh}" style="width:100%;height:60px"><polyline fill="none" stroke="var(--calm)" stroke-width="2.5" stroke-linejoin="round" points="${h.map((v, i) => `${(i / Math.max(1, SIM_YEARS) * w).toFixed(0)},${(hh - 4 - (v - mn) / Math.max(1, mx - mn) * (hh - 8)).toFixed(1)}`).join(' ')}"/></svg>`; };
function viewSim() {
  if (S.done) return simResult();
  const free = 100 - Object.values(S.alloc).reduce((a, b) => a + b, 0), L = S.log;
  const headline = c => S.year - 1 === S.crash ? 'Im Crash mit abverkauft' : c.k === 'cyc' ? (Math.sin(c.phase) > 0.6 ? 'Rekordgewinne, Werke voll ausgelastet' : Math.sin(c.phase) < -0.6 ? 'Verluste, Kurzarbeit, Werke stehen still' : Math.cos(c.phase) < 0 ? 'Preise geben nach' : 'Nachfrage zieht langsam an') : c.news[(S.year - 1) % c.news.length];
  const rowA = (k, title, sub, facts) => `<div class="card flat" style="padding:14px;gap:8px"><div class="row spread"><div class="stack" style="gap:0"><b>${title}</b><span class="small muted">${sub}</span></div><div class="row" style="gap:6px"><button class="btn sm" data-act="sim-al" data-k="${k}" data-v="-10" ${S.alloc[k] <= 0 ? 'disabled' : ''}>−</button><span class="mono" style="min-width:46px;text-align:center;font-weight:700">${S.alloc[k]} %</span><button class="btn sm" data-act="sim-al" data-k="${k}" data-v="10" ${free <= 0 ? 'disabled' : ''}>+</button></div></div>${facts}</div>`;
  return `${topBar('hub')}<div class="row spread"><span class="eyebrow">Zeitmaschine · Jahr ${S.year} von ${SIM_YEARS}</span><span class="mono" style="font-weight:700">${nf(S.val)} €</span></div><div class="progress">${Array.from({ length: SIM_YEARS }, (_, i) => `<i class="${i < S.year - 1 ? 'ok' : i === S.year - 1 ? 'cur' : ''}"></i>`).join('')}</div>
  ${L ? `<div class="fb ${L.total >= 0 ? 'ok' : 'bad'}"><div class="stack" style="gap:4px"><b>Jahr ${L.year}: ${pct(L.total, 1)} (${nf(S.val - L.before)} €)</b><span>${L.crash ? '💥 Crash. Der Welt-ETF verliert 30 %, die Schlagzeilen sprechen vom Ende der Aktie. Was machst du jetzt?' : L.rebound ? '🌤️ Die Erholung kam schneller, als es irgendjemand erwartet hatte.' : 'Ein gewöhnliches Börsenjahr.'}</span></div></div>` : `<div class="note">Du hast <b>10.000 €</b> und acht Jahre. Verteile dein Geld in 10-%-Schritten, jedes Jahr neu. Was du nicht verteilst, liegt als Cash zu 2 %. Welche Firma welche Rolle spielt, erfährst du am Ende.</div>`}
  ${S.cos.map(c => rowA(c.k, esc(c.name), c.sec, `<div class="row wrap small" style="gap:6px 14px"><span>KGV <b class="mono">${c.pe > 60 ? nf(c.pe) : nf(c.pe, 1)}</b></span><span>Gewinn ${c.lastG == null ? '–' : `<b class="mono" style="${col(c.lastG)}">${pct(c.lastG)}</b>`}</span><span>Kurs ${c.last == null ? '–' : `<b class="mono" style="${col(c.last)}">${pct(c.last)}</b>`}</span></div><span class="small muted">📰 ${S.year === 1 && c.k === 'cyc' ? 'Rekordgewinne, Werke voll ausgelastet' : headline(c)}</span>`)).join('')}
  ${rowA('etf', 'Welt-ETF', 'Tausende Firmen, 0,2 % Kosten', `<span class="small muted">${L ? `Letztes Jahr <b class="mono" style="${col(L.rets.etf)}">${pct(L.rets.etf)}</b>` : 'Langfristig rund 7 % pro Jahr, mit Rückschlägen'}</span>`)}
  <div class="row spread"><span class="small muted">Cash: <b class="mono">${free} %</b></span><button class="link" data-act="sim-clear">Alles auf null</button></div>
  <button class="btn primary big" data-act="sim-go">${S.year === SIM_YEARS ? 'Letztes Jahr abspielen' : 'Ein Jahr vorspulen ⏩'}</button>`;
}
function simResult() {
  const beat = S.val > S.etfOnly, tot = c => c.price / c.p0 - 1, dd = S.minVal / 10000 - 1;
  const LESSON = { qual: ['Qualität', 'Hohes KGV, aber der Gewinn wuchs Jahr für Jahr mit. Die Bewertung blieb stabil, die Rendite kam aus dem Gewinnwachstum.'], hype: ['Hype', 'Die Firma wuchs wirklich stark. Trotzdem schmolz das KGV von 95 Richtung 30 zusammen und fraß das Wachstum auf. Ein gutes Geschäft zum falschen Preis.'], trap: ['Value-Falle', 'KGV 6 sah billig aus, aber der Gewinn schrumpfte jedes Jahr. Billig wurde nie billiger, nur kleiner.'], deal: ['Schnäppchen', 'Langweilig, günstig und solide. Der Gewinn wuchs gemächlich, und das KGV stieg von 9 Richtung 13: doppelter Rückenwind.'], cyc: ['Zykliker', 'Am Start stand das KGV bei 5, mitten im Gewinnhoch. Danach brachen die Gewinne ein. Am Tiefpunkt sah das KGV riesig aus, und genau dort lag die Kaufgelegenheit.'] };
  return `${topBar('hub')}<div class="card" style="text-align:center"><span style="font-size:44px">${beat ? '🚀' : S.val > 10000 ? '🙂' : '🥶'}</span><div class="big-num">${nf(S.val)} €</div><h2>${beat ? 'Du hast den ETF geschlagen' : S.val > 10000 ? 'Im Plus, aber hinter dem ETF' : 'Lehrgeld gezahlt'}</h2>${spark(S.hist)}
  <div class="stats"><div class="stat"><span class="small muted">Nur ETF</span><b>${nf(S.etfOnly)} €</b></div><div class="stat"><span class="small muted">Alles gleich verteilt</span><b>${nf(S.eq)} €</b></div><div class="stat"><span class="small muted">Dein Tiefpunkt</span><b>${dd < 0 ? pct(dd) : '–'}</b></div></div><span class="xp">+${S.xp} XP</span></div>
  <div class="card"><h3>Wer war wer?</h3>${S.cos.map(c => `<div class="note"><div class="row spread"><b>${esc(c.name)} · ${LESSON[c.k][0]}</b><b class="mono" style="${col(tot(c))}">${pct(tot(c))}</b></div><span class="muted">${LESSON[c.k][1]}</span></div>`).join('')}
  <div class="note"><div class="row spread"><b>Welt-ETF</b><b class="mono" style="${col(S.etf / 100 - 1)}">${pct(S.etf / 100 - 1)}</b></div><span class="muted">Inklusive Crash in Jahr ${S.crash}. Wer dort verkauft hat, hat die Erholung im Jahr darauf verpasst.</span></div></div>
  <div class="warnnote">Acht Jahre und eine Simulation sind eine Übung, kein Beweis. In echt kennt niemand die Rollen vorher, und Glück spielt eine große Rolle. ${B.sim.n} Durchläufe, davon ${B.sim.beat || 0} über dem ETF.</div>
  <button class="btn primary big" data-act="sim">Neue Zeitreise</button><button class="btn ghost big" data-act="go" data-v="">Zur Übersicht</button>`;
}

/* ================= Spickzettel + Hub ================= */
function viewRules() {
  return `${topBar('hub')}<div class="stack"><span class="eyebrow">Spickzettel</span><h1>📎 Faustregeln</h1><p class="muted">Die gängigen Regeln für Bewertung, Qualität und Depot, jeweils mit ihrem Haken. Faustregeln sortieren vor, sie ersetzen kein eigenes Urteil.</p></div>
  ${BX_RULES.map(([t, rows], i) => `<details class="card" ${i === 0 ? 'open' : ''}><summary>${t}</summary><div class="stack">${rows.map(([k, rule, but]) => `<div class="note"><b>${k}</b><br>${rule}<br><span class="muted">Haken: ${but}</span></div>`).join('')}</div></details>`).join('')}
  <div class="warnnote">Lernmaterial, keine Anlageberatung. Schwellenwerte unterscheiden sich je nach Branche und Zinsumfeld.</div>`;
}
function viewHub() {
  const passed = BX_LEVELS.filter(L => lvPassed(L.n)).length;
  const card = (act, v, em, t, sub, meta) => `<button class="card hub" data-act="${act}" data-v="${v}"><div class="row"><span class="em">${em}</span><div class="stack" style="gap:0"><h3>${t}</h3><span class="small muted">${sub}</span></div></div><span class="small muted">${meta}</span></button>`;
  return `${topBar('echo')}<div class="stack"><span class="eyebrow">Echo</span><h1>📈 Börsen-Akademie</h1><p class="muted">Unternehmen lesen, Kennzahlen im Kopf rechnen, Fallen erkennen. Alle Firmen sind erfunden.</p></div>
  <div class="card"><div class="row spread"><h3>Akademie</h3><span class="small muted">${passed} / ${BX_LEVELS.length} bestanden</span></div><div class="bar"><i style="width:${passed / BX_LEVELS.length * 100}%"></i></div>
  ${BX_LEVELS.map(L => { const r = B.lv[L.n] || {}, open = lvOpen(L.n); return `<button class="row hub" data-act="lv" data-v="${L.n}" style="background:none;padding:8px 0;${open ? '' : 'opacity:.5'}"><span style="font-size:24px;width:34px;text-align:center">${open ? L.em : '🔒'}</span><div class="stack grow" style="gap:0"><b>Level ${L.n} · ${L.name}</b><span class="small muted">${L.sub}</span></div><span class="small mono">${r.best != null && r.runs ? (r.best === 10 ? '⭐⭐⭐' : r.best >= 8 ? '⭐⭐' : r.best + '/10') : ''}</span></button>`; }).join('')}
  ${!B.open && passed < BX_LEVELS.length - 1 ? `<button class="link" data-act="unlock" style="justify-self:start">Alle Level freischalten</button>` : ''}</div>
  ${card('sim', '', '⏳', 'Zeitmaschine', 'Acht Börsenjahre in fünf Minuten: 10.000 € auf fünf Firmen und einen ETF verteilen', (B.sim.n || 0) + ' Zeitreisen · ' + (B.sim.beat || 0) + '× ETF geschlagen')}
  ${card('deal', '', '🕵️', 'Schnäppchen oder Falle', 'Steckbrief lesen und einordnen: günstig, Qualität, Value-Falle, Hype, Zykliker, Schuldenrisiko', 'Bestwert ' + (B.deal.best || 0) + ' / 8')}
  ${card('go', 'sprint', '⚡', 'Kennzahl-Sprint', '60 Sekunden Kopfrechnen in drei Stufen', 'Bestwerte ' + [1, 2, 3].map(n => B.sprint[n] || 0).join(' · '))}
  ${card('myth', '', '🦉', 'Mythos oder Regel', 'Börsenweisheiten: stimmt das oder ist es ein Märchen?', 'Bestwert ' + (B.myth.best || 0) + ' / 12')}
  ${card('go', 'regeln', '📎', 'Spickzettel', 'Faustregeln für Bewertung, Qualität, Kaufen und Biotech', 'Zum Nachschlagen')}
  <p class="small muted">Lernspiel, keine Anlageberatung.</p>`;
}

/* ================= routing + events ================= */
function render() {
  const r = route();
  if (S && S.kind !== (r.startsWith('lv') ? 'lv' : r)) { if (!(r === 'sprint' && S.kind === 'sprint')) { stopTick(); S = null; } }
  app.innerHTML = r === 'lv' && S ? viewLv() : r === 'myth' && S ? viewMyth() : r === 'sprint' ? viewSprint() : r === 'deal' && S ? viewDeal() : r === 'sim' && S ? viewSim() : r === 'regeln' ? viewRules() : viewHub();
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act, v = el.dataset.v;
  if (a === 'go') { e.preventDefault(); stopTick(); S = null; go(v); return; }
  if (a === 'lv') { if (!lvOpen(+v)) { toast(`Erst Level ${v - 1} mit 8 von 10 bestehen`); return; } lvStart(+v); go('lv'); window.scrollTo(0, 0); return; }
  if (a === 'unlock') { B.open = true; saveB(); render(); return; }
  if (a === 'ans') return quizAnswer(+v);
  if (a === 'next') return quizNext();
  if (a === 'myth') { mythStart(); go('myth'); return; }
  if (a === 'myth-ans') return mythAnswer(+v);
  if (a === 'myth-next') return mythNext();
  if (a === 'sprint') { sprintStart(+v); go('sprint'); return; }
  if (a === 'sp-ans') return sprintAnswer(v);
  if (a === 'sprint-quit') { stopTick(); S = null; render(); return; }
  if (a === 'deal') { dealStart(); go('deal'); window.scrollTo(0, 0); return; }
  if (a === 'sim') { simStart(); go('sim'); window.scrollTo(0, 0); return; }
  if (a === 'sim-al') { const k = el.dataset.k, free = 100 - Object.values(S.alloc).reduce((x, y) => x + y, 0), d = +v; if (d > 0 && free < d) return; S.alloc[k] = Math.max(0, S.alloc[k] + d); render(); return; }
  if (a === 'sim-clear') { Object.keys(S.alloc).forEach(k => { S.alloc[k] = 0; }); render(); return; }
  if (a === 'sim-go') { simStep(); render(); window.scrollTo(0, 0); return; }
});
render();
window.BX_TEST = { B, GEN, dealCase, VERD, get S() { return S; }, simStart, simStep };
