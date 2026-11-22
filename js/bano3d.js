/* Más Hierro · Baño 3D con tuberías visibles (agua fría, caliente y drenaje con flujo animado) */
(function () {
  'use strict';
  var stage = document.getElementById('banoStage');
  if (!stage) return;
  var M = window.MH3D;
  var ctx = M.create(stage, { fov: 36, view: { tx: 0, ty: 0.75, tz: 0, dist: 7.2, yaw: 0.62, pitch: 0.38 }, yawLimit: [-0.4, 1.3], pitchLimit: [0.08, 0.95] });
  if (!ctx) return;
  var scene = ctx.scene;
  ctx.lights({ hemi: 0.7, key: 1.1, keyPos: [3, 7, 5], shadowSize: 5 });
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  var ceramic = new THREE.MeshPhysicalMaterial({ color: M.col('#fbfbf9'), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  var chrome = M.mat('#d9dde2', { m: 1, r: 0.18 });
  var dark = M.mat('#2b2f36', { r: 0.6 });

  /* Texturas de flujo: rayas que se desplazan por el tubo */
  function flowTex() {
    var c = document.createElement('canvas'); c.width = 128; c.height = 8;
    var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 128, 0);
    gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#000'); gr.addColorStop(0.8, '#fff'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 8);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  var PIPE = { fria: '#2f8fff', caliente: '#ff3b2f', drenaje: '#aeb6bf' };
  var flows = [];
  function flowPipe(points, r, kind, parent) {
    var tex = flowTex(), len = 0;
    for (var i = 1; i < points.length; i++) len += new THREE.Vector3().fromArray(points[i]).distanceTo(new THREE.Vector3().fromArray(points[i - 1]));
    tex.repeat.set(Math.max(1, len / 0.35), 1);
    var m = new THREE.MeshStandardMaterial({ color: M.col(PIPE[kind]), roughness: 0.35, emissive: new THREE.Color(kind === 'drenaje' ? 0x9fb4c8 : PIPE[kind]), emissiveMap: tex, emissiveIntensity: kind === 'drenaje' ? 0.5 : 1.1 });
    var p = M.pipe(points, r, m, parent);
    flows.push({ tex: tex, speed: kind === 'drenaje' ? -0.6 : -1.4 });
    // codos visibles
    for (var j = 1; j < points.length - 1; j++) { var s = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 12, 8), M.mat(PIPE[kind], { r: 0.4 })); s.position.fromArray(points[j]); parent.add(s); }
    return p;
  }

  /* Estructura fija */
  var room = new THREE.Group(); scene.add(room);
  var dyn = new THREE.Group(); scene.add(dyn);
  var wallMat = M.mat('#e9eef2', { r: 0.8, transparent: true, opacity: 0.22 });
  wallMat.depthWrite = false;
  var tileTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    g.fillStyle = '#d9dde1'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#eef1f3'; g.fillRect(2, 2, 60, 60); g.fillRect(66, 2, 60, 60); g.fillRect(2, 66, 60, 60); g.fillRect(66, 66, 60, 60);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; return t;
  })();
  var floorMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4, transparent: true, opacity: 0.9 });
  var xray = true;

  var W = 3.6, D = 2.6, H = 2.5, T = 0.14;
  function build(o) {
    while (dyn.children.length) dyn.remove(dyn.children[0]);
    while (room.children.length) room.remove(room.children[0]);
    flows.length = 0; drops.length = 0;
    var list = [];
    for (var i = 0; i < o.lavamanos; i++) list.push(['lavamanos', 0.85]);
    for (i = 0; i < o.inodoro; i++) list.push(['inodoro', 0.75]);
    if (o.bidet) list.push(['bidet', 0.65]);
    if (o.banera) list.push(['banera', 1.65]);
    if (o.ducha) list.push(['ducha', 1.0]);
    var total = list.reduce(function (s, x) { return s + x[1]; }, 0);
    W = Math.max(3.2, total + 0.9);
    // piso con espacio debajo para ver el drenaje
    var floor = M.box(W, 0.06, D, floorMat, 0, -0.03, 0, room); floor.receiveShadow = true;
    tileTex.repeat.set(W / 0.6, D / 0.6);
    M.box(W + T, 0.04, D + T, M.mat('#3a3f47'), 0, -0.42, 0, room).receiveShadow = true;
    var back = M.box(W + T, H, T, wallMat, 0, H / 2 - 0.02, -D / 2 - T / 2, room); back.castShadow = false;
    var left = M.box(T, H, D, wallMat, -W / 2 - T / 2, H / 2 - 0.02, 0, room); left.castShadow = false;
    [back, left].forEach(function (w) { var e = new THREE.LineSegments(new THREE.EdgesGeometry(w.geometry), new THREE.LineBasicMaterial({ color: 0x8fa0b2, transparent: true, opacity: 0.5 })); e.position.copy(w.position); room.add(e); });
    var mirror = null;

    // colocar aparatos
    var x = -W / 2 + 0.45, zb = -D / 2, inlets = [];
    list.forEach(function (it) {
      var cx = x + it[1] / 2, g = new THREE.Group(); g.position.set(cx, 0, zb); dyn.add(g);
      if (it[0] === 'inodoro') {
        M.cyl(0.16, 0.2, 0.36, ceramic, 0, 0.18, 0.42, g);
        var bowl = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 16), ceramic); bowl.scale.set(1, 0.5, 1.25); bowl.position.set(0, 0.38, 0.45); bowl.castShadow = true; g.add(bowl);
        M.box(0.4, 0.03, 0.5, ceramic, 0, 0.44, 0.45, g);
        M.box(0.44, 0.4, 0.18, ceramic, 0, 0.66, 0.11, g);
        M.box(0.46, 0.04, 0.2, ceramic, 0, 0.88, 0.11, g);
        M.cyl(0.03, 0.03, 0.02, chrome, 0, 0.91, 0.11, g);
        inlets.push({ x: cx, fy: 0.2, hy: null, drain: 0.45, big: true, kind: it[0] });
      } else if (it[0] === 'bidet') {
        M.cyl(0.15, 0.18, 0.34, ceramic, 0, 0.17, 0.32, g);
        var bb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), ceramic); bb.scale.set(1, 0.45, 1.3); bb.position.set(0, 0.36, 0.32); g.add(bb);
        M.cyl(0.015, 0.015, 0.12, chrome, 0, 0.47, 0.12, g);
        inlets.push({ x: cx, fy: 0.25, hy: 0.25, drain: 0.32, kind: it[0] });
      } else if (it[0] === 'lavamanos') {
        M.box(0.72, 0.78, 0.46, M.mat('#7a5a3c', { r: 0.5 }), 0, 0.39, 0.25, g);
        M.box(0.004, 0.6, 0.004, dark, 0, 0.42, 0.481, g);
        M.box(0.78, 0.06, 0.5, ceramic, 0, 0.81, 0.26, g);
        var sink = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.05, 24), M.mat('#c9d3dc', { r: 0.2 })); sink.position.set(0, 0.825, 0.28); g.add(sink);
        M.cyl(0.018, 0.018, 0.22, chrome, 0, 0.94, 0.08, g);
        var sp = M.box(0.03, 0.03, 0.14, chrome, 0, 1.04, 0.14, g);
        mirror = M.box(0.6, 0.75, 0.02, M.mat('#a9c3d6', { m: 0.9, r: 0.08 }), 0, 1.55, 0.02, g);
        inlets.push({ x: cx, fy: 0.55, hy: 0.55, drain: 0.25, kind: it[0] });
      } else if (it[0] === 'banera') {
        M.box(1.6, 0.55, 0.75, ceramic, 0, 0.275, 0.4, g);
        var inner = M.box(1.45, 0.02, 0.6, M.mat('#7fc8e8', { r: 0.05, transparent: true, opacity: 0.85 }), 0, 0.5, 0.4, g); inner.castShadow = false;
        M.cyl(0.02, 0.02, 0.18, chrome, -0.6, 0.65, 0.06, g);
        inlets.push({ x: cx - 0.6, fy: 0.62, hy: 0.62, drain: 0.4, kind: it[0], dx: -0.6 });
      } else if (it[0] === 'ducha') {
        M.box(0.95, 0.06, 0.95, ceramic, 0, 0.03, 0.48, g);
        M.cyl(0.04, 0.04, 0.005, chrome, 0, 0.065, 0.48, g);
        var glass = M.box(0.02, 1.9, 0.95, new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.25, roughness: 0, metalness: 0 }), -0.47, 1.0, 0.48, g); glass.castShadow = false;
        M.cyl(0.015, 0.015, 1.1, chrome, 0.3, 1.5, 0.04, g);
        M.box(0.025, 0.025, 0.3, chrome, 0.3, 2.05, 0.18, g);
        var head = M.cyl(0.11, 0.08, 0.04, chrome, 0.3, 2.02, 0.32, g);
        M.cyl(0.05, 0.05, 0.04, chrome, 0.3, 1.05, 0.04, g).rotation.x = Math.PI / 2;
        for (var k = 0; k < 26; k++) {
          var dm = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), M.mat('#9fd6ff', { transparent: true, opacity: 0.7 }));
          g.add(dm); drops.push({ m: dm, x0: 0.3, z0: 0.32, t: Math.random() });
        }
        inlets.push({ x: cx + 0.3, fy: 1.05, hy: 1.05, drain: 0.48, kind: it[0], dx: 0.3 });
      }
      x += it[1];
    });

    // calentador
    var heaterPos = null;
    if (o.calentador) {
      var hg = new THREE.Group(); hg.position.set(-W / 2 + 0.3, 1.55, -D / 2 + 0.35); dyn.add(hg);
      M.cyl(0.24, 0.24, 0.8, M.mat('#f4f4f2', { r: 0.4 }), 0, 0, 0, hg);
      M.cyl(0.245, 0.245, 0.06, M.mat('#c62a20'), 0, 0.2, 0, hg);
      M.box(0.12, 0.08, 0.02, dark, 0, -0.1, 0.24, hg);
      heaterPos = [-W / 2 + 0.3, 1.1, -D / 2 + 0.35];
    }

    // tuberías dentro de la pared del fondo y bajo el piso
    var zc = -D / 2 - 0.04, zh = -D / 2 - 0.09, yc = 0.4, yh = 0.48;
    if (inlets.length) {
      var xs = inlets.map(function (p) { return p.x; }), xmax = Math.max.apply(null, xs);
      var cold = [[-W / 2 - 0.6, yc, zc], [xmax, yc, zc]];
      flowPipe(cold, 0.036, 'fria', dyn);
      inlets.forEach(function (p) {
        flowPipe([[p.x, yc, zc], [p.x, p.fy, zc], [p.x, p.fy, -D / 2 + 0.1]], 0.028, 'fria', dyn);
      });
      if (o.calentador) {
        var hot = inlets.filter(function (p) { return p.hy != null; });
        flowPipe([[-W / 2 - 0.6, 1.0, zc], [heaterPos[0], 1.0, zc], [heaterPos[0], 1.0, heaterPos[2]], [heaterPos[0], 1.18, heaterPos[2]]], 0.03, 'fria', dyn);
        if (hot.length) {
          var hx = Math.max.apply(null, hot.map(function (p) { return p.x; })) + 0.08;
          flowPipe([[heaterPos[0], heaterPos[1], heaterPos[2]], [heaterPos[0], yh, heaterPos[2]], [heaterPos[0], yh, zh], [hx, yh, zh]], 0.034, 'caliente', dyn);
          hot.forEach(function (p) { flowPipe([[p.x + 0.08, yh, zh], [p.x + 0.08, p.hy + 0.05, zh], [p.x + 0.08, p.hy + 0.05, -D / 2 + 0.1]], 0.028, 'caliente', dyn); });
        }
      }
      // drenajes
      var yd = -0.22, zd = -D / 2 + 0.2;
      var big = inlets.some(function (p) { return p.big; });
      flowPipe([[xmax + 0.1, yd, zd], [-W / 2 - 0.7, yd - 0.05, zd]], big ? 0.08 : 0.05, 'drenaje', dyn);
      inlets.forEach(function (p) {
        var px = p.x - (p.dx || 0);
        flowPipe([[px, 0.02, -D / 2 + p.drain], [px, yd, -D / 2 + p.drain], [px, yd, zd]], p.big ? 0.075 : 0.045, 'drenaje', dyn);
      });
    }
    ctx.setView({ dist: 3.9 + W * 0.6, tx: 0, tz: 0 });
    setXray(xray);
  }
  var drops = [];
  function setXray(on) {
    xray = on;
    wallMat.opacity = on ? 0.16 : 0.95; wallMat.depthWrite = !on;
    floorMat.opacity = on ? 0.7 : 1;
    var b = document.getElementById('banoXray'); if (b) { b.setAttribute('aria-pressed', on); b.textContent = on ? 'Ocultar tuberías' : 'Ver tuberías'; }
  }
  document.getElementById('banoXray').addEventListener('click', function () { setXray(!xray); });
  document.addEventListener('mh:bano', function (e) { build(e.detail); });
  build(window.MHBano ? window.MHBano.get() : { inodoro: 1, lavamanos: 1, ducha: 1, banera: 0, bidet: 0, calentador: true, distancia: 4 });

  ctx.onFrame(function (dt) {
    flows.forEach(function (f) { f.tex.offset.x += f.speed * dt; });
    drops.forEach(function (d) {
      d.t += dt * 1.3; if (d.t > 1) d.t -= 1;
      var a = d.t * 13.7;
      d.m.position.set(d.x0 + Math.cos(a) * 0.06 * d.t, 2.0 - d.t * 1.93, d.z0 + Math.sin(a) * 0.06 * d.t);
    });
  });
})();
