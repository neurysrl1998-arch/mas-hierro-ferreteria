/* Más Hierro · Casa 3D para el consumo eléctrico: equipos que se encienden y simulación de apagón con inversor y baterías */
(function () {
  'use strict';
  var stage = document.getElementById('houseStage');
  if (!stage) return;
  var M = window.MH3D;
  var ctx = M.create(stage, { fov: 34, view: { tx: 0.3, ty: 0.7, tz: 0.2, dist: 12.5, yaw: 0.5, pitch: 0.55 }, yawLimit: [-0.9, 1.5], pitchLimit: [0.2, 1.1] });
  if (!ctx) return;
  var scene = ctx.scene;
  var L = ctx.lights({ hemi: 0.7, key: 1.1, keyPos: [5, 10, 6], shadowSize: 8 });
  var chips = document.getElementById('houseChips'), btn = document.getElementById('outageBtn');
  var grid = true, data = window.MHConsumo ? window.MHConsumo.get() : { items: [], res: {} };
  var models = {}, spinners = [], glows = [], bulbs = [];

  function on(id) {
    var it = data.items.filter(function (x) { return x.id === id; })[0];
    if (!it || !it.on) return false;
    return grid || it.ap;
  }

  /* terreno, piso y muros bajos (maqueta sin techo) */
  var ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), M.mat('#6f9a4f', { r: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  M.box(8.4, 0.16, 5.4, M.mat('#3a3f47'), 0, 0.02, 0, scene);
  var fl = M.box(8, 0.04, 5, M.mat('#c9b08f', { r: 0.6 }), 0, 0.12, 0, scene); fl.receiveShadow = true;
  var wm = M.mat('#f1ede5', { r: 0.9 }), H = 1.5;
  function wall(w, d, x, z) { return M.box(w, H, d, wm, x, 0.14 + H / 2, z, scene); }
  wall(8, 0.12, 0, -2.5); wall(0.12, 5, -4, 0); wall(0.12, 5, 4, 0);
  wall(0.12, 3.4, 0.4, -0.8); wall(2.6, 0.12, -2.7, 0.3); wall(1.6, 0.12, 3.2, 0.6);
  var Y = 0.14;

  /* equipos */
  function nevera() { var g = new THREE.Group(); g.position.set(-3.55, Y, -2.05); scene.add(g); M.box(0.7, 1.7, 0.65, M.mat('#d9dde2', { m: 0.5, r: 0.3 }), 0, 0.85, 0, g); M.box(0.7, 0.01, 0.66, M.mat('#8b9099'), 0, 1.15, 0, g); var led = M.box(0.12, 0.05, 0.01, M.mat('#111', { emissive: '#36a3ff', ei: 0 }), 0.15, 1.35, 0.33, g); glows.push({ id: 'nevera', m: led, ei: 1.2 }); return g; }
  function counter() { M.box(2.0, 0.8, 0.6, M.mat('#7a5a3c'), -2.2, Y + 0.4, -2.15, scene); M.box(2.05, 0.04, 0.64, M.mat('#e9e7e2', { r: 0.3 }), -2.2, Y + 0.82, -2.15, scene); }
  function micro() { var g = new THREE.Group(); g.position.set(-2.7, Y + 0.84, -2.2); scene.add(g); M.box(0.5, 0.3, 0.36, M.mat('#26282b'), 0, 0.15, 0, g); var s = M.box(0.28, 0.2, 0.01, M.mat('#111', { emissive: '#ffcf6a', ei: 0 }), -0.06, 0.15, 0.185, g); glows.push({ id: 'microondas', m: s, ei: 1.4 }); }
  function licuadora() { var g = new THREE.Group(); g.position.set(-1.7, Y + 0.84, -2.2); scene.add(g); M.cyl(0.08, 0.1, 0.12, M.mat('#c62a20'), 0, 0.06, 0, g); var j = M.cyl(0.08, 0.06, 0.26, M.mat('#bfe0f5', { transparent: true, opacity: 0.6 }), 0, 0.25, 0, g); spinners.push({ id: 'licuadora', m: j, axis: 'y', s: 30 }); }
  function tv() { var g = new THREE.Group(); g.position.set(-2.2, Y, 0.18); scene.add(g); M.box(1.6, 0.5, 0.35, M.mat('#26282b'), 0, 0.25, 0, g); M.box(1.4, 0.8, 0.05, M.mat('#111'), 0, 1.0, 0.0, g); var s = M.box(1.32, 0.72, 0.01, M.mat('#0b0d10', { emissive: '#2f9fd8', ei: 0 }), 0, 1.0, -0.03, g); s.rotation.y = Math.PI; glows.push({ id: 'tv', m: s, ei: 1.1, tv: true }); var sofa = new THREE.Group(); sofa.position.set(-2.2, Y, 1.8); scene.add(sofa); M.box(1.8, 0.4, 0.7, M.mat('#5b6370', { r: 0.95 }), 0, 0.2, 0, sofa); M.box(1.8, 0.45, 0.18, M.mat('#5b6370', { r: 0.95 }), 0, 0.55, 0.3, sofa); }
  function fan(id, x, z) { var g = new THREE.Group(); g.position.set(x, Y, z); scene.add(g); M.cyl(0.15, 0.18, 0.04, M.mat('#eee'), 0, 0.02, 0, g); M.cyl(0.02, 0.02, 0.9, M.mat('#eee'), 0, 0.47, 0, g); var head = new THREE.Group(); head.position.y = 0.95; g.add(head); var cage = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.01, 6, 24), M.mat('#ddd')); head.add(cage); var rot = new THREE.Group(); head.add(rot); for (var b = 0; b < 3; b++) { var p = new THREE.Group(); p.rotation.z = b * Math.PI * 2 / 3; M.box(0.18, 0.07, 0.01, M.mat('#2f9fd8', { transparent: true, opacity: 0.8 }), 0.1, 0, 0, p); rot.add(p); } g.rotation.y = -0.8; spinners.push({ id: id, m: rot, axis: 'z', s: 18 }); }
  function pc() { var g = new THREE.Group(); g.position.set(1.5, Y, -2.15); scene.add(g); M.box(1.0, 0.04, 0.5, M.mat('#7a5a3c'), 0, 0.72, 0, g); [-0.45, 0.45].forEach(function (x) { M.box(0.04, 0.7, 0.45, M.mat('#7a5a3c'), x, 0.36, 0, g); }); M.box(0.55, 0.34, 0.03, M.mat('#111'), 0, 1.0, -0.1, g); var s = M.box(0.5, 0.29, 0.01, M.mat('#111', { emissive: '#8b6cff', ei: 0 }), 0, 1.0, -0.08, g); glows.push({ id: 'pc', m: s, ei: 1.2 }); var r = M.box(0.2, 0.04, 0.12, M.mat('#26282b'), 0.35, 0.76, 0.1, g); var led = M.box(0.03, 0.015, 0.01, M.mat('#111', { emissive: '#5bff9a', ei: 0 }), 0.35, 0.79, 0.165, g); glows.push({ id: 'router', m: led, ei: 2, blink: true }); }
  function cama() { var g = new THREE.Group(); g.position.set(2.4, Y, 1.7); scene.add(g); M.box(1.5, 0.35, 1.9, M.mat('#7a5a3c'), 0, 0.18, 0, g); M.box(1.4, 0.2, 1.8, M.mat('#f5f4f0', { r: 1 }), 0, 0.45, 0, g); M.box(1.42, 0.06, 1.1, M.mat('#c62a20', { r: 1 }), 0, 0.57, 0.35, g); }
  function aire() { var g = new THREE.Group(); g.position.set(3.88, Y + 1.15, 1.7); g.rotation.y = -Math.PI / 2; scene.add(g); M.box(1.0, 0.3, 0.22, M.mat('#f4f4f2', { r: 0.4 }), 0, 0, 0, g); var led = M.box(0.1, 0.025, 0.01, M.mat('#111', { emissive: '#5bff9a', ei: 0 }), 0.36, -0.07, 0.115, g); glows.push({ id: 'aire', m: led, ei: 2 }); var cond = new THREE.Group(); cond.position.set(4.55, Y, 1.7); scene.add(cond); M.box(0.45, 0.6, 0.8, M.mat('#e6e8ea'), 0, 0.3, 0, cond); var fanG = new THREE.Group(); fanG.position.set(0.23, 0.32, 0); fanG.rotation.y = Math.PI / 2; cond.add(fanG); for (var b = 0; b < 4; b++) { var p = new THREE.Group(); p.rotation.z = b * Math.PI / 2; M.box(0.2, 0.05, 0.01, M.mat('#8b9099'), 0.1, 0, 0, p); fanG.add(p); } spinners.push({ id: 'aire', m: fanG, axis: 'z', s: 14 }); airFlow = []; for (var k = 0; k < 14; k++) { var a = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.7 })); scene.add(a); airFlow.push({ m: a, t: Math.random() }); } }
  var airFlow = [];
  function lavadora() { var g = new THREE.Group(); g.position.set(3.55, Y, -1.0); scene.add(g); M.box(0.6, 0.85, 0.6, M.mat('#f4f4f2', { r: 0.4 }), 0, 0.43, 0, g); var door = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), M.mat('#9fb4c8', { r: 0.1, transparent: true, opacity: 0.8 })); door.rotation.z = Math.PI / 2; door.position.set(-0.31, 0.45, 0); g.add(door); var drum = new THREE.Group(); drum.position.set(-0.3, 0.45, 0); g.add(drum); M.box(0.02, 0.3, 0.05, M.mat('#c62a20'), 0, 0.08, 0, drum); spinners.push({ id: 'lavadora', m: drum, axis: 'x', s: 9 }); }
  function bomba() { var g = new THREE.Group(); g.position.set(4.6, Y - 0.12, -1.8); scene.add(g); M.box(0.5, 0.06, 0.35, M.mat('#26282b'), 0, 0.03, 0, g); var mot = M.cyl(0.14, 0.14, 0.4, M.mat('#2f6fb5', { m: 0.4, r: 0.4 }), 0, 0.22, 0, g); mot.rotation.z = Math.PI / 2; M.pipe([[0.2, 0.22, 0], [0.4, 0.22, 0], [0.4, 0.9, 0]], 0.03, M.mat('#f2f3f1'), g); models.bomba = mot; }
  function calentador() { var g = new THREE.Group(); g.position.set(0.0, Y, 1.9); scene.add(g); M.cyl(0.2, 0.2, 0.75, M.mat('#f4f4f2'), 0, 0.5, 0, g); var led = M.box(0.06, 0.04, 0.01, M.mat('#111', { emissive: '#ff4d3d', ei: 0 }), 0, 0.6, 0.2, g); glows.push({ id: 'calentador', m: led, ei: 2 }); }
  function bulb(x, z) { var b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), M.mat('#fff8e6', { emissive: '#ffd79a', ei: 0 })); b.position.set(x, Y + 1.65, z); scene.add(b); var l = new THREE.PointLight(0xffd79a, 0, 4.5, 2); l.position.copy(b.position); scene.add(l); bulbs.push({ m: b, l: l }); var cord = M.cyl(0.006, 0.006, 0.25, M.mat('#222'), x, Y + 1.8, z, scene); }

  nevera(); counter(); micro(); licuadora(); tv(); fan('abanico', -0.8, 1.6); fan('abanico', 1.0, 0.9); pc(); cama(); aire(); lavadora(); bomba(); calentador();
  bulb(-2.2, -1.1); bulb(-2.0, 1.4); bulb(2.3, -1.2);

  /* inversor, baterías y red eléctrica */
  var invG = new THREE.Group(); invG.position.set(-3.82, Y, 2.0); invG.rotation.y = Math.PI; scene.add(invG);
  M.box(0.18, 0.55, 0.42, M.mat('#26282b'), 0, 1.0, 0, invG);
  var invScreen = M.box(0.01, 0.12, 0.22, M.mat('#111', { emissive: '#5bff9a', ei: 0.3 }), -0.095, 1.12, 0, invG);
  var batG = new THREE.Group(); invG.add(batG);
  var batLeds = [];
  function buildBats(n) {
    while (batG.children.length) batG.remove(batG.children[0]);
    batLeds = [];
    n = Math.min(8, Math.max(0, n || 0));
    for (var i = 0; i < n; i++) {
      var row = Math.floor(i / 4), col = i % 4;
      var b = M.box(0.3, 0.32, 0.2, M.mat('#2f9fd8', { r: 0.5 }), -0.05 - row * 0.34, 0.16, -0.36 + col * 0.24, batG);
      var led = M.box(0.01, 0.04, 0.1, M.mat('#111', { emissive: '#5bff9a', ei: 0.4 }), -0.205 - row * 0.34, 0.24, -0.36 + col * 0.24, batG);
      batLeds.push(led);
    }
  }
  var pole = new THREE.Group(); pole.position.set(-6, 0, 3.5); scene.add(pole);
  M.cyl(0.08, 0.1, 3.4, M.mat('#7a6a58'), 0, 1.7, 0, pole); M.box(0.9, 0.06, 0.06, M.mat('#7a6a58'), 0, 3.2, 0, pole);
  var linePts = [new THREE.Vector3(-6, 3.15, 3.5), new THREE.Vector3(-5.2, 2.4, 2.8), new THREE.Vector3(-4.5, 1.9, 2.3), new THREE.Vector3(-3.95, Y + 1.2, 2.0)];
  var lineCurve = new THREE.CatmullRomCurve3(linePts);
  var lineMesh = new THREE.Mesh(new THREE.TubeGeometry(lineCurve, 40, 0.018, 8, false), M.mat('#1b1b1b'));
  scene.add(lineMesh);
  var sparks = [];
  for (var s = 0; s < 8; s++) { var sp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f })); scene.add(sp); sparks.push({ m: sp, t: s / 8 }); }

  function hud() {
    var r = data.res || {};
    var auton = r.avg > 0 && r.usable ? r.usable / r.avg : 0;
    chips.innerHTML = '<span class="chip">Red eléctrica <b>' + (grid ? 'Con luz' : 'Apagón') + '</b></span>' +
      '<span class="chip">Inversor <b>' + (r.inv || 0).toLocaleString('es-DO') + ' W</b></span>' +
      '<span class="chip">Baterías <b>' + (r.bats || 0) + '</b></span>' +
      (auton ? '<span class="chip">Autonomía <b>≈ ' + auton.toFixed(1) + ' h</b></span>' : '');
    btn.textContent = grid ? 'Simular apagón' : 'Volver la luz';
    btn.setAttribute('aria-pressed', !grid);
  }
  function apply() {
    L.hemi.intensity = grid ? 0.7 : 0.12; L.key.intensity = grid ? 1.1 : 0.12;
    ground.material.color.copy(M.col(grid ? '#6f9a4f' : '#24331c'));
    scene.background = null;
    var anyLight = on('bombillos');
    bulbs.forEach(function (b) { b.m.material.emissiveIntensity = anyLight ? 1.6 : 0; b.l.intensity = anyLight ? 0.9 : 0; });
    invScreen.material.emissive.copy(M.col(grid ? '#5bff9a' : '#ffb020'));
    lineMesh.material.color.copy(M.col(grid ? '#1b1b1b' : '#555'));
    sparks.forEach(function (sp) { sp.m.visible = grid; });
    hud();
  }
  btn.addEventListener('click', function () { grid = !grid; apply(); });
  document.addEventListener('mh:consumo', function (e) { data = e.detail; buildBats(data.res.bats); apply(); });
  buildBats(data.res && data.res.bats); apply();

  ctx.onFrame(function (dt, t) {
    spinners.forEach(function (s) { if (on(s.id)) s.m.rotation[s.axis] += dt * s.s; });
    glows.forEach(function (g) {
      var active = on(g.id), ei = active ? g.ei : 0;
      if (active && g.blink) ei *= (Math.sin(t * 9) > 0 ? 1 : 0.2);
      if (active && g.tv) g.m.material.emissive.setHSL((t * 0.05) % 1, 0.6, 0.45);
      g.m.material.emissiveIntensity = ei;
    });
    if (models.bomba) models.bomba.position.x = on('bomba') ? Math.sin(t * 60) * 0.006 : 0;
    var airOn = on('aire');
    airFlow.forEach(function (a) {
      a.m.visible = airOn; if (!airOn) return;
      a.t = (a.t + dt * 0.5) % 1;
      a.m.position.set(3.75 - a.t * 1.6, Y + 1.05 - a.t * 0.5, 1.4 + Math.sin(a.t * 9 + a.m.id) * 0.25);
      a.m.material.opacity = 0.7 * (1 - a.t);
    });
    sparks.forEach(function (sp) { sp.t = (sp.t + dt * 0.35) % 1; sp.m.position.copy(lineCurve.getPoint(sp.t)); });
    if (!grid) {
      var lvl = (Math.sin(t * 2) + 1) / 2;
      batLeds.forEach(function (l, i) { l.material.emissiveIntensity = 0.4 + 1.2 * ((i / Math.max(1, batLeds.length) + t * 0.4) % 1); });
      invScreen.material.emissiveIntensity = 0.8 + 0.4 * lvl;
    } else {
      batLeds.forEach(function (l) { l.material.emissiveIntensity = 0.6; });
      invScreen.material.emissiveIntensity = 0.5;
    }
  });
})();
