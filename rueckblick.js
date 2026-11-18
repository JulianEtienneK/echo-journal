/* Echo · Rückblick: a monthly and a yearly review from everything Echo keeps on this device.
   Reads IndexedDB 'echo-journal' (memos, goals, commitments) and localStorage (echo-games, echo-verlauf, echo-wege,
   echo-kompass, echo-stammbaum, echo-es). Own storage 'echo-rueckblick' = { [period]: {proud, release, note, at} }.
   Period in the hash: #2026-11 (month) or #2026 (year). */
'use strict';
const app = document.getElementById('app');
const R = Object.assign({}, LS.get('echo-rueckblick', {}));
const saveR = () => { R.updated = Date.now(); LS.set('echo-rueckblick', R); };
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const LABELS = { wordle: 'Wordle', rechnen: 'Kopfrechnen', quiz: 'Quiz', med: 'Medizin-Runden', mix: 'Tagesmix', kompass: 'Kompass', boerse: 'Börsen-Akademie', smalltalk: 'Smalltalk-Missionen', decide: 'Entscheidungen', 'wege-surf': 'Anker-Wellen', 'wege-lesson': 'Wege-Lektionen', 'wege-answer': 'Wege-Journal', 'verlauf-urge': 'Drang notiert', 'verlauf-checkin': 'Abend-Check-ins', stammbaum: 'Stammbaum', rest: 'Ruhen', klang: 'Klangwerk', iat: 'IAT', erlebnis: 'Erlebnisse', boost: 'Merk-Boost', vok: 'Spanisch-Vokabeln', gram: 'Spanisch-Grammatik', geo: 'Länderspiel', xw: 'Kreuzworträtsel' };
let D = null; // loaded data

/* ---------- loading ---------- */
function idbAll() {
  return new Promise(res => {
    let r; try { r = indexedDB.open('echo-journal'); } catch { return res({}); }
    r.onerror = () => res({});
    r.onsuccess = () => {
      const db = r.result, out = {}, names = ['memos', 'goals', 'commitments'].filter(n => db.objectStoreNames.contains(n));
      if (!names.length) return res(out);
      let left = names.length;
      for (const n of names) { const q = db.transaction(n).objectStore(n).getAll(); q.onsuccess = () => { out[n] = q.result || []; if (!--left) res(out); }; q.onerror = () => { out[n] = []; if (!--left) res(out); }; }
    };
  });
}
async function load() {
  const idb = await idbAll();
  D = { memos: (idb.memos || []).filter(m => m && m.day), goals: idb.goals || [], commits: idb.commitments || [],
    games: LS.get('echo-games', {}) || {}, verlauf: LS.get('echo-verlauf', {}) || {}, wege: LS.get('echo-wege', {}) || {},
    stamm: LS.get('echo-stammbaum', {}) || {}, es: LS.get('echo-es', {}) || {} };
}

/* ---------- period helpers ---------- */
const parseP = p => /^\d{4}-\d\d$/.test(p) ? { kind: 'm', y: +p.slice(0, 4), m: +p.slice(5) } : /^\d{4}$/.test(p) ? { kind: 'y', y: +p } : null;
const pad2 = n => String(n).padStart(2, '0');
const range = P => P.kind === 'm' ? [`${P.y}-${pad2(P.m)}-01`, dk(new Date(P.y, P.m, 0))] : [`${P.y}-01-01`, `${P.y}-12-31`];
const inR = (k, [a, b]) => k >= a && k <= b;
const prevP = P => P.kind === 'm' ? (P.m === 1 ? `${P.y - 1}-12` : `${P.y}-${pad2(P.m - 1)}`) : String(P.y - 1);
const nextP = P => P.kind === 'm' ? (P.m === 12 ? `${P.y + 1}-01` : `${P.y}-${pad2(P.m + 1)}`) : String(P.y + 1);
const title = P => P.kind === 'm' ? `${MONTHS[P.m - 1]} ${P.y}` : `Jahr ${P.y}`;
const defaultP = () => { const d = new Date(); return d.getDate() <= 5 ? (d.getMonth() === 0 ? `${d.getFullYear() - 1}-12` : `${d.getFullYear()}-${pad2(d.getMonth())}`) : today().slice(0, 7); };
const daysIn = ([a, b]) => { const out = []; for (let d = new Date(a + 'T12:00'); dk(d) <= b; d.setDate(d.getDate() + 1)) out.push(dk(d)); return out; };

