/* Medizin-Atlas: anatomy map in 4 levels, diseases in 4 tiers, metabolic pathways; spaced repetition per card.
   Data: window.MED (med-data.js). Maps: window.MEDSVG (med-svg.js). Progress: localStorage 'echo-med'; XP goes to 'echo-games'. */
'use strict';
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
(() => { const s = LS.get('echo-settings', {}); if (s.theme && s.theme !== 'system') document.documentElement.dataset.theme = s.theme; })();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dk(new Date());
const DAY = 864e5;
const app = document.getElementById('app');
function toast(msg) { document.querySelectorAll('.toast').forEach(t => t.remove()); const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2400); }
let AC = null;
function beep(ok) {
  if ((LS.get('echo-games', {}) || {}).sound === false) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = ok ? 780 : 200; g.gain.setValueAtTime(.0001, AC.currentTime); g.gain.exponentialRampToValueAtTime(.1, AC.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .18); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + .2); } catch { /* no audio */ }
}

/* ---------- extension hooks (psy.js adds the Gehirn & Psyche layer) ---------- */
const EXT = { views: {}, acts: {}, q: {}, info: {}, title: {}, names: {}, decorate: [] };
window.MEDEXT = EXT;

/* ---------- state ---------- */
const MK = 'echo-med';
const M = Object.assign({ c: {}, all: false, sex: 'w', rounds: 0, det: { n: 0, best: 0 } }, LS.get(MK, {}) || {});
const saveM = () => { M.updated = Date.now(); LS.set(MK, M); };
// XP counts in Echo's level (Echo adds up echo-games.xp); a finished round marks today's bonus quest.
function gain(xp, round) {
  const G = LS.get('echo-games', null) || { xp: 0, days: {} }; G.days = G.days || {};
  const d = G.days[today()] || (G.days[today()] = { xp: 0 });
  if (round) d.med = (d.med || 0) + 1;
  d.xp = (d.xp || 0) + xp; G.xp = (G.xp || 0) + xp; G.updated = Date.now(); LS.set('echo-games', G);
}

/* ---------- data ---------- */
const MED = window.MED || { systems: {}, organs: {}, struct: {}, dis: [], path: [] };
const SYS = MED.systems, ORG = MED.organs, STR = MED.struct, DIS = MED.dis, PATH = MED.path;
const TOP = ['herz', 'lunge', 'magen', 'leber', 'niere', 'duenndarm', 'gehirn', 'pankreas'];
const ORG_ORDER = [...TOP.filter(k => ORG[k]), ...Object.keys(ORG).filter(k => !TOP.includes(k))];
const DIS_BY = {}; for (const d of DIS) (DIS_BY[d.organ] = DIS_BY[d.organ] || []).push(d);
for (const k in DIS_BY) DIS_BY[k].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name, 'de'));
const DIS_ID = Object.fromEntries(DIS.map(d => [d.id, d]));
const PATH_ID = Object.fromEntries(PATH.map(p => [p.id, p]));
const STAGE = ['', 'Organsystem & Lage', 'Organ', 'Strukturen', 'Feinbau & Leitungsbahnen'];
const TIER = ['', 'Volkskrankheit', 'Häufig', 'Prüfungsrelevant', 'Selten'];
const FIELDS = [['def', 'Definition & Ursache', 1], ['leit', 'Leitsymptom', 1], ['nut', 'Ernährungsmedizin', 1], ['dx', 'Diagnostik & Labor', 2], ['tx', 'Therapieprinzip', 3], ['more', 'Vertiefung', 4]];
const sysOf = o => (ORG[o] || {}).sys;
const OSHORT = { gefaesse: 'Gefäße', luftwege: 'Atemwege', harnwege: 'Harnwege', nerven: 'Nerven', lymphe: 'Lymphe & Immun', weiblich: 'Weiblich', maennlich: 'Männlich', blut: 'Blut', stoffwechsel: 'Stoffwechsel', hypophyse: 'Hypophyse', lunge: 'Lunge', gehirn: 'Gehirn & Psyche', gelenke: 'Gelenke', dickdarm: 'Dickdarm', gallenblase: 'Galle', pankreas: 'Pankreas', schilddruese: 'Schilddrüse' };
const oshort = o => OSHORT[o] || String((ORG[o] || {}).name || o).replace(/\s*\(.*?\)\s*/g, ' ').split(/ & |, /)[0].trim();
const short = s => String(s).replace(/\s*\(.*?\)\s*/g, ' ').trim();

// every learnable card: id → {id, kind, organ, stage, ref}
const ITEMS = {};
const add = (id, kind, organ, stage, ref) => { ITEMS[id] = { id, kind, organ, stage, ref }; };
for (const k of Object.keys(SYS)) add('s.' + k, 'sys', '_sys', 1, k);
for (const k of ORG_ORDER) {
  const o = ORG[k]; add('o.' + k, 'org', k, 1, k);
  if (o.lage) add('f.' + k + '.lage', 'fact', k, 2, { label: 'Lage', text: o.lage });
  if (o.blut) add('f.' + k + '.blut', 'fact', k, 2, { label: 'Blutversorgung', text: o.blut });
  (o.facts || []).forEach((t, i) => add('f.' + k + '.' + i, 'fact', k, 2, { label: 'Fakt', text: t }));
  for (const s of STR[k] || []) add('t.' + k + '.' + s.id, 'str', k, s.l, s);
}
for (const d of DIS) add('d.' + d.id, 'dis', d.organ, d.tier, d);
for (const p of PATH) { add('p.' + p.id + '.o', 'po', '_path', 1, p); add('p.' + p.id + '.d', 'pd', '_path', 2, p); }
const ALL = Object.values(ITEMS);
const BY_ORGAN = {}; for (const it of ALL) (BY_ORGAN[it.organ] = BY_ORGAN[it.organ] || []).push(it);

const st = id => M.c[id] || (M.c[id] = { b: 0, d: 0, n: 0, w: 0 });
const seen = id => !!M.c[id] && (M.c[id].n + M.c[id].w) > 0;
const known = id => (M.c[id] || {}).b >= 1;
const solid = id => (M.c[id] || {}).b >= 3;
const IV = [0, 1, 3, 7, 16, 35, 80, 180];

function stageOpen(organ) {
  if (M.all) return 4;
  if (organ === '_sys') return 1;
  let k = 1;
  while (k < 4) {
    const it = (BY_ORGAN[organ] || []).filter(i => i.stage === k);
    if (it.length && it.filter(i => known(i.id)).length / it.length < .7) break;
    k++;
  }
  return k;
}
const pathOpen = p => M.all || known('p.' + p.id + '.o');
function isOpen(it) {
  if (it.kind === 'pd') return pathOpen(it.ref);
  if (it.kind === 'po') return true;
  return it.stage <= stageOpen(it.organ);
}
function organStats(o) {
  const it = BY_ORGAN[o] || [];
  return { n: it.length, seen: it.filter(i => seen(i.id)).length, known: it.filter(i => known(i.id)).length, solid: it.filter(i => solid(i.id)).length, stage: stageOpen(o) };
}
function stageStats(o, k) { const it = (BY_ORGAN[o] || []).filter(i => i.stage === k); return { n: it.length, known: it.filter(i => known(i.id)).length, solid: it.filter(i => solid(i.id)).length }; }
const dueList = (pool = ALL) => { const now = Date.now(); return pool.filter(i => seen(i.id) && M.c[i.id].d <= now && isOpen(i)); };

/* ---------- question building ---------- */
const STOP = new Set(['und', 'oder', 'der', 'die', 'das', 'des', 'mit', 'bei', 'von', 'vom', 'akute', 'akuter', 'akutes', 'akut', 'chronische', 'chronischer', 'chronisches', 'syndrom', 'krankheit', 'erkrankung', 'morbus', 'typ', 'primäre', 'primärer', 'sekundäre', 'sekundärer', 'angeborene', 'angeborener']);
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function mask(text, name) {
  let out = String(text || '');
  const words = String(name).split(/[\s\-/,()]+/).filter(Boolean);
  for (const w of words) {
    const lw = w.toLowerCase();
    const abbr = /^[A-ZÄÖÜ0-9]{2,6}$/.test(w);
    if (!abbr && (w.length < 4 || STOP.has(lw))) continue;
    const stem = !abbr && w.length > 7 ? w.slice(0, 6) : w;
    out = out.replace(new RegExp((abbr ? '\\b' : '') + reEsc(stem) + (abbr ? '\\b' : '[\\p{L}-]*'), abbr ? 'g' : 'giu'), '▢▢▢');
  }
  return out;
}
function others(list, self, n, key = x => x) {
  const seenK = new Set([key(self)]), out = [];
  for (const x of shuffle(list)) { const k = key(x); if (!k || seenK.has(k)) continue; seenK.add(k); out.push(x); if (out.length >= n) break; }
  return out;
}
function disDistractors(d, n) {
  const same = (DIS_BY[d.organ] || []).filter(x => x.id !== d.id);
  const sys = DIS.filter(x => x.organ !== d.organ && sysOf(x.organ) === sysOf(d.organ));
  let out = others(same, d, n, x => x.id);
  if (out.length < n) out = out.concat(others(sys, d, n - out.length, x => x.id));
  if (out.length < n) out = out.concat(others(DIS.filter(x => !out.includes(x) && x.id !== d.id), d, n - out.length, x => x.id));
  return out;
}
const mcOpts = (right, wrong) => shuffle([{ label: right, ok: true }, ...wrong.map(w => ({ label: w, ok: false }))]);

