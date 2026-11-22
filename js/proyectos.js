/* Más Hierro · Listas de compras por proyecto.
   Cada plantilla reutiliza las calculadoras (js/calcs.js) y suma las herramientas del trabajo. */
(function () {
  'use strict';
  var app = document.getElementById('proyectosApp');
  if (!app) return;
  var C = window.MHCommon, U = window.MHCalc, D = U.defs, IC = (window.MH_TOOLS || {}).icons || {}, CAT = (window.MH_TOOLS || {}).cats || {};
  function fromCalc(id, v) {
    var def = D[id], vals = {};
    def.fields.forEach(function (f) { vals[f.id] = f.type === 'number' ? f.value : f.value; });
    for (var k in v) vals[k] = v[k];
    return def.compute(vals).lines.map(function (l) { return { n: l.n, q: l.q, u: l.u, g: 'Materiales' }; });
  }
  function T(n, q, u) { return { n: n, q: q, u: u || 'ud', g: 'Herramientas y accesorios' }; }
  var F = function (id, label, value, unit, step) { return { id: id, label: label, value: value, unit: unit, step: step || 0.1 }; };
  var P = [
    { id: 'habitacion', n: 'Pintar una habitación', d: 'Paredes y techo, con todo lo necesario.', ic: 'roller', cat: 'pinturas',
      f: [F('l', 'Largo', 4, 'm'), F('a', 'Ancho', 3.5, 'm'), F('h', 'Alto', 2.6, 'm')],
      items: function (v) {
        var walls = 2 * (v.l + v.a) * v.h - 4, ceil = v.l * v.a;
        var gw = U.up(walls * 2 / 35), gc = U.up(ceil * 2 / 35);
        return [{ n: 'Pintura acrílica para paredes', q: gw, u: 'gal', g: 'Materiales' }, { n: 'Pintura blanca para techo', q: gc, u: 'gal', g: 'Materiales' },
          { n: 'Sellador acrílico', q: U.up((walls + ceil) / 60), u: 'gal', g: 'Materiales' }, { n: 'Masilla para resanes', q: 1, u: '1/4 gal', g: 'Materiales' },
          T('Rodillo 9" con felpa', 1), T('Extensión para rodillo', 1), T('Bandeja para pintura', 1), T('Brocha 3"', 1), T('Cinta de enmascarar 2"', 2, 'rollos'), T('Lija #120', 4, 'pliegos'), T('Plástico protector', 1, 'rollo'), T('Espátula', 1)];
      } },
    { id: 'bano', n: 'Hacer un baño', d: 'Tuberías, drenajes y conexiones.', ic: 'bath', cat: 'plomeria',
      f: [F('inodoro', 'Inodoros', 1, '', 1), F('lavamanos', 'Lavamanos', 1, '', 1), F('ducha', 'Duchas', 1, '', 1)],
      link: ['catalogo.html#sanitarios', 'Ver inodoros y lavamanos en 3D'],
      items: function (v) {
        return U.bano({ inodoro: Math.round(v.inodoro), lavamanos: Math.round(v.lavamanos), ducha: Math.min(1, Math.round(v.ducha)), banera: 0, bidet: 0, calentador: true, distancia: 4 })
          .map(function (x) { return { n: x.n, q: x.q, u: x.u, g: 'Materiales' }; })
          .concat([T('Segueta', 1), T('Cinta métrica', 1), T('Nivel', 1)]);
      } },
    { id: 'verja', n: 'Levantar una verja', d: 'Malla ciclón, tubos y concreto.', ic: 'fence', cat: 'construccion',
      f: [F('p', 'Perímetro', 40, 'm'), F('g', 'Portones', 3, 'm')],
      items: function (v) { return fromCalc('verjas', { p: v.p, g: v.g }).concat([T('Pala', 1), T('Coa', 1), T('Nivel', 1), T('Tensor de malla', 2), T('Alicate', 1)]); } },
    { id: 'panete', n: 'Pañetar una pared', d: 'Cemento, arena y herramientas de albañil.', ic: 'trowel', cat: 'construccion',
      f: [F('l', 'Largo', 6, 'm'), F('h', 'Alto', 2.6, 'm')],
      items: function (v) { return fromCalc('panete', { l: v.l, h: v.h, k: '1' }).concat([T('Llana metálica', 1), T('Regla de aluminio 2 m', 1), T('Cubeta de albañil', 2), T('Cuchara de albañil', 1), T('Esponja para fratasar', 1)]); } },
    { id: 'piso', n: 'Instalar cerámica de piso', d: 'Cajas, pegamento, boquilla y herramientas.', ic: 'tiles', cat: 'construccion',
      f: [F('l', 'Largo', 4, 'm'), F('a', 'Ancho', 3, 'm')],
      items: function (v) { return fromCalc('ceramica', { l: v.l, a: v.a }).concat([T('Llana dentada', 1), T('Cortadora de cerámica', 1), T('Mazo de goma', 1), T('Nivel', 1), T('Niveladores', 1, 'bolsa')]); } },
    { id: 'zinc', n: 'Techar con zinc', d: 'Láminas, correas, caballetes y tornillos.', ic: 'zinc', cat: 'construccion',
      f: [F('a', 'Ancho del techo', 6, 'm'), F('c', 'Caída de cada agua', 3.5, 'm')],
      items: function (v) { return fromCalc('zinc', { a: v.a, c: v.c }).concat([T('Taladro atornillador', 1), T('Copa para tornillos', 1), T('Sellador para techos', 1, 'tubo'), T('Tijera para lámina', 1)]); } },
    { id: 'imper', n: 'Impermeabilizar el techo', d: 'Impermeabilizante, sellador y malla.', ic: 'roof', cat: 'pinturas',
      f: [F('l', 'Largo', 8, 'm'), F('a', 'Ancho', 6, 'm')],
      items: function (v) { return fromCalc('impermeabilizante', { l: v.l, a: v.a }).concat([T('Escoba dura', 1), T('Espátula', 1), T('Guantes', 1, 'par')]); } },
    { id: 'abanico', n: 'Instalar un abanico de techo', d: 'Cableado, caja e interruptor.', ic: 'bolt', cat: 'electricidad',
      f: [F('d', 'Distancia al interruptor', 4, 'm')],
      items: function (v) {
        var m = U.up(v.d * 1.15 + 1);
        return [{ n: 'Cable THHN 14 AWG (fase y neutro)', q: m * 2, u: 'm', g: 'Materiales' }, { n: 'Cable THHN 14 AWG verde (tierra)', q: m, u: 'm', g: 'Materiales' },
          { n: 'Caja octagonal reforzada para abanico', q: 1, u: 'ud', g: 'Materiales' }, { n: 'Interruptor sencillo con placa', q: 1, u: 'ud', g: 'Materiales' },
          { n: 'Tubo conduit 1/2" × 3 m', q: U.up(v.d / 3), u: 'ud', g: 'Materiales' }, { n: 'Conectores de cable (wire nuts)', q: 1, u: 'bolsa', g: 'Materiales' },
          T('Cinta aislante', 1, 'rollo'), T('Probador de voltaje', 1), T('Pelacables', 1), T('Destornilladores', 1, 'juego')];
      } }
  ];
  var cur = P[0], vals = {}, off = {};
  app.innerHTML = '<div class="proy-list" role="group" aria-label="Proyectos">' + P.map(function (p, i) {
    var c = CAT[p.cat] || {};
    return '<button class="pj" type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '" style="--pc:' + (c.color || '#D7261E') + '"><span class="rt-ic">' + (IC[p.ic] || '') + '</span><span><b>' + p.n + '</b><small>' + p.d + '</small></span></button>';
  }).join('') + '</div><div class="proy-card" id="pCard"></div>';

  function card() {
    vals = {}; off = {};
    cur.f.forEach(function (f) { vals[f.id] = f.value; });
    document.getElementById('pCard').innerHTML =
      '<span class="eyebrow">Lista de compras</span><h2>' + cur.n + '</h2>' +
      '<div class="proy-fields">' + cur.f.map(function (f) {
        return '<div class="field"><label for="pf-' + f.id + '">' + f.label + '</label><div class="inp-unit"><input id="pf-' + f.id + '" data-f="' + f.id + '" type="number" min="0" step="' + f.step + '" value="' + f.value + '" inputmode="decimal">' + (f.unit ? '<span>' + f.unit + '</span>' : '') + '</div></div>';
      }).join('') + '</div>' +
      '<div style="overflow-x:auto"><table class="plist"><tbody id="pRows"></tbody></table></div>' +
      '<div class="proy-actions"><button class="btn btn-red" id="pCart" type="button">Agregar lista a mi cotización</button><button class="btn btn-ghost" id="pCopy" type="button">Copiar lista</button>' +
      (cur.link ? '<a class="btn btn-ghost" href="' + cur.link[0] + '">' + cur.link[1] + '</a>' : '') + '</div>' +
      '<p class="note" style="color:var(--muted)">Cantidades orientativas. Desmarca lo que ya tienes y ajusta las cantidades antes de enviar.</p>';
    rows();
    document.getElementById('pCard').querySelector('.proy-fields').addEventListener('input', function (e) {
      var f = e.target.getAttribute('data-f'); if (!f) return; vals[f] = Math.max(0, parseFloat(e.target.value) || 0); rows();
    });
    document.getElementById('pCart').addEventListener('click', function () { var l = chosen(); if (l.length) C.add(cur.n, l, 'proyectos'); });
    document.getElementById('pCopy').addEventListener('click', function () { C.copy(cur.n + '\n' + chosen().join('\n'), this); });
  }
  var items = [];
  function rows() {
    items = cur.items(vals);
    var g = '', html = '';
    items.forEach(function (it, i) {
      if (it.g !== g) { g = it.g; html += '<tr class="g"><td colspan="4">' + g + '</td></tr>'; }
      var isOff = off[it.n];
      html += '<tr class="' + (isOff ? 'off' : '') + '"><td><input type="checkbox" data-c="' + i + '"' + (isOff ? '' : ' checked') + ' aria-label="Incluir ' + it.n + '"></td><td>' + it.n + '</td><td class="q"><input type="number" min="0" step="any" value="' + it.q + '" data-q="' + i + '" aria-label="Cantidad de ' + it.n + '"></td><td class="u">' + it.u + '</td></tr>';
    });
    document.getElementById('pRows').innerHTML = html;
  }
  app.addEventListener('change', function (e) {
    var c = e.target.getAttribute('data-c'); if (c != null) { off[items[+c].n] = !e.target.checked; e.target.closest('tr').classList.toggle('off', !e.target.checked); }
  });
  app.addEventListener('input', function (e) { var q = e.target.getAttribute('data-q'); if (q != null) items[+q].q = e.target.value; });
  function chosen() { return items.filter(function (it) { return !off[it.n] && +it.q > 0; }).map(function (it) { return it.q + ' ' + it.u + ' — ' + it.n; }); }
  app.querySelector('.proy-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-i]'); if (!b) return;
    cur = P[+b.getAttribute('data-i')];
    this.querySelectorAll('.pj').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    card();
    if (window.innerWidth < 900) document.getElementById('pCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  card();
})();
