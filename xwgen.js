// Crossword layout: places words with crossings, crops the grid and numbers the entries.
// Used in the browser (review puzzles from revealed words) and by Node to build themed puzzles.
(function (root) {
  function generate(items, opts = {}) {
    const N = 40, grid = Array.from({ length: N }, () => Array(N).fill(''));
    const words = items.filter(it => it.a && /^[A-Z]{2,}$/.test(it.a)).sort((a, b) => b.a.length - a.a.length);
    const placed = [];
    const at = (r, c) => (r >= 0 && c >= 0 && r < N && c < N) ? grid[r][c] : '';
    function fits(w, r, c, d) {
      const dr = d === 'd' ? 1 : 0, dc = d === 'a' ? 1 : 0;
      if (r < 0 || c < 0 || r + dr * (w.length - 1) >= N || c + dc * (w.length - 1) >= N) return -1;
      if (at(r - dr, c - dc) || at(r + dr * w.length, c + dc * w.length)) return -1; // no touching ends
      let cross = 0;
      for (let i = 0; i < w.length; i++) {
        const rr = r + dr * i, cc = c + dc * i, g = grid[rr][cc];
        if (g) { if (g !== w[i]) return -1; cross++; continue; }
        // empty cell: neighbours across the word direction must be empty
        if (d === 'a' ? (at(rr - 1, cc) || at(rr + 1, cc)) : (at(rr, cc - 1) || at(rr, cc + 1))) return -1;
      }
      return cross;
    }
    function put(it, r, c, d) {
      const dr = d === 'd' ? 1 : 0, dc = d === 'a' ? 1 : 0;
      for (let i = 0; i < it.a.length; i++) grid[r + dr * i][c + dc * i] = it.a[i];
      placed.push(Object.assign({}, it, { r, c, d }));
    }
    if (!words.length) return null;
    put(words[0], Math.floor(N / 2), Math.floor((N - words[0].a.length) / 2), 'a');
    const rest = words.slice(1);
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 0; k < rest.length; k++) {
        const it = rest[k]; if (!it || placed.some(p => p.a === it.a)) continue;
        let best = null;
        for (const p of placed) for (let i = 0; i < p.a.length; i++) for (let j = 0; j < it.a.length; j++) {
          if (p.a[i] !== it.a[j]) continue;
          const d = p.d === 'a' ? 'd' : 'a';
          const pr = p.r + (p.d === 'd' ? i : 0), pc = p.c + (p.d === 'a' ? i : 0);
          const r = pr - (d === 'd' ? j : 0), c = pc - (d === 'a' ? j : 0);
          const cross = fits(it.a, r, c, d); if (cross < 1) continue;
          // prefer more crossings, then a compact grid
          const cr = placed.map(q => q.r).concat([r]), cc = placed.map(q => q.c).concat([c]);
          const score = cross * 10 - (Math.max(...cr) - Math.min(...cr) + Math.max(...cc) - Math.min(...cc)) * 0.3 + Math.random();
          if (!best || score > best.score) best = { r, c, d, score };
        }
        if (best) put(it, best.r, best.c, best.d);
      }
    }
    let r0 = N, c0 = N, r1 = 0, c1 = 0;
    for (const p of placed) { const len = p.a.length - 1; r0 = Math.min(r0, p.r); c0 = Math.min(c0, p.c); r1 = Math.max(r1, p.r + (p.d === 'd' ? len : 0)); c1 = Math.max(c1, p.c + (p.d === 'a' ? len : 0)); }
    const entries = placed.map(p => ({ d: p.d, r: p.r - r0, c: p.c - c0, a: p.a, q: p.q, info: p.info || undefined }));
    // standard numbering: row by row, a start cell gets the next number
    const starts = [...new Set(entries.map(e => e.r * 1000 + e.c))].sort((a, b) => a - b);
    entries.forEach(e => { e.n = starts.indexOf(e.r * 1000 + e.c) + 1; });
    entries.sort((a, b) => (a.d === b.d ? a.n - b.n : a.d === 'a' ? -1 : 1));
    return { w: c1 - c0 + 1, h: r1 - r0 + 1, x: entries.length, entries, skipped: words.filter(w => !placed.some(p => p.a === w.a)).map(w => w.a) };
  }
  root.XWGEN = { generate };
  if (typeof module !== 'undefined') module.exports = { generate };
})(typeof window !== 'undefined' ? window : globalThis);
