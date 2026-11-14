/* Echo · Stammbaum: an ancestor chart you fill in as you find things out.
   People are stored by Ahnenzahl (Kekulé number): 1 = you, 2n = father of n, 2n+1 = mother of n. That makes the
   whole tree a flat map and tells the app which slot is the next one to research.
   Family data stays on the device ('echo-stammbaum', part of Echo's backup). It is never part of the app's code:
   a tree can be loaded once from a link (#import=…) or pasted as text. Needs tools-common.js. */
'use strict';
const app = document.getElementById('app');
const T = Object.assign({ p: {} }, LS.get('echo-stammbaum', {}));
const save = () => { T.updated = Date.now(); LS.set('echo-stammbaum', T); };
const route = () => location.hash.replace(/^#/, '');
const go = h => { if (route() === h) render(); else location.hash = h; };
const gen = n => Math.floor(Math.log2(n)), isMale = n => n > 1 && n % 2 === 0;
const GEN = ['Du', 'Eltern', 'Großeltern', 'Urgroßeltern', 'Ururgroßeltern'];
const genName = g => GEN[g] || (g - 2) + '×-Urgroßeltern';
// "Mutter des Vaters" etc., read from the binary digits of the number
function rel(n) {
  if (n === 1) return 'Du'; const bits = n.toString(2).slice(1).split('').map(b => b === '0' ? 'Vater' : 'Mutter');
  if (bits.length === 1) return bits[0]; if (bits.length === 2) return (bits[1] === 'Vater' ? 'Großvater' : 'Großmutter') + ' (' + (bits[0] === 'Vater' ? 'väterlich' : 'mütterlich') + ')';
  return bits.slice().reverse().map((b, i) => i === 0 ? b : (b === 'Vater' ? 'des Vaters' : 'der Mutter')).join(' ');
}
const year = s => { const m = String(s || '').match(/(1[5-9]\d\d|20\d\d)/); return m ? +m[1] : null; };
const nums = () => Object.keys(T.p).map(Number).sort((a, b) => a - b);
const topBar = back => `<div class="topbar"><a class="link" href="${back ? '#' : 'index.html#games'}">← ${back ? 'Stammbaum' : 'Echo'}</a><span class="xp">${nums().length} Personen</span></div>`;
const SURE = { beleg: ['📄', 'Belegt (Urkunde, Kirchenbuch)'], familie: ['🗣️', 'Familienwissen'], offen: ['❓', 'Unsicher'] };

/* ---------- where to look next ---------- */
// German civil registers open to everyone after 110 years (births), 80 (marriages), 30 (deaths); before 1876 only church books exist.
function hints(n) {
  const child = T.p[Math.floor(n / 2)], cy = child && year(child.born), place = child && (child.bornAt || ''), out = [];
  if (!child) return out;
  const who = isMale(n) ? 'Vater' : 'Mutter', cn = child.name || rel(Math.floor(n / 2));
  if (!cy) { out.push(`Zuerst Geburtsjahr und Geburtsort von ${cn} klären. Daran hängt, welches Amt oder Archiv zuständig ist.`); return out; }
  out.push(`In der <b>Geburtsurkunde</b> von ${cn} (${cy}${place ? ', ' + esc(place) : ''}) stehen beide Eltern mit Namen, oft auch mit Beruf und Wohnort.`);
  const now = new Date().getFullYear();
  if (cy > now - 110) out.push(`Die Geburt liegt weniger als 110 Jahre zurück: Das Register liegt noch beim <b>Standesamt${place ? ' ' + esc(place) : ' des Geburtsorts'}</b>. Als direkter Nachkomme darfst du eine Urkunde oder einen beglaubigten Registerauszug bestellen (meist 10 bis 15 €, oft online).`);
  else if (cy >= 1876) out.push(`Das Geburtsregister ist älter als 110 Jahre und liegt im <b>Stadt- oder Kreisarchiv</b>${place ? ' für ' + esc(place) : ''}. Viele Jahrgänge sind bei Ancestry oder FamilySearch eingescannt.`);
  else out.push(`Vor 1876 gab es keine Standesämter. Zuständig ist das <b>Kirchenbuch</b> der Gemeinde: evangelisch bei Archion, katholisch bei Matricula, vieles auch bei FamilySearch.`);
  out.push(`Noch ergiebiger ist die <b>Heiratsurkunde</b> der Eltern von ${cn}: Sie nennt bei beiden Brautleuten Geburtsdatum, Geburtsort und die Eltern, also gleich die nächste Generation.`);
  if (/meckl|crivitz|schwerin|parchim|rostock|güstrow|wismar|ludwigslust|sternberg/i.test(place) || cy < 1920) out.push(`Für Mecklenburg sind die <b>Volkszählungen 1819, 1867, 1900 und 1919</b> namentlich erhalten und online durchsuchbar (Ancestry, teils FamilySearch). Sie zeigen ganze Haushalte mit Geburtsdaten.`);
  if (cy >= 1900 && cy <= 1945 && isMale(n)) out.push(`Ist der ${who} im Zweiten Weltkrieg gefallen oder vermisst, helfen die <b>Gräbersuche des Volksbunds</b> und das Bundesarchiv (Abteilung Personenauskünfte).`);
  out.push(`Am schnellsten: lebende Verwandte fragen und nach <b>Familienstammbuch, Ahnenpass (1933–45) oder alten Ausweisen</b> suchen. Ein Ahnenpass enthält oft vier bis fünf Generationen auf einmal.`);
  return out;
}
// what is still missing, most useful first
function gaps() {
  const out = [];
  for (const n of nums()) { const p = T.p[n], miss = []; if (!p.born) miss.push('Geburtsdatum'); if (!p.bornAt) miss.push('Geburtsort'); if (!isMale(n) && n > 1 && !p.birthName) miss.push('Geburtsname'); if (p.sure === 'offen') miss.push('Angaben bestätigen');
    if (miss.length) out.push({ n, t: `${esc(p.name || rel(n))}: ${miss.join(', ')}`, k: 'data' }); }
  for (const n of nums()) for (const m of [2 * n, 2 * n + 1]) if (!T.p[m]) out.push({ n: m, t: `${rel(m)} fehlt (${isMale(m) ? 'Vater' : 'Mutter'} von ${esc(T.p[n].name || rel(n))})`, k: 'person' });
  return out.sort((a, b) => gen(a.n) - gen(b.n) || a.n - b.n);
}

/* ---------- views ---------- */
function personCard(n) {
  const p = T.p[n], kid = T.p[Math.floor(n / 2)];
  if (!p) return kid || n === 1 ? `<button class="tcard empty" data-act="edit" data-v="${n}"><span class="tn">${n}</span><b>＋ ${n === 1 ? 'Du' : isMale(n) ? 'Vater' : 'Mutter'}</b><span class="small muted">${n === 1 ? '' : 'von ' + esc(kid.name || rel(Math.floor(n / 2)))}</span></button>` : '';
  const life = [p.born ? '* ' + esc(p.born) : '', p.died ? '† ' + esc(p.died) : ''].filter(Boolean).join(' · ');
  return `<button class="tcard ${isMale(n) ? 'm' : n > 1 ? 'f' : 'me'}" data-act="edit" data-v="${n}"><span class="tn">${n}</span><b>${esc(p.name || '?')}</b>${p.birthName ? `<span class="small">geb. ${esc(p.birthName)}</span>` : ''}<span class="small muted">${life || 'Daten fehlen'}</span>${p.bornAt ? `<span class="small muted">${esc(p.bornAt)}</span>` : ''}<span class="ts">${(SURE[p.sure] || SURE.familie)[0]}</span></button>`;
}
function viewTree() {
  if (!nums().length) return viewStart();
  const maxG = Math.max(...nums().map(gen)), g2 = gaps(), rows = [];
  for (let g = Math.min(maxG + 1, 12); g >= 0; g--) { const cards = []; for (let n = 2 ** g; n < 2 ** (g + 1); n++) { const c = personCard(n); if (c) cards.push(c); }
    if (cards.length) rows.push(`<div class="stack" style="gap:6px"><div class="row spread"><span class="eyebrow">${genName(g)}</span><span class="small muted">${nums().filter(n => gen(n) === g).length} / ${2 ** g}</span></div><div class="trow">${cards.join('')}</div></div>`); }
  const known = nums().length, full = (() => { let g = 0; while (Array.from({ length: 2 ** (g + 1) }, (_, i) => 2 ** (g + 1) + i).every(n => T.p[n])) g++; return g; })();
  return `${topBar()}<div class="stack"><span class="eyebrow">Echo</span><h1>🌳 Stammbaum</h1><p class="muted">${known} Personen in ${maxG + 1} Generationen. Vollständig bis: ${genName(full)}. Älteste Generation oben, tippe auf eine Karte zum Bearbeiten.</p></div>
  ${rows.join('')}
  <section class="card"><div class="row spread"><h3>🔎 Nächste Schritte</h3><span class="small muted">${g2.length} offen</span></div>${g2.slice(0, 6).map(x => `<button class="row hub" data-act="${x.k === 'person' ? 'find' : 'edit'}" data-v="${x.n}" style="background:none;padding:6px 0;text-align:left"><span>${x.k === 'person' ? '👤' : '✏️'}</span><span class="small grow">${x.t}</span><span class="muted">›</span></button>`).join('') || '<p class="small muted">Alles ausgefüllt, was du kennst.</p>'}${g2.length > 6 ? `<button class="link" data-act="go" data-v="luecken" style="justify-self:start">Alle ${g2.length} anzeigen</button>` : ''}</section>
  <div class="row wrap" style="gap:8px"><button class="btn sm" data-act="go" data-v="fragen">🗣️ Fragen für Verwandte</button><button class="btn sm" data-act="go" data-v="daten">⇅ Export / Import</button></div>
  <p class="small muted">Die Daten liegen nur auf diesem Gerät und in deiner Echo-Sicherung. 📄 belegt · 🗣️ Familienwissen · ❓ unsicher</p>`;
}
function viewStart() {
  return `${topBar()}<div class="stack"><span class="eyebrow">Echo</span><h1>🌳 Stammbaum</h1><p class="muted">Noch leer. Fang bei dir an und arbeite dich nach oben, oder füge einen Stammbaum als Text ein.</p></div>
  <button class="btn primary big" data-act="edit" data-v="1">Mit mir anfangen</button><button class="btn big" data-act="go" data-v="daten">Stammbaum einfügen</button>`;
}
function viewEdit(n) {
  const p = T.p[n] || {}, kid = T.p[Math.floor(n / 2)];
  const f = (k, label, ph, type = 'text') => `<label class="stack" style="gap:4px"><span class="small"><b>${label}</b></span><input class="input" data-f="${k}" type="${type}" placeholder="${ph}" value="${esc(p[k] || '')}"></label>`;
  return `${topBar(true)}<div class="stack"><span class="eyebrow">Ahnenzahl ${n} · ${genName(gen(n))}</span><h1>${esc(p.name || rel(n))}</h1><p class="muted">${n === 1 ? 'Das bist du.' : rel(n) + (kid ? ' · ' + (isMale(n) ? 'Vater' : 'Mutter') + ' von ' + esc(kid.name || rel(Math.floor(n / 2))) : '')}</p></div>
  ${f('name', 'Name', 'Vorname(n) Nachname')}${!isMale(n) ? f('birthName', 'Geburtsname', 'falls anders als heute') : ''}
  <div class="row" style="gap:10px;align-items:flex-start"><div class="grow">${f('born', 'Geboren', 'z. B. 12.3.1931 oder um 1930')}</div><div class="grow">${f('bornAt', 'Geburtsort', 'Ort, Kreis')}</div></div>
  <div class="row" style="gap:10px;align-items:flex-start"><div class="grow">${f('died', 'Gestorben', 'leer, wenn lebend')}</div><div class="grow">${f('diedAt', 'Sterbeort', '')}</div></div>
  ${f('job', 'Beruf', 'z. B. Landwirt, Schneiderin')}${f('married', 'Heirat', 'Datum und Ort')}
  <label class="stack" style="gap:4px"><span class="small"><b>Notizen und Quelle</b></span><textarea class="input" data-f="note" rows="3" placeholder="Woher weißt du das? Geschichten, Geschwister, Umzüge …">${esc(p.note || '')}</textarea></label>
  <div class="stack" style="gap:6px"><span class="small"><b>Wie sicher?</b></span><div class="chips">${Object.entries(SURE).map(([k, [em, t]]) => `<button class="chip" data-act="sure" data-v="${k}" aria-pressed="${(p.sure || 'familie') === k}">${em} ${t}</button>`).join('')}</div></div>
  <button class="btn primary big" data-act="save" data-v="${n}">Speichern</button>
  ${T.p[n] ? `<div class="row wrap" style="gap:8px">${!T.p[2 * n] ? `<button class="btn sm" data-act="find" data-v="${2 * n}">＋ Vater suchen</button>` : ''}${!T.p[2 * n + 1] ? `<button class="btn sm" data-act="find" data-v="${2 * n + 1}">＋ Mutter suchen</button>` : ''}${n > 1 ? `<button class="btn sm ghost" data-act="del" data-v="${n}" style="color:var(--rec)">Entfernen</button>` : ''}</div>` : ''}`;
}
function viewFind(n) {
  const kid = T.p[Math.floor(n / 2)], h = hints(n);
  return `${topBar(true)}<div class="stack"><span class="eyebrow">Ahnenzahl ${n} · ${genName(gen(n))}</span><h1>🔎 ${rel(n)} finden</h1><p class="muted">${isMale(n) ? 'Vater' : 'Mutter'} von ${esc(kid ? kid.name || rel(Math.floor(n / 2)) : '?')}. So kommst du an den Namen:</p></div>
  ${h.map((x, i) => `<div class="card flat" style="padding:14px"><div class="row" style="align-items:flex-start"><b class="mono">${i + 1}</b><span class="small">${x}</span></div></div>`).join('')}
  <button class="btn primary big" data-act="edit" data-v="${n}">Ich weiß es: eintragen</button>`;
}
function viewGaps() { const g2 = gaps(); return `${topBar(true)}<div class="stack"><span class="eyebrow">Stammbaum</span><h1>🔎 Offene Lücken</h1><p class="muted">Sortiert von der jüngsten zur ältesten Generation. Jüngere Lücken zuerst schließen: Ohne Geburtsdaten der Großeltern findet man die Urgroßeltern nicht.</p></div>${g2.map(x => `<button class="card hub" data-act="${x.k === 'person' ? 'find' : 'edit'}" data-v="${x.n}" style="padding:12px 14px"><span class="small">${x.k === 'person' ? '👤' : '✏️'} ${x.t}</span></button>`).join('')}`; }
function viewAsk() {
  const old = nums().filter(n => gen(n) >= 2).map(n => T.p[n]).filter(p => !p.died);
  return `${topBar(true)}<div class="stack"><span class="eyebrow">Stammbaum</span><h1>🗣️ Fragen für Verwandte</h1><p class="muted">Ein Gespräch mit den ältesten lebenden Verwandten bringt mehr als jede Datenbank, und es geht nur, solange sie leben.${old.length ? ' Bei dir: ' + old.map(p => esc(p.name)).join(', ') + '.' : ''}</p></div>
  ${[['Die Eckdaten', ['Wann und wo bist du geboren? Wie hießt du vor der Heirat?', 'Wie hießen deine Eltern, mit Geburtsnamen der Mutter? Wann und wo sind sie geboren und gestorben?', 'Wie hießen deine Großeltern? Was weißt du über sie?', 'Wann und wo habt ihr geheiratet, und deine Eltern?']], ['Papiere', ['Gibt es ein Familienstammbuch, einen Ahnenpass, alte Ausweise, Taufscheine oder Konfirmationsurkunden?', 'Gibt es alte Fotos mit Namen oder Jahreszahlen auf der Rückseite?', 'Wer in der Familie hat sich schon einmal mit dem Stammbaum beschäftigt?']], ['Herkunft und Wege', ['Wo hat die Familie vor dem Krieg gelebt? Gab es Flucht, Vertreibung oder Umzüge?', 'Welche Konfession hatte die Familie? In welcher Kirche wurde getauft und geheiratet?', 'Welche Berufe gab es? Hatte die Familie einen Hof, ein Handwerk, ein Geschäft?', 'Wer war im Krieg, wer ist gefallen oder vermisst?']], ['Geschichten', ['Welche Geschichte über deine Eltern oder Großeltern wird immer wieder erzählt?', 'Wie hießen deine Geschwister, Onkel und Tanten? Über sie findet man oft die gemeinsamen Vorfahren.']]].map(([t, qs]) => `<section class="card"><h3>${t}</h3>${qs.map(q => `<label class="row small" style="align-items:flex-start;gap:8px"><input type="checkbox"><span>${q}</span></label>`).join('')}</section>`).join('')}
  <div class="note small">Tipp: Nimm das Gespräch mit Echo auf (mit Einverständnis). Namen und Orte buchstabieren lassen, bei Daten nach dem Anlass fragen („war das vor oder nach dem Umzug?“).</div>`;
}
function viewData() {
  return `${topBar(true)}<div class="stack"><span class="eyebrow">Stammbaum</span><h1>⇅ Export / Import</h1><p class="muted">Der Text enthält deinen ganzen Stammbaum. Kopiere ihn zur Sicherung oder füge einen Stammbaum ein. Beim Einfügen werden gleiche Ahnenzahlen überschrieben, alles andere bleibt.</p></div>
  <textarea class="input mono" id="tData" rows="12" style="font-size:12px">${esc(JSON.stringify(T.p, null, 1))}</textarea>
  <div class="row" style="gap:8px"><button class="btn grow" data-act="copy">Kopieren</button><button class="btn primary grow" data-act="import">Einfügen übernehmen</button></div>
  ${nums().length ? `<details class="card"><summary>Als Ahnenliste (Text)</summary><pre class="small" style="white-space:pre-wrap;margin:0">${esc(nums().map(n => { const p = T.p[n]; return `${n}. ${p.name || '?'}${p.birthName ? ' geb. ' + p.birthName : ''}${p.born ? ', * ' + p.born : ''}${p.bornAt ? ' in ' + p.bornAt : ''}${p.died ? ', † ' + p.died : ''} (${rel(n)})`; }).join('\n'))}</pre></details>` : ''}`;
}
function importTree(obj) { let n = 0; for (const [k, v] of Object.entries(obj || {})) { const i = +k; if (!Number.isInteger(i) || i < 1 || i > 8191 || !v || typeof v !== 'object') continue; const c = {}; for (const f of ['name', 'birthName', 'born', 'bornAt', 'died', 'diedAt', 'job', 'married', 'note', 'sure']) if (typeof v[f] === 'string' && v[f]) c[f] = v[f].slice(0, f === 'note' ? 3000 : 200); T.p[i] = Object.assign({}, T.p[i], c); n++; } if (n) save(); return n; }

/* ---------- routing + events ---------- */
let SURE_PICK = null;
function render() {
  const r = route();
  if (r.startsWith('import=')) { // one-time link: load, then drop the data from the address bar
    let n = 0; try { n = importTree(JSON.parse(decodeURIComponent(escape(atob(r.slice(7).replace(/-/g, '+').replace(/_/g, '/')))))); } catch { /* broken link */ }
    history.replaceState(null, '', location.pathname); toast(n ? n + ' Personen übernommen' : 'Der Link war unvollständig'); return render();
  }
  const m = r.match(/^(p|f)(\d+)$/); SURE_PICK = null;
  app.innerHTML = m && m[1] === 'p' ? viewEdit(+m[2]) : m ? viewFind(+m[2]) : r === 'luecken' ? viewGaps() : r === 'fragen' ? viewAsk() : r === 'daten' ? viewData() : viewTree();
  if (!m && !r) requestAnimationFrame(() => document.querySelectorAll('.trow').forEach(el => { el.scrollLeft = 0; }));
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act, v = el.dataset.v;
  if (a === 'go') return go(v);
  if (a === 'edit') return go('p' + v);
  if (a === 'find') return go('f' + v);
  if (a === 'sure') { SURE_PICK = v; el.parentNode.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === el)); return; }
  if (a === 'save') { const n = +v, isNew = !T.p[n], p = Object.assign({}, T.p[n]); document.querySelectorAll('[data-f]').forEach(i => { const x = i.value.trim(); if (x) p[i.dataset.f] = x.slice(0, i.dataset.f === 'note' ? 3000 : 200); else delete p[i.dataset.f]; });
    if (!p.name) { toast('Mindestens der Name fehlt'); return; } p.sure = SURE_PICK || p.sure || 'familie'; T.p[n] = p; save(); if (isNew) { gainXP('stammbaum', 15); toast('Eingetragen · +15 XP'); } else toast('Gespeichert'); return go(''); }
  if (a === 'del') { const n = +v; if (T.p[2 * n] || T.p[2 * n + 1]) { toast('Erst die Eltern dieser Person entfernen'); return; } if (el.dataset.sure) { delete T.p[n]; save(); toast('Entfernt'); return go(''); } el.dataset.sure = '1'; el.textContent = 'Wirklich entfernen?'; return; }
  if (a === 'copy') { const t = document.getElementById('tData'); t.select(); navigator.clipboard?.writeText(t.value).then(() => toast('Kopiert'), () => toast('Markiert: jetzt kopieren')); return; }
  if (a === 'import') { let n = 0; try { n = importTree(JSON.parse(document.getElementById('tData').value)); } catch { toast('Das ist kein gültiger Stammbaum-Text'); return; } toast(n + ' Personen übernommen'); return go(''); }
});
render();
window.TREE_TEST = { T, rel, hints, gaps, importTree };
