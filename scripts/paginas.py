#!/usr/bin/env python3
"""Genera las páginas de herramientas de Más Hierro Ferretería.

Uso:  python3 scripts/paginas.py

Fuente única de:
  - js/tools-data.js (menú, pie y portada lo leen),
  - catalogo.html, calculadora.html, color.html, proyectos.html, contratistas.html,
  - la sección "Herramientas" de index.html (entre <!--TOOLS-HUB--> y <!--/TOOLS-HUB-->),
  - _redirects (enlaces antiguos de /herramientas/ hacia las páginas nuevas).
"""
import json
import os
import re
import shutil
from html import escape

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CATS = {
    "pinturas": {"name": "Pinturas", "color": "#E8A13A", "icon": "roller"},
    "construccion": {"name": "Construcción", "color": "#9AA6B2", "icon": "bricks"},
    "plomeria": {"name": "Plomería", "color": "#2F9FD8", "icon": "pipe"},
    "electricidad": {"name": "Electricidad", "color": "#8B6CFF", "icon": "bolt"},
}

I = lambda d: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"
ICONS = {
    "roller": I('<path d="M4 4h13v5H4z"/><path d="M17 6.5h3v6h-8.5v3"/><path d="M10 15.5h3V21h-3z"/>'),
    "photo": I('<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>'),
    "guide": I('<path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z"/>'),
    "roof": I('<path d="M2 12 12 4l10 8"/><path d="M5 10v10h14V10"/><path d="M9 14c0-1 1-2 1.5-3 .5 1 1.5 2 1.5 3a1.5 1.5 0 0 1-3 0Z"/>'),
    "cube": I('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>'),
    "slab": I('<path d="M3 15 12 10l9 5-9 5Z"/><path d="M3 15v2l9 5 9-5v-2"/><path d="m7.5 12.5 9 5M10 11l9 5M7 15.5l9-5"/>'),
    "rebar": I('<path d="M5 20 20 5M3 16 16 3M8 21 21 8"/><path d="M8 13l1 1M11 10l1 1M14 7l1 1"/>'),
    "bricks": I('<path d="M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>'),
    "tiles": I('<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>'),
    "zinc": I('<path d="M2 11 12 4l10 7"/><path d="M4 9.6V20h16V9.6"/><path d="M7 7.5V20M10 5.6V20M14 5.6V20M17 7.5V20"/>'),
    "bath": I('<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M6 12V5a2 2 0 0 1 3.5-1.3M8.5 6.5l2-2"/><path d="M7 20l-1 2M17 20l1 2"/>'),
    "toilet": I('<path d="M6 3h7v7H6z"/><path d="M4 10h14a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M8 15l-1 6h9l-1-6"/>'),
    "faucet": I('<path d="M5 21v-3h6v3"/><path d="M8 18v-6a4 4 0 0 1 4-4h6v3"/><path d="M8 8V5M5 5h6"/><path d="M18 14v1"/>'),
    "pipe": I('<path d="M3 8h9a4 4 0 0 1 4 4v9"/><path d="M3 13h7a1 1 0 0 1 1 1v7"/><path d="M3 6v9M14 21h4"/>'),
    "bolt": I('<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>'),
    "cable": I('<path d="M7 3v5M11 3v5"/><path d="M5 8h8v3a4 4 0 0 1-8 0Z"/><path d="M9 15v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V6"/>'),
    "meter": I('<path d="M4 15a8 8 0 1 1 16 0"/><path d="m12 15 4-5"/><path d="M4 19h16"/>'),
    "list": I('<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>'),
    "helmet": I('<path d="M3 17h18M4.5 17a7.5 7.5 0 0 1 15 0"/><path d="M10 9.5V6h4v3.5"/><path d="M3 17v2h18v-2"/>'),
    "calc": I('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4"/>'),
    "box3d": I('<path d="m12 2.5 8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3Z"/><path d="m3.5 7.3 8.5 4.8 8.5-4.8M12 12.1v9.4"/><path d="M7.7 4.9l8.5 4.8"/>'),
    "palette": I('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-.9 1.3-1.9-.4-1.1.3-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>'),
}

