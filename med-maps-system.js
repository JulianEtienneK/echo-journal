/* Medizin-Atlas maps: blut, lymphe, weiblich, maennlich, stoffwechsel */
(function () {
  'use strict';
  const { f, cr, path, blob, line, ell, circ, g, S, txt, svgw, tube, zlabel, zs } = MEDSVG.h;
  // ring as a path (gets an automatic hit area), arrow with head, little helpers
  const ringp = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0`;
  const ring = (cx, cy, r, cls, extra) => path(ringp(cx, cy, r), cls, extra);
  function arrow(pts, cls, extra = '') {
    const n = pts.length, [x1, y1] = pts[n - 2], [x2, y2] = pts[n - 1], a = Math.atan2(y2 - y1, x2 - x1), L = 7, W = 3.6;
    const c = Math.cos(a), s = Math.sin(a), h = [[x2, y2], [x2 - L * c + W * s, y2 - L * s - W * c], [x2 - L * c - W * s, y2 - L * s + W * c]];
    return line(pts, cls, extra) + path(`M${h.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}Z`, cls + '-h');
  }
  const hitc = (x, y, r) => circ(x, y, r, 'hit-c');
  const clip = (id, shape, inner) => `<clipPath id="${id}">${shape}</clipPath><g clip-path="url(#${id})">${inner}</g>`;
  const ery = (x, y, r = 12) => ell(x, y, r, r * .96, 'sy-ery') + ell(x, y, r * .42, r * .38, 'sy-ery-c');

  /* ================= Blut ================= */
  const FEMUR = [[46, 14], [68, 16], [82, 30], [90, 44], [104, 40], [118, 26], [134, 28], [142, 46], [136, 72], [124, 92], [118, 120], [118, 170], [118, 220], [122, 246], [136, 264], [144, 286], [136, 304], [116, 308], [102, 298], [88, 308], [66, 306], [56, 288], [62, 266], [76, 246], [80, 220], [80, 170], [80, 122], [74, 96], [56, 78], [36, 68], [24, 48], [28, 26]];
  const blutMap = () => svgw('0 0 400 320',
    path(cr(FEMUR, true, .8), 'sy-bone') +
    S('rotes_km', blob([[48, 23], [66, 25], [78, 38], [90, 54], [106, 50], [118, 36], [130, 38], [134, 52], [128, 74], [116, 96], [110, 120], [88, 120], [79, 100], [62, 84], [42, 72], [32, 52], [34, 32]], 'sy-redm') +
      [[[38, 42], [60, 72], [86, 112]], [[54, 28], [74, 62], [94, 106]], [[126, 44], [108, 76], [100, 114]], [[40, 60], [70, 56], [104, 62], [126, 58]]].map(p => line(p, 'sy-trab')).join('')) +
    S('gelbes_km', blob([[88, 120], [110, 120], [111, 170], [111, 222], [108, 242], [90, 242], [87, 222], [87, 170]], 'sy-yelm') +
      blob([[90, 242], [108, 242], [118, 254], [128, 270], [133, 287], [125, 298], [114, 299], [102, 288], [90, 299], [74, 298], [65, 287], [69, 270], [80, 254]], 'sy-yelm') +
      [[[78, 290], [92, 262], [100, 246]], [[124, 290], [110, 262], [100, 246]], [[68, 276], [100, 270], [132, 278]]].map(p => line(p, 'sy-trab')).join('')) +
    zlabel(46, 178, 'Femur') +
    // centrifuged blood sample: plasma 55 %, buffy coat, erythrocytes 45 %
    S('plasma', path('M182 48H214V172H182Z', 'sy-plasma')) +
    S('leukos', path('M182 172H214V182H182Z', 'sy-buffy')) +
    S('erys', path('M182 182H214V274A16 16 0 0 1 182 274Z', 'sy-erys')) +
    path('M178 34H218M180 34V274A18 18 0 0 0 216 274V34', 'sy-glass') +
    zlabel(160, 114, '55 %') + zlabel(160, 236, '45 %') + zlabel(198, 26, 'Blutprobe') +
    `<path d="M219 172L258 112M219 182L262 214" class="lead"/><circle cx="316" cy="160" r="76" class="frame"/>` +
    clip('sy-bc', circ(316, 160, 75, ''),
      S('plasma', circ(316, 160, 75, 'sy-plasma-l')) +
      S('erys', [[270, 124], [302, 102], [338, 108], [370, 134], [268, 168], [288, 204], [322, 212], [358, 198]].map(([x, y]) => ery(x, y, 13)).join('')) +
      S('leukos', circ(310, 158, 20, 'sy-leuko') + [[306, 150], [302, 156], [304, 164]].map(([x, y]) => circ(x + 18, y - 4, 1.4, 'sy-gran-d')).join('') +
        path('M298 150q6-6 11 0q3 6 9 4q7 0 7 7q-1 7-8 6q-6 2-8 7q-6 4-10-2q-4-5 0-9q-5-6-1-13z', 'sy-nuc')) +
      S('thrombos', hitc(360, 164, 15) + [[352, 158, 3.6], [365, 168, 3.2], [355, 172, 2.8], [368, 155, 3]].map(([x, y, r]) => blob([[x - r, y], [x, y - r * .8], [x + r, y - r * .2], [x + r * .6, y + r * .8], [x - r * .4, y + r]], 'sy-plt')).join(''))) +
    zlabel(316, 252, 'Ausstrich'), 'Knochenmark und Blut');

  const blut4Map = () => {
    const A = (pts) => arrow(pts, 'sy-arr');
    const lumenErys = [[318, 28], [312, 96], [326, 168], [314, 236], [322, 300]].map(([x, y]) => ery(x, y, 9)).join('');
    return svgw('0 0 400 320',
      S('sinusoid_km', path('M296 0H342V320H296Z', 'sy-sin') + path('M296 0V320M342 0V320', 'sy-endo') + lumenErys) +
      zlabel(319, 314, 'Blut') + zlabel(150, 314, 'Knochenmark') +
      // lineages
      A([[70, 160], [100, 160]]) + A([[52, 178], [56, 222]]) +
      A([[118, 152], [168, 76]]) + A([[119, 156], [150, 124]]) + A([[173, 120], [222, 124]]) + A([[119, 164], [196, 176]]) + A([[118, 167], [196, 222]]) + A([[116, 170], [200, 270]]) +
      A([[251, 124], [296, 126]]) + A([[231, 178], [294, 186]]) + A([[231, 228], [294, 240]]) + A([[239, 280], [294, 286]]) +
      circ(110, 160, 9, 'sy-prog') + circ(110, 160, 4, 'sy-nuc') + circ(162, 120, 11, 'sy-prog') + circ(162, 120, 6.5, 'sy-nuc') +
      `<g class="ghost">${circ(58, 234, 11, 'sy-prog')}${circ(58, 234, 7, 'sy-nuc')}</g>` + zlabel(58, 260, 'lymphatisch') + zlabel(92, 188, 'myeloisch') +
      S('hsz', circ(52, 160, 18, 'sy-hsc') + circ(53, 159, 10, 'sy-nuc')) +
      S('megakaryozyt', line([[222, 50], [258, 40], [300, 38], [312, 44]], 'sy-propl') + line([[224, 68], [262, 74], [300, 78], [314, 74]], 'sy-propl') +
        [[306, 41], [318, 46], [308, 78], [320, 72]].map(([x, y]) => circ(x, y, 3.4, 'sy-plt')).join('') +
        blob([[176, 36], [198, 28], [222, 36], [232, 58], [222, 82], [198, 90], [174, 82], [166, 60]], 'sy-mega') +
        blob([[186, 50], [196, 42], [206, 48], [214, 44], [220, 56], [212, 66], [214, 76], [200, 74], [190, 78], [182, 68], [188, 60]], 'sy-nuc')) +
      S('retikulozyt', circ(238, 124, 13, 'sy-retic') + path('M231 119l4 3-2 4M240 117l3 4 4-1M234 130l5-1 3 3M243 127l3 3', 'sy-retic-n')) +
      S('neutro', circ(216, 178, 15, 'sy-neu') + [[208, 170], [222, 168], [226, 184], [210, 188], [218, 176], [205, 180]].map(([x, y]) => circ(x, y, 1, 'sy-gran-d')).join('') +
        line([[208, 175], [216, 183], [224, 175]], 'sy-nucl') + circ(208, 175, 4.4, 'sy-nuc') + circ(216, 183, 4.4, 'sy-nuc') + circ(224, 175, 4.2, 'sy-nuc')) +
      S('eosino', circ(216, 228, 15, 'sy-eos') + [[206, 222], [212, 218], [220, 219], [226, 224], [224, 234], [216, 238], [208, 235], [205, 229], [214, 232], [219, 227]].map(([x, y]) => circ(x, y, 2, 'sy-eos-g')).join('') +
        ell(209, 226, 5, 6, 'sy-nuc') + ell(223, 226, 5, 6, 'sy-nuc') + line([[212, 228], [220, 228]], 'sy-nucl')) +
      S('monozyt', circ(222, 280, 17, 'sy-mono') + path('M210 272q8-6 18-2q6 3 4 9q-5-3-8 1q-1 6 4 9q-8 4-15 0q-7-7-3-17z', 'sy-nuc')) +
      // haemoglobin: α2β2 tetramer, one haem per chain
      `<rect x="8" y="8" width="90" height="90" rx="10" class="frame"/>` +
      S('haemoglobin', [[38, 38, 'sy-ha', 'α'], [68, 38, 'sy-hb', 'β'], [38, 68, 'sy-hb', 'β'], [68, 68, 'sy-ha', 'α']].map(([x, y, c]) => circ(x, y, 17, c)).join('') +
        [[38, 38], [68, 38], [38, 68], [68, 68]].map(([x, y]) => path(`M${x - 6} ${y}L${x} ${y - 4}L${x + 6} ${y}L${x} ${y + 4}Z`, 'sy-heme') + circ(x, y, 1.6, 'sy-fe')).join('')) +
      [[24, 22, 'α'], [82, 22, 'β'], [24, 90, 'β'], [82, 90, 'α']].map(([x, y, s]) => txt(x, y, s, 'sy-t', 'text-anchor="middle"')).join(''),
      'Blutbildung im Knochenmark');
  };

  MEDSVG.addMaps('blut', [['blut', 'Knochenmark & Blut', 3], ['blut4', 'Blutbildung', 4]], { blut: blutMap, blut4: blut4Map });

  /* ================= Lymphe ================= */
  // body-map coordinates (400×800) scaled into the detail map
  const BT = ([x, y]) => [f(70 + .65 * x), f(-12.2 + .65 * y)];
  const T = pts => pts.map(BT);
  const lymphMap = () => {
    const node = ([x, y]) => { const [a, b] = BT([x, y]); return ell(a, b, 4.4, 3.3, 'sy-node') + hitc(a, b, 7.5); };
    const NODES = [[176, 118], [189, 128], [188, 140], [187, 152], [224, 118], [211, 128], [212, 140], [213, 152], [136, 232], [142, 244], [131, 247], [264, 232], [258, 244], [269, 247],
      [190, 262], [210, 262], [190, 420], [210, 420], [190, 444], [210, 444], [180, 474], [220, 474], [158, 498], [167, 509], [176, 519], [242, 498], [233, 509], [224, 519], [100, 330], [300, 330]];
    const LV = [[[165, 545], [166, 520], [167, 509]], [[235, 545], [234, 520], [233, 509]], [[168, 509], [180, 474], [190, 444], [196, 436]], [[232, 509], [220, 474], [210, 444], [200, 436]],
      [[190, 420], [196, 430]], [[210, 420], [200, 430]], [[84, 440], [96, 380], [100, 330], [116, 284], [136, 246]], [[316, 440], [304, 380], [300, 330], [284, 284], [264, 246]],
      [[136, 232], [154, 206], [172, 192]], [[264, 232], [246, 204], [221, 170]], [[176, 118], [187, 152], [174, 188]], [[224, 118], [213, 152], [219, 165]], [[190, 262], [180, 222], [173, 194]], [[210, 262], [204, 214]]];
    const DT = [[198, 432], [196, 400], [194, 340], [195, 290], [198, 240], [203, 205], [209, 184], [214, 166], [219, 160], [221, 167]];
    return svgw('0 0 400 340',
      clip('sy-silc', '<rect x="0" y="0" width="400" height="340"/>', `<path d="${MEDSVG.SIL}" class="sil" transform="translate(70 -12.2) scale(.65)"/>`) +
      `<g class="ghost">${blob(T([[278, 350], [289, 358], [294, 378], [288, 396], [278, 392], [274, 370]]), 'c-spleen')}${blob(T([[170, 466], [192, 458], [218, 460], [240, 462], [246, 480], [238, 502], [214, 508], [188, 506], [164, 500], [160, 482]]), 'c-si')}</g>` +
      [[[186, 112], [184, 140], [182, 168], [190, 186], [194, 206], [194, 246]], [[120, 186], [150, 175], [182, 168]], [[214, 112], [216, 140], [218, 168], [206, 190], [194, 206]], [[280, 186], [250, 175], [218, 168]]].map(p => line(T(p), 'sy-vein')).join('') +
      LV.map(p => line(T(p), 'sy-lv')).join('') +
      S('lk', NODES.map(node).join('')) +
      S('ductus_thor', tube(T(DT), 2.6, 'sy-ly') + ell(...BT([198, 436]), 4.2, 8, 'sy-cist')) +
      S('ductus_dex', tube(T([[172, 194], [176, 181], [181, 171]]), 3.6, 'sy-ly')) +
      S('thymus', blob(T([[190, 202], [199, 197], [210, 202], [215, 226], [209, 247], [200, 240], [191, 247], [185, 226]]), 'sy-thy') + line(T([[200, 200], [200, 238]]), 'sy-thy-l')) +
      S('tonsillen', hitc(200, 58, 7) + ell(195.5, 58, 2.2, 3.2, 'sy-tons') + ell(204.5, 58, 2.2, 3.2, 'sy-tons')) +
      // inset: Waldeyer ring around the pharynx
      `<path d="M208 58L300 64" class="lead"/><circle cx="346" cy="66" r="46" class="frame"/>` +
      ell(346, 66, 19, 15, 'sy-phar') + ring(346, 66, 31, 'sy-ringd') +
      S('tonsillen', ell(346, 38, 15, 6, 'sy-tons') + ell(323, 47, 5, 4, 'sy-tons') + ell(369, 47, 5, 4, 'sy-tons') + ell(317, 70, 6, 11, 'sy-tons') + ell(375, 70, 6, 11, 'sy-tons') + ell(346, 95, 15, 5.5, 'sy-tons')) +
      zlabel(346, 124, 'Rachen') +
      // inset: ileum with Peyer plaques
      `<path d="M180 300L100 272" class="lead"/><circle cx="54" cy="266" r="46" class="frame"/>` +
      clip('sy-ilc', circ(54, 266, 45, ''), path('M0 240H110V294H0Z', 'sy-gut') + line([[0, 240], [110, 240]], 'sy-mes') +
        [12, 30, 48, 66, 84, 102].map(x => line([[x, 244], [x - 3, 267], [x, 290]], 'sy-fold')).join('') +
        S('peyer', [[38, 270, 15, 9], [78, 272, 13, 8]].map(([x, y, rx, ry]) => ell(x, y, rx, ry, 'sy-peyer') + [-.5, 0, .5].map(k => circ(f(x + k * rx * 1.1), y, 2.6, 'sy-foll')).join('')).join(''))) +
      zlabel(54, 324, 'Ileum'), 'Lymphatisches System');
  };

  const lymph4Map = () => {
    const C = [128, 166], sc = (pts, k) => pts.map(([x, y]) => [C[0] + (x - C[0]) * k, C[1] + (y - C[1]) * k]);
    const OUT = [[30, 120], [50, 64], [100, 30], [160, 30], [210, 56], [236, 100], [222, 140], [212, 166], [222, 192], [236, 232], [210, 276], [160, 302], [100, 302], [50, 268], [28, 212], [22, 166]];
    const ringPath = (k1, k2) => cr(sc(OUT, k1), true, .8) + cr(sc(OUT, k2), true, .8);
    const MED = [[82, 146], [92, 116], [116, 102], [144, 102], [168, 114], [182, 134], [200, 150], [218, 160], [218, 172], [200, 182], [182, 198], [168, 218], [144, 230], [116, 230], [92, 216], [82, 188]];
    const fol = sc(OUT, .8).filter((_, i) => i < 5 || i > 10).concat(sc([[208, 70], [208, 262]], .8));
    const hev = sc(OUT, .585).filter((_, i) => [0, 2, 4, 11, 13, 15].includes(i));
    return svgw('0 0 400 320',
      // afferent vessels into the convex side, efferent vessel and blood vessels at the hilus
      [[[8, 46], [28, 56], [50, 70]], [[6, 160], [14, 163], [26, 166]], [[10, 294], [30, 282], [52, 266]], [[120, 6], [124, 16], [128, 32]]].map(p => tube(p, 4, 'sy-ly')).join('') +
      tube([[218, 168], [238, 176], [256, 194]], 5, 'sy-ly') + tube([[218, 158], [238, 150], [256, 136]], 3.5, 'v-red') + tube([[219, 163], [240, 163], [258, 164]], 4.5, 'v-blue') +
      blob(OUT, 'sy-lkcap') +
      S('randsinus', path(cr(sc(OUT, .955), true, .8), 'sy-rsin')) +
      S('lk_rinde', path(ringPath(.915, .69), 'sy-cortex', 'fill-rule="evenodd"') + fol.map(([x, y], i) => circ(f(x), f(y), 13, 'sy-fol') + (i % 3 !== 1 ? circ(f(x), f(y), 7.5, 'sy-gc') : '')).join('')) +
      S('parakortex', path(ringPath(.69, .48), 'sy-para', 'fill-rule="evenodd"') + hev.map(([x, y]) => circ(f(x), f(y), 4.2, 'sy-hev')).join('')) +
      S('lk_mark', blob(MED, 'sy-med') + [[[98, 132], [146, 150], [212, 164]], [[92, 168], [150, 167], [212, 166]], [[98, 204], [148, 184], [212, 168]], [[126, 110], [160, 138], [204, 160]], [[126, 222], [162, 194], [204, 172]]].map(p => line(p, 'sy-cord')).join('')) +
      [[[100, 30], [112, 70]], [[22, 166], [62, 166]], [[100, 302], [112, 262]], [[210, 276], [186, 246]], [[210, 56], [186, 86]]].map(p => line(p, 'sy-trabl')).join('') +
      zlabel(240, 214, 'Hilus') + zs(70, 104, 'Rinde') + zs(128, 166, 'Mark') +
      // inset: blind-ended lymph capillary in the interstitium
      `<rect x="262" y="8" width="134" height="92" rx="10" class="frame"/>` +
      clip('sy-lcc', `<rect x="263" y="9" width="132" height="90" rx="9"/>`,
        `<rect x="262" y="8" width="134" height="92" class="sy-ist"/>` + blob([[272, 22], [284, 16], [292, 26], [282, 32]], 'sy-cell-g') + blob([[360, 84], [376, 80], [384, 90], [366, 94]], 'sy-cell-g') +
        line([[262, 90], [330, 88], [396, 92]], 'v-red', 'style="stroke-width:4;opacity:.5"') +
        [[[296, 18], [304, 34]], [[330, 16], [334, 32]], [[364, 18], [366, 32]], [[288, 80], [300, 70]], [[330, 84], [336, 72]]].map(p => arrow(p, 'sy-flow')).join('') +
        S('lymphkapillare', path('M396 38H306A16 16 0 0 0 306 70H396Z', 'sy-lcap') + [306, 322, 338, 354, 370].map(x => path(`M${x} 38q8-5 16 0M${x} 70q8 5 16 0`, 'sy-scal')).join('') +
          [[312, 38, 306, 26], [346, 38, 352, 26], [330, 70, 324, 82], [372, 70, 380, 82]].map(([a, b, c, d]) => path(`M${a} ${b}L${c} ${d}`, 'sy-anch')).join(''))) +
      // inset: thymus lobules with cortex, medulla and Hassall corpuscles
      `<rect x="262" y="108" width="134" height="100" rx="10" class="frame"/>` +
      S('thymus_fein', [[298, 158, 32, 44], [360, 158, 30, 44]].map(([x, y, rx, ry]) => ell(x, y, rx, ry, 'sy-tcx') + blob([[x - 12, y - 24], [x + 10, y - 22], [x + 14, y], [x + 8, y + 24], [x - 10, y + 22], [x - 14, y]], 'sy-tmed') +
        [[x - 3, y - 8], [x + 4, y + 10]].map(([a, b]) => circ(a, b, 5, 'sy-hass') + ring(a, b, 2.4, 'sy-hass-l')).join('')).join('')) +
      line([[329, 116], [329, 200]], 'sy-sept') + zs(298, 124, 'Rinde') + zs(298, 162, 'Mark') +
      // inset: T cells, B cell and plasma cell with antibodies
      `<rect x="262" y="216" width="134" height="96" rx="10" class="frame"/>` +
      S('t_zellen', [[288, 244], [288, 286]].map(([x, y]) => circ(x, y, 12, 'sy-tc') + circ(x + 1, y, 9, 'sy-tc-n') + [[-12, 0], [9, -8], [9, 8]].map(([dx, dy]) => { const a = Math.atan2(dy, dx), c = Math.cos(a), s = Math.sin(a); return path(`M${f(x + c * 12)} ${f(y + s * 12)}l${f(c * 5 - s * 1.5)} ${f(s * 5 + c * 1.5)}M${f(x + c * 12)} ${f(y + s * 12)}l${f(c * 5 + s * 1.5)} ${f(s * 5 - c * 1.5)}`, 'sy-tcr'); }).join('')).join('')) +
      zs(288, 266, 'CD4') + zs(288, 308, 'CD8') +
      S('b_zellen', circ(336, 244, 12, 'sy-bc') + circ(337, 244, 8.5, 'sy-bc-n') +
        [0, 90, 180, 270].map(d => { const a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), x = 336 + c * 12, y = 244 + s * 12, x2 = x + c * 5, y2 = y + s * 5; return path(`M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}l${f(c * 3 - s * 3)} ${f(s * 3 + c * 3)}M${f(x2)} ${f(y2)}l${f(c * 3 + s * 3)} ${f(s * 3 - c * 3)}`, 'sy-ab'); }).join('') +
        blob([[352, 276], [368, 268], [386, 274], [390, 292], [376, 304], [356, 300]], 'sy-pc') + ell(371, 284, 6, 7, 'sy-pc-h') + circ(360, 288, 8, 'sy-bc-n') + [[357, 285], [362, 291], [358, 292], [363, 284]].map(([x, y]) => circ(x, y, 1.3, 'sy-pc-c')).join('') +
        [[380, 236], [372, 258], [344, 300]].map(([x, y]) => path(`M${x} ${y + 5}V${y}l-3-4M${x} ${y}l3-4`, 'sy-ab')).join('')),
      'Lymphknoten und lymphatische Zellen');
  };

  MEDSVG.addMaps('lymphe', [['lymphe', 'Lymphsystem', 3], ['lymphe4', 'Lymphknoten', 4]], { lymphe: lymphMap, lymphe4: lymph4Map });

  /* ================= Weibliche Geschlechtsorgane ================= */
  const mx = (pts, c = 150) => pts.map(([x, y]) => [2 * c - x, y]);
  const wave = (x0, y0, y1, amp, step) => { const p = []; for (let y = y0, i = 0; (y1 > y0 ? y <= y1 : y >= y1); y += (y1 > y0 ? step : -step), i++) p.push([x0 + (i % 2 ? amp : -amp), y]); return p; };
  const weiblMap = () => {
    const TUBE_I = [[106, 78], [90, 72], [72, 68]], TUBE_A = [[72, 68], [56, 64], [42, 68], [32, 82]];
    const FIMB = [[[32, 84], [16, 88]], [[32, 84], [18, 98]], [[32, 84], [26, 104]], [[32, 84], [36, 104]], [[32, 84], [14, 80]]];
    const side = m => tube(m(TUBE_I), 5, 'sy-tube') + tube(m(TUBE_A), 9, 'sy-tube') + FIMB.map(p => line(m(p), 'sy-fimb')).join('');
    const ovar = (x, s) => ell(x, 120, 22, 13, 'sy-ov') + [[x - 10 * s, 116, 3.5], [x + 2 * s, 124, 4.5], [x + 11 * s, 114, 3]].map(([a, b, r]) => circ(a, b, r, 'sy-fdot')).join('');
    const lobe = (cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a), px = -s, py = c; return blob([[cx + c * 10, cy + s * 10], [cx + px * 8, cy + py * 8], [cx - c * 6, cy - s * 6], [cx - px * 8, cy - py * 8]], 'sy-gland'); };
    return svgw('0 0 400 320',
      S('lig_latum', blob([[34, 74], [90, 66], [150, 62], [210, 66], [266, 74], [276, 178], [214, 186], [150, 190], [86, 186], [24, 178]], 'sy-lig')) +
      line([[80, 116], [110, 98]], 'sy-ligc') + line([[220, 116], [190, 98]], 'sy-ligc') + line([[34, 116], [12, 104]], 'sy-ligc') + line([[266, 116], [288, 104]], 'sy-ligc') +
      S('ovar', ovar(56, 1) + ovar(244, -1)) +
      S('tube', side(p => p) + side(p => mx(p))) +
      S('vagina', blob([[108, 194], [150, 188], [192, 194], [190, 240], [182, 300], [150, 306], [118, 300], [110, 240]], 'sy-vag') +
        [[[124, 232], [128, 290]], [[140, 236], [142, 296]], [[160, 236], [158, 296]], [[176, 232], [172, 290]]].map(p => line(p, 'sy-rug')).join('')) +
      S('uterus', blob([[104, 80], [122, 60], [150, 54], [178, 60], [196, 80], [198, 110], [188, 138], [172, 160], [128, 160], [112, 138], [102, 110]], 'sy-ut') +
        blob([[124, 82], [150, 78], [176, 82], [162, 110], [154, 138], [146, 138], [138, 110]], 'sy-utc')) +
      S('cervix', blob([[130, 156], [170, 156], [174, 184], [170, 210], [158, 220], [142, 220], [130, 210], [126, 184]], 'sy-cx') + line([[150, 140], [150, 218]], 'sy-canal')) +
      zlabel(150, 20, 'von hinten') +
      // inset: median section (anterior left) with the rectouterine pouch
      `<rect x="290" y="6" width="106" height="160" rx="10" class="frame"/>` +
      clip('sy-msc', `<rect x="291" y="7" width="104" height="158" rx="9"/>`,
        ell(300, 138, 6, 13, 'sy-bone sy-ctx') + blob([[304, 118], [314, 100], [332, 98], [342, 110], [336, 128], [312, 132]], 'sy-blad sy-ctx') +
        tube([[388, 6], [387, 60], [384, 110], [376, 166]], 13, 'sy-rect') +
        S('douglas', blob([[356, 68], [377, 62], [378, 96], [374, 124], [367, 127], [364, 106], [359, 88]], 'sy-doug')) +
        line([[294, 84], [312, 98], [332, 97], [341, 103], [336, 94]], 'sy-perit') +
        S('vagina', tube([[362, 118], [352, 140], [340, 166]], 9, 'sy-vt')) +
        S('uterus', blob([[312, 62], [322, 52], [338, 56], [352, 76], [360, 98], [350, 104], [336, 92], [318, 78]], 'sy-ut')) +
        S('cervix', blob([[348, 100], [360, 96], [367, 110], [361, 123], [351, 118]], 'sy-cx'))) +
      zlabel(310, 160, 'vorn') +
      // inset: breast in sagittal section on the chest wall
      `<rect x="290" y="176" width="106" height="138" rx="10" class="frame"/>` +
      clip('sy-brc', `<rect x="291" y="177" width="104" height="136" rx="9"/>`,
        [196, 226, 256, 286].map(y => ell(296, y, 4, 8, 'sy-bone')).join('') + path('M302 176H316V314H302Z', 'sy-pect') +
        S('brustdruese', blob([[316, 186], [340, 190], [364, 206], [382, 230], [388, 246], [382, 262], [364, 286], [340, 302], [316, 306]], 'sy-fat') +
          [[338, 214, -.5], [334, 246, 0], [338, 278, .5], [356, 228, -.3], [356, 264, .3]].map(([x, y, a]) => lobe(x, y, a + Math.PI)).join('') +
          [[338, 214], [334, 246], [338, 278], [356, 228], [356, 264]].map(([x, y]) => line([[x + 8, y], [376, 246 + (y - 246) * .2], [388, 246]], 'sy-mduct')).join('') +
          blob([[384, 238], [392, 240], [395, 246], [392, 252], [384, 254]], 'sy-nip'))),
      'Weibliche Geschlechtsorgane');
  };

  const weibl4Map = () => {
    const fol = (x, y, rg, ro) => circ(x, y, rg, 'sy-gr') + circ(x, y, ro, 'sy-oo') + circ(x, y, ro * .35, 'sy-oon');
    const A = p => arrow(p, 'sy-arr');
    const glands = [250, 280, 310, 340, 370].map(x => line(wave(x, 28, 80, 3.5, 6), 'sy-glnd')).join('');
    const spir = [265, 325, 385].map(x => line(wave(x, 84, 34, 3, 5), 'sy-spir')).join('');
    const radial = [250, 290, 330, 370].map(x => line([[x, 162], [x + 2, 120], [x - 1, 86]], 'v-red', 'style="stroke-width:2"')).join('');
    const ducts = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4 + .2, c = Math.cos(a), s = Math.sin(a), x = 330 + c * 34, y = 268 + s * 34;
      return line([[330 + c * 8, 268 + s * 8], [330 + c * 22 + s * 3, 268 + s * 22 - c * 3], [x, y]], 'sy-mduct') + [[0, 0], [5 * -s, 5 * c], [5 * s, -5 * c]].map(([dx, dy]) => circ(f(x + c * 4 + dx), f(y + s * 4 + dy), 4.2, 'sy-gland')).join(''); }).join('');
    const NODES = [[264, 236], [232, 228], [200, 230], [168, 236], [140, 244]];
    return svgw('0 0 400 320',
      // ovary: follicle maturation around the cortex
      ell(114, 110, 104, 94, 'sy-ovc') + ell(112, 116, 48, 40, 'sy-ovm') + line([[70, 130], [100, 112], [130, 124], [156, 108]], 'v-red', 'style="stroke-width:1.6;opacity:.6"') + line([[74, 102], [104, 120], [140, 104]], 'v-blue', 'style="stroke-width:1.6;opacity:.6"') +
      A([[32, 76], [42, 62]]) + A([[66, 36], [80, 30]]) + A([[112, 28], [126, 30]]) + A([[166, 50], [176, 64]]) + A([[192, 138], [176, 156]]) + A([[114, 178], [90, 176]]) +
      `<g class="ghost">${circ(70, 166, 13, 'sy-ca')}</g>` +
      S('follikelreifung', [[26, 112], [30, 94], [32, 130]].map(([x, y]) => fol(x, y, 5, 3)).join('') + fol(54, 48, 9, 5) + fol(96, 38, 14, 5.5) + ring(96, 38, 6.6, 'sy-zp') +
        circ(148, 46, 21, 'sy-gr') + blob([[140, 36], [158, 34], [164, 50], [154, 58], [144, 52]], 'sy-antr') + circ(141, 50, 5.5, 'sy-oo') +
        circ(186, 100, 28, 'sy-antr') + blob([[160, 104], [170, 96], [180, 104], [178, 118], [164, 118]], 'sy-gr') + circ(171, 108, 6.5, 'sy-oo') + ring(171, 108, 7.8, 'sy-zp') + circ(171, 108, 2.2, 'sy-oon')) +
      S('granulosa', ring(186, 100, 29.5, 'sy-gra-r') + ring(186, 100, 34, 'sy-thec-r')) +
      S('gelbkoerper', blob([[118, 160], [132, 150], [150, 152], [164, 166], [162, 186], [146, 196], [126, 194], [116, 178]], 'sy-cl') + line([[128, 162], [138, 172], [132, 184]], 'sy-cl-l') + line([[152, 160], [146, 174], [154, 186]], 'sy-cl-l') + ell(141, 175, 6, 7, 'sy-clot')) +
      // uterine wall: endometrium, myometrium, uterine artery branches
      `<rect x="230" y="8" width="166" height="200" rx="10" class="frame"/>` +
      clip('sy-uwc', `<rect x="231" y="9" width="164" height="198" rx="9"/>`,
        `<rect x="230" y="8" width="166" height="20" class="sy-lum"/>` + `<rect x="230" y="176" width="166" height="32" class="sy-perim"/>` +
        S('myometrium', `<rect x="230" y="84" width="166" height="92" class="sy-myu"/>` + [96, 112, 128, 144, 160].map((y, r) => [0, 1, 2, 3, 4, 5].map(c => { const x = 240 + c * 28 + (r % 2) * 12; return path(`M${x} ${y}l14 ${r % 2 ? 3 : -3}`, 'sy-myl'); }).join('')).join('')) +
        S('endometrium', `<rect x="230" y="28" width="166" height="44" class="sy-funct"/><rect x="230" y="72" width="166" height="12" class="sy-basal"/>` + glands + spir + line([[230, 28], [396, 28]], 'sy-epi-u')) +
        S('a_uterina', tube([[228, 196], [300, 194], [398, 197]], 6, 'v-red') + [268, 352].map(x => line([[x, 194], [x + 2, 178], [x, 162]], 'v-red', 'style="stroke-width:3"')).join('') + line([[234, 162], [300, 160], [392, 162]], 'v-red', 'style="stroke-width:3"') + radial)) +
      zlabel(313, 22, 'Lumen') + zs(380, 52, 'Functionalis') + zs(380, 81, 'Basalis') +
      // breast lobes with ducts, axillary nodes, and one secretory end piece enlarged
      line([[292, 248], [264, 236], [232, 228], [200, 230], [168, 236], [140, 244], [116, 254]], 'sy-lv') +
      circ(330, 268, 46, 'sy-fat') +
      S('lk_axilla', NODES.map(([x, y]) => ell(x, y, 8, 5.5, 'sy-node') + hitc(x, y, 9)).join('')) +
      S('milchbildung', ducts + circ(330, 268, 8, 'sy-nip')) +
      `<path d="M292 276L112 274" class="lead"/><rect x="8" y="222" width="104" height="92" rx="10" class="frame"/>` +
      S('milchbildung', circ(60, 268, 37, 'sy-myoep', 'style="opacity:.18"') + [...Array(12)].map((_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a), a2 = a + Math.PI / 6.6, c2 = Math.cos(a2), s2 = Math.sin(a2);
        return path(`M${f(60 + c * 18)} ${f(268 + s * 18)}L${f(60 + c * 31)} ${f(268 + s * 31)}L${f(60 + c2 * 31)} ${f(268 + s2 * 31)}L${f(60 + c2 * 18)} ${f(268 + s2 * 18)}Z`, 'sy-alvc') + ell(f(60 + c * 34.5), f(268 + s * 34.5), 4, 1.6, 'sy-myoep', `transform="rotate(${f(a * 180 / Math.PI + 90)} ${f(60 + c * 34.5)} ${f(268 + s * 34.5)})"`); }).join('') +
        circ(60, 268, 17, 'sy-milk') + [[54, 262, 4], [66, 266, 3], [58, 274, 3.4]].map(([x, y, r]) => circ(x, y, r, 'sy-antr')).join('')),
      'Ovar, Uteruswand und Brustdrüse');
  };

  MEDSVG.addMaps('weiblich', [['weiblich', 'Innere Genitale & Brust', 3], ['weiblich4', 'Ovar, Uterus & Mamma', 4]], { weiblich: weiblMap, weiblich4: weibl4Map });

  /* ================= Männliche Geschlechtsorgane ================= */
  const maennlMap = () => {
    const URE = [[232, 122], [232, 150], [226, 176], [204, 194], [180, 200], [154, 208], [134, 230], [120, 266], [110, 306]];
    const CORD = [[258, 224], [234, 196], [206, 170], [178, 146], [154, 116]];
    const VAS = [[246, 304], [264, 294], [270, 264], [266, 236], ...CORD, [160, 88], [190, 70], [234, 62], [270, 66], [296, 76], [308, 92]];
    return svgw('0 0 400 320',
      clip('sy-mpc', '<rect x="0" y="0" width="400" height="320"/>', `<g class="sy-ctx">${tube([[352, -12], [349, 60], [344, 140], [330, 214]], 20, 'sy-rect')}` +
        `${blob([[188, 70], [200, 40], [232, 30], [264, 42], [276, 74], [266, 104], [246, 120], [222, 122], [200, 108]], 'sy-blad')}${line([[318, -4], [300, 40], [286, 72], [272, 92]], 'c-ureter')}</g>`) + ell(150, 142, 9, 22, 'sy-bone') +
      S('skrotum', blob([[160, 216], [200, 206], [250, 208], [284, 230], [296, 268], [284, 304], [250, 318], [204, 318], [172, 304], [158, 270]], 'sy-scrot') +
        line([[228, 210], [226, 260], [228, 316]], 'sy-wr') + line([[172, 244], [178, 262]], 'sy-wr') + line([[282, 246], [288, 264]], 'sy-wr')) +
      S('hoden', ell(222, 266, 26, 34, 'sy-testis') + [[[222, 236], [210, 250], [204, 262]], [[222, 236], [222, 256], [216, 280]], [[222, 236], [234, 262], [232, 288]]].map(p => line(p, 'sy-sep')).join('')) +
      S('nebenhoden', blob([[234, 230], [250, 226], [260, 236], [263, 256], [261, 280], [255, 298], [243, 305], [245, 290], [251, 270], [251, 250], [243, 240]], 'sy-epid')) +
      S('samenstrang', tube(CORD, 14, 'sy-cordf')) +
      S('blaeschen', blob([[256, 130], [264, 116], [280, 104], [296, 92], [310, 94], [308, 110], [292, 122], [276, 134], [262, 140]], 'sy-sv') + line([[268, 124], [276, 118], [282, 124], [292, 110], [300, 106]], 'sy-sv-l')) +
      S('prostata', blob([[208, 134], [230, 126], [254, 132], [262, 150], [252, 168], [230, 174], [210, 166], [204, 150]], 'sy-pros')) +
      S('samenleiter', tube(VAS, 3.4, 'sy-vd') + tube([[308, 92], [300, 112], [284, 126], [262, 140], [244, 148]], 6, 'sy-vd')) +
      S('schwellkoerper', tube([[184, 180], [158, 188], [134, 206], [112, 238], [100, 276], [96, 296]], 14, 'sy-cav') +
        ell(206, 196, 13, 8, 'sy-glans', 'style="fill:#E39AA3"') + tube([[206, 196], [180, 202], [154, 210], [136, 232], [122, 268], [114, 296]], 10, 'sy-spo') +
        blob([[88, 290], [104, 284], [120, 290], [123, 304], [112, 316], [96, 316], [86, 304]], 'sy-glans')) +
      line(URE, 'sy-ureth') + zlabel(36, 312, 'vorn') + zlabel(370, 312, 'hinten'),
      'Männliche Geschlechtsorgane');
  };

  const maennl4Map = () => {
    const C = [128, 162], P = (a, r) => [f(C[0] + Math.cos(a) * r), f(C[1] + Math.sin(a) * r)], D = Math.PI / 180;
    let germ = '', sert = '', spg = '', tails = '';
    for (let k = 0; k < 8; k++) {
      const g0 = k * 45 * D, s0 = g0 + 22.5 * D;
      for (const d of [-9, 9]) { const [x, y] = P(g0 + d * D, 91); spg += circ(x, y, 5.6, 'sy-spg'); }
      for (const d of [-8, 8]) { const [x, y] = P(g0 + d * D, 73); germ += circ(x, y, 7.6, 'sy-spc') + circ(x, y, 3.6, 'sy-spc-n'); }
      for (const d of [-11, 0, 11]) { const [x, y] = P(g0 + d * D, 54); germ += circ(x, y, 4.4, 'sy-spt'); }
      const b1 = P(s0 - 4.2 * D, 99), b2 = P(s0 + 4.2 * D, 99), m1 = P(s0 - 5 * D, 70), m2 = P(s0 + 5 * D, 70), t = P(s0, 42);
      sert += blob([b1, m1, t, m2, b2], 'sy-sert') + ell(...P(s0, 84), 3.4, 6, 'sy-sert-n', `transform="rotate(${f(s0 / D + 90)} ${P(s0, 84).join(' ')})"`);
      const h = P(g0 + 20 * D, 45), e = P(g0 + 50 * D, 18);
      tails += ell(...h, 3.2, 2.2, 'sy-sph') + line([h, P(g0 + 34 * D, 32), e], 'sy-tail');
    }
    const leyd = (cx, cy) => [[0, 0], [11, 3], [4, 11], [-8, 7]].map(([dx, dy]) => blob([[cx + dx - 5, cy + dy - 4], [cx + dx + 5, cy + dy - 5], [cx + dx + 6, cy + dy + 4], [cx + dx - 4, cy + dy + 5]], 'sy-leyd') + circ(cx + dx, cy + dy, 1.8, 'sy-leyd-n')).join('');
    return svgw('0 0 400 320',
      `<rect x="6" y="6" width="250" height="308" rx="10" class="frame"/>` +
      clip('sy-tbc', `<rect x="7" y="7" width="248" height="306" rx="9"/>`,
        `<rect x="6" y="6" width="250" height="308" class="sy-ist"/>` +
        `<g class="ghost">${[[16, 18, 70], [262, 14, 62], [12, 312, 66], [262, 316, 62]].map(([x, y, r]) => circ(x, y, r, 'sy-germ') + ring(x, y, r, 'sy-bm')).join('')}</g>` +
        circ(150, 40, 5, 'v-red', 'style="fill:#E58A7E;stroke:#B5574B;stroke-width:1.5"') +
        S('leydig', leyd(122, 30) + leyd(16, 168) + leyd(238, 166) + leyd(126, 290) + hitc(126, 34, 12) + hitc(240, 170, 11) + hitc(130, 294, 12)) +
        S('tubuli_sem', circ(...C, 100, 'sy-germ') + ring(...C, 101, 'sy-bm') + germ + circ(...C, 40, 'sy-tlum')) +
        S('sertoli', sert) + S('spermatogonien', spg) + S('spermium', tails)) +
      // spermatozoon
      `<rect x="264" y="6" width="132" height="50" rx="10" class="frame"/>` +
      S('spermium', ell(286, 31, 11, 7, 'sy-sph') + path('M276 26q2-6 9-6q-6 3-6 11q0 7 6 10q-7 0-9-6z', 'sy-acro') + line([[297, 31], [320, 31]], 'sy-mid') + line([[298, 31], [320, 31]], 'sy-mid-s') +
        line([[320, 31], [336, 26], [352, 34], [368, 27], [384, 33], [392, 30]], 'sy-tail')) +
      // testicular artery and pampiniform plexus
      `<rect x="264" y="64" width="132" height="138" rx="10" class="frame"/>` +
      clip('sy-ppc', `<rect x="265" y="65" width="130" height="136" rx="9"/>`,
        `<g class="ghost">${ell(330, 202, 34, 18, 'sy-testis')}</g>` +
        S('pampiniformis', [[[312, 186], [306, 160], [316, 136], [306, 110], [318, 86], [326, 64]], [[348, 186], [354, 160], [344, 134], [356, 110], [342, 86], [334, 64]], [[322, 186], [340, 164], [320, 140], [342, 116], [324, 92], [330, 70]], [[338, 186], [318, 162], [342, 138], [318, 114], [338, 90]]].map(p => line(p, 'v-blue', 'style="stroke-width:3.2"')).join('') +
          tube([[330, 74], [330, 64]], 7, 'v-blue')) +
        S('a_testicularis', tube([[330, 64], [331, 120], [329, 188]], 4, 'v-red')) +
        arrow([[284, 100], [284, 140]], 'sy-arr') + arrow([[378, 140], [378, 100]], 'sy-arr')) +
      // prostate zones (transverse section, anterior up)
      `<rect x="264" y="210" width="132" height="104" rx="10" class="frame"/>` +
      S('prostata_zonen', blob([[284, 252], [300, 226], [330, 218], [360, 226], [376, 252], [370, 284], [346, 302], [314, 302], [290, 284]], 'sy-pz') +
        blob([[300, 240], [316, 226], [344, 226], [360, 240], [352, 252], [308, 252]], 'sy-afms') +
        blob([[314, 276], [330, 262], [346, 276], [340, 290], [320, 290]], 'sy-cz') +
        ell(318, 256, 11, 8, 'sy-tz') + ell(342, 256, 11, 8, 'sy-tz') + circ(330, 254, 3.6, 'sy-tlum') + circ(325, 281, 1.8, 'sy-sph') + circ(335, 281, 1.8, 'sy-sph')) +
      zs(330, 236, 'vorn') + zs(330, 298, 'PZ') + zs(306, 262, 'TZ') + zs(330, 272, 'ZZ'),
      'Hodenkanälchen, Gefäße und Prostata');
  };

  MEDSVG.addMaps('maennlich', [['maennlich', 'Männliche Genitale', 3], ['maennlich4', 'Hoden & Prostata', 4]], { maennlich: maennlMap, maennlich4: maennl4Map });

  /* ================= Stoffwechsel ================= */
  const stoffMap = () => {
    const bat = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const x = 304 + c * 17 + (r % 2) * 8, y = 22 + r * 16; bat.push(circ(x, y, 8.6, 'sy-bat') + [[-3, -3], [3, -2], [-2, 3], [3.5, 3]].map(([dx, dy]) => circ(x + dx, y + dy, 2, 'sy-bat-d')).join('') + circ(x, y, 1.6, 'sy-bat-n')); }
    const WAT = [[306, 244], [332, 238], [358, 244], [384, 252], [318, 268], [346, 266], [372, 276], [304, 292], [332, 294], [360, 298]];
    return svgw('0 0 400 320',
      // flows: nutrients, hormones, metabolites
      arrow([[160, 230], [122, 180], [98, 106]], 'sy-fp') + zlabel(160, 182, 'Glukose, AS') +
      arrow([[158, 46], [230, 72], [292, 126]], 'sy-fg') + zlabel(222, 56, 'Glukose') +
      arrow([[258, 126], [288, 142]], 'sy-fi') + arrow([[244, 138], [270, 190], [298, 230]], 'sy-fi') + arrow([[180, 124], [152, 98], [138, 76]], 'sy-fi') + zlabel(292, 196, 'Insulin') +
      arrow([[342, 230], [342, 198]], 'sy-ff') + zlabel(368, 216, 'Fettsäuren') +
      arrow([[92, 246], [142, 256]], 'sy-fn') + zlabel(118, 240, 'Calcitriol') + arrow([[46, 100], [54, 196]], 'sy-arr') +
      S('leber_s', blob([[20, 56], [46, 30], [96, 22], [148, 28], [156, 44], [132, 64], [100, 86], [62, 100], [30, 92]], 'sy-liver')) +
      S('fett_braun', bat.join('')) +
      S('muskel_s', line([[282, 150], [300, 150]], 'sy-tend') + line([[378, 150], [396, 150]], 'sy-tend') + blob([[298, 150], [318, 122], [340, 112], [362, 122], [380, 150], [362, 178], [340, 188], [318, 178]], 'sy-musc') +
        [130, 142, 150, 158, 170].map(y => line([[306, y], [340, (y - 150) * 1.6 + 150], [372, y]], 'sy-fib')).join('')) +
      `<g class="sy-ctx">${blob([[160, 130], [180, 118], [220, 116], [262, 110], [278, 118], [262, 134], [220, 142], [180, 148]], 'sy-panc')}</g>` +
      S('inseln_s', [[188, 132], [216, 128], [246, 122]].map(([x, y]) => circ(x, y, 9, 'sy-islet') + circ(x - 3, y - 2, 2.2, 'sy-ib') + circ(x + 3, y - 1, 2.2, 'sy-ib') + circ(x, y + 3, 2.2, 'sy-ib') + circ(x + 5, y + 4, 1.8, 'sy-ia') + circ(x - 5, y + 3, 1.8, 'sy-ia')).join('')) +
      S('darm_s', blob([[150, 236], [180, 224], [220, 226], [256, 232], [264, 256], [254, 284], [220, 294], [182, 292], [152, 282], [144, 258]], 'sy-si') +
        line([[158, 248], [174, 240], [188, 252], [204, 240], [220, 252], [236, 242], [252, 252]], 'sy-coil') + line([[156, 268], [172, 260], [188, 272], [204, 260], [220, 272], [236, 262], [254, 272]], 'sy-coil')) +
      S('niere_s', blob([[48, 206], [70, 200], [88, 212], [90, 232], [80, 242], [86, 258], [76, 278], [54, 280], [40, 260], [38, 230]], 'sy-kid') + blob([[72, 236], [82, 238], [82, 248], [72, 250]], 'sy-kid-h')) +
      `<g class="sy-ctx">${line([[80, 250], [96, 284], [100, 318]], 'c-ureter')}</g>` +
      S('fett_weiss', WAT.map(([x, y]) => circ(x, y, 13, 'sy-wat') + ell(x - 10, y + 4, 2, 4, 'sy-wat-n')).join('')),
      'Stoffwechsel-Organe');
  };

  const stoff4Map = () => {
    const hex = (x, y, r = 4) => path(`M${[0, 1, 2, 3, 4, 5].map(i => f(x + r * Math.cos(i * Math.PI / 3)) + ' ' + f(y + r * Math.sin(i * Math.PI / 3))).join('L')}Z`, 'sy-glc');
    const glut = (x, y) => `<rect x="${x - 4}" y="${y - 7}" width="8" height="14" rx="3" class="sy-glut"/>`;
    const needle = (cx, cy, a, L) => { const c = Math.cos(a), s = Math.sin(a), w = 2.2; return path(`M${f(cx - c * L)} ${f(cy - s * L)}L${f(cx - s * w)} ${f(cy + c * w)}L${f(cx + c * L)} ${f(cy + s * L)}L${f(cx + s * w)} ${f(cy - c * w)}Z`, 'sy-urat'); };
    const DT = [[76, 250], [92, 200], [110, 140], [126, 92], [146, 54], [168, 34]];
    return svgw('0 0 400 320',
      `<g class="sy-ctx">${blob([[8, 30], [40, 10], [100, 8], [126, 20], [112, 46], [80, 70], [40, 80], [14, 64]], 'sy-liver')}</g>` + zlabel(62, 42, 'Leber') +
      path('M168 14H400V50H168A18 18 0 0 1 168 14Z', 'sy-blood') + zlabel(384, 36, 'Blut') +
      // villus: blood capillaries to the portal vein, lacteal to the thoracic duct
      `<g class="sy-ctx">${blob([[34, 250], [34, 290], [50, 312], [76, 316], [102, 312], [118, 290], [118, 250]], 'villus')}${line([[50, 252], [50, 294], [66, 308]], 'cap-a')}${line([[102, 252], [102, 294], [86, 308]], 'cap-v')}</g>` +
      line([[76, 252], [76, 304]], 'lact') + zlabel(140, 314, 'Darm') +
      S('pfortader_s', tube([[50, 252], [44, 200], [46, 140], [56, 76]], 10, 'v-portal')) +
      S('ductus_thor_s', tube(DT, 6, 'sy-ly')) +
      S('chylomikronen', [[84, 222], [98, 180], [112, 136], [124, 98], [140, 64], [76, 280], [76, 266]].map(([x, y]) => circ(x, y, 3.3, 'sy-chylo')).join('') + circ(192, 32, 11, 'sy-chylo') + path('M184 26q8-5 16 0', 'sy-apo') + hitc(192, 32, 12)) +
      S('ldl_hdl', [[226, 32], [300, 30]].map(([x, y]) => circ(x, y, 9, 'sy-ldl') + path(`M${x - 6} ${y - 6}q6 4 12 0`, 'sy-apo')).join('') + [[256, 26], [272, 40], [334, 36], [356, 24]].map(([x, y]) => circ(x, y, 5.5, 'sy-hdl')).join('')) +
      // muscle cell: insulin receptor, GLUT4 in membrane and vesicles, mitochondrion
      `<rect x="172" y="66" width="222" height="142" rx="14" class="sy-cellm"/>` + zlabel(232, 200, 'Muskelzelle') +
      [[196, 58], [230, 56], [266, 58], [214, 52]].map(([x, y]) => hex(x, y, 3.6)).join('') +
      line([[322, 66], [322, 54], [316, 46]], 'sy-insr') + line([[330, 66], [330, 54], [336, 46]], 'sy-insr') + circ(326, 42, 3.4, 'sy-ins') +
      line([[322, 74], [300, 86], [262, 96]], 'sy-fi') +
      S('glut4', glut(200, 66) + glut(236, 66) + glut(272, 66) + [[214, 104], [252, 98]].map(([x, y]) => circ(x, y, 10, 'sy-ves') + glut(x, y)).join('')) +
      arrow([[214, 92], [212, 80]], 'sy-arr') + arrow([[252, 86], [254, 78]], 'sy-arr') +
      S('mitochondrium', ell(296, 160, 58, 27, 'sy-mito') + ell(296, 160, 51, 21, 'sy-mito-i') +
        path([256, 284, 312].map(x => `M${x} 141V168a3 3 0 0 0 6 0V141`).join('') + [270, 298, 326].map(x => `M${x} 179V152a3 3 0 0 1 6 0V179`).join(''), 'sy-cris')) +
      // white adipocyte (signet ring) and urate crystals
      S('adipozyt', circ(296, 264, 44, 'sy-adc') + circ(300, 264, 38, 'sy-lip') + ell(258, 264, 3.6, 12, 'sy-adn')) +
      `<rect x="350" y="222" width="46" height="88" rx="8" class="frame"/>` +
      S('harnsaeure', needle(373, 262, 1.2, 26) + needle(370, 270, 1.9, 24) + needle(378, 266, .5, 18) + needle(366, 258, 2.6, 16) + needle(374, 280, 1.5, 20)),
      'Stoffwechsel auf Zellebene');
  };

  MEDSVG.addMaps('stoffwechsel', [['stoffwechsel', 'Stoffwechsel-Organe', 3], ['stoffwechsel4', 'Zellebene', 4]], { stoffwechsel: stoffMap, stoffwechsel4: stoff4Map });
})();
