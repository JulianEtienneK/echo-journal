'use strict';
/* Steuer-Akademie for spiele.html: six games with four levels each (Fristen-Kalender, Buchungs-Werkstatt, Ort der Leistung,
   Sortier-Sprint, §-Jagd, Rechenfälle), a career ladder, a daily file ("Akte des Tages"), a review box and an exam simulation graded like the
   written StB exam (bis 4,5 bestanden). Calendar, booking and calculation tasks are generated from rules, so they never run out;
   the norm and sorting cards (steuer-data.js) come back by spaced repetition. Rechtsstand 2026.
   Uses spiele.html globals at call time: G, save, gain, beep, esc, toast, app, back, view, render. */
(function () {
  const DATA = window.STB_DATA; if (!DATA) return;

  /* ---------- small helpers ---------- */
  const pad = n => String(n).padStart(2, '0');
  const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
  const eur = (x, dec = 2) => Number(x).toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €';
  const pct = x => (x * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' %';
  const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  let rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const seeded = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h |= 0; h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  /* ---------- dates, German holidays ---------- */
  const DT = (y, m, d) => new Date(y, m - 1, d, 12);
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dim = (y, m0) => new Date(y, m0 + 1, 0).getDate();
  const addM = (d, n) => { const t = d.getMonth() + n, y = d.getFullYear() + Math.floor(t / 12), m = ((t % 12) + 12) % 12; return new Date(y, m, Math.min(d.getDate(), dim(y, m)), 12); };
  const dkey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const diffD = (a, b) => Math.round((b - a) / 864e5);
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const fd = d => `${WD[d.getDay()]} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return DT(y, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
  }
  const HC = {};
  function hols(y) { // nationwide holidays count; regional ones are kept out of every generated case so the answer holds in every Land
    if (HC[y]) return HC[y];
    const e = easter(y), nat = {}, reg = new Set(), put = (d, n) => { nat[dkey(d)] = n; };
    put(DT(y, 1, 1), 'Neujahr'); put(addD(e, -2), 'Karfreitag'); put(addD(e, 1), 'Ostermontag'); put(DT(y, 5, 1), 'Tag der Arbeit'); put(addD(e, 39), 'Christi Himmelfahrt');
    put(addD(e, 50), 'Pfingstmontag'); put(DT(y, 10, 3), 'Tag der Deutschen Einheit'); put(DT(y, 12, 25), '1. Weihnachtstag'); put(DT(y, 12, 26), '2. Weihnachtstag');
    [DT(y, 1, 6), DT(y, 3, 8), addD(e, 60), DT(y, 8, 15), DT(y, 9, 20), DT(y, 10, 31), DT(y, 11, 1)].forEach(d => reg.add(dkey(d)));
    for (let d = 16; d <= 22; d++) { const x = DT(y, 11, d); if (x.getDay() === 3) reg.add(dkey(x)); } // Buß- und Bettag
    return (HC[y] = { nat, reg });
  }
  const holName = d => hols(d.getFullYear()).nat[dkey(d)];
  const isReg = d => hols(d.getFullYear()).reg.has(dkey(d));
  const isOff = d => d.getDay() === 0 || d.getDay() === 6 || !!holName(d);
  const offWhy = d => holName(d) || WDL[d.getDay()];
  const skipTxt = st => st.map(d => `${WD[d.getDay()]} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}. (${offWhy(d)})`).join(', ');
  function shift(d, crit) { const st = []; crit && crit.push(d); while (isOff(d)) { st.push(d); d = addD(d, 1); crit && crit.push(d); } return [d, st]; }
  const nextWork = d => shift(d)[0];
  function randWork() { for (;;) { const d = addD(DT(2025, 1, 2), ri(0, 1060)); if (!isOff(d) && !isReg(d)) return d; } }
  function calHTML(dates, marks) {
    const ms = []; dates.forEach(d => { const k = d.getFullYear() * 12 + d.getMonth(); if (!ms.includes(k)) ms.push(k); }); ms.sort((a, b) => a - b);
    return `<div class="tcal">${ms.slice(0, 2).map(k => {
      const y = Math.floor(k / 12), m = k % 12, off = (new Date(y, m, 1, 12).getDay() + 6) % 7; let cells = '';
      for (let i = 0; i < off; i++) cells += '<i></i>';
      for (let d = 1; d <= dim(y, m); d++) { const x = new Date(y, m, d, 12), h = holName(x); cells += `<i class="${x.getDay() % 6 === 0 ? 'we' : ''} ${h ? 'hol' : ''} ${marks[dkey(x)] || ''}"${h ? ` title="${esc(h)}"` : ''}>${d}</i>`; }
      return `<div class="tmon"><b>${MON[m]} ${y}</b><div class="tgrid">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => `<span>${w}</span>`).join('')}${cells}</div></div>`;
    }).join('')}</div><div class="tleg"><span><i class="mk"></i>Aufgabe</span><span><i class="we"></i>Wochenende</span><span><i class="hol"></i>bundesweiter Feiertag</span></div>`;
  }

  /* ---------- options ---------- */
  function mkOpts(ok, cands, key, fill) {
    const seen = new Set([key(ok)]), out = [{ v: ok, ok: true }];
    for (const c of cands) { if (out.length >= 4) break; if (c == null || (typeof c === 'number' && !(c >= 0))) continue; const k = key(c); if (seen.has(k)) continue; seen.add(k); out.push({ v: c, ok: false }); }
    for (let i = 1; out.length < 4 && fill && i < 40; i++) { const c = fill(i); if (c == null || (typeof c === 'number' && !(c >= 0))) continue; const k = key(c); if (!seen.has(k)) { seen.add(k); out.push({ v: c, ok: false }); } }
    return shuf(out);
  }
  const ln = (a, x) => [a, r2(x)];
  const E = (s, h) => ({ s, h });
  const swap = e => ({ s: e.h, h: e.s });
  const eKey = e => JSON.stringify(e);
  const entryHTML = e => { const side = xs => xs.map(([a, x]) => `<div><span>${esc(a)}</span><b>${eur(x)}</b></div>`).join(''); return `<div class="bs"><div>${side(e.s)}</div><span class="an">an</span><div>${side(e.h)}</div></div>`; };

  /* ================= 1 · Fristen-Kalender ================= */
  const FR = {
    1() {
      for (;;) {
        const a = randWork(), crit = [], f = addD(a, 4), [b, st] = shift(f, crit), v = rnd();
        let ok = b, extra = '', early = null, late = null, tid = 'f1';
        const why = [`Aufgabe zur Post: ${fd(a)}`, `+ 4 Tage (§ 122 Abs. 2 Nr. 1 AO): ${fd(f)}`];
        why.push(st.length ? `${skipTxt(st)}: kein Werktag, also der nächste Werktag (§ 108 Abs. 3 AO): <b>${fd(b)}</b>` : `Werktag, Bekanntgabe am <b>${fd(b)}</b>`);
        if (v < 0.22) {
          late = addD(b, ri(2, 5)); if (isOff(late) || isReg(late)) continue;
          extra = ` Der Brief geht nachweislich erst am ${fd(late)} zu.`; ok = late; tid = 'f1-spaet';
          why.push(`Späterer Zugang geht der Fiktion vor: Bekanntgabe erst am <b>${fd(late)}</b> (§ 122 Abs. 2 letzter Halbsatz AO, Nachweis liegt beim Finanzamt).`);
        } else if (v < 0.42) {
          early = addD(a, ri(1, 2)); if (isOff(early)) continue;
          extra = ` Die Mandantin findet ihn schon am ${fd(early)} im Briefkasten.`; tid = 'f1-frueh';
          why.push('Früherer Zugang ändert nichts: Die Viertagesfiktion gilt trotzdem.');
        } else if (st.length) tid = 'f1-wochenende';
        if (crit.some(isReg)) continue;
        return {
          tid, eyebrow: 'Bekanntgabe', title: 'Wann gilt der Bescheid als bekannt gegeben?',
          sub: `Das Finanzamt gibt einen Einkommensteuerbescheid am ${fd(a)} zur Post (Empfängerin im Inland).${extra}`,
          cal: calHTML([a, ok], { [dkey(a)]: 'mk' }), f: 'd', ok, why,
          bad: [late ? b : null, f, nextWork(addD(a, 3)), early, a, addD(ok, 1), addD(a, 3)],
        };
      }
    },
    2() {
      for (;;) {
        const a = randWork(), crit = [], f = addD(a, 4), [b, st1] = shift(f, crit), noRB = rnd() < 0.18, n = noRB ? 12 : 1;
        const e0 = addM(b, n), clamp = e0.getDate() !== b.getDate(), [e, st2] = shift(e0, crit);
        if (crit.some(isReg)) continue;
        if (!st1.length && !st2.length && !clamp && rnd() < 0.55) continue; // most cases should contain a trap
        const why = [`Aufgabe zur Post ${fd(a)}, + 4 Tage: ${fd(f)}${st1.length ? `; ${skipTxt(st1)} kein Werktag, also ${fd(b)} (§ 108 Abs. 3 AO)` : ''} = Bekanntgabe (§ 122 Abs. 2 Nr. 1 AO)`,
          noRB ? 'Rechtsbehelfsbelehrung fehlt: Einspruch binnen eines Jahres (§ 356 Abs. 2 AO)' : 'Einspruchsfrist ein Monat (§ 355 Abs. 1 AO), Beginn am Tag nach der Bekanntgabe (§ 108 Abs. 1 AO, § 187 Abs. 1 BGB)',
          clamp ? `Den ${b.getDate()}. gibt es im ${MON[e0.getMonth()]} nicht: Fristende am letzten Tag des Monats, ${fd(e0)} (§ 188 Abs. 3 BGB)` : `Ende am Tag mit derselben Zahl: ${fd(e0)} (§ 188 Abs. 2 BGB)`];
        why.push(st2.length ? `${skipTxt(st2)}: Fristende verschiebt sich auf den nächsten Werktag, <b>${fd(e)}</b> (§ 108 Abs. 3 AO)` : `Werktag: Frist endet mit Ablauf von <b>${fd(e)}</b>`);
        return {
          tid: 'f2' + (noRB ? '-jahr' : clamp ? '-monatsende' : st1.length || st2.length ? '-wochenende' : ''), eyebrow: 'Einspruchsfrist', title: 'Bis wann kann spätestens Einspruch eingelegt werden?',
          sub: `Der Bescheid wird am ${fd(a)} zur Post gegeben.${noRB ? ' Die Rechtsbehelfsbelehrung fehlt.' : ''}`,
          cal: calHTML([a, e0], { [dkey(a)]: 'mk' }), f: 'd', ok: e, why,
          bad: [nextWork(addM(f, n)), e0, nextWork(addM(nextWork(addD(a, 3)), n)), nextWork(addM(a, n)), noRB ? nextWork(addM(b, 1)) : null, addD(e, 1), nextWork(addD(e0, 1))],
        };
      }
    },
    3() {
      const k = pick(['norm', 'norm', 'spaet', 'keine', 'antrag', 'hinterz', 'leicht']); let Y = ri(2016, 2024); if (k === 'antrag') while (isOff(DT(Y + 4, 12, 31))) Y = ri(2016, 2024);
      const E0 = { norm: Y + ri(1, 2), spaet: Y + ri(4, 5), keine: null, antrag: Y + ri(1, 3), hinterz: Y + 1, leicht: Y + 1 }[k];
      const start = k === 'antrag' ? Y : k === 'keine' ? Y + 3 : Math.min(E0, Y + 3), dur = k === 'hinterz' ? 10 : k === 'leicht' ? 5 : 4, end = start + dur;
      const sub = {
        norm: `Einkommensteuer ${Y}. Die Steuerpflichtige ist zur Abgabe verpflichtet und reicht die Erklärung ${E0} ein.`,
        spaet: `Einkommensteuer ${Y}. Der Steuerpflichtige ist zur Abgabe verpflichtet, reicht die Erklärung aber erst ${E0} ein.`,
        keine: `Einkommensteuer ${Y}. Der Steuerpflichtige ist zur Abgabe verpflichtet, reicht aber nie eine Erklärung ein.`,
        antrag: `Einkommensteuer ${Y}. Eine Arbeitnehmerin ohne Abgabepflicht möchte eine Erstattung und reicht freiwillig eine Erklärung ein (Antragsveranlagung).`,
        hinterz: `Einkommensteuer ${Y}. Der Steuerpflichtige ist zur Abgabe verpflichtet, reicht die Erklärung ${E0} ein und verschweigt dabei vorsätzlich Mieteinnahmen.`,
        leicht: `Einkommensteuer ${Y}. Die Steuerpflichtige ist zur Abgabe verpflichtet, reicht die Erklärung ${E0} ein und vergisst aus grober Nachlässigkeit Mieteinnahmen.`,
      }[k] + (k === 'antrag' ? '' : ' Keine Ablaufhemmung.');
      const why = [`Die Steuer entsteht mit Ablauf des 31.12.${Y} (§ 36 Abs. 1 EStG)`,
        { antrag: `Keine Abgabepflicht, also keine Anlaufhemmung: Beginn mit Ablauf von ${Y} (§ 170 Abs. 1 AO)`,
          keine: `Keine Erklärung: Anlaufhemmung bis zum Ablauf des dritten Jahres nach Entstehung, ${Y + 3} (§ 170 Abs. 2 S. 1 Nr. 1 AO)`,
          spaet: `Anlaufhemmung bis zur Abgabe, höchstens bis Ablauf von ${Y + 3}, dem dritten Jahr nach Entstehung (§ 170 Abs. 2 S. 1 Nr. 1 AO)` }[k] || `Erklärungspflicht: Beginn mit Ablauf des Jahres der Abgabe, ${E0} (§ 170 Abs. 2 S. 1 Nr. 1 AO)`,
        dur === 10 ? 'Steuerhinterziehung: 10 Jahre (§ 169 Abs. 2 S. 2 AO)' : dur === 5 ? 'Leichtfertige Steuerverkürzung: 5 Jahre (§ 169 Abs. 2 S. 2 AO)' : '4 Jahre (§ 169 Abs. 2 S. 1 Nr. 2 AO)',
        k === 'antrag' ? `Der Antrag muss vor Ablauf der Frist gestellt sein, also bis <b>31.12.${end}</b>; danach ist die Erstattung verloren (BFH VI R 53/10)` : `Ende mit Ablauf des <b>31.12.${end}</b>`];
      return { tid: 'f3-' + k, eyebrow: 'Festsetzungsfrist', title: k === 'antrag' ? 'Bis wann muss die Erklärung spätestens beim Finanzamt sein?' : 'Mit Ablauf welchen Tages endet die Festsetzungsfrist?', sub, f: 'y', ok: end, why,
        bad: [Y + 4, E0 ? E0 + 4 : null, Y + 7, E0 && dur !== 4 ? E0 + 4 : null, k === 'spaet' ? E0 + 4 : null, start + (dur === 4 ? 10 : 4), end + 1, end - 1] };
    },
    4() {
      for (;;) {
        const D0 = addD(DT(2025, 1, 6), ri(0, 900));
        if (![1, 2].includes(D0.getDay()) || D0.getDate() > 28 || isOff(D0) || isReg(D0)) continue;
        const A = ri(900, 48000) + ri(0, 99) / 100, m = pick(['ueb', 'ueb', 'ueb', 'ueb', 'ueb', 'last', 'scheck']);
        let P, Pe;
        if (m === 'ueb') { P = addD(D0, pick([1, 2, 3, 4, 5, 9, 16, 27, 31, 33, 44, 62, 75, 96])); Pe = P; if (isOff(P) || isReg(P)) continue; }
        else if (m === 'last') { P = D0; Pe = D0; }
        else { P = addD(D0, -ri(0, 1)); if (isOff(P)) P = D0; Pe = addD(P, 3); }
        const late = diffD(D0, Pe); let months = 0; if (late > 0) while (addM(D0, months) < Pe) months++;
        const sEnd = nextWork(addD(D0, 3)), sDays = [1, 2, 3].map(k => addD(D0, k)).concat([sEnd]);
        if (sDays.some(isReg)) continue;
        const schon = m === 'ueb' && late > 0 && Pe <= sEnd, base = Math.floor(A / 50) * 50, sz = late <= 0 || schon ? 0 : r2(base * 0.01 * months);
        const sub = `Einkommensteuer-Abschlusszahlung von ${eur(A)}, fällig am ${fd(D0)}. ` + { ueb: `Die Überweisung wird dem Finanzamt am ${fd(P)} gutgeschrieben.`, last: 'Es liegt ein SEPA-Lastschriftmandat vor; das Finanzamt zieht den Betrag ein.', scheck: `Ein Scheck geht am ${fd(P)} beim Finanzamt ein.` }[m];
        const why = [{ ueb: `Bei Überweisung zählt der Tag der Gutschrift (§ 224 Abs. 2 Nr. 2 AO): ${late} Tag${late === 1 ? '' : 'e'} nach Fälligkeit`,
          last: 'Lastschrift: Die Zahlung gilt als am Fälligkeitstag entrichtet (§ 224 Abs. 2 Nr. 3 AO), also keine Säumnis',
          scheck: `Ein Scheck gilt erst drei Tage nach Eingang als entrichtet, hier ${fd(Pe)} (§ 224 Abs. 2 Nr. 1 AO); die Schonfrist gilt dafür nicht (§ 240 Abs. 3 S. 2 AO)` }[m]];
        if (schon) why.push(diffD(D0, sEnd) > 3 ? `Schonfrist drei Tage; ihr letzter Tag fällt auf ${skipTxt(shift(addD(D0, 3))[1])}, also endet sie erst am ${fd(sEnd)} (§ 240 Abs. 3 S. 1 mit § 108 Abs. 3 AO): kein Zuschlag` : 'Säumnis bis zu drei Tagen: kein Zuschlag (§ 240 Abs. 3 S. 1 AO)');
        else if (m === 'ueb' && late > 3) why.push(`Schonfrist endet am ${fd(sEnd)}, gezahlt wurde später: Der Zuschlag läuft ab Fälligkeit`);
        if (sz) why.push(`Angefangene Monate der Säumnis ab ${fd(addD(D0, 1))}: ${months}`, `Rückstand auf volle 50 € abrunden: ${eur(base)}`, `${months} × 1 % × ${eur(base)} = <b>${eur(sz)}</b> (§ 240 Abs. 1 AO)`);
        else why.push('<b>Säumniszuschlag 0,00 €</b>');
        return { tid: 'f4-' + m + (schon ? '-schon' : ''), eyebrow: 'Säumniszuschlag', title: 'Wie hoch ist der Säumniszuschlag?', sub, cal: late > 0 && late <= 40 ? calHTML([D0, Pe], { [dkey(D0)]: 'mk' }) : '', f: 'm', ok: sz, why,
          bad: [r2(A * 0.01 * Math.max(1, months)), r2(base * 0.01 * (months + 1)), months > 1 ? r2(base * 0.01 * (months - 1)) : null, sz ? 0 : r2(base * 0.01), r2(base * 0.01 * Math.max(1, months))],
          fill: i => r2(base * 0.01 * (months + 1 + i)) };
      }
    },
  };

  /* ================= 2 · Buchungs-Werkstatt ================= */
  const vat = (n, r = 0.19) => r2(n * r);
  const BU = [
    { id: 'b-kasse-bank', lv: 1, gen() { const x = ri(5, 60) * 100; return { q: `Bareinzahlung von ${eur(x)} aus der Kasse auf das Bankkonto.`, ok: E([ln('Bank', x)], [ln('Kasse', x)]), bad: [E([ln('Kasse', x)], [ln('Bank', x)]), E([ln('Bank', x)], [ln('Privateinlagen', x)]), E([ln('Bank', x)], [ln('Umsatzerlöse 19 %', x)])], why: 'Aktivtausch: Die Bank nimmt zu (Soll), die Kasse nimmt ab (Haben). Kein Ertrag, keine Einlage.' }; } },
    { id: 'b-wareneinkauf', lv: 1, gen() { const n = ri(4, 90) * 50, v = vat(n), b = n + v; return { q: `Wareneinkauf auf Ziel: Rechnung über ${eur(n)} netto zzgl. 19 % USt.`, ok: E([ln('Wareneingang 19 %', n), ln('Vorsteuer 19 %', v)], [ln('Verbindlichkeiten aLuL', b)]), bad: [E([ln('Wareneingang 19 %', b)], [ln('Verbindlichkeiten aLuL', b)]), E([ln('Wareneingang 19 %', n), ln('Umsatzsteuer 19 %', v)], [ln('Verbindlichkeiten aLuL', b)]), E([ln('Verbindlichkeiten aLuL', b)], [ln('Wareneingang 19 %', n), ln('Vorsteuer 19 %', v)])], why: 'Die gezahlte Umsatzsteuer ist Vorsteuer, eine Forderung gegen das Finanzamt (§ 15 Abs. 1 S. 1 Nr. 1 UStG). Aufwand ist nur der Nettobetrag.' }; } },
    { id: 'b-warenverkauf', lv: 1, gen() { const n = ri(4, 90) * 50, v = vat(n), b = n + v; return { q: `Warenverkauf auf Ziel: ${eur(n)} netto zzgl. 19 % USt.`, ok: E([ln('Forderungen aLuL', b)], [ln('Umsatzerlöse 19 %', n), ln('Umsatzsteuer 19 %', v)]), bad: [E([ln('Forderungen aLuL', b)], [ln('Umsatzerlöse 19 %', b)]), E([ln('Forderungen aLuL', b)], [ln('Umsatzerlöse 19 %', n), ln('Vorsteuer 19 %', v)]), E([ln('Umsatzerlöse 19 %', n), ln('Umsatzsteuer 19 %', v)], [ln('Forderungen aLuL', b)])], why: 'Die in Rechnung gestellte Umsatzsteuer schuldet der Betrieb dem Finanzamt. Ertrag ist nur der Nettobetrag.' }; } },
    { id: 'b-verb-bank', lv: 1, gen() { const b = r2(ri(4, 90) * 50 * 1.19); return { q: `Überweisung zum Ausgleich einer Eingangsrechnung über ${eur(b)}.`, ok: E([ln('Verbindlichkeiten aLuL', b)], [ln('Bank', b)]), bad: [E([ln('Bank', b)], [ln('Verbindlichkeiten aLuL', b)]), E([ln('Wareneingang 19 %', b)], [ln('Bank', b)]), E([ln('Verbindlichkeiten aLuL', b)], [ln('Kasse', b)])], why: 'Aktiv-Passiv-Minderung. Wareneinkauf und Vorsteuer wurden schon beim Rechnungseingang gebucht.' }; } },
    { id: 'b-ford-bank', lv: 1, gen() { const n = ri(4, 90) * 50, v = vat(n), b = n + v; return { q: `Ein Kunde überweist eine offene Rechnung über ${eur(b)}.`, ok: E([ln('Bank', b)], [ln('Forderungen aLuL', b)]), bad: [E([ln('Forderungen aLuL', b)], [ln('Bank', b)]), E([ln('Bank', b)], [ln('Umsatzerlöse 19 %', n), ln('Umsatzsteuer 19 %', v)]), E([ln('Kasse', b)], [ln('Forderungen aLuL', b)])], why: 'Aktivtausch. Erlös und Umsatzsteuer wurden schon mit der Ausgangsrechnung gebucht.' }; } },
    { id: 'b-privatentnahme', lv: 1, gen() { const x = ri(2, 40) * 50; return { q: `Der Inhaber entnimmt ${eur(x)} bar für private Zwecke.`, ok: E([ln('Privatentnahmen', x)], [ln('Kasse', x)]), bad: [E([ln('Privateinlagen', x)], [ln('Kasse', x)]), E([ln('Kasse', x)], [ln('Privatentnahmen', x)]), E([ln('Sonstige betriebliche Aufwendungen', x)], [ln('Kasse', x)])], why: 'Entnahmen mindern das Eigenkapital, sind aber kein Aufwand (§ 4 Abs. 1 EStG).' }; } },
    { id: 'b-privateinlage', lv: 1, gen() { const x = ri(5, 100) * 100; return { q: `Der Inhaber überweist ${eur(x)} von seinem Privatkonto auf das Geschäftskonto.`, ok: E([ln('Bank', x)], [ln('Privateinlagen', x)]), bad: [E([ln('Bank', x)], [ln('Privatentnahmen', x)]), E([ln('Privateinlagen', x)], [ln('Bank', x)]), E([ln('Bank', x)], [ln('Sonstige betriebliche Erträge', x)])], why: 'Einlagen erhöhen das Eigenkapital, sind aber kein Ertrag (§ 4 Abs. 1 EStG).' }; } },
    { id: 'b-darlehen', lv: 1, gen() { const x = ri(10, 200) * 500; return { q: `Die Bank zahlt ein Darlehen über ${eur(x)} auf das Geschäftskonto aus.`, ok: E([ln('Bank', x)], [ln('Verbindlichkeiten ggü. Kreditinstituten', x)]), bad: [E([ln('Verbindlichkeiten ggü. Kreditinstituten', x)], [ln('Bank', x)]), E([ln('Bank', x)], [ln('Zinserträge', x)]), E([ln('Bank', x)], [ln('Privateinlagen', x)])], why: 'Aktiv-Passiv-Mehrung: Schuld und Bankguthaben steigen. Ein Ertrag entsteht nicht.' }; } },
    { id: 'b-miete', lv: 1, gen() { const x = ri(8, 60) * 50, n = r2(x / 1.19); return { q: `Überweisung der Monatsmiete für das Büro: ${eur(x)}. Der Vermieter hat nicht zur Umsatzsteuer optiert.`, ok: E([ln('Mietaufwand', x)], [ln('Bank', x)]), bad: [E([ln('Mietaufwand', n), ln('Vorsteuer 19 %', x - n)], [ln('Bank', x)]), E([ln('Aktive Rechnungsabgrenzung', x)], [ln('Bank', x)]), E([ln('Bank', x)], [ln('Mietaufwand', x)])], why: 'Die Vermietung ist steuerfrei (§ 4 Nr. 12 UStG); ohne Option (§ 9 UStG) steht keine Umsatzsteuer in der Rechnung, also gibt es keine Vorsteuer.' }; } },
    { id: 'b-buerobedarf', lv: 1, gen() { const n = ri(3, 60) * 10, v = vat(n), b = n + v; return { q: `Barkauf von Büromaterial für ${eur(b)} brutto inkl. 19 % USt.`, ok: E([ln('Bürobedarf', n), ln('Vorsteuer 19 %', v)], [ln('Kasse', b)]), bad: [E([ln('Bürobedarf', b)], [ln('Kasse', b)]), E([ln('Bürobedarf', n), ln('Umsatzsteuer 19 %', v)], [ln('Kasse', b)]), E([ln('Bürobedarf', n), ln('Vorsteuer 19 %', v)], [ln('Bank', b)])], why: 'Netto = brutto ÷ 1,19. Die Vorsteuer ist abziehbar, bar heißt Kasse.' }; } },
    { id: 'b-barverkauf-7', lv: 1, gen() { const n = ri(2, 40) * 50, v = vat(n, 0.07), b = n + v, n19 = r2(b / 1.19); return { q: `Barverkauf von Büchern für ${eur(b)} brutto inkl. 7 % USt.`, ok: E([ln('Kasse', b)], [ln('Umsatzerlöse 7 %', n), ln('Umsatzsteuer 7 %', v)]), bad: [E([ln('Kasse', b)], [ln('Umsatzerlöse 19 %', n19), ln('Umsatzsteuer 19 %', b - n19)]), E([ln('Kasse', b)], [ln('Umsatzerlöse 7 %', b)]), E([ln('Umsatzerlöse 7 %', n), ln('Umsatzsteuer 7 %', v)], [ln('Kasse', b)])], why: 'Bücher unterliegen dem ermäßigten Satz (§ 12 Abs. 2 Nr. 1 UStG mit Anlage 2): netto = brutto ÷ 1,07.' }; } },

    { id: 'b-skonto-erhalten', lv: 2, gen() { const n = ri(10, 80) * 100, v = vat(n), b = n + v, bk = r2(b * 0.98), sn = r2(n * 0.02), sv = r2(v * 0.02); return { q: `Ausgleich einer Eingangsrechnung für Waren (${eur(n)} + 19 % USt = ${eur(b)}) per Bank unter Abzug von 2 % Skonto.`, ok: E([ln('Verbindlichkeiten aLuL', b)], [ln('Bank', bk), ln('Erhaltene Skonti 19 %', sn), ln('Vorsteuer 19 %', sv)]), bad: [E([ln('Verbindlichkeiten aLuL', b)], [ln('Bank', bk), ln('Erhaltene Skonti 19 %', r2(b * 0.02))]), E([ln('Verbindlichkeiten aLuL', b)], [ln('Bank', bk), ln('Gewährte Skonti 19 %', sn), ln('Vorsteuer 19 %', sv)]), E([ln('Verbindlichkeiten aLuL', b)], [ln('Bank', bk), ln('Erhaltene Skonti 19 %', sn), ln('Umsatzsteuer 19 %', sv)])], why: 'Skonto mindert nachträglich das Entgelt; die Vorsteuer wird anteilig berichtigt (§ 17 Abs. 1 UStG). Erhaltene Skonti mindern die Anschaffungskosten der Ware.' }; } },
    { id: 'b-skonto-gewaehrt', lv: 2, gen() { const n = ri(10, 80) * 100, v = vat(n), b = n + v, bk = r2(b * 0.97), sn = r2(n * 0.03), sv = r2(v * 0.03); return { q: `Ein Kunde zahlt eine Rechnung über ${eur(n)} + 19 % USt unter Abzug von 3 % Skonto per Bank.`, ok: E([ln('Bank', bk), ln('Gewährte Skonti 19 %', sn), ln('Umsatzsteuer 19 %', sv)], [ln('Forderungen aLuL', b)]), bad: [E([ln('Bank', bk), ln('Gewährte Skonti 19 %', r2(b * 0.03))], [ln('Forderungen aLuL', b)]), E([ln('Bank', bk), ln('Erhaltene Skonti 19 %', sn), ln('Umsatzsteuer 19 %', sv)], [ln('Forderungen aLuL', b)]), E([ln('Bank', bk), ln('Gewährte Skonti 19 %', sn), ln('Vorsteuer 19 %', sv)], [ln('Forderungen aLuL', b)])], why: 'Das Entgelt sinkt, die geschuldete Umsatzsteuer wird anteilig berichtigt (§ 17 Abs. 1 UStG).' }; } },
    { id: 'b-anzahlung', lv: 2, gen() { const n = ri(10, 90) * 100, v = vat(n), b = n + v; return { q: `Ein Kunde zahlt ${eur(b)} brutto (19 % USt) als Anzahlung auf eine Maschine, die erst im nächsten Quartal geliefert wird.`, ok: E([ln('Bank', b)], [ln('Erhaltene Anzahlungen', n), ln('Umsatzsteuer 19 %', v)]), bad: [E([ln('Bank', b)], [ln('Erhaltene Anzahlungen', b)]), E([ln('Bank', b)], [ln('Umsatzerlöse 19 %', n), ln('Umsatzsteuer 19 %', v)]), E([ln('Bank', b)], [ln('Erhaltene Anzahlungen', n), ln('Vorsteuer 19 %', v)])], why: 'Mindest-Istversteuerung: Bei Anzahlungen entsteht die Umsatzsteuer schon mit der Vereinnahmung (§ 13 Abs. 1 Nr. 1 a S. 4 UStG). Ein Erlös entsteht erst mit der Lieferung.' }; } },
    { id: 'b-ig-erwerb', lv: 2, gen() { const n = ri(10, 90) * 100, v = vat(n); return { q: `Einkauf von Waren bei einem Lieferanten in Italien (beide Unternehmer mit USt-IdNr.) für ${eur(n)} netto auf Ziel.`, ok: E([ln('Wareneingang ig. Erwerb 19 %', n), ln('Vorsteuer ig. Erwerb 19 %', v)], [ln('Verbindlichkeiten aLuL', n), ln('Umsatzsteuer ig. Erwerb 19 %', v)]), bad: [E([ln('Wareneingang ig. Erwerb 19 %', n)], [ln('Verbindlichkeiten aLuL', n)]), E([ln('Wareneingang ig. Erwerb 19 %', n), ln('Vorsteuer 19 %', v)], [ln('Verbindlichkeiten aLuL', n + v)]), E([ln('Wareneingang ig. Erwerb 19 %', n + v)], [ln('Verbindlichkeiten aLuL', n + v)])], why: 'Innergemeinschaftlicher Erwerb (§ 1a UStG): Der Erwerber schuldet die Erwerbsteuer und zieht sie zugleich als Vorsteuer ab (§ 15 Abs. 1 S. 1 Nr. 3 UStG). Die Rechnung aus Italien ist netto.' }; } },
    { id: 'b-13b', lv: 2, gen() { const n = ri(10, 60) * 100, v = vat(n); return { q: `Eine Unternehmensberaterin aus Österreich berät den Betrieb. Rechnung: ${eur(n)} netto ohne Umsatzsteuer, Zahlung später.`, ok: E([ln('Beratungskosten', n), ln('Vorsteuer § 13b UStG', v)], [ln('Verbindlichkeiten aLuL', n), ln('Umsatzsteuer § 13b UStG', v)]), bad: [E([ln('Beratungskosten', n)], [ln('Verbindlichkeiten aLuL', n)]), E([ln('Beratungskosten', n), ln('Vorsteuer 19 %', v)], [ln('Verbindlichkeiten aLuL', n + v)]), E([ln('Beratungskosten', n + v)], [ln('Verbindlichkeiten aLuL', n + v)])], why: 'Leistungsort ist der Sitz des Empfängers in Deutschland (§ 3a Abs. 2 UStG). Weil die Beraterin im Ausland ansässig ist, schuldet der Empfänger die Steuer (§ 13b Abs. 1, Abs. 5 UStG) und zieht sie als Vorsteuer ab (§ 15 Abs. 1 S. 1 Nr. 4 UStG).' }; } },
    { id: 'b-entnahme-ware', lv: 2, gen() { const n = ri(4, 40) * 25, v = vat(n), b = n + v; return { q: `Der Inhaber entnimmt Waren für private Zwecke. Einkaufspreis zum Zeitpunkt der Entnahme ${eur(n)} netto; beim Einkauf wurde die Vorsteuer abgezogen.`, ok: E([ln('Privatentnahmen', b)], [ln('Unentgeltliche Wertabgaben 19 %', n), ln('Umsatzsteuer 19 %', v)]), bad: [E([ln('Privatentnahmen', n)], [ln('Wareneingang 19 %', n)]), E([ln('Privatentnahmen', n)], [ln('Unentgeltliche Wertabgaben 19 %', n)]), E([ln('Privatentnahmen', b)], [ln('Wareneingang 19 %', n), ln('Vorsteuer 19 %', v)])], why: 'Entnahme eines Gegenstands, für den Vorsteuer gezogen wurde: unentgeltliche Wertabgabe (§ 3 Abs. 1b Nr. 1 UStG). Bemessungsgrundlage ist der aktuelle Einkaufspreis (§ 10 Abs. 4 Nr. 1 UStG).' }; } },
    { id: 'b-ruecksendung', lv: 2, gen() { const n = ri(2, 40) * 50, v = vat(n), b = n + v; return { q: `Rücksendung mangelhafter Waren an den Lieferanten: ${eur(n)} netto zzgl. 19 % USt (auf Ziel gekauft).`, ok: E([ln('Verbindlichkeiten aLuL', b)], [ln('Wareneingang 19 %', n), ln('Vorsteuer 19 %', v)]), bad: [E([ln('Verbindlichkeiten aLuL', b)], [ln('Wareneingang 19 %', b)]), E([ln('Wareneingang 19 %', n), ln('Vorsteuer 19 %', v)], [ln('Verbindlichkeiten aLuL', b)]), E([ln('Verbindlichkeiten aLuL', b)], [ln('Wareneingang 19 %', n), ln('Umsatzsteuer 19 %', v)])], why: 'Die Rücksendung macht den Einkauf anteilig rückgängig: Aufwand und Vorsteuer werden korrigiert (§ 17 Abs. 1 UStG).' }; } },
    { id: 'b-bewirtung', lv: 2, gen() { const n1 = ri(6, 50) * 10, n2 = ri(2, 20) * 10, v1 = vat(n1, 0.07), v2 = vat(n2), n = n1 + n2, b = n + v1 + v2; return { q: `Bewirtung von Geschäftsfreunden im Restaurant 2026, bar bezahlt, angemessen und belegt: Speisen ${eur(n1)} netto + 7 % USt, Getränke ${eur(n2)} netto + 19 % USt.`, ok: E([ln('Bewirtungskosten', n * 0.7), ln('Nicht abziehbare Bewirtungskosten', n * 0.3), ln('Vorsteuer 7 %', v1), ln('Vorsteuer 19 %', v2)], [ln('Kasse', b)]), bad: [E([ln('Bewirtungskosten', n * 0.7), ln('Nicht abziehbare Bewirtungskosten', n * 0.3 + (v1 + v2) * 0.3), ln('Vorsteuer 7 %', v1 * 0.7), ln('Vorsteuer 19 %', v2 * 0.7)], [ln('Kasse', b)]), E([ln('Bewirtungskosten', n * 0.7), ln('Nicht abziehbare Bewirtungskosten', n * 0.3), ln('Vorsteuer 19 %', vat(n))], [ln('Kasse', n + vat(n))]), E([ln('Bewirtungskosten', b * 0.7), ln('Nicht abziehbare Bewirtungskosten', b * 0.3)], [ln('Kasse', b)])], why: 'Speisen seit 2026 mit 7 %, Getränke weiter mit 19 % (§ 12 Abs. 2 UStG). 70 % der Nettokosten sind Betriebsausgabe (§ 4 Abs. 5 S. 1 Nr. 2 EStG), 30 % kommen auf ein eigenes Konto für nicht abziehbare Ausgaben. Die Vorsteuer ist voll abziehbar: § 15 Abs. 1a S. 2 UStG nimmt die Bewirtung vom Abzugsverbot aus.' }; } },

    { id: 'b-anschaffung', lv: 3, gen() { const P = ri(80, 400) * 100, T = ri(4, 20) * 50, M = ri(5, 30) * 100, ak = P + T + M, v = vat(ak); return { q: `Kauf einer Maschine auf Ziel: Listenpreis ${eur(P)} netto, Transport ${eur(T)} netto, Montage ${eur(M)} netto, jeweils zzgl. 19 % USt.`, ok: E([ln('Technische Anlagen und Maschinen', ak), ln('Vorsteuer 19 %', v)], [ln('Verbindlichkeiten aLuL', ak + v)]), bad: [E([ln('Technische Anlagen und Maschinen', P), ln('Sonstige betriebliche Aufwendungen', T + M), ln('Vorsteuer 19 %', v)], [ln('Verbindlichkeiten aLuL', ak + v)]), E([ln('Technische Anlagen und Maschinen', ak + v)], [ln('Verbindlichkeiten aLuL', ak + v)]), E([ln('Technische Anlagen und Maschinen', P), ln('Vorsteuer 19 %', vat(P))], [ln('Verbindlichkeiten aLuL', P + vat(P))])], why: 'Anschaffungsnebenkosten wie Transport und Montage gehören zu den Anschaffungskosten (§ 255 Abs. 1 HGB) und werden mit abgeschrieben. Die Vorsteuer gehört nicht dazu (§ 9b EStG).' }; } },
    { id: 'b-afa', lv: 3, gen() { const N = pick([4, 5, 6, 8, 10]), A = N * 1200 * ri(2, 9), M = ri(2, 11), y = A / N, x = y * (13 - M) / 12; return { q: `Abschreibung zum 31.12.2026: Maschine, Anschaffungskosten ${eur(A, 0)}, angeschafft am ${ri(2, 27)}. ${MON[M - 1]} 2026, Nutzungsdauer ${N} Jahre, linear.`, ok: E([ln('Abschreibungen auf Sachanlagen', x)], [ln('Technische Anlagen und Maschinen', x)]), bad: [E([ln('Abschreibungen auf Sachanlagen', y)], [ln('Technische Anlagen und Maschinen', y)]), E([ln('Abschreibungen auf Sachanlagen', y * (12 - M) / 12)], [ln('Technische Anlagen und Maschinen', y * (12 - M) / 12)]), E([ln('Abschreibungen auf Sachanlagen', M <= 6 ? y : y / 2)], [ln('Technische Anlagen und Maschinen', M <= 6 ? y : y / 2)]), E([ln('Technische Anlagen und Maschinen', x)], [ln('Abschreibungen auf Sachanlagen', x)])], why: `Im Jahr der Anschaffung nur zeitanteilig, der Anschaffungsmonat zählt voll (§ 7 Abs. 1 S. 4 EStG): ${eur(y)} × ${13 - M}/12 = ${eur(x)}. Die Halbjahresregel gibt es seit 2004 nicht mehr.` }; } },
    { id: 'b-gwg', lv: 3, gen() {
      if (rnd() < 0.5) { const P = ri(26, 80) * 10; return { q: `Kauf eines Bürostuhls für ${eur(P)} netto im Mai 2026. Ziel: im Erstjahr so viel wie möglich abschreiben. Abschreibungsbuchung zum 31.12.?`, ok: E([ln('Sofortabschreibung GWG', P)], [ln('Geringwertige Wirtschaftsgüter', P)]), bad: [E([ln('Abschreibungen auf Sachanlagen', P / 13 * 8 / 12)], [ln('Betriebs- und Geschäftsausstattung', P / 13 * 8 / 12)]), E([ln('Abschreibungen auf Sammelposten', P / 5)], [ln('Sammelposten GWG', P / 5)]), E([ln('Sofortabschreibung GWG', P * 1.19)], [ln('Geringwertige Wirtschaftsgüter', P * 1.19)])], why: 'Bis 800 € netto darf sofort voll abgeschrieben werden (§ 6 Abs. 2 EStG), unabhängig vom Monat.' }; }
      const P = ri(81, 100) * 10, M = ri(3, 10); return { q: `Kauf eines Büroschranks für ${eur(P)} netto im ${MON[M - 1]} 2026; für alle Anschaffungen von 250 bis 1.000 € wurde ein Sammelposten gebildet. Abschreibungsbuchung zum 31.12.?`, ok: E([ln('Abschreibungen auf Sammelposten', P / 5)], [ln('Sammelposten GWG', P / 5)]), bad: [E([ln('Sofortabschreibung GWG', P)], [ln('Geringwertige Wirtschaftsgüter', P)]), E([ln('Abschreibungen auf Sammelposten', P / 5 * (13 - M) / 12)], [ln('Sammelposten GWG', P / 5 * (13 - M) / 12)]), E([ln('Abschreibungen auf Sachanlagen', P / 13 * (13 - M) / 12)], [ln('Betriebs- und Geschäftsausstattung', P / 13 * (13 - M) / 12)])], why: 'Über 800 € keine Sofortabschreibung. Der Sammelposten wird über fünf Jahre mit je einem Fünftel aufgelöst, egal in welchem Monat gekauft wurde (§ 6 Abs. 2a EStG).' };
    } },
    { id: 'b-anlagenverkauf', lv: 3, gen() { const P = ri(10, 80) * 100, v = vat(P), b = P + v; return { q: `Verkauf einer gebrauchten Maschine für ${eur(P)} netto zzgl. 19 % USt, Zahlung per Bank. Welche Buchung erfasst den Erlös?`, ok: E([ln('Bank', b)], [ln('Erlöse aus Anlagenverkäufen 19 %', P), ln('Umsatzsteuer 19 %', v)]), bad: [E([ln('Bank', b)], [ln('Erlöse aus Anlagenverkäufen 19 %', b)]), E([ln('Bank', b)], [ln('Erlöse aus Anlagenverkäufen 19 %', P), ln('Vorsteuer 19 %', v)]), E([ln('Erlöse aus Anlagenverkäufen 19 %', P), ln('Umsatzsteuer 19 %', v)], [ln('Bank', b)])], why: 'Der Verkauf von Anlagevermögen ist ein steuerbares Hilfsgeschäft (§ 1 Abs. 1 Nr. 1 UStG). Der Restbuchwert geht gesondert als Anlagenabgang aus.' }; } },

    { id: 'b-arap', lv: 4, gen() { const M = ri(3, 11), X = 12 * ri(5, 30) * 10, nx = X * (M - 1) / 12, cu = X * (13 - M) / 12; return { q: `Am 1. ${MON[M - 1]} 2026 wurde die Kfz-Versicherung für zwölf Monate im Voraus bezahlt: ${eur(X)}, als Aufwand gebucht. Abschlussbuchung zum 31.12.2026?`, ok: E([ln('Aktive Rechnungsabgrenzung', nx)], [ln('Versicherungen', nx)]), bad: [E([ln('Aktive Rechnungsabgrenzung', cu)], [ln('Versicherungen', cu)]), E([ln('Versicherungen', nx)], [ln('Passive Rechnungsabgrenzung', nx)]), E([ln('Sonstige Vermögensgegenstände', nx)], [ln('Versicherungen', nx)]), E([ln('Versicherungen', nx)], [ln('Aktive Rechnungsabgrenzung', nx)])], why: `Ausgabe vor dem Stichtag für Aufwand des Folgejahres: aktiver Rechnungsabgrenzungsposten (§ 250 Abs. 1 HGB, § 5 Abs. 5 S. 1 Nr. 1 EStG). Auf 2027 entfallen ${M - 1} Monate: ${eur(nx)}.` }; } },
    { id: 'b-prap', lv: 4, gen() { const M = ri(8, 12), X = 6 * ri(3, 20) * 100, nx = X * (M - 7) / 6, cu = X * (13 - M) / 6; return { q: `Am 1. ${MON[M - 1]} 2026 hat der Betrieb Miete für sechs Monate im Voraus erhalten: ${eur(X)} (umsatzsteuerfrei, als Ertrag gebucht). Abschlussbuchung zum 31.12.2026?`, ok: E([ln('Mieterträge', nx)], [ln('Passive Rechnungsabgrenzung', nx)]), bad: [E([ln('Passive Rechnungsabgrenzung', nx)], [ln('Mieterträge', nx)]), E([ln('Mieterträge', cu)], [ln('Passive Rechnungsabgrenzung', cu)]), E([ln('Mieterträge', nx)], [ln('Sonstige Verbindlichkeiten', nx)]), E([ln('Aktive Rechnungsabgrenzung', nx)], [ln('Mieterträge', nx)])], why: `Einnahme vor dem Stichtag für Ertrag des Folgejahres: passiver Rechnungsabgrenzungsposten (§ 250 Abs. 2 HGB). Auf 2027 ${M - 7 === 1 ? 'entfällt ein Monat' : `entfallen ${M - 7} Monate`}: ${eur(nx)}.` }; } },
    { id: 'b-rueckstellung', lv: 4, gen() { const X = ri(15, 60) * 100; return { q: `Für die Erstellung des Jahresabschlusses 2026 erwartet der Betrieb Kosten von ${eur(X)} netto; die Rechnung kommt 2027.`, ok: E([ln('Abschluss- und Prüfungskosten', X)], [ln('Sonstige Rückstellungen', X)]), bad: [E([ln('Abschluss- und Prüfungskosten', X), ln('Vorsteuer 19 %', vat(X))], [ln('Sonstige Rückstellungen', X + vat(X))]), E([ln('Sonstige Rückstellungen', X)], [ln('Abschluss- und Prüfungskosten', X)]), E([ln('Abschluss- und Prüfungskosten', X)], [ln('Verbindlichkeiten aLuL', X)])], why: 'Ungewisse Verbindlichkeit, wirtschaftlich im alten Jahr verursacht: Rückstellung (§ 249 Abs. 1 S. 1 HGB). Vorsteuer erst, wenn die Rechnung vorliegt (§ 15 Abs. 1 S. 1 Nr. 1 UStG).' }; } },
    { id: 'b-sonst-verb', lv: 4, gen() { const X = ri(10, 60) * 50; return { q: `Die Dezembermiete 2026 für die Lagerhalle (${eur(X)}, umsatzsteuerfrei) wird erst am 5. Januar 2027 überwiesen. Buchung zum 31.12.2026?`, ok: E([ln('Mietaufwand', X)], [ln('Sonstige Verbindlichkeiten', X)]), bad: [E([ln('Mietaufwand', X)], [ln('Sonstige Rückstellungen', X)]), E([ln('Aktive Rechnungsabgrenzung', X)], [ln('Mietaufwand', X)]), E([ln('Mietaufwand', X)], [ln('Passive Rechnungsabgrenzung', X)])], why: 'Aufwand des alten Jahres, Zahlung im neuen, Betrag steht fest: sonstige Verbindlichkeit. Eine Rückstellung bräuchte Ungewissheit, ein RAP eine Zahlung vor dem Stichtag.' }; } },
    { id: 'b-sonst-ford', lv: 4, gen() { const X = ri(5, 90) * 10; return { q: `Zinsen für Dezember 2026 auf ein Festgeld (${eur(X)}) werden erst im Januar 2027 gutgeschrieben. Buchung zum 31.12.2026?`, ok: E([ln('Sonstige Vermögensgegenstände', X)], [ln('Zinserträge', X)]), bad: [E([ln('Aktive Rechnungsabgrenzung', X)], [ln('Zinserträge', X)]), E([ln('Zinserträge', X)], [ln('Sonstige Vermögensgegenstände', X)]), E([ln('Zinserträge', X)], [ln('Passive Rechnungsabgrenzung', X)])], why: 'Ertrag des alten Jahres, Zahlung erst im neuen: sonstige Forderung (sonstige Vermögensgegenstände), kein Rechnungsabgrenzungsposten.' }; } },
    { id: 'b-ewb', lv: 4, gen() { const n = ri(5, 60) * 1000, v = vat(n), b = n + v, p = pick([20, 25, 40, 50, 60]), w = n * p / 100; return { q: `Eine Forderung über ${eur(b)} (inkl. 19 % USt) ist zweifelhaft und schon umgebucht; erwarteter Ausfall ${p} %. Buchung der Einzelwertberichtigung?`, ok: E([ln('Abschreibungen auf Forderungen', w)], [ln('Einzelwertberichtigung zu Forderungen', w)]), bad: [E([ln('Abschreibungen auf Forderungen', b * p / 100)], [ln('Einzelwertberichtigung zu Forderungen', b * p / 100)]), E([ln('Abschreibungen auf Forderungen', w), ln('Umsatzsteuer 19 %', v * p / 100)], [ln('Einzelwertberichtigung zu Forderungen', b * p / 100)]), E([ln('Forderungsverluste 19 %', n), ln('Umsatzsteuer 19 %', v)], [ln('Zweifelhafte Forderungen', b)])], why: 'Wertberichtigt wird nur der Nettobetrag. Die Umsatzsteuer wird erst berichtigt, wenn die Forderung uneinbringlich ist (§ 17 Abs. 2 Nr. 1 UStG).' }; } },
    { id: 'b-forderungsausfall', lv: 4, gen() { const n = ri(2, 40) * 500, v = vat(n), b = n + v; return { q: `Das Insolvenzverfahren eines Kunden ist abgeschlossen; die Forderung über ${eur(b)} (inkl. 19 % USt) fällt endgültig aus. Sie war nicht wertberichtigt.`, ok: E([ln('Forderungsverluste 19 %', n), ln('Umsatzsteuer 19 %', v)], [ln('Forderungen aLuL', b)]), bad: [E([ln('Forderungsverluste 19 %', b)], [ln('Forderungen aLuL', b)]), E([ln('Forderungsverluste 19 %', n), ln('Vorsteuer 19 %', v)], [ln('Forderungen aLuL', b)]), E([ln('Forderungen aLuL', b)], [ln('Forderungsverluste 19 %', n), ln('Umsatzsteuer 19 %', v)])], why: 'Fällt das Entgelt endgültig aus, wird die Umsatzsteuer berichtigt (§ 17 Abs. 2 Nr. 1 mit Abs. 1 UStG); nur der Nettobetrag ist Aufwand.' }; } },
    { id: 'b-kfz-privat', lv: 4, gen() { const L = ri(250, 900) * 100 + ri(1, 99), X = Math.floor(L / 100), U = r2(X * 0.8 * 0.19), X2 = r2(L * 0.01), U2 = r2(X2 * 0.8 * 0.19); return { q: `Private Nutzung des betrieblichen Pkw (Verbrenner, betriebliche Nutzung über 50 %) im Januar, 1 %-Regelung. Bruttolistenpreis ${eur(L)}. Umsatzsteuer mit dem pauschalen Abschlag von 20 % für Kosten ohne Vorsteuer.`, ok: E([ln('Privatentnahmen', X + U)], [ln('Unentgeltliche Wertabgabe Kfz', X), ln('Umsatzsteuer 19 %', U)]), bad: [E([ln('Privatentnahmen', X + vat(X))], [ln('Unentgeltliche Wertabgabe Kfz', X), ln('Umsatzsteuer 19 %', vat(X))]), E([ln('Privatentnahmen', X2 + U2)], [ln('Unentgeltliche Wertabgabe Kfz', X2), ln('Umsatzsteuer 19 %', U2)]), E([ln('Privatentnahmen', X)], [ln('Unentgeltliche Wertabgabe Kfz', X)])], why: `1 % des auf volle 100 € abgerundeten Bruttolistenpreises je Monat (§ 6 Abs. 1 Nr. 4 S. 2 EStG): ${eur(X)}. Umsatzsteuer auf 80 % davon (Abschn. 15.23 UStAE): ${eur(U)}.` }; } },
  ];

  /* ================= 5 · Rechenfälle ================= */
  const rateTab = { I: [7, 11, 15, 19, 23, 27, 30], II: [15, 20, 25, 30, 35, 40, 43], III: [30, 30, 30, 30, 50, 50, 50] }, BANDS = [75e3, 300e3, 600e3, 6e6, 13e6, 26e6, Infinity];
  const band = x => BANDS.findIndex(t => x <= t);
  const erbTax = (cls, x) => x * rateTab[cls][band(x)] / 100;
  const hardship = (cls, x) => { const i = band(x); if (i === 0) return erbTax(cls, x); const T = BANDS[i - 1], r = rateTab[cls][i]; return Math.min(erbTax(cls, x), T * rateTab[cls][i - 1] / 100 + (r <= 30 ? 0.5 : 0.75) * (x - T)); };
  const stepTax = (cls, x) => { let t = 0, lo = 0; for (let i = 0; i < BANDS.length && x > lo; i++) { t += (Math.min(x, BANDS[i]) - lo) * rateTab[cls][i] / 100; lo = BANDS[i]; } return t; };
  const RC = [
    { id: 'r-entfernung', lv: 1, gen() { const K = ri(6, 48), T = ri(180, 225), ok = r2(K * T * 0.38); return { q: `Arbeitnehmerin 2026: einfache Entfernung ${K} km zur ersten Tätigkeitsstätte, ${T} Arbeitstage mit dem eigenen Auto. Entfernungspauschale?`, f: 'm', ok, bad: [r2(T * (Math.min(K, 20) * 0.3 + Math.max(0, K - 20) * 0.38)), r2(2 * ok), r2(K * T * 0.3), Math.min(ok, 4500) === ok ? null : 4500], fill: i => r2(K * (T - 10 * i) * 0.38), why: `Seit 2026 0,38 € je Entfernungskilometer ab dem ersten Kilometer (§ 9 Abs. 1 S. 3 Nr. 4 EStG): ${K} × ${T} × 0,38 € = ${eur(ok)}. Nur die einfache Strecke zählt; mit eigenem Auto greift die 4.500-€-Grenze nicht.` }; } },
    { id: 'r-homeoffice', lv: 1, gen() { const T = ri(110, 260), ok = Math.min(6 * T, 1260); return { q: `Ein Selbständiger arbeitet 2026 an ${T} Tagen überwiegend zu Hause, ein häusliches Arbeitszimmer hat er nicht. Abziehbar?`, f: 'm', ok, bad: [6 * T, Math.min(5 * T, 600), 1260, Math.min(6 * T, 1250)], fill: i => Math.max(0, ok - 30 * i), why: '6 € je Tag, höchstens 1.260 € im Jahr, also bis zu 210 Tage (§ 4 Abs. 5 S. 1 Nr. 6c EStG).' }; } },
    { id: 'r-bewirtung', lv: 1, gen() { const n1 = ri(6, 60) * 10, n2 = ri(2, 25) * 10, v1 = vat(n1, 0.07), v2 = vat(n2), n = n1 + n2, v = r2(v1 + v2), b = r2(n + v), o = (x, y) => `Betriebsausgabe ${eur(x)} · Vorsteuer ${eur(y)}`; return { q: `Bewirtung von Geschäftsfreunden im Restaurant 2026, angemessen und belegt: Speisen ${eur(n1 + v1)} brutto (7 % USt), Getränke ${eur(n2 + v2)} brutto (19 % USt). Wie viel ist Betriebsausgabe, wie viel Vorsteuer?`, f: 's', ok: o(r2(n * 0.7), v), bad: [o(r2(b * 0.7), 0), o(r2(n * 0.7), r2(v * 0.7)), o(n, v), o(r2((b / 1.19) * 0.7), r2(b - b / 1.19))], why: `Netto Speisen ${eur(n1)} + Getränke ${eur(n2)} = ${eur(n)}; davon 70 % Betriebsausgabe (§ 4 Abs. 5 S. 1 Nr. 2 EStG). Vorsteuer ${eur(v1)} (7 %) + ${eur(v2)} (19 %) ist voll abziehbar (§ 15 Abs. 1a S. 2 UStG).` }; } },
    { id: 'r-geschenke', lv: 1, gen() { const k = ri(1, 3), p = pick([15, 18, 20, 25, 30, 35, 40, 45, 60]), t = k * p, ok = t <= 50 ? t : 0; return { q: `Eine Kundin erhält im Wirtschaftsjahr ${k === 1 ? 'ein Geschenk' : k + ' Geschenke'} zu je ${eur(p)} netto. Wie viel ist als Betriebsausgabe abziehbar?`, f: 'm', ok, bad: [t, 50, Math.min(t, 50), r2(t * 0.7), 0, 35], why: t <= 50 ? `Zusammen ${eur(t)}, also nicht mehr als 50 € je Empfänger und Jahr: voll abziehbar (§ 4 Abs. 5 S. 1 Nr. 1 EStG).` : `Zusammen ${eur(t)}: Die 50 € sind eine Freigrenze, darüber entfällt der Abzug ganz. Auch die Vorsteuer ist dann nicht abziehbar (§ 15 Abs. 1a UStG).` }; } },
    { id: 'r-abgeltung', lv: 1, gen() { const X = ri(36, 200) * 50, ok = r2((X - 1000) * 0.25 * 1.055); return { q: `Ledige Anlegerin ohne Kirchensteuer: ${eur(X)} Zinsen und Dividenden 2026, Freistellungsauftrag über den vollen Sparer-Pauschbetrag. Abgeltungsteuer und Solidaritätszuschlag zusammen?`, f: 'm', ok, bad: [r2(X * 0.25 * 1.055), r2((X - 801) * 0.25 * 1.055), r2((X - 1000) * 0.25), r2(Math.max(0, X - 2000) * 0.25 * 1.055)], why: `Sparer-Pauschbetrag 1.000 € (§ 20 Abs. 9 EStG). Auf ${eur(X - 1000)} 25 % (§ 32d Abs. 1 EStG) und 5,5 % Solidaritätszuschlag darauf, zusammen 26,375 %.` }; } },

    { id: 'r-afa-linear', lv: 2, gen() { const N = pick([3, 5, 6, 7, 8, 10, 13]), A = N * 12 * ri(2, 20) * 50, M = ri(1, 12), y = A / N, ok = r2(y * (13 - M) / 12); return { q: `Anschaffung einer Maschine im ${MON[M - 1]} 2026 für ${eur(A, 0)} netto, Nutzungsdauer ${N} Jahre. Lineare AfA 2026?`, f: 'm', ok, bad: [y, r2(y * (12 - M) / 12), M <= 6 ? y : y / 2, r2(A / N / 12)], fill: i => r2(y * Math.max(1, 13 - M - i - 1) / 12), why: `${eur(A, 0)} ÷ ${N} = ${eur(y)} im Jahr, im Erstjahr ${13 - M}/12, weil der Anschaffungsmonat voll zählt (§ 7 Abs. 1 S. 4 EStG).` }; } },
    { id: 'r-afa-degressiv', lv: 2, gen() { const N = pick([4, 5, 6, 8, 10, 12, 15, 20]), A = 1200 * ri(5, 60), M = ri(1, 12), rate = Math.min(0.3, 3 / N), f = (13 - M) / 12, ok = r2(A * rate * f); return { q: `Kauf einer Produktionsmaschine im ${MON[M - 1]} 2026 für ${eur(A, 0)}, Nutzungsdauer ${N} Jahre. Höchstmögliche degressive AfA 2026?`, f: 'm', ok, bad: [r2(A * 0.3 * f), r2(A * (3 / N) * f), r2(A * rate), r2(A / N * f), r2(A * Math.min(0.25, 2.5 / N) * f), r2(A * Math.min(0.2, 2 / N) * f)], why: `Für Anschaffungen vom 1.7.2025 bis 31.12.2027: bis zu 30 %, höchstens das Dreifache der linearen AfA (§ 7 Abs. 2 EStG). Linear ${pct(1 / N)}, also Satz ${pct(rate)}; zeitanteilig ${13 - M}/12.` }; } },
    { id: 'r-gebaeude', lv: 2, gen() { const Y = pick([1912, 1958, 1979, 1996, 2008, 2024]), K = ri(25, 90) * 10000, g = pick([20, 25, 30]), M = ri(1, 12), rate = Y >= 2023 ? 0.03 : Y >= 1925 ? 0.02 : 0.025, base = K * (1 - g / 100), f = (13 - M) / 12, ok = r2(base * rate * f), other = rate === 0.02 ? 0.03 : 0.02; return { q: `Kauf eines vermieteten Mehrfamilienhauses (Privatvermögen, fertiggestellt ${Y}) für ${eur(K, 0)}, davon ${g} % für Grund und Boden. Übergang von Besitz, Nutzen und Lasten am 1. ${MON[M - 1]} 2026. Lineare AfA 2026?`, f: 'm', ok, bad: [r2(K * rate * f), r2(base * other * f), r2(base * rate), r2(base * 0.025 * f)], why: `Abschreiben lässt sich nur das Gebäude (${eur(base, 0)}), Grund und Boden nutzt sich nicht ab. Wohngebäude: fertiggestellt vor 1925 2,5 %, 1925 bis 2022 2 %, ab 2023 3 % (§ 7 Abs. 4 S. 1 Nr. 2 EStG). Zeitanteilig ${13 - M}/12.` }; } },
    { id: 'r-sammelposten', lv: 2, gen() { const P = ri(81, 100) * 10, M = ri(2, 11); return { q: `Kauf eines Büroschranks im ${MON[M - 1]} 2026 für ${eur(P)} netto; für das Jahr wird ein Sammelposten gebildet. Abschreibung 2026?`, f: 'm', ok: P / 5, bad: [r2(P / 5 * (13 - M) / 12), P, r2(P / 13 * (13 - M) / 12), r2(P / 3)], why: 'Sammelposten für 250 bis 1.000 € netto: fünf Jahre je ein Fünftel, unabhängig vom Anschaffungsmonat (§ 6 Abs. 2a EStG). Sofortabschreibung gibt es nur bis 800 €.' }; } },

    { id: 'r-gewerbesteuer', lv: 3, gen() {
      const G = ri(60, 400) * 1000, Z = rnd() < 0.5 ? ri(20, 150) * 1000 : ri(160, 420) * 1000, R = ri(0, 30) * 5000, H = pick([340, 380, 400, 410, 435, 450, 470, 490]), eu = rnd() < 0.75;
      const s = Z + R / 2, hz = 0.25 * Math.max(0, s - 200000), ge = Math.floor((G + hz) / 100) * 100, fb = eu ? 24500 : 0, er = Math.max(0, ge - fb), mb = er * 0.035, ok = r2(mb * H / 100);
      const g = (h, f2) => r2(Math.max(0, Math.floor((G + h) / 100) * 100 - f2) * 0.035 * H / 100);
      return { q: `${eu ? 'Einzelunternehmer' : 'GmbH'}: Gewinn ${eur(G, 0)}. Darin sind als Aufwand enthalten: Schuldzinsen ${eur(Z, 0)} und Miete für Büroräume ${eur(R, 0)}. Hebesatz ${H} %. Gewerbesteuer?`, f: 'm', ok, bad: [g(0, fb), g(0.25 * s, fb), g(0.25 * Math.max(0, Z + R - 200000), fb), g(hz, eu ? 0 : 24500)], fill: i => r2(ok * (1 + 0.07 * i)),
        why: [`Summe der Finanzierungsanteile: Zinsen + ½ der Miete für unbewegliche Wirtschaftsgüter = ${eur(s, 0)}; davon ein Viertel des Betrags über 200.000 €: ${eur(hz)} (§ 8 Nr. 1 GewStG)`, `Gewerbeertrag abgerundet ${eur(ge, 0)}${eu ? ' − Freibetrag 24.500 € (§ 11 Abs. 1 S. 3 Nr. 1 GewStG)' : ', kein Freibetrag für Kapitalgesellschaften'} = ${eur(er, 0)}`, `× 3,5 % = Messbetrag ${eur(mb)}; × ${H} % = <b>${eur(ok)}</b>`] };
    } },
    { id: 'r-35', lv: 3, gen() { const mb = ri(20, 400) * 10, H = pick([250, 300, 340, 380, 400, 420, 460, 490]), gs = r2(mb * H / 100), ok = Math.min(4 * mb, gs); return { q: `Einzelunternehmerin: Gewerbesteuer-Messbetrag ${eur(mb)}, Hebesatz ${H} %. Um wie viel ermäßigt sich ihre Einkommensteuer nach § 35 EStG (Einkommensteuer reicht aus)?`, f: 'm', ok, bad: [4 * mb, gs, 3.8 * mb, r2(Math.min(3.8 * mb, gs))], why: `Das 4,0-Fache des Messbetrags (${eur(4 * mb)}), höchstens die tatsächlich zu zahlende Gewerbesteuer (${eur(gs)}) (§ 35 Abs. 1 EStG).` }; } },
    { id: 'r-kst', lv: 3, gen() { const X = ri(50, 900) * 1000, o = (k, s) => `KSt ${eur(k)} · SolZ ${eur(s)}`, k = X * 0.15; return { q: `GmbH, zu versteuerndes Einkommen 2026 ${eur(X, 0)}. Körperschaftsteuer und Solidaritätszuschlag?`, f: 's', ok: o(k, r2(k * 0.055)), bad: [o(k, 0), o(X * 0.25, r2(X * 0.25 * 0.055)), o(k, r2(X * 0.055)), o(X * 0.14, r2(X * 0.14 * 0.055))], why: 'Körperschaftsteuer 15 % (§ 23 Abs. 1 KStG; die Senkung um je einen Punkt beginnt erst 2028). Solidaritätszuschlag 5,5 % der Körperschaftsteuer, für Körperschaften ohne Freigrenze.' }; } },
    { id: 'r-8b', lv: 3, gen() { const Dv = ri(20, 500) * 1000, q = pick([3, 5, 8, 12, 25, 60]), ok = q >= 10 ? Dv * 0.05 : Dv; return { q: `Eine GmbH hält seit Jahren ${q} % an einer anderen GmbH und erhält 2026 eine Dividende von ${eur(Dv, 0)}. Mit welchem Betrag wirkt sich die Dividende im zu versteuernden Einkommen aus?`, f: 'm', ok, bad: [0, Dv * 0.05, Dv, Dv * 0.6, Dv * 0.4], why: q >= 10 ? 'Die Dividende ist steuerfrei (§ 8b Abs. 1 KStG), aber 5 % gelten als nicht abziehbare Betriebsausgabe (§ 8b Abs. 5 KStG).' : 'Streubesitz: Bei unter 10 % zu Beginn des Kalenderjahres gilt die Befreiung nicht (§ 8b Abs. 4 KStG); die Dividende ist voll steuerpflichtig.' }; } },

    { id: 'r-erbschaft', lv: 4, gen() {
      const REL = [['Schenkung an die Tochter', 'I', 400000], ['Schenkung an den Ehemann', 'I', 500000], ['Schenkung an den Enkel, dessen Eltern leben', 'I', 200000], ['Erbschaft der Mutter von ihrem verstorbenen Sohn', 'I', 100000],
        ['Schenkung an die Mutter', 'II', 20000], ['Schenkung an den Bruder', 'II', 20000], ['Erbschaft der Nichte von ihrer Tante', 'II', 20000], ['Schenkung an die Lebensgefährtin (nicht verheiratet)', 'III', 20000]];
      for (;;) {
        const [txt, cls, FB] = pick(REL), erb = txt.startsWith('Erbschaft'), EP = erb ? 15000 : 0, V = FB + EP + ri(20, 3000) * 500 + ri(1, 99), x = Math.floor((V - EP - FB) / 100) * 100, ok = erbTax(cls, x);
        if (hardship(cls, x) < ok - 0.005) continue; // keep clear of the Härteausgleich (§ 19 Abs. 3 ErbStG)
        const alt = { I: 'II', II: 'I', III: 'II' }[cls], fbWrong = FB === 200000 ? 400000 : FB === 400000 ? 500000 : FB === 20000 && txt.includes('Mutter') ? 100000 : FB === 100000 ? 400000 : 400000;
        return { q: `${txt}: Wert ${eur(V)}${erb ? ', Beerdigungskosten ohne Nachweis' : ''}, keine Vorerwerbe, keine Befreiungen. Steuer?`, f: 'm', ok, bad: [stepTax(cls, x), erbTax(alt, x), erbTax(cls, Math.max(0, Math.floor((V - EP - fbWrong) / 100) * 100)), erb ? erbTax(cls, Math.floor((V - FB) / 100) * 100) : erbTax(cls, Math.floor(V / 100) * 100), erbTax(cls, Math.floor(V / 100) * 100)], fill: i => r2(ok * (1 + 0.1 * i)),
          why: [`Steuerklasse ${cls} (§ 15 ErbStG), Freibetrag ${eur(FB, 0)} (§ 16 ErbStG)`, ...(erb ? ['Erbfall: Erbfallkostenpauschale 15.000 € ohne Nachweis (§ 10 Abs. 5 Nr. 3 S. 2 ErbStG)'] : []), `Steuerpflichtiger Erwerb, auf volle 100 € abgerundet (§ 10 Abs. 1 S. 6 ErbStG): ${eur(x, 0)}`, `Ein Satz auf den ganzen Erwerb, kein Stufentarif: ${rateTab[cls][band(x)]} % (§ 19 Abs. 1 ErbStG) = <b>${eur(ok)}</b>`] };
      }
    } },
    { id: 'r-zehnjahre', lv: 4, gen() {
      for (;;) {
        const V1 = ri(10, 38) * 10000, yrs = pick([3, 5, 7, 9, 11, 12]), V2 = ri(25, 70) * 10000 + ri(1, 99), FB = 400000, inside = yrs < 10;
        const x = inside ? Math.max(0, Math.floor((V1 + V2 - FB) / 100) * 100) : Math.max(0, Math.floor((V2 - FB) / 100) * 100), ok = erbTax('I', x);
        if (hardship('I', x) < ok - 0.005) continue;
        const other = inside ? erbTax('I', Math.max(0, Math.floor((V2 - FB) / 100) * 100)) : erbTax('I', Math.max(0, Math.floor((V1 + V2 - FB) / 100) * 100));
        return { q: `Ein Vater hat seiner Tochter vor ${yrs} Jahren ${eur(V1, 0)} geschenkt (damals steuerfrei). Jetzt schenkt er ihr weitere ${eur(V2)}. Schenkungsteuer jetzt?`, f: 'm', ok, bad: [other, stepTax('I', x), erbTax('I', Math.max(0, Math.floor((V1 + V2 - 2 * FB) / 100) * 100)), erbTax('I', Math.floor((V1 + V2) / 100) * 100)], fill: i => r2((ok || 1000) * (1 + 0.15 * i)),
          why: inside ? `Erwerbe von derselben Person innerhalb von zehn Jahren werden zusammengerechnet, der Freibetrag gilt nur einmal (§ 14 Abs. 1 ErbStG): ${eur(V1 + V2)} − 400.000 € → ${x ? `${eur(x, 0)} × ${rateTab.I[band(x)]} % = ${eur(ok)}` : 'nichts zu versteuern'}. Auf den Vorerwerb entfiel keine Steuer, abzuziehen ist also nichts.` : `Der erste Erwerb liegt mehr als zehn Jahre zurück: keine Zusammenrechnung (§ 14 Abs. 1 ErbStG), der Freibetrag von 400.000 € steht wieder voll zur Verfügung${x ? `: ${eur(x, 0)} × ${rateTab.I[band(x)]} % = ${eur(ok)}` : ', die neue Schenkung bleibt darunter'}.` };
      }
    } },
  ];

  /* ================= 6 · Ort der Leistung & Reihengeschäft ================= */
  const LAND = { DE: ['Deutschland', ['München', 'Hamburg', 'Köln', 'Leipzig', 'Mannheim']], FR: ['Frankreich', ['Lyon', 'Paris', 'Straßburg']], AT: ['Österreich', ['Wien', 'Salzburg', 'Linz']],
    IT: ['Italien', ['Mailand', 'Bologna', 'Verona']], NL: ['Niederlande', ['Utrecht', 'Rotterdam']], PL: ['Polen', ['Posen', 'Krakau']], ES: ['Spanien', ['Valencia', 'Sevilla']],
    CH: ['Schweiz', ['Zürich', 'Basel']], NO: ['Norwegen', ['Oslo', 'Bergen']], US: ['USA', ['Boston', 'Chicago']] };
  const EU = ['DE', 'FR', 'AT', 'IT', 'NL', 'PL', 'ES'], DRITT = ['CH', 'NO', 'US'];
  const ART = { NL: ['den ', 'den '], CH: ['der ', 'der '], US: ['den ', 'den '] }, IN = c => 'in ' + (ART[c] ? ART[c][0] : '') + (c === 'NL' ? 'Niederlanden' : LAND[c][0]), AUS = c => 'aus ' + (ART[c] ? ART[c][1] : '') + (c === 'NL' ? 'Niederlanden' : LAND[c][0]);
  const LN = c => LAND[c][0], CT = c => pick(LAND[c][1]), cpick = (pool, not = []) => pick(pool.filter(c => !not.includes(c)));
  const T_NB = 'nicht steuerbar', T_SF = 'steuerbar, aber steuerfrei', T_SL = 'steuerpflichtig, Steuer schuldet der Leistende', T_SE = 'steuerpflichtig, Steuer schuldet der Empfänger (§ 13b)';
  const T_ORDER = [T_NB, T_SF, T_SL, T_SE];
  const B2B_RULE = 'An einen Unternehmer gilt die Grundregel: Ort am Sitz des Empfängers (§ 3a Abs. 2 UStG).';
  function sonst(de) { // a service; de: Germany must be involved somewhere
    for (;;) {
      const k = pick(['beratung', 'beratung', 'grund', 'catering', 'pkwkurz', 'pkwlang', 'messe', 'konzert', 'reparatur', 'umzug', 'stream', 'vermittlung']);
      let b2b = rnd() < 0.5, P = cpick(EU), R = null, S = null, F = null, To = null, place, rule, txt;
      if (k === 'beratung') {
        const w = pick([['Eine Steuerberaterin', 'berät'], ['Ein Rechtsanwalt', 'berät'], ['Eine Unternehmensberaterin', 'berät'], ['Ein Übersetzungsbüro', 'übersetzt Verträge für']]);
        R = b2b ? cpick(EU.concat(DRITT), [P]) : rnd() < 0.4 ? pick(DRITT) : cpick(EU, [P]);
        txt = `${w[0]} aus ${CT(P)} ${w[1]} ${b2b ? `eine GmbH in ${CT(R)}` : `einen Privatmann aus ${CT(R)}`}.`;
        place = b2b || DRITT.includes(R) ? R : P;
        rule = b2b ? B2B_RULE : DRITT.includes(R) ? 'Beratung oder Übersetzung für eine Privatperson mit Wohnsitz im Drittland: Ort am Wohnsitz des Empfängers (§ 3a Abs. 4 S. 1, S. 2 Nr. 3 UStG).' : 'Leistung an eine Privatperson in der EU: Grundregel, Ort am Sitz des Leistenden (§ 3a Abs. 1 UStG).';
      } else if (k === 'grund') {
        S = cpick(EU, [P]); R = cpick(EU, [P, S]);
        const w = pick([['Ein Architekt', 'plant für', 'ein Wohnhaus in'], ['Ein Dachdecker', 'repariert für', 'das Dach eines Ferienhauses in'], ['Ein Gutachter', 'bewertet für', 'ein Grundstück in']]);
        txt = `${w[0]} aus ${CT(P)} ${w[1]} ${b2b ? `eine GmbH aus ${CT(R)}` : `eine Privatperson aus ${CT(R)}`} ${w[2]} ${CT(S)}.`;
        place = S; rule = 'Leistung im Zusammenhang mit einem Grundstück: Ort dort, wo das Grundstück liegt, an Unternehmer wie an Privatleute (§ 3a Abs. 3 Nr. 1 UStG).';
      } else if (k === 'catering') {
        S = cpick(EU, [P]); R = cpick(EU, [S]);
        txt = `Ein Cateringunternehmen aus ${CT(P)} bewirtet mit eigenem Servicepersonal die Gäste ${b2b ? `einer GmbH aus ${CT(R)}` : `einer Privatperson aus ${CT(R)}`} bei einer Feier in ${CT(S)}.`;
        place = S; rule = 'Restaurationsleistung (Speisen mit Service vor Ort): Ort der tatsächlichen Erbringung (§ 3a Abs. 3 Nr. 3a Buchst. a UStG).';
      } else if (k === 'pkwkurz' || k === 'pkwlang') {
        S = cpick(EU, [P]); R = cpick(EU, k === 'pkwlang' ? [P, S] : [S]);
        txt = `Eine Autovermietung aus ${CT(P)} vermietet ${b2b ? 'einer GmbH' : 'einer Privatperson'} aus ${CT(R)} ${k === 'pkwkurz' ? 'für zwei Wochen' : 'für ein Jahr'} einen Pkw; Übergabe in ${CT(S)}.`;
        place = k === 'pkwkurz' ? S : R;
        rule = k === 'pkwkurz' ? 'Kurzfristige Vermietung eines Beförderungsmittels (bis 30 Tage): Ort, an dem es tatsächlich übergeben wird (§ 3a Abs. 3 Nr. 2 S. 1, 2 UStG).' : b2b ? B2B_RULE : 'Langfristige Vermietung eines Beförderungsmittels an eine Privatperson: Ort am Wohnsitz des Empfängers (§ 3a Abs. 3 Nr. 2 S. 3 UStG).';
      } else if (k === 'messe') {
        b2b = true; S = cpick(EU, [P]); R = cpick(EU, [S]);
        txt = `Ein Messeveranstalter aus ${CT(P)} verkauft einer GmbH aus ${CT(R)} Eintrittskarten für eine Fachmesse in ${CT(S)}.`;
        place = S; rule = 'Eintrittsberechtigung für eine Messe an einen Unternehmer: Ort der Veranstaltung (§ 3a Abs. 3 Nr. 5 UStG).';
      } else if (k === 'konzert') {
        b2b = false; S = cpick(EU, [P]); R = cpick(EU, [S]);
        txt = `Ein Konzertveranstalter aus ${CT(P)} verkauft Privatleuten aus ${CT(R)} Karten für ein Konzert in ${CT(S)} (Besuch vor Ort).`;
        place = S; rule = 'Kulturelle Veranstaltung für Privatpersonen vor Ort: Ort der tatsächlichen Durchführung (§ 3a Abs. 3 Nr. 3 S. 1 UStG).';
      } else if (k === 'reparatur') {
        S = cpick(EU, [P]); R = cpick(EU, [S]);
        txt = `Ein Bootsbauer aus ${CT(P)} repariert vor Ort in ${CT(S)} die Segelyacht ${b2b ? `einer Charter-GmbH aus ${CT(R)}` : `eines Privatmanns aus ${CT(R)}`}.`;
        place = b2b ? R : S; rule = b2b ? B2B_RULE : 'Arbeiten an beweglichen Gegenständen für Privatpersonen: Ort der Tätigkeit (§ 3a Abs. 3 Nr. 3a Buchst. b UStG).';
      } else if (k === 'umzug') {
        F = cpick(EU); To = cpick(EU, [F]); R = b2b ? cpick(EU, [F, To]) : To;
        txt = b2b ? `Eine Spedition aus ${CT(P)} transportiert für eine GmbH aus ${CT(R)} Maschinen von ${CT(F)} nach ${CT(To)}.` : `Eine Spedition aus ${CT(P)} bringt den Hausrat einer Privatperson beim Umzug von ${CT(F)} nach ${CT(To)}.`;
        place = b2b ? R : F; rule = b2b ? B2B_RULE : 'Innergemeinschaftliche Güterbeförderung für eine Privatperson: Ort am Abgangsort (§ 3b Abs. 3 UStG).';
      } else if (k === 'stream') {
        R = cpick(EU, [P]); const over = rnd() < 0.6;
        txt = `Ein App-Anbieter, nur in ${CT(P)} ansässig, verkauft ${b2b ? `einer GmbH in ${CT(R)}` : `einer Privatperson in ${CT(R)}`} ein Jahresabo seiner vollautomatischen Lern-App.` + (b2b ? '' : over ? ' Seine Umsätze dieser Art an Kunden in anderen EU-Staaten lagen im Vorjahr bei rund 60.000 €.' : ' Seine Umsätze dieser Art an Kunden in anderen EU-Staaten lagen im Vorjahr bei 4.000 € und bleiben auch dieses Jahr unter 10.000 €; Fernverkäufe hat er keine.');
        place = b2b || over ? R : P;
        rule = b2b ? B2B_RULE : over ? 'Elektronische Dienstleistung an eine Privatperson: Ort am Wohnsitz des Empfängers (§ 3a Abs. 5 S. 1, S. 2 Nr. 3 UStG), abzurechnen über das OSS-Verfahren.' : 'Nur in einem Staat ansässig und EU-weit höchstens 10.000 €: Ort bleibt am Sitz des Leistenden (§ 3a Abs. 5 S. 3 UStG).';
      } else {
        R = cpick(EU, [P]); S = cpick(EU, [P, R]);
        txt = `Eine Agentur aus ${CT(P)} vermittelt ${b2b ? 'einer GmbH' : 'einem Privatsammler'} aus ${CT(R)} den Kauf eines Oldtimers; der vermittelte Verkauf wird in ${CT(S)} ausgeführt.`;
        place = b2b ? R : S; rule = b2b ? B2B_RULE : 'Vermittlung für eine Privatperson: Ort des vermittelten Umsatzes (§ 3a Abs. 3 Nr. 4 UStG).';
      }
      if (de && ![P, R, S, F, To].includes('DE')) continue;
      return { k, b2b, P, R, S, F, To, place, rule, txt };
    }
  }
  function lief(de) { // a supply of goods
    for (;;) {
      const k = pick(['versand', 'versand', 'abhol', 'lager', 'werk', 'fernhoch', 'fernniedrig', 'einfuhr', 'ausfuhr']);
      let A, B, X = null, place, rule, txt;
      if (k === 'versand') { A = cpick(EU); B = cpick(EU, [A]); txt = `Ein Großhändler aus ${CT(A)} verkauft einer GmbH in ${CT(B)} Ersatzteile und lässt sie per Spedition dorthin bringen.`; place = A; rule = 'Versendungslieferung: Ort dort, wo die Versendung beginnt (§ 3 Abs. 6 S. 1 UStG). Der Käufer versteuert im Bestimmungsland einen innergemeinschaftlichen Erwerb (§ 1a, § 3d UStG).'; }
      else if (k === 'abhol') { A = cpick(EU); B = rnd() < 0.5 ? cpick(EU, [A]) : pick(DRITT); txt = `Eine Firma aus ${CT(B)} holt eine Maschine mit eigenem Lkw beim Hersteller in ${CT(A)} ab.`; place = A; rule = 'Auch wenn der Kunde abholt, beginnt die Beförderung beim Lieferer: Ort am Abgangsort (§ 3 Abs. 6 S. 1 UStG).'; }
      else if (k === 'lager') { A = cpick(EU); B = cpick(EU, [A]); X = cpick(EU, [A, B]); txt = `Ein Kunsthändler aus ${CT(A)} verkauft einem Sammler aus ${CT(B)} ein Gemälde, das in einem Kunstdepot in ${CT(X)} lagert. Es bleibt dort; der Händler tritt den Herausgabeanspruch ab.`; place = X; rule = 'Ohne Beförderung (ruhende Lieferung): Ort dort, wo sich der Gegenstand bei Verschaffung der Verfügungsmacht befindet (§ 3 Abs. 7 S. 1 UStG).'; }
      else if (k === 'werk') { A = cpick(EU); B = cpick(EU, [A]); txt = `Ein Anlagenbauer aus ${CT(A)} liefert und montiert eine Fertigungsstraße im Werk einer GmbH in ${CT(B)}. Die Montage dauert Wochen; übergeben wird die fertige Anlage.`; place = B; rule = 'Werklieferung mit Montage beim Kunden: ausgeführt dort, wo die fertige Anlage übergeben wird (§ 3 Abs. 7 S. 1 UStG, Abschn. 3.12 Abs. 4 UStAE).'; }
      else if (k === 'fernhoch') { A = cpick(EU); B = cpick(EU, [A]); txt = `Ein Onlinehändler, nur in ${CT(A)} ansässig, versendet Kopfhörer an eine Privatperson in ${CT(B)}. Seine Fernverkäufe in andere EU-Staaten lagen im Vorjahr bei rund 80.000 €.`; place = B; rule = 'Innergemeinschaftlicher Fernverkauf über der EU-weiten Schwelle von 10.000 €: Ort am Ende der Versendung (§ 3c Abs. 1 UStG), abzurechnen über das OSS-Verfahren.'; }
      else if (k === 'fernniedrig') { A = cpick(EU); B = cpick(EU, [A]); txt = `Eine Töpferei, nur in ${CT(A)} ansässig, versendet eine Vase an eine Privatperson in ${CT(B)}. Ihre Fernverkäufe in andere EU-Staaten lagen im Vorjahr bei 3.000 € und bleiben auch dieses Jahr unter 10.000 €.`; place = A; rule = 'Unter der EU-weiten Schwelle von 10.000 € bleibt es beim Abgangsort (§ 3c Abs. 4 mit § 3 Abs. 6 S. 1 UStG).'; }
      else if (k === 'einfuhr') { A = 'CH'; B = 'DE'; txt = `Ein Uhrmacher aus ${CT('CH')} versendet eine Uhr „verzollt und versteuert“ an eine Privatperson in ${CT('DE')}; er meldet die Einfuhr selbst an und schuldet die Einfuhrumsatzsteuer.`; place = 'DE'; rule = 'Einfuhr aus dem Drittland, und der Lieferer schuldet die Einfuhrumsatzsteuer: Der Ort der Lieferung gilt als im Inland (§ 3 Abs. 8 UStG).'; }
      else { A = cpick(EU); B = pick(DRITT); txt = `Ein Hersteller aus ${CT(A)} versendet Werkzeuge an einen Händler in ${CT(B)}.`; place = A; rule = 'Versendung ins Drittland: Ort am Beginn der Versendung (§ 3 Abs. 6 S. 1 UStG); dort ist sie als Ausfuhrlieferung steuerfrei.'; }
      if (de && ![A, B, X].includes('DE')) continue;
      return { k, A, B, X, place, rule, txt };
    }
  }
  function reihe(de) { // chain transaction H → Z → K, goods travel directly from H's country A to K's country C
    const A = de ? 'DE' : cpick(EU), C = cpick(EU, [A]), r0 = rnd(), B = de ? cpick(EU, ['DE', C]) : r0 < 0.7 ? cpick(EU, [A, C]) : r0 < 0.85 ? A : C;
    const tr = pick(['H', 'Z', 'Z', 'K']), idA = tr === 'Z' && (B === A || rnd() < 0.5), mv = tr === 'H' ? 1 : tr === 'K' ? 2 : idA ? 2 : 1;
    const cA = CT(A), cC = CT(C), zIdNr = idA && B !== A ? `eine ihm ${IN(A)} erteilte USt-IdNr.` : 'die USt-IdNr. seines Sitzstaats';
    const txt = `H aus ${cA} verkauft eine Maschine an den Händler Z aus ${CT(B)}, der sie an K aus ${cC} weiterverkauft. Die Maschine geht direkt von ${cA} nach ${cC}; den Transport beauftragt ${tr}. H und K verwenden die USt-IdNr. ihres Sitzstaats, Z verwendet gegenüber H ${zIdNr}.`;
    const why = ['Reihengeschäft: zwei Lieferungen, die Maschine gelangt direkt von H zu K. Die Warenbewegung wird nur einer Lieferung zugeordnet (§ 3 Abs. 6a S. 1 UStG).',
      tr === 'H' ? 'H transportiert: bewegt ist seine Lieferung H → Z (§ 3 Abs. 6a S. 2 UStG).' : tr === 'K' ? 'K transportiert: bewegt ist die Lieferung an ihn, Z → K (§ 3 Abs. 6a S. 3 UStG).'
        : idA ? `Z transportiert als Zwischenhändler mit der USt-IdNr. des Abgangsstaats ${LN(A)}: bewegt ist seine eigene Lieferung Z → K (§ 3 Abs. 6a S. 4, 5 UStG).` : 'Z transportiert als Zwischenhändler ohne USt-IdNr. des Abgangsstaats: bewegt ist die Lieferung an ihn, H → Z (§ 3 Abs. 6a S. 4 UStG).',
      `Die bewegte Lieferung ist dort ausgeführt, wo die Beförderung beginnt: ${LN(A)} (§ 3 Abs. 6 S. 1 UStG).`,
      mv === 1 ? `Die ruhende Lieferung Z → K folgt nach: Ort am Ende der Beförderung, ${LN(C)} (§ 3 Abs. 7 S. 2 Nr. 2 UStG).` : `Die ruhende Lieferung H → Z geht voraus: Ort am Beginn der Beförderung, ${LN(A)} (§ 3 Abs. 7 S. 2 Nr. 1 UStG).`];
    if (mv === 1 && tr !== 'K' && new Set([A, B, C]).size === 3) why.push('Drei Staaten und die erste Lieferung ist die bewegte: Hier kommt die Vereinfachung für das innergemeinschaftliche Dreiecksgeschäft in Betracht (§ 25b UStG).');
    return { A, B, C, tr, idA, mv, txt, why, p1: A, p2: mv === 2 ? A : C };
  }
  const countryOpts = (ok, xs) => ({ f: 's', ok: LN(ok), bad: xs.filter(Boolean).map(LN), fill: i => LN(EU[(i * 3) % EU.length]) });
  const ORT = {
    1() { const sc = sonst(false); return Object.assign({ tid: 'o1-' + sc.k + (sc.b2b ? '-b2b' : '-b2c'), eyebrow: 'Sonstige Leistungen', title: 'Wo ist die Leistung ausgeführt?', sub: sc.txt, why: [sc.rule] }, countryOpts(sc.place, [sc.P, sc.R, sc.S, sc.F, sc.To])); },
    2() { const sc = lief(false); return Object.assign({ tid: 'o2-' + sc.k, eyebrow: 'Lieferungen', title: 'Wo ist die Lieferung ausgeführt?', sub: sc.txt, why: [sc.rule] }, countryOpts(sc.place, [sc.A, sc.B, sc.X])); },
    3() {
      const r = reihe(false), q = pick(['mv', 'mv', 'o1', 'o2']);
      if (q === 'mv') return { tid: 'o3-bewegt-' + r.tr, eyebrow: 'Reihengeschäft', title: 'Welche Lieferung ist die bewegte?', sub: r.txt, f: 's', ok: r.mv === 1 ? 'H → Z' : 'Z → K', bad: [r.mv === 1 ? 'Z → K' : 'H → Z', 'beide Lieferungen', 'keine von beiden'], order: ['H → Z', 'Z → K', 'beide Lieferungen', 'keine von beiden'], why: r.why };
      return Object.assign({ tid: 'o3-ort-' + q, eyebrow: 'Reihengeschäft', title: `Wo ist die Lieferung ${q === 'o1' ? 'H → Z' : 'Z → K'} ausgeführt?`, sub: r.txt, why: r.why }, countryOpts(q === 'o1' ? r.p1 : r.p2, [r.A, r.B, r.C]));
    },
    4() {
      const t = pick(['s', 's', 'l', 'l', 'r']);
      const out = (tid, title, sub, ok, why) => ({ tid: 'o4-' + tid, eyebrow: 'Folgen in Deutschland', title, sub, f: 's', ok, bad: T_ORDER.filter(x => x !== ok), order: T_ORDER, why });
      if (t === 's') for (;;) {
        const sc = sonst(true), p = [sc.rule];
        if (sc.place !== 'DE') return out(sc.k + '-nb', 'Wie ist diese Leistung in Deutschland zu behandeln?', sc.txt, T_NB, p.concat(`Ort ${IN(sc.place)}: in Deutschland nicht steuerbar (§ 1 Abs. 1 Nr. 1 UStG).`));
        if (sc.P === 'DE') return out(sc.k + '-de', 'Wie ist diese Leistung in Deutschland zu behandeln?', sc.txt, T_SL, p.concat('Ort im Inland, Leistender aus Deutschland: steuerpflichtig, er schuldet die Steuer selbst (§ 13a Abs. 1 Nr. 1 UStG).'));
        if (sc.b2b && sc.k === 'messe') return out('messe', 'Wie ist diese Leistung in Deutschland zu behandeln?', sc.txt, T_SL, p.concat('Ort im Inland. Eintrittsberechtigungen für Messen sind vom Reverse Charge ausgenommen (§ 13b Abs. 6 Nr. 4 UStG): Der ausländische Veranstalter schuldet die Steuer selbst.'));
        if (sc.b2b) { if (sc.R !== 'DE') continue; return out(sc.k + '-13b', 'Wie ist diese Leistung in Deutschland zu behandeln?', sc.txt, T_SE, p.concat(`Ort im Inland, der Leistende sitzt im Ausland, der Empfänger ist Unternehmer: Der Empfänger schuldet die Steuer (§ 13b Abs. ${sc.rule.includes('§ 3a Abs. 2') ? '1' : '2 Nr. 1'}, Abs. 5 UStG).`)); }
        return out(sc.k + '-privat', 'Wie ist diese Leistung in Deutschland zu behandeln?', sc.txt, T_SL, p.concat('Ort im Inland, Empfänger ist eine Privatperson: Der ausländische Leistende schuldet die Steuer selbst und muss sie hier erklären (oder über das OSS-Verfahren).'));
      }
      if (t === 'l') {
        const sc = lief(true), p = [sc.rule], T = 'Wie ist die Lieferung in Deutschland zu behandeln?', erw = ' Der deutsche Käufer versteuert dafür einen innergemeinschaftlichen Erwerb (§ 1a UStG).';
        if (sc.place !== 'DE') return out(sc.k + '-nb', T, sc.txt, T_NB, p.concat(`Ort ${IN(sc.place)}: in Deutschland nicht steuerbar.${(sc.k === 'versand' || sc.k === 'abhol') && sc.B === 'DE' ? erw : ''}`));
        if (sc.k === 'versand' || sc.k === 'abhol') return out(sc.k + '-sf', T, sc.txt, T_SF, p.concat(DRITT.includes(sc.B) ? 'Ort im Inland; Ausfuhr ins Drittland durch den ausländischen Abnehmer: steuerfrei (§ 4 Nr. 1 a, § 6 UStG).' : 'Ort im Inland; Lieferung an einen Unternehmer mit USt-IdNr. eines anderen EU-Staats: steuerfreie innergemeinschaftliche Lieferung (§ 4 Nr. 1 b, § 6a UStG).'));
        if (sc.k === 'ausfuhr') return out('ausfuhr-sf', T, sc.txt, T_SF, p.concat('Ort im Inland, Ausfuhrlieferung: steuerfrei (§ 4 Nr. 1 a, § 6 UStG).'));
        if (sc.k === 'werk') return out('werk-13b', T, sc.txt, T_SE, p.concat('Werklieferung eines im Ausland ansässigen Unternehmers an einen Unternehmer: Der Empfänger schuldet die Steuer (§ 13b Abs. 2 Nr. 1, Abs. 5 UStG).'));
        if (sc.k === 'lager') return out('lager-sl', T, sc.txt, T_SL, p.concat(sc.A === 'DE' ? 'Ort im Inland, deutscher Händler: steuerpflichtig, er schuldet die Steuer.' : 'Ort im Inland. Eine bloße Lieferung fällt nicht unter § 13b Abs. 2 Nr. 1 (nur Werklieferungen und sonstige Leistungen): Der ausländische Händler schuldet die Steuer selbst.'));
        return out(sc.k + '-sl', T, sc.txt, T_SL, p.concat(sc.k === 'einfuhr' ? 'Ort im Inland: Der Schweizer Lieferer schuldet die deutsche Umsatzsteuer und muss sich hier registrieren.' : sc.k === 'fernniedrig' ? 'Ort bleibt in Deutschland: steuerpflichtig, die Händlerin schuldet die Steuer.' : 'Ort im Inland: steuerpflichtig, der ausländische Händler schuldet die Steuer (über das OSS-Verfahren).'));
      }
      const r = reihe(true), q = rnd() < 0.5 ? 'H → Z' : 'Z → K', T = `Wie ist die Lieferung ${q} in Deutschland zu behandeln?`;
      if (q === 'H → Z') return r.mv === 1 ? out('reihe-h-sf', T, r.txt, T_SF, r.why.concat('Bewegte Lieferung mit Ort in Deutschland an Z, der keine deutsche USt-IdNr. verwendet: steuerfreie innergemeinschaftliche Lieferung (§ 4 Nr. 1 b, § 6a UStG).'))
        : out('reihe-h-sl', T, r.txt, T_SL, r.why.concat('Ruhende Lieferung vor der Warenbewegung, Ort in Deutschland: steuerpflichtig, H schuldet die Steuer. Steuerfrei kann nur die bewegte Lieferung sein.'));
      return r.mv === 2 ? out('reihe-z-sf', T, r.txt, T_SF, r.why.concat(`Bewegte Lieferung beginnt in Deutschland; K verwendet seine USt-IdNr. ${AUS(r.C)}: steuerfreie innergemeinschaftliche Lieferung (§ 4 Nr. 1 b, § 6a UStG). Z muss sich dafür in Deutschland registrieren.`))
        : out('reihe-z-nb', T, r.txt, T_NB, r.why.concat(`Ruhende Lieferung nach der Warenbewegung, Ort ${IN(r.C)}: in Deutschland nicht steuerbar.`));
    },
  };

  /* ================= 3 · Sortier-Sprint / 4 · §-Jagd: authored cards ================= */
  const PLAWS = Object.keys(DATA.para);
  const lawOf = n => n.split(' ').pop();
  const PCARDS = PLAWS.map((law, li) => DATA.para[law].map(([norm, desc], i) => ({ id: 'p:' + norm, li, i, norm, desc, law })));
  const SCARDS = DATA.sort.map((d, di) => d.items.map(([txt, bin, why], i) => ({ id: 's:' + d.id + ':' + i, di, txt, bin, why })));
  function paraTask(c) {
    const list = PCARDS[c.li], same = list.filter(x => x !== c && lawOf(x.norm) === lawOf(c.norm)), near = same.sort((a, b) => Math.abs(a.i - c.i) - Math.abs(b.i - c.i));
    const pool = shuf(near.slice(0, 6)).concat(shuf(list.filter(x => x !== c)));
    return { cid: c.id, tid: c.id, eyebrow: 'Wo steht das?', title: esc(c.desc), f: 's', keep: true, ok: c.norm, bad: pool.map(x => x.norm), why: [`<b>${esc(c.norm)}</b>: ${esc(c.desc)}.`] };
  }
  function sortTask(c) {
    const d = DATA.sort[c.di], lab = b => { const x = d.bins.find(y => y[0] === b); return x[1] + (x[2] ? ' (' + x[2] + ')' : ''); };
    return { cid: c.id, tid: c.id, eyebrow: d.title, title: esc(d.q), sub: esc(c.txt), f: 's', ok: lab(c.bin), bad: shuf(d.bins.filter(b => b[0] !== c.bin)).map(b => lab(b[0])), why: [esc(c.why)] };
  }

  /* ---------- registry ---------- */
  const GAMES = {
    frist: { icon: '📅', name: 'Fristen-Kalender', sub: 'Abgabenordnung: Bekanntgabe, Einspruch, Verjährung, Säumnis', lv: ['Bekanntgabe', 'Einspruchsfrist', 'Festsetzungsfrist', 'Säumniszuschlag'], n: 8 },
    buch: { icon: '📒', name: 'Buchungs-Werkstatt', sub: 'Buchungssätze vom Wareneinkauf bis zum Jahresabschluss', lv: ['Grundbuchungen', 'Umsatzsteuer & Skonto', 'Anlagevermögen', 'Jahresabschluss'], n: 8 },
    ort: { icon: '📍', name: 'Ort der Leistung', sub: 'Umsatzsteuer: Leistungsort, Lieferort, Reihengeschäft und was daraus folgt', lv: ['Sonstige Leistungen', 'Lieferungen', 'Reihengeschäft', 'Folgen in Deutschland'], n: 8 },
    sort: { icon: '🗂️', name: 'Sortier-Sprint', sub: '60 Sekunden einordnen, Serien geben Multiplikator', lv: DATA.sort.map(d => d.title), timed: true },
    para: { icon: '🔎', name: '§-Jagd', sub: 'Wo steht das? Fundstellen für die Prüfung mit Gesetzestext', lv: PLAWS, n: 10 },
    rech: { icon: '🧮', name: 'Rechenfälle', sub: 'Pauschalen, AfA, Unternehmenssteuern, Erbschaft', lv: ['Pauschalen & Grenzen', 'Abschreibung', 'Unternehmenssteuern', 'Erbschaft & Schenkung'], n: 8 },
  };
  const GORDER = ['frist', 'buch', 'ort', 'sort', 'para', 'rech'];
  const LVMULT = [1, 1.2, 1.5, 2];
  const RANKS = [[0, 'Praktikant/in', '🌱'], [150, 'Azubi', '📎'], [400, 'Steuerfachangestellte/r', '🧾'], [900, 'Bilanzbuchhalter/in', '📊'], [1700, 'Steuerfachwirt/in', '📚'], [2800, 'StB-Anwärter/in', '🎓'], [4500, 'Steuerberater/in', '⚖️'], [7000, 'Partner/in', '🏛️']];
  const IV = [0, 10 * 60e3, 864e5, 3 * 864e5, 7 * 864e5, 21 * 864e5, 60 * 864e5, 120 * 864e5];
  const EXAM_NEED = 8;

  /* ---------- state ---------- */
  function st() {
    const s = G.stb || (G.stb = {});
    s.xp ||= 0; s.lv ||= {}; s.box ||= {}; s.tp ||= {}; s.best ||= {}; s.daily ||= {}; s.exam ||= { n: 0, pass: 0, best: null };
    for (const g of GORDER) if (!Array.isArray(s.lv[g])) s.lv[g] = [0, 0, 0, 0];
    return s;
  }
  const rankOf = xp => { let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++; return i; };
  const starsSum = s => GORDER.reduce((a, g) => a + s.lv[g].reduce((x, y) => x + y, 0), 0);
  const goodLevels = s => GORDER.reduce((a, g) => a + s.lv[g].filter(x => x >= 2).length, 0);
  const unlocked = (s, g, i) => i === 0 || s.lv[g][i - 1] >= 2;
  const topLv = (s, g) => { let i = 0; while (i < 3 && unlocked(s, g, i + 1)) i++; return i; };
  function persist() { const s = st(); s.rank = RANKS[rankOf(s.xp)][1]; s.sum = starsSum(s); s.max = GORDER.length * 12; save(); }

  /* ---------- picking ---------- */
  function boxPick(cards, n) {
    const s = st(), now = Date.now(), box = c => s.box[c.id];
    const due = shuf(cards.filter(c => box(c) && box(c).d <= now)).sort((a, b) => (box(b).w || 0) - (box(a).w || 0));
    const fresh = shuf(cards.filter(c => !box(c))), rest = cards.filter(c => box(c) && box(c).d > now).sort((a, b) => box(a).d - box(b).d);
    return [...due, ...fresh, ...rest].slice(0, n);
  }
  function boxMark(id, ok) { const s = st(), b = s.box[id] || (s.box[id] = { b: 0, d: 0, n: 0, w: 0 }); if (ok) { b.n++; b.b = Math.min(IV.length - 1, b.b + 1); } else { b.w++; b.b = 1; } b.d = Date.now() + IV[b.b]; }
  function tplPick(list, lv, n) { // weighted by past misses, never the same template twice in a row, at most two per round
    const s = st(), pool = list.filter(t => t.lv === lv), out = [], used = {};
    for (let k = 0; k < n; k++) {
      const cand = pool.filter(t => (used[t.id] || 0) < (pool.length >= n ? 1 : 2) && (out.length === 0 || out[out.length - 1].id !== t.id));
      const w = cand.map(t => { const [h, m] = s.tp[t.id] || [0, 0]; return (h + m ? 1 : 1.5) * (1 + 3 * m / (h + m + 1)); });
      let r = rnd() * w.reduce((a, b) => a + b, 0), i = 0; while (r > w[i] && i < w.length - 1) r -= w[i++];
      const t = cand[i] || pick(pool); out.push(t); used[t.id] = (used[t.id] || 0) + 1;
    }
    return out;
  }
  function finishTask(g, lv, r, tid) { // template result → task with options
    const key = r.f === 'e' || !r.f ? eKey : r.f === 'd' ? dkey : r.f === 'm' ? (x => r2(x).toFixed(2)) : String;
    const show = r.f === 'd' ? fd : r.f === 'y' ? (y => '31.12.' + y) : r.f === 'm' ? (x => eur(x)) : r.f === 's' ? (x => esc(x)) : entryHTML;
    const opts = mkOpts(r.ok, r.keep ? r.bad || [] : shuf(r.bad || []), key, r.fill || (r.f === 'm' ? (i => r2(r.ok * [1.1, 0.9, 1.25, 0.8, 1.5][i % 5] + i)) : r.f === 'y' ? (i => r.ok + (i % 2 ? i : -i)) : r.f === 'd' ? (i => nextWork(addD(r.ok, [1, -1, 2, 3, -2, 7, -3, 8][i % 8] + 7 * Math.floor(i / 8)))) : null));
    if (r.order) opts.sort((a, b) => r.order.indexOf(a.v) - r.order.indexOf(b.v));
    return { g, lv, tid: tid || r.tid, eyebrow: r.eyebrow, title: r.title != null ? r.title : r.q || '', sub: r.sub || '', cal: r.cal || '', ent: !r.f || r.f === 'e', opts: opts.map(o => ({ h: show(o.v), ok: o.ok })), why: Array.isArray(r.why) ? r.why : [esc(r.why)], cid: r.cid };
  }
  function makeTask(g, lv) { // lv 0-based
    if (g === 'frist') return finishTask(g, lv, FR[lv + 1]());
    if (g === 'ort') return finishTask(g, lv, ORT[lv + 1]());
    if (g === 'buch' || g === 'rech') { const t = tplPick(g === 'buch' ? BU : RC, lv + 1, 1)[0], r = t.gen(); return finishTask(g, lv, Object.assign({ eyebrow: GAMES[g].lv[lv] }, r, { f: g === 'buch' ? 'e' : r.f, sub: r.q, title: g === 'buch' ? 'Wie wird gebucht?' : '' }), t.id); }
    if (g === 'para') return finishTask(g, lv, paraTask(boxPick(PCARDS[lv], 1)[0]));
    return finishTask(g, lv, sortTask(boxPick(SCARDS[lv], 1)[0]));
  }
  function roundTasks(g, lv) {
    const n = GAMES[g].n;
    if (g === 'buch' || g === 'rech') return tplPick(g === 'buch' ? BU : RC, lv + 1, n).map(t => { const r = t.gen(); return finishTask(g, lv, Object.assign({ eyebrow: GAMES[g].lv[lv] }, r, { f: g === 'buch' ? 'e' : r.f, sub: r.q, title: g === 'buch' ? 'Wie wird gebucht?' : '' }), t.id); });
    if (g === 'para') return boxPick(PCARDS[lv], n).map(c => finishTask(g, lv, paraTask(c)));
    const out = [], seen = new Set(); for (let i = 0; out.length < n && i < n * 6; i++) { const t = makeTask(g, lv); if (!seen.has(t.sub + t.title)) { seen.add(t.sub + t.title); out.push(t); } } return out;
  }

  /* ---------- round engine ---------- */
  const S = { mode: 'hub', g: null };
  const P = {};
  let timer = null;
  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
  function startRound(kind, g, lv) {
    stopTimer();
    if (kind === 'level' && GAMES[g].timed) return startSort(lv);
    let tasks;
    if (kind === 'level') tasks = roundTasks(g, lv);
    else if (kind === 'daily') { rnd = seeded('stb' + today()); try { const s = st(); tasks = shuf(GORDER.map(x => [x, topLv(s, x)])).map(([x, l]) => makeTask(x, l)); } finally { rnd = Math.random; } }
    else if (kind === 'exam') tasks = shuf([...Array(20)].map((_, i) => { const x = GORDER[i % GORDER.length]; return makeTask(x, 1 + (i % 3)); }));
    else { // review: due missed authored cards first
      const s = st(), now = Date.now(), due = [...PCARDS.flat(), ...SCARDS.flat()].filter(c => s.box[c.id] && s.box[c.id].w > 0 && s.box[c.id].d <= now).slice(0, 10);
      tasks = shuf(due).map(c => c.norm ? finishTask('para', c.li, paraTask(c)) : finishTask('sort', c.di, sortTask(c)));
      if (!tasks.length) { toast('Nichts fällig'); return; }
    }
    Object.assign(P, { kind, g, lv, tasks, i: 0, ans: null, ok: 0, xp: 0, miss: [], t0: Date.now(), qt: Date.now(), streak: 0, bonus: 0, rank0: rankOf(st().xp), sortRes: false, n: 0, score: 0, unlock: null, newBest: false, stars: 0, note: null, msg: '' });
    S.mode = 'play'; render(); scrollTo(0, 0);
  }
  function answer(i) {
    const t = P.tasks[P.i]; if (P.ans != null || !t) return;
    P.ans = i; const ok = !!t.opts[i].ok, fast = Date.now() - P.qt < 12000, s = st();
    if (t.cid) boxMark(t.cid, ok);
    if (t.tid && !t.cid) { const a = s.tp[t.tid] || (s.tp[t.tid] = [0, 0]); a[ok ? 0 : 1]++; }
    if (ok) { P.ok++; P.streak++; const m = P.kind === 'exam' ? 1 : LVMULT[t.lv] || 1; const fb = fast && P.kind !== 'exam'; P.xp += Math.round(10 * m) + (fb ? 3 : 0); if (fb) P.bonus++; }
    else { P.streak = 0; P.miss.push(t); }
    t.res = ok; beep(ok); persist(); render();
    document.getElementById('tnext')?.focus({ preventScroll: true });
    document.querySelector('.tfb')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function next() { if (P.ans == null) return; P.i++; P.ans = null; P.qt = Date.now(); if (P.i >= P.tasks.length) return finish(); render(); scrollTo(0, 0); }
  function finish() {
    const s = st(), n = P.tasks.length, q = n ? P.ok / n : 0;
    let stars = 0, extra = 0, note = null, msg = '';
    if (P.kind === 'level') { stars = q === 1 ? 3 : q >= 0.75 ? 2 : q >= 0.5 ? 1 : 0; const was = s.lv[P.g][P.lv]; P.newBest = stars > was; s.lv[P.g][P.lv] = Math.max(was, stars); P.unlock = stars >= 2 && was < 2 && P.lv < 3 ? GAMES[P.g].lv[P.lv + 1] : null; }
    if (P.kind === 'daily') { P.xp *= 2; const y = new Date(); y.setDate(y.getDate() - 1); const yk = y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate()); s.dstreak = s.dlast === yk ? (s.dstreak || 0) + 1 : s.dlast === today() ? s.dstreak || 1 : 1; s.dlast = today(); s.daily = { date: today(), ok: P.ok, n }; }
    if (P.kind === 'exam') { note = Math.min(6, Math.max(1, Math.round((1 + (1 - q) * 7) * 2) / 2)); const pass = note <= 4.5; s.exam.n++; if (pass) { s.exam.pass++; extra = 150; } s.exam.best = s.exam.best == null ? note : Math.min(s.exam.best, note); msg = pass ? 'Bestanden: weiter in die mündliche Prüfung.' : 'Nicht bestanden: über 4,5 ist die schriftliche Prüfung vorbei.'; }
    P.xp += extra; s.xp += P.xp; if (P.xp) gain('stb', P.xp); else persist();
    Object.assign(P, { done: true, stars, note, msg, rank1: rankOf(s.xp) }); persist();
    S.mode = 'res'; render(); scrollTo(0, 0);
    if (P.rank1 > P.rank0) setTimeout(() => toast(`Aufgestiegen: ${RANKS[P.rank1][2]} ${RANKS[P.rank1][1]}`), 400);
  }

  /* ---------- sorting sprint ---------- */
  const SP = {};
  const SDUR = 60000;
  function startSort(di) {
    const d = DATA.sort[di];
    Object.assign(SP, { di, d, deck: boxPick(SCARDS[di], SCARDS[di].length), k: 0, ok: 0, n: 0, combo: 0, score: 0, miss: [], last: null, end: Date.now() + SDUR, rank0: rankOf(st().xp) });
    S.mode = 'sort'; render(); scrollTo(0, 0);
    timer = setInterval(sortTick, 100);
  }
  function sortTick() {
    if (view !== 'stb' || S.mode !== 'sort') return stopTimer();
    const left = SP.end - Date.now(), bar = document.getElementById('ttime'), lab = document.getElementById('tleft');
    if (bar) bar.style.width = Math.max(0, left / SDUR * 100) + '%'; if (lab) lab.textContent = Math.max(0, Math.ceil(left / 1000)) + ' s';
    if (left <= 0) sortFinish();
  }
  const mult = c => c >= 10 ? 3 : c >= 5 ? 2 : 1;
  function sortAnswer(bin) {
    if (S.mode !== 'sort' || Date.now() > SP.end) return;
    const c = SP.deck[SP.k % SP.deck.length], ok = c.bin === bin; SP.n++; boxMark(c.id, ok);
    if (ok) { SP.ok++; SP.combo++; SP.score += 10 * mult(SP.combo); } else { SP.combo = 0; SP.miss.push(c); SP.deck.splice(SP.k + 4, 0, c); }
    SP.last = { ok, c }; SP.k++; beep(ok); render();
  }
  function sortFinish() {
    stopTimer(); const s = st(), acc = SP.n ? SP.ok / SP.n : 0, di = SP.di;
    const stars = SP.ok >= 16 && acc >= 0.9 ? 3 : SP.ok >= 11 && acc >= 0.8 ? 2 : SP.ok >= 6 ? 1 : 0, was = s.lv.sort[di];
    s.lv.sort[di] = Math.max(was, stars); const bk = 'sort:' + di, nb = SP.score > (s.best[bk] || 0); if (nb) s.best[bk] = SP.score;
    const xp = Math.round(SP.score / 10); s.xp += xp; if (xp) gain('stb', xp); else persist();
    Object.assign(P, { kind: 'level', g: 'sort', lv: di, tasks: [], ok: SP.ok, n: SP.n, xp, miss: SP.miss.map(c => ({ sub: c.txt, why: [esc(c.why)], opts: [{ h: esc(DATA.sort[di].bins.find(b => b[0] === c.bin)[1]), ok: true }] })), stars, newBest: nb, score: SP.score, unlock: stars >= 2 && was < 2 && di < 3 ? GAMES.sort.lv[di + 1] : null, done: true, note: null, msg: '', rank0: SP.rank0, rank1: rankOf(s.xp), sortRes: true });
    persist(); S.mode = 'res'; render(); scrollTo(0, 0);
    if (P.rank1 > P.rank0) setTimeout(() => toast(`Aufgestiegen: ${RANKS[P.rank1][2]} ${RANKS[P.rank1][1]}`), 400);
  }

  /* ---------- views ---------- */
  const starRow = (n, max = 3) => `<span class="tstars">${[...Array(max)].map((_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;
  const top = (act, label) => `<div class="topbar"><button class="link" data-act="${act}">← ${label}</button><button class="link" data-act="sound">${G.sound === false ? '🔇' : '🔊'}</button></div>`;
  function viewHub() {
    const s = st(), ri0 = rankOf(s.xp), [lo, name, em] = RANKS[ri0], nx = RANKS[ri0 + 1], p = nx ? (s.xp - lo) / (nx[0] - lo) : 1;
    const dd = s.daily.date === today(), good = goodLevels(s), now = Date.now();
    const due = [...PCARDS.flat(), ...SCARDS.flat()].filter(c => s.box[c.id] && s.box[c.id].w > 0 && s.box[c.id].d <= now).length;
    return `${back}
    <div style="display:grid;gap:2px"><span class="eyebrow">Steuerberater-Training</span><h2>Steuer-Akademie</h2></div>
    <section class="card trank"><div class="row"><span class="trem">${em}</span><div class="grow" style="display:grid;gap:4px"><span class="eyebrow">Rang ${ri0 + 1} von ${RANKS.length}</span><h3>${name}</h3>
      <div class="bar gold"><i style="width:${Math.round(p * 100)}%"></i></div><span class="small muted mono">${s.xp} XP${nx ? ` · noch ${nx[0] - s.xp} bis ${nx[1]}` : ' · ganz oben'}</span></div></div></section>
    <button class="card tdaily${dd ? ' done' : ''}" data-act="t-daily" ${dd ? 'disabled' : ''}><div class="row spread"><div class="row"><span style="font-size:28px">📁</span><div style="display:grid"><h3>Akte des Tages</h3><span class="small muted">${dd ? `Erledigt: ${s.daily.ok}/${s.daily.n} richtig · morgen kommt die nächste` : 'Sechs Fälle aus allen Bereichen · doppelte XP'}</span></div></div><span class="xp">${dd ? '✓' : '×2'}</span></div>${s.dstreak ? `<span class="small muted">🔥 ${s.dstreak} Tag${s.dstreak === 1 ? '' : 'e'} in Folge</span>` : ''}</button>
    ${GORDER.map(g => { const G0 = GAMES[g], lv = s.lv[g]; return `<button class="card tgame" data-act="t-game" data-v="${g}"><div class="row spread"><div class="row"><span style="font-size:28px">${G0.icon}</span><div style="display:grid"><h3>${G0.name}</h3><span class="small muted">${G0.sub}</span></div></div></div>
      <div class="tlvs">${lv.map((n, i) => `<span class="${unlocked(s, g, i) ? '' : 'lock'}" title="${esc(G0.lv[i])}">${unlocked(s, g, i) ? starRow(n) : '🔒'}</span>`).join('')}</div></button>`; }).join('')}
    ${due ? `<button class="card" data-act="t-review"><div class="row spread"><div class="row"><span style="font-size:28px">🧷</span><div style="display:grid"><h3>Fehlerkiste</h3><span class="small muted">${due} Karte${due === 1 ? '' : 'n'} zum Wiederholen fällig</span></div></div><span class="xp">→</span></div></button>` : ''}
    <button class="card texam${good >= EXAM_NEED ? '' : ' locked'}" data-act="t-exam" ${good >= EXAM_NEED ? '' : 'disabled'}><div class="row spread"><div class="row"><span style="font-size:28px">🏛️</span><div style="display:grid"><h3>Prüfungssimulation</h3><span class="small muted">${good >= EXAM_NEED ? '20 Fälle aus allen Bereichen, Note wie in der StB-Prüfung: bis 4,5 bestanden' : `Frei ab ${EXAM_NEED} Leveln mit ★★ (${good}/${EXAM_NEED})`}</span></div></div><span class="xp">${s.exam.best != null ? 'Bestnote ' + String(s.exam.best).replace('.', ',') : good >= EXAM_NEED ? '+150' : '🔒'}</span></div></button>
    <p class="small muted" style="margin:0">Rechtsstand 2026. Sachverhalte vereinfacht; Fristenfälle sind so gewählt, dass Landesfeiertage keine Rolle spielen.</p>`;
  }
  function viewGame() {
    const s = st(), g = S.g, G0 = GAMES[g];
    return `${top('t-hub', 'Akademie')}<div style="display:grid;gap:2px"><span class="eyebrow">${G0.icon} ${G0.name}</span><h2>Level wählen</h2></div><p class="small muted" style="margin:0">${G0.sub}. ${G0.timed ? 'Drei Sterne: mindestens 16 richtig bei 90 % Trefferquote.' : `${G0.n} Aufgaben. Drei Sterne nur ohne Fehler; ab zwei Sternen öffnet sich das nächste Level.`}</p>
      ${G0.lv.map((name, i) => { const ok = unlocked(s, g, i), n = s.lv[g][i], best = s.best['sort:' + i]; return `<button class="card tlv${ok ? '' : ' locked'}" data-act="t-play" data-v="${g}|${i}" ${ok ? '' : 'disabled'}><div class="row spread"><div style="display:grid;gap:2px"><span class="eyebrow">Level ${i + 1}${LVMULT[i] > 1 ? ` · XP ×${String(LVMULT[i]).replace('.', ',')}` : ''}</span><h3>${esc(name)}</h3>${g === 'sort' && best ? `<span class="small muted mono">Rekord ${best} Punkte</span>` : ''}</div>${ok ? starRow(n) : '<span>🔒</span>'}</div></button>`; }).join('')}`;
  }
  function viewPlay() {
    const t = P.tasks[P.i], label = P.kind === 'daily' ? 'Akte des Tages' : P.kind === 'exam' ? 'Prüfungssimulation' : P.kind === 'review' ? 'Fehlerkiste' : `${GAMES[P.g].name} · Level ${P.lv + 1}`;
    const a = P.ans, okIdx = t.opts.findIndex(o => o.ok);
    return `${top('t-quit', 'Abbrechen')}
      <div class="progress">${P.tasks.map((x, i) => `<i class="${i < P.i || (i === P.i && a != null) ? (x.res ? 'ok' : 'bad') : i === P.i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="row spread"><span class="eyebrow">${esc(label)}${P.kind !== 'level' ? ` · ${GAMES[t.g].icon} ${esc(t.eyebrow || GAMES[t.g].lv[t.lv])}` : t.eyebrow ? ' · ' + esc(t.eyebrow) : ''}</span>${P.streak >= 3 ? `<span class="combo">🔥 ${P.streak}</span>` : ''}</div>
      ${t.sub ? `<div class="tcase">${t.sub}</div>` : ''}
      ${t.title ? `<div class="q tq">${t.title}</div>` : ''}
      ${t.cal || ''}
      <div class="topts${t.ent ? ' ent' : ''}">${t.opts.map((o, i) => `<button class="opt ${a == null ? '' : o.ok ? 'ok' : i === a ? 'bad' : 'dim'}" data-act="t-ans" data-v="${i}" ${a == null ? '' : 'disabled'}><span class="k">${i + 1}</span><span class="grow">${o.h}</span></button>`).join('')}</div>
      ${a == null ? '' : `<div class="tfb ${t.opts[a].ok ? 'ok' : 'bad'}"><b>${t.opts[a].ok ? pick(['Richtig.', 'Sitzt.', 'Genau.', 'Sauber.']) : 'Nicht ganz.'}</b>${t.opts[a].ok ? '' : ` Richtig wäre Antwort ${okIdx + 1}.`}<ol class="way">${t.why.map(w => `<li>${w}</li>`).join('')}</ol></div>
        <button class="btn primary big" id="tnext" data-act="t-next">${P.i + 1 >= P.tasks.length ? 'Auswertung' : 'Weiter'}</button>`}`;
  }
  function viewSort() {
    const d = SP.d, c = SP.deck[SP.k % SP.deck.length], left = Math.max(0, SP.end - Date.now());
    return `${top('t-quit', 'Abbrechen')}
      <div class="row spread"><span class="eyebrow">🗂️ ${esc(d.title)}</span><span class="mono small"><b>${SP.score}</b> Punkte${SP.combo >= 5 ? ` · <span class="combo">×${mult(SP.combo)}</span>` : ''}</span></div>
      <div class="bar ttimer"><i id="ttime" style="width:${left / SDUR * 100}%"></i></div><span class="small muted mono" id="tleft" style="text-align:right">${Math.ceil(left / 1000)} s</span>
      <div class="tsortq"><span class="small muted">${esc(d.q)}</span><div class="tsortcard">${esc(c.txt)}</div></div>
      <div class="tbins n${d.bins.length}">${d.bins.map(([k, l, n], i) => `<button class="tbin" data-act="t-bin" data-v="${k}"><span class="k">${i + 1}</span><b>${esc(l)}</b>${n ? `<small>${esc(n)}</small>` : ''}</button>`).join('')}</div>
      <div class="tlast ${SP.last ? (SP.last.ok ? 'ok' : 'bad') : ''}">${SP.last ? (SP.last.ok ? `✓ ${SP.combo >= 2 ? SP.combo + ' in Folge' : 'richtig'}` : `✗ ${esc(SP.last.c.txt)} → <b>${esc(d.bins.find(b => b[0] === SP.last.c.bin)[1])}</b>. ${esc(SP.last.c.why)}`) : 'Tippen oder Tasten 1–' + d.bins.length}</div>`;
  }
  function viewRes() {
    const s = st(), n = P.sortRes ? P.n : P.tasks.length, ri1 = P.rank1, up = P.rank1 > P.rank0;
    const head = P.kind === 'exam' ? `<span class="eyebrow">Prüfungssimulation</span><div class="sum">Note ${P.note.toFixed(1).replace('.', ',')}</div><p style="margin:0"><b>${P.ok}/${n}</b> richtig. ${P.msg}</p>`
      : P.kind === 'daily' ? `<span class="eyebrow">Akte des Tages</span><div class="sum">${P.ok}/${n}</div><p class="muted" style="margin:0">Doppelte XP · 🔥 ${s.dstreak || 1} Tag${(s.dstreak || 1) === 1 ? '' : 'e'} in Folge</p>`
      : P.kind === 'review' ? `<span class="eyebrow">Fehlerkiste</span><div class="sum">${P.ok}/${n}</div>`
      : `<span class="eyebrow">${GAMES[P.g].icon} ${GAMES[P.g].name} · Level ${P.lv + 1}</span><div class="tbigstars">${starRow(P.stars)}</div><p style="margin:0">${P.sortRes ? `<b>${P.score}</b> Punkte · ${P.ok}/${n} richtig${P.newBest ? ' · neuer Rekord' : ''}` : `<b>${P.ok}/${n}</b> richtig`}</p>${P.unlock ? `<span class="tag new">Neu offen: ${esc(P.unlock)}</span>` : ''}`;
    const nextLv = P.kind === 'level' && P.lv < 3 && unlocked(s, P.g, P.lv + 1);
    return `${top('t-hub', 'Akademie')}<section class="card" style="text-align:center;justify-items:center">${head}<span class="xp">+${P.xp} XP${P.bonus ? ` · ${P.bonus}× Tempo-Bonus` : ''}</span>${up ? `<span class="tag challenge">Aufgestiegen: ${RANKS[ri1][2]} ${RANKS[ri1][1]}</span>` : ''}</section>
      ${P.miss.length ? `<section class="card"><h3>Zum Merken</h3>${P.miss.map(t => `<div class="tmiss">${t.sub ? `<span class="small muted">${t.sub}</span>` : ''}${t.title && !P.sortRes ? `<b>${t.title}</b>` : ''}<div class="tmok">→ ${t.opts.find(o => o.ok).h}</div><ol class="way">${t.why.map(w => `<li>${w}</li>`).join('')}</ol></div>`).join('')}</section>` : ''}
      <div class="row" style="gap:8px;flex-wrap:wrap">${P.kind === 'level' ? `<button class="btn primary grow" data-act="t-play" data-v="${P.g}|${P.lv}">Nochmal</button>` : ''}${nextLv ? `<button class="btn grow" data-act="t-play" data-v="${P.g}|${P.lv + 1}">Level ${P.lv + 2}</button>` : ''}<button class="btn grow" data-act="t-hub">Akademie</button></div>`;
  }
  window.viewStb = () => { const m = S.mode; return m === 'game' ? viewGame() : m === 'play' ? viewPlay() : m === 'sort' ? viewSort() : m === 'res' ? viewRes() : viewHub(); };
  window.stbAct = (a, v) => {
    if (a === 't-hub') { stopTimer(); view = 'stb'; S.mode = 'hub'; render(); scrollTo(0, 0); return; }
    if (a === 't-game') { S.g = v; S.mode = 'game'; render(); scrollTo(0, 0); return; }
    if (a === 't-play') { const [g, l] = v.split('|'); S.g = g; startRound('level', g, +l); return; }
    if (a === 't-daily') return startRound('daily');
    if (a === 't-exam') return startRound('exam');
    if (a === 't-review') return startRound('review');
    if (a === 't-ans') return answer(+v);
    if (a === 't-next') return next();
    if (a === 't-bin') return sortAnswer(v);
    if (a === 't-quit') { stopTimer(); S.mode = P.kind === 'level' || S.mode === 'sort' ? 'game' : 'hub'; render(); scrollTo(0, 0); }
  };
  window.stbKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const n = parseInt(e.key, 10);
    if (S.mode === 'sort' && n >= 1 && n <= SP.d.bins.length) { e.preventDefault(); sortAnswer(SP.d.bins[n - 1][0]); }
    else if (S.mode === 'play') { if (P.ans == null && n >= 1 && n <= (P.tasks[P.i] || { opts: [] }).opts.length) { e.preventDefault(); answer(n - 1); } else if (P.ans != null && e.key === 'Enter') { e.preventDefault(); next(); } }
  };
  window.stbMeta = () => { const s = st(); return `${RANKS[rankOf(s.xp)][2]} ${RANKS[rankOf(s.xp)][1]} · ★ ${starsSum(s)}/${GORDER.length * 12}`; };
  window.stbEnter = () => { stopTimer(); S.mode = 'hub'; };
  // test hooks (used by the scratch test scripts, harmless in the app)
  window.STB_TEST = { P, SP, S, st, FR, BU, RC, ORT, sonst, lief, reihe, PCARDS, SCARDS, finishTask, makeTask, roundTasks, hols, isOff, addM, shift, erbTax, hardship, setRnd: f => { rnd = f || Math.random; } };
})();
