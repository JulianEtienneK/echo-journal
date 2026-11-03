/* Medizin-Atlas maps: gefaesse, luftwege, speiseroehre, gallenblase, harnwege, milz */
(function () {
  'use strict';
  const { f, cr, path, blob, line, ell, circ, g, S, txt, svgw, tube, zlabel, zs } = MEDSVG.h;
  const W = w => `style="stroke-width:${w}"`;
  const ghost = inner => `<g class="ghost">${inner}</g>`;
  const rot = (cx, cy, rx, ry, a, cls) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}" transform="rotate(${f(a)} ${f(cx)} ${f(cy)})" class="${cls}"/>`;
  const arrow = (x, y, a) => { const r = a * Math.PI / 180, p = (d, s) => [x + Math.cos(r + s) * d, y + Math.sin(r + s) * d]; const b = p(-7, -.45), c = p(-7, .45); return `<path d="M${f(x)} ${f(y)}L${f(b[0])} ${f(b[1])}L${f(c[0])} ${f(c[1])}Z" class="gg-arrow"/>`; };
  const hitc = (cx, cy, rx, ry) => ell(cx, cy, rx, ry, 'hit-c');
  const MAPS = {};

  /* ================= Gefäße ================= */
  MAPS.gefaesse = () => {
    const R = (pts, w) => tube(pts, w, 'v-red');
    const AO = { asc: [[198, 108], [191, 88], [192, 68]], arc: [[192, 68], [202, 54], [222, 50], [237, 60], [240, 78]], thor: [[240, 78], [237, 114], [227, 152]], abd: [[227, 152], [217, 194], [212, 240]] };
    const icost = [96, 112, 128, 144].map(y => { const x = 240 - (y - 78) * .33; return line([[x, y], [x - 22, y + 5]], 'v-red', W(3)) + line([[x, y], [x + 22, y + 5]], 'v-red', W(3)); }).join('');
    return svgw('0 0 400 340',
      ghost(blob([[176, 98], [198, 92], [226, 96], [250, 110], [258, 132], [244, 148], [216, 148], [188, 138], [172, 120]], 'c-heart') +
        line([[96, 152], [140, 128], [186, 138], [222, 154], [262, 128], [306, 152]], 'diaph') +
        blob([[140, 184], [154, 182], [162, 194], [158, 206], [162, 218], [154, 230], [140, 228], [134, 206]], 'c-kidney') +
        blob([[284, 184], [270, 182], [262, 194], [266, 206], [262, 218], [270, 230], [284, 228], [290, 206]], 'c-kidney')) +
      // branches that leave behind or beside the aorta (drawn first, the aorta covers their origins)
      S('carotis', R([[184, 38], [182, 22], [181, 16]], 6) + R([[181, 16], [176, 4]], 4) + R([[181, 16], [189, 5]], 4) + R([[214, 54], [216, 34], [218, 16]], 6) + R([[218, 16], [224, 4]], 4) + R([[218, 16], [211, 5]], 4)) +
      S('arcus', R([[200, 58], [190, 42], [180, 34], [160, 30], [140, 36], [120, 48]], 8) + R([[232, 56], [246, 40], [268, 32], [292, 40]], 7)) +
      S('aorta_asc', line([[194, 102], [180, 106], [170, 118]], 'v-red', W(3)) + line([[202, 102], [216, 104], [226, 114]], 'v-red', W(3))) +
      S('aorta_thor', icost) +
      S('aorta_abd', R([[216, 200], [190, 202], [164, 206]], 5) + R([[215, 198], [240, 200], [260, 206]], 5)) +
      S('femoralis', R([[162, 296], [156, 318], [152, 334]], 7) + R([[262, 296], [268, 318], [272, 334]], 7)) +
      S('iliaca', R([[186, 268], [192, 282], [198, 294]], 6) + R([[186, 268], [172, 282], [162, 296]], 7) + R([[212, 240], [198, 254], [186, 268]], 9) +
        R([[238, 268], [232, 282], [226, 294]], 6) + R([[238, 268], [252, 282], [262, 296]], 7) + R([[212, 240], [226, 254], [238, 268]], 9)) +
      line([[116, 272], [190, 306]], 'gg-ing') + line([[308, 272], [234, 306]], 'gg-ing') +
      // aorta: one continuous outline, then the four segments
      line(AO.asc, 'v-red-o', W(19)) + line(AO.arc, 'v-red-o', W(19)) + line(AO.thor, 'v-red-o', W(17)) + line(AO.abd, 'v-red-o', W(16)) +
      S('aorta_asc', line(AO.asc, 'v-red', W(16))) + S('arcus', line(AO.arc, 'v-red', W(16))) + S('aorta_thor', line(AO.thor, 'v-red', W(14))) + S('aorta_abd', line(AO.abd, 'v-red', W(13))) +
      // anterior branches lie in front of the aorta
      S('truncus_coel', R([[234, 166], [214, 172], [190, 170], [168, 162]], 5) + R([[234, 166], [250, 173], [262, 164], [276, 172], [290, 164], [304, 170]], 5) + R([[234, 166], [242, 158], [252, 154]], 4) + R([[223, 168], [234, 166]], 7)) +
      S('ams', R([[211, 196], [194, 188], [178, 186]], 4) + R([[207, 210], [186, 212], [166, 216]], 4) + R([[204, 228], [186, 236], [168, 244]], 4) + R([[220, 181], [210, 198], [206, 214], [204, 232]], 7)) +
      S('ami', R([[226, 230], [246, 222], [262, 212]], 3.5) + R([[235, 246], [252, 252], [264, 262]], 3.5) + R([[214, 222], [226, 230], [236, 242], [232, 260], [222, 278], [212, 296]], 4.5)) +
      zlabel(346, 158, 'Zwerchfell') + zlabel(82, 268, 'Leistenband') + zlabel(34, 332, 'rechts') + zlabel(366, 332, 'links'), 'Aorta und Hauptäste');
  };

  MAPS.gefaesse4 = () => {
    const CX = 110, CY = 440, A = 17, P = (r, a) => [CX + r * Math.sin(a * Math.PI / 180), CY - r * Math.cos(a * Math.PI / 180)];
    const pt = p => `${f(p[0])} ${f(p[1])}`;
    const sector = (ri, ro, cls) => path(`M${pt(P(ro, -A))}A${ro} ${ro} 0 0 1 ${pt(P(ro, A))}L${pt(P(ri, A))}A${ri} ${ri} 0 0 0 ${pt(P(ri, -A))}Z`, cls);
    const wavy = (r, amp, n, cls, a0 = -A, a1 = A) => { const pts = []; for (let a = a0; a <= a1 + .01; a += .5) pts.push(P(r + amp * Math.sin(a * n * Math.PI / 180), a)); return line(pts, cls); };
    const spind = (r, step, off, rx, ry, cls) => { let s = ''; for (let a = -A + 1.6 + off; a < A - 1.4; a += step) { const p = P(r, a); s += rot(p[0], p[1], rx, ry, a, cls); } return s; };
    const ringE = (cx, cy, rr, n, rx, ry, cls, off = 0) => { let s = ''; for (let i = 0; i < n; i++) { const a = i * 360 / n + off, x = cx + Math.cos(a * Math.PI / 180) * rr, y = cy + Math.sin(a * Math.PI / 180) * rr; s += rot(x, y, rx, ry, a + 90, cls); } return s; };
    const wcirc = (cx, cy, r, amp, n, cls) => { const pts = []; for (let a = 0; a < 360; a += 6) { const rr = r + amp * Math.sin(a * n * Math.PI / 180); pts.push([cx + Math.cos(a * Math.PI / 180) * rr, cy + Math.sin(a * Math.PI / 180) * rr]); } return path(cr(pts), cls); };
    const vl = [[340, 152], [339, 212], [333, 234], [340, 256], [340, 312]], vr = vl.map(([x, y]) => [708 - x, y]);
    const cusp = [[339, 258], [347, 240], [353, 215], [349, 214], [341, 234], [335, 248]];
    return svgw('0 0 400 320',
      // wall segment (muscular artery, cross-section): lumen inside, adventitia outside
      sector(210, 246, 'gg-lum') + [[-12, 232], [-3, 220], [8, 234], [13, 218]].map(([a, r]) => { const p = P(r, a); return rot(p[0], p[1], 7, 4.5, a, 'rbc'); }).join('') +
      S('adventitia', sector(330, 370, 'gg-adv') + wavy(342, 1.6, 9, 'gg-fib', -15, -2) + wavy(360, 1.6, 9, 'gg-fib', -8, 14) + wavy(350, 1.4, 11, 'gg-fib', 5, 15) +
        [[-10, 352, 'gg-vv-a', 4.5], [-6.6, 350, 'gg-vv-v', 5.5], [9, 354, 'gg-vv-a', 4], [12, 348, 'gg-vv-v', 5]].map(([a, r, c, rr]) => { const p = P(r, a); return circ(f(p[0]), f(p[1]), rr, c); }).join('') + (p => circ(f(p[0]), f(p[1]), 5, 'gg-nerve'))(P(352, 1.5))) +
      S('media', sector(274, 330, 'gg-med') + [282, 294, 306, 318].map((r, i) => spind(r, 4.4, i % 2 ? 2.2 : 0, 8.5, 2.6, 'gg-smc')).join('') + wavy(330, 1, 30, 'gg-eel')) +
      S('intima', sector(258, 274, 'gg-int') + [-13, -5, 3, 11].map(a => { const p = P(266, a); return rot(p[0], p[1], 3.5, 1.3, a, 'gg-int-n'); }).join('') + wavy(274, 1.4, 34, 'gg-iel')) +
      S('endothel', sector(246, 258, 'gg-endo') + spind(250, 5.2, .8, 6, 2.2, 'gg-endo-n')) +
      zlabel(110, 222, 'Lumen') + zlabel(110, 62, 'außen') +
      // elastic type: big lumen, many elastic membranes
      S('elast_typ', circ(268, 66, 44, 'gg-adv') + circ(268, 66, 40, 'gg-med-e') + [29, 32, 35, 38].map(r => circ(268, 66, r, 'gg-el')).join('') + circ(268, 66, 27, 'gg-int') + circ(268, 66, 25, 'gg-lum') + circ(268, 66, 25.5, 'gg-endo-l')) +
      // muscular type: thick muscle media, prominent internal elastic membrane
      S('muskel_typ', circ(358, 66, 34, 'gg-adv') + circ(358, 66, 29, 'gg-med') + ringE(358, 66, 25, 14, 4, 1.5, 'gg-smc') + ringE(358, 66, 19.5, 11, 4, 1.5, 'gg-smc', 15) + circ(358, 66, 15, 'gg-int') + wcirc(358, 66, 14.5, .9, 12, 'gg-iel') + circ(358, 66, 11, 'gg-lum') + circ(358, 66, 11.5, 'gg-endo-l')) +
      // capillary: endothelium, basal lamina, pericyte
      S('kapillare_g', blob([[290, 224], [296, 236], [292, 250], [276, 256], [264, 254], [280, 242]], 'gg-peri') + ell(286, 242, 5.5, 3, 'gg-peri-n') + circ(268, 220, 25, 'gg-bl') + circ(268, 220, 22, 'gg-endo') + circ(268, 220, 15.5, 'gg-lum') + ell(268, 220, 12, 8.5, 'rbc') + ell(268, 200.5, 9, 3.6, 'gg-endo-n')) +
      // vein with valve (longitudinal), flow towards the heart
      path(cr([...vl, ...vr.slice().reverse()], true, .5), 'gg-vlum') + line(vl, 'gg-vw') + line(vr, 'gg-vw') +
      line([[354, 304], [354, 270]], 'gg-flow') + arrow(354, 264, -90) + line([[354, 204], [354, 170]], 'gg-flow') + arrow(354, 164, -90) +
      S('venenklappe', blob(cusp, 'gg-cusp') + blob(cusp.map(([x, y]) => [708 - x, y]), 'gg-cusp') + hitc(354, 236, 17, 24)) +
      zlabel(354, 144, 'zum Herzen'), 'Gefäßwand');
  };

  MEDSVG.addMaps('gefaesse', [['gefaesse', 'Aorta & Äste', 3], ['gefaesse4', 'Gefäßwand', 4]], { gefaesse: MAPS.gefaesse, gefaesse4: MAPS.gefaesse4 });
  /* ================= Luftwege ================= */
  // head profile: front and back as smooth open lines, joined by straight edges at the viewBox border
  const headSil = (front, back) => path(cr(front, false) + cr(back, false).replace(/^M/, 'L') + 'Z', 'sil');
  MAPS.luftwege = () => {
    const front = [[52, 1], [46, 26], [42, 46], [26, 66], [14, 86], [22, 96], [32, 102], [30, 118], [34, 130], [30, 142], [36, 158], [40, 174], [58, 186], [96, 196], [110, 206], [116, 226], [118, 250], [116, 290], [118, 339]];
    const back = [[292, 339], [290, 250], [294, 190], [310, 146], [324, 96], [318, 44], [302, 1]];
    const vert = [[104, 138], [142, 172], [176, 206], [210, 240], [244, 274], [278, 308], [312, 340]].map(([a, b]) => `<rect x="224" y="${a}" width="30" height="${b - a}" rx="4" class="c-vert"/>`).join('') + ell(230, 94, 6, 7, 'c-vert');
    const rings = [282, 294, 306, 318, 330].map(y => ell(141, y, 4.5, 4, 'gg-cart')).join('');
    const brI = [[[349, 231], [338, 246], [330, 260]], [[351, 231], [364, 242], [374, 252]]];
    const twig = (pts) => line(pts, 'br', W(2));
    return svgw('0 0 400 340',
      headSil(front, back) + vert +
      S('pharynx', blob([[166, 64], [192, 54], [214, 62], [218, 110], [218, 200], [216, 264], [192, 266], [190, 240], [190, 214], [176, 204], [166, 190], [168, 160], [170, 130], [166, 100]], 'gg-phar')) +
      path('M189 262H215L216 339H186Z', 'gg-oes') + line([[201, 268], [201, 337]], 'gg-oes-l') +
      blob([[38, 140], [66, 124], [108, 118], [146, 124], [164, 140], [172, 162], [170, 184], [160, 198], [144, 200], [110, 196], [70, 180], [44, 160]], 'gg-tongue') +
      line([[36, 110], [90, 112], [136, 112]], 'gg-palate') + blob([[134, 108], [156, 111], [172, 122], [178, 140], [173, 145], [162, 132], [142, 120], [134, 118]], 'gg-soft') + ell(140, 204, 8, 4.5, 'gg-bone') +
      S('nasenhoehle', blob([[30, 98], [38, 74], [58, 52], [100, 44], [136, 48], [156, 60], [166, 80], [166, 104], [130, 108], [80, 110], [40, 106]], 'gg-air') +
        blob([[118, 62], [140, 57], [158, 64], [150, 70], [128, 70]], 'gg-concha') + blob([[76, 77], [120, 71], [160, 79], [150, 88], [100, 88], [80, 86]], 'gg-concha') + blob([[56, 94], [110, 88], [162, 95], [152, 104], [96, 104], [62, 102]], 'gg-concha')) +
      S('nebenhoehlen', blob([[56, 18], [72, 10], [88, 16], [86, 34], [68, 40], [56, 32]], 'gg-sinus') + blob([[150, 30], [170, 24], [190, 34], [188, 52], [166, 54], [152, 48]], 'gg-sinus')) +
      blob([[148, 226], [164, 208], [178, 192], [190, 198], [191, 216], [186, 240], [182, 262], [180, 272], [142, 272], [138, 252], [140, 234]], 'gg-air') +
      line([[140, 219], [160, 217], [178, 220]], 'gg-ff') + blob([[178, 226], [188, 222], [192, 238], [181, 242]], 'gg-cart-l') +
      S('stimmlippen', blob([[140, 229], [160, 226], [180, 229], [177, 236], [158, 238], [140, 236]], 'gg-vf')) +
      S('epiglottis', blob([[152, 222], [160, 208], [170, 192], [181, 174], [190, 160], [197, 157], [200, 165], [194, 180], [182, 198], [168, 214], [157, 226]], 'gg-epi')) +
      S('schildknorpel', blob([[119, 212], [130, 205], [140, 210], [140, 252], [132, 256], [124, 250], [120, 230]], 'gg-cart')) +
      S('ringknorpel', blob([[130, 260], [142, 258], [145, 270], [134, 274], [128, 268]], 'gg-cart') + blob([[180, 243], [193, 240], [196, 272], [182, 276], [178, 262]], 'gg-cart')) +
      S('trachea_lw', path('M140 276H180V339H140Z', 'gg-air') + rings + line([[180, 278], [180, 336]], 'gg-trm')) +
      zlabel(108, 166, 'Zunge') + zlabel(62, 334, 'vorn') +
      // inset: bronchial tree in the chest
      `<rect x="304" y="180" width="92" height="156" rx="10" class="frame"/>` + zlabel(350, 174, 'Brustraum') +
      ghost(blob([[338, 210], [318, 228], [311, 272], [313, 324], [340, 322], [346, 252]], 'c-lung') + blob([[362, 210], [382, 228], [389, 272], [387, 324], [360, 322], [354, 252]], 'c-lung')) +
      S('trachea_lw', tube([[350, 186], [350, 231]], 11, 'air') + [194, 204, 214, 224].map(y => `<path d="M345 ${y}h10" class="ring"/>`).join('')) +
      S('bronchialbaum', twig([[319, 226], [312, 216]]) + twig([[319, 226], [326, 214]]) + twig([[316, 286], [308, 294]]) + twig([[330, 316], [322, 326]]) + twig([[330, 316], [338, 326]]) + twig([[331, 298], [342, 306]]) + twig([[384, 222], [378, 212]]) + twig([[384, 222], [391, 214]]) + twig([[372, 316], [364, 326]]) + twig([[372, 316], [380, 326]]) + twig([[375, 290], [386, 298]]) +
        tube([[338, 246], [325, 236], [319, 226]], 5, 'air') + tube([[331, 258], [321, 272], [316, 286]], 4.5, 'air') + tube([[330, 260], [332, 290], [330, 316]], 5, 'air') +
        tube([[366, 244], [380, 233], [384, 222]], 4.5, 'air') + tube([[372, 252], [376, 284], [372, 316]], 5, 'air') +
        tube(brI[0], 9, 'air') + tube(brI[1], 7.5, 'air')), 'Atemwege im Sagittalschnitt');
  };

  MAPS.luftwege4 = () => {
    const slots = [0, 1, 2, 3, 4, 5, 6, 7].map(i => 14 + i * 22), GOB = [2, 5];
    const cil = slots.filter((x, i) => !GOB.includes(i)).map(x => [0, 1, 2, 3, 4, 5].map(k => { const x0 = x + 3 + k * 3.2; return `M${f(x0)} 70L${f(x0 + 2.4)} 56`; }).join('')).join('');
    const cells = slots.map((x, i) => GOB.includes(i) ? '' : `<path d="M${x + 1} 70H${x + 21}V150L${x + 16} 206H${x + 6}L${x + 1} 150Z" class="gg-ccell"/>` + ell(x + 11, 120 + (i % 3) * 13, 5, 9, 'gg-nuc')).join('');
    const basal = [1, 2, 3, 4, 5, 6, 7].map(i => { const xb = 14 + i * 22; return ell(xb, 197, 7, 9, 'gg-bcell') + circ(xb, 198, 3.4, 'gg-nuc'); }).join('');
    const gob = GOB.map(i => { const x = slots[i]; return blob([[x + 11, 71], [x + 20, 80], [x + 21, 124], [x + 16, 158], [x + 13, 206], [x + 9, 206], [x + 6, 158], [x + 1, 124], [x + 2, 80]], 'gg-gob') +
      [[6, 88], [14, 90], [10, 100], [5, 112], [16, 108], [11, 122], [6, 134], [15, 136], [10, 146], [11, 78]].map(([dx, y]) => circ(x + dx, y, 3.2, 'gg-mucd')).join('') + ell(x + 11, 178, 2.6, 6, 'gg-nuc') + circ(x + 11, 62, 3, 'gg-mucd') + circ(x + 13, 54, 2.4, 'gg-mucd'); }).join('');
    const mucus = path(cr([[10, 40], [40, 36], [70, 40], [100, 35], [130, 40], [160, 36], [194, 39]], false) + 'L194 52' + cr([[194, 52], [160, 50], [130, 53], [100, 49], [70, 53], [40, 50], [10, 52]], false).replace(/^M[^C]*/, '') + 'Z', 'gg-mucus');
    const R = (pts, w) => tube(pts, w, 'v-red'), B = (pts, w) => tube(pts, w, 'v-blue');
    const mx = pts => pts.map(([x, y]) => [600 - x, y]);
    const supL = [[252, 22], [262, 30], [272, 40], [281, 50]], supE = [[262, 30], [272, 60], [283, 88]];
    return svgw('0 0 400 320',
      `<rect x="6" y="6" width="192" height="308" rx="10" class="frame"/>` +
      line([[160, 27], [52, 27]], 'gg-flow') + arrow(44, 27, 180) + zlabel(106, 21, 'zum Rachen') +
      `<rect x="8" y="208" width="188" height="104" class="gg-lp"/>` +
      [[56, 250], [72, 258], [60, 270], [76, 274], [92, 262]].map(([x, y]) => circ(x, y, 8, 'gg-gland')).join('') + line([[74, 248], [80, 230], [84, 210]], 'gg-oes-l') +
      circ(150, 252, 10, 'gg-int') + ell(150, 252, 6, 4, 'rbc') + zlabel(102, 302, 'Lamina propria') +
      S('resp_epithel', cells + basal + line([[8, 208], [196, 208]], 'gg-bm')) +
      S('becher_lw', gob) +
      mucus + zlabel(102, 48, 'Schleim') +
      S('zilien', path(cil, 'gg-cil')) +
      // neck and upper chest from the front: larynx, trachea, vessels, nerves, nodes
      line([[276, 34], [300, 28], [324, 34]], 'gg-hyoid') +
      S('schildknorpel', blob([[278, 46], [300, 52], [322, 46], [320, 70], [310, 88], [300, 92], [290, 88], [280, 70]], 'gg-cart')) +
      S('ringknorpel', path('M283 93H317L318 107H282Z', 'gg-cart')) +
      path('M290 106H310V262H290Z', 'gg-air') + [116, 128, 140, 152, 164, 176, 188, 200, 212, 224, 236, 248].map(y => `<path d="M290 ${y}h20" class="ring"/>`).join('') +
      `<g class="inside">${B([[240, 7], [238, 100], [240, 168]], 7) + B([[360, 7], [362, 100], [360, 168]], 7) +
        R([[280, 300], [279, 256], [290, 232], [312, 220], [334, 226], [344, 246], [346, 300]], 12) +
        R([[282, 200], [262, 190], [240, 190], [214, 198]], 5) + R([[282, 200], [272, 170], [268, 4]], 5) + R([[296, 226], [282, 200]], 7) +
        R([[318, 220], [330, 184], [332, 4]], 5) + R([[332, 224], [356, 200], [392, 194]], 5)}</g>` +
      line([[252, 2], [252, 176], [258, 200], [266, 240], [272, 300]], 'gg-nvc') + line([[348, 2], [348, 182], [340, 212], [334, 236], [330, 270], [324, 300]], 'gg-nvc') +
      S('recurrens', line([[257, 198], [252, 210], [260, 216], [270, 208], [278, 182], [286, 140], [289, 106]], 'gg-nv') + line([[334, 238], [330, 252], [318, 257], [310, 246], [313, 210], [312, 150], [311, 106]], 'gg-nv')) +
      S('laryngeus_sup', line(supL, 'gg-nv-t', W(2.4)) + line(supE, 'gg-nv-t', W(2.4)) + line(mx(supL), 'gg-nv-t', W(2.4)) + line(mx(supE), 'gg-nv-t', W(2.4))) +
      S('lk_hals', line([[228, 30], [226, 70], [230, 96], [228, 122], [232, 150]], 'gg-lym') + line([[372, 30], [374, 70], [370, 96], [372, 122], [368, 150]], 'gg-lym') +
        [[228, 44], [226, 70], [230, 96], [228, 122], [232, 146], [372, 44], [374, 70], [370, 96], [372, 122], [368, 146]].map(([x, y]) => ell(x, y, 5, 6, 'gg-node')).join('')) +
      zlabel(226, 314, 'rechts') + zlabel(374, 314, 'links'), 'Atemwegsepithel und Kehlkopfnerven');
  };

  MEDSVG.addMaps('luftwege', [['luftwege', 'Atemwege im Schnitt', 3], ['luftwege4', 'Epithel & Nerven', 4]], { luftwege: MAPS.luftwege, luftwege4: MAPS.luftwege4 });
  /* ================= Speiseröhre ================= */
  MAPS.speiseroehre = () => {
    const poly = (pts, cls) => path(cr(pts, true, .45), cls);
    return svgw('0 0 400 340',
      ghost(blob([[150, 186], [176, 172], [214, 170], [246, 182], [258, 208], [246, 230], [214, 236], [180, 230], [156, 214]], 'c-heart')) +
      tube([[176, 196], [174, 144], [180, 120], [194, 108], [212, 106], [226, 116], [231, 136], [232, 160], [230, 200], [226, 240], [220, 290], [217, 329]], 13, 'v-red') +
      line([[60, 244], [96, 214], [146, 204], [186, 216], [199, 230]], 'diaph') + line([[231, 236], [256, 216], [296, 206], [336, 214], [366, 240]], 'diaph') +
      blob([[232, 288], [244, 268], [256, 250], [276, 230], [304, 228], [326, 244], [334, 272], [328, 300], [306, 322], [276, 330], [250, 326], [236, 312], [234, 298]], 'c-stomach') +
      `<g class="inside">${path('M178 1H230' + cr([[230, 1], [222, 18], [214, 32], [194, 32], [184, 18], [178, 1]], false).replace(/^M[^C]*/, '') + 'Z', 'gg-phar')}</g>` +
      S('pars_cerv', path('M195 46H214L215 86H196Z', 'gg-oe cerv')) +
      S('pars_thor', poly([[196, 86], [196, 128], [197, 138], [196, 150], [197, 180], [202, 222], [210, 253.6], [224, 242.4], [221, 224], [216, 182], [213, 152], [209, 139], [214, 126], [215, 86]], 'gg-oe thor')) +
      S('pars_abd', poly([[210, 253.6], [222, 269.6], [234, 285.6], [248, 274.4], [236, 258.4], [224, 242.4]], 'gg-oe abd')) +
      S('aortenenge', hitc(206, 140, 14, 17) + blob([[214, 124], [221, 132], [222, 141], [220, 151], [213, 156], [209, 139]], 'gg-imp')) +
      S('ues_oben', path('M191 31H217L218 47H192Z', 'gg-sph')) +
      S('ues_unten', path(cr([[239.6, 260.8], [244.6, 267], [224.4, 283.2], [219.4, 277]], true, .3), 'gg-sph')) +
      S('hiatus', line([[198, 224], [202, 240], [208, 257]], 'gg-crus') + line([[227, 220], [231, 234], [234, 247]], 'gg-crus')) +
      `<g class="inside">${tube([[180, 40], [180, 148]], 16, 'air')}${[52, 64, 76, 88, 100, 112, 124, 136].map(y => `<path d="M172 ${y}h16" class="ring"/>`).join('')}${tube([[178, 148], [162, 166], [148, 180]], 11, 'air')}${tube([[182, 148], [206, 162], [234, 176]], 10, 'air')}` +
      blob([[166, 4], [180, 10], [194, 4], [192, 20], [180, 28], [168, 20]], 'gg-cart') + path('M169 31H191V41H169Z', 'gg-cart') + `</g>` +
      zlabel(134, 44, 'C6') + zlabel(134, 142, 'Th4') + zlabel(134, 240, 'Th10') + zlabel(84, 206, 'Zwerchfell') + zlabel(292, 292, 'Magen'), 'Speiseröhre mit Engen');
  };

  MAPS.speiseroehre4 = () => {
    let sq = `<rect x="8" y="30" width="184" height="50" class="gg-sq"/>`;
    for (let x = 12; x < 186; x += 20) sq += ell(x + 9, 34, 9.5, 2.8, 'gg-sq-f') + ell(x + 9, 34, 3, 1, 'gg-nuc');
    [44, 54, 64].forEach((y, r) => { for (let x = 14 + (r % 2) * 6; x < 190; x += 12) sq += ell(x, y, 5.6, 4.6, 'gg-sq-c') + circ(x, y, 1.8, 'gg-nuc'); });
    for (let x = 10; x < 188; x += 8) sq += `<rect x="${x}" y="70" width="6.5" height="10" rx="2" class="gg-sq-b"/>` + circ(x + 3.2, 75, 1.8, 'gg-nuc');
    let cm = '', lm = '';
    [192, 203, 214].forEach((y, r) => { for (let x = 13 + (r % 2) * 4.5; x < 190; x += 9) cm += ell(x, y, 3.8, 3.2, 'gg-cm'); });
    [236, 246, 256].forEach((y, r) => { for (let x = 22 + (r % 2) * 15; x < 186; x += 30) lm += ell(x, y, 13, 2.6, 'gg-lm'); });
    const acin = (cx, cy) => [[0, 0], [11, 4], [-9, 7], [3, 12], [12, 15], [-6, 18]].map(([dx, dy]) => circ(cx + dx, cy + dy, 6.5, 'gg-gland')).join('');
    const Z = [[272, 184], [277, 193], [282, 182], [287, 194], [292, 183], [297, 193], [302, 184]];
    const zd = Z.map(p => `${p[0]} ${p[1]}`).join('L');
    const vA = [[230, 40], [252, 42], [276, 52], [278, 90], [276, 130], [279, 170], [277, 206], [268, 230]];
    const vB = [[230, 66], [252, 64], [288, 74], [290, 110], [288, 150], [291, 190], [287, 218], [270, 232]];
    return svgw('0 0 400 320',
      // wall layers (longitudinal cut)
      zlabel(100, 22, 'Lumen') + `<rect x="8" y="80" width="184" height="22" class="gg-lp"/><rect x="8" y="102" width="184" height="8" class="gg-mm"/><rect x="8" y="110" width="184" height="72" class="gg-adv"/>` +
      [24, 70, 116, 162].map(x => ell(x, 106, 12, 1.8, 'gg-smc')).join('') + zlabel(100, 126, 'Submukosa') +
      S('druesen_oes', acin(44, 144) + acin(146, 150) + line([[46, 144], [48, 110], [46, 80], [47, 30]], 'gg-oes-l', 'style="stroke:#9C82A8;stroke-width:2.4"') + line([[148, 150], [150, 110], [147, 80], [148, 30]], 'gg-oes-l', 'style="stroke:#9C82A8;stroke-width:2.4"')) +
      S('plattenepithel', sq) +
      S('oes_venen', ell(94, 140, 9, 5.5, 'gg-vv-v') + ell(114, 166, 7, 4.5, 'gg-vv-v') + ell(178, 140, 6, 4.5, 'gg-vv-v') + ell(20, 132, 6, 4.5, 'gg-vv-v') + ell(84, 172, 5, 3.6, 'gg-vv-v')) +
      S('muskularis_oes', `<rect x="8" y="184" width="184" height="38" class="gg-med"/><rect x="8" y="228" width="184" height="38" class="gg-med"/>` + cm + lm) +
      [40, 106, 170].map(x => ell(x, 225, 6, 2.6, 'gg-nerve')).join('') +
      `<rect x="8" y="266" width="184" height="46" class="gg-adv"/>` + line([[20, 282], [40, 278], [60, 284], [80, 279]], 'gg-fib') + line([[110, 292], [130, 287], [150, 293], [170, 288]], 'gg-fib') + zlabel(100, 304, 'Adventitia') +
      // lower oesophagus and cardia from the front, with a window into the mucosa
      `<g class="inside">${tube([[222, 8], [222, 108]], 8, 'v-blue')}${tube([[262, 240], [238, 270], [214, 300]], 6, 'v-blue')}</g>` +
      line([[206, 146], [230, 150], [262, 156]], 'diaph') + line([[322, 156], [360, 148], [396, 152]], 'diaph') +
      blob([[262, 204], [268, 190], [316, 190], [326, 176], [350, 168], [378, 180], [392, 214], [390, 262], [372, 294], [340, 310], [302, 310], [272, 298], [256, 274], [252, 236]], 'c-stomach') +
      S('muskularis_oes', path('M268 4H316V192Q292 204 268 192Z', 'gg-oe thor', 'style="stroke-dasharray:none"') + line([[274, 10], [274, 190]], 'gg-oes-l') + line([[310, 10], [310, 190]], 'gg-oes-l')) +
      `<clipPath id="gg-oes-win"><rect x="272" y="128" width="30" height="98" rx="6"/></clipPath><g clip-path="url(#gg-oes-win)">` +
      S('plattenepithel', path(`M272 120H302V184L${Z.slice().reverse().map(p => `${p[0]} ${p[1]}`).join('L')}Z`, 'gg-sq')) +
      path(`M${zd}V236H272Z`, 'gg-gast') + `</g>` + `<rect x="272" y="128" width="30" height="98" rx="6" class="gg-win"/>` +
      S('zlinie', path(`M${zd}`, 'gg-zl')) +
      S('oes_venen', line(vA, 'gg-ven-t') + line(vB, 'gg-ven-t')) +
      S('vagus_oes', line([[340, 4], [330, 28], [312, 44]], 'gg-nv') + line([[256, 4], [272, 22], [300, 38]], 'gg-nv-d') +
        line([[312, 44], [300, 70], [312, 96], [300, 122], [306, 148]], 'gg-nv-t') + line([[300, 38], [312, 64], [298, 90], [312, 116], [313, 148]], 'gg-nv-t') +
        line([[306, 148], [305, 172], [307, 200], [300, 238], [292, 262]], 'gg-nv') + line([[313, 148], [318, 176], [326, 208], [338, 238]], 'gg-nv-d')) +
      zlabel(222, 122, 'V. azygos') + zlabel(238, 314, 'zur Pfortader') + zlabel(366, 140, 'Zwerchfell') + zlabel(352, 254, 'Magen'), 'Wand der Speiseröhre');
  };

  MEDSVG.addMaps('speiseroehre', [['speiseroehre', 'Speiseröhre', 3], ['speiseroehre4', 'Wand & Z-Linie', 4]], { speiseroehre: MAPS.speiseroehre, speiseroehre4: MAPS.speiseroehre4 });
  /* ================= Gallenblase ================= */
  const joinOpen = (a, b) => cr(a, false) + cr(b, false).replace(/^M/, 'L') + 'Z';
  MAPS.gallenblase = () => {
    const Q = { t3L: [75, 166], t3R: [125.4, 198.6], t5L: [99, 139.5], t5R: [140, 171.5], t68L: [124.9, 119.9], t68R: [152.7, 145.7], t75L: [135.5, 113.2], t75R: [158.3, 135.6], t9L: [158.5, 99.6], t9R: [171.9, 114.6], t1L: [173.6, 90.6], t1R: [182.4, 101.4] };
    const fundus = path(cr([Q.t3R, [103, 238.9], [86, 254.2], [63.1, 253], [47.8, 236], [49, 213.1], Q.t3L], false) + 'Z', 'gg-gb fu');
    const corpus = path(joinOpen([Q.t3L, Q.t5L, Q.t68L], [Q.t68R, Q.t5R, Q.t3R]), 'gg-gb co');
    const collum = path(joinOpen([Q.t68L, Q.t75L, Q.t9L, Q.t1L], [Q.t1R, Q.t9R, Q.t75R, Q.t68R]), 'gg-gb cl');
    const B = (pts, w) => tube(pts, w, 'gg-bile');
    const cyst = [[178, 96], [196, 103], [210, 120], [218, 142], [222, 166]];
    const zig = (pts, amp, step) => { const out = []; let k = 0; for (let i = 0; i < pts.length - 1; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L, ny = (x2 - x1) / L; for (let d = 0; d < L; d += step) { const t = d / L, s2 = (k++ % 2 ? 1 : -1) * amp; out.push([x1 + (x2 - x1) * t + nx * s2, y1 + (y2 - y1) * t + ny * s2]); } } return out.map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join(''); };
    const liver = 'M1 1H399V70' + cr([[399, 70], [350, 92], [300, 98], [250, 100], [214, 106], [184, 124], [154, 156], [120, 186], [82, 198], [40, 196], [1, 186]], false).replace(/^M[^C]*/, '') + 'Z';
    return svgw('0 0 400 320',
      ghost(path(liver, 'c-liver') + blob([[338, 186], [360, 174], [392, 172], [394, 212], [360, 214], [338, 206]], 'c-stomach')) +
      line([[338, 196], [290, 192], [254, 196], [236, 216], [234, 256], [242, 290], [278, 301], [330, 298]], 'duo-c') + line([[338, 196], [290, 192], [254, 196], [236, 216], [234, 256], [242, 290], [278, 301], [330, 298]], 'duo-ci') +
      blob([[256, 216], [290, 212], [330, 222], [340, 250], [326, 284], [290, 290], [262, 282], [252, 256]], 'gg-panc') + line([[338, 250], [300, 256], [266, 262], [252, 262]], 'pduct') +
      S('calot', path('M184 98L196 103L210 120L218 142L222 166L227 110L229 84L204 86Z', 'gg-calot')) +
      S('fundus_g', fundus) + S('corpus_g', corpus) + S('collum', collum) +
      S('hepaticus', B([[204, 46], [218, 58], [230, 66]], 4) + B([[270, 42], [248, 56], [231, 66]], 4) + B([[230, 64], [228, 110], [222, 166]], 6)) +
      S('cysticus_g', B(cyst, 5) + path(zig([[182, 97], [196, 103], [210, 120], [218, 142], [221, 158]], 1.4, 3), 'gg-spiral')) +
      S('choledochus_g', B([[222, 164], [225, 176], [230, 186]], 7) + line([[230, 186], [242, 204], [254, 224], [257, 246], [250, 262]], 'gg-bile-r', W(6))) +
      S('oddi', circ(248, 262, 6.5, 'gg-oddi')) +
      zlabel(300, 40, 'Leber') + zlabel(190, 282, 'Duodenum') + zlabel(298, 278, 'Pankreas'), 'Gallenblase und Gallenwege');
  };

  MAPS.gallenblase4 = () => {
    const folds = [[24, 70], [52, 58], [80, 74], [108, 56], [136, 68], [164, 60], [188, 78]];
    const foldPath = folds.map(([cx, top], i) => { const l = cx - 9, r = cx + 9; return `${i ? 'L' : 'M8 120L'}${l} 120C${l} ${top + 20} ${l + 2} ${top} ${cx} ${top}C${r - 2} ${top} ${r} ${top + 20} ${r} 120`; }).join('') + 'L192 120';
    const mucosa = path(foldPath + 'V160H8Z', 'gg-gbf');
    const epi = path(foldPath, 'epi', W(9)) + path(foldPath, 'gg-epn');
    let smc = '';
    [[24, 172, 20], [50, 184, -25], [80, 172, 10], [104, 192, 40], [130, 176, -15], [160, 188, 25], [182, 172, -35], [36, 196, -5], [70, 198, 30], [146, 200, -10], [176, 200, 15], [118, 166, 0]].forEach(([x, y, a]) => { smc += rot(x, y, 13, 3.6, a, 'gg-smc-b'); });
    const R = (pts, w) => tube(pts, w, 'v-red');
    const mic = (x, y) => circ(x, y, 5, 'gg-mic') + [0, 60, 120, 180, 240, 300].map(a => { const r = a * Math.PI / 180; return line([[x + Math.cos(r) * 5, y + Math.sin(r) * 5], [x + Math.cos(r) * 8.5, y + Math.sin(r) * 8.5]], 'gg-mic-s'); }).join('');
    return svgw('0 0 400 320',
      // wall of the gallbladder
      `<rect x="6" y="6" width="192" height="308" rx="10" class="frame"/><rect x="8" y="8" width="188" height="112" class="gg-blum"/>` + zlabel(100, 26, 'Lumen (Galle)') +
      S('schleimhaut_g', mucosa + epi) +
      S('muskularis_g', `<rect x="8" y="160" width="188" height="48" class="gg-lp"/>` + smc) +
      `<rect x="8" y="208" width="188" height="56" class="gg-adv"/>` + circ(60, 232, 5, 'gg-vv-a') + circ(74, 236, 6, 'gg-vv-v') + circ(150, 240, 4.5, 'gg-vv-a') + zlabel(110, 240, 'Subserosa') +
      `<rect x="8" y="264" width="188" height="9" class="gg-serosa"/>` + zlabel(100, 292, 'Serosa') +
      // Calot triangle with the cystic artery
      `<g class="inside">${path('M206 8H396V34Q330 44 300 42Q260 40 206 52Z', 'c-liver')}</g>` +
      path('M262 110L290 128L303 146L308 46L268 44Z', 'gg-calot', 'style="pointer-events:none"') +
      blob([[206, 96], [230, 90], [252, 98], [264, 112], [256, 126], [236, 132], [206, 140]], 'gb') +
      tube([[260, 112], [276, 118], [290, 130], [303, 148]], 5, 'gg-bile') + tube([[310, 40], [308, 100], [304, 150], [302, 160]], 6, 'gg-bile') +
      line([[362, 160], [352, 120], [342, 80], [340, 40]], 'gg-art') + line([[342, 74], [320, 70], [296, 66], [274, 56]], 'gg-art') +
      S('a_cystica', R([[292, 66], [282, 80], [270, 94], [259, 104]], 3) + R([[259, 104], [240, 98], [222, 100]], 2.4) + R([[259, 104], [244, 118], [226, 126]], 2.4)) +
      zlabel(226, 156, 'Gallenblase') +
      // enterohepatic circulation (icon)
      `<rect x="208" y="168" width="188" height="146" rx="10" class="frame"/>` +
      blob([[224, 186], [262, 178], [300, 182], [306, 196], [284, 210], [248, 216], [226, 206]], 'c-liver') + zlabel(256, 200, 'Leber') +
      line([[272, 210], [274, 236], [276, 262]], 'bile') + blob([[252, 214], [266, 214], [270, 230], [260, 240], [250, 232]], 'gb') +
      tube([[226, 272], [300, 272], [366, 272]], 16, 'gg-gut') + tube([[366, 272], [382, 286], [384, 300]], 12, 'gg-gut') + zlabel(250, 296, 'Darm') +
      S('enterohep', tube([[358, 262], [372, 236], [366, 208], [340, 194], [310, 190]], 5, 'v-portal') + `<path d="M306 190L314 185L314 195Z" class="gg-arrow"/>` + line([[348, 264], [354, 252]], 'gg-flow') + line([[336, 264], [342, 252]], 'gg-flow')) +
      zlabel(336, 222, 'Pfortader') +
      S('gallensaeuren', mic(302, 272) + mic(326, 272)) +
      S('bilirubin', [[273, 222], [274, 236], [275, 250], [254, 271], [238, 273]].map(([x, y]) => circ(x, y, 2.8, 'gg-bili')).join('') + line([[384, 290], [384, 304]], 'gg-bili-a') + `<path d="M378 302L390 302L384 311Z" class="gg-bili-h"/>`) +
      zlabel(356, 308, 'Stuhl'), 'Gallenblasenwand und Kreislauf der Galle');
  };

  MEDSVG.addMaps('gallenblase', [['gallenblase', 'Gallenblase & Gänge', 3], ['gallenblase4', 'Wand & Kreislauf', 4]], { gallenblase: MAPS.gallenblase, gallenblase4: MAPS.gallenblase4 });
  /* ================= Harnwege ================= */
  MAPS.harnwege = () => {
    const OUT = [[200, 40], [262, 44], [302, 72], [314, 120], [302, 166], [266, 192], [228, 202], [214, 212], [214, 226], [186, 226], [186, 212], [172, 202], [134, 192], [98, 166], [86, 120], [98, 72], [138, 44]];
    const IN = [[200, 56], [254, 60], [288, 82], [298, 120], [288, 158], [256, 180], [222, 190], [200, 196], [178, 190], [144, 180], [112, 158], [102, 120], [112, 82], [146, 60]];
    const MID = [[146, 52], [200, 48], [258, 52], [296, 78], [306, 120], [296, 162], [262, 186]];
    const U = (pts, w) => tube(pts, w, 'ur');
    return svgw('0 0 400 340',
      S('ureter_h', U([[56, 8], [60, 50], [80, 104], [104, 146]], 9) + U([[344, 8], [340, 50], [320, 104], [296, 146]], 9)) +
      S('detrusor', path(cr(OUT, true, .7), 'gg-detr') + line(MID, 'gg-detr-f') + line(MID.map(([x, y]) => [400 - x, y]).reverse(), 'gg-detr-f')) +
      S('sphinkter_int', blob([[182, 199], [218, 199], [220, 213], [200, 218], [180, 213]], 'gg-sphi')) + path('M197 194H203V226H197Z', 'gg-canal') +
      S('blase', path(cr(IN, true, .7), 'gg-bl-lum') + line([[130, 92], [160, 82], [190, 92], [220, 82], [250, 92], [272, 86]], 'gg-rug') + line([[118, 118], [150, 108], [180, 120], [214, 108], [246, 120], [282, 112]], 'gg-rug') + line([[124, 144], [150, 136], [176, 142]], 'gg-rug') + line([[226, 142], [252, 136], [278, 144]], 'gg-rug')) +
      S('trigonum', path('M148 152Q200 142 252 152L205 189Q200 193 195 189Z', 'gg-trig') + ell(150, 152, 5, 2.4, 'gg-orif') + ell(250, 152, 5, 2.4, 'gg-orif') + ell(200, 190, 3.4, 2.6, 'gg-orif')) +
      // female (left) and male (right) urethra, sagittal, front to the left
      `<rect x="6" y="234" width="190" height="104" rx="10" class="frame"/><rect x="204" y="234" width="190" height="104" rx="10" class="frame"/>` +
      zlabel(172, 330, 'Frau') + zlabel(370, 330, 'Mann') + zlabel(28, 330, 'vorn') +
      blob([[34, 246], [50, 244], [56, 262], [52, 286], [36, 288], [30, 266]], 'gg-bone') +
      blob([[66, 242], [150, 240], [158, 250], [112, 258], [84, 256], [66, 250]], 'c-bladder') +
      tube([[136, 254], [126, 286], [116, 318]], 12, 'gg-vag') + line([[70, 312], [88, 316], [112, 326]], 'gg-lab') +
      S('sphinkter_ext', rot(95, 282, 14, 6, 18, 'gg-sphe')) +
      S('urethra_w', U([[104, 254], [96, 280], [87, 308]], 7)) +
      blob([[226, 246], [242, 244], [248, 262], [244, 286], [228, 288], [222, 266]], 'gg-bone') +
      blob([[288, 242], [376, 240], [382, 252], [350, 260], [316, 260], [290, 252]], 'c-bladder') +
      ell(322, 274, 22, 15, 'c-prostate') + tube([[300, 312], [272, 318], [254, 312], [240, 318], [234, 326]], 16, 'gg-pen') +
      line([[262, 298], [302, 296]], 'gg-pf') + line([[336, 296], [388, 300]], 'gg-pf') +
      S('sphinkter_ext', rot(319, 297, 14, 6, 12, 'gg-sphe')) + S('sphinkter_int', rot(322, 258, 10, 5, 0, 'gg-sphi')) +
      S('urethra_m', U([[322, 256], [322, 286], [318, 298], [302, 312], [274, 316], [256, 310], [242, 316], [236, 326]], 6)) +
      zlabel(352, 290, 'Prostata'), 'Harnblase und Harnröhre');
  };

  MAPS.harnwege4 = () => {
    let uro = '';
    [[10, 4], [56, 3], [102, 4], [148, 3]].forEach(([x]) => { uro += path(`M${x} 58V44Q${x} 28 ${x + 23} 28Q${x + 46} 28 ${x + 46} 44V58Z`, 'gg-umb') + circ(x + 15, 44, 3.4, 'gg-nuc') + circ(x + 31, 44, 3.4, 'gg-nuc'); });
    [62, 80].forEach((y, r) => { for (let x = 10 + r * 9; x < 186; x += 18) uro += `<rect x="${x}" y="${y}" width="17" height="17" rx="5" class="gg-int-u"/>` + circ(x + 8.5, y + 8.5, 2.8, 'gg-nuc'); });
    for (let x = 10; x < 190; x += 11) uro += `<rect x="${x}" y="99" width="10" height="11" rx="3" class="gg-bas-u"/>` + circ(x + 5, 104.5, 2, 'gg-nuc');
    const R = (pts, w) => tube(pts, w, 'v-red');
    return svgw('0 0 400 320',
      // urothelium
      `<rect x="6" y="6" width="192" height="146" rx="10" class="frame"/><rect x="8" y="8" width="188" height="22" class="gg-urine"/>` + zlabel(102, 22, 'Lumen (Harn)') +
      `<rect x="8" y="112" width="188" height="38" class="gg-lp"/>` + circ(150, 130, 8, 'gg-int') + ell(150, 130, 5, 3.4, 'rbc') + line([[8, 112], [196, 112]], 'gg-bm', 'style="pointer-events:none"') +
      S('urothel', uro) +
      // intramural course of the ureter
      `<rect x="6" y="160" width="192" height="154" rx="10" class="frame"/><rect x="8" y="210" width="188" height="52" class="gg-detr"/><rect x="8" y="262" width="188" height="50" class="gg-urine"/>` +
      line([[8, 264], [196, 264]], 'gg-trm', 'style="stroke:#E2AFA4;stroke-width:4;pointer-events:none"') +
      tube([[16, 168], [40, 186], [62, 212]], 11, 'ur') +
      S('intramural', tube([[62, 212], [104, 236], [150, 260]], 9, 'ur') + ell(156, 264, 7, 2.6, 'gg-orif')) +
      [80, 110, 140].map(x => line([[x + 10, 304], [x + 10, 288]], 'gg-flow') + arrow(x + 10, 282, -90)).join('') +
      zlabel(150, 186, 'außen') + zlabel(64, 300, 'Blasendruck') +
      // innervation and arteries of the bladder
      `<rect x="372" y="14" width="18" height="240" rx="9" class="gg-cord"/>` + zlabel(344, 62, 'Th11–L2') + zlabel(346, 248, 'S2–S4') +
      `<g class="inside">${R([[214, 14], [216, 110], [220, 200]], 7)}</g>` +
      blob([[236, 120], [270, 110], [304, 120], [316, 160], [302, 200], [282, 214], [256, 214], [234, 200], [222, 160]], 'c-bladder') +
      line([[214, 270], [252, 266]], 'gg-pf') + line([[284, 266], [330, 270]], 'gg-pf') + rot(268, 267, 12, 5, 0, 'gg-sphe') + tube([[268, 212], [268, 296]], 6, 'ur') +
      S('a_vesicales', R([[216, 92], [232, 104], [244, 120]], 3.5) + R([[220, 186], [236, 200], [252, 210]], 3.5)) +
      S('sympathikus_b', line([[372, 62], [346, 72], [328, 94], [318, 112]], 'gg-nv-d') + line([[318, 112], [302, 126], [292, 140]], 'gg-nv-d') + line([[318, 112], [308, 166], [284, 206]], 'gg-nv-d') + ell(318, 112, 7, 5, 'gg-gang')) +
      S('splanchnici_pelv', line([[372, 220], [344, 212], [320, 194], [302, 182]], 'gg-nv') + line([[344, 212], [330, 214], [312, 204]], 'gg-nv')) +
      S('pudendus', line([[372, 240], [350, 258], [316, 272], [282, 268]], 'gg-nv', W(4))) +
      zlabel(270, 166, 'Blase'), 'Urothel, Harnleiterventil, Innervation');
  };

  MEDSVG.addMaps('harnwege', [['harnwege', 'Blase & Harnröhre', 3], ['harnwege4', 'Feinbau & Nerven', 4]], { harnwege: MAPS.harnwege, harnwege4: MAPS.harnwege4 });
  /* ================= Milz ================= */
  MAPS.milz = () => {
    const E = (a, d) => [60 + (182 - d) * Math.cos(a * Math.PI / 180), 150 + (152 - d) * Math.sin(a * Math.PI / 180)];
    const arcPts = (d, a0, a1, st) => { const o = []; for (let a = a0; a <= a1 + .01; a += st) o.push(E(a, d)); return o; };
    const SPL = [[176, 100], [196, 102], [208, 129], [209.4, 160.4], [201, 191], [182.9, 218.9], [156.4, 241.9], [130, 246], [139.2, 208], [157, 191], [154, 172], [170.9, 161.4], [170.9, 138.6], [165.2, 122]];
    const trab = [-12, 8, 28, 46].map(a => line([E(a, 32), E(a, 48)], 'gg-trab')).join('');
    const ribs = [-30, -10, 10, 30, 50, 70].map(a => { const p = E(a, 2); return rot(p[0], p[1], 7, 4.5, a + 90, 'gg-bone'); }).join('');
    const R = (pts, w) => tube(pts, w, 'v-red'), V = (pts, w) => tube(pts, w, 'v-blue');
    const face = [[300, 40], [338, 34], [370, 56], [384, 104], [382, 160], [368, 214], [340, 250], [306, 262], [284, 244], [290, 214], [282, 184], [290, 150], [280, 118], [284, 80]];
    return svgw('0 0 400 320',
      // transverse section of the left upper abdomen (seen from below, front at the top)
      `<clipPath id="gg-milz-q"><rect x="4" y="4" width="242" height="312" rx="10"/></clipPath><rect x="4" y="4" width="242" height="312" rx="10" class="frame"/><g clip-path="url(#gg-milz-q)">` +
      ell(60, 150, 182, 152, 'sil') + ribs + line(arcPts(14, -40, 80, 10), 'diaph') +
      circ(20, 270, 22, 'gg-bone') + circ(36, 232, 10, 'gg-vv-a') +
      blob([[74, 212], [100, 204], [120, 214], [126, 238], [116, 262], [94, 268], [76, 254], [70, 232]], 'c-kidney') +
      blob([[16, 40], [76, 28], [124, 40], [146, 70], [148, 110], [132, 140], [94, 150], [46, 140], [16, 110]], 'c-stomach') +
      blob([[30, 184], [70, 176], [110, 172], [146, 170], [152, 180], [120, 186], [80, 192], [34, 196]], 'panc') +
      S('kapsel_m', path(cr(SPL, true, .7), 'gg-spl') + trab + path(cr(SPL, true, .7), 'gg-caps')) +
      S('facies_diaph', line(arcPts(26, -22, 54, 8), 'gg-fd')) +
      S('facies_visc', line([[160, 123], [165, 139], [165, 158]], 'gg-fv') + line([[151, 195], [134, 210], [125, 238]], 'gg-fv')) +
      S('baender_m', line([[146, 96], [156, 128], [158, 160]], 'gg-lig2') + line([[151, 92], [162, 126], [164, 158]], 'gg-lig2') + line([[150, 188], [134, 200], [120, 212]], 'gg-lig2') + line([[155, 192], [139, 205], [125, 217]], 'gg-lig2')) +
      S('v_lien', V([[6, 206], [60, 200], [96, 196], [128, 190], [146, 184], [156, 178]], 5)) +
      S('a_lien', R([[38, 222], [40, 196], [52, 172], [72, 170], [90, 164], [108, 168], [126, 161], [142, 166], [154, 172]], 4)) +
      S('hilus_m', rot(157, 175, 5.5, 11, 25, 'gg-hil')) +
      `</g>` + zlabel(206, 22, 'vorn') + zlabel(80, 92, 'Magen') + zlabel(98, 244, 'Niere') +
      // visceral surface seen from the inside
      `<rect x="252" y="4" width="144" height="312" rx="10" class="frame"/>` + zlabel(324, 22, 'Innenseite') +
      S('facies_visc', path(cr(face, true, .7), 'gg-spl') + path(cr([[296, 52], [334, 48], [358, 74], [352, 112], [322, 116], [300, 96]], true, .7), 'gg-imp-d') + path(cr([[336, 176], [368, 176], [364, 214], [340, 240], [330, 214]], true, .7), 'gg-imp-d') + line([[282, 96], [292, 98]], 'gg-trab') + line([[282, 136], [292, 138]], 'gg-trab')) +
      blob([[254, 292], [282, 276], [306, 250], [318, 230], [326, 236], [314, 262], [288, 290], [258, 306]], 'panc') +
      S('hilus_m', rot(326, 150, 7, 30, 8, 'gg-hil')) +
      S('v_lien', V([[322, 176], [328, 186]], 3) + V([[256, 282], [278, 266], [298, 240], [312, 208], [322, 176], [326, 160]], 6)) +
      S('a_lien', R([[318, 160], [326, 132]], 3) + R([[318, 160], [330, 150]], 3) + R([[312, 170], [328, 170]], 3) + R([[256, 254], [268, 244], [262, 230], [276, 220], [270, 206], [288, 194], [302, 176], [318, 160]], 5)) +
      zlabel(282, 312, 'Pankreas'), 'Milz: Querschnitt und Innenseite');
  };

  MAPS.milz4 = () => {
    let rbc = '';
    [[24, 120], [40, 200], [30, 250], [70, 290], [110, 300], [176, 292], [236, 240], [250, 180], [232, 120], [200, 30], [140, 24], [60, 30], [20, 72], [244, 300], [96, 248]].forEach(([x, y], i) => { rbc += ell(x, y, 4.2, 2.8, 'rbc') + ell(x + 9, y + 5, 4.2, 2.8, 'rbc'); });
    const sinus = (pts) => blob(pts, 'gg-sin');
    const sinuses = sinus([[18, 42], [60, 34], [104, 40], [102, 50], [60, 46], [20, 54]]) + sinus([[150, 38], [198, 34], [242, 46], [240, 56], [198, 46], [152, 50]]) + sinus([[226, 70], [252, 76], [252, 140], [242, 140], [242, 84], [224, 80]]) +
      sinus([[14, 140], [24, 136], [30, 196], [20, 230], [12, 228], [18, 196]]) + sinus([[60, 300], [110, 290], [160, 300], [158, 308], [110, 300], [62, 310]]) + sinus([[200, 250], [214, 246], [244, 270], [236, 278], [210, 262]]);
    const rbcIn = [[60, 41], [200, 41], [246, 108], [21, 180], [110, 300], [224, 262]].map(([x, y]) => ell(x, y, 4, 2.6, 'rbc')).join('');
    const wp = (x, y) => circ(x, y, 15, 'gg-wp') + circ(x, y, 3.5, 'gg-vv-a');
    let staves = '';
    for (let x = 284; x < 380; x += 14) staves += `<rect x="${x}" y="64" width="10" height="196" rx="5" class="gg-stave"/>`;
    return svgw('0 0 400 320',
      S('rote_pulpa', `<rect x="6" y="6" width="256" height="308" rx="12" class="gg-rp"/>` + [[80, 60], [130, 270], [220, 210], [40, 100], [200, 80], [30, 270]].map(([x, y]) => blob([[x - 12, y], [x, y - 8], [x + 14, y - 2], [x + 8, y + 9], [x - 6, y + 8]], 'gg-cordc')).join('') + rbc) +
      S('sinus_m', sinuses + rbcIn) +
      S('weisse_pulpa', wp(56, 262) + wp(214, 286)) +
      S('marginal', circ(150, 126, 52, 'gg-mz', 'style="stroke-width:30"') + ell(114, 172, 46, 38, 'gg-mz', 'style="stroke-width:30"')) +
      S('pals', ell(114, 172, 46, 38, 'gg-pals') + [[96, 156], [130, 150], [84, 184], [140, 190], [112, 200], [100, 140], [146, 172], [76, 168], [124, 136]].map(([x, y]) => circ(x, y, 2.6, 'gg-lym-d')).join('')) +
      S('follikel_m', circ(150, 126, 52, 'gg-fol') + circ(158, 118, 27, 'gg-gc') + [[124, 100], [130, 150], [176, 156], [190, 110], [150, 82], [118, 128], [172, 84]].map(([x, y]) => circ(x, y, 2.6, 'gg-lym-d')).join('')) +
      circ(110, 174, 7, 'gg-vv-a') + line([[114, 168], [132, 144], [148, 132]], 'v-red', W(2.4)) +
      // zoom: wall of a splenic sinus (stave cells, ring fibres)
      `<path d="M246 108L274 36M246 108L274 286" class="lead"/><rect x="274" y="30" width="120" height="256" rx="10" class="frame"/>` + zlabel(334, 22, 'Ausschnitt') +
      S('sinus_m', `<rect x="280" y="58" width="108" height="208" rx="6" class="gg-sin"/>` + staves + [96, 140, 184, 228].map(y => `<rect x="280" y="${y}" width="108" height="4" rx="2" class="gg-ringf"/>`).join('')) +
      path('M318 156c-4-6-4-14 2-16 3-1 5 3 6 8 1-5 3-9 6-8 6 2 6 10 2 16-3 4-6 5-8 2-2 3-5 2-8-2z', 'rbc') + circ(366, 206, 6, 'rbc') +
      blob([[290, 270], [300, 262], [316, 266], [322, 278], [306, 284], [292, 282]], 'gg-mph') + circ(306, 274, 3.6, 'mph-n'), 'Rote und weiße Pulpa');
  };

  MEDSVG.addMaps('milz', [['milz', 'Milz', 3], ['milz4', 'Pulpa', 4]], { milz: MAPS.milz, milz4: MAPS.milz4 });
})();
