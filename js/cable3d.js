/* Más Hierro · Circuito 3D: panel con breaker → cable (grosor real del calibre, corte con núcleo de cobre) → carga.
   Partículas de corriente: velocidad según amperios, color según la caída de tensión. */
(function () {
  'use strict';
  var stage = document.getElementById('cableStage');
  if (!stage) return;
  var M = window.MH3D;
  var ctx = M.create(stage, { fov: 34, view: { tx: 0.4, ty: 1.1, tz: 0, dist: 8.5, yaw: 0.35, pitch: 0.22 }, yawLimit: [-0.7, 1.1], pitchLimit: [0.04, 0.9] });
  if (!ctx) return;
  var scene = ctx.scene;
  ctx.lights({ hemi: 0.6, key: 1.1, keyPos: [2, 7, 6], shadowSize: 6 });
  var chips = document.getElementById('cableChips'), msg = document.getElementById('cableMsg');
  var DIAM = { '14': 1.63, '12': 2.05, '10': 2.59, '8': 3.26, '6': 4.11, '4': 5.19, '2': 6.54, '1/0': 8.25, '2/0': 9.27 };
  var st = { gauge: '12', I: 15, drop: 1.2, brk: 20, V: 120, ok: true, W: 1800 };

  // pared y piso
  var wall = M.box(9, 4, 0.2, M.mat('#e6e3dc', { r: 0.9 }), 0.5, 2, -0.6, scene); wall.receiveShadow = true;
  var floor = M.box(9, 0.1, 3, M.mat('#8c7f72', { r: 0.8 }), 0.5, -0.05, 0.8, scene); floor.receiveShadow = true;

  // panel eléctrico
  var panel = new THREE.Group(); panel.position.set(-3, 1.9, -0.45); scene.add(panel);
  M.box(1.1, 1.5, 0.18, M.mat('#a9afb7', { m: 0.6, r: 0.35 }), 0, 0, 0, panel);
  M.box(0.95, 1.35, 0.02, M.mat('#2b2f36'), 0, 0, 0.1, panel);
  var door = M.box(1.1, 1.5, 0.03, M.mat('#b8bec6', { m: 0.6, r: 0.35 }), -0.55, 0, 0.12, panel); door.geometry.translate(0.55, 0, 0); door.position.x = -0.55; door.rotation.y = -1.9;
  var brkRows = [];
  for (var i = 0; i < 6; i++) {
    var y = 0.5 - i * 0.2;
    [-0.22, 0.22].forEach(function (x, j) {
      var b = M.box(0.36, 0.15, 0.08, M.mat('#1d1f23', { r: 0.5 }), x, y, 0.14, panel);
      var sw = M.box(0.08, 0.06, 0.05, M.mat('#3b3f46'), x - 0.05, y, 0.2, panel);
      brkRows.push({ b: b, sw: sw });
    });
  }
  // breaker activo con etiqueta
  var lblC = document.createElement('canvas'); lblC.width = 256; lblC.height = 96;
  var lblT = new THREE.CanvasTexture(lblC); lblT.encoding = THREE.sRGBEncoding;
  var main = brkRows[2];
  main.b.material = new THREE.MeshStandardMaterial({ map: lblT, roughness: 0.5 });
  main.sw.material = M.mat('#c62a20');
  var brk2 = brkRows[3];
  function drawLbl() {
    var g = lblC.getContext('2d'); g.fillStyle = '#1d1f23'; g.fillRect(0, 0, 256, 96);
    g.fillStyle = '#fff'; g.font = '800 54px "Barlow Condensed", Impact, sans-serif'; g.textAlign = 'right'; g.fillText(st.brk + 'A', 240, 66);
    lblT.needsUpdate = true;
  }

  // recorrido del cable: del panel, baja por la pared y va a la carga
  var path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3, 1.15, -0.4), new THREE.Vector3(-3, 0.5, -0.38), new THREE.Vector3(-2.6, 0.25, -0.3),
    new THREE.Vector3(-1, 0.22, -0.25), new THREE.Vector3(1, 0.22, -0.25), new THREE.Vector3(2.6, 0.3, -0.25), new THREE.Vector3(3.1, 0.7, -0.3)
  ], false, 'catmullrom', 0.2);
  var cableGroup = new THREE.Group(); scene.add(cableGroup);
  var load = new THREE.Group(); load.position.set(3.4, 0, -0.1); scene.add(load);
  var particles = [], pMat = new THREE.MeshBasicMaterial({ color: 0x5bff9a, depthTest: false, transparent: true, opacity: 0.95 });
  var lampLight = new THREE.PointLight(0xffd79a, 0, 6); scene.add(lampLight);
  var spinner = null, glow = null;

  function conductorColors() { return st.V === 240 ? ['#1b1b1b', '#c62a20', '#2f9e4f'] : ['#1b1b1b', '#f2f2f0', '#2f9e4f']; }
  function buildCable() {
    while (cableGroup.children.length) cableGroup.remove(cableGroup.children[0]);
    particles.forEach(function (p) { scene.remove(p.m); }); particles = [];
    var d = (DIAM[st.gauge] || 2) / 1000 * 26, ins = d * 0.62; // escala visual
    var cols = conductorColors();
    cols.forEach(function (c, k) {
      var off = (k - 1) * (ins * 2.15);
      var pts = path.getPoints(80).map(function (p, idx, arr) {
        var t = new THREE.Vector3(); path.getTangent(idx / (arr.length - 1), t);
        var n = new THREE.Vector3(0, 1, 0).cross(t).normalize();
        if (n.lengthSq() < 0.01) n.set(1, 0, 0);
        return p.clone().addScaledVector(n, off).add(new THREE.Vector3(0, 0, 0));
      });
      var curve = new THREE.CatmullRomCurve3(pts);
      var m = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, ins, 14, false), M.mat(c, { r: 0.45 }));
      m.castShadow = true; cableGroup.add(m);
      // corte: cobre expuesto al inicio de la carga
      var endP = curve.getPoint(1), endT = curve.getTangent(1);
      var copper = new THREE.Mesh(new THREE.CylinderGeometry(ins * 0.62, ins * 0.62, 0.16, 16), M.mat('#c8773c', { m: 0.9, r: 0.25 }));
      copper.position.copy(endP).addScaledVector(endT, 0.08);
      copper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endT); cableGroup.add(copper);
      if (k < 2) for (var q = 0; q < 10; q++) {
        var pm = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.02, ins * 0.7), 10, 8), pMat);
        pm.renderOrder = 10; scene.add(pm); particles.push({ m: pm, curve: curve, t: q / 10, dir: k === 0 ? 1 : -1 });
      }
    });
    // conduit transparente por la pared
    var conduit = new THREE.Mesh(new THREE.TubeGeometry(path, 120, ins * 4 + 0.03, 16, false), new THREE.MeshPhysicalMaterial({ color: 0xcfd6dd, transparent: true, opacity: 0.18, roughness: 0.2, depthWrite: false }));
    cableGroup.add(conduit);
    // sección transversal ampliada (lupa) junto al panel
    var lupa = new THREE.Group(); lupa.position.set(-1.6, 2.6, -0.35); cableGroup.add(lupa);
    var ringS = Math.max(0.16, d * 9);
    M.cyl(ringS * 1.25, ringS * 1.25, 0.04, M.mat('#26282b'), 0, 0, 0, lupa).rotation.x = Math.PI / 2;
    M.cyl(ringS, ringS, 0.06, M.mat(cols[0], { r: 0.5 }), 0, 0, 0.01, lupa).rotation.x = Math.PI / 2;
    M.cyl(ringS * 0.62, ringS * 0.62, 0.08, M.mat('#c8773c', { m: 0.9, r: 0.25 }), 0, 0, 0.02, lupa).rotation.x = Math.PI / 2;
    lupa.userData.s = ringS;
    var lc = document.createElement('canvas'); lc.width = 512; lc.height = 96; var lg = lc.getContext('2d');
    lg.fillStyle = 'rgba(17,19,23,.85)'; lg.fillRect(0, 0, 512, 96);
    lg.fillStyle = '#fff'; lg.font = '700 44px "Barlow Condensed", sans-serif'; lg.textAlign = 'center';
    lg.fillText('CORTE DEL CABLE · ' + st.gauge + ' AWG · ' + (DIAM[st.gauge] || 0).toFixed(2) + ' mm', 256, 62);
    var lt = new THREE.CanvasTexture(lc); lt.encoding = THREE.sRGBEncoding;
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, transparent: true }));
    spr.scale.set(1.9, 0.36, 1); spr.position.set(0, -ringS * 1.25 - 0.28, 0.05); lupa.add(spr);
  }
  function buildLoad() {
    while (load.children.length) load.remove(load.children[0]);
    spinner = null; glow = null; lampLight.intensity = 0;
    var w = st.W;
    if (w < 400) { // lámpara
      M.cyl(0.18, 0.22, 0.05, M.mat('#26282b'), 0, 0.03, 0, load); M.cyl(0.02, 0.02, 1.2, M.mat('#26282b'), 0, 0.65, 0, load);
      glow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), M.mat('#fff3d6', { emissive: '#ffd79a', ei: 1.4 })); glow.position.y = 1.4; load.add(glow);
      M.cyl(0.22, 0.32, 0.3, M.mat('#f3ead8', { transparent: true, opacity: 0.85 }), 0, 1.45, 0, load);
      lampLight.position.set(3.4, 1.4, 0); lampLight.intensity = 1.4;
    } else if (w < 2500) { // equipo de cocina / abanico
      M.box(0.9, 0.55, 0.55, M.mat('#d9dde2', { m: 0.5, r: 0.3 }), 0, 0.98, 0, load);
      M.box(0.55, 0.4, 0.02, M.mat('#111', { r: 0.1 }), -0.1, 0.98, 0.28, load);
      glow = M.box(0.18, 0.06, 0.02, M.mat('#111', { emissive: '#5bff9a', ei: 1 }), 0.3, 1.1, 0.28, load);
      M.box(1.2, 0.7, 0.6, M.mat('#7a5a3c', { r: 0.6 }), 0, 0.35, 0, load);
    } else { // aire acondicionado
      M.box(1.2, 0.36, 0.28, M.mat('#f4f4f2', { r: 0.4 }), 0, 2.4, -0.3, load);
      glow = M.box(0.12, 0.03, 0.01, M.mat('#111', { emissive: '#5bff9a', ei: 1 }), 0.45, 2.33, -0.155, load);
      for (var k = 0; k < 6; k++) M.box(1.05, 0.012, 0.02, M.mat('#c9ccd0'), 0, 2.27 - k * 0.012, -0.16 + k * 0.004, load);
      var cond = new THREE.Group(); cond.position.set(0, 0.45, 0.6); load.add(cond);
      M.box(0.9, 0.7, 0.4, M.mat('#e6e8ea', { r: 0.4 }), 0, 0, 0, cond);
      var grill = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32), M.mat('#2b2f36')); grill.position.set(-0.12, 0, 0.205); cond.add(grill);
      spinner = new THREE.Group(); spinner.position.set(-0.12, 0, 0.21); cond.add(spinner);
      for (var b = 0; b < 4; b++) { var bl = M.box(0.22, 0.06, 0.01, M.mat('#9aa1ab'), 0.11, 0, 0, null); var pv = new THREE.Group(); pv.rotation.z = b * Math.PI / 2; pv.add(bl); spinner.add(pv); }
    }
  }
  function hud() {
    if (!st.gauge) { chips.innerHTML = '<span class="chip">Fuera de rango</span>'; msg.textContent = 'La carga o la distancia superan la tabla: consulta con un electricista.'; return; }
    chips.innerHTML = '<span class="chip">Calibre <b>' + st.gauge + ' AWG</b></span><span class="chip">Breaker <b>' + st.brk + ' A</b></span><span class="chip">Corriente <b>' + st.I.toFixed(1) + ' A</b></span><span class="chip">Caída <b>' + st.drop.toFixed(2) + ' %</b></span>';
    msg.textContent = (st.V === 240 ? '240 V · dos fases + tierra. ' : '120 V · fase, neutro y tierra. ') + (st.ok ? 'La caída de tensión está dentro del límite.' : 'Caída de tensión alta: usa un calibre mayor.');
  }
  function apply() {
    pMat.color.setHex(st.ok ? 0x5bff9a : 0xffb020);
    drawLbl(); buildCable(); buildLoad(); hud();
  }
  function sync(d) {
    if (!d || d.id !== 'cable') return;
    var e = d.r.extra || {}, v = d.v;
    st.gauge = e.gauge; st.I = e.I || 0; st.drop = e.drop || 0; st.brk = e.brk || 0; st.V = e.V || +v.v; st.ok = e.ok !== false;
    st.W = v.m === 'w' ? v.x : v.x * (+v.v);
    apply();
  }
  document.addEventListener('mh:calc', function (e) { sync(e.detail); });
  if (window.MHCalc && MHCalc.last.cable) sync({ id: 'cable', v: MHCalc.last.cable.v, r: MHCalc.last.cable.r }); else apply();

  ctx.onFrame(function (dt, t) {
    var speed = 0.04 + Math.min(0.5, st.I / 120);
    particles.forEach(function (p) {
      p.t = (p.t + speed * dt * p.dir + 1) % 1;
      p.m.position.copy(p.curve.getPoint(p.t));
    });
    if (spinner) spinner.rotation.z += dt * 12;
    if (glow && glow.material.emissiveIntensity != null) glow.material.emissiveIntensity = 1 + 0.25 * Math.sin(t * 6);
    door.rotation.y = -1.9 + Math.sin(t * 0.5) * 0.04;
  });
})();
