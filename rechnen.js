'use strict';
/* Kopfrechnen for spiele.html: five modes (sprint, time trial, survival, chain, estimate), four difficulties that adapt
   within a round, task families incl. tax and everyday maths, trick lessons, a review queue for misses, a daily
   challenge, per-type stats and an on-screen keypad. Loaded before spiele.html's main script and uses its globals
   (G, save, gain, beep, esc, shuffle, today, toast, app, back, view, render) only at call time. */

const RC_CATS = { mix: 'Mix', add: 'Plus & Minus', mul: 'Mal', div: 'Geteilt', pct: 'Prozent', frac: 'Brüche & Dezimal', pow: 'Potenzen & Wurzeln', tax: 'Steuer & Alltag', est: 'Schätzen', chain: 'Ketten', trick: 'Tricks' };
const RC_PICK = ['mix', 'add', 'mul', 'div', 'pct', 'frac', 'pow', 'tax'];
const RC_SHORT = { mix: 'Mix', add: '+ −', mul: '×', div: '÷', pct: '%', frac: 'Brüche', pow: 'x²  √', tax: 'Steuer' };
const RC_DIFF = ['Leicht', 'Mittel', 'Schwer', 'Profi'], RC_MULT = [1, 1.5, 2, 3];
const RC_MODES = {
  sprint: ['Sprint', 'So viele Aufgaben wie möglich, bevor die Zeit abläuft.'],
  trial: ['Zeitfahren', '20 Aufgaben so schnell wie möglich. Überspringen kostet 5 Sekunden.'],
  survival: ['Überleben', '3 Leben. Jede Aufgabe hat ein Zeitlimit, das immer knapper wird.'],
  chain: ['Kettenrechnen', 'Startzahl merken, dann Schritt für Schritt im Kopf weiterrechnen. 5 Ketten.'],
  estimate: ['Schätzen', '12 Aufgaben, ungefähr reicht: Leicht ±10 %, Mittel ±5 %, Schwer ±3 %, Profi ±2 %.'],
};
const RC_DUR = [30, 60, 120, 300];
const MIX = [['add', 2], ['mul', 2], ['div', 1.5], ['pct', 1.5], ['frac', 1], ['pow', 1], ['tax', 2.5]];

