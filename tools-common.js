/* Shared helpers for werkzeuge.html and spanisch.html: storage, XP into the Echo games level, AI calls with the key from Echo's settings. */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } },
};
(() => { const s = LS.get('echo-settings', {}); if (s.theme && s.theme !== 'system') document.documentElement.dataset.theme = s.theme; })();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dk(new Date());
const addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return dk(d); };
const fmtDay = k => new Date(k + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: '2-digit' });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
function toast(msg) { document.querySelectorAll('.toast').forEach(t => t.remove()); const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }
// XP lands in the same store as the other games (read fresh, so a stale copy never overwrites newer progress)
function gainXP(key, xp) {
  const G = LS.get('echo-games', null) || { xp: 0, days: {}, rechnen: { best: 0 }, quiz: {}, sound: true };
  G.days = G.days || {}; const d = G.days[today()] || (G.days[today()] = { xp: 0 });
  d[key] = (d[key] || 0) + 1; d.xp = (d.xp || 0) + xp; G.xp = (G.xp || 0) + xp; G.updated = Date.now(); LS.set('echo-games', G);
}
const hasAI = () => !!(LS.get('echo-settings', {}).anthropicKey || '').trim();
async function askAI(system, messages, maxTokens = 900) {
  const s = LS.get('echo-settings', {}), key = (s.anthropicKey || '').trim();
  if (!key) throw new Error('Kein Anthropic-Schlüssel in den Echo-Einstellungen');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: s.fastModel || s.model || 'claude-haiku-5-5', max_tokens: maxTokens, system, messages }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
}
function parseJSONLoose(t) { const m = String(t).match(/[[{][\s\S]*[\]}]/); if (!m) throw new Error('keine JSON-Antwort'); return JSON.parse(m[0]); }
// Dictation via the browser's speech recognition where available (Chrome, Safari)
function dictate(lang, onText, onEnd) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { toast('Diktieren geht in diesem Browser nicht'); return null; }
  const r = new SR(); r.lang = lang; r.interimResults = false; r.maxAlternatives = 1;
  r.onresult = e => onText(Array.from(e.results).map(x => x[0].transcript).join(' '));
  r.onerror = () => {}; r.onend = () => onEnd && onEnd(); r.start(); return r;
}