function makeQ(it) {
  const b = (M.c[it.id] || {}).b || 0;
  if (EXT.q[it.kind]) return EXT.q[it.kind](it, b);
  if (it.kind === 'sys') {
    const s = SYS[it.ref], w = others(Object.keys(SYS), it.ref, 3).map(k => SYS[k].name);
    return { it, type: 'mc', eyebrow: 'Organsysteme', prompt: 'Welches Organsystem ist das?', sub: s.fn, opts: mcOpts(s.name, w) };
  }
  if (it.kind === 'org') {
    const o = ORG[it.ref];
    if (b % 2 === 0) return { it, type: 'tap', eyebrow: 'Wo liegt …?', prompt: 'Tippe: ' + short(o.name), map: { kind: 'body', view: o.sys, sex: it.ref === 'maennlich' ? 'm' : it.ref === 'weiblich' ? 'w' : M.sex, target: it.ref } };
    const w = others(ORG_ORDER, it.ref, 3).map(k => ORG[k].fn).filter(Boolean);
    return { it, type: 'mc', eyebrow: short(o.name), prompt: 'Welche Aufgabe hat dieses Organ?', opts: mcOpts(o.fn, w), long: true };
  }
  if (it.kind === 'fact') {
    const o = ORG[it.organ], sysmates = ORG_ORDER.filter(k => k !== it.organ && ORG[k].sys === o.sys);
    const w = [...shuffle(sysmates).slice(0, 2), ...others(ORG_ORDER.filter(k => !sysmates.includes(k)), it.organ, 3)].slice(0, 3).map(k => short(ORG[k].name));
    return { it, type: 'mc', eyebrow: it.ref.label, prompt: 'Zu welchem Organ passt das?', sub: mask(it.ref.text, o.name), opts: mcOpts(short(o.name), w) };
  }
  if (it.kind === 'str') {
    const s = it.ref, mk = MEDSVG.mapFor(it.organ, s.id), sibs = (STR[it.organ] || []).filter(x => x.id !== s.id);
    if (mk && b % 3 === 0) return { it, type: 'tap', eyebrow: short(ORG[it.organ].name) + ' · Stufe ' + s.l, prompt: 'Tippe: ' + short(s.name), map: { kind: 'detail', key: mk, target: s.id } };
    if (mk && b % 3 === 1) {
      const onMap = sibs.filter(x => MEDSVG.mapFor(it.organ, x.id) === mk);
      return { it, type: 'mc', eyebrow: short(ORG[it.organ].name) + ' · Stufe ' + s.l, prompt: 'Was ist markiert?', map: { kind: 'detail', key: mk, mark: s.id }, opts: mcOpts(short(s.name), others(onMap.length >= 3 ? onMap : sibs, s, 3, x => x.id).map(x => short(x.name))) };
    }
    if (b % 2 === 0 || !s.q) return { it, type: 'mc', eyebrow: short(ORG[it.organ].name) + ' · Stufe ' + s.l, prompt: 'Was trifft auf „' + short(s.name) + '“ zu?', opts: mcOpts(s.fact, others(sibs, s, 3, x => x.id).map(x => x.fact)), long: true };
    return { it, type: 'mc', eyebrow: short(ORG[it.organ].name) + ' · Stufe ' + s.l, prompt: s.q, opts: mcOpts(short(s.name), others(sibs, s, 3, x => x.id).map(x => short(x.name))) };
  }
  if (it.kind === 'dis') {
    const d = it.ref, lv = stageOpen(d.organ), vs = FIELDS.filter(([k, , l]) => l <= lv && d[k]).map(([k, lab]) => [k, lab]);
    const [k, lab] = vs[b % vs.length], rev = b >= vs.length && ['def', 'leit', 'dx', 'tx'].includes(k);
    const ds = disDistractors(d, 3);
    if (rev) {
      const w = ds.map(x => mask(x[k] || x.def, x.name));
      return { it, type: 'mc', eyebrow: lab, prompt: d.name + ': was passt?', opts: mcOpts(mask(d[k], d.name), w), long: true };
    }
    return { it, type: 'mc', eyebrow: lab + ' · ' + short(ORG[d.organ].name), prompt: 'Welche Krankheit ist gemeint?', sub: mask(d[k], d.name), opts: mcOpts(d.name, ds.map(x => x.name)) };
  }
  if (it.kind === 'po') {
    const p = it.ref, fs = [['ort', 'Wo läuft „' + p.name + '“ ab?'], ['bilanz', 'Bilanz von „' + p.name + '“?'], ['schritt', 'Schrittmacher von „' + p.name + '“?'], ['zweck', null]].filter(([f]) => p[f]);
    const [f, q] = fs[b % fs.length], op = others(PATH, p, 3, x => x.id);
    if (!q) return { it, type: 'mc', eyebrow: 'Stoffwechselweg', prompt: 'Welcher Weg ist gemeint?', sub: mask(p.zweck, p.name), opts: mcOpts(p.name, op.map(x => x.name)) };
    return { it, type: 'mc', eyebrow: 'Stoffwechselweg', prompt: q, opts: mcOpts(p[f], op.map(x => x[f]).filter(Boolean)), long: true };
  }
  if (it.kind === 'pd') return pathBlank(it.ref, it);
  return null;
}
function pathBlank(p, it) {
  const useEdge = Math.random() < .45 && p.edges.length;
  if (useEdge) {
    const i = Math.floor(Math.random() * p.edges.length), right = p.edges[i].e;
    let w = others(p.edges.map(e => e.e), right, 3);
    if (w.length < 3) w = w.concat(others(PATH.flatMap(x => x.edges.map(e => e.e)), right, 3 - w.length));
    return { it, type: 'mc', eyebrow: p.name, prompt: 'Welches Enzym / welcher Schritt fehlt?', path: { p, blankE: i }, opts: mcOpts(right, w) };
  }
  const i = Math.floor(Math.random() * p.nodes.length), right = p.nodes[i];
  let w = others(p.nodes, right, 3);
  if (w.length < 3) w = w.concat(others(PATH.flatMap(x => x.nodes), right, 3 - w.length));
  return { it, type: 'mc', eyebrow: p.name, prompt: 'Was gehört an die markierte Stelle?', path: { p, blankN: i }, opts: mcOpts(right, w) };
}

/* ---------- rounds ---------- */
let R = null; // current round
function buildRound(scope = {}) {
  const inScope = it => {
    if (scope.kind && it.kind !== scope.kind) return false;
    if (scope.organ) return it.organ === scope.organ;
    if (scope.path) return scope.path === true ? it.organ === '_path' : it.organ === '_path' && it.ref.id === scope.path;
    if (scope.sys) return sysOf(it.organ) === scope.sys;
    return true;
  };
  const pool = ALL.filter(it => inScope(it) && isOpen(it)), now = Date.now();
  const due = pool.filter(i => seen(i.id) && M.c[i.id].d <= now).sort((a, b) => M.c[a.id].d - M.c[b.id].d);
  const pr = it => [it.stage, it.organ === '_sys' ? -1 : it.organ === '_path' ? 99 : ORG_ORDER.indexOf(it.organ)];
  const fresh = pool.filter(i => !seen(i.id)).sort((a, b) => { const x = pr(a), y = pr(b); return x[0] - y[0] || x[1] - y[1]; });
  const nNew = Math.max(4, 10 - due.length);
  let seq = [...due.slice(0, 8), ...fresh.slice(0, Math.min(nNew, 10 - Math.min(8, due.length)))];
  if (!seq.length) seq = pool.filter(i => seen(i.id)).sort((a, b) => M.c[a.id].d - M.c[b.id].d).slice(0, 10);
  if (!seq.length) return null;
  return { scope, seq: shuffle(seq).map(it => ({ it, q: null, ok: null })), i: 0, ans: null, ok: 0, xp: 0, retry: new Set(), started: Date.now() };
}
function startRound(scope) {
  const r = buildRound(scope);
  if (!r) { toast('Hier gibt es gerade nichts zu lernen'); return; }
  R = r; R.seq[0].q = makeQ(R.seq[0].it); go('round');
}
function grade(ok) {
  const cur = R.seq[R.i], s = st(cur.it.id); cur.ok = ok;
  if (ok) { s.n++; s.b = Math.min(IV.length - 1, s.b + 1); s.d = Date.now() + IV[s.b] * DAY; R.ok++; R.xp += 5; }
  else {
    s.w++; s.b = 0; s.d = Date.now(); R.xp += 1;
    if (!R.retry.has(cur.it.id)) { R.retry.add(cur.it.id); R.seq.push({ it: cur.it, q: null, ok: null, again: true }); }
  }
  s.t = Date.now(); saveM(); beep(ok);
}
function answerMC(i) {
  const cur = R.seq[R.i]; if (R.ans != null) return;
  R.ans = i; grade(cur.q.opts[i].ok); render();
}
function answerTap(id) {
  const cur = R.seq[R.i], m = cur.q.map; if (R.ans != null) return;
  const ok = m.targets ? m.targets.includes(id) : id === m.target;
  if (ok && m.targets) m.target = id;
  R.ans = id; grade(ok); render();
}
function nextCard() {
  R.i++; R.ans = null;
  if (R.i >= R.seq.length) { R.done = true; const bonus = 10; R.xp += bonus; gain(R.xp, true); M.rounds = (M.rounds || 0) + 1; saveM(); }
  else R.seq[R.i].q = makeQ(R.seq[R.i].it);
  render(); scrollTo(0, 0);
}