let RNG = Math.random;
const ri = (a, b) => a + Math.floor(RNG() * (b - a + 1));
const pick = a => a[Math.floor(RNG() * a.length)];
const wpick = list => { let s = list.reduce((x, [, w]) => x + w, 0) * RNG(); for (const [k, w] of list) { s -= w; if (s <= 0) return k; } return list[0][0]; };
const rnd = (n, d = 6) => Math.round(n * 10 ** d) / 10 ** d;
const fmt = n => Number(n).toLocaleString('de-DE', { maximumFractionDigits: 4 });
const eur = n => Number(n).toLocaleString('de-DE', { minimumFractionDigits: Number.isInteger(+n) ? 0 : 2, maximumFractionDigits: 2 }) + ' €';
const sup = n => String(n).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ---------- task families; e = difficulty * 3 + in-round step (0..11) ---------- */
const GEN = {
  add(e) {
    const hi = [20, 50, 100, 150, 300, 600, 1000, 2500, 5000, 10000, 25000, 100000][e], lo = Math.max(3, Math.round(hi / 8));
    if (e >= 7 && RNG() < .35) { const a = ri(lo, hi), b = ri(lo, hi), c = ri(lo, Math.min(a + b, hi)); return { t: `${fmt(a)} + ${fmt(b)} − ${fmt(c)}`, a: a + b - c }; }
    let a = ri(lo, hi), b = ri(lo, hi);
    if (RNG() < .5) { if (b > a) [a, b] = [b, a]; return { t: `${fmt(a)} − ${fmt(b)}`, a: a - b }; }
    return { t: `${fmt(a)} + ${fmt(b)}`, a: a + b };
  },
  mul(e) {
    let a, b;
    if (e < 3) { a = ri(2, [6, 9, 10][e]); b = ri(2, [9, 10, 12][e]); }
    else if (e < 6) { a = ri(12, [25, 49, 99][e - 3]); b = ri(3, 9); }
    else if (e < 9) { a = ri(11, [19, 35, 60][e - 6]); b = ri(11, [15, 25, 39][e - 6]); }
    else { const k = RNG();
      if (k < .25) { a = ri(101, 999); b = ri(3, 9); }
      else if (k < .5) { a = ri(11, 49) / 10; b = ri(12, 80); return { t: `${fmt(a)} × ${b}`, a: rnd(a * b) }; }
      else { a = ri(21, [59, 79, 99][e - 9]); b = ri(13, [49, 79, 99][e - 9]); } }
    return { t: `${fmt(a)} × ${fmt(b)}`, a: a * b };
  },
  div(e) {
    let b, q;
    if (e < 3) { b = ri(2, [5, 9, 10][e]); q = ri(2, [9, 10, 12][e]); }
    else if (e < 6) { b = ri(3, 9); q = ri(11, [20, 35, 60][e - 3]); }
    else if (e < 9) { b = ri(11, [15, 19, 25][e - 6]); q = ri(4, [12, 20, 30][e - 6]); }
    else { b = ri(12, [30, 45, 75][e - 9]); q = ri(12, [40, 60, 99][e - 9]); }
    return { t: `${fmt(b * q)} ÷ ${b}`, a: q };
  },
  pct(e) {
    if (e < 3) { const p = pick([10, 50, 25, 20, 75].slice(0, 3 + e)), b = ri(2, 20) * 20; return { t: `${p} % von ${fmt(b)}`, a: b * p / 100 }; }
    if (e < 6) { const p = pick([5, 15, 20, 30, 40, 75, 12.5]), b = ri(2, 30) * 40; return { t: `${fmt(p)} % von ${fmt(b)}`, a: rnd(b * p / 100) }; }
    if (e < 9) { const p = pick([19, 7, 3, 2, 35, 45, 65, 120, 8]), b = ri(3, 99) * 100; return { t: `${p} % von ${fmt(b)}`, a: b * p / 100 }; }
    if (RNG() < .5) { const p = pick([5, 15, 20, 25, 40, 12.5, 2.5]), base = ri(4, 60) * 40, part = rnd(base * p / 100);
      return { t: `${fmt(part)} sind ${fmt(p)} % von …?`, a: base, x: `Grundwert = Anteil ÷ Prozentsatz: ${fmt(part)} ÷ ${fmt(p / 100)}` }; }
    const a = ri(4, 90) * 100, k = pick([-40, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30, 40, 50, 60]), b = a * (100 + k) / 100;
    return { t: `Von ${fmt(a)} auf ${fmt(b)}: Veränderung in %?`, a: k, x: `(${fmt(b)} − ${fmt(a)}) ÷ ${fmt(a)} × 100` };
  },
  frac(e) {
    if (e < 3) { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 3], [2, 3]].slice(0, 3 + e)), b = d * ri(2, 6 + 3 * e); return { t: `${n}/${d} von ${b}`, a: b * n / d }; }
    if (e < 6) {
      if (RNG() < .5) { const [n, d] = pick([[3, 8], [2, 5], [3, 5], [5, 6], [4, 5], [7, 8], [5, 8]]), b = d * ri(3, 15); return { t: `${n}/${d} von ${b}`, a: b * n / d }; }
      const f = pick([0.25, 0.5, 0.75, 0.2, 0.1, 1.5]), b = ri(5, 60); return { t: `${fmt(f)} × ${b}`, a: rnd(f * b) };
    }
    if (e < 9) {
      if (RNG() < .5) { const [n, d] = pick([[3, 8], [5, 8], [7, 8], [1, 16], [3, 16], [3, 20], [7, 25], [9, 40], [5, 4], [11, 8]]); return { t: `${n}/${d} als Dezimalzahl`, a: n / d }; }
      const x = ri(11, 35) / 10, y = pick([0.5, 1.2, 1.5, 2.5, 0.4, 0.8]); return { t: `${fmt(x)} × ${fmt(y)}`, a: rnd(x * y) };
    }
    if (RNG() < .5) { const [p, q] = pick([[[1, 4], [3, 8]], [[2, 5], [1, 4]], [[1, 8], [3, 4]], [[3, 5], [3, 20]], [[1, 2], [5, 8]], [[7, 8], [1, 16]]]);
      return { t: `${p[0]}/${p[1]} + ${q[0]}/${q[1]} (als Dezimalzahl)`, a: rnd(p[0] / p[1] + q[0] / q[1]) }; }
    const x = pick([0.125, 0.375, 1.25, 0.625, 2.25]), y = pick([8, 16, 24, 32, 1.6, 4.8]); return { t: `${fmt(x)} × ${fmt(y)}`, a: rnd(x * y) };
  },
  pow(e) {
    const k = RNG();
    if (e < 3) { const a = ri(2, [12, 15, 20][e]); return { t: `${a}²`, a: a * a }; }
    if (e < 6) {
      if (k < .4) { const a = ri(11, [25, 30, 35][e - 3]); return { t: `${a}²`, a: a * a }; }
      if (k < .75) { const a = ri(4, [15, 20, 25][e - 3]); return { t: `√${a * a}`, a }; }
      const n = ri(3, 10); return { t: `2${sup(n)}`, a: 2 ** n };
    }
    if (e < 9) {
      if (k < .35) { const a = ri(21, [40, 50, 60][e - 6]); return { t: `${a}²`, a: a * a }; }
      if (k < .6) { const a = ri(12, [30, 40, 50][e - 6]); return { t: `√${fmt(a * a)}`, a }; }
      if (k < .8) { const a = ri(2, 10); return { t: `${a}³`, a: a ** 3 }; }
      const n = ri(8, 16); return { t: `2${sup(n)}`, a: 2 ** n };
    }
    if (k < .3) { const a = RNG() < .5 ? ri(41, 99) : ri(95, 115); return { t: `${a}²`, a: a * a }; }
    if (k < .5) { const a = ri(31, 99); return { t: `√${fmt(a * a)}`, a }; }
    if (k < .7) { const a = ri(11, 15); return { t: `${a}³`, a: a ** 3 }; }
    const a = ri(11, 35) / 10; return { t: `${fmt(a)}²`, a: rnd(a * a) };
  },
  tax(e) {
    const T = (t, a, x) => ({ t, a: rnd(a, 2), x });
    const d = Math.floor(e / 3);
    const L = [
      () => { const n = ri(1, 20) * 100; return T(`Netto ${eur(n)} + 19 % USt: Brutto?`, n * 1.19, 'Brutto = Netto × 1,19'); },
      () => { const n = ri(1, 30) * 100; return T(`19 % Umsatzsteuer auf ${eur(n)} netto?`, n * 0.19, 'USt = Netto × 0,19'); },
      () => { const p = pick([10, 20, 25, 50]), b = ri(2, 40) * 20; return T(`${eur(b)} abzüglich ${p} % Rabatt?`, b * (100 - p) / 100, `${fmt(b)} × ${fmt((100 - p) / 100)}`); },
      () => { const h = pick([10, 20, 30, 40, 50, 100]); return T(`Mindestlohn 13,90 € × ${h} Stunden?`, 13.9 * h, 'Mindestlohn 2026: 13,90 € pro Stunde'); },
      () => { const m = ri(2, 12); return T(`Minijob-Grenze 603 € × ${m} Monate?`, 603 * m, 'Minijob-Grenze 2026: 603 € im Monat'); },
    ];
    const M = [
      () => { const n = ri(1, 20) * 100; return T(`Brutto ${eur(n * 1.19)} (19 %): Netto?`, n, 'Netto = Brutto ÷ 1,19'); },
      () => { const n = ri(1, 30) * 100; return T(`Netto ${eur(n)} + 7 % USt: Brutto?`, n * 1.07, 'Ermäßigter Satz, z. B. Lebensmittel: Netto × 1,07'); },
      () => { const n = ri(1, 30) * 100; return T(`Brutto ${eur(n * 1.07)} (7 %): Netto?`, n, 'Netto = Brutto ÷ 1,07'); },
      () => { const b = ri(5, 60) * 50, p = pick([2, 3]); return T(`Rechnung ${eur(b)}, ${p} % Skonto: Zahlbetrag?`, b * (100 - p) / 100, `${fmt(b)} × ${fmt((100 - p) / 100)}`); },
      () => { const [w, y] = pick([['Firmenwagen', 6], ['Büromöbel', 13], ['Kopierer', 7]]), k = y * ri(5, 60) * 100;
        return T(`${w} für ${eur(k)}, Nutzungsdauer ${y} Jahre: lineare AfA pro Jahr?`, k / y, `Anschaffungskosten ÷ Nutzungsdauer (AfA-Tabelle: ${w} ${y} Jahre)`); },
      () => { const t = ri(4, 21) * 10; return T(`Homeoffice-Pauschale für ${t} Tage?`, 6 * t, '6 € pro Tag, höchstens 210 Tage = 1.260 € im Jahr'); },
    ];
    const S = [
      () => { const n = ri(2, 50) * 100; return T(`Wie viel USt (19 %) stecken in ${eur(n * 1.19)} brutto?`, n * 0.19, 'USt = Brutto × 19/119 (erst ÷ 119, dann × 19)'); },
      () => { const k = ri(12, 80) * 100; return T(`Kapitalerträge ${eur(k)}: Abgeltungsteuer (25 %, ohne Soli)?`, (k - 1000) * 0.25, 'Erst 1.000 € Sparer-Pauschbetrag abziehen, dann × 25 %'); },
      () => { const s = ri(4, 80) * 100; return T(`Solidaritätszuschlag (5,5 %) auf ${eur(s)} Steuer?`, s * 0.055, 'Soli = Steuer × 0,055'); },
      () => { const p = pick([8, 9]), s = ri(10, 80) * 100; return T(`Kirchensteuer ${p} % auf ${eur(s)} Einkommensteuer?`, s * p / 100, '8 % in Bayern und Baden-Württemberg, sonst 9 %'); },
      () => { const P = ri(2, 40) * 1000, r = pick([2, 2.5, 3, 3.5, 4, 5]), m = pick([12, 6, 3]); return T(`${eur(P)} zu ${fmt(r)} % für ${m} Monate: Zinsen?`, P * r / 100 * m / 12, 'Kapital × Zinssatz × Monate ÷ 12'); },
      () => { const u = ri(20, 120) * 50, v = ri(5, Math.floor(u / 50) - 2) * 50; return T(`USt ${eur(u)}, Vorsteuer ${eur(v)}: Zahllast?`, u - v, 'Zahllast = Umsatzsteuer − Vorsteuer'); },
    ];
    const P = [
      () => { const k = ri(10, 90), g = 24500 + k * 1000, H = pick([300, 350, 400, 450, 500]);
        return T(`Gewerbeertrag ${eur(g)} (Einzelunternehmen), Hebesatz ${H} %: Gewerbesteuer?`, k * 1000 * 0.035 * H / 100, '− 24.500 € Freibetrag, × 3,5 % Messzahl, × Hebesatz'); },
      () => { const P0 = pick([1000, 2000, 2500, 5000, 10000]), r = pick([2, 4, 5, 10]); return T(`${eur(P0)} zu ${r} % über 2 Jahre mit Zinseszins: Endbetrag?`, P0 * (1 + r / 100) ** 2, `${fmt(P0)} × ${fmt(1 + r / 100)}²`); },
      () => { const r = pick([2, 3, 4, 6, 8, 9, 12]); return T(`Nach wie vielen Jahren verdoppelt sich Geld bei ${r} % (72er-Regel)?`, 72 / r, 'Faustregel: 72 ÷ Zinssatz'); },
      () => { const u = pick([1.25, 2.5, 0.8, 3.2, 1.5]), a = ri(2, 9); let b = ri(2, 12); if (b === a) b++;
        return T(`${a} kg kosten ${eur(rnd(u * a, 2))}. Was kosten ${b} kg?`, u * b, 'Dreisatz: erst der Preis für 1 kg'); },
      () => { const tot = pick([24, 36, 48, 60, 72]), divs = [2, 3, 4, 6].filter(x => tot % x === 0), w1 = pick(divs), w2 = pick(divs.filter(x => x !== w1));
        return T(`${w1} Personen brauchen ${tot / w1} Tage. Wie viele Tage brauchen ${w2}?`, tot / w2, 'Antiproportional: Personen × Tage bleibt gleich'); },
      () => { const n = ri(2, 40) * 100; return T(`Netto ${eur(n)} + 19 % USt, davon 2 % Skonto: Zahlbetrag?`, n * 1.19 * 0.98, 'Netto × 1,19 × 0,98'); },
    ];
    return pick([L, M, S, P][d])();
  },
  est(e) {
    const d = Math.floor(e / 3), tol = [0.1, 0.05, 0.03, 0.02][d];
    let q, a; const k = RNG();
    if (d === 0) { const x = ri(21, 99), y = ri(21, 99); q = `${x} × ${y}`; a = x * y; }
    else if (d === 1) { if (k < .5) { const x = ri(120, 990), y = ri(12, 99); q = `${x} × ${y}`; a = x * y; } else { const x = ri(1200, 9900), y = ri(12, 99); q = `${fmt(x)} ÷ ${y}`; a = x / y; } }
    else if (d === 2) {
      if (k < .4) { const x = ri(120, 990), y = ri(120, 990); q = `${x} × ${y}`; a = x * y; }
      else if (k < .7) { const x = ri(1001, 9999); q = `19 % von ${fmt(x)}`; a = x * 0.19; }
      else { const x = ri(30, 9999); q = `√${fmt(x)}`; a = Math.sqrt(x); }
    } else {
      if (k < .35) { const x = ri(11, 99) / 10, y = ri(120, 990); q = `${fmt(x)} × ${y}`; a = x * y; }
      else if (k < .7) { const p = ri(2, 9), n = ri(3, 10), P0 = ri(1, 20) * 1000; q = `${eur(P0)} zu ${p} % über ${n} Jahre, Zinseszins`; a = P0 * (1 + p / 100) ** n; }
      else { const x = ri(2000, 99999); q = `√${fmt(x)}`; a = Math.sqrt(x); }
    }
    return { t: q + ' ≈ ?', a, tol, x: 'genau ' + fmt(rnd(a, 2)) + ', erlaubt ±' + Math.round(tol * 100) + ' %' };
  },
};