# Herramientas principales (las que realmente se usan)
MAIN = [
    ("catalogo", "catalogo.html", "Catálogo 3D", "box3d", "Mira los productos en 3D: inodoros, lavamanos, grifería, tubería PVC y cables, con medidas y opciones."),
    ("calculadora", "calculadora.html", "Calculadora de materiales", "calc", "Pintura, concreto, bloques, varillas, cerámica, zinc, PVC, cable e inversor en una sola página."),
    ("color", "color.html", "Estudio de color", "palette", "Prueba colores sobre la foto de tu casa y elige la pintura correcta para cada superficie."),
    ("proyectos", "proyectos.html", "Listas por proyecto", "list", "La lista de compras completa para pintar, hacer un baño, levantar una verja y más."),
    ("contratistas", "contratistas.html", "Zona de contratistas", "helmet", "Registro, precios por volumen e historial de cotizaciones."),
]

# Calculadoras (pestañas de calculadora.html): id, nombre, categoría, icono, descripción
CALCS = [
    ("pintura", "Pintura", "pinturas", "roller", "Galones y cubetas según tus paredes."),
    ("impermeabilizante", "Impermeabilizante", "pinturas", "roof", "Cubetas, sellador y malla para tu techo."),
    ("concreto", "Concreto", "construccion", "cube", "Cemento, arena y grava por resistencia."),
    ("losa", "Losa", "construccion", "slab", "Varillas, alambre y concreto para una losa."),
    ("varillas", "Varillas", "construccion", "rebar", "Varillas, estribos y quintales."),
    ("bloques", "Bloques", "construccion", "bricks", "Bloques y mortero para tu muro."),
    ("ceramica", "Cerámica", "construccion", "tiles", "Cajas, pegamento y boquilla."),
    ("zinc", "Techo de zinc", "construccion", "zinc", "Láminas, caballetes, correas y tornillos."),
    ("pvc", "Cemento PVC", "plomeria", "pipe", "Qué cemento Lanco usar y cuántos envases."),
    ("cable", "Calibre de cable", "electricidad", "cable", "Calibre, breaker y caída de tensión."),
    ("inversor", "Inversor y baterías", "electricidad", "meter", "Consumo al mes, inversor y baterías para apagones."),
]

# Categorías del catálogo 3D (para menú y enlaces)
CATALOG = [
    ("sanitarios", "Sanitarios", "toilet"),
    ("griferia", "Grifería", "faucet"),
    ("pvc", "Tubería PVC", "pipe"),
    ("cables", "Cables eléctricos", "cable"),
]

THREE = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'

def lis(xs):
    return "".join("<li>" + x + "</li>" for x in xs)