/* ---------- detective ---------- */
let DT = null;
function detPool() {
  let pool = DIS.filter(d => d.tier <= stageOpen(d.organ) && d.clues && d.clues.length);
  if (pool.length < 8) pool = DIS.filter(d => d.tier <= 2 && d.clues && d.clues.length);
  return pool;
}
function detStart() {
  const pool = detPool(), now = Date.now();
  const due = shuffle(pool.filter(d => seen('d.' + d.id) && M.c['d.' + d.id].d <= now)), rest = shuffle(pool.filter(d => !due.includes(d)));
  const cases = [...due.slice(0, 2), ...rest, ...due.slice(2)].slice(0, 5);
  DT = { cases: cases.map(d => ({ d, k: 1, opts: shuffle([d, ...disDistractors(d, 5)]), wrong: new Set(), done: false, pts: 0 })), i: 0, pts: 0 };
  go('det');
}
function detClues(d) { const c = [...(d.clues || [])]; if (d.leit) c.push('Leitsymptom: ' + mask(d.leit, d.name)); if (d.dx) c.push('Diagnostik: ' + mask(d.dx, d.name)); return c.slice(0, 5); }
function detPick(id) {
  const c = DT.cases[DT.i]; if (c.done) return;
  const max = detClues(c.d).length;
  if (id === c.d.id) {
    c.done = true; c.solved = true; c.pts = Math.max(1, 6 - c.k); DT.pts += c.pts; beep(true);
    const s = st('d.' + c.d.id); s.n++; if (c.k <= 2) { s.b = Math.min(IV.length - 1, s.b + 1); s.d = Date.now() + IV[s.b] * DAY; } s.t = Date.now();
  } else {
    c.wrong.add(id); beep(false);
    if (c.k < max) c.k++; else { c.done = true; const s = st('d.' + c.d.id); s.w++; s.b = 0; s.d = Date.now(); }
  }
  saveM(); render();
}
function detNext() {
  DT.i++;
  if (DT.i >= DT.cases.length) { DT.over = true; const xp = DT.pts * 2; gain(xp, false); M.det.n++; M.det.best = Math.max(M.det.best || 0, DT.pts); saveM(); }
  render(); scrollTo(0, 0);
}

/* ---------- pathway drill ---------- */
let PD = null;
function drillStart(id) {
  const p = PATH_ID[id]; if (!p) return;
  const qs = []; const n = Math.min(6, p.nodes.length + p.edges.length);
  for (let i = 0; i < n; i++) qs.push(pathBlank(p, null));
  PD = { p, qs, i: 0, ans: null, ok: 0 }; go('drill');
}
function drillAnswer(i) {
  if (PD.ans != null) return; PD.ans = i; const ok = PD.qs[PD.i].opts[i].ok; if (ok) PD.ok++; beep(ok); render();
}
function drillNext() {
  PD.i++; PD.ans = null;
  if (PD.i >= PD.qs.length) {
    PD.over = true; gain(PD.ok * 3, false);
    const s = st('p.' + PD.p.id + '.d'); if (PD.ok >= PD.qs.length - 1) { s.n++; s.b = Math.min(IV.length - 1, s.b + 1); s.d = Date.now() + IV[s.b] * DAY; } else { s.w++; s.b = 0; s.d = Date.now(); } s.t = Date.now(); saveM();
  }
  render(); scrollTo(0, 0);
}

/* ---------- socratic hand-off to Echo ---------- */
function socratic(kind, id) {
  let payload = null;
  if (kind === 'dis') { const d = DIS_ID[id]; if (!d) return; payload = { kind, id, title: d.name, organ: short(ORG[d.organ].name), text: FIELDS.map(([k, l]) => d[k] ? l + ': ' + d[k] : '').filter(Boolean).join('\n') }; }
  if (kind === 'org') { const o = ORG[id]; if (!o) return; payload = { kind, id, title: short(o.name), organ: short(o.name), text: ['Lage: ' + o.lage, 'Funktion: ' + o.fn, 'Blut: ' + o.blut, ...(o.facts || []), ...(STR[id] || []).map(s => s.name + ': ' + s.fact)].filter(Boolean).join('\n') }; }
  if (kind === 'path') { const p = PATH_ID[id]; if (!p) return; payload = { kind, id, title: p.name, organ: p.ort, text: ['Ort: ' + p.ort, 'Zweck: ' + p.zweck, 'Bilanz: ' + p.bilanz, 'Schrittmacher: ' + p.schritt, 'Regulation: ' + p.reg, 'Schritte: ' + p.nodes.map((n, i) => n + (p.edges[i] ? ' →(' + p.edges[i].e + ')' : '')).join(' '), 'Krankheiten: ' + (p.dis || []).join('; '), 'Ernährung: ' + p.nut, ...(p.facts || [])].join('\n') }; }
  if (!payload) return;
  LS.set('echo-med-soc', Object.assign(payload, { at: Date.now() }));
  location.href = './?soc=med';
}

