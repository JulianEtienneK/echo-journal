/* Echo · Verlauf: cravings (spontaneous) and an evening check-in, drawn over time.
   Storage 'echo-verlauf' = { urges: [{id, date, time, strength, target, note, outcome}], days: {date: {phone_h, work_h, move_min, med_min, sleep, mood, energy, focus, happy}}, show, range }.
   Anker uses and lapses from 'echo-wege' join the craving list automatically.
   A link with #import=<base64url JSON {urges, days}> merges entries (Claude can send those from the chat).
   Unit series (hours, minutes, counts) are scaled so their running average sits at 50; the scale follows slowly (EMA). 0–100 series stay as they are. */
'use strict';
const app = document.getElementById('app');
const V = Object.assign({ urges: [], days: {}, show: null, range: 30 }, LS.get('echo-verlauf', {}));
const save = () => { V.updated = Date.now(); LS.set('echo-verlauf', V); };
const SERIES = [
  // key, label, kind ('pct' = 0–100 as is, 'unit' = scaled), unit text, color, floor for the running average
  ['urges', 'Drang (Anzahl)', 'unit', '×', '#C06C84', 1],
  ['strength', 'Drang-Stärke', 'pct10', '/10', '#E07A5F', 0],
  ['phone_h', 'Handyzeit', 'unit', 'h', '#5B8DEF', 0.5],
  ['sleep', 'Schlaf', 'pct', '', '#8E7CC3', 0],
  ['mood', 'Stimmung', 'pct', '', '#3BA99C', 0],
  ['energy', 'Energie', 'pct', '', '#D4A017', 0],
  ['focus', 'Konzentration', 'pct', '', '#2A9D8F', 0],
  ['happy', 'Zufriedenheit', 'pct', '', '#6C9A3B', 0],
  ['work_h', 'Arbeitsstunden', 'unit', 'h', '#7A8B99', 1],
  ['move_min', 'Bewegung', 'unit', 'min', '#E9A23B', 10],
  ['med_min', 'Meditation', 'unit', 'min', '#9C6ADE', 5],
];
const S = Object.fromEntries(SERIES.map(s => [s[0], s]));
if (!V.show) V.show = { urges: true, phone_h: true, sleep: true, mood: true };
const PCT = [['sleep', 'Schlaf (inkl. Einschlafen, Aufstehen, wie erholt)'], ['mood', 'Stimmung'], ['energy', 'Energie'], ['focus', 'Konzentration'], ['happy', 'Zufriedenheit']];
const NUMS = [['phone_h', 'Handyzeit', 'h', 0.25], ['work_h', 'Arbeitszeit', 'h', 0.25], ['move_min', 'Bewegung', 'min', 5], ['med_min', 'Meditation', 'min', 5]];
const HM = ['phone_h', 'work_h'];
const hm = h => { const t = Math.round(h * 60); return Math.floor(t / 60) + ' h' + (t % 60 ? ' ' + (t % 60) + ' min' : ''); };
const num = v => (v === null || v === undefined || v === '' || isNaN(+v)) ? null : +v;
const gave = o => /nach|gave/i.test(String(o || ''));
const now = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
// the evening check-in belongs to the day that is ending: before 5 am it is still yesterday
const checkinDay = () => new Date().getHours() < 5 ? addDays(-1) : today();
let draft = { strength: 5, target: 'YouTube', outcome: 'widerstanden', note: '', date: null, time: null }, ciDay = null, tipT = null;
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const dayLabel = (k, i) => i === 0 ? 'Heute' : i === 1 ? 'Gestern' : WD[new Date(k + 'T12:00').getDay()] + ' ' + k.slice(8) + '.';

