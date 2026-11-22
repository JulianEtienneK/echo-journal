/* Echo · WiWi: modules of the semester, exam dates, and the weekly study time across everything WiWi.
   Time sources: each module path ('echo-wiwi-<nr>', days[day].sec) and the free timer ('echo-wiwi-free', days[day].sec) for reading study letters, Moodle, etc.
   The StB-Pfad does not count here. */
'use strict';
window.WIWI = (() => {
  const MODS = [
    { nr: '31021', t: 'Investition und Finanzierung', em: '💶', page: 'wiwi-31021.html', exam: '2027-03-10', examNote: 'voraussichtlich, Termin in Moodle prüfen', kind: 'Pflicht' },
    { nr: '31071', t: 'Wirtschaftsinformatik', em: '💻', page: 'wiwi-31071.html', exam: '2027-03-09', examNote: 'voraussichtlich, Termin in Moodle prüfen', kind: 'Pflicht' },
    { nr: '55207', t: 'Steuerrechtliche Grundlagen und Einführung ins Ertragsteuerrecht', em: '⚖️', page: 'wiwi-55207.html', exam: '2027-03-09', examNote: 'Online-Klausur 16–18 Uhr, Anmeldung 06.01.–01.02.2027', kind: 'Wahl III' },
    { nr: '31681', t: 'Grundlagen der Unternehmensbesteuerung', em: '🏢', page: 'stb-pfad.html', exam: null, examNote: 'Termin in Moodle prüfen', kind: 'Wahl I', viaStb: 'StB-Pfad Module 1, 3, 4, 6 und ErbSt r1–r3' },
  ];
  const WEEK_GOAL_MIN = 120;
  const lsj = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  // weeks run Monday to Sunday, like the weekly goals in Echo
  function weekDays(ref = new Date()) { const d = new Date(ref); d.setHours(12, 0, 0, 0); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return dk(x); }); }
  const keys = () => [...MODS.filter(m => m.page.startsWith('wiwi-')).map(m => 'echo-wiwi-' + m.nr), 'echo-wiwi-free'];
  function secOn(day) { return keys().reduce((a, k) => a + (((lsj(k, {}) || {}).days || {})[day] || {}).sec || 0, 0); }
  function weekMin(ref) { return Math.round(weekDays(ref).reduce((a, d) => a + secOn(d), 0) / 60); }
  function bySource(ref) { const ds = weekDays(ref); return keys().map(k => [k, Math.round(ds.reduce((a, d) => a + ((((lsj(k, {}) || {}).days || {})[d] || {}).sec || 0), 0) / 60)]); }
  const daysTo = iso => iso ? Math.round((new Date(iso + 'T12:00') - new Date(dk(new Date()) + 'T12:00')) / 864e5) : null;
  const progress = () => { const m = weekMin(); return { label: 'WiWi diese Woche', text: `${m} / ${WEEK_GOAL_MIN} min (alle Module)`, pct: m / WEEK_GOAL_MIN }; };
  return { MODS, WEEK_GOAL_MIN, weekMin, weekDays, bySource, secOn, daysTo, progress };
})();
