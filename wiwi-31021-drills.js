/* Echo · 31021 Rechentrainer und Probeklausuren. Jeder Aufruf von gen() würfelt neue Zahlen; die Lösung wird mit denselben Formeln berechnet, die der Lösungsweg zeigt.
   Probeklausuren: eigene Aufgaben im Stil der Klausur (Investition 50 P. + Finanzierung 50 P., 120 min), keine Originaltexte. */
'use strict';
(() => {
  const D = window.STB_PFAD;
  const R = (a, b, st = 1) => a + st * Math.floor(Math.random() * (Math.floor((b - a) / st) + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const f = (x, d = 2) => Number(x).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const p = x => f(x * 100, 2) + ' %';
  const ANF = (i, n) => i === 0 ? 1 / n : i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
  const RBF = (i, n) => 1 / ANF(i, n);
  const r2 = x => Math.round(x * 100) / 100, r4 = x => Math.round(x * 1e4) / 1e4;

  D.DRILLS = [
    { id: 'zins', t: 'Zinseszins mit wechselnden Zinsen', em: '📈', sub: 'Endwert über mehrere Zinsphasen', gen() {
      const C = R(5, 40) * 1000, ph = [[R(4, 10), R(1, 4)], [R(4, 10), R(2, 5)], [R(3, 8), R(3, 6)]];
      const fac = ph.map(([n, z]) => Math.pow(1 + z / 100, n)), E = C * fac.reduce((a, b) => a * b, 1);
      return { q: `Anlage ${f(C, 0)} GE mit Zinseszins: ${ph.map(([n, z]) => `${n} Jahre zu ${z} %`).join(', danach ')}. Wie hoch ist das Endguthaben?`, a: r2(E), unit: 'GE', tol: 1,
        steps: [`Faktoren: ${ph.map(([n, z], i) => `${(1 + z / 100).toFixed(2).replace('.', ',')}^${n} = ${f(fac[i], 5)}`).join('; ')}`, `${f(C, 0)} · ${fac.map(x => f(x, 5)).join(' · ')} = ${f(E)} GE`] };
    } },
    { id: 'einfach', t: 'Einfache Verzinsung vs. Zinseszins', em: '⚖️', sub: 'Wie viel bringt der Zinseszins?', gen() {
      const C = R(10, 50) * 1000, i = R(2, 6) / 100, T = R(10, 30), E1 = C * (1 + i * T), E2 = C * Math.pow(1 + i, T);
      return { q: `${f(C, 0)} GE werden ${T} Jahre zu ${i * 100} % angelegt. Um wie viel GE ist das Endguthaben mit Zinseszins höher als mit einfacher Verzinsung?`, a: r2(E2 - E1), unit: 'GE', tol: 1,
        steps: [`Einfach: ${f(C, 0)} · (1 + ${f(i, 2)} · ${T}) = ${f(E1)}`, `Zinseszins: ${f(C, 0)} · ${f(1 + i, 2)}^${T} = ${f(E2)}`, `Differenz ${f(E2 - E1)} GE`] };
    } },
    { id: 'entnahme', t: 'Konstante Entnahme', em: '💸', sub: 'Annuitätenfaktor anwenden', gen() {
      const C = R(20, 200) * 1000, i = R(2, 8) / 100, n = R(5, 30), a = C * ANF(i, n);
      return { q: `Aus ${f(C, 0)} GE sollen ${n} gleich hohe Beträge jeweils am Jahresende entnommen werden, danach ist das Konto leer. Zins ${i * 100} %. Wie hoch ist eine Entnahme?`, a: r2(a), unit: 'GE', tol: 0.5,
        steps: [`ANF(${i * 100} %, ${n}) = ${f(i, 2)} · ${f(1 + i, 2)}^${n} / (${f(1 + i, 2)}^${n} − 1) = ${f(ANF(i, n), 6)}`, `a = ${f(C, 0)} · ${f(ANF(i, n), 6)} = ${f(a)} GE`] };
    } },
    { id: 'entnahme2', t: 'Entnahme bei wechselnden Zinsen', em: '🪜', sub: 'Summe der Abzinsungsfaktoren', gen() {
      const C = R(10, 60) * 1000, z = [R(1, 4), R(1, 4), R(1, 4)].map(x => x / 100);
      let q = 1; const df = z.map(x => (q /= (1 + x)));
      const s = df.reduce((a, b) => a + b, 0), a = C / s;
      return { q: `Aus ${f(C, 0)} GE sollen in drei gleichen Raten (Ende Jahr 1, 2, 3) alles entnommen werden. Zinsen: Jahr 1 ${z[0] * 100} %, Jahr 2 ${z[1] * 100} %, Jahr 3 ${z[2] * 100} %. Wie hoch ist eine Rate?`, a: r2(a), unit: 'GE', tol: 0.5,
        steps: [`Abzinsungsfaktoren: ${df.map(x => f(x, 5)).join(', ')}`, `Summe ${f(s, 5)}`, `a = ${f(C, 0)} / ${f(s, 5)} = ${f(a)} GE`] };
    } },
    { id: 'ann', t: 'Annuitätendarlehen: Rate', em: '🏠', sub: 'e* = K · ANF', gen() {
      const K = R(50, 400, 10) * 1000, i = R(2, 8) / 100, n = R(5, 25), e = K * ANF(i, n);
      return { q: `Darlehen ${f(K, 0)} GE, ${n} Jahre, ${i * 100} %, Auszahlung 100 %, Annuität am Jahresende. Wie hoch ist die Annuität?`, a: r2(e), unit: 'GE', tol: 1,
        steps: [`ANF(${i * 100} %, ${n}) = ${f(ANF(i, n), 6)}`, `e* = ${f(K, 0)} · ${f(ANF(i, n), 6)} = ${f(e)} GE`] };
    } },
    { id: 'annzz', t: 'Annuitätendarlehen: Gesamtzinsen', em: '🧾', sub: 'n · e* − K', gen() {
      const K = R(50, 300, 10) * 1000, i = R(2, 8) / 100, n = R(5, 25), e = K * ANF(i, n), zz = n * e - K;
      return { q: `Darlehen ${f(K, 0)} GE, ${n} Jahre, ${i * 100} %. Wie viel Zinsen zahlt der Schuldner insgesamt?`, a: r2(zz), unit: 'GE', tol: 5,
        steps: [`e* = ${f(K, 0)} · ANF = ${f(e)}`, `Zinsen = ${n} · ${f(e)} − ${f(K, 0)} = ${f(zz)} GE`] };
    } },
    { id: 'annrs', t: 'Annuitätendarlehen: Restschuld', em: '📉', sub: 'Nach t Annuitäten', gen() {
      const K = R(50, 300, 10) * 1000, i = R(2, 8) / 100, n = R(8, 25), t = R(2, n - 2), e = K * ANF(i, n), q = Math.pow(1 + i, t), rs = K * q - e * (q - 1) / i;
      return { q: `Darlehen ${f(K, 0)} GE, ${n} Jahre, ${i * 100} %, Annuität am Jahresende. Wie hoch ist die Restschuld direkt nach der ${t}. Annuität?`, a: r2(rs), unit: 'GE', tol: 5,
        steps: [`e* = ${f(e)}`, `RS = ${f(K, 0)} · ${f(1 + i, 2)}^${t} − ${f(e)} · (${f(1 + i, 2)}^${t} − 1) / ${f(i, 2)}`, `= ${f(K * q)} − ${f(e * (q - 1) / i)} = ${f(rs)} GE`] };
    } },
    { id: 'annauf', t: 'Annuitätendarlehen mit Aufschub', em: '⏳', sub: 'e** = K(1+i)^d · ANF(i, n−d)', gen() {
      const K = R(50, 300, 10) * 1000, i = R(2, 8) / 100, n = R(8, 25), d = R(1, 4), Kd = K * Math.pow(1 + i, d), e = Kd * ANF(i, n - d);
      return { q: `Darlehen ${f(K, 0)} GE, Gesamtlaufzeit ${n} Jahre, ${i * 100} %. In den ersten ${d} Jahren wird nichts gezahlt (weder Zins noch Tilgung), danach gleich hohe Annuitäten bis zum Laufzeitende. Wie hoch ist eine Annuität?`, a: r2(e), unit: 'GE', tol: 2,
        steps: [`Schuld nach ${d} Jahren: ${f(K, 0)} · ${f(1 + i, 2)}^${d} = ${f(Kd)}`, `Verbleibend ${n - d} Annuitäten: ANF(${i * 100} %, ${n - d}) = ${f(ANF(i, n - d), 6)}`, `e** = ${f(e)} GE`] };
    } },
    { id: 'kw', t: 'Kapitalwert', em: '💶', sub: 'Konstanter Zins', gen() {
      const i = R(2, 10) / 100, T = R(2, 4), e0 = -R(5, 30) * 100, es = Array.from({ length: T }, () => R(1, 15) * 100);
      const bw = es.map((x, t) => x / Math.pow(1 + i, t + 1)), K = e0 + bw.reduce((a, b) => a + b, 0);
      return { q: `Zahlungsreihe (${[e0, ...es].join('; ')}), Kalkulationszins ${i * 100} %. Wie hoch ist der Kapitalwert?`, a: r2(K), unit: 'GE', tol: 0.05,
        steps: [`Barwerte: ${bw.map(x => f(x)).join(' + ')}`, `K = ${e0} + ${f(bw.reduce((a, b) => a + b, 0))} = ${f(K)} GE${K > 0 ? ' (vorteilhaft)' : K < 0 ? ' (nicht vorteilhaft)' : ''}`] };
    } },
    { id: 'kwp', t: 'Kapitalwert, periodenindividuelle Zinsen', em: '🔀', sub: 'Produkt der Zinsfaktoren', gen() {
      const z = [R(1, 8), R(1, 8), R(1, 8)].map(x => x / 100), e0 = -R(5, 20) * 100, es = [R(1, 8) * 100, R(1, 8) * 100, R(2, 10) * 100];
      let q = 1; const df = z.map(x => (q /= (1 + x))), bw = es.map((x, t) => x * df[t]), K = e0 + bw.reduce((a, b) => a + b, 0);
      return { q: `Zahlungsreihe (${[e0, ...es].join('; ')}). Zinsen: Periode 1 ${z[0] * 100} %, Periode 2 ${z[1] * 100} %, Periode 3 ${z[2] * 100} %. Kapitalwert?`, a: r2(K), unit: 'GE', tol: 0.05,
        steps: [`Abzinsungsfaktoren: ${df.map(x => f(x, 5)).join(', ')}`, `Barwerte: ${bw.map(x => f(x)).join(' + ')}`, `K = ${f(K)} GE`] };
    } },
    { id: 'diff', t: 'Differenzinvestition', em: '➖', sub: 'Kapitalwert von A − B', gen() {
      const i = R(2, 8) / 100, A = [-R(5, 15) * 100, R(1, 6) * 100, R(1, 6) * 100, R(2, 8) * 100], B = [-R(2, 8) * 100, R(0, 3) * 100, R(3, 10) * 100];
      const Dd = A.map((x, t) => x - (B[t] || 0)), K = Dd.reduce((a, x, t) => a + x / Math.pow(1 + i, t), 0);
      return { q: `A (${A.join('; ')}), B (${B.join('; ')}), Zins ${i * 100} %. Wie hoch ist der Kapitalwert der Differenzinvestition A − B? (positiv: A besser)`, a: r2(K), unit: 'GE', tol: 0.05,
        steps: [`Differenzreihe (fehlende Zahlung = 0): (${Dd.join('; ')})`, `K(D) = ${f(K)} GE → ${K > 0 ? 'A' : 'B'} relativ vorteilhafter`] };
    } },
    { id: 'annu', t: 'Äquivalente Annuität', em: '🔁', sub: 'a = K · ANF(i, T)', gen() {
      const i = R(2, 10) / 100, T = R(2, 8), K = R(1, 50) * 100, a = K * ANF(i, T);
      return { q: `Eine Investition hat Kapitalwert ${f(K, 0)} GE und Laufzeit ${T} Jahre; Zins ${i * 100} %. Wie hoch ist die äquivalente Annuität?`, a: r2(a), unit: 'GE', tol: 0.05,
        steps: [`ANF(${i * 100} %, ${T}) = ${f(ANF(i, T), 6)}`, `a = ${f(K, 0)} · ${f(ANF(i, T), 6)} = ${f(a)} GE pro Jahr`] };
    } },
    { id: 'izf', t: 'Interner Zinsfuß, Spezialfälle', em: '🎯', sub: 'Einzelrückfluss, ewige Rente, zwei Perioden', gen() {
      const k = pick(['einzel', 'ewig', 'zwei']);
      if (k === 'einzel') { const e0 = R(10, 50) * 100, T = R(2, 6), eT = Math.round(e0 * Math.pow(1 + R(2, 12) / 100, T)), r = Math.pow(eT / e0, 1 / T) - 1;
        return { q: `Zahlungsreihe: −${e0} in t = 0, sonst nur ${eT} in t = ${T}. Interner Zinsfuß in Prozent?`, a: r4(r) * 100, unit: '%', dec: 2, tol: 0.01, steps: [`r* = (${eT}/${e0})^(1/${T}) − 1 = ${p(r)}`] }; }
      if (k === 'ewig') { const e0 = R(10, 50) * 100, Z = R(5, 40) * 10, r = Z / e0;
        return { q: `Investition: −${e0} in t = 0, danach ewig ${Z} pro Jahr. Interner Zinsfuß in Prozent?`, a: r4(r) * 100, unit: '%', dec: 2, tol: 0.01, steps: [`r* = Z / |e₀| = ${Z} / ${e0} = ${p(r)}`] }; }
      const r = R(2, 15) / 100, q = 1 + r, e0 = R(10, 40) * 100, e1 = R(2, 10) * 100, e2 = Math.round((e0 * q * q - e1 * q)), qq = (e1 + Math.sqrt(e1 * e1 + 4 * e0 * e2)) / (2 * e0);
      return { q: `Zahlungsreihe (−${e0}; ${e1}; ${e2}). Interner Zinsfuß in Prozent?`, a: r4(qq - 1) * 100, unit: '%', dec: 2, tol: 0.02,
        steps: [`${e0}q² − ${e1}q − ${e2} = 0`, `q = (${e1} + √(${e1}² + 4 · ${e0} · ${e2})) / (2 · ${e0}) = ${f(qq, 4)}`, `r* = ${p(qq - 1)}`] };
    } },
    { id: 'eff', t: 'Effektivzins einer Anleihe', em: '📜', sub: 'Näherung und Nullkupon', gen() {
      if (Math.random() < 0.5) { const iN = R(10, 60) / 1000, C = R(94, 102) / 100, T = R(3, 10), e = (iN + (1 - C) / T) / C;
        return { q: `Kuponanleihe: Nominalzins ${f(iN * 100, 1)} %, Ausgabekurs ${f(C * 100, 0)} %, Laufzeit ${T} Jahre, Rückzahlung 100 %. Effektivzins nach der Näherungsformel in Prozent?`, a: r4(e) * 100, unit: '%', dec: 2, tol: 0.01,
          steps: [`(i_nom + (1 − C₀)/T) / C₀ = (${f(iN, 3)} + ${f(1 - C, 2)}/${T}) / ${f(C, 2)}`, `= ${p(e)}`] }; }
      const C = R(60, 95) / 100, T = R(2, 10), e = Math.pow(1 / C, 1 / T) - 1;
      return { q: `Nullkuponanleihe: Ausgabekurs ${f(C * 100, 0)} %, Rückzahlung 100 % nach ${T} Jahren. Effektivzins in Prozent?`, a: r4(e) * 100, unit: '%', dec: 2, tol: 0.01,
        steps: [`(1/${f(C, 2)})^(1/${T}) − 1 = ${p(e)}`] };
    } },
    { id: 'stueck', t: 'Stückzinsen und Floater', em: '🗓', sub: 'Tage/360 · Kupon · Nominal', gen() {
      if (Math.random() < 0.5) { const N = R(5, 50) * 1000, k = R(10, 60) / 1000, t = R(20, 340), s = N * k * t / 360;
        return { q: `Festzinsanleihe, Nominal ${f(N, 0)} €, Kupon ${f(k * 100, 1)} %, Verkauf ${t} Tage nach dem letzten Zinstermin (Methode act/360 vereinfacht: Tage/360). Stückzinsen in €?`, a: r2(s), unit: '€', tol: 0.05,
          steps: [`${f(N, 0)} · ${f(k, 3)} · ${t}/360 = ${f(s)} €`] }; }
      const V = R(10, 200) * 1e6, eur = R(-30, 400) / 100, auf = R(20, 150) / 100, satz = Math.max(0, eur + auf), z = V * satz / 100 / 2;
      return { q: `Floater, Volumen ${f(V / 1e6, 0)} Mio. €, halbjährliche Zinszahlung, Zins = 6-Monats-EURIBOR + ${f(auf, 2)} Prozentpunkte, Mindestzins 0 %. EURIBOR zu Beginn der Zinsperiode: ${f(eur, 2)} %. Zinsbetrag dieser Periode in €?`, a: r2(z), unit: '€', tol: 1,
        steps: [`Satz p. a.: ${f(eur, 2)} + ${f(auf, 2)} = ${f(satz, 2)} %`, `Halbjahr: ${f(V, 0)} · ${f(satz, 2)} % / 2 = ${f(z)} €`] };
    } },
    { id: 'misch', t: 'Kapitalerhöhung: Mischkurs und Bezugsrecht', em: '🧮', sub: 'Theoretischer Kurs nach Emission', gen() {
      const nA = R(2, 10) * 1e6, bv = pick([2, 3, 4, 5, 8, 10]), nN = nA / bv, Pa = R(20, 80), Pn = R(Math.max(5, Pa - 30), Pa - 2), M = (nA * Pa + nN * Pn) / (nA + nN), br = (Pa - Pn) / (bv + 1);
      const ask = Math.random() < 0.5;
      return { q: `${f(nA / 1e6, 0)} Mio. Aktien notieren bei ${Pa} €. Ausgegeben werden ${f(nN / 1e6, 2)} Mio. neue Aktien zu ${Pn} €. ${ask ? 'Theoretischer Mischkurs?' : 'Rechnerischer Wert des Bezugsrechts?'}`, a: r2(ask ? M : br), unit: '€', tol: 0.01,
        steps: [`Bezugsverhältnis ${bv} : 1`, `Mischkurs (${bv} · ${Pa} + ${Pn}) / ${bv + 1} = ${f(M)} €`, `Bezugsrecht (${Pa} − ${Pn}) / ${bv + 1} = ${f(br)} €`] };
    } },
    { id: 'lev', t: 'Leverage und Modigliani-Miller', em: '🏋️', sub: 'Eigenkapitalrendite und -kosten', gen() {
      const EK = R(20, 100) * 1e6, FK = R(20, 200) * 1e6, i = R(2, 7) / 100, rg = R(3, 12) / 100, V = FK / EK, re = rg + (rg - i) * V;
      return { q: `EK ${f(EK / 1e6, 0)} Mio., FK ${f(FK / 1e6, 0)} Mio. zu ${i * 100} %. ${Math.random() < 0.5 ? `Gesamtkapitalrendite ${rg * 100} %. Wie hoch ist die Eigenkapitalrendite` : `Eigenkapitalkosten bei reiner Eigenfinanzierung ${rg * 100} %. Wie hoch sind die Eigenkapitalkosten nach Modigliani-Miller`} in Prozent?`, a: r4(re) * 100, unit: '%', dec: 2, tol: 0.01,
        steps: [`V = FK/EK = ${f(V, 4)}`, `${f(rg * 100, 0)} % + (${f(rg * 100, 0)} % − ${f(i * 100, 0)} %) · ${f(V, 4)} = ${p(re)}`] };
    } },
    { id: 'rend', t: 'Renditen: annualisiert und stetig', em: '📊', sub: 'Geometrisches Mittel, ln', gen() {
      const P0 = R(20, 100), n = R(2, 5); let Ps = [P0]; for (let t = 0; t < n; t++) Ps.push(Math.round(Ps[t] * (1 + R(-15, 25) / 100)));
      const PT = Ps[n], geo = Math.pow(PT / P0, 1 / n) - 1, st = Math.log(PT / P0) / n, ask = Math.random() < 0.5;
      return { q: `Kursverlauf über ${n} Jahre (keine Dividenden): ${Ps.join(' → ')}. ${ask ? 'Annualisierte (geometrische) diskrete Rendite' : 'Durchschnittliche stetige Rendite'} in Prozent?`, a: r4(ask ? geo : st) * 100, unit: '%', dec: 2, tol: 0.01,
        steps: [`Diskret annualisiert: (${PT}/${P0})^(1/${n}) − 1 = ${p(geo)}`, `Stetig: ln(${PT}/${P0}) / ${n} = ${p(st)}`] };
    } },
    { id: 'skonto', t: 'Lieferantenkredit', em: '🚚', sub: 'Kosten des Skontoverzichts', gen() {
      const s = R(1, 4) / 100, sf = pick([7, 10, 14]), z = sf + pick([20, 30, 50]), e = s / (1 - s) * 360 / (z - sf);
      return { q: `${s * 100} % Skonto bei Zahlung innerhalb von ${sf} Tagen, sonst Zahlungsziel ${z} Tage. Jahreszins des Lieferantenkredits nach der Näherung in Prozent?`, a: r4(e) * 100, unit: '%', dec: 2, tol: 0.05,
        steps: [`${f(s, 2)} / ${f(1 - s, 2)} · 360 / (${z} − ${sf}) = ${p(e)}`] };
    } },
    { id: 'intern', t: 'Verfügbare interne Mittel', em: '🏭', sub: 'Aus Jahresabschlussgrößen', gen() {
      const ju = R(20, 200), afa = R(20, 150), rst = R(-20, 30), vor = R(-20, 40), ford = R(-20, 40), kv = R(-20, 30), lm = R(5, 60), m = ju + afa + rst - vor - ford + kv + lm;
      return { q: `TEUR: Jahresüberschuss ${ju}, Abschreibungen ${afa}, Veränderung Rückstellungen ${rst >= 0 ? '+' : ''}${rst}, Veränderung Vorräte ${vor >= 0 ? '+' : ''}${vor}, Veränderung Forderungen ${ford >= 0 ? '+' : ''}${ford}, Veränderung kurzfristige Verbindlichkeiten ${kv >= 0 ? '+' : ''}${kv}, liquide Mittel zu Jahresbeginn ${lm}. Wie viel steht für Investitionen zur Verfügung?`, a: m, unit: 'TEUR', dec: 0, tol: 0.5,
        steps: [`${ju} + ${afa} ${rst >= 0 ? '+' : '−'} ${Math.abs(rst)} ${vor >= 0 ? '−' : '+'} ${Math.abs(vor)} ${ford >= 0 ? '−' : '+'} ${Math.abs(ford)} ${kv >= 0 ? '+' : '−'} ${Math.abs(kv)} + ${lm} = ${m} TEUR`, 'Zunahmen im Umlaufvermögen binden Geld (minus), Zunahmen kurzfristiger Verbindlichkeiten setzen Geld frei (plus).'] };
    } },
    { id: 'liq', t: 'Liquiditätsgrade und Deckung', em: '🧷', sub: 'Bilanzkennzahlen', gen() {
      const lm = R(10, 80), fo = R(20, 120), vo = R(20, 120), kv = R(40, 200), ek = R(80, 400), av = R(100, 500), k = pick([1, 2, 3, 'A']);
      const v = k === 1 ? lm / kv : k === 2 ? (lm + fo) / kv : k === 3 ? (lm + fo + vo) / kv : ek / av;
      return { q: `Bilanz (TEUR): liquide Mittel ${lm}, kurzfristige Forderungen ${fo}, Vorräte ${vo}, kurzfristige Verbindlichkeiten ${kv}, Eigenkapital ${ek}, Anlagevermögen ${av}. ${k === 'A' ? 'Anlagendeckungsgrad 1' : 'Liquiditätsgrad ' + k} in Prozent?`, a: r2(v * 100), unit: '%', tol: 0.05,
        steps: [k === 'A' ? `EK / AV = ${ek}/${av} = ${f(v * 100)} %` : `${k === 1 ? lm : k === 2 ? `(${lm} + ${fo})` : `(${lm} + ${fo} + ${vo})`} / ${kv} = ${f(v * 100)} %`] };
    } },
    { id: 'ru', t: 'Bernoulli: Sicherheitsäquivalent', em: '🎲', sub: 'u(x) = √x', gen() {
      const a = R(2, 20) ** 2 * 100, b = R(2, 20) ** 2 * 100, pp = R(1, 9) / 10, eu = pp * Math.sqrt(a) + (1 - pp) * Math.sqrt(b), sa = eu * eu;
      return { q: `Lotterie: ${f(a, 0)} mit Wahrscheinlichkeit ${f(pp, 1)}, sonst ${f(b, 0)}. Nutzenfunktion u(x) = √x. Sicherheitsäquivalent?`, a: r2(sa), unit: 'GE', tol: 0.5,
        steps: [`EU = ${f(pp, 1)} · ${f(Math.sqrt(a), 0)} + ${f(1 - pp, 1)} · ${f(Math.sqrt(b), 0)} = ${f(eu, 4)}`, `SÄ = EU² = ${f(sa)}`, `Risikoprämie = µ − SÄ = ${f(pp * a + (1 - pp) * b - sa)}`] };
    } },
  ];

  D.EXAMS = [
    { id: 'p1', t: 'Probeklausur 1', min: 120, src: 'eigene Aufgaben im Klausurstil', tasks: [
      { t: 'Investition · Grundbegriffe (MC)', pts: 10, q: 'Welche Aussagen sind richtig?', tf: [
        ['Eine Normalinvestition hat genau einen Vorzeichenwechsel.', true, 'Erst Auszahlungs-, dann nur noch Einzahlungsüberschüsse.', 'i1'],
        ['Bei einem Annuitätendarlehen sinkt der Tilgungsanteil von Jahr zu Jahr.', false, 'Er steigt, weil die Zinsen auf die fallende Restschuld sinken.', 'i4'],
        ['Der Kapitalwert misst die Vermögensänderung im Planungszeitpunkt gegenüber der Unterlassungsalternative.', true, 'Interpretation des Kapitalwerts.', 'i5'],
        ['Der interne Zinsfuß ist für Auswahlentscheidungen zwischen sich ausschließenden Projekten das geeignete Kriterium.', false, 'Bei Auswahl entscheidet der Kapitalwert.', 'i8'],
        ['Bei Ungewissheit sind den Umweltzuständen Wahrscheinlichkeiten zugeordnet.', false, 'Das ist die Risikosituation.', 'n1']] },
      { t: 'Investition · Sparplan', pts: 12, q: 'Mia legt am 01.01. 25.000 GE an: 6 Jahre zu 2 %, danach 6 Jahre zu 4 % (Zinseszins).\na) Endguthaben nach 12 Jahren? (6 P.)\nb) Welchen konstanten Betrag kann sie danach 15 Jahre lang am Jahresende entnehmen, wenn das Guthaben zu 3 % weiterverzinst wird und am Ende aufgebraucht ist? (6 P.)',
        sol: `a) 25.000 · 1,02^6 · 1,04^6 = 25.000 · 1,12616 · 1,26532 = ${f(25000 * 1.02 ** 6 * 1.04 ** 6)} GE.\nb) ANF(3 %, 15) = ${f(ANF(0.03, 15), 6)}; Entnahme = ${f(25000 * 1.02 ** 6 * 1.04 ** 6 * ANF(0.03, 15))} GE.` },
      { t: 'Investition · Darlehen und Kapitalwert', pts: 28, q: 'Ein Unternehmen prüft Projekt A (−50.000; 15.000; 20.000; 25.000) und B (−30.000; 0; 36.000). Zins 6 %.\na) Kapitalwerte von A und B. (8 P.)\nb) Differenzreihe A − B und ihr Kapitalwert; welches Projekt ist zu wählen? (6 P.)\nc) Laufzeitindividuelle Annuitäten; warum führen sie hier in die Irre? (6 P.)\nd) Interner Zinsfuß von B. (3 P.)\ne) A wird mit einem Annuitätendarlehen über 50.000 GE, 3 Jahre, 6 % finanziert: Annuität und Restschuld nach dem 1. Jahr. (5 P.)',
        sol: (() => { const i = 0.06, kA = -50000 + 15000 / 1.06 + 20000 / 1.06 ** 2 + 25000 / 1.06 ** 3, kB = -30000 + 36000 / 1.06 ** 2, e = 50000 * ANF(i, 3);
          return `a) K_A = −50.000 + 14.150,94 + 17.799,93 + 20.990,48 = ${f(kA)}; K_B = −30.000 + 32.040,04 = ${f(kB)}.\nb) A − B = (−20.000; 15.000; −16.000; 25.000); K = ${f(kA - kB)} → ${kA > kB ? 'A' : 'B'} wählen.\nc) a_A = ${f(kA * ANF(i, 3))}, a_B = ${f(kB * ANF(i, 2))}. Die Laufzeiten sind verschieden; maßgeblich ist der Kapitalwert (bzw. die Annuität über einen einheitlichen Zeitraum).\nd) (36.000/30.000)^(1/2) − 1 = ${p(Math.sqrt(1.2) - 1)}.\ne) e* = 50.000 · ${f(ANF(i, 3), 6)} = ${f(e)}; RS₁ = 53.000 − ${f(e)} = ${f(53000 - e)}.`; })() },
      { t: 'Finanzierung · MC', pts: 10, q: 'Welche Aussagen sind richtig?', tf: [
        ['Finanzierung aus Rückstellungsgegenwerten ist Eigenfinanzierung.', false, 'Rückstellungen sind Fremdkapital.', 'f2'],
        ['Nach Modigliani-Miller steigen die Eigenkapitalkosten mit dem Verschuldungsgrad.', true, 'These 2: linear.', 'f6'],
        ['Bei schwacher Markteffizienz ist die Chartanalyse nutzlos.', true, 'Vergangene Kurse enthalten keine Prognosekraft.', 'f7'],
        ['Eine ordentliche Kapitalerhöhung ist auch möglich, wenn der Börsenkurs unter dem Nennwert liegt.', false, 'Ausgabe unter Nennwert ist unzulässig; zuerst Kapitalschnitt.', 'f5'],
        ['Abschreibungen sind erfolgs-, aber nicht zahlungswirksam.', true, 'Aufwand ohne Auszahlung.', 'f9']] },
      { t: 'Finanzierung · Anleihe und Kapitalerhöhung', pts: 22, q: 'a) Kuponanleihe 3 %, Ausgabekurs 96 %, Laufzeit 6 Jahre: Effektivzins nach der Näherung. (4 P.)\nb) Nullkuponanleihe, Kurs 85 %, Laufzeit 4 Jahre: Effektivzins. (4 P.)\nc) Stückzinsen bei Verkauf von 10.000 € Nominal der Kuponanleihe 90 Tage nach dem Zinstermin. (3 P.)\nd) 6 Mio. Aktien zu 42 €; 2 Mio. neue zu 30 €: Mischkurs und Bezugsrecht. (6 P.)\ne) EK 50 Mio., FK 75 Mio. zu 4 %, Gesamtkapitalrendite 7 %: Eigenkapitalrendite. (5 P.)',
        sol: `a) (0,03 + 0,04/6)/0,96 = ${p((0.03 + 0.04 / 6) / 0.96)}.\nb) (1/0,85)^(1/4) − 1 = ${p(Math.pow(1 / 0.85, 0.25) - 1)}.\nc) 10.000 · 0,03 · 90/360 = 75 €.\nd) BV 3 : 1; Mischkurs (3 · 42 + 30)/4 = 39 €; BR = 12/4 = 3 €.\ne) 7 % + 3 % · 1,5 = 11,5 %.` },
      { t: 'Finanzierung · Innenfinanzierung', pts: 18, q: 'TEUR: Jahresüberschuss 120, Abschreibungen 90, Zuführung Pensionsrückstellungen 25, Vorräte +30, Forderungen −10, kurzfristige Verbindlichkeiten +15, liquide Mittel zu Jahresbeginn 40. Geplante Investition: 400.\na) Verfügbare interne Mittel. (8 P.)\nb) Externer Bedarf. (2 P.)\nc) Beurteilen Sie Bankdarlehen, Leasing, Kontokorrentkredit und Anleihe für diesen Bedarf. (8 P.)',
        sol: 'a) 120 + 90 + 25 − 30 + 10 + 15 + 40 = 270 TEUR.\nb) 130 TEUR.\nc) Darlehen: geeignet (fristenkongruent, planbar). Leasing: geeignet (Nutzung ohne Kaufpreis, planbare Raten). Kontokorrent: ungeeignet (kurzfristig, teuer). Anleihe: ungeeignet (Volumen zu klein, hohe Emissionskosten, Kapitalmarktzugang).' },
    ] },
    { id: 'p2', t: 'Probeklausur 2', min: 120, src: 'eigene Aufgaben im Klausurstil', tasks: [
      { t: 'Investition · Unsicherheit', pts: 14, q: 'Alternativen in den Zuständen s1/s2/s3: X (30, 30, 30), Y (10, 40, 60), Z (−10, 50, 100). Wahrscheinlichkeiten 0,4/0,4/0,2.\na) Dominiert eine Alternative eine andere? (2 P.)\nb) Wahl nach dem µ-Prinzip. (3 P.)\nc) Wahl nach Maximin, Hurwicz (λ = 0,3) und Savage-Niehans. (9 P.)',
        sol: 'a) Nein.\nb) µ_X = 30, µ_Y = 4 + 16 + 12 = 32, µ_Z = −4 + 20 + 20 = 36 → Z.\nc) Maximin: X (30). Hurwicz: X 30; Y 0,3 · 60 + 0,7 · 10 = 25; Z 0,3 · 100 − 0,7 · 10 = 23 → X. Savage-Niehans: Bedauern X (0, 20, 70), Y (20, 10, 40), Z (40, 0, 0) → max 70/40/40 → Y oder Z (Gleichstand).' },
      { t: 'Investition · Darlehen mit Aufschub', pts: 16, q: 'Darlehen 120.000 GE, Laufzeit 12 Jahre, 4 %, Auszahlung 100 %.\na) Annuität bei sofortigem Tilgungsbeginn. (4 P.)\nb) Gesamtzinsen. (3 P.)\nc) Restschuld nach 5 Annuitäten. (5 P.)\nd) Annuität, wenn in den ersten 2 Jahren nichts gezahlt wird und die Gesamtlaufzeit gleich bleibt. (4 P.)',
        sol: (() => { const K = 120000, i = 0.04, e = K * ANF(i, 12), q = 1.04 ** 5;
          return `a) ANF(4 %, 12) = ${f(ANF(i, 12), 6)}; e* = ${f(e)}.\nb) 12 · ${f(e)} − 120.000 = ${f(12 * e - K)}.\nc) 120.000 · 1,04^5 − ${f(e)} · (1,04^5 − 1)/0,04 = ${f(K * q - e * (q - 1) / i)}.\nd) 120.000 · 1,04² = 129.792; e** = 129.792 · ANF(4 %, 10) = ${f(129792 * ANF(i, 10))}.`; })() },
      { t: 'Investition · Interner Zins', pts: 20, q: 'a) Projekt P: (−4.000; 0; 0; 0; 5.000). Interner Zinsfuß. (4 P.)\nb) Projekt Q: −6.000, danach ewig 330 pro Jahr. Interner Zinsfuß und Kapitalwert bei 3 %. (6 P.)\nc) Projekt R: (−1.000; 300; 880). Interner Zinsfuß. (6 P.)\nd) P hat den höheren internen Zins als Q. Welches Projekt ist bei 3 % zu wählen, wenn nur eines möglich ist? Begründen Sie. (4 P.)',
        sol: `a) (5.000/4.000)^(1/4) − 1 = ${p(Math.pow(1.25, 0.25) - 1)}.\nb) 330/6.000 = 5,50 %; K = −6.000 + 330/0,03 = 5.000.\nc) q = (300 + √(90.000 + 3.520.000))/2.000 = (300 + 1.900)/2.000 = 1,1 → 10 %.\nd) K_P = −4.000 + 5.000/1,03^4 = ${f(-4000 + 5000 / 1.03 ** 4)} < 5.000 = K_Q → Q. Bei Auswahl zählt der Kapitalwert, nicht der interne Zins.` },
      { t: 'Finanzierung · Börse', pts: 16, q: 'Eröffnungsauktion. Kauf: billigst 100; Limit 20,10 → 200; Limit 20,00 → 150; Limit 19,90 → 100. Verkauf: bestens 50; Limit 19,90 → 150; Limit 20,00 → 200; Limit 20,10 → 250.\na) Bestimmen Sie Auktionspreis und Umsatz. (10 P.)\nb) Welche Seite wird nicht vollständig bedient, und um wie viele Stück? (3 P.)\nc) Was misst die Geld-Brief-Spanne? (3 P.)',
        sol: 'a) 19,90: Kauf 550, Verkauf 200 → 200. 20,00: Kauf 450, Verkauf 400 → 400. 20,10: Kauf 300, Verkauf 650 → 300. Preis 20,00, Umsatz 400.\nb) Kaufseite, 50 Stück Überhang.\nc) Differenz zwischen niedrigstem Verkaufs- und höchstem Kauflimit; je größer, desto geringer die Liquidität.' },
      { t: 'Finanzierung · Rendite und Kennzahlen', pts: 20, q: 'a) Kurse einer Aktie: 40, 48, 42, 50 (keine Dividende). Diskrete Einzelrenditen, annualisierte Rendite, durchschnittliche stetige Rendite. (8 P.)\nb) Bilanz (TEUR): liquide Mittel 30, Forderungen 70, Vorräte 100, kurzfristige Verbindlichkeiten 160, EK 300, AV 420. Liquiditätsgrade 1–3 und Anlagendeckungsgrad 1; Beurteilung. (8 P.)\nc) Marktwert des EK 900 TEUR. Firmenwert? (4 P.)',
        sol: `a) +20 %, −12,5 %, +19,05 %; annualisiert (50/40)^(1/3) − 1 = ${p(Math.pow(1.25, 1 / 3) - 1)}; stetig ln(1,25)/3 = ${p(Math.log(1.25) / 3)}.\nb) LG1 18,75 %, LG2 62,5 %, LG3 125 %, AD1 71,43 %: kurzfristige Verbindlichkeiten nur mit Vorräten gedeckt, AV nicht vollständig durch EK finanziert (Fristenkongruenz prüfen, langfristiges FK?).\nc) 900 − 300 = 600 TEUR.` },
      { t: 'Finanzierung · Kapitalstruktur', pts: 14, q: 'Ein Unternehmen mit Eigenkapitalkosten von 8 % bei reiner Eigenfinanzierung nimmt Fremdkapital zu 5 % auf, bis der Verschuldungsgrad 1,5 beträgt.\na) Eigenkapitalkosten nach MM. (4 P.)\nb) Gesamtkapitalkosten nach MM. (4 P.)\nc) Nennen Sie je ein Argument der Realität für und gegen höhere Verschuldung. (6 P.)',
        sol: 'a) 8 % + 3 % · 1,5 = 12,5 %.\nb) Unverändert 8 % (12,5 % · 0,4 + 5 % · 0,6 = 8 %).\nc) Für: Zinsen sind steuerlich abziehbar (Tax Shield). Gegen: steigende Insolvenzwahrscheinlichkeit und -kosten, höhere FK-Zinsen.' },
    ] },
  ];
})();