/* ---------- data ---------- */
function allUrges() {
  const W = LS.get('echo-wege', {}) || {};
  const tm = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const fromAnker = (W.anker || []).map(a => ({ id: 'a' + a.ts, date: a.date, time: tm(a.ts), strength: null, target: 'Anker', note: [a.why, a.choice].filter(Boolean).join(' · '), outcome: 'widerstanden', src: 'Anker' }));
  const fromLapse = (W.lapses || []).map(a => ({ id: 'l' + a.ts, date: a.date, time: tm(a.ts), strength: null, target: 'Ausrutscher', note: a.why || '', outcome: 'nachgegeben', src: 'Anker' }));
  return [...V.urges, ...fromAnker, ...fromLapse];
}
function dailyRows(n) {
  const U = allUrges(), out = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(-i), us = U.filter(u => u.date === k), d = V.days[k] || {};
    const st = us.map(u => num(u.strength)).filter(v => v !== null);
    const g = us.filter(u => gave(u.outcome)).length;
    out.push({ date: k, urges: us.length, gave: g, resisted: us.length - g, strength: st.length ? Math.round(mean(st) * 10) / 10 : null,
      ...Object.fromEntries(['phone_h', 'work_h', 'move_min', 'med_min', 'sleep', 'mood', 'energy', 'focus', 'happy'].map(f => [f, num(d[f])])) });
  }
  return out;
}
// scale a unit series: EMA of its logged values (from the very first entry, not only the visible window) maps to 50
function scaled(key, rows) {
  const s = S[key];
  if (s[2] === 'pct') return rows.map(r => r[key]);
  if (s[2] === 'pct10') return rows.map(r => r[key] === null ? null : r[key] * 10);
  const first = Object.keys(V.days).concat(allUrges().map(u => u.date)).sort()[0];
  const hist = first ? dailyRowsFrom(first) : [];
  let ema = null; const refAt = {};
  for (const r of hist) {
    const v = key === 'urges' ? (r.urges || null) : r[key];
    if (v !== null && v > 0) ema = ema === null ? v : ema * 0.85 + v * 0.15;
    refAt[r.date] = Math.max(s[5], ema === null ? s[5] : ema);
  }
  return rows.map(r => { const v = key === 'urges' ? (r.urges || (V.days[r.date] ? 0 : null)) : r[key]; if (v === null) return null; return Math.min(100, v / (refAt[r.date] || s[5]) * 50); });
}
function dailyRowsFrom(first) {
  const n = Math.min(400, Math.round((new Date(today() + 'T12:00') - new Date(first + 'T12:00')) / 864e5) + 1);
  return dailyRows(Math.max(1, n));
}