/* ---------- goals (same rules as Echo's goal tab) ---------- */
const normGoal = it => Object.assign({ kind: 'count', tier: 'small', subs: [], days: [], target: 1, count: 0 }, it);
const gBoxes = it => it.kind === 'days' ? 7 : it.kind === 'check' ? it.subs.length : (it.target || 1);
const gTicked = it => it.kind === 'days' ? (it.days || []).filter(Boolean).length : it.kind === 'check' ? it.subs.filter(x => x.done).length : Math.min(it.count || 0, it.target || 1);
const gDone = it => gTicked(it) >= Math.min(gBoxes(it), it.need || gBoxes(it));

/* ---------- the numbers for one period ---------- */
function stats(p) {
  const P = parseP(p), rg = range(P), days = daysIn(rg), gd = D.games.days || {};
  const memos = D.memos.filter(m => inR(m.day, rg)), mins = Math.round(memos.reduce((a, m) => a + (+m.dur || 0), 0) / 60);
  const weeks = D.goals.filter(g => g.week && inR(g.week, rg)).sort((a, b) => a.week.localeCompare(b.week));
  const items = weeks.flatMap(w => (w.items || []).map(normGoal)), done = items.filter(gDone);
  const big = weeks.flatMap(w => (w.items || []).map(normGoal).filter(i => i.tier === 'big' || i.tier === 'mid').map(i => ({ ...i, week: w.week })));
  const xp = days.reduce((a, k) => a + ((gd[k] || {}).xp || 0), 0);
  const acts = {}; for (const k of days) for (const [key, v] of Object.entries(gd[k] || {})) if (key !== 'xp' && typeof v === 'number') acts[key] = (acts[key] || 0) + v;
  const W = D.wege, V = D.verlauf;
  const urges = [...(V.urges || []), ...(W.anker || []).map(a => ({ date: a.date, outcome: 'widerstanden', time: '' })), ...(W.lapses || []).map(a => ({ date: a.date, outcome: 'nachgegeben' }))].filter(u => u.date && inR(u.date, rg));
  const resisted = urges.filter(u => !/nach/i.test(u.outcome || '')).length;
  const vd = Object.entries(V.days || {}).filter(([k]) => inR(k, rg));
  const avg = f => { const a = vd.map(([, d]) => d[f]).filter(v => typeof v === 'number'); return a.length ? Math.round(mean(a) * 10) / 10 : null; };
  const activity = {}; for (const k of days) activity[k] = 0;
  for (const m of memos) activity[m.day] += 3;
  for (const k of days) activity[k] += Math.min(6, ((gd[k] || {}).xp || 0) / 60);
  for (const [k] of vd) activity[k] += 1;
  const active = days.filter(k => activity[k] > 0);
  let streak = 0, run = 0; for (const k of days) { run = activity[k] > 0 ? run + 1 : 0; streak = Math.max(streak, run); }
  const bestDay = active.slice().sort((a, b) => activity[b] - activity[a])[0] || null;
  const lessons = Object.values(W.done || {}).filter(d => typeof d === 'string' && inR(d, rg)).length;
  const hours = urges.map(u => parseInt(String(u.time || '').split(':')[0], 10)).filter(h => !isNaN(h));
  const peak = hours.length ? [...Array(24).keys()].map(h => [h, hours.filter(x => x === h).length]).sort((a, b) => b[1] - a[1])[0] : null;
  const longest = memos.slice().sort((a, b) => (+b.dur || 0) - (+a.dur || 0))[0];
  const commits = D.commits.filter(c => c.day && inR(c.day, rg)), cDone = commits.filter(c => c.done).length;
  return { P, rg, days, memos: memos.length, mins, weeks, items: items.length, done: done.length, big, xp, acts, urges: urges.length, resisted,
    mood: avg('mood'), sleep: avg('sleep'), phone: avg('phone_h'), focus: avg('focus'), happy: avg('happy'), checkins: vd.length,
    activity, active: active.length, streak, bestDay, lessons, peak, longest, commits: commits.length, cDone, vdays: vd };
}

/* ---------- pieces ---------- */
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
function delta(cur, prev, goodUp = true, unit = '') {
  if (cur === null || prev === null || cur === undefined || prev === undefined) return '';
  const d = Math.round((cur - prev) * 10) / 10; if (!d) return '<span class="dl">±0 zum Vorzeitraum</span>';
  const good = goodUp ? d > 0 : d < 0;
  return `<span class="dl ${good ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${String(Math.abs(d)).replace('.', ',')}${unit} zum Vorzeitraum</span>`;
}
const fmtH = h => { const t = Math.round(h * 60); return Math.floor(t / 60) + ' h ' + pad2(t % 60); };
function tile(label, value, sub, dl) { return `<div class="rt"><span class="eyebrow">${label}</span><b>${value}</b><span class="small muted">${sub || ''}</span>${dl || ''}</div>`; }

