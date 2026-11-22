/* Más Hierro · utilidades 3D compartidas (three.js r128).
   MH3D.create(stage, opts) prepara renderer, cámara orbital, luces, redimensionado,
   bucle solo cuando el escenario es visible y selección por toque. */
(function () {
  'use strict';
  function col(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

  function create(stage, o) {
    o = o || {};
    var canvas = stage.querySelector('canvas');
    function fail() { stage.classList.add('no3d'); return null; }
    if (!window.THREE || !canvas) return fail();
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!o.capture }); }
    catch (e) { return fail(); }
    if (!renderer.getContext()) return fail();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = o.toneMapping == null ? THREE.ACESFilmicToneMapping : o.toneMapping;
    renderer.toneMappingExposure = o.exposure || 1;
    renderer.physicallyCorrectLights = false;
    if (o.shadows !== false) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(o.fov || 40, 1, 0.05, 200);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Órbita: objetivo + distancia + yaw/pitch, con límites
    var view = { tx: 0, ty: 1, tz: 0, dist: 8, yaw: 0, pitch: 0.3 };
    var goal = { tx: 0, ty: 1, tz: 0, dist: 8, yaw: 0, pitch: 0.3 };
    var lim = { yaw: o.yawLimit || [-Infinity, Infinity], pitch: o.pitchLimit || [0.02, 1.2] };
    function setView(v, instant) {
      for (var k in v) if (k in goal) goal[k] = v[k];
      if (v.yawLimit) lim.yaw = v.yawLimit;
      if (v.pitchLimit) lim.pitch = v.pitchLimit;
      if (instant || reduce) for (var j in goal) view[j] = goal[j];
    }
    if (o.view) setView(o.view, true);

    var aspect = 1;
    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
    resize();

    // Arrastrar para girar · tocar para seleccionar
    var down = null, moved = false, picks = [], clickFns = [], hoverOn = !!o.hover;
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function hit(e) {
      var r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      var hs = ray.intersectObjects(picks, true);
      for (var i = 0; i < hs.length; i++) { var ob = hs[i].object; while (ob && !ob.userData.pick) ob = ob.parent; if (ob && ob.visible) return ob; }
      return null;
    }
    canvas.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, yaw: goal.yaw, pitch: goal.pitch }; moved = false; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', function (e) {
      if (down) {
        var dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) { moved = true; stage.classList.add('grab'); }
        if (moved) {
          goal.yaw = Math.max(lim.yaw[0], Math.min(lim.yaw[1], down.yaw - dx * 0.008));
          goal.pitch = Math.max(lim.pitch[0], Math.min(lim.pitch[1], down.pitch + dy * 0.006));
        }
      } else if (hoverOn && picks.length && e.pointerType === 'mouse') {
        canvas.style.cursor = hit(e) ? 'pointer' : '';
      }
    });
    function up(e) {
      if (down && !moved && clickFns.length) { var ob = hit(e); clickFns.forEach(function (f) { f(ob, e); }); }
      down = null; stage.classList.remove('grab');
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', function () { down = null; stage.classList.remove('grab'); });

    // Bucle solo cuando se ve
    var visible = false, running = false, clock = new THREE.Clock(), t = 0, frameFns = [];
    function loop() {
      if (!visible) { running = false; return; }
      requestAnimationFrame(loop);
      if (document.hidden) return;
      var dt = Math.min(clock.getDelta(), 0.05); t += dt;
      var k = Math.min(1, dt * 5);
      for (var key in view) view[key] += (goal[key] - view[key]) * k;
      var dist = view.dist * Math.max(1, (o.portraitBoost || 0.9) / aspect);
      camera.position.set(
        view.tx + dist * Math.sin(view.yaw) * Math.cos(view.pitch),
        view.ty + dist * Math.sin(view.pitch),
        view.tz + dist * Math.cos(view.yaw) * Math.cos(view.pitch));
      camera.lookAt(view.tx, view.ty, view.tz);
      for (var i = 0; i < frameFns.length; i++) frameFns[i](dt, t);
      renderer.render(scene, camera);
    }
    var io = new IntersectionObserver(function (ents) {
      visible = ents[0].isIntersecting;
      if (visible && !running) { running = true; clock.getDelta(); requestAnimationFrame(loop); }
    });
    io.observe(stage);

    return {
      THREE: THREE, renderer: renderer, scene: scene, camera: camera, stage: stage, reduce: reduce,
      setView: setView, view: view, goal: goal,
      onFrame: function (f) { frameFns.push(f); },
      onPick: function (f) { clickFns.push(f); },
      pickables: function (list) { picks = list; },
      render: function () { renderer.render(scene, camera); },
      lights: function (opt) {
        opt = opt || {};
        var hemi = new THREE.HemisphereLight(0xffffff, 0x3a3230, opt.hemi == null ? 0.6 : opt.hemi);
        var key = new THREE.DirectionalLight(0xffffff, opt.key == null ? 1.3 : opt.key);
        key.position.set.apply(key.position, opt.keyPos || [5, 9, 6]);
        key.castShadow = o.shadows !== false;
        key.shadow.mapSize.set(1024, 1024);
        var s = opt.shadowSize || 8, sc = key.shadow.camera;
        sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 0.5; sc.far = 40;
        key.shadow.bias = -0.0005; key.shadow.radius = 4;
        scene.add(hemi, key);
        return { hemi: hemi, key: key };
      }
    };
  }

  /* Material estándar con color en sRGB correcto */
  function mat(hex, opt) {
    opt = opt || {};
    var m = new THREE.MeshStandardMaterial({ color: col(hex), roughness: opt.r == null ? 0.7 : opt.r, metalness: opt.m || 0 });
    if (opt.emissive) { m.emissive = col(opt.emissive); m.emissiveIntensity = opt.ei == null ? 1 : opt.ei; }
    if (opt.transparent) { m.transparent = true; m.opacity = opt.opacity; }
    if (opt.side) m.side = opt.side;
    return m;
  }
  function box(w, h, d, material, x, y, z, parent) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function cyl(rt, rb, h, material, x, y, z, parent, seg) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), material);
    m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  /* Tubo que sigue una lista de puntos con codos suaves */
  function pipe(points, radius, material, parent) {
    var curve = new THREE.CurvePath();
    for (var i = 0; i < points.length - 1; i++) curve.add(new THREE.LineCurve3(new THREE.Vector3().fromArray(points[i]), new THREE.Vector3().fromArray(points[i + 1])));
    var geo = new THREE.TubeGeometry(curve, Math.max(8, (points.length - 1) * 12), radius, 12, false);
    var m = new THREE.Mesh(geo, material); m.castShadow = true;
    if (parent) parent.add(m);
    return m;
  }

  window.MH3D = { create: create, col: col, mat: mat, box: box, cyl: cyl, pipe: pipe };
})();
