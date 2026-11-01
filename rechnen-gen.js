'use strict';
/* Task generators for Kopfrechnen (rechnen.js). Every template returns { t: task text, a: answer, w: [steps of a
   simplified way to compute it], x: optional rule }. Banks hold several templates per difficulty band (0..3); a band's
   templates take s (0..2) to scale numbers within the band, and now and then a template from the band below is mixed in
   so a round never settles into one pattern. */

let RNG = Math.random;
const ri = (a, b) => a + Math.floor(RNG() * (b - a + 1));
const pick = a => a[Math.floor(RNG() * a.length)];
const chance = p => RNG() < p;
const wpick = list => { let s = list.reduce((x, [, w]) => x + w, 0) * RNG(); for (const [k, w] of list) { s -= w; if (s <= 0) return k; } return list[0][0]; };
const rnd = (n, d = 6) => Math.round(n * 10 ** d) / 10 ** d;
const fmt = n => Number(n).toLocaleString('de-DE', { maximumFractionDigits: 4 });
const eur = n => Number(n).toLocaleString('de-DE', { minimumFractionDigits: Number.isInteger(+n) ? 0 : 2, maximumFractionDigits: 2 }) + ' €';
const sup = n => String(n).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const decs = n => (String(n).split('.')[1] || '').length;
const pow10 = n => 10 ** Math.max(0, String(Math.floor(Math.abs(n))).length - 1);
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const mkQ = (t, a, w, x) => ({ t, a: rnd(a), w: w || [], x });

/* ---------- ways: how to do it in your head ---------- */
function wAdd(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) { const k = Math.max(decs(a), decs(b)), f = 10 ** k; return [`In ${k === 1 ? 'Zehnteln' : 'Hundertsteln'}: ${fmt(Math.round(a * f))} + ${fmt(Math.round(b * f))} = ${fmt(Math.round(a * f) + Math.round(b * f))}`, `Komma zurück: ${fmt(rnd(a + b))}`]; }
  if (b < 0) return wSub(a, -b);
  const m = pow10(b), r = b % m, up = Math.ceil(b / m) * m;
  if (b < 10 || !r) return [`${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`];
  if (up - b <= m * 0.2) return [`${fmt(b)} = ${fmt(up)} − ${fmt(up - b)}`, `${fmt(a)} + ${fmt(up)} = ${fmt(a + up)}`, `${fmt(a + up)} − ${fmt(up - b)} = ${fmt(a + b)}`];
  const hi = b - r; return [`${fmt(b)} = ${fmt(hi)} + ${fmt(r)}`, `${fmt(a)} + ${fmt(hi)} = ${fmt(a + hi)}`, `${fmt(a + hi)} + ${fmt(r)} = ${fmt(a + b)}`];
}
function wSub(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) { const k = Math.max(decs(a), decs(b)), f = 10 ** k; return [`In ${k === 1 ? 'Zehnteln' : 'Hundertsteln'}: ${fmt(Math.round(a * f))} − ${fmt(Math.round(b * f))} = ${fmt(Math.round(a * f) - Math.round(b * f))}`, `Komma zurück: ${fmt(rnd(a - b))}`]; }
  if (b > a) return [`Größere minus kleinere: ${fmt(b)} − ${fmt(a)} = ${fmt(b - a)}`, `Vorzeichen der größeren Zahl: ${fmt(a - b)}`];
  const m = pow10(b), r = b % m, up = Math.ceil(b / m) * m;
  if (b < 10 || !r) return [`${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}`];
  if (up - b <= m * 0.2) return [`${fmt(b)} = ${fmt(up)} − ${fmt(up - b)}`, `${fmt(a)} − ${fmt(up)} = ${fmt(a - up)}`, `zu viel abgezogen, also + ${fmt(up - b)} = ${fmt(a - b)}`];
  const hi = b - r; return [`${fmt(b)} = ${fmt(hi)} + ${fmt(r)}`, `${fmt(a)} − ${fmt(hi)} = ${fmt(a - hi)}`, `${fmt(a - hi)} − ${fmt(r)} = ${fmt(a - b)}`];
}
function wMul(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    const ka = decs(a), kb = decs(b), A = Math.round(a * 10 ** ka), B = Math.round(b * 10 ** kb), k = ka + kb;
    return [`Ohne Komma: ${fmt(A)} × ${fmt(B)} = ${fmt(A * B)}`, ...(A > 12 && B > 12 ? wMul(A, B).slice(0, -1) : []), `${k} Nachkommastelle${k > 1 ? 'n' : ''} zurück: ${fmt(rnd(a * b))}`];
  }
  if (b > a) [a, b] = [b, a];
  const p = a * b;
  if (b <= 1) return [`${fmt(a)} × ${b} = ${fmt(p)}`];
  if (a <= 12) return [`Einmaleins: ${a} × ${b} = ${p}`];
  if (b === 11 && a < 100) { const d1 = Math.floor(a / 10), d2 = a % 10, s = d1 + d2; return [`× 11: Ziffern ${d1} und ${d2} auseinander, Summe ${s} in die Mitte`, s >= 10 ? `${d1} | ${s} | ${d2}, die 1 wandert nach links: ${fmt(p)}` : `${d1} | ${s} | ${d2} = ${fmt(p)}`]; }
  if (b === 25) return [`× 25 = × 100, dann ÷ 4`, `${fmt(a)} × 100 = ${fmt(a * 100)}`, `${fmt(a * 100)} ÷ 4 = ${fmt(p)}`];
  if (b === 5) return [`× 5 = × 10, dann halbieren`, `${fmt(a)} × 10 = ${fmt(a * 10)}`, `${fmt(a * 10)} ÷ 2 = ${fmt(p)}`];
  if (b === 15) return [`× 15 = × 10 plus die Hälfte davon`, `${fmt(a)} × 10 = ${fmt(a * 10)}`, `Hälfte: ${fmt(a * 5)}`, `${fmt(a * 10)} + ${fmt(a * 5)} = ${fmt(p)}`];
  const near = x => { const m = x >= 100 ? 100 : 10, up = Math.ceil(x / m) * m; return x % m && up - x <= (m === 100 ? 2 : 1) ? up : 0; };
  for (const [x, y] of [[b, a], [a, b]]) { const up = near(x); if (up && y <= 999) return [`${fmt(x)} = ${fmt(up)} − ${fmt(up - x)}`, `${fmt(y)} × ${fmt(up)} = ${fmt(y * up)}`, `${fmt(y)} × ${fmt(up - x)} = ${fmt(y * (up - x))}`, `${fmt(y * up)} − ${fmt(y * (up - x))} = ${fmt(p)}`]; }
  if ((a + b) % 2 === 0) { const m = (a + b) / 2, k = (a - b) / 2; if (m % 10 === 0 && k > 0 && k <= 9) return [`Mitte ${m}, Abstand ${k}: ${m}² − ${k}²`, `${fmt(m * m)} − ${k * k} = ${fmt(p)}`]; }
  if (b <= 12) { const m = pow10(a), lo = a % m, hi = a - lo; if (!lo) return [`${fmt(hi / m)} × ${b} = ${fmt(hi / m * b)}, dann × ${fmt(m)} = ${fmt(p)}`];
    return [`${fmt(a)} = ${fmt(hi)} + ${fmt(lo)}`, `${fmt(hi)} × ${b} = ${fmt(hi * b)}`, `${fmt(lo)} × ${b} = ${fmt(lo * b)}`, `${fmt(hi * b)} + ${fmt(lo * b)} = ${fmt(p)}`]; }
  const bu = b % 10, bt = b - bu;
  if (!bu) return [`${fmt(a)} × ${fmt(bt / 10)} = ${fmt(a * bt / 10)}`, `× 10 = ${fmt(p)}`];
  return [`${fmt(b)} = ${fmt(bt)} + ${bu}`, `${fmt(a)} × ${fmt(bt)} = ${fmt(a * bt)}`, `${fmt(a)} × ${bu} = ${fmt(a * bu)}`, `${fmt(a * bt)} + ${fmt(a * bu)} = ${fmt(p)}`];
}
function wDiv(n, b) {
  const q = rnd(n / b);
  if (!Number.isInteger(b)) { const f = 10 ** decs(b); return [`Beide mal ${f}, damit der Teiler ganz wird: ${fmt(rnd(n * f))} ÷ ${fmt(b * f)}`, ...wDiv(rnd(n * f), Math.round(b * f))]; }
  if (!Number.isInteger(n)) { const f = 10 ** decs(n); return [`Ohne Komma: ${fmt(Math.round(n * f))} ÷ ${b} = ${fmt(Math.round(n * f) / b)}`, `Komma zurück: ${fmt(q)}`]; }
  if (b === 5) return [`÷ 5 = × 2, dann ÷ 10`, `${fmt(n)} × 2 = ${fmt(n * 2)}`, `÷ 10 = ${fmt(q)}`];
  if (b === 25) return [`÷ 25 = × 4, dann ÷ 100`, `${fmt(n)} × 4 = ${fmt(n * 4)}`, `÷ 100 = ${fmt(q)}`];
  if (!Number.isInteger(q)) { const w = Math.floor(n / b), r = n - w * b; return [`${b} × ${fmt(w)} = ${fmt(w * b)}, Rest ${r}`, `${r} ÷ ${b} = ${fmt(rnd(r / b))}`, `${fmt(w)} + ${fmt(rnd(r / b))} = ${fmt(q)}`]; }
  if (b % 10 === 0 && n % 10 === 0) return [`Beide Nullen streichen: ${fmt(n / 10)} ÷ ${fmt(b / 10)} = ${fmt(q)}`];
  if (q <= 12) return [`Rückwärts: ${fmt(b)} × ${q} = ${fmt(n)}`];
  const m = pow10(q), lo = q % m, hi = q - lo;
  if (!lo) return [`${fmt(b)} × ${fmt(hi)} = ${fmt(n)}`];
  return [`${fmt(n)} = ${fmt(b * hi)} + ${fmt(b * lo)}`, `${fmt(b * hi)} ÷ ${b} = ${fmt(hi)}`, `${fmt(b * lo)} ÷ ${b} = ${fmt(lo)}`, `${fmt(hi)} + ${fmt(lo)} = ${fmt(q)}`];
}
function wPct(p, b) {
  const one = rnd(b / 100), ten = rnd(b / 10), res = rnd(b * p / 100);
  if (p >= 100 && p !== 100) { const rest = rnd(p - 100); return [`${fmt(p)} % = 100 % + ${fmt(rest)} %`, ...wPct(rest, b), `${fmt(b)} + ${fmt(rnd(b * rest / 100))} = ${fmt(res)}`]; }
  if (p === 50) return [`50 % = die Hälfte: ${fmt(b)} ÷ 2 = ${fmt(res)}`];
  if (p === 25) return [`25 % = ein Viertel: ${fmt(b)} ÷ 4 = ${fmt(res)}`];
  if (p === 75) return [`25 % = ${fmt(b / 4)}`, `75 % = 3 × ${fmt(b / 4)} = ${fmt(res)}`];
  if (p === 12.5) return [`12,5 % = ein Achtel: ${fmt(b)} ÷ 8 = ${fmt(res)}`];
  if (p === 20) return [`20 % = ein Fünftel: ${fmt(b)} ÷ 5 = ${fmt(res)}`];
  if (b % 100 && p < 50 && Number.isInteger(p) && 100 % b !== 0 && b < 100) return [`Tauschen: ${fmt(p)} % von ${fmt(b)} = ${fmt(b)} % von ${fmt(p)}`, `${fmt(b)} % von ${fmt(p)} = ${fmt(res)}`];
  if (p < 10) return p === 5 ? [`10 % = ${fmt(ten)}`, `5 % = die Hälfte davon = ${fmt(res)}`] : [`1 % = ${fmt(one)}`, `${fmt(p)} % = ${fmt(p)} × ${fmt(one)} = ${fmt(res)}`];
  if (p % 10 === 9) return [`1 % = ${fmt(one)}`, `${p + 1} % = ${fmt(rnd(one * (p + 1)))}`, `${p} % = ${fmt(rnd(one * (p + 1)))} − ${fmt(one)} = ${fmt(res)}`];
  const tn = Math.floor(p / 10), o = rnd(p - tn * 10), s = [`10 % = ${fmt(ten)}`];
  if (tn > 1) s.push(`${tn * 10} % = ${tn} × ${fmt(ten)} = ${fmt(rnd(ten * tn))}`);
  if (o === 5) s.push(`5 % = die Hälfte von 10 % = ${fmt(rnd(ten / 2))}`);
  else if (o) s.push(`1 % = ${fmt(one)}, also ${fmt(o)} % = ${fmt(rnd(one * o))}`);
  if (o) s.push(`zusammen: ${fmt(res)}`);
  return s;
}
function wSq(a) {
  if (!Number.isInteger(a)) { const k = decs(a), A = Math.round(a * 10 ** k); return [`Ohne Komma: ${A}² = ${fmt(A * A)}`, `${2 * k} Nachkommastellen: ${fmt(rnd(a * a))}`]; }
  a = Math.abs(a);
  if (a <= 12) return [`Einmaleins: ${a} × ${a} = ${a * a}`];
  if (a % 10 === 5) { const n = (a - 5) / 10; return [`Endziffer 5: ${n} × ${n + 1} = ${n * (n + 1)}`, `25 anhängen: ${fmt(a * a)}`]; }
  let R = Math.round(a / 10) * 10; if (Math.abs(a - 50) <= 5) R = 50; if (Math.abs(a - 100) <= 15) R = 100;
  const k = a - R, ak = Math.abs(k);
  if (!k) return [`${R}² = ${fmt(R * R)}`];
  return [`${a} = ${R} ${k > 0 ? '+' : '−'} ${ak}`, `${R}² = ${fmt(R * R)}, 2 × ${R} × ${ak} = ${fmt(2 * R * ak)}, ${ak}² = ${ak * ak}`, `${fmt(R * R)} ${k > 0 ? '+' : '−'} ${fmt(2 * R * ak)} + ${ak * ak} = ${fmt(a * a)}`];
}
function wSqrt(n, a) {
  if (a <= 12) return [`Einmaleins: ${a} × ${a} = ${n}`];
  const end = { 0: '0', 1: '1 oder 9', 4: '2 oder 8', 5: '5', 6: '4 oder 6', 9: '3 oder 7' }[n % 10], t = Math.floor(a / 10) * 10;
  return [`${fmt(t * t)} < ${fmt(n)} < ${fmt((t + 10) ** 2)}, also zwischen ${t} und ${t + 10}`, `Endziffer ${n % 10} → Wurzel endet auf ${end}`, `${t + 5}² = ${fmt((t + 5) ** 2)} → ${n > (t + 5) ** 2 ? 'darüber' : 'darunter'}, also ${a}`];
}
function wPow2(n) {
  if (n <= 10) return [`Verdoppeln: ${[...Array(n)].map((_, i) => fmt(2 ** (i + 1))).join(', ')}`];
  return [`2¹⁰ = 1.024`, `2${sup(n - 10)} = ${fmt(2 ** (n - 10))}`, `1.024 × ${fmt(2 ** (n - 10))} = ${fmt(2 ** n)}`];
}
const sigRound = x => { const m = 10 ** (Math.floor(Math.log10(Math.abs(x))) - 1); return Math.round(x / m) * m; };

