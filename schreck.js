/* Echo · Merk-Boost: scare scenarios.
   Each scenario is a short scripted sequence on the boost overlay; most start with something
   subtly wrong on the recall screen and end in the same hard hit (flash, creature, noise, vibration).
   Full-screen brightness changes stay at or below three per second. */
(() => {
  'use strict';
  const R = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  let AC = null, COMP = null, TIMERS = [], IVS = [], DONE = null, LIVE = [];
  const later = (ms, fn) => { const id = setTimeout(fn, ms); TIMERS.push(id); return id; };
  const every = (ms, fn) => { const id = setInterval(fn, ms); IVS.push(id); return id; };
  const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* none */ } };

  /* ---------- sound ---------- */
  function unlock() {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume();
      if (!COMP) { COMP = AC.createDynamicsCompressor(); COMP.threshold.value = -22; COMP.knee.value = 0; COMP.ratio.value = 12; COMP.attack.value = 0; COMP.release.value = 0.12; const g = AC.createGain(); g.gain.value = 0.95; COMP.connect(g); g.connect(AC.destination); }
    } catch { /* no audio */ }
    return AC;
  }
  const snd = fn => { try { if (unlock()) fn(AC, AC.currentTime + 0.01); } catch { /* no audio */ } };
  // noise burst: decay 0 = flat, filter = [type, freq, Q]
  function noise(ac, at, dur, { decay = 2, vol = 1, f = ['highpass', 200, 0.7], shape } = {}) {
    const len = Math.max(1, Math.floor(ac.sampleRate * dur)), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (shape ? shape(i / len) : Math.pow(1 - i / len, decay));
    const n = ac.createBufferSource(), bf = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = buf; bf.type = f[0]; bf.frequency.value = f[1]; bf.Q.value = f[2]; g.gain.value = vol;
    n.connect(bf); bf.connect(g); g.connect(COMP); n.start(at); LIVE.push(n); return n;
  }
  function tone(ac, at, f1, f2, dur, type = 'sine', vol = 1, hold = 0) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f1, at); o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), at + dur);
    g.gain.setValueAtTime(vol, at); if (hold) g.gain.setValueAtTime(vol, at + hold); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(g); g.connect(COMP); o.start(at); o.stop(at + dur + 0.02); LIVE.push(o); return o;
  }
  const S = {
    slam: () => snd((ac, t) => { noise(ac, t, 0.11, { decay: 0.3, vol: 3 }); tone(ac, t, 115, 28, 0.9, 'sine', 3); noise(ac, t + 0.03, 0.6, { decay: 3, vol: 1.4, f: ['lowpass', 900, 0.5] }); }),
    scream: () => snd((ac, t) => {
      [1, 1.013, 1.5, 2.02].forEach((m, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain(), bp = ac.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(420 * m, t); o.frequency.exponentialRampToValueAtTime(1500 * m, t + 0.09); o.frequency.exponentialRampToValueAtTime(1250 * m, t + 0.7); o.frequency.exponentialRampToValueAtTime(520 * m, t + 1.35);
        l.frequency.value = 27 + i * 5; lg.gain.value = 90; l.connect(lg); lg.connect(o.frequency);
        bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.8;
        g.gain.setValueAtTime(0.9, t); g.gain.setValueAtTime(0.9, t + 0.8); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
        o.connect(bp); bp.connect(g); g.connect(COMP); o.start(t); l.start(t); o.stop(t + 1.45); l.stop(t + 1.45); LIVE.push(o, l);
      });
      noise(ac, t, 1.2, { decay: 1.5, vol: 0.9, f: ['bandpass', 3200, 1.2] });
    }),
    siren: () => snd((ac, t) => { tone(ac, t + 0.04, 600, 1600, 0.45, 'sawtooth', 1.5); tone(ac, t + 0.5, 600, 1600, 0.45, 'sawtooth', 1.5); tone(ac, t + 0.96, 600, 1700, 0.5, 'sawtooth', 1.5); }),
    shots: () => snd((ac, t) => { [0.22, 0.41, 0.72].forEach(d => { noise(ac, t + d, 0.12, { decay: 0.4, vol: 3 }); tone(ac, t + d, 140, 40, 0.25, 'sine', 2); }); }),
    shriek: () => snd((ac, t) => { tone(ac, t, 2400, 900, 0.9, 'square', 1.1, 0.4); tone(ac, t, 2460, 700, 0.9, 'sawtooth', 1, 0.4); noise(ac, t + 0.05, 0.9, { decay: 2, vol: 1.3, f: ['highpass', 3500, 0.7] }); }),
    stab: () => snd((ac, t) => { noise(ac, t, 0.08, { decay: 0.3, vol: 2.6 }); tone(ac, t, 900, 2600, 0.5, 'sawtooth', 1.3, 0.25); tone(ac, t, 80, 30, 0.5, 'sine', 2.4); }),
    crack: big => snd((ac, t) => { const n = 5 + big * 6; for (let i = 0; i < n; i++) noise(ac, t + (i ? R(0, 0.12 + big * 0.12) : 0), R(0.012, 0.04), { decay: 1, vol: 0.9 + big * 0.7, f: ['highpass', 3200, 0.7] }); tone(ac, t, 5200, 3800, 0.12, 'sine', 0.5 + big * 0.3); if (big > 1) noise(ac, t, 0.9, { decay: 3, vol: 1.6, f: ['highpass', 1800, 0.5] }); }),
    skitter: dur => snd((ac, t) => { for (let x = 0; x < dur; x += R(0.018, 0.06)) noise(ac, t + x, 0.007, { decay: 0.5, vol: 0.35 + 0.5 * x / dur, f: ['highpass', 2600, 0.7] }); }),
    heart: v => snd((ac, t) => { tone(ac, t, 72, 38, 0.15, 'sine', 2.2 * v); tone(ac, t + 0.17, 60, 36, 0.17, 'sine', 1.5 * v); }),
    ping: () => snd((ac, t) => { tone(ac, t, 880, 880, 0.14, 'sine', 0.3); tone(ac, t + 0.12, 1175, 1175, 0.32, 'sine', 0.3); }),
    pop: () => snd((ac, t) => { noise(ac, t, 0.05, { decay: 1, vol: 0.5, f: ['bandpass', 1400, 1] }); tone(ac, t, 520, 300, 0.12, 'sine', 0.4); }),
    static: dur => snd((ac, t) => { let gate = 0; noise(ac, t, dur, { vol: 0.55, f: ['bandpass', 3000, 0.4], shape: () => { if (Math.random() < 0.002) gate = Math.random() < 0.5 ? 1 : 0.1; return gate; } }); tone(ac, t, 50, 50, dur, 'sawtooth', 0.18, dur * 0.95); }),
    drone: dur => snd((ac, t) => { tone(ac, t, 46, 52, dur, 'sawtooth', 0.5, dur * 0.97); tone(ac, t, 49, 58, dur, 'sawtooth', 0.5, dur * 0.97); noise(ac, t, dur, { vol: 0.25, f: ['bandpass', 500, 2], shape: x => x }); }),
    whisper: dur => snd((ac, t) => { noise(ac, t, dur, { vol: 0.4, f: ['bandpass', 2600, 2.5], shape: x => (0.35 + 0.65 * Math.abs(Math.sin(x * dur * 11))) * Math.min(1, x * 6) }); }),
    click: () => snd((ac, t) => { noise(ac, t, 0.02, { decay: 1, vol: 0.8, f: ['bandpass', 1800, 2] }); }),
  };
  const silence = () => { LIVE.forEach(n => { try { n.stop(); } catch { /* already stopped */ } }); LIVE = []; };

  /* ---------- styles ---------- */
  function css() {
    if (document.getElementById('sc-css')) return;
    const s = document.createElement('style'); s.id = 'sc-css';
    s.textContent = `
#boostov{overflow:hidden;box-shadow:0 0 0 120px #000}
.sc-face{position:absolute;inset:0;transform-origin:50% 40%;will-change:transform}
.sc-face svg,.sc-layer svg.sc-full{position:absolute;inset:0;width:100%;height:100%}
.sc-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.sc-scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.34) 0 1px,transparent 1px 3px)}
.sc-jaw{transform-box:fill-box;transform-origin:50% 0;animation:scJaw .42s cubic-bezier(.2,1.7,.4,1) both}
@keyframes scJaw{from{transform:scaleY(.2)}to{transform:scaleY(1)}}
.sc-pup{transform-box:fill-box;transform-origin:50% 50%;animation:scPup .9s steps(1) both}
@keyframes scPup{0%{transform:translate(-38%,10%)}30%{transform:translate(40%,-12%)}55%{transform:translate(0,0)}80%{transform:translate(0,0) scale(.45)}100%{transform:translate(0,0) scale(.45)}}
.sc-lidT{animation:scLidT .16s ease-out both}.sc-lidB{animation:scLidB .16s ease-out both}
@keyframes scLidT{from{transform:translateY(0)}to{transform:translateY(-62%)}}
@keyframes scLidB{from{transform:translateY(0)}to{transform:translateY(62%)}}
.sc-twitch{transform-box:fill-box;transform-origin:50% 50%;animation:scTw .11s steps(2) infinite}
@keyframes scTw{from{transform:translate(-2px,1px) rotate(-.6deg)}to{transform:translate(2px,-1px) rotate(.6deg)}}
.sc-glitch>.instr{animation:scTear .16s steps(2) infinite}
.sc-glitch h2,.sc-glitch p,.sc-glitch textarea,.sc-glitch .eyebrow{text-shadow:-3px 0 #ff2bd1,3px 0 #19f0ff}
@keyframes scTear{0%{transform:translate(0,0)}50%{transform:translate(-7px,1px) skewX(-3deg)}100%{transform:translate(6px,-1px) skewX(2deg)}}
.sc-bar{position:absolute;left:-40px;right:-40px;height:4%;pointer-events:none;backdrop-filter:invert(1) hue-rotate(160deg) saturate(3);-webkit-backdrop-filter:invert(1) hue-rotate(160deg) saturate(3);background:rgba(25,240,255,.08)}
.sc-ban{position:absolute;left:10px;right:10px;top:max(10px,env(safe-area-inset-top));display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:18px;background:rgba(38,40,40,.96);color:#f1f3f1;box-shadow:0 12px 40px rgba(0,0,0,.6);font-size:14px;line-height:1.35;text-align:left;z-index:3}
.sc-ban i{flex:none;width:36px;height:36px;border-radius:9px;background:#111;display:grid;place-items:center;font-style:normal;color:#c33;font-size:20px}
.sc-ban b{font-weight:650}.sc-ban span{opacity:.6}.sc-ban p{margin:2px 0 0}
.sc-bug{position:absolute;left:0;top:0;width:58px;height:58px;margin:-29px 0 0 -29px;will-change:transform}
.sc-bug .lg{transform-box:fill-box;transform-origin:50% 50%;animation:scLeg .09s steps(2) infinite}
@keyframes scLeg{from{transform:scaleY(.86) rotate(-5deg)}to{transform:scaleY(1.08) rotate(5deg)}}
.sc-dark{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 0,rgba(0,0,0,.5) 34%,#000 74%);opacity:0;transition:opacity .5s}
.sc-red{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(160,0,0,0) 20%,rgba(150,0,0,.75) 100%);opacity:0}
`;
    document.head.appendChild(s);
  }

  /* ---------- creatures (original procedural SVG) ---------- */
  function creature(v) {
    const u = 'c' + Math.floor(Math.random() * 1e6), seed = Math.floor(Math.random() * 999), W = 400, H = 620;
    const defs = `<defs>
<filter id="${u}w" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="22"/></filter>
<filter id="${u}a" x="-10%" y="-5%" width="120%" height="110%"><feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="-8" dy="1" result="ro"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="8" dy="-1" result="go"/><feBlend in="ro" in2="go" mode="screen"/></filter>
<filter id="${u}g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0"/></filter>
<filter id="${u}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
<radialGradient id="${u}s" cx="50%" cy="34%" r="70%"><stop offset="0" stop-color="#e4e0d3"/><stop offset=".55" stop-color="#a39d8c"/><stop offset="1" stop-color="#1c1915"/></radialGradient>
<radialGradient id="${u}v" r="72%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000"/></radialGradient>
<radialGradient id="${u}e"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#ff3a22"/><stop offset="1" stop-color="#ff0000" stop-opacity="0"/></radialGradient>
<radialGradient id="${u}t" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#000"/><stop offset=".6" stop-color="#3a0505"/><stop offset="1" stop-color="#7c1010"/></radialGradient>
<radialGradient id="${u}h" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#8a6c52"/><stop offset=".7" stop-color="#3d2c20"/><stop offset="1" stop-color="#15100b"/></radialGradient>
<radialGradient id="${u}r" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#c01208"/><stop offset=".6" stop-color="#5c0000"/><stop offset="1" stop-color="#120000"/></radialGradient>
</defs>`;
    const teeth = (x0, x1, y, h, n, bend = 0) => { let d = ''; const w = (x1 - x0) / n; for (let i = 0; i < n; i++) { const yy = y + bend * Math.sin(Math.PI * (i + 0.5) / n); d += `M${(x0 + i * w).toFixed(1)},${yy.toFixed(1)} L${(x0 + i * w + w / 2 + ((i * 13 + seed) % 5 - 2)).toFixed(1)},${(yy + h * (0.55 + ((i * 7 + seed) % 6) / 10)).toFixed(1)} L${(x0 + (i + 1) * w).toFixed(1)},${yy.toFixed(1)} Z `; } return `<path d="${d}" fill="#e9e3cf" stroke="#6e6654" stroke-width=".8"/>`; };
    const glow = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="url(#${u}e)" opacity=".85"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`;
    const strands = (n, y1) => Array.from({ length: n }, (_, i) => { const x = 62 + (i * 276 / n) + ((i * 31 + seed) % 14), l = y1 * (0.5 + ((i * 17 + seed) % 10) / 14); return `<path d="M${x},40 Q${x + ((i * 7 + seed) % 30) - 15},${l * 0.6} ${x + ((i * 11 + seed) % 40) - 20},${l}" stroke="#060505" stroke-width="${2 + (i % 4)}" fill="none" stroke-linecap="round"/>`; }).join('');
    let bg = '#000', body;
    if (v === 0) { // the pale one: hollow sockets, jaw dropping open
      body = `<ellipse cx="200" cy="300" rx="140" ry="225" fill="url(#${u}s)"/>
<ellipse cx="108" cy="380" rx="34" ry="80" fill="#000" opacity=".5" filter="url(#${u}b)"/><ellipse cx="292" cy="380" rx="34" ry="80" fill="#000" opacity=".5" filter="url(#${u}b)"/>
<path d="M52,270 Q40,40 200,34 Q360,40 348,270 Q330,120 200,112 Q70,120 52,270 Z" fill="#060505"/>${strands(8, 300)}
<ellipse cx="142" cy="246" rx="44" ry="58" fill="#020202"/><ellipse cx="258" cy="246" rx="44" ry="58" fill="#020202"/>
${glow(146, 258, 4.5)}${glow(254, 258, 4.5)}
<path d="M140,300 L132,430 M150,302 L156,400 M262,300 L270,440 M250,302 L246,390" stroke="#0a0606" stroke-width="3" opacity=".8"/>
<path d="M190,318 L184,340 M210,318 L216,340" stroke="#1b1512" stroke-width="5" stroke-linecap="round"/>
<g class="sc-jaw"><path d="M112,378 Q200,352 288,378 Q292,560 200,588 Q108,560 112,378 Z" fill="url(#${u}t)"/>${teeth(124, 276, 374, 34, 10, -8)}${teeth(132, 268, 566, -30, 9, 14)}<path d="M150,400 L154,548 M200,396 L198,560 M250,400 L244,548" stroke="#d8d2bd" stroke-width="1.2" opacity=".45"/></g>`;
    } else if (v === 1) { // eyes everywhere
      const eye = (x, y, r, i) => `<g><ellipse cx="${x}" cy="${y}" rx="${r * 1.55}" ry="${r}" fill="#ebe6d6"/><path d="M${x - r * 1.5},${y} q${r * 0.5},${-r * 0.3} ${r * 0.8},${r * 0.1} M${x + r * 1.5},${y} q${-r * 0.5},${r * 0.4} ${-r * 0.9},${-r * 0.1}" stroke="#a01010" stroke-width="1" fill="none"/><g class="sc-pup" style="animation-delay:${(i % 5) * 0.04}s"><circle cx="${x}" cy="${y}" r="${r * 0.68}" fill="#7a0d0d"/><circle cx="${x}" cy="${y}" r="${r * 0.36}" fill="#000"/><circle cx="${x - r * 0.2}" cy="${y - r * 0.25}" r="${r * 0.1}" fill="#fff"/></g></g>`;
      body = Array.from({ length: 22 }, (_, i) => eye(30 + ((i * 97 + seed) % 340), 40 + ((i * 139 + seed * 3) % 540), 9 + (i % 5) * 6, i)).join('') + eye(200, 290, 62, 0);
    } else if (v === 2) { // the maw
      bg = '#0a0202';
      body = `<circle cx="112" cy="74" r="22" fill="#fff"/><circle cx="288" cy="74" r="22" fill="#fff"/><circle cx="116" cy="80" r="6" fill="#000"/><circle cx="284" cy="80" r="6" fill="#000"/>
<path d="M14,330 Q200,90 386,330 Q200,640 14,330 Z" fill="url(#${u}t)"/><path d="M14,330 Q200,90 386,330" fill="none" stroke="#5a1414" stroke-width="16"/><path d="M14,330 Q200,640 386,330" fill="none" stroke="#5a1414" stroke-width="16"/>
<ellipse cx="200" cy="370" rx="62" ry="86" fill="#000"/><path d="M200,250 q-10,40 0,62 q10,-22 0,-62" fill="#8c1a1a"/>
${teeth(40, 360, 318, 120, 13, -150)}${teeth(70, 330, 470, -110, 11, 120)}
<path d="M120,300 L126,480 M200,250 L204,520 M285,300 L276,470" stroke="#e9e3cf" stroke-width="1.4" opacity=".4"/>`;
    } else if (v === 3) { // horned silhouette against red
      bg = `url(#${u}r)`;
      body = `<path d="M30,620 Q30,380 104,318 Q62,200 200,112 Q338,200 296,318 Q370,380 370,620 Z" fill="#030303"/>
<path d="M150,140 Q70,110 58,6 Q110,70 176,112 Z M250,140 Q330,110 342,6 Q290,70 224,112 Z" fill="#030303"/>
<ellipse cx="150" cy="232" rx="24" ry="9" fill="#fff2d0" transform="rotate(14 150 232)"/><ellipse cx="250" cy="232" rx="24" ry="9" fill="#fff2d0" transform="rotate(-14 250 232)"/>${glow(152, 233, 3.5)}${glow(248, 233, 3.5)}
<path d="M128,318 Q200,372 272,318 Q200,342 128,318 Z" fill="#200"/>${teeth(134, 266, 322, 16, 14, 14)}`;
    } else if (v === 4) { // just eyes and a grin in the dark
      body = `<circle cx="128" cy="190" r="42" fill="#f4f1e4"/><circle cx="272" cy="190" r="42" fill="#f4f1e4"/><circle cx="134" cy="196" r="8" fill="#000"/><circle cx="266" cy="196" r="8" fill="#000"/>
<path d="M88,190 q20,-14 40,-4 M312,190 q-20,12 -42,2 M96,214 q14,4 22,-4" stroke="#b01010" stroke-width="1.2" fill="none"/>
<g class="sc-jaw"><path d="M22,330 Q200,470 378,330 Q200,640 22,330 Z" fill="#050000"/>${teeth(34, 366, 334, 62, 22, 62)}${teeth(70, 330, 520, -60, 17, 24)}</g>`;
    } else { // too many eyes, fangs, legs
      const leg = (a, len, s) => { const x1 = 200 + Math.cos(a) * 80, y1 = 300 + Math.sin(a) * 90, xm = 200 + Math.cos(a - 0.35 * s) * len * 0.6, ym = 300 + Math.sin(a - 0.35 * s) * len * 0.6 - 60, x2 = 200 + Math.cos(a) * len, y2 = 300 + Math.sin(a) * len; return `<path d="M${x1},${y1} L${xm},${ym} L${x2},${y2}" stroke="#241a13" stroke-width="20" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M${x1},${y1} L${xm},${ym} L${x2},${y2}" stroke="#a58c70" stroke-width="3" fill="none" stroke-dasharray="1 7"/>`; };
      const eyes = [[150, 230, 30], [250, 230, 30], [98, 262, 19], [302, 262, 19], [170, 170, 15], [230, 170, 15], [124, 196, 11], [276, 196, 11]];
      bg = '#141a12';
      body = `<g class="sc-twitch">${[-2.75, -2.25, -3.3, 2.6, -0.4, -0.9, 0.15, 0.55].map((a, i) => leg(a, 330, i < 4 ? -1 : 1)).join('')}</g>
<ellipse cx="200" cy="300" rx="150" ry="170" fill="#2a1f17"/><ellipse cx="200" cy="262" rx="140" ry="130" fill="url(#${u}h)"/>
${eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1a0000"/><circle cx="${x}" cy="${y}" r="${r * 0.8}" fill="#8f0c0c"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#000"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.18}" fill="#fff"/>`).join('')}
<g class="sc-jaw"><path d="M150,330 Q130,470 186,560 Q176,440 190,340 Z M250,330 Q270,470 214,560 Q224,440 210,340 Z" fill="#e2dcc6" stroke="#4a4234" stroke-width="2"/><path d="M165,334 Q200,430 235,334 Z" fill="#060000"/></g>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}<rect width="${W}" height="${H}" fill="${bg}"/><g filter="url(#${u}a)"><g filter="url(#${u}w)">${body}</g></g><rect width="${W}" height="${H}" filter="url(#${u}g)"/><rect width="${W}" height="${H}" fill="url(#${u}v)"/></svg>`;
  }
  function eyeSVG() {
    const u = 'e' + Math.floor(Math.random() * 1e6), veins = Array.from({ length: 26 }, (_, i) => { const a = i / 26 * 6.283, x1 = 200 + Math.cos(a) * 330, y1 = 310 + Math.sin(a) * 250; let d = `M${x1.toFixed(0)},${y1.toFixed(0)}`, r = 1; for (let k = 0; k < 5; k++) { r -= R(0.08, 0.14); d += ` L${(200 + Math.cos(a + R(-0.12, 0.12)) * 330 * r).toFixed(0)},${(310 + Math.sin(a + R(-0.12, 0.12)) * 250 * r).toFixed(0)}`; } return `<path d="${d}" stroke="#b01414" stroke-width="${R(0.8, 2.6).toFixed(1)}" fill="none" opacity=".8"/>`; }).join('');
    return `<svg viewBox="0 0 400 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