/* ---------- views ---------- */
function summary() {
  const r7 = dailyRows(7), n = r7.reduce((a, r) => a + r.urges, 0), res = r7.reduce((a, r) => a + r.resisted, 0);
  const st = r7.filter(r => r.strength !== null), tdy = r7[6];
  if (!n && !Object.keys(V.days).length) return 'Noch nichts eingetragen. Trag unten einen Drang ein, sobald er kommt, und abends kurz deine Tageswerte.';
  return `Letzte 7 Tage: ${n} Drangmomente${n ? `, ${Math.round(res / n * 100)} % widerstanden` : ''}${st.length ? `, Ø Stärke ${String(Math.round(mean(st.map(r => r.strength)) * 10) / 10).replace('.', ',')}` : ''}. Heute bisher: ${tdy.urges}.`;
}
function viewMain() {
  const day = ciDay || checkinDay(), done = V.days[day], base0 = checkinDay();
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(-i, new Date(base0 + 'T12:00')));
  return `<div class="topbar"><a class="link" href="index.html#tracking">← Tracking</a><span class="xp">${LS.get('echo-games', {}).xp || 0} XP</span></div>
  <div class="stack"><span class="eyebrow">Echo</span><h1>📈 Tracking</h1><p class="muted">${esc(summary())}</p></div>

  <section class="card" id="drang"><div class="row spread"><h3>Drang jetzt</h3><span class="small muted">${now()} Uhr</span></div>
    <label class="stack" style="gap:2px"><span class="small muted">Stärke: <b id="sv">${draft.strength}</b> / 10</span><input type="range" id="str" min="1" max="10" value="${draft.strength}"></label>
    <div class="chips">${['YouTube', 'Handy', 'Anderes'].map(t => `<button class="chip" data-act="tgt" data-v="${t}" aria-pressed="${draft.target === t}">${t}</button>`).join('')}</div>
    <div class="chips">${['widerstanden', 'nachgegeben'].map(t => `<button class="chip" data-act="out" data-v="${t}" aria-pressed="${draft.outcome === t}">${t}</button>`).join('')}</div>
    <input class="input" id="note" placeholder="Zustand oder Grund (optional), z. B. müde nach dem Essen" value="${esc(draft.note)}">
    <details${draft.date ? ' open' : ''}><summary class="small muted" style="cursor:pointer">Nachtragen: anderer Tag oder andere Uhrzeit</summary>
      <div class="vgrid" style="margin-top:8px"><input class="input" type="date" id="udate" max="${today()}" value="${draft.date || today()}"><input class="input" type="time" id="utime" value="${draft.time || now()}"></div></details>
    <button class="btn primary" data-act="urge">Drang eintragen</button>
    <span class="small muted">Lieber surfen statt nur notieren? <a class="link" href="wege.html#anker">Zum Anker</a>, der zählt automatisch mit.</span></section>

  <section class="card" id="abend"><div class="row spread"><h3>Abend-Check-in</h3><span class="small muted">${fmtDay(day)}${done ? ' · gespeichert ✓' : ''}</span></div>
    <div class="chips">${last7.map((k, i) => `<button class="chip" data-act="ciday" data-v="${k}" aria-pressed="${k === day}">${dayLabel(k, i)}${V.days[k] ? ' ✓' : ''}</button>`).join('')}</div>
    <label class="row small muted" style="gap:8px">Älterer Tag: <input class="input" type="date" id="ciold" max="${base0}" value="${last7.includes(day) ? '' : day}" style="width:auto;padding:6px 10px"></label>
    <div class="vgrid">${NUMS.map(([k, l, u, st]) => HM.includes(k) ? (() => { const t = done && done[k] != null ? Math.round(done[k] * 60) : null; return `<div class="stack" style="gap:2px"><span class="small muted">${l}</span><div class="row" style="gap:6px"><input class="input" type="text" inputmode="numeric" id="n-${k}h" value="${t === null ? '' : Math.floor(t / 60)}" placeholder="h" aria-label="${l} Stunden"><span class="small muted">h</span><input class="input" type="text" inputmode="numeric" id="n-${k}m" value="${t === null ? '' : t % 60}" placeholder="min" aria-label="${l} Minuten"><span class="small muted">min</span></div></div>`; })() : `<label class="stack" style="gap:2px"><span class="small muted">${l} (${u})</span><input class="input" type="text" inputmode="decimal" id="n-${k}" value="${done && done[k] != null ? String(Math.round(done[k] * 100) / 100).replace('.', ',') : ''}" placeholder="–"></label>`).join('')}</div>
    ${PCT.map(([k, l]) => { const v = done && done[k] != null ? done[k] : null; return `<div class="stack" style="gap:2px"><div class="row spread"><label class="small muted" for="p-${k}">${l}: <b id="pv-${k}">${v === null ? 'nicht erfasst' : v}</b></label><button class="btn ghost sm vreset" data-act="preset" data-v="${k}" aria-label="${l} zurücksetzen" title="Zurücksetzen">↺</button></div><input type="range" id="p-${k}" min="0" max="100" step="5" value="${v === null ? 50 : v}" data-set="${v === null ? 0 : 1}"></div>`; }).join('')}
    <button class="btn primary" data-act="ci">${done ? 'Aktualisieren' : 'Speichern'}</button>
    <span class="small muted">Leere Felder und unberührte Regler bleiben „nicht erfasst“ und erscheinen nicht im Verlauf. ↺ setzt einen Regler zurück.</span></section>

  <section class="card" id="alles"><div class="row spread" style="flex-wrap:wrap;gap:8px"><h3>Alles im Verlauf</h3><div class="chips">${[14, 30, 90].map(n => `<button class="chip" data-act="range" data-v="${n}" aria-pressed="${V.range === n}">${n} T</button>`).join('')}</div></div>
    <div class="chips">${SERIES.map(([k, l, , , c]) => `<button class="chip" data-act="ser" data-v="${k}" aria-pressed="${!!V.show[k]}"><i class="dot" style="background:${c}"></i>${l}</button>`).join('')}</div>
    <div class="vchart" id="c-all" data-noswipe></div>
    <span class="small muted">0–100-Werte stehen, wie du sie einträgst. Stunden, Minuten und Anzahl sind auf deinen eigenen Durchschnitt skaliert: Ø = 50, und der Maßstab passt sich langsam an. Tippen zeigt die echten Werte.</span></section>

  <section class="card" id="proTag"><h3>Drang pro Tag</h3>
    <div class="chips small"><span><i class="dot" style="background:var(--calm)"></i>widerstanden</span><span><i class="dot" style="background:var(--muted)"></i>nachgegeben</span><span><i class="dot" style="background:#E07A5F"></i>Ø Stärke</span></div>
    <div class="vchart" id="c-urges" data-noswipe></div></section>

  <section class="card" id="uhrzeit"><h3>Wann kommt der Drang?</h3><div class="vchart" id="c-hours" data-noswipe style="min-height:150px"></div></section>

  <section class="card" id="liste"><h3>Letzte Drangmomente</h3>${urgeList()}</section>`;
}
function urgeList() {
  const L = allUrges().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))).slice(0, 12);
  if (!L.length) return '<p class="small muted">Noch keine Einträge.</p>';
  return L.map(u => `<div class="vrow"><div class="vmain"><span class="mono small muted">${fmtDay(u.date).replace(/ \d+$/, '')} · ${esc(u.time || '')}</span><span>${u.strength != null ? `<b>${u.strength}</b>/10 · ` : ''}${esc(u.target || '')}</span>${u.note ? `<span class="small muted">${esc(u.note)}</span>` : ''}</div><span class="pill ${gave(u.outcome) ? '' : 'ok'}">${esc(u.outcome || '')}</span>${u.src ? '<span class="small muted">Anker</span>' : `<button class="btn ghost sm" data-act="del" data-v="${esc(u.id)}" aria-label="Löschen">✕</button>`}</div>`).join('');
}

