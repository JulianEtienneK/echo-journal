/* Echo · Auslöser-Log: Rückfälle bei schlechten Gewohnheiten festhalten, um die Muster davor zu sehen.
   Pro Eintrag: Habit, Zustand, Situation, Dauer, was direkt davor war. Danach zählt die Musteransicht, wann und wo es passiert.
   Ohne Wertung: Ein Eintrag ist ein Datenpunkt, kein Geständnis.
   Storage: 'echo-ausloeser' (in Echos Sicherung). Einmaliger Import über #import=<base64url JSON>. Needs tools-common.js. */
'use strict';
const app = document.getElementById('app');
const BASE = { habit: ['YouTube', 'Handy im Bett', 'Social Media'], state: ['Hungrig', 'Müde', 'Gestresst', 'Gelangweilt', 'Frustriert', 'Einsam', 'Neutral'], sit: ['Heimkommen', 'Aufgabenstart', 'Zähe Aufgabe', 'Pause', 'Nach dem Essen', 'Leerlauf abends', 'Im Bett'] };
const A = Object.assign({ entries: [], custom: { habit: [], state: [], sit: [] } }, LS.get('echo-ausloeser', {}));
const save = () => { A.updated = Date.now(); LS.set('echo-ausloeser', A); };
const opts = k => [...BASE[k], ...((A.custom || {})[k] || [])];
const route = () => location.hash.replace(/^#/, '');
const go = h => { if (route() === h) render(); else location.hash = h; };
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const fmtD = k => new Date(k + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const slot = t => { const h = +(t || '12:00').slice(0, 2); return h < 11 ? 'Morgens' : h < 14 ? 'Mittags' : h < 18 ? 'Nachmittags' : h < 22 ? 'Abends' : 'Nachts'; };
const daysSince = () => { if (!A.entries.length) return null; const last = A.entries.map(e => e.date).sort().pop(); return Math.round((new Date(today() + 'T12:00') - new Date(last + 'T12:00')) / 864e5); };
let E = null; // entry being written or edited

function fresh() { return { id: uid(), date: today(), time: nowHM(), habit: opts('habit')[0], state: [], sit: '', min: '', before: '', note: '' }; }
const chips = (k, multi) => `<div class="chips">${opts(k).map(o => `<button class="chip" data-act="pick" data-k="${k}" data-v="${esc(o)}" aria-pressed="${multi ? E[k].includes(o) : E[k] === o}">${esc(o)}</button>`).join('')}<button class="chip" data-act="custom" data-k="${k}">＋</button></div>`;

function viewHub() {
  const n = A.entries.length, ds = daysSince(), last30 = A.entries.filter(e => e.date >= dk(new Date(Date.now() - 29 * 864e5)));
  const min30 = last30.reduce((s, e) => s + (+e.min || 0), 0);
  const list = A.entries.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 12);
  return `<div class="topbar"><a class="link" href="index.html#games">← Echo</a><span class="xp">${n} Einträge</span></div>
  <div class="stack"><span class="eyebrow">Echo</span><h1>🧩 Auslöser</h1><p class="muted">Jeder Rückfall ist ein Datenpunkt, kein Urteil. Wichtig ist, was direkt davor war: Zustand, Situation, Gedanke. Daraus wird sichtbar, wo du ansetzen kannst, bevor der Drang da ist.</p></div>
  <div class="stats"><div class="stat"><b>${ds == null ? '–' : ds}</b><span class="small muted">Tage seit dem letzten</span></div><div class="stat"><b>${last30.length}</b><span class="small muted">in 30 Tagen</span></div><div class="stat"><b>${min30 ? Math.round(min30 / 60 * 10) / 10 + ' h' : '–'}</b><span class="small muted">Zeit in 30 Tagen</span></div></div>
  <button class="btn primary" data-act="new">Eintrag hinzufügen</button>
  ${n >= 2 ? '<button class="btn" data-act="go" data-v="muster">📊 Muster ansehen</button>' : ''}
  ${list.length ? `<section class="card"><span class="eyebrow">Einträge</span>${list.map(e => `<button class="note" data-act="edit" data-v="${e.id}" style="text-align:left;width:100%;cursor:pointer"><span class="small muted">${esc(fmtD(e.date))}${e.time ? ', ' + esc(e.time) : ''} · ${esc(e.habit)}${e.min ? ' · ' + esc(String(e.min)) + ' min' : ''}</span><br>${[...(e.state || []), e.sit].filter(Boolean).map(x => `<span class="tag">${esc(x)}</span>`).join(' ') || '<span class="small" style="color:var(--gold)">Zustand und Situation fehlen noch</span>'}${e.before ? `<br><span class="small">Davor: ${esc(e.before)}</span>` : ''}${e.note ? `<br><span class="small muted">${esc(e.note)}</span>` : ''}</button>`).join('')}</section>` : ''}`;
}

function viewEdit() {
  if (!E) E = fresh();
  const isNew = !A.entries.some(x => x.id === E.id);
  return `<div class="topbar"><a class="link" href="#">← Auslöser</a></div>
  <div class="stack"><span class="eyebrow">${isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}</span><h1>Was war los?</h1></div>
  <section class="card"><div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) minmax(0,.8fr);gap:8px"><input class="input" type="date" id="d" value="${esc(E.date)}" style="min-width:0"><input class="input" type="time" id="t" value="${esc(E.time || '')}" style="min-width:0"><input class="input" type="number" id="m" min="0" step="5" inputmode="numeric" placeholder="Min." value="${esc(String(E.min || ''))}" style="min-width:0"></div>
    <span class="small muted">Gewohnheit</span>${chips('habit')}
    <span class="small muted">Zustand davor (mehrere möglich)</span>${chips('state', true)}
    <span class="small muted">Situation</span>${chips('sit')}
    <span class="small muted">Was war direkt davor? Gedanke, Ort, Gerät</span>
    <textarea class="input" id="b" rows="2" placeholder="z. B. „Nur kurz beim Essen“, Laptop lag offen auf dem Tisch">${esc(E.before || '')}</textarea>
    <textarea class="input" id="n" rows="2" placeholder="Sonst noch etwas (optional)">${esc(E.note || '')}</textarea>
    <button class="btn primary" data-act="save">Speichern</button>
    ${isNew ? '' : '<button class="btn" data-act="del" style="color:var(--rec)">Eintrag löschen</button>'}</section>`;
}

function bars(title, counts) {
  const rows = Object.entries(counts).filter(([, v]) => v).sort((a, b) => b[1] - a[1]); if (!rows.length) return '';
  const max = rows[0][1];
  return `<section class="card"><span class="eyebrow">${esc(title)}</span>${rows.map(([k, v]) => `<div class="stack" style="gap:2px"><div class="row spread small"><span>${esc(k)}</span><b>${v}</b></div><div class="bar"><i style="width:${Math.round(100 * v / max)}%"></i></div></div>`).join('')}</section>`;
}
function viewMuster() {
  const st = {}, si = {}, sl = {}, wd = {}, ha = {}, WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  for (const e of A.entries) {
    for (const s of e.state || []) st[s] = (st[s] || 0) + 1;
    if (e.sit) si[e.sit] = (si[e.sit] || 0) + 1;
    if (e.time) sl[slot(e.time)] = (sl[slot(e.time)] || 0) + 1;
    const w = WD[new Date(e.date + 'T12:00').getDay()]; wd[w] = (wd[w] || 0) + 1;
    ha[e.habit] = (ha[e.habit] || 0) + 1;
  }
  const open = A.entries.filter(e => !(e.state || []).length || !e.sit).length;
  const lead = o => { const r = Object.entries(o).sort((a, b) => b[1] - a[1]); return r[0] && r[0][1] >= 2 && (!r[1] || r[0][1] > r[1][1]) ? r[0] : null; }, topSi = lead(si), topSt = lead(st);
  return `<div class="topbar"><a class="link" href="#">← Auslöser</a></div>
  <div class="stack"><span class="eyebrow">${A.entries.length} Einträge</span><h1>📊 Muster</h1>
  ${topSi || topSt ? `<p>Am häufigsten: ${[topSt && `<b>${esc(topSt[0])}</b>`, topSi && `<b>${esc(topSi[0])}</b>`].filter(Boolean).join(' und ')}. Dort lohnt es sich, vorher etwas zu ändern: Gerät, Ort oder was du in dem Moment als Erstes tust.</p>` : `<p class="small muted">Noch kein klarer Schwerpunkt. Ab ein paar Einträgen mehr zeigt sich, was sich wiederholt.</p>`}
  ${open ? `<p class="small muted">${open} ${open === 1 ? 'Eintrag' : 'Einträge'} ohne Zustand oder Situation; sie fehlen in den Zählungen.</p>` : ''}</div>
  ${bars('Situation', si)}${bars('Zustand davor', st)}${bars('Tageszeit', sl)}${bars('Wochentag', wd)}${Object.keys(ha).length > 1 ? bars('Gewohnheit', ha) : ''}`;
}

function render() {
  const r = route();
  app.innerHTML = r === 'edit' ? viewEdit() : r === 'muster' ? viewMuster() : viewHub();
}
function keep() {
  const g = id => (document.getElementById(id) || {}).value;
  if (!E) return; E.date = g('d') || E.date; E.time = g('t') || ''; E.min = g('m') ? Math.max(0, Math.round(+g('m'))) : ''; E.before = (g('b') || '').trim(); E.note = (g('n') || '').trim();
}
app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, v = el.dataset.v, k = el.dataset.k;
  if (a === 'go') return go(v);
  if (a === 'new') { E = fresh(); return go('edit'); }
  if (a === 'edit') { const x = A.entries.find(y => y.id === v); if (!x) return; E = JSON.parse(JSON.stringify(x)); E.state = E.state || []; return go('edit'); }
  if (a === 'pick') { keep(); if (k === 'state') { const i = E.state.indexOf(v); if (i >= 0) E.state.splice(i, 1); else E.state.push(v); } else E[k] = E[k] === v && k === 'sit' ? '' : v; render(); return; }
  if (a === 'custom') { keep(); const t = (prompt('Neue Option') || '').trim().slice(0, 40); if (!t) return; (A.custom[k] || (A.custom[k] = [])).includes(t) || opts(k).includes(t) || A.custom[k].push(t); save(); if (k === 'state') E.state.includes(t) || E.state.push(t); else E[k] = t; render(); return; }
  if (a === 'save') {
    keep(); const i = A.entries.findIndex(x => x.id === E.id);
    if (i >= 0) A.entries[i] = E; else A.entries.push(E);
    save(); toast(i >= 0 ? 'Geändert' : 'Eingetragen. Danke fürs Hinschauen.'); E = null; go(''); return;
  }
  if (a === 'del') { if (!confirm('Diesen Eintrag löschen?')) return; A.entries = A.entries.filter(x => x.id !== E.id); save(); E = null; go(''); return; }
});
addEventListener('hashchange', render);

