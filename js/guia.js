/* Más Hierro · Guía de pintura por superficie */
(function () {
  'use strict';
  var app = document.getElementById('guiaApp');
  if (!app) return;
  var C = window.MHCommon, ICONS = (window.MH_TOOLS || {}).icons || {};
  var I = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var S = [
    { id: 'bloque', n: 'Bloque o concreto nuevo', d: 'Paredes recién pañetadas o sin pintar.', ic: ICONS.bricks,
      steps: ['Espera que el pañete cure al menos 28 días.', 'Limpia el polvo con escoba o cepillo.', 'Aplica una mano de sellador acrílico diluido según la etiqueta.', 'Resana fisuras con masilla y lija suave.', 'Aplica dos manos de pintura acrílica.'],
      spec: [['Base', 'Sellador acrílico para mampostería'], ['Pintura', 'Acrílica (interior o exterior según la pared)'], ['Acabado', 'Mate o satinado'], ['Manos', '1 de sellador + 2 de pintura'], ['Secado', '2–4 h entre manos'], ['Herramientas', 'Rodillo de felpa media, brocha 3", bandeja']],
      warn: 'Pintar sobre pañete fresco provoca manchas blancas (salitre) y desprendimiento.',
      kit: ['Sellador acrílico', 'Pintura acrílica', 'Masilla para resanes', 'Rodillo 9" de felpa media', 'Brocha 3"', 'Bandeja', 'Lija #120'] },
    { id: 'pintada', n: 'Pared ya pintada', d: 'Repintar interiores o exteriores.', ic: ICONS.roller,
      steps: ['Lava con agua y jabón las zonas sucias o con grasa.', 'Raspa la pintura suelta y lija los bordes.', 'Resana huecos con masilla y lija.', 'Si cambias de oscuro a claro, aplica una mano de sellador o blanco.', 'Aplica dos manos de pintura.'],
      spec: [['Base', 'Solo en resanes o cambios fuertes de color'], ['Pintura', 'Acrílica'], ['Acabado', 'Igual o similar al anterior'], ['Manos', '2'], ['Secado', '2–4 h entre manos'], ['Herramientas', 'Rodillo, brocha, espátula, cinta de enmascarar']],
      warn: 'Una pintura de agua sobre esmalte de aceite se pela: lija y usa un imprimante de adherencia.',
      kit: ['Pintura acrílica', 'Masilla', 'Espátula', 'Lija #120', 'Cinta de enmascarar', 'Rodillo y bandeja'] },
    { id: 'madera', n: 'Madera', d: 'Puertas, ventanas y muebles.', ic: I('<path d="M4 4h16v16H4z"/><path d="M4 9c4 1 8-1 16 0M4 15c5-1 9 1 16 0"/>'),
      steps: ['Lija en el sentido de la veta con lija #120 y luego #220.', 'Limpia el polvo con un paño húmedo.', 'Tapa grietas con masilla para madera.', 'Aplica una mano de sellador o fondo para madera.', 'Aplica dos manos de esmalte, lijando suave entre manos.'],
      spec: [['Base', 'Sellador o fondo para madera'], ['Pintura', 'Esmalte (base agua o aceite)'], ['Acabado', 'Satinado o semibrillo'], ['Manos', '1 de fondo + 2 de esmalte'], ['Secado', '6–8 h (aceite) · 2 h (agua)'], ['Herramientas', 'Brocha de cerda fina, rodillo de espuma, lijas']],
      warn: 'No pintes madera húmeda: atrapa la humedad y la pintura se ampolla.',
      kit: ['Sellador para madera', 'Esmalte', 'Masilla para madera', 'Lija #120 y #220', 'Brocha 2"', 'Rodillo de espuma 4"'] },
    { id: 'metal', n: 'Metal y hierro', d: 'Rejas, portones, verjas y techos metálicos.', ic: ICONS.fence,
      steps: ['Quita el óxido con cepillo de alambre o lija.', 'Limpia la grasa con diluyente.', 'Aplica una mano de anticorrosivo el mismo día de la limpieza.', 'Aplica dos manos de esmalte.'],
      spec: [['Base', 'Anticorrosivo (minio o fondo)'], ['Pintura', 'Esmalte alquídico'], ['Acabado', 'Brillante o semibrillo'], ['Manos', '1 de anticorrosivo + 2 de esmalte'], ['Secado', '8–12 h entre manos'], ['Herramientas', 'Cepillo de alambre, brocha, diluyente']],
      warn: 'Si dejas pasar días entre la limpieza y el anticorrosivo, el óxido vuelve a salir.',
      kit: ['Anticorrosivo', 'Esmalte para metal', 'Diluyente', 'Cepillo de alambre', 'Lija para metal', 'Brocha 2"'] },
    { id: 'techo', n: 'Techo o losa exterior', d: 'Impermeabilizar y proteger del sol.', ic: ICONS.roof,
      steps: ['Barre y lava el techo; quita el moho.', 'Sella grietas y juntas.', 'Aplica sellador diluido.', 'Coloca malla de refuerzo en bordes, desagües y grietas.', 'Aplica dos o tres manos de impermeabilizante cruzadas.'],
      spec: [['Base', 'Sellador para techos'], ['Pintura', 'Impermeabilizante acrílico elastomérico'], ['Acabado', 'Blanco reflectivo recomendado'], ['Manos', '2–3 cruzadas'], ['Secado', '4–6 h entre manos'], ['Herramientas', 'Cepillo de cerdas, rodillo de felpa gruesa, malla']],
      warn: 'No apliques si hay pronóstico de lluvia en 24 horas.',
      kit: ['Impermeabilizante acrílico', 'Sellador para techos', 'Malla de poliéster', 'Cepillo de cerdas duras', 'Rodillo de felpa gruesa'],
      link: ['impermeabilizante', 'Calcular impermeabilizante'] },
    { id: 'humeda', n: 'Baño y cocina', d: 'Zonas con vapor y humedad.', ic: ICONS.bath,
      steps: ['Lava el moho con agua y cloro, enjuaga y deja secar.', 'Aplica sellador antihongos.', 'Aplica dos manos de pintura para zonas húmedas.'],
      spec: [['Base', 'Sellador antihongos'], ['Pintura', 'Acrílica antihongos o esmalte base agua'], ['Acabado', 'Satinado o semibrillo (se limpia mejor)'], ['Manos', '2'], ['Secado', '4 h entre manos'], ['Herramientas', 'Rodillo, brocha, guantes']],
      warn: 'Pintar sobre moho sin tratarlo hace que reaparezca en semanas.',
      kit: ['Sellador antihongos', 'Pintura antihongos', 'Cloro', 'Rodillo y brocha', 'Guantes'] },
    { id: 'piso', n: 'Piso y garaje', d: 'Concreto con tránsito de personas o vehículos.', ic: ICONS.tiles,
      steps: ['Lava y desengrasa el piso.', 'Si es concreto liso, ábrele poro con lija o ácido muriático diluido.', 'Aplica imprimante para pisos.', 'Aplica dos manos de pintura epóxica o para tráfico.'],
      spec: [['Base', 'Imprimante para pisos'], ['Pintura', 'Epóxica o pintura de tráfico'], ['Acabado', 'Semibrillo'], ['Manos', '2'], ['Secado', '24 h antes de pisar · 72 h para vehículos'], ['Herramientas', 'Rodillo de felpa corta, extensión']],
      warn: 'La pintura acrílica de pared no aguanta el tránsito: se gasta en semanas.',
      kit: ['Pintura epóxica para pisos', 'Imprimante', 'Desengrasante', 'Rodillo de felpa corta', 'Extensión'] },
    { id: 'fachada', n: 'Fachada exterior', d: 'Paredes al sol y la lluvia.', ic: ICONS.room,
      steps: ['Lava la fachada con agua a presión o cepillo.', 'Repara fisuras con sellador elástico.', 'Aplica sellador para exteriores.', 'Aplica dos manos de pintura acrílica para exteriores.'],
      spec: [['Base', 'Sellador para exteriores'], ['Pintura', 'Acrílica para exteriores con protección UV'], ['Acabado', 'Mate o satinado'], ['Manos', '2'], ['Secado', '3–4 h entre manos'], ['Herramientas', 'Rodillo, brocha, extensión, escalera']],
      warn: 'Evita pintar con sol fuerte de mediodía: la pintura seca muy rápido y quedan marcas.',
      kit: ['Pintura para exteriores', 'Sellador para exteriores', 'Sellador elástico para fisuras', 'Rodillo y extensión', 'Brocha 4"'],
      link: ['visualizador', 'Probar colores en 3D'] }
  ];
  var cur = S[0];
  app.innerHTML = '<div class="surf-pick" role="group" aria-label="Superficie">' + S.map(function (s, i) {
    return '<button class="sp" type="button" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' + (s.ic || '') + '<b>' + s.n + '</b><small>' + s.d + '</small></button>';
  }).join('') + '</div><div class="guia-card" id="gCard"></div>';
  function render() {
    var link = cur.link || ['pintura', 'Calcular cuánta pintura'];
    document.getElementById('gCard').innerHTML =
      '<div class="gsteps"><span class="eyebrow">Paso a paso</span><h2>' + cur.n + '</h2><ol>' + cur.steps.map(function (x) { return '<li><span>' + x + '</span></li>'; }).join('') + '</ol>' +
      '<p class="warn"><b>Error común:</b> ' + cur.warn + '</p></div>' +
      '<div class="dpanel gspec"><h3>Sistema recomendado</h3><dl>' + cur.spec.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('') + '</dl>' +
      '<div class="mbtns"><button class="btn btn-red" id="gKit" type="button">Agregar kit a mi cotización</button><a class="btn btn-ghost" href="' + link[0] + '.html">' + link[1] + '</a></div></div>';
    document.getElementById('gKit').addEventListener('click', function () { C.add('Kit de pintura: ' + cur.n.toLowerCase(), cur.kit, 'guia-pintura'); });
  }
  app.querySelector('.surf-pick').addEventListener('click', function (e) {
    var b = e.target.closest('[data-i]'); if (!b) return;
    cur = S[+b.getAttribute('data-i')];
    this.querySelectorAll('.sp').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    render();
  });
  render();
})();
