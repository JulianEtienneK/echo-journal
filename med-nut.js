/* Mikronährstoffe: layer of the Medizin-Atlas. Data: window.MEDNUT (med-nut-data.js); engine hooks: window.MEDEXT (med.js).
   Reference intakes are D-A-CH (DGE) values, upper limits EFSA; every number carries its source link in the data. */
'use strict';
(function () {
  const N = window.MEDNUT, X = window.MEDEXT; if (!N || !N.length || !X) return;
  const BY = Object.fromEntries(N.map(n => [n.id, n]));
  const GROUPS = ['Fettlösliche Vitamine', 'Wasserlösliche Vitamine', 'Mengenelemente', 'Spurenelemente'];
  const FLD = [['funktion', 'Funktion', 0], ['mangel', 'Mangel', 0], ['quellen', 'Quellen', 0], ['aufnahme', 'Aufnahme & Speicher', 1], ['labor', 'Labor', 1], ['risiko', 'Risikogruppen', 1], ['interaktion', 'Interaktionen', 2], ['ueberdosis', 'Überdosierung', 2]];
  const NV = { id: null, g: 'all' };

  /* ---------- learning cards: one core card per nutrient (stage 1), its exam questions (stage 2) ---------- */
  const addI = (id, kind, stage, ref) => { const it = { id, kind, organ: '_nut', stage, ref }; ITEMS[id] = it; ALL.push(it); (BY_ORGAN._nut = BY_ORGAN._nut || []).push(it); };
  for (const n of N) { addI('n.' + n.id, 'nut', 1, n); (n.mcq || []).forEach((m, i) => addI('nq.' + n.id + '.' + i, 'nutq', 2, Object.assign({ n }, m))); }

  // hide the nutrient's own name in a description (the word Vitamin itself is too generic to hide)
  const hide = n => n.name.replace(/\bVitamin\b/g, ''); // its active forms stay visible: they are descriptive, hiding them blanks half the sentence
  // "Vitamin D" / "25-OH-Vitamin-D" would survive the word masking (one-letter names), so they are hidden explicitly
const vit = n => (n.name.match(/Vitamin\s+([A-Z]\d{0,2})/) || [])[1];
// D2/D3, K1/K2 belong to their letter; B1 must not swallow B12. Three-letter names (Jod/Iod) are below mask()'s word length.
const msk = (n, t) => {
  const v = vit(n); let x = String(t || '');
  if (v) x = x.replace(new RegExp('Vitamin[- ]?' + v + (v.length === 1 ? '\\d?' : '(?![0-9])'), 'g'), '[…]');
  for (const w of n.name.split(/[\s()]+/)) if (w.length === 3 && /^\p{Lu}\p{Ll}+$/u.test(w)) x = x.replace(new RegExp('(?<![\\p{L}])' + w + '[\\p{L}-]*', 'giu'), '[…]');
  return mask(x, hide(n));
};
const mates = n => { const g = N.filter(x => x.id !== n.id && x.gruppe === n.gruppe); return g.length >= 3 ? g : N.filter(x => x.id !== n.id); };
  X.q.nut = (it, rot) => {
    const n = it.ref, c = M.c[it.id] || {}, S = c.S || 0, tier = S < 4 ? 0 : S < 21 ? 1 : 2;
    const fs = FLD.filter(([k, , t]) => t <= tier && n[k]), [k, lab] = fs[rot % fs.length], ms = mates(n);
    if (tier >= 1 && rot % 2 === 1) { // reverse: which statement belongs to this nutrient (neighbours of the same group as distractors)
      const w = others(ms.filter(x => x[k]), n, 3, x => x.id).map(x => msk(x, x[k]));
      return { it, type: 'mc', eyebrow: 'Mikronährstoffe · ' + lab, prompt: n.name + ': was trifft zu?', opts: mcOpts(msk(n, n[k]), w), long: true };
    }
    return { it, type: 'mc', eyebrow: 'Mikronährstoffe · ' + lab, prompt: 'Welcher Mikronährstoff ist gemeint?', sub: msk(n, n[k]), opts: mcOpts(n.name, others(ms, n, 3, x => x.id).map(x => x.name)) };
  };
  X.q.nutq = it => { const m = it.ref; return { it, type: 'mc', eyebrow: 'Mikronährstoffe · ' + m.n.name, prompt: m.q, opts: mcOpts(m.a, (m.w || []).slice(0, 3)), long: (m.a + (m.w || []).join('')).length > 120 }; };
  X.title.nut = it => it.ref.name; X.title.nutq = it => it.ref.n.name + ': ' + it.ref.q;
  const frow = (lab, val, cls = '') => val ? `<div class="frow ${cls}"><span class="flab">${lab}</span><span>${esc(val)}</span></div>` : '';
  X.info.nut = it => { const n = it.ref; return `<div class="dcard"><h3>${esc(n.name)}</h3>${frow('Funktion', n.funktion)}${frow('Mangel', n.mangel)}${frow('Labor', n.labor)}</div>`; };
  X.info.nutq = it => { const m = it.ref; return `<div class="dcard"><h3>${esc(m.n.name)}</h3>${m.why ? `<span>${esc(m.why)}</span>` : ''}</div>`; };

  /* ---------- views ---------- */
  const val = v => v && v.wert ? `${esc(v.wert)}${v.quelle ? ` <a class="src" href="${esc(v.quelle)}" target="_blank" rel="noopener">Quelle</a>` : ''}` : '';
  function nutCard(n) {
    const dis = ((n.links || {}).dis || []).filter(id => DIS_ID[id]), pth = ((n.links || {}).path || []).filter(id => PATH_ID[id]);
    const ref = n.ref && n.ref.wert ? `<div class="frow"><span class="flab">Referenzwert${n.ref.art ? ' (' + esc(n.ref.art) + ')' : ''}</span><span>${val(n.ref)}${n.ref.stand ? ` <span class="small muted">· Stand ${esc(n.ref.stand)}</span>` : ''}</span></div>` : '';
    const ul = n.ul && n.ul.wert ? `<div class="frow"><span class="flab">Obere Grenze (UL)</span><span>${val(n.ul)}</span></div>` : '';
    return `<div class="dcard nutcard"><div style="display:grid;gap:2px"><span class="eyebrow">${esc(n.gruppe)}</span><h3>${esc(n.name)}</h3>${n.aktiveForm ? `<span class="small muted">Aktive Form: ${esc(n.aktiveForm)}</span>` : ''}</div>
      ${FLD.map(([k, lab]) => frow(lab, n[k], k === 'mangel' ? 'nut' : '')).join('')}${ref}${ul}
      ${dis.length ? `<div class="frow"><span class="flab">Krankheiten</span><span class="dlist">${dis.map(id => `<button class="dchip" data-act="dis" data-v="${id}">${esc(short(DIS_ID[id].name))}</button>`).join('')}</span></div>` : ''}
      ${pth.length ? `<div class="frow"><span class="flab">Stoffwechselwege</span><span class="dlist">${pth.map(id => `<button class="dchip" data-act="path" data-v="${id}">🧪 ${esc(PATH_ID[id].name)}</button>`).join('')}</span></div>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="chip" data-act="soc" data-v="nut|${n.id}">🦉 Sokratisch vertiefen</button></div></div>`;
  }
  X.views.nut = () => {
    const its = BY_ORGAN._nut || [], kn = its.filter(i => known(i.id)).length, due = dueList(its).length;
    const gs = NV.g === 'all' ? GROUPS : [NV.g], sel = NV.id && BY[NV.id];
    return `${topbar('home')}<div class="row spread" style="align-items:flex-end"><div style="display:grid;gap:2px"><span class="eyebrow">Ernährungsmedizin</span><h2>Mikronährstoffe</h2></div><span class="small muted">${kn}/${its.length} gelernt</span></div>
      <p class="small muted" style="margin:0">Funktion, Aufnahme, Mangel, Labor, Interaktionen. Referenzwerte nach D-A-CH (DGE), obere Grenzen nach EFSA, jeweils mit Quelle.</p>
      <button class="btn primary big" data-act="nut-round">${due ? `Lernrunde · ${due} fällig` : 'Lernrunde: Mikronährstoffe'}</button>
      <div class="chips scrollx">${[['all', 'Alle'], ...GROUPS.map(g => [g, g])].map(([k, l]) => `<button class="chip" aria-pressed="${NV.g === k}" data-act="nut-g" data-v="${k}">${esc(l)}</button>`).join('')}</div>
      ${sel ? nutCard(sel) : ''}
      ${gs.map(g => { const xs = N.filter(n => n.gruppe === g); return xs.length ? `<section class="card"><h3>${esc(g)}</h3><div class="dlist">${xs.map(n => `<button class="dchip${NV.id === n.id ? ' on' : ''}" data-act="nut-pick" data-v="${n.id}">${solid('n.' + n.id) ? '✓ ' : ''}${esc(n.name)}</button>`).join('')}</div></section>` : ''; }).join('')}`;
  };
  const A = X.acts;
  A['nut-open'] = () => { NV.id = null; go('nut'); };
  A['nut-g'] = v => { NV.g = v; render(); };
  A['nut-pick'] = v => { NV.id = NV.id === v ? null : v; render(); if (NV.id) scrollTo(0, 0); };
  A['nut-round'] = () => startRound({ organ: '_nut' });

  /* ---------- cross links: a disease or a pathway shows the nutrients that belong to it ---------- */
  const chips = xs => `<div class="frow"><span class="flab">Mikronährstoffe</span><span class="dlist">${xs.map(n => `<button class="dchip" data-act="nut-go" data-v="${n.id}">🥗 ${esc(n.name)}</button>`).join('')}</span></div>`;
  A['nut-go'] = v => { NV.id = v; NV.g = 'all'; go('nut'); scrollTo(0, 0); };
  X.disExtra.push(d => { const xs = N.filter(n => ((n.links || {}).dis || []).includes(d.id)); return xs.length ? chips(xs) : ''; });
  X.pathExtra.push(p => { const xs = N.filter(n => ((n.links || {}).path || []).includes(p.id)); return xs.length ? chips(xs) : ''; });
  X.soc.nut = id => { const n = BY[id]; return n && { kind: 'nut', id, title: n.name, organ: 'Mikronährstoffe', text: FLD.map(([k, l]) => n[k] ? l + ': ' + n[k] : '').filter(Boolean).join('\n') }; };
})();