/* ---------- trick lessons ---------- */
const TRICKS = [
  { id: 'x11', name: '× 11', rule: 'Zweistellige Zahl × 11: Ziffern auseinanderziehen, ihre Summe in die Mitte. Ist die Summe 10 oder mehr, wandert die 1 nach links.', ex: '53 × 11 → 5 | 8 | 3 = 583 · 78 × 11 → 7 | 15 | 8 = 858', gen: () => { const a = ri(12, 99); return { t: `${a} × 11`, a: a * 11 }; } },
  { id: 'x25', name: '× 5 und × 25', rule: '× 5 ist × 10 und dann halbieren. × 25 ist × 100 und dann durch 4.', ex: '64 × 25 = 6.400 ÷ 4 = 1.600 · 86 × 5 = 860 ÷ 2 = 430', gen: () => RNG() < .5 ? (a => ({ t: `${a} × 25`, a: a * 25 }))(ri(3, 40) * 4) : (a => ({ t: `${a} × 5`, a: a * 5 }))(ri(13, 199)) },
  { id: 'sq5', name: 'Quadrate auf 5', rule: 'Zahl mit Endziffer 5 hoch 2: vordere Ziffer(n) mal (sich selbst + 1), dann 25 anhängen.', ex: '65² → 6 × 7 = 42 → 4.225 · 115² → 11 × 12 = 132 → 13.225', gen: () => { const k = ri(1, 12), a = 10 * k + 5; return { t: `${a}²`, a: a * a }; } },
  { id: 'sq50', name: 'Quadrate nahe 50', rule: '(50 + k)² = 2.500 + 100·k + k². Für 50 − k: 2.500 − 100·k + k².', ex: '53² = 2.500 + 300 + 9 = 2.809 · 47² = 2.500 − 300 + 9 = 2.209', gen: () => { const a = ri(40, 60); return { t: `${a}²`, a: a * a }; } },
  { id: 'binom', name: 'Mitte² − Abstand²', rule: 'Zwei Zahlen gleich weit um eine runde Mitte: Mitte² minus Abstand². Das ist die dritte binomische Formel.', ex: '23 × 17 = 20² − 3² = 391 · 48 × 52 = 50² − 2² = 2.496', gen: () => { const m = pick([20, 30, 40, 50, 60, 70, 80, 90, 100]), k = ri(1, 9); return { t: `${m + k} × ${m - k}`, a: (m + k) * (m - k) }; } },
  { id: 'x99', name: '× 9 und × 99', rule: '× 9 ist × 10 minus die Zahl. × 99 ist × 100 minus die Zahl.', ex: '37 × 99 = 3.700 − 37 = 3.663 · 48 × 9 = 480 − 48 = 432', gen: () => RNG() < .5 ? (a => ({ t: `${a} × 99`, a: a * 99 }))(ri(12, 99)) : (a => ({ t: `${a} × 9`, a: a * 9 }))(ri(13, 199)) },
  { id: 'pswap', name: 'Prozent tauschen', rule: 'x % von y ist dasselbe wie y % von x. Nimm die Richtung, die leichter ist.', ex: '8 % von 50 = 50 % von 8 = 4 · 16 % von 25 = 25 % von 16 = 4', gen: () => { const p = ri(2, 24), b = pick([25, 50, 20, 10, 200, 75]); return { t: `${p} % von ${b}`, a: rnd(p * b / 100) }; } },
  { id: 'ust', name: 'USt herausrechnen', rule: 'Bei 19 %: Brutto ÷ 119 ergibt 1 %. Mal 19 ist die USt, mal 100 das Netto. Bei 7 % genauso mit 107.', ex: '357 € brutto ÷ 119 = 3 → USt 57 €, Netto 300 €', gen: () => { const r = pick([19, 19, 7]), n = ri(1, 40) * 100, b = rnd(n * (100 + r) / 100, 2);
    return RNG() < .5 ? { t: `${eur(b)} brutto (${r} %): USt?`, a: rnd(n * r / 100, 2) } : { t: `${eur(b)} brutto (${r} %): Netto?`, a: n }; } },
  { id: 'r72', name: '72er-Regel', rule: 'Wie lange, bis sich Geld verdoppelt? Ungefähr 72 ÷ Zinssatz. Umgekehrt: Welcher Zins verdoppelt in n Jahren? 72 ÷ n.', ex: 'Bei 6 % ≈ 12 Jahre · Verdopplung in 8 Jahren braucht ≈ 9 %', gen: () => { const x = pick([2, 3, 4, 6, 8, 9, 12, 18, 24]); return RNG() < .5 ? { t: `Verdopplungszeit bei ${x} % Zins?`, a: 72 / x } : { t: `Welcher Zins verdoppelt in ${x} Jahren?`, a: 72 / x }; } },
  { id: 'skonto', name: 'Skonto und Rabatt', rule: 'Erst 1 % bestimmen (Komma zwei Stellen nach links), dann mal den Prozentsatz und abziehen.', ex: '3 % Skonto auf 2.400 €: 1 % = 24 → 72 → Zahlbetrag 2.328 €', gen: () => { const b = ri(4, 90) * 100, p = pick([2, 3, 4, 15, 30]); return { t: `${eur(b)} − ${p} %?`, a: b * (100 - p) / 100 }; } },
];

