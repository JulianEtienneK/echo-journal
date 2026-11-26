/* Echo · Comedy-Session: Humor trainieren, indem man Witze auseinandernimmt.
   Pro Moment: Was war es? → Welche Erwartung hat das Setup gebaut? → Wie wurde sie gebrochen (Technik)? → Warum ist es lustig?
   Danach optional: eine eigene Pointe zu einem Setup drehen. Zwei analysierte Momente oder eine Challenge = Session erledigt; läuft als Teil der Eule.
   Grundlage: Inkongruenz-Auflösung (Setup baut eine Annahme, die Pointe enthüllt eine zweite Deutung) und Benign Violation (eine Verletzung, die zugleich harmlos ist).
   Storage: 'echo-comedy' (in Echos Sicherung). Needs tools-common.js. */
'use strict';
const app = document.getElementById('app');
const NEED = 2, XP = { moment: 15, twist: 20, session: 25, challenge: 30 };
// 5-Minuten-Challenges: eine Technik gezielt üben, Menge vor Qualität. Jede Challenge zieht eine zufällige Vorgabe.
const CH = [
  ['sprint', '⚡', 'Pointen-Sprint', 'So viele Pointen wie möglich zu einem Setup. Nicht bewerten, nur schreiben; die guten kommen meist nach der zehnten.', 'Setup', ['Ich habe mir ein Laufband gekauft.', 'Meine Mitbewohnerin hat ein Haustier.', 'Ich war heute beim Arzt.', 'Ich habe angefangen zu meditieren.', 'Mein Vermieter hat mir geschrieben.', 'Ich versuche, weniger am Handy zu sein.', 'Ich habe zum ersten Mal selbst Brot gebacken.', 'Mein Zug hatte heute Verspätung.']],
  ['woertl', '🔤', 'Wörtlich nehmen', 'Nimm die Redewendung beim Wort: Wie sähe die Situation aus, wenn sie buchstäblich passiert? Drei Szenen, je ein Satz.', 'Redewendung', ['Das ist nicht mein Bier.', 'Ich verstehe nur Bahnhof.', 'Da steppt der Bär.', 'Jemandem einen Bären aufbinden.', 'Tomaten auf den Augen haben.', 'Den Faden verlieren.', 'Auf dem Schlauch stehen.', 'Die Kirche im Dorf lassen.']],
  ['zwei', '🔀', 'Zwei Deutungen', 'Finde zwei Bedeutungen des Wortes und bau aus dem Wechsel zwischen ihnen mindestens zwei Witze.', 'Wort', ['Bank', 'Schloss', 'Absatz', 'Leiter', 'Steuer', 'Kater', 'Blatt', 'Zug', 'Strom', 'Gericht']],
  ['drei', '3️⃣', 'Dreierregel', 'Fünf Dreierlisten zum Thema: zwei normale Dinge, das dritte bricht das Muster und ist trotzdem wahr.', 'Thema', ['Was man im Urlaub einpackt', 'Gründe, früh aufzustehen', 'Was in einer WG-Küche steht', 'Neujahrsvorsätze', 'Was man im Zug hört', 'Dinge, die Steuerberater sagen']],
  ['ueber', '📈', 'Übertreibung in Stufen', 'Nimm das Ärgernis und steigere es in drei bis fünf Stufen, bis es absurd ist. Jede Stufe ein Satz.', 'Ärgernis', ['Der Drucker druckt nicht.', 'Jemand isst im Büro laut.', 'Das WLAN ist langsam.', 'Die Supermarktschlange ist lang.', 'Der Wecker klingelt.']],
  ['unter', '📉', 'Untertreibung', 'Beschreib die Katastrophe so trocken und klein wie möglich, als wäre es eine Nebensache. Drei Varianten.', 'Katastrophe', ['Die Wohnung steht unter Wasser.', 'Ich habe die Prüfung verschlafen.', 'Der Zug fährt in die falsche Stadt.', 'Ein Bär ist im Garten.', 'Die Präsentation ist gelöscht.']],
  ['logik', '🌀', 'Absurde Logik', 'Nimm die Prämisse als wahr und denk sie konsequent weiter: Was folgt daraus, und was folgt daraus? Fünf Folgen.', 'Was wäre, wenn …', ['Katzen Steuern zahlen müssten?', 'man Schlaf in der Bank anlegen könnte?', 'jeder Gedanke laut zu hören wäre?', 'Pilze Social Media hätten?', 'die Deutsche Bahn immer pünktlich wäre?']],
  ['schlag', '📰', 'Satire-Schlagzeile', 'Drei Schlagzeilen im Stil einer Satirezeitung zum Thema. Die Schlagzeile ist Setup und Pointe zugleich.', 'Thema', ['Black Friday', 'Weihnachtsmarkt', 'Wintereinbruch', 'Deutsche Bahn', 'Künstliche Intelligenz', 'Neujahrsvorsätze']],
  ['beob', '👀', 'Beobachtung', 'Fünf „Kennt ihr das …“-Beobachtungen aus deinem Tag heute, die jeder kennt, aber keiner ausspricht. Dann eine davon zur Pointe drehen.', 'Bereich', ['Arbeit', 'Zug und Bahnhof', 'Supermarkt', 'Wohnung', 'Sport', 'Handy']],
  ['status', '👑', 'Statuswechsel', 'Erzähl die Situation in drei bis fünf Sätzen so, dass am Ende der Kleine gewinnt oder der Mächtige sich blamiert.', 'Situation', ['Chef und Praktikant im Aufzug', 'Kontrolleur und Schwarzfahrer', 'Professor und Erstsemester', 'Türsteher und Gast', 'Kind und Elternteil beim Einkaufen']],
  ['selbst', '🙃', 'Freundliche Selbstironie', 'Drei kurze Sätze über eine eigene Macke, liebevoll statt hart. So, wie ein guter Freund über dich witzeln würde.', 'Macke', ['meine Pläne', 'mein Kochen', 'meine Ordnung', 'mein Orientierungssinn', 'meine Lieblingsausreden']],
  ['call', '🔁', 'Callback', 'Eine Mini-Geschichte in fünf Sätzen: Ein Detail am Anfang, das im letzten Satz überraschend zurückkommt.', 'Detail', ['ein vergessener Regenschirm', 'ein Zettel mit einer Telefonnummer', 'ein verdächtig billiger Toaster', 'ein Hund namens Gerhard', 'ein falsch geschriebener Name']],
];
const MIN5 = 300;
let T = { id: null, prompt: '', text: '', end: 0, left: MIN5, run: false, iv: null }; // running challenge
const TECH = [
  ['reint', 'Umdeutung', 'Das Setup legt eine Deutung nahe, die Pointe zeigt eine zweite, die auch passt. Der Kern fast jeden Witzes.'],
  ['doppel', 'Doppeldeutigkeit', 'Ein Wort oder Satz hat zwei Bedeutungen; die Pointe springt auf die andere.'],
  ['woertl', 'Wörtlich genommen', 'Eine Redewendung oder Bitte wird buchstäblich verstanden.'],
  ['fehl', 'Fehlleitung', 'Du wirst bewusst in eine Richtung geführt, die Pointe kommt von der Seite.'],
  ['drei', 'Dreierregel', 'Zwei normale Elemente bauen ein Muster, das dritte bricht es.'],
  ['ueber', 'Übertreibung', 'Etwas Wahres wird so weit gesteigert, dass es absurd wird.'],
  ['unter', 'Untertreibung', 'Etwas Großes wird trocken klein geredet.'],
  ['logik', 'Absurde Logik', 'Eine falsche Prämisse wird völlig konsequent zu Ende gedacht.'],
  ['vergl', 'Vergleich', 'Zwei Dinge, die nicht zusammengehören, werden treffend gleichgesetzt.'],
  ['status', 'Statuswechsel', 'Oben und unten tauschen; der Mächtige blamiert sich, der Kleine gewinnt.'],
  ['selbst', 'Selbstironie', 'Der Witz geht auf eigene Kosten; nimmt Druck raus und schafft Nähe.'],
  ['beob', 'Beobachtung', 'Etwas Alltägliches, das alle kennen, aber keiner ausspricht.'],
  ['call', 'Callback', 'Eine frühere Pointe kommt in neuem Zusammenhang zurück.'],
  ['act', 'Act-out und Timing', 'Stimme, Mimik, Pause: Die Pointe sitzt durch die Art, nicht nur durch den Text.'],
];
const WHY = [['ueberr', 'Überraschung, die im Nachhinein Sinn ergibt'], ['harmlos', 'Verletzung einer Norm, aber harmlos'], ['wahr', 'Ertappt: es stimmt einfach'], ['span', 'Spannung aufgebaut und gelöst'], ['ueberl', 'Gefühl, schlauer zu sein als jemand'], ['bild', 'Absurdes Bild im Kopf']];
// Quellen ohne YouTube (Detox). Verfügbarkeit bei Streamingdiensten wechselt; im Zweifel suchen.
const SRC = [ // nur deutsch und kostenlos, kein YouTube (Detox). Was gerade online ist, wechselt; im Zweifel in der Mediathek suchen.
  ['📺', 'heute-show', 'ZDF-Mediathek', 'Satire mit hohem Pointentempo: gut, um Fehlleitung und Übertreibung zu zählen.'],
  ['📺', 'Die Anstalt', 'ZDF-Mediathek', 'Kabarett mit Rollenspiel: Statuswechsel und Callbacks über die ganze Sendung.'],
  ['📺', 'extra 3', 'ARD-Mediathek', 'Kurze Beiträge mit klaren Pointen, ideal für zwei schnelle Momente.'],
  ['📺', 'ZDF Magazin Royale', 'ZDF-Mediathek', 'Trockene Untertreibung und absurde Logik im Nachrichtenton.'],
  ['📺', 'Die Carolin Kebekus Show', 'ARD-Mediathek', 'Sketche mit Tabubruch, der harmlos bleibt; gut für „warum lustig“.'],
  ['📺', 'Ladies Night', 'ARD-Mediathek (WDR)', 'Stand-up von mehreren Comedians: kurze Nummern, viele Techniken nebeneinander.'],
  ['🎧', 'Gemischtes Hack', 'Spotify, kostenlos mit Werbung', 'Gesprächscomedy: Pointen entstehen spontan, Callbacks und Beobachtung.'],
  ['🎧', 'Fest & Flauschig', 'Spotify, kostenlos mit Werbung', 'Zwei, die sich gegenseitig hochschaukeln: Übertreibung in Stufen.'],
  ['🎧', 'Baywatch Berlin', 'Spotify, kostenlos mit Werbung', 'Selbstironie und Running Gags.'],
  ['📰', 'Der Postillon', 'Text, kostenlos', 'Satire-Schlagzeilen: Die Schlagzeile ist Setup und Pointe in einem.'],
  ['📰', 'Die Tagespresse', 'Text, kostenlos', 'Österreichische Satire: absurde Logik, konsequent zu Ende gedacht.'],
  ['📰', 'Titanic', 'titanic-magazin.de, teils kostenlos', 'Bissige Wortspiele und Doppeldeutigkeiten.'],
  ['👥', 'Ein Gespräch von heute', 'Alltag', 'Wer hat heute gelacht und warum? Alltagshumor ist das beste Material.'],
];
const C = Object.assign({ days: {}, xp: 0 }, LS.get('echo-comedy', {}));
const save = () => { C.updated = Date.now(); LS.set('echo-comedy', C); };
const day = () => C.days[today()] || (C.days[today()] = { moments: [], twists: [], challenges: [], src: null, done: false });
const srcOfDay = () => { const d = new Date(), n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); return SRC[n % SRC.length]; };
const streak = () => { let n = 0, d = new Date(); if (!(C.days[today()] || {}).done) d.setDate(d.getDate() - 1); while ((C.days[dk(d)] || {}).done) { n++; d.setDate(d.getDate() - 1); } return n; };
const route = () => location.hash.replace(/^#/, '');
const go = h => { if (route() === h) render(); else location.hash = h; };
const topBar = back => `<div class="topbar"><a class="link" href="${back ? '#' : 'index.html#games'}">← ${back ? 'Comedy' : 'Echo'}</a><span class="xp">${streak() ? '🔥 ' + streak() + ' · ' : ''}${LS.get('echo-games', {}).xp || 0} XP</span></div>`;
let F = { step: 0, m: {} }; // draft of the moment being analysed

function viewHub() {
  const d = C.days[today()] || { moments: [], twists: [] }, s = d.src ? SRC.find(x => x[1] === d.src) || srcOfDay() : srcOfDay();
  const all = Object.values(C.days).flatMap(x => x.moments || []), tc = {};
  for (const m of all) for (const t of m.tech || []) tc[t] = (tc[t] || 0) + 1;
  const top = Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recent = Object.entries(C.days).sort((a, b) => b[0].localeCompare(a[0])).flatMap(([k, x]) => (x.moments || []).map(m => ({ k, m }))).slice(0, 6);
  return `${topBar()}<div class="stack"><span class="eyebrow">Echo · täglich</span><h1>😂 Comedy-Session</h1><p class="muted">Humor ist Handwerk: Jeder Witz baut eine Erwartung und bricht sie so, dass es im Nachhinein Sinn ergibt. Wer das an fremden Witzen sieht, findet es auch in eigenen Gesprächen.</p></div>
  <section class="card"><div class="row spread"><div class="stack" style="gap:0"><span class="eyebrow">Heute</span><h3>${d.done ? '✓ Session erledigt' : `${(d.moments || []).length} von ${NEED} Momenten`}${(d.challenges || []).length ? ` · ${d.challenges.length} Challenge${d.challenges.length > 1 ? 's' : ''}` : ''}</h3></div><span class="xp">${d.done ? '+' + XP.session : '10 min'}</span></div>
    <div class="bar"><i style="width:${Math.min(100, Math.round(100 * (d.moments || []).length / NEED))}%"></i></div>
    <div class="note"><b>${s[0]} Quelle des Tages:</b> ${esc(s[1])} <span class="small muted">(${esc(s[2])})</span><br><span class="small">${esc(s[3])}</span></div>
    <span class="small muted">Alles deutsch und kostenlos, kein YouTube. Andere Quelle? Egal, Hauptsache du schaust oder hörst 5 bis 10 Minuten bewusst zu.</span>
    <button class="btn" data-act="go" data-v="challenge" style="border-color:var(--gold)">✏️ Challenge schreiben (+${XP.challenge})</button>
    <span class="small muted">Erledigt mit zwei Momenten oder einer Challenge.</span>
    <button class="btn primary" data-act="new">${(d.moments || []).length ? 'Nächsten Moment auseinandernehmen' : 'Ersten Moment auseinandernehmen'}</button>
    ${(d.moments || []).length ? `<button class="btn" data-act="go" data-v="twist">Selbst drehen: eigene Pointe (+${XP.twist})</button>` : ''}</section>
  <section class="card"><span class="eyebrow">Der Ablauf</span>
    <div class="note"><b>1 · Erwartung:</b> Was hast du nach dem Setup angenommen? Welches Bild, welche Bedeutung, welcher Fortgang?</div>
    <div class="note"><b>2 · Bruch:</b> Wie wurde die Annahme umgeworfen, und mit welcher Technik?</div>
    <div class="note"><b>3 · Warum lustig:</b> Was macht den Bruch angenehm statt nur verwirrend? Meist: überraschend, aber im Nachhinein logisch, und die Verletzung bleibt harmlos.</div></section>
  ${top.length ? `<section class="card"><span class="eyebrow">Deine Techniken bisher</span><div class="chips">${top.map(([k, n]) => `<span class="chip">${esc((TECH.find(t => t[0] === k) || [, k])[1])} · ${n}</span>`).join('')}</div><span class="small muted">${all.length} Momente analysiert. Techniken, die selten auftauchen, lohnt es sich gezielt zu suchen.</span></section>` : ''}
  ${(() => { const cs = Object.entries(C.days).sort((a, b) => b[0].localeCompare(a[0])).flatMap(([k, x]) => (x.challenges || []).map(c => ({ k, c }))).slice(0, 4); return cs.length ? `<section class="card"><span class="eyebrow">Letzte Challenges</span>${cs.map(({ k, c }) => { const ch = CH.find(x => x[0] === c.id) || ['', '⏱️', c.id]; return `<div class="note"><button class="link" data-act="del" data-k="${k}" data-t="challenges" data-at="${c.at}" style="float:right;color:var(--muted)" aria-label="Löschen">✕</button><span class="small muted">${ch[1]} ${esc(ch[2])} · ${esc(c.prompt)} · ${c.n} Ideen</span>${c.best ? `<br>★ ${esc(c.best)}` : ''}</div>`; }).join('')}</section>` : ''; })()}
  ${recent.length ? `<section class="card"><span class="eyebrow">Zuletzt</span>${recent.map(({ k, m }) => `<div class="note"><button class="link" data-act="del" data-k="${k}" data-t="moments" data-at="${m.at}" style="float:right;color:var(--muted)" aria-label="Löschen">✕</button><span class="small muted">${esc(new Date(k + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }))} · ${['🙂', '😄', '😂', '🤣'][m.laugh || 0]}</span><br><b>${esc(m.what)}</b><br><span class="small">Erwartung: ${esc(m.exp)}<br>Bruch: ${esc(m.brk)}</span></div>`).join('')}</section>` : ''}
  <section class="card"><span class="eyebrow">Zum Weiterlesen</span><span class="small">Steve Kaplan, „The Hidden Tools of Comedy“ (2013) · Joe Toplyn, „Comedy Writing for Late-Night TV“ (2014) · McGraw und Warner, „The Humor Code“ (2014, Benign-Violation-Theorie) · Greg Dean, „Step by Step to Stand-Up Comedy“ (2000, Erwartung und Umdeutung als Methode) · John Vorhaus, „The Comic Toolbox“ (1994)</span></section>`;
}

function viewMoment() {
  const m = F.m, st = F.step;
  const head = `${topBar(true)}<div class="stack"><span class="eyebrow">Moment ${((C.days[today()] || {}).moments || []).length + 1} · Schritt ${st + 1} von 4</span><h1>${['Was war es?', 'Erwartung', 'Bruch', 'Warum lustig?'][st]}</h1></div>`;
  if (st === 0) return `${head}<section class="card"><p class="muted">Die Pointe oder den Moment in Stichworten, so dass du ihn in einer Woche wiedererkennst.</p>
    <textarea class="input" id="f" rows="3" placeholder="z. B. „Ich hab mir ein Laufband gekauft. Jetzt bin ich zu Hause nicht mehr der Einzige, der nichts erreicht.“">${esc(m.what || '')}</textarea>
    <button class="btn primary" data-act="next">Weiter</button></section>`;
  if (st === 1) return `${head}<section class="card"><p class="muted">Halt kurz an der Stelle vor der Pointe an: Was hast du da erwartet? Welche Bedeutung, welches Bild, welche Fortsetzung lag nahe?</p>
    <div class="note small">Beispiel: „Laufband gekauft“ → ich erwarte eine Fitness-Geschichte, Erfolg oder Ausrede.</div>
    <textarea class="input" id="f" rows="3" placeholder="Ich habe angenommen, dass …">${esc(m.exp || '')}</textarea>
    <button class="btn primary" data-act="next">Weiter</button></section>`;
  if (st === 2) return `${head}<section class="card"><p class="muted">Was ist stattdessen passiert, und mit welcher Technik? Mehrere möglich.</p>
    <textarea class="input" id="f" rows="2" placeholder="Stattdessen …">${esc(m.brk || '')}</textarea>
    <div class="chips">${TECH.map(t => `<button class="chip" data-act="tech" data-v="${t[0]}" aria-pressed="${(m.tech || []).includes(t[0])}" title="${esc(t[2])}">${esc(t[1])}</button>`).join('')}</div>
    ${(m.tech || []).length ? `<div class="note small">${(m.tech || []).map(k => { const t = TECH.find(x => x[0] === k); return `<b>${esc(t[1])}:</b> ${esc(t[2])}`; }).join('<br>')}</div>` : '<span class="small muted">Tipp: Fast immer passt „Umdeutung“; die Frage ist, wodurch sie ausgelöst wird.</span>'}
    <button class="btn primary" data-act="next">Weiter</button></section>`;
  return `${head}<section class="card"><p class="muted">Warum ist der Bruch angenehm und nicht nur verwirrend? Ein Satz reicht.</p>
    <div class="chips">${WHY.map(w => `<button class="chip" data-act="why" data-v="${w[0]}" aria-pressed="${(m.why || []).includes(w[0])}">${esc(w[1])}</button>`).join('')}</div>
    <textarea class="input" id="f" rows="2" placeholder="Lustig, weil …">${esc(m.note || '')}</textarea>
    <span class="small muted">Wie sehr hast du gelacht?</span>
    <div class="chips">${[[0, '🙂 geschmunzelt'], [1, '😄 gelacht'], [2, '😂 laut'], [3, '🤣 Tränen']].map(([v, l]) => `<button class="chip" data-act="laugh" data-v="${v}" aria-pressed="${m.laugh === v}">${l}</button>`).join('')}</div>
    <button class="btn primary" data-act="save">Speichern (+${XP.moment} XP)</button></section>`;
}

function viewTwist() {
  const d = C.days[today()] || { moments: [] }, last = (d.moments || []).slice(-1)[0];
  return `${topBar(true)}<div class="stack"><span class="eyebrow">Bonus</span><h1>Selbst drehen</h1><p class="muted">Nimm ein Setup, finde eine zweite Deutung und schreib eine eigene Pointe. Gleiches Setup, anderer Bruch. Schlecht ist erlaubt, Menge schlägt Qualität.</p></div>
  <section class="card">${last ? `<div class="note small"><b>Setup von eben:</b> ${esc(last.what)}<br><b>Erwartung:</b> ${esc(last.exp)}</div>` : ''}
    <div class="note small"><b>So geht's:</b> 1. Welche Annahme macht das Publikum? 2. Was könnte das Setup noch bedeuten (anderes Wort, andere Person, anderer Grund)? 3. Die Pointe verrät nur diese zweite Deutung, so kurz wie möglich.</div>
    <textarea class="input" id="tw" rows="3" placeholder="Setup … / Pointe …"></textarea>
    <button class="btn primary" data-act="twist">Speichern (+${XP.twist} XP)</button></section>
  ${(d.twists || []).length ? `<section class="card"><span class="eyebrow">Heute gedreht</span>${d.twists.map(x => `<div class="note">${esc(x)}</div>`).join('')}</section>` : ''}`;
}

const mmss = n => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
function viewChallenge() {
  if (!T.id) return `${topBar(true)}<div class="stack"><span class="eyebrow">Zählt zur Eule</span><h1>✏️ Challenge</h1><p class="muted">Eine Technik, so viele Ideen wie möglich. Bewertet wird nicht; danach markierst du nur die beste. Menge schlägt Qualität, denn gute Pointen kommen fast immer erst nach den naheliegenden.</p></div>
    <button class="btn primary" data-act="chrand">🎲 Zufällige Challenge</button>
    <div class="stack">${CH.map(c => `<button class="card hub" data-act="chpick" data-v="${c[0]}" style="text-align:left"><div class="row"><span class="em">${c[1]}</span><div class="stack" style="gap:0"><h3>${esc(c[2])}</h3><span class="small muted">${esc(c[3])}</span></div></div></button>`).join('')}</div>`;
  const c = CH.find(x => x[0] === T.id);
  return `${topBar(true)}<div class="stack"><span class="eyebrow">Challenge</span><h1>${c[1]} ${esc(c[2])}</h1></div>
  <section class="card"><span class="small muted">${esc(c[3])}</span>
    <div class="note"><b>${esc(c[4])}:</b> ${esc(T.prompt)} <button class="link" data-act="chnew" style="margin-left:6px">andere</button></div>
    <textarea class="input" id="cht" rows="9" placeholder="Eine Idee pro Zeile. Vor die beste ein ★ setzen.">${esc(T.text)}</textarea>
    <button class="btn primary" data-act="chsave">Speichern (+${XP.challenge} XP)</button>
  </section>`;
}
function chSet(id) { const c = CH.find(x => x[0] === id); clearInterval(T.iv); T = { id, prompt: c[5][Math.floor(Math.random() * c[5].length)], text: '', end: 0, left: MIN5, run: false, iv: null }; }
function render() {
  const r = route();
  app.innerHTML = r === 'moment' ? viewMoment() : r === 'twist' ? viewTwist() : r === 'challenge' ? viewChallenge() : viewHub();
  const ct = document.getElementById('cht'); if (ct) ct.addEventListener('input', () => { T.text = ct.value; });
  const f = app.querySelector('textarea'); if (f && matchMedia('(pointer:fine)').matches) f.focus();
}
const val = () => ((document.getElementById('f') || {}).value || '').trim();
function keep() { const v = val(); if (F.step === 0) F.m.what = v; else if (F.step === 1) F.m.exp = v; else if (F.step === 2) F.m.brk = v; else F.m.note = v; }
app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, v = el.dataset.v;
  if (a === 'del') {
    const d = C.days[el.dataset.k], list = d && d[el.dataset.t]; if (!list) return;
    const i = list.findIndex(x => String(x.at) === el.dataset.at); if (i < 0 || !confirm('Diesen Eintrag löschen?')) return;
    list.splice(i, 1); d.done = (d.moments || []).length >= NEED || (d.challenges || []).length > 0; save(); toast('Gelöscht'); render(); return;
  }
  if (a === 'go') { if (v === 'challenge' && !(T.text || '').trim()) T.id = null; return go(v); }
  if (a === 'chpick' || a === 'chrand') { chSet(a === 'chrand' ? CH[Math.floor(Math.random() * CH.length)][0] : v); render(); return; }
  if (a === 'chnew') { const t = T.text; chSet(T.id); T.text = t; render(); return; }
  if (a === 'chsave') {
    const text = (T.text || '').trim(); if (!text) { toast('Mindestens eine Idee, auch eine schlechte'); return; }
    const lines = text.split('\n').map(x => x.trim()).filter(Boolean), best = lines.find(x => x.startsWith('★')) || '';
    { const c = CH.find(x => x[0] === T.id); window.EULE && EULE.push({ src: 'comedy', q: `${c[2]}: ${T.prompt}\nWas war deine beste Idee, und welche Technik steckt drin?`, a: (best ? best.replace(/^★\s*/, '') : lines[0]) + '\n(' + c[2] + ': ' + c[3] + ')' }); }
    const d = day(); (d.challenges || (d.challenges = [])).push({ id: T.id, prompt: T.prompt, text: text.slice(0, 4000), n: lines.length, best: best.replace(/^★\s*/, ''), at: Date.now() });
    let xp = XP.challenge; if (!d.done) { d.done = true; xp += XP.session; }
    C.xp += xp; save(); gainXP('comedy', xp); toast(`${lines.length} Ideen · +${xp} XP`); T = { id: null, prompt: '', text: '', end: 0, left: MIN5, run: false, iv: null }; go(''); return;
  }
  if (a === 'new') { F = { step: 0, m: { tech: [], why: [] } }; return go('moment'); }
  if (a === 'next') { keep(); if (!val()) { toast(['Kurz in Stichworten, was es war', 'Was hast du erwartet?', 'Was ist stattdessen passiert?'][F.step]); return; } if (F.step === 2 && !F.m.tech.length) { toast('Wähl mindestens eine Technik'); return; } F.step++; render(); return; }
  if (a === 'tech' || a === 'why') { keep(); const k = a, arr = F.m[k] || (F.m[k] = []), i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); render(); return; }
  if (a === 'laugh') { keep(); F.m.laugh = +v; render(); return; }
  if (a === 'save') {
    keep(); if (!F.m.note && !F.m.why.length) { toast('Ein Grund reicht: antippen oder ein Satz'); return; }
    const d = day(); d.moments.push(Object.assign({ at: Date.now() }, F.m)); d.src = d.src || srcOfDay()[1];
    const tn = (F.m.tech || []).map(k => (TECH.find(t => t[0] === k) || [, k])[1]).join(', ');
    window.EULE && EULE.push({ src: 'comedy', q: 'Pointe: ' + F.m.what.slice(0, 240) + '\nWelche Erwartung wurde aufgebaut, und wie wurde sie gebrochen?', a: 'Erwartung: ' + F.m.exp + '\nBruch: ' + F.m.brk + (tn ? ' (' + tn + ')' : '') + (F.m.note ? '\nWarum lustig: ' + F.m.note : '') });
    let xp = XP.moment; if (!d.done && d.moments.length >= NEED) { d.done = true; xp += XP.session; }
    C.xp += xp; save(); gainXP('comedy', xp); toast((d.done && d.moments.length === NEED ? 'Session erledigt · ' : 'Gespeichert · ') + '+' + xp + ' XP'); F = { step: 0, m: {} }; go(''); return;
  }
  if (a === 'twist') { const t = (document.getElementById('tw').value || '').trim(); if (!t) { toast('Setup und Pointe, auch wenn sie schlecht ist'); return; } const d = day(); d.twists.push(t.slice(0, 600)); C.xp += XP.twist; save(); gainXP('comedy', XP.twist); toast('Gedreht · +' + XP.twist + ' XP'); render(); return; }
});
addEventListener('hashchange', render);
if (route() === 'moment' && !F.m.tech) history.replaceState(null, '', location.pathname);
render();
