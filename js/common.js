/* Más Hierro · partes comunes a todas las páginas:
   cabecera, pie, carrito de cotización, avisos, "abierto ahora" y envío de formularios. */
(function () {
  'use strict';
  var CFG = window.MH_CONFIG || {};
  var TOOLS = window.MH_TOOLS || { cats: {}, tools: [] };
  var ROOT = document.body.getAttribute('data-root') || '';
  var PAGE = document.body.getAttribute('data-page') || 'inicio';
  var HOME = ROOT || './';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(key, val) {
    try {
      if (val === undefined) { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  var ICON = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3h8v3H8z"/><path d="M6 5H4v16h16V5h-2"/><path d="M8 11h8M8 15h8M8 19h5"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.6 8.2c.3-.6.6-.6.9-.6h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.6l-.5.6c-.1.2-.2.3 0 .6.6 1 1.5 1.9 2.6 2.4.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .6-.3 1.3-.9 1.6-.6.3-1.6.5-3.6-.4-2.3-1-3.9-3.3-4.1-3.6-.2-.3-1-1.4-1-2.6 0-.8.3-1.3.6-1.7Z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M4 12.5l5 5L20 6.5"/></svg>'
  };

  /* ---------- Cabecera ---------- */
  function link(href) { return href.charAt(0) === '#' ? (ROOT ? ROOT + href : href) : ROOT + href; }
  function renderHeader() {
    var el = $('mh-header');
    if (!el) return;
    var nav = [
      ['#preparador', 'Preparador 3D', 'hot'],
      ['#herramientas', 'Herramientas', 'herramientas'],
      ['proyectos.html', 'Proyectos', 'proyectos'],
      ['#ofertas', 'Ofertas', 'ofertas'],
      ['contratistas.html', 'Contratistas', 'contratistas'],
      ['#contacto', 'Contacto', 'contacto']
    ];
    var cur = document.body.getAttribute('data-cat') ? 'herramientas' : PAGE;
    el.outerHTML =
      '<header class="top"><div class="wrap">' +
      '<a class="brand" href="' + HOME + '" aria-label="Más Hierro Ferretería, inicio"><img class="logo" src="' + ROOT + 'assets/logo.webp" width="900" height="277" alt="Más Hierro Ferretería"></a>' +
      '<nav class="links" id="mainNav" aria-label="Principal">' +
      nav.map(function (n) {
        var hot = n[2] === 'hot';
        return '<a href="' + link(n[0]) + '"' + (hot ? ' class="hot"' : '') + (cur === n[2] ? ' aria-current="page"' : '') + '>' + n[1] + (hot ? ' <em>Nuevo</em>' : '') + '</a>';
      }).join('') +
      '</nav>' +
      '<button class="cart-btn" id="cartBtn" type="button" aria-label="Abrir mi cotización">' + ICON.cart + '<span class="cart-label">Mi cotización</span><b id="cartCount">0</b></button>' +
      '<button class="menu-btn" id="menuBtn" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mainNav"><span></span><span></span><span></span></button>' +
      '</div></header>';
    var btn = $('menuBtn'), navEl = $('mainNav');
    btn.addEventListener('click', function () { var open = navEl.classList.toggle('open'); btn.setAttribute('aria-expanded', open); });
    navEl.addEventListener('click', function (e) { if (e.target.closest('a')) { navEl.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });
    $('cartBtn').addEventListener('click', openDrawer);
  }

  /* ---------- Pie ---------- */
  function renderFooter() {
    var el = $('mh-footer');
    if (!el) return;
    var byCat = {};
    TOOLS.tools.forEach(function (t) { (byCat[t.cat] = byCat[t.cat] || []).push(t); });
    var cols = Object.keys(TOOLS.cats).map(function (k) {
      return '<div><h4>' + esc(TOOLS.cats[k].name) + '</h4>' + (byCat[k] || []).map(function (t) {
        return '<a href="' + ROOT + t.href + '">' + esc(t.short || t.name) + '</a>';
      }).join('') + '</div>';
    }).join('');
    el.outerHTML =
      '<footer><div class="wrap">' +
      '<div class="fgrid">' +
      '<div class="fbrand"><img class="logo" src="' + ROOT + 'assets/logo.webp" width="900" height="277" alt="Más Hierro Ferretería" loading="lazy">' +
      '<p>Fiabilidad, calidad y confianza para tu hogar y tu obra.</p><div data-open-status></div>' +
      '<p class="faddr">' + esc(CFG.direccion || '') + '<br>Tel. y WhatsApp: ' + esc(CFG.telefono || '') + '</p></div>' +
      cols +
      '<div><h4>Tienda</h4><a href="' + ROOT + 'proyectos.html">Listas por proyecto</a><a href="' + ROOT + 'contratistas.html">Zona de contratistas</a><a href="' + link('#ofertas') + '">Ofertas de la semana</a><a href="' + link('#ayuda') + '">Preguntas frecuentes</a><a href="' + link('#cotizar') + '">Cotizar</a></div>' +
      '</div>' +
      '<p class="legal">© 2026 ' + esc(CFG.nombre || 'Más Hierro Ferretería') + '. Los cálculos de las herramientas son orientativos: confírmalos con nuestro personal.</p>' +
      '</div></footer>';
  }

  /* ---------- Carrito de cotización ---------- */
  var cart = store('mh-cart') || [];
  function saveCart() { store('mh-cart', cart); updateCount(); renderDrawer(); }
  function updateCount() {
    var n = cart.length;
    var c = $('cartCount'); if (c) { c.textContent = n; c.parentNode.classList.toggle('has', n > 0); }
    var f = $('cartFab'); if (f) { f.hidden = n === 0; f.querySelector('b').textContent = n; }
  }
  function add(title, lines, src) {
    cart.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: title, lines: lines || [], src: src || PAGE, t: Date.now() });
    saveCart();
    toast('Agregado a tu cotización: ' + title, 'Ver cotización', openDrawer);
    var b = $('cartBtn'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  }
  function cartText() {
    var p = store('mh-perfil') || {};
    var out = ['Cotización · ' + (CFG.nombre || 'Más Hierro Ferretería')];
    if (p.nombre) out.push('Nombre: ' + p.nombre);
    if (p.telefono) out.push('Teléfono: ' + p.telefono);
    out.push('');
    cart.forEach(function (it, i) {
      out.push((i + 1) + ') ' + it.title);
      it.lines.forEach(function (l) { out.push('   • ' + l); });
    });
    var notes = $('dNotes') ? $('dNotes').value.trim() : '';
    if (notes) { out.push(''); out.push('Notas: ' + notes); }
    return out.join('\n');
  }

  function buildDrawer() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="drawer-scrim" id="dScrim" hidden></div>' +
      '<aside class="drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-labelledby="dTitle" hidden>' +
      '<div class="dhead"><div><span class="eyebrow">Mi cotización</span><h3 id="dTitle">Materiales para cotizar</h3></div>' +
      '<button class="dclose" id="dClose" type="button" aria-label="Cerrar">' + ICON.x + '</button></div>' +
      '<div class="dbody">' +
      '<div class="dempty" id="dEmpty">' + ICON.cart + '<b>Tu cotización está vacía</b><p>Usa las calculadoras, el preparador de pintura o las listas por proyecto y agrega aquí lo que necesitas.</p><a class="btn btn-red" href="' + link('#herramientas') + '">Ver herramientas</a></div>' +
      '<ol class="ditems" id="dItems"></ol>' +
      '<div class="dform" id="dForm">' +
      '<div class="field full"><label for="dNotes">Notas o productos adicionales</label><textarea id="dNotes" rows="3" placeholder="Ej.: 2 brochas de 3&quot;, entrega el sábado…"></textarea></div>' +
      '<div class="field"><label for="dName">Nombre</label><input id="dName" autocomplete="name" placeholder="Juan Pérez"></div>' +
      '<div class="field"><label for="dTel">Teléfono / WhatsApp</label><input id="dTel" type="tel" autocomplete="tel" placeholder="809-000-0000"></div>' +
      '</div></div>' +
      '<div class="dfoot" id="dFoot"><p class="dstatus" id="dStatus" aria-live="polite"></p>' +
      '<div class="dbtns"><a class="btn btn-wa" id="dWa" target="_blank" rel="noopener" href="#">' + ICON.wa + 'Enviar por WhatsApp</a>' +
      '<button class="btn btn-red" id="dSend" type="button">Enviar por formulario</button></div>' +
      '<button class="dclear" id="dClear" type="button">Vaciar cotización</button></div>' +
      '</aside>' +
      '<button class="cart-fab" id="cartFab" type="button" hidden aria-label="Abrir mi cotización">' + ICON.cart + '<b>0</b></button>' +
      '<div class="toast" id="mhToast" role="status" hidden><span></span><button type="button"></button></div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var p = store('mh-perfil') || {};
    $('dName').value = p.nombre || ''; $('dTel').value = p.telefono || '';
    function saveProfile() { store('mh-perfil', { nombre: $('dName').value.trim(), telefono: $('dTel').value.trim() }); refreshWa(); }
    $('dName').addEventListener('input', saveProfile);
    $('dTel').addEventListener('input', saveProfile);
    $('dNotes').addEventListener('input', refreshWa);
    $('dClose').addEventListener('click', closeDrawer);
    $('dScrim').addEventListener('click', closeDrawer);
    $('cartFab').addEventListener('click', openDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('cartDrawer').hidden) closeDrawer(); });
    $('dItems').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]'); if (!b) return;
      cart = cart.filter(function (x) { return x.id !== b.getAttribute('data-del'); });
      saveCart();
    });
    var clearArm = false;
    $('dClear').addEventListener('click', function () {
      if (!clearArm) { clearArm = true; this.textContent = 'Toca otra vez para vaciar'; var self = this; setTimeout(function () { clearArm = false; self.textContent = 'Vaciar cotización'; }, 2500); return; }
      cart = []; saveCart(); clearArm = false; this.textContent = 'Vaciar cotización';
    });
    $('dWa').addEventListener('click', function (e) {
      if (!cart.length) { e.preventDefault(); return; }
      history(); status('Se abrió WhatsApp con tu lista. Si no se abrió, escríbenos al ' + CFG.telefono + '.');
    });
    $('dSend').addEventListener('click', function () {
      var name = $('dName').value.trim(), tel = $('dTel').value.trim();
      if (!cart.length) return;
      if (!name || !tel) { status('Escribe tu nombre y tu teléfono para enviar la cotización.', true); (name ? $('dTel') : $('dName')).focus(); return; }
      var btn = this; btn.disabled = true; status('Enviando…');
      sendForm('cotizacion', { nombre: name, telefono: tel, tipo_cliente: 'Cotización desde la web', pedido: cartText() })
        .then(function (r) {
          history();
          if (r.demo) status('Vista de demostración: en el sitio publicado esta cotización llega a la tienda. Te contactaríamos al ' + tel + '.');
          else { status('Listo, ' + name.split(' ')[0] + '. Recibimos tu cotización y te contactaremos al ' + tel + '.'); cart = []; saveCart(); }
        })
        .catch(function () { status('No pudimos enviar la cotización. Revisa tu conexión o envíala por WhatsApp.', true); })
        .then(function () { btn.disabled = false; });
    });
    renderDrawer();
  }
  function status(t, err) { var s = $('dStatus'); s.textContent = t; s.classList.toggle('err', !!err); }
  function refreshWa() {
    var a = $('dWa'); if (!a) return;
    a.href = 'https://wa.me/' + (CFG.whatsapp || '') + '?text=' + encodeURIComponent(cartText());
    a.classList.toggle('disabled', !cart.length);
  }
  function renderDrawer() {
    if (!$('dItems')) return;
    var empty = !cart.length;
    $('dEmpty').hidden = !empty; $('dForm').hidden = empty; $('dFoot').hidden = empty;
    $('dTitle').textContent = empty ? 'Materiales para cotizar' : cart.length + (cart.length === 1 ? ' grupo de materiales' : ' grupos de materiales');
    $('dItems').innerHTML = cart.map(function (it) {
      return '<li><div class="dit-head"><b>' + esc(it.title) + '</b><button type="button" data-del="' + it.id + '" aria-label="Quitar ' + esc(it.title) + '">' + ICON.x + '</button></div>' +
        (it.lines.length ? '<ul>' + it.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') + '</li>';
    }).join('');
    refreshWa();
  }
  var lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    $('dScrim').hidden = false; $('cartDrawer').hidden = false;
    requestAnimationFrame(function () { document.body.classList.add('drawer-open'); });
    status('');
    setTimeout(function () { $('dClose').focus(); }, 50);
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    setTimeout(function () { $('dScrim').hidden = true; $('cartDrawer').hidden = true; }, 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function history() {
    var h = store('mh-historial') || [];
    h.unshift({ t: Date.now(), items: cart.slice() });
    store('mh-historial', h.slice(0, 30));
  }

  /* ---------- Aviso flotante ---------- */
  var toastT;
  function toast(text, action, fn) {
    var t = $('mhToast'); if (!t) return;
    t.querySelector('span').textContent = text;
    var b = t.querySelector('button');
    b.hidden = !action; b.textContent = action || '';
    b.onclick = function () { t.hidden = true; if (fn) fn(); };
    t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 4200);
  }

  /* ---------- Formularios Netlify ---------- */
  function sendForm(name, data) {
    if (!/netlify\.app$/.test(location.hostname)) return Promise.resolve({ demo: true });
    var body = new URLSearchParams();
    body.append('form-name', name);
    Object.keys(data).forEach(function (k) { body.append(k, data[k]); });
    return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return { demo: false }; });
  }

  /* ---------- ¿Abierto ahora? ---------- */
  var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function toMin(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function fmt12(s) { var m = toMin(s), h = Math.floor(m / 60), mm = m % 60; var ap = h < 12 ? 'a. m.' : 'p. m.'; h = h % 12 || 12; return h + ':' + String(mm).padStart(2, '0') + ' ' + ap; }
  function nowParts() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: CFG.zonaHoraria || undefined, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), m: (+o.hour % 24) * 60 + +o.minute };
    } catch (e) { var n = new Date(); return { d: n.getDay(), m: n.getHours() * 60 + n.getMinutes() }; }
  }
  function openStatus() {
    var H = CFG.horario || {}, n = nowParts(), today = H[n.d];
    if (today && n.m >= toMin(today[0]) && n.m < toMin(today[1])) {
      var left = toMin(today[1]) - n.m;
      return { open: true, label: 'Abierto ahora', sub: left <= 60 ? 'Cierra en ' + left + ' min' : 'Cierra a las ' + fmt12(today[1]), day: n.d };
    }
    for (var k = 0; k < 8; k++) {
      var d = (n.d + k) % 7, h = H[d];
      if (h && (k > 0 || n.m < toMin(h[0]))) {
        return { open: false, label: 'Cerrado ahora', sub: 'Abre ' + (k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + DAYS[d]) + ' a las ' + fmt12(h[0]), day: n.d };
      }
    }
    return { open: false, label: 'Cerrado', sub: '', day: n.d };
  }
  function renderOpen() {
    var s = openStatus();
    document.querySelectorAll('[data-open-status]').forEach(function (el) {
      el.innerHTML = '<span class="ostatus ' + (s.open ? 'open' : 'closed') + '"><i></i><b>' + s.label + '</b>' + (s.sub ? '<span>' + s.sub + '</span>' : '') + '</span>';
    });
    document.querySelectorAll('[data-hours]').forEach(function (el) {
      var H = CFG.horario || {}, order = [1, 2, 3, 4, 5, 6, 0];
      el.innerHTML = order.map(function (d) {
        var h = H[d];
        return '<div class="hrow' + (d === s.day ? ' today' : '') + '"><span>' + DAYS[d].charAt(0).toUpperCase() + DAYS[d].slice(1) + (d === s.day ? ' <small>hoy</small>' : '') + '</span><span>' + (h ? fmt12(h[0]) + ' – ' + fmt12(h[1]) : 'Cerrado') + '</span></div>';
      }).join('');
    });
  }

  /* ---------- Datos de contacto en la página ---------- */
  function fillConfig() {
    document.querySelectorAll('[data-cfg]').forEach(function (el) { var v = CFG[el.getAttribute('data-cfg')]; if (v) el.textContent = v; });
  }

  /* ---------- Herramientas relacionadas ---------- */
  function renderRelated() {
    var el = $('relatedTools'); if (!el) return;
    var cat = document.body.getAttribute('data-cat');
    var list = TOOLS.tools.filter(function (t) { return t.slug !== PAGE; });
    list.sort(function (a, b) { return (b.cat === cat) - (a.cat === cat); });
    el.innerHTML = list.slice(0, 4).map(function (t) {
      var c = TOOLS.cats[t.cat];
      return '<a class="rtool" href="' + ROOT + t.href + '" style="--cat:' + c.color + '"><span class="rt-ic">' + (TOOLS.icons[t.icon] || '') + '</span><span><small>' + esc(c.name) + '</small><b>' + esc(t.name) + '</b></span>' + ICON.arrow + '</a>';
    }).join('');
  }

  /* ---------- Copiar al portapapeles ---------- */
  function copy(text, btn) {
    var done = function () { if (btn) { var o = btn.textContent; btn.textContent = 'Copiado'; setTimeout(function () { btn.textContent = o; }, 1600); } };
    try { navigator.clipboard.writeText(text).then(done, function () { toast('No se pudo copiar. Selecciona el texto manualmente.'); }); }
    catch (e) { toast('No se pudo copiar. Selecciona el texto manualmente.'); }
  }

  window.MHCommon = { add: add, open: openDrawer, toast: toast, sendForm: sendForm, store: store, esc: esc, copy: copy, icons: ICON, root: ROOT, openStatus: openStatus, cart: function () { return cart; } };

  renderHeader(); renderFooter(); buildDrawer(); updateCount(); fillConfig(); renderOpen(); renderRelated();
  setInterval(renderOpen, 60000);
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { var el = $(b.getAttribute('data-copy')); if (el) copy(el.textContent, b); });
  });
  window.addEventListener('storage', function (e) { if (e.key === 'mh-cart') { cart = store('mh-cart') || []; updateCount(); renderDrawer(); } });
})();