/* ---------- persistent data ---------- */
function rcData() {
  const r = G.rechnen || (G.rechnen = {});
  r.bests ||= {}; r.stats ||= {}; r.review ||= []; r.tricks ||= {}; r.daily ||= {};
  r.cfg ||= { mode: 'sprint', d: 0, dur: 60, cat: 'mix' };
  if (r.pad == null) r.pad = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  return r;
}
const bestKey = c => [c.mode, c.mode === 'sprint' ? c.dur : '', c.d, ['chain', 'estimate'].includes(c.mode) ? '' : c.cat].join('|');

/* ---------- round state ---------- */
const R = { on: false, result: null };
const eff = () => R.d * 3 + R.s;
const timed = () => R.mode === 'survival' || R.mode === 'estimate';
function taskLimit() { return R.mode === 'estimate' ? [14, 11, 9, 7][R.d] * 1000 : Math.max(4, 14 - R.n * 0.3 - R.d * 1.5) * 1000; }
function newTask() {
  let q;
  if (R.kind === 'review') q = R.rq[R.done % R.rq.length];
  else if (R.kind === 'trick') { q = TRICKS.find(x => x.id === R.trick).gen(); q.c = 'trick'; }
  else if (R.mode === 'estimate') { q = GEN.est(eff()); q.c = 'est'; }
  else { const c = R.cat === 'mix' ? wpick(MIX) : R.cat; q = GEN[c](eff()); q.c = c; }
  R.q = q; R.qStart = Date.now(); R.qLim = timed() ? taskLimit() : 0; R.qEnd = R.qLim ? Date.now() + R.qLim : 0;
}
function start(o) {
  const rc = rcData();
  Object.assign(R, { on: true, result: null, kind: 'play', mode: rc.cfg.mode, d: rc.cfg.d, dur: rc.cfg.dur, cat: rc.cfg.cat, daily: false, trick: null, rq: null }, o || {},
    { s: 0, streak: 0, n: 0, wrong: 0, done: 0, lives: 3, penalty: 0, miss: [], fb: null, start: Date.now() });
  R.total = R.kind === 'trick' ? 8 : R.kind === 'review' ? R.rq.length : R.mode === 'trial' ? 20 : R.mode === 'estimate' ? 12 : R.mode === 'chain' ? 5 : 0;
  R.end = R.mode === 'sprint' ? Date.now() + R.dur * 1000 : 0;
  // Only the scored first attempt of the day uses the day's fixed tasks; practice runs afterwards get fresh ones.
  RNG = R.daily && rc.daily.date !== today() ? seeded('echo-rechnen-' + today()) : Math.random;
  if (R.mode === 'chain' && R.kind === 'play') newChain(); else newTask();
  clearInterval(R.timer); R.timer = setInterval(tick, 100);
  view = 'rechnen'; render();
}

