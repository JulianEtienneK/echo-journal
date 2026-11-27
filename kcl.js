/* Echo · King's College: Paper-Abend zur Vorbereitung der Masterarbeit bei Prof. Ana Rodriguez-Mateos (KCL, (Poly)phenole, kardiometabolische und psychische Gesundheit).
   Ablauf: 7 Minuten ein Paper lesen (Abstract wird live von PubMed geladen, Volltext über DOI), 3–5 Kernsätze in eigenen Worten,
   daraus Lernkarten (mit KI aus Abstract + Notizen, sonst selbst). Karten laufen mit wachsenden Abständen und gehen in die Eule-Morgenabfrage.
   Storage 'echo-kcl' = { cur: pmid, papers: { pmid: { st: 'neu'|'gelesen', reads: [day], notes } }, cards: { id: { q, a, pmid, b, due, n, lapses } }, days: { day: sec } }.
   Im Repo stehen nur bibliografische Angaben und eigene Einordnungen; Abstracts werden zur Laufzeit von PubMed geholt, nicht gespeichert. */
'use strict';
const K = 'echo-kcl';
const PAPERS = [
  { pmid: '38316606', doi: '10.1017/S0029665124000156', y: 2025, j: 'Proc Nutr Soc', a: 'Rodriguez-Mateos A, …, Cheok A', t: 'Dietary (poly)phenols and cardiometabolic health: from antioxidants to modulators of the gut microbiota', why: 'Ihr Überblick über das ganze Feld: vom alten Antioxidans-Modell zu Metaboliten und Darmmikrobiom. Zum Einstieg.' },
  { pmid: '25182418', doi: '10.1007/s00204-014-1330-7', y: 2014, j: 'Arch Toxicol', a: 'Rodriguez-Mateos A, …, Crozier A', t: 'Bioavailability, bioactivity and impact on health of dietary flavonoids and related compounds: an update', why: 'Grundlagen Bioverfügbarkeit und Stoffwechsel: Warum im Blut fast nur Metaboliten ankommen.' },
  { pmid: '30772905', doi: '10.1093/gerona/glz047', y: 2019, j: 'J Gerontol A', a: 'Rodriguez-Mateos A, …, Heiss C', t: 'Circulating anthocyanin metabolites mediate vascular benefits of blueberries: insights from RCTs, metabolomics, and nutrigenomics', why: 'Ihr Kernargument: Zirkulierende Metaboliten erklären die FMD-Effekte. Methodik RCT + Metabolomik.' },
  { pmid: '36972800', doi: '10.1016/j.ajcnut.2023.03.017', pmc: 'PMC10315404', y: 2023, j: 'Am J Clin Nutr', a: 'Wood E, …, Rodriguez-Mateos A', t: 'Wild blueberry (poly)phenols can improve vascular function and cognitive performance in healthy older individuals: a double-blind RCT', why: 'Vorzeige-RCT ihrer Gruppe: FMD, Blutdruck, Kognition, Mikrobiom in einem Design. Frei lesbar (PMC).' },
  { pmid: '42848805', doi: '10.1080/10408398.2026.2742757', y: 2026, j: 'Crit Rev Food Sci Nutr', a: 'Kamarunzaman NNZ, …, Rodriguez-Mateos A', t: '(Poly)phenol intake and mental health: a scoping review', why: 'Psychische Gesundheit: genau deine Schnittstelle (Ernährung und Depression). Was ist belegt, wo sind Lücken.' },
  { pmid: '42134099', doi: '10.1016/j.clnu.2026.106677', y: 2026, j: 'Clin Nutr', a: 'Kamarunzaman NNZ, …, Rodriguez-Mateos A', t: 'Effects of (poly)phenol-rich cranberry on mental health in university students: the CRANMOOD RCT', why: 'Neuestes Mental-Health-RCT der Gruppe; zeigt, wie sie Stimmung als Endpunkt misst.' },
  { pmid: '36825570', doi: '10.1039/d2fo02951k', y: 2023, j: 'Food Funct', a: 'Ma X, …, Rodriguez-Mateos A', t: 'Plant-based dietary patterns and their association with mood in healthy individuals', why: 'Ernährungsmuster und Stimmung, beobachtend: nah an deiner Bachelorarbeit und am Kolumbien-Paper.' },
  { pmid: '37097300', doi: '10.1039/d3fo00019b', y: 2023, j: 'Food Funct', a: 'Li Y, …, Rodriguez-Mateos A', t: '(Poly)phenol intake, plant-rich dietary patterns and cardiometabolic health: a cross-sectional study', why: 'Wie die Gruppe (Poly)phenol-Aufnahme schätzt und mit kardiometabolischen Markern verknüpft.' },
  { pmid: '41236381', doi: '10.1080/10408398.2025.2571158', y: 2026, j: 'Crit Rev Food Sci Nutr', a: 'Alotaibi W, …, Rodriguez-Mateos A', t: '(Poly)phenol metabotypes and cardiometabolic health: a systematic review', why: 'Metabotypen: Warum Menschen so unterschiedlich auf dieselben Polyphenole reagieren. Aktuelles Forschungsthema.' },
  { pmid: '42547102', doi: '10.1016/j.ajcnut.2026.101343', y: 2026, j: 'Am J Clin Nutr', a: 'Rodriguez-Mateos A, Heiss C', t: 'Anthocyanins and cardiometabolic risk: prevention, treatment, or risk-dependent effects?', why: 'Kurzer Kommentar mit ihrer aktuellen Position: wirken Anthocyane vor allem bei erhöhtem Risiko?' },
  { pmid: '41643817', doi: '10.1016/j.jnutbio.2026.110300', y: 2026, j: 'J Nutr Biochem', a: 'Li Y, …, Rodriguez-Mateos A', t: '(Poly)phenol and methylxanthine metabolites and their association with cognitive and cardiometabolic health in older people', why: 'Biomarker-Ansatz: Metaboliten in Urin/Plasma statt Fragebogen. Verbindet Kognition und Herz-Kreislauf.' },
  { pmid: '41140262', doi: '10.1039/d5fo01106j', y: 2025, j: 'Food Funct', a: 'Murphy BÓ, …, Gill CIR', t: 'The impact of (poly)phenol-rich foods and extracts on flow-mediated dilation (FMD): a narrative review', why: 'FMD ist der Standard-Endpunkt der Gruppe; hier Methode und Befundlage.' },
  { pmid: '40126033', doi: '10.1093/eurjpc/zwaf173', y: 2025, j: 'Eur J Prev Cardiol', a: 'Lagou V, …, Heiss C', t: 'Impact of flavan-3-ols on blood pressure and endothelial function in diverse populations: SR and meta-analysis of RCTs', why: 'Meta-Analyse mit ihr als Koautorin: Effektgrößen für Blutdruck und FMD, Grundlage jeder Einleitung.' },
  { pmid: '31776541', doi: '10.1039/c9fo02291k', y: 2019, j: 'Food Funct', a: 'Wood E, …, Rodriguez-Mateos A', t: 'Blueberries and cardiovascular disease prevention', why: 'Kompakter Review zu Beeren und Herz-Kreislauf, gut für Begriffe und Mechanismen.' },
];
const S = Object.assign({ cur: null, papers: {}, cards: {}, days: {} }, LS.get(K, {}) || {});
const save = () => { S.updated = Date.now(); LS.set(K, S); };
const PBY = Object.fromEntries(PAPERS.map(p => [p.pmid, p]));
const cur = () => PBY[S.cur] || PAPERS.find(p => !(S.papers[p.pmid] || {}).st) || PAPERS[0];
const due = () => Object.entries(S.cards).filter(([, c]) => c.due <= today());
const GAP = [1, 3, 7, 16, 35, 80];
const app = document.getElementById('app');
let V = { view: 'home' }, ABS = {}, REV = null, DRAFT = null, T0 = null;