/* ---------- banks ---------- */
const BANK = {
  add: [
    [s => { const a = ri(3, [12, 30, 60][s]), b = ri(2, [9, 25, 40][s]); return mkQ(`${a} + ${b}`, a + b, wAdd(a, b)); },
     s => { const a = ri(10, [20, 50, 99][s]), b = ri(2, a - 1); return mkQ(`${a} − ${b}`, a - b, wSub(a, b)); },
     s => { const a = ri(6, [25, 50, 120][s]); return mkQ(`Das Doppelte von ${a}`, 2 * a, [`${a} + ${a} = ${2 * a}`]); },
     s => { const a = 2 * ri(5, [20, 50, 99][s]); return mkQ(`Die Hälfte von ${a}`, a / 2, [`${a} ÷ 2 = ${a / 2}`]); },
     s => { const a = ri(11, 89); return mkQ(`${a} + ? = 100`, 100 - a, [`Zum nächsten Zehner: ${a} + ${10 - a % 10 === 10 ? 0 : 10 - a % 10} = ${Math.ceil(a / 10) * 10}`, `bis 100 noch ${100 - Math.ceil(a / 10) * 10}, zusammen ${100 - a}`]); },
     s => { const a = ri(1, 9) * 10, b = ri(1, 9) * 10; return mkQ(`${a} + ${b}`, a + b, [`${a / 10} + ${b / 10} Zehner = ${(a + b) / 10} Zehner = ${a + b}`]); }],
    [s => { const a = ri(100, [300, 600, 900][s]), b = ri(25, [199, 399, 699][s]); return mkQ(`${fmt(a)} + ${fmt(b)}`, a + b, wAdd(a, b)); },
     s => { const a = ri(200, [500, 800, 999][s]), b = ri(25, a - 10); return mkQ(`${fmt(a)} − ${fmt(b)}`, a - b, wSub(a, b)); },
     s => { const a = ri(101, 989); return mkQ(`${a} + ? = 1.000`, 1000 - a, [`Bis zum nächsten Hunderter: ${Math.ceil(a / 100) * 100 - a}`, `dann bis 1.000: ${1000 - Math.ceil(a / 100) * 100}`, `zusammen ${1000 - a}`]); },
     s => { const a = ri(105, 990) / 100, b = ri(105, 990) / 100; return mkQ(`${eur(a)} + ${eur(b)}`, a + b, wAdd(a, b)); },
     s => { const a = ri(1000, 9999) / 100 + 10, b = ri(105, 990) / 100; return mkQ(`${eur(rnd(a, 2))} − ${eur(b)}`, rnd(a, 2) - b, wSub(rnd(a, 2), b)); },
     s => { const h1 = ri(1, 3), m1 = ri(1, 11) * 5, m2 = ri(4, 11) * 5; return mkQ(`${h1} h ${m1} min + ${m2} min = ? min`, h1 * 60 + m1 + m2, [`${h1} h = ${h1 * 60} min`, `${h1 * 60} + ${m1} + ${m2} = ${h1 * 60 + m1 + m2}`]); },
     s => { const a = ri(120, 499); return mkQ(`Das Doppelte von ${a}`, 2 * a, [`${a - a % 100} × 2 = ${2 * (a - a % 100)}`, `${a % 100} × 2 = ${2 * (a % 100)}`, `zusammen ${2 * a}`]); }],
    [s => { const a = ri(1000, [3000, 6000, 9000][s]), b = ri(250, [1999, 3999, 5999][s]); return mkQ(`${fmt(a)} + ${fmt(b)}`, a + b, wAdd(a, b)); },
     s => { const a = ri(2000, [5000, 8000, 9999][s]), b = ri(250, a - 100); return mkQ(`${fmt(a)} − ${fmt(b)}`, a - b, wSub(a, b)); },
     s => { const a = ri(100, 900), b = ri(100, 900), c = ri(50, Math.min(a + b, 900)); return mkQ(`${a} + ${b} − ${c}`, a + b - c, [...wAdd(a, b), ...wSub(a + b, c)]); },
     s => { const a = ri(11, 99) / 10, b = ri(11, 99) / 10; return chance(.5) ? mkQ(`${fmt(a)} + ${fmt(b)}`, a + b, wAdd(a, b)) : mkQ(`${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))}`, Math.max(a, b) - Math.min(a, b), wSub(Math.max(a, b), Math.min(a, b))); },
     s => { const a = -ri(15, 150), b = ri(20, 250); return mkQ(`${fmt(a)} + ${fmt(b)}`, a + b, [`= ${fmt(b)} − ${fmt(-a)}`, ...wSub(b, -a)]); },
     s => { const h1 = ri(1, 4), m1 = ri(1, 11) * 5, h2 = ri(1, 3), m2 = ri(1, 11) * 5; return mkQ(`${h1} h ${m1} min + ${h2} h ${m2} min = ? min`, (h1 + h2) * 60 + m1 + m2, [`Stunden: ${h1 + h2} h = ${(h1 + h2) * 60} min`, `Minuten: ${m1} + ${m2} = ${m1 + m2}`, `zusammen ${(h1 + h2) * 60 + m1 + m2} min`]); }],
    [s => { const a = ri(10000, 60000), b = ri(2500, 39999); return mkQ(`${fmt(a)} + ${fmt(b)}`, a + b, wAdd(a, b)); },
     s => { const a = ri(20000, 99999), b = ri(2500, a - 1000); return mkQ(`${fmt(a)} − ${fmt(b)}`, a - b, wSub(a, b)); },
     s => { const a = ri(1000, 9000), b = ri(1000, 9000), c = ri(500, 9000); return mkQ(`${fmt(a)} − ${fmt(c)} + ${fmt(b)}`, a - c + b, [...wSub(a, c), ...wAdd(a - c, b)]); },
     s => { const a = ri(101, 999) / 100, b = ri(101, 999) / 100, c = ri(11, 99) / 10; return mkQ(`${fmt(a)} + ${fmt(b)} − ${fmt(c)}`, a + b - c, [`${fmt(a)} + ${fmt(b)} = ${fmt(rnd(a + b))}`, `${fmt(rnd(a + b))} − ${fmt(c)} = ${fmt(rnd(a + b - c))}`]); },
     s => { const a = -ri(150, 900), b = ri(100, 900); return mkQ(`Abstand zwischen ${fmt(a)} und ${fmt(b)}`, b - a, [`Von ${fmt(a)} bis 0: ${fmt(-a)}`, `von 0 bis ${fmt(b)}: ${fmt(b)}`, `${fmt(-a)} + ${fmt(b)} = ${fmt(b - a)}`]); },
     s => { const n = [ri(40, 99), ri(40, 99), ri(40, 99)]; n.push(ri(40, 99)); const sum = n.reduce((x, y) => x + y, 0); const adj = (4 - sum % 4) % 4; n[3] += adj; const S = sum + adj;
       return mkQ(`Mittelwert von ${n.join(', ')}`, S / 4, [`Summe: ${n.join(' + ')} = ${S}`, `${S} ÷ 4 = ${S / 4}`]); }],
  ],
  mul: [
    [s => { const a = ri(2, [6, 9, 10][s]), b = ri(2, [6, 10, 10][s]); return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = ri(2, 12), b = ri(11, 12); return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = ri(2, 99), z = pick([10, 100]); return mkQ(`${a} × ${fmt(z)}`, a * z, [`${z === 10 ? 'Eine Null' : 'Zwei Nullen'} anhängen: ${fmt(a * z)}`]); },
     s => { const a = ri(2, 9) * 10, b = ri(2, 9); return mkQ(`${a} × ${b}`, a * b, [`${a / 10} × ${b} = ${a / 10 * b}`, `Null anhängen: ${a * b}`]); }],
    [s => { const a = ri(12, [29, 59, 99][s]), b = ri(3, 9); return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = ri(12, 98); return mkQ(`${a} × 5`, a * 5, wMul(a, 5)); },
     s => { const a = ri(12, 98); return mkQ(`${a} × 9`, a * 9, wMul(a, 9)); },
     s => { const a = ri(12, [45, 70, 99][s]); return mkQ(`${a} × 11`, a * 11, wMul(a, 11)); },
     s => { const a = ri(11, 49), b = ri(2, 9) * 10; return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = ri(101, 499); return mkQ(`${a} × 2`, a * 2, wMul(a, 2)); }],
    [s => { const a = ri(11, [25, 35, 45][s]), b = ri(11, [19, 29, 39][s]); return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = ri(3, 48) * (chance(.5) ? 4 : 1); return mkQ(`${a} × 25`, a * 25, wMul(a, 25)); },
     s => { const a = ri(12, 75), b = pick([19, 29, 39, 49, 21, 31]); return mkQ(`${a} × ${b}`, a * b, b % 10 === 1 ? [`${b} = ${b - 1} + 1`, `${a} × ${b - 1} = ${fmt(a * (b - 1))}`, `+ ${a} = ${fmt(a * b)}`] : wMul(a, b)); },
     s => { const m = pick([20, 30, 40, 50, 60]), k = ri(1, 8); return mkQ(`${m + k} × ${m - k}`, (m + k) * (m - k), wMul(m + k, m - k)); },
     s => { const a = ri(101, 999), b = ri(3, 9); return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = pick([1.5, 2.5, 0.5, 1.2, 3.5, 4.5]), b = ri(4, 40) * 2; return mkQ(`${fmt(a)} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = ri(12, 80); return mkQ(`${a} × 15`, a * 15, wMul(a, 15)); }],
    [s => { const a = ri(31, 99), b = ri(31, 99); return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = pick([125, 150, 175, 225, 250, 120, 140]), b = ri(4, 24); return mkQ(`${a} × ${b}`, a * b, wMul(a, b)); },
     s => { const a = ri(12, 99), b = pick([99, 101, 98, 102]); return mkQ(`${a} × ${b}`, a * b, b > 100 ? [`${b} = 100 + ${b - 100}`, `${a} × 100 = ${fmt(a * 100)}`, `${a} × ${b - 100} = ${a * (b - 100)}`, `zusammen ${fmt(a * b)}`] : wMul(a, b)); },
     s => { const a = ri(11, 35) / 10, b = pick([1.2, 1.5, 2.4, 0.8, 3.5, 0.6]); return mkQ(`${fmt(a)} × ${fmt(b)}`, a * b, wMul(a, b)); },
     s => { const f = pick([0.25, 0.75, 0.2, 0.4]), b = ri(5, 80) * 4; return mkQ(`${fmt(f)} × ${fmt(b)}`, f * b, f === 0.25 ? [`× 0,25 = ÷ 4: ${fmt(b / 4)}`] : f === 0.75 ? [`÷ 4 = ${fmt(b / 4)}`, `× 3 = ${fmt(f * b)}`] : [`× ${fmt(f * 10)} = ${fmt(f * 10 * b)}`, `÷ 10 = ${fmt(f * b)}`]); },
     s => { const a = pick([0.03, 0.04, 0.06, 0.002, 0.3, 0.05]), b = pick([2000, 4000, 600, 7000, 50000, 900]); return mkQ(`${fmt(a)} × ${fmt(b)}`, a * b, wMul(a, b)); },
     s => { const a = ri(11, 25), b = ri(11, 25), c = pick([2, 4, 5]); return mkQ(`${a} × ${b} × ${c}`, a * b * c, [`Erst die leichte Zahl: ${a} × ${c} = ${a * c}`, ...wMul(a * c, b)]); }],
  ],
  div: [
    [s => { const b = ri(2, [5, 9, 10][s]), q = ri(2, [9, 10, 12][s]); return mkQ(`${b * q} ÷ ${b}`, q, wDiv(b * q, b)); },
     s => { const q = ri(2, 99), z = pick([10, 100]); return mkQ(`${fmt(q * z)} ÷ ${fmt(z)}`, q, [`${z === 10 ? 'Eine Null' : 'Zwei Nullen'} streichen: ${q}`]); },
     s => { const b = ri(2, 9), q = ri(2, 9) * 10; return mkQ(`${b * q} ÷ ${b}`, q, [`${b * q / 10} ÷ ${b} = ${q / 10}`, `× 10 = ${q}`]); }],
    [s => { const b = ri(3, 9), q = ri(11, [25, 45, 99][s]); return mkQ(`${b * q} ÷ ${b}`, q, wDiv(b * q, b)); },
     s => { const q = ri(12, 199); return mkQ(`${q * 5} ÷ 5`, q, wDiv(q * 5, 5)); },
     s => { const b = ri(2, 9) * 10, q = ri(2, 12); return mkQ(`${fmt(b * q)} ÷ ${b}`, q, wDiv(b * q, b)); },
     s => { const b = pick([2, 4, 5]), n = ri(3, 49); return Number.isInteger(n / b) ? mkQ(`${n} ÷ ${b}`, n / b, wDiv(n, b)) : mkQ(`${n} ÷ ${b}`, n / b, wDiv(n, b)); }],
    [s => { const b = ri(11, [15, 19, 25][s]), q = ri(4, [12, 20, 30][s]); return mkQ(`${b * q} ÷ ${b}`, q, wDiv(b * q, b)); },
     s => { const q = ri(4, 80); return mkQ(`${fmt(q * 25)} ÷ 25`, q, wDiv(q * 25, 25)); },
     s => { const d = pick([0.5, 0.25, 0.2]), n = ri(3, 60); return mkQ(`${n} ÷ ${fmt(d)}`, n / d, [`÷ ${fmt(d)} heißt: wie oft passt ${fmt(d)} hinein → × ${1 / d}`, `${n} × ${1 / d} = ${fmt(n / d)}`]); },
     s => { const [n, b] = pick([[9, 4], [13, 8], [7, 8], [11, 4], [17, 5], [21, 8], [3, 16], [27, 4]]); return mkQ(`${n} ÷ ${b}`, n / b, wDiv(n, b)); },
     s => { const b = pick([12, 15, 16, 18, 24]), q = ri(5, 30); return mkQ(`Wie oft passt ${b} in ${fmt(b * q)}?`, q, wDiv(b * q, b)); }],
    [s => { const b = ri(12, [30, 45, 75][s]), q = ri(12, [40, 60, 99][s]); return mkQ(`${fmt(b * q)} ÷ ${b}`, q, wDiv(b * q, b)); },
     s => { const d = pick([1.5, 0.2, 2.5, 0.4, 0.8, 1.2]), q = ri(3, 40); return mkQ(`${fmt(rnd(d * q))} ÷ ${fmt(d)}`, q, wDiv(rnd(d * q), d)); },
     s => { const b = pick([0.4, 0.6, 0.3, 0.7, 0.9]), q = ri(2, 12); return mkQ(`${fmt(rnd(b * q))} ÷ ${fmt(b)}`, q, wDiv(rnd(b * q), b)); },
     s => { const [n, b] = pick([[17, 8], [23, 16], [19, 4], [33, 8], [47, 20], [7, 16], [29, 25], [61, 40]]); return mkQ(`${n} ÷ ${b}`, n / b, wDiv(n, b)); },
     s => { const b = ri(3, 9), q = ri(1001, 3333); return mkQ(`${fmt(b * q)} ÷ ${b}`, q, wDiv(b * q, b)); }],
  ],
  pct: [
    [s => { const p = pick([10, 50, 25]), b = ri(2, [10, 20, 40][s]) * 20; return mkQ(`${p} % von ${fmt(b)}`, b * p / 100, wPct(p, b)); },
     s => { const b = ri(2, 30) * 10; return mkQ(`10 % von ${fmt(b)}`, b / 10, [`10 % = Komma eine Stelle nach links: ${fmt(b / 10)}`]); },
     s => { const b = ri(2, 30) * 5; return mkQ(`20 % von ${fmt(b)}`, b / 5, wPct(20, b)); },
     s => { const b = ri(2, 20) * 100; return mkQ(`1 % von ${fmt(b)}`, b / 100, [`1 % = Komma zwei Stellen nach links: ${fmt(b / 100)}`]); }],
    [s => { const p = pick([5, 15, 30, 40, 75, 12.5, 60]), b = ri(2, 30) * 40; return mkQ(`${fmt(p)} % von ${fmt(b)}`, b * p / 100, wPct(p, b)); },
     s => { const p = pick([10, 20, 25, 50]), b = ri(2, 40) * 20; return mkQ(`${fmt(b)} + ${p} %`, b * (100 + p) / 100, [...wPct(p, b), `${fmt(b)} + ${fmt(b * p / 100)} = ${fmt(b * (100 + p) / 100)}`]); },
     s => { const p = pick([10, 20, 25, 50, 30]), b = ri(2, 40) * 20; return mkQ(`${fmt(b)} − ${p} %`, b * (100 - p) / 100, [...wPct(p, b), `${fmt(b)} − ${fmt(b * p / 100)} = ${fmt(b * (100 - p) / 100)}`]); },
     s => { const b = pick([20, 25, 40, 50, 80]), k = ri(1, b - 1), pct = rnd(k / b * 100); return Number.isInteger(pct * 10) ? mkQ(`${k} von ${b} in %?`, pct, [`${k} ÷ ${b} = ${fmt(rnd(k / b))}`, `× 100 = ${fmt(pct)} %`]) : mkQ(`${b / 2} von ${b} in %?`, 50, ['Die Hälfte = 50 %']); }],
    [s => { const p = pick([19, 7, 3, 2, 35, 45, 65, 8, 16, 95]), b = ri(3, 99) * 100; return mkQ(`${p} % von ${fmt(b)}`, b * p / 100, wPct(p, b)); },
     s => { const p = pick([15, 35, 12, 8, 45]), b = ri(4, 60) * 20; return mkQ(`${fmt(b)} + ${p} %`, rnd(b * (100 + p) / 100), [...wPct(p, b), `${fmt(b)} + ${fmt(rnd(b * p / 100))} = ${fmt(rnd(b * (100 + p) / 100))}`]); },
     s => { const b = pick([60, 120, 150, 240, 80, 160, 200]), k = ri(1, b / 4) * 4, pct = rnd(k / b * 100, 2); return mkQ(`${k} von ${b} in %?`, pct, [`${k} ÷ ${b} = ${fmt(rnd(k / b, 4))}`, `× 100 = ${fmt(pct)} %`]); },
     s => { const p = pick([5, 10, 20, 25, 40]), base = ri(4, 60) * 20, part = base * p / 100; return mkQ(`${fmt(part)} sind ${p} % von …?`, base, [`${p} % = ${fmt(part)}`, `1 % = ${fmt(rnd(part / p))}`, `100 % = ${fmt(base)}`]); },
     s => { const p = pick([120, 150, 110, 125, 200]), b = ri(2, 40) * 20; return mkQ(`${p} % von ${fmt(b)}`, b * p / 100, wPct(p, b)); }],
    [s => { const a = ri(4, 90) * 100, k = pick([-40, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30, 40, 50, 60]), b = a * (100 + k) / 100;
       return mkQ(`Von ${fmt(a)} auf ${fmt(b)}: Veränderung in %?`, k, [`Differenz: ${fmt(b - a)}`, `${fmt(b - a)} ÷ ${fmt(a)} = ${fmt(k / 100)}`, `= ${k} %`]); },
     s => { const p = pick([2.5, 12.5, 7.5, 0.5, 1.5]), b = ri(2, 50) * 200; return mkQ(`${fmt(p)} % von ${fmt(b)}`, rnd(b * p / 100), [`1 % = ${fmt(b / 100)}`, `${fmt(p)} % = ${fmt(p)} × ${fmt(b / 100)} = ${fmt(rnd(b * p / 100))}`]); },
     s => { const p = pick([3, 5, 8, 15, 12.5]), base = ri(4, 80) * 40, part = rnd(base * p / 100); return mkQ(`${fmt(part)} sind ${fmt(p)} % von …?`, base, [`1 % = ${fmt(part)} ÷ ${fmt(p)} = ${fmt(rnd(part / p))}`, `100 % = ${fmt(base)}`]); },
     s => { const b = ri(2, 50) * 100, p = pick([10, 20, 25, 50]); const up = b * (100 + p) / 100, res = up * (100 - p) / 100;
       return mkQ(`${fmt(b)} erst + ${p} %, dann − ${p} %`, res, [`+ ${p} %: ${fmt(up)}`, `− ${p} % von ${fmt(up)} = − ${fmt(up * p / 100)}`, `= ${fmt(res)} (nicht wieder ${fmt(b)}!)`]); },
     s => { const pm = pick([0.5, 0.8, 1.2, 1.5, 2]), b = ri(2, 40) * 1000; return mkQ(`${fmt(pm)} ‰ von ${fmt(b)}`, b * pm / 1000, [`1 ‰ = ein Tausendstel: ${fmt(b / 1000)}`, `× ${fmt(pm)} = ${fmt(rnd(b * pm / 1000))}`]); }],
  ],
  frac: [
    [s => { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [1, 5], [1, 10]]), b = d * ri(2, [6, 10, 15][s]); return mkQ(`${n}/${d} von ${b}`, b * n / d, [`${b} ÷ ${d} = ${b / d}`, ...(n > 1 ? [`× ${n} = ${b * n / d}`] : [])]); },
     s => { const b = ri(3, 49); return mkQ(`0,5 × ${b}`, b / 2, [`× 0,5 = halbieren: ${fmt(b / 2)}`]); },
     s => { const [n, d, p] = pick([[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [1, 10, 10], [2, 5, 40]]); return mkQ(`${n}/${d} in %`, p, [`${n}/${d} = ${fmt(n / d)}`, `× 100 = ${p} %`]); }],
    [s => { const [n, d] = pick([[3, 8], [2, 5], [3, 5], [5, 6], [4, 5], [7, 8], [5, 8], [3, 10], [7, 10]]), b = d * ri(3, 15); return mkQ(`${n}/${d} von ${b}`, b * n / d, [`${b} ÷ ${d} = ${b / d}`, `× ${n} = ${b * n / d}`]); },
     s => { const f = pick([0.25, 0.75, 0.2, 0.1, 1.5]), b = ri(4, 60) * 4; return mkQ(`${fmt(f)} × ${b}`, f * b, wMul(f, b)); },
     s => { const [n, d] = pick([[3, 4], [2, 5], [1, 8], [4, 5], [3, 20], [1, 25]]); return mkQ(`${n}/${d} als Dezimalzahl`, n / d, [`Auf Hundertstel erweitern: ${n}/${d} = ${fmt(n * 100 / d)}/100`, `= ${fmt(n / d)}`]); },
     s => { const x = ri(1, 99) / 100; return mkQ(`${fmt(x)} in %`, rnd(x * 100), [`× 100: ${fmt(rnd(x * 100))} %`]); },
     s => { const [a, b] = pick([[[1, 2], [1, 4]], [[1, 4], [1, 4]], [[1, 2], [1, 3]], [[3, 4], [1, 4]], [[1, 5], [1, 2]]]); return mkQ(`${a[0]}/${a[1]} + ${b[0]}/${b[1]} (als Dezimalzahl)`, rnd(a[0] / a[1] + b[0] / b[1], 4), [`${a[0]}/${a[1]} = ${fmt(rnd(a[0] / a[1], 4))}, ${b[0]}/${b[1]} = ${fmt(rnd(b[0] / b[1], 4))}`, `zusammen ${fmt(rnd(a[0] / a[1] + b[0] / b[1], 4))}`]); }],
    [s => { const [n, d] = pick([[3, 8], [5, 8], [7, 8], [1, 16], [3, 16], [3, 20], [7, 25], [9, 40], [5, 4], [11, 8]]); return mkQ(`${n}/${d} als Dezimalzahl`, n / d, d % 8 === 0 || d === 16 || d === 40 ? [`1/${d} = ${fmt(1 / d)}`, `× ${n} = ${fmt(n / d)}`] : [`Auf Hundertstel erweitern: ${n}/${d} = ${fmt(n * 100 / d)}/100 = ${fmt(n / d)}`]); },
     s => { const x = ri(11, 35) / 10, y = pick([0.5, 1.2, 1.5, 2.5, 0.4, 0.8]); return mkQ(`${fmt(x)} × ${fmt(y)}`, x * y, wMul(x, y)); },
     s => { const d = pick([0.4, 0.6, 0.3, 0.8, 1.2]), q = ri(2, 12); return mkQ(`${fmt(rnd(d * q))} ÷ ${fmt(d)}`, q, wDiv(rnd(d * q), d)); },
     s => { const [n, d] = pick([[2, 3], [3, 4], [2, 5], [5, 6]]), b = rnd(d * ri(1, 9) / 10); return mkQ(`${n}/${d} von ${fmt(b)}`, rnd(b * n / d), [`${fmt(b)} ÷ ${d} = ${fmt(rnd(b / d))}`, `× ${n} = ${fmt(rnd(b * n / d))}`]); },
     s => { const [a, b] = pick([[[1, 4], [3, 8]], [[2, 5], [1, 4]], [[1, 8], [3, 4]], [[1, 2], [5, 8]], [[3, 5], [1, 10]]]); return mkQ(`${a[0]}/${a[1]} + ${b[0]}/${b[1]} (als Dezimalzahl)`, rnd(a[0] / a[1] + b[0] / b[1], 4), [`${a[0]}/${a[1]} = ${fmt(rnd(a[0] / a[1], 4))}, ${b[0]}/${b[1]} = ${fmt(rnd(b[0] / b[1], 4))}`, `zusammen ${fmt(rnd(a[0] / a[1] + b[0] / b[1], 4))}`]); }],
    [s => { const [a, b] = pick([[[7, 8], [1, 16]], [[3, 5], [3, 20]], [[5, 8], [1, 3]], [[5, 6], [1, 4]], [[2, 3], [1, 8]]]); const v = a[0] / a[1] - b[0] / b[1];
       return Number.isInteger(rnd(v * 1000, 4)) ? mkQ(`${a[0]}/${a[1]} − ${b[0]}/${b[1]} (als Dezimalzahl)`, rnd(v, 4), [`${a[0]}/${a[1]} = ${fmt(rnd(a[0] / a[1], 4))}, ${b[0]}/${b[1]} = ${fmt(rnd(b[0] / b[1], 4))}`, `Differenz ${fmt(rnd(v, 4))}`]) : mkQ(`7/8 − 1/16 (als Dezimalzahl)`, 0.8125, ['7/8 = 0,875, 1/16 = 0,0625', 'Differenz 0,8125']); },
     s => { const x = pick([0.125, 0.375, 1.25, 0.625, 2.25, 0.875]), y = pick([8, 16, 24, 32, 1.6, 4.8, 0.8]); return mkQ(`${fmt(x)} × ${fmt(y)}`, x * y, x === 0.125 ? [`0,125 = 1/8 → ${fmt(y)} ÷ 8 = ${fmt(rnd(y / 8))}`] : x === 1.25 ? [`1,25 = 5/4 → ${fmt(y)} ÷ 4 × 5 = ${fmt(rnd(x * y))}`] : wMul(x, y)); },
     s => { const [n, d] = pick([[3, 8], [5, 8], [1, 8], [7, 8], [1, 16], [5, 16], [2, 3]]); return mkQ(`${n}/${d} in % (auf 1 Nachkommastelle)`, rnd(n / d * 100, 1), [`1/${d} = ${fmt(rnd(100 / d, 4))} %`, `× ${n} = ${fmt(rnd(n / d * 100, 1))} %`]); },
     s => { const x = pick([0.125, 0.25, 0.2, 0.04, 0.0625, 2.5, 0.8, 1.25]); return mkQ(`Kehrwert von ${fmt(x)}`, 1 / x, [`1 ÷ ${fmt(x)}`, `${fmt(x)} = ${({ 0.125: '1/8', 0.25: '1/4', 0.2: '1/5', 0.04: '1/25', 0.0625: '1/16', 2.5: '5/2', 0.8: '4/5', 1.25: '5/4' })[x]} → umdrehen: ${fmt(1 / x)}`]); },
     s => { const a = ri(11, 49) / 10, b = pick([1.25, 0.75, 2.5, 0.125]); return mkQ(`${fmt(a)} × ${fmt(b)}`, rnd(a * b), wMul(a, b)); }],
  ],
  pow: [
    [s => { const a = ri(2, [9, 12, 15][s]); return mkQ(`${a}²`, a * a, wSq(a)); },
     s => { const a = ri(2, 12); return mkQ(`√${a * a}`, a, [`Welche Zahl mal sich selbst ergibt ${a * a}? ${a} × ${a}`]); },
     s => { const n = pick([2, 3]), b = pick([10, 2, 3, 5]); return mkQ(`${b}${sup(n)}`, b ** n, [`${Array(n).fill(b).join(' × ')} = ${fmt(b ** n)}`]); }],
    [s => { const a = ri(11, [20, 25, 35][s]); return mkQ(`${a}²`, a * a, wSq(a)); },
     s => { const a = ri(13, 25); return mkQ(`√${a * a}`, a, wSqrt(a * a, a)); },
     s => { const n = ri(3, 10); return mkQ(`2${sup(n)}`, 2 ** n, wPow2(n)); },
     s => { const a = 10 * ri(1, 9) + 5; return mkQ(`${a}²`, a * a, wSq(a)); },
     s => { const a = ri(2, 6); return mkQ(`${a}³`, a ** 3, [`${a}² = ${a * a}`, `× ${a} = ${a ** 3}`]); }],
    [s => { const a = ri(21, [40, 50, 60][s]); return mkQ(`${a}²`, a * a, wSq(a)); },
     s => { const a = ri(26, 50); return mkQ(`√${fmt(a * a)}`, a, wSqrt(a * a, a)); },
     s => { const a = ri(4, 10); return mkQ(`${a}³`, a ** 3, [`${a}² = ${a * a}`, ...wMul(a * a, a).slice(-1)]); },
     s => { const n = ri(8, 16); return mkQ(`2${sup(n)}`, 2 ** n, wPow2(n)); },
     s => { const n = ri(3, 6); return mkQ(`3${sup(n)}`, 3 ** n, [`Verdreifachen: ${[...Array(n)].map((_, i) => fmt(3 ** (i + 1))).join(', ')}`]); },
     s => { const a = ri(11, 25) / 10; return mkQ(`${fmt(a)}²`, a * a, wSq(a)); },
     s => { const a = ri(4, 15); return mkQ(`(−${a})²`, a * a, [`Minus mal minus ist plus: ${a}² = ${a * a}`]); }],
    [s => { const a = RNG() < .5 ? ri(41, 99) : ri(95, 125); return mkQ(`${a}²`, a * a, wSq(a)); },
     s => { const a = ri(51, 99); return mkQ(`√${fmt(a * a)}`, a, wSqrt(a * a, a)); },
     s => { const a = ri(11, 15); return mkQ(`${a}³`, a ** 3, [`${a}² = ${a * a}`, ...wMul(a * a, a)]); },
     s => { const a = pick([0.3, 0.7, 0.9, 1.2, 0.04, 0.5, 1.5]), n = a >= 1.2 ? 3 : 2; return mkQ(`${fmt(a)}${sup(n)}`, rnd(a ** n), n === 2 ? wSq(a) : [`${fmt(a)}² = ${fmt(rnd(a * a))}`, `× ${fmt(a)} = ${fmt(rnd(a ** 3))}`]); },
     s => { const a = ri(2, 12) / 10; return mkQ(`√${fmt(rnd(a * a))}`, a, [`Ohne Komma: √${Math.round(a * a * 100)} = ${Math.round(a * 10)}`, `Eine Nachkommastelle: ${fmt(a)}`]); },
     s => { const n = ri(17, 20); return mkQ(`2${sup(n)}`, 2 ** n, wPow2(n)); },
     s => { const n = ri(2, 4), b = pick([5, 4, 6, 7]); return mkQ(`${b}${sup(n)}`, b ** n, [`${b}² = ${b * b}`, ...(n > 2 ? [`× ${b} = ${fmt(b ** 3)}`] : []), ...(n > 3 ? [`× ${b} = ${fmt(b ** 4)}`] : [])]); }],
  ],
  tax: [
    [s => { const n = ri(1, 20) * 100; return mkQ(`Netto ${eur(n)} + 19 % USt: Brutto?`, n * 1.19, [`19 % von ${fmt(n)} = ${fmt(n / 100)} × 19 = ${fmt(n * 0.19)}`, `${fmt(n)} + ${fmt(n * 0.19)} = ${fmt(n * 1.19)}`], 'Brutto = Netto × 1,19'); },
     s => { const n = ri(1, 30) * 100; return mkQ(`19 % Umsatzsteuer auf ${eur(n)} netto?`, n * 0.19, [`1 % = ${fmt(n / 100)}`, `× 19 = ${fmt(n * 0.19)} (oder × 20 − × 1)`], 'USt = Netto × 0,19'); },
     s => { const p = pick([10, 20, 25, 50]), b = ri(2, 40) * 20; return mkQ(`${eur(b)} abzüglich ${p} % Rabatt?`, b * (100 - p) / 100, [...wPct(p, b), `${fmt(b)} − ${fmt(b * p / 100)} = ${fmt(b * (100 - p) / 100)}`]); },
     s => { const h = pick([10, 20, 30, 40, 50, 100, 8, 15]); return mkQ(`Mindestlohn 13,90 € × ${h} Stunden?`, 13.9 * h, [`14 × ${h} = ${14 * h}`, `minus 0,10 × ${h} = ${fmt(0.1 * h)}`, `= ${fmt(rnd(13.9 * h))}`], 'Mindestlohn 2026: 13,90 € pro Stunde'); },
     s => { const m = ri(2, 12); return mkQ(`Minijob-Grenze 603 € × ${m} Monate?`, 603 * m, [`600 × ${m} = ${600 * m}`, `3 × ${m} = ${3 * m}`, `= ${fmt(603 * m)}`], 'Minijob-Grenze 2026: 603 € im Monat'); },
     s => { const n = ri(1, 30) * 100; return mkQ(`Netto ${eur(n)} + 7 % USt: Brutto?`, n * 1.07, [`7 % = ${fmt(n / 100)} × 7 = ${fmt(n * 0.07)}`, `${fmt(n)} + ${fmt(n * 0.07)} = ${fmt(n * 1.07)}`], 'Ermäßigter Satz, z. B. Lebensmittel'); },
     s => { const b = ri(2, 40) * 500, p = pick([9.3, 1.3, 7.3]); const lab = { 9.3: 'Rentenversicherung', 1.3: 'Arbeitslosenversicherung', 7.3: 'Krankenversicherung (ohne Zusatzbeitrag)' }[p];
       return mkQ(`Bruttolohn ${eur(b)}: Arbeitnehmeranteil ${lab} (${fmt(p)} %)?`, b * p / 100, [`1 % = ${fmt(b / 100)}`, `× ${fmt(p)} = ${fmt(rnd(b * p / 100))}`], 'AN-Anteile: RV 9,3 %, KV 7,3 % + halber Zusatzbeitrag, AV 1,3 %'); }],
    [s => { const n = ri(1, 20) * 100; return mkQ(`Brutto ${eur(n * 1.19)} (19 %): Netto?`, n, [`${fmt(n * 1.19)} ÷ 119 = ${fmt(n / 100)} (= 1 %)`, `× 100 = ${fmt(n)}`], 'Netto = Brutto ÷ 1,19'); },
     s => { const n = ri(1, 30) * 100; return mkQ(`Brutto ${eur(n * 1.07)} (7 %): Netto?`, n, [`${fmt(n * 1.07)} ÷ 107 = ${fmt(n / 100)}`, `× 100 = ${fmt(n)}`], 'Netto = Brutto ÷ 1,07'); },
     s => { const b = ri(5, 60) * 50, p = pick([2, 3]); return mkQ(`Rechnung ${eur(b)}, ${p} % Skonto: Zahlbetrag?`, b * (100 - p) / 100, [`1 % = ${fmt(b / 100)}`, `${p} % = ${fmt(b * p / 100)}`, `${fmt(b)} − ${fmt(b * p / 100)} = ${fmt(b * (100 - p) / 100)}`]); },
     s => { const [w, y] = pick([['Firmenwagen', 6], ['Büromöbel', 13], ['Kopierer', 7]]), k = y * ri(5, 60) * 100; return mkQ(`${w} für ${eur(k)}, Nutzungsdauer ${y} Jahre: lineare AfA pro Jahr?`, k / y, wDiv(k, y), `Anschaffungskosten ÷ Nutzungsdauer (AfA-Tabelle: ${w} ${y} Jahre)`); },
     s => { const t = ri(4, 21) * 10; return mkQ(`Homeoffice-Pauschale für ${t} Tage?`, 6 * t, [`6 × ${t} = ${fmt(6 * t)}`], '6 € pro Tag, höchstens 210 Tage = 1.260 € im Jahr'); },
     s => { const b = ri(2, 30) * 10; return mkQ(`Bewirtung ${eur(b)} netto: abziehbar sind 70 %. Wie viel?`, b * 0.7, [`10 % = ${fmt(b / 10)}`, `× 7 = ${fmt(b * 0.7)}`], 'Geschäftliche Bewirtung: 70 % als Betriebsausgabe'); },
     s => { const l = ri(25, 80) * 1000; return mkQ(`Firmenwagen, Bruttolistenpreis ${eur(l)}: 1 %-Regel pro Monat?`, l / 100, [`1 % = Komma zwei Stellen nach links: ${fmt(l / 100)}`], 'Privatnutzung Verbrenner: 1 % des Listenpreises pro Monat'); },
     s => { const w = 1230 + ri(1, 40) * 25; return mkQ(`Werbungskosten ${eur(w)}: wie viel mehr als der Pauschbetrag von 1.230 €?`, w - 1230, wSub(w, 1230), 'Arbeitnehmer-Pauschbetrag: 1.230 €'); }],
    [s => { const n = ri(2, 50) * 100; return mkQ(`Wie viel USt (19 %) stecken in ${eur(n * 1.19)} brutto?`, n * 0.19, [`${fmt(n * 1.19)} ÷ 119 = ${fmt(n / 100)}`, `× 19 = ${fmt(n * 0.19)}`], 'USt = Brutto × 19/119'); },
     s => { const k = ri(12, 80) * 100; return mkQ(`Kapitalerträge ${eur(k)}: Abgeltungsteuer (25 %, ohne Soli)?`, (k - 1000) * 0.25, [`${fmt(k)} − 1.000 Pauschbetrag = ${fmt(k - 1000)}`, `ein Viertel: ${fmt((k - 1000) / 4)}`], 'Sparer-Pauschbetrag: 1.000 €'); },
     s => { const st = ri(4, 80) * 100; return mkQ(`Solidaritätszuschlag (5,5 %) auf ${eur(st)} Steuer?`, st * 0.055, [`5 % = ${fmt(st * 0.05)}`, `0,5 % = ${fmt(st * 0.005)}`, `zusammen ${fmt(rnd(st * 0.055))}`]); },
     s => { const p = pick([8, 9]), st = ri(10, 80) * 100; return mkQ(`Kirchensteuer ${p} % auf ${eur(st)} Einkommensteuer?`, st * p / 100, [`1 % = ${fmt(st / 100)}`, `× ${p} = ${fmt(st * p / 100)}`], '8 % in Bayern und Baden-Württemberg, sonst 9 %'); },
     s => { const P = ri(2, 40) * 1000, r = pick([2, 2.5, 3, 3.5, 4, 5]), m = pick([12, 6, 3]); const y = P * r / 100;
       return mkQ(`${eur(P)} zu ${fmt(r)} % für ${m} Monate: Zinsen?`, y * m / 12, [`Ein Jahr: ${fmt(P / 100)} × ${fmt(r)} = ${fmt(y)}`, ...(m < 12 ? [`${m} Monate = ${m === 6 ? 'die Hälfte' : 'ein Viertel'}: ${fmt(rnd(y * m / 12))}`] : [])]); },
     s => { const u = ri(20, 120) * 50, v = ri(5, Math.floor(u / 50) - 2) * 50; return mkQ(`USt ${eur(u)}, Vorsteuer ${eur(v)}: Zahllast?`, u - v, wSub(u, v), 'Zahllast = Umsatzsteuer − Vorsteuer'); },
     s => { const d = pick([90, 180, 30, 60]), P = d >= 90 ? ri(2, 30) * 1000 : ri(1, 25) * 1200, r = pick([3, 4, 5, 6]); return mkQ(`${eur(P)} zu ${r} % für ${d} Tage (360-Tage-Jahr): Zinsen?`, P * r / 100 * d / 360, [`Jahr: ${fmt(P * r / 100)}`, `${d} Tage = ${fmt(d / 360)} Jahr → ${fmt(rnd(P * r / 100 * d / 360))}`], 'Kaufmännisch: Monat 30 Tage, Jahr 360 Tage'); },
     s => { const l = ri(40, 90) * 1000; return mkQ(`Elektro-Firmenwagen, Listenpreis ${eur(l)}: 0,25 %-Regel pro Monat?`, l * 0.0025, [`1 % = ${fmt(l / 100)}`, `ein Viertel davon: ${fmt(l * 0.0025)}`], 'E-Auto: 0,25 % des Listenpreises'); },
     s => { const h = ri(5, 30), r = pick([60, 80, 90, 100, 120]); return mkQ(`Rechnung ${eur(h * r * 1.19)} brutto für ${h} Stunden: Netto-Stundensatz?`, r, [`Netto: ${fmt(h * r * 1.19)} ÷ 1,19 = ${fmt(h * r)}`, `÷ ${h} Stunden = ${r}`]); }],
    [s => { const k = ri(10, 90), g = 24500 + k * 1000, H = pick([300, 350, 400, 450, 500]), mb = k * 35;
       return mkQ(`Gewerbeertrag ${eur(g)} (Einzelunternehmen), Hebesatz ${H} %: Gewerbesteuer?`, mb * H / 100, [`− 24.500 € Freibetrag = ${fmt(k * 1000)}`, `× 3,5 % Messzahl = ${fmt(mb)} Messbetrag`, `× ${H} % = ${fmt(rnd(mb * H / 100))}`]); },
     s => { const P0 = pick([1000, 2000, 2500, 5000, 10000]), r = pick([2, 4, 5, 10]); return mkQ(`${eur(P0)} zu ${r} % über 2 Jahre mit Zinseszins: Endbetrag?`, P0 * (1 + r / 100) ** 2, [`Jahr 1: + ${fmt(P0 * r / 100)} = ${fmt(P0 * (1 + r / 100))}`, `Jahr 2: + ${fmt(rnd(P0 * (1 + r / 100) * r / 100))} = ${fmt(rnd(P0 * (1 + r / 100) ** 2))}`]); },
     s => { const r = pick([2, 3, 4, 6, 8, 9, 12]); return mkQ(`Nach wie vielen Jahren verdoppelt sich Geld bei ${r} % (72er-Regel)?`, 72 / r, [`72 ÷ ${r} = ${72 / r}`], 'Faustregel: 72 ÷ Zinssatz'); },
     s => { const u = pick([1.25, 2.5, 0.8, 3.2, 1.5]), a = ri(2, 9); let b = ri(2, 12); if (b === a) b++; return mkQ(`${a} kg kosten ${eur(rnd(u * a, 2))}. Was kosten ${b} kg?`, u * b, [`1 kg: ${fmt(rnd(u * a, 2))} ÷ ${a} = ${fmt(u)}`, `${b} kg: ${fmt(u)} × ${b} = ${fmt(rnd(u * b))}`]); },
     s => { const tot = pick([24, 36, 48, 60, 72]), divs = [2, 3, 4, 6].filter(x => tot % x === 0), w1 = pick(divs), w2 = pick(divs.filter(x => x !== w1));
       return mkQ(`${w1} Personen brauchen ${tot / w1} Tage. Wie viele Tage brauchen ${w2}?`, tot / w2, [`Gesamtarbeit: ${w1} × ${tot / w1} = ${tot} Personentage`, `${tot} ÷ ${w2} = ${tot / w2}`]); },
     s => { const n = ri(2, 40) * 100; return mkQ(`Netto ${eur(n)} + 19 % USt, davon 2 % Skonto: Zahlbetrag?`, n * 1.19 * 0.98, [`Brutto: ${fmt(n * 1.19)}`, `2 % = ${fmt(rnd(n * 1.19 * 0.02))}`, `${fmt(n * 1.19)} − ${fmt(rnd(n * 1.19 * 0.02))} = ${fmt(rnd(n * 1.19 * 0.98))}`]); },
     s => { const g = ri(4, 60) * 400; return mkQ(`Kapitalgewinn ${eur(g)} (nach Pauschbetrag): 25 % + 5,5 % Soli darauf?`, g * 0.26375, [`25 % = ${fmt(g / 4)}`, `Soli 5,5 % davon = ${fmt(rnd(g / 4 * 0.055))}`, `zusammen ${fmt(rnd(g * 0.26375))} (= 26,375 %)`]); },
     s => { const k = ri(10, 60) * 10000, m = rnd(k * pick([0.03, 0.04, 0.05, 0.06])); return mkQ(`Wohnung ${eur(k)}, Jahresmiete ${eur(m)}: Bruttomietrendite in %?`, m / k * 100, [`${fmt(m)} ÷ ${fmt(k)} = ${fmt(rnd(m / k, 4))}`, `× 100 = ${fmt(rnd(m / k * 100))} %`]); },
     s => { const u = ri(15, 24) * 1000 + ri(1, 9) * 100; return mkQ(`Umsatz bisher ${eur(u)}: wie viel bis zur Kleinunternehmergrenze von 25.000 €?`, 25000 - u, wSub(25000, u), 'Kleinunternehmer: Vorjahresumsatz höchstens 25.000 €'); },
     s => { const e = ri(4, 40) * 10, p = pick([20, 25, 40, 50, 30]); return mkQ(`Einkauf ${eur(e)}, Aufschlag ${p} %: Verkaufspreis netto?`, e * (100 + p) / 100, [...wPct(p, e), `${fmt(e)} + ${fmt(e * p / 100)} = ${fmt(e * (100 + p) / 100)}`]); }],
  ],
  nut: [
    [s => { const g = ri(5, 60), [n, k] = pick([['Fett', 9], ['Eiweiß', 4], ['Kohlenhydrate', 4]]); return mkQ(`${g} g ${n}: wie viele kcal?`, g * k, [`${n} hat ${k} kcal pro Gramm`, `${g} × ${k} = ${g * k}`]); },
     s => { const g = ri(1, 9) + pick([0, 0.5]); return mkQ(`${fmt(g)} g = ? mg`, g * 1000, [`1 g = 1.000 mg → × 1.000 = ${fmt(g * 1000)}`]); },
     s => { const m = ri(2, 12) * 15; return mkQ(`${m} Minuten = ? Stunden`, m / 60, [`${m} ÷ 60 = ${fmt(m / 60)}`]); },
     s => { const p = ri(2, 25), g = ri(1, 4) * 50; return mkQ(`${g} g Lebensmittel mit ${p} g Eiweiß pro 100 g: wie viel Eiweiß?`, p * g / 100, [`${g} g = ${fmt(g / 100)} × 100 g`, `${p} × ${fmt(g / 100)} = ${fmt(p * g / 100)}`]); }],
    [s => { const f = ri(5, 40), c = ri(10, 80); return mkQ(`${f} g Fett + ${c} g Kohlenhydrate: kcal?`, f * 9 + c * 4, [`Fett: ${f} × 9 = ${f * 9}`, `KH: ${c} × 4 = ${c * 4}`, `zusammen ${f * 9 + c * 4}`]); },
     s => { const kg = ri(50, 100), f = pick([0.8, 1.0, 1.2, 1.5, 1.6]); return mkQ(`Eiweißbedarf ${fmt(f)} g pro kg bei ${kg} kg?`, rnd(kg * f), wMul(kg, f)); },
     s => { const kg = ri(50, 95), ml = pick([30, 35]); return mkQ(`Flüssigkeit ${ml} ml pro kg bei ${kg} kg: wie viele Liter?`, kg * ml / 1000, [`${kg} × ${ml} = ${fmt(kg * ml)} ml`, `÷ 1.000 = ${fmt(kg * ml / 1000)} l`]); },
     s => { const mmol = ri(40, 120) / 10; return mkQ(`Blutzucker ${fmt(mmol)} mmol/l = ? mg/dl (× 18)`, rnd(mmol * 18), wMul(mmol, 18)); },
     s => { const k = ri(3, 12) * 100, fat = ri(1, k / 30) * 3; const p = rnd(fat * 9 / k * 100, 1); return Number.isInteger(p * 10) ? mkQ(`${k} kcal, davon ${fat} g Fett: Fettanteil an der Energie in %?`, p, [`Fett: ${fat} × 9 = ${fat * 9} kcal`, `${fat * 9} ÷ ${k} × 100 = ${fmt(p)} %`]) : mkQ(`${k} kcal, davon ${k / 90} g Fett: Fettanteil in %?`, 10, [`${k / 90} × 9 = ${k / 10} kcal = 10 %`]); }],
    [s => { const h = pick([1.5, 1.6, 1.7, 1.8, 1.9, 2.0]), b = ri(18, 34), w = rnd(b * h * h, 1); return mkQ(`BMI bei ${fmt(w)} kg und ${fmt(h)} m? (gerundet)`, Math.round(w / h / h), [`${fmt(h)}² = ${fmt(rnd(h * h))}`, `${fmt(w)} ÷ ${fmt(rnd(h * h))} ≈ ${Math.round(w / h / h)}`]); },
     s => { const mg = ri(4, 20) * 18; return mkQ(`Blutzucker ${mg} mg/dl = ? mmol/l (÷ 18)`, mg / 18, wDiv(mg, 18)); },
     s => { const v = pick([330, 500, 250, 200]), p = pick([5, 4.8, 12, 13, 40]); const g = rnd(v * p / 100 * 0.8, 1); return mkQ(`${v} ml Getränk mit ${fmt(p)} % Alkohol: wie viele Gramm Alkohol? (× 0,8)`, g, [`Reiner Alkohol: ${v} × ${fmt(p / 100)} = ${fmt(rnd(v * p / 100))} ml`, `× 0,8 g/ml = ${fmt(g)} g`]); },
     s => { const g = ri(10, 40); return mkQ(`${g} g Alkohol: wie viele kcal? (7 kcal/g)`, g * 7, [`${g} × 7 = ${g * 7}`]); },
     s => { const kcal = ri(15, 30) * 100, p = pick([20, 25, 30, 35]); const fk = kcal * p / 100; const g = rnd(fk / 9, 1); return mkQ(`${fmt(kcal)} kcal, ${p} % davon Fett: wie viele Gramm Fett? (1 Nachkommastelle)`, g, [`${p} % von ${fmt(kcal)} = ${fmt(fk)} kcal`, `÷ 9 = ${fmt(g)} g`]); },
     s => { const na = ri(4, 30) / 10; return mkQ(`${fmt(na)} g Natrium = ? g Salz (Faustregel × 2,5)`, rnd(na * 2.5), wMul(na, 2.5)); }],
    [s => { const b = pick([20, 22, 25, 27, 30]), h = pick([1.6, 1.7, 1.8, 1.9]); return mkQ(`Welches Gewicht ergibt BMI ${b} bei ${fmt(h)} m? (1 Nachkommastelle)`, rnd(b * h * h, 1), [`${fmt(h)}² = ${fmt(rnd(h * h))}`, `${b} × ${fmt(rnd(h * h))} = ${fmt(rnd(b * h * h, 1))} kg`]); },
     s => { const p = ri(60, 140), f = ri(40, 100), c = ri(150, 350); return mkQ(`${p} g Eiweiß, ${f} g Fett, ${c} g KH: Gesamt-kcal?`, p * 4 + f * 9 + c * 4, [`Eiweiß + KH: (${p} + ${c}) × 4 = ${(p + c) * 4}`, `Fett: ${f} × 9 = ${f * 9}`, `zusammen ${fmt(p * 4 + f * 9 + c * 4)}`]); },
     s => { const kg = ri(55, 95), f = pick([25, 30]), d = pick([0.8, 0.9]); return mkQ(`Energie ${f} kcal/kg bei ${kg} kg, davon ${Math.round(d * 100)} % gedeckt: Defizit in kcal?`, rnd(kg * f * (1 - d)), [`Bedarf: ${kg} × ${f} = ${fmt(kg * f)}`, `${Math.round((1 - d) * 100)} % davon = ${fmt(rnd(kg * f * (1 - d)))}`]); },
     s => { const ml = pick([1, 1.5, 0.5, 2]), v = ri(4, 10) * (ml === 1.5 ? 300 : 200); return mkQ(`Sondennahrung ${fmt(ml)} kcal/ml: wie viel ml für ${fmt(v)} kcal?`, rnd(v / ml), wDiv(v, ml)); },
     s => { const kg = ri(50, 95); return mkQ(`Grundumsatz-Faustregel 1 kcal pro kg und Stunde: ${kg} kg → kcal pro Tag?`, kg * 24, [`${kg} × 24 = ${kg * 24}`, ...wMul(kg, 24).slice(1)], 'Grobe Faustregel, ersetzt keine Messung'); }],
  ],
  est: [
    [s => { const x = ri(21, 99), y = ri(21, 99); return mkE(`${x} × ${y}`, x * y, [`≈ ${Math.round(x / 10) * 10} × ${Math.round(y / 10) * 10} = ${fmt(Math.round(x / 10) * 10 * Math.round(y / 10) * 10)}`]); },
     s => { const n = [ri(101, 999), ri(101, 999), ri(101, 999), ri(101, 999)]; return mkE(n.map(fmt).join(' + '), n.reduce((a, b) => a + b, 0), [`Auf Hunderter runden: ${n.map(v => Math.round(v / 100) * 100).join(' + ')} = ${fmt(n.reduce((a, v) => a + Math.round(v / 100) * 100, 0))}`]); },
     s => { const x = ri(110, 990), y = ri(3, 9); return mkE(`${x} × ${y}`, x * y, [`≈ ${Math.round(x / 10) * 10} × ${y} = ${fmt(Math.round(x / 10) * 10 * y)}`]); }],
    [s => { const x = ri(120, 990), y = ri(12, 99); return mkE(`${x} × ${y}`, x * y, [`≈ ${sigRound(x)} × ${sigRound(y)} = ${fmt(sigRound(x) * sigRound(y))}`]); },
     s => { const x = ri(1200, 9900), y = ri(12, 99); return mkE(`${fmt(x)} ÷ ${y}`, x / y, [`≈ ${fmt(sigRound(x))} ÷ ${sigRound(y)} = ${fmt(rnd(sigRound(x) / sigRound(y), 1))}`]); },
     s => { const p = pick([17, 23, 38, 43, 12, 67]), b = ri(1001, 9999); return mkE(`${p} % von ${fmt(b)}`, b * p / 100, [`≈ ${p} % von ${fmt(sigRound(b))}: 1 % = ${fmt(sigRound(b) / 100)}`, `× ${p} ≈ ${fmt(rnd(sigRound(b) * p / 100))}`]); },
     s => { const v = pick([[`Sekunden an einem Tag`, 86400, ['24 × 60 × 60 = 24 × 3.600 = 86.400']], [`Minuten in einer Woche`, 10080, ['7 × 24 × 60 = 7 × 1.440 = 10.080']], [`Stunden in einem Jahr`, 8760, ['365 × 24 ≈ 360 × 24 + 5 × 24 = 8.640 + 120']]]); return mkE(v[0], v[1], v[2]); }],
    [s => { const x = ri(120, 990), y = ri(120, 990); return mkE(`${x} × ${y}`, x * y, [`≈ ${sigRound(x)} × ${sigRound(y)} = ${fmt(sigRound(x) * sigRound(y))}`]); },
     s => { const x = ri(1001, 9999), r = pick([19, 7]); return mkE(`${r} % von ${fmt(x)}`, x * r / 100, [`≈ ${r === 19 ? '20 % minus 1 %' : '10 % minus 3 %'} von ${fmt(sigRound(x))}`]); },
     s => { const x = ri(30, 9999); const r = Math.round(Math.sqrt(x)); return mkE(`√${fmt(x)}`, Math.sqrt(x), [`${r}² = ${fmt(r * r)} liegt nah dran → ≈ ${r}`]); },
     s => { const x = ri(1001, 9999); return mkE(`${fmt(x)} × 1,19`, x * 1.19, [`${fmt(x)} + 20 % ≈ ${fmt(rnd(x * 1.2))}, minus 1 % ≈ ${fmt(rnd(x * 1.19))}`]); },
     s => { const a = ri(11, 49), b = ri(11, 49), c = ri(11, 49); return mkE(`${a} × ${b} × ${c}`, a * b * c, [`≈ ${sigRound(a)} × ${sigRound(b)} × ${sigRound(c)} = ${fmt(sigRound(a) * sigRound(b) * sigRound(c))}`]); }],
    [s => { const x = ri(11, 99) / 10, y = ri(120, 990); return mkE(`${fmt(x)} × ${y}`, x * y, [`≈ ${fmt(Math.round(x))} × ${sigRound(y)} = ${fmt(Math.round(x) * sigRound(y))}`]); },
     s => { const p = ri(2, 9), n = ri(3, 10), P0 = ri(1, 20) * 1000; return mkE(`${eur(P0)} zu ${p} % über ${n} Jahre, Zinseszins`, P0 * (1 + p / 100) ** n, [`Ohne Zinseszins: + ${p * n} %`, `mit Zinseszins etwas mehr: ≈ ${fmt(sigRound(P0 * (1 + p / 100) ** n))}`]); },
     s => { const x = ri(2000, 99999), r = Math.round(Math.sqrt(x)); return mkE(`√${fmt(x)}`, Math.sqrt(x), [`${r}² = ${fmt(r * r)} → ≈ ${r}`]); },
     s => { const x = ri(10001, 99999), y = ri(101, 999); return mkE(`${fmt(x)} ÷ ${y}`, x / y, [`≈ ${fmt(sigRound(x))} ÷ ${sigRound(y)} = ${fmt(rnd(sigRound(x) / sigRound(y), 1))}`]); },
     s => { const v = pick([[`Minuten in einem Jahr`, 525600, ['365 × 1.440 ≈ 525.600']], [`Herzschläge am Tag bei Puls 70`, 100800, ['70 × 60 × 24 = 70 × 1.440 = 100.800']], [`Sekunden in 30 Tagen`, 2592000, ['30 × 86.400 = 2.592.000']]]); return mkE(v[0], v[1], v[2]); }],
  ],
};
function mkE(t, a, w) { return { t: t + ' ≈ ?', a, w, est: true }; }
const RC_TOL = [0.1, 0.05, 0.03, 0.02];
/** One task of category c at level e (difficulty * 3 + in-round step). */
function genTask(c, e) {
  const d = Math.floor(e / 3), s = e % 3, lower = d > 0 && chance(.2);
  const q = pick(BANK[c][lower ? d - 1 : d])(lower ? 2 : s);
  if (q.est) { q.tol = RC_TOL[d]; q.x = 'genau ' + fmt(rnd(q.a, 2)) + ', erlaubt ±' + Math.round(q.tol * 100) + ' %'; delete q.est; }
  return q;
}

/* ---------- trick lessons ---------- */
const TRICKS = [
  { id: 'x11', name: '× 11', rule: 'Zweistellige Zahl × 11: Ziffern auseinanderziehen, ihre Summe in die Mitte. Ist die Summe 10 oder mehr, wandert die 1 nach links.', ex: '53 × 11 → 5 | 8 | 3 = 583 · 78 × 11 → 7 | 15 | 8 = 858', gen: () => { const a = ri(12, 99); return mkQ(`${a} × 11`, a * 11, wMul(a, 11)); } },
  { id: 'x25', name: '× 5 und × 25', rule: '× 5 ist × 10 und dann halbieren. × 25 ist × 100 und dann durch 4.', ex: '64 × 25 = 6.400 ÷ 4 = 1.600 · 86 × 5 = 860 ÷ 2 = 430', gen: () => chance(.5) ? (a => mkQ(`${a} × 25`, a * 25, wMul(a, 25)))(ri(3, 40) * 4) : (a => mkQ(`${a} × 5`, a * 5, wMul(a, 5)))(ri(13, 199)) },
  { id: 'sq5', name: 'Quadrate auf 5', rule: 'Zahl mit Endziffer 5 hoch 2: vordere Ziffer(n) mal (sich selbst + 1), dann 25 anhängen.', ex: '65² → 6 × 7 = 42 → 4.225 · 115² → 11 × 12 = 132 → 13.225', gen: () => { const a = 10 * ri(1, 12) + 5; return mkQ(`${a}²`, a * a, wSq(a)); } },
  { id: 'sq50', name: 'Quadrate nahe 50', rule: '(50 + k)² = 2.500 + 100·k + k². Für 50 − k: 2.500 − 100·k + k².', ex: '53² = 2.500 + 300 + 9 = 2.809 · 47² = 2.500 − 300 + 9 = 2.209', gen: () => { let a = ri(41, 59); if (a === 45 || a === 55) a++; return mkQ(`${a}²`, a * a, wSq(a)); } },
  { id: 'binom', name: 'Mitte² − Abstand²', rule: 'Zwei Zahlen gleich weit um eine runde Mitte: Mitte² minus Abstand². Das ist die dritte binomische Formel.', ex: '23 × 17 = 20² − 3² = 391 · 48 × 52 = 50² − 2² = 2.496', gen: () => { const m = pick([20, 30, 40, 50, 60, 70, 80, 90, 100]), k = ri(1, 9); return mkQ(`${m + k} × ${m - k}`, (m + k) * (m - k), wMul(m + k, m - k)); } },
  { id: 'x99', name: '× 9 und × 99', rule: '× 9 ist × 10 minus die Zahl. × 99 ist × 100 minus die Zahl.', ex: '37 × 99 = 3.700 − 37 = 3.663 · 48 × 9 = 480 − 48 = 432', gen: () => chance(.5) ? (a => mkQ(`${a} × 99`, a * 99, wMul(a, 99)))(ri(12, 99)) : (a => mkQ(`${a} × 9`, a * 9, wMul(a, 9)))(ri(13, 199)) },
  { id: 'pswap', name: 'Prozent tauschen', rule: 'x % von y ist dasselbe wie y % von x. Nimm die Richtung, die leichter ist.', ex: '8 % von 50 = 50 % von 8 = 4 · 16 % von 25 = 25 % von 16 = 4', gen: () => { const p = ri(2, 24), b = pick([25, 50, 20, 10, 200, 75]); return mkQ(`${p} % von ${b}`, p * b / 100, [`Tauschen: ${b} % von ${p}`, `= ${fmt(rnd(p * b / 100))}`]); } },
  { id: 'ust', name: 'USt herausrechnen', rule: 'Bei 19 %: Brutto ÷ 119 ergibt 1 %. Mal 19 ist die USt, mal 100 das Netto. Bei 7 % genauso mit 107.', ex: '357 € brutto ÷ 119 = 3 → USt 57 €, Netto 300 €', gen: () => { const r = pick([19, 19, 7]), n = ri(1, 40) * 100, b = rnd(n * (100 + r) / 100, 2), one = n / 100;
    return chance(.5) ? mkQ(`${eur(b)} brutto (${r} %): USt?`, rnd(n * r / 100, 2), [`${fmt(b)} ÷ ${100 + r} = ${fmt(one)}`, `× ${r} = ${fmt(rnd(one * r, 2))}`]) : mkQ(`${eur(b)} brutto (${r} %): Netto?`, n, [`${fmt(b)} ÷ ${100 + r} = ${fmt(one)}`, `× 100 = ${fmt(n)}`]); } },
  { id: 'r72', name: '72er-Regel', rule: 'Wie lange, bis sich Geld verdoppelt? Ungefähr 72 ÷ Zinssatz. Umgekehrt: Welcher Zins verdoppelt in n Jahren? 72 ÷ n.', ex: 'Bei 6 % ≈ 12 Jahre · Verdopplung in 8 Jahren braucht ≈ 9 %', gen: () => { const x = pick([2, 3, 4, 6, 8, 9, 12, 18, 24]); return chance(.5) ? mkQ(`Verdopplungszeit bei ${x} % Zins?`, 72 / x, [`72 ÷ ${x} = ${72 / x}`]) : mkQ(`Welcher Zins verdoppelt in ${x} Jahren?`, 72 / x, [`72 ÷ ${x} = ${72 / x}`]); } },
  { id: 'skonto', name: 'Skonto und Rabatt', rule: 'Erst 1 % bestimmen (Komma zwei Stellen nach links), dann mal den Prozentsatz und abziehen.', ex: '3 % Skonto auf 2.400 €: 1 % = 24 → 72 → Zahlbetrag 2.328 €', gen: () => { const b = ri(4, 90) * 100, p = pick([2, 3, 4, 15, 30]); return mkQ(`${eur(b)} − ${p} %?`, b * (100 - p) / 100, [`1 % = ${fmt(b / 100)}`, `${p} % = ${fmt(b * p / 100)}`, `${fmt(b)} − ${fmt(b * p / 100)} = ${fmt(b * (100 - p) / 100)}`]); } },
];