/* ---------- rendering helpers ---------- */
const V = { view: 'home', organ: null, tab: 'info', map: 0, sys: 'all', dis: null, path: null, pathMode: 'o', sel: null, labels: true, q: '', open: {} };
const topbar = (backTo) => `<div class="topbar">${backTo ? `<button class="link" data-act="${backTo}">← Zurück</button>` : '<a class="link" href="./#games">← Echo</a>'}<span class="eyebrow">🩺 Medizin-Atlas</span></div>`;
const dots = (n, of = 4) => `<span class="lvdots">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
function disCard(d, opts = {}) {
  const lv = opts.all ? 4 : stageOpen(d.organ), shown = V.open[d.id] || {};
  const rows = FIELDS.filter(([k]) => d[k]).map(([k, lab, l]) => {
    const locked = l > lv && !shown[k];
    return locked ? `<button class="frow locked" data-act="reveal" data-v="${d.id}|${k}"><span class="flab">${lab}</span><span class="small muted">🔒 ab Stufe ${l} · antippen zum Aufdecken</span></button>`
      : `<div class="frow ${k === 'nut' ? 'nut' : ''}"><span class="flab">${k === 'nut' ? '🥗 ' : ''}${lab}</span><span>${esc(d[k])}</span></div>`;
  }).join('');
  return `<div class="dcard"><div class="row spread" style="align-items:flex-start"><div style="display:grid;gap:2px"><h3>${esc(d.name)}</h3><span class="small muted">${esc(short(ORG[d.organ].name))} · ${TIER[d.tier]}</span></div><span class="tier t${d.tier}">${d.tier}</span></div>${rows}
    ${opts.actions === false ? '' : `<div class="row" style="gap:8px;flex-wrap:wrap"><button class="chip" data-act="soc" data-v="dis|${d.id}">🦉 Sokratisch vertiefen</button>${opts.organLink ? `<button class="chip" data-act="organ" data-v="${d.organ}">→ ${esc(short(ORG[d.organ].name))}</button>` : ''}</div>`}</div>`;
}
function itemInfo(it) {
  if (EXT.info[it.kind]) return EXT.info[it.kind](it);
  if (it.kind === 'dis') return disCard(it.ref, { actions: false });
  if (it.kind === 'str') return `<div class="dcard"><h3>${esc(it.ref.name)}</h3><span>${esc(it.ref.fact)}</span></div>`;
  if (it.kind === 'org') { const o = ORG[it.ref]; return `<div class="dcard"><h3>${esc(o.name)}</h3><div class="frow"><span class="flab">Lage</span><span>${esc(o.lage)}</span></div><div class="frow"><span class="flab">Funktion</span><span>${esc(o.fn)}</span></div></div>`; }
  if (it.kind === 'fact') return `<div class="dcard"><h3>${esc(ORG[it.organ].name)}</h3><span>${esc(it.ref.text)}</span></div>`;
  if (it.kind === 'sys') { const s = SYS[it.ref]; return `<div class="dcard"><h3>${esc(s.name)}</h3><span>${esc(s.fn)}</span>${(s.facts || []).map(f => `<span class="small">• ${esc(f)}</span>`).join('')}</div>`; }
  if (it.kind === 'po' || it.kind === 'pd') { const p = it.ref; return `<div class="dcard"><h3>${esc(p.name)}</h3><div class="frow"><span class="flab">Ort</span><span>${esc(p.ort)}</span></div><div class="frow"><span class="flab">Zweck</span><span>${esc(p.zweck)}</span></div><div class="frow"><span class="flab">Bilanz</span><span>${esc(p.bilanz)}</span></div><div class="frow"><span class="flab">Schrittmacher</span><span>${esc(p.schritt)}</span></div></div>`; }
  return '';
}

/* pathway diagram: vertical chain (line) or SVG ring (cycle) */
function wrap(s, n = 13) { const w = String(s).split(/(?<=[\s\-/])/), out = []; let cur = ''; for (const x of w) { if ((cur + x).length > n && cur) { out.push(cur.trim()); cur = x; } else cur += x; } if (cur.trim()) out.push(cur.trim()); return out.slice(0, 3); }
function pathDiagram(p, mode = 'd', blank = {}) {
  const ov = mode === 'o';
  const nodes = ov ? (p.short || p.nodes) : p.nodes;
  const nodeLab = (n, i) => !ov && blank.blankN === i ? '<span class="blank">?</span>' : esc(n);
  if (p.layout === 'cycle' && !ov) {
    const N = nodes.length, cx = 200, cy = 200, r = 128;
    const pos = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" class="pw-ring"/>`;
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i + .5) * 2 * Math.PI / N, [x, y] = [cx + r * Math.cos(a), cy + r * Math.sin(a)], e = p.edges[i];
      if (!e) continue;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" class="pw-step ${e.key ? 'key' : ''} ${blank.blankE === i ? 'blank' : ''}"/><text x="${x.toFixed(1)}" y="${(y + 3.5).toFixed(1)}" class="pw-num">${blank.blankE === i ? '?' : i + 1}</text>`;
    }
    for (let i = 0; i < N; i++) {
      const [x, y] = pos(i), lines = blank.blankN === i ? ['?'] : wrap(nodes[i]);
      s += `<rect x="${(x - 46).toFixed(1)}" y="${(y - 8 - lines.length * 6).toFixed(1)}" width="92" height="${16 + lines.length * 12}" rx="9" class="pw-box ${blank.blankN === i ? 'blank' : ''}"/>` +
        lines.map((l, j) => `<text x="${x.toFixed(1)}" y="${(y + 4 - (lines.length - 1) * 6 + j * 12).toFixed(1)}" class="pw-t">${esc(l)}</text>`).join('');
    }
    const steps = p.edges.map((e, i) => `<li class="${e.key ? 'key' : ''}">${blank.blankE === i ? '<span class="blank">?</span>' : `<b>${esc(e.e)}</b>`}${e.co ? ` <span class="muted">· ${esc(e.co)}</span>` : ''}${e.note ? ` <span class="muted">· ${esc(e.note)}</span>` : ''}</li>`).join('');
    return `<svg viewBox="0 0 400 400" class="pw-svg">${s}</svg><ol class="pw-steps">${steps}</ol>`;
  }
  let h = '<div class="pw">';
  nodes.forEach((n, i) => {
    h += `<div class="pn ${!ov && blank.blankN === i ? 'blank' : ''}">${nodeLab(n, i)}</div>`;
    const last = i === nodes.length - 1;
    if (!last || (p.layout === 'cycle' && ov)) {
      if (ov) h += `<div class="pe ov"><span class="ar">↓</span><span class="small muted">mehrere Schritte</span></div>`;
      else { const e = p.edges[i]; if (e) h += `<div class="pe ${e.key ? 'key' : ''}"><span class="ar">↓</span><div>${blank.blankE === i ? '<span class="blank">?</span>' : `<b>${esc(e.e)}</b>`}${e.co || e.note ? `<small>${esc([e.co, e.note].filter(Boolean).join(' · '))}</small>` : ''}</div></div>`; }
    }
  });
  if (p.layout === 'cycle' && ov) h += `<div class="pn ghostn">↺ zurück zu ${esc(nodes[0])}</div>`;
  return h + '</div>';
}

