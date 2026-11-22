/* Más Hierro · Calculadora de materiales: pestañas por área con enlace directo (#pintura, #cable…) */
(function () {
  'use strict';
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.calc-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.calc-panel'));
  if (!tabs.length) return;
  function show(id, focus) {
    if (!panels.some(function (p) { return p.getAttribute('data-panel') === id; })) id = 'pintura';
    tabs.forEach(function (t) { var on = t.getAttribute('data-tab') === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== id; });
    if (location.hash.replace('#', '') !== id) { try { history.replaceState(null, '', '#' + id); } catch (e) { location.hash = id; } }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; show(n.getAttribute('data-tab'), true);
    });
  });
  window.addEventListener('hashchange', function () { show(location.hash.replace('#', '')); });
  show(location.hash.replace('#', '') || 'pintura');
})();
