/* Echo look: resolves the theme to an explicit data-theme on <html> so theme.css needs one selector.
   One-time switch to the dark "Nacht-Studio" look; Settings → Darstellung still offers light and system. */
(() => {
  const K = 'echo-settings', r = document.documentElement;
  const read = () => { try { return JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch { return {}; } };
  try {
    if (!localStorage.getItem('echo-look-nacht')) { const s = read(); s.theme = 'dark'; localStorage.setItem(K, JSON.stringify(s)); localStorage.setItem('echo-look-nacht', '1'); }
  } catch { /* storage blocked: fall through to system */ }
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  const set = () => { const t = read().theme; r.dataset.theme = t === 'light' || t === 'dark' ? t : (mq && mq.matches ? 'dark' : 'light'); };
  set(); if (mq && mq.addEventListener) mq.addEventListener('change', set);
  window.echoTheme = set;
})();
