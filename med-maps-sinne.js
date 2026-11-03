/* Medizin-Atlas maps: auge, ohr, haut, schilddruese, nebenniere, hypophyse */
(function () {
  'use strict';
  const { f, path, blob, line, ell, circ, S, svgw, tube, zlabel, zs } = MEDSVG.h;
  const rad = a => a * Math.PI / 180;
  const P = (c, a, r) => [c[0] + Math.cos(rad(a)) * r, c[1] + Math.sin(rad(a)) * r];
  const pt = p => f(p[0]) + ' ' + f(p[1]);
  // annular sector between radii r1 (outer) and r2 (inner), angles a1 → a2 (clockwise on screen)
  const band = (c, r1, r2, a1, a2, cls, extra = '') => { const L = a2 - a1 > 180 ? 1 : 0; return path(`M${pt(P(c, a1, r1))}A${r1} ${r1} 0 ${L} 1 ${pt(P(c, a2, r1))}L${pt(P(c, a2, r2))}A${r2} ${r2} 0 ${L} 0 ${pt(P(c, a1, r2))}Z`, cls, extra); };
  const poly = (pts, cls, extra) => path('M' + pts.map(pt).join('L') + 'Z', cls, extra);
  const pl = (pts, cls, extra) => path('M' + pts.map(pt).join('L'), cls, extra);
  const rect = (x, y, w, h, rx, cls, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" class="${cls}" ${extra}/>`;
  const clip = (id, shape, inner) => `<clipPath id="${id}">${shape}</clipPath><g clip-path="url(#${id})">${inner}</g>`;
  const hitc = (x, y, r) => circ(f(x), f(y), r, 'hit-c');
  const sw = w => `style="stroke-width:${w}"`;
  const rot = (a, x, y) => `transform="rotate(${f(a)} ${f(x)} ${f(y)})"`;
  const mirY = (pts, c) => pts.map(([x, y]) => [x, 2 * c - y]);
  const mirX = (pts, c) => pts.map(([x, y]) => [2 * c - x, y]);
  const ctx = inner => `<g class="sn-ctx">${inner}</g>`; // context drawing: not tappable
  const vb = (id, inner) => clip(id, '<rect x="0" y="0" width="400" height="320"/>', inner); // keep long vessels inside the viewBox
  const inset = (id, cx, cy, r, inner) => circ(cx, cy, r, 'frame') + clip(id, `<circle cx="${cx}" cy="${cy}" r="${r - 1}"/>`, inner) + circ(cx, cy, r, 'sn-fr');

  /* ================= Auge ================= */
  const AC = [212, 160];
  const A = (a, r) => P(AC, a, r);
  const CIL = [[126, 111], [135, 98], [144.5, 88], [147.5, 92], [142, 101], [138, 108], [133.5, 113], [128, 114.5]];
  const IRIS = [[127, 113], [131.5, 114], [132.5, 127], [131.5, 140], [128.5, 142.5], [126, 139], [125.5, 126]];
  // front half of the eye; W wraps tappable parts (S on the main map, plain in the inset)
  const eyeFront = W => ell(122, 160, 20, 50, 'sn-aq') +
    W('ziliar', blob(CIL, 'sn-cil') + blob(mirY(CIL, 160), 'sn-cil') + [[[134, 112], [143, 121]], [[138, 107], [146, 120]], [[142, 102], [149, 121]]].map(p => line(p, 'sn-zon') + line(mirY(p, 160), 'sn-zon')).join('')) +
    W('linse', ell(145, 160, 17, 40, 'sn-lens') + line([[136, 140], [134, 160], [136, 180]], 'sn-lens-l')) +
    W('iris', blob(IRIS, 'sn-iris') + blob(mirY(IRIS, 160), 'sn-iris')) +
    W('hornhaut', path('M119.6 108A69 69 0 0 0 119.6 212L125.5 210A66 66 0 0 1 125.5 110Z', 'sn-cor'));
  const eyeWall = W => W('sklera', band(AC, 106, 99, -150.6, 150.6, 'sn-scl')) +
    band(AC, 99, 94.5, -133, 133, 'sn-chor') +
    W('glaskoerper', path(`M${pt(A(-128, 89))}A89 89 0 1 1 ${pt(A(128, 89))}L141 211Q178 160 141 109Z`, 'sn-vit')) +
    W('netzhaut', band(AC, 94.5, 89, -128, 128, 'sn-ret'));
  const plain = (id, s) => s;
  const MR = [[148, 252], [178, 266], [214, 276], [258, 280], [310, 278], [360, 270], [404, 262]];
  const LR = [[148, 68], [178, 52], [214, 44], [258, 46], [300, 62], [340, 90], [404, 130]];
  const auge = () => svgw('0 0 400 320', vb('sn-v-au',
    tube(LR, 9, 'sn-mus') + tube(MR, 9, 'sn-mus') +
    eyeWall(S) +
    ctx(line([A(26, 88), A(44, 87.5), A(66, 87)], 'sn-rv') + line([A(6, 88), A(-24, 87.5), A(-48, 87)], 'sn-rv')) +
    S('sehnerv', line([A(16, 99), [340, 197], [404, 211]], 'sn-dura', sw(31)) + line([A(16, 92), [340, 197], [404, 211]], 'sn-on', sw(23))) +
    S('papille_a', band(AC, 96, 83, 8, 24, 'sn-pap') + circ(f(A(16, 83)[0]), f(A(16, 83)[1]), 5, 'sn-vit')) +
    S('makula', band(AC, 96, 85, -16, 3, 'sn-mac') + circ(f(A(-6.5, 85)[0]), f(A(-6.5, 85)[1]), 4, 'sn-vit')) +
    eyeFront(S) +
    S('okulomotorius', line([[404, 238], [366, 250], [330, 268]], 'sn-n', sw(3)))) +
    zlabel(52, 26, 'temporal') + zlabel(52, 302, 'nasal'), 'Auge im Horizontalschnitt');

  const auge4 = () => {
    let gc = '', bip = '', rods = '', cones = '', rpe = '', cho = '';
    [30, 74, 118, 162, 206, 250].forEach(x => {
      gc += line([[x, 46], [x - 3, 40], [x - 12, 36]], 'sn-gax') + line([[x - 4, 61], [x - 10, 76]], 'sn-gd') + line([[x + 4, 61], [x + 11, 76]], 'sn-gd') + circ(x, 54, 8.5, 'sn-gc') + circ(x, 54, 3.2, 'sn-gc-n');
    });
    gc = pl([[8, 33], [262, 33]], 'sn-gax', sw(2.5)) + pl([[8, 38], [262, 38]], 'sn-gax', sw(2)) + gc;
    for (let x = 19; x < 262; x += 22) bip += line([[x, 92], [x, 76]], 'sn-bip-l') + line([[x, 104], [x, 128]], 'sn-bip-l') + ell(x, 98, 4, 6.5, 'sn-bip');
    bip += line([[96, 124], [120, 122], [150, 125], [176, 122]], 'sn-bip-l') + ell(136, 122, 7, 3.6, 'sn-bip');
    for (let i = 0; i <= 20; i++) {
      const x = 14 + i * 12;
      if (i % 3 === 1) cones += rect(x - 4.5, 128, 9, 5, 1.5, 'sn-cone') + line([[x, 133], [x, 165]], 'sn-cone-l') + ell(x, 170, 4.6, 5.5, 'sn-cone-n') + ell(x, 191, 6, 14, 'sn-cone') + path(`M${x - 5.2} 204L${x + 5.2} 204L${x} 228Z`, 'sn-cone-o');
      else rods += circ(x, 131, 2.6, 'sn-rod') + line([[x, 131], [x, 177]], 'sn-rod-l') + ell(x, 148 + (i % 2) * 14, 3.8, 5, 'sn-rod-n') + rect(x - 3, 177, 6, 27, 2, 'sn-rod') + rect(x - 3, 204, 6, 34, 2, 'sn-rod-o') + line([[x, 207], [x, 236]], 'sn-disc');
    }
    for (let x = 8; x < 262; x += 24) rpe += rect(x + 1, 238, 22, 20, 3, 'sn-rpe') + ell(x + 12, 251.5, 5, 3.4, 'sn-rpe-n') + [[6, 242.5], [12, 241.5], [18, 243], [9, 246.5], [16, 246]].map(([dx, y]) => circ(x + dx, y, 1.4, 'sn-mel')).join('');
    for (let x = 20; x < 262; x += 12) rpe += line([[x, 239], [x, 226]], 'sn-mv');
    cho = rect(8, 259, 254, 40, 0, 'sn-chor');
    for (let x = 20; x < 262; x += 26) cho += ell(x, 267, 9.5, 4.6, 'sn-art');
    [[34, 'sn-art'], [86, 'sn-ven'], [138, 'sn-art'], [190, 'sn-ven'], [242, 'sn-art']].forEach(([x, c]) => { cho += circ(x, 286, 7.5, c); });
    [[60, 285], [112, 288], [164, 284], [216, 287]].forEach(([x, y]) => { cho += path(`M${x - 8} ${y}Q${x} ${y - 4} ${x + 8} ${y}Q${x} ${y + 3} ${x - 8} ${y}Z`, 'sn-melc'); });
    const KA = [332, 82], PA = [332, 240], KS = 4.2, K = (x, y) => [f(KA[0] + (x - 125.5) * KS), f(KA[1] + (y - 112) * KS)];
    return svgw('0 0 400 320',
      rect(8, 8, 254, 304, 12, 'frame') +
      clip('sn-c-ret', '<rect x="8.5" y="8.5" width="253" height="303" rx="12"/>',
        rect(8, 8, 254, 24, 0, 'sn-vit') + rect(8, 30, 254, 208, 0, 'sn-retbg') +
        S('ganglienzellen', gc) + ctx(bip) + S('staebchen', rods) + S('zapfen', cones) + S('pigmentepithel', rpe) +
        pl([[8, 259], [262, 259]], 'sn-bruch') + S('aderhaut', cho) + rect(8, 299, 254, 14, 0, 'sn-scl')) +
      rect(8, 8, 254, 304, 12, 'sn-fr') +
      zlabel(135, 23, 'Glaskörper') + zlabel(135, 310, 'Sklera') +
      // inset: chamber angle (auge coordinates ×KS around the angle)
      inset('sn-c-ka', KA[0], KA[1], 56,
        `<g class="sn-nss" transform="translate(${f(KA[0] - 125.5 * KS)} ${f(KA[1] - 112 * KS)}) scale(${KS})">${eyeWall(plain)}${eyeFront(plain)}</g>` +
        ctx([[0, 0], [1, 1.2], [2, 2.4]].map(([i, d]) => line([K(123.6 + d * .5, 109.4 + d * .2), K(125.4 + d * .3, 110.9 + d * .15)], 'sn-trab')).join('') + line([K(118, 128), K(120, 121), K(123.8, 113.2)], 'sn-flow')) +
        S('schlemm', ell(...K(122.4, 108.5), 7, 3.4, 'sn-schlemm', rot(-56, ...K(122.4, 108.5))) + line([K(121.6, 107.4), K(122.8, 101), K(126, 96)], 'sn-schlemm-l') + hitc(...K(122.4, 108.5), 9))) +
      zlabel(332, 18, 'Kammerwinkel') +
      // inset: optic nerve head
      inset('sn-c-pa', PA[0], PA[1], 56,
        rect(270, 178, 126, 126, 0, 'sn-vit') +
        path('M270 204H304Q313 206 314 222H270Z', 'sn-ret') + path('M396 204H360Q351 206 350 222H396Z', 'sn-ret') +
        rect(270, 221, 42, 8, 0, 'sn-chor') + rect(352, 221, 44, 8, 0, 'sn-chor') +
        rect(270, 228, 42, 18, 0, 'sn-scl') + rect(352, 228, 44, 18, 0, 'sn-scl') +
        rect(303, 244, 9, 60, 0, 'sn-scl') + rect(352, 244, 9, 60, 0, 'sn-scl') +
        rect(312, 206, 40, 100, 0, 'sn-onf') + path('M321 206Q332 224 343 206Z', 'sn-vit') +
        ctx(pl([[312, 232], [352, 232]], 'sn-lam') + pl([[312, 238], [352, 238]], 'sn-lam') + pl([[312, 244], [352, 244]], 'sn-lam') +
          tube([[345, 304], [339, 262], [337, 214]], 5, 'v-blue') + tube([[337, 213], [352, 209], [396, 209]], 3, 'v-blue') + tube([[337, 213], [320, 210], [270, 210]], 3, 'v-blue')) +
        S('a_centralis', tube([[284, 304], [314, 288], [326, 262], [328, 214]], 5, 'v-red') + tube([[328, 212], [346, 204], [396, 203]], 3, 'v-red') + tube([[328, 212], [312, 204], [270, 203]], 3, 'v-red'))) +
      zlabel(332, 177, 'Papille'), 'Netzhautschichten, Kammerwinkel und Papille');
  };

  /* ================= Ohr ================= */
  const PINNA = [[98, 104], [86, 66], [64, 38], [38, 30], [18, 50], [10, 100], [12, 152], [20, 198], [34, 236], [54, 260], [74, 264], [86, 248], [84, 224], [92, 196]];
  const SPIRAL = (() => { const c = [312, 208], pts = []; for (let t = 0; t <= 1.0001; t += 0.04) { const a = 200 + t * 900, r = 25 - t * 21; pts.push([c[0] + Math.cos(rad(a)) * r * 1.15, c[1] + Math.sin(rad(a)) * r]); } return pts; })();
  const ohr = () => svgw('0 0 400 320',
    blob([[92, 88], [150, 68], [172, 90], [166, 214], [140, 238], [92, 224]], 'sn-soft') +
    path('M150 72Q186 40 262 32H396V300H336Q284 300 244 276Q206 256 174 248Q150 238 146 212V100Q146 84 150 72Z', 'sn-bone') +
    S('ohrmuschel', blob(PINNA, 'sn-pinna') + line([[78, 64], [50, 46], [28, 70], [22, 130], [30, 190], [46, 232], [64, 250]], 'sn-pinna-l') + line([[84, 92], [62, 104], [56, 150], [66, 196], [80, 214]], 'sn-pinna-l')) +
    S('gehoergang', tube([[92, 150], [130, 145], [170, 152], [206, 150]], 22, 'sn-canal')) +
    S('pauke', blob([[205, 122], [212, 98], [230, 86], [250, 88], [259, 104], [259, 140], [262, 176], [255, 198], [238, 209], [222, 204], [214, 186], [210, 152]], 'sn-air')) +
    S('tube_o', tube([[232, 204], [246, 236], [290, 270], [352, 302]], 9, 'sn-tub')) +
    S('trommelfell', line([[201, 123], [209, 150], [213, 180]], 'sn-tm')) +
    S('chorda', pl([[268, 131], [258, 134], [257, 236]], 'sn-n sn-dash', sw(3)) + line([[257, 236], [254, 270], [250, 300]], 'sn-n', sw(3)) +
      line([[257, 207], [249, 180], [239, 148], [232, 126], [222, 108], [212, 94], [206, 84]], 'sn-n', sw(2.2))) +
    S('knoechelchen', ell(227, 104, 7, 8, 'sn-oss') + line([[225, 111], [219, 130], [212, 151]], 'sn-oss-l', sw(4.5)) +
      ell(241, 103, 7, 7.5, 'sn-oss') + line([[246, 100], [253, 97]], 'sn-oss-l', sw(4)) + line([[242, 108], [246, 128], [247, 146]], 'sn-oss-l', sw(4)) + circ(249, 150, 3, 'sn-oss') +
      path('M249 149L264 142H268V161H264L249 154Z', 'sn-oss') + path('M255 151.5L263 147.5V156L255 152.5Z', 'sn-air')) +
    S('cochlea', tube([[290, 166], [296, 186]], 12, 'sn-labt') + ell(312, 208, 31, 25, 'sn-lab') + line(SPIRAL, 'sn-coch-l')) +
    S('bogengaenge', tube([[280, 134], [266, 108], [266, 78], [284, 60], [304, 64], [311, 88], [304, 116], [296, 134]], 7, 'sn-labt') +
      tube([[302, 138], [308, 118], [328, 99], [350, 93], [364, 105], [360, 122], [340, 127], [318, 129], [304, 142]], 7, 'sn-labt') +
      tube([[278, 134], [264, 126], [260, 112], [268, 102], [282, 106], [288, 128]], 6, 'sn-labt') + ell(276, 131, 5, 4, 'sn-lab') + ell(298, 131, 5, 4, 'sn-lab')) +
    ctx(ell(286, 152, 18, 20, 'sn-lab')) +
    S('sacc_utr', ell(285, 143, 10, 6, 'sn-memb') + circ(290, 162, 6.5, 'sn-memb')) +
    S('n_viii', line([[305, 152], [330, 152], [362, 152]], 'sn-n', sw(4)) + line([[336, 192], [350, 166], [364, 153]], 'sn-n', sw(4)) + line([[362, 152], [398, 150]], 'sn-n', sw(6.5))) +
    zlabel(70, 296, 'Außenohr') + zlabel(222, 18, 'Mittelohr') + zlabel(330, 18, 'Innenohr'), 'Ohr im Frontalschnitt');

  const ohr4 = () => {
    let ohc = '', oto = '', sg = '';
    [184, 200, 216].forEach((x, k) => {
      const y = 150 + k * 1.5;
      ohc += line([[x - 4, y], [x - 5.5, y - 9]], 'sn-stc') + line([[x, y - 0.5], [x, y - 12]], 'sn-stc') + line([[x + 4, y], [x + 5.5, y - 9]], 'sn-stc') + rect(x - 5.5, y, 11, 32, 4, 'sn-hc') + circ(x, y + 25, 3, 'sn-hc-n');
    });
    for (let i = 0; i < 9; i++) { const x = 312 + (i % 5) * 16 + (i > 4 ? 8 : 0), y = i > 4 ? 60 : 50; oto += path(`M${x} ${y - 5}L${x + 5} ${y}L${x} ${y + 5}L${x - 5} ${y}Z`, 'sn-oto'); }
    [[16, 186], [26, 196], [14, 202], [30, 182], [22, 212], [32, 206]].forEach(([x, y]) => { sg += circ(x, y, 4.5, 'sn-sg'); });
    const vhc = (x, flask) => (flask ? blob([[x - 7, 140], [x + 7, 140], [x + 9, 160], [x + 6, 184], [x, 190], [x - 6, 184], [x - 9, 160]], 'sn-hc') : rect(x - 7, 140, 14, 46, 5, 'sn-hc')) + circ(x, 172, 3.4, 'sn-hc-n') +
      [-6, -3, 0, 3].map((d, i) => line([[x + d, 140], [x + d, 128 - i * 4]], 'sn-stc')).join('') + line([[x + 6.5, 140], [x + 6.5, 104]], 'sn-kino');
    return svgw('0 0 400 320',
      rect(4, 4, 292, 312, 14, 'sn-bone') +
      ctx(sg + line([[18, 206], [10, 250], [8, 306]], 'sn-nf', sw(3)) + line([[28, 198], [60, 200], [92, 204]], 'sn-nf', sw(2.4))) +
      path('M40 28Q40 16 52 16H274Q286 16 286 28V40L70 150H40Z', 'sn-peri') +
      path('M40 206H92L266 214H286V294Q286 306 274 306H52Q40 306 40 294Z', 'sn-peri') +
      path('M280 24L296 18V252L280 246Z', 'sn-lig') +
      S('endolymphe', poly([[70, 150], [286, 40], [286, 214], [266, 214], [92, 210], [90, 180]], 'sn-endo')) +
      blob([[40, 150], [66, 146], [94, 158], [92, 184], [62, 194], [40, 190]], 'sn-limb') +
      S('stria', blob([[286, 42], [287, 128], [286, 212], [272, 206], [266, 128], [272, 54]], 'sn-stria') + [64, 86, 108, 130, 152, 174, 196].map(y => circ(277, y, 2.2, 'sn-capd')).join('')) +
      ctx(pl([[92, 210], [266, 214]], 'sn-bm') + pl([[70, 150], [286, 40]], 'sn-reiss')) +
      S('corti', blob([[98, 210], [100, 192], [110, 174], [130, 160], [158, 151], [190, 146], [222, 148], [242, 160], [254, 184], [262, 213]], 'sn-corti') +
        poly([[140, 210], [155, 160], [170, 210]], 'sn-peri') + line([[140, 210], [154.5, 159]], 'sn-pil') + line([[170, 210], [155.5, 159]], 'sn-pil')) +
      ctx(line([[92, 204], [106, 200], [122, 196]], 'sn-nf') + line([[100, 203], [150, 200], [184, 184]], 'sn-nf sn-dash') + line([[102, 205], [160, 204], [200, 186]], 'sn-nf sn-dash') + line([[104, 207], [170, 206], [216, 188]], 'sn-nf sn-dash')) +
      S('ihz', blob([[115, 160], [133, 158], [137, 176], [133, 194], [123, 197], [113, 182]], 'sn-hc') + circ(125, 184, 3.4, 'sn-hc-n') + line([[118, 159], [117, 150]], 'sn-stc') + line([[124, 158], [124, 148]], 'sn-stc') + line([[130, 158], [131, 149]], 'sn-stc')) +
      S('ahz', ohc) +
      S('corti', blob([[64, 150], [96, 138], [132, 131], [172, 128], [212, 131], [236, 137], [224, 141.5], [178, 139.5], [136, 144], [102, 154], [76, 162]], 'sn-tect')) +
      zlabel(140, 46, 'Scala vestibuli') + zlabel(164, 274, 'Scala tympani') +
      rect(304, 34, 92, 272, 10, 'frame') +
      ctx(rect(305, 35, 90, 38, 9, 'sn-gel') + oto + rect(305, 70, 90, 46, 0, 'sn-gel') +
        rect(305, 186, 90, 60, 0, 'sn-sup') + [316, 350, 384].map(x => rect(x - 6, 120, 12, 70, 4, 'sn-sup')).join('') + pl([[305, 246], [395, 246]], 'sn-bm') +
        path('M320 166Q318 194 330 196Q342 194 340 166', 'sn-nf', sw(3)) + line([[330, 196], [330, 300]], 'sn-nf', sw(2.4)) + circ(370, 190, 3.5, 'sn-sg') + line([[370, 193], [372, 300]], 'sn-nf', sw(2))) +
      S('haarz_vest', vhc(330, true) + vhc(368, false)) +
      zlabel(350, 26, 'Macula'), 'Cochlea im Querschnitt mit Corti-Organ');
  };

  /* ================= Haut ================= */
  const yE = x => 66 + 5 * Math.sin((x - 6) / 18 * Math.PI);
  const yD = x => 194 + 4 * Math.sin(x / 40);
  const xs = (a, b, s) => { const r = []; for (let x = a; x < b; x += s) r.push(x); r.push(b); return r; };
  const haut = () => {
    let fat = '';
    for (let r = 0; r < 6; r++) for (let x = 14 + (r % 2) * 12; x < 284; x += 24) { const y = 212 + r * 20; if (y < 312) fat += ell(x, y, 11.5, 9.5, 'sn-fat'); }
    const top = xs(6, 284, 4), epiB = top.map(x => [x, yE(x)]), derB = top.map(x => [x, yD(x)]);
    const FOL = [[120, 44], [112, 90], [100, 140], [88, 186]];
    return svgw('0 0 400 320',
      S('subkutis', poly([...derB, [284, 314], [6, 314]], 'sn-sub') + clip('sn-c-sub', poly([...derB, [284, 314], [6, 314]], ''), fat)) +
      S('dermis', poly([...epiB, ...derB.slice().reverse()], 'sn-der') + [96, 124, 152, 176].map(y => line([[6, y], [60, y - 4], [130, y + 3], [200, y - 3], [284, y + 2]], 'sn-coll')).join('')) +
      S('epidermis', poly([[6, 43], [284, 43], ...epiB.slice().reverse()], 'sn-epi') + pl([[6, 46], [284, 46]], 'sn-epi-l')) +
      ctx(line([[6, 82], [70, 86], [150, 80], [220, 86], [284, 82]], 'v-red', sw(2)) + line([[6, 88], [70, 92], [150, 86], [220, 92], [284, 88]], 'v-blue', sw(2)) +
        line([[6, 196], [70, 200], [150, 194], [220, 200], [284, 196]], 'v-red', sw(2.5)) + line([[6, 203], [70, 207], [150, 201], [220, 207], [284, 203]], 'v-blue', sw(2.5)) +
        line([[178, 196], [174, 140], [178, 86]], 'v-red', sw(1.6)) + line([[272, 201], [268, 140], [272, 90]], 'v-blue', sw(1.6))) +
      S('apokrin', line([[116, 62], [102, 72], [82, 108], [64, 160], [52, 204], [46, 216]], 'sn-apo', sw(3)) + line([[46, 216], [58, 224], [52, 240], [36, 240], [28, 226], [38, 216], [50, 230], [42, 250], [26, 248], [20, 232]], 'sn-apo', sw(6))) +
      S('haarfollikel', tube(FOL, 18, 'sn-fol') + ell(87, 194, 14, 12, 'sn-folb') + ell(87, 201, 6, 5, 'sn-papd') + line([[88, 192], ...FOL.slice().reverse().slice(1), [126, 22], [133, 4]], 'sn-hair', sw(4)) + line([[104, 128], [126, 106], [150, 82], [166, 70]], 'sn-arr', sw(3.5))) +
      S('talg', circ(126, 86, 8, 'sn-seb') + circ(138, 96, 7.5, 'sn-seb') + circ(124, 102, 7, 'sn-seb') + circ(136, 82, 5.5, 'sn-seb') + line([[118, 88], [112, 84]], 'sn-seb-l', sw(4))) +
      S('schweiss', line([[240, 44], [244, 50], [236, 55], [244, 60], [238, 66], [234, 100], [236, 140], [232, 176]], 'sn-ecc', sw(3)) + line([[232, 176], [244, 184], [238, 198], [222, 200], [212, 188], [220, 176], [232, 186], [226, 198], [214, 206]], 'sn-ecc', sw(5.5))) +
      S('pacini', ell(254, 260, 13, 24, 'sn-pac', rot(-14, 254, 260)) + ell(254, 260, 9, 17, 'sn-pac-l', rot(-14, 254, 260)) + ell(254, 260, 5, 10, 'sn-pac-l', rot(-14, 254, 260)) + line([[254, 252], [256, 266], [262, 290], [264, 314]], 'sn-n', sw(2.4))) +
      // nail: longitudinal section of a fingertip
      rect(290, 24, 106, 292, 10, 'frame') +
      clip('sn-c-fi', '<rect x="290.5" y="24.5" width="105" height="291" rx="10"/>',
        ctx(blob([[322, 18], [384, 18], [386, 100], [388, 180], [384, 240], [370, 276], [350, 292], [334, 288], [326, 272], [320, 220], [318, 150], [319, 80]], 'sn-finger') +
          path('M332 18H370V70Q372 90 362 95Q350 99 340 95Q330 90 332 70Z', 'sn-phal') +
          path('M338 104Q352 100 366 104Q370 116 361 132Q354 170 352 208Q355 230 344 238Q333 236 333 220Q336 170 335 132Q330 116 338 104Z', 'sn-phal') +
          path('M332 152Q334 210 332 266', 'sn-nbed', sw(5))) +
        S('nagel', blob([[328, 112], [338, 114], [341, 132], [338, 150], [330, 152], [327, 134]], 'sn-matrix') + path('M314 124Q322 118 327 128L328 200Q327 250 330 276Q328 290 315 293Q309 260 311 200Z', 'sn-nail') + hitc(320, 210, 9)) +
        ctx(path('M319 96Q310 118 310 132Q316 138 328 134L325 98Z', 'sn-finger') + line([[310, 132], [319, 135]], 'sn-fold'))) +
      zlabel(343, 18, 'Fingerkuppe'), 'Haut im Schnitt');
  };

  const haut4 = () => {
    const yJ = x => 196 + 14 * Math.sin((x - 8) / 150 * 2 * Math.PI);
    const COL = [336, 374]; // keratinocyte column
    const inCol = x => x > COL[0] - 6 && x < COL[1] + 6;
    const xsJ = xs(4, 396, 4);
    let corn = '', gran = '', spin = '', bas = '', mel = '', lang = '';
    for (let r = 0; r < 6; r++) for (let x = 6 + (r % 2) * 20; x < 396; x += 40) { if (inCol(x) || inCol(x + 34)) continue; corn += rect(x, 18 + r * 7, 36, 6, 3, 'sn-corn', r === 0 ? rot(-3, x, 18) : ''); }
    for (let x = 8; x < 396; x += 26) { if (inCol(x + 11)) continue; gran += ell(x + 11, 69, 12, 5, 'sn-gran') + [3, 9, 15, 19].map(d => circ(x + d + 1, 68 + (d % 2), 1.3, 'sn-gran-d')).join(''); }
    const hex = (cx, cy, r) => poly([0, 60, 120, 180, 240, 300].map(a => P([cx, cy], a + 30, r)), 'sn-spin');
    for (let r = 0; r < 5; r++) for (let x = 12 + (r % 2) * 11; x < 396; x += 22) { const y = 90 + r * 19; if (y + 10 > yJ(x) - 24 || inCol(x)) continue; spin += hex(x, y, 11) + circ(x, y, 3.4, 'sn-nuc'); }
    for (let x = 10; x < 396; x += 13) {
      if (inCol(x) || Math.abs(x - 62) < 8 || Math.abs(x - 222) < 8) continue;
      const y = yJ(x), a = Math.atan2(yJ(x + 1) - yJ(x - 1), 2) * 180 / Math.PI;
      bas += `<g ${rot(a, x, y - 11)}>${rect(x - 5.5, y - 21, 11, 20, 3.5, 'sn-bas')}${ell(x, y - 10, 3, 4.5, 'sn-nuc-b')}</g>`;
    }
    [62, 222].forEach(x => {
      const y = yJ(x) - 9, D = [[[-6, -14], [-16, -30], [-20, -50]], [[2, -16], [6, -34], [4, -56]], [[6, -10], [18, -22], [30, -34]], [[-8, -4], [-22, -10], [-34, -12]]];
      mel += D.map(p => line([[x, y], ...p.map(([dx, dy]) => [x + dx, y + dy])], 'sn-mel-d', sw(2))).join('') + ell(x, y, 6, 8.5, 'sn-mel-c') + circ(x, y + 1, 2.6, 'sn-mel-n') +
        D.map(p => { const [dx, dy] = p[2]; return circ(x + dx, y + dy, 2, 'sn-mel'); }).join('');
    });
    [[150, 118], [292, 104]].forEach(([x, y]) => { lang += [[-24, -10], [-14, 18], [10, 22], [24, -4], [6, -22]].map(([dx, dy]) => line([[x, y], [x + dx * .55, y + dy * .6], [x + dx, y + dy]], 'sn-lang-d', sw(3))).join('') + circ(x, y, 7, 'sn-lang') + path(`M${x - 3} ${y - 2}q3 4 6 0`, 'sn-lang-n'); });
    // keratinocyte column: basal → spinous → granular → corneocyte
    const cx = (COL[0] + COL[1]) / 2, yb = yJ(cx);
    const kz = rect(cx - 7, yb - 22, 14, 21, 4, 'sn-kz') + ell(cx, yb - 11, 3.4, 5, 'sn-nuc-b') +
      [[yb - 42, 12, 1], [yb - 66, 14, .86], [yb - 90, 16, .74], [yb - 112, 17, .62]].map(([y, r, sy]) => poly([0, 60, 120, 180, 240, 300].map(a => { const q = P([cx, y], a + 30, r); return [q[0], y + (q[1] - y) * sy]; }), 'sn-kz') + circ(cx, y, 3.4, 'sn-nuc')).join('') +
      ell(cx, 69, 18, 5.5, 'sn-kz') + [-9, -3, 4, 10].map(d => circ(cx + d, 69, 1.4, 'sn-gran-d')).join('') +
      rect(cx - 19, 46, 38, 6, 3, 'sn-kz') + rect(cx - 17, 32, 36, 6, 3, 'sn-kz') + rect(cx - 15, 18, 34, 6, 3, 'sn-kz', rot(-5, cx, 21)) +
      line([[388, yb - 6], [388, 30]], 'sn-arrow') + path('M384 36L388 26L392 36', 'sn-arrow');
    return svgw('0 0 400 320', clip('sn-c-epi', '<rect x="4" y="10" width="392" height="306" rx="8"/>',
      ctx(poly([...xsJ.map(x => [x, yJ(x)]), [396, 316], [4, 316]], 'sn-der') + [236, 262, 290].map(y => line([[4, y], [80, y - 5], [160, y + 4], [240, y - 4], [320, y + 3], [396, y - 2]], 'sn-coll')).join('') +
        line([[264, 260], [264, 206], [270, 192], [276, 206], [278, 262]], 'v-red', sw(2)) + line([[270, 192], [276, 206], [278, 262]], 'v-blue', sw(2))) +
      S('corneum', rect(4, 14, 392, 48, 0, 'sn-corn-bg') + corn) +
      ctx(rect(4, 62, 392, 14, 0, 'sn-gran-bg') + gran) +
      S('spinosum', poly([[4, 76], [396, 76], ...xsJ.slice().reverse().map(x => [x, yJ(x) - 24])], 'sn-spin-bg') + spin) +
      S('basale', poly([...xsJ.map(x => [x, yJ(x) - 24]), ...xsJ.slice().reverse().map(x => [x, yJ(x)])], 'sn-bas-bg') + bas) +
      ctx(pl(xsJ.map(x => [x, yJ(x) + 0.5]), 'sn-bmem')) +
      S('melanozyten', mel) + S('langerhans', lang) + S('keratinozyten', kz) +
      S('meissner', line([[124, 290], [122, 250], [118, 226], [124, 214]], 'sn-n', sw(2.4)) + ell(120, 206, 9, 15, 'sn-meis') + [196, 201, 206, 211, 216].map(y => path(`M${112} ${y}Q120 ${y + 3} 128 ${y}`, 'sn-meis-l')).join(''))) +
      zlabel(40, 306, 'Dermis'), 'Epidermis mit Zelltypen');
  };

  /* ================= Schilddrüse ================= */
  const RLOBE = [[176, 62], [164, 70], [150, 96], [140, 132], [136, 166], [142, 190], [158, 201], [176, 190], [183, 162], [183, 138], [181, 108], [180, 80]];
  const STA = [[126, 46], [142, 40], [158, 48], [168, 66]], STAb = [[166, 64], [178, 88], [181, 120], [190, 144]];
  const ITA = [[70, 270], [72, 228], [92, 212], [122, 206], [146, 196]], ITAb = [[146, 196], [162, 192], [180, 184]];
  const RLN = [[118, 318], [148, 270], [170, 222], [178, 172], [180, 126]];
  const CCA = [[120, 324], [114, 200], [116, 70], [114, 52]], ICA = [[112, 54], [104, 22], [102, -4]], ECA = [[116, 54], [126, 24], [130, -4]], SUB = [[124, 318], [80, 304], [20, 310], [-6, 316]], TTC = [[70, 306], [70, 270]];
  const schilddruese = () => svgw('0 0 400 320', vb('sn-v-sd',
    ctx(rect(152, 12, 96, 10, 5, 'sn-hyoid') + line([[156, 17], [130, 12]], 'sn-hyoid-l') + line([[244, 17], [270, 12]], 'sn-hyoid-l')) +
    `<g class="sn-ctx sn-faint">${[[ICA, 9], [ECA, 8], [SUB, 12], [TTC, 6]].map(([p, w]) => tube(p, w, 'v-red') + tube(mirX(p, 200), w, 'v-red')).join('')}</g>` +
    ctx(path('M180 128H220V320H180Z', 'sn-lar') + [128, 141, 154, 167, 180, 193, 206, 219, 232, 245, 258, 271, 284, 297, 310].map(y => rect(180, y, 40, 8, 3.5, 'sn-ring')).join('') +
      blob([[154, 40], [186, 34], [200, 47], [214, 34], [246, 40], [242, 74], [222, 100], [200, 108], [178, 100], [158, 74]], 'sn-lar') + line([[200, 50], [200, 104]], 'sn-lar-l') + rect(176, 112, 48, 14, 6, 'sn-lar')) +
    S('a_thyr_inf', tube(ITA, 5, 'v-red') + line(ITAb, 'v-red sn-dash', sw(2.5)) + tube(mirX(ITA, 200), 5, 'v-red') + line(mirX(ITAb, 200), 'v-red sn-dash', sw(2.5))) +
    `<g class="sn-ctx sn-faint">${tube(CCA, 12, 'v-red') + tube(mirX(CCA, 200), 12, 'v-red')}</g>` +
    S('seitenlappen', blob(RLOBE, 'sn-thy') + blob(mirX(RLOBE, 200), 'sn-thy')) +
    S('isthmus', blob([[180, 146], [200, 142], [220, 146], [222, 170], [200, 177], [178, 170]], 'sn-thy-i')) +
    S('pyramidalis', blob([[206, 146], [213, 145], [216, 112], [214, 84], [210, 62], [204, 63], [204, 90], [206, 120]], 'sn-thy-p')) +
    S('a_thyr_sup', tube(STA, 4.5, 'v-red') + line(STAb, 'v-red', sw(2.4)) + tube(mirX(STA, 200), 4.5, 'v-red') + line(mirX(STAb, 200), 'v-red', sw(2.4))) +
    S('recurrens_s', line(RLN, 'sn-n sn-dash', sw(3)) + line([[226, 318], [223, 250], [221, 180], [220, 126]], 'sn-n sn-dash', sw(3))) +
    S('nsd', [[166, 104], [234, 104], [151, 184], [249, 184]].map(([x, y]) => ell(x, y, 9, 7, 'sn-nsd')).join(''))) +
    zlabel(348, 170, 'Ansicht von vorn') + zlabel(348, 184, 'gestrichelt: hinten'), 'Schilddrüse von vorn');

  const ring = (cx, cy, ro, ri, n, cls, ncls) => { let s = ''; for (let i = 0; i < n; i++) { const a1 = i * 360 / n + 1.2, a2 = (i + 1) * 360 / n - 1.2, m = P([cx, cy], (a1 + a2) / 2, (ro + ri) / 2); s += band([cx, cy], ro, ri, a1, a2, cls) + circ(f(m[0]), f(m[1]), Math.min(3, (ro - ri) * .28), ncls); } return s; };
  const follicle = (cx, cy, r) => ring(cx, cy, r, r - 8, Math.max(8, Math.round(2 * Math.PI * (r - 4) / 10)), 'sn-tz', 'sn-tz-n') + circ(cx, cy, r - 8, 'sn-col');
  const schilddruese4 = () => {
    const BF = [134, 160];
    const small = [[36, 50, 30], [226, 46, 32], [30, 160, 24], [238, 162, 22], [36, 272, 32], [228, 274, 34]];
    const vac = [0, 50, 110, 170, 230, 290].map(a => { const p = P(BF, a, 53); return circ(f(p[0]), f(p[1]), 3.4, 'sn-vac'); }).join('');
    const cz = (x, y, a) => ell(x, y, 9, 6.5, 'sn-cz', a ? rot(a, x, y) : '') + circ(x, y, 2.8, 'sn-cz-n');
    const ccp = P(BF, 145, 70);
    let chief = '';
    [[184, 3], [222, 4], [260, 4], [292, 3]].forEach(([y, n], r) => { for (let i = 0; i < n + 1; i++) { const x = 286 + i * 22 + (r % 2) * 11; if (x > 386) continue; chief += circ(x, y, 8, 'sn-hz') + circ(x, y, 3, 'sn-hz-n'); } });
    return svgw('0 0 400 320',
      rect(4, 4, 260, 312, 12, 'sn-int') +
      ctx([[[70, 4], [86, 60], [70, 110], [66, 160], [72, 212], [96, 316]], [[200, 4], [190, 80], [214, 118]], [[264, 214], [212, 232], [180, 316]], [[4, 214], [60, 220], [96, 238]]].map(p => line(p, 'v-red', sw(2))).join('')) +
      S('follikel', small.map(([x, y, r]) => follicle(x, y, r)).join('') + circ(BF[0], BF[1], 75.5, 'sn-bmf')) +
      S('thyreozyt', ring(BF[0], BF[1], 74, 59, 28, 'sn-tz', 'sn-tz-n')) +
      S('kolloid', circ(BF[0], BF[1], 59, 'sn-col') + vac) +
      S('czelle', cz(ccp[0], ccp[1], 55) + cz(128, 34) + cz(252, 216, 30)) +
      // inset: thyrocyte with TSH receptors
      rect(272, 22, 124, 128, 10, 'frame') + zlabel(334, 16, 'Thyreozyt') +
      clip('sn-c-tz', '<rect x="272.5" y="22.5" width="123" height="127" rx="10"/>',
        S('kolloid', rect(272, 22, 124, 30, 0, 'sn-col') + circ(300, 40, 4, 'sn-vac') + circ(360, 38, 3.4, 'sn-vac')) +
        S('thyreozyt', rect(284, 52, 100, 70, 6, 'sn-tz') + ell(334, 92, 11, 8, 'sn-tz-n') + xs(290, 378, 8).map(x => line([[x, 52], [x, 46]], 'sn-mvt')).join('') + circ(312, 66, 4, 'sn-ves') + circ(354, 70, 3.4, 'sn-ves')) +
        ctx(rect(272, 132, 124, 14, 0, 'sn-capb') + ell(306, 139, 7, 4, 'rbc') + ell(356, 139, 7, 4, 'rbc') + pl([[272, 126], [396, 126]], 'sn-bml')) +
        S('tsh_r', [304, 334, 364].map(x => path(`M${x} 122V114M${x} 114L${x - 4} 108M${x} 114L${x + 4} 108`, 'sn-rec')).join(''))) +
      // inset: parathyroid
      rect(272, 172, 124, 142, 10, 'frame') + zlabel(334, 166, 'Nebenschilddrüse') +
      clip('sn-c-nsd', '<rect x="272.5" y="172.5" width="123" height="141" rx="10"/>',
        ctx([[203], [241], [277]].map(([y]) => line([[272, y], [330, y + 3], [396, y - 2]], 'v-red', sw(2))).join('') + circ(372, 300, 16, 'sn-fatc') + [[298, 306], [316, 304]].map(([x, y]) => circ(x, y, 9.5, 'sn-oxy') + circ(x, y, 3, 'sn-hz-n')).join('')) +
        S('hauptzelle_nsd', chief)), 'Schilddrüsenfollikel und Nebenschilddrüse');
  };

  /* ================= Nebenniere ================= */
  const KR = [[52, 166], [76, 172], [88, 196], [84, 218], [78, 232], [84, 250], [84, 276], [68, 298], [44, 300], [26, 282], [18, 240], [22, 196], [34, 174]];
  const KL = [[222, 148], [246, 156], [256, 184], [258, 224], [254, 262], [236, 284], [212, 282], [198, 262], [194, 244], [198, 228], [192, 212], [196, 190], [204, 164]];
  const nebenniere = () => svgw('0 0 400 320', vb('sn-v-nn',
    tube([[140, -10], [140, 330]], 18, 'v-red') +
    ctx(line([[140, 92], [110, 80], [70, 70], [30, 66]], 'v-red', sw(3)) + line([[140, 92], [180, 80], [220, 74], [262, 70]], 'v-red', sw(3))) +
    tube([[140, 212], [110, 222], [82, 234]], 6, 'v-red') + tube([[140, 208], [170, 210], [196, 214]], 6, 'v-red') +
    S('a_supra', [[[56, 69], [54, 96], [56, 122]], [[80, 74], [76, 100], [72, 126]], [[140, 150], [116, 152], [92, 152]], [[100, 226], [90, 196], [82, 166]],
      [[214, 75], [222, 100], [226, 130]], [[236, 73], [236, 100], [234, 128]], [[140, 156], [176, 158], [204, 162]], [[180, 211], [190, 200], [198, 192]]].map(p => line(p, 'v-red', sw(2.4))).join('')) +
    tube([[112, 330], [112, -10]], 20, 'v-blue') +
    path(MEDSVG.cr(KR), 'c-kidney') + path(MEDSVG.cr(KL), 'c-kidney') +
    S('nn_re', blob([[28, 172], [38, 140], [58, 116], [80, 128], [94, 152], [88, 170], [60, 168]], 'sn-adr')) +
    S('nn_li', blob([[210, 150], [222, 132], [234, 128], [238, 142], [226, 156], [212, 176], [202, 200], [194, 206], [191, 190], [198, 166]], 'sn-adr')) +
    tube([[196, 226], [160, 222], [118, 222]], 8, 'v-blue') + tube([[82, 246], [106, 238]], 8, 'v-blue') +
    S('v_supra', tube([[90, 146], [106, 146]], 4, 'v-blue') + tube([[196, 200], [196, 222]], 4, 'v-blue')) +
    `<path d="M238 136L282 106M224 160L282 198" class="lead"/>` +
    inset('sn-c-nn', 334, 152, 60,
      rect(270, 88, 130, 130, 0, 'sn-fat-bg') +
      S('rinde_nn', blob([[284, 140], [302, 112], [330, 100], [362, 104], [384, 124], [388, 156], [372, 186], [342, 200], [306, 194], [286, 172]], 'sn-cortex')) +
      S('mark_nn', blob([[306, 148], [320, 128], [342, 122], [362, 132], [366, 154], [352, 172], [326, 176], [310, 166]], 'sn-medulla')) +
      S('v_supra', ell(338, 150, 9, 7, 'sn-cv') + tube([[338, 150], [330, 190], [324, 214]], 5, 'v-blue')))) +
    zlabel(334, 82, 'Schnitt') + zlabel(226, 312, 'Ansicht von vorn'), 'Nebennieren von vorn');

  const nebenniere4 = () => {
    let glo = '', fas = '', ret = '', chr = '';
    for (let x = 18; x < 400; x += 34) [140, 180, 220, 260, 300, 340, 20].forEach(a => { const [cx, cy] = P([x, 44], a, 13); glo += circ(f(cx), f(cy), 6, 'sn-glo') + circ(f(cx), f(cy), 2.2, 'sn-glo-n'); });
    for (let x = 14; x < 392; x += 30) for (let y = 74; y < 184; y += 12) { for (const dx of [-6, 6]) { fas += rect(x + dx - 6, y, 12, 11, 3, 'sn-fas') + circ(x + dx, y + 5.5, 1.9, 'sn-fas-n') + circ(x + dx + (y % 24 ? 3 : -3), y + 3, 1.3, 'sn-vacs'); } }
    const NET = [];
    for (let x = 4; x < 400; x += 26) NET.push([[x, 190], [x + 8, 204], [x + 2, 218], [x + 10, 230]]);
    for (let x = 4; x < 400; x += 26) NET.push([[x + 8, 204], [x + 28, 206]], [[x + 2, 218], [x - 18, 222]]);
    ret = NET.map(p => line(p, 'sn-ret-o', sw(10))).join('') + NET.map(p => line(p, 'sn-ret-c', sw(7.5))).join('');
    for (let x = 4; x < 400; x += 26) [[x + 4, 197], [x + 6, 211], [x + 18, 205], [x + 6, 225], [x - 8, 220]].forEach(([a, b]) => { ret += circ(a, b, 2, 'sn-ret-n'); });
    const nests = [[40, 262], [104, 286], [150, 250], [214, 278], [268, 252], [318, 290], [370, 258], [30, 304], [250, 306]];
    nests.forEach(([x, y]) => { [[-8, -6], [6, -8], [11, 4], [0, 9], [-11, 6], [0, 0]].forEach(([dx, dy]) => { chr += circ(x + dx, y + dy, 6.5, 'sn-chr') + circ(x + dx, y + dy, 2.2, 'sn-chr-n'); }); });
    const fib = [[356, 4], [354, 60], [358, 120], [352, 180], [356, 232]];
    return svgw('0 0 400 320', vb('sn-v-nn4',
      rect(0, 0, 400, 20, 0, 'sn-caps') + line([[4, 9], [120, 7], [260, 11], [396, 8]], 'sn-coll') +
      S('glomerulosa', rect(0, 20, 400, 46, 0, 'sn-glo-bg') + glo) +
      S('fasciculata', rect(0, 66, 400, 120, 0, 'sn-fas-bg') + fas) +
      ctx(xs(29, 392, 30).map(x => pl([[x, 70], [x, 184]], 'sn-sin')).join('')) +
      S('reticularis', rect(0, 186, 400, 48, 0, 'sn-ret-bg') + ret) +
      ctx(rect(0, 234, 400, 86, 0, 'sn-med-bg') + tube([[0, 296], [120, 300], [200, 294], [300, 300], [400, 296]], 10, 'v-blue') + [[70, 240, 80, 320], [180, 238, 186, 320], [300, 240, 296, 320]].map(([a, b, c, d]) => line([[a, b], [c, d]], 'v-red', sw(1.8))).join('')) +
      S('chromaffin', chr) +
      S('praegangl', line(fib, 'sn-n', sw(3)) + line([[356, 232], [340, 246], [318, 282]], 'sn-n', sw(2.2)) + line([[356, 232], [368, 250]], 'sn-n', sw(2.2)) + line([[340, 246], [272, 248]], 'sn-n', sw(2)) +
        [[318, 282], [368, 250], [274, 248]].map(([x, y]) => circ(x, y, 3.2, 'sn-bout')).join(''))) +
      zlabel(36, 15, 'Kapsel') + zs(380, 226, 'Rinde') + zs(380, 314, 'Mark'), 'Nebennierenrinde und -mark');
  };

  /* ================= Hypophyse ================= */
  const hypophyse = () => svgw('0 0 400 320',
    ctx(blob([[132, 98], [150, 62], [196, 46], [238, 58], [248, 90], [222, 106], [186, 98], [150, 102]], 'sn-thal') +
      blob([[232, 160], [258, 150], [282, 166], [286, 236], [276, 270], [256, 262], [244, 226], [236, 190]], 'sn-pons')) +
    path('M6 188L100 188Q116 189 120 199Q123 236 146 254Q166 266 186 256Q199 247 201 222L202 192Q203 175 210 171Q218 172 219 186L223 212L262 316H6Z', 'sn-bone') +
    path('M26 214Q28 204 46 204H96Q110 206 114 222Q120 262 136 280Q142 300 118 304H42Q26 302 26 288Z', 'sn-airc') +
    S('sella', path('M120 199Q123 236 146 254Q166 266 186 256Q199 247 201 222L202 192Q203 175 210 171', 'sn-sella')) +
    ctx(pl([[121, 199], [160, 191]], 'sn-dsel') + pl([[180, 187], [208, 176]], 'sn-dsel')) +
    S('hvl', blob([[127, 210], [150, 205], [169, 209], [172, 232], [169, 252], [157, 258], [141, 251], [131, 233]], 'sn-hvl')) +
    S('hhl', blob([[174, 210], [190, 206], [198, 214], [199, 236], [190, 252], [174, 256], [177, 232]], 'sn-hhl')) +
    ctx(line([[172, 210], [174, 232], [172, 254]], 'sn-pi')) +
    S('stiel', tube([[179, 212], [173, 186], [165, 160], [160, 146]], 11, 'sn-stalk')) +
    S('hypothal', blob([[116, 140], [126, 112], [150, 100], [184, 98], [210, 108], [218, 128], [208, 146], [188, 142], [168, 148], [148, 152], [126, 150]], 'sn-hyth') + circ(206, 146, 7, 'sn-mam')) +
    S('chiasma', line([[110, 160], [80, 172], [48, 184]], 'sn-opt', sw(8)) + ell(118, 154, 15, 8, 'sn-chi', rot(-22, 118, 154))) +
    // inset: frontal section through the sella with the cavernous sinuses
    rect(290, 156, 106, 158, 10, 'frame') + zlabel(343, 150, 'Frontalschnitt') +
    clip('sn-c-cs', '<rect x="290.5" y="156.5" width="105" height="157" rx="10"/>',
      ctx(path('M290 238H316Q322 262 343 266Q364 262 370 238H396V314H290Z', 'sn-bone') + ell(343, 292, 30, 13, 'sn-airc') + ell(343, 250, 15, 11, 'sn-hvl') + line([[343, 239], [343, 206]], 'sn-stalk', sw(5)) + ell(343, 200, 26, 6, 'sn-chi') +
        blob([[296, 182], [318, 172], [330, 186], [318, 200], [300, 200]], 'sn-tl') + blob(mirX([[296, 182], [318, 172], [330, 186], [318, 200], [300, 200]], 343), 'sn-tl')) +
      S('sinus_cav', [0, 1].map(m => { const X = x => m ? 686 - x : x; return blob([[X(302), 214], [X(324), 218], [X(329), 240], [X(322), 262], [X(304), 262], [X(297), 240]].map(p => p), 'sn-sinus') + circ(X(316), 240, 7, 'sn-ica') + circ(X(323), 252, 2.6, 'sn-n-d') + [222, 232, 244, 255].map(y => circ(X(301.5), y, 2.4, 'sn-n-d')).join(''); }).join(''))) +
    zlabel(70, 300, 'Keilbeinhöhle') + zlabel(70, 150, 'vorn'), 'Hypophyse im Medianschnitt');

  const hypophyse4 = () => {
    const HVL = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => P([118, 252], a, 1)).map(([x, y]) => [118 + (x - 118) * 92, 252 + (y - 252) * 58]);
    const inHVL = (x, y) => { const dx = (x - 118) / 82, dy = (y - 252) / 48; return dx * dx + dy * dy < 1; };
    const cells = { somatotrop: [], laktotrop: [], kortikotrop: [], gonadotrop: [], other: [] };
    for (let y = 204; y < 306; y += 15) for (let x = 40; x < 210; x += 15) {
      const xx = x + ((y / 15) % 2 ? 7 : 0); if (!inHVL(xx, y)) continue;
      const t = y > 278 ? 'laktotrop' : xx < 104 ? 'somatotrop' : xx > 162 ? 'kortikotrop' : (y < 240 ? 'gonadotrop' : ((xx + y) % 4 === 0 ? 'other' : 'gonadotrop'));
      cells[t].push(circ(xx, y, 6.6, 'sn-' + t) + circ(xx, y, 2, 'sn-cn'));
    }
    const plexus = (x0, x1, y) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1; x += 8) d += `q2 -9 4 0t4 0`; return path(d, 'sn-plex'); };
    return svgw('0 0 400 320',
      path('M0 0H400V150Q330 150 300 152Q262 156 252 146Q238 140 222 146Q206 152 190 150Q120 146 0 150Z', 'sn-hyth-bg') +
      ctx(ell(104, 134, 28, 8, 'sn-chi')) +
      blob(HVL, 'sn-hvl-bg') + blob([[216, 204], [262, 196], [312, 204], [330, 236], [318, 280], [272, 296], [228, 286], [214, 246]], 'sn-hhl-bg') +
      path('M206 150Q206 176 204 204H252Q248 176 252 148Z', 'sn-stalk-bg') +
      ctx(line([[0, 160], [80, 158], [150, 150], [204, 146]], 'v-red', sw(3)) + line([[396, 300], [340, 280], [300, 260]], 'v-red', sw(3)) +
        [[238, 222], [266, 214], [292, 230], [258, 258], [290, 268]].map(([x, y]) => path(`M${x - 12} ${y}q6 -10 12 0t12 0`, 'sn-cap')).join('') +
        [[244, 232], [270, 240], [300, 246], [248, 272], [280, 284], [304, 220]].map(([x, y]) => circ(x, y, 2.6, 'sn-pit')).join('')) +
      S('portal_h', plexus(206, 248, 146) + tube([[212, 150], [210, 176], [200, 202], [178, 214]], 4.5, 'v-portal') + tube([[226, 150], [222, 178], [210, 206], [188, 222]], 4.5, 'v-portal') +
        [[[178, 214], [140, 216], [96, 222], [56, 236]], [[188, 222], [150, 246], [100, 256], [44, 262]], [[188, 222], [172, 260], [130, 286], [80, 296]], [[140, 216], [120, 240], [110, 270], [118, 300]]].map(p => line(p, 'sn-sinp')).join('')) +
      Object.entries(cells).map(([k, a]) => k === 'other' ? ctx(a.join('')) : S(k, a.join(''))).join('') +
      S('supraopt', ell(196, 40, 24, 13, 'sn-mag') + ell(112, 104, 22, 11, 'sn-mag') +
        [[184, 38], [196, 34], [208, 41], [190, 46], [202, 48]].map(([x, y]) => circ(x, y, 3.4, 'sn-mag-c')).join('') + [[102, 102], [114, 98], [124, 106], [110, 110]].map(([x, y]) => circ(x, y, 3.2, 'sn-mag-c')).join('') +
        line([[204, 52], [224, 100], [238, 140], [240, 180], [256, 220], [270, 238]], 'sn-axm') + line([[130, 108], [190, 126], [232, 144], [234, 184], [246, 236], [262, 262]], 'sn-axm') +
        [[270, 238], [262, 262]].map(([x, y]) => circ(x, y, 3.6, 'sn-mag-c')).join('')) +
      S('arcuatus', ell(272, 118, 18, 10, 'sn-arc') + [[264, 116], [274, 112], [282, 120], [270, 122]].map(([x, y]) => circ(x, y, 2.8, 'sn-arc-c')).join('') +
        line([[262, 124], [246, 134], [234, 141]], 'sn-axa') + line([[266, 126], [256, 138], [246, 143]], 'sn-axa') + circ(234, 141, 2.4, 'sn-arc-c') + circ(246, 143, 2.4, 'sn-arc-c')) +
      zlabel(60, 16, 'Hypothalamus') + zlabel(120, 318, 'Vorderlappen') + zlabel(276, 312, 'Hinterlappen'), 'Hypothalamus, Pfortadersystem und Vorderlappenzellen');
  };

  MEDSVG.addMaps('auge', [['auge', 'Auge im Schnitt', 3], ['auge4', 'Netzhaut & Kammerwinkel', 4]], { auge, auge4 });
  MEDSVG.addMaps('ohr', [['ohr', 'Ohr im Schnitt', 3], ['ohr4', 'Corti-Organ', 4]], { ohr, ohr4 });
  MEDSVG.addMaps('haut', [['haut', 'Haut im Schnitt', 3], ['haut4', 'Epidermis', 4]], { haut, haut4 });
  MEDSVG.addMaps('schilddruese', [['schilddruese', 'Schilddrüse von vorn', 3], ['schilddruese4', 'Follikel & Epithelkörperchen', 4]], { schilddruese, schilddruese4 });
  MEDSVG.addMaps('nebenniere', [['nebenniere', 'Nebennieren', 3], ['nebenniere4', 'Rindenzonen & Mark', 4]], { nebenniere, nebenniere4 });
  MEDSVG.addMaps('hypophyse', [['hypophyse', 'Hypophyse im Schnitt', 3], ['hypophyse4', 'Hypothalamus-Achse', 4]], { hypophyse, hypophyse4 });
})();