INFO = {
    "pintura": (["Área = ancho × alto × número de paredes, menos puertas y ventanas.", "Galones = área × manos ÷ rendimiento por galón.", "Rendimiento: 35 m² por galón en superficie lisa, 28 en rugosa y 22 en bloque sin repello.", "Sin pintar: sumamos sellador a razón de 1 galón por cada 30 m²."],
                ["Dos manos dan un color parejo y más duradero.", "De oscuro a claro, aplica primero sellador o blanco.", "Compra todo el color de una vez: dos preparaciones pueden variar."]),
    "impermeabilizante": (["Área del techo = largo × ancho.", "Acrílico: 4 m² por galón por mano (fibratado: 3 m²).", "Sellador diluido: 1 galón por cada 12 m².", "Malla: franjas de 20 cm en bordes, desagües y grietas, o el techo completo."],
                          ["Limpia y repara las grietas antes de aplicar.", "Aplica con el techo seco y sin lluvia en 24 horas.", "Cruza las manos: la segunda en sentido contrario."]),
    "concreto": (["Volumen = largo × ancho × espesor.", "Por m³ con fundas de 42.5 kg: 210 kg/cm² → 8.5 fundas; 175 → 7.2; 140 → 5.8.", "Se suma el desperdicio indicado."],
                 ["No agregues agua de más: baja la resistencia.", "Cura el concreto mojándolo varios días.", "En estructuras, sigue el diseño de tu ingeniero."]),
    "losa": (["Varillas por dirección = (lado ÷ separación) + 1, con 30 cm para ganchos.", "Barras de más de 6 m llevan traslape de 40 diámetros.", "Alambre: 1.5 % del peso del acero. Concreto 210 kg/cm² con 5 % de desperdicio."],
             ["Usa separadores para que el acero quede dentro del concreto.", "Amarra los bordes y alterna en el centro.", "El diseño estructural lo define tu ingeniero."]),
    "varillas": (["Varillas de 6 m con traslape de 40 diámetros.", "Estribos = (longitud ÷ separación) + 1, con 20 cm de ganchos.", "1 quintal = 100 libras = 45.36 kg."],
                 ["Pide las varillas cortadas y dobladas si no tienes espacio en obra.", "Ganchos de estribos a 135° en zonas sísmicas.", "Verifica diámetros y separaciones con tu plano."]),
    "bloques": (["12.5 bloques por m² (40 × 20 cm con junta de 1 cm).", "Mortero por m²: 0.009 m³ (4\"), 0.012 m³ (6\"), 0.016 m³ (8\").", "Mortero 1:4: 8.5 fundas y 1.1 m³ de arena por m³."],
                ["Moja los bloques antes de colocarlos.", "Hilo y nivel en cada hilada.", "Rellena las celdas que indique el plano."]),
    "ceramica": (["Área × (1 + desperdicio) ÷ m² por caja.", "Desperdicio: 10 % recta, 15 % diagonal.", "Pegamento: 5 kg por m². Boquilla: 0.4 kg por m²."],
                 ["Compra todas las cajas del mismo lote.", "Guarda una caja para reparaciones.", "Usa niveladores en piezas grandes."]),
    "zinc": (["Columnas = ancho ÷ 0.76 m de ancho útil.", "Filas = caída ÷ (largo de lámina − 15 cm de traslape).", "Caballetes de 65 cm útiles; 8 tornillos por lámina; correas cada metro."],
             ["Coloca las láminas en contra del viento dominante.", "Tornillos con arandela en la cresta de la onda.", "Pendiente mínima de 10 %."]),
    "pvc": (["Uniones por 1/4 de galón: 1/2\" 300, 3/4\" 200, 1\" 125, 1-1/2\" 90, 2\" 60, 3\" 40, 4\" 30, 6\" 10.", "Se suma 15 % de margen.", "El limpiador rinde un 25 % más que el cemento."],
            ["Limpia, aplica cemento en tubo y conexión, une y gira 1/4 de vuelta. Sostén 30 segundos.", "En agua caliente usa cemento para CPVC.", "Respeta el curado antes de dar presión."]),
    "cable": (["Cobre THHN a 75 °C: 14 AWG 20 A, 12 AWG 25 A, 10 AWG 35 A, 8 AWG 50 A, 6 AWG 65 A.", "Carga continua: al 125 %.", "Caída de tensión = 2 × distancia × corriente × resistencia."],
              ["El breaker protege el cable: nunca uno más grande de lo que aguanta.", "Usa cable de tierra en todos los circuitos.", "La instalación debe hacerla un electricista calificado."]),
    "inversor": (["kWh al mes = vatios × cantidad × horas × ciclo × 30 ÷ 1000.", "Inversor: 125 % de los equipos que mantendrás en el apagón.", "Baterías: energía del apagón ÷ profundidad de descarga ÷ 90 %."],
                 ["Bombillos LED: hasta 80 % menos consumo.", "Los aires inverter gastan bastante menos.", "Pon la tarifa de tu factura para ver el costo real."]),
}