/* ---------- views ---------- */
function viewHome() {
  const due = dueList().length, learned = ALL.filter(i => known(i.id)).length, sol = ALL.filter(i => solid(i.id)).length;
  const G = LS.get('echo-games', {}) || {}, td = (G.days || {})[today()] || {};
  const sysRows = Object.entries(SYS).map(([k, s]) => {
    const orgs = ORG_ORDER.filter(o => ORG[o].sys === k);
    return `<button class="sysrow" data-act="atlas-sys" data-v="${k}"><span class="sysname">${esc(s.name)}</span><span class="orgchips">${orgs.map(o => `<span class="ochip">${esc(oshort(o))}${dots(stageOpen(o))}</span>`).join('')}</span></button>`;
  }).join('');
  return `${topbar()}
  <div style="display:grid;gap:4px"><h1>Medizin-Atlas</h1><p class="muted" style="margin:0">Vom Organsystem bis zur Zelle. Jede Karte kommt wieder, kurz bevor du sie vergisst.</p></div>
  <section class="card">
    <div class="hero"><div class="mapbox hero-map" id="heroMap">${MEDSVG.body('all', M.sex)}</div>
      <div class="hero-stats"><div class="stat"><span class="small muted">Fällig</span><b>${due}</b></div><div class="stat"><span class="small muted">Gelernt</span><b>${learned}<small class="muted"> / ${ALL.length}</small></b></div><div class="stat"><span class="small muted">Sicher</span><b>${sol}</b></div><span class="small muted">Je kräftiger ein Organ, desto weiter bist du. Antippen zum Reinzoomen.</span></div></div>
    <button class="btn primary big" data-act="round">${due ? `Lernrunde · ${due} fällig` : 'Lernrunde starten'}</button>
    ${td.med ? '<span class="small muted" style="text-align:center">✓ Heute schon eine Runde geschafft</span>' : ''}
  </section>
  <div class="modes">
    <button class="mode" data-act="atlas"><span>🗺️</span><b>Atlas</b><small>Körper antippen, reinzoomen</small></button>
    ${EXT.views.psy ? '<button class="mode" data-act="psy-open"><span>🧠</span><b>Gehirn & Psyche</b><small>Regionen, Botenstoffe, Störungen, Psilocybin</small></button>' : ''}
    <button class="mode" data-act="det"><span>🔍</span><b>Fall-Detektiv</b><small>Hinweise → Diagnose</small></button>
    <button class="mode" data-act="paths"><span>🧪</span><b>Stoffwechselwege</b><small>${PATH.length} Wege als Diagramm</small></button>
    <button class="mode" data-act="index"><span>📋</span><b>Krankheiten</b><small>${DIS.length} nach Organ & Stufe</small></button>
    <button class="mode" data-act="soc-pick"><span>🦉</span><b>Sokrates</b><small>Ein Thema durchdenken</small></button>
    <a class="mode" href="./?xw=med"><span>🧩</span><b>Kreuzworträtsel</b><small>Kategorie Medizin</small></a>
  </div>
  <section class="card"><div class="row spread"><h3>Fortschritt nach System</h3><span class="small muted">Stufen 1–4</span></div>${sysRows}</section>
  <section class="card"><div class="row spread"><div style="display:grid"><b>Alle Stufen freischalten</b><span class="small muted">Sonst öffnet sich die nächste Stufe eines Organs, wenn du 70 % der aktuellen kannst.</span></div><button class="chip" aria-pressed="${M.all}" data-act="all">${M.all ? 'An' : 'Aus'}</button></div></section>`;
}
function viewAtlas() {
  const chips = [['all', 'Alle'], ...(EXT.views.psy ? [['psyche', '🧠 Gehirn & Psyche']] : []), ...Object.entries(SYS).map(([k, s]) => [k, short(s.name)])].map(([k, l]) => `<button class="chip" aria-pressed="${V.sys === k}" data-act="atlas-sys" data-v="${k}">${esc(l)}</button>`).join('');
  const hint = V.sys === 'all' ? 'Tippe ein Organ an, um hineinzuzoomen. Oben filterst du nach System.' : V.sys === 'psyche' ? 'Tippe das leuchtende Gehirn an: Regionen, Botenstoffe, Netzwerke, Störungen und Medikamente.' : esc(SYS[V.sys].fn);
  return `${topbar('home')}<h2>Atlas</h2><div class="chips scrollx">${chips}</div>
  <p class="small muted" style="margin:0">${hint}</p>
  ${['fortpflanzung', 'all'].includes(V.sys) ? `<div class="chips"><button class="chip" aria-pressed="${M.sex === 'w'}" data-act="sex" data-v="w">♀ weiblich</button><button class="chip" aria-pressed="${M.sex === 'm'}" data-act="sex" data-v="m">♂ männlich</button></div>` : ''}
  <div class="mapbox body-box" id="atlasMap">${MEDSVG.body(V.sys, M.sex)}</div>
  ${V.sys !== 'all' && SYS[V.sys] ? `<div class="olist">${ORG_ORDER.filter(o => ORG[o].sys === V.sys).map(o => `<button class="orow" data-act="organ" data-v="${o}"><span>${esc(ORG[o].name)}</span>${dots(stageOpen(o))}</button>`).join('')}</div>` : ''}`;
}
function viewOrgan() {
  const k = V.organ, o = ORG[k], S = organStats(k), maps = MEDSVG.MAPS[k] || [];
  const tabs = [['info', 'Überblick'], ['map', maps.length ? 'Karte' : 'Strukturen'], ['dis', 'Krankheiten'], ['learn', 'Lernen']];
  let body = '';
  if (V.tab === 'info') {
    body = `<div class="mapbox mini">${MEDSVG.body(o.sys, k === 'maennlich' ? 'm' : k === 'weiblich' ? 'w' : M.sex)}</div>
      <div class="dcard"><div class="frow"><span class="flab">Lage</span><span>${esc(o.lage)}</span></div><div class="frow"><span class="flab">Funktion</span><span>${esc(o.fn)}</span></div>${o.blut ? `<div class="frow"><span class="flab">Blutversorgung</span><span>${esc(o.blut)}</span></div>` : ''}
      ${(o.facts || []).length ? `<div class="frow"><span class="flab">Kernfakten</span><span>${o.facts.map(f => '• ' + esc(f)).join('<br>')}</span></div>` : ''}</div>
      <button class="chip" data-act="soc" data-v="org|${k}" style="justify-self:start">🦉 Sokratisch durchdenken</button>`;
  } else if (V.tab === 'map') {
    const strs = STR[k] || [];
    if (maps.length) {
      const [mk, title, lvl] = maps[Math.min(V.map, maps.length - 1)], locked = lvl > S.stage;
      const sel = V.sel ? strs.find(x => x.id === V.sel) : null;
      body = `<div class="chips">${maps.map(([, t, l], i) => `<button class="chip" aria-pressed="${i === V.map}" data-act="omap" data-v="${i}">${l > S.stage ? '🔒 ' : ''}${esc(t)} · ${l}</button>`).join('')}</div>
        ${locked ? `<p class="small muted" style="margin:0">Stufe ${lvl} ist noch zu. Ansehen geht trotzdem, abgefragt wird sie erst später.</p>` : ''}
        <div class="mapbox zoomin" id="detailMap" data-key="${mk}">${MEDSVG.detail(mk)}<div class="mapctl"><button data-act="zoom" data-v="1">＋</button><button data-act="zoom" data-v="-1">－</button><button data-act="zoom" data-v="0">⟲</button><button data-act="labels" aria-pressed="${V.labels}">Aa</button></div></div>
        ${sel ? `<div class="dcard sel"><h3>${esc(sel.name)}</h3><span>${esc(sel.fact)}</span></div>` : '<p class="small muted" style="margin:0">Tippe eine Struktur an.</p>'}
        <div class="chips">${strs.filter(x => MEDSVG.mapFor(k, x.id) === mk).map(x => `<button class="chip" aria-pressed="${V.sel === x.id}" data-act="sel" data-v="${x.id}">${solid('t.' + k + '.' + x.id) ? '✓ ' : ''}${esc(short(x.name))}</button>`).join('')}</div>`;
    }
    const rest = strs.filter(x => !maps.length || !MEDSVG.mapFor(k, x.id));
    if (rest.length) body += [3, 4].map(l => { const xs = rest.filter(x => x.l === l); return xs.length ? `<h3>Stufe ${l}: ${STAGE[l]}${l > S.stage ? ' 🔒' : ''}</h3>${xs.map(x => `<div class="dcard"><b>${esc(x.name)}</b><span>${esc(x.fact)}</span></div>`).join('')}` : ''; }).join('');
  } else if (V.tab === 'dis') {
    const ds = DIS_BY[k] || [];
    body = [1, 2, 3, 4].map(t => {
      const xs = ds.filter(d => d.tier === t); if (!xs.length) return '';
      const locked = t > S.stage && !V.open['tier' + k + t];
      return `<div class="tierhead"><span class="tier t${t}">${t}</span><b>${TIER[t]}</b><span class="small muted">${xs.length}</span></div>` +
        (locked ? `<button class="frow locked" data-act="tier" data-v="${k}|${t}"><span class="small muted">🔒 ab Stufe ${t}: ${xs.map(d => esc(d.name)).join(', ')}. Antippen zum Ansehen.</span></button>`
          : xs.map(d => `<details class="dis"${V.dis === d.id ? ' open' : ''}><summary><span>${esc(d.name)}</span>${solid('d.' + d.id) ? '<span class="ok">✓</span>' : known('d.' + d.id) ? '<span class="muted">·</span>' : ''}</summary>${disCard(d)}</details>`).join(''));
    }).join('') || '<p class="muted">Noch keine Krankheiten hinterlegt.</p>';
  } else {
    body = `${[1, 2, 3, 4].map(l => { const s = stageStats(k, l); if (!s.n) return ''; return `<div class="stg ${l <= S.stage ? '' : 'lock'}"><div class="row spread"><b>Stufe ${l}: ${STAGE[l]}</b><span class="small muted">${l <= S.stage ? s.known + '/' + s.n : '🔒'}</span></div><div class="bar"><i style="width:${pct(s.known, s.n)}%"></i></div></div>`; }).join('')}
      <p class="small muted" style="margin:0">Die nächste Stufe öffnet sich bei 70 % der aktuellen. Krankheiten der Stufe 1 sind Volkskrankheiten, Stufe 4 Raritäten.</p>
      <button class="btn primary big" data-act="round-organ" data-v="${k}">Lernrunde: ${esc(short(o.name))}</button>`;
  }
  return `${topbar('atlas')}<div class="row spread" style="align-items:flex-end"><div style="display:grid;gap:2px"><span class="eyebrow">${esc(SYS[o.sys].name)}</span><h2>${esc(o.name)}</h2></div><div style="text-align:right;display:grid;gap:4px;justify-items:end">${dots(S.stage)}<span class="small muted">Stufe ${S.stage} · ${S.known}/${S.n}</span></div></div>
    <div class="seg">${tabs.map(([t, l]) => `<button data-act="otab" data-v="${t}" aria-pressed="${V.tab === t}">${l}</button>`).join('')}</div>${body}`;
}
function viewRound() {
  if (R.done) {
    const wrong = R.seq.filter(x => x.ok === false && !x.again);
    return `${topbar('home')}<section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">Lernrunde geschafft</span><div class="sum">${R.ok}/${R.seq.length}</div><p class="muted" style="margin:0">+${R.xp} XP</p></section>
      ${wrong.length ? `<section class="card"><h3>Das kommt bald wieder</h3>${wrong.map(x => `<span class="small">• ${esc(EXT.title[x.it.kind] ? EXT.title[x.it.kind](x.it) : x.it.kind === 'dis' ? x.it.ref.name : x.it.kind === 'str' ? x.it.ref.name : x.it.kind === 'org' ? ORG[x.it.ref].name : x.it.kind === 'sys' ? SYS[x.it.ref].name : x.it.kind === 'fact' ? ORG[x.it.organ].name + ': ' + x.it.ref.text : x.it.ref.name)}</span>`).join('')}</section>` : ''}
      <button class="btn primary big" data-act="${R.scope.organ ? 'round-organ' : 'round'}" data-v="${R.scope.organ || ''}">Nächste Runde</button><button class="btn" data-act="home">Übersicht</button>`;
  }
  const cur = R.seq[R.i], q = cur.q, answered = R.ans != null;
  const prog = `<div class="progress">${R.seq.map((x, i) => `<i class="${i < R.i ? (x.ok ? 'ok' : 'bad') : i === R.i ? 'cur' : ''}"></i>`).join('')}</div>`;
  let stage = '';
  if (q.map) {
    const svg = q.map.kind === 'body' ? MEDSVG.body(q.map.view, q.map.sex) : MEDSVG.detail(q.map.key);
    stage = `<div class="mapbox ${q.map.kind === 'body' ? 'body-box' : ''} ${q.type === 'tap' && !answered ? 'asking' : ''}" id="qMap">${svg}</div>`;
  }
  if (q.path) stage = `<div class="pathbox">${pathDiagram(q.path.p, 'd', q.path)}</div>`;
  const opts = q.type === 'mc' ? `<div class="opts ${q.long ? 'long' : ''}">${q.opts.map((o, i) => { const cls = !answered ? '' : o.ok ? 'ok' : i === R.ans ? 'bad' : ''; return `<button class="opt ${cls}" data-act="ans" data-v="${i}" ${answered ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(o.label)}</span></button>`; }).join('')}</div>` : '';
  const ok = answered && cur.ok;
  return `${topbar('home')}${prog}<span class="eyebrow">${esc(q.eyebrow || '')}${cur.again ? ' · nochmal' : ''}</span><div class="q">${esc(q.prompt)}</div>
    ${q.sub ? `<div class="qsub">${esc(q.sub)}</div>` : ''}${stage}${opts}
    ${answered ? `<div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? '✓ Richtig' : '✗ Nicht ganz'}</b><span class="small">+${ok ? 5 : 1} XP${ok ? ' · kommt in ' + IV[st(cur.it.id).b] + ' Tag' + (IV[st(cur.it.id).b] === 1 ? '' : 'en') + ' wieder' : ' · kommt am Ende der Runde nochmal'}</span></div>${itemInfo(cur.it)}<button class="btn primary big" data-act="next" id="qnext">Weiter</button>` : ''}`;
}
function viewDet() {
  if (DT.over) return `${topbar('home')}<section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">Fall-Detektiv</span><div class="sum">${DT.pts} Punkte</div><p class="muted" style="margin:0">+${DT.pts * 2} XP · Bestwert ${M.det.best || 0}</p></section>
    <section class="card">${DT.cases.map(c => `<div class="row spread"><span>${c.solved ? '✓' : '✗'} ${esc(c.d.name)}</span><span class="small muted">${c.pts} P.</span></div>`).join('')}</section>
    <button class="btn primary big" data-act="det">Neue Fälle</button><button class="btn" data-act="home">Übersicht</button>`;
  const c = DT.cases[DT.i], clues = detClues(c.d);
  return `${topbar('home')}<div class="row spread"><span class="eyebrow">Fall ${DT.i + 1} von ${DT.cases.length}</span><span class="xp">${DT.pts} Punkte</span></div>
    <h2>Welche Diagnose?</h2>
    <div class="clues">${clues.slice(0, c.k).map((x, i) => `<div class="clue"><b>${i + 1}</b><span>${esc(x)}</span></div>`).join('')}${c.k < clues.length && !c.done ? `<div class="clue more">noch ${clues.length - c.k} Hinweis${clues.length - c.k > 1 ? 'e' : ''}</div>` : ''}</div>
    <div class="opts">${c.opts.map(d => { const cls = c.done && d.id === c.d.id ? 'ok' : c.wrong.has(d.id) ? 'bad' : ''; return `<button class="opt ${cls}" data-act="det-pick" data-v="${d.id}" ${c.done || c.wrong.has(d.id) ? 'disabled' : ''}>${esc(d.name)}</button>`; }).join('')}</div>
    ${!c.done && c.k < clues.length ? `<button class="btn" data-act="det-more">Nächster Hinweis (−1 Punkt)</button>` : ''}
    ${c.done ? `<div class="fb ${c.solved ? 'ok' : 'bad'}"><b>${c.solved ? '✓ Gelöst · +' + c.pts + ' Punkte' : '✗ Es war ' + esc(c.d.name)}</b></div>${disCard(c.d, { organLink: true })}<button class="btn primary big" data-act="det-next" id="qnext">${DT.i + 1 < DT.cases.length ? 'Nächster Fall' : 'Auswertung'}</button>` : ''}`;
}
function viewPaths() {
  return `${topbar('home')}<h2>Stoffwechselwege</h2><p class="small muted" style="margin:0">Erst der Überblick (Ort, Zweck, Bilanz), dann alle Zwischenschritte und Enzyme.</p>
  <div class="olist">${PATH.map(p => { const o = known('p.' + p.id + '.o'), d = known('p.' + p.id + '.d'); return `<button class="orow" data-act="path" data-v="${p.id}"><span style="display:grid;text-align:left"><b>${esc(p.name)}</b><small class="muted">${esc(p.ort)}</small></span>${dots((o ? 1 : 0) + (d ? 1 : 0), 2)}</button>`; }).join('')}</div>
  <button class="btn primary big" data-act="round-path">Lernrunde: Stoffwechsel</button>`;
}
function viewPath() {
  const p = PATH_ID[V.path], open = pathOpen(p), mode = V.pathMode;
  const f = (k, l) => p[k] ? `<div class="frow ${k === 'nut' ? 'nut' : ''}"><span class="flab">${l}</span><span>${esc(p[k])}</span></div>` : '';
  return `${topbar('paths')}<div style="display:grid;gap:2px"><span class="eyebrow">${(p.organs || []).map(o => ORG[o] ? short(ORG[o].name) : o).join(' · ')}</span><h2>${esc(p.name)}</h2></div>
    <div class="seg"><button data-act="pmode" data-v="o" aria-pressed="${mode === 'o'}">Überblick</button><button data-act="pmode" data-v="d" aria-pressed="${mode === 'd'}">${open ? '' : '🔒 '}Alle Schritte</button></div>
    ${mode === 'd' && !open ? '<p class="small muted" style="margin:0">Die Details werden abgefragt, sobald du den Überblick einmal richtig hattest. Ansehen geht schon.</p>' : ''}
    <div class="pathbox">${pathDiagram(p, mode)}</div>
    <div class="dcard">${f('ort', 'Ort')}${f('zweck', 'Zweck')}${f('bilanz', 'Bilanz')}${f('schritt', 'Schrittmacher')}${mode === 'd' ? f('reg', 'Regulation') : ''}${f('nut', '🥗 Ernährungsmedizin')}
      ${(p.dis || []).length ? `<div class="frow"><span class="flab">Krankheiten</span><span>${p.dis.map(x => '• ' + esc(x)).join('<br>')}</span></div>` : ''}
      ${mode === 'd' && (p.facts || []).length ? `<div class="frow"><span class="flab">Prüfungsfakten</span><span>${p.facts.map(x => '• ' + esc(x)).join('<br>')}</span></div>` : ''}</div>
    <div class="row" style="gap:8px"><button class="btn primary grow" data-act="drill" data-v="${p.id}">Lücken-Training</button><button class="btn grow" data-act="round-1path" data-v="${p.id}">Abfragen</button></div>
    <button class="chip" data-act="soc" data-v="path|${p.id}" style="justify-self:start">🦉 Sokratisch durchdenken</button>`;
}
function viewDrill() {
  if (PD.over) return `${topbar('path')}<section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">${esc(PD.p.name)}</span><div class="sum">${PD.ok}/${PD.qs.length}</div><p class="muted" style="margin:0">+${PD.ok * 3} XP</p></section>
    <button class="btn primary big" data-act="drill" data-v="${PD.p.id}">Nochmal</button><button class="btn" data-act="path" data-v="${PD.p.id}">Zum Weg</button>`;
  const q = PD.qs[PD.i], answered = PD.ans != null;
  return `${topbar('path')}<div class="progress">${PD.qs.map((x, i) => `<i class="${i < PD.i ? 'ok' : i === PD.i ? 'cur' : ''}"></i>`).join('')}</div><span class="eyebrow">${esc(PD.p.name)}</span><div class="q">${esc(q.prompt)}</div>
    <div class="pathbox">${pathDiagram(PD.p, 'd', answered ? {} : q.path)}</div>
    <div class="opts long">${q.opts.map((o, i) => { const cls = !answered ? '' : o.ok ? 'ok' : i === PD.ans ? 'bad' : ''; return `<button class="opt ${cls}" data-act="dans" data-v="${i}" ${answered ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(o.label)}</span></button>`; }).join('')}</div>
    ${answered ? `<button class="btn primary big" data-act="dnext" id="qnext">Weiter</button>` : ''}`;
}
function viewIndex() {
  const q = V.q.trim().toLowerCase();
  const hit = d => !q || (d.name + ' ' + d.def + ' ' + d.leit).toLowerCase().includes(q);
  const groups = ORG_ORDER.map(o => [o, (DIS_BY[o] || []).filter(hit)]).filter(([, xs]) => xs.length);
  return `${topbar('home')}<h2>Krankheiten</h2><div class="ac"><input id="disq" type="search" placeholder="Suchen: Name oder Symptom" value="${esc(V.q)}" autocomplete="off"></div>
    <p class="small muted" style="margin:0">${DIS.length} Krankheiten. Die Zahl im Kreis ist die Stufe: 1 Volkskrankheit, 2 häufig, 3 prüfungsrelevant, 4 selten.</p>
    ${groups.map(([o, xs]) => `<section class="card"><button class="row spread linkrow" data-act="organ-dis" data-v="${o}"><h3>${esc(short(ORG[o].name))}</h3><span class="small muted">${xs.length} →</span></button><div class="dlist">${xs.map(d => `<button class="dchip" data-act="dis" data-v="${d.id}"><span class="tier t${d.tier}">${d.tier}</span>${esc(d.name)}</button>`).join('')}</div></section>`).join('') || '<p class="muted">Nichts gefunden.</p>'}`;
}
function viewDis() {
  const d = DIS_ID[V.dis]; if (!d) { V.view = 'index'; return viewIndex(); }
  return `${topbar('index')}${disCard(d, { organLink: true })}`;
}
function viewSocPick() {
  const recent = ALL.filter(i => i.kind === 'dis' && seen(i.id)).sort((a, b) => (M.c[a.id].b - M.c[b.id].b) || (M.c[b.id].t || 0) - (M.c[a.id].t || 0)).slice(0, 8);
  const base = recent.length ? recent.map(i => i.ref) : DIS.filter(d => d.tier === 1).slice(0, 8);
  return `${topbar('home')}<h2>Sokrates: Medizin</h2><p class="muted" style="margin:0">Claude stellt dir Fragen, bis du die Pathophysiologie selbst erklären kannst. Wähle ein Thema, am besten eins, das du noch nicht sicher kannst.</p>
    <section class="card"><h3>Krankheiten</h3><div class="dlist">${base.map(d => `<button class="dchip" data-act="soc" data-v="dis|${d.id}"><span class="tier t${d.tier}">${d.tier}</span>${esc(d.name)}</button>`).join('')}</div></section>
    <section class="card"><h3>Organe</h3><div class="dlist">${TOP.filter(o => ORG[o]).map(o => `<button class="dchip" data-act="soc" data-v="org|${o}">${esc(short(ORG[o].name))}</button>`).join('')}</div></section>
    <section class="card"><h3>Stoffwechselwege</h3><div class="dlist">${PATH.map(p => `<button class="dchip" data-act="soc" data-v="path|${p.id}">${esc(p.name)}</button>`).join('')}</div></section>`;
}