/* chain mode */
function newChain() {
  const d = R.d, steps = [4, 6, 8, 10][d], cap = [100, 300, 1000, 5000][d], add = [20, 50, 100, 300][d], mul = [5, 9, 12, 19][d];
  let v = ri(2, [9, 20, 50, 99][d]); const startV = v, ops = [];
  while (ops.length < steps) {
    const k = RNG(); let op = null;
    if (d === 3 && k > .92 && v <= 30) op = ['²', 0];
    else if (k < .3) op = ['+', ri(2, add)];
    else if (k < .55) { if (v > 3) op = ['−', ri(1, Math.min(v - 1, add))]; }
    else if (k < .8) { const x = ri(2, mul); if (v * x <= cap) op = ['×', x]; }
    else { const divs = []; for (let x = 2; x <= 12; x++) if (v % x === 0 && v / x >= 2) divs.push(x); if (divs.length) op = ['÷', pick(divs)]; }
    if (!op) continue;
    v = op[0] === '+' ? v + op[1] : op[0] === '−' ? v - op[1] : op[0] === '×' ? v * op[1] : op[0] === '÷' ? v / op[1] : v * v;
    ops.push(op);
  }
  R.chain = { startV, ops, res: v, i: -1, phase: 'show', stepEnd: Date.now() + 1800 };
  R.q = { t: 'Kette', a: v, c: 'chain' }; R.qStart = Date.now(); R.qEnd = 0; R.qLim = 0;
}
const opText = op => op[0] === '²' ? 'hoch 2' : `${op[0]} ${fmt(op[1])}`;
function chainStep() {
  const ch = R.chain; ch.i++;
  if (ch.i >= ch.ops.length) { ch.phase = 'ask'; R.qStart = Date.now(); }
  else ch.stepEnd = Date.now() + [3000, 2400, 1900, 1500][R.d];
  render();
}

/* ---------- answering ---------- */
function parseNum(s) {
  s = String(s).trim().replace(/\s/g, '').replace(/−/g, '-');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return s === '' || s === '-' ? NaN : Number(s);
}
const isRight = (q, v) => !Number.isNaN(v) && (q.tol ? Math.abs(v - q.a) <= q.tol * Math.abs(q.a) : Math.abs(v - q.a) <= 1e-6 * Math.max(1, Math.abs(q.a)));
function record(ok) {
  const rc = rcData(), q = R.q, st = rc.stats[q.c] || (rc.stats[q.c] = { n: 0, ok: 0, ms: 0 });
  st.n++; if (ok) { st.ok++; st.ms += Math.min(30e3, Date.now() - R.qStart); }
  if (ok) { if (++R.streak >= 3 && R.s < 2) { R.s++; R.streak = 0; } }
  else {
    R.s = Math.max(0, R.s - 1); R.streak = 0;
    if (!R.miss.some(m => m.t === q.t)) R.miss.push(q);
    if (R.kind !== 'review' && q.c !== 'chain' && !rc.review.some(m => m.t === q.t)) { rc.review.push({ t: q.t, a: q.a, tol: q.tol, c: q.c, x: q.x }); if (rc.review.length > 60) rc.review.shift(); }
  }
}
function advance() {
  R.done++;
  if (R.total && R.done >= R.total) return finish();
  if (R.mode === 'chain' && R.kind === 'play') newChain(); else newTask();
  render();
}
function right() {
  beep(true); record(true); R.n++; R.fb = null;
  if (R.kind === 'review') { const rc = rcData(); rc.review = rc.review.filter(m => m.t !== R.q.t); }
  if (R.mode === 'chain' && R.kind === 'play') { R.chain.phase = 'fb'; R.chain.ok = true; render(); return; }
  advance();
}
function miss(skip) {
  beep(false); record(false);
  R.fb = { t: R.q.t, a: R.q.a, x: R.q.x, skip };
  if (R.mode === 'trial' && R.kind === 'play') R.penalty += 5000;
  if (R.mode === 'survival' && R.kind === 'play' && --R.lives <= 0) return finish();
  if (R.mode === 'chain' && R.kind === 'play') { R.chain.phase = 'fb'; R.chain.ok = false; render(); return; }
  if (R.mode === 'sprint' || R.mode === 'survival') { R.wrong++; newTask(); render(); return; }
  advance();
}
function rechnenInput(v) {
  if (!R.on || R.q.tol || (R.chain && R.chain.phase !== 'ask' && R.mode === 'chain' && R.kind === 'play')) return;
  if (isRight(R.q, parseNum(v))) right();
}
function submit() {
  if (!R.on) return;
  if (R.mode === 'chain' && R.kind === 'play') { const ph = R.chain.phase; if (ph === 'show') return chainStep(); if (ph === 'fb') return advance(); }
  const el = document.getElementById('rin'), v = parseNum(el ? el.value : '');
  if (Number.isNaN(v)) { if (R.q.tol || R.mode === 'chain') return; return miss(true); }
  if (isRight(R.q, v)) right(); else { if (el) el.classList.add('shake'); miss(false); }
}
function rechnenPad(k) {
  const el = document.getElementById('rin'); if (!el) return submit();
  if (k === 'ok') return submit();
  let v = el.value;
  if (k === 'bs') v = v.slice(0, -1); else if (k === '-') v = v.startsWith('-') ? v.slice(1) : '-' + v; else if (v.length < 14) v += k;
  el.value = v; el.focus(); rechnenInput(v);
}
function rechnenKey(e) {
  if (!R.on) return;
  if (e.key === 'Enter') { e.preventDefault(); submit(); }
  else if (e.key === 'Escape') finish();
}

