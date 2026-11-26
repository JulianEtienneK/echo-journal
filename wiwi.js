/* Echo · WiWi hub: weekly study time (goal 2 h, StB-Pfad excluded), a free study timer for everything outside Echo
   (study letters, Moodle, exercises), and the module paths with exam countdowns.
   Storage 'echo-wiwi-free' = { days: {day: {sec, by: {nr: sec}}}, run: {start, nr} | null, updated }. */
'use strict';
const app = document.getElementById('app');
const F = Object.assign({ days: {}, run: null }, LS.get('echo-wiwi-free', {}));
const saveF = () => { F.updated = Date.now(); LS.set('echo-wiwi-free', F); };
const mmss = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const hm = min => min >= 60 ? Math.floor(min / 60) + ' h ' + (min % 60) + ' min' : min + ' min';
const MAX_RUN = 4 * 3600; // a forgotten timer stops counting after 4 hours
let sel = (F.run && F.run.nr) || LS.get('echo-wiwi-last', '31021');

function addTime(sec, nr, day = today()) {
  const d = F.days[day] || (F.days[day] = { sec: 0, by: {} });
  d.sec = (d.sec || 0) + sec; d.by = d.by || {}; d.by[nr] = (d.by[nr] || 0) + sec;
}
function stopRun() {
  if (!F.run) return 0;
  const sec = Math.min(MAX_RUN, Math.round((Date.now() - F.run.start) / 1000));
  addTime(sec, F.run.nr, dayKeyOf(F.run.start)); F.run = null; saveF();
  if (sec >= 60) { gainXP('wiwi-zeit', Math.round(sec / 60) * 2); }
  return sec;
}
const dayKeyOf = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

