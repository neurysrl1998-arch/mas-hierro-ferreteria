/* Más Hierro · Pinta tu foto
   Relleno por zonas con tolerancia y pincel; conserva luz y sombras de la foto.
   Todo se procesa en el navegador: la foto no sale del dispositivo. */
(function () {
  'use strict';
  var app = document.getElementById('fotoApp');
  if (!app) return;
  var C = window.MHCommon, K = window.MHColors;
  var ROOT = C.root;
  var ic = {
    fill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 11 7-7 7 7-7 7z"/><path d="M19 15c0 1.5 1 2.5 1 3.5a1 1 0 0 1-2 0c0-1 1-2 1-3.5Z"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 3 9 12l3 3 9-9z"/><path d="M9 12c-3 0-4 2-4 4s-1 3-2 3c2 2 8 2 9-4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>'
  };
  app.innerHTML =
    '<div class="foto-stage" id="fStage">' +
    '<div class="foto-drop" id="fDrop">' + ic.up + '<b>Sube una foto de tu fachada o tu pared</b><p>Arrástrala aquí o elige un archivo. También puedes probar con nuestra fachada.</p>' +
    '<div class="foto-actions"><label class="btn btn-red" for="fFile">Elegir foto</label><button class="btn btn-ghost" id="fSample" type="button" style="color:#fff">Usar foto de ejemplo</button></div>' +
    '<input id="fFile" type="file" accept="image/*" hidden></div>' +
    '<canvas id="fCanvas" hidden></canvas><canvas class="orig" id="fOrig" hidden></canvas>' +
    '<div class="cmp" id="fCmp" hidden><span>Antes</span><input type="range" id="fSplit" min="0" max="100" value="0" aria-label="Comparar antes y después"><span>Después</span></div>' +
    '</div>' +
    '<div class="dpanel">' +
    '<div><p class="lbl">Herramienta</p><div class="tools-seg" style="margin-top:.5rem"><button type="button" data-t="fill" aria-pressed="true">' + ic.fill + 'Rellenar zona</button><button type="button" data-t="brush" aria-pressed="false">' + ic.brush + 'Pincel</button></div></div>' +
    '<div class="range" id="fTolBox"><span><label for="fTol">Tolerancia</label><b id="fTolV">28</b></span><input type="range" id="fTol" min="4" max="70" value="28"></div>' +
    '<div class="range" id="fSizeBox" hidden><span><label for="fSize">Tamaño del pincel</label><b id="fSizeV">24</b></span><input type="range" id="fSize" min="6" max="80" value="24"></div>' +
    '<div class="sel"><div class="sel-chip" id="fChip" style="width:56px;height:62px"></div><div class="sel-info"><b id="fName" style="font-size:1.5rem">Azul Caribe</b><span id="fCode">MH-504</span></div></div>' +
    '<div class="fam-tabs" id="fTabs"></div><div class="swatches" id="fSw"></div>' +
    '<label class="custom" for="fCustom"><input type="color" id="fCustom" value="#1f8fb5"><span>Iguala tu color<small>Elige cualquier tono</small></span></label>' +
    '<div class="foto-actions"><button class="mini-btn" id="fUndo" type="button" disabled>Deshacer</button><button class="mini-btn" id="fClear" type="button" disabled>Quitar colores</button><label class="mini-btn" for="fFile" style="cursor:pointer">Cambiar foto</label></div>' +
    '<div class="foto-actions"><button class="btn btn-red" id="fCart" type="button" disabled>Cotizar estos colores</button><a class="btn btn-ghost" id="fSave" href="#" download="mi-casa-mas-hierro.png" style="color:#fff">Guardar imagen</a></div>' +
    '<p class="fnote">Tu foto se procesa en este dispositivo y no se sube a ningún servidor.</p>' +
    '</div>';

  var $ = function (id) { return document.getElementById(id); };
  var cv = $('fCanvas'), ctx = cv.getContext('2d', { willReadFrequently: true }), ov = $('fOrig'), octx = ov.getContext('2d');
  var W = 0, H = 0, orig = null, lum = null, layers = [], tool = 'fill';
  var color = { hex: '#1F8FB5', name: 'Azul Caribe', code: 'MH-504' };

  function setColor(c) {
    color = c; $('fChip').style.setProperty('--c', c.hex); $('fName').textContent = c.name; $('fCode').textContent = c.code + ' · ' + c.hex.toUpperCase();
  }
  setColor(color);
  var pk = K.picker({ tabs: $('fTabs'), grid: $('fSw'), family: 4, selected: color.hex, onPick: setColor });
  $('fCustom').addEventListener('input', function (e) { pk.select(null); setColor({ hex: e.target.value.toUpperCase(), name: 'Color igualado', code: 'MH-IG' }); });

  function load(src) {
    var img = new Image();
    img.onload = function () {
      var max = 1400, s = Math.min(1, max / Math.max(img.width, img.height));
      W = cv.width = ov.width = Math.round(img.width * s); H = cv.height = ov.height = Math.round(img.height * s);
      ctx.drawImage(img, 0, 0, W, H);
      orig = ctx.getImageData(0, 0, W, H);
      octx.putImageData(orig, 0, 0);
      lum = new Float32Array(W * H);
      for (var i = 0, p = 0; i < W * H; i++, p += 4) lum[i] = (0.2126 * orig.data[p] + 0.7152 * orig.data[p + 1] + 0.0722 * orig.data[p + 2]) / 255;
      layers = []; $('fDrop').hidden = true; cv.hidden = false; ov.hidden = false; $('fCmp').hidden = false; $('fSplit').value = 0;
      split(); render();
      C.toast('Toca una zona de la foto para pintarla.');
    };
    img.onerror = function () { C.toast('No pudimos abrir esa imagen. Prueba con una foto JPG o PNG.'); };
    img.src = src;
  }
  $('fFile').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader(); r.onload = function () { load(r.result); }; r.readAsDataURL(f); e.target.value = '';
  });
  $('fSample').addEventListener('click', function () { load(ROOT + 'assets/fachada.jpg'); });
  var stageEl = $('fStage');
  ['dragenter', 'dragover'].forEach(function (ev) { stageEl.addEventListener(ev, function (e) { e.preventDefault(); $('fDrop').classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { stageEl.addEventListener(ev, function (e) { e.preventDefault(); $('fDrop').classList.remove('drag'); }); });
  stageEl.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f && /^image\//.test(f.type)) { var r = new FileReader(); r.onload = function () { load(r.result); }; r.readAsDataURL(f); } });

  /* Recoloreado conservando la luz: color objetivo × (luminancia del píxel ÷ luminancia media de la zona) */
  function render() {
    if (!orig) return;
    var out = ctx.createImageData(W, H), d = out.data, o = orig.data;
    d.set(o);
    layers.forEach(function (L) {
      var rgb = K.hexToRgb(L.hex), m = L.mask, ref = L.ref || 0.5;
      for (var i = 0, p = 0; i < m.length; i++, p += 4) {
        var a = m[i]; if (!a) continue;
        var k = Math.pow(lum[i] / ref, 0.85), al = a / 255;
        d[p] = d[p] * (1 - al) + Math.min(255, rgb[0] * 255 * k) * al;
        d[p + 1] = d[p + 1] * (1 - al) + Math.min(255, rgb[1] * 255 * k) * al;
        d[p + 2] = d[p + 2] * (1 - al) + Math.min(255, rgb[2] * 255 * k) * al;
      }
    });
    ctx.putImageData(out, 0, 0);
    $('fUndo').disabled = !layers.length; $('fClear').disabled = !layers.length; $('fCart').disabled = !layers.length;
  }
  function refLum(mask) {
    var s = 0, n = 0;
    for (var i = 0; i < mask.length; i++) if (mask[i] > 127) { s += lum[i]; n++; }
    return n ? Math.max(0.08, s / n) : 0.5;
  }
  function feather(mask) {
    var out = new Uint8ClampedArray(mask.length);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var s = 0, n = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        s += mask[yy * W + xx]; n++;
      }
      out[y * W + x] = s / n;
    }
    return out;
  }
  function flood(x0, y0) {
    var tol = +$('fTol').value * 2.2, o = orig.data, mask = new Uint8ClampedArray(W * H), seen = new Uint8Array(W * H);
    var p0 = (y0 * W + x0) * 4, r0 = o[p0], g0 = o[p0 + 1], b0 = o[p0 + 2], t2 = tol * tol;
    var stack = [x0, y0];
    while (stack.length) {
      var y = stack.pop(), x = stack.pop(), xl = x;
      while (xl >= 0 && ok(xl, y)) xl--;
      xl++;
      var up = false, dn = false;
      for (var xx = xl; xx < W && ok(xx, y); xx++) {
        var i = y * W + xx; seen[i] = 1; mask[i] = 255;
        if (y > 0) { if (ok(xx, y - 1)) { if (!up) { stack.push(xx, y - 1); up = true; } } else up = false; }
        if (y < H - 1) { if (ok(xx, y + 1)) { if (!dn) { stack.push(xx, y + 1); dn = true; } } else dn = false; }
      }
    }
    function ok(x, y) {
      var i = y * W + x; if (seen[i]) return false;
      var p = i * 4, dr = o[p] - r0, dg = o[p + 1] - g0, db = o[p + 2] - b0;
      return dr * dr + dg * dg + db * db <= t2;
    }
    return feather(mask);
  }
  function pos(e) {
    var r = cv.getBoundingClientRect();
    return { x: Math.max(0, Math.min(W - 1, Math.floor((e.clientX - r.left) / r.width * W))), y: Math.max(0, Math.min(H - 1, Math.floor((e.clientY - r.top) / r.height * H))) };
  }
  var painting = null;
  function stamp(L, x, y) {
    var rad = +$('fSize').value * W / cv.getBoundingClientRect().width / 2, r2 = rad * rad;
    for (var yy = Math.max(0, Math.floor(y - rad)); yy <= Math.min(H - 1, Math.ceil(y + rad)); yy++)
      for (var xx = Math.max(0, Math.floor(x - rad)); xx <= Math.min(W - 1, Math.ceil(x + rad)); xx++) {
        var d2 = (xx - x) * (xx - x) + (yy - y) * (yy - y); if (d2 > r2) continue;
        var a = 255 * Math.min(1, (1 - Math.sqrt(d2) / rad) * 2.5), i = yy * W + xx;
        if (a > L.mask[i]) L.mask[i] = a;
      }
  }
  cv.addEventListener('pointerdown', function (e) {
    if (!orig) return;
    var p = pos(e);
    if (tool === 'fill') {
      var m = flood(p.x, p.y);
      layers.push({ hex: color.hex, name: color.name, code: color.code, mask: m, ref: refLum(m) });
      render();
    } else {
      cv.setPointerCapture(e.pointerId);
      painting = { hex: color.hex, name: color.name, code: color.code, mask: new Uint8ClampedArray(W * H), ref: 0, last: p };
      layers.push(painting); stamp(painting, p.x, p.y); painting.ref = refLum(painting.mask) || 0.5; render();
    }
  });
  cv.addEventListener('pointermove', function (e) {
    if (!painting) return;
    var p = pos(e), l = painting.last, steps = Math.max(1, Math.ceil(Math.hypot(p.x - l.x, p.y - l.y) / 4));
    for (var s = 1; s <= steps; s++) stamp(painting, l.x + (p.x - l.x) * s / steps, l.y + (p.y - l.y) * s / steps);
    painting.last = p; render();
  });
  function endPaint() { if (painting) { painting.ref = refLum(painting.mask); painting = null; render(); } }
  cv.addEventListener('pointerup', endPaint); cv.addEventListener('pointercancel', endPaint);

  function split() { ov.style.clipPath = 'inset(0 ' + (100 - +$('fSplit').value) + '% 0 0)'; positionOrig(); }
  function positionOrig() { ov.style.width = cv.clientWidth + 'px'; ov.style.height = cv.clientHeight + 'px'; ov.style.left = cv.offsetLeft + 'px'; ov.style.top = cv.offsetTop + 'px'; }
  $('fSplit').addEventListener('input', split);
  window.addEventListener('resize', positionOrig);

  app.querySelectorAll('[data-t]').forEach(function (b) {
    b.addEventListener('click', function () {
      tool = b.getAttribute('data-t');
      app.querySelectorAll('[data-t]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $('fTolBox').hidden = tool !== 'fill'; $('fSizeBox').hidden = tool !== 'brush';
    });
  });
  $('fTol').addEventListener('input', function () { $('fTolV').textContent = this.value; });
  $('fSize').addEventListener('input', function () { $('fSizeV').textContent = this.value; });
  $('fUndo').addEventListener('click', function () { layers.pop(); render(); });
  $('fClear').addEventListener('click', function () { layers = []; render(); });
  $('fSave').addEventListener('click', function (e) { if (!orig) { e.preventDefault(); return; } this.href = cv.toDataURL('image/png'); });
  $('fCart').addEventListener('click', function () {
    var seen = {}, lines = [];
    layers.forEach(function (L) { if (!seen[L.hex]) { seen[L.hex] = 1; lines.push(L.name + ' ' + L.code + ' (' + L.hex + ')'); } });
    C.add('Colores probados en mi foto', lines, 'foto');
  });
})();