/* ---------- clock ---------- */
function tick() {
  if (!R.on) { clearInterval(R.timer); return; }
  const now = Date.now(), clock = document.getElementById('rclock');
  if (R.mode === 'sprint' && R.kind === 'play') { const s = Math.ceil((R.end - now) / 1000); if (s <= 0) return finish(); if (clock) clock.textContent = '⏱ ' + s + ' s'; }
  else if (clock) clock.textContent = '⏱ ' + fmtSec(now - R.start + R.penalty);
  if (R.mode === 'chain' && R.kind === 'play' && R.chain.phase === 'show' && now >= R.chain.stepEnd) return chainStep();
  if (R.qEnd && R.kind === 'play') {
    const bar = document.getElementById('rbar'), left = R.qEnd - now;
    if (bar) bar.style.width = Math.max(0, 100 * left / R.qLim) + '%';
    if (left <= 0) miss(true);
  }
}
const fmtSec = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' s';

/* ---------- end of round ---------- */
function finish() {
  if (!R.on) return; R.on = false; clearInterval(R.timer); RNG = Math.random;
  const rc = rcData(), mult = RC_MULT[R.d], cfg = { mode: R.mode, d: R.d, dur: R.dur, cat: R.cat };
  let xp = 0, score = R.n, best = false, label = R.n + ' richtig', extra = '';
  if (R.kind === 'trick') {
    const t = TRICKS.find(x => x.id === R.trick), all = R.n === R.total, first = all && !rc.tricks[t.id];
    if (all) rc.tricks[t.id] = (rc.tricks[t.id] || 0) + 1;
    xp = first ? 20 : R.n * 2; label = `${R.n} / ${R.total}`; extra = all ? (first ? 'Trick gelernt!' : 'Wieder sicher') : 'Für „gelernt“ braucht es alle 8';
  } else if (R.kind === 'review') { xp = R.n * 3; label = `${R.n} / ${R.total} gelöst`; extra = rc.review.length ? rc.review.length + ' noch offen' : 'Alle Fehler erledigt'; }
  else {
    const k = bestKey(cfg), old = rc.bests[k];
    if (R.mode === 'trial') {
      const ms = Date.now() - R.start + R.penalty; score = Math.round(ms / 100) / 10; label = fmtSec(ms); extra = R.n + ' / 20 richtig';
      if (R.done >= 20 && (old == null || score < old)) { rc.bests[k] = score; best = old != null; }
      xp = Math.round(R.n * 1.5 * mult);
    } else {
      if (old == null || score > old) { rc.bests[k] = score; best = old != null && score > 0; }
      xp = Math.round(score * (R.mode === 'chain' ? 6 : R.mode === 'estimate' ? 3 : 2) * mult);
      if (R.mode === 'chain') label = `${R.n} / 5 Ketten`; if (R.mode === 'estimate') label = `${R.n} / 12 Treffer`;
    }
    if (R.daily) {
      const dd = rc.daily;
      if (dd.date !== today()) {
        const y = new Date(); y.setDate(y.getDate() - 1); const yk = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
        dd.streak = dd.date === yk ? (dd.streak || 0) + 1 : 1; dd.date = today(); dd.score = score; dd.best = Math.max(dd.best || 0, score); xp = score * 3 + 10;
        extra = `Tages-Challenge · Serie ${dd.streak} 🔥`;
      } else extra = 'Heute schon gewertet: ' + dd.score + ' · das hier war Übung';
    }
  }
  xp = Math.max(2, xp); gain('rechnen', xp);
  R.result = { label, xp, best, extra, miss: R.miss.slice(0, 12), again: { kind: R.kind, trick: R.trick, daily: R.daily, rq: null } };
  render();
}