/* ---------- charts (plain SVG, sized from the container) ---------- */
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
function base(el, h) {
  el.innerHTML = ''; const W = Math.max(280, el.clientWidth), svg = mk('svg', { viewBox: `0 0 ${W} ${h}`, width: '100%', role: 'img' }, el);
  const tip = document.createElement('div'); tip.className = 'vtip'; tip.hidden = true; el.appendChild(tip);
  return { W, h, svg, tip, m: { l: 30, r: 12, t: 10, b: 24 } };
}
function xAxis(f, rows, x) {
  const step = Math.max(1, Math.ceil(rows.length / Math.floor((f.W - 60) / 52)));
  rows.forEach((r, i) => { if (i % step && i !== rows.length - 1) return; const t = mk('text', { x: x(i), y: f.h - 6, 'text-anchor': 'middle', class: 'vax' }, f.svg); t.textContent = r.date.slice(8) + '.' + r.date.slice(5, 7) + '.'; });
}
function yGrid(f, ticks, y, fmt = v => v) {
  ticks.forEach(v => { mk('line', { x1: f.m.l, x2: f.W - f.m.r, y1: y(v), y2: y(v), class: 'vgridl' }, f.svg); const t = mk('text', { x: f.m.l - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'vax' }, f.svg); t.textContent = fmt(v); });
}
function hoverZones(f, rows, x, lines) {
  const w = (f.W - f.m.l - f.m.r) / rows.length;
  rows.forEach((r, i) => {
    const z = mk('rect', { x: x(i) - w / 2, y: f.m.t, width: w, height: f.h - f.m.t - f.m.b, fill: 'transparent' }, f.svg);
    const show = () => { f.tip.hidden = false; f.tip.innerHTML = `<b>${fmtDay(r.date)}</b>` + lines(r).map(s => `<div>${s}</div>`).join(''); const px = x(i) / f.W * f.svg.clientWidth; f.tip.style.left = Math.max(0, Math.min(px - 70, f.svg.clientWidth - 160)) + 'px'; clearTimeout(tipT); tipT = setTimeout(() => { f.tip.hidden = true; }, 4000); };
    z.addEventListener('mousemove', show); z.addEventListener('click', show);
  });
  f.svg.addEventListener('mouseleave', () => { f.tip.hidden = true; });
}
function drawAll() {
  const el = document.getElementById('c-all'); if (!el) return;
  const rows = dailyRows(V.range), f = base(el, 230), keys = SERIES.map(s => s[0]).filter(k => V.show[k]);
  const x = i => f.m.l + 8 + i * (f.W - f.m.l - f.m.r - 16) / Math.max(1, rows.length - 1), y = v => f.m.t + (100 - v) / 100 * (f.h - f.m.t - f.m.b);
  yGrid(f, [0, 50, 100], y); xAxis(f, rows, x);
  f.svg.setAttribute('aria-label', 'Liniendiagramm aller ausgewählten Werte im Zeitverlauf');
  for (const k of keys) {
    const vals = scaled(k, rows), c = S[k][4]; let d = '';
    vals.forEach((v, i) => { if (v === null) return; d += (d && vals[i - 1] !== null && i > 0 ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); });
    if (d) mk('path', { d, fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linejoin': 'round' }, f.svg);
    vals.forEach((v, i) => { if (v !== null) mk('circle', { cx: x(i), cy: y(v), r: rows.length > 45 ? 1.8 : 3, fill: c }, f.svg); });
  }
  if (!keys.length) { const t = mk('text', { x: f.W / 2, y: f.h / 2, 'text-anchor': 'middle', class: 'vax' }, f.svg); t.textContent = 'Oben Werte auswählen'; }
  const real = (r, k) => { const v = k === 'urges' ? r.urges : r[k]; if (v === null || v === undefined) return '–'; if (HM.includes(k)) return hm(v); const s = S[k]; return s[2] === 'pct' ? v : String(v).replace('.', ',') + ' ' + s[3]; };
  hoverZones(f, rows, x, r => keys.map(k => `<i class="dot" style="background:${S[k][4]}"></i>${S[k][1]}: ${real(r, k)}`));
}
function drawUrges() {
  const el = document.getElementById('c-urges'); if (!el) return;
  const rows = dailyRows(Math.min(V.range, 30)), f = base(el, 200), max = Math.max(3, ...rows.map(r => r.urges));
  const pw = f.W - f.m.l - f.m.r - 30, x = i => f.m.l + 10 + (i + .5) * pw / rows.length, y = v => f.m.t + (max - v) / max * (f.h - f.m.t - f.m.b), ys = v => f.m.t + (10 - v) / 10 * (f.h - f.m.t - f.m.b);
  yGrid(f, [0, Math.round(max / 2), max], y); xAxis(f, rows, x);
  [0, 5, 10].forEach(v => { const t = mk('text', { x: f.W - 4, y: ys(v) + 4, 'text-anchor': 'end', class: 'vax' }, f.svg); t.textContent = v; });
  f.svg.setAttribute('aria-label', 'Balkendiagramm Drangmomente pro Tag mit Stärke');
  const bw = Math.max(3, Math.min(20, pw / rows.length - 3));
  rows.forEach((r, i) => {
    if (r.resisted) mk('rect', { x: x(i) - bw / 2, y: y(r.resisted), width: bw, height: y(0) - y(r.resisted), rx: 2, fill: 'var(--calm)' }, f.svg);
    if (r.gave) mk('rect', { x: x(i) - bw / 2, y: y(r.urges), width: bw, height: y(r.resisted) - y(r.urges), rx: 2, fill: 'var(--muted)', opacity: .55 }, f.svg);
  });
  let d = ''; rows.forEach((r, i) => { if (r.strength === null) return; d += (d ? 'L' : 'M') + x(i).toFixed(1) + ' ' + ys(r.strength).toFixed(1); mk('circle', { cx: x(i), cy: ys(r.strength), r: 3, fill: '#E07A5F' }, f.svg); });
  if (d) mk('path', { d, fill: 'none', stroke: '#E07A5F', 'stroke-width': 1.5 }, f.svg);
  hoverZones(f, rows, x, r => [`${r.urges} Drang (${r.resisted} widerstanden)`, r.strength !== null ? `Ø Stärke ${String(r.strength).replace('.', ',')}` : 'keine Stärke']);
}
function drawHours() {
  const el = document.getElementById('c-hours'); if (!el) return;
  const U = allUrges(), cnt = Array.from({ length: 24 }, (_, h) => U.filter(u => parseInt(String(u.time || '').split(':')[0], 10) === h).length);
  const f = base(el, 150), max = Math.max(2, ...cnt), pw = f.W - f.m.l - f.m.r, bw = pw / 24;
  const y = v => f.m.t + (max - v) / max * (f.h - f.m.t - f.m.b);
  yGrid(f, [0, max], y); f.svg.setAttribute('aria-label', 'Balkendiagramm Drangmomente nach Uhrzeit');
  cnt.forEach((c, h) => {
    if (c) mk('rect', { x: f.m.l + h * bw + 1, y: y(c), width: bw - 2, height: y(0) - y(c), rx: 2, fill: 'var(--calm)' }, f.svg);
    if (h % 6 === 0 || h === 23) { const t = mk('text', { x: f.m.l + h * bw + bw / 2, y: f.h - 6, 'text-anchor': 'middle', class: 'vax' }, f.svg); t.textContent = h + ' h'; }
  });
  const rows = cnt.map((c, h) => ({ c, h })), x = i => f.m.l + i * bw + bw / 2;
  rows.forEach((r, i) => { const z = mk('rect', { x: x(i) - bw / 2, y: f.m.t, width: bw, height: f.h - f.m.t - f.m.b, fill: 'transparent' }, f.svg); const show = () => { f.tip.hidden = false; f.tip.textContent = `${r.h}–${r.h + 1} Uhr: ${r.c}`; f.tip.style.left = Math.max(0, Math.min(x(i) / f.W * f.svg.clientWidth - 40, f.svg.clientWidth - 110)) + 'px'; }; z.addEventListener('mousemove', show); z.addEventListener('click', show); });
}
function render() { app.innerHTML = viewMain(); drawAll(); drawUrges(); drawHours(); }
const jumpTo = location.hash.replace(/^#/, '');

/* ---------- events ---------- */
app.addEventListener('input', e => {
  if (e.target.id === 'str') { draft.strength = +e.target.value; document.getElementById('sv').textContent = draft.strength; }
  if (e.target.id === 'note') draft.note = e.target.value;
  if (e.target.id === 'udate') draft.date = e.target.value;
  if (e.target.id === 'utime') draft.time = e.target.value;
  if (e.target.id === 'ciold' && /^\d{4}-\d\d-\d\d$/.test(e.target.value) && e.target.value <= checkinDay()) { ciDay = e.target.value; render(); document.getElementById('abend').scrollIntoView({ block: 'start' }); }
  const m = e.target.id.match(/^p-(\w+)$/); if (m) { e.target.dataset.set = '1'; document.getElementById('pv-' + m[1]).textContent = e.target.value; }
});
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const v = b.dataset.v;
  switch (b.dataset.act) {
    case 'tgt': draft.target = v; b.parentNode.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); break;
    case 'out': draft.outcome = v; b.parentNode.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); break;
    case 'urge': {
      const ud = document.getElementById('udate'), ut = document.getElementById('utime'), dOk = ud && /^\d{4}-\d\d-\d\d$/.test(ud.value) && ud.value <= today(), tOk = ut && /^\d\d:\d\d$/.test(ut.value);
      V.urges.push({ id: uid(), date: dOk ? ud.value : today(), time: tOk ? ut.value : now(), strength: draft.strength, target: draft.target, note: draft.note.trim(), outcome: draft.outcome });
      save(); gainXP('verlauf-urge', 10); toast(draft.outcome === 'widerstanden' ? 'Eingetragen · Welle geritten 🌊 +10 XP' : 'Eingetragen · Datenpunkt, kein Rückfall. +10 XP');
      draft.note = ''; draft.date = null; draft.time = null; render(); break;
    }
    case 'ci': {
      const day = ciDay || checkinDay(), first = !V.days[day], d = Object.assign({}, V.days[day]);
      for (const [k] of NUMS) { let val; if (HM.includes(k)) { const hh = num(document.getElementById('n-' + k + 'h').value.replace(',', '.')), mm = num(document.getElementById('n-' + k + 'm').value.replace(',', '.')); val = hh === null && mm === null ? null : Math.round(((hh || 0) + (mm || 0) / 60) * 100) / 100; } else val = num(document.getElementById('n-' + k).value.replace(',', '.')); if (val === null) delete d[k]; else d[k] = val; }
      for (const [k] of PCT) { const el = document.getElementById('p-' + k); if (el.dataset.set === '1') d[k] = +el.value; else delete d[k]; }
      V.days[day] = d; save(); if (first) gainXP('verlauf-checkin', 30); toast(first ? 'Check-in gespeichert · +30 XP' : 'Aktualisiert'); render(); break;
    }
    case 'preset': { const el = document.getElementById('p-' + v); el.dataset.set = '0'; el.value = 50; document.getElementById('pv-' + v).textContent = 'nicht erfasst'; break; }
    case 'ciday': ciDay = v === checkinDay() ? null : v; render(); document.getElementById('abend').scrollIntoView({ block: 'start' }); break;
    case 'ser': V.show[v] = !V.show[v]; save(); b.setAttribute('aria-pressed', !!V.show[v]); drawAll(); break;
    case 'range': V.range = +v; save(); render(); break;
    case 'del': V.urges = V.urges.filter(u => u.id !== v); save(); render(); break;
  }
});