<radialGradient id="${u}s"><stop offset=".5" stop-color="#f1ecdc"/><stop offset="1" stop-color="#b98a7a"/></radialGradient>
<radialGradient id="${u}i"><stop offset=".18" stop-color="#1a1200"/><stop offset=".3" stop-color="#d7c21c"/><stop offset=".7" stop-color="#7a8a12"/><stop offset="1" stop-color="#1c2200"/></radialGradient>
<filter id="${u}a"><feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="-7" result="ro"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="7" result="go"/><feBlend in="ro" in2="go" mode="screen"/></filter></defs>
<rect width="400" height="620" fill="#000"/><g filter="url(#${u}a)"><ellipse cx="200" cy="310" rx="330" ry="250" fill="url(#${u}s)"/>${veins}
<g class="sc-pup"><circle cx="200" cy="310" r="150" fill="url(#${u}i)"/>${Array.from({ length: 40 }, (_, i) => `<path d="M${200 + Math.cos(i / 40 * 6.283) * 52},${310 + Math.sin(i / 40 * 6.283) * 52} L${200 + Math.cos(i / 40 * 6.283 + 0.05) * 146},${310 + Math.sin(i / 40 * 6.283 + 0.05) * 146}" stroke="#2a2a00" stroke-width="1.6" opacity=".55"/>`).join('')}<ellipse cx="200" cy="310" rx="30" ry="118" fill="#000"/><circle cx="160" cy="262" r="16" fill="#fff" opacity=".8"/></g></g>
<path class="sc-lidT" d="M-40,-200 H440 V310 Q200,150 -40,310 Z" fill="#000" style="transform:translateY(-62%)"/><path class="sc-lidB" d="M-40,820 H440 V310 Q200,470 -40,310 Z" fill="#000" style="transform:translateY(62%)"/></svg>`;
  }
  function corridor(step) { // step 0..2: the figure comes closer each time the light returns
    const s = [0.42, 1.25, 3.1][step], fy = [392, 470, 640][step];
    return `<svg class="sc-full" viewBox="0 0 400 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="cl" cx="50%" cy="46%" r="60%"><stop offset="0" stop-color="#3b4038"/><stop offset=".5" stop-color="#151813"/><stop offset="1" stop-color="#000"/></radialGradient><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22261f"/><stop offset="1" stop-color="#050604"/></linearGradient><filter id="cg"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .4 0"/></filter></defs>