/* ---------- views ---------- */
const chip = (act, v, label, on) => `<button class="chip" data-act="${act}" data-v="${v}" aria-pressed="${on}">${esc(label)}</button>`;
function viewRechnen() {
  const rc = rcData();
  if (R.on) return viewPlay(rc);
  if (R.result) return viewResult(rc);
  return viewSetup(rc);
}
function viewSetup(rc) {
  const c = rc.cfg, best = rc.bests[bestKey(c)], catOn = !['chain', 'estimate'].includes(c.mode);
  const bestTxt = best == null ? 'Noch kein Bestwert für diese Einstellung' : 'Bestwert: ' + (c.mode === 'trial' ? fmt(best) + ' s' : best);
  const dd = rc.daily, doneToday = dd.date === today();
  const stats = Object.entries(rc.stats).filter(([k, s]) => s.n >= 3 && RC_CATS[k]).map(([k, s]) => ({ k, s, acc: s.ok / s.n, avg: s.ok ? s.ms / s.ok / 1000 : 99 }));
  const weak = stats.filter(x => RC_PICK.includes(x.k)).sort((a, b) => a.acc - b.acc || b.avg - a.avg)[0];
  return `${back}<h2>Kopfrechnen</h2>
  <section class="card">
    <span class="eyebrow">Modus</span><div class="chips">${Object.entries(RC_MODES).map(([k, m]) => chip('r-mode', k, m[0], c.mode === k)).join('')}</div>
    <p class="small muted" style="margin:0">${esc(RC_MODES[c.mode][1])}</p>
    <span class="eyebrow">Schwierigkeit</span><div class="chips">${RC_DIFF.map((n, i) => chip('r-diff', i, n, c.d === i)).join('')}</div>
    ${c.mode === 'sprint' ? `<span class="eyebrow">Länge</span><div class="chips">${RC_DUR.map(s => chip('r-dur', s, s < 60 ? s + ' s' : s / 60 + ' min', c.dur === s)).join('')}</div>` : ''}
    ${catOn ? `<span class="eyebrow">Rechenart</span><div class="chips">${RC_PICK.map(k => chip('r-cat', k, RC_SHORT[k], c.cat === k)).join('')}</div>` : ''}
    <p class="small muted" style="margin:0">${esc(bestTxt)} · Innerhalb der Runde wird es schwerer, solange du triffst.</p>
    <button class="btn primary big" data-act="r-go" id="rgo">Start</button>
  </section>
  <section class="card">
    <div class="row spread"><div style="display:grid;gap:2px"><span class="eyebrow">Jeden Tag neu</span><h3>Tages-Challenge</h3></div><span class="small muted mono">🔥 ${dd.date === today() || isYesterday(dd.date) ? dd.streak || 0 : 0} · Best ${dd.best || 0}</span></div>
    <p class="small muted" style="margin:0">60 Sekunden Mix auf Mittel, mit Steuer-Aufgaben. Gewertet wird der erste Versuch des Tages.</p>
    <button class="btn ${doneToday ? '' : 'primary'}" data-act="r-daily">${doneToday ? 'Heute: ' + dd.score + ' · nochmal üben' : 'Challenge starten · +10 XP Bonus'}</button>
  </section>
  <section class="card">
    <div class="row spread"><h3>Rechentricks</h3><span class="small muted mono">${TRICKS.filter(t => rc.tricks[t.id]).length}/${TRICKS.length} gelernt</span></div>
    <div class="chips">${TRICKS.map(t => `<button class="chip" data-act="r-trick" data-v="${t.id}">${rc.tricks[t.id] ? '✓ ' : ''}${esc(t.name)}</button>`).join('')}</div>
  </section>
  <section class="card">
    <div class="row spread"><h3>Fehler wiederholen</h3><span class="small muted mono">${rc.review.length} offen</span></div>
    <p class="small muted" style="margin:0">Falsch beantwortete und übersprungene Aufgaben landen hier, bis du sie einmal richtig hast.</p>
    <button class="btn" data-act="r-review" ${rc.review.length ? '' : 'disabled'}>${rc.review.length ? 'Bis zu 10 wiederholen' : 'Nichts offen'}</button>
  </section>
  <section class="card">
    <h3>Statistik</h3>
    ${stats.length ? `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:6px 14px;font-size:14px;align-items:center">
      <span class="small muted">Rechenart</span><span class="small muted">Treffer</span><span class="small muted">Ø Zeit</span><span class="small muted">Aufgaben</span>
      ${stats.sort((a, b) => b.s.n - a.s.n).map(x => `<span>${x === weak ? '<b>' + esc(RC_CATS[x.k]) + '</b> ·<span class="small muted"> schwächste</span>' : esc(RC_CATS[x.k])}</span><span class="mono">${Math.round(x.acc * 100)} %</span><span class="mono">${x.s.ok ? fmt(rnd(x.avg, 1)) + ' s' : '–'}</span><span class="mono muted">${x.s.n}</span>`).join('')}</div>
      ${weak ? `<button class="btn" data-act="r-weak" data-v="${weak.k}">Schwächste üben: ${esc(RC_CATS[weak.k])}</button>` : ''}` : '<p class="small muted" style="margin:0">Ab drei Aufgaben pro Rechenart siehst du hier Trefferquote und Tempo.</p>'}
  </section>
  <div class="row"><button class="chip" data-act="r-pad" aria-pressed="${rc.pad}">Ziffernblock am Bildschirm</button></div>`;
}
function isYesterday(k) { if (!k) return false; const y = new Date(); y.setDate(y.getDate() - 1); return k === y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); }
function padHTML(rc, ask) {
  if (!rc.pad || !ask) return '';
  const k = (v, l, cls) => `<button class="pk ${cls || ''}" data-pad="${v}" aria-label="${esc(l)}">${esc(l)}</button>`;
  return `<div class="pad">${['7', '8', '9'].map(d => k(d, d)).join('')}${k('bs', '⌫', 'fn')}${['4', '5', '6'].map(d => k(d, d)).join('')}${k('-', '±', 'fn')}${['1', '2', '3'].map(d => k(d, d)).join('')}${k(',', ',', 'fn')}${k('0', '0', 'wide')}${k('ok', '✓', 'ok wide')}</div>`;
}
function viewPlay(rc) {
  const q = R.q, kindLbl = R.kind === 'trick' ? TRICKS.find(t => t.id === R.trick).name : R.kind === 'review' ? 'Fehler wiederholen' : R.daily ? 'Tages-Challenge' : RC_MODES[R.mode][0];
  const lvl = R.kind === 'play' && R.mode !== 'chain' ? ` · ${RC_DIFF[R.d]}${R.s ? ' +' + R.s : ''}` : '';
  const prog = R.total ? `${Math.min(R.done + 1, R.total)} / ${R.total}` : `${R.n} richtig`;
  const lives = R.mode === 'survival' && R.kind === 'play' ? ' · ' + '♥'.repeat(R.lives) + '♡'.repeat(3 - R.lives) : '';
  const clock = (R.mode === 'sprint' && R.kind === 'play') ? '⏱ ' + Math.max(0, Math.ceil((R.end - Date.now()) / 1000)) + ' s' : '⏱ ' + fmtSec(Date.now() - R.start + R.penalty);
  const top = `<div class="topbar"><button class="link" data-act="r-quit">← Beenden</button><button class="link" data-act="sound">${G.sound === false ? '🔇' : '🔊'}</button></div>
    <div class="row spread"><span class="mono" id="rclock">${clock}</span><span class="mono small">${esc(kindLbl + lvl)} · ${prog}${lives}</span></div>`;
  const bar = R.qEnd && R.kind === 'play' ? `<div class="bar gold"><i id="rbar" style="width:${Math.max(0, 100 * (R.qEnd - Date.now()) / R.qLim)}%"></i></div>` : '';
  const fb = R.fb ? `<div class="expl small" style="border-left:0"><b style="color:var(--rec)">${R.fb.skip ? 'Übersprungen' : 'Daneben'}:</b> ${esc(R.fb.t.replace(' ≈ ?', ''))} = <b>${esc(fmt(rnd(R.fb.a, 2)))}</b>${R.fb.x ? ' · ' + esc(R.fb.x) : ''}</div>` : '';
  const trick = R.kind === 'trick' ? (t => `<div class="fact"><b>Trick</b><span>${esc(t.rule)}<br><span class="small muted">${esc(t.ex)}</span></span></div>`)(TRICKS.find(t => t.id === R.trick)) : '';
  if (R.mode === 'chain' && R.kind === 'play') {
    const ch = R.chain;
    if (ch.phase === 'show') return `${top}<div class="progress">${[-1, ...ch.ops.map((_, i) => i)].map(i => `<i class="${i < ch.i ? 'ok' : i === ch.i ? 'cur' : ''}"></i>`).join('')}</div>
      <span class="eyebrow" style="text-align:center">${ch.i < 0 ? 'Startzahl' : 'Schritt ' + (ch.i + 1) + ' von ' + ch.ops.length}</span>
      <div class="sum" style="padding:34px 0;font-size:64px">${esc(ch.i < 0 ? fmt(ch.startV) : opText(ch.ops[ch.i]))}</div>
      <button class="btn" data-act="r-step">Weiter (Enter)</button>`;
    if (ch.phase === 'fb') return `${top}<section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">${ch.ok ? '✓ Richtig' : '✗ Daneben'}</span>
      <div class="mono" style="font-size:15px">${esc(fmt(ch.startV) + ' ' + ch.ops.map(opText).join(' ') + ' = ' + fmt(ch.res))}</div></section>
      <button class="btn primary big" data-act="r-step" id="rgo">${R.done + 1 >= R.total ? 'Ergebnis' : 'Nächste Kette'}</button>`;
    return `${top}<span class="eyebrow" style="text-align:center">Kette ${R.done + 1} von 5</span><div class="sum" style="padding:24px 0">Ergebnis?</div>
      <input class="numin" id="rin" inputmode="${rc.pad ? 'none' : 'decimal'}" autocomplete="off" aria-label="Ergebnis">${padHTML(rc, true)}`;
  }
  const long = q.t.length > 24;
  const exact = !q.tol;
  return `${top}${bar}${trick}${fb}
    <div class="sum" style="padding:${long ? '18px 0' : '26px 0'};${long ? 'font-size:26px;line-height:1.25' : ''}">${esc(q.t)}${q.t.includes('?') ? '' : ' = ?'}</div>
    <input class="numin" id="rin" inputmode="${rc.pad ? 'none' : 'decimal'}" autocomplete="off" aria-label="Ergebnis">
    ${padHTML(rc, true)}
    <div class="row spread"><span class="hint">${exact ? 'Richtige Antworten werden sofort erkannt.' : 'Mit ✓ oder Enter bestätigen.'}</span>${exact ? '<button class="link" data-act="r-skip">Überspringen</button>' : ''}</div>`;
}
function viewResult(rc) {
  const r = R.result;
  return `${back}<h2>Kopfrechnen</h2>
  <section class="card" style="text-align:center;justify-items:center"><span class="eyebrow">Ergebnis</span><div class="sum">${esc(r.label)}</div>
    <p class="muted" style="margin:0">${r.best ? 'Neuer Bestwert! · ' : ''}+${r.xp} XP${r.extra ? ' · ' + esc(r.extra) : ''}</p>
    <div class="row" style="gap:8px;width:100%"><button class="btn primary grow" data-act="r-again" id="rgo">Nochmal</button><button class="btn grow" data-act="r-setup">Einstellungen</button></div></section>
  ${r.miss.length ? `<section class="card"><h3>Das waren die Knackpunkte</h3><p class="small muted" style="margin:0">Sie kommen unter „Fehler wiederholen“ wieder.</p>
    ${r.miss.map(m => `<div style="display:grid;gap:2px"><span><b>${esc(m.t.replace(' ≈ ?', ''))}</b> = ${esc(m.c === 'chain' ? fmt(m.a) : fmt(rnd(m.a, 2)))}</span>${m.x ? `<span class="small muted">${esc(m.x)}</span>` : ''}</div>`).join('')}</section>` : ''}`;
}

