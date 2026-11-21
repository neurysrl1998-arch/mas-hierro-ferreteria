/* Más Hierro · lógica de la página: selector de colores, fórmula de tinte, calculadoras, formulario */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n, d) { return n.toLocaleString('es-DO', { maximumFractionDigits: d == null ? 1 : d }); };

  /* ---------- Carta de colores ---------- */
  var FAMILIES = [
    { id: 'blancos', n: 'Blancos', c: [['Blanco Nieve', '#FAFAF7'], ['Blanco Hueso', '#F3EEE3'], ['Algodón', '#F6F4EE'], ['Marfil', '#F1E7CF'], ['Perla', '#ECEAE4'], ['Lino', '#E9E1D3'], ['Vainilla', '#F3E5BF'], ['Blanco Ostra', '#E8E3D6']] },
    { id: 'neutros', n: 'Neutros', c: [['Gris Niebla', '#D5D7D6'], ['Arena Gris', '#C9C1B1'], ['Piedra', '#B3AA9B'], ['Gris Cemento', '#A9ABA8'], ['Topo', '#8C7F72'], ['Gris Acero', '#6E7377'], ['Grafito', '#3E4246'], ['Carbón', '#26282B']] },
    { id: 'tierras', n: 'Tierras', c: [['Arena', '#D9C29A'], ['Café con Leche', '#A88364'], ['Caramelo', '#B9814B'], ['Ocre', '#C68B2C'], ['Terracota', '#B5573A'], ['Ladrillo', '#9A3F2C'], ['Barro', '#7E5640'], ['Chocolate', '#5C3A2A']] },
    { id: 'rojos', n: 'Rojos', c: [['Rosa Palo', '#E7C0B8'], ['Salmón', '#EE9C84'], ['Coral', '#E86A57'], ['Fresa', '#D9434E'], ['Rojo Hierro', '#C62A20'], ['Cereza', '#B3233A'], ['Carmesí', '#9E1B22'], ['Vino', '#6B1E2B']] },
    { id: 'azules', n: 'Azules', c: [['Celeste', '#C7E1EE'], ['Azul Cielo', '#9CC9E3'], ['Turquesa', '#2BA3A0'], ['Azul Caribe', '#1F8FB5'], ['Azul Acero', '#557A95'], ['Azul Rey', '#2449A0'], ['Índigo', '#33356E'], ['Azul Marino', '#1F2F4F']] },
    { id: 'verdes', n: 'Verdes', c: [['Verde Menta', '#BFE0C9'], ['Verde Agua', '#7FC8B6'], ['Verde Lima', '#A5C94A'], ['Verde Salvia', '#9CAE8F'], ['Esmeralda', '#1F8A5C'], ['Verde Oliva', '#6E7240'], ['Musgo', '#4F5F3A'], ['Verde Bosque', '#2F5A3B']] },
    { id: 'amarillos', n: 'Amarillos', c: [['Mantequilla', '#F4E3A1'], ['Limón', '#EFE07A'], ['Maíz', '#E9C46A'], ['Durazno', '#F3C29B'], ['Amarillo Sol', '#F2C230'], ['Mostaza', '#CF9F2B'], ['Mango', '#F0A33A'], ['Naranja', '#E2702B']] }
  ];
  FAMILIES.forEach(function (f, fi) {
    f.c = f.c.map(function (x, i) { return { name: x[0], hex: x[1], code: 'MH-' + (fi + 1) + String(i + 1).padStart(2, '0') }; });
  });

  /* Colorantes de la máquina (6, uno por cara del hexágono) */
  var COLORANTS = [
    { k: 'KX', n: 'Negro', hex: '#1b1b1b' },
    { k: 'R', n: 'Rojo óxido', hex: '#a63a24', h: 10 },
    { k: 'Y', n: 'Amarillo óxido', hex: '#d1a02e', h: 45 },
    { k: 'G', n: 'Verde ftalo', hex: '#1f7a4f', h: 150 },
    { k: 'B', n: 'Azul ftalo', hex: '#1f4fa0', h: 220 },
    { k: 'M', n: 'Magenta', hex: '#b0306a', h: 330 }
  ];
  window.MH = { COLORANTS: COLORANTS };

  function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; }); }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(function (v) { return Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'); }).join('').toUpperCase(); }
  function rgbToHsl(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    if (!s) return rgbToHex(l, l, l);
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return rgbToHex(f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3));
  }
  function lrv(hex) {
    var c = hexToRgb(hex).map(function (v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return Math.round((0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) * 100);
  }

  /* Fórmula ilustrativa: onzas e "Y" (1/48 oz) por galón sobre base blanca */
  function formula(hex, gallons) {
    var rgb = hexToRgb(hex), c = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    var chroma = c.s * (1 - Math.abs(2 * c.l - 1));
    var dark = Math.max(0, 0.93 - c.l);
    var out = {};
    if (chroma > 0.04) {
      var anchors = COLORANTS.filter(function (x) { return x.h != null; });
      var a = anchors[anchors.length - 1], b = anchors[0];
      for (var i = 0; i < anchors.length; i++) {
        var A = anchors[i], B = anchors[(i + 1) % anchors.length];
        var hA = A.h, hB = B.h <= A.h ? B.h + 360 : B.h, hh = c.h < hA ? c.h + 360 : c.h;
        if (hh >= hA && hh <= hB) { a = A; b = B; break; }
      }
      var span = ((b.h - a.h) + 360) % 360 || 360;
      var t = (((c.h - a.h) + 360) % 360) / span;
      var dose = chroma * 7 + dark * chroma * 5;
      out[a.k] = (out[a.k] || 0) + dose * (1 - t);
      out[b.k] = (out[b.k] || 0) + dose * t;
    }
    var blk = Math.pow(dark, 1.7) * 7.5 * (1 - chroma * 0.55);
    if (blk > 0.02) out.KX = blk;
    return COLORANTS.map(function (x, idx) {
      return { idx: idx, k: x.k, n: x.n, hex: x.hex, oz: (out[x.k] || 0) * gallons };
    }).filter(function (x) { return x.oz >= 1 / 48; });
  }
  function ozY(v) { var oz = Math.floor(v), y = Math.round((v - oz) * 48); if (y === 48) { oz++; y = 0; } return { oz: oz, y: y }; }

  /* ---------- Estado del preparador ---------- */
  var sel = { hex: '#C62A20', name: 'Rojo Hierro', code: 'MH-405', finish: 'Satinado', size: 'galon' };
  var famIdx = 3;
  window.MH.sel = sel;

  function emit(prepare) {
    var gal = sel.size === 'cubeta' ? 5 : 1;
    sel.formula = formula(sel.hex, gal);
    document.dispatchEvent(new CustomEvent('mh:color', { detail: sel }));
    renderSelection();
    if (prepare) document.dispatchEvent(new CustomEvent('mh:prepare'));
  }

  function renderFamilies() {
    var box = $('famTabs');
    if (!box) return;
    box.innerHTML = '';
    FAMILIES.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fam' + (i === famIdx ? ' on' : ''); b.textContent = f.n;
      b.setAttribute('aria-pressed', i === famIdx);
      b.addEventListener('click', function () { famIdx = i; renderFamilies(); renderSwatches(); });
      box.appendChild(b);
    });
  }
  function renderSwatches() {
    var box = $('swatches');
    box.innerHTML = '';
    FAMILIES[famIdx].c.forEach(function (col) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sw' + (col.hex === sel.hex ? ' on' : '');
      b.style.setProperty('--c', col.hex);
      b.title = col.name + ' · ' + col.code;
      b.setAttribute('aria-label', col.name + ', ' + col.code);
      b.innerHTML = '<span></span>';
      b.addEventListener('click', function () {
        sel.hex = col.hex; sel.name = col.name; sel.code = col.code;
        renderSwatches(); emit(true);
      });
      box.appendChild(b);
    });
  }
  function renderSelection() {
    var rgb = hexToRgb(sel.hex), hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    $('selChip').style.setProperty('--c', sel.hex);
    $('selName').textContent = sel.name;
    $('selCode').textContent = sel.code + ' · ' + sel.hex.toUpperCase();
    $('selLrv').textContent = lrv(sel.hex);
    $('customColor').value = sel.hex.toLowerCase();
    // combinaciones
    var harm = [
      { n: 'Tono claro', hex: hslToHex(hsl.h, hsl.s * 0.55, Math.min(0.93, hsl.l + (1 - hsl.l) * 0.6)) },
      { n: 'Tono oscuro', hex: hslToHex(hsl.h, Math.min(1, hsl.s * 0.9), hsl.l * 0.55) },
      { n: 'Contraste', hex: hslToHex(hsl.h + 180, Math.min(0.55, hsl.s * 0.7 + 0.1), hsl.l > 0.6 ? 0.38 : 0.82) },
      { n: 'Acompañante', hex: hslToHex(hsl.h + 30, hsl.s * 0.6, Math.min(0.9, hsl.l * 0.85 + 0.12)) }
    ];
    $('harmony').innerHTML = harm.map(function (h) {
      return '<button type="button" class="hm" data-hex="' + h.hex + '" style="--c:' + h.hex + '"><i></i><span>' + h.n + '<small>' + h.hex + '</small></span></button>';
    }).join('');
    // fórmula
    var f = sel.formula || [];
    $('formula').innerHTML = f.length ? f.map(function (x) {
      var v = ozY(x.oz);
      return '<tr><td><i style="--c:' + x.hex + '"></i>' + x.k + ' · ' + x.n + '</td><td>' + v.oz + '</td><td>' + v.y + '</td></tr>';
    }).join('') : '<tr><td colspan="3">Sin colorante: se usa la base tal cual.</td></tr>';
    $('formulaSize').textContent = sel.size === 'cubeta' ? 'por cubeta de 5 gal' : 'por galón';
  }

  function initPicker() {
    if (!$('swatches')) return;
    renderFamilies(); renderSwatches();
    $('harmony').addEventListener('click', function (e) {
      var b = e.target.closest('.hm'); if (!b) return;
      sel.hex = b.dataset.hex; sel.name = 'Combinación ' + b.querySelector('span').firstChild.textContent.toLowerCase(); sel.code = 'MH-IG';
      renderSwatches(); emit(true);
    });
    var ct;
    $('customColor').addEventListener('input', function (e) {
      sel.hex = e.target.value.toUpperCase(); sel.name = 'Color igualado'; sel.code = 'MH-IG';
      renderSwatches(); clearTimeout(ct); ct = setTimeout(function () { emit(true); }, 350); renderSelectionLite();
    });
    function renderSelectionLite() { $('selChip').style.setProperty('--c', sel.hex); $('selName').textContent = sel.name; }
    document.querySelectorAll('input[name="finish"]').forEach(function (r) {
      r.addEventListener('change', function () { sel.finish = r.value; emit(false); });
    });
    document.querySelectorAll('input[name="size"]').forEach(function (r) {
      r.addEventListener('change', function () { sel.size = r.value; emit(false); });
    });
    $('btnPrepare').addEventListener('click', function () { emit(true); });
    $('btnQuoteColor').addEventListener('click', function () {
      prefill('Pintura ' + sel.finish.toLowerCase() + ', color ' + sel.name + ' (' + sel.code + ', ' + sel.hex + '), ' + (sel.size === 'cubeta' ? '1 cubeta de 5 galones' : '1 galón') + '.');
    });
    emit(false);
  }

  function prefill(text) {
    var ta = $('qm');
    ta.value = ta.value ? ta.value.replace(/\s*$/, '') + '\n' + text : text;
    $('cotizar').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { ta.focus({ preventScroll: true }); }, 600);
  }

  /* ---------- Calculadoras ---------- */
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function plural(n, s, p) { return n === 1 ? s : p; }

  var CALCS = {
    pintura: function () {
      var area = Math.max(0, num('pw') * num('ph') * Math.max(1, Math.round(num('pn') || 1)) - num('po'));
      var r = parseFloat($('ps').value), coats = parseFloat($('pc').value);
      var gal = Math.ceil(area * coats / r - 1e-9);
      var cub = Math.floor(gal / 5), rest = gal % 5;
      var buy = gal === 0 ? '—' : [cub ? cub + plural(cub, ' cubeta', ' cubetas') : '', rest ? rest + plural(rest, ' galón', ' galones') : ''].filter(Boolean).join(' + ');
      return {
        big: gal, unit: plural(gal, 'galón', 'galones'),
        rows: [['Área a pintar', fmt(area) + ' m²'], ['Rendimiento', r + ' m² / gal por mano'], ['Manos', coats], ['Compra sugerida', buy]],
        quote: 'Pintura: ' + buy + ' (' + fmt(area) + ' m², ' + coats + ' manos), color ' + sel.name + ' ' + sel.code + ', acabado ' + sel.finish.toLowerCase() + '.'
      };
    },
    concreto: function () {
      var vol = num('cl') * num('ca') * num('ce') / (($('cu').value === 'cm') ? 100 : 1);
      var mix = { '210': [8.5, 0.55, 0.80, 200], '175': [7.2, 0.55, 0.85, 190], '140': [5.8, 0.60, 0.90, 180] }[$('cm').value];
      var w = 1 + num('cw') / 100;
      var bags = Math.ceil(vol * mix[0] * w - 1e-9);
      return {
        big: bags, unit: plural(bags, 'funda de cemento', 'fundas de cemento'),
        rows: [['Volumen', fmt(vol, 2) + ' m³'], ['Arena', fmt(vol * mix[1] * w, 2) + ' m³'], ['Grava', fmt(vol * mix[2] * w, 2) + ' m³'], ['Agua', fmt(vol * mix[3] * w, 0) + ' L']],
        quote: 'Concreto ' + $('cm').selectedOptions[0].text + ': ' + bags + ' fundas de cemento 42.5 kg, ' + fmt(vol * mix[1] * w, 2) + ' m³ de arena y ' + fmt(vol * mix[2] * w, 2) + ' m³ de grava.'
      };
    },
    bloques: function () {
      var area = Math.max(0, num('bl') * num('bh') - num('bo'));
      var size = $('bs').value, w = 1 + num('bw') / 100;
      var blocks = Math.ceil(area * 12.5 * w - 1e-9);
      var mort = area * ({ '4': 0.009, '6': 0.012, '8': 0.016 }[size]);
      var bags = Math.ceil(mort * 8.5 - 1e-9);
      return {
        big: blocks, unit: 'bloques de ' + size + '"',
        rows: [['Área del muro', fmt(area) + ' m²'], ['Mortero', fmt(mort, 2) + ' m³'], ['Cemento para mortero', bags + plural(bags, ' funda', ' fundas')], ['Arena', fmt(mort * 1.1, 2) + ' m³']],
        quote: 'Bloques: ' + blocks + ' bloques de ' + size + '", ' + bags + ' fundas de cemento y ' + fmt(mort * 1.1, 2) + ' m³ de arena para mortero.'
      };
    },
    ceramica: function () {
      var area = num('tl') * num('ta');
      var w = 1 + parseFloat($('tw').value) / 100, perBox = num('tb') || 1.44;
      var boxes = Math.ceil(area * w / perBox - 1e-9);
      var glue = Math.ceil(area * 5 / 20 - 1e-9);
      return {
        big: boxes, unit: plural(boxes, 'caja', 'cajas'),
        rows: [['Área del piso', fmt(area) + ' m²'], ['Con desperdicio', fmt(area * w) + ' m²'], ['Total en cajas', fmt(boxes * perBox, 2) + ' m²'], ['Pegamento (sacos 20 kg)', glue]],
        quote: 'Cerámica: ' + boxes + ' cajas de ' + fmt(perBox, 2) + ' m² (' + fmt(area) + ' m² + desperdicio) y ' + glue + ' sacos de pegamento.'
      };
    }
  };
  var currentCalc = 'pintura', lastQuote = '';

  function runCalc() {
    var r = CALCS[currentCalc]();
    $('calcBig').textContent = fmt(r.big, 0);
    $('calcUnit').textContent = r.unit;
    $('calcRows').innerHTML = r.rows.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('');
    lastQuote = r.quote;
  }
  function initCalcs() {
    var tabs = document.querySelectorAll('.ctab');
    if (!tabs.length) return;
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        currentCalc = t.dataset.calc;
        tabs.forEach(function (x) { var on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
        document.querySelectorAll('.cpanel').forEach(function (p) { p.hidden = p.dataset.calc !== currentCalc; });
        $('calcNote').textContent = NOTES[currentCalc];
        runCalc();
      });
    });
    document.querySelectorAll('.cpanel').forEach(function (p) { p.addEventListener('input', runCalc); p.addEventListener('change', runCalc); });
    $('calcQuote').addEventListener('click', function () { prefill(lastQuote); });
    $('calcNote').textContent = NOTES[currentCalc];
    runCalc();
  }
  var NOTES = {
    pintura: 'Cálculo orientativo. Cubeta = 5 galones. El rendimiento real depende de la marca y de la superficie.',
    concreto: 'Dosificación orientativa por m³ con fundas de 42.5 kg. Para elementos estructurales, sigue las indicaciones de tu ingeniero.',
    bloques: 'Se calculan 12.5 bloques por m² (bloque de 40 × 20 cm con junta de 1 cm). Mortero 1:4.',
    ceramica: 'Pegamento estimado a 5 kg por m². Usa 10 % de desperdicio en colocación recta y 15 % en diagonal.'
  };

  /* ---------- Formulario, copiar, menú ---------- */
  function initForm() {
    var f = $('qform'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = $('qok'), name = $('qn').value.trim(), tel = $('qt').value.trim(), msg = $('qm').value.trim();
      ok.hidden = false;
      if (!name || !tel || !msg) { ok.classList.add('err'); ok.textContent = 'Completa tu nombre, tu teléfono y la lista de lo que necesitas.'; return; }
      ok.classList.remove('err');
      var first = name.split(' ')[0];
      var demo = function () {
        ok.textContent = 'Gracias, ' + first + '. Esta es una vista de demostración: en el sitio publicado, tu solicitud llega a nuestro equipo y te contactamos al ' + tel + '.';
      };
      // En Netlify el formulario se envía de verdad (Netlify Forms); en otros entornos se muestra el aviso de demostración.
      if (!/netlify\.app$/.test(location.hostname) && !f.dataset.live) { demo(); return; }
      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      ok.textContent = 'Enviando…';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          ok.textContent = 'Gracias, ' + first + '. Recibimos tu solicitud y te contactaremos al ' + tel + ' en horario laboral.';
          f.reset();
        })
        .catch(function () {
          ok.classList.add('err');
          ok.textContent = 'No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.';
        })
        .then(function () { btn.disabled = false; });
    });
  }
  function initCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var el = $(b.dataset.copy);
        var done = function () { b.textContent = 'Copiado'; setTimeout(function () { b.textContent = 'Copiar'; }, 1600); };
        var selectIt = function () { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
        try { navigator.clipboard.writeText(el.textContent).then(done, selectIt); } catch (_) { selectIt(); }
      });
    });
  }
  function initMenu() {
    var btn = $('menuBtn'), nav = $('mainNav'); if (!btn) return;
    btn.addEventListener('click', function () { var open = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', open); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });
  }

  initPicker(); initCalcs(); initForm(); initCopy(); initMenu();
})();
