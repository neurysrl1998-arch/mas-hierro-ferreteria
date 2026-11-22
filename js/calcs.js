/* Más Hierro · motor de calculadoras.
   Cada calculadora define sus campos y una función compute(v) que devuelve:
   { big, unit, rows: [[etiqueta, valor]], lines: [{ n, q, u }], note, title }
   Las páginas con <div class="calc-mount" data-calc="id"> se montan solas. */
(function () {
  'use strict';
  function fmt(n, d) { return Number(n).toLocaleString('es-DO', { maximumFractionDigits: d == null ? 1 : d }); }
  function up(x) { return Math.ceil(x - 1e-9); }
  function pl(n, s, p) { return n === 1 ? s : p; }
  function L(n, q, u) { return { n: n, q: q, u: u || '' }; }

  var BAR = { // kg/m, diámetro (m)
    '1/4': { kg: 0.25, d: 0.00635 }, '3/8': { kg: 0.56, d: 0.009525 }, '1/2': { kg: 0.994, d: 0.0127 },
    '5/8': { kg: 1.552, d: 0.015875 }, '3/4': { kg: 2.235, d: 0.01905 }
  };
  var QQ = 45.36, BAR_LEN = 6;
  function barMeters(len, dia) { // metros de varilla para una barra de longitud len, con traslapes
    var lap = 40 * BAR[dia].d;
    var pieces = Math.max(1, up(len / BAR_LEN));
    return len + lap * (pieces - 1);
  }
  function buyGallons(gal) {
    var cub = Math.floor(gal / 5), rest = gal % 5;
    return gal === 0 ? '—' : [cub ? cub + pl(cub, ' cubeta', ' cubetas') : '', rest ? rest + pl(rest, ' galón', ' galones') : ''].filter(Boolean).join(' + ');
  }
  function gallonLines(name, gal) {
    var out = [], cub = Math.floor(gal / 5), rest = gal % 5;
    if (cub) out.push(L(name + ' (cubeta 5 gal)', cub, pl(cub, 'cubeta', 'cubetas')));
    if (rest) out.push(L(name + ' (galón)', rest, pl(rest, 'galón', 'galones')));
    return out;
  }

  var N = function (id, label, value, opt) { opt = opt || {}; return { id: id, label: label, type: 'number', value: value, step: opt.step || 0.1, min: opt.min == null ? 0 : opt.min, max: opt.max, unit: opt.unit, full: opt.full }; };
  var S = function (id, label, options, value, opt) { opt = opt || {}; return { id: id, label: label, type: 'select', options: options, value: value, full: opt.full }; };

  var DEFS = {
    pintura: {
      title: 'Pintura',
      fields: [N('w', 'Ancho de la pared', 6, { unit: 'm' }), N('h', 'Alto de la pared', 2.6, { unit: 'm' }), N('n', 'Paredes iguales', 4, { step: 1, min: 1 }),
        S('c', 'Manos de pintura', [['1', '1 mano'], ['2', '2 manos'], ['3', '3 manos']], '2'),
        N('o', 'Puertas y ventanas a descontar', 4, { unit: 'm²' }),
        S('s', 'Superficie', [['35', 'Lisa (repellada y pintada)'], ['28', 'Rugosa o sin pintar'], ['22', 'Bloque sin repello']], '35')],
      compute: function (v) {
        var area = Math.max(0, v.w * v.h * Math.max(1, Math.round(v.n)) - v.o);
        var r = +v.s, coats = +v.c, gal = up(area * coats / r);
        var seal = r < 35 ? up(area / 30) : 0;
        var lines = gallonLines('Pintura acrílica', gal);
        if (seal) lines.push(L('Sellador acrílico', seal, pl(seal, 'galón', 'galones')));
        return { big: gal, unit: pl(gal, 'galón', 'galones'), title: 'Pintura para ' + fmt(area) + ' m²',
          rows: [['Área a pintar', fmt(area) + ' m²'], ['Rendimiento', r + ' m² por galón'], ['Manos', coats], ['Compra sugerida', buyGallons(gal)]],
          lines: lines, note: 'Cubeta = 5 galones. El rendimiento real depende de la marca y de la superficie.' };
      }
    },
    impermeabilizante: {
      title: 'Impermeabilizante',
      fields: [N('l', 'Largo del techo', 10, { unit: 'm' }), N('a', 'Ancho del techo', 8, { unit: 'm' }),
        S('t', 'Tipo', [['4', 'Acrílico elastomérico'], ['3', 'Acrílico fibratado']], '4'),
        S('c', 'Manos', [['2', '2 manos'], ['3', '3 manos']], '2'),
        S('m', 'Malla de refuerzo', [['bordes', 'Solo bordes, desagües y grietas'], ['todo', 'Todo el techo'], ['no', 'Sin malla']], 'bordes'),
        N('g', 'Metros de grietas a reforzar', 6, { unit: 'm' })],
      compute: function (v) {
        var area = v.l * v.a, gal = up(area * +v.c / +v.t), seal = up(area / 12);
        var malla = v.m === 'todo' ? area * 1.1 : v.m === 'bordes' ? (2 * (v.l + v.a) + v.g) * 0.2 : 0;
        var rolls = malla ? up(malla / 50) : 0;
        var lines = gallonLines('Impermeabilizante ' + (v.t === '4' ? 'acrílico' : 'fibratado'), gal);
        lines.push(L('Sellador para techos', seal, pl(seal, 'galón', 'galones')));
        if (rolls) lines.push(L('Malla de poliéster (rollo 1 × 50 m)', rolls, pl(rolls, 'rollo', 'rollos')));
        lines.push(L('Rodillo de felpa gruesa 9"', 1, 'ud'), L('Cepillo de cerdas duras', 1, 'ud'));
        return { big: gal, unit: pl(gal, 'galón', 'galones'), title: 'Impermeabilizante para ' + fmt(area) + ' m²',
          rows: [['Área del techo', fmt(area) + ' m²'], ['Compra sugerida', buyGallons(gal)], ['Sellador', seal + ' gal'], ['Malla', rolls ? fmt(malla) + ' m² · ' + rolls + pl(rolls, ' rollo', ' rollos') : 'No']],
          lines: lines, note: 'Rendimiento por mano: ' + v.t + ' m² por galón. Aplica con el techo limpio y seco.' };
      }
    },
    concreto: {
      title: 'Concreto',
      fields: [N('l', 'Largo', 4, { unit: 'm' }), N('a', 'Ancho', 3, { unit: 'm' }), N('e', 'Espesor', 10, { step: 1, unit: 'cm' }),
        S('r', 'Resistencia', [['210', '210 kg/cm² · losas y columnas (1:2:3)'], ['175', '175 kg/cm² · pisos y zapatas (1:2:4)'], ['140', '140 kg/cm² · firmes y aceras (1:3:5)']], '175', { full: true }),
        N('w', 'Desperdicio', 5, { step: 1, unit: '%' })],
      compute: function (v) {
        var mix = { '210': [8.5, 0.55, 0.80, 200], '175': [7.2, 0.55, 0.85, 190], '140': [5.8, 0.60, 0.90, 180] }[v.r];
        var vol = v.l * v.a * v.e / 100, w = 1 + v.w / 100, bags = up(vol * mix[0] * w);
        return { big: bags, unit: pl(bags, 'funda de cemento', 'fundas de cemento'), title: 'Concreto ' + v.r + ' kg/cm² · ' + fmt(vol, 2) + ' m³',
          rows: [['Volumen', fmt(vol, 2) + ' m³'], ['Arena', fmt(vol * mix[1] * w, 2) + ' m³'], ['Grava', fmt(vol * mix[2] * w, 2) + ' m³'], ['Agua', fmt(vol * mix[3] * w, 0) + ' L']],
          lines: [L('Cemento gris 42.5 kg', bags, 'fundas'), L('Arena lavada', fmt(vol * mix[1] * w, 2), 'm³'), L('Grava', fmt(vol * mix[2] * w, 2), 'm³')],
          note: 'Dosificación orientativa con fundas de 42.5 kg. Para estructuras, sigue el diseño de tu ingeniero.' };
      }
    },
    losa: {
      title: 'Losa',
      fields: [N('l', 'Largo de la losa', 6, { unit: 'm' }), N('a', 'Ancho de la losa', 5, { unit: 'm' }), N('e', 'Espesor', 12, { step: 1, unit: 'cm' }),
        S('d', 'Varilla', [['3/8', '3/8"'], ['1/2', '1/2"']], '3/8'), N('s', 'Separación', 20, { step: 1, unit: 'cm' }),
        S('m', 'Malla de acero', [['1', 'Sencilla (una cama)'], ['2', 'Doble (dos camas)']], '1')],
      compute: function (v) {
        var sep = Math.max(5, v.s) / 100;
        var nx = Math.floor(v.a / sep) + 1, ny = Math.floor(v.l / sep) + 1;
        var meters = (nx * barMeters(v.l + 0.3, v.d) + ny * barMeters(v.a + 0.3, v.d)) * +v.m;
        var bars = up(meters / BAR_LEN * 1.03), kg = meters * BAR[v.d].kg, wire = kg * 0.015 * 2.2046;
        var vol = v.l * v.a * v.e / 100 * 1.05, bags = up(vol * 8.5);
        return { big: bars, unit: 'varillas de ' + v.d + '"', title: 'Losa de ' + fmt(v.l) + ' × ' + fmt(v.a) + ' m',
          rows: [['Acero', fmt(kg, 0) + ' kg · ' + fmt(kg / QQ, 1) + ' qq'], ['Varillas por dirección', nx + ' + ' + ny + (v.m === '2' ? ' (×2 camas)' : '')], ['Concreto', fmt(vol, 2) + ' m³'], ['Cemento', bags + ' fundas']],
          lines: [L('Varilla corrugada ' + v.d + '" × 6 m', bars, 'ud'), L('Alambre de amarre', up(wire), 'lb'), L('Cemento gris 42.5 kg', bags, 'fundas'), L('Arena lavada', fmt(vol * 0.55, 2), 'm³'), L('Grava', fmt(vol * 0.8, 2), 'm³')],
          note: 'Orientativo: concreto 210 kg/cm² con 5 % de desperdicio. El diseño de la losa lo define tu ingeniero.' };
      }
    },
    varillas: {
      title: 'Varillas',
      fields: [N('n', 'Número de columnas o vigas', 6, { step: 1, min: 1 }), N('l', 'Longitud de cada una', 3, { unit: 'm' }),
        N('b', 'Varillas longitudinales por elemento', 4, { step: 1, min: 1 }), S('d', 'Diámetro longitudinal', [['3/8', '3/8"'], ['1/2', '1/2"'], ['5/8', '5/8"'], ['3/4', '3/4"']], '1/2'),
        N('sa', 'Sección: lado A', 20, { step: 1, unit: 'cm' }), N('sb', 'Sección: lado B', 20, { step: 1, unit: 'cm' }),
        S('ed', 'Estribos', [['1/4', '1/4"'], ['3/8', '3/8"'], ['0', 'Sin estribos']], '3/8'), N('es', 'Separación de estribos', 15, { step: 1, unit: 'cm' })],
      compute: function (v) {
        var n = Math.max(1, Math.round(v.n)), lm = n * Math.round(v.b) * (barMeters(v.l, v.d) + 0.3);
        var lb = up(lm / BAR_LEN * 1.03), kg = lm * BAR[v.d].kg;
        var rows = [['Varilla longitudinal', fmt(lm, 0) + ' m · ' + lb + ' varillas']], lines = [L('Varilla corrugada ' + v.d + '" × 6 m', lb, 'ud')];
        if (v.ed !== '0') {
          var rec = 0.025, per = 2 * ((v.sa / 100 - 2 * rec) + (v.sb / 100 - 2 * rec)) + 0.2;
          var cnt = n * (Math.floor(v.l * 100 / Math.max(5, v.es)) + 1), em = cnt * per, eb = up(em / BAR_LEN * 1.05);
          kg += em * BAR[v.ed].kg;
          rows.push(['Estribos', cnt + ' de ' + fmt(per * 100, 0) + ' cm · ' + eb + ' varillas']);
          lines.push(L('Varilla ' + v.ed + '" × 6 m para estribos', eb, 'ud'));
        }
        rows.push(['Peso total', fmt(kg, 0) + ' kg'], ['Quintales', fmt(kg / QQ, 1) + ' qq']);
        lines.push(L('Alambre de amarre', up(kg * 0.015 * 2.2046), 'lb'));
        return { big: lb, unit: 'varillas de ' + v.d + '"', title: n + ' elementos de ' + fmt(v.l) + ' m', rows: rows, lines: lines,
          note: 'Varillas de 6 m con traslape de 40 diámetros. Verifica diámetros y separaciones con tu plano.' };
      }
    },
    bloques: {
      title: 'Bloques',
      fields: [N('l', 'Largo del muro', 8, { unit: 'm' }), N('h', 'Alto del muro', 2.8, { unit: 'm' }), N('o', 'Vanos a descontar', 2, { unit: 'm²' }),
        S('s', 'Tipo de bloque', [['4', 'Bloque de 4"'], ['6', 'Bloque de 6"'], ['8', 'Bloque de 8"']], '6'), N('w', 'Desperdicio', 5, { step: 1, unit: '%' })],
      compute: function (v) {
        var area = Math.max(0, v.l * v.h - v.o), w = 1 + v.w / 100, blocks = up(area * 12.5 * w);
        var mort = area * { '4': 0.009, '6': 0.012, '8': 0.016 }[v.s], bags = up(mort * 8.5);
        return { big: blocks, unit: 'bloques de ' + v.s + '"', title: 'Muro de ' + fmt(area) + ' m²',
          rows: [['Área del muro', fmt(area) + ' m²'], ['Mortero', fmt(mort, 2) + ' m³'], ['Cemento para mortero', bags + pl(bags, ' funda', ' fundas')], ['Arena', fmt(mort * 1.1, 2) + ' m³']],
          lines: [L('Bloque de ' + v.s + '"', blocks, 'ud'), L('Cemento gris 42.5 kg', bags, 'fundas'), L('Arena', fmt(mort * 1.1, 2), 'm³')],
          note: '12.5 bloques por m² (40 × 20 cm con junta de 1 cm). Mortero 1:4.' };
      }
    },
    panete: {
      title: 'Pañete',
      fields: [N('l', 'Largo de la pared', 10, { unit: 'm' }), N('h', 'Alto de la pared', 2.6, { unit: 'm' }),
        S('k', 'Caras a pañetar', [['1', 'Una cara'], ['2', 'Las dos caras']], '2'), N('e', 'Espesor', 1.5, { unit: 'cm' }),
        S('p', 'Proporción', [['3', '1:3 · exteriores y zonas húmedas'], ['4', '1:4 · interiores'], ['5', '1:5 · repello fino']], '4'), N('w', 'Desperdicio', 10, { step: 1, unit: '%' })],
      compute: function (v) {
        var area = v.l * v.h * +v.k, vol = area * v.e / 100 * (1 + v.w / 100);
        var m = { '3': [10.4, 1.0], '4': [8.2, 1.05], '5': [6.8, 1.1] }[v.p], bags = up(vol * m[0]);
        return { big: bags, unit: pl(bags, 'funda de cemento', 'fundas de cemento'), title: 'Pañete de ' + fmt(area) + ' m²',
          rows: [['Área', fmt(area) + ' m²'], ['Mortero', fmt(vol, 2) + ' m³'], ['Arena fina', fmt(vol * m[1], 2) + ' m³'], ['Agua aprox.', fmt(vol * 250, 0) + ' L']],
          lines: [L('Cemento gris 42.5 kg', bags, 'fundas'), L('Arena fina', fmt(vol * m[1], 2), 'm³')],
          note: 'Mortero 1:' + v.p + ' de ' + fmt(v.e) + ' cm de espesor.' };
      }
    },
    ceramica: {
      title: 'Cerámica',
      fields: [N('l', 'Largo del área', 5, { unit: 'm' }), N('a', 'Ancho del área', 4, { unit: 'm' }), N('b', 'm² por caja', 1.44, { step: 0.01 }),
        S('w', 'Colocación', [['10', 'Recta (10 % desperdicio)'], ['15', 'Diagonal (15 % desperdicio)']], '10')],
      compute: function (v) {
        var area = v.l * v.a, w = 1 + v.w / 100, per = v.b || 1.44, boxes = up(area * w / per), glue = up(area * 5 / 20), grout = up(area * 0.4 / 2);
        return { big: boxes, unit: pl(boxes, 'caja', 'cajas'), title: 'Cerámica para ' + fmt(area) + ' m²',
          rows: [['Área', fmt(area) + ' m²'], ['Con desperdicio', fmt(area * w) + ' m²'], ['Total en cajas', fmt(boxes * per, 2) + ' m²'], ['Pegamento', glue + ' sacos de 20 kg']],
          lines: [L('Cerámica (caja de ' + fmt(per, 2) + ' m²)', boxes, 'cajas'), L('Pegamento para cerámica 20 kg', glue, 'sacos'), L('Boquilla 2 kg', grout, 'bolsas'), L('Crucetas', up(area / 10), 'bolsas')],
          note: 'Pegamento a 5 kg por m² y boquilla a 0.4 kg por m².' };
      }
    },
    zinc: {
      title: 'Techo de zinc',
      fields: [N('a', 'Ancho del techo (a lo largo)', 8, { unit: 'm' }), N('c', 'Caída de cada agua', 4, { unit: 'm' }),
        S('g', 'Aguas', [['1', 'Una agua'], ['2', 'Dos aguas']], '2'),
        S('p', 'Largo de la lámina', [['1.83', '6 pies (1.83 m)'], ['2.44', '8 pies (2.44 m)'], ['3.05', '10 pies (3.05 m)'], ['3.66', '12 pies (3.66 m)']], '3.66'),
        S('k', 'Calibre', [['26', 'Calibre 26'], ['28', 'Calibre 28']], '26'), N('s', 'Separación de correas', 1, { unit: 'm' })],
      compute: function (v) {
        var Lm = +v.p, lap = 0.15, cols = up(v.a / 0.76), rows = v.c <= Lm ? 1 : up((v.c - lap) / (Lm - lap)), g = +v.g;
        var sheets = cols * rows * g, ridge = g === 2 ? up(v.a / 0.65) : 0, screws = sheets * 8 + ridge * 4;
        var purl = (up(v.c / Math.max(0.5, v.s)) + 1) * g * v.a, purlPieces = up(purl / 6);
        var lines = [L('Lámina de zinc ondulado cal. ' + v.k + ' × ' + (Lm * 3.281).toFixed(0) + ' pies', sheets, 'ud')];
        if (ridge) lines.push(L('Caballete de zinc', ridge, 'ud'));
        lines.push(L('Tornillo autorroscante con arandela', screws, 'ud'), L('Correa metálica × 6 m', purlPieces, 'ud'));
        return { big: sheets, unit: pl(sheets, 'lámina', 'láminas'), title: 'Techo de zinc ' + fmt(v.a) + ' × ' + fmt(v.c) + ' m (' + g + pl(g, ' agua', ' aguas') + ')',
          rows: [['Láminas por agua', cols + ' columnas × ' + rows + pl(rows, ' fila', ' filas')], ['Caballetes', ridge || '—'], ['Tornillos', screws], ['Correas', fmt(purl, 0) + ' m · ' + purlPieces + ' piezas']],
          lines: lines, note: 'Ancho útil de 76 cm por lámina y 15 cm de traslape entre filas.' };
      }
    },
    verjas: {
      title: 'Verjas',
      fields: [N('p', 'Perímetro a cercar', 60, { unit: 'm' }), N('g', 'Ancho de portones', 3, { unit: 'm' }),
        S('h', 'Altura', [['1.5', '1.50 m'], ['1.8', '1.80 m'], ['2', '2.00 m'], ['2.4', '2.40 m']], '1.8'),
        S('r', 'Rollo de malla', [['10', '10 m'], ['15', '15 m'], ['20', '20 m']], '15'),
        N('s', 'Separación de postes', 2.5, { unit: 'm' }), N('e', 'Esquinas', 4, { step: 1 }),
        S('b', 'Líneas de alambre de púas', [['0', 'Sin púas'], ['1', '1 línea'], ['2', '2 líneas'], ['3', '3 líneas']], '2')],
      compute: function (v) {
        var len = Math.max(0, v.p - v.g), rolls = up(len * 1.03 / +v.r);
        var posts = up(len / Math.max(1, v.s)) + 1 + Math.round(v.e), postLen = +v.h + 0.5 + (+v.b ? 0.3 : 0);
        var perTube = Math.max(1, Math.floor(6 / postLen)), tubes = up(posts / perTube), rail = up(len / 6 * 1.02);
        var barb = +v.b ? up(len * +v.b / 200) : 0, bags = up(posts * 0.054 * 7);
        var lines = [L('Malla ciclón ' + v.h + ' m (rollo de ' + v.r + ' m)', rolls, 'rollos'), L('Tubo galvanizado para postes × 6 m', tubes, 'ud'), L('Tubo galvanizado superior × 6 m', rail, 'ud'), L('Alambre galvanizado para tensar', up(len * 1.05), 'm')];
        if (barb) lines.push(L('Alambre de púas (rollo de 200 m)', barb, 'rollos'));
        lines.push(L('Cemento gris 42.5 kg', bags, 'fundas'), L('Amarres para malla', up(len / 0.6 * 3 / 100), 'paquetes de 100'));
        return { big: rolls, unit: pl(rolls, 'rollo de malla', 'rollos de malla'), title: 'Verja de ' + fmt(len) + ' m × ' + v.h + ' m',
          rows: [['Longitud a cercar', fmt(len) + ' m'], ['Postes', posts + ' de ' + fmt(postLen, 2) + ' m'], ['Tubos de 6 m', tubes + ' postes + ' + rail + ' superior'], ['Concreto', bags + ' fundas']],
          lines: lines, note: 'Postes enterrados 50 cm en hoyos de 30 × 30 × 60 cm.' };
      }
    },
    pvc: {
      title: 'Cemento PVC',
      fields: [S('d', 'Diámetro de la tubería', [['300', '1/2"'], ['200', '3/4"'], ['125', '1"'], ['90', '1-1/2"'], ['60', '2"'], ['40', '3"'], ['30', '4"'], ['10', '6"']], '300'),
        N('u', 'Número de uniones', 40, { step: 1, min: 1 }),
        S('t', 'Tipo de línea', [['fria', 'Agua potable fría'], ['presion', 'Presión (bomba, cisterna)'], ['humeda', 'Línea húmeda o con agua'], ['caliente', 'Agua caliente (CPVC)'], ['drenaje', 'Drenaje y sanitario']], 'fria', { full: true })],
      compute: function (v) {
        var dLabel = { '300': '1/2"', '200': '3/4"', '125': '1"', '90': '1-1/2"', '60': '2"', '40': '3"', '30': '4"', '10': '6"' }[v.d];
        var ml = Math.round(v.u / +v.d * 946 * 1.15), cl = Math.round(ml * 0.8);
        var prod = { fria: 'Lanco Super PVC Cement', presion: 'Lanco Super PVC Cement', humeda: 'Lanco Wet-Dry', caliente: 'Cemento Lanco para CPVC', drenaje: 'Lanco Super PVC Cement' }[v.t];
        function pack(need) {
          var sizes = [[118, '1/32 gal'], [237, '1/16 gal'], [473, '1/8 gal'], [946, '1/4 gal']], out = [];
          var q = Math.floor(need / 946), rest = need - q * 946;
          if (q) out.push([q, '1/4 gal']);
          if (rest > 0) { for (var i = 0; i < sizes.length; i++) if (sizes[i][0] >= rest) { out.push([1, sizes[i][1]]); break; } }
          return out;
        }
        var pc = pack(ml), pk = pack(cl), n = pc.reduce(function (s, x) { return s + x[0]; }, 0);
        var lines = pc.map(function (x) { return L(prod + ' ' + x[1], x[0], 'ud'); }).concat(pk.map(function (x) { return L('Lanco PVC Cleaner ' + x[1], x[0], 'ud'); }));
        return { big: n, unit: pl(n, 'envase de cemento', 'envases de cemento'), title: 'Cemento PVC para ' + v.u + ' uniones de ' + dLabel,
          rows: [['Producto', prod], ['Cemento necesario', ml + ' ml'], ['Limpiador necesario', cl + ' ml'], ['Envases', pc.map(function (x) { return x[0] + ' × ' + x[1]; }).join(' + ')]],
          lines: lines, note: 'Rendimiento aproximado: ' + v.d + ' uniones de ' + dLabel + ' por cada 1/4 de galón. Confirma en tienda las presentaciones disponibles.',
          extra: { diam: dLabel, type: v.t, prod: prod } };
      }
    },
    cable: {
      title: 'Calibre de cable',
      fields: [S('m', 'Conozco la carga en', [['a', 'Amperios (A)'], ['w', 'Vatios (W)']], 'w'), N('x', 'Carga', 1800, { step: 1 }),
        S('v', 'Voltaje', [['120', '120 V'], ['240', '240 V']], '120'), N('l', 'Distancia del panel a la carga', 25, { unit: 'm' }),
        S('c', 'Uso', [['1', 'Continuo (más de 3 h seguidas)'], ['0', 'Intermitente']], '1'), S('vd', 'Caída de tensión máxima', [['3', '3 % (recomendado)'], ['5', '5 %']], '3')],
      compute: function (v) {
        var V = +v.v, I = v.m === 'w' ? v.x / V : v.x, Ireq = +v.c ? I * 1.25 : I;
        var T = [['14', 20, 15, 8.28], ['12', 25, 20, 5.21], ['10', 35, 30, 3.28], ['8', 50, 50, 2.06], ['6', 65, 60, 1.30], ['4', 85, 80, 0.815], ['2', 115, 110, 0.513], ['1/0', 150, 150, 0.323], ['2/0', 175, 175, 0.256]];
        var STD = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];
        var pick = null, drop = 0, brk = 0;
        for (var i = 0; i < T.length; i++) {
          var vd = 2 * v.l * I * T[i][3] / 1000 / V * 100;
          var b = STD.filter(function (s) { return s >= Ireq; })[0];
          if (T[i][1] >= Ireq && b && b <= T[i][2] && vd <= +v.vd) { pick = T[i]; drop = vd; brk = b; break; }
        }
        if (!pick) return { big: '—', unit: 'fuera de rango', title: 'Circuito', rows: [['Corriente', fmt(I, 1) + ' A']], lines: [], note: 'La carga o la distancia superan esta tabla. Consulta con un electricista para un diseño especial.', extra: { gauge: null, I: I, drop: 0 } };
        var gnd = { '14': '14', '12': '12', '10': '10', '8': '10', '6': '10', '4': '8', '2': '8', '1/0': '6', '2/0': '6' }[pick[0]];
        var m = up(v.l * 1.1), conduit = { '14': '1/2"', '12': '1/2"', '10': '1/2"', '8': '3/4"', '6': '3/4"', '4': '1"', '2': '1"', '1/0': '1-1/4"', '2/0': '1-1/4"' }[pick[0]];
        return { big: pick[0] + ' AWG', unit: 'cobre THHN', title: 'Circuito ' + V + ' V · ' + fmt(I, 1) + ' A · ' + fmt(v.l) + ' m',
          rows: [['Corriente de la carga', fmt(I, 1) + ' A'], ['Breaker', brk + ' A · ' + (V === 240 ? '2 polos' : '1 polo')], ['Caída de tensión', fmt(drop, 2) + ' %'], ['Capacidad del cable', pick[1] + ' A']],
          lines: [L('Cable THHN ' + pick[0] + ' AWG (' + (V === 240 ? '2 fases' : 'fase y neutro') + ')', m * 2, 'm'), L('Cable THHN ' + gnd + ' AWG verde (tierra)', m, 'm'), L('Breaker ' + brk + ' A ' + (V === 240 ? '2 polos' : '1 polo'), 1, 'ud'), L('Tubo conduit ' + conduit + ' × 3 m', up(v.l * 1.05 / 3), 'ud')],
          note: 'Cálculo orientativo con cobre THHN a 75 °C. Toda instalación debe hacerla o revisarla un electricista calificado.',
          extra: { gauge: pick[0], I: I, drop: drop, brk: brk, V: V, ok: drop <= +v.vd } };
      }
    }
  };

  /* Lista de materiales para un baño (configurador y proyectos) */
  function bano(o) {
    var fx = o.inodoro + o.lavamanos + o.ducha + o.banera + o.bidet;
    var hotFx = o.calentador ? o.lavamanos + o.ducha + o.banera + o.bidet : 0;
    var others = o.lavamanos + o.ducha + o.banera + o.bidet;
    var d = Math.max(0, o.distancia);
    var items = [];
    function add(n, q, u, g) { if (q > 0) items.push({ n: n, q: q, u: u || 'ud', g: g }); }
    add('Tubo PVC presión 1/2" × 6 m (agua fría)', up((d + 1.5 * fx) / 6), 'ud', 'fria');
    add('Codo PVC 1/2" × 90°', fx * 3 + 2, 'ud', 'fria');
    add('Tee PVC 1/2"', Math.max(1, fx), 'ud', 'fria');
    add('Adaptador macho PVC 1/2"', fx * 2, 'ud', 'fria');
    add('Llave de paso 1/2"', 1 + (o.calentador ? 1 : 0), 'ud', 'fria');
    if (o.calentador) {
      add('Tubo CPVC 1/2" × 6 m (agua caliente)', up((d + 1.5 * hotFx) / 6), 'ud', 'caliente');
      add('Codo CPVC 1/2" × 90°', hotFx * 3 + 2, 'ud', 'caliente');
      add('Tee CPVC 1/2"', Math.max(1, hotFx), 'ud', 'caliente');
      add('Adaptador macho CPVC 1/2"', hotFx * 2, 'ud', 'caliente');
    }
    add('Tubo PVC sanitario 4" × 6 m', o.inodoro ? up((d + 2 * o.inodoro) / 6) : 0, 'ud', 'drenaje');
    add('Codo PVC sanitario 4" × 90°', o.inodoro * 2, 'ud', 'drenaje');
    add('Yee PVC sanitaria 4"', o.inodoro ? 1 : 0, 'ud', 'drenaje');
    add('Tubo PVC drenaje 2" × 6 m', others ? up((d + 1.5 * others) / 6) : 0, 'ud', 'drenaje');
    add('Codo PVC drenaje 2" × 90°', others * 2, 'ud', 'drenaje');
    add('Yee PVC drenaje 2"', others, 'ud', 'drenaje');
    add('Desagüe de piso con rejilla', o.ducha + o.banera, 'ud', 'drenaje');
    add('Llave angular 1/2"', o.inodoro + o.lavamanos * (o.calentador ? 2 : 1) + o.bidet * (o.calentador ? 2 : 1), 'ud', 'acc');
    add('Manguera de abasto 1/2" × 16"', o.inodoro + o.lavamanos * (o.calentador ? 2 : 1) + o.bidet * (o.calentador ? 2 : 1), 'ud', 'acc');
    add('Cera para inodoro', o.inodoro, 'ud', 'acc');
    add('Juego de pernos para inodoro', o.inodoro, 'ud', 'acc');
    add('Sifón para lavamanos', o.lavamanos, 'ud', 'acc');
    add('Lanco Super PVC Cement 1/8 gal', fx ? 1 : 0, 'ud', 'acc');
    add('Lanco PVC Cleaner 1/8 gal', fx ? 1 : 0, 'ud', 'acc');
    if (o.calentador) add('Cemento Lanco para CPVC 1/8 gal', 1, 'ud', 'acc');
    add('Cinta de teflón', Math.max(1, up(fx / 2)), 'rollos', 'acc');
    return items;
  }

  /* ---------- Render ---------- */
  function mount(el, id) {
    var def = DEFS[id]; if (!def) return;
    var C = window.MHCommon || {};
    var fid = function (f) { return 'c-' + id + '-' + f.id; };
    var form = '<form class="tool-form" onsubmit="return false" novalidate>' + def.fields.map(function (f) {
      var ctrl = f.type === 'select'
        ? '<select id="' + fid(f) + '">' + f.options.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f.value ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
        : '<div class="inp-unit"><input id="' + fid(f) + '" type="number" inputmode="decimal" step="' + f.step + '" min="' + f.min + '"' + (f.max != null ? ' max="' + f.max + '"' : '') + ' value="' + f.value + '">' + (f.unit ? '<span>' + f.unit + '</span>' : '') + '</div>';
      return '<div class="field' + (f.full ? ' full' : '') + '"><label for="' + fid(f) + '">' + f.label + '</label>' + ctrl + '</div>';
    }).join('') + '</form>';
    el.innerHTML = '<div class="tool-grid">' + form +
      '<aside class="result tool-result" aria-live="polite"><span class="eyebrow">Necesitas aproximadamente</span>' +
      '<div class="big"><span class="rb"></span><small class="ru"></small></div><dl class="rrows"></dl>' +
      '<div class="rmat"><h3>Lista de materiales</h3><ul class="rlines"></ul></div><p class="note rnote"></p>' +
      '<div class="rbtns"><button class="btn btn-red radd" type="button">Agregar a mi cotización</button><button class="btn btn-ghost rcopy" type="button">Copiar lista</button></div></aside></div>';
    var last;
    function read() {
      var v = {};
      def.fields.forEach(function (f) {
        var x = document.getElementById(fid(f)).value;
        v[f.id] = f.type === 'number' ? (isFinite(parseFloat(x)) ? Math.max(f.min || 0, parseFloat(x)) : 0) : x;
      });
      return v;
    }
    function run() {
      var v = read(), r = def.compute(v); last = r;
      el.querySelector('.rb').textContent = typeof r.big === 'number' ? fmt(r.big, 0) : r.big;
      el.querySelector('.ru').textContent = r.unit;
      el.querySelector('.rrows').innerHTML = r.rows.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('');
      el.querySelector('.rlines').innerHTML = r.lines.map(function (x) { return '<li><b>' + x.q + '</b> <span>' + x.u + '</span> ' + x.n + '</li>'; }).join('') || '<li>Sin materiales para estas medidas.</li>';
      el.querySelector('.rnote').textContent = r.note || '';
      el.querySelector('.radd').disabled = !r.lines.length;
      window.MHCalc.last[id] = { v: v, r: r };
      document.dispatchEvent(new CustomEvent('mh:calc', { detail: { id: id, v: v, r: r } }));
    }
    function lineText(x) { return x.q + ' ' + x.u + ' — ' + x.n; }
    el.querySelector('form').addEventListener('input', run);
    el.querySelector('form').addEventListener('change', run);
    el.querySelector('.radd').addEventListener('click', function () { if (last && C.add) C.add(last.title, last.lines.map(lineText), id); });
    el.querySelector('.rcopy').addEventListener('click', function () { if (last && C.copy) C.copy(last.title + '\n' + last.lines.map(lineText).join('\n'), this); });
    run();
  }

  window.MHCalc = { defs: DEFS, mount: mount, bano: bano, fmt: fmt, up: up, last: {} };
  document.querySelectorAll('.calc-mount').forEach(function (el) { mount(el, el.getAttribute('data-calc')); });
})();
