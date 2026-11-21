/* Más Hierro · Preparador de pintura 3D
   Máquina tintométrica hexagonal → dosifica colorantes → agita la cubeta → un rodillo pinta la pared.
   Requiere three.js r128 (global THREE) y js/main.js (eventos mh:color / mh:prepare). */
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('mixerCanvas');
  if (!stage || !canvas) return;

  var hudSteps = Array.prototype.slice.call(document.querySelectorAll('#hudSteps li'));
  var bar = document.getElementById('hudBar');
  var hudMsg = document.getElementById('hudMsg');

  function fail() { stage.classList.add('no3d'); }
  if (!window.THREE) { fail(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { fail(); return; }
  if (!renderer.getContext()) { fail(); return; }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var V2 = THREE.Vector2, V3 = THREE.Vector3;
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f1114, 16, 30);
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  var camPos = new V3(0, 6.2, 13), camLook = new V3(0, 2.7, 0);
  var camPosT = camPos.clone(), camLookT = camLook.clone();
  camera.position.copy(camPos);

  /* ---------- Luces ---------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x40302c, 0.55));
  var key = new THREE.DirectionalLight(0xffffff, 1.55);
  key.position.set(4, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  var sc = key.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 8; sc.bottom = -3; sc.near = 1; sc.far = 25;
  key.shadow.bias = -0.0006; key.shadow.radius = 4;
  scene.add(key);
  var rim = new THREE.PointLight(0xff3b2f, 1.5, 16); rim.position.set(-4.5, 3.5, -1); scene.add(rim);
  var fill = new THREE.PointLight(0xbfd4ff, 0.5, 16); fill.position.set(5, 2.5, 3); scene.add(fill);

  /* ---------- Piso ---------- */
  var floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64),
    new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.85, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* ---------- Pared con shader (pintado por franjas, color sRGB exacto) ---------- */
  var NOISE = [
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    'return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}'
  ].join('\n');
  var VERT = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  var WALL_W = 18, WALL_H = 9, STROKES = 6;
  var wallU = {
    uOld: { value: new THREE.Color('#e7e3db') }, uNew: { value: new THREE.Color('#e7e3db') },
    uP: { value: 0 }, uStrokes: { value: STROKES }
  };
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, WALL_H), new THREE.ShaderMaterial({
    uniforms: wallU, vertexShader: VERT,
    fragmentShader: [
      'uniform vec3 uOld,uNew;uniform float uP,uStrokes;varying vec2 vUv;', NOISE,
      'void main(){',
      ' float s=uP*uStrokes; float idx=floor(s); float t=fract(s);',
      ' float col=floor(vUv.x*uStrokes); float yTop=1.-vUv.y;',
      ' float painted = col<idx ? 1. : (col==idx ? step(yTop,t) : 0.);',
      ' vec3 c=mix(uOld,uNew,painted);',
      ' float tex=n(vUv*vec2(170.,85.))*.045+n(vUv*vec2(32.,16.))*.035;',
      ' float streak=n(vec2(vUv.x*uStrokes*16.,vUv.y*1.5))*.035*painted;',
      ' c*=0.95+tex-streak;',
      ' c*=mix(.6,1.02,smoothstep(0.,.7,vUv.y))*(1.-pow(abs(vUv.x-.5)*1.7,3.)*.45);',
      ' gl_FragColor=vec4(c,1.);}'
    ].join('\n')
  }));
  wall.position.set(0, WALL_H / 2, -3.2);
  scene.add(wall);

  /* ---------- Rodillo ---------- */
  var roller = new THREE.Group();
  var nap = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  var steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.3 });
  var black = new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.6 });
  var redM = new THREE.MeshStandardMaterial({ color: 0xa81c14, metalness: 0.4, roughness: 0.35 });
  var rCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 2.7, 32), nap);
  rCyl.rotation.z = Math.PI / 2; roller.add(rCyl);
  var frame = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new V3(1.42, 0, 0), new V3(1.55, -0.3, 0.25), new V3(0.9, -0.9, 0.55), new V3(0.2, -1.3, 0.7)
  ]), 32, 0.03, 8), steel);
  roller.add(frame);
  var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.1, 16), redM);
  grip.position.set(0.05, -1.85, 0.78); grip.rotation.z = 0.25; roller.add(grip);
  roller.position.set(0, 4, -2.85); roller.visible = false;
  scene.add(roller);

  /* ---------- Rig giratorio: plataforma hexagonal + cubeta ---------- */
  var rig = new THREE.Group(); scene.add(rig);
  var plat = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.15, 0.24, 6), redM);
  plat.position.y = 0.12; plat.castShadow = true; plat.receiveShadow = true; rig.add(plat);
  var platEdge = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.25, 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.5 }));
  platEdge.position.y = 0.03; rig.add(platEdge);

  var bucket = new THREE.Group(); bucket.position.y = 0.24; rig.add(bucket);
  var prof = [new V2(0, 0), new V2(0.98, 0), new V2(1.02, 0.04), new V2(1.16, 2.0), new V2(1.24, 2.03),
    new V2(1.24, 2.14), new V2(1.12, 2.14), new V2(1.10, 2.08), new V2(0.96, 0.1), new V2(0, 0.1)];
  var plastic = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f1, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
  var shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), plastic);
  shell.castShadow = true; shell.receiveShadow = true; bucket.add(shell);
  [1.84, 1.93].forEach(function (y) {
    var rr = 1.02 + 0.14 * ((y - 0.04) / 1.96) + 0.004;
    var t = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.022, 8, 96), plastic);
    t.rotation.x = Math.PI / 2; t.position.y = y; bucket.add(t);
  });
  function outerR(y) { return 1.02 + 0.14 * ((y - 0.04) / 1.96); }
  function innerR(y) { return 0.96 + 0.14 * ((y - 0.1) / 1.98); }

  // Etiqueta con el logo
  var lc = document.createElement('canvas'); lc.width = 1024; lc.height = 270;
  var lctx = lc.getContext('2d');
  var labelTex = new THREE.CanvasTexture(lc);
  labelTex.encoding = THREE.sRGBEncoding;
  labelTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  var thL = Math.PI * 1.15, yT = 1.56, yB = 0.5;
  var label = new THREE.Mesh(
    new THREE.CylinderGeometry(outerR(yT) + 0.007, outerR(yB) + 0.007, yT - yB, 96, 1, true, -thL / 2, thL),
    new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }));
  label.position.y = (yT + yB) / 2; bucket.add(label);

  var logoImg = new Image();
  logoImg.onload = function () { drawLabel(); };
  logoImg.crossOrigin = 'anonymous';
  logoImg.src = 'assets/logo.webp';

  // Asa
  var handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new V3(-1.25, 1.95, 0), new V3(-1.05, 2.85, -0.55), new V3(0, 3.2, -0.8), new V3(1.05, 2.85, -0.55), new V3(1.25, 1.95, 0)
  ]), 64, 0.035, 8), steel);
  handle.castShadow = true; bucket.add(handle);
  var hGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.9, 16), black);
  hGrip.rotation.z = Math.PI / 2; hGrip.position.set(0, 3.19, -0.79); bucket.add(hGrip);

  // Superficie de pintura
  var MAXC = 4;
  var paintU = {
    uBase: { value: new THREE.Color('#f6f5f1') }, uTarget: { value: new THREE.Color('#f6f5f1') },
    uC: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
    uW: { value: [0, 0, 0, 0] }, uMix: { value: 1 }, uDrops: { value: 0 }, uTime: { value: 0 }, uSheen: { value: 0.18 }
  };
  var paint = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.ShaderMaterial({
    uniforms: paintU, vertexShader: VERT,
    fragmentShader: [
      'uniform vec3 uBase,uTarget;uniform vec3 uC[4];uniform float uW[4];',
      'uniform float uMix,uDrops,uTime,uSheen;varying vec2 vUv;', NOISE,
      'void main(){',
      ' vec2 p=vUv-.5; float r=length(p)*2.; float a=atan(p.y,p.x);',
      ' float sw=a+uTime*(1.2+2.5*uMix*(1.-uMix))+r*(7.*(1.-uMix)+1.5);',
      ' float nz=n(vec2(cos(sw),sin(sw))*r*3.+uTime*.25);',
      ' vec3 col=uBase;',
      ' for(int i=0;i<4;i++){',
      '  float band=smoothstep(.6,.8,sin(sw*2.+float(i)*1.9+nz*5.)*.5+.5)*smoothstep(.0,.25,r+.1);',
      '  col=mix(col,uC[i],band*uW[i]*uDrops*(1.-uMix)*1.6);',
      ' }',
      ' col=mix(col,uTarget,smoothstep(.0,1.,uMix));',
      ' float spec=pow(max(0.,1.-length(p-vec2(-.16,.2))*2.6),3.)*uSheen;',
      ' col+=spec; col*=1.-smoothstep(.82,1.,r)*.22;',
      ' gl_FragColor=vec4(col,1.);}'
    ].join('\n')
  }));
  paint.rotation.x = -Math.PI / 2;
  bucket.add(paint);
  var level = 1.55;
  function setLevel(y) { level = y; paint.position.y = y; var r = innerR(y) - 0.004; paint.scale.set(r, r, 1); }
  setLevel(level);

  /* ---------- Máquina tintométrica hexagonal ---------- */
  var COLORANT_HEX = (window.MH && MH.COLORANTS) ? MH.COLORANTS.map(function (c) { return c.hex; })
    : ['#1b1b1b', '#a63a24', '#d1a02e', '#1f7a4f', '#1f4fa0', '#b0306a'];
  var disp = new THREE.Group(); disp.position.y = 5.35; scene.add(disp);
  var head = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.6, 6), redM);
  head.castShadow = true; disp.add(head);
  var plate = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.08, 6), black);
  plate.position.y = -0.34; disp.add(plate);
  var led = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b2f }));
  led.rotation.x = Math.PI / 2; led.rotation.z = Math.PI / 6; led.position.y = -0.39; disp.add(led);
  var nozzles = [], canMats = [];
  for (var k = 0; k < 6; k++) {
    var ang = k * Math.PI / 3 + Math.PI / 6;
    var nx = Math.sin(ang) * 0.6, nz = Math.cos(ang) * 0.6;
    var noz = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 16), steel);
    noz.rotation.x = Math.PI; noz.position.set(nx, -0.5, nz); disp.add(noz);
    nozzles.push(new V3(nx, disp.position.y - 0.62, nz));
    var cm = new THREE.MeshPhysicalMaterial({ color: COLORANT_HEX[k], roughness: 0.25, clearcoat: 1 });
    canMats.push(cm);
    var cx = Math.sin(ang) * 0.78, cz = Math.cos(ang) * 0.78;
    var can = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.85, 24), cm);
    can.position.set(cx, 0.72, cz); can.castShadow = true; disp.add(can);
    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.12, 24), steel);
    cap.position.set(cx, 1.2, cz); disp.add(cap);
  }
  var arm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 2.6), black);
  arm.position.set(0, 0, -1.45); disp.add(arm);
  var column = new THREE.Mesh(new THREE.BoxGeometry(0.55, 5.6, 0.55), black);
  column.position.set(0, 2.8, -2.75); column.castShadow = true; scene.add(column);

  /* ---------- Gotas y ondas ---------- */
  var dropGeo = new THREE.SphereGeometry(0.065, 12, 8);
  var dropMats = COLORANT_HEX.map(function (h) { return new THREE.MeshStandardMaterial({ color: h, roughness: 0.2 }); });
  var drops = [], ripples = [];
  for (var d = 0; d < 48; d++) {
    var dm = new THREE.Mesh(dropGeo, dropMats[0]); dm.visible = false; scene.add(dm);
    drops.push({ m: dm, vy: 0, on: false, ci: 0 });
  }
  var ringGeo = new THREE.RingGeometry(0.06, 0.1, 32);
  for (var q = 0; q < 24; q++) {
    var rm = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    rm.rotation.x = -Math.PI / 2; rm.visible = false; scene.add(rm);
    ripples.push({ m: rm, t: 0, on: false });
  }
  function spawnDrop(ci) {
    for (var i = 0; i < drops.length; i++) {
      var dr = drops[i];
      if (dr.on) continue;
      dr.on = true; dr.ci = ci; dr.vy = -1.2;
      dr.m.material = dropMats[ci];
      dr.m.position.copy(nozzles[ci]);
      dr.m.scale.set(1, 1.5, 1); dr.m.visible = true;
      return;
    }
  }
  function spawnRipple(pos, ci) {
    for (var i = 0; i < ripples.length; i++) {
      var r = ripples[i];
      if (r.on) continue;
      r.on = true; r.t = 0; r.m.visible = true;
      r.m.material.color.set(COLORANT_HEX[ci]);
      r.m.position.set(pos.x, pos.y + 0.012, pos.z);
      return;
    }
  }

  /* ---------- Estado / secuencia ---------- */
  var state = { hex: '#f6f5f1', name: '', code: '', finish: 'Satinado', size: 'galon', formula: [] };
  var phase = 'idle', pt = 0, dosePlan = [], emitAcc = [];
  var D_DISP = 2.6, D_MIX = 2.4, D_PAINT = 3.4;
  var bucketScaleT = 0.74, bucketScale = 0.74;

  function setHud(step, prog, msg) {
    var order = ['dispense', 'mix', 'paint'];
    var idx = order.indexOf(step);
    hudSteps.forEach(function (li, i) {
      li.classList.toggle('done', step === 'done' || (idx > -1 && i < idx));
      li.classList.toggle('active', i === idx);
    });
    if (bar) bar.style.width = Math.round(prog * 100) + '%';
    if (hudMsg && msg) hudMsg.textContent = msg;
  }

  function drawLabel() {
    var W = lc.width, H = lc.height, c = lctx;
    c.fillStyle = '#f7f7f5'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#c62a20'; c.fillRect(0, 0, W, 16); c.fillRect(0, H - 16, W, 16);
    c.fillStyle = '#16181b'; c.fillRect(0, 16, W, 4); c.fillRect(0, H - 20, W, 4);
    if (logoImg.complete && logoImg.naturalWidth) {
      var lw = 440, lh = lw * logoImg.naturalHeight / logoImg.naturalWidth;
      c.drawImage(logoImg, 34, (H - lh) / 2, lw, lh);
    }
    // muestra hexagonal
    var cx = 585, cy = H / 2, r = 70;
    c.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 3 * i - Math.PI / 2;
      c[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    c.closePath(); c.fillStyle = state.hex; c.fill();
    c.lineWidth = 6; c.strokeStyle = '#16181b'; c.stroke();
    c.fillStyle = '#16181b';
    c.font = 'italic 800 50px "Barlow Condensed", "Arial Narrow", sans-serif';
    var nm = (state.name || 'Base blanca').toUpperCase();
    while (c.measureText(nm).width > 330 && nm.length > 4) nm = nm.slice(0, -2);
    c.fillText(nm, 675, 118);
    c.font = '600 30px "Barlow", sans-serif'; c.fillStyle = '#4a4f57';
    c.fillText((state.code || 'MH-BASE') + ' · ' + state.finish, 675, 160);
    c.fillStyle = '#c62a20'; c.font = '700 28px "Barlow Condensed", sans-serif';
    c.fillText(state.size === 'cubeta' ? 'CUBETA · 5 GALONES' : 'GALÓN · 3.785 L', 675, 202);
    labelTex.needsUpdate = true;
  }

  function applyFormula() {
    var f = state.formula || [];
    var total = f.reduce(function (s, x) { return s + x.oz; }, 0) || 1;
    var top = f.slice().sort(function (a, b) { return b.oz - a.oz; }).slice(0, MAXC);
    for (var i = 0; i < MAXC; i++) {
      if (top[i]) { paintU.uC.value[i].set(top[i].hex); paintU.uW.value[i] = Math.min(1, 0.45 + top[i].oz / total); }
      else paintU.uW.value[i] = 0;
    }
    dosePlan = f.map(function (x) {
      return { ci: x.idx, rate: Math.max(3, Math.min(14, Math.round(4 + 10 * x.oz / total))) / D_DISP };
    });
    emitAcc = dosePlan.map(function () { return 0; });
  }

  function start() {
    applyFormula();
    paintU.uTarget.value.set(state.hex);
    nap.color.set(state.hex);
    wallU.uNew.value.set(state.hex);
    if (reduce) {
      paintU.uMix.value = 1; paintU.uDrops.value = 1; wallU.uOld.value.set(state.hex); wallU.uP.value = 0;
      phase = 'idle'; setHud('done', 1, 'Listo: ' + (state.name || 'tu color') + ' preparado.');
      return;
    }
    paintU.uMix.value = 0; paintU.uDrops.value = 0;
    setLevel(1.52);
    phase = 'dispense'; pt = 0;
    setHud('dispense', 0, 'Dosificando colorantes sobre la base blanca…');
  }

  function applyState(d) {
    for (var k in d) state[k] = d[k];
    bucketScaleT = state.size === 'cubeta' ? 1 : 0.74;
    paintU.uSheen.value = { 'Mate': 0.04, 'Satinado': 0.18, 'Semibrillo': 0.34 }[state.finish] || 0.18;
    drawLabel();
  }
  document.addEventListener('mh:color', function (e) { applyState(e.detail || {}); });
  document.addEventListener('mh:prepare', start);
  if (window.MH && MH.sel) applyState(MH.sel);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawLabel);
  drawLabel();

  /* ---------- Interacción: arrastrar para girar ---------- */
  var rotY = -0.35, rotYT = -0.35, dragging = false, lastX = 0, px = 0, py = 0;
  canvas.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); stage.classList.add('grab'); });
  canvas.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width - 0.5); py = ((e.clientY - r.top) / r.height - 0.5);
    if (!dragging) return;
    rotYT += (e.clientX - lastX) * 0.01; lastX = e.clientX;
  });
  function endDrag() { dragging = false; stage.classList.remove('grab'); }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', function () { px = 0; py = 0; });

  /* ---------- Tamaño ---------- */
  var aspect = 1;
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();

  /* ---------- Bucle ---------- */
  var visible = false, autoRan = false, clock = new THREE.Clock(), time = 0;
  var io = new IntersectionObserver(function (ents) {
    visible = ents[0].isIntersecting;
    if (visible && ents[0].intersectionRatio > 0.35 && !autoRan) {
      autoRan = true;
      setTimeout(function () { document.dispatchEvent(new CustomEvent('mh:prepare')); }, 400);
    }
    if (visible && !running) { running = true; clock.getDelta(); requestAnimationFrame(loop); }
  }, { threshold: [0, 0.35] });
  var running = false;
  io.observe(stage);

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var tmp = new V3();

  function loop() {
    if (!visible) { running = false; return; }
    requestAnimationFrame(loop);
    if (document.hidden) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    time += dt; paintU.uTime.value = time;

    bucketScale += (bucketScaleT - bucketScale) * Math.min(1, dt * 6);
    bucket.scale.setScalar(bucketScale);

    var surfY = bucket.position.y + level * bucketScale;
    var shake = 0;

    if (phase === 'dispense') {
      pt += dt; var p = Math.min(1, pt / D_DISP);
      paintU.uDrops.value = p;
      led.material.color.setHSL(0.01, 1, 0.5 + 0.2 * Math.sin(time * 18));
      if (pt < D_DISP - 0.5) {
        dosePlan.forEach(function (dp, i) {
          emitAcc[i] += dp.rate * dt * 1.25;
          while (emitAcc[i] >= 1) { emitAcc[i] -= 1; spawnDrop(dp.ci); }
        });
      }
      setLevel(1.52 + 0.08 * p);
      camPosT.set(0, 6.4, 11); camLookT.set(0, 3.0, 0);
      setHud('dispense', p / 3, null);
      if (p >= 1) { phase = 'mix'; pt = 0; setHud('mix', 1 / 3, 'Agitando la cubeta para integrar el color…'); }
    } else if (phase === 'mix') {
      pt += dt; var m = Math.min(1, pt / D_MIX);
      paintU.uMix.value = ease(m);
      shake = Math.sin(Math.PI * m);
      rotYT += dt * 2.2 * shake;
      camPosT.set(0, 7.2, 9.6); camLookT.set(0, 2.2, 0);
      setHud('mix', (1 + m) / 3, null);
      if (m >= 1) { phase = 'paint'; pt = 0; roller.visible = true; setHud('paint', 2 / 3, 'Probando el color en la pared…'); }
    } else if (phase === 'paint') {
      pt += dt; var w = Math.min(1, pt / D_PAINT);
      wallU.uP.value = w;
      var s = w * STROKES, idx = Math.min(STROKES - 1, Math.floor(s)), t = s - Math.floor(s);
      if (w >= 1) t = 1;
      roller.position.x = -WALL_W / 2 + (idx + 0.5) * (WALL_W / STROKES);
      roller.position.y = WALL_H * (1 - t) + 0.05;
      rCyl.rotation.x = -t * 18;
      camPosT.set(0, 5.2, 15.5); camLookT.set(0, 3.4, 0);
      setHud('paint', (2 + w) / 3, null);
      if (w >= 1) {
        wallU.uOld.value.set(state.hex); wallU.uP.value = 0; roller.visible = false;
        phase = 'idle';
        setHud('done', 1, 'Listo: ' + (state.name || 'tu color') + ' preparado. Arrastra para girar la cubeta.');
      }
    } else {
      led.material.color.set(0xff3b2f);
      camPosT.set(0, 6.2, 13); camLookT.set(0, 2.7, 0);
      if (!dragging) rotYT += dt * 0.18;
    }

    // gotas
    for (var i = 0; i < drops.length; i++) {
      var dr = drops[i];
      if (!dr.on) continue;
      dr.vy -= 9.8 * dt;
      dr.m.position.y += dr.vy * dt;
      if (dr.m.position.y <= surfY) {
        dr.on = false; dr.m.visible = false;
        tmp.copy(dr.m.position); tmp.y = surfY;
        spawnRipple(tmp, dr.ci);
      }
    }
    for (var j = 0; j < ripples.length; j++) {
      var rp = ripples[j];
      if (!rp.on) continue;
      rp.t += dt;
      var sc2 = 1 + rp.t * 6;
      rp.m.scale.set(sc2, sc2, sc2);
      rp.m.position.y = surfY + 0.012;
      rp.m.material.opacity = Math.max(0, 0.85 - rp.t * 1.6);
      if (rp.t > 0.55) { rp.on = false; rp.m.visible = false; }
    }

    // agitado
    bucket.rotation.z = Math.sin(time * 38) * 0.07 * shake;
    bucket.rotation.x = Math.cos(time * 31) * 0.05 * shake;
    bucket.position.y = 0.24 + Math.abs(Math.sin(time * 26)) * 0.06 * shake;

    rotY += (rotYT - rotY) * Math.min(1, dt * 5);
    rig.rotation.y = rotY;

    // cámara (se aleja en pantallas verticales)
    var k2 = Math.max(1, 0.8 / aspect);
    camPos.lerp(camPosT, Math.min(1, dt * 2.2));
    camLook.lerp(camLookT, Math.min(1, dt * 2.2));
    camera.position.set(camPos.x + px * 1.2, camPos.y - py * 0.6, camPos.z * k2);
    camera.lookAt(camLook);

    renderer.render(scene, camera);
  }
})();
