/* Más Hierro · portada: selector del preparador 3D, ofertas, marcas y formulario de cotización */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var K = window.MHColors, C = window.MHCommon, CFG = window.MH_CONFIG || {};

  /* ---------- Preparador de pintura 3D ---------- */
  var sel = { hex: '#C62A20', name: 'Rojo Hierro', code: 'MH-405', finish: 'Satinado', size: 'galon' };
  window.MH = window.MH || {};
  window.MH.sel = sel;

  function emit(prepare) {
    sel.formula = K.formula(sel.hex, sel.size === 'cubeta' ? 5 : 1);
    document.dispatchEvent(new CustomEvent('mh:color', { detail: sel }));
    renderSelection();
    if (prepare) document.dispatchEvent(new CustomEvent('mh:prepare'));
  }
  function renderSelection() {
    var rgb = K.hexToRgb(sel.hex), hsl = K.rgbToHsl(rgb[0], rgb[1], rgb[2]);
    $('selChip').style.setProperty('--c', sel.hex);
    $('selName').textContent = sel.name;
    $('selCode').textContent = sel.code + ' · ' + sel.hex.toUpperCase();
    $('selLrv').textContent = K.lrv(sel.hex);
    $('customColor').value = sel.hex.toLowerCase();
    var harm = [
      { n: 'Tono claro', hex: K.hslToHex(hsl.h, hsl.s * 0.55, Math.min(0.93, hsl.l + (1 - hsl.l) * 0.6)) },
      { n: 'Tono oscuro', hex: K.hslToHex(hsl.h, Math.min(1, hsl.s * 0.9), hsl.l * 0.55) },
      { n: 'Contraste', hex: K.hslToHex(hsl.h + 180, Math.min(0.55, hsl.s * 0.7 + 0.1), hsl.l > 0.6 ? 0.38 : 0.82) },
      { n: 'Acompañante', hex: K.hslToHex(hsl.h + 30, hsl.s * 0.6, Math.min(0.9, hsl.l * 0.85 + 0.12)) }
    ];
    $('harmony').innerHTML = harm.map(function (h) {
      return '<button type="button" class="hm" data-hex="' + h.hex + '" data-n="' + h.n + '" style="--c:' + h.hex + '"><i></i><span>' + h.n + '<small>' + h.hex + '</small></span></button>';
    }).join('');
    var f = sel.formula || [];
    $('formula').innerHTML = f.length ? f.map(function (x) {
      var v = K.ozY(x.oz);
      return '<tr><td><i style="--c:' + x.hex + '"></i>' + x.k + ' · ' + x.n + '</td><td>' + v.oz + '</td><td>' + v.y + '</td></tr>';
    }).join('') : '<tr><td colspan="3">Sin colorante: se usa la base tal cual.</td></tr>';
    $('formulaSize').textContent = sel.size === 'cubeta' ? 'por cubeta de 5 gal' : 'por galón';
  }
  function initMixer() {
    if (!$('swatches')) return;
    var pk = K.picker({
      tabs: $('famTabs'), grid: $('swatches'), family: 3, selected: sel.hex,
      onPick: function (c) { sel.hex = c.hex; sel.name = c.name; sel.code = c.code; emit(true); }
    });
    $('harmony').addEventListener('click', function (e) {
      var b = e.target.closest('.hm'); if (!b) return;
      sel.hex = b.dataset.hex; sel.name = 'Combinación: ' + b.dataset.n.toLowerCase(); sel.code = 'MH-IG';
      pk.select(sel.hex); emit(true);
    });
    var ct;
    $('customColor').addEventListener('input', function (e) {
      sel.hex = e.target.value.toUpperCase(); sel.name = 'Color igualado'; sel.code = 'MH-IG';
      pk.select(null); $('selChip').style.setProperty('--c', sel.hex); $('selName').textContent = sel.name;
      clearTimeout(ct); ct = setTimeout(function () { emit(true); }, 350);
    });
    document.querySelectorAll('input[name="finish"]').forEach(function (r) { r.addEventListener('change', function () { sel.finish = r.value; emit(false); }); });
    document.querySelectorAll('input[name="size"]').forEach(function (r) { r.addEventListener('change', function () { sel.size = r.value; emit(false); }); });
    $('btnPrepare').addEventListener('click', function () { emit(true); });
    $('btnQuoteColor').addEventListener('click', function () {
      var f = (sel.formula || []).map(function (x) { var v = K.ozY(x.oz); return x.k + ' ' + v.oz + ' oz ' + v.y + ' Y'; }).join(', ');
      C.add('Pintura ' + sel.finish.toLowerCase() + ' · ' + sel.name + ' (' + sel.code + ')', [
        '1 ' + (sel.size === 'cubeta' ? 'cubeta de 5 galones' : 'galón') + ' — ' + sel.name + ' ' + sel.code + ' (' + sel.hex + ')',
        'Fórmula de referencia: ' + (f || 'base sin colorante')
      ], 'preparador');
    });
    emit(false);
  }

  /* ---------- Ofertas (data/ofertas.json) ---------- */
  function money(n) { return 'RD$ ' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 }); }
  function initOfertas() {
    var grid = $('ofGrid'); if (!grid) return;
    var cats = (window.MH_TOOLS || {}).cats || {};
    fetch('data/ofertas.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      if (d.vigencia) {
        var v = new Date(d.vigencia + 'T23:59:00');
        $('ofVence').textContent = 'Válidas hasta el ' + v.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' }) + ' o hasta agotar existencia.';
      }
      $('ofNote').textContent = d.nota || '';
      grid.innerHTML = d.ofertas.map(function (o, i) {
        var c = cats[o.categoria] || { color: '#D7261E', name: '' };
        return '<article class="of" style="--cat:' + c.color + '"><span class="of-tag">' + C.esc(o.etiqueta || 'Oferta') + '</span>' +
          '<small>' + C.esc(c.name) + '</small><h3>' + C.esc(o.producto) + '</h3><p>' + C.esc(o.detalle || '') + '</p>' +
          '<div class="of-price"><b>' + money(o.precio) + '</b>' + (o.antes ? '<s>' + money(o.antes) + '</s>' : '') + '</div>' +
          '<button class="btn btn-red" type="button" data-of="' + i + '">Agregar a mi cotización</button></article>';
      }).join('');
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('[data-of]'); if (!b) return;
        var o = d.ofertas[+b.getAttribute('data-of')];
        C.add('Oferta: ' + o.producto, ['1 ud — ' + o.producto + ' a ' + money(o.precio) + (o.detalle ? ' (' + o.detalle + ')' : '')], 'ofertas');
      });
    }).catch(function () {
      grid.innerHTML = '<p class="of-loading">Pregunta por las ofertas de la semana en tienda o por WhatsApp.</p>';
    });
  }

  /* ---------- Marcas ---------- */
  function initMarcas() {
    var row = $('marcasRow'); if (!row) return;
    var list = (CFG.marcas || []).map(function (m) { return '<span class="marca' + (/lanco/i.test(m) ? ' star' : '') + '">' + C.esc(m) + '</span>'; }).join('');
    row.innerHTML = list + list;
  }

  /* ---------- Formulario de cotización (Netlify Forms) ---------- */
  function initForm() {
    var f = $('qform'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = $('qok'), name = $('qn').value.trim(), tel = $('qt').value.trim(), msg = $('qm').value.trim();
      ok.hidden = false;
      if (!name || !tel || !msg) { ok.classList.add('err'); ok.textContent = 'Completa tu nombre, tu teléfono y la lista de lo que necesitas.'; return; }
      ok.classList.remove('err'); ok.textContent = 'Enviando…';
      var btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
      C.sendForm('cotizacion', { nombre: name, telefono: tel, tipo_cliente: $('qc').value, pedido: msg }).then(function (r) {
        var first = name.split(' ')[0];
        if (r.demo) ok.textContent = 'Gracias, ' + first + '. Esta es una vista de demostración: en el sitio publicado tu solicitud llega a la tienda y te contactamos al ' + tel + '.';
        else { ok.textContent = 'Gracias, ' + first + '. Recibimos tu solicitud y te contactaremos al ' + tel + ' en horario laboral.'; f.reset(); }
      }).catch(function () {
        ok.classList.add('err'); ok.textContent = 'No pudimos enviar tu solicitud. Revisa tu conexión o escríbenos por WhatsApp.';
      }).then(function () { btn.disabled = false; });
    });
    var wa = $('waLink');
    if (wa) wa.href = 'https://wa.me/' + (CFG.whatsapp || '') + '?text=' + encodeURIComponent('Hola, quiero cotizar en ' + (CFG.nombre || 'Más Hierro Ferretería') + '.');
  }

  initMixer(); initOfertas(); initMarcas(); initForm();
})();
