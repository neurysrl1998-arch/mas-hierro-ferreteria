/* Más Hierro · Catálogo 3D de productos
   Visor de estudio: entorno PMREM para reflejos reales, sombras suaves, materiales físicos
   (cerámica esmaltada, cromo, PVC, cobre). Modelos a escala real en metros. */
(function () {
  'use strict';
  var app = document.getElementById('catApp');
  if (!app || !window.THREE) return;
  var C = window.MHCommon || {}, CFG = window.MH_CONFIG || {};
  var V2 = THREE.Vector2, V3 = THREE.Vector3;
  var esc = C.esc || function (s) { return s; };

  /* ================= utilidades de geometría ================= */
  function col(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function lathe(pts, seg) { return new THREE.LatheGeometry(pts.map(function (p) { return new V2(p[0], p[1]); }), seg || 96); }
  function rrect(w, d, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -d / 2; r = Math.min(r, w / 2, d / 2);
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function ellipseShape(rx, ry, cx, cy, hole) {
    var s = hole ? new THREE.Path() : new THREE.Shape();
    s.absellipse(cx || 0, cy || 0, rx, ry, 0, Math.PI * 2, hole ? true : false, 0);
    return s;
  }
  /* Extruye una forma del plano XY hacia arriba (eje Y). La "y" de la forma pasa a ser -z. */
  function slab(shape, h, bevel, seg) {
    bevel = bevel || 0;
    var g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0005, h - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 6, curveSegments: seg || 32 });
    g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0);
    return g;
  }
  function mesh(geo, mat, parent, x, y, z) {
    var m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
    m.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(m); return m;
  }
  function tube(points, r, mat, parent, seg) {
    var curve = points.getPoint ? points : new THREE.CatmullRomCurve3(points.map(function (p) { return new V3(p[0], p[1], p[2]); }));
    return mesh(new THREE.TubeGeometry(curve, seg || 64, r, 24, false), mat, parent);
  }
  /* Cilindro hueco a lo largo de X, centrado */
  function hollow(rOut, rIn, len, mat, inMat, parent, map) {
    var g = new THREE.Group();
    var o = mesh(new THREE.CylinderGeometry(rOut, rOut, len, 64, 1, true), map || mat, g); o.rotation.z = Math.PI / 2;
    var i = mesh(new THREE.CylinderGeometry(rIn, rIn, len, 64, 1, true), inMat || mat, g); i.rotation.z = Math.PI / 2; i.material = (inMat || mat).clone(); i.material.side = THREE.BackSide;
    [-1, 1].forEach(function (s) { var ring = mesh(new THREE.RingGeometry(rIn, rOut, 64), mat, g); ring.rotation.y = s * Math.PI / 2; ring.position.x = s * len / 2; });
    if (parent) parent.add(g); return g;
  }
  function orient(obj, dir) { obj.quaternion.setFromUnitVectors(new V3(1, 0, 0), dir.clone().normalize()); }

  /* ================= materiales ================= */
  var M = {
    ceramic: function (hex) {
      var matte = /232426|26282b/i.test(hex);
      return new THREE.MeshPhysicalMaterial({ color: col(hex), roughness: matte ? 0.45 : 0.16, clearcoat: matte ? 0.25 : 1, clearcoatRoughness: matte ? 0.4 : 0.05, envMapIntensity: 1.25 });
    },
    seat: function (hex) { return new THREE.MeshPhysicalMaterial({ color: col(hex), roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.15 }); },
    metal: function (f) {
      var F = { cromo: ['#f2f4f6', 0.05], negro: ['#1d1e20', 0.48], niquel: ['#c9c3b8', 0.3], dorado: ['#d9b46b', 0.16] }[f] || ['#f2f4f6', 0.05];
      return new THREE.MeshStandardMaterial({ color: col(F[0]), metalness: f === 'negro' ? 0.55 : 1, roughness: F[1], envMapIntensity: 1.2 });
    },
    water: function () { return new THREE.MeshPhysicalMaterial({ color: col('#cfe9f5'), roughness: 0, metalness: 0, transparent: true, opacity: 0.55, clearcoat: 1 }); },
    dark: function () { return new THREE.MeshStandardMaterial({ color: col('#1b1d21'), roughness: 0.6 }); },
    pvc: function (hex) { return new THREE.MeshPhysicalMaterial({ color: col(hex), roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.3 }); },
    copper: function () { return new THREE.MeshStandardMaterial({ color: col('#e3915c'), metalness: 1, roughness: 0.26, envMapIntensity: 1.2 }); },
    plastic: function (hex, r) { return new THREE.MeshPhysicalMaterial({ color: col(hex), roughness: r == null ? 0.42 : r, clearcoat: 0.2 }); },
    wood: function (hex) { return new THREE.MeshStandardMaterial({ color: col(hex), roughness: 0.55, map: woodTex() }); },
    stone: function () { return new THREE.MeshPhysicalMaterial({ map: marbleTex(), roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.1 }); }
  };
  var _wood, _marble;
  function woodTex() {
    if (_wood) return _wood;
    var c = document.createElement('canvas'); c.width = 512; c.height = 512; var g = c.getContext('2d');
    g.fillStyle = '#d9d2c7'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 140; i++) { g.strokeStyle = 'rgba(90,60,30,' + (0.04 + Math.random() * 0.08) + ')'; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); var y = Math.random() * 512; g.moveTo(0, y); for (var x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 6); g.stroke(); }
    _wood = new THREE.CanvasTexture(c); _wood.encoding = THREE.sRGBEncoding; _wood.wrapS = _wood.wrapT = THREE.RepeatWrapping; return _wood;
  }
  function marbleTex() {
    if (_marble) return _marble;
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512; var g = c.getContext('2d');
    g.fillStyle = '#f1efea'; g.fillRect(0, 0, 1024, 512);
    for (var i = 0; i < 26; i++) {
      g.strokeStyle = 'rgba(120,118,112,' + (0.08 + Math.random() * 0.2) + ')'; g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath(); var x = Math.random() * 1024, y = Math.random() * 512; g.moveTo(x, y);
      for (var k = 0; k < 14; k++) { x += 40 + Math.random() * 60; y += (Math.random() - 0.5) * 70; g.lineTo(x, y); }
      g.stroke();
    }
    _marble = new THREE.CanvasTexture(c); _marble.encoding = THREE.sRGBEncoding; return _marble;
  }
  /* Texto impreso a lo largo de un cilindro (tubos y cables) */
  function printTex(text, bg, fg, repeats) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 2048; var g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 256, 2048);
    [64, 192].forEach(function (cx, k) {
      g.save(); g.translate(cx, 0); g.rotate(Math.PI / 2);
      g.fillStyle = fg; g.font = '700 46px "Barlow Condensed", "Arial Narrow", sans-serif'; g.textBaseline = 'middle';
      var w = g.measureText(text + '      ').width, x = 20 + k * w / 2;
      while (x < 2048) { g.fillText(text, x, 0); x += w; }
      g.restore();
    });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, repeats || 1); t.anisotropy = 8;
    return t;
  }

  /* ================= modelos ================= */
  var CERAMIC = [['Blanco', '#f7f7f4'], ['Hueso', '#efe5d0'], ['Gris', '#b9bdc1'], ['Negro mate', '#232426']];
  var FINISH = [['Cromo', 'cromo', '#e9ecef'], ['Negro mate', 'negro', '#1d1e20'], ['Níquel cepillado', 'niquel', '#c9c3b8'], ['Dorado', 'dorado', '#d9b46b']];

  function faucetMono(fin, tall) {
    var g = new THREE.Group(), m = M.metal(fin), h = tall ? 0.29 : 0.15;
    mesh(lathe([[0, 0], [0.031, 0], [0.032, 0.004], [0.029, 0.011], [0, 0.011]], 64), m, g);
    mesh(lathe([[0, 0.011], [0.023, 0.011], [0.023, h - 0.022], [0.021, h - 0.01], [0.015, h - 0.003], [0, h]], 64), m, g);
    var sp = new THREE.QuadraticBezierCurve3(new V3(0, h - 0.035, 0.012), new V3(0, h - 0.025, 0.1), new V3(0, h - 0.05, 0.128));
    tube(sp, 0.0105, m, g, 48);
    var aer = mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.012, 32), m, g, 0, h - 0.056, 0.13);
    mesh(new THREE.CircleGeometry(0.009, 24), M.dark(), g, 0, h - 0.0625, 0.13).rotation.x = Math.PI / 2;
    var lever = new THREE.Group(); lever.position.set(0, h, -0.004); lever.rotation.x = 0.22; g.add(lever);
    mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.02, 32), m, lever, 0, 0.008, 0);
    var hdl = mesh(slab(rrect(0.016, 0.085, 0.008), 0.011, 0.004), m, lever, 0, 0.012, -0.035);
    void hdl; void aer;
    return g;
  }
  function bowlProfile(scale) {
    return [[0, 0.002], [0.105, 0], [0.116, 0.008], [0.112, 0.032], [0.098, 0.09], [0.093, 0.16], [0.104, 0.23], [0.134, 0.3], [0.164, 0.35], [0.183, 0.385], [0.189, 0.399], [0.184, 0.406],
      [0.171, 0.405], [0.164, 0.392], [0.149, 0.36], [0.127, 0.32], [0.099, 0.28], [0.074, 0.252], [0.05, 0.238], [0, 0.232]].map(function (p) { return [p[0] * scale, p[1]]; });
  }
  function toilet(o, kind) {
    var g = new THREE.Group(), cer = M.ceramic(o.color), seatM = M.seat(o.color);
    var ez = kind === 'redondo' ? 1.12 : 1.3, cz = 0.07, rx = 0.19, rz = rx * ez;
    var bowl = mesh(lathe(bowlProfile(1), 128), cer, g); bowl.scale.z = ez; bowl.position.z = cz;
    var water = mesh(new THREE.CircleGeometry(0.118, 64), M.water(), g, 0, 0.3, cz); water.rotation.x = -Math.PI / 2; water.scale.y = ez; water.castShadow = false;
    var hole = mesh(new THREE.CircleGeometry(0.04, 32), M.dark(), g, 0, 0.245, cz - 0.02); hole.rotation.x = -Math.PI / 2;
    var seatShape = ellipseShape(rx, rz); seatShape.holes.push(ellipseShape(0.124, 0.124 * ez * 1.05, 0, 0.01, true));
    mesh(slab(seatShape, 0.022, 0.007, 64), seatM, g, 0, 0.405, cz);
    var pivot = new THREE.Group(); pivot.position.set(0, 0.428, cz - rz + 0.012); g.add(pivot);
    var lid = mesh(slab(ellipseShape(rx * 0.99, rz * 0.99), 0.018, 0.006, 64), seatM, pivot, 0, 0, rz - 0.012);
    pivot.rotation.x = o.lid === 'abierta' ? -1.72 : 0;
    void lid;
    [-0.065, 0.065].forEach(function (x) { mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 20), seatM, g, x, 0.425, cz - rz + 0.005).rotation.z = Math.PI / 2; });
    var back = cz - rz;
    mesh(slab(rrect(0.27, 0.17, 0.06), 0.08, 0.025), cer, g, 0, 0.33, back - 0.03);
    if (kind === 'unapieza') {
      mesh(slab(rrect(0.4, 0.2, 0.08), 0.29, 0.035), cer, g, 0, 0.37, back - 0.1);
      var m = M.metal('cromo');
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 48), m, g, 0, 0.664, back - 0.1);
      mesh(new THREE.BoxGeometry(0.002, 0.009, 0.06), M.dark(), g, 0, 0.667, back - 0.1);
    } else {
      var tw = kind === 'redondo' ? 0.37 : 0.42, td = kind === 'redondo' ? 0.17 : 0.19, th = kind === 'redondo' ? 0.33 : 0.36;
      var tz = back - td / 2 - 0.035;
      mesh(slab(rrect(tw, td, 0.035), th, 0.014), cer, g, 0, 0.4, tz);
      mesh(slab(rrect(tw + 0.02, td + 0.016, 0.04), 0.034, 0.012), cer, g, 0, 0.4 + th, tz);
      var chrome = M.metal('cromo');
      var lv = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 32), chrome, g, -tw / 2 + 0.06, 0.4 + th - 0.06, tz + td / 2 + 0.006); lv.rotation.x = Math.PI / 2;
      var arm = mesh(slab(rrect(0.075, 0.012, 0.005), 0.012, 0.004), chrome, g, -tw / 2 + 0.095, 0.4 + th - 0.066, tz + td / 2 + 0.016); arm.rotation.z = -0.15;
    }
    [-1, 1].forEach(function (s) { mesh(new THREE.SphereGeometry(0.017, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cer, g, s * 0.117, 0.004, cz - 0.03); });
    return g;
  }
  function sinkCup(rx, rz, depth, cer, parent, y, z) {
    var cup = mesh(lathe([[rx, 0], [rx * 0.975, -depth * 0.2], [rx * 0.88, -depth * 0.55], [rx * 0.62, -depth * 0.86], [rx * 0.25, -depth], [0, -depth]], 96), cer.clone(), parent, 0, y, z);
    cup.material.side = THREE.DoubleSide; cup.scale.z = rz / rx;
    mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.004, 32), M.metal('cromo'), parent, 0, y - depth + 0.002, z);
    return cup;
  }
  function sinkPedestal(o) {
    var g = new THREE.Group(), cer = M.ceramic(o.color);
    var deck = rrect(0.56, 0.45, 0.1); deck.holes.push(ellipseShape(0.205, 0.155, 0, -0.03, true));
    mesh(slab(deck, 0.03, 0.012), cer, g, 0, 0.82, 0);
    var apr = rrect(0.53, 0.42, 0.09); apr.holes.push(ellipseShape(0.205, 0.155, 0, -0.03, true));
    mesh(slab(apr, 0.13, 0.03), cer, g, 0, 0.7, 0);
    sinkCup(0.205, 0.155, 0.14, cer, g, 0.848, 0.03);
    var ped = mesh(lathe([[0, 0], [0.11, 0], [0.112, 0.012], [0.094, 0.03], [0.07, 0.12], [0.058, 0.36], [0.068, 0.56], [0.1, 0.665], [0.13, 0.71], [0, 0.71]], 96), cer, g, 0, 0, -0.06);
    ped.scale.z = 0.78;
    var f = faucetMono(o.finish); f.position.set(0, 0.85, -0.165); g.add(f);
    return g;
  }
  function sinkVessel(o) {
    var g = new THREE.Group(), cer = M.ceramic(o.color);
    mesh(slab(rrect(0.9, 0.5, 0.012), 0.24, 0.006), M.wood('#b98a5e'), g, 0, 0.58, 0);
    mesh(slab(rrect(0.92, 0.52, 0.008), 0.035, 0.004), M.stone(), g, 0, 0.82, 0);
    mesh(lathe([[0, 0], [0.085, 0], [0.17, 0.025], [0.205, 0.07], [0.215, 0.13], [0.213, 0.142], [0.205, 0.145], [0.2, 0.135], [0.192, 0.085], [0.165, 0.042], [0.085, 0.016], [0, 0.016]], 128), cer, g, 0, 0.855, 0.03);
    mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.004, 32), M.metal('cromo'), g, 0, 0.873, 0.03);
    var f = faucetMono(o.finish, true); f.position.set(0, 0.855, -0.2); g.add(f);
    return g;
  }
  function sinkVanity(o) {
    var g = new THREE.Group(), cer = M.ceramic(o.color);
    var body = M.plastic('#f3f2ee', 0.35);
    mesh(new THREE.BoxGeometry(0.76, 0.09, 0.42), M.dark(), g, 0, 0.045, -0.02);
    mesh(slab(rrect(0.8, 0.48, 0.008), 0.72, 0.004), body, g, 0, 0.09, 0);
    var hm = M.metal(o.finish);
    [-0.2, 0.2].forEach(function (x) {
      mesh(slab(rrect(0.385, 0.018, 0.004), 0.68, 0.004), body, g, x, 0.11, 0.247);
      var h = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 16), hm, g, x + (x < 0 ? 0.16 : -0.16), 0.62, 0.27);
      void h;
    });
    var top = rrect(0.82, 0.5, 0.008); top.holes.push(ellipseShape(0.21, 0.16, 0, -0.02, true));
    mesh(slab(top, 0.03, 0.004), M.stone(), g, 0, 0.81, 0);
    sinkCup(0.21, 0.16, 0.15, cer, g, 0.836, 0.02);
    var f = faucetMono(o.finish); f.position.set(0, 0.84, -0.18); g.add(f);
    return g;
  }
  function kitchenFaucet(o) {
    var g = new THREE.Group(), m = M.metal(o.finish);
    mesh(lathe([[0, 0], [0.034, 0], [0.035, 0.005], [0.031, 0.014], [0, 0.014]], 64), m, g);
    mesh(lathe([[0, 0.014], [0.024, 0.014], [0.022, 0.16], [0.018, 0.2], [0, 0.2]], 64), m, g);
    var curve = new THREE.CatmullRomCurve3([new V3(0, 0.19, 0), new V3(0, 0.33, 0), new V3(0, 0.405, 0.05), new V3(0, 0.395, 0.15), new V3(0, 0.33, 0.205)], false, 'catmullrom', 0.5);
    tube(curve, 0.0125, m, g, 96);
    var head = mesh(lathe([[0, 0], [0.016, 0], [0.019, 0.02], [0.016, 0.06], [0, 0.06]], 48), m, g, 0, 0.27, 0.208);
    mesh(new THREE.CircleGeometry(0.015, 32), M.dark(), g, 0, 0.271, 0.208).rotation.x = Math.PI / 2;
    var lv = new THREE.Group(); lv.position.set(0.024, 0.12, 0); g.add(lv);
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 32), m, lv).rotation.z = Math.PI / 2;
    mesh(slab(rrect(0.012, 0.012, 0.005), 0.08, 0.004), m, lv, 0.012, 0, 0).rotation.z = -0.35;
    void head;
    return g;
  }
  function showerHead(o) {
    var g = new THREE.Group(), m = M.metal(o.finish);
    var fl = mesh(lathe([[0, 0], [0.035, 0], [0.034, 0.01], [0.012, 0.02], [0, 0.02]], 48), m, g, 0, 0.3, -0.3); fl.rotation.x = Math.PI / 2;
    var arm = new THREE.CatmullRomCurve3([new V3(0, 0.3, -0.29), new V3(0, 0.31, -0.08), new V3(0, 0.29, 0), new V3(0, 0.25, 0.01)]);
    tube(arm, 0.0105, m, g, 64);
    var hd = new THREE.Group(); hd.position.set(0, 0.235, 0.01); g.add(hd);
    mesh(lathe([[0, 0], [0.11, 0], [0.112, 0.004], [0.108, 0.012], [0.03, 0.02], [0, 0.022]], 96), m, hd);
    var face = mesh(new THREE.CircleGeometry(0.104, 96), M.plastic('#2a2c30', 0.5), hd, 0, -0.0005, 0); face.rotation.x = Math.PI / 2;
    var noz = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0022, 0.0028, 0.004, 10), M.plastic('#15171a', 0.3), 200);
    var d = new THREE.Object3D(), n = 0;
    for (var ring = 1; ring <= 6; ring++) {
      var r = ring * 0.0155, cnt = Math.round(ring * 7.5);
      for (var k = 0; k < cnt && n < 200; k++) { var a = k / cnt * Math.PI * 2; d.position.set(Math.cos(a) * r, -0.002, Math.sin(a) * r); d.updateMatrix(); noz.setMatrixAt(n++, d.matrix); }
    }
    noz.count = n; hd.add(noz);
    return g;
  }

  /* ---- Tubería PVC ---- */
  var OD = { '1/2"': [21.3, 2.77], '3/4"': [26.7, 2.87], '1"': [33.4, 3.38], '1-1/2"': [48.3, 3.68], '2"': [60.3, 3.91], '3"': [88.9, 5.49], '4"': [114.3, 6.02] };
  var PVCT = [['PVC blanco · agua fría', '#f2f3f1', 'PVC SCH 40'], ['CPVC · agua caliente', '#e6d3a4', 'CPVC CTS'], ['PVC gris SCH 80 · presión', '#6d7378', 'PVC SCH 80']];
  function pvcMat(o) { return M.pvc(PVCT[o.tipo][1]); }
  function socket(od, mat, parent, pos, dir) {
    var r = od / 2, len = Math.max(od * 1.1, 0.019);
    var g = new THREE.Group();
    hollow(r * 1.22, r * 1.005, len, mat, mat, g);
    var stop = mesh(new THREE.CircleGeometry(r * 1.005, 48), M.plastic('#9aa0a6', 0.6), g, -len / 2 + 0.0005, 0, 0); stop.rotation.y = Math.PI / 2;
    var lip = mesh(new THREE.TorusGeometry(r * 1.11, r * 0.11, 12, 64), mat, g, len / 2, 0, 0); lip.rotation.y = Math.PI / 2;
    orient(g, dir); g.position.copy(pos).addScaledVector(dir.clone().normalize(), len / 2);
    parent.add(g); return len;
  }
  function pvcFitting(o, kind) {
    var g = new THREE.Group(), od = OD[o.d][0] / 1000, r = od / 2, mat = pvcMat(o), br = r * 1.13;
    if (kind === 'tubo') {
      var L = Math.min(0.6, Math.max(0.2, od * 8)), wall = OD[o.d][1] / 1000;
      var tex = printTex(PVCT[o.tipo][2] + '  ' + o.d + '  ·  ' + (o.tipo === 1 ? 'AGUA CALIENTE 82 °C' : 'AGUA POTABLE') + '  ·  ASTM', PVCT[o.tipo][1], o.tipo === 2 ? '#e8eaec' : '#2b3a55', Math.max(1, L / 0.35));
      var pm = mat.clone(); pm.map = tex; pm.color.setRGB(1, 1, 1);
      var p = hollow(r, r - wall, L, mat, mat, g, pm); void p;
    } else if (kind === 'codo90' || kind === 'codo45') {
      var a = kind === 'codo90' ? Math.PI / 2 : Math.PI / 4, R = od * 1.15;
      mesh(new THREE.TorusGeometry(R, br, 32, 64, a), mat, g);
      socket(od, mat, g, new V3(R, 0, 0), new V3(0, -1, 0));
      socket(od, mat, g, new V3(R * Math.cos(a), R * Math.sin(a), 0), new V3(-Math.sin(a), Math.cos(a), 0));
    } else if (kind === 'tee') {
      var Lm = od * 1.6;
      mesh(new THREE.CylinderGeometry(br, br, Lm, 64), mat, g).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(br, br, od * 0.8, 64), mat, g, 0, od * 0.4, 0);
      mesh(new THREE.SphereGeometry(br, 48, 24), mat, g);
      socket(od, mat, g, new V3(Lm / 2, 0, 0), new V3(1, 0, 0));
      socket(od, mat, g, new V3(-Lm / 2, 0, 0), new V3(-1, 0, 0));
      socket(od, mat, g, new V3(0, od * 0.8, 0), new V3(0, 1, 0));
    } else if (kind === 'yee') {
      var Ly = od * 2.2;
      mesh(new THREE.CylinderGeometry(br, br, Ly, 64), mat, g).rotation.z = Math.PI / 2;
      var dir = new V3(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), 0), bl = od * 1.1, start = new V3(-od * 0.35, 0, 0);
      var b = mesh(new THREE.CylinderGeometry(br, br, bl, 64), mat, g); b.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir); b.position.copy(start).addScaledVector(dir, bl / 2);
      socket(od, mat, g, new V3(Ly / 2, 0, 0), new V3(1, 0, 0));
      socket(od, mat, g, new V3(-Ly / 2, 0, 0), new V3(-1, 0, 0));
      socket(od, mat, g, start.clone().addScaledVector(dir, bl), dir);
    } else if (kind === 'union') {
      mesh(new THREE.CylinderGeometry(r * 1.27, r * 1.27, od * 0.22, 64), mat, g).rotation.z = Math.PI / 2;
      socket(od, mat, g, new V3(0.0005, 0, 0), new V3(1, 0, 0));
      socket(od, mat, g, new V3(-0.0005, 0, 0), new V3(-1, 0, 0));
    } else if (kind === 'adaptador') {
      var sl = socket(od, mat, g, new V3(0, 0, 0), new V3(-1, 0, 0));
      var hex = mesh(new THREE.CylinderGeometry(r * 1.48, r * 1.48, od * 0.45, 6), mat, g, od * 0.225, 0, 0); hex.rotation.z = Math.PI / 2;
      var tl = od * 0.85, x0 = od * 0.45, rc = r * 0.98;
      mesh(new THREE.CylinderGeometry(rc, rc, tl, 64, 1, true), mat, g, x0 + tl / 2, 0, 0).rotation.z = Math.PI / 2;
      var turns = tl / (od * 0.14), helix = new THREE.Curve();
      helix.getPoint = function (t) { var an = t * turns * Math.PI * 2; return new V3(x0 + t * tl, Math.cos(an) * rc, Math.sin(an) * rc); };
      mesh(new THREE.TubeGeometry(helix, Math.round(turns * 40), od * 0.035, 8, false), mat, g);
      var endRing = mesh(new THREE.RingGeometry(r * 0.8, rc, 48), mat, g, x0 + tl, 0, 0); endRing.rotation.y = Math.PI / 2;
      var bore = mesh(new THREE.CircleGeometry(r * 0.8, 48), M.plastic('#9aa0a6', 0.6), g, x0 + tl - 0.002, 0, 0); bore.rotation.y = Math.PI / 2;
      void sl;
    } else if (kind === 'tapon') {
      var len = socket(od, mat, g, new V3(0, 0, 0), new V3(-1, 0, 0));
      var cap = mesh(lathe([[0, 0], [r * 1.22, 0], [r * 1.2, od * 0.08], [r * 0.9, od * 0.18], [0, od * 0.21]], 64), mat, g); cap.rotation.z = -Math.PI / 2;
      void len;
    }
    if (/codo|tee|yee/.test(kind)) { var w = new THREE.Group(); g.rotation.x = -Math.PI / 2; w.add(g); return w; }
    return g;
  }

  /* ---- Cables ---- */
  var AWG = { '14': [1.85, 2.9, 7], '12': [2.32, 3.4, 7], '10': [2.95, 4.2, 7], '8': [3.71, 5.6, 7], '6': [4.67, 6.5, 19], '4': [5.89, 8.2, 19], '2': [7.42, 9.8, 19], '1/0': [9.45, 12.3, 19], '2/0': [10.6, 13.5, 19] };
  var WIRE = [['Negro', '#18191b', '#ffffff'], ['Blanco', '#f1f1ee', '#1c1c1c'], ['Rojo', '#c62a20', '#ffffff'], ['Verde', '#2f8a4c', '#ffffff'], ['Azul', '#2456a8', '#ffffff'], ['Amarillo', '#e9c22a', '#1c1c1c']];
  function strands(condD, n, len, parent, mat) {
    var d = condD / 1000, rs = n === 7 ? d / 6 : d / 10, lay = d * 14;
    var rings = n === 7 ? [[0, 1], [2 * rs, 6]] : [[0, 1], [2 * rs, 6], [4 * rs, 12]];
    rings.forEach(function (rg, ri) {
      for (var k = 0; k < rg[1]; k++) {
        if (rg[0] === 0) { mesh(new THREE.CylinderGeometry(rs * 0.97, rs * 0.97, len, 16), mat, parent, len / 2, 0, 0).rotation.z = Math.PI / 2; continue; }
        var a0 = k / rg[1] * Math.PI * 2, rr = rg[0], dirn = ri % 2 ? 1 : -1;
        var Hx = function (a0, rr, dirn) { var c = new THREE.Curve(); c.getPoint = function (t) { var an = a0 + dirn * t * len / lay * Math.PI * 2; return new V3(t * len, Math.cos(an) * rr, Math.sin(an) * rr); }; return c; };
        mesh(new THREE.TubeGeometry(Hx(a0, rr, dirn), 48, rs * 0.97, 10, false), mat, parent);
      }
    });
  }
  function thhn(o) {
    var g = new THREE.Group(), s = AWG[o.awg], cond = s[0] / 1000, od = s[1] / 1000, L = Math.max(od * 15, 0.035);
    var cu = M.copper(), wc = WIRE[o.color];
    var Lc = L * 0.24, Ln = L * 0.36, nylon = Math.max(0.00012, od * 0.035), ri = od / 2 - nylon;
    strands(s[0], s[2], Lc + od * 0.4, g, cu);
    var tex = printTex('THHN / THWN-2   ' + o.awg + ' AWG   600 V   CU   90 °C', wc[1], wc[2], Math.max(1, (L - Lc) / (od * 10)));
    var ins = M.plastic('#ffffff', 0.38); ins.map = tex;
    var insG = new THREE.Group(); insG.position.x = Lc + (L - Lc) / 2; g.add(insG);
    hollow(ri, cond / 2 * 1.01, L - Lc, M.plastic(wc[1], 0.4), M.plastic(wc[1], 0.4), insG, ins);
    var nyl = new THREE.MeshPhysicalMaterial({ color: col('#ffffff'), roughness: 0.05, transparent: true, opacity: 0.08, clearcoat: 1 });
    var nG = new THREE.Group(); nG.position.x = Ln + (L - Ln) / 2; g.add(nG);
    hollow(od / 2, ri, L - Ln, nyl, nyl, nG);
    var core = mesh(new THREE.CircleGeometry(cond / 2, 32), cu, g, L + 0.00005, 0, 0); core.rotation.y = Math.PI / 2;
    return g;
  }
  function duplex(o) {
    var g = new THREE.Group(), gauge = o.awg, s = AWG[gauge], cond = s[0] / 1000 * 0.86, ins = s[1] / 1000, gd = cond * 0.9;
    var jT = 0.0007, W = ins * 2 + gd + jT * 2 + 0.0006, H = ins + jT * 2, L = Math.max(W * 7, 0.06);
    var jColor = { '14': '#f4f3ef', '12': '#ecc93a', '10': '#e7832e' }[gauge];
    var cu = M.copper(), L0 = L * 0.42, Lc = L * 0.16;
    var x1 = -(ins / 2 + gd / 2 + 0.0002), x2 = -x1;
    [[x1, '#18191b', '#ffffff'], [x2, '#f1f1ee', '#1c1c1c']].forEach(function (c) {
      var cG = new THREE.Group(); cG.position.set(Lc + (L - Lc) / 2, 0, c[0]); g.add(cG);
      hollow(ins / 2, cond / 2, L - Lc, M.plastic(c[1], 0.38), M.plastic(c[1], 0.38), cG);
      mesh(new THREE.CylinderGeometry(cond / 2, cond / 2, Lc + ins, 32), cu, g, (Lc + ins) / 2, 0, c[0]).rotation.z = Math.PI / 2;
    });
    mesh(new THREE.CylinderGeometry(gd / 2, gd / 2, L, 24), cu, g, L / 2, 0, 0).rotation.z = Math.PI / 2;
    var shape = new THREE.Shape(), hw = W / 2 - H / 2;
    shape.absarc(hw, 0, H / 2, -Math.PI / 2, Math.PI / 2, false); shape.absarc(-hw, 0, H / 2, Math.PI / 2, Math.PI * 1.5, false);
    var inner = new THREE.Path(), ih = H / 2 - jT, iw = hw;
    inner.absarc(iw, 0, ih, -Math.PI / 2, Math.PI / 2, false); inner.absarc(-iw, 0, ih, Math.PI / 2, Math.PI * 1.5, false);
    shape.holes.push(inner);
    var jg = new THREE.ExtrudeGeometry(shape, { depth: L - L0, bevelEnabled: false, curveSegments: 32 });
    jg.rotateY(Math.PI / 2);
    var jm = M.plastic(jColor, 0.4); jm.map = printTex('NM-B  ' + gauge + '-2  CON TIERRA  600 V', jColor, '#1c1c1c', 2);
    var jacket = mesh(jg, jm, g, L0, 0, 0);
    void jacket;
    return g;
  }
  function stripeTex(fg) {
    var c = document.createElement('canvas'); c.width = 32; c.height = 64; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#555'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#555');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 64);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function coil(o) {
    var g = new THREE.Group(), s = AWG[o.awg], wc = WIRE[o.color], d = s[1] / 1000;
    var Ri = 0.075, Ro = 0.125, H = 0.075;
    var turnsH = Math.round(H / d), turnsR = Math.round((Ro - Ri) / d);
    var prof = [[Ri, 0], [Ro, 0], [Ro + 0.004, 0.004], [Ro + 0.004, H - 0.004], [Ro, H], [Ri, H], [Ri - 0.003, H - 0.003], [Ri - 0.003, 0.003], [Ri, 0]];
    var st = stripeTex(); st.repeat.set(1, turnsH);
    var mat = new THREE.MeshPhysicalMaterial({ color: col(wc[1]), roughness: 0.35, clearcoat: 0.6, bumpMap: st, bumpScale: 0.002 });
    mesh(lathe(prof, 128), mat, g);
    var wrapM = new THREE.MeshPhysicalMaterial({ color: col('#ffffff'), transparent: true, opacity: 0.18, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide });
    mesh(lathe([[Ri - 0.006, -0.002], [Ro + 0.008, -0.002], [Ro + 0.009, H + 0.002], [Ri - 0.006, H + 0.002]], 96), wrapM, g).castShadow = false;
    var lc = document.createElement('canvas'); lc.width = 512; lc.height = 256; var lg = lc.getContext('2d');
    lg.fillStyle = '#ffffff'; lg.fillRect(0, 0, 512, 256); lg.fillStyle = '#c62a20'; lg.fillRect(0, 0, 512, 56);
    lg.fillStyle = '#fff'; lg.font = 'italic 800 40px "Barlow Condensed", Impact, sans-serif'; lg.fillText('CABLE THHN / THWN-2', 22, 42);
    lg.fillStyle = '#16181b'; lg.font = '800 92px "Barlow Condensed", Impact, sans-serif'; lg.fillText(o.awg + ' AWG', 22, 150);
    lg.font = '700 44px "Barlow Condensed", sans-serif'; lg.fillText('100 m  ·  600 V  ·  ' + wc[0].toUpperCase(), 22, 220);
    var lt = new THREE.CanvasTexture(lc); lt.encoding = THREE.sRGBEncoding;
    var label = mesh(new THREE.CylinderGeometry(Ro + 0.0095, Ro + 0.0095, H * 0.62, 64, 1, true, -0.55, 1.1), new THREE.MeshStandardMaterial({ map: lt, roughness: 0.5 }), g, 0, H / 2, 0);
    label.castShadow = false;
    void turnsR;
    return g;
  }
  function gaugeCompare(o) {
    var g = new THREE.Group(), x = 0, cu = M.copper(), wc = WIRE[o.color], keys = Object.keys(AWG);
    var labels = [];
    keys.forEach(function (k) {
      var s = AWG[k], od = s[1] / 1000, cd = s[0] / 1000, h = 0.03;
      x += od / 2;
      var ins = mesh(new THREE.CylinderGeometry(od / 2, od / 2, h, 48, 1, true), M.plastic(wc[1], 0.4), g, x, h / 2, 0);
      var top = mesh(new THREE.RingGeometry(cd / 2, od / 2, 48), M.plastic(wc[1], 0.4), g, x, h, 0); top.rotation.x = -Math.PI / 2;
      mesh(new THREE.CylinderGeometry(cd / 2, cd / 2, h + 0.0015, 32), cu, g, x, (h + 0.0015) / 2, 0);
      labels.push({ x: x, k: k, mm: s[1] });
      x += od / 2 + 0.006;
      void ins;
    });
    g.userData.labels = labels;
    return g;
  }

  /* ================= catálogo ================= */
  var optCeramic = { id: 'color', label: 'Color', type: 'swatch', values: CERAMIC.map(function (c) { return { v: c[1], label: c[0], hex: c[1] }; }), def: '#f7f7f4' };
  var optFinish = { id: 'finish', label: 'Acabado', type: 'swatch', values: FINISH.map(function (f) { return { v: f[1], label: f[0], hex: f[2] }; }), def: 'cromo' };
  var optLid = { id: 'lid', label: 'Tapa', type: 'seg', values: [{ v: 'cerrada', label: 'Cerrada' }, { v: 'abierta', label: 'Abierta' }], def: 'abierta' };
  var optD = { id: 'd', label: 'Diámetro', type: 'seg', values: Object.keys(OD).map(function (k) { return { v: k, label: k }; }), def: '1/2"' };
  var optTipo = { id: 'tipo', label: 'Material', type: 'seg', values: PVCT.map(function (t, i) { return { v: i, label: t[0] }; }), def: 0 };
  var optAwg = { id: 'awg', label: 'Calibre', type: 'seg', values: Object.keys(AWG).map(function (k) { return { v: k, label: k + ' AWG' }; }), def: '12' };
  var optAwgNm = { id: 'awg', label: 'Calibre', type: 'seg', values: [{ v: '14', label: '14-2' }, { v: '12', label: '12-2' }, { v: '10', label: '10-2' }], def: '12' };
  var optWire = { id: 'color', label: 'Color del aislamiento', type: 'swatch', values: WIRE.map(function (w, i) { return { v: i, label: w[0], hex: w[1] }; }), def: 0 };
  function ceramicName(hex) { var c = CERAMIC.filter(function (x) { return x[1] === hex; })[0]; return c ? c[0].toLowerCase() : ''; }
  function finishName(f) { var c = FINISH.filter(function (x) { return x[1] === f; })[0]; return c ? c[0].toLowerCase() : ''; }
  function boxDims(box) { return [{ ax: 'h', v: box.max.y - box.min.y }, { ax: 'w', v: box.max.x - box.min.x }, { ax: 'd', v: box.max.z - box.min.z }]; }
  function pvcSpecs(o, extra) { var d = OD[o.d]; return [['Diámetro nominal', o.d], ['Diámetro exterior', d[0].toFixed(1) + ' mm'], ['Material', PVCT[o.tipo][0]], ['Unión', 'Cementada (socket)']].concat(extra || []); }

  var CATS = [
    { id: 'sanitarios', n: 'Sanitarios', items: [
      { id: 'inodoro-alargado', n: 'Inodoro de dos piezas, taza alargada', short: 'Inodoro alargado', desc: 'El más pedido para baños de casa: taza alargada más cómoda, tanque separado y asiento con tapa.', opts: [optCeramic, optLid],
        build: function (o) { return toilet(o, 'alargado'); }, dims: boxDims,
        specs: function () { return [['Tipo', 'Dos piezas'], ['Taza', 'Alargada'], ['Salida', 'Al piso, a 30 cm de la pared (12")'], ['Material', 'Porcelana vitrificada']]; } },
      { id: 'inodoro-unapieza', n: 'Inodoro de una pieza', short: 'Inodoro una pieza', desc: 'Tanque y taza en una sola pieza: más fácil de limpiar y de líneas más modernas. Descarga con botón superior.', opts: [optCeramic, optLid],
        build: function (o) { return toilet(o, 'unapieza'); }, dims: boxDims,
        specs: function () { return [['Tipo', 'Una pieza'], ['Taza', 'Alargada'], ['Descarga', 'Botón superior'], ['Material', 'Porcelana vitrificada']]; } },
      { id: 'inodoro-redondo', n: 'Inodoro compacto, taza redonda', short: 'Inodoro compacto', desc: 'Ocupa menos fondo: ideal para baños pequeños y de visita.', opts: [optCeramic, optLid],
        build: function (o) { return toilet(o, 'redondo'); }, dims: boxDims,
        specs: function () { return [['Tipo', 'Dos piezas'], ['Taza', 'Redonda, compacta'], ['Uso', 'Baños pequeños'], ['Material', 'Porcelana vitrificada']]; } },
      { id: 'lavamanos-pedestal', n: 'Lavamanos de pedestal', short: 'Lavamanos pedestal', desc: 'Clásico y económico. El pedestal oculta las tuberías.', opts: [optCeramic, optFinish],
        build: sinkPedestal, dims: boxDims,
        specs: function (o) { return [['Instalación', 'Pedestal, a la pared'], ['Grifería', 'Monomando ' + finishName(o.finish)], ['Material', 'Porcelana vitrificada']]; } },
      { id: 'lavamanos-sobreponer', n: 'Lavamanos de sobreponer', short: 'Lavamanos sobreponer', desc: 'Se apoya sobre el mueble o la meseta. Se combina con una mezcladora alta.', opts: [optCeramic, optFinish],
        build: sinkVessel, dims: boxDims,
        specs: function (o) { return [['Instalación', 'Sobre meseta'], ['Grifería', 'Mezcladora alta ' + finishName(o.finish)], ['Material', 'Porcelana vitrificada']]; } },
      { id: 'lavamanos-mueble', n: 'Lavamanos con mueble', short: 'Lavamanos con mueble', desc: 'Mueble con puertas, meseta y lavamanos de empotrar: guarda todo y oculta las tuberías.', opts: [optCeramic, optFinish],
        build: sinkVanity, dims: boxDims,
        specs: function (o) { return [['Instalación', 'Mueble al piso'], ['Meseta', 'Tipo mármol'], ['Grifería', 'Monomando ' + finishName(o.finish)]]; } }
    ] },
    { id: 'griferia', n: 'Grifería', items: [
      { id: 'monomando', n: 'Mezcladora monomando para lavamanos', short: 'Monomando lavamanos', desc: 'Una sola palanca para controlar agua fría y caliente.', opts: [optFinish],
        build: function (o) { return faucetMono(o.finish); }, dims: function (b) { return [{ ax: 'h', v: b.max.y - b.min.y }, { ax: 'd', v: b.max.z - b.min.z, name: 'Alcance' }]; },
        specs: function (o) { return [['Tipo', 'Monomando'], ['Acabado', finishName(o.finish)], ['Conexión', '1/2" con mangueras flexibles']]; } },
      { id: 'cocina', n: 'Llave de cocina cuello de ganso', short: 'Llave de cocina', desc: 'Cuello alto y giratorio para llenar ollas grandes y lavar con comodidad.', opts: [optFinish],
        build: kitchenFaucet, dims: function (b) { return [{ ax: 'h', v: b.max.y - b.min.y }, { ax: 'd', v: b.max.z - b.min.z, name: 'Alcance' }]; },
        specs: function (o) { return [['Tipo', 'Monomando lateral'], ['Cuello', 'Alto, giratorio 360°'], ['Acabado', finishName(o.finish)]]; } },
      { id: 'regadera', n: 'Regadera redonda de pared', short: 'Regadera', desc: 'Cabezal ancho de 22 cm con boquillas de silicón que se limpian con el dedo.', opts: [optFinish],
        build: showerHead, dims: function (b) { return [{ ax: 'w', v: b.max.x - b.min.x, name: 'Diámetro' }, { ax: 'd', v: b.max.z - b.min.z, name: 'Brazo' }]; },
        specs: function (o) { return [['Cabezal', '22 cm de diámetro'], ['Boquillas', 'Silicón antisarro'], ['Acabado', finishName(o.finish)], ['Conexión', '1/2"']]; } }
    ] },
    { id: 'pvc', n: 'Tubería PVC', calc: 'pvc', items: [
      { id: 'tubo', n: 'Tubo de presión', short: 'Tubo', desc: 'Tubo para agua potable con marcaje de norma impreso. Se vende en piezas de 6 m (19 pies).', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'tubo'); }, pipe: true,
        specs: function (o) { return pvcSpecs(o, [['Espesor de pared', OD[o.d][1].toFixed(2) + ' mm'], ['Largo', '6 m']]); } },
      { id: 'codo90', n: 'Codo de 90°', short: 'Codo 90°', desc: 'Cambia la dirección de la tubería en ángulo recto.', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'codo90'); }, pipe: true, specs: pvcSpecs },
      { id: 'codo45', n: 'Codo de 45°', short: 'Codo 45°', desc: 'Para desvíos suaves: menos pérdida de presión que un codo de 90°.', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'codo45'); }, pipe: true, specs: pvcSpecs },
      { id: 'tee', n: 'Tee', short: 'Tee', desc: 'Saca una derivación a 90° de la línea principal.', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'tee'); }, pipe: true, specs: pvcSpecs },
      { id: 'yee', n: 'Yee a 45°', short: 'Yee', desc: 'Derivación a 45°: la conexión correcta para drenajes.', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'yee'); }, pipe: true, specs: pvcSpecs },
      { id: 'union', n: 'Unión (cople)', short: 'Unión', desc: 'Une dos tubos del mismo diámetro en línea recta.', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'union'); }, pipe: true, specs: pvcSpecs },
      { id: 'adaptador', n: 'Adaptador macho', short: 'Adaptador macho', desc: 'Pasa de unión cementada a rosca: para llaves, mangueras y equipos.', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'adaptador'); }, pipe: true,
        specs: function (o) { return pvcSpecs(o, [['Rosca', 'NPT macho']]); } },
      { id: 'tapon', n: 'Tapón', short: 'Tapón', desc: 'Cierra el extremo de una línea para pruebas o salidas futuras.', opts: [optD, optTipo], build: function (o) { return pvcFitting(o, 'tapon'); }, pipe: true, specs: pvcSpecs }
    ] },
    { id: 'cables', n: 'Cables eléctricos', calc: 'cable', items: [
      { id: 'thhn', n: 'Cable THHN / THWN-2', short: 'Cable THHN', desc: 'Cobre trenzado con aislamiento de PVC y chaqueta de nylon. El cable para instalaciones en tubería conduit.', opts: [optAwg, optWire], build: thhn, wire: true,
        specs: function (o) { var s = AWG[o.awg]; return [['Calibre', o.awg + ' AWG'], ['Conductor', 'Cobre, ' + s[2] + ' hilos · Ø ' + s[0].toFixed(2) + ' mm'], ['Diámetro total', s[1].toFixed(1) + ' mm'], ['Voltaje', '600 V · 90 °C seco / 75 °C mojado'], ['Color', WIRE[o.color][0]]]; } },
      { id: 'duplex', n: 'Cable NM-B con tierra (dúplex)', short: 'Cable NM-B', desc: 'Dos conductores aislados y tierra desnuda dentro de una chaqueta. Para instalaciones dentro de paredes y techos secos.', opts: [optAwgNm], build: duplex, wire: true,
        specs: function (o) { return [['Calibre', o.awg + '-2 con tierra'], ['Conductores', 'Negro, blanco y tierra de cobre'], ['Chaqueta', { '14': 'Blanca', '12': 'Amarilla', '10': 'Naranja' }[o.awg] + ' (código por calibre)'], ['Voltaje', '600 V']]; } },
      { id: 'rollo', n: 'Rollo de cable THHN de 100 m', short: 'Rollo 100 m', desc: 'La presentación para obra: 100 metros empacados, con calibre y color identificados.', opts: [optAwg, optWire], build: coil, dims: function (b) { return [{ ax: 'w', v: b.max.x - b.min.x, name: 'Diámetro' }, { ax: 'h', v: b.max.y - b.min.y }]; },
        specs: function (o) { return [['Contenido', '100 m'], ['Calibre', o.awg + ' AWG'], ['Color', WIRE[o.color][0]]]; } },
      { id: 'calibres', n: 'Comparador de calibres', short: 'Comparar calibres', desc: 'Todos los calibres a escala real, uno junto al otro, para ver la diferencia de grosor.', opts: [optWire], build: gaugeCompare, compare: true,
        specs: function () { return [['Calibres', '14 AWG a 2/0 AWG'], ['Escala', 'Real, sección del cable con aislamiento']]; } }
    ] }
  ];

  /* ================= visor ================= */
  var ICO = {
    rot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v5h5"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
  };
  app.innerHTML =
    '<div class="cat-tabs" role="tablist" aria-label="Categorías">' + CATS.map(function (c) { return '<button type="button" role="tab" data-cat="' + c.id + '">' + c.n + '<small>' + c.items.length + '</small></button>'; }).join('') + '</div>' +
    '<div class="cat-grid"><div class="cat-left">' +
    '<div class="cat-stage" id="catStage"><canvas aria-label="Vista 3D del producto"></canvas>' +
    '<div class="cs-badge" id="csBadge"></div>' +
    '<div class="cs-tools" role="toolbar" aria-label="Controles de la vista">' +
    '<button type="button" id="tRot" aria-pressed="true" title="Girar automáticamente">' + ICO.rot + '<span>Girar</span></button>' +
    '<button type="button" id="tDims" aria-pressed="true" title="Mostrar medidas">' + ICO.ruler + '<span>Medidas</span></button>' +
    '<button type="button" id="tIn" title="Acercar" aria-label="Acercar">' + ICO.plus + '</button>' +
    '<button type="button" id="tOut" title="Alejar" aria-label="Alejar">' + ICO.minus + '</button>' +
    '<button type="button" id="tReset" title="Vista inicial" aria-label="Vista inicial">' + ICO.reset + '</button>' +
    '<button type="button" id="tFull" title="Pantalla completa" aria-label="Pantalla completa">' + ICO.full + '</button></div>' +
    '<p class="cs-hint">Arrastra para girar · rueda o pellizca para acercar</p>' +
    '<div class="cs-loading" id="csLoad">Preparando el estudio…</div>' +
    '<div class="no3d-msg">Tu navegador no puede mostrar la vista 3D.</div></div>' +
    '<div class="cat-thumbs" id="catThumbs" role="list"></div></div>' +
    '<aside class="cat-info" id="catInfo" aria-live="polite"></aside></div>' +
    '<p class="cat-disc">Modelos 3D de referencia. Las marcas, modelos, colores y medidas exactas disponibles se confirman en tienda.</p>';

  var stage = document.getElementById('catStage'), canvas = stage.querySelector('canvas');
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { stage.classList.add('no3d'); }
  if (!renderer || !renderer.getContext()) { stage.classList.add('no3d'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.001, 100);

  /* Estudio fotográfico para reflejos: caja con degradado y paneles de luz */
  (function () {
    var pm = new THREE.PMREMGenerator(renderer);
    var env = new THREE.Scene();
    var geo = new THREE.SphereGeometry(10, 32, 16), colors = [], pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) { var y = pos.getY(i) / 10, v = 0.05 + 0.32 * Math.pow(Math.max(0, y), 1.5) + 0.04 * (1 + y); colors.push(v, v, v * 1.03); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    env.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    function box(w, h, x, y, z, k) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); }
    box(6, 4, 0, 8, 2, 9); box(2.2, 7, -7, 2, 3, 7); box(2.2, 7, 7, 3, -2, 5); box(9, 0.9, 0, 1.5, -8, 4); box(1.6, 1.6, 4, 2, 7, 6); box(10, 0.6, 0, -1, 8, 1.2);
    scene.environment = pm.fromScene(env, 0.035).texture;
    pm.dispose();
  })();

  var hemi = new THREE.HemisphereLight(0xffffff, 0x9aa1aa, 0.18); scene.add(hemi);
  var key = new THREE.DirectionalLight(0xfff6ec, 2.1); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.002;
  scene.add(key, key.target);
  var fill = new THREE.DirectionalLight(0xdfe8ff, 0.35); scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffffff, 1.1); scene.add(rim);
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.22 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  var blob = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    var gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.38)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = -1; scene.add(m); return m;
  })();

  var holder = new THREE.Group(); scene.add(holder);
  var dimsG = new THREE.Group(); scene.add(dimsG);
  var view = { yaw: 0.7, pitch: 0.28, dist: 1, tx: 0, ty: 0, tz: 0 }, goal = { yaw: 0.7, pitch: 0.28, dist: 1 }, base = { dist: 1, yaw: 0.7, pitch: 0.28 };
  var auto = !reduce, showDims = true, lastUser = 0, R = 0.5;
  var curCat = CATS[0], curItem = CATS[0].items[0], opts = {};

  function labelSprite(text, h, accent) {
    var c = document.createElement('canvas'), g = c.getContext('2d'), fs = 44;
    g.font = '700 ' + fs + 'px "Barlow", system-ui, sans-serif';
    var w = Math.ceil(g.measureText(text).width) + 36; c.width = w; c.height = 72;
    g.font = '700 ' + fs + 'px "Barlow", system-ui, sans-serif';
    g.fillStyle = accent ? '#c62a20' : 'rgba(22,24,27,.92)';
    var r = 12; g.beginPath(); g.moveTo(r, 0); g.lineTo(w - r, 0); g.quadraticCurveTo(w, 0, w, r); g.lineTo(w, 72 - r); g.quadraticCurveTo(w, 72, w - r, 72); g.lineTo(r, 72); g.quadraticCurveTo(0, 72, 0, 72 - r); g.lineTo(0, r); g.quadraticCurveTo(0, 0, r, 0); g.fill();
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(text, 18, 38);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.set(h * w / 72, h, 1); s.renderOrder = 20; return s;
  }
  function fmtLen(m) { return m >= 0.1 ? Math.round(m * 100) + ' cm' : (m * 1000 >= 10 ? Math.round(m * 1000) : (m * 1000).toFixed(1)) + ' mm'; }
  function line(a, b, parent) {
    var mat = new THREE.LineBasicMaterial({ color: 0xc62a20, depthTest: false, transparent: true });
    var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mat); l.renderOrder = 19; parent.add(l); return l;
  }
  function buildDims(box) {
    while (dimsG.children.length) dimsG.remove(dimsG.children[0]);
    var size = new V3(); box.getSize(size);
    var h = Math.max(size.x, size.y, size.z) * 0.065, gap = Math.max(size.x, size.y, size.z) * 0.08, tick = gap * 0.35;
    if (curItem.compare) {
      var labs = holder.children[0].userData.labels || [];
      labs.forEach(function (l, i) { var s = labelSprite(l.k, h * 0.7, i === 1); s.position.set(l.x + holder.position.x, -h * 0.9, gap * 1.4 + holder.position.z); dimsG.add(s); });
      return;
    }
    if (curItem.pipe || curItem.wire) {
      var od, txt;
      if (curItem.pipe) { od = OD[opts.d][0] / 1000; txt = 'Ø ext. ' + OD[opts.d][0].toFixed(1) + ' mm'; }
      else if (curItem.id === 'duplex') { var sd = AWG[opts.awg]; od = 0; txt = opts.awg + '-2 con tierra · ' + (sd[1] * 2 + sd[0] * 0.8 + 2).toFixed(1) + ' × ' + (sd[1] + 1.4).toFixed(1) + ' mm'; }
      else { var s2 = AWG[opts.awg]; od = s2[1] / 1000; txt = 'Ø ' + s2[1].toFixed(1) + ' mm · ' + opts.awg + ' AWG'; }
      var lab = labelSprite(txt, h, true); lab.position.set(box.getCenter(new V3()).x, box.max.y + h * 1.3, box.getCenter(new V3()).z); dimsG.add(lab);
      void od;
      return;
    }
    (curItem.dims ? curItem.dims(box) : boxDims(box)).forEach(function (d) {
      var a, b, t1, t2, name = d.name || { h: 'Alto', w: 'Ancho', d: 'Fondo' }[d.ax];
      if (d.ax === 'h') { a = new V3(box.max.x + gap, box.min.y, box.max.z); b = new V3(box.max.x + gap, box.max.y, box.max.z); t1 = new V3(tick, 0, 0); }
      else if (d.ax === 'w') { a = new V3(box.min.x, box.min.y, box.max.z + gap); b = new V3(box.max.x, box.min.y, box.max.z + gap); t1 = new V3(0, 0, tick); }
      else { a = new V3(box.max.x + gap, box.min.y, box.min.z); b = new V3(box.max.x + gap, box.min.y, box.max.z); t1 = new V3(tick, 0, 0); }
      t2 = t1.clone().negate();
      line(a, b, dimsG); line(a.clone().add(t1), a.clone().add(t2), dimsG); line(b.clone().add(t1), b.clone().add(t2), dimsG);
      var s = labelSprite(name + ' ' + fmtLen(d.v), h); s.position.copy(a).add(b).multiplyScalar(0.5);
      if (d.ax === 'h') s.position.x += h * 1.6; else s.position.y += h * 0.9;
      dimsG.add(s);
    });
  }
  function fit(obj, quiet) {
    var box = new THREE.Box3().setFromObject(obj), c = new V3(), size = new V3();
    box.getCenter(c); box.getSize(size);
    obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y;
    box.setFromObject(obj);
    var sphere = box.getBoundingSphere(new THREE.Sphere()); R = sphere.radius;
    var d = R / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * (curItem && curItem.wire ? 0.82 : 1.1);
    if (!quiet) { view.tx = 0; view.ty = sphere.center.y * 0.92; view.tz = 0; base.dist = d; goal.dist = d; camera.near = d / 200; camera.far = d * 30; camera.updateProjectionMatrix(); }
    key.position.set(R * 2.2, R * 4.2, R * 2.6); key.target.position.set(0, sphere.center.y * 0.5, 0);
    var sc = key.shadow.camera; sc.left = -R * 1.6; sc.right = R * 1.6; sc.top = R * 1.6; sc.bottom = -R * 1.6; sc.near = R * 0.5; sc.far = R * 12; sc.updateProjectionMatrix();
    fill.position.set(-R * 3, R * 1.5, R * 1.2); rim.position.set(-R * 1.5, R * 2.5, -R * 3);
    floor.scale.set(R * 10, R * 10, 1); floor.position.y = 0;
    blob.scale.set(Math.max(size.x, 0.0001) * 1.5, Math.max(size.z, 0.0001) * 1.5, 1); blob.position.y = R * 0.001;
    return box;
  }
  function current() {
    while (holder.children.length) holder.remove(holder.children[0]);
    holder.position.set(0, 0, 0);
    var obj = curItem.build(opts);
    holder.add(obj);
    var box = fit(holder);
    buildDims(box);
    dimsG.visible = showDims;
  }
  function setItem(cat, item, keepView) {
    curCat = cat; curItem = item; opts = {};
    (item.opts || []).forEach(function (o) { opts[o.id] = o.def; });
    current();
    if (!keepView) { goal.yaw = base.yaw = item.pipe ? 0.75 : item.wire ? 0.55 : 0.7; goal.pitch = base.pitch = item.wire ? 0.5 : item.compare ? 0.6 : item.pipe ? 0.55 : 0.28; }
    renderTabs(); renderThumbs(); renderInfo();
    document.getElementById('csBadge').textContent = cat.n + ' · ' + item.short;
    try { history.replaceState(null, '', '#' + item.id); } catch (e) { location.hash = item.id; }
  }

  /* ---------- interfaz ---------- */
  function renderTabs() {
    app.querySelectorAll('.cat-tabs [data-cat]').forEach(function (b) { var on = b.getAttribute('data-cat') === curCat.id; b.setAttribute('aria-selected', on); b.classList.toggle('on', on); });
  }
  var thumbs = {};
  function renderThumbs() {
    document.getElementById('catThumbs').innerHTML = curCat.items.map(function (it) {
      return '<button type="button" role="listitem" class="ct' + (it === curItem ? ' on' : '') + '" data-item="' + it.id + '" aria-pressed="' + (it === curItem) + '">' +
        '<span class="ct-img">' + (thumbs[it.id] ? '<img src="' + thumbs[it.id] + '" alt="">' : '<i></i>') + '</span><span class="ct-n">' + esc(it.short) + '</span></button>';
    }).join('');
    queueThumbs(curCat);
  }
  function optHtml(o) {
    var val = opts[o.id];
    if (o.type === 'swatch') return '<div class="co"><p class="co-l">' + o.label + ': <b>' + esc(o.values.filter(function (v) { return v.v === val; })[0].label) + '</b></p><div class="co-sw">' +
      o.values.map(function (v) { return '<button type="button" class="csw' + (v.v === val ? ' on' : '') + '" data-o="' + o.id + '" data-v="' + v.v + '" style="--c:' + v.hex + '" aria-label="' + esc(v.label) + '" aria-pressed="' + (v.v === val) + '"><i></i></button>'; }).join('') + '</div></div>';
    return '<div class="co"><p class="co-l">' + o.label + '</p><div class="co-seg">' + o.values.map(function (v) {
      return '<button type="button" data-o="' + o.id + '" data-v="' + v.v + '" aria-pressed="' + (String(v.v) === String(val)) + '">' + esc(v.label) + '</button>';
    }).join('') + '</div></div>';
  }
  function optionText() {
    return (curItem.opts || []).map(function (o) { var v = o.values.filter(function (x) { return String(x.v) === String(opts[o.id]); })[0]; return o.label.toLowerCase() + ' ' + (v ? v.label : ''); }).join(', ');
  }
  function renderInfo() {
    var specs = curItem.specs ? curItem.specs(opts) : [];
    var calc = curCat.calc ? '<a class="btn btn-ghost" href="calculadora.html#' + curCat.calc + '">' + (curCat.calc === 'pvc' ? 'Calcular cemento PVC' : 'Calcular el calibre') + '</a>' : '';
    var wa = 'https://wa.me/' + (CFG.whatsapp || '') + '?text=' + encodeURIComponent('Hola, me interesa: ' + curItem.n + ' (' + optionText() + '). ¿Qué marcas y precios tienen?');
    document.getElementById('catInfo').innerHTML =
      '<span class="eyebrow">' + esc(curCat.n) + '</span><h2>' + esc(curItem.n) + '</h2><p class="ci-desc">' + esc(curItem.desc) + '</p>' +
      (curItem.opts || []).map(optHtml).join('') +
      '<dl class="ci-specs">' + specs.map(function (s) { return '<dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd>'; }).join('') + '</dl>' +
      '<div class="ci-qty"><label for="ciQty">Cantidad</label><div class="stepper"><button type="button" data-q="-1" aria-label="Menos">−</button><input id="ciQty" type="number" min="1" value="1" inputmode="numeric"><button type="button" data-q="1" aria-label="Más">+</button></div></div>' +
      '<div class="ci-btns"><button class="btn btn-red" id="ciAdd" type="button">Agregar a mi cotización</button><a class="btn btn-wa" href="' + wa + '" target="_blank" rel="noopener">Preguntar por WhatsApp</a>' + calc + '</div>';
  }
  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cat]');
    if (t) { var c = CATS.filter(function (x) { return x.id === t.getAttribute('data-cat'); })[0]; setItem(c, c.items[0]); return; }
    var it = e.target.closest('[data-item]');
    if (it) { var item = curCat.items.filter(function (x) { return x.id === it.getAttribute('data-item'); })[0]; setItem(curCat, item); return; }
    var ob = e.target.closest('[data-o]');
    if (ob) {
      var o = curItem.opts.filter(function (x) { return x.id === ob.getAttribute('data-o'); })[0], raw = ob.getAttribute('data-v');
      opts[o.id] = typeof o.def === 'number' ? +raw : raw;
      current(); renderInfo(); return;
    }
    var q = e.target.closest('[data-q]');
    if (q) { var inp = document.getElementById('ciQty'); inp.value = Math.max(1, (+inp.value || 1) + +q.getAttribute('data-q')); return; }
    if (e.target.closest('#ciAdd')) {
      var n = Math.max(1, +document.getElementById('ciQty').value || 1);
      var unit = curItem.id === 'tubo' ? 'tubos de 6 m' : curItem.id === 'rollo' ? 'rollos' : curItem.wire ? 'm' : 'ud';
      if (curItem.compare) return C.toast && C.toast('Elige un cable específico para cotizarlo.');
      C.add && C.add(curItem.n, [n + ' ' + unit + ' — ' + curItem.n + ' (' + optionText() + ')'], 'catalogo');
    }
  });

  /* ---------- miniaturas renderizadas ---------- */
  var TS = 480, thumbQueue = [], rt = new THREE.WebGLRenderTarget(TS, TS);
  rt.texture.encoding = THREE.sRGBEncoding;
  function queueThumbs(cat) { cat.items.forEach(function (it) { if (!thumbs[it.id] && thumbQueue.indexOf(it) < 0) thumbQueue.push(it); }); }
  function makeThumb(it, outSize, yawOverride) {
    outSize = outSize || 240;
    var TSL = outSize * 2, rtl = TSL === TS ? rt : new THREE.WebGLRenderTarget(TSL, TSL);
    rtl.texture.encoding = THREE.sRGBEncoding;
    var o = {}; (it.opts || []).forEach(function (op) { o[op.id] = op.def; });
    var saveChildren = holder.children.slice(), savePos = holder.position.clone();
    saveChildren.forEach(function (c) { holder.remove(c); });
    holder.position.set(0, 0, 0);
    holder.add(it.build(o));
    var dv = dimsG.visible; dimsG.visible = false;
    var box = fit(holder, true), sph = box.getBoundingSphere(new THREE.Sphere());
    var d = sph.radius / Math.sin(THREE.MathUtils.degToRad(15)) * (it.wire ? 0.8 : 1.0), yaw = yawOverride != null ? yawOverride : it.pipe ? 0.75 : 0.7, pit = it.wire ? 0.5 : it.pipe ? 0.55 : 0.3;
    var cam = camera.clone(); cam.aspect = 1; cam.near = d / 200; cam.far = d * 30; cam.updateProjectionMatrix();
    cam.position.set(Math.sin(yaw) * Math.cos(pit) * d, sph.center.y + Math.sin(pit) * d, Math.cos(yaw) * Math.cos(pit) * d); cam.lookAt(0, sph.center.y, 0);
    renderer.setRenderTarget(rtl); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
    var px = new Uint8Array(TSL * TSL * 4); renderer.readRenderTargetPixels(rtl, 0, 0, TSL, TSL, px); renderer.setRenderTarget(null);
    if (rtl !== rt) rtl.dispose();
    var big = document.createElement('canvas'); big.width = big.height = TSL; var bg = big.getContext('2d'), img = bg.createImageData(TSL, TSL), row = TSL * 4;
    for (var y = 0; y < TSL; y++) img.data.set(px.subarray((TSL - 1 - y) * row, (TSL - y) * row), y * row);
    bg.putImageData(img, 0, 0);
    var c = document.createElement('canvas'); c.width = c.height = outSize; var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, outSize, outSize);
    var url = c.toDataURL('image/png');
    holder.remove(holder.children[0]);
    saveChildren.forEach(function (ch) { holder.add(ch); });
    holder.position.copy(savePos);
    fit(holder, true); holder.position.copy(savePos);
    dimsG.visible = dv;
    if (outSize !== 240) return url;
    thumbs[it.id] = url;
    var el = app.querySelector('[data-item="' + it.id + '"] .ct-img'); if (el) el.innerHTML = '<img src="' + url + '" alt="">';
  }

  /* ---------- controles ---------- */
  var down = null, pinch = null, pointers = {};
  canvas.addEventListener('pointerdown', function (e) {
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); lastUser = performance.now();
    var ids = Object.keys(pointers);
    if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: goal.dist }; down = null; }
    else down = { x: e.clientX, y: e.clientY, yaw: goal.yaw, pitch: goal.pitch };
    stage.classList.add('grab');
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!pointers[e.pointerId]) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY }; lastUser = performance.now();
    var ids = Object.keys(pointers);
    if (pinch && ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; goal.dist = clampDist(pinch.dist * pinch.d / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))); return; }
    if (down) { goal.yaw = down.yaw - (e.clientX - down.x) * 0.008; goal.pitch = Math.max(-0.05, Math.min(1.25, down.pitch + (e.clientY - down.y) * 0.006)); }
  });
  function up(e) { delete pointers[e.pointerId]; if (Object.keys(pointers).length < 2) pinch = null; if (!Object.keys(pointers).length) { down = null; stage.classList.remove('grab'); } }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', function (e) { e.preventDefault(); lastUser = performance.now(); goal.dist = clampDist(goal.dist * (e.deltaY > 0 ? 1.1 : 0.9)); }, { passive: false });
  function clampDist(d) { return Math.max(base.dist * 0.35, Math.min(base.dist * 2.2, d)); }
  function tg(id, fn) { document.getElementById(id).addEventListener('click', fn); }
  tg('tRot', function () { auto = !auto; this.setAttribute('aria-pressed', auto); });
  tg('tDims', function () { showDims = !showDims; dimsG.visible = showDims; this.setAttribute('aria-pressed', showDims); });
  tg('tIn', function () { goal.dist = clampDist(goal.dist * 0.8); lastUser = performance.now(); });
  tg('tOut', function () { goal.dist = clampDist(goal.dist * 1.25); lastUser = performance.now(); });
  tg('tReset', function () { goal.dist = base.dist; goal.yaw = base.yaw; goal.pitch = base.pitch; });
  tg('tFull', function () {
    var el = stage;
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(function () { stage.classList.toggle('max'); });
    else stage.classList.toggle('max');
  });

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);

  var visible = true, running = false, clock = new THREE.Clock();
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !running) { running = true; clock.getDelta(); requestAnimationFrame(loop); } }).observe(stage);
  function loop() {
    if (!visible) { running = false; return; }
    requestAnimationFrame(loop);
    if (document.hidden) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    if (thumbQueue.length) makeThumb(thumbQueue.shift());
    if (auto && performance.now() - lastUser > 2500 && !down && !pinch) goal.yaw += dt * 0.32;
    var k = Math.min(1, dt * 6);
    view.yaw += (goal.yaw - view.yaw) * k; view.pitch += (goal.pitch - view.pitch) * k; view.dist += (goal.dist - view.dist) * k;
    var aspectBoost = Math.max(1, 0.95 / camera.aspect);
    var d = view.dist * aspectBoost;
    camera.position.set(view.tx + Math.sin(view.yaw) * Math.cos(view.pitch) * d, view.ty + Math.sin(view.pitch) * d, view.tz + Math.cos(view.yaw) * Math.cos(view.pitch) * d);
    camera.lookAt(view.tx, view.ty, view.tz);
    renderer.render(scene, camera);
  }

  /* ---------- inicio ---------- */
  function fromHash() {
    var h = (location.hash || '').replace('#', '');
    for (var i = 0; i < CATS.length; i++) {
      if (CATS[i].id === h) return [CATS[i], CATS[i].items[0]];
      for (var j = 0; j < CATS[i].items.length; j++) if (CATS[i].items[j].id === h) return [CATS[i], CATS[i].items[j]];
    }
    return [CATS[0], CATS[0].items[0]];
  }
  window.addEventListener('hashchange', function () { var r = fromHash(); if (r[1] !== curItem) setItem(r[0], r[1]); });
  function start() {
    resize();
    var r = fromHash(); setItem(r[0], r[1]);
    view.dist = goal.dist; view.yaw = goal.yaw; view.pitch = goal.pitch;
    CATS.forEach(queueThumbs);
    document.getElementById('csLoad').hidden = true;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start); else start();
  window.MHCatalog = { cats: CATS, shot: function (id, size, yaw) { for (var i = 0; i < CATS.length; i++) for (var j = 0; j < CATS[i].items.length; j++) if (CATS[i].items[j].id === id) return makeThumb(CATS[i].items[j], size, yaw); } };
})();
