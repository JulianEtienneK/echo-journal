/* Echo · 55207 Aussagenbank (richtig/falsch), Rechentrainer für Fristen, Zuschläge und Einkünfte, Probeklausuren im Gutachtenstil.
   Eigene Aussagen, eigene Fälle und eigene Zahlen; keine Originalaufgaben. Feiertage in den Fristaufgaben: nur bundeseinheitliche. */
'use strict';
(() => {
  const D = window.STB_PFAD;
  const T = {
    g1: [['Fragt der Fall, ob ein Einspruch Aussicht auf Erfolg hat, gliedert man in Zulässigkeit und Begründetheit.', 1, 'Behördlicher Einstieg: A. Zulässigkeit, B. Begründetheit.'],
      ['In der Begründetheit einer Anfechtungsklage wird im Kern die Rechtmäßigkeit des Steuerbescheids geprüft.', 1, 'Klage und Einspruch sind Einkleidungen; der Kern ist die Rechtmäßigkeit.'],
      ['Die Prüfung der Festsetzungsverjährung gehört zur formellen Rechtmäßigkeit.', 0, 'Sie ist der erste Punkt der materiellen Rechtmäßigkeit.'],
      ['Im Gutachtenstil steht das Ergebnis am Anfang und wird anschließend begründet.', 0, 'Das ist der Urteilsstil. Im Gutachten: Obersatz (Hypothese), Definition, Subsumtion, Ergebnis.'],
      ['Weil Steuerrecht Eingriffsrecht ist, braucht jeder belastende Steuerbescheid eine gesetzliche Ermächtigungsgrundlage.', 1, 'Vorbehalt des Gesetzes; daher steht die Ermächtigung am Anfang der Rechtmäßigkeitsprüfung.']],
    g2: [['Eine Steuer kann auch dann vorliegen, wenn der Gesetzgeber vor allem lenken will und Einnahmen nur Nebenzweck sind.', 1, '§ 3 Abs. 1 Hs. 2 AO: Die Einnahmeerzielung kann Nebenzweck sein.'],
      ['Eine Gebühr wird für die bloße Möglichkeit erhoben, eine öffentliche Einrichtung zu nutzen.', 0, 'Das ist der Beitrag; die Gebühr setzt die tatsächliche Inanspruchnahme voraus.'],
      ['Säumniszuschläge sind Steuern im Sinne des § 3 Abs. 1 AO.', 0, 'Sie sind steuerliche Nebenleistungen (§ 3 Abs. 4 AO).'],
      ['Bei indirekten Steuern sollen Steuerschuldner und wirtschaftlicher Träger auseinanderfallen.', 1, 'Etwa bei der Umsatzsteuer: Der Unternehmer schuldet, der Verbraucher trägt.'],
      ['Die Hundesteuer ist eine örtliche Aufwandsteuer.', 1, 'Sie besteuert den über den allgemeinen Lebensbedarf hinausgehenden Aufwand für einen Hund.']],
    g3: [['Gesetz- oder sittenwidrige Handlungen schließen die Besteuerung aus, weil der Staat nicht an Unrecht verdienen soll.', 0, '§ 40 AO: Für die Besteuerung unerheblich.'],
      ['Ist ein Kaufvertrag zivilrechtlich formunwirksam, die Kaufsache aber übergeben und der Preis gezahlt, kann er steuerlich gleichwohl beachtlich sein.', 1, '§ 41 Abs. 1 AO: soweit das wirtschaftliche Ergebnis eintritt.'],
      ['Ein Scheingeschäft ist für die Besteuerung maßgeblich, wenn die Beteiligten es schriftlich festgehalten haben.', 0, 'Scheingeschäfte sind unerheblich; maßgeblich ist das verdeckte Geschäft (§ 41 Abs. 2 AO).'],
      ['Wirtschaftliche Eigentümerin kann sein, wer den zivilrechtlichen Eigentümer für die gewöhnliche Nutzungsdauer von der Einwirkung ausschließen kann.', 1, '§ 39 Abs. 2 Nr. 1 AO.'],
      ['Die Finanzverwaltung darf Lücken im Gesetz durch Analogie zulasten des Steuerpflichtigen schließen, wenn der Gesetzeszweck das nahelegt.', 0, 'Analogieverbot zulasten des Steuerpflichtigen (Vorbehalt des Gesetzes).']],
    g4: [['BMF-Schreiben binden die Finanzgerichte.', 0, 'Verwaltungsvorschriften binden nur die Verwaltung.'],
      ['Ein Doppelbesteuerungsabkommen hat in Deutschland den Rang eines einfachen Bundesgesetzes.', 1, 'Über das Zustimmungsgesetz nach Art. 59 Abs. 2 GG.'],
      ['Eine echte Rückwirkung liegt vor, wenn ein Gesetz nachträglich in bereits abgeschlossene Sachverhalte eingreift.', 1, 'Rückbewirkung von Rechtsfolgen; grundsätzlich unzulässig.'],
      ['Ändert der Gesetzgeber im November den Einkommensteuertarif für das laufende Jahr, liegt nach der Rechtsprechung regelmäßig eine echte Rückwirkung vor.', 0, 'Unechte Rückwirkung: Die ESt entsteht erst mit Ablauf des Jahres.'],
      ['Ein Urteil des BFH bindet rechtlich nur die Beteiligten des entschiedenen Verfahrens.', 1, 'Allgemeine Anwendung erst über die Veröffentlichung im BStBl (oder gar nicht bei Nichtanwendungserlass).']],
    g5: [['Die Gewerbesteuer ist eine Gemeinschaftsteuer im Sinne des Art. 106 Abs. 3 GG.', 0, 'Gemeinschaftsteuern sind ESt, KSt und USt; die Gewerbesteuer steht den Gemeinden zu (Realsteuer).'],
      ['Die Länder haben die Befugnis zur Gesetzgebung über örtliche Verbrauch- und Aufwandsteuern, solange sie bundesgesetzlich geregelten Steuern nicht gleichartig sind.', 1, 'Art. 105 Abs. 2a GG.'],
      ['Das subjektive Nettoprinzip verlangt, dass das Existenzminimum steuerfrei bleibt.', 1, 'Umgesetzt etwa durch den Grundfreibetrag.'],
      ['Die Verwaltungshoheit über die Einkommensteuer liegt bei den Bundesfinanzbehörden.', 0, 'Landesfinanzbehörden (Art. 108 Abs. 2 GG), teilweise im Auftrag des Bundes.'],
      ['Eine Lenkungsteuer ist unzulässig, sobald sie das Verhalten der Bürger tatsächlich beeinflusst.', 0, 'Lenkung ist zulässig; unzulässig ist eine erdrosselnde oder gleichheitswidrige Ausgestaltung.']],
    a1: [['Der Einkommensteueranspruch entsteht mit der Bekanntgabe des Steuerbescheids.', 0, 'Mit Ablauf des Veranlagungszeitraums (§ 38 AO, § 36 Abs. 1 EStG); der Bescheid setzt nur fest.'],
      ['Der Haftungsanspruch ist ein Anspruch aus dem Steuerschuldverhältnis.', 1, '§ 37 Abs. 1 AO.'],
      ['Ein Erstattungsanspruch nach § 37 Abs. 2 AO setzt voraus, dass ohne rechtlichen Grund gezahlt wurde; rechtlicher Grund ist der wirksame Bescheid.', 1, 'Solange ein Bescheid wirksam ist, besteht der Rechtsgrund, auch wenn er materiell falsch ist.'],
      ['Die Zahlungsverjährung führt nicht zum Erlöschen des Anspruchs, sondern nur zu einem Leistungsverweigerungsrecht.', 0, 'Im Steuerrecht erlischt der Anspruch (§ 47, § 232 AO).'],
      ['Die Abschlusszahlung zur Einkommensteuer ist einen Monat nach Bekanntgabe des Bescheids fällig.', 1, '§ 36 Abs. 4 S. 1 EStG.']],
    a2: [['Die Haftung nach § 69 AO setzt mindestens grobe Fahrlässigkeit voraus.', 1, 'Vorsatz oder grobe Fahrlässigkeit.'],
      ['Bei der Lohnsteuer gilt für den Geschäftsführer der Grundsatz der anteiligen Tilgung.', 0, 'Bei der Lohnsteuer haftet er grundsätzlich voll; er muss die Löhne entsprechend kürzen.'],
      ['Der Erlass eines Haftungsbescheids steht im Ermessen des Finanzamts.', 1, '§ 191 Abs. 1 AO: Entschließungs- und Auswahlermessen.'],
      ['Der Haftungsschuldner darf grundsätzlich sofort auf Zahlung in Anspruch genommen werden, auch wenn die Vollstreckung beim Steuerschuldner aussichtsreich ist.', 0, '§ 219 AO: grundsätzlich erst nach erfolgloser oder aussichtsloser Vollstreckung (Ausnahmen Vorsatz, Lohnsteuer).'],
      ['Die Haftung ist akzessorisch: Ohne Steuerschuld gibt es keinen Haftungsanspruch.', 1, 'Haftung heißt Einstehen für eine fremde Schuld.']],
    a3: [['Ein per Post im Inland versandter Bescheid gilt am vierten Tag nach Aufgabe zur Post als bekanntgegeben, auch wenn er tatsächlich schon am zweiten Tag zugeht.', 1, '§ 122 Abs. 2 Nr. 1 AO; die Fiktion gilt auch bei früherem Zugang.'],
      ['Bestreitet der Steuerpflichtige den Zugang, muss er beweisen, dass der Bescheid nicht angekommen ist.', 0, 'Im Zweifel hat die Behörde Zugang und Zeitpunkt nachzuweisen.'],
      ['Ein nichtiger Verwaltungsakt ist unwirksam.', 1, '§ 124 Abs. 3 AO.'],
      ['Ein rechtswidriger, aber nicht nichtiger Bescheid ist bis zu seiner Aufhebung wirksam.', 1, 'Er ist anfechtbar, aber wirksam.'],
      ['Nach § 129 AO darf das Finanzamt nur innerhalb der Einspruchsfrist offenbare Unrichtigkeiten berichtigen.', 0, 'Jederzeit innerhalb der Festsetzungsfrist (mit Ablaufhemmung nach § 171 Abs. 2 AO).']],
    a4: [['Der Verspätungszuschlag beträgt für jeden angefangenen Monat 0,25 % der um Vorauszahlungen und Anrechnungsbeträge verminderten festgesetzten Steuer, mindestens 10 €.', 1, '§ 152 Abs. 5 AO.'],
      ['Der Säumniszuschlag wird vom Finanzamt nach Ermessen festgesetzt.', 0, 'Er entsteht kraft Gesetzes (§ 240 AO).'],
      ['Bei Zahlung per Scheck gilt beim Säumniszuschlag die dreitägige Schonfrist.', 0, 'Nur bei Überweisung, nicht bei Scheck und Bargeld.'],
      ['Das Finanzamt ermittelt den Sachverhalt von Amts wegen.', 1, 'Untersuchungsgrundsatz (§ 88 AO), ergänzt durch Mitwirkungspflichten (§ 90 AO).'],
      ['Nach einer Außenprüfung können Bescheide nach § 173 Abs. 1 AO nur noch bei Steuerhinterziehung oder leichtfertiger Steuerverkürzung geändert werden.', 1, 'Erhöhte Bestandskraft nach § 173 Abs. 2 AO.']],
    a5: [['Die reguläre Festsetzungsfrist für die Einkommensteuer beträgt vier Jahre.', 1, '§ 169 Abs. 2 S. 1 Nr. 2 AO.'],
      ['Bei Steuerhinterziehung beträgt die Festsetzungsfrist fünf Jahre.', 0, 'Zehn Jahre; fünf bei leichtfertiger Verkürzung.'],
      ['Gibt ein Steuerpflichtiger seine Pflichterklärung nie ab, beginnt die Festsetzungsfrist mit Ablauf des dritten Kalenderjahres nach Entstehung der Steuer.', 1, 'Höchstdauer der Anlaufhemmung nach § 170 Abs. 2 Nr. 1 AO.'],
      ['Bei einer Antragsveranlagung beginnt die Festsetzungsfrist erst mit Ablauf des Jahres, in dem die Erklärung eingereicht wird.', 0, 'Keine Erklärungspflicht, also keine Anlaufhemmung.'],
      ['Ein Folgebescheid kann noch zwei Jahre nach Bekanntgabe des Grundlagenbescheids angepasst werden, auch wenn seine reguläre Frist abgelaufen ist.', 1, 'Ablaufhemmung nach § 171 Abs. 10 AO.']],
    a6: [['Ein Bescheid unter Vorbehalt der Nachprüfung kann in vollem Umfang geändert werden, solange der Vorbehalt wirksam ist.', 1, '§ 164 Abs. 2 AO.'],
      ['Der Vorbehalt der Nachprüfung bleibt auch nach Ablauf der Festsetzungsfrist bestehen.', 0, 'Er entfällt mit Ablauf der regulären Festsetzungsfrist (§ 164 Abs. 4 AO).'],
      ['Der Gewerbesteuermessbescheid ist Grundlagenbescheid für den Gewerbesteuerbescheid.', 1, '§ 184 AO, § 171 Abs. 10, § 182 Abs. 1 AO.'],
      ['Einwendungen gegen die festgestellten Einkünfte aus einer KG kann ein Gesellschafter mit dem Einspruch gegen seinen ESt-Bescheid geltend machen.', 0, '§ 351 Abs. 2 AO: nur durch Anfechtung des Feststellungsbescheids.'],
      ['Liegt ein Grundlagenbescheid noch nicht vor, darf das Finanzamt die betreffenden Besteuerungsgrundlagen im Folgebescheid schätzen.', 1, '§ 162 Abs. 5, § 155 Abs. 2 AO.']],
    a7: [['Ein bestandskräftiger Steuerbescheid darf nur geändert werden, soweit ein gesetzlicher Änderungstatbestand dies erlaubt.', 1, '§ 172 Abs. 1 AO.'],
      ['Eine neue rechtliche Würdigung eines bekannten Sachverhalts ist eine neue Tatsache im Sinne des § 173 AO.', 0, 'Rechtliche Bewertungen sind keine Tatsachen.'],
      ['Eine Änderung nach § 173 Abs. 1 Nr. 2 AO zugunsten des Steuerpflichtigen setzt voraus, dass ihn kein grobes Verschulden am nachträglichen Bekanntwerden trifft.', 1, 'Ausnahme: Zusammenhang mit Tatsachen nach Nr. 1.'],
      ['Ein Ereignis, das nach Erlass des Bescheids eintritt und steuerlich in die Vergangenheit wirkt, führt zu einer Änderung nach § 173 AO.', 0, 'Das ist § 175 Abs. 1 S. 1 Nr. 2 AO.'],
      ['Hat das Finanzamt seine Ermittlungspflicht verletzt und der Steuerpflichtige seine Mitwirkungspflichten erfüllt, ist eine Änderung nach § 173 Abs. 1 Nr. 1 AO nach Treu und Glauben ausgeschlossen.', 1, 'Ständige Rechtsprechung.']],
    a8: [['Die Einspruchsfrist beträgt einen Monat nach Bekanntgabe des Verwaltungsakts.', 1, '§ 355 Abs. 1 AO.'],
      ['Ein als „Widerspruch“ bezeichneter Rechtsbehelf gegen einen Steuerbescheid ist unzulässig.', 0, 'Die unrichtige Bezeichnung schadet nicht (§ 357 Abs. 1 AO).'],
      ['Ein Änderungsbescheid kann nur angegriffen werden, soweit die Änderung reicht.', 1, '§ 351 Abs. 1 AO.'],
      ['Die Klage vor dem Finanzgericht setzt grundsätzlich ein erfolgloses Einspruchsverfahren voraus.', 1, '§ 44 FGO; Ausnahmen Sprung- und Untätigkeitsklage.'],
      ['Mit Einlegung des Einspruchs muss die festgesetzte Steuer bis zur Entscheidung nicht gezahlt werden.', 0, 'Der Einspruch hemmt die Vollziehung nicht; es braucht Aussetzung der Vollziehung.']],
    e1: [['Wer im Inland eine jederzeit nutzbare, eingerichtete Wohnung beibehält und regelmäßig nutzt, hat dort einen Wohnsitz, auch wenn er überwiegend im Ausland lebt.', 1, '§ 8 AO; mehrere Wohnsitze sind möglich.'],
      ['Die unbeschränkte Steuerpflicht setzt die deutsche Staatsangehörigkeit voraus.', 0, 'Maßgeblich sind Wohnsitz oder gewöhnlicher Aufenthalt.'],
      ['Ein zusammenhängender Aufenthalt von mehr als sechs Monaten im Inland begründet stets einen gewöhnlichen Aufenthalt.', 1, '§ 9 S. 2 AO.'],
      ['Unbeschränkt Steuerpflichtige versteuern grundsätzlich ihr Welteinkommen.', 1, 'Schranken ergeben sich aus DBA.'],
      ['Beschränkt Steuerpflichtige werden mit allen Einkünften erfasst, aber zu einem ermäßigten Tarif.', 0, 'Nur mit inländischen Einkünften im Sinne des § 49 EStG.']],
    e2: [['Ein Lottogewinn ist nicht einkommensteuerbar, weil er unter keine Einkunftsart fällt.', 1, 'Nur die sieben Einkunftsarten des § 2 Abs. 1 EStG sind steuerbar.'],
      ['Der Gesamtbetrag der Einkünfte ergibt sich aus der Summe der Einkünfte nach Abzug der Sonderausgaben.', 0, 'Sonderausgaben werden vom GdE abgezogen; vorher kommen Altersentlastungs-, Alleinerziehenden- und LuF-Freibetrag.'],
      ['Bei den Gewinneinkünften werden auch Wertsteigerungen des Betriebsvermögens erfasst.', 1, 'Reinvermögenszugangstheorie.'],
      ['Liebhaberei liegt vor, wenn eine Betätigung in einem Jahr einen Verlust erzielt.', 0, 'Maßgeblich ist die fehlende Absicht eines Totalgewinns über die gesamte Betätigungsdauer.'],
      ['Einkünfte aus Vermietung und Verpachtung sind Überschusseinkünfte.', 1, '§ 2 Abs. 2 S. 1 Nr. 2 EStG.']],
    e3: [['Werbungskosten sind Aufwendungen zur Erwerbung, Sicherung und Erhaltung der Einnahmen.', 1, '§ 9 Abs. 1 S. 1 EStG.'],
      ['Gemischt veranlasste Reisekosten sind nach der Rechtsprechung insgesamt nicht abziehbar.', 0, 'Seit 2009 wird nach objektiven Kriterien aufgeteilt.'],
      ['Der Arbeitnehmer-Pauschbetrag wird nur angesetzt, wenn keine höheren Werbungskosten nachgewiesen werden.', 1, '§ 9a S. 1 EStG.'],
      ['Einnahmen im Sinne des § 8 EStG können nur in Geld bestehen.', 0, 'Auch Güter in Geldeswert (Sachbezüge).'],
      ['Eine am 3. Januar gezahlte Dezembermiete kann dem alten Jahr zuzurechnen sein.', 1, 'Zehn-Tage-Regel für regelmäßig wiederkehrende Einnahmen (§ 11 Abs. 1 S. 2 EStG).']],
    e4: [['Ein Vorteil ist nur dann Arbeitslohn, wenn er für eine konkrete einzelne Arbeitsleistung gewährt wird.', 0, 'Es genügt die Veranlassung durch das Dienstverhältnis.'],
      ['Eine rein fachliche Fortbildung im ganz überwiegend eigenbetrieblichen Interesse des Arbeitgebers ist kein Arbeitslohn.', 1, 'Kein Entlohnungscharakter.'],
      ['Bei der 1 %-Regel sind vom Arbeitgeber getragene Benzinkosten für Privatfahrten zusätzlich als Arbeitslohn zu erfassen.', 0, 'Sie sind mit dem pauschalen Ansatz abgegolten.'],
      ['Für Fahrten zwischen Wohnung und erster Tätigkeitsstätte werden bei der Listenpreismethode monatlich 0,03 % des Listenpreises je Entfernungskilometer angesetzt.', 1, '§ 8 Abs. 2 S. 3 EStG.'],
      ['Der verbilligte Erwerb von Anteilen am Arbeitgeber kann zu Einnahmen aus nichtselbständiger Arbeit führen.', 1, 'Wenn er durch das Dienstverhältnis veranlasst ist; bewertet mit der Differenz zum gemeinen Wert.']],
    e5: [['Die Vermietung einzelner Wohnungen ist auch bei häufig wechselnden Mietern ohne Zusatzleistungen private Vermögensverwaltung.', 1, 'Gewerblich erst bei hotelähnlichen Leistungen und Organisation.'],
      ['Wer innerhalb von fünf Jahren mehr als drei Grundstücke anschafft und veräußert, handelt in der Regel gewerblich.', 1, 'Drei-Objekt-Grenze.'],
      ['Nachhaltigkeit setzt voraus, dass die Tätigkeit tatsächlich mehrfach ausgeübt wurde.', 0, 'Es genügt die Wiederholungsabsicht.'],
      ['Ein Steuerberater erzielt gewerbliche Einkünfte, weil er am allgemeinen wirtschaftlichen Verkehr teilnimmt.', 0, 'Katalogberuf, Einkünfte aus selbständiger Arbeit (§ 18 EStG).'],
      ['Zum Gewerbebetrieb gehört die Absicht, Gewinn zu erzielen.', 1, '§ 15 Abs. 2 S. 1 EStG.']],
    e6: [['Ein buchführungspflichtiger Gewerbetreibender darf seinen Gewinn durch Einnahmenüberschussrechnung ermitteln.', 0, '§ 4 Abs. 3 EStG nur ohne Buchführungspflicht und ohne freiwillige Bücher.'],
      ['In der EÜR werden die Anschaffungskosten für ein Grundstück erst bei dessen Veräußerung oder Entnahme abgezogen.', 1, 'Nicht abnutzbares Anlagevermögen (§ 4 Abs. 3 S. 4 EStG).'],
      ['Die Aufnahme eines betrieblichen Darlehens ist in der EÜR eine Betriebseinnahme.', 0, 'Darlehen sind erfolgsneutral.'],
      ['Beim Betriebsvermögensvergleich werden Entnahmen hinzugerechnet und Einlagen abgezogen.', 1, '§ 4 Abs. 1 S. 1 EStG.'],
      ['Freiberufler dürfen unabhängig von Umsatz und Gewinn die EÜR wählen.', 1, 'Sie sind weder nach HGB noch nach § 141 AO buchführungspflichtig.']],
    e7: [['Kapitalerträge im Privatvermögen unterliegen grundsätzlich einem gesonderten Steuersatz von 25 %.', 1, '§ 32d Abs. 1 EStG.'],
      ['Bei Kapitaleinkünften können neben dem Sparer-Pauschbetrag tatsächliche Werbungskosten abgezogen werden.', 0, '§ 20 Abs. 9 EStG schließt den Abzug tatsächlicher Werbungskosten aus.'],
      ['Gehört ein vermietetes Gebäude zum Betriebsvermögen, erzielt der Eigentümer keine Einkünfte aus Vermietung und Verpachtung.', 1, 'Subsidiarität (§ 21 Abs. 3 EStG).'],
      ['Beträgt die Miete für eine Wohnung 70 % der ortsüblichen Miete, gilt die Vermietung als vollentgeltlich.', 1, 'Ab 66 % (§ 21 Abs. 2 S. 2 EStG).'],
      ['Die AfA auf ein vermietetes Gebäude umfasst auch den Grund und Boden.', 0, 'Grund und Boden ist nicht abnutzbar.']],
    e8: [['Der Verkauf eines Gemäldes aus dem Privatvermögen nach drei Jahren Haltedauer ist nicht steuerbar.', 1, 'Frist für andere Wirtschaftsgüter: ein Jahr (§ 23 Abs. 1 S. 1 Nr. 2 EStG).'],
      ['Gewinne aus § 17 EStG gehören zu den Einkünften aus Kapitalvermögen.', 0, 'Zu den Einkünften aus Gewerbebetrieb.'],
      ['Im Teileinkünfteverfahren sind 60 % des Veräußerungsgewinns nach § 17 EStG steuerpflichtig.', 1, '§ 3 Nr. 40 Buchst. c EStG.'],
      ['Eine selbst genutzte Eigentumswohnung kann innerhalb von zehn Jahren steuerfrei verkauft werden, wenn sie im Verkaufsjahr und den beiden Vorjahren zu eigenen Wohnzwecken genutzt wurde.', 1, '§ 23 Abs. 1 S. 1 Nr. 1 S. 3 EStG.'],
      ['§ 22 Nr. 3 EStG geht allen anderen Einkunftsarten vor.', 0, 'Er ist subsidiär und greift nur, wenn keine andere Einkunftsart einschlägig ist.']],
    e9: [['Krankheitskosten können außergewöhnliche Belastungen sein.', 1, 'Typischer Fall der Zwangsläufigkeit aus tatsächlichen Gründen.'],
      ['Außergewöhnliche Belastungen sind in voller Höhe abziehbar.', 0, 'Nur soweit sie die zumutbare Belastung übersteigen.'],
      ['Sonderausgaben werden vom Gesamtbetrag der Einkünfte abgezogen.', 1, 'Von GdE zum Einkommen.'],
      ['Weil der Unfall in der Freizeit geschah, sind die Kosten eines behinderungsbedingten Umbaus nicht zwangsläufig.', 0, 'Die Ursache der Behinderung ist für die Zwangsläufigkeit der Umbaukosten regelmäßig unerheblich.'],
      ['Die zumutbare Belastung hängt unter anderem von der Zahl der Kinder ab.', 1, '§ 33 Abs. 3 EStG.']],
    u1: [['Eine OHG ist Schuldnerin der Einkommensteuer auf ihren Gewinn.', 0, 'Transparenz: Die Gesellschafter versteuern ihre Anteile. Die OHG schuldet aber die Gewerbesteuer.'],
      ['Eine GmbH ist eigenes Steuersubjekt der Körperschaftsteuer.', 1, 'Trennungsprinzip.'],
      ['Ein zu 70 % betrieblich genutzter Pkw eines Einzelunternehmers ist notwendiges Betriebsvermögen.', 1, 'Betriebliche Nutzung über 50 %.'],
      ['Ein Einzelunternehmer kann steuerlich nur einen einzigen Gewerbebetrieb haben.', 0, 'Mehrere Betriebe sind möglich, wenn kein wirtschaftlicher, finanzieller und organisatorischer Zusammenhang besteht.'],
      ['Personenhandelsgesellschaften können seit 2022 zur Körperschaftsteuer optieren.', 1, '§ 1a KStG.']],
    u2: [['Mitunternehmer ist nur, wer zugleich Mitunternehmerrisiko trägt und Mitunternehmerinitiative entfalten kann.', 1, 'Beide Merkmale müssen vorliegen (sie können unterschiedlich stark ausgeprägt sein).'],
      ['Ein Kommanditist mit den gesetzlichen Rechten nach dem HGB hat keine ausreichende Mitunternehmerinitiative.', 0, 'Die gesetzlichen Kommanditistenrechte genügen.'],
      ['Bei schenkweise beteiligten Kindern erkennt die Rechtsprechung in der Regel eine Gewinnbeteiligung bis zu 15 % des tatsächlichen Werts der Beteiligung an.', 1, 'Darüber hinausgehende Beträge werden den Eltern zugerechnet.'],
      ['Die Personengesellschaft ist Subjekt der Gewinnermittlung.', 1, 'Teilrechtsfähigkeit; der Gewinn wird den Gesellschaftern zugerechnet.'],
      ['Minderjährige Kinder können ohne Ergänzungspfleger wirksam als Kommanditisten aufgenommen werden, wenn die Eltern zustimmen.', 0, 'Wegen des Insichgeschäfts bedarf es eines Ergänzungspflegers.']],
    u3: [['Das Gehalt eines Kommanditisten als Geschäftsführer der KG führt bei ihm zu Einkünften aus nichtselbständiger Arbeit.', 0, 'Sondervergütung, gewerbliche Einkünfte (§ 15 Abs. 1 S. 1 Nr. 2 Hs. 2 EStG).'],
      ['Ein Grundstück, das ein Kommanditist der KG vermietet, gehört zu seinem Sonderbetriebsvermögen I.', 1, 'Es dient unmittelbar dem Betrieb der Gesellschaft.'],
      ['Ein Darlehen, mit dem ein Gesellschafter seine Einlage finanziert, gehört zum Sonderbetriebsvermögen II.', 1, 'Es dient seiner Beteiligung.'],
      ['Die Einkünfte einer Mitunternehmerschaft werden für jeden Gesellschafter in dessen eigenem ESt-Verfahren selbständig ermittelt.', 0, 'Gesonderte und einheitliche Feststellung (§ 180 AO).'],
      ['Sondervergütungen mindern den Gewinn laut Gesamthandsbilanz, werden aber im Sonderbereich wieder hinzugerechnet.', 1, 'Zweistufige Gewinnermittlung.']],
    u4: [['Eine KG, die nur ein Mietshaus vermietet und deren Komplementär eine natürliche Person ist, erzielt Einkünfte aus Vermietung und Verpachtung.', 1, 'Vermögensverwaltend, keine Prägung.'],
      ['Eine GmbH & Co. KG, deren einzige Komplementärin die GmbH ist und die von ihr geführt wird, ist gewerblich geprägt.', 1, '§ 15 Abs. 3 Nr. 2 EStG.'],
      ['Jede noch so geringe gewerbliche Nebentätigkeit färbt auf die gesamte Tätigkeit einer vermögensverwaltenden Personengesellschaft ab.', 0, 'Bagatellgrenze für eigene Tätigkeit: bis 3 % der Umsätze und 24.500 €.'],
      ['Die Einkünfte einer vermögensverwaltenden Personengesellschaft werden den Gesellschaftern anteilig zugerechnet.', 1, '§ 39 Abs. 2 Nr. 2 AO.'],
      ['Für vermögensverwaltende Personengesellschaften entfällt die gesonderte und einheitliche Feststellung.', 0, 'Sie findet ebenfalls statt, weil mehrere Personen beteiligt sind.']],
    u5: [['Der Freibetrag nach § 16 Abs. 4 EStG kann mehrfach im Leben in Anspruch genommen werden.', 0, 'Nur einmal im Leben, auf Antrag.'],
      ['Bei einer Betriebsaufgabe werden ins Privatvermögen überführte Wirtschaftsgüter mit dem gemeinen Wert angesetzt.', 1, '§ 16 Abs. 3 S. 7 EStG.'],
      ['Die Veräußerung eines Mitunternehmeranteils fällt unter § 16 EStG.', 1, '§ 16 Abs. 1 S. 1 Nr. 2 EStG.'],
      ['Der Freibetrag nach § 16 Abs. 4 EStG ermäßigt sich um den Betrag, um den der Veräußerungsgewinn 136.000 € übersteigt.', 1, 'Abschmelzung.'],
      ['Veräußerungsgewinn ist der Kaufpreis abzüglich des Verkehrswerts der Wirtschaftsgüter.', 0, 'Kaufpreis abzüglich Veräußerungskosten und Buchwert (Wert des Betriebsvermögens).']],
    u6: [['Eine GmbH kann Einkünfte aus Vermietung und Verpachtung erzielen.', 0, 'Bei buchführungspflichtigen Kapitalgesellschaften sind alle Einkünfte gewerblich (§ 8 Abs. 2 KStG).'],
      ['Bei Kapitalgesellschaften gibt es keine Liebhaberei, weil sie keine Privatsphäre haben.', 1, 'Verluste sind grundsätzlich zu berücksichtigen (anders bei vGA-Konstellationen).'],
      ['Die Gewerbesteuer ist bei der Ermittlung des körperschaftsteuerlichen Einkommens als Betriebsausgabe abziehbar.', 0, '§ 4 Abs. 5b EStG: nicht abziehbar.'],
      ['Aufsichtsratsvergütungen sind zur Hälfte nicht abziehbar.', 1, '§ 10 Nr. 4 KStG.'],
      ['Der Körperschaftsteuersatz beträgt derzeit 15 %.', 1, '§ 23 Abs. 1 KStG; ab 2028 schrittweise Senkung.']],
    u7: [['Eine vGA mindert das Einkommen der Kapitalgesellschaft nicht.', 1, 'Sie wird außerbilanziell hinzugerechnet (§ 8 Abs. 3 S. 2 KStG).'],
      ['Beim beherrschenden Gesellschafter kann eine vGA auch dann vorliegen, wenn das Entgelt angemessen ist, aber keine im Voraus getroffene klare Vereinbarung besteht.', 1, 'Formelle Fremdvergleichskriterien.'],
      ['Ein zinsloses Darlehen des Gesellschafters an die GmbH ist eine verdeckte Einlage.', 0, 'Nutzungsvorteile sind nicht einlagefähig.'],
      ['Dividenden, die eine GmbH von einer anderen Kapitalgesellschaft bei 30 % Beteiligung erhält, sind im Ergebnis zu 95 % steuerfrei.', 1, '§ 8b Abs. 1 und 5 KStG.'],
      ['Eine natürliche Person mit Anteilen im Betriebsvermögen versteuert Dividenden mit der Abgeltungsteuer.', 0, 'Teileinkünfteverfahren: 60 % steuerpflichtig (§ 3 Nr. 40 EStG).']],
    u8: [['Für die körperschaftsteuerliche Organschaft genügt ein Gewinnabführungsvertrag mit einer Laufzeit von drei Jahren.', 0, 'Mindestens fünf Jahre.'],
      ['Das Einkommen der Organgesellschaft wird dem Organträger zugerechnet.', 1, '§ 14 Abs. 1 KStG.'],
      ['Kapitalgesellschaften erhalten bei der Gewerbesteuer einen Freibetrag von 24.500 €.', 0, 'Nur natürliche Personen und Personengesellschaften.'],
      ['Die Steuermesszahl beträgt 3,5 %.', 1, '§ 11 Abs. 2 GewStG.'],
      ['Die Ermäßigung nach § 35 EStG beträgt das 4-Fache des Gewerbesteuermessbetrags, höchstens die tatsächlich zu zahlende Gewerbesteuer.', 1, '§ 35 Abs. 1 EStG.']],
  };
  D.TF = T;

  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const LBY = {}; for (const u of Object.values(D.LESSONS)) for (const l of u) LBY[l.id] = l;
  const block = lid => ({ t: LBY[lid].t, pts: 100, q: 'Welche Aussagen sind richtig?', tf: shuffle(T[lid]).slice(0, 5).map(x => [x[0], !!x[1], x[2], lid]) });

  /* ---------- Rechentrainer ---------- */
  const R = (a, b, st = 1) => a + st * Math.floor(Math.random() * (Math.floor((b - a) / st) + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const f = (x, d = 2) => Number(x).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const e0 = x => f(x, 0) + ' €';
  const r2 = x => Math.round(x * 100) / 100;
  // dates (local noon to avoid DST jumps)
  const mk = (y, m, d) => new Date(y, m - 1, d, 12);
  const add = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
  const ds = dt => String(dt.getDate()).padStart(2, '0') + '.' + String(dt.getMonth() + 1).padStart(2, '0') + '.' + dt.getFullYear();
  const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const easter = y => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, g = Math.floor((8 * b + 13) / 25), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 19 * l) / 433), mo = Math.floor((h + l - 7 * m + 90) / 25), da = (h + l - 7 * m + 33 * mo + 19) % 32; return mk(y, mo, da); };
  const holidays = y => { const e = easter(y); return [mk(y, 1, 1), add(e, -2), add(e, 1), mk(y, 5, 1), add(e, 39), add(e, 50), mk(y, 10, 3), mk(y, 12, 25), mk(y, 12, 26)].map(ds); };
  const isHol = dt => holidays(dt.getFullYear()).includes(ds(dt));
  const workday = dt => { let x = new Date(dt), moved = []; while (x.getDay() === 0 || x.getDay() === 6 || isHol(x)) { moved.push(`${ds(x)} ist ${isHol(x) ? 'Feiertag' : WD[x.getDay()]}`); x = add(x, 1); } return [x, moved]; };
  const plusMonth = (dt, n = 1) => { const y = dt.getFullYear(), m = dt.getMonth() + n, last = new Date(y, m + 1, 0, 12).getDate(); return new Date(y, m, Math.min(dt.getDate(), last), 12); };
  const zumutbar = (gde, kind) => { const rates = { ledig: [5, 6, 7], ehe: [4, 5, 6], k12: [2, 3, 4], k3: [1, 1, 2] }[kind], cut = [15340, 51130]; const parts = [Math.min(gde, cut[0]), Math.max(0, Math.min(gde, cut[1]) - cut[0]), Math.max(0, gde - cut[1])]; return { parts, rates, z: parts.reduce((a, p, i) => a + p * rates[i] / 100, 0) }; };

  D.DRILLS = [
    { id: 'vz', t: 'Festsetzungsverjährung', em: '⏳', sub: 'In welchem Jahr endet die Frist?', fx: 'Beginn: Ablauf des Entstehungsjahres, bei Erklärungspflicht spätestens Ablauf des 3. Folgejahres (§ 170 AO); Ende = Beginn + Frist (4 Jahre, leichtfertig 5, Hinterziehung 10, § 169 AO)', gen() {
      const Y = R(2016, 2022), kind = pick(['pflicht', 'pflicht', 'nie', 'antrag', 'leicht', 'hinter']);
      const ab = Y + R(1, 5), dur = kind === 'leicht' ? 5 : kind === 'hinter' ? 10 : 4;
      let start, why;
      if (kind === 'antrag') { start = Y; why = `Antragsveranlagung (§ 46 Abs. 2 Nr. 8 EStG): keine Erklärungspflicht, keine Anlaufhemmung; Beginn mit Ablauf ${Y}.`; }
      else if (kind === 'nie') { start = Y + 3; why = `Pflichterklärung nie abgegeben: Anlaufhemmung höchstens drei Jahre, Beginn mit Ablauf ${Y + 3} (§ 170 Abs. 2 Nr. 1 AO).`; }
      else { start = Math.min(ab, Y + 3); why = ab <= Y + 3 ? `Pflichterklärung abgegeben ${ab}: Beginn mit Ablauf ${ab} (§ 170 Abs. 2 Nr. 1 AO).` : `Erklärung erst ${ab}, aber Anlaufhemmung höchstens drei Jahre: Beginn mit Ablauf ${Y + 3}.`; }
      const txt = { pflicht: `Für die ESt ${Y} bestand eine Erklärungspflicht; die Erklärung ging ${ab} beim Finanzamt ein.`, nie: `Für die ESt ${Y} bestand eine Erklärungspflicht; die Erklärung wurde nie abgegeben, eine Steuerhinterziehung liegt nicht vor.`, antrag: `Arbeitnehmerin A war für ${Y} nicht zur Abgabe verpflichtet und reicht ${ab} eine Erklärung zur Antragsveranlagung ein.`, leicht: `Für die ESt ${Y} bestand eine Erklärungspflicht; die Erklärung ging ${ab} ein. Darin hat der Steuerpflichtige leichtfertig Einnahmen verschwiegen.`, hinter: `Für die ESt ${Y} bestand eine Erklärungspflicht; die Erklärung ging ${ab} ein. Darin hat der Steuerpflichtige vorsätzlich Einnahmen verschwiegen (Hinterziehung).` }[kind];
      return { q: `${txt} Mit Ablauf welchen Jahres endet die Festsetzungsfrist für die verkürzte bzw. festzusetzende Steuer (ohne Ablaufhemmung)?`, a: start + dur, unit: 'Jahr', dec: 0, tol: 0,
        steps: [`Entstehung mit Ablauf ${Y} (§ 36 Abs. 1 EStG).`, why, `Dauer ${dur} Jahre (§ 169 Abs. 2 AO${kind === 'leicht' ? ', leichtfertige Verkürzung' : kind === 'hinter' ? ', Hinterziehung' : ''}).`, `Ende mit Ablauf des 31.12.${start + dur}.`] };
    } },
    { id: 'frist', t: 'Bekanntgabe und Einspruchsfrist', em: '📬', sub: 'Viertagesfiktion, Monatsfrist, Wochenende', fx: 'Bekanntgabe = Aufgabe zur Post + 4 Tage (§ 122 Abs. 2 AO); Ende = Bekanntgabe + 1 Monat (§ 355 AO); fällt es auf Sa, So oder Feiertag → nächster Werktag (§ 108 Abs. 3 AO)', gen() {
      const y = R(2025, 2027), post = mk(y, R(1, 11), R(1, 28));
      const fic = add(post, 4), [bek, m1] = workday(fic), raw = plusMonth(bek), [end, m2] = workday(raw);
      return { q: `Das Finanzamt gibt einen ESt-Bescheid mit ordnungsgemäßer Rechtsbehelfsbelehrung am ${WD[post.getDay()]}, ${ds(post)} zur Post (Inland). An welchem Tag endet die Einspruchsfrist? Antwort als TT,MM (z. B. 07,04 für den 7. April). Es zählen nur bundeseinheitliche Feiertage.`, a: end.getDate() + (end.getMonth() + 1) / 100, unit: 'TT,MM', dec: 2, tol: 0.001,
        steps: [`Bekanntgabefiktion: vierter Tag nach Aufgabe zur Post = ${WD[fic.getDay()]}, ${ds(fic)} (§ 122 Abs. 2 Nr. 1 AO).`, ...(m1.length ? [`${m1.join(', ')}: Verschiebung auf den nächsten Werktag, Bekanntgabe ${ds(bek)}.`] : []), `Ein Monat (§ 355 Abs. 1, § 108 Abs. 1 AO, § 188 Abs. 2 BGB): Ablauf des ${ds(raw)}${raw.getDate() !== bek.getDate() ? ' (kürzerer Monat: letzter Tag)' : ''}.`, ...(m2.length ? [`${m2.join(', ')}: Fristende verschiebt sich auf ${WD[end.getDay()]}, ${ds(end)} (§ 108 Abs. 3 AO).`] : []), `Fristende: Ablauf des ${ds(end)}.`] };
    } },
    { id: 'vsz', t: 'Verspätungszuschlag', em: '🐌', sub: '0,25 % je angefangenem Monat, mindestens 10 €', fx: 'VSZ = 0,25 % · (festgesetzte Steuer − Vorauszahlungen − Anrechnungsbeträge) · angefangene Monate, mindestens 10 € je Monat (§ 152 Abs. 5 AO)', gen() {
      const Y = R(2022, 2025), st = R(30, 600) * 100, vz = Math.min(st, R(0, 500) * 100), sub = mk(Y + 1, R(8, 12), R(1, 28));
      const mon = (sub.getMonth() + 1) - 8 + 1, base = st - vz, pct = 0.0025 * base * mon, mn = 10 * mon, v = Math.floor(Math.max(pct, mn));
      return { q: `Erklärungsfrist für die ESt ${Y} war der 31.07.${Y + 1}; die Erklärung geht am ${ds(sub)} ein (ohne Fristverlängerung, ohne Beratung). Festgesetzt werden ${e0(st)}, die Vorauszahlungen betrugen ${e0(vz)}. Wie hoch ist der Verspätungszuschlag, wenn das Finanzamt ihn festsetzt (abgerundet auf volle Euro)?`, a: v, unit: '€', dec: 0, tol: 0.5,
        steps: [`Angefangene Monate ab 01.08.${Y + 1} bis ${ds(sub)}: ${mon}.`, `Bemessungsgrundlage: ${e0(st)} − ${e0(vz)} = ${e0(base)}.`, `0,25 % · ${e0(base)} · ${mon} = ${f(pct)} €; Mindestbetrag 10 € · ${mon} = ${e0(mn)}.`, `Verspätungszuschlag: ${e0(v)} (§ 152 Abs. 5 AO).`] };
    } },
    { id: 'saeum', t: 'Säumniszuschlag', em: '⏰', sub: '1 % je angefangenem Monat auf 50 € abgerundet', fx: 'SZ = 1 % · (Rückstand abgerundet auf volle 50 €) · angefangene Monate der Säumnis (§ 240 AO)', gen() {
      const y = R(2025, 2026), fae = mk(y, R(1, 10), R(1, 28)), betrag = R(200, 9000) + R(0, 99) / 100, how = pick(['Überweisung', 'Überweisung', 'Scheck']);
      const pay = add(fae, pick([2, 3, R(4, 40), R(20, 95), R(60, 120)]));
      const schon = how === 'Überweisung' && pay <= add(fae, 3);
      let k = 0; if (!schon && pay > fae) { k = 1; while (plusMonth(fae, k) < pay) k++; }
      const base = Math.floor(betrag / 50) * 50, v = r2(base * 0.01 * k);
      return { q: `Eine Steuer von ${f(betrag)} € ist am ${ds(fae)} fällig. Gezahlt wird am ${ds(pay)} per ${how} (Zahlungstag = Wertstellung beim Finanzamt). Wie hoch ist der Säumniszuschlag?`, a: v, unit: '€', dec: 2, tol: 0.01,
        steps: schon ? [`Überweisung innerhalb der dreitägigen Schonfrist (bis ${ds(add(fae, 3))}): kein Säumniszuschlag (§ 240 Abs. 3 AO).`] : [`Säumnis ab ${ds(add(fae, 1))}${how === 'Scheck' ? '; bei Scheck gibt es keine Schonfrist' : ''}.`, `Angefangene Monate bis ${ds(pay)}: ${k} (Säumnismonate enden am ${Array.from({ length: k }, (_, i) => ds(plusMonth(fae, i + 1))).join(', ')}).`, `Abgerundet auf volle 50 €: ${e0(base)}.`, `1 % · ${e0(base)} · ${k} = ${f(v)} €.`] };
    } },
    { id: 'dw', t: 'Dienstwagen: 1 %-Regel', em: '🚗', sub: 'Privatnutzung und Fahrten zur Arbeit', fx: 'Privatnutzung = 1 % · BLP · Monate; Fahrten Wohnung–Arbeit = 0,03 % · BLP · km · Monate (§ 8 Abs. 2 EStG)', gen() {
      const lp = R(250, 900) * 100, km = R(3, 45), m = pick([12, 12, 12, R(4, 11)]), sprit = R(8, 40) * 100;
      const a = 0.01 * lp * m, b = 0.0003 * lp * km * m;
      return { q: `Ein Arbeitnehmer darf einen Dienstwagen (Verbrenner, Bruttolistenpreis ${e0(lp)}) ${m === 12 ? 'das ganze Jahr' : `${m} Monate lang`} auch privat nutzen. Entfernung Wohnung – erste Tätigkeitsstätte: ${km} km. Der Arbeitgeber trägt auch private Benzinkosten von ${e0(sprit)}. Kein Fahrtenbuch. Wie hoch ist der geldwerte Vorteil?`, a: r2(a + b), unit: '€', dec: 2, tol: 0.05,
        steps: [`Privatnutzung: 1 % · ${e0(lp)} · ${m} = ${f(a)} €.`, `Fahrten zur Arbeit: 0,03 % · ${e0(lp)} · ${km} km · ${m} = ${f(b)} €.`, `Benzinkosten sind abgegolten.`, `Summe ${f(a + b)} €.`] };
    } },
    { id: 'ag', t: 'Einkünfte aus nichtselbständiger Arbeit', em: '👷', sub: 'Pauschbetrag oder tatsächliche Werbungskosten', fx: 'Einkünfte § 19 = Arbeitslohn − max(Werbungskosten; Pauschbetrag 1.230 €)', gen() {
      const lohn = R(28, 90) * 1000, fahrt = R(0, 30) * 50, fach = R(0, 12) * 50, arbm = R(0, 8) * 50, home = R(0, 210) * 6 > 1260 ? 1260 : R(0, 150) * 6;
      const wk = fahrt + fach + arbm + home, ab = Math.max(wk, 1230);
      return { q: `Bruttoarbeitslohn ${e0(lohn)}. Nachgewiesene Aufwendungen: Fahrtkosten (Entfernungspauschale, bereits berechnet) ${e0(fahrt)}, Fachliteratur ${e0(fach)}, Arbeitsmittel ${e0(arbm)}, Homeoffice-Pauschale ${e0(home)}. Wie hoch sind die Einkünfte aus § 19 EStG? (Arbeitnehmer-Pauschbetrag 1.230 €)`, a: lohn - ab, unit: '€', dec: 0, tol: 0.5,
        steps: [`Tatsächliche Werbungskosten: ${e0(fahrt)} + ${e0(fach)} + ${e0(arbm)} + ${e0(home)} = ${e0(wk)}.`, wk > 1230 ? `Höher als der Pauschbetrag: tatsächliche WK abziehen.` : `Nicht höher als 1.230 €: Pauschbetrag (§ 9a S. 1 Nr. 1 Buchst. a EStG).`, `${e0(lohn)} − ${e0(ab)} = ${e0(lohn - ab)}.`] };
    } },
    { id: 'vuv', t: 'Verbilligte Vermietung', em: '🏠', sub: '§ 21 Abs. 2 EStG: unter 50 % aufteilen', fx: 'Quote = \\frac{Miete}{ortsübliche Miete}; unter 50 %: Werbungskosten nur zur Quote (§ 21 Abs. 2 EStG); Einkünfte = Einnahmen − WK', gen() {
      const markt = R(5, 14) * 50, quote = pick([R(25, 49), R(66, 95)]), miete = Math.round(markt * quote / 100 / 10) * 10, wk = R(30, 140) * 100;
      const q = miete / markt, full = q >= 0.66, wkab = full ? wk : wk * q, ein = miete * 12;
      return { q: `Eine Wohnung wird an die Tochter für ${e0(miete)} monatlich (warm wie kalt gleich, vereinfacht) vermietet; die ortsübliche Miete beträgt ${e0(markt)}. Werbungskosten im Jahr: ${e0(wk)}. Wie hoch sind die Einkünfte aus VuV?`, a: r2(ein - wkab), unit: '€', dec: 2, tol: 0.5,
        steps: [`Quote: ${e0(miete)} / ${e0(markt)} = ${f(q * 100, 1)} %.`, full ? `Ab 66 %: voll entgeltlich, Werbungskosten voll abziehbar.` : `Unter 50 %: Aufteilung, Werbungskosten nur zu ${f(q * 100, 1)} % = ${f(wkab)} €.`, `Einnahmen ${e0(ein)} − ${f(wkab)} € = ${f(ein - wkab)} €.`] };
    } },
    { id: 'p17', t: '§ 17 EStG mit Freibetrag', em: '📈', sub: 'Teileinkünfte, Freibetrag, Abschmelzung', fx: 'Gewinn = Preis − Veräußerungskosten − AK; steuerpflichtig 60 %; Freibetrag = Quote · 9.060 € − (stpfl. Gewinn − Quote · 36.100 €), nicht unter 0 (§ 17 Abs. 3 EStG)', gen() {
      const q = pick([1, 2, 5, 10, 20, 25, 50, 100]), ak = R(2, 60) * 1000 * Math.max(1, q / 10), vp = ak + R(1, 40) * 1000 * Math.max(1, q / 20), vk = R(0, 30) * 100;
      const g = vp - vk - ak, stpf = 0.6 * g, fb = 9060 * q / 100, gr = 36100 * q / 100, fbn = Math.max(0, fb - Math.max(0, stpf - gr)), res = r2(stpf - fbn);
      return { q: `Eine Gesellschafterin verkauft ihre ${q} %-Beteiligung an einer GmbH (Privatvermögen) für ${e0(vp)}. Anschaffungskosten ${e0(ak)}, Veräußerungskosten ${e0(vk)}. Wie hoch ist der steuerpflichtige Betrag nach Teileinkünfteverfahren und Freibetrag?`, a: res, unit: '€', dec: 2, tol: 0.5,
        steps: [`Gewinn: ${e0(vp)} − ${e0(vk)} − ${e0(ak)} = ${e0(g)}; steuerpflichtig 60 % = ${f(stpf)} €.`, `Freibetrag ${q} % · 9.060 = ${f(fb)} €; Kürzungsgrenze ${q} % · 36.100 = ${f(gr)} €.`, stpf > gr ? `Überschreitung ${f(stpf - gr)} €; verbleibender Freibetrag ${f(fbn)} €.` : `Keine Überschreitung; voller Freibetrag ${f(fb)} €.`, `${f(stpf)} − ${f(fbn)} = ${f(res)} €.`] };
    } },
    { id: 'p16', t: '§ 16 EStG mit Freibetrag', em: '🏪', sub: 'Veräußerungsgewinn und Abschmelzung', fx: 'Gewinn = Preis − Veräußerungskosten − Buchwert; Freibetrag 45.000 € ab 55 oder berufsunfähig, gekürzt um den Betrag über 136.000 € (§ 16 Abs. 4 EStG)', gen() {
      const bw = R(20, 200) * 1000, vp = bw + R(30, 220) * 1000, vk = R(0, 80) * 100, alt = R(48, 70);
      const g = vp - vk - bw, ok = alt >= 55, fb = ok ? Math.max(0, 45000 - Math.max(0, g - 136000)) : 0;
      return { q: `Gewerbetreibende(r), ${alt} Jahre, nicht berufsunfähig, verkauft den ganzen Betrieb für ${e0(vp)}. Buchwert des Betriebsvermögens ${e0(bw)}, Veräußerungskosten ${e0(vk)}. Den Freibetrag hat sie/er noch nie beansprucht. Welcher Betrag ist nach Freibetrag zu versteuern?`, a: g - fb, unit: '€', dec: 0, tol: 0.5,
        steps: [`Veräußerungsgewinn: ${e0(vp)} − ${e0(vk)} − ${e0(bw)} = ${e0(g)}.`, ok ? (g > 136000 ? `Freibetrag 45.000 € − (${e0(g)} − 136.000 €) = ${e0(fb)}.` : `Gewinn bis 136.000 €: voller Freibetrag 45.000 €.`) : `Unter 55 und nicht berufsunfähig: kein Freibetrag.`, `Zu versteuern ${e0(g - fb)} (Tarif: § 34 EStG).`] };
    } },
    { id: 'mu', t: 'Einkünfte eines Mitunternehmers', em: '🤝', sub: 'Gewinnanteil plus Sonderbereich', fx: 'Einkünfte = Quote · Gesamthandsgewinn + Sondervergütungen − Sonderbetriebsausgaben (§ 15 Abs. 1 S. 1 Nr. 2 EStG)', gen() {
      const quo = pick([10, 20, 25, 30, 40, 50]), gew = R(40, 400) * 1000, geh = R(0, 1) ? R(30, 120) * 1000 : 0, miet = R(0, 1) ? R(6, 36) * 1000 : 0, zins = R(0, 1) ? R(1, 12) * 1000 : 0, sba = miet ? R(5, 60) * 100 : 0;
      const anteil = gew * quo / 100, v = anteil + geh + miet + zins - sba;
      return { q: `Kommanditist M ist zu ${quo} % am Gewinn der KG beteiligt. Gewinn laut Gesamthandsbilanz: ${e0(gew)}; darin bereits als Aufwand abgezogen: Geschäftsführergehalt an M ${e0(geh)}, Miete an M für ein Grundstück ${e0(miet)}, Darlehenszinsen an M ${e0(zins)}. M trägt für das vermietete Grundstück eigene Kosten von ${e0(sba)}. Wie hoch sind seine Einkünfte aus Gewerbebetrieb?`, a: v, unit: '€', dec: 0, tol: 0.5,
        steps: [`Gewinnanteil: ${quo} % · ${e0(gew)} = ${e0(anteil)}.`, `Sondervergütungen: ${e0(geh)} + ${e0(miet)} + ${e0(zins)} = ${e0(geh + miet + zins)}.`, `Sonderbetriebsausgaben: − ${e0(sba)}.`, `Einkünfte ${e0(v)} (§ 15 Abs. 1 S. 1 Nr. 2 EStG).`] };
    } },
    { id: 'kst', t: 'Körperschaftsteuerliches Einkommen', em: '🏛️', sub: 'Hinzurechnungen, vGA, 15 %', fx: 'Einkommen = Jahresüberschuss + KSt + GewSt + ½ Aufsichtsratsvergütung + Geldbußen + vGA; KSt = 15 % · Einkommen', gen() {
      const jue = R(50, 900) * 1000, kst = R(5, 120) * 1000, gst = R(5, 120) * 1000, ar = R(0, 40) * 1000, buss = R(0, 1) ? R(1, 30) * 500 : 0, vga = R(0, 1) ? R(5, 80) * 1000 : 0;
      const ek = jue + kst + gst + ar / 2 + buss + vga, k = 0.15 * ek;
      return { q: `Jahresüberschuss der X-GmbH ${e0(jue)}. Als Aufwand gebucht sind u. a.: KSt-Vorauszahlungen ${e0(kst)}, Gewerbesteuer ${e0(gst)}, Aufsichtsratsvergütungen ${e0(ar)}, eine Geldbuße ${e0(buss)}. Das Gehalt der Gesellschafter-Geschäftsführerin ist um ${e0(vga)} unangemessen hoch. Wie hoch ist die Körperschaftsteuer (15 %, ohne Soli)?`, a: r2(k), unit: '€', dec: 2, tol: 0.5,
        steps: [`Hinzurechnungen: KSt ${e0(kst)}, GewSt ${e0(gst)}, 1/2 AR-Vergütung ${e0(ar / 2)}, Geldbuße ${e0(buss)}, vGA ${e0(vga)}.`, `Einkommen: ${e0(ek)}.`, `KSt 15 % = ${f(k)} €.`] };
    } },
    { id: 'gew', t: 'Gewerbesteuer und § 35 EStG', em: '🏙️', sub: 'Einzelunternehmer mit Freibetrag', fx: 'Hinzurechnung § 8 Nr. 1 = 25 % · (Summe − 200.000 €); Gewerbeertrag abgerundet auf volle 100 € − Freibetrag 24.500 €; Messbetrag 3,5 %; GewSt = Messbetrag · Hebesatz; § 35: min(4 · Messbetrag; GewSt)', gen() {
      const gw = R(30, 300) * 1000 + R(0, 9) * 100 + R(0, 99), zins = pick([0, R(50, 400) * 1000]), hs = R(20, 55) * 10;
      const hin = Math.max(0, zins - 200000) * 0.25, ge = Math.floor((gw + hin) / 100) * 100, fbe = Math.max(0, ge - 24500), mb = fbe * 0.035, gst = mb * hs / 100, anr = Math.min(4 * mb, gst);
      return { q: `Einzelunternehmer, Gewinn ${e0(gw)}, darin abgezogene Schuldzinsen ${e0(zins)} (keine weiteren Hinzurechnungen oder Kürzungen). Hebesatz ${hs} %. Um wie viel Euro mindert § 35 EStG die Einkommensteuer (Ermäßigungshöchstbetrag nicht bindend)?`, a: r2(anr), unit: '€', dec: 2, tol: 0.05,
        steps: [`Hinzurechnung § 8 Nr. 1: 25 % · max(0; ${e0(zins)} − 200.000 €) = ${f(hin)} €.`, `Gewerbeertrag abgerundet: ${e0(ge)}; nach Freibetrag 24.500 €: ${e0(fbe)}.`, `Messbetrag 3,5 % = ${f(mb)} €; Gewerbesteuer · ${hs} % = ${f(gst)} €.`, `§ 35: 4 · ${f(mb)} = ${f(4 * mb)} €, höchstens ${f(gst)} € → ${f(anr)} €.`] };
    } },
    { id: 'agb', t: 'Zumutbare Belastung', em: '🩹', sub: '§ 33 Abs. 3 EStG stufenweise', fx: 'zumutbare Belastung stufenweise: Satz_{1} · bis 15.340 € + Satz_{2} · bis 51.130 € + Satz_{3} · darüber (§ 33 Abs. 3 EStG); abziehbar = Aufwendungen − zumutbare Belastung', gen() {
      const gde = R(12, 120) * 1000 + R(0, 9) * 100, kind = pick(['ledig', 'ehe', 'k12', 'k3']), kost = R(10, 160) * 100;
      const z = zumutbar(gde, kind), ab = Math.max(0, kost - Math.floor(z.z));
      const lab = { ledig: 'ledig, keine Kinder', ehe: 'zusammenveranlagt, keine Kinder', k12: 'ein oder zwei Kinder', k3: 'drei oder mehr Kinder' }[kind];
      return { q: `Gesamtbetrag der Einkünfte ${e0(gde)} (${lab}). Außergewöhnliche Krankheitskosten ${e0(kost)}, nichts erstattet. Wie viel ist als außergewöhnliche Belastung abziehbar? (Stufen 15.340 € / 51.130 €; zumutbare Belastung auf volle Euro abgerundet)`, a: ab, unit: '€', dec: 0, tol: 0.5,
        steps: [`Sätze ${lab}: ${z.rates.join(' / ')} %.`, `Zumutbare Belastung: ${z.parts.map((p, i) => `${z.rates[i]} % · ${e0(p)}`).join(' + ')} = ${f(z.z)} € → ${e0(Math.floor(z.z))}.`, `Abziehbar: ${e0(kost)} − ${e0(Math.floor(z.z))} = ${e0(ab)}.`] };
    } },
  ];

  /* ---------- Probeklausuren ---------- */
  const fall = (t, pts, q, sol) => ({ t, pts, q, sol });
  D.EXAMS = [
    { id: 'pk1', t: 'Probeklausur 1 (Gutachten)', min: 120, src: 'drei Fälle im Stil der Online-Klausur, eigene Sachverhalte', tasks: [
      fall('Fall 1 · Einspruch gegen einen Änderungsbescheid', 35,
        'Lena Voss ist angestellte Unternehmensberaterin in Bremen. Ihr Arbeitgeber schickt sie im Jahr 01 zu einer zehntägigen Veranstaltung nach Madeira (Kosten 6.000 €, vom Arbeitgeber bezahlt): sieben Tage Seminare zu Restrukturierung, drei Tage Wanderprogramm „zur Teambildung“. Der ESt-Bescheid 01 ergeht am 10.6.02 ohne Vorbehalt; die Reise ist darin nicht erfasst, weil Lena sie nicht erklärt hat und der Arbeitgeber sie nicht in der Lohnsteuerbescheinigung angegeben hat. Bei einer Lohnsteuer-Außenprüfung beim Arbeitgeber erfährt das Wohnsitzfinanzamt im März 03 davon und ändert den Bescheid: Es setzt 6.000 € zusätzlichen Arbeitslohn an. Der Änderungsbescheid wird am Montag, 3.3.03 zur Post gegeben; Lena legt am 4.4.03 per E-Mail „Widerspruch“ ein und meint, die Reise sei Arbeit gewesen. Hat der Einspruch Aussicht auf Erfolg?',
        'A. Zulässigkeit (ca. 10 P.)\n• Statthaft: Steuerbescheid ist VA in Abgabenangelegenheit, § 347 Abs. 1 Nr. 1 AO; Bezeichnung „Widerspruch“ unschädlich, § 357 Abs. 1 AO.\n• Beschwer, § 350 AO: höhere Steuer.\n• Frist, § 355 Abs. 1 AO: Aufgabe zur Post Mo 3.3.03 → Bekanntgabe am vierten Tag, Fr 7.3.03 (§ 122 Abs. 2 Nr. 1 AO). Fristende Ablauf Mo 7.4.03. Einspruch am 4.4.03 rechtzeitig.\n• Form, § 357 Abs. 1 AO: elektronisch genügt.\n• § 351 Abs. 1 AO: Anfechtung nur soweit die Änderung reicht; Lena greift genau die Änderung an. → zulässig.\n\nB. Begründetheit (ca. 25 P.): Begründet, soweit der Änderungsbescheid rechtswidrig ist.\nI. Ermächtigung: § 164/165 (–), § 172 Abs. 1 Nr. 2a (–). In Betracht § 173 Abs. 1 Nr. 1 AO (Reise lag vor Erlass, später bekannt).\nII. Formell: keine Bedenken.\nIII. Materiell:\n1. Festsetzungsfrist läuft (Erklärung 02 → Beginn Ablauf 02, Ende 06).\n2. Tatsache: Teilnahme an der Reise und ihre Ausgestaltung = Merkmale des § 19 EStG.\n   – Arbeitslohn? Vorteil durch das Dienstverhältnis veranlasst (§ 19 Abs. 1 S. 1 Nr. 1, § 8 Abs. 1 EStG). Fachseminare im ganz überwiegend eigenbetrieblichen Interesse → kein Arbeitslohn. Wanderprogramm: Belohnungs-/Freizeitcharakter → Arbeitslohn.\n   – Gemischte Veranstaltung: Aufteilung nach Zeitanteilen (Aufteilungsgebot, GrS 2009): 3/10 · 6.000 = 1.800 € Arbeitslohn; 4.200 € kein Lohn.\n3. Nachträglich bekannt: Bearbeiter kannte die Reise bei Erlass nicht. Keine Sperre nach Treu und Glauben (Lena hat nicht erklärt; Ermittlungspflichtverletzung des FA nicht ersichtlich). § 173 Abs. 2 AO greift nicht: Die Außenprüfung betraf den Arbeitgeber, nicht Lenas ESt.\n4. Höhere Steuer: ja, aber nur soweit 1.800 €.\nC. Ergebnis: Einspruch zulässig und teilweise begründet; Änderung nur in Höhe von 1.800 € rechtmäßig.'),
      fall('Fall 2 · Zu versteuerndes Einkommen', 35,
        'Paul Gerber (52, ledig, keine Kinder, wohnt in Mainz) hat im Jahr 01: Bruttoarbeitslohn 64.000 €; Dienstwagen auch privat (Listenpreis 38.000 €, 15 km zur Arbeit, ganzjährig, Arbeitgeber zahlt alles Benzin); nachgewiesene Werbungskosten außer Fahrtkosten 300 €, Fahrtkosten nach Entfernungspauschale 1.100 €. Er vermietet eine Eigentumswohnung an eine fremde Familie: Mieteinnahmen 9.600 €, Schuldzinsen 2.400 €, AfA 1.800 €, Reparatur 1.300 € (am 28.12.01 bestellt, bezahlt am 8.1.02). Im Mai 01 verkauft er Goldmünzen, die er im Februar 01 für 7.000 € gekauft hatte, für 7.900 €. Zinsen auf dem Sparbuch 650 €. Krankheitskosten (nicht erstattet) 3.900 €; Sonderausgaben (Vorsorge u. Ä.) 9.000 €. Ermitteln Sie das zu versteuernde Einkommen. (Zumutbare Belastung: GdE-Stufen 15.340/51.130 €, ledig ohne Kinder 5/6/7 %.)',
        'I. Steuerpflicht: Wohnsitz Mainz, § 1 Abs. 1 EStG.\nII. § 19 (ca. 10 P.)\n• Lohn 64.000 €; Dienstwagen: 1 % · 38.000 · 12 = 4.560 €; 0,03 % · 38.000 · 15 · 12 = 2.052 €; Benzin abgegolten → Einnahmen 70.612 €.\n• WK: 300 + 1.100 = 1.400 € > 1.230 € → 1.400 €. Einkünfte 69.212 €.\nIII. § 21 (ca. 8 P.): Einnahmen 9.600 €; WK Zinsen 2.400 + AfA 1.800 = 4.200 €. Reparatur 1.300 € erst 02 abgeflossen (§ 11 Abs. 2 EStG, keine regelmäßig wiederkehrende Ausgabe) → nicht in 01. Einkünfte 5.400 €.\nIV. § 23 (ca. 5 P.): Goldmünzen innerhalb eines Jahres → privates Veräußerungsgeschäft; Gewinn 900 €; unter Freigrenze 1.000 € → 0 €.\nV. § 20 (ca. 3 P.): 650 € − Sparer-Pauschbetrag (max. 650 €) = 0 €; im Übrigen Abgeltungsteuer, nicht im zvE.\nVI. Summe der Einkünfte = GdE: 69.212 + 5.400 = 74.612 €.\nVII. Sonderausgaben 9.000 €.\nVIII. agB (ca. 6 P.): zumutbare Belastung 5 % · 15.340 = 767 + 6 % · 35.790 = 2.147,40 + 7 % · 23.482 = 1.643,74 → 4.558 €. Kosten 3.900 € < 4.558 € → 0 €.\nIX. Einkommen = zvE: 74.612 − 9.000 = 65.612 €.'),
      fall('Fall 3 · Haftungsbescheid', 30,
        'Torsten Kade war bis Ende 03 alleiniger Geschäftsführer der Kade Bau GmbH. Ab Herbst 03 reichten die Mittel nicht mehr für alle Gläubiger: Kade zahlte die Löhne für Oktober bis Dezember voll aus, führte die Lohnsteuer (24.000 €) aber nicht ab und bezahlte stattdessen einen Baustofflieferanten vollständig. Die Umsatzsteuer für Dezember (40.000 €) zahlte er nicht; an andere Gläubiger flossen in dieser Zeit nur 50 % der Forderungen. Die GmbH ist seit 04 insolvent. Im Jahr 06 erlässt das Finanzamt nach Anhörung einen schriftlich begründeten Haftungsbescheid über 64.000 € gegen Kade, ohne auf die Höhe der Quote einzugehen. Ist der Haftungsbescheid rechtmäßig?',
        'I. Ermächtigung (2 P.): § 191 Abs. 1 S. 1 AO.\nII. Formell (4 P.): zuständiges FA, Anhörung erfolgt, Schriftform und Begründung (§ 191 Abs. 1 S. 3, § 121 AO).\nIII. Materiell (22 P.)\n1. Keine Festsetzungsverjährung: § 191 Abs. 3 AO, vier Jahre ab Ablauf 03 → bis Ende 07 offen.\n2. § 69 i. V. m. § 34 Abs. 1 AO:\n   a) Kade als Geschäftsführer gesetzlicher Vertreter.\n   b) Pflichtverletzung: Lohnsteuer einbehalten und abführen (§ 41a EStG); USt anmelden und zahlen.\n   c) Verschulden: bewusstes Nichtabführen → mindestens grob fahrlässig.\n   d) Haftungsschaden und Umfang:\n      • Lohnsteuer: keine anteilige Tilgung; volle Haftung 24.000 € (Löhne hätten gekürzt werden müssen).\n      • USt: Grundsatz der anteiligen Tilgung. Andere Gläubiger erhielten 50 % → das FA hätte 50 % · 40.000 = 20.000 € erhalten müssen. Haftung nur 20.000 €.\n3. Ermessen (§ 191 Abs. 1, § 5 AO): Entschließung und Auswahl fehlerfrei? Das FA hat die Quote nicht ermittelt und mehr verlangt, als der Haftungstatbestand trägt → Ermessensfehler bzw. materiell überhöht.\nIV. Ergebnis (2 P.): Rechtmäßig nur in Höhe von 44.000 € (24.000 + 20.000); im Übrigen (20.000 €) rechtswidrig.'),
    ] },
    { id: 'pk2', t: 'Probeklausur 2 (Gutachten)', min: 120, src: 'drei Fälle: Grundlagenbescheid, Körperschaftsteuer, Betriebsveräußerung', tasks: [
      fall('Fall 1 · Klage gegen einen angepassten ESt-Bescheid', 40,
        'Nora Fink ist Kommanditistin (25 %) der Fink Logistik KG, die eine Spedition betreibt. Die KG zahlt ihr 2.000 € monatlich für eine an die KG vermietete Lagerfläche. Noras ESt-Bescheid 01 ergeht im Mai 02 ohne Nebenbestimmungen; weil die Feststellung der KG noch fehlt, schätzt das Finanzamt ihren Anteil auf 30.000 €. Im März 04 ergeht der Feststellungsbescheid der KG: Gewinnanteil Nora 40.000 € zuzüglich Sondervergütung 24.000 €. Im Juli 04 ändert das Wohnsitzfinanzamt Noras ESt-Bescheid und setzt 64.000 € an. Nora meint, die Miete sei Vermietungseinkunft, und ihr ESt-Bescheid sei ohnehin bestandskräftig gewesen. Ihr Einspruch gegen den ESt-Bescheid wird zurückgewiesen; sie erhebt fristgerecht Klage beim Finanzgericht. Hat die Klage Erfolg?',
        'A. Zulässigkeit (ca. 10 P.): Finanzrechtsweg § 33 FGO; Anfechtungsklage § 40 Abs. 1 FGO; Klagebefugnis § 40 Abs. 2 FGO; Vorverfahren erfolglos § 44 FGO; Frist § 47 FGO gewahrt. Aber § 42 FGO i. V. m. § 351 Abs. 2 AO: Einwendungen gegen den Feststellungsbescheid können nicht im Verfahren gegen den Folgebescheid geltend gemacht werden. Klage zulässig, soweit Nora Fehler des Folgebescheids selbst rügt (Bestandskraft-Argument).\n\nB. Begründetheit (ca. 30 P.)\nI. Ermächtigung: § 175 Abs. 1 S. 1 Nr. 1 AO. Der Feststellungsbescheid ist Grundlagenbescheid (§§ 179, 180 Abs. 1 S. 1 Nr. 2a, 171 Abs. 10, 182 Abs. 1 AO).\nII. Formell: keine Bedenken.\nIII. Materiell:\n1. Schätzung ursprünglich zulässig (§ 162 Abs. 5, § 155 Abs. 2 AO).\n2. Festsetzungsfrist: ESt 01, Abgabe 02 → regulär bis Ende 06; jedenfalls Ablaufhemmung § 171 Abs. 10 AO (zwei Jahre nach Bekanntgabe März 04).\n3. Bindungswirkung: Das Wohnsitz-FA muss die festgestellten Besteuerungsgrundlagen übernehmen (§ 182 Abs. 1 AO); Bestandskraft steht § 175 nicht entgegen.\n4. Inhaltlich (nur Hinweis, da bindend): Die Miete ist Sondervergütung (§ 15 Abs. 1 S. 1 Nr. 2 Hs. 2 EStG), die Lagerfläche SBV I; Subsidiarität des § 21 Abs. 3 EStG. Die Einordnung ist zudem richtig.\nC. Ergebnis: Klage unbegründet (insoweit unzulässig, als sie sich gegen den Inhalt der Feststellung richtet).'),
      fall('Fall 2 · GmbH und Gesellschafter', 30,
        'Die Holm GmbH (Sitz Erfurt) hat einen Jahresüberschuss von 120.000 €. Als Aufwand gebucht sind: KSt-Vorauszahlungen 18.000 €, Gewerbesteuer 16.000 €, Geschäftsführergehalt an die Alleingesellschafterin Ida Holm 150.000 € (angemessen wären 110.000 €; schriftlicher Vertrag vor Jahresbeginn). Außerdem überlässt Ida der GmbH zinslos ein Darlehen von 100.000 € und überträgt ihr eine Maschine (Teilwert 30.000 €) unentgeltlich. Die GmbH hält 5 % an der Z-AG und erhält eine Dividende von 10.000 €. a) Ermitteln Sie das zu versteuernde Einkommen der GmbH. b) Welche Einkünfte hat Ida aus Gehalt und vGA, und wie werden sie besteuert?',
        'a) GmbH (ca. 20 P.)\n• Jahresüberschuss 120.000 €\n• + KSt 18.000 € (§ 10 Nr. 2 KStG), + GewSt 16.000 € (§ 4 Abs. 5b EStG)\n• + vGA 40.000 € (§ 8 Abs. 3 S. 2 KStG; unangemessener Teil, Fremdvergleich)\n• zinsloses Darlehen: Nutzungsvorteil, keine verdeckte Einlage → keine Korrektur.\n• Maschine: verdeckte Einlage, als Ertrag gebucht? Wenn ja: − 30.000 € (§ 8 Abs. 3 S. 3 KStG); sonst neutral. (Annahme: Ertrag gebucht) → − 30.000 €.\n• Dividende 5 %: Streubesitz < 10 % → steuerpflichtig (§ 8b Abs. 4 KStG), keine Korrektur.\n• Einkommen: 120.000 + 18.000 + 16.000 + 40.000 − 30.000 = 164.000 €; KSt 15 % = 24.600 €, Soli 1.353 €.\nb) Ida (ca. 10 P.)\n• 110.000 € Arbeitslohn (§ 19 EStG).\n• 40.000 € vGA = Kapitaleinkünfte (§ 20 Abs. 1 Nr. 1 S. 2 EStG); Anteil im Privatvermögen → 25 % Abgeltungsteuer (§ 32d Abs. 1 EStG); Korrespondenz § 32a KStG.\n• Maschine: nachträgliche Anschaffungskosten ihrer Beteiligung (30.000 €).'),
      fall('Fall 3 · Betriebsveräußerung und Gewerbesteuer', 30,
        'Rolf Brand (61) betreibt ein Fahrradgeschäft als Einzelunternehmer in Kiel (Hebesatz 450 %). Laufender Gewinn 01: 70.000 €, Schuldzinsen 30.000 € (darin enthalten). Zum 31.12.01 verkauft er das Geschäft für 260.000 €; Buchwert des Betriebsvermögens 120.000 €, Notar- und Beratungskosten 5.000 €. Den Freibetrag hat er noch nie genutzt. a) Wie hoch ist der zu versteuernde Veräußerungsgewinn? b) Wie hoch ist die Gewerbesteuer 01, und ist der Veräußerungsgewinn gewerbesteuerpflichtig? c) Um welchen Betrag mindert § 35 EStG die ESt?',
        'a) § 16 EStG (ca. 12 P.): Veräußerung des ganzen Gewerbebetriebs (§ 16 Abs. 1 S. 1 Nr. 1). Gewinn 260.000 − 5.000 − 120.000 = 135.000 €. Freibetrag: 61 Jahre, Antrag, nicht verbraucht; Gewinn ≤ 136.000 € → voll 45.000 €. Zu versteuern 90.000 €, Tarif § 34 EStG (Fünftelregelung oder 56 %-Satz auf Antrag).\nb) GewSt (ca. 12 P.): Der Veräußerungsgewinn eines Einzelunternehmers gehört nicht zum Gewerbeertrag (Gewerbesteuer erfasst nur den laufenden Betrieb). Laufender Gewinn 70.000 €; Hinzurechnung § 8 Nr. 1: Zinsen 30.000 € < Freibetrag 200.000 € → 0. Gewerbeertrag 70.000 € − 24.500 € = 45.500 €; Messbetrag 3,5 % = 1.592,50 €; GewSt · 450 % = 7.166,25 €.\nc) § 35 EStG (ca. 6 P.): 4 · 1.592,50 = 6.370 €, höchstens 7.166,25 € → Ermäßigung 6.370 € (begrenzt auch durch den Ermäßigungshöchstbetrag; hier unterstellt nicht bindend).'),
    ] },
    { id: 'blitz', t: 'Blitzrunde', min: 20, pts: 400, src: '4 Blöcke à 5 Aussagen aus deinen gelernten Lektionen', gen: P => { const done = Object.keys(P.done || {}).filter(id => T[id]); const pool = done.length >= 2 ? done : Object.keys(T); return shuffle(pool).slice(0, 4).map(block); } },
    { id: 'ao', t: 'Wissenstest Abgabenordnung', min: 30, pts: 800, src: 'je ein Block pro AO-Lektion', gen: () => D.LESSONS.ao.map(l => block(l.id)) },
    { id: 'est', t: 'Wissenstest Einkommensteuer', min: 35, pts: 900, src: 'je ein Block pro ESt-Lektion', gen: () => D.LESSONS.est.map(l => block(l.id)) },
    { id: 'unt', t: 'Wissenstest Unternehmenssteuerrecht', min: 30, pts: 800, src: 'je ein Block pro Lektion aus Studienbrief 4', gen: () => D.LESSONS.unt.map(l => block(l.id)) },
  ];
})();