// reading time counts while the page is visible
setInterval(() => { if (document.hidden || V.view !== 'read') return; const d = today(); S.days[d] = (S.days[d] || 0) + 1; if (S.days[d] % 15 === 0) save(); const el = document.getElementById('rt'); if (el && T0) { const s = Math.floor((Date.now() - T0) / 1000), left = 420 - s; el.textContent = left > 0 ? Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : '7 Minuten um'; } }, 1000);

async function loadAbstract(p) {
  if (ABS[p.pmid]) return;
  ABS[p.pmid] = { busy: true }; render();
  try {
    const r = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${p.pmid}&rettype=abstract&retmode=xml`);
    const x = new DOMParser().parseFromString(await r.text(), 'text/xml');
    const parts = [...x.querySelectorAll('AbstractText')].map(n => (n.getAttribute('Label') ? n.getAttribute('Label') + ': ' : '') + n.textContent.trim());
    ABS[p.pmid] = { text: parts.join('\n\n') || 'Kein Abstract bei PubMed.' };
  } catch { ABS[p.pmid] = { err: 'PubMed gerade nicht erreichbar. Über den DOI-Link lesen.' }; }
  render();
}

function home() {
  const p = cur(), d = due().length, nRead = Object.values(S.papers).filter(x => x.st === 'gelesen').length, nC = Object.keys(S.cards).length;
  const wk = (() => { let s = 0; for (let i = 0; i < 7; i++) s += S.days[addDays(-i)] || 0; return Math.round(s / 60); })();
  return `<div class="topbar"><a class="link" href="index.html">← Echo</a></div>
  <header class="stack" style="gap:4px"><span class="eyebrow">Masterarbeit · King's College London</span><h1>🎓 Paper-Abend</h1>
    <span class="small muted">7 Minuten lesen, 3–5 Sätze in eigenen Worten, daraus Karten. ${nRead}/${PAPERS.length} gelesen · ${nC} Karten · ${wk} min diese Woche</span></header>
  ${d ? `<button class="card" data-act="rev" style="text-align:left;border:2px solid var(--gold)"><div class="row spread"><b>🔁 ${d} Karte${d === 1 ? '' : 'n'} fällig</b><span class="small muted">zuerst, 1–2 Minuten</span></div></button>` : ''}
  <section class="card" style="border:2px solid var(--calm)"><span class="eyebrow">Heute lesen</span><h3 style="line-height:1.3">${esc(p.t)}</h3>
    <span class="small muted">${esc(p.a)} · ${esc(p.j)} ${p.y}</span><span class="small">${esc(p.why)}</span>
    <button class="btn primary" data-act="read" data-v="${p.pmid}">📖 7 Minuten lesen</button></section>
  <h3 style="margin:8px 4px 0">Leseliste</h3>
  ${PAPERS.map((x, i) => { const st = (S.papers[x.pmid] || {}).st, nc = Object.values(S.cards).filter(c => c.pmid === x.pmid).length;
    return `<button class="card" data-act="pick" data-v="${x.pmid}" style="text-align:left;padding:12px 14px;${x.pmid === p.pmid ? 'border:2px solid var(--calm)' : ''}"><div class="row spread" style="gap:10px"><span class="small"><b>${i + 1}.</b> ${esc(x.t)}</span><span class="small muted" style="white-space:nowrap">${st === 'gelesen' ? '✓' : ''}${nc ? ' ' + nc + ' 🃏' : ''}</span></div><span class="small muted">${esc(x.j)} ${x.y}</span></button>`; }).join('')}
  <span class="small muted" style="padding:0 4px">Auswahl: Arbeiten aus ihrer Gruppe zu (Poly)phenolen, Gefäßfunktion, Kognition und psychischer Gesundheit, nach PubMed (Stand 27.11.2026). Reihenfolge: Überblick → Methoden → deine Themen.</span>`;
}

function read() {
  const p = PBY[V.pmid], ab = ABS[p.pmid], n = (S.papers[p.pmid] || {}).notes || '';
  if (!ab) setTimeout(() => loadAbstract(p), 0);
  return `<div class="topbar"><button class="link" data-act="home">← Paper-Abend</button><span class="mono small" id="rt">7:00</span></div>
  <header class="stack" style="gap:4px"><h1 style="font-size:20px;line-height:1.3">${esc(p.t)}</h1><span class="small muted">${esc(p.a)} · ${esc(p.j)} ${p.y}</span>
    <span class="row" style="gap:12px;flex-wrap:wrap"><a class="link small" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">Volltext (DOI)</a>${p.pmc ? `<a class="link small" href="https://pmc.ncbi.nlm.nih.gov/articles/${p.pmc}/" target="_blank" rel="noopener">frei bei PMC</a>` : ''}<a class="link small" href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener">PubMed</a></span></header>
  <section class="card"><span class="eyebrow">Abstract (live von PubMed)</span>${ab && ab.text ? `<div class="small" style="white-space:pre-wrap;line-height:1.55">${esc(ab.text)}</div>` : ab && ab.err ? `<span class="small muted">${esc(ab.err)}</span>` : '<span class="small muted">Lädt …</span>'}
    <span class="small muted">Lies mit drei Fragen im Kopf: Was wurde gemacht (Design, n, Dosis, Dauer)? Was kam heraus (Endpunkt, Effektgröße)? Was heißt das für deine Arbeit?</span></section>
  <section class="card"><h3>In deinen Worten</h3><span class="small muted">3–5 Sätze: Frage, Design, Hauptergebnis, Grenze, Bezug zu dir. Aus dem Kopf, nicht abschreiben.</span>
    <textarea id="notes" rows="6" placeholder="z. B. 12 Wochen Blaubeerpulver bei 61 Älteren verbessert FMD und senkt 24-h-Blutdruck …">${esc(n)}</textarea>
    <div class="row" style="gap:8px"><button class="btn" data-act="mic">🎙 Diktieren</button><button class="btn primary grow" data-act="mk">🧠 Karten erstellen</button></div>
    ${DRAFT && DRAFT.busy ? '<span class="small muted">Erstellt Karten …</span>' : ''}${DRAFT && DRAFT.err ? `<span class="small" style="color:var(--warn,#b45309)">${esc(DRAFT.err)}</span>` : ''}</section>
  ${DRAFT && DRAFT.cards ? `<section class="card"><h3>Karten prüfen</h3><span class="small muted">Behalten, was du morgen wirklich wissen willst. Text antippen zum Ändern.</span>
    ${DRAFT.cards.map((c, i) => `<div class="card flat" style="gap:6px"><input data-cq="${i}" value="${esc(c.q)}"><textarea data-ca="${i}" rows="2">${esc(c.a)}</textarea><label class="small row" style="gap:6px"><input type="checkbox" data-ck="${i}" ${c.keep === false ? '' : 'checked'}> behalten</label></div>`).join('')}
    <button class="btn primary" data-act="keep">Karten speichern, Paper als gelesen markieren</button></section>` : ''}
  <section class="card"><h3>Eigene Karte</h3><input id="mq" placeholder="Frage"><textarea id="ma" rows="2" placeholder="Antwort"></textarea><button class="btn" data-act="own">Hinzufügen</button></section>`;
}

function review() {
  if (!REV || REV.i >= REV.q.length) { const n = REV ? REV.ok : 0, t = REV ? REV.q.length : 0; REV = null; V.view = 'home'; toast(`${n} von ${t} gewusst`); return home(); }
  const id = REV.q[REV.i], c = S.cards[id], p = PBY[c.pmid];
  return `<div class="topbar"><button class="link" data-act="home">← Paper-Abend</button><span class="small muted">${REV.i + 1}/${REV.q.length}</span></div>
  <section class="card"><span class="eyebrow">${esc(p ? p.a.split(',')[0] + ' ' + p.y : 'eigene Karte')}</span><h2 style="font-size:19px;line-height:1.35">${esc(c.q)}</h2>
    ${REV.shown ? `<div class="ans" style="white-space:pre-wrap">${esc(c.a)}</div><div class="row" style="gap:8px"><button class="btn grow" data-act="r0">Nicht gewusst</button><button class="btn primary grow" data-act="r1">Gewusst</button></div>` : `<span class="small muted">Erst aus dem Kopf, dann aufdecken.</span><button class="btn primary" data-act="show">Aufdecken</button>`}</section>`;
}

function render() { app.innerHTML = V.view === 'read' ? read() : V.view === 'rev' ? review() : home(); }

const SYS = 'Du erstellst Lernkarten (Spaced Repetition) auf Deutsch für einen Masterstudenten der Ernährungsmedizin, der seine Masterarbeit bei Prof. Ana Rodriguez-Mateos am King\'s College London vorbereitet ((Poly)phenole, Gefäßfunktion, kardiometabolische und psychische Gesundheit). Grundlage sind das Abstract und seine eigenen Notizen. Erstelle 4 bis 6 Karten: Design und Stichprobe, Intervention und Dosis, Hauptergebnis mit Zahl, Mechanismus oder Biomarker, Limitation, Bedeutung für seine Arbeit. Fragen eindeutig, Antworten kurz (höchstens 2 Sätze), nur was im Abstract oder in den Notizen steht, nichts erfinden. Englische Fachbegriffe beibehalten (FMD, metabolites). Antworte NUR mit einem JSON-Array [{"q": "...", "a": "..."}].';

app.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, v = b.dataset.v;
  const keepNotes = () => { const t = document.getElementById('notes'); if (t && V.pmid) { (S.papers[V.pmid] = S.papers[V.pmid] || {}).notes = t.value; save(); } };
  if (a === 'home') { keepNotes(); V = { view: 'home' }; DRAFT = null; render(); return; }
  if (a === 'pick') { S.cur = v; save(); render(); scrollTo(0, 0); return; }
  if (a === 'read') { S.cur = v; V = { view: 'read', pmid: v }; T0 = Date.now(); DRAFT = null; save(); render(); scrollTo(0, 0); return; }
  if (a === 'mic') { dictate('de-DE', t => { const el = document.getElementById('notes'); if (el) el.value = (el.value ? el.value + ' ' : '') + t; keepNotes(); }); return; }
  if (a === 'mk') {
    keepNotes(); const p = PBY[V.pmid], notes = (S.papers[p.pmid] || {}).notes || '', ab = (ABS[p.pmid] || {}).text || '';
    if (!notes.trim() && !ab) { toast('Erst ein paar Sätze notieren'); return; }
    if (!hasAI()) { DRAFT = { err: 'Ohne Anthropic-Schlüssel: Karten unten selbst anlegen.' }; render(); return; }
    DRAFT = { busy: true }; render();
    try { const arr = parseJSONLoose(await askAI(SYS, [{ role: 'user', content: `Paper: ${p.t} (${p.j} ${p.y})\n\nAbstract:\n${ab || '(nicht geladen)'}\n\nMeine Notizen:\n${notes || '(keine)'}` }], 1200));
      DRAFT = { cards: arr.filter(x => x && x.q && x.a).slice(0, 8).map(x => ({ q: String(x.q), a: String(x.a) })) };
    } catch (e) { DRAFT = { err: 'Karten gingen nicht: ' + e.message }; }
    render(); return;
  }
  if (a === 'keep') {
    const p = PBY[V.pmid]; let n = 0;
    DRAFT.cards.forEach((c, i) => { if (!app.querySelector(`[data-ck="${i}"]`).checked) return; const q = app.querySelector(`[data-cq="${i}"]`).value.trim(), an = app.querySelector(`[data-ca="${i}"]`).value.trim(); if (!q || !an) return;
      const id = 'k' + uid(); S.cards[id] = { q, a: an, pmid: p.pmid, b: 0, due: addDays(1), n: 0, lapses: 0 }; n++;
      window.EULE && EULE.push({ src: 'kcl', q, a: an, ref: id }); });
    const ps = S.papers[p.pmid] = S.papers[p.pmid] || {}; ps.st = 'gelesen'; (ps.reads = ps.reads || []).push(today());
    const next = PAPERS.find(x => !(S.papers[x.pmid] || {}).st); if (next) S.cur = next.pmid;
    save(); gainXP('kcl', 20 + n * 5); toast(n + ' Karten gespeichert'); DRAFT = null; V = { view: 'home' }; render(); scrollTo(0, 0); return;
  }
  if (a === 'own') {
    const q = document.getElementById('mq').value.trim(), an = document.getElementById('ma').value.trim(); if (!q || !an) return;
    const id = 'k' + uid(); S.cards[id] = { q, a: an, pmid: V.pmid, b: 0, due: addDays(1), n: 0, lapses: 0 };
    const ps = S.papers[V.pmid] = S.papers[V.pmid] || {}; ps.st = 'gelesen'; keepNotes(); save();
    window.EULE && EULE.push({ src: 'kcl', q, a: an, ref: id }); gainXP('kcl', 5); toast('Karte gespeichert'); document.getElementById('mq').value = ''; document.getElementById('ma').value = ''; return;
  }
  if (a === 'rev') { REV = { q: due().map(([id]) => id).sort(() => Math.random() - 0.5), i: 0, ok: 0, shown: false }; V = { view: 'rev' }; render(); return; }
  if (a === 'show') { REV.shown = true; render(); return; }
  if (a === 'r0' || a === 'r1') {
    const c = S.cards[REV.q[REV.i]], ok = a === 'r1'; c.n++;
    if (ok) { REV.ok++; c.b = Math.min(GAP.length - 1, c.b + 1); c.due = addDays(GAP[c.b]); } else { c.lapses++; c.b = 0; c.due = addDays(1); window.EULE && EULE.push({ src: 'kcl', q: c.q, a: c.a, ref: REV.q[REV.i] }); }
    save(); gainXP('kcl', ok ? 3 : 1); REV.i++; REV.shown = false; render(); return;
  }
});
app.addEventListener('input', ev => { if (ev.target.id === 'notes' && V.pmid) { (S.papers[V.pmid] = S.papers[V.pmid] || {}).notes = ev.target.value; save(); } });
render();