// One-time import of entries kept elsewhere (e.g. an earlier sheet): #import=<base64url of [{date,time,habit,state:[],sit,min,before,note}]>
(() => {
  const m = location.hash.match(/^#import=([A-Za-z0-9_-]+)/); if (!m) return;
  try {
    const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))));
    const rows = JSON.parse(json); let n = 0;
    for (const r of Array.isArray(rows) ? rows : []) {
      if (!r || !/^\d{4}-\d{2}-\d{2}$/.test(r.date || '')) continue;
      const key = [r.date, r.habit, r.before || r.note].join('|');
      if (A.entries.some(x => [x.date, x.habit, x.before || x.note].join('|') === key)) continue;
      A.entries.push({ id: uid(), date: r.date, time: String(r.time || '').slice(0, 5), habit: String(r.habit || 'YouTube').slice(0, 40), state: (r.state || []).map(String).slice(0, 6), sit: String(r.sit || '').slice(0, 40), min: +r.min || '', before: String(r.before || '').slice(0, 500), note: String(r.note || '').slice(0, 500) });
      n++;
    }
    save(); history.replaceState(null, '', location.pathname); toast(n ? `${n} Einträge übernommen` : 'Schon alles da');
  } catch { history.replaceState(null, '', location.pathname); toast('Import-Link kaputt'); }
})();
render();
