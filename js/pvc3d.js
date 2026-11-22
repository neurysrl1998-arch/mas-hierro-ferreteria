/* Más Hierro · Unión de PVC en 3D: cortar → limpiar → cementar → unir 1/4 de vuelta.
   El diámetro, el color del tubo y el producto Lanco siguen a la calculadora. */
(function () {
  'use strict';
  var stage = document.getElementById('pvcStage');
  if (!stage) return;
  var M = window.MH3D;
  var ctx = M.create(stage, { fov: 32, view: { tx: 0.2, ty: 0.25, tz: 0, dist: 6, yaw: 0.5, pitch: 0.32 }, yawLimit: [-0.6, 1.4], pitchLimit: [0.05, 1.0] });
  if (!ctx) return;
  var scene = ctx.scene;
  ctx.lights({ hemi: 0.75, key: 1.2, keyPos: [3, 6, 5], shadowSize: 4 });

  var steps = Array.prototype.slice.call(document.querySelectorAll('#pvcSteps li'));
  var msg = document.getElementById('pvcMsg'), bar = document.getElementById('pvcBar');
  var RAD = { '1/2"': 0.12, '3/4"': 0.15, '1"': 0.18, '1-1/2"': 0.24, '2"': 0.3, '3"': 0.4, '4"': 0.5, '6"': 0.66 };
  var state = { diam: '1/2"', type: 'fria', prod: 'Lanco Super PVC Cement' };

  // banco de trabajo
  var bench = M.box(7, 0.12, 2.6, M.mat('#6b4a2f', { r: 0.6 }), 0.3, -0.75, 0, scene); bench.receiveShadow = true;
  M.box(7, 0.02, 2.6, M.mat('#7d5a3b', { r: 0.7 }), 0.3, -0.68, 0, scene);

  var rig = new THREE.Group(); scene.add(rig);
  var pipeMat = new THREE.MeshPhysicalMaterial({ color: M.col('#f2f3f1'), roughness: 0.32, clearcoat: 0.5 });
  var innerMat = M.mat('#c9ccd0', { r: 0.6, side: THREE.BackSide });
  var cleanMat = M.mat('#b9a6ff', { r: 0.15, transparent: true, opacity: 0 });
  var cementMat = M.mat('#7fa7c9', { r: 0.1, transparent: true, opacity: 0.55 });
  var pipeL, pipeR, fit, cleanCoat, cementCoat, slice, cutter, dauber, cans;
  var r = 0.12;

  function tube(radius, len, mat, inner) {
    var g = new THREE.Group();
    var o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 48, 1, true), mat); o.rotation.z = Math.PI / 2; o.castShadow = true; g.add(o);
    if (inner) { var i = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, len, 48, 1, true), innerMat); i.rotation.z = Math.PI / 2; g.add(i); }
    [-1, 1].forEach(function (s) { var ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.86, radius, 48), mat); ring.rotation.y = s * Math.PI / 2; ring.position.x = s * len / 2; g.add(ring); });
    return g;
  }
  function canLabel(text, color) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d');
    g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = color; g.fillRect(0, 0, 512, 70);
    g.fillStyle = '#fff'; g.font = 'italic 800 54px "Barlow Condensed", Impact, sans-serif'; g.fillText('LANCO', 24, 54);
    g.fillStyle = '#16181b'; g.font = '700 40px "Barlow Condensed", sans-serif';
    var words = text.replace(/^Lanco |^Cemento Lanco /, '').toUpperCase().split(' '), line = '', y = 130;
    words.forEach(function (w) { if (g.measureText(line + w).width > 460) { g.fillText(line, 24, y); line = ''; y += 44; } line += w + ' '; });
    g.fillText(line, 24, y);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function can(text, color, x, z) {
    var g = new THREE.Group(); g.position.set(x, -0.68, z);
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 40), [new THREE.MeshStandardMaterial({ map: canLabel(text, color), roughness: 0.4 }), M.mat('#c9ccd0', { m: 0.8, r: 0.3 }), M.mat('#c9ccd0', { m: 0.8, r: 0.3 })]);
    body.position.y = 0.3; body.castShadow = true; body.rotation.y = -0.6; g.add(body);
    M.cyl(0.2, 0.22, 0.1, M.mat(color, { r: 0.5 }), 0, 0.65, 0, g);
    scene.add(g); return g;
  }

  function build() {
    while (rig.children.length) rig.remove(rig.children[0]);
    if (cans) cans.forEach(function (c) { scene.remove(c); });
    r = RAD[state.diam] || 0.12;
    pipeMat.color.copy(M.col(state.type === 'caliente' ? '#e6d3a6' : '#f2f3f1'));
    var socket = r * 1.9;
    fit = tube(r * 1.2, socket * 2 + 0.06, pipeMat, false); fit.position.x = 0.9; rig.add(fit);
    var fi = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, socket * 2 + 0.06, 48, 1, true), innerMat); fi.rotation.z = Math.PI / 2; fi.position.x = 0.9; rig.add(fi);
    var band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.23, r * 1.23, 0.05, 48), M.mat('#d8dadd', { r: 0.4 })); band.rotation.z = Math.PI / 2; band.position.x = 0.9; rig.add(band);
    pipeR = tube(r, 2.2, pipeMat, true); pipeR.position.x = 0.9 + socket * 0.5 + 1.1 - socket * 0.5 + 0.03; rig.add(pipeR);
    pipeR.position.x = 0.93 + 1.1;
    pipeL = new THREE.Group(); rig.add(pipeL);
    var body = tube(r, 2.4, pipeMat, true); body.position.x = -1.2; pipeL.add(body);
    cleanCoat = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.012, r * 1.012, socket, 48, 1, true), cleanMat); cleanCoat.rotation.z = Math.PI / 2; cleanCoat.position.x = -socket / 2; pipeL.add(cleanCoat);
    cementCoat = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, socket, 48, 1, true), cementMat); cementCoat.rotation.z = Math.PI / 2; pipeL.add(cementCoat);
    slice = tube(r, 0.08, pipeMat, true); rig.add(slice);
    // cortatubos
    cutter = new THREE.Group(); rig.add(cutter);
    var cring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.6, 0.035, 10, 40, Math.PI * 1.5), M.mat('#c62a20', { r: 0.4 })); cring.rotation.y = Math.PI / 2; cutter.add(cring);
    var wheel = M.cyl(0.06, 0.06, 0.02, M.mat('#d9dde2', { m: 1, r: 0.2 }), 0, r * 1.05, 0, cutter); wheel.rotation.x = Math.PI / 2;
    var handle = M.cyl(0.035, 0.035, 0.6, M.mat('#26282b'), 0, -r * 1.6 - 0.3, 0, cutter);
    // aplicador
    dauber = new THREE.Group(); rig.add(dauber);
    M.cyl(0.012, 0.012, 0.45, M.mat('#222'), 0, 0.27, 0, dauber);
    dauber.userData.tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.mat('#b9a6ff', { r: 0.9 })); dauber.add(dauber.userData.tip);
    cans = [can(state.prod, '#c62a20', 1.9, -0.9), can('Lanco PVC Cleaner', '#6a4fd8', 1.25, -1.05)];
    ctx.setView({ dist: 4.8 + r * 9, tx: 0.3, ty: 0.05 + r * 0.6 });
    restart();
  }

  var T = 0, playing = true;
  var PH = [['cut', 0, 2.2], ['clean', 2.2, 4.4], ['cement', 4.4, 6.6], ['join', 6.6, 9.6]];
  var MSG = {
    cut: 'Corta el tubo a escuadra con cortatubos y quita la rebaba.',
    clean: 'Limpia el tubo y la conexión con Lanco PVC Cleaner.',
    cement: function () { return 'Aplica ' + state.prod + ' en el tubo y dentro de la conexión.'; },
    join: 'Une hasta el fondo, gira 1/4 de vuelta y sostén 30 segundos.',
    done: 'Unión lista. Respeta el tiempo de curado antes de dar presión a la línea.'
  };
  function restart() { T = ctx.reduce ? 9.6 : 0; playing = true; }
  document.getElementById('pvcReplay').addEventListener('click', restart);
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function clamp(t) { return Math.max(0, Math.min(1, t)); }

  ctx.onFrame(function (dt, time) {
    if (playing) T += dt;
    if (T >= 9.6) { T = 9.6; playing = false; }
    var socket = r * 1.9, endX = 0.9 - socket - 0.02 - 0.55; // extremo del tubo izquierdo en reposo
    var ph = PH.filter(function (p) { return T >= p[1] && T < p[2]; })[0], key = ph ? ph[0] : 'done';
    steps.forEach(function (li, i) { li.classList.toggle('active', PH[i][0] === key); li.classList.toggle('done', key === 'done' || PH.findIndex(function (p) { return p[0] === key; }) > i); });
    msg.textContent = typeof MSG[key] === 'function' ? MSG[key]() : MSG[key];
    bar.style.width = Math.round(T / 9.6 * 100) + '%';

    // 1 · corte
    var c = clamp(T / 2.2);
    cutter.visible = T < 2.4;
    cutter.position.set(endX + 0.06, 0, 0);
    cutter.rotation.x = c * Math.PI * 6;
    slice.visible = T < 3.2;
    var fall = clamp((T - 1.9) / 0.9);
    slice.position.set(endX + 0.1 + fall * 0.25, -fall * fall * 0.6, fall * 0.2);
    slice.rotation.z = fall * 1.4;

    // 2 · limpiador y 3 · cemento
    var cl = clamp((T - 2.2) / 2.0), ce = clamp((T - 4.4) / 2.0);
    cleanMat.opacity = 0.35 * Math.min(1, cl * 1.5) * (1 - clamp((T - 4.4) / 1));
    cementCoat.scale.y = Math.max(0.001, ce);
    cementCoat.position.x = -socket / 2 - (1 - ce) * socket / 2 + 0;
    cementCoat.position.x = -socket + ce * socket / 2;
    cementCoat.visible = ce > 0;
    var dOn = (T > 2.2 && T < 4.3) || (T > 4.4 && T < 6.5);
    dauber.visible = dOn;
    if (dOn) {
      var local = T < 4.3 ? cl : ce, ang = local * Math.PI * 8;
      dauber.userData.tip.material.color.copy(M.col(T < 4.3 ? '#b9a6ff' : '#7fa7c9'));
      var along = local < 0.6 ? local / 0.6 : 1 - (local - 0.6) / 0.4;
      var x = endX - socket * along;
      dauber.position.set(x, Math.cos(ang) * (r + 0.06), Math.sin(ang) * (r + 0.06));
      dauber.rotation.x = -ang;
    }

    // 4 · unión: deslizar, girar 1/4, sostener
    var s = ease(clamp((T - 6.6) / 1.3)), turn = ease(clamp((T - 7.9) / 0.7));
    pipeL.position.x = endX + s * (0.9 - endX - 0.02);
    pipeL.rotation.x = turn * Math.PI / 2;
    rig.rotation.y = Math.sin(time * 0.3) * 0.04;
  });

  function sync(d) {
    if (!d || d.id !== 'pvc' || !d.r.extra) return;
    var e = d.r.extra, changed = e.diam !== state.diam || e.type !== state.type || e.prod !== state.prod;
    state.diam = e.diam; state.type = e.type; state.prod = e.prod;
    if (changed) build();
  }
  document.addEventListener('mh:calc', function (e) { sync(e.detail); });
  if (window.MHCalc && MHCalc.last.pvc) { var l = MHCalc.last.pvc; state.diam = l.r.extra.diam; state.type = l.r.extra.type; state.prod = l.r.extra.prod; }
  build();
})();