<rect width="400" height="620" fill="url(#cl)"/><path d="M0,620 L150,392 L250,392 L400,620 Z" fill="url(#cf)"/><path d="M0,0 L150,228 L250,228 L400,0 Z" fill="#0b0d0a"/>
<rect x="150" y="228" width="100" height="164" fill="#060705" stroke="#2c3129" stroke-width="1.5"/>
${[0.25, 0.5, 0.75].map(k => `<path d="M${150 * (1 - k)},${228 * (1 - k)} V${620 - 228 * (1 - k)} M${400 - 150 * (1 - k)},${228 * (1 - k)} V${620 - 228 * (1 - k)}" stroke="#262b23" stroke-width="${2 - k}"/>`).join('')}
<path d="M0,0 L150,228 M400,0 L250,228 M0,620 L150,392 M400,620 L250,392" stroke="#30362c" stroke-width="1.5"/>
<ellipse cx="200" cy="232" rx="16" ry="4" fill="#cfd6b8" opacity=".8"/>
<g transform="translate(200 ${fy}) scale(${s})"><path d="M-13,0 L-15,-62 Q-30,-70 -27,-22 L-33,-20 Q-40,-86 -16,-96 Q-13,-104 -11,-108 A13,15 0 1 1 11,-108 Q13,-104 16,-96 Q40,-86 33,-20 L27,-22 Q30,-70 15,-62 L13,0 Z" fill="#000"/><circle cx="-4.5" cy="-116" r="1.5" fill="#f4f1e2"/><circle cx="4.5" cy="-116" r="1.5" fill="#f4f1e2"/></g>
<rect width="400" height="620" filter="url(#cg)"/></svg>`;
  }
  const BUG = `<svg class="sc-bug" viewBox="-30 -30 60 60" aria-hidden="true"><g class="lg" fill="none" stroke="#d6d0bd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M-6,-6 L-17,-17 L-25,-9 M-7,-2 L-21,-5 L-28,4 M-7,3 L-20,8 L-25,19 M-5,8 L-14,17 L-15,27 M6,-6 L17,-17 L25,-9 M7,-2 L21,-5 L28,4 M7,3 L20,8 L25,19 M5,8 L14,17 L15,27"/></g><ellipse cx="0" cy="5" rx="8" ry="11" fill="#0a0806" stroke="#d6d0bd" stroke-width="1.2"/><circle cx="0" cy="-8" r="5.5" fill="#0a0806" stroke="#d6d0bd" stroke-width="1.2"/><circle cx="-2" cy="-10" r="1" fill="#e00"/><circle cx="2" cy="-10" r="1" fill="#e00"/></svg>`;

  /* ---------- the hit: shared finale ---------- */
  const SHAKE = [{ transform: 'translate(0,0)' }, { transform: 'translate(-22px,10px)' }, { transform: 'translate(19px,-12px)' }, { transform: 'translate(-12px,-8px)' }, { transform: 'translate(8px,6px)' }, { transform: 'translate(0,0)' }];
  function finish(el) { later(0, () => { el.classList.remove('sc-glitch'); el.style.transform = ''; const d = DONE; DONE = null; d && d(); }); }
  function hit(el, v, o = {}) {
    silence(); S.slam(); (o.snd || pick([S.scream, S.scream, S.siren, S.shots, S.shriek]))(); vib([500, 30, 500, 30, 700]);
    el.classList.remove('sc-glitch'); el.style.background = '#fff'; el.innerHTML = '';
    later(60, () => {
      el.style.background = '#000'; el.innerHTML = `<div class="sc-face">${o.svg || creature(v)}</div><div class="sc-scan"></div>`;
      const f = el.firstChild;
      f.animate([{ transform: 'scale(.3)', filter: 'brightness(2.6)' }, { transform: 'scale(1.2)', filter: 'brightness(1.15)', offset: 0.6 }, { transform: 'scale(1.06)', filter: 'none' }], { duration: 230, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
      el.animate(SHAKE, { duration: 420 });
      later(240, () => f.animate([{ transform: 'scale(1.06) translate(0,0)' }, { transform: 'scale(1.08) translate(-5px,3px)' }, { transform: 'scale(1.05) translate(4px,-4px)' }, { transform: 'scale(1.09) translate(-3px,-2px)' }, { transform: 'scale(1.06) translate(0,0)' }], { duration: 150, iterations: 3 }));
      later(700, () => { S.stab(); vib([300, 30, 500]); f.animate([{ transform: 'scale(1.06)' }, { transform: 'scale(1.55)', offset: 0.35 }, { transform: 'scale(1.42) translate(-6px,4px)', offset: 0.6 }, { transform: 'scale(1.48) translate(5px,-3px)' }], { duration: 420, easing: 'cubic-bezier(.1,.9,.2,1)', fill: 'forwards' }); el.animate(SHAKE, { duration: 380 }); });
      later(1700, () => finish(el));
    });
  }

  /* ---------- scenarios ---------- */
  const SC = {
    // no warning at all
    klassisch(el) { hit(el, pick([0, 2, 3, 4])); },
    // the screen breaks down while you type, goes dark, then the face
    glitch(el) {
      S.static(1.5); el.classList.add('sc-glitch');
      const ta = el.querySelector('textarea'), h = el.querySelector('h2'), G = '▓▒░#¥§∆Ø'.split('');
      const bars = [0, 1, 2].map(() => { const b = document.createElement('div'); b.className = 'sc-bar'; el.appendChild(b); return b; });
      let n = 0;
      every(90, () => {
        n++; if (ta) { const a = (ta.value || '').split(''); for (let i = 0; i < 1 + n / 3; i++) { if (a.length > 3 && Math.random() < 0.7) a[Math.floor(Math.random() * a.length)] = pick(G); else a.push(pick(G)); } ta.value = a.join(''); }
        bars.forEach(b => { b.style.top = R(0, 95) + '%'; b.style.height = R(1, 9) + '%'; b.style.transform = `translateX(${R(-30, 30)}px)`; });
        if (n === 7 && h) h.textContent = pick(['Wer steht hinter dir?', 'Du bist nicht allein.', 'Nicht umdrehen.']);
      });
      later(1500, () => { IVS.forEach(clearInterval); IVS = []; silence(); S.click(); el.classList.remove('sc-glitch'); el.innerHTML = ''; el.style.background = '#000'; });
      later(1500 + R(400, 1100), () => hit(el, pick([0, 4]), { snd: S.scream }));
    },
    // a message from nobody, then it is already there
    banner(el) {
      S.ping(); vib(60); const b = document.createElement('div'); b.className = 'sc-ban';
      b.innerHTML = `<i>◉</i><div><b>Unbekannt</b><span> · jetzt</span><p>${pick(['Dreh dich nicht um.', 'Ich sehe, was du schreibst.', 'Schau mal hinter dich.', 'Ich stehe direkt hinter dir.'])}</p></div>`;
      el.appendChild(b); b.animate([{ transform: 'translateY(-130%)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1)' });
      later(700, () => S.whisper(2.2));
      later(R(1500, 2600), () => hit(el, pick([3, 4, 0])));
    },
    // lights go out three times, each time it stands closer
    korridor(el) {
      const show = step => { el.innerHTML = `<div class="sc-layer">${corridor(step)}</div>`; }, dark = () => { S.click(); el.innerHTML = ''; };
      el.style.background = '#000'; S.click(); S.drone(2.9); show(0);
      later(800, dark); later(1150, () => show(1)); later(1750, dark); later(2100, () => show(2)); later(2550, dark);
      later(2900, () => hit(el, 0, { snd: S.scream }));
    },
    // the glass cracks twice, then something looks through
    riss(el) {
      const w = el.clientWidth || 390, h = el.clientHeight || 800, cx = R(0.3, 0.7) * w, cy = R(0.3, 0.6) * h, L = Math.hypot(w, h), N = 11;
      const rays = Array.from({ length: N }, (_, i) => { const a = i / N * 6.283 + R(-0.2, 0.2), p = [[cx, cy]]; let r = 0; while (r < L) { r += R(28, 90); const aa = a + R(-0.16, 0.16); p.push([cx + Math.cos(aa) * r, cy + Math.sin(aa) * r]); } return p; });
      const d = (p, k) => 'M' + p.slice(0, Math.max(2, Math.ceil(p.length * k))).map(q => q[0].toFixed(0) + ',' + q[1].toFixed(0)).join(' L');
      const rings = k => { let s = ''; for (let j = 1; j < 7 * k; j++) for (let i = 0; i < N; i++) { const a = rays[i][j], b = rays[(i + 1) % N][j + ((i + j) % 2)]; if (a && b && (i * 3 + j) % 4) s += `M${a[0].toFixed(0)},${a[1].toFixed(0)} L${b[0].toFixed(0)},${b[1].toFixed(0)} `; } return s; };
      const svg = k => `<svg class="sc-full" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke-linejoin="bevel">${rays.map(p => `<path d="${d(p, k)}" stroke="#000" stroke-width="6" opacity=".55" transform="translate(2 3)"/><path d="${d(p, k)}" stroke="#f4f7f5" stroke-width="${k < 1 ? 1.6 : 2.6}"/>`).join('')}<path d="${rings(k)}" stroke="#dfe6e2" stroke-width="1.1" opacity=".85"/></g><circle cx="${cx}" cy="${cy}" r="${6 + k * 10}" fill="#fff" opacity=".9"/></svg>`;
      const layer = document.createElement('div'); layer.className = 'sc-layer'; layer.style.zIndex = 2; el.appendChild(layer);
      const crack = (k, big) => { layer.innerHTML = svg(k); S.crack(big); vib(80 + big * 120); el.animate(SHAKE.map(f => ({ transform: f.transform.replace(/(-?\d+)px/g, (m, n) => (n * (0.25 + big * 0.3)).toFixed(0) + 'px') })), { duration: 220 }); };
      crack(0.28, 0);
      later(R(600, 900), () => crack(0.6, 1));
      later(R(1300, 1900), () => {
        silence(); S.crack(2); S.slam(); vib([400, 30, 600]); el.style.background = '#000';
        el.innerHTML = `<div class="sc-face">${eyeSVG()}</div><div class="sc-layer">${svg(1)}</div><div class="sc-scan"></div>`; el.animate(SHAKE, { duration: 420 });
        const f = el.firstChild;
        later(950, () => { S.scream(); vib([300, 30, 600]); f.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.7)', offset: 0.4 }, { transform: 'scale(1.6)' }], { duration: 380, easing: 'cubic-bezier(.1,.9,.2,1)', fill: 'forwards' }); el.animate(SHAKE, { duration: 380 }); });
        later(2100, () => finish(el));
      });
    },
    // things crawl in over what you wrote
    krabbeln(el) {
      const w = el.clientWidth || 390, h = el.clientHeight || 800, layer = document.createElement('div'); layer.className = 'sc-layer'; layer.style.zIndex = 2;
      layer.innerHTML = BUG.repeat(18); el.appendChild(layer); S.skitter(1.7);
      [...layer.children].forEach((b, i) => {
        const side = i % 4; let x = side === 0 ? -30 : side === 1 ? w + 30 : R(0, w), y = side === 2 ? -30 : side === 3 ? h + 30 : R(0, h);
        const tx = w / 2 + R(-90, 90), ty = h * 0.45 + R(-120, 120), kf = [], steps = 7; let px = x, py = y;
        for (let k = 0; k <= steps; k++) { const q = k / steps, nx = x + (tx - x) * q + (k && k < steps ? R(-45, 45) : 0), ny = y + (ty - y) * q + (k && k < steps ? R(-45, 45) : 0), ang = Math.atan2(ny - py, nx - px) * 57.3 + 90; kf.push({ transform: `translate(${nx.toFixed(0)}px,${ny.toFixed(0)}px) rotate(${(k ? ang : Math.atan2(ty - y, tx - x) * 57.3 + 90).toFixed(0)}deg) scale(${(0.8 + q * 0.9).toFixed(2)})`, offset: k === 0 ? 0 : k === steps ? 1 : Math.min(0.98, q + R(-0.05, 0.05)) }); px = nx; py = ny; }
        b.animate(kf, { duration: 1500 + i * 12, delay: i * 22, fill: 'both', easing: 'steps(22,end)' });
      });
      later(900, () => vib([30, 40, 30, 40, 30]));
      later(1900, () => hit(el, 5, { snd: S.shriek }));
    },
    // heartbeat gets faster, darkness closes in, silence, then
    herz(el) {
      const dk = document.createElement('div'), rd = document.createElement('div'); dk.className = 'sc-dark'; rd.className = 'sc-red'; el.appendChild(dk); el.appendChild(rd);
      const beats = [0, 640, 1200, 1680, 2080, 2400, 2660, 2880, 3060];
      beats.forEach((ms, i) => later(ms, () => { S.heart(0.6 + i * 0.12); vib(40 + i * 8); dk.style.opacity = Math.min(1, (i + 1) / beats.length * 1.1); rd.animate([{ opacity: 0.15 + i * 0.07 }, { opacity: 0 }], { duration: 260 }); el.animate([{ transform: 'scale(1)' }, { transform: `scale(${1.01 + i * 0.004})` }, { transform: 'scale(1)' }], { duration: 200 }); }));
      later(3250, () => { silence(); el.innerHTML = ''; el.style.background = '#000'; });
      later(3250 + R(700, 2200), () => hit(el, pick([0, 2, 3])));
    },
    // a harmless pop, the "done" screen, relief. Not done.
    doppelt(el) {
      S.pop(); vib(80); el.animate([{ filter: 'brightness(1.8)' }, { filter: 'none' }], { duration: 180 });
      el.innerHTML = `<div class="instr"><span style="font-size:48px">✓</span><h2>Das war's schon</h2><p>Ein kleiner Reiz reicht. Jetzt <b>10 Minuten nichts Neues</b>: kein Handy, kein Video.</p><p class="small" style="opacity:.7">Morgen fragt Echo, wie viel noch sitzt.</p><button class="btn primary big" id="scFake">Fertig</button></div>`;
      let gone = false; const go = () => { if (gone) return; gone = true; hit(el, pick([4, 0, 2])); };
      const fb = el.querySelector('#scFake'); if (fb) fb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); go(); });
      later(R(1900, 3800), go);
    },
  };
  const NAMES = { klassisch: 'Ohne Vorwarnung', glitch: 'Bildstörung', banner: 'Nachricht', korridor: 'Flur', riss: 'Riss im Glas', krabbeln: 'Krabbeln', herz: 'Herzschlag', doppelt: 'Falsches Ende' };

  function cancel() { TIMERS.forEach(clearTimeout); IVS.forEach(clearInterval); TIMERS = []; IVS = []; silence(); DONE = null; }
  // avoid the scenarios played most recently, so the next one is hard to guess
  function choose(recent = []) { const all = Object.keys(SC), fresh = all.filter(k => !recent.slice(-4).includes(k)); return pick(fresh.length ? fresh : all); }
  function run(name, el, done) { cancel(); css(); unlock(); DONE = done; (SC[name] || SC.klassisch)(el); }
  window.SCARE = { run, cancel, unlock, choose, names: NAMES, list: Object.keys(SC), creature };
})();
