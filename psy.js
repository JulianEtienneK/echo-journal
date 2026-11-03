/* Gehirn & Psyche: layer of the Medizin-Atlas. Data: window.PSY (psy-data.js); maps: psy-svg.js; engine hooks: window.MEDEXT (med.js). */
'use strict';
(function () {
  const P = window.PSY; if (!P || !window.MEDEXT) return;
  const X = window.MEDEXT;
  const REG = P.regions || {}, NETS = P.networks || [], NTS = P.transmitters || [], DISO = P.disorders || [], DRUGS = P.drugs || [], CARDS = P.cards || [], STORY = P.story || [];
  const rname = id => (REG[id] || {}).name || id;
  const NT_COL = { Serotonin: '#5E9BD6', Dopamin: '#E8B63E', Noradrenalin: '#4FA3A0', Acetylcholin: '#7FB8C9', Glutamat: '#9DBF6E', GABA: '#8C6BB0', Orexin: '#E07A6C', Hypocretin: '#E07A6C', Histamin: '#C47F25' };
  const ntCol = n => { for (const k in NT_COL) if (String(n).includes(k)) return NT_COL[k]; return '#E8A04B'; };
  const HOW = { hyper: 'überaktiv', hypo: 'unteraktiv', atrophy: 'Volumen ↓', loss: 'Zellverlust', dysconnect: 'Konnektivität gestört', lesion: 'Läsion', focus: 'im Fokus' };
  const TRACK = { model: 'Modelle der Depression', mech: 'Psilocybin: Mechanismen', study: 'Psilocybin: Wirksamkeit', safety: 'Sicherheit', method: 'Methodik', reg: 'Zulassung & Regulierung', prak: 'Mein Praktikum' };
  const sid = r => typeof r === 'string' ? r : r.r, shw = (r, d) => typeof r === 'string' ? d : r.how;
  const VIEWS = [['psy_lat', 'Seite'], ['psy_med', 'Mitte'], ['psy_cor', 'Frontal'], ['psy_syn', 'Synapse']];
  for (const [id, r] of Object.entries(REG)) X.names[id] = { name: r.name };

  /* ---------- learning cards ---------- */
  const addI = (id, kind, organ, stage, ref) => { const it = { id, kind, organ, stage, ref }; ITEMS[id] = it; ALL.push(it); (BY_ORGAN[organ] = BY_ORGAN[organ] || []).push(it); };
  for (const [id, r] of Object.entries(REG)) addI('pr.' + id, 'preg', '_psy', r.l || 1, Object.assign({ id }, r));
  for (const n of NETS) addI('pn.' + n.id, 'pnet', '_psy', n.level || 2, n);
  for (const t of NTS) addI('pt.' + t.id, 'pnt', '_psy', t.level || 2, t);
  for (const d of DISO) addI('pd.' + d.id, 'pdis', '_psy', d.level || 3, d);
  for (const d of DRUGS) addI('pm.' + d.id, 'pdrug', '_psy', d.level || 4, d);
  for (const c of CARDS) addI('pc.' + c.id, 'pcard', c.track === 'prak' ? '_prak' : '_psy', c.track === 'prak' ? 1 : (c.level || 4), c);
  const PSTAGE = ['', 'Regionen & Funktionen', 'Netzwerke & Botenstoffe', 'Störungen & Schaltkreise', 'Pharmakologie & Forschung'];

  const viewOf = ids => { let best = VIEWS[1][0], n = -1; for (const [k] of VIEWS) { const svg = MEDSVG.detail(k), c = ids.filter(i => svg.includes(`data-s="${i}"`)).length; if (c > n) { n = c; best = k; } } return best; };
  const onView = (k, id) => MEDSVG.detail(k).includes(`data-s="${id}"`);
  const fromMcq = (it, list, b, eyebrow) => { const m = list[b % list.length]; return { it, type: 'mc', eyebrow, prompt: m.q, opts: mcOpts(m.a, m.w.slice(0, 3)), why: m.why, long: (m.a + m.w.join('')).length > 120 }; };
  X.q.preg = (it, b) => {
    const r = it.ref, k = viewOf([r.id]), mc = r.mcq || [];
    if (b % 3 === 0 && onView(k, r.id)) return { it, type: 'tap', eyebrow: 'Gehirn · Stufe ' + it.stage, prompt: 'Tippe: ' + short(r.name), map: { kind: 'detail', key: k, target: r.id } };
    if (b % 3 === 1 && r.fn) { const w = others(Object.values(REG).filter(x => x.fn), r, 3, x => x.name).map(x => short(x.name)); return { it, type: 'mc', eyebrow: 'Funktion', prompt: 'Welche Region ist das?', sub: mask(r.fn, r.name), opts: mcOpts(short(r.name), w) }; }
    if (mc.length) return fromMcq(it, mc, b, 'Gehirn · Stufe ' + it.stage);
    return { it, type: 'mc', eyebrow: 'Gehirn', prompt: r.q || 'Welche Region?', opts: mcOpts(short(r.name), others(Object.values(REG), r, 3, x => x.name).map(x => short(x.name))) };
  };
  X.q.pnet = (it, b) => {
    const n = it.ref, k = viewOf(n.regions || []), tg = (n.regions || []).filter(i => onView(k, i));
    if (b % 2 === 1 && tg.length) return { it, type: 'tap', eyebrow: n.name, prompt: 'Tippe eine Region, die zu diesem Netzwerk gehört: ' + n.name, map: { kind: 'detail', key: k, targets: tg, target: tg[0] } };
    if ((n.mcq || []).length) return fromMcq(it, n.mcq, b >> 1, 'Netzwerke & Schaltkreise');
    return { it, type: 'mc', eyebrow: 'Netzwerke', prompt: 'Welches Netzwerk ist gemeint?', sub: mask(n.fn, n.name), opts: mcOpts(n.name, others(NETS, n, 3, x => x.id).map(x => x.name)) };
  };
  X.q.pnt = (it, b) => {
    const t = it.ref, k = viewOf([t.from]);
    if (b % 2 === 0 && t.from && onView(k, t.from)) return { it, type: 'tap', eyebrow: t.nt, prompt: 'Wo entspringt: ' + t.name + '?', map: { kind: 'detail', key: k, target: t.from } };
    if ((t.mcq || []).length) return fromMcq(it, t.mcq, b >> 1, t.nt);
    return { it, type: 'mc', eyebrow: t.nt, prompt: 'Welche Bahn ist gemeint?', sub: mask(t.fn, t.name), opts: mcOpts(t.name, others(NTS, t, 3, x => x.id).map(x => x.name)) };
  };
  X.q.pdis = (it, b) => {
    const d = it.ref, rs = d.regions || [], hy = rs.filter(r => r.how === 'hyper'), pool = hy.length ? hy : rs, k = viewOf(pool.map(r => r.r)), tg = pool.map(r => r.r).filter(i => onView(k, i));
    if (b % 2 === 0 && tg.length) return { it, type: 'tap', eyebrow: d.name, prompt: 'Tippe eine Region, die bei ' + short(d.name) + (hy.length ? ' überaktiv ist.' : ' verändert ist.'), map: { kind: 'detail', key: k, targets: tg, target: tg[0] } };
    if ((d.mcq || []).length) return fromMcq(it, d.mcq, b >> 1, 'Störungen & Schaltkreise');
    return { it, type: 'mc', eyebrow: 'Störungen', prompt: 'Welche Störung passt?', sub: (d.models || []).join(' · '), opts: mcOpts(d.name, others(DISO, d, 3, x => x.id).map(x => x.name)) };
  };
  X.q.pdrug = (it, b) => {
    const d = it.ref;
    if ((d.mcq || []).length && b % 3 !== 1) return fromMcq(it, d.mcq, b, d.cls || 'Pharmakologie');
    return { it, type: 'mc', eyebrow: 'Pharmakologie', prompt: 'Woran setzt „' + short(d.name) + '“ an?', opts: mcOpts(d.target, others(DRUGS.filter(x => x.target !== d.target), d, 3, x => x.target).map(x => x.target)), long: true };
  };
  X.q.pcard = (it, b) => {
    const c = it.ref;
    if ((c.mcq || []).length && b % 3 !== 2) return fromMcq(it, c.mcq, b, TRACK[c.track] || 'Forschung');
    const sibs = CARDS.filter(x => x.track === c.track && x.id !== c.id);
    return { it, type: 'mc', eyebrow: TRACK[c.track] || 'Forschung', prompt: 'Worum geht es?', sub: mask(c.text, c.title), opts: mcOpts(c.title, others(sibs.length >= 3 ? sibs : CARDS, c, 3, x => x.id).map(x => x.title)) };
  };
  const howBadge = h => `<span class="how ${h}">${HOW[h] || h}</span>`;
  const regionChips = (list, act = 'psy-reg') => `<div class="dlist">${list.map(x => { const id = typeof x === 'string' ? x : x.r; return `<button class="dchip" data-act="${act}" data-v="${id}">${esc(short(rname(id)))}${typeof x === 'string' ? '' : ' ' + howBadge(x.how)}</button>`; }).join('')}</div>`;
  const frow = (lab, val, cls = '') => val ? `<div class="frow ${cls}"><span class="flab">${lab}</span><span>${val}</span></div>` : '';
  function card(kind, x) {
    if (kind === 'reg') {
      const inNet = NETS.filter(n => (n.regions || []).includes(x.id)), inNt = NTS.filter(t => t.from === x.id || (t.to || []).includes(x.id)), inDis = DISO.filter(d => (d.regions || []).some(r => r.r === x.id)), inDrug = DRUGS.filter(d => (d.regions || []).includes(x.id));
      return `<div class="dcard sel"><h3>${esc(x.name)}</h3>${frow('Funktion', esc(x.fn))}${frow('Psychiatrie & Neurologie', esc(x.psych))}${frow('Prüfungsfakt', esc(x.fact))}
        ${inNet.length ? frow('Netzwerke & Kreise', `<div class="dlist">${inNet.map(n => `<button class="dchip" data-act="psy-pick" data-v="net|${n.id}">${esc(n.name)}</button>`).join('')}</div>`) : ''}
        ${inNt.length ? frow('Botenstoffbahnen', `<div class="dlist">${inNt.map(t => `<button class="dchip" data-act="psy-pick" data-v="nt|${t.id}">${esc(t.name)}</button>`).join('')}</div>`) : ''}
        ${inDis.length ? frow('Bei Störungen', `<div class="dlist">${inDis.map(d => `<button class="dchip" data-act="psy-pick" data-v="dis|${d.id}">${esc(short(d.name))} ${howBadge(d.regions.find(r => r.r === x.id).how)}</button>`).join('')}</div>`) : ''}
        ${inDrug.length ? frow('Ansatzpunkt von', `<div class="dlist">${inDrug.map(d => `<button class="dchip" data-act="psy-pick" data-v="drug|${d.id}">${esc(short(d.name))}</button>`).join('')}</div>`) : ''}</div>`;
    }
    if (kind === 'net') return `<div class="dcard"><h3>${esc(x.name)}</h3>${frow('Funktion', esc(x.fn))}${frow('Bei Störungen & Psychedelika', esc(x.psych))}${frow('Regionen', regionChips(x.regions || []))}</div>`;
    if (kind === 'nt') return `<div class="dcard"><div class="row spread" style="flex-wrap:wrap"><h3>${esc(x.name)}</h3><span class="how focus" style="color:${ntCol(x.nt)}">${esc(x.nt)}</span></div>${frow('Ursprung → Ziele', esc(rname(x.from)) + ' → ' + (x.to || []).map(rname).map(esc).join(', '))}${frow('Funktion', esc(x.fn))}${frow('Störungen & Pharmaka', esc(x.psych))}</div>`;
    if (kind === 'dis') {
      const md = x.dis && DIS_ID[x.dis];
      return `<div class="dcard"><h3>${esc(x.name)}</h3>${frow('Beteiligte Regionen', regionChips(x.regions || []))}${(x.regions || []).map(r => r.note ? `<span class="small">• <b>${esc(short(rname(r.r)))}</b>: ${esc(r.note)}</span>` : '').join('')}
        ${frow('Botenstoffe', esc((x.nt || []).join(', ')))}${(x.models || []).length ? frow('Modelle', x.models.map(m => '• ' + esc(m)).join('<br>')) : ''}${frow('🥗 Ernährung & Stoffwechsel', esc(x.nut), 'nut')}${x.src ? `<span class="small muted">Quellen: ${esc(x.src)}</span>` : ''}
        <div class="row" style="gap:8px;flex-wrap:wrap">${md ? `<button class="chip" data-act="dis" data-v="${md.id}">📋 Krankheitskarte</button>` : ''}<button class="chip" data-act="psy-soc" data-v="dis|${x.id}">🦉 Sokratisch vertiefen</button></div></div>`;
    }
    if (kind === 'drug') return `<div class="dcard"><div style="display:grid;gap:2px"><span class="eyebrow">${esc(x.cls || '')}</span><h3>${esc(x.name)}</h3></div>${frow('Angriffspunkt', esc(x.target))}${frow('Wirkort', regionChips(x.regions || []))}${frow('Mechanismus', esc(x.mech))}${frow('Einsatz', esc(x.use))}${frow('Nebenwirkungen & Risiken', esc(x.se))}${frow('🥗 Ernährung & Wechselwirkungen', esc(x.nut), 'nut')}
      <button class="chip" data-act="psy-soc" data-v="drug|${x.id}" style="justify-self:start">🦉 Sokratisch vertiefen</button></div>`;
    if (kind === 'card') return `<div class="dcard"><div style="display:grid;gap:2px"><span class="eyebrow">${esc(TRACK[x.track] || '')}</span><h3>${esc(x.title)}</h3></div><span>${esc(x.text)}</span>${(x.facts || []).map(f => `<span class="small">• ${esc(f)}</span>`).join('')}${(x.regions || []).length ? regionChips(x.regions) : ''}${x.src ? `<span class="small muted">Quelle: ${esc(x.src)}</span>` : ''}
      <button class="chip" data-act="psy-soc" data-v="card|${x.id}" style="justify-self:start">🦉 Sokratisch vertiefen</button></div>`;
    return '';
  }
  X.info.preg = it => card('reg', it.ref); X.info.pnet = it => card('net', it.ref); X.info.pnt = it => card('nt', it.ref);
  X.info.pdis = it => card('dis', it.ref); X.info.pdrug = it => card('drug', it.ref); X.info.pcard = it => card('card', it.ref);
  X.title.preg = it => it.ref.name; X.title.pnet = it => it.ref.name; X.title.pnt = it => it.ref.name; X.title.pdis = it => it.ref.name; X.title.pdrug = it => it.ref.name; X.title.pcard = it => it.ref.title;

  /* ---------- explorer state ---------- */
  const PV = { view: 'psy_med', layer: 'reg', pick: null, step: 0 };
  const LAYERS = [['reg', 'Regionen'], ['nt', 'Botenstoffe'], ['net', 'Netzwerke'], ['dis', 'Störungen'], ['drug', 'Medikamente']];
  const listFor = l => l === 'nt' ? NTS : l === 'net' ? NETS : l === 'dis' ? DISO : l === 'drug' ? DRUGS : [];
  const pickObj = () => { if (!PV.pick) return null; const [k, id] = PV.pick.split('|'); const o = listFor(k).find(x => x.id === id); return o ? { k, o } : null; };
  const pickRegions = p => !p ? [] : p.k === 'nt' ? [p.o.from, ...(p.o.to || [])] : p.k === 'dis' ? (p.o.regions || []).map(r => r.r) : (p.o.regions || []);
  function psyStats() { const it = [...(BY_ORGAN._psy || []), ...(BY_ORGAN._prak || [])], now = Date.now(); return { n: it.length, known: it.filter(i => known(i.id)).length, due: it.filter(i => seen(i.id) && M.c[i.id].d <= now && isOpen(i)).length, stage: stageOpen('_psy') }; }

  X.views.psy = () => {
    V.organ = 'psyche';
    const s = psyStats(), p = pickObj(), lst = listFor(PV.layer);
    const sel = V.sel && REG[V.sel] ? Object.assign({ id: V.sel }, REG[V.sel]) : null;
    return `${topbar('atlas')}<div class="row spread" style="align-items:flex-end"><div style="display:grid;gap:2px"><span class="eyebrow">Medizin-Atlas</span><h2>Gehirn & Psyche</h2></div><div style="text-align:right;display:grid;gap:4px;justify-items:end">${dots(s.stage)}<span class="small muted">Stufe ${s.stage} · ${s.known}/${s.n}</span></div></div>
      <div class="row" style="gap:8px"><button class="btn primary grow" data-act="psy-round">${s.due ? 'Lernrunde · ' + s.due + ' fällig' : 'Lernrunde'}</button>${STORY.length ? '<button class="btn grow" data-act="psy-story">✨ Depression & Psilocybin</button>' : ''}</div>
      ${CARDS.length ? `<div class="row" style="gap:8px">${CARDS.some(c => c.track !== 'prak') ? '<button class="btn grow" data-act="psy-lib">📚 Forschung</button>' : ''}${CARDS.some(c => c.track === 'prak') ? '<button class="btn grow" data-act="psy-prak">🧪 Mein Praktikum</button>' : ''}</div>` : ''}
      <div class="seg segscroll">${LAYERS.map(([k, l]) => `<button data-act="psy-layer" data-v="${k}" aria-pressed="${PV.layer === k}">${l}</button>`).join('')}</div>
      ${lst.length ? `<div class="chips scrollx">${lst.map(x => `<button class="chip" aria-pressed="${PV.pick === PV.layer + '|' + x.id}" data-act="psy-pick" data-v="${PV.layer}|${x.id}">${esc(short(x.name))}</button>`).join('')}</div>` : '<p class="small muted" style="margin:0">Tippe eine Region an. Darunter siehst du, in welchen Netzwerken, Bahnen und Störungen sie vorkommt.</p>'}
      <div class="chips">${VIEWS.map(([k, l]) => `<button class="chip" aria-pressed="${PV.view === k}" data-act="psy-view" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="mapbox zoomin" id="detailMap" data-key="${PV.view}">${MEDSVG.detail(PV.view)}<div class="mapctl"><button data-act="zoom" data-v="1">＋</button><button data-act="zoom" data-v="-1">－</button><button data-act="zoom" data-v="0">⟲</button><button data-act="labels" aria-pressed="${V.labels}">Aa</button></div></div>
      ${p ? card(p.k, p.o) : ''}${sel ? card('reg', sel) : ''}
      <section class="card"><h3>Stufen</h3>${[1, 2, 3, 4].map(l => { const it = (BY_ORGAN._psy || []).filter(i => i.stage === l); return it.length ? `<div class="stg ${l <= s.stage ? '' : 'lock'}" style="box-shadow:none;padding:6px 0"><div class="row spread"><b>Stufe ${l}: ${PSTAGE[l]}</b><span class="small muted">${l <= s.stage ? it.filter(i => known(i.id)).length + '/' + it.length : '🔒'}</span></div><div class="bar"><i style="width:${pct(it.filter(i => known(i.id)).length, it.length)}%"></i></div></div>` : ''; }).join('')}</section>`;
  };
  X.views['psy-story'] = () => {
    const st = STORY[PV.step] || {};
    return `${topbar('psy-open')}<div class="progress">${STORY.map((_, i) => `<i class="${i < PV.step ? 'ok' : i === PV.step ? 'cur' : ''}"></i>`).join('')}</div>
      <span class="eyebrow">Depression & Psilocybin · ${PV.step + 1}/${STORY.length}</span><h2>${esc(st.title || '')}</h2>
      ${(st.regions || []).length ? `<div class="mapbox zoomin" id="storyMap">${MEDSVG.detail(viewOf((st.regions || []).map(sid)))}</div>` : ''}
      <div class="dcard"><span>${esc(st.text || '')}</span>${(st.regions || []).length ? regionChips((st.regions || []).map(r => ({ r: sid(r), how: shw(r, st.how || 'focus') }))) : ''}</div>
      <div class="row" style="gap:8px">${PV.step ? '<button class="btn grow" data-act="psy-step" data-v="-1">Zurück</button>' : ''}${PV.step < STORY.length - 1 ? '<button class="btn primary grow" data-act="psy-step" data-v="1" id="qnext">Weiter</button>' : '<button class="btn primary grow" data-act="psy-round" id="qnext">Jetzt abfragen</button>'}</div>
      ${PV.step === STORY.length - 1 ? '<button class="chip" data-act="psy-soc" data-v="story|all" style="justify-self:start">🦉 Sokratisch durchdenken</button>' : ''}`;
  };
  const libView = (tracks, title, sub) => {
    const cs = CARDS.filter(c => tracks.includes(c.track));
    return `${topbar('psy-open')}<h2>${title}</h2><p class="small muted" style="margin:0">${sub}</p>
      ${tracks.map(t => { const xs = cs.filter(c => c.track === t); return xs.length ? `<div class="tierhead"><b>${TRACK[t]}</b><span class="small muted">${xs.length}</span></div>${xs.map(c => `<details class="dis"><summary><span>${esc(c.title)}</span>${solid('pc.' + c.id) ? '<span class="ok">✓</span>' : ''}</summary>${card('card', c)}</details>`).join('')}` : ''; }).join('')}
      <button class="btn primary big" data-act="${tracks.includes('prak') ? 'psy-round-prak' : 'psy-round-lib'}">Abfragen</button>`;
  };
  X.views['psy-lib'] = () => libView(['model', 'mech', 'study', 'safety', 'method', 'reg'], 'Forschung', 'Modelle der Depression, wie Psilocybin wirkt, was die Studien an Effekten zeigen, Methodik und Zulassung. Mit Quellen.');
  X.views['psy-prak'] = () => libView(['prak'], 'Mein Praktikum', 'Die Themen deiner Zeit in der AG Gründer am ZI Mannheim, jeweils mit Sokrates-Einstieg.');

  /* overlays on the brain maps */
  function centre(svg, id) { const g = svg.querySelector(`[data-s="${id}"]`); if (!g) return null; const b = g.getBBox(); return [b.x + b.width / 2, b.y + b.height / 2]; }
  function overlay(svg, p) {
    const NS = 'http://www.w3.org/2000/svg', ov = document.createElementNS(NS, 'g'); ov.setAttribute('class', 'ov');
    const curve = (a, b, col, bend = .18) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; const e = document.createElementNS(NS, 'path'); e.setAttribute('d', `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${(mx - dy * bend).toFixed(1)} ${(my + dx * bend).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`); e.setAttribute('class', 'ov-path'); e.style.color = col; e.style.stroke = col; ov.appendChild(e); };
    if (p.k === 'nt') { const a = centre(svg, p.o.from); if (a) for (const t of p.o.to || []) { const b = centre(svg, t); if (b) curve(a, b, ntCol(p.o.nt)); } }
    if (p.k === 'net') { const rs = (p.o.regions || []).map(r => centre(svg, r)).filter(Boolean); for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (j === i + 1 || i === 0) curve(rs[i], rs[j], '#E8A04B', .1); }
    svg.appendChild(ov);
  }
  X.labelOnly = svg => { if (V.view !== 'psy' || !svg.closest('#detailMap')) return null; const p = pickObj(); return p ? pickRegions(p) : null; };
  X.decorate.push(() => {
    const dm = document.getElementById('detailMap'), sm = document.getElementById('storyMap');
    if (V.view === 'psy' && dm) {
      const svg = dm.querySelector('svg'), p = pickObj();
      if (p) {
        svg.classList.add('fade');
        const how = {}; if (p.k === 'dis') for (const r of p.o.regions || []) how[r.r] = r.how;
        for (const id of pickRegions(p)) svg.querySelectorAll(`[data-s="${id}"]`).forEach(e => e.classList.add('hl', 'hl-' + (how[id] || 'focus')));
        overlay(svg, p);
      }
    }
    if (V.view === 'psy-story' && sm) {
      const svg = sm.querySelector('svg'), st = STORY[PV.step] || {}; svg.classList.add('fade', 'explore');
      for (const r of st.regions || []) svg.querySelectorAll(`[data-s="${sid(r)}"]`).forEach(e => e.classList.add('hl', 'hl-' + shw(r, st.how || 'focus')));
      labelMap(svg, (st.regions || []).map(sid));
    }
  });

  /* socratic hand-off */
  function soc(kind, id) {
    let m = null;
    if (kind === 'dis') { const d = DISO.find(x => x.id === id); if (d) m = { title: d.name + ' im Gehirn', organ: 'Gehirn & Psyche', text: ['Regionen: ' + (d.regions || []).map(r => rname(r.r) + ' (' + (HOW[r.how] || r.how) + (r.note ? ': ' + r.note : '') + ')').join('; '), 'Botenstoffe: ' + (d.nt || []).join(', '), 'Modelle: ' + (d.models || []).join('; '), d.nut ? 'Ernährung: ' + d.nut : ''].filter(Boolean).join('\n') }; }
    if (kind === 'drug') { const d = DRUGS.find(x => x.id === id); if (d) m = { title: d.name, organ: 'Pharmakologie', text: ['Klasse: ' + d.cls, 'Angriffspunkt: ' + d.target, 'Mechanismus: ' + d.mech, 'Einsatz: ' + d.use, 'Nebenwirkungen: ' + d.se, d.nut ? 'Ernährung: ' + d.nut : ''].filter(Boolean).join('\n') }; }
    if (kind === 'card') { const c = CARDS.find(x => x.id === id); if (c) m = { title: c.title, organ: TRACK[c.track], text: [c.text, ...(c.facts || []), c.src ? 'Quelle: ' + c.src : ''].filter(Boolean).join('\n') }; }
    if (kind === 'story') m = { title: 'Depression und Psilocybin im Gehirn', organ: 'Gehirn & Psyche', text: STORY.map(s => s.title + ': ' + s.text).join('\n') };
    if (kind === 'story' && !m) return;
    if (!m) return;
    LS.set('echo-med-soc', Object.assign(m, { kind: 'psy', id, at: Date.now() })); location.href = './?soc=med';
  }

  /* actions */
  const A = X.acts;
  A['psy-open'] = () => { V.organ = 'psyche'; ZM.k = 1; go('psy'); };
  A['psy-view'] = v => { PV.view = v; ZM.k = 1; render(); };
  A['psy-layer'] = v => { PV.layer = v; PV.pick = null; V.sel = null; render(); };
  A['psy-pick'] = v => { const [k] = v.split('|'); PV.layer = k; PV.pick = PV.pick === v ? null : v; V.sel = null; const p = pickObj(); if (p) PV.view = viewOf(pickRegions(p)); ZM.k = 1; if (V.view !== 'psy') go('psy'); else render(); };
  A['psy-reg'] = v => { PV.pick = null; PV.layer = 'reg'; V.sel = v; PV.view = viewOf([v]); ZM.k = 1; if (V.view !== 'psy') go('psy'); else render(); };
  A['psy-story'] = () => { PV.step = 0; go('psy-story'); };
  A['psy-step'] = v => { PV.step = Math.max(0, Math.min(STORY.length - 1, PV.step + (+v))); render(); scrollTo(0, 0); };
  A['psy-lib'] = () => go('psy-lib'); A['psy-prak'] = () => go('psy-prak');
  A['psy-round'] = () => startRound({ organ: '_psy' });
  A['psy-round-prak'] = () => startRound({ organ: '_prak' });
  A['psy-round-lib'] = () => startRound({ organ: '_psy', kind: 'pcard' });
  A['psy-soc'] = v => { const [k, id] = v.split('|'); soc(k, id); };
})();
