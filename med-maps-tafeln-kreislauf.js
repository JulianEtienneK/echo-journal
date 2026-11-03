/* Bildtafeln Nerven, Rückenmark, Gefäße, Blut, Lymphe, Milz: Organkarten auf Basis von Servier Medical Art (CC BY 4.0, https://smart.servier.com).
   Bearbeitung: Hintergrund entfernt, Beschriftungen entfernt, zugeschnitten, teils mehrere Folien zu einer Tafel zusammengesetzt, als WebP gespeichert.
   Die Tippflächen liegen unsichtbar über dem Bild, Koordinaten im Pixelraum des Bildes. */
(function () {
  const { S, imgw, hot, hotc, hote, hotl } = MEDSVG.h;
  // mehrere Flächen in einer Gruppe: shapes = [[pts], [pts], ...]
  const hots = (id, shapes, k = .3) => S(id, shapes.map(p => `<path d="${MEDSVG.cr(p, true, k)}" class="hot"/>`).join(''));
  const hotls = (id, lines) => S(id, lines.map(p => `<path d="${MEDSVG.cr(p, false)}" class="hotl"/>`).join(''));
  // mehrere Kreise in einer Gruppe: cs = [[cx, cy, r], ...]
  const hotcs = (id, cs) => S(id, cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" class="hot"/>`).join(''));
  // Fläche + Linien in einer Gruppe (Netz mit dünnen Ausläufern)
  const hotpl = (id, shapes, lines) => S(id, shapes.map(p => `<path d="${MEDSVG.cr(p, true, .3)}" class="hot"/>`).join('') + lines.map(p => `<path d="${MEDSVG.cr(p, false)}" class="hotl"/>`).join(''));

  /* ---------------- Periphere Nerven ---------------- */
  // Lendenwirbelsäule und Becken von hinten: Conus, Cauda, Plexus, N. ischiadicus
  const becken = (ids) => imgw(828, 1156, [['nerv-becken.webp', 0, 0, 828, 1156]], ids, 'Lendenwirbelsäule und Becken von hinten mit Nerven');
  const nervenB = () => becken(
    hots('plexus_lumbo', [
      [[372, 176], [330, 190], [270, 222], [210, 262], [160, 300], [170, 350], [210, 360], [190, 420], [210, 480], [250, 560], [300, 620], [345, 650], [372, 640], [376, 520], [376, 360]],
      [[452, 176], [500, 190], [560, 222], [620, 262], [668, 300], [656, 350], [620, 360], [636, 420], [610, 480], [570, 560], [520, 620], [476, 650], [452, 640], [450, 520], [450, 360]]], .25) +
    hotls('ischiadicus', [
      [[290, 600], [250, 640], [212, 690], [180, 760], [168, 850], [180, 950], [198, 1040], [205, 1105]],
      [[505, 600], [560, 650], [604, 720], [640, 820], [660, 920], [655, 1020], [630, 1105]]]),
    );

  const nervenS = () => imgw(851, 963, [['nerv-sympathikus.webp', 0, 0, 851, 963]],
    hotl('grenzstrang', [[242, 150], [236, 210], [222, 265], [208, 315], [192, 360], [184, 420], [186, 485], [198, 535], [215, 580], [236, 630], [252, 675], [258, 720], [258, 775], [248, 820], [226, 862]]),
    'Rückenmark, Wirbelsäule und vegetative Ganglien mit Organen');

  // Nerv im Querschnitt oben, Hautsegmente unten
  const nerven4Q = () => imgw(853, 1002, [['nerv-faszikel.webp', 0, 0, 853, 1002]],
    hot('nervenhuellen', [[6, 12], [40, 70], [110, 125], [210, 100], [310, 78], [410, 58], [480, 58], [545, 92], [585, 155], [598, 250], [582, 350], [540, 422], [478, 448], [415, 432], [330, 382], [222, 284], [120, 202], [40, 142], [6, 70]], .2) +
    hotcs('vasa_nervorum', [[523, 243, 15], [524, 283, 15]]) +
    hotl('schwann', [[600, 252], [660, 258], [722, 270], [772, 298], [812, 330], [842, 356]]) +
    hot('dermatom', [[283, 492], [304, 518], [300, 560], [342, 588], [378, 678], [412, 748], [396, 782], [364, 762], [336, 706], [330, 800], [322, 900], [322, 996], [250, 996], [244, 900], [236, 800], [230, 706], [204, 762], [172, 782], [152, 750], [186, 678], [222, 588], [264, 560], [260, 518]], .2),
    'Nerv im Querschnitt und Hautsegmente von vorn und hinten');

  // Endplatte am Muskel oben, Synapse vergrößert unten
  const nerven4E = () => imgw(725, 1110, [['nerv-endplatte.webp', 0, 0, 725, 1110]],
    S('endplatte', [[210, 232, 34, 20], [378, 240, 28, 16], [508, 257, 28, 16], [613, 240, 26, 16]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="hot"/>`).join('')) +
    S('ach', [[388, 632, 22], [378, 733, 22], [433, 747, 22], [298, 787, 20], [373, 797, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" class="hot"/>`).join('') +
      `<path d="${MEDSVG.cr([[222, 800], [300, 812], [380, 822], [480, 815], [552, 818], [552, 836], [470, 836], [380, 842], [300, 832], [222, 820]], true, .2)}" class="hot"/>`) +
    hotl('nachr', [[196, 836], [236, 822], [282, 852], [330, 864], [380, 870], [430, 862], [480, 852], [530, 842], [560, 832]]),
    'Nervenendigung auf einer Muskelfaser und Synapse vergrößert');

  /* ---------------- Rückenmark ---------------- */
  const rmQ = () => imgw(900, 459, [['rm-querschnitt.webp', 0, 0, 900, 459]],
    hots('hinterhorn', [
      [[128, 90], [170, 86], [222, 98], [262, 122], [268, 150], [240, 160], [206, 150], [176, 132], [140, 116]],
      [[472, 94], [430, 88], [378, 100], [338, 124], [332, 150], [360, 160], [396, 150], [426, 132], [462, 116]]], .3) +
    hots('vorderhorn', [
      [[200, 230], [240, 236], [262, 250], [262, 330], [252, 368], [200, 372], [140, 365], [130, 330], [150, 290], [180, 250]],
      [[400, 230], [360, 236], [338, 250], [338, 330], [348, 368], [400, 372], [460, 365], [472, 330], [452, 290], [420, 250]]], .3) +
    hotl('hinterwurzel', [[488, 60], [540, 54], [600, 70], [650, 92], [700, 116], [740, 150], [765, 180]]) +
    hotl('vorderwurzel', [[575, 378], [622, 352], [672, 320], [718, 282], [752, 236], [772, 210]]),
    'Rückenmark im Querschnitt mit Spinalnerv');

  const rmC = () => becken(
    hot('cauda', [[392, 172], [436, 172], [450, 300], [452, 450], [446, 600], [434, 700], [394, 700], [380, 600], [374, 450], [378, 300]], .2) +
    hot('conus', [[398, 96], [430, 96], [428, 132], [414, 172], [402, 134]], .2));

  /* ---------------- Gefäße ---------------- */
  // Aorta mit Ästen links, Arterien im ganzen Körper rechts
  const gefA = () => imgw(895, 1285, [['gef-aorta.webp', 0, 0, 895, 1285]],
    hot('aorta_asc', [[80, 205], [118, 195], [145, 210], [150, 260], [160, 300], [175, 335], [160, 362], [125, 365], [112, 330], [92, 290], [80, 250]], .2) +
    hot('arcus', [[92, 180], [98, 148], [130, 128], [175, 122], [215, 130], [250, 158], [262, 200], [255, 238], [225, 222], [190, 200], [150, 190], [118, 192]], .2) +
    hot('aorta_thor', [[205, 225], [258, 212], [250, 300], [240, 400], [222, 500], [205, 580], [198, 630], [152, 630], [158, 560], [170, 450], [182, 350], [195, 270]], .15) +
    hot('aorta_abd', [[152, 640], [198, 640], [196, 750], [194, 850], [195, 990], [150, 990], [150, 850], [150, 750]], .1) +
    hotls('carotis', [[[108, 8], [108, 60], [112, 115]], [[193, 8], [190, 60], [186, 118]]]) +
    hotl('truncus_coel', [[55, 682], [110, 680], [150, 672], [172, 665], [200, 664], [250, 662], [292, 664]]) +
    hotl('ams', [[158, 692], [162, 715], [168, 735], [172, 750]]) +
    hotl('ami', [[192, 898], [210, 910], [228, 918]]) +
    hotls('iliaca', [[[160, 1000], [135, 1040], [110, 1090]], [[185, 1000], [212, 1040], [238, 1088]]]) +
    hotls('femoralis', [[[600, 600], [585, 660], [578, 740], [582, 820], [590, 900]], [[700, 600], [714, 660], [720, 740], [714, 820], [705, 900]]]),
    'Aorta mit Ästen und Arterien des Körpers');

  // Arterie und Vene mit freigelegten Wandschichten, darunter ein Kapillarbett
  const gef4W = () => imgw(620, 1223, [['gef-wand.webp', 0, 0, 620, 1223]],
    hot('adventitia', [[9, 549], [34, 537], [149, 546], [274, 531], [280, 549], [280, 686], [251, 716], [149, 726], [46, 716], [9, 686]], .2) +
    hots('media', [[[21, 448], [69, 455], [149, 463], [226, 455], [272, 446], [272, 509], [149, 520], [21, 512]], [[16, 104], [66, 104], [66, 400], [16, 440]], [[212, 104], [270, 104], [270, 440], [212, 400]]], .15) +
    hot('intima', [[71, 377], [82, 394], [149, 414], [213, 394], [226, 377], [226, 448], [149, 457], [71, 448]], .2) +
    hot('endothel', [[84, 70], [110, 62], [170, 62], [206, 72], [210, 200], [208, 370], [150, 388], [90, 370], [84, 200]], .2) +
    hot('venenklappe', [[395, 190], [430, 205], [465, 245], [500, 215], [540, 192], [530, 250], [512, 298], [470, 312], [425, 298], [405, 250]], .25) +
    hot('kapillare_g', [[10, 1060], [80, 1020], [160, 920], [240, 820], [300, 775], [370, 770], [450, 800], [520, 860], [600, 890], [615, 910], [560, 950], [480, 1060], [400, 1160], [320, 1210], [240, 1215], [150, 1170], [80, 1110]], .2),
    'Arterie und Vene mit Wandschichten, Kapillarbett');

  /* ---------------- Blut ---------------- */
  const blutZ = () => imgw(717, 517, [['blut-zellen.webp', 0, 0, 717, 517]],
    S('erys', [[49, 70, 48, 40, -20], [179, 72, 46, 42, -30], [314, 55, 54, 36, -10], [92, 170, 48, 44, 0], [279, 165, 46, 44, 0]].map(([x, y, rx, ry, r]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" class="hot"/>`).join('')) +
    hotcs('thrombos', [[89, 335, 24], [154, 335, 24], [224, 335, 24], [79, 390, 24], [129, 390, 24], [179, 390, 24], [229, 395, 24]]) +
    hotcs('leukos', [[634, 255, 62], [634, 65, 62], [632, 445, 62], [480, 136, 70], [479, 383, 54]]),
    'Blutzellen');

  const blut4H = () => imgw(900, 590, [['blut-bildung.webp', 0, 0, 900, 590]],
    hotc('hsz', 560, 35, 33) +
    hotc('megakaryozyt', 148, 400, 36) +
    hotc('retikulozyt', 27, 505, 18) +
    hotc('neutro', 272, 485, 28) +
    hotc('eosino', 372, 485, 28) +
    hotc('monozyt', 580, 362, 30),
    'Blutbildung im Knochenmark');

  /* ---------------- Lymphe ---------------- */
  // Mundhöhle und Thymus oben, Magen mit Lymphknoten unten
  const lympheO = () => imgw(678, 1312, [['lymph-organe.webp', 0, 0, 678, 1312]],
    hot('thymus', [[475, 35], [490, 60], [500, 120], [530, 200], [550, 170], [570, 90], [600, 65], [615, 100], [625, 220], [665, 300], [676, 380], [660, 450], [620, 465], [560, 460], [520, 470], [440, 465], [395, 420], [398, 330], [430, 240], [450, 150]], .2) +
    hots('tonsillen', [
      [[55, 305], [72, 312], [80, 340], [78, 375], [60, 372], [52, 340]],
      [[300, 305], [306, 340], [300, 375], [285, 372], [282, 340], [288, 312]],
      [[135, 312], [210, 312], [212, 328], [135, 328]]], .3) +
    hotcs('lk', [[383, 742], [357, 757], [293, 808], [341, 812], [326, 842], [323, 915], [323, 987], [645, 800], [645, 840], [657, 905], [157, 1072], [188, 1068], [157, 1145], [178, 1165], [203, 1195], [88, 1162], [82, 1203], [282, 1268], [357, 1290], [420, 1282], [487, 1248]].map(([x, y]) => [x, y, 15])),
    'Mundhöhle, Thymus und Magen mit Lymphknoten');

  const lymphe4K = () => imgw(701, 772, [['lymph-kapillare.webp', 0, 0, 701, 772]],
    hotpl('lymphkapillare', [[[20, 385], [80, 375], [170, 365], [260, 340], [330, 360], [420, 350], [470, 380], [500, 440], [560, 495], [630, 510], [620, 560], [530, 600], [470, 620], [430, 700], [420, 760], [380, 760], [330, 660], [220, 660], [170, 770], [120, 770], [130, 660], [80, 600], [20, 530]]],
      [[[307, 82], [310, 150], [305, 220], [298, 280]], [[273, 145], [285, 190], [298, 230]], [[217, 205], [240, 245], [262, 290], [272, 330]], [[293, 262], [300, 300], [312, 340]], [[367, 228], [362, 265], [358, 300]], [[433, 132], [430, 200], [424, 270], [418, 330]], [[407, 158], [410, 220], [416, 270]]]),
    'Kapillarbett mit Blut- und Lymphgefäßen');

  /* ---------------- Milz ---------------- */
  const milzG = () => imgw(911, 664, [['milz-gefaesse.webp', 0, 0, 911, 664]],
    hot('facies_visc', [[760, 5], [800, 0], [840, 25], [865, 100], [870, 200], [850, 280], [800, 330], [740, 338], [705, 310], [705, 240], [740, 180], [760, 100], [755, 40]], .2) +
    hot('facies_diaph', [[700, 370], [750, 360], [820, 375], [870, 420], [900, 480], [910, 560], [890, 630], [840, 662], [790, 655], [770, 600], [760, 540], [730, 480], [695, 430]], .2) +
    hotl('kapsel_m', [[560, 40], [615, 52], [645, 100], [652, 180], [632, 245], [590, 265], [548, 262]]) +
    hotl('a_lien', [[200, 178], [260, 182], [300, 190], [340, 182], [400, 182], [440, 178], [480, 165], [510, 150]]) +
    hotl('v_lien', [[155, 215], [200, 222], [250, 232], [300, 218], [350, 212], [400, 205], [450, 202], [505, 195]]) +
    hote('hilus_m', 518, 168, 18, 50),
    'Milz mit Gefäßen und ihre beiden Flächen');

  MEDSVG.addMaps('nerven', [['nerven_b', 'Becken von hinten', 3], ['nerven_s', 'Vegetatives Nervensystem', 3], ['nerven', 'Schema', 3], ['nerven4_q', 'Nerv & Haut', 4], ['nerven4_e', 'Nerv & Muskel', 4]],
    { nerven_b: nervenB, nerven_s: nervenS, nerven4_q: nerven4Q, nerven4_e: nerven4E });
  MEDSVG.addMaps('rueckenmark', [['rm_q', 'Querschnitt', 3], ['rm_c', 'Lendenbereich von hinten', 3], ['rueckenmark', 'Schema', 3], ['rueckenmark4', 'Bahnen & Reflex', 4]],
    { rm_q: rmQ, rm_c: rmC });
  MEDSVG.addMaps('gefaesse', [['gef_a', 'Aorta & Arterien', 3], ['gef4_w', 'Wand & Kapillaren', 4], ['gefaesse4', 'Schema', 4]],
    { gef_a: gefA, gef4_w: gef4W });
  MEDSVG.addMaps('blut', [['blut_z', 'Blutzellen', 3], ['blut', 'Schema', 3], ['blut4_h', 'Blutbildung', 4], ['blut4', 'Schema', 4]],
    { blut_z: blutZ, blut4_h: blut4H });
  MEDSVG.addMaps('lymphe', [['lymphe_o', 'Rachen, Brust, Magen', 3], ['lymphe', 'Schema', 3], ['lymphe4_k', 'Kapillarbett', 4], ['lymphe4', 'Schema', 4]],
    { lymphe_o: lympheO, lymphe4_k: lymphe4K });
  MEDSVG.addMaps('milz', [['milz_g', 'Milz & Gefäße', 3], ['milz', 'Schema', 3], ['milz4', 'Pulpa', 4]],
    { milz_g: milzG });
})();
