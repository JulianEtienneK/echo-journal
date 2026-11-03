/* Bildtafeln Bewegungsapparat (Knochen, Gelenke, Muskeln): Organkarten auf Basis von Servier Medical Art (CC BY 4.0, https://smart.servier.com).
   Bearbeitung: Hintergrund entfernt, Beschriftungen und Hinweispfeile entfernt, zugeschnitten, als WebP gespeichert.
   herz-myozyten.webp stammt aus der Herz-Tafel (med-maps-tafeln.js) und wird hier mitbenutzt.
   Die Tippflächen liegen unsichtbar über dem Bild, Koordinaten im Pixelraum des Bildes. */
(function () {
  const { S, imgw, hot, hotc, hote, hotl } = MEDSVG.h;
  // mehrere Flächen in einer Gruppe: shapes = [[pts], [pts], ...]
  const hots = (id, shapes, k = .3) => S(id, shapes.map(p => `<path d="${MEDSVG.cr(p, true, k)}" class="hot"/>`).join(''));
  const hotls = (id, lines) => S(id, lines.map(p => `<path d="${MEDSVG.cr(p, false)}" class="hotl"/>`).join(''));
  // mehrere Kreise / Ellipsen in einer Gruppe: [[cx, cy, rx, ry?, rot?], ...]
  const hotes = (id, es) => S(id, es.map(([cx, cy, rx, ry = rx, rot = 0]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" class="hot"/>`).join(''));
  // Ring: Außenkontur minus Innenkontur
  const hotring = (id, outer, inner) => S(id, `<path d="${MEDSVG.cr(outer, true, .3)}${MEDSVG.cr(inner, true, .3)}" fill-rule="evenodd" class="hot"/>`);
  // Teilbild verschoben/skaliert einsetzen: Koordinaten bleiben im Pixelraum des Einzelbilds
  const off = (pts, dx, dy, k = 1) => pts.map(([x, y]) => [Math.round(x * k + dx), Math.round(y * k + dy)]);
  const rect = (id, x, y, w, h) => S(id, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="hot"/>`);

  /* ---------------- Knochen ---------------- */
  // links Femur (aufgeschnitten, Periost zurückgeklappt), rechts Röhrenknochen mit Gefäßen bei (300, 56)
  const RX = 300, RY = 56;
  const knochenS = () => imgw(860, 1131, [['knochen-femur.webp', 0, 0, 260, 1131], ['knochen-roehre.webp', RX, RY, 560, 1019]],
    hot('diaphyse', [[45, 300], [139, 300], [148, 450], [155, 600], [160, 700], [170, 820], [178, 900], [92, 905], [84, 800], [80, 700], [68, 550], [56, 420]], .1) +
    hot('epiphyse', [[18, 990], [45, 950], [90, 925], [150, 920], [200, 930], [230, 965], [238, 1030], [235, 1100], [200, 1128], [160, 1120], [130, 1090], [100, 1100], [60, 1126], [20, 1115], [8, 1060]]) +
    hot('spongiosa', [[8, 105], [40, 80], [80, 70], [110, 90], [140, 80], [150, 110], [150, 140], [135, 180], [128, 230], [120, 280], [105, 305], [85, 300], [65, 250], [45, 200], [20, 160]]) +
    hot('markhoehle', [[72, 315], [92, 302], [110, 308], [120, 420], [130, 560], [138, 600], [138, 690], [118, 702], [98, 690], [94, 600], [88, 520], [78, 420]], .15) +
    hot('kompakta', [[86, 690], [162, 690], [164, 712], [158, 730], [150, 760], [146, 820], [132, 872], [124, 840], [116, 780], [110, 735], [90, 725], [85, 708]], .15) +
    hot('periost', [[76, 768], [95, 748], [112, 724], [118, 760], [122, 810], [130, 862], [110, 835], [92, 800]], .2) +
    hot('metaphyse', off([[110, 205], [400, 205], [385, 300], [138, 300]], RX, RY), .1) +
    hotc('foramen_nutr', RX + 340, RY + 490, 20),
    'Röhrenknochen');

  // Osteon-Block, verkleinerter Röhrenknochen (Gefäßversorgung) bei (590, 0), Knochenumbau darunter bei (0, 580)
  const KO = .5357, UY = 580;
  const knochenO = () => imgw(900, 1015, [['knochen-osteon.webp', 0, 0, 560, 539], ['knochen-roehre.webp', 590, 0, 300, 546], ['knochen-umbau.webp', 0, UY, 900, 435]],
    hot('osteon', [[118, 40], [150, 10], [210, 0], [265, 10], [300, 40], [305, 90], [300, 175], [270, 195], [215, 205], [160, 195], [125, 175], [115, 100]]) +
    hotl('a_nutricia', off([[452, 342], [425, 372], [405, 420], [388, 460], [365, 484], [340, 492], [300, 494], [272, 500]], 590, 0, KO)) +
    hote('osteoklast', 164, UY + 105, 44, 50) +
    hot('osteoblast', off([[400, 232], [440, 208], [480, 192], [520, 178], [560, 168], [600, 166], [642, 168], [644, 200], [600, 206], [560, 214], [520, 224], [480, 236], [440, 248], [404, 254]], 0, UY), .2) +
    hotes('osteozyt', [[746, UY + 237, 22], [614, UY + 288, 22], [522, UY + 315, 22], [744, UY + 375, 22], [846, UY + 318, 18]]),
    'Osteon und Knochenzellen');

  // Kollagen-Tripelhelix, Fibrillenbündel mit Kristallen bei (150, 30), Kristall vergrößert bei (725, 80)
  const knochenZ = () => imgw(940, 533, [['knochen-helix.webp', 0, 0, 130, 533], ['knochen-fibrille.webp', 150, 30, 560, 476], ['knochen-kristall.webp', 725, 80, 208, 373]],
    hots('kollagen1', [[[4, 6], [126, 0], [130, 528], [6, 533], [0, 270]], off([[15, 5], [60, 90], [110, 80], [200, 60], [300, 60], [375, 75], [400, 150], [445, 240], [420, 280], [330, 290], [290, 360], [240, 420], [200, 470], [120, 470], [40, 430], [10, 330], [20, 230], [30, 150]], 150, 30)], .15) +
    hot('hydroxylapatit', off([[0, 60], [50, 0], [205, 0], [258, 60], [258, 395], [190, 460], [50, 460], [0, 395]], 725, 80, .8), .1),
    'Knochenmatrix');

  MEDSVG.addMaps('knochen', [['knochen_s', 'Röhrenknochen', 3], ['knochen_o', 'Osteon & Knochenzellen', 4], ['knochen_z', 'Knochenmatrix', 4]], { knochen_s: knochenS, knochen_o: knochenO, knochen_z: knochenZ });

  /* ---------------- Gelenke ---------------- */
  // Kniegelenk frontal, rechts Gelenkschema bei (480, 150)
  const SX = 480, SY = 150;
  const gelenkeK = () => imgw(860, 1005, [['gelenk-knie.webp', 0, 0, 461, 1005], ['gelenk-schema.webp', SX, SY, 360, 708]],
    hotls('knorpel_g', [[[96, 536], [125, 524], [170, 516], [212, 528]], [[100, 580], [150, 577], [205, 574]]]) +
    hot('menisken', [[393, 546], [350, 551], [302, 560], [350, 569], [393, 574]], .15) +
    hot('menisken', [[81, 546], [124, 551], [172, 560], [124, 569], [81, 574]], .15) + // Gegenseite: eigene Gruppe, gleiche id (tippbar, Beschriftung nur einmal)
    hot('kreuzbaender', [[220, 500], [235, 478], [262, 470], [285, 483], [293, 510], [285, 540], [265, 558], [240, 555], [225, 530]]) +
    hotl('kapsel_g', off([[290, 164], [322, 200], [345, 255], [354, 322], [346, 400], [325, 455], [300, 494]], SX, SY)) +
    hotl('kapsel_g', off([[70, 164], [38, 200], [15, 255], [6, 322], [14, 400], [35, 455], [60, 494]], SX, SY)),
    'Kniegelenk im Frontalschnitt');

  // Wirbelsäule seitlich, Becken von vorn bei (230, 0), Lendenwirbel von oben bei (300, 500)
  const BX = 230, LX = 300, LY = 500;
  const gelenkeW = () => imgw(770, 1007, [['gelenk-wirbelsaeule.webp', 0, 0, 190, 1007], ['gelenk-becken.webp', BX, 0, 538, 444], ['gelenk-lw-oben.webp', LX, LY, 289, 286]],
    hot('wirbel', off([[70, 95], [75, 40], [110, 8], [150, 0], [195, 8], [228, 40], [232, 95], [250, 145], [289, 175], [250, 182], [225, 200], [170, 210], [158, 270], [145, 286], [132, 278], [128, 215], [110, 205], [85, 200], [60, 182], [0, 175], [40, 145], [70, 130]], LX, LY), .15) +
    hotes('facetten', [[LX + 89, LY + 177, 13, 28, 15], [LX + 203, LY + 177, 13, 28, -15]]) +
    hot('atlas_axis', [[120, 8], [150, 0], [178, 5], [188, 30], [186, 70], [160, 80], [130, 80], [112, 60], [118, 30]]) +
    hots('bandscheibe', [[[115, 693], [177, 694], [179, 712], [115, 712]], [[111, 746], [177, 748], [179, 772], [111, 769]], [[102, 780], [164, 798], [162, 822], [98, 798]]], .15) +
    hotl('isg', off([[200, 76], [180, 92], [166, 115], [160, 140], [161, 165], [167, 178]], BX, 0)) +
    hotl('isg', off([[338, 76], [358, 92], [372, 115], [378, 140], [377, 165], [371, 178]], BX, 0)),
    'Wirbelsäule und Becken');

  // Gelenkschema, Bandscheibe von oben bei (400, 140)
  const DX = 400, DY = 140;
  const gelenkeF = () => imgw(812, 708, [['gelenk-schema.webp', 0, 0, 360, 708], ['gelenk-bandscheibe.webp', DX, DY, 412, 421]],
    hot('synovia', [[42, 280], [58, 272], [72, 300], [95, 340], [150, 350], [200, 352], [250, 348], [292, 320], [306, 262], [324, 280], [332, 330], [326, 385], [312, 405], [300, 400], [285, 375], [240, 372], [200, 370], [150, 372], [100, 374], [80, 392], [58, 405], [44, 385], [38, 330]], .15) +
    hotring('faserknorpel', off([[5, 180], [30, 90], [100, 25], [200, 0], [300, 15], [370, 60], [408, 140], [410, 300], [380, 370], [300, 410], [200, 420], [100, 405], [30, 360], [2, 280]], DX, DY),
      off([[130, 170], [150, 135], [200, 115], [260, 110], [290, 125], [320, 170], [335, 230], [330, 290], [300, 305], [270, 290], [230, 265], [190, 255], [150, 245], [130, 215]], DX, DY)),
    'Gelenkspalt und Bandscheibe');

  MEDSVG.addMaps('gelenke', [['gelenke_k', 'Kniegelenk', 3], ['gelenke_w', 'Wirbelsäule & Becken', 3], ['gelenke_f', 'Gelenkspalt & Bandscheibe', 4], ['gelenke4', 'Knorpel & Bänder · Schema', 4]], { gelenke_k: gelenkeK, gelenke_w: gelenkeW, gelenke_f: gelenkeF });

  /* ---------------- Muskeln ---------------- */
  // Muskulatur von vorn, Brustkorb mit Zwerchfell bei (430, 240)
  const ZX = 430, ZY = 240;
  const muskelnK = () => imgw(806, 1028, [['muskel-koerper.webp', 0, 0, 392, 1028], ['muskel-zwerchfell.webp', ZX, ZY, 376, 529]],
    hot('bizeps', [[300, 258], [324, 268], [337, 310], [330, 360], [316, 392], [298, 385], [290, 340], [292, 290]]) +
    hot('bizeps', [[92, 258], [68, 268], [55, 310], [62, 360], [76, 392], [94, 385], [102, 340], [100, 290]]) +
    hot('quadrizeps', [[125, 580], [160, 560], [190, 575], [192, 640], [185, 700], [175, 740], [145, 745], [130, 700], [120, 640]]) +
    hot('quadrizeps', [[267, 580], [232, 560], [202, 575], [200, 640], [207, 700], [217, 740], [247, 745], [262, 700], [272, 640]]) +
    hotl('zwerchfell_m', off([[12, 485], [30, 420], [50, 376], [100, 343], [150, 330], [200, 327], [250, 330], [309, 351], [351, 393], [363, 476]], ZX, ZY)),
    'Muskulatur von vorn');

  // Skelettmuskel mit Sehne am Knochen, darunter glatte Muskelzelle (20, 680) und Herzmuskelzellen (520, 650)
  const muskelnG = () => imgw(900, 850, [['muskel-aufbau.webp', 0, 0, 900, 632], ['muskel-glatt.webp', 20, 680, 480, 81], ['herz-myozyten.webp', 520, 650, 380, 192]],
    hot('skelettmuskel', [[100, 120], [240, 110], [360, 108], [450, 125], [500, 200], [505, 300], [530, 380], [560, 420], [555, 490], [500, 500], [440, 470], [380, 430], [300, 420], [260, 370], [230, 280], [170, 230], [110, 190]], .2) +
    hot('sehne', [[45, 110], [80, 100], [130, 110], [180, 125], [230, 140], [235, 170], [200, 180], [150, 165], [100, 160], [60, 160]], .2) +
    hotl('faszie', [[250, 250], [262, 180], [300, 130], [360, 110], [430, 115], [480, 155], [503, 230], [500, 300], [480, 350]]) +
    hot('glatte_m', off([[2, 58], [60, 45], [130, 22], [200, 4], [260, 6], [330, 18], [400, 28], [476, 38], [420, 48], [350, 60], [280, 74], [200, 80], [120, 76], [40, 68]], 20, 680), .2) +
    rect('herzmuskel', 520, 650, 380, 192),
    'Muskelgewebe');

  // Sarkomer, dünnes Filament (20, 195), Querbrücken (130, 325), Muskelfaser mit SR und T-Tubuli (200, 540)
  const FX = 20, FY = 195, QX = 130, QY = 325, MX = 200, MY = 540;
  const muskelnF = () => imgw(900, 1064, [['muskel-sarkomer.webp', 0, 0, 900, 170], ['muskel-filament.webp', FX, FY, 860, 103], ['muskel-querbruecke.webp', QX, QY, 640, 189], ['muskel-faser.webp', MX, MY, 500, 524]],
    hot('sarkomer', [[256, 2], [646, 2], [646, 168], [256, 168]], .05) +
    hotes('troponin', [[62, 18], [186, 25], [349, 20], [506, 25], [688, 18], [817, 18], [57, 80], [182, 68], [354, 71], [521, 87], [688, 79], [822, 77]].map(([x, y]) => [FX + x, FY + y, 24, 14])) +
    hot('aktin_myosin', off([[4, 6], [636, 4], [638, 62], [520, 92], [505, 160], [470, 189], [100, 189], [4, 150]], QX, QY), .1) +
    hot('sr', off([[150, 240], [160, 200], [180, 190], [215, 215], [245, 225], [290, 240], [330, 255], [370, 300], [400, 340], [430, 370], [450, 410], [440, 455], [400, 470], [360, 450], [340, 500], [300, 520], [255, 500], [230, 450], [200, 420], [165, 385], [140, 340], [135, 290]], MX, MY), .2) +
    hotls('ttubuli', [off([[162, 365], [172, 310], [195, 257], [225, 230], [270, 235], [320, 257]], MX, MY), off([[227, 440], [235, 410], [242, 385], [257, 355], [280, 325], [320, 315], [355, 322], [385, 337]], MX, MY)]),
    'Sarkomer und Muskelfaser');

  MEDSVG.addMaps('muskeln', [['muskeln_k', 'Muskulatur', 3], ['muskeln_g', 'Muskelgewebe', 3], ['muskeln_f', 'Sarkomer & Muskelfaser', 4], ['muskeln4', 'Fasertypen & Spindel · Schema', 4]], { muskeln_k: muskelnK, muskeln_g: muskelnG, muskeln_f: muskelnF });
})();
