/* Más Hierro · Zona de contratistas: registro (Netlify Forms) e historial local de cotizaciones */
(function () {
  'use strict';
  var C = window.MHCommon;
  var f = document.getElementById('ctrForm'), ok = document.getElementById('ctrOk'), list = document.getElementById('histList');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = f.nombre.value.trim(), tel = f.telefono.value.trim();
    ok.hidden = false;
    if (!name || !tel) { ok.classList.add('err'); ok.textContent = 'Escribe tu nombre y tu teléfono para registrarte.'; return; }
    ok.classList.remove('err'); ok.textContent = 'Enviando…';
    var data = {}; new FormData(f).forEach(function (v, k) { if (k !== 'form-name' && k !== 'bot-field') data[k] = v; });
    C.store('mh-perfil', { nombre: name, telefono: tel });
    C.sendForm('contratistas', data).then(function (r) {
      ok.textContent = r.demo ? 'Vista de demostración: en el sitio publicado tu registro llega a la tienda y te contactamos al ' + tel + '.' : 'Listo, ' + name.split(' ')[0] + '. Recibimos tu registro y te contactaremos al ' + tel + '.';
      if (!r.demo) f.reset();
    }).catch(function () { ok.classList.add('err'); ok.textContent = 'No pudimos enviar el registro. Revisa tu conexión e inténtalo de nuevo.'; });
  });
  function render() {
    var h = C.store('mh-historial') || [];
    if (!h.length) { list.innerHTML = '<p class="hist-empty">Aún no has enviado cotizaciones desde este dispositivo. Cuando envíes una por WhatsApp o por formulario, aparecerá aquí para repetirla con un toque.</p>'; return; }
    list.innerHTML = h.map(function (e, i) {
      var d = new Date(e.t);
      return '<div class="hist-item"><header><span>' + d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + e.items.length + (e.items.length === 1 ? ' grupo' : ' grupos') + '</span><button class="mini-btn" type="button" data-r="' + i + '">Repetir</button></header><ul>' +
        e.items.map(function (it) { return '<li>' + C.esc(it.title) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
  }
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]'); if (!b) return;
    var h = C.store('mh-historial') || [], entry = h[+b.getAttribute('data-r')]; if (!entry) return;
    entry.items.forEach(function (it) { C.add(it.title, it.lines, it.src); });
    C.open();
  });
  render();
  window.addEventListener('storage', render);
})();
