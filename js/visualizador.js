/* Más Hierro · Visualizador de habitaciones 3D
   Espacios tipo maqueta: sala, cocina, habitación y fachada. Cada superficie pintable
   conoce su área real; al final se calculan los galones por color. */
(function () {
  'use strict';
  var stage = document.getElementById('visStage'), app = document.getElementById('visApp');
  if (!stage || !app) return;
  var C = window.MHCommon, K = window.MHColors, U = window.MHCalc;
  var M = window.MH3D;

  /* ---------- Panel ---------- */
  app.className = 'vis-panel dpanel';
  app.innerHTML =
    '<div><p class="lbl">Superficies de este espacio</p><div class="surf-list" id="visSurfs" style="margin-top:.6rem"></div></div>' +
    '<div><p class="lbl">Carta de colores</p><div class="fam-tabs" id="visTabs" style="margin-top:.6rem"></div></div>' +
    '<div class="swatches" id="visSw"></div>' +
    '<label class="custom" for="visCustom"><input type="color" id="visCustom" value="#1f8fb5"><span>Iguala tu color<small>Aplica cualquier tono a la superficie elegida</small></span></label>' +
    '<div><p class="lbl">Acabado</p><div class="light-seg" id="visFinish" style="margin-top:.5rem"><button type="button" data-f="Mate">Mate</button><button type="button" data-f="Satinado" aria-pressed="true">Satinado</button><button type="button" data-f="Semibrillo">Semibrillo</button></div></div>' +
    '<div><p class="lbl">Luz</p><div class="light-seg" id="visLight" style="margin-top:.5rem"><button type="button" data-l="dia" aria-pressed="true">Día</button><button type="button" data-l="tarde">Tarde</button><button type="button" data-l="noche">Noche</button></div></div>' +
    '<div class="mbtns"><button class="mini-btn" id="visAll" type="button">Aplicar a todas las paredes</button><button class="mini-btn" id="visReset" type="button">Restablecer</button></div>' +
    '<div class="vis-total" id="visTotal"></div>' +
    '<div class="mbtns"><button class="btn btn-red" id="visCart" type="button">Agregar colores a mi cotización</button><a class="btn btn-ghost" id="visShot" href="#" download="mi-espacio-mas-hierro.png">Guardar imagen</a></div>';

  var finish = 'Satinado', light = 'dia', roomKey = 'sala', selected = null;
  var ROUGH = { 'Mate': 0.95, 'Satinado': 0.62, 'Semibrillo': 0.38 };
  function colorInfo(hex) {
    for (var i = 0; i < K.FAMILIES.length; i++) for (var j = 0; j < K.FAMILIES[i].c.length; j++) if (K.FAMILIES[i].c[j].hex.toLowerCase() === hex.toLowerCase()) return K.FAMILIES[i].c[j];
    return { name: 'Color igualado', code: hex.toUpperCase(), hex: hex };
  }

  var ctx = M.create(stage, { fov: 38, capture: true, hover: true, toneMapping: THREE.LinearToneMapping, exposure: 1, view: { tx: 0, ty: 1.2, tz: -0.4, dist: 9.6, yaw: 0.45, pitch: 0.28 }, yawLimit: [-0.9, 0.9], pitchLimit: [0.05, 0.75] });
  var scene = ctx ? ctx.scene : null;

  /* ---------- Construcción de espacios ---------- */
  var ROOMS = {}, surfacesByRoom = {};
  function paintable(room, key, name, mesh, area, def) {
    mesh.userData.pick = true; mesh.userData.key = key;
    mesh.material = M.mat(def, { r: ROUGH[finish] });
    var s = surfacesByRoom[room] = surfacesByRoom[room] || {};
    if (!s[key]) s[key] = { key: key, name: name, area: 0, meshes: [], hex: def, def: def, wall: /pared|fachada|muro|salpicadero/i.test(name) };
    s[key].meshes.push(mesh); s[key].area += area;
    return mesh;
  }
  function plane(w, h, x, y, z, ry, parent) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.mat('#ffffff'));
    m.position.set(x, y, z); m.rotation.y = ry || 0; m.receiveShadow = true;
    parent.add(m); return m;
  }
  function windowAt(parent, x, y, z, ry, w, h) {
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    var fr = M.mat('#f4f4f2', { r: 0.4 });
    M.box(w + 0.12, 0.08, 0.08, fr, 0, h / 2, 0, g); M.box(w + 0.12, 0.1, 0.16, fr, 0, -h / 2, 0.04, g);
    M.box(0.08, h, 0.08, fr, -w / 2, 0, 0, g); M.box(0.08, h, 0.08, fr, w / 2, 0, 0, g); M.box(0.05, h, 0.06, fr, 0, 0, 0, g);
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: M.col('#cfe6f5') }));
    glass.position.z = -0.01; g.add(glass);
    g.userData.glass = glass;
    return g;
  }
  function doorAt(parent, room, x, z, ry) {
    var g = new THREE.Group(); g.position.set(x, 1.05, z); g.rotation.y = ry; parent.add(g);
    var d = M.box(0.9, 2.1, 0.05, M.mat('#fff'), 0, 0, 0, g);
    paintable(room, 'puerta', 'Puerta', d, 1.89, '#FAFAF7');
    var fr = M.mat('#e8e6e0', { r: 0.5 });
    M.box(1.04, 0.07, 0.08, fr, 0, 1.08, 0, g); M.box(0.07, 2.16, 0.08, fr, -0.485, 0, 0, g); M.box(0.07, 2.16, 0.08, fr, 0.485, 0, 0, g);
    M.cyl(0.03, 0.03, 0.12, M.mat('#b8bcc2', { m: 0.9, r: 0.3 }), 0.34, 0, 0.06, g).rotation.x = Math.PI / 2;
    return g;
  }
  var lamps = [];
  function lampLight(parent, x, y, z, intensity, dist) {
    var l = new THREE.PointLight(0xffc68a, 0, dist || 7, 2); l.position.set(x, y, z); parent.add(l);
    l.userData.on = intensity; lamps.push(l); return l;
  }
  function interior(key, W, D, H) {
    var g = new THREE.Group(); scene.add(g); ROOMS[key] = g;
    M.box(W + 0.3, 0.18, D + 0.15, M.mat('#2a2d33', { r: 0.8 }), 0, -0.09, 0.07, g);
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.mat(key === 'cocina' ? '#d9d4cb' : '#b98a5e', { r: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    if (key !== 'cocina') for (var i = -W / 2 + 0.3; i < W / 2; i += 0.6) { var line = M.box(0.006, 0.002, D, M.mat('#9d7148'), i, 0.001, 0, g); line.castShadow = false; }
    else for (var a = -W / 2 + 0.6; a < W / 2; a += 0.6) { M.box(0.008, 0.002, D, M.mat('#bdb7ad'), a, 0.001, 0, g).castShadow = false; M.box(W, 0.002, 0.008, M.mat('#bdb7ad'), 0, 0.001, -D / 2 + (a + W / 2), g).castShadow = false; }
    var back = plane(W, H, 0, H / 2, -D / 2, 0, g);
    var left = plane(D, H, -W / 2, H / 2, 0, Math.PI / 2, g);
    var right = plane(D, H, W / 2, H / 2, 0, -Math.PI / 2, g);
    // espesor de muros (aspecto de maqueta)
    var wallEdge = M.mat('#efece6', { r: 0.9 });
    M.box(0.14, H, D + 0.14, wallEdge, -W / 2 - 0.07, H / 2, 0, g);
    M.box(0.14, H, D + 0.14, wallEdge, W / 2 + 0.07, H / 2, 0, g);
    M.box(W + 0.28, H, 0.14, wallEdge, 0, H / 2, -D / 2 - 0.07, g);
    // zócalo
    var base = M.mat('#f2f0ea', { r: 0.5 });
    M.box(W, 0.1, 0.02, base, 0, 0.05, -D / 2 + 0.01, g); M.box(0.02, 0.1, D, base, -W / 2 + 0.01, 0.05, 0, g); M.box(0.02, 0.1, D, base, W / 2 - 0.01, 0.05, 0, g);
    return { g: g, back: back, left: left, right: right, W: W, D: D, H: H };
  }

  function buildSala() {
    var r = interior('sala', 6, 5, 2.8), g = r.g;
    paintable('sala', 'fondo', 'Pared del fondo', r.back, 16.8, '#ECEAE4');
    paintable('sala', 'izq', 'Pared izquierda', r.left, 14 - 1.92, '#ECEAE4');
    paintable('sala', 'der', 'Pared derecha', r.right, 14 - 1.89, '#ECEAE4');
    windowAt(g, -2.99, 1.5, -0.2, Math.PI / 2, 1.6, 1.2);
    doorAt(g, 'sala', 2.97, 1.2, -Math.PI / 2);
    var fab = M.mat('#5b6370', { r: 0.95 }), fab2 = M.mat('#6b7482', { r: 0.95 });
    M.box(2.4, 0.42, 0.95, fab, 0, 0.25, -2.0, g); M.box(2.4, 0.55, 0.22, fab, 0, 0.66, -2.38, g);
    M.box(0.22, 0.6, 0.95, fab, -1.31, 0.35, -2.0, g); M.box(0.22, 0.6, 0.95, fab, 1.31, 0.35, -2.0, g);
    M.box(1.1, 0.14, 0.8, fab2, -0.57, 0.52, -1.95, g); M.box(1.1, 0.14, 0.8, fab2, 0.57, 0.52, -1.95, g);
    M.box(0.45, 0.4, 0.14, M.mat('#c62a20', { r: 0.9 }), -0.8, 0.78, -2.2, g).rotation.z = 0.15;
    M.box(0.45, 0.4, 0.14, M.mat('#e8a13a', { r: 0.9 }), 0.85, 0.78, -2.2, g).rotation.z = -0.12;
    var rug = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), M.mat('#d8d2c4', { r: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.004, -0.6); rug.receiveShadow = true; g.add(rug);
    var wood = M.mat('#6b4a2f', { r: 0.5 });
    M.box(1.2, 0.06, 0.6, wood, 0, 0.42, -0.6, g); [-0.55, 0.55].forEach(function (x) { [-0.25, 0.25].forEach(function (z) { M.box(0.05, 0.4, 0.05, wood, x, 0.2, -0.6 + z, g); }); });
    // lámpara de pie
    M.cyl(0.18, 0.2, 0.04, M.mat('#222'), 2.2, 0.02, -2.0, g); M.cyl(0.015, 0.015, 1.5, M.mat('#222'), 2.2, 0.77, -2.0, g);
    M.cyl(0.18, 0.25, 0.3, M.mat('#f3ead8', { emissive: '#ffd9a0', ei: 0 }), 2.2, 1.6, -2.0, g).userData.shade = true;
    lampLight(g, 2.2, 1.55, -1.9, 1.4);
    // cuadro y planta
    M.box(1.3, 0.85, 0.04, M.mat('#1d1f23'), 0, 1.75, -2.47, g);
    var art = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.73), M.mat('#2f9fd8')); art.position.set(0, 1.75, -2.445); g.add(art);
    M.box(0.5, 0.73, 0.004, M.mat('#e8a13a'), -0.3, 1.75, -2.442, g);
    M.cyl(0.18, 0.14, 0.4, M.mat('#c9c1b1'), -2.4, 0.2, -2.0, g);
    var leaf = M.mat('#3d7a46', { r: 0.8 });
    [[0, 0.75, 0, 0.32], [0.15, 0.95, 0.05, 0.22], [-0.12, 1.0, -0.05, 0.2]].forEach(function (p) { var s = new THREE.Mesh(new THREE.IcosahedronGeometry(p[3], 0), leaf); s.position.set(-2.4 + p[0], p[1], -2.0 + p[2]); s.castShadow = true; g.add(s); });
    return r;
  }
  function buildCocina() {
    var r = interior('cocina', 6, 5, 2.8), g = r.g;
    paintable('cocina', 'fondo', 'Pared del fondo', r.back, 16.8 - 3.6 * 0.6, '#F3E5BF');
    paintable('cocina', 'izq', 'Pared izquierda', r.left, 14 - 1.44, '#F3E5BF');
    paintable('cocina', 'der', 'Pared derecha', r.right, 14, '#F3E5BF');
    windowAt(g, -2.99, 1.55, 0.4, Math.PI / 2, 1.2, 1.2);
    var cab = [];
    cab.push(M.box(3.8, 0.86, 0.6, M.mat('#fff'), -0.6, 0.47, -2.2, g));
    M.box(3.9, 0.05, 0.64, M.mat('#e9e7e2', { r: 0.25 }), -0.6, 0.925, -2.18, g);
    M.box(3.8, 0.1, 0.55, M.mat('#26282b'), -0.6, 0.05, -2.17, g);
    cab.push(M.box(3.8, 0.72, 0.35, M.mat('#fff'), -0.6, 1.95, -2.32, g));
    var handle = M.mat('#b8bcc2', { m: 0.9, r: 0.3 });
    for (var i = 0; i < 6; i++) { var x = -2.3 + i * 0.66; M.box(0.004, 0.84, 0.004, M.mat('#d8d5ce'), x + 0.33, 0.47, -1.899, g); M.box(0.18, 0.02, 0.03, handle, x + 0.15, 0.75, -1.89, g); M.box(0.004, 0.7, 0.004, M.mat('#d8d5ce'), x + 0.33, 1.95, -2.144, g); M.box(0.02, 0.18, 0.03, handle, x + 0.25, 1.7, -2.13, g); }
    cab.forEach(function (c) { paintable('cocina', 'gabinetes', 'Gabinetes', c, 9.6, '#1F2F4F'); });
    var spl = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.62), M.mat('#fff')); spl.position.set(-0.6, 1.26, -2.495); spl.receiveShadow = true; g.add(spl);
    paintable('cocina', 'salpicadero', 'Salpicadero', spl, 2.36, '#FAFAF7');
    // fregadero, estufa, nevera
    M.box(0.7, 0.02, 0.42, M.mat('#9aa1ab', { m: 0.8, r: 0.25 }), -1.6, 0.955, -2.15, g);
    M.cyl(0.02, 0.02, 0.32, handle, -1.6, 1.1, -2.38, g);
    M.box(0.7, 0.02, 0.5, M.mat('#111'), 0.5, 0.955, -2.15, g);
    [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].forEach(function (p) { var b = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 20), M.mat('#555')); b.rotation.x = Math.PI / 2; b.position.set(0.5 + p[0], 0.97, -2.15 + p[1]); g.add(b); });
    M.box(0.85, 2.0, 0.7, M.mat('#c8ccd2', { m: 0.6, r: 0.3 }), 2.4, 1.0, -2.1, g);
    M.box(0.02, 0.5, 0.03, handle, 2.0, 1.35, -1.74, g);
    M.box(0.85, 0.006, 0.71, M.mat('#8b9099'), 2.4, 1.3, -2.1, g);
    // isla y lámparas
    M.box(1.8, 0.9, 0.8, M.mat('#e9e7e2', { r: 0.3 }), 0, 0.45, 0.2, g);
    [-0.5, 0.5].forEach(function (x) { M.cyl(0.005, 0.005, 0.9, M.mat('#222'), x, 2.35, 0.2, g); M.cyl(0.08, 0.2, 0.22, M.mat('#26282b', { emissive: '#ffd9a0', ei: 0 }), x, 1.8, 0.2, g).userData.shade = true; lampLight(g, x, 1.65, 0.2, 0.9, 5); });
    return r;
  }
  function buildHab() {
    var r = interior('habitacion', 6, 5, 2.8), g = r.g;
    paintable('habitacion', 'fondo', 'Pared de la cama (acento)', r.back, 16.8, '#557A95');
    paintable('habitacion', 'izq', 'Pared izquierda', r.left, 14 - 1.92, '#ECEAE4');
    paintable('habitacion', 'der', 'Pared derecha', r.right, 14 - 1.89, '#ECEAE4');
    var w = windowAt(g, -2.99, 1.5, -0.4, Math.PI / 2, 1.6, 1.2);
    doorAt(g, 'habitacion', 2.97, 1.5, -Math.PI / 2);
    var cur = M.mat('#efe7d6', { r: 1 });
    M.box(0.06, 1.9, 0.5, cur, -2.92, 1.5, -1.5, g); M.box(0.06, 1.9, 0.5, cur, -2.92, 1.5, 0.7, g);
    var wood = M.mat('#7a5a3c', { r: 0.6 });
    M.box(1.8, 0.35, 2.1, wood, 0, 0.2, -1.4, g);
    M.box(1.7, 0.25, 2.0, M.mat('#f5f4f0', { r: 1 }), 0, 0.5, -1.4, g);
    M.box(1.72, 0.08, 1.3, M.mat('#c62a20', { r: 1 }), 0, 0.64, -0.95, g);
    M.box(1.9, 1.0, 0.1, M.mat('#3b3f46', { r: 0.95 }), 0, 0.9, -2.45, g);
    M.box(0.6, 0.18, 0.4, M.mat('#fff', { r: 1 }), -0.42, 0.72, -2.15, g); M.box(0.6, 0.18, 0.4, M.mat('#fff', { r: 1 }), 0.42, 0.72, -2.15, g);
    [-1.3, 1.3].forEach(function (x) {
      M.box(0.5, 0.5, 0.45, wood, x, 0.25, -2.2, g);
      M.cyl(0.07, 0.09, 0.05, M.mat('#222'), x, 0.53, -2.2, g); M.cyl(0.01, 0.01, 0.3, M.mat('#222'), x, 0.7, -2.2, g);
      M.cyl(0.11, 0.16, 0.2, M.mat('#f3ead8', { emissive: '#ffd9a0', ei: 0 }), x, 0.92, -2.2, g).userData.shade = true;
      lampLight(g, x, 0.95, -2.05, 0.8, 4);
    });
    var rug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.6), M.mat('#c9c1b1', { r: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.004, 0.2); g.add(rug);
    return r;
  }
  function buildFachada() {
    var g = new THREE.Group(); scene.add(g); ROOMS.fachada = g;
    var ground = new THREE.Mesh(new THREE.CircleGeometry(16, 48), M.mat('#6f9a4f', { r: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
    M.box(10, 0.06, 2, M.mat('#c9c6bf', { r: 0.9 }), 0, 0.03, 5.6, g);
    M.box(1.6, 0.05, 3, M.mat('#d8d4cb'), 0.9, 0.025, 3.6, g);
    var wallF = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.2), M.mat('#fff')); wallF.position.set(0, 1.6, 2.01); wallF.receiveShadow = true; g.add(wallF);
    var wallS = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), M.mat('#fff')); wallS.position.set(4.01, 1.6, -1); wallS.rotation.y = Math.PI / 2; wallS.receiveShadow = true; g.add(wallS);
    M.box(8, 3.2, 6, M.mat('#dcd8d0'), 0, 1.6, -1, g);
    paintable('fachada', 'fachada', 'Fachada principal', wallF, 25.6 - 1.9 - 2 * 1.68, '#F1E7CF');
    paintable('fachada', 'lateral', 'Pared lateral', wallS, 19.2 - 1.68, '#F1E7CF');
    var corn = M.box(8.6, 0.32, 6.6, M.mat('#fff'), 0, 3.36, -1, g);
    paintable('fachada', 'cornisa', 'Cornisa y bordes', corn, 9.5, '#C62A20');
    // porche
    var colA = M.box(0.35, 2.9, 0.35, M.mat('#fff'), -0.1, 1.45, 3.7, g), colB = M.box(0.35, 2.9, 0.35, M.mat('#fff'), 1.9, 1.45, 3.7, g);
    paintable('fachada', 'columnas', 'Columnas', colA, 4.1, '#FAFAF7'); paintable('fachada', 'columnas', 'Columnas', colB, 4.1, '#FAFAF7');
    var por = M.box(2.8, 0.2, 2.0, M.mat('#fff'), 0.9, 3.0, 3.0, g); paintable('fachada', 'cornisa', 'Cornisa y bordes', por, 2.4, '#C62A20');
    var door = M.box(1.0, 2.15, 0.06, M.mat('#fff'), 0.9, 1.075, 2.04, g); paintable('fachada', 'puerta', 'Puerta principal', door, 2.15, '#5C3A2A');
    lampLight(g, 0.9, 2.6, 2.6, 1.2, 6);
    var bars = [];
    [[-2.4, 1.7], [3.0, 1.7]].forEach(function (p) {
      var w = windowAt(g, p[0], p[1], 2.05, 0, 1.4, 1.2);
      for (var i = -3; i <= 3; i++) bars.push(M.box(0.025, 1.25, 0.025, M.mat('#fff'), p[0] + i * 0.2, p[1], 2.13, g));
      bars.push(M.box(1.5, 0.03, 0.03, M.mat('#fff'), p[0], p[1] + 0.62, 2.13, g), M.box(1.5, 0.03, 0.03, M.mat('#fff'), p[0], p[1] - 0.62, 2.13, g));
    });
    var w2 = windowAt(g, 4.05, 1.7, -1, Math.PI / 2, 1.4, 1.2);
    bars.forEach(function (b) { paintable('fachada', 'rejas', 'Rejas y herrería', b, 0.3, '#26282B'); });
    // muro de verja con portón
    var mw = M.mat('#fff');
    var v1 = M.box(3.6, 0.9, 0.2, mw, -2.6, 0.45, 6.6, g), v2 = M.box(3.0, 0.9, 0.2, mw, 3.5, 0.45, 6.6, g);
    paintable('fachada', 'verja', 'Muro de verja', v1, 3.24 * 2, '#9AA6B2'); paintable('fachada', 'verja', 'Muro de verja', v2, 2.7 * 2, '#9AA6B2');
    for (var j = 0; j < 9; j++) { var gb = M.box(0.03, 1.1, 0.03, M.mat('#fff'), -0.6 + j * 0.25, 0.75, 6.6, g); paintable('fachada', 'rejas', 'Rejas y herrería', gb, 0.15, '#26282B'); }
    // árbol
    M.cyl(0.12, 0.16, 1.6, M.mat('#6b4a2f'), -4.8, 0.8, 4.2, g);
    var lf = M.mat('#3d7a46', { r: 0.9 });
    [[0, 2.1, 0, 0.9], [0.5, 1.8, 0.3, 0.6], [-0.4, 2.4, -0.2, 0.6]].forEach(function (p) { var s = new THREE.Mesh(new THREE.IcosahedronGeometry(p[3], 1), lf); s.position.set(-4.8 + p[0], p[1], 4.2 + p[2]); s.castShadow = true; g.add(s); });
    return { g: g };
  }

  var VIEWS = {
    sala: { tx: 0, ty: 1.15, tz: -0.4, dist: 9.6, yaw: 0.45, pitch: 0.28, yawLimit: [-0.9, 0.9], pitchLimit: [0.05, 0.75] },
    cocina: { tx: 0, ty: 1.2, tz: -0.4, dist: 9.6, yaw: -0.4, pitch: 0.26, yawLimit: [-0.9, 0.9], pitchLimit: [0.05, 0.75] },
    habitacion: { tx: 0, ty: 1.1, tz: -0.4, dist: 9.6, yaw: 0.5, pitch: 0.3, yawLimit: [-0.9, 0.9], pitchLimit: [0.05, 0.75] },
    fachada: { tx: 0.5, ty: 1.6, tz: 1.5, dist: 13.5, yaw: 0.55, pitch: 0.16, yawLimit: [-1.1, 1.3], pitchLimit: [0.04, 0.6] }
  };
  var ROOM_NAMES = [['sala', 'Sala'], ['cocina', 'Cocina'], ['habitacion', 'Habitación'], ['fachada', 'Fachada']];

  var lightRig = null, sun = null, hemi = null;
  if (ctx) {
    buildSala(); buildCocina(); buildHab(); buildFachada();
    lightRig = ctx.lights({ hemi: 0.65, key: 1.0, keyPos: [4, 8, 7], shadowSize: 9 });
    sun = lightRig.key; hemi = lightRig.hemi;
    var amb = new THREE.AmbientLight(0xffffff, 0.18); scene.add(amb);
  }

  var roomsBox = document.getElementById('visRooms');
  roomsBox.innerHTML = ROOM_NAMES.map(function (r) { return '<button class="chip" type="button" data-room="' + r[0] + '" aria-pressed="' + (r[0] === roomKey) + '">' + r[1] + '</button>'; }).join('');
  roomsBox.addEventListener('click', function (e) { var b = e.target.closest('[data-room]'); if (b) setRoom(b.getAttribute('data-room')); });

  function surfaces() { return surfacesByRoom[roomKey] || {}; }
  function applyFinish() {
    Object.keys(surfacesByRoom).forEach(function (rk) { var s = surfacesByRoom[rk]; Object.keys(s).forEach(function (k) { s[k].meshes.forEach(function (m) { m.material.roughness = ROUGH[finish]; }); }); });
  }
  function paint(s, hex) {
    s.hex = hex;
    s.meshes.forEach(function (m) { m.material.color.copy(M.col(hex)); });
  }
  function setLight(l) {
    light = l;
    document.querySelectorAll('#visLight button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-l') === l); });
    if (!ctx) return;
    var night = l === 'noche', ext = roomKey === 'fachada';
    var P = { dia: [0xffffff, 1.0, 0.65, [4, 8, 7], '#cfe6f5', ext ? '#9fd0f0' : null], tarde: [0xffb46b, 0.9, 0.45, [-6, 3.5, 5], '#ffc890', ext ? '#f2a96b' : null], noche: [0x8aa4ff, 0.12, 0.16, [3, 8, 4], '#1b2a4a', ext ? '#142038' : null] }[l];
    sun.color.setHex(P[0]); sun.intensity = P[1]; hemi.intensity = P[2]; sun.position.set(P[3][0], P[3][1], P[3][2]);
    lamps.forEach(function (lp) { lp.intensity = night ? lp.userData.on : 0; });
    scene.traverse(function (o) {
      if (o.userData.shade) o.material.emissiveIntensity = night ? 0.9 : 0;
      if (o.userData.glass) o.userData.glass.material.color.copy(M.col(P[4]));
    });
    scene.background = P[5] ? M.col(P[5]) : null;
    setMsg();
  }
  function setRoom(k) {
    roomKey = k; selected = null;
    Object.keys(ROOMS).forEach(function (r) { ROOMS[r].visible = r === k; });
    roomsBox.querySelectorAll('[data-room]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-room') === k); });
    if (ctx) {
      ctx.setView(VIEWS[k]);
      var picks = []; var s = surfaces(); Object.keys(s).forEach(function (key) { picks = picks.concat(s[key].meshes); });
      ctx.pickables(picks);
    }
    var first = Object.keys(surfaces())[0];
    select(first);
    setLight(light);
  }
  function select(key) {
    selected = key;
    renderSurfs();
    var s = surfaces()[key];
    if (s && pk) pk.select(s.hex);
    setMsg();
  }
  function setMsg() {
    var s = surfaces()[selected], el = document.getElementById('visMsg');
    if (el) el.textContent = s ? 'Seleccionada: ' + s.name + ' · ' + colorInfo(s.hex).name + '. Toca otra superficie o elige un color.' : 'Toca una superficie para elegirla.';
  }
  function renderSurfs() {
    var s = surfaces();
    document.getElementById('visSurfs').innerHTML = Object.keys(s).map(function (k) {
      var x = s[k], ci = colorInfo(x.hex);
      return '<button class="surf" type="button" data-k="' + k + '" aria-pressed="' + (k === selected) + '" style="--c:' + x.hex + '"><i></i><span><b>' + x.name + '</b><small>' + ci.name + ' · ' + ci.code + '</small></span><em>' + U.fmt(x.area, 1) + ' m²</em></button>';
    }).join('');
    renderTotals();
  }
  function totals() {
    var s = surfaces(), by = {};
    Object.keys(s).forEach(function (k) {
      var x = s[k], key = x.hex.toLowerCase();
      (by[key] = by[key] || { hex: x.hex, area: 0, names: [] }).area += x.area;
      by[key].names.push(x.name);
    });
    return Object.keys(by).map(function (k) { var t = by[k]; t.gal = Math.max(1, U.up(t.area * 2 / 35)); t.info = colorInfo(t.hex); return t; });
  }
  function renderTotals() {
    var t = totals();
    document.getElementById('visTotal').innerHTML = '<p class="lbl">Pintura estimada (2 manos)</p>' + t.map(function (x) {
      return '<div><span><i style="display:inline-block;width:12px;height:13px;background:' + x.hex + ';clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);margin-right:.45rem"></i>' + x.info.name + ' <small style="color:var(--steel-muted)">' + U.fmt(x.area, 1) + ' m²</small></span><b>' + x.gal + ' gal</b></div>';
    }).join('');
  }

  document.getElementById('visSurfs').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) select(b.getAttribute('data-k')); });
  var pk = K.picker({
    tabs: document.getElementById('visTabs'), grid: document.getElementById('visSw'), family: 4,
    onPick: function (c) { var s = surfaces()[selected]; if (!s) return; paint(s, c.hex); renderSurfs(); setMsg(); }
  });
  document.getElementById('visCustom').addEventListener('input', function (e) { var s = surfaces()[selected]; if (!s) return; paint(s, e.target.value); renderSurfs(); });
  document.getElementById('visFinish').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]'); if (!b) return; finish = b.getAttribute('data-f');
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); applyFinish();
  });
  document.getElementById('visLight').addEventListener('click', function (e) { var b = e.target.closest('[data-l]'); if (b) setLight(b.getAttribute('data-l')); });
  document.getElementById('visAll').addEventListener('click', function () {
    var s = surfaces(), cur = s[selected]; if (!cur) return;
    Object.keys(s).forEach(function (k) { if (s[k].wall) paint(s[k], cur.hex); }); renderSurfs();
  });
  document.getElementById('visReset').addEventListener('click', function () { var s = surfaces(); Object.keys(s).forEach(function (k) { paint(s[k], s[k].def); }); select(selected); });
  document.getElementById('visCart').addEventListener('click', function () {
    var name = ROOM_NAMES.filter(function (r) { return r[0] === roomKey; })[0][1];
    C.add('Colores para ' + name.toLowerCase() + ' (' + finish.toLowerCase() + ')', totals().map(function (x) {
      return x.gal + ' gal — ' + x.info.name + ' ' + x.info.code + ' (' + x.names.join(', ') + ', ' + U.fmt(x.area, 1) + ' m²)';
    }), 'visualizador');
  });
  document.getElementById('visShot').addEventListener('click', function (e) {
    if (!ctx) { e.preventDefault(); return; }
    ctx.render(); this.href = ctx.renderer.domElement.toDataURL('image/png');
  });

  if (ctx) {
    ctx.onPick(function (ob) { if (ob && ob.userData.key) select(ob.userData.key); });
    var pulse = 0;
    ctx.onFrame(function (dt, t) {
      var s = surfaces();
      Object.keys(s).forEach(function (k) {
        var on = k === selected;
        s[k].meshes.forEach(function (m) { m.material.emissive.setRGB(on ? 0.9 : 0, on ? 0.55 : 0, on ? 0.15 : 0); m.material.emissiveIntensity = on ? 0.06 + 0.06 * Math.sin(t * 4) : 0; });
      });
    });
  }
  setRoom(roomKey);
})();