CATALOG_LINK = {"pvc": "pvc", "cable": "cables"}

# ---------------------------------------------------------------- plantilla
HERO_BG = (
    '<div class="hex-drift" aria-hidden="true">'
    '<svg class="hx h1" viewBox="0 0 100 110"><path d="M50 3 96 29v52L50 107 4 81V29Z"/></svg>'
    '<svg class="hx h2" viewBox="0 0 100 110"><path d="M50 3 96 29v52L50 107 4 81V29Z"/></svg>'
    '<svg class="hx h3" viewBox="0 0 100 110"><path d="M50 3 96 29v52L50 107 4 81V29Z"/></svg>'
    '<img class="hx-logo" src="assets/icono.png" alt="">'
    "</div>"
)

def page(slug, title, h1, intro, body, extra_js=(), three=False, color="#D7261E", tag=None):
    scripts = [THREE] if three else []
    scripts += ['<script src="js/' + f + '"></script>' for f in ["config.js", "tools-data.js", "colors.js", "common.js", "calcs.js"] + list(extra_js) + ["dev-dock.config.js", "dev-dock.js"]]
    tagh = ('<div class="ttags"><span class="ttag">' + tag + "</span></div>") if tag else ""
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{escape(title)} · Más Hierro Ferretería</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{escape(intro)}">
<link rel="icon" href="assets/icono.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,800&family=Barlow:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/tools.css">
</head>
<body data-root="" data-page="{slug}" style="--cat:{color}">
<div id="mh-header"></div>
<main>
  <section class="thero">
    {HERO_BG}
    <div class="wrap">
      <nav class="crumbs" aria-label="Ruta"><a href="./">Inicio</a><span>/</span><span>{escape(title)}</span></nav>
      {tagh}
      <h1>{escape(h1)}</h1>
      <p class="lead">{escape(intro)}</p>
    </div>
  </section>
  <section class="tbody"><div class="wrap">
    {body}
  </div></section>
  <section class="trelated"><div class="wrap">
    <div class="rel-head"><h2>Otras herramientas</h2><a href="./#herramientas">Ver todas</a></div>
    <div class="rel-grid" id="relatedTools"></div>
  </div></section>