/* ---------- map behaviour: tap, labels, zoom ---------- */
function decorateMaps() {
  // fat invisible hit lines for thin parts
  app.querySelectorAll('.map .part').forEach(g => { if (g.querySelector('.hit')) return; g.querySelectorAll('path').forEach(p => { const cs = getComputedStyle(p); if (cs.fill === 'none' && !p.classList.contains('hit')) { const h = p.cloneNode(); h.setAttribute('class', 'hit'); h.removeAttribute('style'); g.appendChild(h); } }); });
  const dm = document.getElementById('detailMap');
  if (dm) {
    const svg = dm.querySelector('svg'); svg.classList.add('explore');
    if (V.sel) svg.querySelectorAll(`[data-s="${V.sel}"]`).forEach(e => e.classList.add('on'));
    if (V.labels) { svg.classList.add('labeled'); labelMap(svg); }
    applyZoom(svg);
  }
  const am = document.getElementById('atlasMap'); if (am) am.querySelector('svg').classList.add('explore');
  const hm = document.getElementById('heroMap');
  if (hm) { const svg = hm.querySelector('svg'); svg.classList.add('explore'); svg.querySelectorAll('[data-o]').forEach(g => { const o = g.dataset.o, S = organStats(o); g.style.opacity = (.28 + .18 * (S.stage - 1) + .18 * (S.n ? S.known / S.n : 0)).toFixed(2); }); }
  const qm = document.getElementById('qMap');
  if (qm && R && !R.done) {
    const q = R.seq[R.i].q, svg = qm.querySelector('svg');
    if (q.type === 'tap' && R.ans == null) svg.classList.add('ask');
    if (q.map.mark) { svg.querySelectorAll(`[data-s="${q.map.mark}"]`).forEach(e => e.classList.add(R.ans == null ? 'pulse' : 'on')); svg.querySelectorAll('.part').forEach(e => { if (e.dataset.s !== q.map.mark) e.classList.add('dim'); }); }
    if (q.type === 'tap' && R.ans != null) {
      const attr = q.map.kind === 'body' ? 'o' : 's';
      for (const t of q.map.targets || [q.map.target]) svg.querySelectorAll(`[data-${attr}="${t}"]`).forEach(e => e.classList.add('ok'));
      if (R.ans !== q.map.target) svg.querySelectorAll(`[data-${attr}="${R.ans}"]`).forEach(e => e.classList.add('bad'));
      if (q.map.kind === 'detail' && R.seq[R.i].ok === false) labelMap(svg, [q.map.target, R.ans]);
    }
  }
  for (const fn of EXT.decorate) fn();
  const sm = document.querySelector('.mapbox.mini svg');
  if (sm && V.organ) sm.querySelectorAll(`[data-o="${V.organ}"]`).forEach(e => e.classList.add('on'));
}
const LBLS = svg => parseFloat(svg.style.getPropertyValue('--ls')) || 1; // label scale of image maps (viewBox width / 400)
function labelMap(svg, only) {
  if (!only && EXT.labelOnly) only = EXT.labelOnly(svg);
  const strs = Object.assign({}, EXT.names, Object.fromEntries((STR[V.organ || (R && R.seq[R.i] ? R.seq[R.i].it.organ : '')] || []).map(s => [s.id, s])));
  const done = new Set(), labs = [];
  svg.querySelectorAll('[data-s]').forEach(g => {
    const id = g.dataset.s; if (done.has(id) || (only && !only.includes(id)) || !strs[id]) return; done.add(id);
    let bb; try { bb = g.getBBox(); } catch { return; }
    if (!bb.width && !bb.height) return;
    // label at the box centre if that lies on the shape, else on the first outline (rings, lines, scattered cells)
    let x = bb.x + bb.width / 2, y = bb.y + bb.height / 2;
    const shape = [...g.children].find(c => c.tagName !== 'text' && !c.classList.contains('hit'));
    try {
      const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
      const inside = [...g.children].some(c => c.isPointInFill && getComputedStyle(c).fill !== 'none' && c.isPointInFill(pt));
      if (!inside && shape && shape.getTotalLength) { const L = shape.getTotalLength(), q = shape.getPointAtLength(getComputedStyle(shape).fill === 'none' ? L * .5 : L * .3); x = q.x; y = q.y; }
    } catch { /* keep the centre */ }
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', (y + 4).toFixed(1));
    t.setAttribute('class', 'lbl'); t.setAttribute('text-anchor', 'middle'); t.textContent = short(strs[id].name).replace(/^(Rechter|Linker|Rechte|Linke) /, (m) => m[0] + '. ');
    svg.appendChild(t);
    // keep the label inside the picture horizontally (names near the edge would be cut off)
    try { const b = t.getBBox(), [vx, , vw] = (svg.dataset.vb0 || svg.getAttribute('viewBox')).split(' ').map(Number), m = 2 * LBLS(svg); const dx = b.x < vx + m ? vx + m - b.x : b.x + b.width > vx + vw - m ? vx + vw - m - b.x - b.width : 0; if (dx) t.setAttribute('x', (x + dx).toFixed(1)); } catch { }
    labs.push({ t, x, y: y + 4 });
  });
  // push overlapping labels apart, then draw a short leader line to the ones that moved
  const vb = svg.viewBox.baseVal, H = vb.y + vb.height, ls = LBLS(svg);
  const ov = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  for (let pass = 0; pass < 8; pass++) {
    let moved = false; const bx = labs.map(l => l.t.getBBox());
    for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
      if (!ov(bx[i], bx[j])) continue;
      const [lo, hi] = bx[i].y >= bx[j].y ? [i, j] : [j, i], down = bx[hi].y + bx[hi].height - bx[lo].y + 1;
      const cur = +labs[lo].t.getAttribute('y'), ny = cur + down <= H - 2 ? cur + down : cur - (bx[lo].y + bx[lo].height - bx[hi].y + 1) - bx[hi].height;
      labs[lo].t.setAttribute('y', ny.toFixed(1)); bx[lo] = labs[lo].t.getBBox(); moved = true;
    }
    if (!moved) break;
  }
  for (const l of labs) { const ny = +l.t.getAttribute('y'); if (Math.abs(ny - l.y) > 7 * ls) { const ln = document.createElementNS('http://www.w3.org/2000/svg', 'path'); ln.setAttribute('d', `M${l.x.toFixed(1)} ${(l.y - 4).toFixed(1)}L${l.x.toFixed(1)} ${(ny + (ny > l.y ? -10 * ls : 2 * ls)).toFixed(1)}`); ln.setAttribute('class', 'lead'); svg.insertBefore(ln, l.t); svg.appendChild(l.t); } }
}
const ZM = { k: 1, x: 0, y: 0 };
function applyZoom(svg) {
  const vb0 = svg.dataset.vb0 || svg.getAttribute('viewBox'); svg.dataset.vb0 = vb0;
  const [x, y, w, h] = vb0.split(' ').map(Number), W = w / ZM.k, H = h / ZM.k;
  ZM.x = Math.max(x, Math.min(x + w - W, ZM.x)); ZM.y = Math.max(y, Math.min(y + h - H, ZM.y));
  svg.setAttribute('viewBox', `${ZM.k === 1 ? x : ZM.x} ${ZM.k === 1 ? y : ZM.y} ${W} ${H}`);
}
function zoomBy(dir) {
  const svg = document.querySelector('#detailMap svg'); if (!svg) return;
  const [x, y, w, h] = (svg.dataset.vb0 || svg.getAttribute('viewBox')).split(' ').map(Number);
  const cx = ZM.k === 1 ? x + w / 2 : ZM.x + w / ZM.k / 2, cy = ZM.k === 1 ? y + h / 2 : ZM.y + h / ZM.k / 2;
  ZM.k = dir === 0 ? 1 : Math.max(1, Math.min(4, ZM.k * (dir > 0 ? 1.6 : 1 / 1.6)));
  ZM.x = cx - w / ZM.k / 2; ZM.y = cy - h / ZM.k / 2; applyZoom(svg);
}
let drag = null;
app.addEventListener('pointerdown', e => { const svg = e.target.closest('#detailMap svg'); if (!svg || ZM.k === 1) return; drag = { x: e.clientX, y: e.clientY, zx: ZM.x, zy: ZM.y, svg, moved: false }; });
app.addEventListener('pointermove', e => {
  if (!drag) return; const r = drag.svg.getBoundingClientRect(), [, , w] = drag.svg.dataset.vb0.split(' ').map(Number), s = (w / ZM.k) / r.width;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
  ZM.x = drag.zx - dx * s; ZM.y = drag.zy - dy * s; applyZoom(drag.svg);
});
app.addEventListener('pointerup', () => { if (drag && drag.moved) { drag.svg.dataset.dragged = '1'; setTimeout(() => { if (drag) drag.svg.dataset.dragged = ''; drag = null; }, 0); } else drag = null; });