/* ---------- import from a link ---------- */
(() => {
  const h = location.hash.replace(/^#/, ''); if (!h.startsWith('import=')) return;
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob(h.slice(7).replace(/-/g, '+').replace(/_/g, '/'))))); let n = 0;
    for (const u of (obj.urges || [])) { if (!u || !/^\d{4}-\d\d-\d\d$/.test(u.date)) continue; const id = String(u.id || (u.date + 'T' + (u.time || ''))).slice(0, 60); if (V.urges.some(x => x.id === id)) continue; V.urges.push({ id, date: u.date, time: String(u.time || '').slice(0, 5), strength: num(u.strength), target: String(u.target || '').slice(0, 40), note: String(u.note || '').slice(0, 300), outcome: String(u.outcome || '').slice(0, 20) }); n++; }
    for (const [k, d] of Object.entries(obj.days || {})) { if (!/^\d{4}-\d\d-\d\d$/.test(k) || !d) continue; const c = {}; for (const f of ['phone_h', 'work_h', 'move_min', 'med_min', 'sleep', 'mood', 'energy', 'focus', 'happy']) { const val = num(d[f]); if (val !== null) c[f] = val; } V.days[k] = Object.assign({}, V.days[k], c); n++; }
    save(); setTimeout(() => toast(n + ' Einträge übernommen'), 300);
  } catch { setTimeout(() => toast('Der Link ist beschädigt'), 300); }
  history.replaceState(null, '', location.pathname);
})();
let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { drawAll(); drawUrges(); drawHours(); }, 150); });
render();
if (/^(drang|abend|alles)$/.test(jumpTo)) setTimeout(() => { const el = document.getElementById(jumpTo); if (el) el.scrollIntoView({ block: 'start' }); }, 60);
window.VERLAUF_TEST = { V, dailyRows, scaled, allUrges };