function heatmap(s) {
  const max = Math.max(1, ...Object.values(s.activity)), lvl = v => v <= 0 ? 0 : Math.min(4, Math.ceil(v / max * 4));
  if (s.P.kind === 'm') {
    const first = new Date(s.rg[0] + 'T12:00'), lead = (first.getDay() + 6) % 7;
    return `<div class="cal">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `<span class="cw">${d}</span>`).join('')}${'<span></span>'.repeat(lead)}${s.days.map(k => `<span class="cd l${lvl(s.activity[k])}" title="${fmtDay(k)}">${+k.slice(8)}</span>`).join('')}</div>`;
  }
  const first = new Date(s.rg[0] + 'T12:00'), lead = (first.getDay() + 6) % 7;
  return `<div class="yr">${'<span></span>'.repeat(lead)}${s.days.map(k => `<span class="yd l${lvl(s.activity[k])}" title="${fmtDay(k)}"></span>`).join('')}</div><div class="ym">${MONTHS.map(m => `<span>${m.slice(0, 3)}</span>`).join('')}</div>`;
}
function goalBars(s) {
  let rows;
  if (s.P.kind === 'm') rows = s.weeks.map(w => { const it = (w.items || []).map(normGoal); return { l: 'KW ab ' + w.week.slice(8) + '.' + w.week.slice(5, 7) + '.', d: it.filter(gDone).length, n: it.length }; });
  else rows = MONTHS.map((m, i) => { const ws = s.weeks.filter(w => +w.week.slice(5, 7) === i + 1), it = ws.flatMap(w => (w.items || []).map(normGoal)); return { l: m.slice(0, 3), d: it.filter(gDone).length, n: it.length }; });
  if (!rows.some(r => r.n)) return '<p class="small muted">In diesem Zeitraum gab es keine Wochenziele.</p>';
  return `<div class="bars">${rows.map(r => { const p = pct(r.d, r.n); return `<div class="br"><span class="small">${r.l}</span><div class="bt"><i style="width:${p || 0}%"></i></div><span class="mono small">${r.n ? `${r.d}/${r.n}` : '–'}</span></div>`; }).join('')}</div>`;
}
function bigGoals(s) {
  if (!s.big.length) return '';
  const L = s.big.slice(0, s.P.kind === 'm' ? 14 : 30);
  return `<div class="stack" style="gap:6px"><span class="eyebrow">Wichtige Ziele</span>${L.map(g => `<div class="row" style="gap:8px;align-items:flex-start"><span>${gDone(g) ? '✅' : '◯'}</span><span class="${gDone(g) ? '' : 'muted'}">${esc(g.text)}</span></div>`).join('')}${s.big.length > L.length ? `<span class="small muted">und ${s.big.length - L.length} weitere</span>` : ''}</div>`;
}
function spark(s, field, label, unit, goodUp) {
  const pts = s.vdays.filter(([, d]) => typeof d[field] === 'number').sort((a, b) => a[0].localeCompare(b[0]));
  if (pts.length < 2) return '';
  // weekly means keep the line calm
  const wk = {}; for (const [k, d] of pts) { const w = Math.floor((new Date(k + 'T12:00') - new Date(s.rg[0] + 'T12:00')) / 6048e5); (wk[w] = wk[w] || []).push(d[field]); }
  const vals = Object.keys(wk).map(Number).sort((a, b) => a - b).map(w => mean(wk[w]));
  const W = 160, H = 40, mx = Math.max(...vals), mn = Math.min(...vals), sp = mx - mn || 1;
  const pathD = vals.map((v, i) => `${i ? 'L' : 'M'}${(vals.length === 1 ? W / 2 : i / (vals.length - 1) * (W - 8) + 4).toFixed(1)} ${(H - 4 - (v - mn) / sp * (H - 8)).toFixed(1)}`).join('');
  const first = vals[0], last = vals[vals.length - 1], good = goodUp ? last >= first : last <= first;
  const show = v => field === 'phone_h' || field === 'work_h' ? fmtH(v) : String(Math.round(v)).replace('.', ',') + unit;
  return `<div class="sp"><span class="small">${label}</span><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label} pro Woche"><path d="${pathD}" fill="none" stroke="var(--calm)" stroke-width="2" stroke-linejoin="round"/><circle cx="${vals.length === 1 ? W / 2 : W - 4}" cy="${(H - 4 - (last - mn) / sp * (H - 8)).toFixed(1)}" r="3" fill="var(--calm)"/></svg><span class="mono small ${good ? 'up' : 'down'}">${show(first)} → ${show(last)}</span></div>`;
}
function activities(s) {
  const L = Object.entries(s.acts).filter(([k]) => k !== 'mix').sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!L.length) return '<p class="small muted">Keine Spiele oder Werkzeuge in diesem Zeitraum.</p>';
  const mx = L[0][1];
  return `<div class="bars">${L.map(([k, n]) => `<div class="br"><span class="small">${esc(LABELS[k] || k)}</span><div class="bt"><i style="width:${n / mx * 100}%;background:var(--gold)"></i></div><span class="mono small">${n}×</span></div>`).join('')}</div>`;
}
function highlights(s) {
  const H = [];
  if (s.bestDay) H.push(['🌟', 'Aktivster Tag', fmtDay(s.bestDay)]);
  if (s.streak > 1) H.push(['🔥', 'Längste Serie', `${s.streak} aktive Tage am Stück`]);
  if (s.longest && +s.longest.dur > 60) H.push(['🎙️', 'Längstes Memo', `${Math.round(+s.longest.dur / 60)} min am ${fmtDay(s.longest.day)}`]);
  if (s.lessons) H.push(['🪷', 'Wege-Lektionen', `${s.lessons} gelesen`]);
  if (s.urges) H.push(['🌊', 'Wellen geritten', `${s.resisted} von ${s.urges} Drangmomenten`]);
  if (s.peak && s.peak[1] > 1) H.push(['🕐', 'Drang kommt meist', `zwischen ${s.peak[0]} und ${s.peak[0] + 1} Uhr`]);
  if (s.commits) H.push(['🤝', 'Vorsätze aus Memos', `${s.cDone} von ${s.commits} erledigt`]);
  const persons = Object.keys((D.stamm || {}).p || {}).length; if (persons > 1 && s.P.kind === 'y') H.push(['🌳', 'Stammbaum', `${persons} Personen`]);
  if (!H.length) return '';
  return `<div class="hl">${H.map(([e, t, v]) => `<div class="hc"><span class="em">${e}</span><div class="stack" style="gap:0"><span class="small muted">${t}</span><b>${esc(v)}</b></div></div>`).join('')}</div>`;
}
function lead(s, pv) {
  const parts = [];
  if (s.items) parts.push(`${s.done} von ${s.items} Wochenzielen erreicht`);
  if (s.memos) parts.push(`${s.memos} Sprachmemos (${s.mins} min)`);
  if (s.active) parts.push(`an ${s.active} von ${s.days.length} Tagen aktiv`);
  if (!parts.length) return 'Für diesen Zeitraum hat Echo noch nichts gespeichert.';
  let t = parts.join(', ') + '.';
  if (s.urges) t += ` ${pct(s.resisted, s.urges)} % der Drangmomente hast du widerstanden.`;
  if (pv.items && s.items) { const a = pct(s.done, s.items), b = pct(pv.done, pv.items); if (a > b) t += ' Bei den Zielen besser als im Zeitraum davor.'; }
  return t;
}
function reflect(p, P) {
  const r = R[p] || {}, Q = P.kind === 'm'
    ? [['proud', 'Worauf bist du in diesem Monat stolz?'], ['release', 'Was lässt du im nächsten Monat los?'], ['note', 'Ein Satz an dein Ich in einem Monat']]
    : [['proud', 'Was war dein wichtigster Moment in diesem Jahr?'], ['release', 'Was nimmst du nicht mit ins nächste Jahr?'], ['note', 'Ein Satz an dein Ich in einem Jahr']];
  return `<section class="card" id="reflexion"><h3>Drei Fragen</h3>${Q.map(([k, q]) => `<label class="stack" style="gap:4px"><span class="small"><b>${q}</b></span><textarea class="input" id="q-${k}" rows="2">${esc(r[k] || '')}</textarea></label>`).join('')}
  <button class="btn primary" data-act="saveR">${r.at ? 'Aktualisieren' : `Speichern · +${P.kind === 'm' ? 100 : 300} XP`}</button>${r.at ? `<span class="small muted">Gespeichert am ${fmtDay(dk(new Date(r.at)))}</span>` : ''}</section>`;
}

