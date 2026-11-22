/* Más Hierro · carta de colores, colorantes y utilidades de color (compartido por todas las páginas) */
(function () {
  'use strict';
  var FAMILIES = [
    { id: 'blancos', n: 'Blancos', c: [['Blanco Nieve', '#FAFAF7'], ['Blanco Hueso', '#F3EEE3'], ['Algodón', '#F6F4EE'], ['Marfil', '#F1E7CF'], ['Perla', '#ECEAE4'], ['Lino', '#E9E1D3'], ['Vainilla', '#F3E5BF'], ['Blanco Ostra', '#E8E3D6']] },
    { id: 'neutros', n: 'Neutros', c: [['Gris Niebla', '#D5D7D6'], ['Arena Gris', '#C9C1B1'], ['Piedra', '#B3AA9B'], ['Gris Cemento', '#A9ABA8'], ['Topo', '#8C7F72'], ['Gris Acero', '#6E7377'], ['Grafito', '#3E4246'], ['Carbón', '#26282B']] },
    { id: 'tierras', n: 'Tierras', c: [['Arena', '#D9C29A'], ['Café con Leche', '#A88364'], ['Caramelo', '#B9814B'], ['Ocre', '#C68B2C'], ['Terracota', '#B5573A'], ['Ladrillo', '#9A3F2C'], ['Barro', '#7E5640'], ['Chocolate', '#5C3A2A']] },
    { id: 'rojos', n: 'Rojos', c: [['Rosa Palo', '#E7C0B8'], ['Salmón', '#EE9C84'], ['Coral', '#E86A57'], ['Fresa', '#D9434E'], ['Rojo Hierro', '#C62A20'], ['Cereza', '#B3233A'], ['Carmesí', '#9E1B22'], ['Vino', '#6B1E2B']] },
    { id: 'azules', n: 'Azules', c: [['Celeste', '#C7E1EE'], ['Azul Cielo', '#9CC9E3'], ['Turquesa', '#2BA3A0'], ['Azul Caribe', '#1F8FB5'], ['Azul Acero', '#557A95'], ['Azul Rey', '#2449A0'], ['Índigo', '#33356E'], ['Azul Marino', '#1F2F4F']] },
    { id: 'verdes', n: 'Verdes', c: [['Verde Menta', '#BFE0C9'], ['Verde Agua', '#7FC8B6'], ['Verde Lima', '#A5C94A'], ['Verde Salvia', '#9CAE8F'], ['Esmeralda', '#1F8A5C'], ['Verde Oliva', '#6E7240'], ['Musgo', '#4F5F3A'], ['Verde Bosque', '#2F5A3B']] },
    { id: 'amarillos', n: 'Amarillos', c: [['Mantequilla', '#F4E3A1'], ['Limón', '#EFE07A'], ['Maíz', '#E9C46A'], ['Durazno', '#F3C29B'], ['Amarillo Sol', '#F2C230'], ['Mostaza', '#CF9F2B'], ['Mango', '#F0A33A'], ['Naranja', '#E2702B']] }
  ];
  FAMILIES.forEach(function (f, fi) {
    f.c = f.c.map(function (x, i) { return { name: x[0], hex: x[1], code: 'MH-' + (fi + 1) + String(i + 1).padStart(2, '0') }; });
  });

  var COLORANTS = [
    { k: 'KX', n: 'Negro', hex: '#1b1b1b' },
    { k: 'R', n: 'Rojo óxido', hex: '#a63a24', h: 10 },
    { k: 'Y', n: 'Amarillo óxido', hex: '#d1a02e', h: 45 },
    { k: 'G', n: 'Verde ftalo', hex: '#1f7a4f', h: 150 },
    { k: 'B', n: 'Azul ftalo', hex: '#1f4fa0', h: 220 },
    { k: 'M', n: 'Magenta', hex: '#b0306a', h: 330 }
  ];

  function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; }); }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(function (v) { return Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'); }).join('').toUpperCase(); }
  function rgbToHsl(r, g, b) {
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    if (!s) return rgbToHex(l, l, l);
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return rgbToHex(f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3));
  }
  function lrv(hex) {
    var c = hexToRgb(hex).map(function (v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return Math.round((0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) * 100);
  }

  /* Fórmula ilustrativa: onzas e "Y" (1/48 oz) por galón sobre base blanca */
  function formula(hex, gallons) {
    var rgb = hexToRgb(hex), c = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    var chroma = c.s * (1 - Math.abs(2 * c.l - 1));
    var dark = Math.max(0, 0.93 - c.l);
    var out = {};
    if (chroma > 0.04) {
      var anchors = COLORANTS.filter(function (x) { return x.h != null; });
      var a = anchors[anchors.length - 1], b = anchors[0];
      for (var i = 0; i < anchors.length; i++) {
        var A = anchors[i], B = anchors[(i + 1) % anchors.length];
        var hA = A.h, hB = B.h <= A.h ? B.h + 360 : B.h, hh = c.h < hA ? c.h + 360 : c.h;
        if (hh >= hA && hh <= hB) { a = A; b = B; break; }
      }
      var span = ((b.h - a.h) + 360) % 360 || 360;
      var t = (((c.h - a.h) + 360) % 360) / span;
      var dose = chroma * 7 + dark * chroma * 5;
      out[a.k] = (out[a.k] || 0) + dose * (1 - t);
      out[b.k] = (out[b.k] || 0) + dose * t;
    }
    var blk = Math.pow(dark, 1.7) * 7.5 * (1 - chroma * 0.55);
    if (blk > 0.02) out.KX = blk;
    return COLORANTS.map(function (x, idx) {
      return { idx: idx, k: x.k, n: x.n, hex: x.hex, oz: (out[x.k] || 0) * gallons };
    }).filter(function (x) { return x.oz >= 1 / 48; });
  }
  function ozY(v) { var oz = Math.floor(v), y = Math.round((v - oz) * 48); if (y === 48) { oz++; y = 0; } return { oz: oz, y: y }; }

  /* Selector de carta reutilizable: pinta pestañas de familias + muestras hexagonales.
     opts: { tabs: el, grid: el, selected: hex, onPick: fn(color), family: idx } */
  function picker(opts) {
    var fam = opts.family == null ? 3 : opts.family;
    var selected = opts.selected;
    function renderTabs() {
      opts.tabs.innerHTML = '';
      FAMILIES.forEach(function (f, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'fam' + (i === fam ? ' on' : ''); b.textContent = f.n;
        b.setAttribute('aria-pressed', i === fam);
        b.addEventListener('click', function () { fam = i; renderTabs(); renderGrid(); });
        opts.tabs.appendChild(b);
      });
    }
    function renderGrid() {
      opts.grid.innerHTML = '';
      FAMILIES[fam].c.forEach(function (col) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'sw' + (col.hex === selected ? ' on' : '');
        b.style.setProperty('--c', col.hex);
        b.title = col.name + ' · ' + col.code;
        b.setAttribute('aria-label', col.name + ', ' + col.code);
        b.innerHTML = '<span></span>';
        b.addEventListener('click', function () { selected = col.hex; renderGrid(); opts.onPick(col); });
        opts.grid.appendChild(b);
      });
    }
    renderTabs(); renderGrid();
    return { select: function (hex) { selected = hex; renderGrid(); } };
  }

  window.MHColors = {
    FAMILIES: FAMILIES, COLORANTS: COLORANTS, hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsl: rgbToHsl,
    hslToHex: hslToHex, lrv: lrv, formula: formula, ozY: ozY, picker: picker
  };
  window.MH = window.MH || {};
  window.MH.COLORANTS = COLORANTS;
})();