function view() {
  const wk = WIWI.weekMin(), goal = WIWI.WEEK_GOAL_MIN, days = WIWI.weekDays(), dn = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const SRC = [...WIWI.MODS.map(m => ({ nr: m.nr, col: m.col, label: m.nr })), { nr: 'sonst', col: '#8a948f', label: 'Sonstiges' }];
  const per = days.map(d => SRC.map(x => Math.round(WIWI.secMod(x.nr, d) / 60))), tot = per.map(r => r.reduce((a, b) => a + b, 0)), mx = Math.max(30, ...tot);
  const wkBy = SRC.map((x, j) => per.reduce((a, r) => a + r[j], 0));
  const run = F.run, el = run ? Math.min(MAX_RUN, Math.round((Date.now() - run.start) / 1000)) : 0, rs = run && SRC.find(x => x.nr === run.nr);
  const modCard = m => {
    const P = LS.get('echo-wiwi-' + m.nr, null), meta = P && P.meta, dt = WIWI.daysTo(m.exam), wkm = Math.round(days.reduce((a, d) => a + WIWI.secMod(m.nr, d), 0) / 60);
    return `<a class="card" href="${m.page}" style="text-decoration:none;color:inherit;border-left:4px solid ${m.col}"><div class="row"><span class="big">${m.em}</span><div class="stack grow" style="gap:0;min-width:0"><h3>${m.nr} ${esc(m.t)}</h3>
      <span class="small muted">${m.kind}${dt != null ? ` · Klausur in ${dt} Tagen` : ''}${wkm ? ` · ${wkm} min diese Woche` : ''}</span>
      <span class="small muted">${m.viaStb ? 'Vorerst über den ' + esc(m.viaStb) : meta ? `Lektion ${meta.done}/${meta.total} gelernt` : 'Pfad starten'}</span></div></div></a>`;
  };
  return `<div class="topbar"><a class="link" href="index.html#games">← Spiele</a></div>
  <header class="stack" style="gap:4px"><span class="eyebrow">FernUni Hagen · WS 2026/27</span><h1>🎓 WiWi</h1></header>
  <section class="card" style="border:2px solid ${wk >= goal ? 'var(--gold)' : 'var(--calm)'}">
    <div class="row spread"><h3>Diese Woche</h3><span class="mono">${hm(wk)} / ${hm(goal)}${wk >= goal ? ' ✓' : ''}</span></div>
    <div class="bar"><i style="width:${Math.min(100, wk / goal * 100)}%"></i></div>
    <div class="days">${per.map((r, i) => `<div><div class="stackbar" style="height:${Math.max(3, tot[i] / mx * 76)}px;opacity:${days[i] === today() ? 1 : .75}">${r.map((v, j) => v ? `<i style="flex:${v};background:${SRC[j].col}" title="${SRC[j].label}: ${v} min"></i>` : '').join('') || '<i style="flex:1;background:var(--line)"></i>'}</div><span>${dn[i]}${tot[i] ? ' ' + tot[i] : ''}</span></div>`).join('')}</div>
    <div class="legend">${SRC.map((x, j) => wkBy[j] || x.nr !== 'sonst' ? `<span><i style="background:${x.col}"></i>${x.label} ${wkBy[j] ? hm(wkBy[j]) : '–'}</span>` : '').join('')}</div>
    <div class="tmr ${run ? 'on' : ''}">
      ${run ? `<div class="row spread"><span><i class="dot" style="background:${rs ? rs.col : '#888'}"></i> <b>${esc(rs ? rs.label : run.nr)}</b> läuft</span><span class="timer" id="tm">${mmss(el)}</span></div>
        <button class="btn primary" data-act="stop">Stopp und speichern</button>`
      : `<span class="small muted">⏱ Außerhalb von Echo gelernt? Modul antippen.</span>
        <div class="chips">${SRC.map(x => `<button class="chip" data-act="start" data-v="${x.nr}"><i class="dot" style="background:${x.col}"></i>${x.label}</button>`).join('')}</div>`}
      <details><summary class="small muted">Zeit nachtragen</summary><div class="row" style="gap:8px;margin-top:8px"><select id="nr">${SRC.map(x => `<option value="${x.nr}" ${x.nr === sel ? 'selected' : ''}>${x.label}</option>`).join('')}</select><input type="number" id="addmin" min="1" max="600" placeholder="Min." style="max-width:90px"><button class="btn" data-act="add">Eintragen</button></div></details>
    </div>
    <span class="small muted">Zählt Pfade und Timer zusammen. Der StB-Pfad zählt nicht dazu.</span></section>
  <h3 style="margin:8px 4px 0">Module</h3>
  ${WIWI.MODS.map(modCard).join('')}
  <details class="card"><summary>So lernst du hier</summary><div class="stack small" style="gap:6px;line-height:1.5;margin-top:8px">
    <span>Jedes Modul hat einen eigenen Pfad: Lektionen mit Vorab-Frage, Fall, eigenen Worten und Verknüpfung, Karten in wachsenden Abständen, Rechentrainer mit immer neuen Zahlen und Probeklausuren auf Zeit.</span>
    <span>Das Tempo richtet sich nach dem Klausurtermin: Bleibt bis zur Klausur zu wenig Zeit, kommen neue Lektionen täglich statt jeden zweiten Tag.</span>
    <span>Alle Lektionen geben doppelte XP.</span></div></details>`;
}
function render() { app.innerHTML = view(); }
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
  if (a === 'start') { if (F.run) stopRun(); sel = b.dataset.v; LS.set('echo-wiwi-last', sel); F.run = { start: Date.now(), nr: sel }; saveF(); render(); }
  if (a === 'stop') { const s = stopRun(); toast(`${hm(Math.round(s / 60))} gespeichert`); render(); }
  if (a === 'add') { const m = Math.max(0, Math.min(600, parseInt(document.getElementById('addmin').value, 10) || 0)); if (!m) return; sel = document.getElementById('nr').value; addTime(m * 60, sel); saveF(); gainXP('wiwi-zeit', m * 2); toast(`${hm(m)} eingetragen`); render(); }
});
setInterval(() => { if (!F.run) return; const el = document.getElementById('tm'); if (el) el.textContent = mmss(Math.min(MAX_RUN, Math.round((Date.now() - F.run.start) / 1000))); }, 1000);
render();
