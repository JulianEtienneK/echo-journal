/* Gehirn & Psyche: brain views with fixed region ids (data-s). Overlays (pathways, networks, disorders) are drawn at runtime by psy.js. */
(function () {
  'use strict';
  const { f, cr, path, blob, line, ell, circ, S, txt, svgw, tube, zlabel } = MEDSVG.h;
  const R = (id, inner) => S(id, inner);
  const proj = (id, inner) => `<g class="part proj" data-s="${id}">${inner}</g>`; // projected (lies off the cutting plane)

  /* ---------- lateral view, left hemisphere, frontal pole on the left ---------- */
  const OUT = [[62, 166], [52, 120], [70, 72], [118, 38], [176, 24], [222, 26], [260, 30], [302, 50], [326, 66], [352, 110], [350, 160], [332, 194], [298, 198], [264, 214], [220, 224], [160, 222], [118, 208], [96, 178]];
  const LOBE = {
    fr: [[96, 178], [62, 166], [52, 120], [70, 72], [118, 38], [176, 24], [222, 26], [206, 80], [186, 154], [140, 166]],
    pa: [[222, 26], [260, 30], [302, 50], [292, 150], [250, 146], [186, 154], [206, 80]],
    oc: [[302, 50], [326, 66], [352, 110], [350, 160], [332, 194], [298, 198], [292, 150]],
    te: [[96, 178], [140, 166], [186, 154], [250, 146], [292, 150], [298, 198], [264, 214], [220, 224], [160, 222], [118, 208]],
  };
  const CB = [[250, 226], [290, 206], [336, 200], [352, 224], [334, 252], [292, 262], [256, 250]];
  const STEM = [[214, 220], [244, 214], [256, 240], [252, 290], [230, 296], [222, 262]];
  const lat = () => svgw('0 0 400 300',
    R('brainstem', blob(STEM, 'py-stem')) + R('cerebellum', blob(CB, 'py-cb') + line([[262, 232], [300, 220], [340, 214]], 'py-fol') + line([[262, 244], [300, 236], [342, 232]], 'py-fol')) +
    Object.entries(LOBE).map(([k, p]) => path(cr(p, true, .55), 'py-lobe py-' + k)).join('') +
    R('dlpfc', blob([[92, 68], [124, 44], [174, 30], [160, 72], [142, 106], [106, 108], [84, 96]], 'py-r py-pfc', 'style="--k:.6"')) +
    R('vlpfc', blob([[66, 124], [104, 116], [138, 118], [138, 146], [114, 160], [84, 164], [62, 150]], 'py-r py-pfc2')) +
    R('ofc', blob([[54, 150], [66, 160], [96, 172], [124, 168], [116, 178], [92, 182], [62, 174]], 'py-r py-ofc')) +
    R('broca', blob([[142, 120], [166, 124], [170, 150], [146, 156]], 'py-r py-lang')) +
    R('m1', blob([[200, 28], [222, 26], [206, 80], [186, 150], [168, 146], [182, 88]], 'py-r py-m1')) +
    R('s1', blob([[224, 28], [246, 32], [228, 90], [208, 152], [190, 152], [208, 82]], 'py-r py-s1')) +
    R('ppc', blob([[252, 36], [298, 52], [292, 120], [270, 140], [244, 132], [236, 92]], 'py-r py-ppc')) +
    R('a1', blob([[198, 158], [236, 152], [240, 166], [202, 172]], 'py-r py-aud')) +
    R('wernicke', blob([[246, 150], [278, 148], [288, 166], [262, 180], [242, 172]], 'py-r py-lang')) +
    R('temppol', blob([[100, 180], [124, 174], [134, 196], [118, 208], [102, 196]], 'py-r py-tp')) +
    R('insula', ell(170, 164, 22, 7, 'py-r py-ins') + path('M150 164q20-9 40 0', 'py-ins-l')) +
    R('v1', blob([[330, 118], [350, 112], [352, 140], [348, 166], [330, 186], [318, 152]], 'py-r py-v1')) +
    line([[222, 26], [206, 80], [186, 154]], 'py-sulc') + line([[96, 178], [186, 154], [250, 146]], 'py-sulc') +
    zlabel(120, 296, 'vorn') + zlabel(330, 296, 'hinten'), 'Gehirn von der Seite');

  /* ---------- midsagittal view (medial surface; limbic structures drawn through) ---------- */
  const MOUT = [[62, 166], [52, 120], [70, 72], [118, 38], [176, 24], [222, 26], [260, 30], [302, 50], [326, 66], [352, 110], [350, 160], [330, 190], [300, 196], [270, 186], [246, 176], [214, 174], [186, 178], [150, 182], [112, 182], [86, 176]];
  const MSTEM = [[222, 174], [250, 172], [258, 200], [256, 246], [248, 292], [228, 294], [224, 248], [214, 206]];
  const MCB = [[262, 200], [300, 188], [340, 194], [352, 222], [332, 248], [292, 254], [266, 238]];
  const med = () => svgw('0 0 400 300',
    path(cr(MOUT, true, .55), 'py-medial') +
    R('brainstem', blob(MSTEM, 'py-stem') + line([[226, 206], [256, 204]], 'py-fol') + line([[228, 248], [254, 246]], 'py-fol')) +
    R('cerebellum', blob(MCB, 'py-cb') + line([[272, 214], [310, 204], [344, 212]], 'py-fol') + line([[272, 228], [310, 222], [342, 232]], 'py-fol')) +
    R('vmpfc', blob([[60, 150], [70, 114], [108, 108], [114, 138], [110, 164], [82, 170]], 'py-r py-pfc2')) +
    R('dacc', blob([[118, 112], [132, 88], [170, 74], [202, 72], [202, 86], [168, 90], [136, 106], [128, 122]], 'py-r py-cing')) +
    R('pcc', blob([[228, 72], [262, 78], [288, 102], [288, 126], [276, 130], [270, 108], [252, 90], [228, 86]], 'py-r py-cing2')) +
    R('precuneus', blob([[262, 58], [298, 52], [320, 76], [302, 102], [290, 100], [270, 80]], 'py-r py-ppc')) +
    R('v1', blob([[318, 122], [346, 114], [350, 150], [326, 160]], 'py-r py-v1') + line([[312, 140], [348, 134]], 'py-sulc')) +
    R('sgacc', blob([[118, 132], [130, 128], [138, 144], [132, 160], [116, 156]], 'py-r py-sg')) +
    R('cc', tube([[136, 142], [122, 122], [140, 100], [176, 90], [224, 88], [264, 100], [276, 118], [262, 128]], 11, 'py-cc')) +
    line([[262, 168], [244, 150], [232, 120], [200, 112], [168, 122], [196, 176]], 'py-fornix') +
    R('thalamus', ell(210, 136, 24, 14, 'py-r py-thal')) +
    R('habenula', circ(236, 122, 4.5, 'py-r py-hab')) + R('pineal', ell(252, 134, 7, 4.5, 'py-r py-pin')) +
    R('septum', blob([[140, 126], [152, 124], [156, 136], [144, 140]], 'py-r py-sep')) +
    R('hypothal', blob([[164, 152], [190, 150], [198, 164], [186, 176], [168, 172]], 'py-r py-hyth')) +
    R('mammillar', circ(194, 178, 5, 'py-r py-mam')) +
    R('hypophyse_p', line([[178, 174], [172, 190]], 'py-stalk') + ell(170, 196, 9, 7, 'py-r py-pit')) +
    R('nbm', blob([[142, 150], [158, 148], [162, 160], [148, 166]], 'py-r py-nbm')) +
    proj('nacc', ell(132, 170, 9, 6, 'py-r py-nacc')) +
    proj('amygdala', ell(152, 200, 11, 8, 'py-r py-amy')) +
    proj('hippocampus', line([[164, 204], [186, 208], [204, 204], [214, 194], [218, 182]], 'py-hipp')) +
    proj('entorhinal', blob([[150, 212], [186, 216], [194, 226], [158, 226]], 'py-r py-ent')) +
    R('vta', circ(230, 184, 5.5, 'py-r py-da')) + proj('sn', ell(244, 192, 8, 4, 'py-r py-sn')) +
    R('raphe', [198, 210, 222, 234].map((y, i) => circ(236 + (i % 2) * 2, y, 3.6, 'py-r py-5ht')).join('') + line([[236, 196], [238, 238]], 'py-hit-l')) +
    R('lc', circ(250, 218, 4.5, 'py-r py-ne')) +
    path(cr([[120, 182], [160, 190], [210, 190], [232, 200], [214, 230], [170, 234], [130, 222]], true, .6), 'py-tlobe') +
    zlabel(176, 248, 'Schläfenlappen innen, durchscheinend') + zlabel(110, 296, 'vorn') + zlabel(330, 296, 'hinten'), 'Gehirn im Mittelschnitt');

  /* ---------- coronal section through striatum and thalamus ---------- */
  const mirror = pts => pts.map(([x, y]) => [400 - x, y]);
  const both = (pts, cls) => blob(pts, cls) + blob(mirror(pts), cls);
  const HEMI = [[198, 28], [150, 24], [100, 38], [62, 72], [46, 118], [48, 160], [64, 192], [58, 214], [70, 246], [106, 262], [140, 250], [156, 228], [172, 216], [196, 214]];
  const WHITE = [[196, 40], [152, 36], [108, 50], [74, 82], [60, 122], [62, 156], [78, 190], [74, 212], [84, 236], [108, 248], [134, 238], [148, 222], [170, 206], [196, 204]];
  const cor = () => svgw('0 0 400 300',
    both(HEMI, 'py-gray') + both(WHITE, 'py-white') +
    line([[200, 26], [200, 88]], 'py-fiss') + line([[52, 170], [80, 172], [108, 168]], 'py-fiss') + line([[348, 170], [320, 172], [292, 168]], 'py-fiss') +
    R('insula', both([[70, 136], [84, 126], [88, 182], [74, 188]], 'py-r py-ins')) +
    R('claustrum', both([[93, 124], [99, 122], [99, 180], [93, 182]], 'py-r py-cla')) +
    R('putamen', both([[106, 126], [124, 116], [134, 136], [130, 176], [114, 186], [102, 160]], 'py-r py-put')) +
    R('gp', both([[134, 140], [144, 148], [152, 186], [134, 184]], 'py-r py-gp')) +
    R('capsula', both([[138, 108], [148, 104], [160, 140], [166, 190], [156, 192], [146, 150]], 'py-r py-cap')) +
    R('caudate', both([[150, 102], [166, 100], [170, 118], [162, 136], [148, 124]], 'py-r py-caud')) +
    R('ventrikel', both([[172, 104], [196, 102], [196, 112], [182, 122], [174, 118]], 'py-r py-vent') + path('M199 140V192h2V140z', 'py-vent')) +
    R('cc', path('M150 96Q200 82 250 96L250 104Q200 92 150 104Z', 'py-cc-s')) +
    R('thalamus', both([[170, 142], [196, 138], [196, 186], [176, 190], [166, 166]], 'py-r py-thal')) +
    R('bnst', circ(166, 134, 4.5, 'py-r py-bnst') + circ(234, 134, 4.5, 'py-r py-bnst')) +
    R('hypothal', blob([[184, 192], [216, 192], [214, 212], [186, 212]], 'py-r py-hyth')) +
    R('amygdala', ell(130, 228, 14, 10, 'py-r py-amy') + ell(270, 228, 14, 10, 'py-r py-amy')) +
    zlabel(200, 292, 'Frontalschnitt (von vorn gesehen)'), 'Gehirn im Frontalschnitt');

  /* ---------- cortical microcircuit: layer-V pyramidal neuron ---------- */
  const syn = () => svgw('0 0 400 320',
    ['I', 'II/III', 'IV', 'V', 'VI'].map((l, i) => `<rect x="0" y="${i * 60}" width="400" height="60" class="py-layer${i % 2}"/>` + txt(6, i * 60 + 14, l, 'lbl-z')).join('') +
    R('microglia', path('M330 268l-14-10M330 268l16-8M330 268l-4 16M330 268l12 12M330 268l-16 8', 'py-mg-l') + circ(330, 268, 6, 'py-mg')) +
    R('pyramidal', path('M150 196L170 236L130 236Z', 'py-pyr') + line([[150, 236], [150, 300]], 'py-axon') + line([[136, 230], [110, 252], [96, 270]], 'py-den') + line([[164, 230], [190, 254], [204, 272]], 'py-den')) +
    R('apical', line([[150, 196], [150, 36]], 'py-den') + line([[150, 60], [124, 24]], 'py-den') + line([[150, 60], [176, 24]], 'py-den') + [70, 96, 122, 150, 176].map(y => circ(146, y, 3, 'py-spine') + circ(154, y + 10, 3, 'py-spine')).join('')) +
    R('r5ht2a', [80, 132, 160].map(y => path(`M157 ${y}h7m0-4v8`, 'py-rec2a')).join('') + circ(168, 132, 7, 'hit-c')) +
    R('r5ht1a', path('M150 246h-8m0-4v8', 'py-rec1a') + path('M150 262h8m0-4v8', 'py-rec1a') + circ(150, 254, 9, 'hit-c')) +
    R('terminal5ht', line([[380, 70], [300, 110], [212, 130]], 'py-5ht-ax') + circ(202, 132, 12, 'py-term') + [[198, 128], [206, 134], [200, 138]].map(([x, y]) => circ(x, y, 2.4, 'py-ves')).join('')) +
    R('sert', path('M190 128h-6M190 136h-6', 'py-sert') + circ(188, 132, 6, 'hit-c')) +
    R('nmda', line([[20, 96], [90, 100], [132, 106]], 'py-glu-ax') + circ(136, 108, 7, 'py-gterm') + path('M144 104v8M146 104v8', 'py-nmda')) +
    R('interneuron', circ(232, 216, 9, 'py-int') + line([[232, 216], [196, 214], [168, 218]], 'py-int-l') + line([[232, 216], [252, 186]], 'py-int-l') + line([[232, 216], [254, 240]], 'py-int-l')) +
    R('trkb', [[146, 150], [154, 176]].map(([x, y]) => path(`M${x - 4} ${y - 4}l4 4 4-4`, 'py-trkb')).join('') + [[134, 148], [132, 172], [166, 160]].map(([x, y]) => circ(x, y, 2.2, 'py-bdnf')).join('') + circ(140, 162, 9, 'hit-c')) +
    zlabel(330, 60, 'aus den Raphe-Kernen') + zlabel(70, 88, 'Glutamat-Eingang'), 'Pyramidenzelle der Schicht V');

  MEDSVG.addMaps('psyche', [['psy_lat', 'Seitenansicht', 1], ['psy_med', 'Mittelschnitt', 1], ['psy_cor', 'Frontalschnitt', 2], ['psy_syn', 'Synapse & Rezeptoren', 3]], { psy_lat: lat, psy_med: med, psy_cor: cor, psy_syn: syn });
})();