/* ---------- actions ---------- */
function rechnenAct(a, v) {
  const rc = rcData(), c = rc.cfg;
  if (a === 'r-mode') { c.mode = v; save(); render(); }
  else if (a === 'r-diff') { c.d = +v; save(); render(); }
  else if (a === 'r-dur') { c.dur = +v; save(); render(); }
  else if (a === 'r-cat') { c.cat = v; save(); render(); }
  else if (a === 'r-pad') { rc.pad = !rc.pad; save(); render(); }
  else if (a === 'r-go') start();
  else if (a === 'r-daily') start({ mode: 'sprint', d: 1, dur: 60, cat: 'mix', daily: true });
  else if (a === 'r-trick') start({ kind: 'trick', trick: v, mode: 'trial', d: 1 });
  else if (a === 'r-review') start({ kind: 'review', mode: 'trial', rq: shuffle(rc.review).slice(0, 10) });
  else if (a === 'r-weak') start({ mode: 'sprint', dur: 60, cat: v });
  else if (a === 'r-skip') { if (R.on) miss(true); }
  else if (a === 'r-step') submit();
  else if (a === 'r-quit') finish();
  else if (a === 'r-setup') { R.result = null; render(); }
  else if (a === 'r-again') {
    const g = R.result && R.result.again; R.result = null;
    if (!g) return render();
    if (g.kind === 'trick') start({ kind: 'trick', trick: g.trick, mode: 'trial', d: 1 });
    else if (g.kind === 'review') { if (rc.review.length) start({ kind: 'review', mode: 'trial', rq: shuffle(rc.review).slice(0, 10) }); else render(); }
    else if (g.daily) start({ mode: 'sprint', d: 1, dur: 60, cat: 'mix', daily: true });
    else start();
  }
}
function rechnenMeta() {
  const rc = rcData(), dd = rc.daily;
  return dd.date === today() ? `Tages-Challenge ✓ ${dd.score} · Serie ${dd.streak}` : `Tages-Challenge offen${dd.streak && isYesterday(dd.date) ? ' · Serie ' + dd.streak : ''}`;
}
