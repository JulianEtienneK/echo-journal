/* Echo · Eule: a short learning window before sleep (10 min, extendable), and a morning recall of everything learned in it.
   Why: sleep after learning consolidates facts, and relearning the next morning makes it stick with less effort (Mazza et al. 2016).
   Storage 'echo-eule' = { cur: {start, end, items} | null, sessions: [{id, start, end, after, items, done, res}], snooze, updated }.
   Item = { src: 'stb'|'med'|'quiz:<bank>'|'wege'|'frei', q, a, ref, t }. Pages call EULE.push(item); it only records while a window is open.
   Morning: on the Echo start page a popup asks each item first (retrieval), reveals, and a missed item returns once at the end.
   Missed items also go back into their own learning plan (StB card due tomorrow, medicine card due now, quiz question due now). */
'use strict';
(() => {
  const K = 'echo-eule';
  const get = () => { try { return Object.assign({ cur: null, sessions: [] }, JSON.parse(localStorage.getItem(K) || '{}')); } catch { return { cur: null, sessions: [] }; } };
  const put = E => { E.updated = Date.now(); try { localStorage.setItem(K, JSON.stringify(E)); } catch { /* blocked */ } };
  const lsj = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const lsset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } };
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const MIN = 60000;
  // review opens at the next 4 am after the window, and at least 3 hours after it ended (a night in between)
  function afterOf(end) { const d = new Date(end); d.setHours(4, 0, 0, 0); if (d.getTime() <= end) d.setDate(d.getDate() + 1); return Math.max(d.getTime(), end + 3 * 60 * MIN); }
  function xp(n) {
    const G = lsj('echo-games', null) || { xp: 0, days: {}, rechnen: { best: 0 }, quiz: {}, sound: true };
    G.days = G.days || {}; const t = dk(new Date()), d = G.days[t] || (G.days[t] = { xp: 0 });
    d.eule = (d.eule || 0) + 1; d.xp = (d.xp || 0) + n; G.xp = (G.xp || 0) + n; G.updated = Date.now(); lsset('echo-games', G);
  }
  function close(E) {
    if (!E.cur) return E;
    const c = E.cur; c.end = Math.min(c.end, Date.now());
    if (c.items.length) E.sessions.push({ id: 's' + c.start, start: c.start, end: c.end, after: afterOf(c.end), items: c.items, done: false });
    E.sessions = E.sessions.filter(s => !s.done || s.end > Date.now() - 30 * 24 * 60 * MIN).slice(-40);
    E.cur = null; return E;
  }
  const active = () => { const E = get(); return !!(E.cur && E.cur.end > Date.now()); };

  /* ---------- styles ---------- */
  const css = `.eu-badge{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9999;display:flex;gap:6px;align-items:center;background:var(--surface,#fff);color:var(--ink,#1a1e1c);border:2px solid var(--gold,#A87D14);border-radius:99px;padding:6px 8px 6px 12px;box-shadow:0 6px 24px rgba(0,0,0,.18);font:600 14px/1 var(--f-body,system-ui)}
  .eu-badge button{font:inherit;border:1px solid var(--line,#ddd);background:var(--surface-2,#eee);color:inherit;border-radius:99px;padding:5px 9px;cursor:pointer}
  .eu-ov{position:fixed;inset:0;z-index:10000;background:rgba(10,14,12,.55);display:grid;place-items:end center;padding:12px}
  .eu-box{width:min(520px,100%);max-height:90vh;overflow:auto;background:var(--bg,#F2F3EF);color:var(--ink,#1a1e1c);border-radius:22px;padding:18px;display:grid;gap:12px;font-family:var(--f-body,system-ui)}
  .eu-box h2{margin:0;font-family:var(--f-display,inherit);font-size:22px}
  .eu-opt{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;text-align:left;text-decoration:none;color:inherit;background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:16px;padding:12px 14px;cursor:pointer;font:inherit}
  .eu-opt.hi{border:2px solid var(--calm,#1B8173)}
  .eu-opt b{display:block}.eu-opt small{color:var(--muted,#666)}
  .eu-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .eu-btn{font:600 15px var(--f-body,system-ui);border:1px solid var(--line,#ddd);background:var(--surface,#fff);color:inherit;border-radius:14px;padding:12px;cursor:pointer}
  .eu-btn.p{background:var(--calm,#1B8173);color:#fff;border-color:transparent}
  .eu-a{background:rgba(27,129,115,.12);border-radius:12px;padding:10px 12px;line-height:1.5;white-space:pre-wrap}
  .eu-box textarea,.eu-box input{width:100%;box-sizing:border-box;font:inherit;padding:10px 12px;border-radius:12px;border:1px solid var(--line,#ddd);background:var(--surface,#fff);color:inherit}
  .eu-muted{color:var(--muted,#666);font-size:13px;line-height:1.45}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const ov = html => { document.querySelectorAll('.eu-ov').forEach(x => x.remove()); const o = document.createElement('div'); o.className = 'eu-ov'; o.innerHTML = `<div class="eu-box">${html}</div>`; document.body.appendChild(o); o.addEventListener('click', ev => { if (ev.target === o) o.remove(); }); return o; };

  /* ---------- the window ---------- */
  function start(min = 10) {
    const E = get(); if (E.cur && E.cur.end > Date.now()) return choose();
    close(E); E.cur = { start: Date.now(), end: Date.now() + min * MIN, items: [] }; put(E); badge(); choose();
  }
  function extend(min = 5) { const E = get(); if (!E.cur) return; E.cur.end = Math.max(E.cur.end, Date.now()) + min * MIN; put(E); badge(); }
  function stop() { const E = get(), n = E.cur ? E.cur.items.length : 0; put(close(E)); badge(); goodnight(n); }
  function goodnight(n) {
    const o = ov(`<h2>🦉 Gute Nacht</h2><span>${n ? `${n} ${n === 1 ? 'Sache' : 'Sachen'} gemerkt. Morgen früh fragt Echo sie dich ab, bevor du nachschaust.` : 'Diesmal wurde nichts aufgezeichnet. Für Gelerntes außerhalb von Echo gibt es den ✍️-Knopf.'}</span>
      <span class="eu-muted">Jetzt das Handy auf den Schrank. Schlaf ist der Teil, in dem das Gelernte fest wird.</span><button class="eu-btn p" data-eu="x">Okay</button>`);
    o.querySelector('[data-eu=x]').onclick = () => o.remove();
  }
  function choose() {
    const L = [['stb-pfad.html#heute', '⚖️', 'StB-Pfad', 'Fällige Karten oder die nächste Lektion', 1], ['medizin.html', '🩺', 'Medizin', 'Lernrunde Anatomie, Krankheiten, Stoffwechsel', 1], ['comedy.html', '😂', 'Comedy', 'Momente zerlegen oder eine 5-Minuten-Challenge', 1],
      ['spiele.html#quiz-ernmed', '🥗', 'Ernährungsmedizin-Quiz', '', 0], ['spiele.html#quiz-steuer', '🧾', 'Steuer-Fallquiz', '', 0], ['spanisch.html', '🇪🇸', 'Spanisch', '', 0], ['wege.html', '🪷', 'Buddhismus und Stoa', '', 0]];
    const o = ov(`<h2>🦉 Eule · Was lernst du?</h2><span class="eu-muted">Alles, was du in den nächsten Minuten neu lernst oder falsch hast, fragt Echo dich morgen früh ab.</span>
      ${L.map(x => `<a class="eu-opt${x[4] ? ' hi' : ''}" href="${x[0]}"><span style="font-size:${x[4] ? 30 : 22}px">${x[1]}</span><span><b>${x[2]}</b>${x[3] ? `<small>${x[3]}</small>` : ''}</span></a>`).join('')}
      <button class="eu-opt" data-eu="free"><span style="font-size:22px">✍️</span><span><b>Etwas anderes</b><small>Buch, Skript, Video: Frage und Antwort selbst notieren</small></span></button>`);
    o.querySelector('[data-eu=free]').onclick = free;
    o.querySelectorAll('a.eu-opt').forEach(a => a.addEventListener('click', () => { if (a.getAttribute('href').split('#')[0] === location.pathname.split('/').pop()) setTimeout(() => location.reload(), 30); }));
  }
  function free() {
    const o = ov(`<h2>✍️ Was hast du gelernt?</h2><span class="eu-muted">Als Frage formulieren, die du dir morgen selbst stellen würdest. Das Formulieren ist schon Lernen.</span>
      <input id="eu-q" placeholder="Frage, z. B. Was regelt § 11 EStG?"><textarea id="eu-a" rows="4" placeholder="Antwort"></textarea>
      <div class="eu-row"><button class="eu-btn" data-eu="x">Fertig</button><button class="eu-btn p" data-eu="save">Speichern, noch eine</button></div>`);
    const sv = () => { const q = o.querySelector('#eu-q').value.trim(), a = o.querySelector('#eu-a').value.trim(); if (q && a) push({ src: 'frei', q, a, force: true }); return !!(q && a); };
    o.querySelector('[data-eu=save]').onclick = () => { if (sv()) free(); };
    o.querySelector('[data-eu=x]').onclick = () => { sv(); o.remove(); };
    setTimeout(() => o.querySelector('#eu-q').focus(), 50);
  }
  function push(it) {
    const E = get(); if (!E.cur || (E.cur.end < Date.now() && !it.force)) return false;
    const key = it.src + '|' + (it.ref || it.q);
    if (E.cur.items.some(x => x.src + '|' + (x.ref || x.q) === key)) return false;
    E.cur.items.push({ src: it.src, q: String(it.q).slice(0, 400), a: String(it.a).slice(0, 900), ref: it.ref || null, t: Date.now() }); put(E);
    const n = document.getElementById('eu-n'); if (n) n.textContent = E.cur.items.length;
    return true;
  }
  let timer = null;
  function badge() {
    document.querySelectorAll('.eu-badge').forEach(x => x.remove()); clearInterval(timer);
    const E = get(); if (!E.cur) return;
    if (E.cur.end <= Date.now()) { const n = E.cur.items.length; put(close(E)); goodnight(n); return; }
    const b = document.createElement('div'); b.className = 'eu-badge';
    b.innerHTML = `<span>🦉 <span id="eu-t"></span> · <span id="eu-n">${E.cur.items.length}</span></span><button data-eu="free" aria-label="Notieren">✍️</button><button data-eu="ext">+5</button><button data-eu="menu" aria-label="Themen">☰</button><button data-eu="stop" aria-label="Beenden">✕</button>`;
    document.body.appendChild(b);
    b.querySelector('[data-eu=free]').onclick = free; b.querySelector('[data-eu=ext]').onclick = () => extend(5);
    b.querySelector('[data-eu=menu]').onclick = choose; b.querySelector('[data-eu=stop]').onclick = stop;
    const upd = () => { const E2 = get(); if (!E2.cur) { badge(); return; } const left = E2.cur.end - Date.now(); if (left <= 0) { badge(); return; } const s = Math.ceil(left / 1000); const el = document.getElementById('eu-t'); if (el) el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    upd(); timer = setInterval(upd, 1000);
  }

  /* ---------- morning recall ---------- */
  const ready = () => { const E = get(), now = Date.now(); return E.sessions.filter(s => !s.done && s.after <= now && s.after > now - 3 * 24 * 60 * MIN); };
  function morning(force) {
    const E = get(), rs = ready(); if (!rs.length) return;
    if (!force && E.snooze && E.snooze > Date.now()) return;
    // interleave sources so two items of the same topic rarely follow each other, newest night first
    const items = []; for (const s of rs) for (const it of s.items) items.push(Object.assign({ sid: s.id }, it));
    const by = {}; for (const it of items.sort(() => Math.random() - 0.5)) (by[it.src] = by[it.src] || []).push(it);
    const lists = Object.values(by), q = []; while (lists.some(l => l.length)) for (const l of lists) if (l.length) q.push(l.shift());
    const M = { q: q.slice(0, 25).map(it => ({ it })), i: 0, shown: false, ok: 0, miss: new Set() };
    const label = s => s === 'stb' ? '⚖️ StB-Pfad' : s.startsWith('pfad:echo-wiwi-') ? '🎓 WiWi ' + s.slice(15) : s === 'med' ? '🩺 Medizin' : s.startsWith('quiz:') ? '🎯 Quiz' : s === 'wege' ? '🪷 Wege' : s === 'comedy' ? '😂 Comedy' : '✍️ Eigene Notiz';
    const o = ov(''), box = o.querySelector('.eu-box');
    o.onclick = null;
    function draw() {
      if (M.i >= M.q.length) return finish();
      const c = M.q[M.i], it = c.it;
      box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><span class="eu-muted">🌅 Guten Morgen · ${Math.min(M.i + 1, M.q.length)}/${M.q.length}${c.again ? ' · noch einmal' : ''}</span><button class="eu-btn" style="padding:6px 10px" data-eu="later">Später</button></div>
        <span class="eu-muted">${label(it.src)}</span><h2 style="font-size:19px;line-height:1.35">${e(it.q)}</h2>
        ${M.shown ? `<div class="eu-a">${e(it.a)}</div><div class="eu-row"><button class="eu-btn" data-eu="no">Nicht gewusst</button><button class="eu-btn p" data-eu="yes">Gewusst</button></div>`
          : `<span class="eu-muted">Erst aus dem Kopf beantworten, am besten halblaut, dann aufdecken.</span><button class="eu-btn p" data-eu="show">Aufdecken</button>`}`;
      box.querySelector('[data-eu=later]').onclick = () => { const E2 = get(); E2.snooze = Date.now() + 2 * 60 * MIN; put(E2); o.remove(); };
      const sh = box.querySelector('[data-eu=show]'); if (sh) sh.onclick = () => { M.shown = true; draw(); };
      const y = box.querySelector('[data-eu=yes]'), n = box.querySelector('[data-eu=no]');
      if (y) y.onclick = () => { if (!c.again) M.ok++; M.i++; M.shown = false; draw(); };
      if (n) n.onclick = () => { if (!c.again) { M.miss.add(it); M.q.push({ it, again: true }); } M.i++; M.shown = false; draw(); };
    }
    function finish() {
      const missed = [...M.miss];
      for (const it of missed) feedBack(it);
      const E2 = get(); for (const s of E2.sessions) if (rs.some(r => r.id === s.id)) { s.done = true; s.res = { ok: M.ok, n: M.q.filter(x => !x.again).length }; }
      E2.snooze = 0; put(E2); xp(10 + M.ok * 2);
      box.innerHTML = `<h2>🦉 ${M.ok} von ${M.q.filter(x => !x.again).length} gewusst</h2>
        <span>${missed.length ? `${missed.length} ${missed.length === 1 ? 'Sache kommt' : 'Sachen kommen'} in ${[...new Set(missed.map(x => label(x.src)))].join(', ')} bald wieder dran.` : 'Alles saß. Die normalen Abstände übernehmen ab hier.'}</span>
        <span class="eu-muted">+${10 + M.ok * 2} XP</span><button class="eu-btn p" data-eu="x">Fertig</button>`;
      box.querySelector('[data-eu=x]').onclick = () => o.remove();
    }
    draw();
  }
  // a missed item goes back into its own plan
  function feedBack(it) {
    try {
      if (it.src === 'stb' && it.ref) { const P = lsj('echo-stbpfad', null); if (P && P.cards && P.cards[it.ref]) { const c = P.cards[it.ref]; c.b = 0; c.due = dk(new Date()); P.updated = Date.now(); lsset('echo-stbpfad', P); } }
      else if (it.src.startsWith('pfad:') && it.ref) { const k = it.src.slice(5), P = lsj(k, null); if (P && P.cards && P.cards[it.ref]) { const c = P.cards[it.ref]; c.b = 0; c.due = dk(new Date()); P.updated = Date.now(); lsset(k, P); } }
      else if (it.src === 'med' && it.ref) { const M = lsj('echo-med', null); if (M && M.c && M.c[it.ref]) { M.c[it.ref].d = Date.now(); M.updated = Date.now(); lsset('echo-med', M); } }
      else if (it.src.startsWith('quiz:') && it.ref) { const G = lsj('echo-games', null), bank = it.src.slice(5); const s = G && G.quiz && G.quiz[bank] && G.quiz[bank][it.ref]; if (s) { s.b = 0; s.d = Date.now(); G.updated = Date.now(); lsset('echo-games', G); } }
      else if (it.src === 'wege' && it.ref) { const W = lsj('echo-wege', null); if (W) { W.rev = W.rev || {}; W.rev[it.ref] = { b: 0, due: dk(new Date()) }; W.updated = Date.now(); lsset('echo-wege', W); } }
    } catch { /* the morning review still counts */ }
  }

  window.EULE = { start, extend, stop, push, active, choose, free, morning, ready: () => ready().reduce((a, s) => a + s.items.length, 0), _afterOf: afterOf };
  const boot = () => {
    badge();
    const page = location.pathname.split('/').pop() || 'index.html';
    if ((page === 'index.html' || page === '') && ready().length && new Date().getHours() >= 4) setTimeout(() => morning(false), 900);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
