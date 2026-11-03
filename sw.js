// Network first, cache as fallback: updates arrive immediately, the app still opens offline.
const CACHE = 'echo-v37';
const CORE = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'puzzles.js', 'laender.html', 'geo/facts.js', 'geo/capfacts.js', 'geo/caps.js', 'spiele.html', 'rechnen.js', 'rechnen-gen.js', 'geo/quiz.js', 'puzzles2.js', 'puzzles3.js', 'puzzles4.js', 'puzzles5.js', 'puzzles6.js', 'medizin.html', 'med.css', 'med.js', 'med-svg.js', 'med-data.js', 'med-maps-sinne.js', 'med-maps-sinne.css', 'med-maps-bewegung.js', 'med-maps-bewegung.css', 'med-maps-gaenge.js', 'med-maps-gaenge.css', 'med-maps-system.js', 'med-maps-system.css', 'psy-svg.js', 'psy.css', 'psy-data.js', 'psy.js', 'skandale-data.js', 'skandale.js', 'xwinfo.js', 'xwgen.js', 'notes.js', 'zulassungen.html', 'zulassungen.js', 'zulassungen-data.js', 'geo/d3.min.js', 'geo/topojson-client.min.js', 'geo/data.js', 'geo/flags.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || (u.origin !== location.origin && !u.hostname.includes('fonts.g'))) return;
  // cache: 'no-cache' revalidates with GitHub Pages instead of trusting its 10-minute browser cache.
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