/* ---------- page ---------- */
function render() {
  if (!D) { app.innerHTML = '<p class="muted">Lade …</p>'; return; }
  const p = parseP(location.hash.slice(1)) ? location.hash.slice(1) : defaultP(), P = parseP(p), s = stats(p), pv = stats(prevP(P));
  const nx = nextP(P), canNext = range(parseP(nx))[0] <= today();
  app.innerHTML = `<div class="topbar"><a class="link" href="index.html#tracking">← Tracking</a><span class="xp">${LS.get('echo-games', {}).xp || 0} XP</span></div>
  <div class="stack"><span class="eyebrow">Rückblick</span>
    <div class="row spread"><button class="btn ghost sm" data-act="go" data-v="${prevP(P)}" aria-label="Vorheriger Zeitraum">‹</button><h1 style="margin:0;text-align:center">${title(P)}</h1><button class="btn ghost sm" data-act="go" data-v="${nx}" ${canNext ? '' : 'disabled'} aria-label="Nächster Zeitraum">›</button></div>
    <div class="chips" style="justify-content:center"><button class="chip" data-act="go" data-v="${P.kind === 'm' ? p : defaultP().slice(0, 4) === String(P.y) ? defaultP() : P.y + '-12'}" aria-pressed="${P.kind === 'm'}">Monat</button><button class="chip" data-act="go" data-v="${P.y}" aria-pressed="${P.kind === 'y'}">Jahr</button></div>
    <p class="muted" style="text-align:center">${esc(lead(s, pv))}</p></div>

  <section class="rtiles">
    ${tile('Ziele erreicht', s.items ? pct(s.done, s.items) + ' %' : '–', s.items ? `${s.done} von ${s.items}` : 'keine Ziele', delta(pct(s.done, s.items), pct(pv.done, pv.items), true, ' Pkt.'))}
    ${tile('Sprachmemos', s.memos, `${s.mins} min gesprochen`, delta(s.memos, pv.memos))}
    ${tile('Aktive Tage', s.active, `von ${s.days.length}`, delta(s.active, pv.active))}
    ${tile('XP', s.xp.toLocaleString('de-DE'), 'gesammelt', delta(s.xp, pv.xp))}
    ${tile('Drang widerstanden', s.urges ? pct(s.resisted, s.urges) + ' %' : '–', s.urges ? `${s.resisted} von ${s.urges}` : 'nichts eingetragen', delta(s.urges ? pct(s.resisted, s.urges) : null, pv.urges ? pct(pv.resisted, pv.urges) : null, true, ' Pkt.'))}
    ${tile('Ø Zufriedenheit', s.happy === null ? '–' : String(s.happy).replace('.', ','), s.checkins ? `${s.checkins} Check-ins` : 'kein Check-in', delta(s.happy, pv.happy))}
  </section>

  <section class="card" id="kalender"><h3>Wann du da warst</h3>${heatmap(s)}<div class="row small muted" style="gap:6px">weniger <span class="cd l1 lg"></span><span class="cd l2 lg"></span><span class="cd l3 lg"></span><span class="cd l4 lg"></span> mehr · Memos, XP und Check-ins zusammen</div></section>

  <section class="card" id="ziele"><h3>Ziele</h3>${goalBars(s)}${bigGoals(s)}</section>

  ${(() => { const sp = [spark(s, 'sleep', 'Schlaf', '', true), spark(s, 'focus', 'Konzentration', '', true), spark(s, 'happy', 'Zufriedenheit', '', true), spark(s, 'phone_h', 'Handyzeit', '', false), spark(s, 'work_h', 'Arbeitszeit', '', true)].filter(Boolean); return sp.length ? `<section class="card" id="trends"><h3>Trends</h3><p class="small muted">Wochenmittel aus deinem Abend-Check-in, erste → letzte Woche</p><div class="sps">${sp.join('')}</div></section>` : ''; })()}

  <section class="card" id="echo"><h3>Was du in Echo gemacht hast</h3>${activities(s)}</section>

  ${highlights(s) ? `<section class="card" id="highlights"><h3>Highlights</h3>${highlights(s)}</section>` : ''}

  ${reflect(p, P)}`;
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'go') { location.hash = b.dataset.v; return; }
  if (b.dataset.act === 'saveR') {
    const p = parseP(location.hash.slice(1)) ? location.hash.slice(1) : defaultP(), P = parseP(p), first = !(R[p] && R[p].at);
    R[p] = { proud: document.getElementById('q-proud').value.trim(), release: document.getElementById('q-release').value.trim(), note: document.getElementById('q-note').value.trim(), at: Date.now() };
    saveR(); if (first) gainXP('rueckblick', P.kind === 'm' ? 100 : 300); toast(first ? `Gespeichert · +${P.kind === 'm' ? 100 : 300} XP` : 'Aktualisiert'); render();
  }
});
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
render(); load().then(render);
window.RB_TEST = { stats, parseP };