// zoom from the body map into an organ: animate the viewBox to the organ's box, then open it
function zoomInto(organ, svg, done) {
  const parts = [...svg.querySelectorAll(`[data-o="${organ}"]`)]; if (!parts.length) { (done || (() => openOrgan(organ)))(); return; }
  let bb = null; for (const p of parts) { const b = p.getBBox(); bb = bb ? { x: Math.min(bb.x, b.x), y: Math.min(bb.y, b.y), r: Math.max(bb.r, b.x + b.width), b: Math.max(bb.b, b.y + b.height) } : { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height }; }
  const pad = 14, tx = bb.x - pad, ty = bb.y - pad, tw = Math.max(40, bb.r - bb.x + pad * 2), th = Math.max(40, bb.b - bb.y + pad * 2);
  const ratio = 400 / 800, W = Math.max(tw, th * ratio), H = W / ratio, X = tx + tw / 2 - W / 2, Y = ty + th / 2 - H / 2;
  const [x0, y0, w0, h0] = svg.getAttribute('viewBox').split(' ').map(Number), t0 = performance.now(), dur = 520;
  parts.forEach(p => p.classList.add('on'));
  const step = now => { const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; svg.setAttribute('viewBox', `${x0 + (X - x0) * e} ${y0 + (Y - y0) * e} ${w0 + (W - w0) * e} ${h0 + (H - h0) * e}`); if (t < 1) requestAnimationFrame(step); else (done || (() => openOrgan(organ)))(); };
  requestAnimationFrame(step);
}
function openOrgan(o, tab) { V.organ = o; V.tab = tab || (MEDSVG.MAPS[o] ? 'map' : 'info'); V.map = 0; V.sel = null; ZM.k = 1; go('organ'); }

