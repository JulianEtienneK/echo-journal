/* Echo · Kurator: keeps the growing pile of games and tools usable.
   - records which feature was used on which day (every page loads this file)
   - "Heute dran": three features per day, favouring what is rated important and what has not been opened for a while
   - one-tap rating (wichtig / geht so / kann weg); the fourth "kann weg" on four different days archives a feature
   - archive list with restore, under "Aufräumen" at the end of the games tab
   Only index.html calls Kurator.apply(); the other pages just record usage. */
(() => {
  'use strict';
  const KEY = 'echo-kurator', DOWN_LIMIT = 4;
  const F = { // id → [emoji, de, en, href | null (handled by a data-act on index), part of the daily mix?]
    laender: ['🌍', 'Atlas', 'Atlas', 'laender.html', 1], xw: ['🧩', 'Kreuzworträtsel', 'Crosswords', null, 1], medizin: ['🩺', 'Medizin-Atlas', 'Medicine atlas', 'medizin.html', 1],
    boerse: ['📈', 'Börsen-Akademie', 'Stock market academy', 'boerse.html', 1], zulassungen: ['💊', 'Zulassungs-Radar', 'Approval radar', 'zulassungen.html', 0],
    'spiele#skandale': ['🕵️', 'Skandal-Akten', 'Scandal files', 'spiele.html#skandale', 1], duell: ['⚔️', 'Atlas-Duell', 'Atlas duel', 'duell.html', 1],
    'spiele#stb': ['⚖️', 'Steuer-Akademie', 'Tax academy', 'spiele.html#stb', 1], 'spiele#rechnen': ['🧮', 'Kopfrechnen', 'Mental maths', 'spiele.html#rechnen', 1],
    'spiele#quiz-ernmed': ['🥗', 'Ernmed-Quiz', 'Nutrition quiz', 'spiele.html#quiz-ernmed', 1], 'spiele#quiz-steuer': ['🧾', 'Steuer-Fallquiz', 'Tax case quiz', 'spiele.html#quiz-steuer', 1],
    'werkzeuge#liste': ['🗺️', 'Erlebnisliste', 'Bucket list', 'werkzeuge.html#liste', 0], spanisch: ['🇪🇸', 'Spanisch', 'Spanish', 'spanisch.html', 1],
    'werkzeuge#sozial': ['💬', 'Smalltalk', 'Small talk', 'werkzeuge.html#sozial', 1], 'werkzeuge#entscheiden': ['🧭', 'Entscheiden', 'Decisions', 'werkzeuge.html#entscheiden', 0],
    'werkzeuge#ruhe': ['😴', 'Ruhen & Powernap', 'Rest & power nap', 'werkzeuge.html#ruhe', 1], 'werkzeuge#boost': ['⚡', 'Merk-Boost', 'Memory boost', 'werkzeuge.html#boost', 0],
    'werkzeuge#iat': ['🧠', 'Bias-Check', 'Bias check', 'werkzeuge.html#iat', 0],
  };
  const en = () => document.documentElement.lang === 'en', L = (de, e) => en() ? e : de, name = id => F[id][en() ? 2 : 1];
  const load = () => { let k = {}; try { k = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { /* corrupt: start over */ } k.u = k.u || {}; k.r = k.r || {}; k.arch = k.arch || {}; return k; };
  const save = k => { k.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(k)); } catch { /* blocked */ } };
  const dk = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const daysSince = ts => ts ? Math.floor((Date.now() - ts) / 864e5) : null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- usage ---------- */
  function track(id) { if (!F[id]) return; const k = load(), u = k.u[id] || (k.u[id] = { n: 0 }); if (u.d !== dk()) { u.n++; u.d = dk(); } u.last = Date.now(); save(k); }
  function currentId() {
    const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', ''), h = location.hash.replace(/^#/, '');
    if (page === 'werkzeuge') { const m = [['iat', 'iat'], ['entscheiden', 'entscheiden'], ['dec-', 'entscheiden'], ['rev-', 'entscheiden'], ['sozial', 'sozial'], ['rp-', 'sozial'], ['boost', 'boost'], ['liste', 'liste'], ['ruhe', 'ruhe']].find(([p]) => h.startsWith(p)); return m ? 'werkzeuge#' + m[1] : null; }
    if (page === 'spiele') { const m = ['skandale', 'stb', 'rechnen', 'quiz-ernmed', 'quiz-steuer'].find(p => h.startsWith(p)); return m ? 'spiele#' + m : null; }
    return F[page] ? page : null;
  }
  const here = () => { const id = currentId(); if (id) track(id); };
  here(); window.addEventListener('hashchange', here);

  /* ---------- rating + archive ---------- */
  function rate(id, v) {
    const k = load(), r = k.r[id] || (k.r[id] = { downs: 0 }), today = dk(); let archived = false;
    if (v < 0) { if (r.downDay !== today) { r.downs = (r.downs || 0) + 1; r.downDay = today; } if (r.downs >= DOWN_LIMIT) { k.arch[id] = { at: Date.now(), why: 'auto' }; archived = true; } }
    else if (v > 0) r.downs = 0;
    r.v = v; r.day = today; k.asked = today; save(k); return archived;
  }
  function archive(id) { const k = load(); k.arch[id] = { at: Date.now(), why: 'manual' }; save(k); }
  function restore(id) { const k = load(); delete k.arch[id]; if (k.r[id]) { k.r[id].downs = 0; k.r[id].v = 0; } save(k); }

  /* ---------- daily mix ---------- */
  function mix() {
    const k = load(), today = dk();
    if (k.mix && k.mix.day === today && k.mix.ids.every(id => F[id] && !k.arch[id])) return k;
    // deterministic per day, so reopening the app shows the same three
    let seed = [...today].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7); const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const pool = Object.keys(F).filter(id => F[id][4] && !k.arch[id]).map(id => { const u = k.u[id], r = k.r[id] || {}, ds = u ? daysSince(u.last) : null;
      const w = 1 + (r.v > 0 ? 2 : 0) + (ds == null ? 1.5 : Math.min(ds, 30) / 8) - (r.downs || 0) * 0.6; return { id, w: Math.max(0.15, w) }; });
    const ids = []; while (ids.length < 3 && pool.length) { let x = rand() * pool.reduce((s, p) => s + p.w, 0), i = 0; while (i < pool.length - 1 && (x -= pool[i].w) > 0) i++; ids.push(pool.splice(i, 1)[0].id); }
    const yesterday = dk(new Date(Date.now() - 864e5));
    k.mix = { day: today, ids, paid: false, streak: k.mix && k.mix.paid && k.mix.day === yesterday ? k.mix.streak || 0 : 0 }; save(k); return k;
  }
  function payMix(k) { // all three done: bonus XP once, into the shared games store
    if (k.mix.paid) return false; const today = dk();
    if (!k.mix.ids.length || !k.mix.ids.every(id => (k.u[id] || {}).d === today)) return false;
    k.mix.paid = true; k.mix.streak = (k.mix.streak || 0) + 1; save(k);
    try { const G = JSON.parse(localStorage.getItem('echo-games') || 'null') || { xp: 0, days: {} }; G.days = G.days || {}; const d = G.days[today] || (G.days[today] = { xp: 0 }); d.mix = 1; d.xp = (d.xp || 0) + 30; G.xp = (G.xp || 0) + 30; G.updated = Date.now(); localStorage.setItem('echo-games', JSON.stringify(G)); } catch { /* blocked */ }
    return true;
  }
  const open = (id, inner, cls = '', style = '') => F[id][3] ? `<a class="${cls}" href="${F[id][3]}" style="text-decoration:none;color:inherit;${style}">${inner}</a>` : `<button class="${cls}" data-act="xw-hub" data-kfid="${id}" style="${style}">${inner}</button>`;
  function mixCard() {
    const k = mix(), today = dk(), just = payMix(k), done = k.mix.ids.filter(id => (k.u[id] || {}).d === today).length;
    if (!k.mix.ids.length) return '';
    return `<section class="card" id="kMix"><div class="row spread"><div class="stack" style="gap:0"><span class="eyebrow">${L('Heute dran', 'Today\'s three')}</span><h3>${k.mix.paid ? L('Tagesmix geschafft', 'Daily mix done') : done + ' / ' + k.mix.ids.length}</h3></div><span class="xp">${k.mix.paid ? '✓ +30' : '+30 XP'}${k.mix.streak > 1 ? ' · 🔥 ' + k.mix.streak : ''}</span></div>
    <div class="row" style="gap:8px;align-items:stretch">${k.mix.ids.map(id => { const ok = (k.u[id] || {}).d === today; return open(id, `<span style="font-size:26px">${ok ? '✅' : F[id][0]}</span><span class="small" style="font-weight:600;line-height:1.2${ok ? ';opacity:.6' : ''}">${esc(name(id))}</span>`, '', 'flex:1;min-width:0;display:grid;gap:4px;justify-items:center;text-align:center;padding:12px 6px;border-radius:14px;border:1px solid var(--line);background:var(--surface-2);font:inherit;cursor:pointer'); }).join('')}</div>
    ${just ? `<span class="small" style="color:var(--gold)">${L('Alle drei erledigt: +30 XP.', 'All three done: +30 XP.')}</span>` : ''}</section>`;
  }

  /* ---------- one question per day ---------- */
  function askCard() {
    const k = load(), today = dk(); if (k.asked === today) return '';
    const cand = Object.keys(F).filter(id => !k.arch[id]).map(id => { const u = k.u[id], r = k.r[id] || {}, ds = u ? daysSince(u.last) : null, since = r.day ? Math.floor((Date.now() - new Date(r.day + 'T12:00').getTime()) / 864e5) : 999;
      if (since < 14) return null;
      if (u && u.n >= 2 && ds <= 2) return { id, pr: 3, q: L('Wie wichtig ist dir das?', 'How much does this matter to you?') };
      if (u && ds >= 21) return { id, pr: 2, q: L(`Seit ${ds} Tagen nicht geöffnet. Behalten?`, `Not opened for ${ds} days. Keep it?`) };
      if (!u && r.v == null) return { id, pr: 1, q: L('Wie wichtig ist dir das?', 'How much does this matter to you?') };
      return null; }).filter(Boolean).sort((a, b) => b.pr - a.pr);
    if (!cand.length) return ''; const c = cand[0], downs = (k.r[c.id] || {}).downs || 0;
    return `<section class="card" id="kAsk" style="gap:10px"><div class="row"><span style="font-size:26px">${F[c.id][0]}</span><div class="stack" style="gap:0"><b>${esc(name(c.id))}</b><span class="small muted">${c.q}</span></div></div>
    <div class="row" style="gap:8px"><button class="btn sm grow" data-k="rate" data-id="${c.id}" data-v="1">👍 ${L('Wichtig', 'Important')}</button><button class="btn sm grow" data-k="rate" data-id="${c.id}" data-v="0">😐 ${L('Geht so', 'So-so')}</button><button class="btn sm grow" data-k="rate" data-id="${c.id}" data-v="-1">👎 ${L('Kann weg', 'Drop it')}${downs ? ' ' + downs + '/' + DOWN_LIMIT : ''}</button></div></section>`;
  }

  /* ---------- tidy-up sheet ---------- */
  function sheet() {
    const k = load(), ids = Object.keys(F), act = ids.filter(id => !k.arch[id]), arc = ids.filter(id => k.arch[id]);
    const last = id => { const u = k.u[id]; if (!u) return L('seit Zählbeginn nicht geöffnet', 'not opened since counting began'); const d = daysSince(u.last); return (d === 0 ? L('heute', 'today') : d === 1 ? L('gestern', 'yesterday') : L(`vor ${d} Tagen`, `${d} days ago`)) + ' · ' + u.n + ' ' + L(u.n === 1 ? 'Tag' : 'Tage', u.n === 1 ? 'day' : 'days'); };
    const b = (id, v, em) => { const r = k.r[id] || {}, on = r.v === v && r.day; return `<button data-k="rate" data-id="${id}" data-v="${v}" aria-pressed="${on ? 'true' : 'false'}" style="border:1px solid ${on ? 'var(--calm)' : 'var(--line)'};background:${on ? 'var(--calm-soft)' : 'transparent'};border-radius:10px;width:40px;height:36px;font-size:17px;cursor:pointer">${em}</button>`; };
    const order = id => { const r = k.r[id] || {}; return r.v > 0 ? 0 : r.v < 0 ? 2 : 1; };
    return `<div id="kSheet" style="position:fixed;inset:0;z-index:60;background:var(--bg);overflow-y:auto;padding:max(16px,env(safe-area-inset-top)) 16px calc(env(safe-area-inset-bottom,0px) + 30px)"><div style="max-width:560px;margin:0 auto;display:grid;gap:12px">
    <div class="row spread"><h2>${L('Aufräumen', 'Tidy up')}</h2><button class="btn sm" data-k="close">${L('Fertig', 'Done')}</button></div>
    <p class="small muted">${L(`👍 wandert nach oben und kommt öfter in „Heute dran“. 👎 zählt einmal pro Tag; beim ${DOWN_LIMIT}. Mal geht die Funktion ins Archiv. Nichts wird gelöscht, dein Fortschritt bleibt.`, `👍 moves up and shows more often in the daily three. 👎 counts once a day; the ${DOWN_LIMIT}th sends the feature to the archive. Nothing is deleted, your progress stays.`)}</p>
    ${act.sort((a, c) => order(a) - order(c)).map(id => `<div class="card flat" style="padding:12px 14px;gap:8px"><div class="row spread"><div class="row" style="min-width:0"><span style="font-size:24px">${F[id][0]}</span><div class="stack" style="gap:0;min-width:0"><b>${esc(name(id))}</b><span class="small muted">${last(id)}${(k.r[id] || {}).downs ? ' · 👎 ' + k.r[id].downs + '/' + DOWN_LIMIT : ''}</span></div></div><div class="row" style="gap:5px;flex:none">${b(id, 1, '👍')}${b(id, 0, '😐')}${b(id, -1, '👎')}</div></div><button data-k="arch" data-id="${id}" style="justify-self:start;border:0;background:none;padding:0;color:var(--muted);font-size:13px;cursor:pointer;text-decoration:underline">${L('Sofort ins Archiv', 'Archive now')}</button></div>`).join('')}
    <h3 style="margin-top:8px">${L('Archiv', 'Archive')} (${arc.length})</h3>
    ${arc.length ? arc.sort((a, c) => k.arch[c].at - k.arch[a].at).map(id => `<div class="card flat" style="padding:12px 14px"><div class="row spread"><div class="row" style="min-width:0"><span style="font-size:24px;opacity:.6">${F[id][0]}</span><div class="stack" style="gap:0"><b>${esc(name(id))}</b><span class="small muted">${new Date(k.arch[id].at).toLocaleDateString(en() ? 'en-GB' : 'de-DE')} · ${k.arch[id].why === 'auto' ? L(DOWN_LIMIT + '× 👎', DOWN_LIMIT + '× 👎') : L('von dir archiviert', 'archived by you')}</span></div></div><div class="row" style="gap:6px;flex:none">${open(id, L('Öffnen', 'Open'), 'btn sm')}<button class="btn sm primary" data-k="restore" data-id="${id}">${L('Zurückholen', 'Restore')}</button></div></div></div>`).join('') : `<p class="small muted">${L('Noch leer.', 'Empty so far.')}</p>`}</div></div>`;
  }
  function showSheet() { document.getElementById('kSheet')?.remove(); document.body.insertAdjacentHTML('beforeend', sheet()); }
  function say(msg) { document.getElementById('kToast')?.remove(); const el = document.createElement('div'); el.id = 'kToast'; el.textContent = msg; el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 90px);z-index:70;background:var(--ink);color:var(--bg);padding:11px 16px;border-radius:14px;font-size:14.5px;max-width:90vw;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.3)'; document.body.appendChild(el); setTimeout(() => el.remove(), 3200); }

  /* ---------- hook into the start page ---------- */
  const fid = el => { if (el.matches('a[href]')) { const id = el.getAttribute('href').replace('.html', ''); return F[id] ? id : null; } const a = el.dataset.act; return a === 'geo-open' ? 'laender' : a === 'xw-hub' ? 'xw' : null; };
  function apply(tab) {
    const app = document.getElementById('app'); if (!app) return;
    if (tab === 'today') { const hero = app.querySelector('.hero'); if (hero) hero.insertAdjacentHTML('afterend', mixCard()); return; }
    if (tab !== 'games') return;
    const k = load(), cards = [...app.children].filter(el => el.classList.contains('card') && fid(el));
    // hide archived, then put 👍 first and 👎 last within the games block and within the tools block
    const split = [...app.children].find(el => el.tagName === 'H2'), rank = el => { const r = k.r[fid(el)] || {}; return r.v > 0 ? 0 : r.v < 0 ? 2 : 1; };
    for (const group of [cards.filter(el => !split || el.compareDocumentPosition(split) & 4), cards.filter(el => split && el.compareDocumentPosition(split) & 2)]) {
      if (!group.length) continue; const anchor = group[group.length - 1].nextSibling, sorted = group.map((el, i) => ({ el, i })).sort((a, b) => rank(a.el) - rank(b.el) || a.i - b.i);
      sorted.forEach(({ el }) => { app.insertBefore(el, anchor); if (k.arch[fid(el)]) el.hidden = true; });
    }
    const first = app.querySelector('section.card'); (first || app.firstElementChild).insertAdjacentHTML('afterend', mixCard() + askCard());
    const n = Object.keys(k.arch).length;
    app.insertAdjacentHTML('beforeend', `<button class="btn" data-k="sheet" style="justify-self:center;margin-top:6px">🧹 ${L('Aufräumen', 'Tidy up')}${n ? ' · ' + L('Archiv', 'Archive') + ' ' + n : ''}</button>`);
  }
  const rerender = () => { if (typeof window.render === 'function') window.render(); };
  document.addEventListener('click', e => {
    const x = e.target.closest('[data-kfid]'); if (x) { track(x.dataset.kfid); document.getElementById('kSheet')?.remove(); }
    const xw = e.target.closest('[data-act="xw-hub"]'); if (xw && !x) track('xw');
    const el = e.target.closest('[data-k]'); if (!el) return; const a = el.dataset.k, id = el.dataset.id, inSheet = !!el.closest('#kSheet');
    if (a === 'sheet') showSheet();
    if (a === 'close') { document.getElementById('kSheet').remove(); rerender(); }
    if (a === 'rate') { const gone = rate(id, +el.dataset.v); say(gone ? L(`${name(id)} ist jetzt im Archiv. Zurückholen geht unter „Aufräumen“.`, `${name(id)} is archived. Restore it under "Tidy up".`) : +el.dataset.v > 0 ? L('Gemerkt: wichtig.', 'Noted: important.') : +el.dataset.v < 0 ? L(`Gemerkt. ${(load().r[id] || {}).downs} von ${DOWN_LIMIT} bis zum Archiv.`, `Noted. ${(load().r[id] || {}).downs} of ${DOWN_LIMIT} until archived.`) : L('Gemerkt.', 'Noted.')); if (inSheet) showSheet(); else rerender(); }
    if (a === 'arch') { archive(id); say(L(`${name(id)} ist im Archiv.`, `${name(id)} archived.`)); showSheet(); }
    if (a === 'restore') { restore(id); say(L(`${name(id)} ist wieder da.`, `${name(id)} is back.`)); showSheet(); }
  });
  window.Kurator = { apply, track, load, rate, F };
})();
