/* Más Hierro · Configurador de baño (panel y lista de materiales). La escena 3D está en bano3d.js. */
(function () {
  'use strict';
  var app = document.getElementById('banoApp');
  if (!app) return;
  var C = window.MHCommon, U = window.MHCalc, IC = (window.MH_TOOLS || {}).icons || {};
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var FX = [
    ['inodoro', 'Inodoro', I('<path d="M6 3h7v7H6z"/><path d="M4 10h14a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M8 15l-1 6h9l-1-6"/>'), 2],
    ['lavamanos', 'Lavamanos', I('<path d="M3 11h18a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6Z"/><path d="M12 11V6a2 2 0 0 1 4 0"/><path d="M10 17v4h4v-4"/>'), 2],
    ['ducha', 'Ducha', IC.bath || '', 1],
    ['banera', 'Bañera', I('<path d="M3 11h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z"/><path d="M5 11V6a2 2 0 0 1 4 0"/><path d="M6 19l-1 2M18 19l1 2"/>'), 1],
    ['bidet', 'Bidet', I('<path d="M4 9h16a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z"/><path d="M9 15l-1 6h8l-1-6M12 9V5"/>'), 1]
  ];
  var o = { inodoro: 1, lavamanos: 1, ducha: 1, banera: 0, bidet: 0, calentador: true, distancia: 4 };
  var off = {};
  app.className = 'bano-panel dpanel';
  app.innerHTML =
    '<div><p class="lbl">Aparatos del baño</p><div class="fx-grid" id="bFx" style="margin-top:.6rem"></div></div>' +
    '<label class="toggle" for="bHot"><span>Calentador de agua (agua caliente)</span><input type="checkbox" id="bHot" checked></label>' +
    '<div class="field"><label for="bDist">Distancia a las líneas principales (m)</label><div class="inp-unit"><input id="bDist" type="number" min="0" step="0.5" value="4" inputmode="decimal"><span>m</span></div></div>' +
    '<div><p class="lbl">Lista de materiales · desmarca lo que ya tienes</p><div class="mat-scroll" style="margin-top:.5rem"><table class="mat-table"><tbody id="bList"></tbody></table></div></div>' +
    '<div class="mbtns"><button class="btn btn-red" id="bCart" type="button">Agregar a mi cotización</button><button class="btn btn-ghost" id="bCopy" type="button">Copiar lista</button></div>' +
    '<p class="fnote">No incluye los aparatos ni la grifería decorativa: elígelos en tienda según tu estilo.</p>';

  function renderFx() {
    document.getElementById('bFx').innerHTML = FX.map(function (f) {
      return '<div class="fx' + (o[f[0]] ? ' on' : '') + '"><div class="fx-top">' + f[2] + f[1] + '</div><div class="stepper"><button type="button" data-k="' + f[0] + '" data-d="-1" aria-label="Quitar ' + f[1] + '">−</button><output>' + o[f[0]] + '</output><button type="button" data-k="' + f[0] + '" data-d="1" aria-label="Agregar ' + f[1] + '">+</button></div></div>';
    }).join('');
  }
  var GROUPS = { fria: 'Agua fría · PVC', caliente: 'Agua caliente · CPVC', drenaje: 'Drenaje', acc: 'Accesorios y cementos' };
  var items = [];
  function renderList() {
    items = U.bano(o);
    var html = '', g = '';
    items.forEach(function (it, i) {
      if (it.g !== g) { g = it.g; html += '<tr class="g"><td colspan="3">' + GROUPS[g] + '</td></tr>'; }
      var k = it.n, isOff = off[k];
      html += '<tr class="' + (isOff ? 'off' : '') + '"><td><input type="checkbox" data-i="' + i + '"' + (isOff ? '' : ' checked') + ' aria-label="Incluir ' + it.n + '"></td><td>' + it.n + '</td><td class="q">' + it.q + ' ' + it.u + '</td></tr>';
    });
    document.getElementById('bList').innerHTML = html;
  }
  function emit() { document.dispatchEvent(new CustomEvent('mh:bano', { detail: o })); }
  function update() { renderFx(); renderList(); emit(); }
  document.getElementById('bFx').addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    var k = b.getAttribute('data-k'), max = FX.filter(function (f) { return f[0] === k; })[0][3];
    o[k] = Math.max(0, Math.min(max, o[k] + +b.getAttribute('data-d')));
    update();
  });
  document.getElementById('bHot').addEventListener('change', function () { o.calentador = this.checked; update(); });
  document.getElementById('bDist').addEventListener('input', function () { o.distancia = Math.max(0, parseFloat(this.value) || 0); renderList(); });
  document.getElementById('bList').addEventListener('change', function (e) {
    var i = e.target.getAttribute('data-i'); if (i == null) return;
    off[items[+i].n] = !e.target.checked; renderList();
  });
  function chosen() { return items.filter(function (it) { return !off[it.n]; }).map(function (it) { return it.q + ' ' + it.u + ' — ' + it.n; }); }
  function title() {
    return 'Baño: ' + FX.filter(function (f) { return o[f[0]]; }).map(function (f) { return o[f[0]] + ' ' + f[1].toLowerCase(); }).join(', ') + (o.calentador ? ', con agua caliente' : '');
  }
  document.getElementById('bCart').addEventListener('click', function () { var l = chosen(); if (l.length) C.add(title(), l, 'bano'); });
  document.getElementById('bCopy').addEventListener('click', function () { C.copy(title() + '\n' + chosen().join('\n'), this); });
  window.MHBano = { get: function () { return o; } };
  update();
})();