</main>
<div id="mh-footer"></div>
{chr(10).join(scripts)}
</body>
</html>
"""

def calculadora_body():
    tabs, panels = [], []
    for key, c in CATS.items():
        items = [x for x in CALCS if x[2] == key]
        tabs.append(f'<div class="cgroup" style="--cat:{c["color"]}"><p class="cg-l">{escape(c["name"])}</p><div class="cg-btns">' + "".join(
            f'<button type="button" role="tab" class="calc-tab" data-tab="{x[0]}" aria-controls="panel-{x[0]}" aria-selected="false">{ICONS[x[3]]}<span>{escape(x[1])}</span></button>' for x in items) + "</div></div>")
    for cid, name, cat, icon, desc in CALCS:
        c = CATS[cat]
        how, tips = INFO[cid]
        mount = '<div id="consumoApp"></div>' if cid == "inversor" else f'<div class="calc-mount" data-calc="{cid}"></div>'
        link = ""
        if cid in CATALOG_LINK:
            link = f'<a class="cp-3d" href="catalogo.html#{CATALOG_LINK[cid]}">{ICONS["box3d"]}Ver {"la tubería y conexiones" if cid == "pvc" else "los cables"} en 3D</a>'
        panels.append(
            f'<section class="calc-panel" id="panel-{cid}" role="tabpanel" data-panel="{cid}" style="--cat:{c["color"]}" hidden>'
            f'<div class="cp-head"><span class="cp-ic">{ICONS[icon]}</span><div><p class="cp-cat">{escape(c["name"])}</p><h2>{escape(name)}</h2><p class="cp-desc">{escape(desc)}</p></div>{link}</div>'
            f'{mount}'
            f'<div class="cp-info"><div><h3>Cómo lo calculamos</h3><ul>{lis(how)}</ul></div><div><h3>Consejos del mostrador</h3><ul class="tips">{lis(tips)}</ul></div></div>'
            "</section>"
        )
    return '<div class="calc-tabs" role="tablist" aria-label="Calculadoras">' + "".join(tabs) + "</div>" + "".join(panels)

COLOR_BODY = """<section class="color-sec" id="foto">
      <div class="cs-head"><span class="cp-ic">""" + ICONS["photo"] + """</span><div><h2>Pinta tu foto</h2><p class="cp-desc">Sube una foto de tu fachada o de tu pared y toca una zona para probar un color de la carta. Se conservan la textura y las sombras.</p></div></div>
      <div id="fotoApp" class="foto-app"></div>
    </section>
    <section class="color-sec" id="guia">
      <div class="cs-head"><span class="cp-ic">""" + ICONS["guide"] + """</span><div><h2>¿Qué pintura uso?</h2><p class="cp-desc">Elige la superficie y te decimos cómo prepararla, qué base aplicar, qué pintura usar y cuántas manos dar.</p></div></div>
      <div id="guiaApp" class="guia-app"></div>
    </section>
    <a class="color-cta" href="./#preparador"><span class="cp-ic">""" + ICONS["roller"] + """</span><span><b>Mira cómo preparamos tu color</b><small>La máquina tintométrica en 3D, en la portada.</small></span></a>"""

# ---------------------------------------------------------------- portada
def hub_html():
    cat_links = "".join(f'<a href="catalogo.html#{cid}">{ICONS[ic]}{escape(n)}</a>' for cid, n, ic in CATALOG)
    calc_chips = "".join(f'<a href="calculadora.html#{x[0]}" style="--cat:{CATS[x[2]]["color"]}">{escape(x[1])}</a>' for x in CALCS)
    return f"""<div class="hub-main">
  <a class="hcat3d" href="catalogo.html">
    <span class="h3-tag">Nuevo · 3D</span>
    <div class="h3-img"><img src="assets/catalogo/portada.webp" alt="Inodoro, grifería, conexiones PVC y cable en 3D" loading="lazy" width="900" height="560"></div>
    <div class="h3-copy"><small>Catálogo 3D</small><b>Mira el producto antes de comprarlo</b>
      <p>Inodoros, lavamanos, grifería, tubería y conexiones PVC y cables. Gíralos, mira sus medidas reales y cambia color, acabado, diámetro o calibre.</p>
      <span class="hf-go">Abrir el catálogo <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span></div>
  </a>
  <div class="h3-cats">{cat_links}</div>
</div>
<div class="hub-tools">
  <a class="htool" href="calculadora.html"><span class="ht-ic">{ICONS["calc"]}</span><div><b>Calculadora de materiales</b><p>{len(CALCS)} cálculos en una sola página. El resultado pasa a tu cotización.</p></div></a>
  <div class="ht-chips">{calc_chips}</div>
  <a class="htool" href="color.html"><span class="ht-ic">{ICONS["palette"]}</span><div><b>Estudio de color</b><p>Prueba colores sobre la foto de tu casa y elige la pintura correcta para cada superficie.</p></div></a>
  <a class="htool" href="proyectos.html"><span class="ht-ic">{ICONS["list"]}</span><div><b>Listas por proyecto</b><p>Pintar una habitación, hacer un baño, levantar una verja: la lista completa en un toque.</p></div></a>
  <a class="htool" href="contratistas.html"><span class="ht-ic">{ICONS["helmet"]}</span><div><b>Zona de contratistas</b><p>Precios por volumen, entrega prioritaria e historial de cotizaciones.</p></div></a>
