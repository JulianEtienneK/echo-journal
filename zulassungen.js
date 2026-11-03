// Zulassungs-Radar in Echo: Daten aus zulassungen-data.js (monatlich aktualisiert).
(() => {
  const DATA = window.ZULASSUNGEN;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  (() => { const s = LS.get('echo-settings', {}); if (s.theme && s.theme !== 'system') document.documentElement.dataset.theme = s.theme; })();
  if (!DATA) { $('#app').innerHTML = '<p class="empty">Keine Daten gefunden.</p>'; return; }

  const GRUPPEN = ['Psychiatrie', 'Neurologie', 'Kardiometabolisch', 'Onkologie', 'Immunologie', 'Niere, Leber & GI', 'Selten & Hämatologie', 'Weitere'];
  const KURZ = { 'Niere, Leber & GI': 'Niere/Leber/GI', 'Selten & Hämatologie': 'Selten/Häma', 'Kardiometabolisch': 'Kardiometab.' };
  const farbe = (g) => `var(--g${Math.max(0, GRUPPEN.indexOf(g))})`;
  const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const t0 = new Date(DATA.stand.stand + 'T00:00:00Z');
  const datum = (s) => { if (!s) return '—'; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}.${m}.${y}`; };
  const usd = (v) => (v == null || !(+v > 0) ? '—' : '$' + new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 1 }).format(+v));
  const mrd = (v) => (v == null || !(+v > 0) ? '—' : new Intl.NumberFormat('de-DE').format(+v) + ' Mrd $');
  const signed = (v) => (v == null || isNaN(+v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(Math.round(v)) + ' %');

  // Scores wie im Dashboard: Impact aus vier gewichteten Komponenten, erwarteter Impact = Impact × P.
  const W = Object.fromEntries(DATA.gewichte.map((g) => [g.komponente, +g.gewicht]));
  const WS = W.Reichweite + W['Unmet Need'] + W['Effektstärke'] + W.Neuheit;
  const skala = (x) => (+x - 1) / 4;
  const K = DATA.kandidaten.map((k) => {
    const pat = +k.patienten || 0;
    const reich = pat > 0 ? Math.min(1, Math.max(0, (Math.log10(pat) - 3) / 5)) : 0;
    const impact = Math.round(100 * (W.Reichweite * reich + W['Unmet Need'] * skala(k.unmet_need) + W['Effektstärke'] * skala(k.effekt) + W.Neuheit * skala(k.neuheit)) / WS);
    const p = +k.p_zulassung / 100, wert = 3 * (+k.peak_sales_mrd || 0), kap = +k.marktkap_mrd || 0;
    const ok = wert > 0 && kap > 0;
    const tage = Math.round((new Date(k.erste_entscheidung + 'T00:00:00Z') - t0) / 864e5);
    return { ...k, impact, erwartet: Math.round(impact * p), tage,
      kurs_hoch: ok ? Math.round(Math.min(300, (1 - p) * wert / kap * 100)) : null,
      kurs_tief: ok ? Math.round(Math.max(-85, -p * wert / kap * 100)) : null };
  });
  const byId = new Map(K.map((k) => [k.id, k]));

  const S = Object.assign({ view: 'zeitplan', gruppe: '', sort: 'erwartet' }, LS.get('echo-zulassungen', {}));
  const save = () => LS.set('echo-zulassungen', { view: S.view, gruppe: S.gruppe, sort: S.sort });
  const gefiltert = () => K.filter((k) => !S.gruppe || (S.gruppe === 'Depot' ? !!k.depot_bezug : k.gruppe === S.gruppe));

  const pbar = (k) => `<div class="pbar"><i style="width:${Math.max(0, Math.min(100, +k.p_zulassung))}%;background:${farbe(k.gruppe)}"></i></div>`;
  const tags = (k) => [k.psychedelikum ? '<span class="tag gold">Psychedelikum</span>' : '', k.first_in_class ? '<span class="tag ok">First-in-class</span>' : '', k.depot_bezug ? `<span class="tag rec">${esc(k.depot_bezug)}</span>` : ''].join('');
  const item = (k, sub) => `<button class="item" data-id="${esc(k.id)}"><span class="stripe" style="background:${farbe(k.gruppe)}"></span>
    <div class="row spread" style="align-items:flex-start"><span class="nm">${esc(k.wirkstoff)}</span><span class="mono small">${esc(k.p_zulassung)} %</span></div>
    <div class="meta"><span>${esc(k.indikation.length > 90 ? k.indikation.slice(0, 88) + '…' : k.indikation)}</span></div>
    ${pbar(k)}
    <div class="meta"><span>${esc(sub || k.erste_entscheidung_text)}</span><span>Impact ${k.impact}</span><span>erwartet ${k.erwartet}</span>${tags(k)}</div></button>`;

  const filterChips = () => `<div class="chips">${['', ...GRUPPEN, 'Depot'].map((g) => {
    const n = g ? K.filter((k) => (g === 'Depot' ? !!k.depot_bezug : k.gruppe === g)).length : K.length;
    if (!n) return '';
    return `<button class="chip" data-gruppe="${esc(g)}" aria-pressed="${S.gruppe === g}">${g && g !== 'Depot' ? `<span class="dot" style="background:${farbe(g)}"></span>` : ''}${esc(g ? (KURZ[g] || g) : 'Alle')} <span class="muted">${n}</span></button>`;
  }).join('')}</div>`;

  // ---------- Ansichten ----------
  const viewZeitplan = () => {
    const ids = new Set(gefiltert().map((k) => k.id));
    const ende = new Date(t0); ende.setUTCMonth(ende.getUTCMonth() + 37);
    const ev = DATA.termine.filter((t) => ids.has(t.id)).map((t) => ({ ...t, d: new Date(t.datum + 'T00:00:00Z') })).filter((t) => t.d >= t0 && t.d <= ende).sort((a, b) => a.d - b.d);
    const groups = new Map();
    ev.forEach((e) => { const key = e.datum.slice(0, 7); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(e); });
    if (!groups.size) return '<p class="empty">Keine Termine für diesen Filter.</p>';
    return [...groups].map(([key, list]) => {
      const [y, m] = key.split('-');
      return `<section class="month"><h3>${MON[+m - 1]} ${y} <span class="muted small">· ${list.length}</span></h3>${list.map((e) => {
        const k = byId.get(e.id);
        const was = e.behoerde === 'Daten' ? 'Studiendaten' : e.behoerde + '-Entscheidung';
        return item(k, `${was} · ${e.datum_text}${e.bestaetigt ? ' ✓' : ' (geschätzt)'}`);
      }).join('')}</section>`;
    }).join('');
  };

  const matrix = (list) => {
    const w = 560, h = 300, m = { l: 34, r: 10, t: 10, b: 28 };
    const x = (p) => m.l + (p / 100) * (w - m.l - m.r), y = (v) => h - m.b - (v / 100) * (h - m.t - m.b);
    const r = (pat) => 3 + Math.sqrt(Math.min(1, Math.max(0, (Math.log10(pat || 1e3) - 3) / 5.5))) * 9;
    const grid = [0, 25, 50, 75, 100].map((v) => `<line class="ax" x1="${x(v)}" x2="${x(v)}" y1="${y(0)}" y2="${y(100)}"/><text x="${x(v)}" y="${h - 10}" text-anchor="middle">${v} %</text><line class="ax" x1="${x(0)}" x2="${x(100)}" y1="${y(v)}" y2="${y(v)}"/><text x="${m.l - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('');
    const dots = [...list].sort((a, b) => (+b.patienten || 0) - (+a.patienten || 0)).map((k) => `<circle data-id="${esc(k.id)}" cx="${x(+k.p_zulassung).toFixed(1)}" cy="${y(k.impact).toFixed(1)}" r="${r(+k.patienten).toFixed(1)}" fill="${farbe(k.gruppe)}" fill-opacity=".8"><title>${esc(k.wirkstoff)}</title></circle>`).join('');
    const q = `<text x="${x(98)}" y="${y(96)}" text-anchor="end">Wahrscheinliche Durchbrüche</text><text x="${x(2)}" y="${y(96)}">Riskante Wetten</text><text x="${x(98)}" y="${y(3)}" text-anchor="end">Solide Routine</text>`;
    return `<div class="card"><div class="row spread"><h3>Wirkung gegen Wahrscheinlichkeit</h3><span class="tiny muted">tippen = Details</span></div><div class="matrix"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Impact gegen Zulassungswahrscheinlichkeit">${grid}${q}${dots}</svg></div><p class="tiny muted">x: Zulassungswahrscheinlichkeit · y: Impact-Score · Größe: Patientenzahl</p></div>`;
  };
  const viewRangliste = () => {
    const sorts = [['erwartet', 'Erw. Impact'], ['p_zulassung', 'Wahrscheinlichkeit'], ['impact', 'Impact'], ['kosten_jahr_usd', 'Kosten'], ['kurs_hoch', 'Kurshebel']];
    const list = gefiltert().sort((a, b) => (+b[S.sort] || -1) - (+a[S.sort] || -1));
    const extra = (k) => S.sort === 'kosten_jahr_usd' ? `${usd(k.kosten_jahr_usd)}/Jahr · ${k.erste_entscheidung_text}` : S.sort === 'kurs_hoch' ? `Kurs grob ${signed(k.kurs_hoch)} / ${signed(k.kurs_tief)} · ${k.ticker_direkt || '—'}` : k.erste_entscheidung_text;
    return `${matrix(list)}<div class="chips">${sorts.map(([k, l]) => `<button class="chip" data-sort="${k}" aria-pressed="${S.sort === k}">${esc(l)}</button>`).join('')}</div>${list.map((k) => item(k, extra(k))).join('') || '<p class="empty">Keine Kandidaten.</p>'}`;
  };
  const viewPsy = () => {
    const psy = K.filter((k) => k.gruppe === 'Psychiatrie');
    const groups = new Map();
    psy.sort((a, b) => a.erste_entscheidung.localeCompare(b.erste_entscheidung)).forEach((k) => { const s = k.subbereich || 'Weitere'; if (!groups.has(s)) groups.set(s, []); groups.get(s).push(k); });
    const psyche = psy.filter((k) => k.psychedelikum).sort((a, b) => String(a.meilenstein_datum || a.erste_entscheidung).localeCompare(String(b.meilenstein_datum || b.erste_entscheidung)));
    const neuro = K.filter((k) => k.gruppe === 'Neurologie').sort((a, b) => a.erste_entscheidung.localeCompare(b.erste_entscheidung));
    return `<div class="card"><h3>Psychedelika: nächste Katalysatoren</h3><table class="t"><tbody>${psyche.map((k) => `<tr data-id="${esc(k.id)}" style="cursor:pointer"><td><b>${esc(k.wirkstoff)}</b><br><span class="muted tiny">${esc(k.naechster_meilenstein || '—')}</span></td><td class="r">${esc(k.meilenstein_text || k.erste_entscheidung_text)}<br><span class="muted tiny">${esc(k.p_zulassung)} %</span></td></tr>`).join('')}</tbody></table><p class="tiny muted">Zentrales Behördenrisiko bei Psychedelika: funktionelle Entblindung und Erwartungseffekte.</p></div>
    ${[...groups].sort((a, b) => b[1].length - a[1].length).map(([s, list]) => `<section class="month"><h3>${esc(s)} <span class="muted small">· ${list.length}</span></h3>${list.map((k) => item(k)).join('')}</section>`).join('')}
    <section class="month"><h3>Neurologie <span class="muted small">· ${neuro.length}</span></h3>${neuro.map((k) => item(k)).join('')}</section>`;
  };
  const viewDepot = () => {
    const list = K.filter((k) => k.depot_bezug).sort((a, b) => a.erste_entscheidung.localeCompare(b.erste_entscheidung));
    return `<p class="note">Bewertung und Wahrscheinlichkeit sind neutral. Hier steht getrennt, wie ein Kandidat zu Depot- oder Merklistenwerten passt. Keine Anlageberatung.</p>
    ${list.map((k) => `<button class="item" data-id="${esc(k.id)}"><span class="stripe" style="background:${farbe(k.gruppe)}"></span><div class="row spread"><span class="nm">${esc(k.wirkstoff)}</span><span class="tag rec">${esc(k.depot_bezug)}</span></div><div class="meta"><span>${esc(k.ticker_direkt || k.sponsor)}</span><span>${esc(k.meilenstein_text || k.erste_entscheidung_text)}</span><span>P ${esc(k.p_zulassung)} %</span></div><p class="small">${esc(k.depot_notiz)}</p></button>`).join('')}`;
  };
  const viewMethodik = () => `<div class="card prose"><h3>So entstehen die Zahlen</h3>
    <p><b>Impact-Score (0–100)</b>: gewichtete Summe aus Reichweite (Patienten in USA und EU, logarithmisch), Unmet Need, Effektstärke und Neuheit, je 1 bis 5 mit Begründung.</p>
    <p><b>Wahrscheinlichkeit</b>: historische Basisrate der Stufe, je Kandidat angepasst (Datenqualität, Sicherheit, Surrogat-Endpunkt, Beiräte, frühere Ablehnungen, Sonderstatus). Bei Phase-3-Programmen gilt sie für eine Zulassung bis Ende 2029.</p>
    <p><b>Erwarteter Impact</b> = Impact × Wahrscheinlichkeit. <b>Kurshebel</b>: Wert des Medikaments (3 × Spitzenumsatz) im Verhältnis zum Börsenwert, gewichtet mit dem noch nicht eingepreisten Anteil. Nur eine Größenordnung.</p>
    <table class="t"><thead><tr><th>Komponente</th><th class="r">Gewicht</th></tr></thead><tbody>${DATA.gewichte.map((g) => `<tr><td>${esc(g.komponente)}<br><span class="muted tiny">${esc(g.beschreibung)}</span></td><td class="r">${Math.round(g.gewicht * 100)} %</td></tr>`).join('')}</tbody></table>
    <table class="t"><thead><tr><th>Historische Erfolgsrate</th><th class="r">Erfolg</th></tr></thead><tbody>${DATA.basisraten.map((b) => `<tr><td>${esc(b.stufe)}<br><span class="muted tiny">${esc(b.quelle)}</span></td><td class="r">${Math.round(b.wahrscheinlichkeit)} %</td></tr>`).join('')}</tbody></table></div>
    <div class="card prose"><h3>Monats-Check</h3><ol>
      <li>Entscheidungen des Vormonats: zugelassen, abgelehnt, verschoben?</li>
      <li>Neue Termine: angenommene Anträge, neue EMA-Validierungen, Japan.</li>
      <li>CHMP-Highlights der letzten Sitzung.</li>
      <li>Phase-3-Toplines und Kongressdaten.</li>
      <li>Beiräte und Fristverlängerungen der FDA.</li>
      <li>Preise, ICER-Berichte, G-BA-Beschlüsse.</li>
      <li>Psychiatrie gesondert, Depot-Bezug getrennt markieren.</li></ol>
      <p class="small muted">Läuft automatisch am 1. jedes Monats und aktualisiert diese Seite und das Dashboard.</p></div>
    <div class="card"><h3>Änderungsprotokoll</h3><table class="t"><tbody>${[...DATA.aenderungen].sort((a, b) => b.datum.localeCompare(a.datum) || b.nr - a.nr).map((a) => `<tr><td class="mono tiny" style="white-space:nowrap">${datum(a.datum)}</td><td><b>${esc(a.kandidat)}</b> · <span class="muted">${esc(a.art)}</span><br>${esc(a.notiz)}</td></tr>`).join('')}</tbody></table></div>`;

  const VIEWS = [['zeitplan', 'Zeitplan', viewZeitplan, true], ['rangliste', 'Rangliste', viewRangliste, true], ['psy', 'Psychiatrie', viewPsy, false], ['depot', 'Depot', viewDepot, false], ['methodik', 'Methodik', viewMethodik, false]];

  const render = () => {
    const in90 = K.filter((k) => k.tage >= 0 && k.tage <= 90).length;
    const v = VIEWS.find((x) => x[0] === S.view) || VIEWS[0];
    $('#app').innerHTML = `<div class="topbar"><a class="link" href="./#games">← Echo</a><span class="eyebrow">💊 Zulassungs-Radar</span></div>
      <div style="display:grid;gap:4px"><h1>Zulassungs-Radar</h1><p class="small muted">Stand ${datum(DATA.stand.stand)} · nächstes Update ${datum(DATA.stand.naechstes_update)} · FDA, EMA, PMDA bis Ende 2029</p></div>
      <div class="stats"><div class="stat"><span class="tiny muted">In 90 Tagen</span><b>${in90}</b></div><div class="stat"><span class="tiny muted">Psychiatrie</span><b>${K.filter((k) => k.gruppe === 'Psychiatrie').length}</b></div><div class="stat"><span class="tiny muted">Kandidaten</span><b>${K.length}</b></div></div>
      <div class="seg">${VIEWS.map(([id, label]) => `<button data-view="${id}" aria-pressed="${S.view === id}">${label}</button>`).join('')}</div>
      ${v[3] ? filterChips() : ''}
      ${v[2]()}`;
  };

  const sheet = (id) => {
    const k = byId.get(id);
    if (!k) return;
    const blk = (t, x) => (x ? `<div class="blk"><h4>${esc(t)}</h4><p>${esc(x)}</p></div>` : '');
    const ag = [['FDA (USA)', k.fda_termin, k.fda_status], ['EMA (EU)', k.ema_termin, k.ema_status], ['PMDA (Japan)', k.pmda_termin, k.pmda_status], ['Nächster Meilenstein', k.meilenstein_text, k.naechster_meilenstein]];
    const q = String(k.quellen || '').split('|').map((s) => s.trim()).filter((s) => /^https:\/\//.test(s));
    $('#sheet-panel').innerHTML = `<div class="row spread"><span class="eyebrow"><span class="dot" style="display:inline-block;background:${farbe(k.gruppe)}"></span> ${esc(k.gruppe)} · ${esc(k.subbereich)}</span><button class="link" data-close>Schließen</button></div>
      <div style="display:grid;gap:4px"><h2>${esc(k.wirkstoff)}</h2><p class="small muted">${esc(k.sponsor)} · ${esc(k.indikation)}</p></div>
      <div class="row" style="flex-wrap:wrap;gap:6px">${tags(k)}${k.modalitaet ? `<span class="tag">${esc(k.modalitaet)}</span>` : ''}</div>
      <div class="nums"><div>P(Zulassung)<b>${esc(k.p_zulassung)} %</b></div><div>Impact<b>${k.impact}</b></div><div>Erwartet<b>${k.erwartet}</b></div><div>Kosten/Jahr<b>${usd(k.kosten_jahr_usd)}</b></div><div>Patienten<b>${k.patienten ? new Intl.NumberFormat('de-DE', { notation: 'compact' }).format(+k.patienten) : '—'}</b></div><div>Peak Sales<b>${mrd(k.peak_sales_mrd)}</b></div></div>
      ${pbar(k)}
      <div class="agencies">${ag.map(([n, t, s]) => `<div><span class="muted">${esc(n)}</span><b>${esc(t || '—')}</b><span class="muted">${esc(s || 'kein Antrag bekannt')}</span></div>`).join('')}</div>
      ${blk('Begründung', k.begruendung)}${blk('Warum diese Wahrscheinlichkeit', k.p_begruendung)}${blk('Studiendaten', k.kerndaten)}${blk('Risiken', k.risiken)}${blk('Mechanismus', k.mechanismus)}${blk('Scores', k.score_notiz)}
      ${blk('Patienten', k.patienten_text)}${blk('Preisbasis', k.kosten_basis)}${blk('Kosteneffektivität', k.kosteneffektivitaet)}${blk('Budget-Impact', k.budget_impact)}
      <div class="blk"><h4>Investment (neutral)</h4><p>${esc(k.ticker_direkt || 'kein direkter Börsenwert')} · Relevanz ${esc(k.aktien_relevanz || '—')}${k.kurs_hoch != null ? ` · grob <span class="up">${signed(k.kurs_hoch)}</span> bei Ja, <span class="down">${signed(k.kurs_tief)}</span> bei Nein` : ''}</p>${k.plays_indirekt ? `<p class="small muted">Indirekt: ${esc(k.plays_indirekt)}</p>` : ''}</div>
      ${k.depot_bezug ? `<div class="depot"><h4>Depot-Passung (${esc(k.depot_bezug)})</h4><p class="small">${esc(k.depot_notiz)}</p></div>` : ''}
      ${blk('Prüfstatus', k.pruefstatus)}
      ${q.length ? `<div class="blk src"><h4>Quellen</h4>${q.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https:\/\/(www\.)?/, '').slice(0, 80))}</a>`).join('')}</div>` : ''}`;
    $('#sheet').hidden = false;
    $('#sheet-panel').scrollTop = 0;
  };

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-close]') || t.id === 'sheet') { $('#sheet').hidden = true; return; }
    const v = t.closest('[data-view]'); if (v) { S.view = v.dataset.view; save(); render(); window.scrollTo(0, 0); return; }
    const g = t.closest('[data-gruppe]'); if (g) { S.gruppe = g.dataset.gruppe; save(); render(); return; }
    const so = t.closest('[data-sort]'); if (so) { S.sort = so.dataset.sort; save(); render(); return; }
    const it = t.closest('[data-id]'); if (it) sheet(it.dataset.id);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#sheet').hidden = true; });
  render();
})();