/* ---------- router ---------- */
function go(v) { V.view = v; try { history.replaceState(null, '', '#' + v + (v === 'organ' ? '-' + V.organ : v === 'path' ? '-' + V.path : '')); } catch { /* ignore */ } render(); scrollTo(0, 0); }
function render() {
  const v = V.view;
  app.innerHTML = EXT.views[v] ? EXT.views[v]() : v === 'atlas' ? viewAtlas() : v === 'organ' && ORG[V.organ] ? viewOrgan() : v === 'round' && R ? viewRound() : v === 'det' && DT ? viewDet() : v === 'paths' ? viewPaths() : v === 'path' && PATH_ID[V.path] ? viewPath() : v === 'drill' && PD ? viewDrill() : v === 'index' ? viewIndex() : v === 'dis' ? viewDis() : v === 'soc-pick' ? viewSocPick() : viewHome();
  decorateMaps();
  document.getElementById('qnext')?.focus({ preventScroll: true });
}
app.addEventListener('click', e => {
  const mapPart = e.target.closest('.map .part');
  if (mapPart) {
    const svg = mapPart.closest('svg');
    if (svg.dataset.dragged) return;
    if (V.view === 'round' && R && R.ans == null && R.seq[R.i].q.type === 'tap' && mapPart.closest('#qMap')) return answerTap(mapPart.dataset.o || mapPart.dataset.s);
    if (mapPart.closest('#atlasMap') && V.sys === 'psyche' && EXT.views.psy) { V.view = 'psy'; return zoomInto('gehirn', svg, () => go('psy')); }
    if (mapPart.closest('#atlasMap, #heroMap') && mapPart.dataset.o) return zoomInto(mapPart.dataset.o, svg);
    if (EXT.tap && EXT.tap(mapPart, svg)) return;
    if (mapPart.closest('#detailMap') && mapPart.dataset.s) { V.sel = mapPart.dataset.s; const z = { ...ZM }; render(); Object.assign(ZM, z); return; }
  }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v;
  if (a === 'home') go('home');
  else if (a === 'atlas') go('atlas');
  else if (a === 'atlas-sys') { V.sys = v; go('atlas'); }
  else if (a === 'sex') { M.sex = v; saveM(); render(); }
  else if (a === 'organ') openOrgan(v);
  else if (a === 'organ-dis') openOrgan(v, 'dis');
  else if (a === 'otab') { V.tab = v; V.sel = null; ZM.k = 1; render(); }
  else if (a === 'omap') { V.map = +v; V.sel = null; ZM.k = 1; render(); }
  else if (a === 'sel') { V.sel = V.sel === v ? null : v; render(); }
  else if (a === 'labels') { V.labels = !V.labels; render(); }
  else if (a === 'zoom') zoomBy(+v);
  else if (a === 'tier') { const [o, t] = v.split('|'); V.open['tier' + o + t] = true; render(); }
  else if (a === 'reveal') { const [id, k] = v.split('|'); V.open[id] = Object.assign(V.open[id] || {}, { [k]: true }); render(); }
  else if (a === 'round') startRound({});
  else if (a === 'round-organ') startRound({ organ: v });
  else if (a === 'round-path') startRound({ path: true });
  else if (a === 'round-1path') startRound({ path: v });
  else if (a === 'ans') answerMC(+v);
  else if (a === 'next') nextCard();
  else if (a === 'det') detStart();
  else if (a === 'det-pick') detPick(v);
  else if (a === 'det-more') { const c = DT.cases[DT.i]; if (c.k < detClues(c.d).length) { c.k++; render(); } }
  else if (a === 'det-next') detNext();
  else if (a === 'paths') go('paths');
  else if (a === 'path') { if (v) V.path = v; V.pathMode = 'o'; go('path'); }
  else if (a === 'pmode') { V.pathMode = v; render(); }
  else if (a === 'drill') drillStart(v);
  else if (a === 'dans') drillAnswer(+v);
  else if (a === 'dnext') drillNext();
  else if (a === 'index') go('index');
  else if (a === 'dis') { V.dis = v; go('dis'); }
  else if (a === 'soc-pick') go('soc-pick');
  else if (a === 'soc') { const [k, id] = v.split('|'); socratic(k, id); }
  else if (a === 'all') { M.all = !M.all; saveM(); render(); }
  else if (EXT.acts[a]) EXT.acts[a](v, b, e);
});
app.addEventListener('input', e => { if (e.target.id === 'disq') { V.q = e.target.value; const pos = e.target.selectionStart; render(); const inp = document.getElementById('disq'); inp.focus(); try { inp.setSelectionRange(pos, pos); } catch { /* ignore */ } } });
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const n = parseInt(e.key, 10);
  if (V.view === 'round' && R && !R.done) { const q = R.seq[R.i].q; if (R.ans == null && q.type === 'mc' && n >= 1 && n <= q.opts.length) answerMC(n - 1); else if (R.ans != null && e.key === 'Enter') { e.preventDefault(); nextCard(); } }
  else if (V.view === 'drill' && PD && !PD.over) { if (PD.ans == null && n >= 1 && n <= 4) drillAnswer(n - 1); else if (PD.ans != null && e.key === 'Enter') { e.preventDefault(); drillNext(); } }
  else if (V.view === 'det' && DT && !DT.over) { const c = DT.cases[DT.i]; if (!c.done && n >= 1 && n <= c.opts.length && !c.wrong.has(c.opts[n - 1].id)) detPick(c.opts[n - 1].id); else if (c.done && e.key === 'Enter') { e.preventDefault(); detNext(); } }
});
function boot() {
  const h = (location.hash || '').slice(1);
  if (h.startsWith('organ-') && ORG[h.slice(6)]) { V.organ = h.slice(6); V.tab = MEDSVG.MAPS[V.organ] ? 'map' : 'info'; V.view = 'organ'; }
  else if (h.startsWith('path-') && PATH_ID[h.slice(5)]) { V.path = h.slice(5); V.view = 'path'; }
  else if (['atlas', 'paths', 'index', 'soc-pick'].includes(h) || EXT.views[h]) V.view = h;
  else if (EXT.views[h.split('-')[0]]) V.view = h.split('-')[0];
  else if (h === 'round') { R = buildRound({}); if (R) { R.seq[0].q = makeQ(R.seq[0].it); V.view = 'round'; } }
  else if (h === 'det') { detStart(); return; }
  else V.view = 'home';
  render();
}
window.addEventListener('hashchange', boot);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
// for Echo's Today tab and games card
window.medMeta = () => ({ due: dueList().length, known: ALL.filter(i => known(i.id)).length, n: ALL.length });
