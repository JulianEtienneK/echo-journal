/* Echo · 31021 Klausurkern: Aussagenbank (Ankreuzteile), Rechentrainer für die Aufgabentypen der Altklausuren, die fehlende Lektion
   „Unvollkommener Kapitalmarkt“, Ankreuz-Probeklausuren im echten Bewertungsschema und der Altklausur-Tracker.
   Abgleich mit den Klausuren SS 2023 bis WS 2025/26 (Investition: Hering, Finanzierung: Baule). Alles eigene Formulierungen und Zahlen;
   die Originalklausuren liegen nur im Projekt, hier stehen allein Aufgabentitel und Punkte. */
'use strict';
(() => {
  const D = window.STB_PFAD;
  const R = (a, b, st = 1) => a + st * Math.floor(Math.random() * (Math.floor((b - a) / st) + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const f = (x, d = 2) => Number(x).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const p = (x, d = 2) => f(x * 100, d) + ' %';
  const r2 = x => Math.round(x * 100) / 100, r4 = x => Math.round(x * 1e4) / 1e4;
  const ANF = (i, n) => i === 0 ? 1 / n : i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- neue Lektion: unvollkommener Kapitalmarkt (WS 2024/25: 16 von 50 Punkten) ---------- */
  D.LESSONS.inv.push({ id: 'i9', t: 'Unvollkommener Kapitalmarkt: Kontokorrent', norms: ['Soll- und Habenzins', 'Kontostand mit und ohne Investition'], link: 'i5',
    why: 'Fallen Soll- und Habenzins auseinander, gibt es keinen einheitlichen Kalkulationszins mehr. Die Klausur lässt dann die Kontostände mit Investition fortschreiben und daraus Endwert und Kapitalwert bestimmen, eine ganze Aufgabe mit bis zu 16 Punkten.',
    core: ['Unvollkommener Kapitalmarkt: Sollzins (für Kredit) und Habenzins (für Anlage) sind verschieden, oft auch je Periode. Welcher Zins gilt, hängt davon ab, ob das Konto am Periodenanfang im Haben oder im Soll steht.',
      'Gegeben sind die Kontostände C_{t} im Unterlassungsfall (Zinsen schon enthalten). Daraus folgen die übrigen Zahlungen des Betriebs: z_{t} = C_{t} − C_{t−1} · (1 + r_{t}), mit r_{t} = Habenzins, wenn C_{t−1} ≥ 0, sonst Sollzins.',
      'Mit Investition: C^{m}_{0} = C_{0} + g_{0}; danach C^{m}_{t} = C^{m}_{t−1} · (1 + r_{t}) + z_{t} + g_{t}, wobei r_{t} jetzt vom Vorzeichen von C^{m}_{t−1} abhängt.',
      'Endwert EW = C^{m}_{T} − C_{T} (Vermögenszuwachs am Planungsende). Kapitalwert: EW mit den relevanten Zinsen der Perioden abzinsen, K = \\frac{EW}{(1 + r_{1}) · … · (1 + r_{T})}; relevant ist der Zins, der für das Konto mit Investition in der jeweiligen Periode gilt.'],
    schema: ['Für jede Periode: Konto ohne Investition im Haben oder im Soll? Zins zuordnen', 'Übrige Zahlungen z_{t} aus den Kontoständen herausrechnen', 'Kontostände mit Investition fortschreiben, Zins jeweils nach dem neuen Vorzeichen', 'EW = Differenz am Ende; K = EW abgezinst mit den relevanten Zinsen'],
    case: { sv: 'Projekt (−500; 300; 400). Sollzins 12 % / 15 %, Habenzins 3 % / 4 % (Periode 1 / 2). Kontostände ohne Investition: C_{0} = 900, C_{1} = −300, C_{2} = 800.',
      steps: [['Übrige Zahlungen z_{1} und z_{2}?', 'Formel: z_{t} = C_{t} − C_{t−1} · (1 + r_{t})\nEingesetzt: C_{0} = 900 im Haben → 3 %: z_{1} = −300 − 900 · 1,03 = −1.227; C_{1} = −300 im Soll → 15 %: z_{2} = 800 − (−300) · 1,15 = 1.145\nErgebnis: z_{1} = −1.227, z_{2} = 1.145'],
        ['Kontostände mit Investition?', 'Formel: C^{m}_{0} = C_{0} + g_{0}; C^{m}_{t} = C^{m}_{t−1} · (1 + r_{t}) + z_{t} + g_{t}\nEingesetzt: C^{m}_{0} = 900 − 500 = 400 (Haben → 3 %); C^{m}_{1} = 400 · 1,03 − 1.227 + 300 = −515 (Soll → 15 %); C^{m}_{2} = −515 · 1,15 + 1.145 + 400 = 952,75\nErgebnis: 400; −515; 952,75'],
        ['Endwert und Kapitalwert?', 'Formel: EW = C^{m}_{T} − C_{T}; K = \\frac{EW}{(1 + r_{1}) · (1 + r_{2})}\nEingesetzt: EW = 952,75 − 800 = 152,75; K = \\frac{152,75}{1,03 · 1,15}\nErgebnis: EW = 152,75; K = 128,96']],
      res: 'EW 152,75; K 128,96: Das Projekt lohnt sich.' },
    more: [{ sv: 'Gleiches Projekt, aber C_{0} = 200, C_{1} = 500, C_{2} = −400 ohne Investition.', steps: [['C^{m}_{0}?', 'Formel: C^{m}_{0} = C_{0} + g_{0}\nEingesetzt: 200 − 500\nErgebnis: −300, also Soll: In Periode 1 gilt jetzt der Sollzins 12 % statt des Habenzinses.'], ['Warum ändert sich der Zins?', 'Die Investition dreht das Vorzeichen des Kontos. Deshalb wird mit Investition ein anderer Zins relevant als ohne; genau das macht den Markt unvollkommen.']], res: 'Zinswechsel durch die Investition selbst.' }],
    nav: [],
    cards: [['Was macht den Kapitalmarkt unvollkommen (Kontokorrent-Fall)?', 'Soll- und Habenzins sind verschieden; welcher gilt, hängt vom Vorzeichen des Kontos ab.'],
      ['Übrige Zahlungen z_{t} aus Kontoständen ohne Investition?', 'z_{t} = C_{t} − C_{t−1} · (1 + r_{t}), r_{t} je nach Vorzeichen von C_{t−1}.'],
      ['Kontostand mit Investition fortschreiben?', 'C^{m}_{t} = C^{m}_{t−1} · (1 + r_{t}) + z_{t} + g_{t}, Zins nach dem Vorzeichen von C^{m}_{t−1}.'],
      ['Endwert und Kapitalwert im Kontokorrent-Fall?', 'EW = C^{m}_{T} − C_{T}; K = EW abgezinst mit den relevanten Periodenzinsen.']] });

  /* ---------- Zusatzkarten für verbale Klausurteile („Begründen Sie“, „Erläutern Sie“) ---------- */
  const LBY = {}; for (const m of D.ROADMAP) for (const l of D.LESSONS[m.id] || []) LBY[l.id] = l;
  const addCards = (lid, cs) => { if (LBY[lid]) LBY[lid].cards.push(...cs); };
  addCards('f3', [['Warum passt ein Bankdarlehen zu einer Maschine, ein Kontokorrentkredit aber nicht?', 'Darlehen: langfristig wie die Nutzung, Zins und Tilgung planbar. Kontokorrent: für kurzfristige Liquiditätsengpässe gedacht und teuer; Fristen passen nicht.'],
    ['Warum kann Leasing den Fehlbetrag für eine Maschine schließen?', 'Die Maschine wird sofort genutzt, ohne den Kaufpreis aufzubringen; die Raten verteilen die Belastung planbar über die Nutzungsdauer.']]);
  addCards('f4', [['Warum eignet sich eine Anleihe kaum für einen einzelnen Maschinenkauf eines Mittelständlers?', 'Anleihen sind ein Instrument großer Emittenten; Emission ist organisatorisch aufwendig und teuer, für einen kleinen Betrag unverhältnismäßig.'],
    ['Warum bietet eine Wandelanleihe eine niedrigere Rendite als eine normale Anleihe desselben Emittenten?', 'Der Inhaber bekommt zusätzlich das Wandlungsrecht in Aktien; dieses Recht bezahlt er mit einem niedrigeren Zins.'],
    ['Dirty price einer Anleihe?', 'Börsenkurs (clean price) plus aufgelaufene Stückzinsen.']]);
  addCards('f5', [['Warum schadet der Kursrückgang nach einer ordentlichen Kapitalerhöhung dem Altaktionär theoretisch nicht?', 'Er erhält Bezugsrechte; nimmt er nicht teil, verkauft er sie und wird damit genau für den Kursverlust entschädigt. Operation blanche: so viele Rechte verkaufen, dass der Rest ohne Zuzahlung bezogen wird.'],
    ['Bilanzkurs einer Aktie und warum der Börsenkurs abweicht?', 'Bilanzielles Eigenkapital geteilt durch die Aktienzahl. Der Börsenkurs enthält zusätzlich die Erwartungen über künftige Entwicklungen.'],
    ['Was ist ein Kapitalschnitt und wann ist er nötig?', 'Herabsetzung des gezeichneten Kapitals, um Verluste buchtechnisch auszugleichen; nötig, wenn der Börsenkurs unter dem Nennwert liegt, weil junge Aktien nicht unter Nennwert ausgegeben werden dürfen.']]);
  addCards('f6', [['Kapitalstrukturrisiko?', 'Das zusätzliche Risiko der Eigenkapitalgeber, das allein durch Verschuldung entsteht: Der Leverage-Effekt vervielfacht das leistungswirtschaftliche Risiko. In der MM-Welt wird es durch höhere EK-Kosten abgegolten (Risikoaversion).'],
    ['Warum ist ein höherer Verschuldungsgrad trotz Leverage-Effekt nicht grundsätzlich besser?', 'Die höhere EK-Rendite gilt auf weniger Eigenkapital, die Schwankung steigt, bei unsicheren Projekten droht eine negative EK-Rendite; dazu Insolvenzrisiko, das den Steuervorteil teilweise aufhebt.']]);
  addCards('f8', [['Risikoneutral und risikoavers im Vergleich?', 'Risikoneutral: nur die erwartete Rendite zählt, solche Anleger verhalten sich gleich. Risikoavers: mehr Risiko nur gegen höhere erwartete Rendite; wie viel mehr, ist von Anleger zu Anleger verschieden.'],
    ['Warum gelten Renditeschwankungen als Risiko?', 'Volatilität zeigt, wie stark die tatsächliche Rendite um den Erwartungswert streut; je stärker, desto unsicherer der Ertrag, Verluste werden wahrscheinlicher.'],
    ['Wofür sind stetige Renditen vorteilhaft?', 'Sie sind über die Zeit additiv: Die Gesamtrendite ist die Summe der Einzelrenditen. Praktisch, wenn Renditen über Perioden aggregiert werden.'],
    ['Fisher-Modell in drei Sätzen?', 'Vollkommener Kapitalmarkt, zwei Zeitpunkte. Die Konsumgerade folgt aus Vermögen und Zins; jeder wählt auf ihr den Punkt, an dem seine höchste Indifferenzkurve sie berührt. Investitionsentscheidung und Konsumpräferenz sind trennbar (Fisher-Separation).']]);
  addCards('f9', [['Was bedeutet ein dauerhaft positiver Cashflow aus Investitionstätigkeit (Finanzanlagen konstant)?', 'Das Unternehmen setzt mehr Kapital aus Sachanlagen frei, als es reinvestiert: Desinvestition, eher Warnsignal (Liquiditätsengpass, kein Wachstum) als Kapazitätsausbau.'],
    ['Warum kann der Cashflow aus Finanzierungstätigkeit negativ sein?', 'Weil das Unternehmen Schulden tilgt oder Ausschüttungen leistet.'],
    ['Was zeigt ein Anlagendeckungsgrad 1 unter 1?', 'Das Anlagevermögen ist nicht vollständig durch Eigenkapital gedeckt; bei Fälligkeit langfristiger Schulden müsste Anlagevermögen verkauft oder neues langfristiges Kapital aufgenommen werden.'],
    ['Forderungsumschlagsdauer?', '\\frac{Forderungen L+L}{Umsatzerlöse} · 365 Tage: durchschnittliche Zeit von der Rechnung bis zum Zahlungseingang.'],
    ['Cashflow i. e. S. und i. w. S.?', 'i. e. S. = Jahresüberschuss + Abschreibungen + Bildung Rückstellungen (oder Umsatz − zahlungswirksame Aufwendungen). i. w. S. = i. e. S. − Aufbau Betriebsmittel (bzw. + Abbau).']]);

  /* ---------- Aussagenbank: eigene Aussagen zu den Themen, die in den Ankreuzteilen immer wiederkehren ---------- */
  const T = {
    i1: [['Der Kauf einer Produktionsanlage ist ein Investitionsprojekt.', 1, 'Klassische Sachinvestition.'],
      ['Die Ausbildung von Mitarbeitern kann ein Investitionsprojekt sein.', 1, 'Immaterielle Investition: heute Auszahlung, später Rückflüsse.'],
      ['Eine bloße Verkürzung der Arbeitszeit ist typischerweise ein Investitionsprojekt.', 0, 'Keine Auszahlung, die später Rückflüsse bringt.'],
      ['Zwischen Investitionsobjekten können Unabhängigkeit, Bedingtheit, gegenseitige Beeinflussung und gegenseitiger Ausschluss bestehen.', 1, 'Die vier zeitlich-horizontalen Interdependenzen.'],
      ['Am vollkommenen Kapitalmarkt sind Soll- und Habenzins gleich und Mittel in beliebiger Höhe aufnehmbar.', 1, 'Zwei Prämissen des vollkommenen Kapitalmarkts unter Sicherheit.'],
      ['Am vollkommenen Kapitalmarkt werden Transaktionskosten berücksichtigt.', 0, 'Gerade nicht: keine Transaktionskosten.'],
      ['Am vollkommenen Kapitalmarkt unter Sicherheit sind die künftigen Zinssätze unbekannt.', 0, 'Unter Sicherheit sind sie ex ante bekannt.'],
      ['Die Unterlassungsalternative heißt: Projekt nicht durchführen, Mittel stattdessen zum Finanzmarktzins anlegen bzw. Kredite nicht aufnehmen.', 1, 'Vergleichsmaßstab jeder Vorteilhaftigkeitsaussage.'],
      ['Wird eine Investition aus eigenen Mitteln finanziert, entstehen keine indirekten Folgeeffekte.', 0, 'Es entgehen Zinsen aus der anderweitigen Anlage der Mittel.'],
      ['Wird eine Investition fremdfinanziert, folgen als indirekte Effekte spätere Zins- und Tilgungszahlungen.', 1, 'Indirekter Folgeeffekt der Anfangsauszahlung.'],
      ['Eine aus Liquiditätsreserven finanzierte Investition greift auf ohnehin vorhandene liquide Mittel zurück.', 1, 'Definition.'],
      ['Bei einer Auswahlentscheidung wird zwischen sich gegenseitig ausschließenden Projekten gewählt; gefragt ist die relative Vorteilhaftigkeit.', 1, 'Im Unterschied zur Frage, ob ein einzelnes Projekt besser ist als Unterlassen.']],
    i2: [['Abzinsungsfaktor mal Aufzinsungsfaktor (gleicher Zins, gleiche Laufzeit) ergibt 1.', 1, '(1 + i)^{−n} · (1 + i)^{n} = 1.'],
      ['Vertauscht man bei periodenindividuellen Zinsen die Reihenfolge der Zinssätze, ändert sich der Endwert.', 0, 'Die Zinsfaktoren werden multipliziert; die Reihenfolge ist egal.'],
      ['Bei einfacher Verzinsung gilt C_{T} = C_{0} · (1 + i · T).', 1, 'Zinsen nur auf den Anlagebetrag.'],
      ['Über lange Laufzeiten kann Zinseszins mit niedrigem Zins die einfache Verzinsung mit höherem Zins übertreffen.', 1, 'Exponentielles gegen lineares Wachstum.'],
      ['Beim Zinseszins ist Bemessungsgrundlage das Guthaben zu Jahresbeginn samt bereits gutgeschriebener Zinsen.', 1, 'Daher q^{n}.'],
      ['Der Aufzinsungsfaktor für 5 % und 2 Jahre beträgt 1,10.', 0, '1,05^{2} = 1,1025.']],
    i3: [['Bei i = 0 % ist der Annuitätenfaktor 1/n.', 1, 'Der Betrag wird einfach gleichmäßig verteilt.'],
      ['Bei i = 0 % ist der Annuitätenfaktor 1.', 0, 'Er ist 1/n.'],
      ['Der Rentenbarwertfaktor ist der Kehrwert des Annuitätenfaktors.', 1, 'RBF = 1/ANF.'],
      ['Eine Annuität ist eine gleichbleibende Zahlung in t = 1 bis T, die einem gegebenen Betrag in t = 0 gleichwertig ist.', 1, 'Definition.'],
      ['Eine Annuität ist eine im Zeitverlauf abnehmende Folge von Zinszahlungen.', 0, 'Sie ist konstant.'],
      ['Umrechnen von T gleichen nachschüssigen Zahlungen in einen Betrag in t = 0 heißt Annuität bilden.', 0, 'Das ist Barwertbildung (Rentenbarwert); die Annuität ist der umgekehrte Weg.'],
      ['Bei wechselnden Zinsen ist die konstante Entnahme der Anfangsbetrag geteilt durch die Summe der Abzinsungsfaktoren.', 1, 'Der Barwert aller Entnahmen muss den Anfangsbetrag ergeben.'],
      ['Für eine ewige Rente ist der Annuitätenfaktor gleich dem Zinssatz.', 1, 'ANF(i, ∞) = i.']],
    i4: [['Beim Annuitätendarlehen steigt der Tilgungsanteil von Jahr zu Jahr.', 1, 'Die Zinsen auf die sinkende Restschuld fallen.'],
      ['Beim Annuitätendarlehen steigt der Zinsanteil von Jahr zu Jahr.', 0, 'Er sinkt.'],
      ['Die Gesamtzinsen eines Annuitätendarlehens betragen n · e* − K.', 1, 'Alle Raten minus Tilgung des Nominalbetrags.'],
      ['Die Restschuld nach t Jahren ist der Barwert der noch ausstehenden Annuitäten.', 1, 'RS_{t} = e* · RBF(i, n − t).'],
      ['Werden anfangs weder Zins noch Tilgung gezahlt, wächst die Schuld bis zum Zahlungsbeginn mit Zinseszins.', 1, 'K · q^{d}, danach Annuität über die Restlaufzeit.'],
      ['Bei einem Aufschub ohne Zahlungen bleibt die Annuität gleich hoch wie ohne Aufschub.', 0, 'Höhere Schuld auf kürzere Restlaufzeit: Die Annuität steigt.']],
    i5: [['Der Kapitalwert gibt die Vermögensänderung im Planungszeitpunkt gegenüber der Unterlassungsalternative an.', 1, 'Standardinterpretation.'],
      ['Ein Kapitalwert von null bedeutet Indifferenz zwischen Durchführung und Unterlassung.', 1, 'Das Projekt verzinst sich genau zum Kalkulationszins.'],
      ['Ein positiver Kapitalwert ist der Betrag, den man in jeder Periode zusätzlich entnehmen kann.', 0, 'Das ist die Annuität, nicht der Kapitalwert.'],
      ['Ein positiver Kapitalwert ist der Betrag, den der Investor in t = 0 mindestens bekommen müsste, um auf das Projekt zu verzichten.', 1, 'Andere Lesart derselben Vermögensänderung.'],
      ['Bei einheitlichem Zins gilt Endwert = Kapitalwert · (1 + i)^{T}.', 1, 'Aufzinsen auf das Planungsende.'],
      ['Bei periodenindividuellen Zinsen wird jede Zahlung mit dem Produkt der Zinsfaktoren bis zu ihrem Zeitpunkt abgezinst.', 1, 'Kein einheitlicher Abzinsungsfaktor.'],
      ['Laufzeitindividuelle Endwerte unterschiedlich langer Projekte lassen sich direkt vergleichen.', 0, 'Sie beziehen sich auf verschiedene Zeitpunkte; verglichen wird der Kapitalwert.'],
      ['Direkt über die Vorteilhaftigkeit eines einzelnen Projekts am vollkommenen Kapitalmarkt gibt der Kalkulationszins Auskunft.', 0, 'Der Kapitalwert gibt Auskunft.']],
    i6: [['Die Differenzzahlungsreihe ist ein real durchführbares Projekt.', 0, 'Sie ist ein gedankliches Hilfskonstrukt.'],
      ['Mit der Differenzzahlungsreihe lässt sich die relative Vorteilhaftigkeit zweier Alternativen beurteilen.', 1, 'Ihr Kapitalwert ist K(A) − K(B).'],
      ['Mit der Differenzzahlungsreihe lässt sich die absolute Vorteilhaftigkeit einer Alternative beurteilen.', 0, 'Dafür braucht man den Kapitalwert der Alternative selbst.'],
      ['Ist der Kapitalwert der Differenzreihe A − B positiv, ist A auch absolut vorteilhaft.', 0, 'A ist nur besser als B; beide könnten negativ sein.'],
      ['Fehlende Zahlungen einer kürzeren Alternative werden in der Differenzreihe mit null angesetzt.', 1, 'Am vollkommenen Markt ist Anlage zum Kalkulationszins kapitalwertneutral.']],
    i7: [['Die äquivalente Annuität ist a = K · ANF(i, T).', 1, 'Kapitalwert in gleiche Raten umgerechnet.'],
      ['Bei gleicher Laufzeit führen Annuität und Kapitalwert zur selben Entscheidung.', 1, 'Gleicher ANF für beide.'],
      ['Eine positive Annuität zeigt, dass ein Projekt absolut vorteilhaft ist.', 1, 'Gleiches Vorzeichen wie der Kapitalwert.'],
      ['Bei unterschiedlicher Laufzeit und einmaliger Durchführung entscheidet die höhere laufzeitindividuelle Annuität.', 0, 'Entscheidend bleibt der Kapitalwert; die Annuität vergleicht ungleich lange Zeiträume.'],
      ['Für ein Projekt mit ewiger Rente legt man den Annuitätenfaktor ANF = i zugrunde.', 1, 'Unendliche Laufzeit.']],
    i8: [['Eine Normalinvestition hat genau einen Vorzeichenwechsel: erst Auszahlungen, dann nur Einzahlungen.', 1, 'Definition.'],
      ['(−200; 30; −30; 30) ist eine Normalinvestition.', 0, 'Mehrere Vorzeichenwechsel.'],
      ['(−200; 30; 30; 30) ist eine Normalinvestition.', 1, 'Ein Vorzeichenwechsel, auch wenn sich das Projekt nicht lohnt.'],
      ['Bei einer Normalinvestition fällt die Kapitalwertfunktion im Bereich positiver Kapitalwerte streng monoton.', 1, 'Daher genau ein positiver interner Zins.'],
      ['Bei einer Normalinvestition steigt die Kapitalwertfunktion mit dem Zins.', 0, 'Sie fällt.'],
      ['Aus r*(D) > r*(C) > i folgt eindeutig, dass D den höheren Kapitalwert hat.', 0, 'Projektgröße und Laufzeit unterscheiden sich; nur der Kapitalwert entscheidet.'],
      ['Für ein einzelnes Normalinvestitionsprojekt gilt: r* > i genau dann, wenn K > 0.', 1, 'Isolierte Vorteilhaftigkeit.'],
      ['Bei ewiger Rente Z und Anfangsauszahlung A_{0} gilt r* = Z / A_{0}.', 1, 'Kapitalwert −A_{0} + Z/r = 0.']],
    i9: [['Am unvollkommenen Kapitalmarkt fallen Soll- und Habenzins auseinander.', 1, 'Kernmerkmal.'],
      ['Welcher Zins in einer Periode gilt, hängt davon ab, ob das Konto zu Periodenbeginn im Haben oder im Soll steht.', 1, 'Kontokorrent-Logik.'],
      ['Am unvollkommenen Kapitalmarkt gibt es einen eindeutigen Kalkulationszins für alle Projekte.', 0, 'Der relevante Zins hängt vom Konto und damit vom Projekt ab.'],
      ['Eine Investition kann das Vorzeichen des Kontos drehen und damit den relevanten Zins ändern.', 1, 'Deshalb Kontostände mit Investition neu rechnen.'],
      ['Der Endwert ist die Differenz der Kontostände mit und ohne Investition am Planungsende.', 1, 'Vermögenszuwachs.']],
    n1: [['Eine Risikosituation liegt vor, wenn den Umweltzuständen Eintrittswahrscheinlichkeiten zugeordnet sind.', 1, 'Definition.'],
      ['Eine Ungewissheitssituation liegt vor, wenn den Umweltzuständen Eintrittswahrscheinlichkeiten zugeordnet sind.', 0, 'Bei Ungewissheit fehlen die Wahrscheinlichkeiten.'],
      ['Zustandsdominanz: a1 ist in keinem Zustand schlechter und in mindestens einem besser als a2.', 1, 'Definition.'],
      ['Zustandsdominanz liegt vor, wenn das schlechteste Ergebnis von a1 nicht schlechter ist als das beste von a2.', 0, 'Das ist absolute Dominanz.'],
      ['Dominierte Alternativen scheiden unabhängig von der Risikoeinstellung aus.', 1, 'Jeder rationale Entscheider zieht die dominierende vor.']],
    n2: [['Im µ-σ-Prinzip ist eine Präferenzfunktion risikoneutral, wenn sie nur nach dem Erwartungswert urteilt.', 1, '∂Φ/∂σ = 0.'],
      ['∂Φ/∂σ < 0 kennzeichnet Risikoaversion.', 1, 'Mehr Streuung senkt den Präferenzwert.'],
      ['∂Φ/∂σ > 0 kennzeichnet Risikoneutralität.', 0, 'Das ist Risikofreude.'],
      ['Das µ-σ-Prinzip unterstellt immer Risikoneutralität.', 0, 'Die Risikoeinstellung steckt in Φ.'],
      ['Das µ-σ-Prinzip kann zu Entscheidungen führen, die der Zustandsdominanz widersprechen.', 1, 'Zwei Kennzahlen bilden die Verteilung nicht vollständig ab.'],
      ['Die Standardabweichung ist die Wurzel aus der Varianz Σ p (x − µ)^{2}.', 1, 'Streuungsmaß.']],
    n3: [['Das Sicherheitsäquivalent ist der sichere Betrag, der dem Entscheider gerade gleichwertig mit der unsicheren Alternative erscheint.', 1, 'Subjektiv, nicht objektiv.'],
      ['Das Sicherheitsäquivalent ist ein objektiver Betrag, den alle als gleichwertig ansehen.', 0, 'Es ist subjektiv.'],
      ['Risikoaversion zeigt sich in einer konkaven Risikonutzenfunktion.', 1, 'Abnehmender Grenznutzen.'],
      ['Bei Risikoaversion liegt das Sicherheitsäquivalent unter dem Erwartungswert.', 1, 'Die Differenz ist die Risikoprämie.'],
      ['Das Bernoulli-Prinzip maximiert den Nutzen des Erwartungswerts.', 0, 'Es maximiert den Erwartungswert des Nutzens.'],
      ['U(e) = −e^{2} + 80 · e − 720 hat ihr Maximum bei e = 80.', 0, 'U′(e) = −2e + 80 = 0 → e = 40.'],
      ['U(e) = −e^{2} + 80 · e − 720 verläuft konkav.', 1, 'Negativer quadratischer Term.']],
    n4: [['Die Maximin-Regel wählt die Alternative mit dem besten schlechtesten Ergebnis.', 1, 'Pessimistisch.'],
      ['Die Maximax-Regel wählt die Alternative mit dem besten besten Ergebnis.', 1, 'Optimistisch.'],
      ['Die Savage-Niehans-Regel minimiert das maximale Bedauern.', 1, 'Minimax-Regret.'],
      ['Die Laplace-Regel unterstellt gleiche Wahrscheinlichkeiten für alle Zustände.', 1, 'Prinzip des unzureichenden Grundes.'],
      ['Die Hurwicz-Regel gewichtet bestes und schlechtestes Ergebnis mit einem Optimismusparameter.', 1, 'λ · max + (1 − λ) · min.'],
      ['Bei Ungewissheit lässt sich das Bernoulli-Prinzip ohne weitere Annahmen anwenden.', 0, 'Es braucht Wahrscheinlichkeiten.']],
    f1: [['Personengesellschaften unterliegen der Körperschaftsteuer.', 0, 'Besteuert werden die Gesellschafter (Einkommensteuer).'],
      ['Bei Personengesellschaften werden die Gewinne auf Ebene der Gesellschafter besteuert.', 1, 'Transparenzprinzip.'],
      ['Gesellschafter einer Personengesellschaft müssen natürliche Personen sein.', 0, 'Auch Kapitalgesellschaften können beteiligt sein (GmbH & Co. KG).'],
      ['Anteile an Personengesellschaften lassen sich beliebig verkaufen, deshalb sind sie ideal für große Investoren.', 0, 'Die Übertragbarkeit ist eingeschränkt.'],
      ['Eine KG hat Komplementäre und Kommanditisten.', 1, 'Zwei Arten von Gesellschaftern.'],
      ['Komplementäre haften unbeschränkt.', 1, 'Kommanditisten nur bis zur Einlage.'],
      ['In der KG sind alle Gesellschafter zur Geschäftsführung berechtigt.', 0, 'Kommanditisten sind grundsätzlich ausgeschlossen.'],
      ['Für Fremdfinanzierung ist die Rechtsform weniger zentral als für Eigenfinanzierung.', 1, 'Eigenkapitalzugang hängt stark an der Rechtsform.']],
    f2: [['Der Kapazitätserweiterungseffekt beschreibt mehr Kapazität durch Reinvestition der verdienten Abschreibungen.', 1, 'Lohmann-Ruchti-Effekt.'],
      ['Für den Kapazitätserweiterungseffekt ist es egal, ob die Abschreibungen über den Umsatz verdient wurden.', 0, 'Nur verdiente Abschreibungsgegenwerte lassen sich reinvestieren.'],
      ['Selbstfinanzierung ist ein Teil der Innenfinanzierung.', 1, 'Einbehaltene Gewinne.'],
      ['Innenfinanzierung ist immer Eigenfinanzierung.', 0, 'Rückstellungsfinanzierung ist Innen- und zugleich Fremdfinanzierung.'],
      ['Finanzierung aus Rückstellungsgegenwerten gehört zur Innenfinanzierung.', 1, 'Mittel aus dem Umsatzprozess, bis zur Auszahlung gebunden.'],
      ['Die ordentliche Kapitalerhöhung ist ein klassisches Instrument der Innenfinanzierung.', 0, 'Außenfinanzierung mit Eigenkapital.'],
      ['Abschreibungen erhöhen unmittelbar den Cashflow.', 0, 'Sie sind nicht zahlungswirksam; sie werden beim indirekten Rechnen nur zurückaddiert.'],
      ['Die Auflösung einer Rückstellung erhöht das Innenfinanzierungsvolumen.', 0, 'Die Bildung bindet Mittel im Unternehmen, nicht die Auflösung.'],
      ['Ein längeres Zahlungsziel für alle Kunden verringert potenziell den Perioden-Cashflow.', 1, 'Einzahlungen kommen später.'],
      ['Innenfinanzierung im weiteren Sinne umfasst auch Vermögensumschichtung, etwa den Verkauf nicht benötigter Anlagen.', 1, 'Aktivtausch illiquide gegen liquide Mittel.']],
    f3: [['Kontokorrentkredite können zeitlich flexibel in Anspruch genommen und zurückgeführt werden.', 1, 'Kreditlinie.'],
      ['Bei Kontokorrentkrediten zahlt man Zinsen nach Höhe und Dauer des negativen Saldos.', 1, 'Nur auf die Inanspruchnahme.'],
      ['Das Skonto beim Lieferantenkredit ist meist so klein, dass sich vorzeitiges Zahlen nicht lohnt.', 0, 'Skontoverzicht ist meist sehr teuer; vorzeitig zahlen lohnt sich.'],
      ['Annuitätendarlehen gehören üblicherweise zu den langfristigen Finanzierungsinstrumenten.', 1, 'Laufzeit über Jahre.'],
      ['Fremdkapitalinstrumente lassen sich nach Fristigkeit und Besicherung gliedern.', 1, 'Zwei übliche Gliederungen.'],
      ['Pensionsrückstellungen sind ein klassisches Instrument der Außenfinanzierung.', 0, 'Innenfinanzierung (Mittel aus dem Umsatzprozess).'],
      ['Ein höheres Disagio macht ein Darlehen für den Darlehensgeber weniger attraktiv.', 0, 'Es erhöht seinen Effektivzins.'],
      ['Fremdkapitalgeber stehen bei der Außenfinanzierung immer in einer Leistungsbeziehung zum Unternehmen.', 0, 'Banken oder Anleihegläubiger nicht.'],
      ['Wer heute Fremdkapital aufnehmen will, bekommt es unabhängig vom Insolvenzrisiko problemlos.', 0, 'Das Insolvenzrisiko begrenzt den Zugang und erhöht den Zins.']],
    f4: [['Eine Nullkuponanleihe hat nur einen Zahlungstermin an den Gläubiger: die Rückzahlung.', 1, 'Keine laufenden Kupons.'],
      ['Wechselt eine Anleihe zwischen zwei Zinsterminen den Besitzer, zahlt der Käufer dem Verkäufer Stückzinsen.', 1, 'Der Verkäufer bekommt seinen Zinsanteil.'],
      ['Wechselt eine Anleihe zwischen zwei Zinsterminen den Besitzer, zahlt der Verkäufer dem Käufer Stückzinsen.', 0, 'Umgekehrt.'],
      ['Beim Floater wird der Zins jeweils zu Beginn der Zinsperiode festgelegt.', 1, 'Referenzzins am Periodenanfang plus Aufschlag.'],
      ['Bei manchen langfristigen Fremdkapitalinstrumenten steht die Höhe der Zinszahlungen bei Emission noch nicht fest.', 1, 'Variabel verzinsliche Anleihen.'],
      ['Anleihen können nur Staaten ausgeben.', 0, 'Auch Unternehmen.'],
      ['Festverzinsliche Anleihen zählen typischerweise zu den kurzfristigen Finanzierungsinstrumenten.', 0, 'Mittel- bis langfristig.'],
      ['Der dirty price ist der Börsenkurs plus Stückzinsen.', 1, 'Clean price + aufgelaufene Zinsen.'],
      ['Ein Disagio erhöht den Effektivzins über den Nominalzins.', 1, 'Weniger Auszahlung, gleiche Rückzahlung.'],
      ['Nullkuponanleihen sind grundsätzlich teurer als Kuponanleihen.', 0, 'Pauschal nicht sagbar.']],
    f5: [['Stammaktien verbriefen in der Regel je eine Stimme in der Hauptversammlung.', 1, 'Stimmrecht.'],
      ['Vorzugsaktien bieten oft eine bevorzugte Dividende, meist ohne Stimmrecht.', 1, 'Vorzug bei der Dividende.'],
      ['Vorzugsaktien verbriefen in der Regel ein höheres Stimmrecht als Stammaktien.', 0, 'Meist gar keins.'],
      ['Das Grundkapital ist die Summe der Nennwerte aller Aktien.', 1, 'Gezeichnetes Kapital der AG.'],
      ['Wechselt eine Aktie zwischen zwei Dividendenterminen den Besitzer, sind Stückdividenden zu zahlen.', 0, 'Gibt es nicht; die Dividende steckt im Kurs.'],
      ['Aktien gibt es nur am Primärmarkt.', 0, 'Gehandelt wird am Sekundärmarkt (Börse).'],
      ['Junge Aktien dürfen nicht unter dem Nennwert ausgegeben werden.', 1, 'Liegt der Kurs darunter, ist erst ein Kapitalschnitt nötig.'],
      ['Beim Kapitalschnitt wird ein Verlust mit dem gezeichneten Kapital verrechnet.', 1, 'Buchtechnische Herabsetzung.'],
      ['Der theoretische Kurs nach der Kapitalerhöhung ist der mit den Stückzahlen gewichtete Mittelwert aus altem Kurs und Ausgabekurs.', 1, 'Mischkurs.'],
      ['Ein Altaktionär, der nicht teilnimmt, erleidet durch den Kursrückgang theoretisch einen Vermögensverlust.', 0, 'Der Verkauf der Bezugsrechte gleicht ihn aus.'],
      ['Der Börsenkurs muss dem Bilanzkurs entsprechen.', 0, 'Er enthält Zukunftserwartungen.']],
    f6: [['Verschuldung erhöht bei schwankender Gesamtkapitalrendite die Schwankung der Eigenkapitalrendite.', 1, 'Leverage-Risiko.'],
      ['Die Gesamtkapitalrendite hängt vom Verschuldungsgrad ab.', 0, 'Sie ist leistungswirtschaftlich bestimmt.'],
      ['Sind Fremdkapitalzins und Gesamtkapitalrendite gleich, hängt die Eigenkapitalrendite nicht vom Verschuldungsgrad ab.', 1, 'Klammer (r_{GK} − i) = 0.'],
      ['Bei einem Verschuldungsgrad von null entspricht die Eigenkapitalrendite der Fremdkapitalrendite.', 0, 'Sie entspricht der Gesamtkapitalrendite.'],
      ['Bei konstantem Verschuldungsgrad über null senkt ein höherer Fremdkapitalzins die Eigenkapitalrendite.', 1, 'c. p.'],
      ['Verschuldung erhöht die Schwankung der Gesamtkapitalrendite.', 0, 'Nur die der Eigenkapitalrendite.'],
      ['In der Modigliani-Miller-Welt ist der Unternehmenswert unabhängig vom Verschuldungsgrad.', 1, 'These 1.'],
      ['In der Modigliani-Miller-Welt steigen die Eigenkapitalkosten linear mit dem Verschuldungsgrad.', 1, 'These 2.'],
      ['In der Modigliani-Miller-Welt sind Eigen- und Fremdkapitalkosten immer gleich.', 0, 'EK-Kosten liegen bei Verschuldung darüber.'],
      ['Kapitalkosten lassen sich als Opportunitätskosten der Kapitalgeber auffassen.', 1, 'Renditeforderung für Kapital und Risiko.'],
      ['Eigenkapitalkosten müssen am Periodenende als Dividende ausgezahlt werden.', 0, 'Es sind Renditeforderungen, keine Pflichtzahlungen.'],
      ['In der Realität hängen Fremdkapitalkosten vom Insolvenzrisiko ab.', 1, 'Risikoaufschlag.'],
      ['Steuervorteil der Fremdfinanzierung und Insolvenzrisiko wirken in entgegengesetzte Richtungen.', 1, 'Trade-off.'],
      ['Der Verschuldungsgrad lässt sich in der Praxis beliebig steigern.', 0, 'Insolvenzrisiko und Kreditgeber setzen Grenzen.']],
    f7: [['In der Auktion wird der Preis festgestellt, zu dem das Handelsvolumen am größten ist.', 1, 'Meistausführungsprinzip.'],
      ['Der Geldkurs ist das höchste Limit einer Kauforder, der Briefkurs das niedrigste Limit einer Verkaufsorder.', 1, 'Geld = Nachfrage, Brief = Angebot.'],
      ['Eine größere Geld-Brief-Spanne deutet auf eine höhere Liquidität der Aktie hin.', 0, 'Auf geringere Liquidität.'],
      ['Bei schwacher Markteffizienz enthalten vergangene Kurse keine Information über künftige Kurse.', 1, 'Chartanalyse nutzlos.'],
      ['Bei schwacher Markteffizienz kann die Fundamentalanalyse noch Informationen liefern.', 1, 'Öffentliche Informationen sind nicht zwingend eingepreist.'],
      ['Bei starker Markteffizienz kann auch ein Insider keine besseren Prognosen treffen.', 1, 'Alle Informationen sind eingepreist.'],
      ['Mittelstarke Markteffizienz schließt Vorteile aus Insiderwissen vollständig aus.', 0, 'Nur öffentliche Informationen sind eingepreist.'],
      ['In der Praxis sind alle Aktienmärkte stark effizient.', 0, 'Empirisch nicht haltbar.'],
      ['Eine billigst-Kauforder ist eine unlimitierte Kauforder.', 1, 'Kauft zu jedem Preis.']],
    f8: [['Stetige Renditen sind über die Zeit additiv.', 1, 'ln-Renditen addieren sich.'],
      ['Diskrete Tagesrenditen darf man über ein Jahr einfach aufaddieren.', 0, 'Man muss sie verketten: (1 + r)^{n} − 1.'],
      ['Die annualisierte diskrete Rendite ist das geometrische Mittel der Renditefaktoren minus 1.', 1, '(P_{T}/P_{0})^{1/T} − 1.'],
      ['Risikoneutrale Anleger bewerten nur nach der erwarteten Rendite.', 1, 'Risiko spielt keine Rolle.'],
      ['Risikoaverse Anleger wählen immer die Anlage mit dem geringsten Risiko.', 0, 'Sie verlangen für mehr Risiko mehr Rendite.'],
      ['Zwei risikoaverse Anleger verlangen immer denselben Preis für eine Aktie.', 0, 'Die Risikoprämie ist individuell.'],
      ['Je risikoaverser ein Anleger, desto niedriger der Preis, den er höchstens für eine riskante Aktie zahlt.', 1, 'Höhere Risikoprämie.'],
      ['Risikofreudige Anleger akzeptieren für mehr Risiko auch eine geringere erwartete Rendite.', 1, 'Risiko hat für sie einen Eigenwert.'],
      ['Zwei Indifferenzkurven desselben Entscheiders können sich schneiden.', 0, 'Sonst wäre die Präferenz widersprüchlich.'],
      ['Indifferenzkurven verschiedener Anleger können sich schneiden.', 1, 'Unterschiedliche Präferenzen.'],
      ['Das Fisher-Modell setzt einen vollkommenen Kapitalmarkt voraus.', 1, 'Ein Zins für Anlage und Kredit.'],
      ['Nach dem Fisher-Theorem müssen Investition und Konsumpräferenz gemeinsam entschieden werden.', 0, 'Sie sind trennbar (Separation).']],
    f9: [['Die Anlagenintensität ist eine vertikale Kennzahl.', 1, 'Struktur der Aktivseite.'],
      ['Der Verschuldungsgrad ist eine horizontale Kennzahl.', 0, 'Er beschreibt die Kapitalstruktur, also vertikal.'],
      ['Eigenkapitalquote, Fremdkapitalquote und Verschuldungsgrad lassen sich ohne weitere Angaben ineinander umrechnen.', 1, 'EKQ + FKQ = 1, VG = FKQ/EKQ.'],
      ['Ein Liquiditätsgrad I von 0,5 weist auf gute Solvenz hin.', 0, 'Nur die Hälfte der kurzfristigen Schulden ist durch liquide Mittel gedeckt.'],
      ['Anlagendeckungsgrade messen, ob langfristiges Vermögen fristenkongruent finanziert ist.', 1, 'Goldene Bilanzregel.'],
      ['Der Firmenwert ist die Differenz aus Marktwert des Eigenkapitals und bilanziellem Eigenkapital.', 1, 'Spiegelt Erwartungen künftiger Gewinne.'],
      ['Den Firmenwert kann man aus der herkömmlichen Bilanz ohne Marktwerte ablesen.', 0, 'Man braucht den Börsenwert.'],
      ['Eine Kapitalerhöhung ändert den Firmenwert theoretisch nicht.', 1, 'Marktwert und Buchwert steigen um den Emissionserlös.'],
      ['Eine Abschreibung ist erfolgs- und zahlungswirksam.', 0, 'Nur erfolgswirksam.'],
      ['Eine Zinszahlung an den Kreditgeber ist erfolgs- und zahlungswirksam.', 1, 'Aufwand und Auszahlung.'],
      ['Das Begleichen einer Rechnung aus einem Zielverkauf ist erfolgswirksam.', 0, 'Der Ertrag entstand beim Verkauf; jetzt nur Zahlung.'],
      ['Der Kauf einer Maschine auf Ziel ist ein zahlungswirksamer Aufwand.', 0, 'Weder Aufwand (Aktivierung) noch Zahlung.'],
      ['Die Summe der drei Cashflows ergibt die Veränderung der liquiden Mittel.', 1, 'Betrieb + Investition + Finanzierung.']],
  };
  D.TF31021 = T;

  /* ---------- Ankreuz-Probeklausuren im Format der Klausur ---------- */
  const block = (lid, n, pts, fu) => ({ t: (LBY[lid] || {}).t || lid, pts, fu, q: 'Welche Aussagen sind richtig?', tf: shuffle(T[lid]).slice(0, n).map(x => [x[0], !!x[1], x[2], lid]) });
  const INV = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'n1', 'n2', 'n3', 'n4'], FIN = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'];
  D.EXAMS.push(
    { id: 'mcf', t: 'Ankreuzteil Finanzierung', min: 20, pts: 20, src: '4 Blöcke × 5 Aussagen, Bewertung wie in der Klausur: 5 richtig 100 %, 4 → 60 %, 3 → 30 %, 2 → 10 %', gen: () => shuffle(FIN).slice(0, 4).map(l => block(l, 5, 5, true)) },
    { id: 'mci', t: 'Ankreuzteil Investition', min: 15, pts: 10, src: '10 Fragen à 4 Aussagen, anteilige Punkte wie bei Hering', gen: () => shuffle(INV).slice(0, 10).map(l => block(l, 4, 1, false)) },
    { id: 'mcx', t: 'Ankreuz-Blitz aus deinen Lektionen', min: 8, pts: 15, src: '3 Blöcke aus gelernten Lektionen', gen: P => { const done = Object.keys(P.done || {}).filter(id => T[id]); const pool = done.length >= 3 ? done : INV.concat(FIN); return shuffle(pool).slice(0, 3).map(l => block(l, 5, 5, FIN.includes(l))); } });

  /* ---------- Rechentrainer für die übrigen Aufgabentypen der Altklausuren ---------- */
  const P3 = () => { const a = R(10, 45) / 100, b = R(15, Math.round((1 - a) * 100) - 10) / 100; return [a, b, r2(1 - a - b)]; };
  D.DRILLS.push(
    { id: 'erg', t: 'Ergebnisverteilung: µ, σ, erwarteter Kapitalwert', em: '📊', sub: 'Eine Periode, drei Zustände', fx: 'µ = Σ p_{s} · e_{s}; σ = √(Σ p_{s} · (e_{s} − µ)^{2}); E[K] = −A_{0} + \\frac{µ}{1 + i}', gen() {
      const ps = P3(), es = [R(40, 200), R(150, 400), R(250, 700)], A0 = R(10, 40) * 10, i = pick([0.05, 0.08, 0.1, 0.2]);
      const mu = ps.reduce((a, x, k) => a + x * es[k], 0), sd = Math.sqrt(ps.reduce((a, x, k) => a + x * (es[k] - mu) ** 2, 0)), K = -A0 + mu / (1 + i), ask = R(0, 2);
      return { q: `Auszahlung in t = 0: ${A0} GE. Einzahlung in t = 1: Zustand I (p = ${f(ps[0], 2)}) ${es[0]}, II (p = ${f(ps[1], 2)}) ${es[1]}, III (p = ${f(ps[2], 2)}) ${es[2]}. Kalkulationszins ${p(i, 0)}.\n${['Erwartungswert µ der Einzahlung?', 'Standardabweichung σ der Einzahlung?', 'Erwarteter Kapitalwert?'][ask]} (vier Nachkommastellen)`,
        a: r4([mu, sd, K][ask]), dec: 4, tol: 0.01,
        steps: [`µ = ${ps.map((x, k) => f(x, 2) + ' · ' + es[k]).join(' + ')} = ${f(mu, 4)}`, `σ^{2} = ${ps.map((x, k) => f(x, 2) + ' · (' + es[k] + ' − ' + f(mu, 4) + ')^{2}').join(' + ')} = ${f(sd * sd, 4)}; σ = ${f(sd, 4)}`, `E[K] = −${A0} + \\frac{${f(mu, 4)}}{${f(1 + i, 2)}} = ${f(K, 4)}`] };
    } },
    { id: 'bq', t: 'Bernoulli: quadratische Nutzenfunktion', em: '🎯', sub: 'U(e) = −e² + b·e − c', fx: 'E[U] = Σ p_{s} · U(e_{s}); wähle das höchste E[U]; Maximum der Funktion bei e = \\frac{b}{2}', gen() {
      const h = R(15, 45), b = 2 * h, p1 = R(2, 8) / 10, lo = Math.round(h * 0.4), c = R(1, Math.max(1, Math.floor(lo * (b - lo) / 20))) * 10, U = e => -e * e + b * e - c;
      const B = [R(lo, h), R(lo, h)], C = [R(lo, h), R(lo, h)], uB = p1 * U(B[0]) + (1 - p1) * U(B[1]), uC = p1 * U(C[0]) + (1 - p1) * U(C[1]), ask = R(0, 1);
      return { q: `Risikonutzenfunktion U(e) = −e² + ${b} · e − ${c}. Zustände s1 (p = ${f(p1, 1)}) und s2 (p = ${f(1 - p1, 1)}).\nB: ${B[0]} / ${B[1]}; C: ${C[0]} / ${C[1]}.\nErwarteter Nutzen von ${ask ? 'C' : 'B'}?`,
        a: r2(ask ? uC : uB), tol: 0.05,
        steps: [`U(${B[0]}) = ${U(B[0])}, U(${B[1]}) = ${U(B[1])}; E[U(B)] = ${f(p1, 1)} · ${U(B[0])} + ${f(1 - p1, 1)} · ${U(B[1])} = ${f(uB)}`, `U(${C[0]}) = ${U(C[0])}, U(${C[1]}) = ${U(C[1])}; E[U(C)] = ${f(uC)}`, `Optimal: ${uB > uC ? 'B' : uC > uB ? 'C' : 'beide gleich'}. Die Funktion ist konkav (−e²), Maximum bei e = ${h}.`] };
    } },
    { id: 'kk', t: 'Unvollkommener Kapitalmarkt: Kontokorrent', em: '🏦', sub: 'Kontostände mit Investition, Endwert, Kapitalwert', fx: 'z_{t} = C_{t} − C_{t−1} · (1 + r_{t}); C^{m}_{0} = C_{0} + g_{0}; C^{m}_{t} = C^{m}_{t−1} · (1 + r_{t}) + z_{t} + g_{t}; EW = C^{m}_{T} − C_{T}; K = \\frac{EW}{(1 + r_{1})(1 + r_{2})}', gen() {
      for (let k = 0; k < 200; k++) {
        const sS = [R(8, 17) / 100, R(8, 17) / 100], sH = [R(1, 4) / 100, R(1, 5) / 100], g = [-R(4, 9) * 100, R(2, 5) * 100, R(3, 6) * 100];
        const C = [R(-8, 15) * 100, R(-10, 10) * 100, R(-8, 12) * 100]; if (C.some(x => x === 0)) continue;
        const rt = (x, t) => x >= 0 ? sH[t] : sS[t];
        const z1 = C[1] - C[0] * (1 + rt(C[0], 0)), z2 = C[2] - C[1] * (1 + rt(C[1], 1));
        const m0 = C[0] + g[0], m1 = m0 * (1 + rt(m0, 0)) + z1 + g[1], m2 = m1 * (1 + rt(m1, 1)) + z2 + g[2];
        if (m0 === 0 || Math.abs(m1) < 1) continue;
        const ew = m2 - C[2], K = ew / ((1 + rt(m0, 0)) * (1 + rt(m1, 1))), ask = R(0, 2);
        return { q: `Projekt (${g.join('; ')}). Sollzins ${p(sS[0], 0)} / ${p(sS[1], 0)}, Habenzins ${p(sH[0], 0)} / ${p(sH[1], 0)} (Periode 1 / 2). Kontostände ohne Investition (Zinsen enthalten): C_{0} = ${C[0]}, C_{1} = ${C[1]}, C_{2} = ${C[2]}.\n${['Kontostand C_{2} mit Investition?', 'Endwert der Investition?', 'Kapitalwert der Investition?'][ask]}`,
          a: r2([m2, ew, K][ask]), tol: 0.05,
          steps: [`z_{1} = ${C[1]} − ${C[0]} · ${f(1 + rt(C[0], 0), 2)} = ${f(z1)}; z_{2} = ${C[2]} − (${C[1]}) · ${f(1 + rt(C[1], 1), 2)} = ${f(z2)}`, `C^{m}_{0} = ${C[0]} + (${g[0]}) = ${m0} → ${m0 >= 0 ? 'Haben' : 'Soll'} ${p(rt(m0, 0), 0)}`, `C^{m}_{1} = ${m0} · ${f(1 + rt(m0, 0), 2)} + (${f(z1)}) + ${g[1]} = ${f(m1)} → ${m1 >= 0 ? 'Haben' : 'Soll'} ${p(rt(m1, 1), 0)}`, `C^{m}_{2} = ${f(m1)} · ${f(1 + rt(m1, 1), 2)} + (${f(z2)}) + ${g[2]} = ${f(m2)}`, `EW = ${f(m2)} − (${C[2]}) = ${f(ew)}; K = \\frac{${f(ew)}}{${f(1 + rt(m0, 0), 2)} · ${f(1 + rt(m1, 1), 2)}} = ${f(K)}`] };
      }
    } },
    { id: 'ew', t: 'Endwert und laufzeitindividuelle Annuität', em: '🏁', sub: 'Aus dem Kapitalwert', fx: 'EW = K · (1 + i)^{T}; e* = K · ANF(i, T)', gen() {
      const K = R(50, 900) + R(0, 99) / 100, i = R(3, 10) / 100, T = R(2, 5), ask = R(0, 1), q = Math.pow(1 + i, T);
      return { q: `Ein Projekt mit ${T} Perioden hat beim Kalkulationszins ${p(i, 0)} den Kapitalwert ${f(K)} GE. ${ask ? 'Laufzeitindividueller Endwert' : 'Laufzeitindividuelle Annuität e*'}? (vier Nachkommastellen)`,
        a: r4(ask ? K * q : K * ANF(i, T)), dec: 4, tol: 0.01,
        steps: ask ? [`EW = ${f(K)} · ${f(1 + i, 2)}^{${T}} = ${f(K)} · ${f(q, 6)} = ${f(K * q, 4)}`] : [`ANF(${p(i, 0)}; ${T}) = ${f(ANF(i, T), 6)}`, `e* = ${f(K)} · ${f(ANF(i, T), 6)} = ${f(K * ANF(i, T), 4)}`] };
    } },
    { id: 'auk', t: 'Eröffnungsauktion', em: '🔨', sub: 'Preis, Umsatz, Überhang', fx: 'Kauf aggregiert bei P = billigst + alle Kauflimits ≥ P; Verkauf aggregiert = bestens + alle Verkaufslimits ≤ P; Umsatz = min(Kauf, Verkauf); Preis = größter Umsatz', gen() {
      for (let k = 0; k < 300; k++) {
        const base = R(400, 900) / 10, L = [0, 1, 2, 3, 4].map(j => r2(base + j * 0.1 * R(1, 3))).sort((a, b) => a - b);
        if (new Set(L).size < 5) continue;
        const buy = L.map(() => pick([0, R(2, 20) * 10])), sell = L.map(() => pick([0, R(2, 20) * 10])), bm = R(1, 10) * 10, sm = R(1, 10) * 10;
        const agg = L.filter((x, j) => buy[j] || sell[j]).map(P => { const b = bm + L.reduce((a, x, j) => a + (x >= P ? buy[j] : 0), 0), s = sm + L.reduce((a, x, j) => a + (x <= P ? sell[j] : 0), 0); return { P, b, s, u: Math.min(b, s) }; });
        const mx = Math.max(...agg.map(x => x.u)), best = agg.filter(x => x.u === mx); if (best.length !== 1 || mx === 0) continue;
        const w = best[0], ask = R(0, 2);
        return { q: `Eröffnungsauktion. Kauforders: billigst ${bm}${L.map((x, j) => buy[j] ? `; Limit ${f(x)} → ${buy[j]}` : '').join('')}. Verkaufsorders: bestens ${sm}${L.map((x, j) => sell[j] ? `; Limit ${f(x)} → ${sell[j]}` : '').join('')}.\n${['Auktionspreis?', 'Handelsvolumen (Stück)?', 'Überhang zum Auktionspreis (Stück, die auf der stärkeren Seite unausgeführt bleiben)?'][ask]}`,
          a: [w.P, w.u, Math.abs(w.b - w.s)][ask], tol: ask ? 0 : 0.001,
          steps: [...agg.map(x => `${f(x.P)}: Kauf ${x.b}, Verkauf ${x.s} → Umsatz ${x.u}`), `Größter Umsatz ${w.u} bei ${f(w.P)}; Überhang ${Math.abs(w.b - w.s)} auf der ${w.b > w.s ? 'Kauf' : 'Verkauf'}seite`] };
      }
    } },
    { id: 'gbs', t: 'Geld-Brief-Spanne im fortlaufenden Handel', em: '↔️', sub: 'Nach einer unlimitierten Order', fx: 'Geld = höchstes Kauflimit, Brief = niedrigstes Verkaufslimit; Spanne = Brief − Geld; eine unlimitierte Kauforder räumt die günstigsten Verkaufslimits ab', gen() {
      const b0 = R(500, 990) / 10, bid = [b0, r2(b0 - 0.1 * R(1, 3)), r2(b0 - 0.4 - 0.1 * R(0, 3))], ask = [r2(b0 + 0.05 * R(1, 6)), 0, 0]; ask[1] = r2(ask[0] + 0.05 * R(1, 4)); ask[2] = r2(ask[1] + 0.05 * R(1, 4));
      const av = ask.map(() => R(2, 15) * 10), side = R(0, 1);
      if (side) { const n = av[0] + R(1, av[1] / 10 - 1) * 10; let left = n, k = 0; while (left >= av[k]) { left -= av[k]; k++; } const sp = ask[k] - bid[0];
        return { q: `Orderbuch. Kauf: ${bid.map(x => f(x)).join(', ')}. Verkauf: ${ask.map((x, j) => f(x) + ' (' + av[j] + ' Stück)').join(', ')}.\nEine unlimitierte Kauforder über ${n} Stück wird ausgeführt. Geld-Brief-Spanne danach?`, a: r2(sp), tol: 0.001,
          steps: [`Die Order kauft ${av[0]} zu ${f(ask[0])}${k > 1 ? ' und ' + av[1] + ' zu ' + f(ask[1]) : ''}, dann ${left} zu ${f(ask[k])}.`, `Niedrigstes verbleibendes Verkaufslimit ${f(ask[k])}, höchstes Kauflimit ${f(bid[0])}`, `Spanne = ${f(ask[k])} − ${f(bid[0])} = ${f(sp)}`] }; }
      return { q: `Orderbuch. Kauf: ${bid.map(x => f(x)).join(', ')}. Verkauf: ${ask.map(x => f(x)).join(', ')}. Geld-Brief-Spanne?`, a: r2(ask[0] - bid[0]), tol: 0.001, steps: [`Brief ${f(ask[0])} − Geld ${f(bid[0])} = ${f(ask[0] - bid[0])}`] };
    } },
    { id: 'cfw', t: 'Cashflow i. e. S. und i. w. S.', em: '💧', sub: 'Mit Betriebsmittelveränderung', fx: 'CF i.e.S. = JÜ + Abschreibungen + Bildung Rückstellungen; Δ Betriebsmittel = Δ Vorräte + Δ Forderungen L+L − Δ Verbindlichkeiten L+L; CF i.w.S. = CF i.e.S. − Δ Betriebsmittel', gen() {
      const ju = R(10, 90), afa = R(5, 60), rst = R(0, 20), v = R(-10, 15), fo = R(-10, 15), vb = R(-10, 15), cf = ju + afa + rst, bm = v + fo - vb, ask = R(0, 1);
      return { q: `Mio. €: Jahresüberschuss ${ju}, Abschreibungen ${afa}, Bildung Rückstellungen ${rst}. Veränderungen: Vorräte ${v >= 0 ? '+' : ''}${v}, Forderungen L+L ${fo >= 0 ? '+' : ''}${fo}, Verbindlichkeiten L+L ${vb >= 0 ? '+' : ''}${vb}.\n${ask ? 'Cashflow aus betrieblicher Tätigkeit i. w. S.?' : 'Veränderung des Betriebsmittelbestands?'}`,
        a: ask ? cf - bm : bm, tol: 0,
        steps: [`CF i. e. S. = ${ju} + ${afa} + ${rst} = ${cf}`, `Δ Betriebsmittel = ${v} + ${fo} − (${vb}) = ${bm} (${bm >= 0 ? 'Aufbau' : 'Abbau'})`, `CF i. w. S. = ${cf} − (${bm}) = ${cf - bm}`] };
    } },
    { id: 'alt', t: 'Kapitalerhöhung: Vermögen des Altaktionärs', em: '👴', sub: 'Mit Ausübung aller Bezugsrechte', fx: 'vorher: x · P_{alt}; Zuzahlung: x · \\frac{n_{neu}}{n_{alt}} · P_{Ausgabe}; nachher: x · (1 + \\frac{n_{neu}}{n_{alt}}) · P_{nach}; Zuwachs = nachher − vorher − Zuzahlung', gen() {
      const ratio = pick([[1, 2], [1, 4], [1, 5], [1, 1], [2, 5]]), nA = R(2, 10) * 1e6, nN = nA * ratio[0] / ratio[1], Pa = R(30, 120) / 10, Pn = r2(Pa - R(2, 15) / 10), x = 100 * ratio[1];
      const mix = (nA * Pa + nN * Pn) / (nA + nN), Pact = r2(mix + R(-8, 8) / 100), pay = x * nN / nA * Pn, after = x * (1 + nN / nA) * Pact, g = after - x * Pa - pay;
      return { q: `${f(nA / 1e6, 0)} Mio. Aktien zu ${f(Pa)} €; ${f(nN / 1e6, 2)} Mio. junge Aktien zu ${f(Pn)} €. Nach der Kapitalerhöhung notiert die Aktie bei ${f(Pact)} €. Vermögenszuwachs eines Altaktionärs mit ${x} Aktien, der alle Bezugsrechte ausübt?`, a: r2(g), tol: 0.02,
        steps: [`vorher ${x} · ${f(Pa)} = ${f(x * Pa)}`, `Zuzahlung ${x} · ${ratio[0]}/${ratio[1]} · ${f(Pn)} = ${f(pay)}`, `nachher ${f(x * (1 + nN / nA), 0)} · ${f(Pact)} = ${f(after)}`, `Zuwachs ${f(after)} − ${f(x * Pa)} − ${f(pay)} = ${f(g)} (theoretischer Mischkurs wäre ${f(mix)})`] };
    } },
    { id: 'mm', t: 'Modigliani-Miller: Eigenkapitalkosten', em: '⚖️', sub: 'These 2 und erwartetes Eigenkapital', fx: 'k_{EK} = k_{EK}(0) + (k_{EK}(0) − k_{FK}) · \\frac{FK}{EK}; erwartetes EK am Periodenende = EK · (1 + k_{EK})', gen() {
      const EK = R(20, 100), FK = R(20, 200), k0 = R(6, 12) / 100, kf = R(2, 5) / 100, k = k0 + (k0 - kf) * FK / EK, ask = R(0, 1);
      return { q: `Bilanzielles EK ${EK} Mio. €, FK ${FK} Mio. € zu ${p(kf, 0)}. EK-Kosten bei Verschuldungsgrad 0: ${p(k0, 0)}. ${ask ? 'Erwartetes Eigenkapital am Ende der Periode (Mio. €)?' : 'Eigenkapitalkosten in Prozent?'}`,
        a: ask ? r2(EK * (1 + k)) : r2(k * 100), tol: 0.01,
        steps: [`k_{EK} = ${p(k0, 0)} + (${p(k0, 0)} − ${p(kf, 0)}) · \\frac{${FK}}{${EK}} = ${p(k)}`, `EK_{1} = ${EK} · ${f(1 + k, 4)} = ${f(EK * (1 + k))}`] };
    } },
    { id: 'zb', t: 'Risikoprämie einer ausfallgefährdeten Anleihe', em: '⚠️', sub: 'Erwartete Rückzahlung abzinsen', fx: 'E[Zahlung] = (1 − p) · 100 + p · Rückfluss bei Ausfall; Wert = \\frac{E[Zahlung]}{1 + r_{f}}; Risikoprämie = Wert − Preis', gen() {
      const pd = R(1, 8) / 100, rf = R(1, 5) / 100, ex = (1 - pd) * 100, val = ex / (1 + rf), price = r2(val - R(5, 40) / 10);
      return { q: `Nullkuponanleihe, 1 Jahr, Nominal 100 €. Mit ${p(pd, 0)} fällt sie komplett aus, sonst volle Rückzahlung. Risikoloser Zins ${p(rf, 0)}. Ein risikoaverser Anleger zahlt höchstens ${f(price)} €. Risikoprämie in €?`, a: r2(val - price), tol: 0.01,
        steps: [`E[Zahlung] = ${f(1 - pd, 2)} · 100 = ${f(ex)}`, `Wert = ${f(ex)} / ${f(1 + rf, 2)} = ${f(val)}`, `Prämie = ${f(val)} − ${f(price)} = ${f(val - price)}`] };
    } },
    { id: 'tage', t: 'Renditen über viele Perioden verketten', em: '📅', sub: 'Diskret nicht addieren', fx: 'diskret: r_{gesamt} = (1 + r)^{n} − 1; stetig: R_{gesamt} = n · R', gen() {
      const r = pick([-1, -0.5, 0.2, 0.3, 0.5, 1]) / 100, n = pick([20, 60, 120, 251]);
      return { q: `Eine Aktie erzielt an jedem von ${n} Handelstagen eine diskrete Rendite von ${p(r, 1)}. Diskrete Gesamtrendite in Prozent?`, a: r2((Math.pow(1 + r, n) - 1) * 100), tol: 0.02,
        steps: [`(1 ${r < 0 ? '−' : '+'} ${f(Math.abs(r), 3)})^{${n}} − 1 = ${f(Math.pow(1 + r, n), 4)} − 1 = ${p(Math.pow(1 + r, n) - 1)}`, `Aufaddieren (${p(r * n)}) wäre falsch: Diskrete Renditen verketten sich multiplikativ.`] };
    } },
    { id: 'fud', t: 'Forderungsumschlagsdauer', em: '⏱️', sub: 'Tage bis zum Zahlungseingang', fx: 'FUD = \\frac{Forderungen L+L}{Umsatzerlöse} · 365', gen() {
      const fo = R(10, 120), u = R(100, 900);
      return { q: `Forderungen L+L ${fo} Mio. €, Umsatzerlöse ${u} Mio. €. Forderungsumschlagsdauer in ganzen Tagen?`, a: Math.round(fo / u * 365), tol: 0, steps: [`${fo} / ${u} · 365 = ${f(fo / u * 365)} ≈ ${Math.round(fo / u * 365)} Tage`] };
    } });

  /* ---------- Altklausuren aus dem Projekt: selbst unter Zeit rechnen, Punkte je Aufgabe eintragen ---------- */
  D.PAST = [
    { id: 'i-ws2526', t: 'Investition WS 2025/26', min: 60, pdf: 'WS 2025-26.pdf', sol: 'Lösungshinweise WS_2025-26.pdf', tasks: [['Ankreuzen Grundlagen', 10, ''], ['Zins- und Zinseszinsrechnung', 10, 'i3'], ['Annuitätendarlehen', 12, 'i4'], ['Differenzreihe, Annuität, interner Zins', 18, 'i8']] },
    { id: 'i-ss25', t: 'Investition SS 2025', min: 60, pdf: 'SS 2025.pdf', sol: 'Lösungshinweise SS 2025.pdf', tasks: [['Ankreuzen Grundlagen', 10, ''], ['Zins- und Zinseszinsrechnung', 8, 'i3'], ['Annuitätendarlehen', 11, 'i4'], ['Periodenindividuelle Zinsen, ewige Rente, interner Zins, ANF', 21, 'i8']] },
    { id: 'i-ws2425', t: 'Investition WS 2024/25', min: 60, pdf: 'WS 2024-25.pdf', sol: 'Lösungshinweise_WS_2024-25.pdf', tasks: [['Ankreuzen Grundlagen', 15, ''], ['Zins- und Zinseszinsrechnung', 7, 'i3'], ['Annuitätendarlehen', 12, 'i4'], ['Unvollkommener Kapitalmarkt', 16, 'i9']] },
    { id: 'i-ss24', t: 'Investition SS 2024', min: 60, pdf: 'SS 2024.pdf', sol: 'Lösungshinweise SS 2024.pdf', tasks: [['Kapitalwert, interner Zins, ANF', 15, 'i8'], ['Zins- und Zinseszinsrechnung', 10, 'i3'], ['Ergebnisverteilung und Bernoulli', 16, 'n3'], ['Periodenindividuelle Zinsen', 9, 'i5']] },
    { id: 'i-ws2324', t: 'Investition WS 2023/24', min: 60, pdf: 'WS2023-24.pdf', sol: 'Lösungshinweise_WS_2023-24.pdf', tasks: [['Kapitalwert, interner Zins, Annuität, Endwert', 18, 'i8'], ['Zins- und Zinseszinsrechnung', 10, 'i3'], ['Ergebnisverteilung und Bernoulli', 13, 'n3'], ['Periodenindividuelle Zinsen', 9, 'i5']] },
    { id: 'i-ss23', t: 'Investition SS 2023', min: 60, pdf: 'SS 2023.pdf', sol: 'Lösungshinweise SS 2023.pdf', tasks: [['Kapitalwert, interner Zins, ANF, Endwert', 18, 'i8'], ['Zins- und Zinseszinsrechnung', 7, 'i3'], ['Annuitätendarlehen', 12, 'i4'], ['Periodenindividuelle Zinsen', 6, 'i5'], ['Ergebnisverteilung', 7, 'n2']] },
    { id: 'f-ws2526', t: 'Finanzierung WS 2025/26', min: 60, pdf: '31021_Klausur_202526_WS_A.pdf', sol: 'in der PDF', tasks: [['Ankreuzen (4 × 5 P.)', 20, ''], ['Innenfinanzierung und Instrumentwahl', 14, 'f2'], ['Rendite und Risiko', 16, 'f8']] },
    { id: 'f-ss25', t: 'Finanzierung SS 2025', min: 60, pdf: '31021_Klausur_2025_SS_P2_OL.pdf', sol: '31021_Klausur_2025_SS_P2_ML.pdf', tasks: [['Ankreuzen (4 × 5 P.)', 20, ''], ['Kapitalschnitt und Kapitalerhöhung', 13, 'f5'], ['Auktion und Orderbuch', 13, 'f7'], ['Cashflow aus Investitionstätigkeit', 4, 'f9']] },
    { id: 'f-mrz25', t: 'Finanzierung WS 2024/25 (März)', min: 60, pdf: '31021_Klausur_202425_WS_P2_OL.pdf', sol: '31021_Klausur_202425_WS_P2_ML.pdf', tasks: [['Ankreuzen (4 × 5 P.)', 20, ''], ['Innenfinanzierung und Kapitalflussrechnung', 12, 'f9'], ['Börsenhandel, Rendite, Kapitalerhöhung', 18, 'f7']] },
    { id: 'f-dez24', t: 'Finanzierung WS 2024/25 (Dezember)', min: 60, pdf: '31021_Klausur_202425_WS_OL.pdf', sol: '31021_Klausur_202425_WS_A_ML.pdf', tasks: [['Ankreuzen (4 × 5 P.)', 20, ''], ['Anleihen: Floater, Effektivzins, Stückzinsen', 12, 'f4'], ['EK-Kosten und Modigliani-Miller', 12, 'f6'], ['Finanzplanung: Kennzahlen', 6, 'f9']] },
    { id: 'f-ss24', t: 'Finanzierung SS 2024', min: 60, pdf: '31021_Klausur_2024_SS_A_OL.pdf', sol: '31021_Klausur_2024_SS_A_ML.pdf', tasks: [['Ankreuzen (4 × 5 P.)', 20, ''], ['Börsenhandel', 12, 'f7'], ['Finanzierungsentscheidung: Effektivzins, Leverage', 14, 'f6'], ['Risikoeinstellung', 4, 'f8']] },
  ];
})();
