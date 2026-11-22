/* Más Hierro · Consumo eléctrico, inversor y baterías (tabla y resultados). La casa 3D está en house3d.js. */
(function () {
  'use strict';
  var app = document.getElementById('consumoApp');
  if (!app) return;
  var C = window.MHCommon, U = window.MHCalc, fmt = U.fmt;
  var LIST = [
    { id: 'nevera', n: 'Nevera', w: 150, h: 24, duty: 0.4, q: 1, on: true, ap: true, motor: true },
    { id: 'bombillos', n: 'Bombillos LED', w: 9, h: 6, duty: 1, q: 8, on: true, ap: true },
    { id: 'abanico', n: 'Abanico', w: 60, h: 8, duty: 1, q: 2, on: true, ap: true },
    { id: 'tv', n: 'Televisor', w: 100, h: 5, duty: 1, q: 1, on: true, ap: true },
    { id: 'router', n: 'Router wifi', w: 10, h: 24, duty: 1, q: 1, on: true, ap: true },
    { id: 'pc', n: 'Computadora', w: 150, h: 4, duty: 1, q: 1, on: true, ap: true },
    { id: 'cargadores', n: 'Cargadores de celular', w: 10, h: 3, duty: 1, q: 3, on: true, ap: true },
    { id: 'aire', n: 'Aire acondicionado inverter 12,000 BTU', w: 1000, h: 8, duty: 0.6, q: 1, on: true, ap: false, motor: true },
    { id: 'lavadora', n: 'Lavadora', w: 500, h: 1, duty: 1, q: 1, on: true, ap: false, motor: true },
    { id: 'microondas', n: 'Microondas', w: 1200, h: 0.3, duty: 1, q: 1, on: true, ap: false },
    { id: 'bomba', n: 'Bomba de agua 1/2 HP', w: 750, h: 0.5, duty: 1, q: 1, on: true, ap: false, motor: true },
    { id: 'licuadora', n: 'Licuadora', w: 400, h: 0.2, duty: 1, q: 1, on: true, ap: false },
    { id: 'plancha', n: 'Plancha de ropa', w: 1200, h: 0.3, duty: 1, q: 1, on: false, ap: false },
    { id: 'calentador', n: 'Calentador eléctrico', w: 1500, h: 1, duty: 1, q: 1, on: false, ap: false }
  ];
  var opt = { tarifa: 12, horas: 6, banco: 24, bat: 'litio' };
  var res = {};
  app.innerHTML =
    '<div class="consumo-grid">' +
    '<div class="appl"><table><thead><tr><th>Usar</th><th>Equipo</th><th>Cant.</th><th>Vatios</th><th>Horas/día</th><th>En apagón</th><th style="text-align:right">kWh/mes</th></tr></thead><tbody id="csRows"></tbody></table>' +
    '<div class="add-row"><input id="csNewN" placeholder="Otro equipo" aria-label="Nombre del equipo"><input id="csNewW" type="number" min="1" placeholder="Vatios" aria-label="Vatios" style="max-width:110px"><button class="mini-btn" id="csAdd" type="button" style="color:var(--fg);border-color:var(--line)">Agregar equipo</button></div></div>' +
    '<aside class="result tool-result" aria-live="polite">' +
    '<span class="eyebrow">Tu consumo estimado</span><div class="big"><span id="csKwh">0</span><small>kWh al mes</small></div>' +
    '<dl id="csDl"></dl>' +
    '<div class="cs-opts">' +
    '<div class="field"><label for="csTar">Tarifa (RD$ por kWh)</label><input id="csTar" type="number" min="0" step="0.5" value="12"></div>' +
    '<div class="field"><label for="csH">Horas de apagón</label><input id="csH" type="number" min="1" max="24" step="1" value="6"></div>' +
    '<div class="field"><label for="csV">Banco de baterías</label><select id="csV"><option value="12">12 V</option><option value="24" selected>24 V</option><option value="48">48 V</option></select></div>' +
    '<div class="field"><label for="csB">Tipo de batería</label><select id="csB"><option value="litio">Litio (90 % útil)</option><option value="plomo">Plomo / gel (50 % útil)</option></select></div>' +
    '</div>' +
    '<p class="note">Orientativo. Pon la tarifa de tu factura. Antes de comprar el inversor, revisa la instalación con un electricista.</p>' +
    '<div class="rbtns"><button class="btn btn-red" id="csCart" type="button">Agregar inversor y baterías</button></div>' +
    '</aside></div>';

  function rows() {
    document.getElementById('csRows').innerHTML = LIST.map(function (a, i) {
      var k = a.on ? a.w * a.q * a.h * a.duty * 30 / 1000 : 0;
      return '<tr class="' + (a.on ? '' : 'off') + '"><td><input type="checkbox" data-i="' + i + '" data-f="on"' + (a.on ? ' checked' : '') + ' aria-label="Usar ' + a.n + '"></td>' +
        '<td class="n">' + a.n + '</td>' +
        '<td><input type="number" min="0" step="1" value="' + a.q + '" data-i="' + i + '" data-f="q" aria-label="Cantidad de ' + a.n + '"></td>' +
        '<td><input type="number" min="0" step="1" value="' + a.w + '" data-i="' + i + '" data-f="w" aria-label="Vatios de ' + a.n + '"></td>' +
        '<td><input type="number" min="0" max="24" step="0.5" value="' + a.h + '" data-i="' + i + '" data-f="h" aria-label="Horas al día de ' + a.n + '"></td>' +
        '<td><input type="checkbox" data-i="' + i + '" data-f="ap"' + (a.ap ? ' checked' : '') + ' aria-label="Mantener ' + a.n + ' en apagón"></td>' +
        '<td class="k" data-k="' + i + '">' + fmt(k, 1) + '</td></tr>';
    }).join('');
  }
  function calc() {
    var day = 0, peak = 0, motor = 0, eOut = 0;
    LIST.forEach(function (a) {
      if (!a.on) return;
      day += a.w * a.q * a.h * a.duty / 1000;
      if (a.ap) {
        peak += a.w * a.q;
        if (a.motor) motor = Math.max(motor, a.w);
        eOut += a.w * a.q * a.duty * Math.min(a.h, opt.horas);
      }
    });
    var month = day * 30;
    var INV = [1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000];
    var inv = INV.filter(function (s) { return s >= peak * 1.25; })[0] || 10000;
    var dod = opt.bat === 'litio' ? 0.9 : 0.5, need = eOut / dod / 0.9;
    var perString = opt.banco / 12, strings = Math.max(1, Math.ceil(need / (12 * 200 * perString)));
    var bats = eOut > 0 ? strings * perString : 0;
    var usable = bats * 12 * 200 * dod * 0.9;
    var gen = Math.ceil((peak + motor * 2) * 1.25 / 500) / 2;
    res = { day: day, month: month, cost: month * opt.tarifa, peak: peak, inv: inv, eOut: eOut, bats: bats, usable: usable, avg: eOut / opt.horas, gen: gen };
    document.getElementById('csKwh').textContent = fmt(month, 0);
    document.getElementById('csDl').innerHTML =
      '<dt>Costo al mes</dt><dd>RD$ ' + fmt(res.cost, 0) + '</dd>' +
      '<dt>Equipos en apagón</dt><dd>' + fmt(peak, 0) + ' W</dd>' +
      '<dt>Inversor sugerido</dt><dd>' + fmt(inv, 0) + ' W</dd>' +
      '<dt>Energía para ' + opt.horas + ' h</dt><dd>' + fmt(eOut / 1000, 2) + ' kWh</dd>' +
      '<dt>Baterías 12 V 200 Ah</dt><dd>' + bats + (bats ? ' (' + strings + ' × ' + perString + ' en serie)' : '') + '</dd>' +
      '<dt>Planta eléctrica</dt><dd>' + fmt(gen, 1) + ' kW</dd>';
    LIST.forEach(function (a, i) { var td = document.querySelector('[data-k="' + i + '"]'); if (td) td.textContent = fmt(a.on ? a.w * a.q * a.h * a.duty * 30 / 1000 : 0, 1); });
    document.dispatchEvent(new CustomEvent('mh:consumo', { detail: get() }));
  }
  function get() { return { items: LIST.map(function (a) { return { id: a.id, on: a.on && a.q > 0, ap: a.ap, q: a.q }; }), res: res, opt: opt }; }
  app.addEventListener('input', function (e) {
    var t = e.target, i = t.getAttribute('data-i'), f = t.getAttribute('data-f');
    if (i != null) {
      var a = LIST[+i];
      if (f === 'on' || f === 'ap') { a[f] = t.checked; if (f === 'on') t.closest('tr').classList.toggle('off', !t.checked); }
      else a[f] = Math.max(0, parseFloat(t.value) || 0);
      calc(); return;
    }
    if (t.id === 'csTar') opt.tarifa = Math.max(0, parseFloat(t.value) || 0);
    if (t.id === 'csH') opt.horas = Math.max(1, Math.min(24, parseFloat(t.value) || 1));
    if (t.id === 'csV') opt.banco = +t.value;
    if (t.id === 'csB') opt.bat = t.value;
    if (/^cs(Tar|H|V|B)$/.test(t.id)) calc();
  });
  document.getElementById('csAdd').addEventListener('click', function () {
    var n = document.getElementById('csNewN').value.trim(), w = parseFloat(document.getElementById('csNewW').value);
    if (!n || !(w > 0)) { C.toast('Escribe el nombre del equipo y sus vatios.'); return; }
    LIST.push({ id: 'otro' + LIST.length, n: n, w: w, h: 2, duty: 1, q: 1, on: true, ap: false });
    document.getElementById('csNewN').value = ''; document.getElementById('csNewW').value = '';
    rows(); calc();
  });
  document.getElementById('csCart').addEventListener('click', function () {
    var lines = ['1 ud — Inversor ' + fmt(res.inv, 0) + ' W'];
    if (res.bats) lines.push(res.bats + ' ud — Batería 12 V 200 Ah (' + (opt.bat === 'litio' ? 'litio' : 'plomo/gel') + ')');
    lines.push('Consumo estimado: ' + fmt(res.month, 0) + ' kWh/mes · apagón de ' + opt.horas + ' h con ' + fmt(res.peak, 0) + ' W');
    C.add('Respaldo para apagones: inversor ' + fmt(res.inv, 0) + ' W', lines, 'consumo');
  });
  window.MHConsumo = { get: get };
  rows(); calc();
})();