</div>"""

REDIRECTS = {
    "visualizador": "/color.html", "foto": "/color.html#foto", "guia-pintura": "/color.html#guia",
    "bano": "/catalogo.html#sanitarios", "consumo": "/calculadora.html#inversor",
    "panete": "/calculadora.html#concreto", "verjas": "/proyectos.html",
}

def main():
    data = {
        "cats": CATS, "icons": ICONS,
        "tools": [{"slug": s, "href": h, "name": n, "icon": ic, "desc": d} for s, h, n, ic, d in MAIN],
        "calcs": [{"id": c[0], "name": c[1], "cat": c[2], "icon": c[3]} for c in CALCS],
        "catalog": [{"id": c[0], "name": c[1], "icon": c[2]} for c in CATALOG],
    }
    with open(os.path.join(BASE, "js", "tools-data.js"), "w", encoding="utf-8") as f:
        f.write("/* Generado por scripts/paginas.py. No editar a mano. */\nwindow.MH_TOOLS = " + json.dumps(data, ensure_ascii=False) + ";\n")

    pages = {
        "catalogo.html": page("catalogo", "Catálogo 3D", "Catálogo 3D de productos",
            "Gira el producto, mira sus medidas reales y cambia el color, el acabado, el diámetro o el calibre. Cuando lo tengas claro, agrégalo a tu cotización.",
            '<div id="catApp" class="cat-app"></div>', extra_js=["catalogo3d.js"], three=True, tag=ICONS["box3d"] + "Productos en 3D"),
        "calculadora.html": page("calculadora", "Calculadora de materiales", "Calculadora de materiales",
            "Elige qué vas a calcular, pon tus medidas y llévate la lista exacta. Cada resultado se agrega a tu cotización con un toque.",
            calculadora_body(), extra_js=["consumo.js", "calculadora.js"], tag=ICONS["calc"] + str(len(CALCS)) + " cálculos"),
        "color.html": page("color", "Estudio de color", "Estudio de color",
            "Prueba colores sobre la foto de tu casa y elige el sistema de pintura correcto para cada superficie.",
            COLOR_BODY, extra_js=["foto.js", "guia.js"], color="#E8A13A", tag=ICONS["palette"] + "Pinturas"),
        "proyectos.html": page("proyectos", "Listas por proyecto", "Tu lista de compras completa, por proyecto",
            "Elige lo que vas a hacer, pon tus medidas y te armamos la lista de materiales y herramientas. Quita lo que ya tienes y envíala a cotizar.",
            '<div id="proyectosApp" class="proy-app"></div>', extra_js=["proyectos.js"]),
        "contratistas.html": page("contratistas", "Zona de contratistas", "Zona de contratistas",
            "Para maestros constructores, plomeros, electricistas, pintores y empresas. Regístrate para recibir atención preferente y guarda el historial de tus cotizaciones.",
            open(os.path.join(BASE, "scripts", "contratistas_body.html"), encoding="utf-8").read(), extra_js=["contratistas.js"]),
    }
    for name, html in pages.items():
        with open(os.path.join(BASE, name), "w", encoding="utf-8") as f:
            f.write(html)

    old = os.path.join(BASE, "herramientas")
    if os.path.isdir(old):
        shutil.rmtree(old)
    lines = ["# Enlaces antiguos de herramientas → páginas nuevas (generado por scripts/paginas.py)"]
    for slug, dest in REDIRECTS.items():
        lines.append(f"/herramientas/{slug}.html  {dest}  301")
    for c in CALCS:
        lines.append(f"/herramientas/{c[0]}.html  /calculadora.html#{c[0]}  301")
    lines.append("/herramientas/*  /calculadora.html  301")
    with open(os.path.join(BASE, "_redirects"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    idx_path = os.path.join(BASE, "index.html")
    idx = open(idx_path, encoding="utf-8").read()
    idx = re.sub(r"<!--TOOLS-HUB-->.*?<!--/TOOLS-HUB-->", "<!--TOOLS-HUB-->\n" + hub_html() + "\n<!--/TOOLS-HUB-->", idx, flags=re.S)
    with open(idx_path, "w", encoding="utf-8") as f:
        f.write(idx)
    print("Generadas:", ", ".join(pages))

if __name__ == "__main__":
    main()
