/* Medizin-Atlas maps: knochen, gelenke, muskeln, nerven, rueckenmark */
(function () {
  'use strict';
  const { f, cr, path, blob, line, ell, circ, g, S, txt, svgw, tube, zlabel, zs } = MEDSVG.h;
  // elliptic ring (fill between two ellipses)
  const ring = (cx, cy, rx1, ry1, rx2, ry2, cls) => path(`M${cx - rx1} ${cy}a${rx1} ${ry1} 0 1 0 ${2 * rx1} 0a${rx1} ${ry1} 0 1 0 ${-2 * rx1} 0ZM${cx - rx2} ${cy}a${rx2} ${ry2} 0 1 0 ${2 * rx2} 0a${rx2} ${ry2} 0 1 0 ${-2 * rx2} 0Z`, cls, 'fill-rule="evenodd"');
  // straight <line> (not cloned into a fat hit area, for tiny decorations inside small parts)
  const ln = (x1, y1, x2, y2, cls) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="${cls}"/>`;
  const rect = (x, y, w, h, rx, cls, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" class="${cls}" ${extra}/>`;
  const deco = inner => `<g class="bw-deco">${inner}</g>`;
  const mx = (pts, c) => pts.map(([x, y]) => [2 * c - x, y]);

  /* ================= Knochen ================= */
  const K_OUT = [[138, 20], [160, 26], [170, 42], [194, 60], [222, 50], [240, 32], [256, 42], [254, 72], [236, 106], [226, 140], [224, 180], [224, 220], [228, 246], [246, 268], [256, 292], [252, 314], [232, 320], [212, 310], [200, 302], [188, 310], [168, 320], [148, 314], [144, 292], [154, 268], [172, 246], [176, 220], [176, 180], [176, 150], [166, 134], [172, 118], [160, 88], [140, 80], [118, 72], [110, 50], [118, 30]];
  const knochenMap = () => svgw('0 0 400 330',
    S('kompakta', blob(K_OUT, 'bw-comp')) +
    S('spongiosa', blob([[138, 27], [156, 31], [164, 46], [192, 67], [222, 58], [238, 40], [249, 47], [247, 72], [230, 104], [218, 128], [200, 122], [184, 128], [172, 122], [164, 94], [142, 74], [121, 66], [116, 50], [123, 34]], 'bw-spong') +
      [[[126, 40], [146, 64], [166, 96], [178, 124]], [[140, 33], [158, 62], [176, 96], [187, 122]], [[152, 38], [172, 70], [190, 102], [199, 121]], [[122, 58], [150, 50], [184, 62], [214, 80], [226, 104]], [[134, 69], [164, 62], [196, 78], [218, 100]], [[238, 46], [230, 70], [216, 100]], [[246, 58], [236, 84], [224, 110]]].map(p => line(p, 'bw-trab')).join('')) +
    S('markhoehle', blob([[188, 128], [200, 124], [212, 128], [213, 170], [213, 210], [212, 236], [200, 240], [188, 236], [187, 210], [187, 170]], 'bw-mark') + line([[190, 132], [190, 232]], 'bw-endost') + line([[210, 132], [210, 232]], 'bw-endost')) +
    S('metaphyse', blob([[188, 234], [212, 234], [220, 246], [237, 263], [249, 281], [225, 285], [200, 281], [175, 285], [151, 281], [163, 263], [180, 246]], 'bw-meta') +
      [[[194, 242], [190, 276]], [[206, 242], [210, 276]], [[180, 254], [170, 278]], [[220, 254], [230, 278]]].map(p => line(p, 'bw-trab')).join('') +
      line([[150, 281], [175, 285], [200, 281], [225, 285], [250, 281]], 'bw-fuge')) +
    S('epiphyse', blob([[151, 284], [175, 288], [200, 284], [225, 288], [249, 284], [251, 294], [248, 310], [232, 315], [214, 306], [200, 297], [186, 306], [168, 315], [152, 310], [149, 294]], 'bw-epi') +
      [[[168, 292], [166, 308]], [[184, 292], [184, 302]], [[216, 292], [216, 302]], [[232, 292], [234, 308]]].map(p => line(p, 'bw-trab')).join('')) +
    deco(line([[114, 64], [110, 50], [118, 30], [138, 20], [160, 26], [168, 38]], 'bw-cart') + line([[145, 298], [148, 314], [168, 320], [186, 311]], 'bw-cart') + line([[214, 311], [232, 320], [252, 314], [255, 298]], 'bw-cart')) +
    S('periost', line([[168, 122], [171, 150], [172, 180], [172, 220], [168, 244], [150, 266], [142, 282]], 'bw-periost') + line([[232, 108], [229, 140], [228, 180], [228, 220], [232, 244], [250, 266], [258, 282]], 'bw-periost')) +
    S('diaphyse', path('M238 138Q247 138 247 146V180Q247 188 254 188Q247 188 247 196V228Q247 236 238 236', 'bw-brace')) +
    deco(line([[112, 214], [146, 205], [170, 197]], 'v-red', 'style="stroke-width:2.6"') + line([[192, 179], [200, 166]], 'v-red', 'style="stroke-width:1.6"')) +
    S('foramen_nutr', line([[173, 196], [190, 180]], 'bw-foramen') + ell(174, 195, 3.6, 2.6, 'bw-foramen-o')) +
    zlabel(70, 40, 'proximal') + zlabel(70, 318, 'distal'), 'Röhrenknochen im Längsschnitt');

  const knochen4Map = () => {
    const C = [112, 165];
    let cells = '', canal = '';
    [[33, 5, 10], [53, 8, 30], [73, 11, 5]].forEach(([r, n, off]) => {
      for (let i = 0; i < n; i++) {
        const a = (off + i * 360 / n) * Math.PI / 180, x = C[0] + Math.cos(a) * r, y = C[1] + Math.sin(a) * r, deg = f(off + i * 360 / n + 90);
        cells += ell(f(x), f(y), 6.5, 3.4, 'bw-ocyte', `transform="rotate(${deg} ${f(x)} ${f(y)})"`);
        for (const d of [-1, 1]) canal += ln(x + Math.cos(a) * 3 * d, y + Math.sin(a) * 3 * d, x + Math.cos(a) * 8 * d, y + Math.sin(a) * 8 * d, 'bw-canal');
      }
    });
    const va = 200 * Math.PI / 180;
    return svgw('0 0 400 330',
      S('osteon', circ(C[0], C[1], 84, 'bw-ost-bg') + [18, 28, 38, 48, 58, 68, 78].map(r => circ(C[0], C[1], r, 'bw-lam')).join('') + circ(C[0], C[1], 84, 'bw-cement') +
        ln(C[0] + Math.cos(va) * 12, C[1] + Math.sin(va) * 12, C[0] + Math.cos(va) * 92, C[1] + Math.sin(va) * 92, 'bw-volk') + ln(C[0] + Math.cos(va) * 12, C[1] + Math.sin(va) * 12, C[0] + Math.cos(va) * 92, C[1] + Math.sin(va) * 92, 'bw-volk-v') +
        circ(C[0], C[1], 13, 'bw-hav') + circ(C[0] - 4, C[1] - 2, 4.2, 'bw-art') + circ(C[0] + 5, C[1] + 3, 3.6, 'bw-ven')) +
      S('osteozyt', canal + cells) +
      zlabel(C[0], 270, 'Osteon quer') +
      // remodelling panel
      rect(232, 10, 162, 204, 10, 'frame') + rect(233, 11, 160, 202, 9, 'bw-mbg') +
      path('M233 90H393V150H356Q352 128 322 126Q292 128 288 150H233Z', 'bw-matrix') +
      S('osteozyt', ell(262, 122, 7, 3.6, 'bw-ocyte') + ln(255, 122, 248, 118, 'bw-canal') + ln(269, 122, 276, 126, 'bw-canal') + ln(262, 118, 262, 110, 'bw-canal')) +
      S('kollagen1', rect(233, 78, 160, 12, 0, 'bw-osteoid') + [81, 84.5, 88].map(y => path(`M236 ${y}q6-2.4 12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0`, 'bw-coll')).join('')) +
      S('osteoblast', [0, 1, 2, 3, 4, 5, 6].map(i => rect(236 + i * 22.2, 56, 20, 22, 4, 'bw-oblast') + circ(f(246 + i * 22.2), 63, 4.2, 'bw-oblast-n')).join('')) +
      S('osteoklast', blob([[290, 150], [297, 137], [310, 130], [322, 129], [336, 131], [348, 139], [354, 150], [364, 160], [356, 176], [330, 184], [300, 182], [282, 172], [282, 158]], 'bw-ocl') +
        line([[294, 145], [304, 136], [322, 132], [340, 135], [350, 145]], 'bw-ruffle') + [[304, 160], [318, 167], [332, 159], [345, 168]].map(([x, y]) => circ(x, y, 4.2, 'bw-ocl-n')).join('')) +
      zlabel(313, 40, 'Anbau') + zlabel(313, 204, 'Abbau') +
      // shaft cross-section with A. nutricia
      rect(232, 222, 162, 100, 10, 'frame') +
      deco(ring(300, 280, 46, 32, 30, 19, 'bw-comp') + ell(300, 280, 30, 19, 'bw-mark') + ell(300, 280, 48, 34, 'bw-periost-e') + [[256, 262], [270, 312], [336, 254], [340, 308]].map(([x, y]) => circ(x, y, 2.2, 'bw-art')).join('')) +
      S('a_nutricia', tube([[392, 252], [362, 262], [340, 270], [318, 276]], 4, 'v-red') + line([[318, 276], [300, 270], [282, 274]], 'v-red', 'style="stroke-width:2.4"') + line([[318, 276], [302, 286], [286, 286]], 'v-red', 'style="stroke-width:2.4"')) +
      zlabel(300, 238, 'Schaft quer'), 'Osteon und Knochenumbau');
  };
  MEDSVG.addMaps('knochen', [['knochen', 'Röhrenknochen', 3], ['knochen4', 'Osteon & Knochenzellen', 4]], { knochen: knochenMap, knochen4: knochen4Map });

  /* ================= Gelenke ================= */
  const capd = (pts, cls) => path(cr(pts, false) + 'Z', cls); // smooth outline, straight closing edge (cut bone)
  const gelenkeMap = () => {
    const FEM = [[168, 4], [166, 50], [150, 88], [132, 116], [125, 140], [132, 160], [154, 168], [174, 160], [186, 146], [200, 142], [214, 146], [226, 160], [246, 168], [268, 160], [275, 140], [268, 116], [250, 88], [234, 50], [232, 4]];
    const TIB = [[160, 326], [160, 232], [138, 214], [124, 198], [124, 184], [150, 178], [180, 180], [191, 176], [195, 169], [200, 173], [205, 169], [209, 176], [220, 180], [250, 178], [276, 184], [276, 198], [262, 214], [240, 232], [240, 326]];
    const capL = [[152, 88], [124, 112], [108, 146], [106, 178], [118, 206], [132, 213]], synL = [[155, 94], [129, 115], [114, 147], [112, 177], [123, 203], [134, 208]];
    return svgw('0 0 400 330',
      deco(blob([[150, 94], [126, 116], [113, 146], [111, 176], [122, 204], [150, 207], [200, 205], [250, 207], [278, 204], [289, 176], [287, 146], [274, 116], [250, 94], [200, 104]], 'bw-cav')) +
      deco(capd([[110, 326], [112, 250], [104, 234], [110, 220], [126, 216], [134, 228], [130, 250], [128, 326]], 'bw-bone') + capd(TIB, 'bw-bone') + capd(FEM, 'bw-bone')) +
      S('knorpel_g', [[[126, 132], [125, 140], [132, 160], [154, 168], [174, 160]], [[274, 132], [275, 140], [268, 160], [246, 168], [226, 160]], [[124, 186], [150, 178], [180, 180], [191, 176]], [[276, 186], [250, 178], [220, 180], [209, 176]]].map(p => line(p, 'bw-cart')).join('')) +
      S('kapsel_g', line(capL, 'bw-capf') + line(mx(capL, 200), 'bw-capf') + line(synL, 'bw-syn') + line(mx(synL, 200), 'bw-syn')) +
      S('menisken', blob([[115, 160], [134, 166], [155, 174], [134, 182], [117, 187]], 'bw-menis') + blob(mx([[115, 160], [134, 166], [155, 174], [134, 182], [117, 187]], 200), 'bw-menis')) +
      S('kreuzbaender', tube([[184, 148], [196, 160], [207, 175]], 6, 'bw-lig') + tube([[216, 148], [204, 160], [193, 175]], 6, 'bw-lig')) +
      zlabel(200, 44, 'Femur') + zlabel(200, 290, 'Tibia') + zlabel(84, 290, 'Fibula') + zlabel(52, 24, 'lateral') + zlabel(348, 24, 'medial'), 'Kniegelenk im Frontalschnitt');
  };

  const wsMap = () => {
    const post = t => [[262, t + 6], [284, t + 4], [286, t - 18], [294, t - 24], [304, t - 20], [306, t + 2], [320, t + 8], [372, t + 10], [384, t + 18], [382, t + 38], [372, t + 44], [326, t + 44], [324, t + 58], [322, t + 82], [312, t + 88], [304, t + 80], [302, t + 52], [290, t + 34], [262, t + 32]];
    const T = [34, 120, 206];
    const MASS = [[32, 38], [62, 36], [68, 48], [64, 62], [34, 64], [28, 50]], TRP = [[10, 44], [32, 40], [32, 58], [12, 56]];
    const IL = [[56, 200], [40, 184], [18, 186], [10, 214], [20, 252], [38, 282], [58, 300], [66, 292], [56, 270], [62, 248]];
    const ISG = [[57, 198], [55, 214], [60, 234], [64, 250]];
    return svgw('0 0 400 330',
      // Atlas & Axis (von vorn)
      `<g class="ghost">${blob([[20, 22], [60, 12], [108, 12], [148, 22], [140, 34], [112, 30], [84, 32], [56, 30], [28, 34]], 'bw-bone')}</g>` +
      S('atlas_axis', line([[60, 46], [84, 41], [108, 46]], 'bw-arch') +
        blob([[72, 36], [84, 28], [96, 36], [96, 62], [106, 64], [124, 66], [126, 76], [114, 84], [116, 120], [84, 126], [52, 120], [54, 84], [42, 76], [44, 66], [62, 64], [72, 62]], 'bw-bone') +
        blob(MASS, 'bw-bone') + blob(mx(MASS, 84), 'bw-bone') + blob(TRP, 'bw-bone') + blob(mx(TRP, 84), 'bw-bone') +
        line([[38, 64], [62, 64]], 'bw-jl-s') + line([[106, 64], [130, 64]], 'bw-jl-s')) +
      zlabel(84, 146, 'C1 / C2') +
      // Becken mit ISG
      `<g class="ghost">${rect(62, 172, 44, 16, 4, 'bw-bone')}</g>` +
      deco(blob(IL, 'bw-bone') + blob(mx(IL, 84), 'bw-bone') + blob([[58, 194], [110, 194], [114, 212], [104, 250], [94, 282], [84, 296], [74, 282], [64, 250], [54, 212]], 'bw-bone') +
        [[72, 214], [96, 214], [74, 232], [94, 232], [77, 250], [91, 250], [80, 266], [88, 266]].map(([x, y]) => circ(x, y, 3, 'bw-foram')).join('')) +
      S('isg', line(ISG, 'bw-jline') + line(mx(ISG, 84), 'bw-jline')) +
      zlabel(84, 320, 'Becken') +
      // Bewegungssegment (seitlich)
      S('bandscheibe', T.map(t => rect(182, t + 62, 82, 24, 5, 'bw-disc') + [196, 206, 250].map(x => ln(x, t + 65, x, t + 83, 'bw-anul')).join('') + ell(230, t + 74, 18, 7, 'bw-nucl')).join('')) +
      `<g class="ghost">${rect(184, 292, 78, 36, 8, 'bw-bone')}${blob([[286, 290], [286, 274], [294, 268], [304, 272], [306, 296]], 'bw-bone')}</g>` +
      S('wirbel', T.map(t => rect(184, t, 78, 62, 8, 'bw-bone') + blob(post(t), 'bw-bone')).join('')) +
      deco(T.map(t => ell(276, t + 50, 5, 8, 'bw-nerve-x')).join('')) +
      S('facetten', T.map(t => ell(304, t + 75, 7, 15, 'bw-fcap') + line([[305, t + 63], [304, t + 75], [303, t + 87]], 'bw-jline')).join('')) +
      zlabel(214, 16, 'vorn') + zlabel(352, 16, 'hinten'), 'Wirbelsäule und Becken');
  };

  const gelenke4Map = () => {
    const s1 = x => 60 + 22 * (1 - ((x - 120) / 100) ** 2), XS = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220];
    const curve = (fn, d) => XS.map(x => [x, fn(x) + d]);
    const band = (d0, d1) => [...curve(s1, d0), ...curve(s1, d1).reverse()];
    const capR = [[214, 36], [228, 60], [234, 92], [228, 124], [214, 148]], synR = [[210, 42], [222, 62], [227, 92], [222, 122], [210, 142]];
    const zc = [66, 258], zs2 = [186, 262];
    // cartilage zoom content
    let chon = '';
    [20, 44, 68, 92, 112].forEach(x => { chon += ell(x, 218, 6, 2.4, 'bw-chon'); });
    [[30, 238], [62, 236], [96, 240], [44, 256], [80, 258], [108, 256]].forEach(([x, y]) => { chon += circ(x - 4, y, 4.4, 'bw-lac') + circ(x + 5, y + 1, 4.4, 'bw-lac') + circ(x - 4, y, 2.4, 'bw-chon') + circ(x + 5, y + 1, 2.4, 'bw-chon'); });
    [28, 52, 76, 100].forEach(x => [268, 278].forEach(y => { chon += ell(x, y, 3.6, 4.2, 'bw-lac') + circ(x, y, 2.2, 'bw-chon'); }));
    const arcs = [16, 40, 64, 88, 112].map(x => path(`M${x} 290V244Q${x} 220 ${x + 22} 214`, 'bw-c2f')).join('');
    const P = [24, 102, 180, 258];
    return svgw('0 0 400 330',
      S('synovia', blob([[30, 42], [18, 62], [13, 92], [18, 122], [30, 142], [120, 140], [210, 142], [222, 122], [227, 92], [222, 62], [210, 42], [120, 44]], 'bw-cav')) +
      deco(path(cr([[44, 8], [36, 30], ...curve(s1, 0), [204, 30], [196, 8]], false) + 'Z', 'bw-bone') +
        path(cr([[196, 186], [204, 130], ...curve(s1, 40).reverse(), [36, 130], [44, 186]], false) + 'Z', 'bw-bone')) +
      S('knorpel_g', blob(band(0, 14), 'bw-hyal') + blob(band(26, 40), 'bw-hyal')) +
      S('faserknorpel', blob([[226, 66], [206, 78], [186, 92], [206, 97], [226, 102]], 'bw-fibro') + line([[222, 74], [206, 82], [194, 91]], 'bw-fib-l') + line([[222, 92], [206, 92], [196, 93]], 'bw-fib-l')) +
      S('kapsel_g', line([[26, 36], [12, 60], [6, 92], [12, 124], [26, 148]], 'bw-capf') + line(capR, 'bw-capf') + line([[30, 42], [18, 62], [13, 92], [18, 122], [30, 142]], 'bw-syn') + line(synR, 'bw-syn')) +
      // zoom: hyaline cartilage
      `<path d="M76 106L44 200M84 106L104 204" class="lead"/><circle cx="${zc[0]}" cy="${zc[1]}" r="62" class="frame"/><clipPath id="bw-zk"><circle cx="${zc[0]}" cy="${zc[1]}" r="61"/></clipPath><g clip-path="url(#bw-zk)">` +
      S('synovia', rect(0, 190, 140, 22, 0, 'bw-cav')) +
      S('kollagen2', rect(0, 212, 140, 78, 0, 'bw-hyal') + arcs) +
      deco(rect(0, 290, 140, 10, 0, 'bw-calc') + line([[0, 290], [140, 290]], 'bw-tide') + rect(0, 300, 140, 30, 0, 'bw-bone')) +
      S('chondrozyten', chon) + `</g>` +
      // zoom: synovial membrane
      `<path d="M226 106L206 224M232 98L222 236" class="lead"/><circle cx="${zs2[0]}" cy="${zs2[1]}" r="44" class="frame"/><clipPath id="bw-zs"><circle cx="${zs2[0]}" cy="${zs2[1]}" r="43"/></clipPath><g clip-path="url(#bw-zs)">` +
      S('synovia', rect(140, 214, 30, 100, 0, 'bw-cav') + path('M146 236q4-4 8 0t8 0M144 262q4-4 8 0t8 0M146 288q4-4 8 0t8 0', 'bw-hya')) +
      deco(rect(170, 214, 36, 100, 0, 'bw-subint') + tube([[186, 214], [190, 262], [186, 310]], 4, 'v-red') + rect(206, 214, 30, 100, 0, 'bw-fibr') + [222, 232, 248, 264, 280, 296].map(y => path(`M208 ${y}q6-3 12 0t12 0`, 'bw-fib-l')).join('')) +
      S('synoviozyten', [[175, 232, 'a'], [177, 252, 'b'], [175, 272, 'a'], [177, 292, 'b']].map(([x, y, t]) => t === 'a' ? circ(x, y, 6.5, 'bw-sya') + circ(x, y, 2.8, 'bw-synuc') : blob([[x - 6, y - 7], [x + 2, y - 4], [x + 6, y + 4], [x + 2, y + 9], [x - 4, y + 4]], 'bw-syb') + ell(x, y + 1, 2.2, 3.4, 'bw-synuc')).join('')) + `</g>` +
      // spinal ligaments (median section)
      deco(P.map(t => rect(254, t, 58, 56, 6, 'bw-bone') + (t < 258 ? rect(253, t + 56, 60, 22, 4, 'bw-disc') + ell(288, t + 67, 12, 6, 'bw-nucl') : '') +
        blob([[346, t], [356, t - 2], [366, t + 6], [392, t + 10], [394, t + 32], [380, t + 40], [358, t + 42], [346, t + 48]], 'bw-bone')).join('') + rect(321, 8, 18, 318, 6, 'bw-liq')) +
      S('lig_long', line([[249, 14], [248, 100], [248, 180], [248, 260], [249, 322]], 'bw-llig') + line([[316, 14], [316.5, 322]], 'bw-llig-p')) +
      S('lig_flava', [8, 70, 148, 226, 306].map(y => rect(341, y, 12, y === 8 ? 14 : y === 306 ? 18 : 34, 3, 'bw-flava')).join('')) +
      zlabel(270, 326, 'vorn') + zlabel(374, 326, 'hinten'), 'Gelenkknorpel und Wirbelbänder');
  };
  MEDSVG.addMaps('gelenke', [['gelenke', 'Kniegelenk', 3], ['gelenke_ws', 'Wirbelsäule & Becken', 3], ['gelenke4', 'Knorpel & Bänder', 4]], { gelenke: gelenkeMap, gelenke_ws: wsMap, gelenke4: gelenke4Map });

  /* ================= Muskeln ================= */
  const muskelnMap = () => {
    const DIA = [[278, 124], [286, 76], [306, 50], [330, 52], [340, 64], [352, 58], [372, 60], [388, 84], [394, 124], [366, 122], [356, 134], [352, 160], [344, 160], [340, 142], [336, 140], [332, 142], [328, 160], [320, 160], [316, 134], [306, 122]];
    const tile = (x, id, inner) => S(id, rect(x, 226, 122, 98, 10, 'frame') + inner);
    let skm = '', smo = '', crd = '';
    for (let i = 0; i < 4; i++) { const y = 236 + i * 21; skm += rect(16, y, 106, 17, 6, 'bw-skf') + ln(20, y + 8.5, 118, y + 8.5, 'bw-stri') + [30, 64, 98].map((x, k) => ell(x + (i % 2) * 12, y + (k % 2 ? 14 : 3), 4.5, 1.8, 'bw-skn')).join(''); }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x0 = 146 + c * 40 - (r % 2) * 20, y = 240 + r * 20; if (x0 < 146 || x0 + 50 > 258) continue; smo += path(`M${x0} ${y}Q${x0 + 25} ${y - 9} ${x0 + 50} ${y}Q${x0 + 25} ${y + 9} ${x0} ${y}Z`, 'bw-smc') + ell(x0 + 25, y, 7, 2, 'bw-smn'); }
    [[282, 238, 40], [326, 238, 40], [296, 262, 46], [346, 262, 30], [282, 286, 36], [322, 286, 52]].forEach(([x, y, w]) => { crd += `<rect x="${x}" y="${y}" width="${w}" height="18" rx="4" class="cmyo"/><ellipse cx="${x + w / 2}" cy="${y + 9}" rx="4.5" ry="2.8" class="cmyo-n"/><path d="M${x + w + 1} ${y + 1}l2 4-2 4 2 4-2 4 2 2" class="disc"/>`; });
    crd += `<rect x="314" y="252" width="10" height="14" rx="3" class="cmyo"/><rect x="336" y="276" width="10" height="14" rx="3" class="cmyo"/><rect x="274" y="306" width="110" height="10" rx="4" class="cmyo"/>`;
    return svgw('0 0 400 330',
      // arm with biceps
      deco(tube([[80, 30], [78, 172]], 13, 'bw-bonet') + circ(84, 22, 13, 'bw-bone') + blob([[60, 166], [96, 166], [102, 178], [80, 186], [56, 178]], 'bw-bone') + tube([[68, 186], [64, 216]], 8, 'bw-bonet') + tube([[92, 186], [98, 216]], 8, 'bw-bonet') + ell(50, 16, 8, 5, 'bw-bone')) +
      S('faszie', blob([[54, 44], [80, 38], [106, 46], [113, 96], [108, 140], [92, 165], [68, 165], [51, 140], [46, 96]], 'bw-fascia') + blob([[160, 22], [200, 8], [240, 22], [250, 90], [247, 150], [230, 170], [200, 168], [170, 166], [150, 120], [148, 60]], 'bw-fascia')) +
      S('bizeps', blob([[62, 62], [78, 52], [96, 62], [102, 96], [98, 130], [86, 152], [74, 154], [62, 132], [56, 96]], 'bw-musc') + line([[79, 56], [80, 92]], 'fib') + line([[68, 100], [72, 140]], 'fib') + line([[92, 100], [88, 140]], 'fib')) +
      // thigh with quadriceps
      deco(tube([[198, 10], [200, 160]], 15, 'bw-bonet') + capd([[180, 216], [178, 200], [200, 194], [222, 200], [220, 216]], 'bw-bone')) +
      S('quadrizeps', blob([[168, 40], [186, 34], [192, 80], [192, 130], [190, 160], [176, 150], [160, 116], [156, 76]], 'bw-musc2') + blob([[212, 70], [226, 76], [240, 110], [238, 146], [222, 164], [208, 160], [208, 110]], 'bw-musc2') +
        blob([[192, 14], [208, 14], [214, 50], [214, 110], [208, 150], [200, 156], [192, 150], [186, 110], [186, 50]], 'bw-musc') + line([[200, 24], [200, 146]], 'fib') + line([[172, 60], [180, 140]], 'fib') + line([[222, 96], [224, 150]], 'fib')) +
      deco(ell(200, 176, 11, 14, 'bw-bone')) +
      S('sehne', tube([[84, 56], [88, 30], [86, 12]], 4, 'bw-ten') + tube([[68, 58], [60, 34], [52, 18]], 4, 'bw-ten') + tube([[80, 150], [84, 172], [91, 192]], 5, 'bw-ten') +
        tube([[200, 6], [200, 16]], 5, 'bw-ten') + tube([[200, 152], [200, 164]], 8, 'bw-ten') + tube([[200, 189], [200, 205]], 6, 'bw-ten')) +
      // diaphragm (from the front)
      `<g class="ghost">${line([[302, 34], [282, 68], [274, 110], [278, 142]], 'bw-rib')}${line(mx([[302, 34], [282, 68], [274, 110], [278, 142]], 336), 'bw-rib')}${rect(322, 166, 28, 20, 4, 'bw-bone')}</g>` +
      S('zwerchfell_m', blob(DIA, 'bw-dia') + blob([[318, 64], [336, 70], [350, 64], [364, 70], [356, 92], [338, 98], [322, 92], [312, 76]], 'bw-cten') + line([[300, 80], [306, 112]], 'bw-diaf') + line([[374, 80], [368, 112]], 'bw-diaf') +
        ell(326, 80, 5, 5, 'bw-ivc') + ell(346, 108, 5.5, 4, 'bw-oes') + ell(336, 152, 4.5, 6, 'bw-aor')) +
      zlabel(336, 34, 'Brust') + zlabel(300, 150, 'Bauch') +
      // tissue tiles
      tile(8, 'skelettmuskel', skm) + tile(139, 'glatte_m', smo) + tile(270, 'herzmuskel', crd), 'Muskeln, Sehnen und Muskelgewebe');
  };

  const muskeln4Map = () => {
    const Z = [18, 66, 114, 162], TT = [];
    Z.forEach(z => [z + 12, z + 36].forEach(x => { if (x < 192) TT.push(x); }));
    let fib = '';
    [30, 68, 106].forEach(y => { fib += rect(14, y, 178, 26, 3, 'bw-iband') + Z.map(z => rect(z + 12, y, Math.min(24, 192 - z - 12), 26, 0, 'bw-aband') + ln(z, y, z, y + 26, 'bw-zl')).join(''); });
    let sr = '';
    [24, 62, 100, 138].forEach(y => { const xs = [14, ...TT, 192]; for (let i = 0; i < xs.length - 1; i++) if (xs[i + 1] - xs[i] > 8) sr += rect(xs[i] + 3, y - 3.5, xs[i + 1] - xs[i] - 6, 8, 4, 'bw-sr'); });
    // sarcomere
    const AY = [190, 206, 222, 238, 254], MY = [198, 214, 230, 246];
    let act = '', myo = '', heads = '', tro = '';
    AY.forEach(y => { act += line([[40, y], [178, y]], 'bw-act') + line([[222, y], [360, y]], 'bw-act') + line([[10, y], [40, y]], 'bw-act') + line([[360, y], [390, y]], 'bw-act'); });
    MY.forEach(y => { myo += line([[112, y], [288, y]], 'bw-myo'); for (let x = 118; x <= 182; x += 8) heads += ln(x, y - 2, x - 4, y - 6, 'bw-myoh') + ln(x + 4, y + 2, x, y + 6, 'bw-myoh'); for (let x = 220; x <= 284; x += 8) heads += ln(x, y - 2, x + 4, y - 6, 'bw-myoh') + ln(x - 4, y + 2, x, y + 6, 'bw-myoh'); });
    [206, 238].forEach(y => { tro += ln(40, y - 1.6, 178, y - 1.6, 'bw-tpm') + ln(222, y - 1.6, 360, y - 1.6, 'bw-tpm'); [56, 84, 112, 140, 168, 232, 260, 288, 316, 344].forEach(x => { tro += circ(x, y, 3, 'bw-tro') + circ(x, y, 6, 'hit-c'); }); });
    const zz = x => path(`M${x} 184l4 6-8 6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-4 2`, 'bw-z');
    // fibre types
    let t1 = '', t2 = '';
    for (let r = 0; r < 2; r++) for (let i = 0; i < 13 - r; i++) { const x = 8 + i * 30 + r * 15, y = 280 + r * 24, one = (i * 7 + r * 3) % 5 < 2; if (one) t1 += rect(x, y, 28, 22, 7, 'bw-t1') + circ(x + 9, y + 8, 1.6, 'bw-mito') + circ(x + 18, y + 14, 1.6, 'bw-mito') + circ(x + 20, y + 7, 1.6, 'bw-mito'); else t2 += rect(x, y, 28, 22, 7, 'bw-t2'); }
    return svgw('0 0 400 330',
      // muscle fibre with SR and T tubules
      deco(rect(10, 16, 186, 132, 10, 'bw-fbg') + fib) +
      S('ttubuli', TT.map(x => line([[x, 16], [x, 148]], 'bw-tt')).join('') + TT.map(x => circ(x, 16, 2.4, 'bw-tt-m')).join('')) +
      S('sr', sr) +
      zlabel(102, 12, 'Muskelfaser') +
      `<path d="M66 94L40 172M114 94L360 172" class="lead"/>` +
      // sarcomere
      deco(rect(8, 164, 384, 98, 8, 'bw-sbg')) +
      S('sarkomer', path('M40 180V172H360V180', 'bw-brk') + zz(40) + zz(360) + line([[200, 186], [200, 256]], 'bw-mline')) +
      S('aktin_myosin', act + myo + heads) +
      S('troponin', tro) +
      zlabel(40, 272, 'Z') + zlabel(76, 272, 'I') + zlabel(200, 272, 'A') + zlabel(324, 272, 'I') + zlabel(360, 272, 'Z') + zlabel(200, 184, 'H') +
      // muscle spindle
      deco(rect(210, 18, 182, 16, 6, 'bw-extra') + rect(210, 126, 182, 16, 6, 'bw-extra') + ln(214, 26, 388, 26, 'bw-stri') + ln(214, 134, 388, 134, 'bw-stri')) +
      S('muskelspindel', blob([[214, 80], [250, 58], [300, 50], [350, 58], [386, 80], [350, 102], [300, 110], [250, 102]], 'bw-spin') +
        [70, 80, 90].map(y => line([[226, y], [374, y]], 'bw-intra')).join('') + [[294, 78], [300, 82], [306, 78], [298, 74], [303, 86]].map(([x, y]) => circ(x, y, 2.4, 'bw-inuc')).join('') + [320, 328, 336, 344].map(x => circ(x, 90, 2, 'bw-inuc')).join('') +
        path('M282 66l4 28 4-28 4 28 4-28 4 28 4-28 4 28 4-28', 'bw-ia') + line([[300, 66], [296, 40], [290, 4]], 'bw-ia-ax') +
        line([[240, 74], [236, 46], [230, 4]], 'bw-gam') + line([[360, 74], [364, 46], [372, 4]], 'bw-gam')) +
      // fibre types
      S('typ1', t1) + S('typ2', t2), 'Muskelfaser, Sarkomer und Muskelspindel');
  };
  MEDSVG.addMaps('muskeln', [['muskeln', 'Muskeln & Gewebe', 3], ['muskeln4', 'Sarkomer & Spindel', 4]], { muskeln: muskelnMap, muskeln4: muskeln4Map });

  /* ================= Nerven ================= */
  const nervenMap = () => {
    const HALF = [[200, 6], [188, 9], [182, 20], [183, 33], [187, 42], [186, 50], [176, 54], [160, 57], [130, 58], [104, 60], [70, 62], [44, 62], [30, 58], [16, 61], [8, 74], [14, 88], [30, 94], [44, 90], [70, 92], [104, 96], [130, 100], [160, 104], [166, 124], [170, 142], [166, 166], [168, 200], [172, 244], [174, 276], [176, 304], [168, 314], [170, 322], [190, 322], [192, 306], [192, 276], [192, 244], [196, 196], [200, 182]];
    const FIG = [...HALF, ...mx(HALF, 200).reverse().slice(1, -1)];
    const L = (pts, cls = 'bw-n') => line(pts, cls);
    const roots = [[[199, 44], [184, 60], [168, 80]], [[199, 49], [186, 63], [168, 84]], [[199, 54], [188, 67], [168, 88]], [[199, 59], [188, 71], [168, 92]], [[199, 64], [186, 76], [168, 95]]];
    const lumL = [[[200, 136], [190, 150], [184, 164]], [[200, 144], [190, 156], [184, 166]], [[200, 152], [192, 161], [185, 168]], [[200, 160], [194, 167], [186, 172]]];
    const lumR = [[[200, 148], [210, 160], [214, 172]], [[200, 156], [208, 164], [214, 174]], [[200, 164], [208, 170], [214, 176]], [[200, 172], [208, 174], [214, 178]]];
    const GS = [[209, 46], [210, 56], [216, 68], [222, 80], [223, 92], [223, 104], [223, 116], [223, 128], [222, 140], [219, 152], [213, 164], [205, 174]];
    return svgw('0 0 400 330',
      path(cr(FIG), 'sil') +
      `<g class="ghost">${line([[200, 40], [200, 150]], 'c-cord')}${[-4, -2, 2, 4].map(d => line([[200, 150], [200 + d, 176]], 'c-cauda')).join('')}</g>` +
      S('plexus_brach', roots.map(p => L(p)).join('') + L([[184, 60], [188, 71]], 'bw-n-s') + L([[186, 63], [186, 76]], 'bw-n-s') + L([[178, 70], [176, 86]], 'bw-n-s')) +
      S('radialis', L([[166, 82], [146, 76], [124, 70]], 'bw-n bw-n-d') + L([[124, 70], [104, 68], [72, 68], [44, 68], [24, 67]])) +
      S('medianus', L([[166, 88], [136, 82], [104, 78], [72, 76], [44, 76], [22, 76]])) +
      S('ulnaris', L([[166, 94], [136, 92], [104, 90], [72, 86], [44, 84], [24, 86]])) +
      S('plexus_lumbo', lumL.map(p => L(p)).join('') + lumR.map(p => L(p)).join('')) +
      S('femoralis_n', L([[184, 164], [180, 176], [178, 190]]) + L([[178, 190], [172, 214]], 'bw-n-s') + L([[178, 190], [180, 218]], 'bw-n-s') + L([[178, 190], [188, 212]], 'bw-n-s') + L([[178, 190], [188, 232], [188, 272], [186, 300]], 'bw-n-s')) +
      S('ischiadicus', L([[214, 174], [222, 188], [222, 214], [222, 236]], 'bw-n-thick') + L([[222, 236], [220, 270], [218, 302]], 'bw-n bw-n-d') + L([[222, 236], [228, 246], [230, 262], [228, 300]], 'bw-n bw-n-d')) +
      S('vagus', L([[203, 34], [204, 52], [207, 70], [207, 100], [205, 124], [201, 142]], 'bw-vag') + L([[207, 84], [196, 92]], 'bw-vag-s') + L([[205, 126], [194, 134]], 'bw-vag-s')) +
      S('grenzstrang', L(GS, 'bw-gs') + GS.map(([x, y]) => circ(x, y, 3.2, 'bw-gs-g')).join('')) +
      zlabel(60, 300, 'rechts') + zlabel(340, 300, 'links') + zlabel(340, 316, '- - - hinten'), 'Periphere Nerven');
  };

  const nerven4Map = () => {
    const FAS = [[62, 82, 30], [134, 76, 28], [76, 144, 26], [140, 138, 28]];
    let ax = '';
    FAS.forEach(([cx, cy, r]) => { for (let y = cy - r; y <= cy + r; y += 7.4) for (let x = cx - r; x <= cx + r; x += 8) { const xx = x + (Math.round((y - cy) / 7.4) % 2 ? 4 : 0); if (Math.hypot(xx - cx, y - cy) > r - 5) continue; ax += (Math.round(xx * 3 + y) % 4 === 0) ? circ(f(xx), f(y), 1.3, 'bw-axu') : circ(f(xx), f(y), 2.5, 'bw-axm'); } });
    const VAS = [[104, 110], [30, 130], [176, 98], [104, 40]];
    const zc = [60, 262];
    const SIL2 = MEDSVG.SIL;
    let st = '';
    for (let y = 150; y < 520; y += 40) st += rect(120, y, 160, 20, 0, 'bw-derm1') + rect(120, y + 20, 160, 20, 0, 'bw-derm2');
    for (let x = 30; x < 140; x += 30) st += rect(x, 160, 15, 400, 0, 'bw-derm1') + rect(x + 15, 160, 15, 400, 0, 'bw-derm2') + rect(400 - x - 30, 160, 15, 400, 0, 'bw-derm2') + rect(400 - x - 15, 160, 15, 400, 0, 'bw-derm1');
    for (let x = 120; x < 280; x += 40) st += rect(x, 520, 20, 280, 0, 'bw-derm2') + rect(x + 20, 520, 20, 280, 0, 'bw-derm1');
    const K = .15, TX = 228, TY = 206, P = (x, y) => [TX + x * K, TY + y * K];
    const hand = P(56, 500), navel = P(200, 410), foot = P(160, 780);
    return svgw('0 0 400 330',
      // nerve cross-section
      S('nervenhuellen', ell(100, 104, 90, 78, 'bw-epin') + FAS.map(([x, y, r]) => circ(x, y, r, 'bw-perin')).join('')) +
      deco(ax) +
      S('vasa_nervorum', VAS.map(([x, y]) => circ(x - 4, y, 4, 'bw-art') + circ(x + 5, y + 1, 4.6, 'bw-ven') + circ(x, y, 9, 'hit-c')).join('') + line([[150, 44], [176, 60], [184, 84]], 'v-red', 'style="stroke-width:1.6"')) +
      zlabel(100, 196, 'Nerv quer') +
      // Schwann cell zoom
      `<path d="M74 148L28 214M80 148L100 220" class="lead"/><circle cx="${zc[0]}" cy="${zc[1]}" r="54" class="frame"/>` +
      deco(circ(zc[0], zc[1], 53, 'bw-endo-z')) +
      S('schwann', circ(zc[0], zc[1], 42, 'bw-schw') + path(`M${zc[0] - 30} ${zc[1] - 30}Q${zc[0]} ${zc[1] - 50} ${zc[0] + 30} ${zc[1] - 30}Q${zc[0]} ${zc[1] - 40} ${zc[0] - 30} ${zc[1] - 30}Z`, 'bw-schw-n') + ring(zc[0], zc[1], 34, 34, 16, 16, 'bw-myel') + [20, 24, 28, 32].map(r => circ(zc[0], zc[1], r, 'bw-myel-l')).join('')) +
      deco(circ(zc[0], zc[1], 16, 'bw-axz') + [[-6, -4], [4, -7], [6, 4], [-3, 6], [0, 0]].map(([dx, dy]) => circ(zc[0] + dx, zc[1] + dy, 1.4, 'bw-nf')).join('')) +
      // motor endplate
      deco(rect(206, 122, 190, 70, 10, 'bw-mf') + ln(212, 160, 390, 160, 'bw-stri') + ell(232, 176, 8, 3, 'bw-skn') + ell(372, 150, 8, 3, 'bw-skn')) +
      S('endplatte', line([[300, 6], [300, 78]], 'bw-axon') + blob([[246, 106], [262, 88], [300, 80], [338, 88], [354, 106], [340, 116], [300, 117], [260, 116]], 'bw-bout') +
        path('M244 122' + Array.from({ length: 7 }, () => 'h8v12h8v-12').join('') + 'h-0', 'bw-fold')) +
      S('schwann', rect(294, 8, 12, 24, 6, 'bw-myel') + rect(294, 36, 12, 24, 6, 'bw-myel') + ell(309, 20, 2.4, 5, 'bw-schw-n') + ell(309, 48, 2.4, 5, 'bw-schw-n') + path('M262 88Q300 70 338 88', 'bw-telo')) +
      S('ach', [[270, 102], [284, 94], [298, 104], [312, 92], [326, 102], [340, 104], [290, 110], [318, 110], [304, 88]].map(([x, y]) => circ(x, y, 4.2, 'ves')).join('') + [252, 268, 284, 300, 316, 332, 348].map(x => circ(x, 119.5, 1.5, 'bw-achm')).join('')) +
      S('nachr', rect(244, 116.5, 112, 10, 0, 'hit-c') + Array.from({ length: 7 }, (_, i) => rect(245 + i * 16, 119.5, 6, 4.5, 1.5, 'rec')).join('')) +
      zlabel(300, 188, 'Muskelfaser') +
      // dermatomes
      S('dermatom', `<g transform="translate(${TX} ${TY}) scale(${K})"><clipPath id="bw-sil"><path d="${SIL2}"/></clipPath><g clip-path="url(#bw-sil)">${st}</g><path d="${SIL2}" class="bw-derm-o"/></g>`) +
      `<path d="M${f(hand[0])} ${f(hand[1])}L200 278M${f(navel[0])} ${f(navel[1])}L300 262M${f(foot[0])} ${f(foot[1])}L300 312" class="lead"/>` +
      zlabel(188, 282, 'C6') + zlabel(318, 265, 'Th10') + zlabel(314, 316, 'L5'), 'Nervenquerschnitt, Endplatte und Dermatome');
  };
  MEDSVG.addMaps('nerven', [['nerven', 'Periphere Nerven', 3], ['nerven4', 'Nerv & Endplatte', 4]], { nerven: nervenMap, nerven4: nerven4Map });

  /* ================= Rückenmark ================= */
  // cross-section geometry in base units (centre 0/0, dorsal up, white matter 62 × 50), right half; mirrored for the left
  const RM = {
    DH: [[8, -6], [16, -10], [24, -22], [30, -36], [36, -42], [40, -38], [34, -26], [28, -10], [22, -2], [12, 0]],
    VH: [[10, 2], [24, 0], [34, 8], [40, 20], [38, 32], [28, 38], [18, 32], [12, 18]],
    LH: [[24, -8], [40, -4], [26, 4]],
    DR: [[36, -40], [56, -46], [76, -40], [86, -32]], VR: [[30, 38], [54, 40], [74, 28], [92, 6], [104, -10]], SN: [[102, -18], [110, -6], [116, 6]],
    HS: [[2, -47], [2, -12], [6, -10], [14, -22], [22, -36], [20, -44], [10, -47]],
    PY: [[42, -32], [51, -28], [56, -18], [54, -8], [45, -10], [40, -20]],
    ST: [[47, 6], [57, 10], [54, 22], [45, 32], [43, 30], [46, 18]],
  };
  const tf = (cx, cy, k) => pts => pts.map(([x, y]) => [f(cx + x * k), f(cy + y * k)]);
  const both = (T, pts, fn) => fn(T(pts)) + fn(T(pts.map(([x, y]) => [-x, y])));
  const arc = (cx, cy, rx, ry, a0, a1, cls) => { const P = a => [f(cx + rx * Math.cos(a * Math.PI / 180)), f(cy + ry * Math.sin(a * Math.PI / 180))], p0 = P(a0), p1 = P(a1); return path(`M${p0[0]} ${p0[1]}A${rx} ${ry} 0 0 1 ${p1[0]} ${p1[1]}`, cls); };
  const greyMatter = (T, wrap) => wrap('hinterhorn', both(T, RM.DH, p => blob(p, 'bw-gm bw-gm-d'))) + wrap('vorderhorn', both(T, RM.VH, p => blob(p, 'bw-gm bw-gm-v'))) + wrap('seitenhorn', both(T, RM.LH, p => blob(p, 'bw-gm bw-gm-l')));

  const rueckenmarkMap = () => {
    const CL = [[72, 4], [71, 30], [67, 50], [66, 70], [70, 96], [72, 130], [72, 165], [69, 185], [69, 200], [72, 214], [76, 228]];
    const half = pts => [...pts, ...mx(pts, 78).reverse()];
    let nerves = '', cauda = '';
    for (let y = 18; y <= 196; y += 12) { const d = 10 + (y / 196) * 22; nerves += line([[70, y], [52, y + d * .5], [40, y + d]], 'bw-sn') + line([[86, y], [104, y + d * .5], [116, y + d]], 'bw-sn'); }
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) cauda += line([[78 + s * (2 + i * .8), 200 + i * 6], [78 + s * (4 + i * 1.8), 246 + i * 8], [78 + s * (28 - i * 2.4), 258 + i * 10]], 'bw-cauda');
    const C = [282, 170], T = tf(C[0], C[1], 1);
    const wrap = (id, inner) => S(id, inner);
    return svgw('0 0 400 330',
      // overview
      `<g class="ghost">${line([[60, 6], [58, 100], [60, 200], [66, 270], [78, 292]], 'bw-dura')}${line([[96, 6], [98, 100], [96, 200], [90, 270], [78, 292]], 'bw-dura')}</g>` +
      deco(nerves + line([[78, 238], [78, 318]], 'bw-filum') + blob([...CL, [78, 238], ...mx(CL, 78).reverse()], 'bw-cord')) +
      S('int_cerv', blob(half([[71, 34], [67, 50], [66, 70], [69, 92], [71, 102]]), 'bw-cord-e')) +
      S('int_lumb', blob(half([[72, 166], [69, 185], [69, 200], [71, 212]]), 'bw-cord-e')) +
      S('conus', blob([[71, 212], [73, 222], [76, 231], [78, 239], [80, 231], [83, 222], [85, 212]], 'bw-conus')) +
      S('cauda', cauda) +
      zlabel(20, 56, 'C') + zlabel(20, 140, 'Th') + zlabel(20, 268, 'L') + zlabel(20, 306, 'S') + `<path d="M52 238H66" class="lead"/>` + zlabel(28, 241, 'L1/L2') +
      // cross-section
      deco(arc(C[0], C[1], 96, 80, -140, -40, 'bw-bonearc') + arc(C[0], C[1], 96, 80, 25, 155, 'bw-bonearc')) +
      S('epidural', ring(C[0], C[1], 90, 74, 79, 65, 'bw-epid') + [-120, -60, 60, 120, 200, -20].map(a => circ(f(C[0] + 85 * Math.cos(a * Math.PI / 180)), f(C[1] + 69.5 * Math.sin(a * Math.PI / 180)), 3, 'bw-ven')).join('')) +
      deco(ell(C[0], C[1], 78, 64, 'bw-dura bw-liq-f') + ell(C[0], C[1], 74, 60, 'bw-arach')) +
      deco(both(T, RM.SN, p => line(p, 'bw-root'))) +
      S('vorderwurzel', both(T, RM.VR, p => line(p, 'bw-root'))) +
      S('hinterwurzel', both(T, RM.DR, p => line(p, 'bw-root')) + ell(C[0] + 92, C[1] - 26, 12, 9, 'bw-gangl') + ell(C[0] - 92, C[1] - 26, 12, 9, 'bw-gangl')) +
      deco(ell(C[0], C[1], 62, 50, 'bw-wm') + line([[C[0], C[1] + 50], [C[0], C[1] + 38]], 'bw-fiss') + line([[C[0], C[1] - 50], [C[0], C[1] - 30]], 'bw-sept') + rect(C[0] - 14, C[1] - 5, 28, 10, 3, 'bw-gm')) +
      greyMatter(T, wrap) + deco(circ(C[0], C[1], 2, 'bw-cc')) +
      zlabel(C[0], 72, 'dorsal') + zlabel(C[0], 274, 'ventral'), 'Rückenmark: Übersicht und Querschnitt');
  };

  const rueckenmark4Map = () => {
    const C = [130, 150], k = 1.35, T = tf(C[0], C[1], k), Q = (x, y) => T([[x, y]])[0];
    const wrap = (id, inner) => inner;
    const aff = [[342, 220], [320, 186], [292, 150], [264, 120], [243, 104], [229.9, 96], [205.6, 87.9], [178.6, 96], [170.5, 109.5], [159.7, 136.5], [162.4, 163.5], [165, 174]];
    const eff = [[165, 184], [171, 197], [174, 202], [203, 206], [234, 200], [268, 200], [300, 212], [322, 230], [330, 242]];
    const mn = Q(26, 22), asa = Q(0, 53.5);
    const dend = [[-12, -8], [10, -10], [-12, 8], [12, 6], [2, 13]].map(([dx, dy]) => line([[mn[0], mn[1]], [mn[0] + dx * .6, mn[1] + dy * .6], [mn[0] + dx, mn[1] + dy]], 'bw-mn-d')).join('');
    return svgw('0 0 400 330',
      deco(ell(C[0], C[1], 106, 90, 'bw-dura')) +
      S('subarachnoidal', ring(C[0], C[1], 100, 84, 84, 68, 'bw-liq')) +
      deco(both(T, RM.DR, p => line(p, 'bw-root')) + both(T, RM.VR.slice(0, 4), p => line(p, 'bw-root')) + ell(f(C[0] + 84 * k), f(C[1] - 34 * k), 14, 11, 'bw-gangl') + ell(f(C[0] - 84 * k), f(C[1] - 34 * k), 14, 11, 'bw-gangl') +
        ell(C[0], C[1], 83.7, 67.5, 'bw-wm') + line([[C[0], C[1] + 67.5], [C[0], C[1] + 51]], 'bw-fiss') + line([[C[0], C[1] - 67.5], [C[0], C[1] - 40]], 'bw-sept') +
        rect(C[0] - 18, C[1] - 7, 36, 14, 4, 'bw-gm') + greyMatter(T, wrap) + circ(C[0], C[1], 2.6, 'bw-cc') +
        [-16, 16].map(x => { const p = Q(x, -52); return circ(p[0], p[1], 3.4, 'bw-art'); }).join('')) +
      S('hinterstrang', both(T, RM.HS, p => blob(p, 'bw-tr-hs'))) +
      S('pyramidenbahn', both(T, RM.PY, p => blob(p, 'bw-tr-py'))) +
      S('spinothal', both(T, RM.ST, p => blob(p, 'bw-tr-st'))) +
      // muscle with spindle (context)
      deco(blob([[330, 150], [352, 150], [370, 190], [372, 240], [356, 290], [340, 296], [322, 288], [312, 240], [314, 190]], 'bw-musc') + line([[341, 150], [341, 128]], 'bw-ten', 'style="stroke-width:6"') + line([[340, 296], [340, 316]], 'bw-ten', 'style="stroke-width:6"') +
        path('M330 222Q342 212 354 222Q342 232 330 222Z', 'bw-spin') + path('M336 218l3 8 3-8 3 8 3-8', 'bw-ia')) +
      S('reflexbogen', line(aff, 'bw-aff') + line(eff, 'bw-eff') + circ(243, 104, 4.5, 'bw-gcell') + path('M326 238l4 4 4-4', 'bw-eff')) +
      S('motoneuron', dend + line([[mn[0], mn[1]], [mn[0] + 1, mn[1] + 8]], 'bw-mn-d') + circ(mn[0], mn[1], 6.5, 'bw-mn') + circ(mn[0], mn[1], 2.4, 'bw-mn-n')) +
      S('adamkiewicz', `<g class="ghost">${circ(36, 300, 22, 'bw-aorta')}</g>` + tube([[54, 288], [74, 266], [96, 248], [114, 234], [126, 225]], 4, 'v-red')) +
      S('a_spinalis', circ(asa[0], asa[1], 9, 'hit-c') + circ(asa[0], asa[1], 6, 'bw-asa') + line([[asa[0], asa[1] - 5], [asa[0], asa[1] - 16]], 'v-red', 'style="stroke-width:2"')) +
      zlabel(C[0], 52, 'dorsal') + zlabel(190, 262, 'ventral') + zlabel(342, 326, 'Muskel') + zlabel(26, 266, 'links'), 'Bahnen, Reflexbogen und Gefäße');
  };
  MEDSVG.addMaps('rueckenmark', [['rueckenmark', 'Rückenmark', 3], ['rueckenmark4', 'Bahnen & Reflex', 4]], { rueckenmark: rueckenmarkMap, rueckenmark4: rueckenmark4Map });
})();
