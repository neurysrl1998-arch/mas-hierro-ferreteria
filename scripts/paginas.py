#!/usr/bin/env python3
"""Genera las páginas de herramientas de Más Hierro Ferretería.

Uso:  python3 scripts/paginas.py

Fuente única de:
  - el registro de herramientas (js/tools-data.js),
  - las páginas herramientas/*.html, proyectos.html y contratistas.html,
  - la cuadrícula del "Centro de herramientas" en index.html (entre <!--TOOLS-HUB--> y <!--/TOOLS-HUB-->).
Edita los textos aquí y vuelve a ejecutar el script.
"""
import json
import os
import re
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
    "room": I('<path d="M3 20V8l9-5 9 5v12"/><path d="M7 20v-5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5"/><path d="M5 17h14"/>'),
    "photo": I('<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>'),
    "guide": I('<path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z"/>'),
    "roof": I('<path d="M2 12 12 4l10 8"/><path d="M5 10v10h14V10"/><path d="M9 14c0-1 1-2 1.5-3 .5 1 1.5 2 1.5 3a1.5 1.5 0 0 1-3 0Z"/>'),
    "cube": I('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>'),
    "slab": I('<path d="M3 15 12 10l9 5-9 5Z"/><path d="M3 15v2l9 5 9-5v-2"/><path d="m7.5 12.5 9 5M10 11l9 5M7 15.5l9-5"/>'),
    "rebar": I('<path d="M5 20 20 5M3 16 16 3M8 21 21 8"/><path d="M8 13l1 1M11 10l1 1M14 7l1 1"/>'),
    "bricks": I('<path d="M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>'),
    "trowel": I('<path d="M3 13 13 3l8 8-10 10Z"/><path d="m13 13 3 3-4 5"/>'),
    "tiles": I('<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>'),
    "zinc": I('<path d="M2 11 12 4l10 7"/><path d="M4 9.6V20h16V9.6"/><path d="M7 7.5V20M10 5.6V20M14 5.6V20M17 7.5V20"/>'),
    "fence": I('<path d="M4 21V7l2-3 2 3v14M16 21V7l2-3 2 3v14M8 10h8M8 16h8"/><path d="M10 10l4 6M14 10l-4 6"/>'),
    "bath": I('<path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M6 12V5a2 2 0 0 1 3.5-1.3M8.5 6.5l2-2"/><path d="M7 20l-1 2M17 20l1 2"/>'),
    "pipe": I('<path d="M3 8h9a4 4 0 0 1 4 4v9"/><path d="M3 13h7a1 1 0 0 1 1 1v7"/><path d="M3 6v9M14 21h4"/>'),
    "bolt": I('<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>'),
    "cable": I('<path d="M7 3v5M11 3v5"/><path d="M5 8h8v3a4 4 0 0 1-8 0Z"/><path d="M9 15v2a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V6"/>'),
    "meter": I('<path d="M4 15a8 8 0 1 1 16 0"/><path d="m12 15 4-5"/><path d="M4 19h16"/>'),
    "list": I('<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>'),
    "helmet": I('<path d="M3 17h18M4.5 17a7.5 7.5 0 0 1 15 0"/><path d="M10 9.5V6h4v3.5"/><path d="M3 17v2h18v-2"/>'),
    "cart": I('<path d="M8 3h8v3H8z"/><path d="M6 5H4v16h16V5h-2"/><path d="M8 11h8M8 15h8M8 19h5"/>'),
}

# slug, archivo, nombre, nombre corto, categoría, icono, descripción, 3D/destacada
TOOLS = [
    ("visualizador", "Visualizador de habitaciones 3D", "Visualizador 3D", "pinturas", "room", "Pinta cada pared de una sala, cocina, habitación o fachada en 3D.", "3D"),
    ("foto", "Pinta tu foto", "Pinta tu foto", "pinturas", "photo", "Sube una foto de tu casa y prueba colores encima.", ""),
    ("guia-pintura", "Guía de pintura por superficie", "Guía por superficie", "pinturas", "guide", "Qué base, qué pintura y cuántas manos para cada superficie.", ""),
    ("pintura", "Calculadora de pintura", "Pintura", "pinturas", "roller", "Galones y cubetas según tus paredes.", ""),
    ("impermeabilizante", "Impermeabilizante para techos", "Impermeabilizante", "pinturas", "roof", "Cubetas, sellador y malla para tu techo.", ""),
    ("concreto", "Calculadora de concreto", "Concreto", "construccion", "cube", "Cemento, arena y grava por resistencia.", ""),
    ("losa", "Calculadora de losa", "Losa", "construccion", "slab", "Varillas, alambre y concreto para una losa completa.", ""),
    ("varillas", "Calculadora de varillas", "Varillas", "construccion", "rebar", "Varillas, estribos y quintales para columnas y vigas.", ""),
    ("bloques", "Calculadora de bloques", "Bloques", "construccion", "bricks", "Bloques y mortero para tu muro.", ""),
    ("panete", "Pañete y repello", "Pañete y repello", "construccion", "trowel", "Cemento y arena para pañetar tus paredes.", ""),
    ("ceramica", "Calculadora de cerámica", "Cerámica", "construccion", "tiles", "Cajas, pegamento y boquilla para tu piso.", ""),
    ("zinc", "Techo de zinc", "Techo de zinc", "construccion", "zinc", "Láminas, caballetes, correas y tornillos.", ""),
    ("verjas", "Verjas y mallas", "Verjas y mallas", "construccion", "fence", "Malla ciclón, tubos, púas y concreto.", ""),
    ("bano", "Configurador de baño 3D", "Configurador de baño", "plomeria", "bath", "Arma tu baño y mira las tuberías en 3D.", "3D"),
    ("pvc", "Cemento PVC Lanco", "Cemento PVC Lanco", "plomeria", "pipe", "Qué cemento usar y cuántos envases necesitas.", "3D"),
    ("cable", "Calibre de cable y breaker", "Calibre de cable", "electricidad", "cable", "Calibre, breaker y caída de tensión para tu circuito.", "3D"),
    ("consumo", "Consumo eléctrico e inversor", "Consumo e inversor", "electricidad", "meter", "kWh al mes, inversor y baterías para los apagones.", "3D"),
]

THREE = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'

def tool(slug):
    for t in TOOLS:
        if t[0] == slug:
            return t
    raise KeyError(slug)

# ---------------------------------------------------------------- textos por página
def info(how, tips, related):
    lis = lambda xs: "".join("<li>" + x + "</li>" for x in xs)
    return (
        '<section class="tinfo"><div class="wrap tinfo-grid">'
        '<div class="ibox"><h2>Cómo lo calculamos</h2><ul>' + lis(how) + "</ul></div>"
        '<div class="ibox"><h2>Consejos del mostrador</h2><ul class="tips">' + lis(tips) + "</ul></div>"
        '<div class="ibox"><h2>Lo encuentras en la tienda</h2><div class="chips-rel">'
        + "".join("<span>" + escape(r) + "</span>" for r in related)
        + '</div><a class="btn btn-red" href="../#cotizar">Pedir cotización</a></div>'
        "</div></section>"
    )

def calc_body(cid, stage=""):
    return stage + '<div class="calc-mount" data-calc="' + cid + '"></div>'

STAGE = lambda sid, label, hud="": (
    '<div class="stage3d" id="' + sid + '"><canvas aria-label="' + escape(label) + '"></canvas>'
    + hud + '<span class="hud-hint">Arrastra para girar</span>'
    '<div class="no3d-msg">Tu navegador no puede mostrar la vista 3D. La herramienta funciona igual.</div></div>'
)

PAGES = {}

PAGES["pintura"] = dict(
    h1="¿Cuánta pintura necesito?",
    intro="Mide tus paredes, descuenta puertas y ventanas, y te decimos cuántos galones y cubetas llevar.",
    body=calc_body("pintura"),
    info=info(
        ["Área = ancho × alto × número de paredes, menos puertas y ventanas.", "Galones = área × manos ÷ rendimiento por galón.", "Rendimiento: 35 m² por galón en superficie lisa, 28 en rugosa y 22 en bloque sin repello.", "Si la superficie está sin pintar, sumamos sellador a razón de 1 galón por cada 30 m²."],
        ["Dos manos dan un color parejo y más duradero que una mano gruesa.", "Si cambias de un color oscuro a uno claro, aplica primero una mano de sellador o de blanco.", "Compra todo el color de una vez: dos preparaciones distintas pueden variar un poco."],
        ["Pintura acrílica", "Sellador acrílico", "Rodillos y felpas", "Brochas", "Cinta de enmascarar", "Bandejas", "Masilla"],
    ),
)
PAGES["impermeabilizante"] = dict(
    h1="Impermeabiliza tu techo sin quedarte corto",
    intro="Calcula las cubetas de impermeabilizante, el sellador y la malla de refuerzo según el tamaño de tu techo.",
    body=calc_body("impermeabilizante"),
    info=info(
        ["Área del techo = largo × ancho.", "Impermeabilizante acrílico: 4 m² por galón por mano (fibratado: 3 m²).", "Sellador diluido: 1 galón por cada 12 m².", "Malla de refuerzo: franjas de 20 cm en bordes, desagües y grietas, o el techo completo."],
        ["Limpia bien el techo y repara las grietas antes de aplicar.", "Aplica con el techo seco y sin lluvia pronosticada en 24 horas.", "Cruza las manos: la segunda en sentido contrario a la primera."],
        ["Impermeabilizante acrílico", "Sellador", "Malla de poliéster", "Cepillo de cerdas", "Rodillo de felpa gruesa", "Sellador de grietas"],
    ),
)
PAGES["concreto"] = dict(
    h1="Concreto a la medida de tu vaciado",
    intro="Pon las medidas y la resistencia, y obtén las fundas de cemento, la arena, la grava y el agua.",
    body=calc_body("concreto"),
    info=info(
        ["Volumen = largo × ancho × espesor.", "Dosificación por m³ con fundas de 42.5 kg: 210 kg/cm² → 8.5 fundas; 175 → 7.2; 140 → 5.8.", "Sumamos el porcentaje de desperdicio que indiques."],
        ["Usa agua limpia y no agregues de más: el exceso de agua baja la resistencia.", "Cura el concreto mojándolo varios días después del vaciado.", "Para columnas y losas, sigue siempre el diseño de tu ingeniero."],
        ["Cemento gris 42.5 kg", "Arena lavada", "Grava", "Aditivos", "Varillas", "Alambre de amarre"],
    ),
)
PAGES["losa"] = dict(
    h1="Losa completa: acero y concreto",
    intro="Calcula las varillas en las dos direcciones, el alambre de amarre y el concreto de tu losa.",
    body=calc_body("losa"),
    info=info(
        ["Varillas en cada dirección = (lado ÷ separación) + 1, con 30 cm extra para ganchos.", "Si una varilla pasa de 6 m sumamos el traslape de 40 diámetros.", "Alambre de amarre: 1.5 % del peso del acero.", "Concreto con 5 % de desperdicio en resistencia 210 kg/cm²."],
        ["Coloca separadores para que el acero quede dentro del concreto.", "Amarra todas las intersecciones de los bordes y alternadas en el centro.", "Este cálculo es orientativo. El diseño estructural lo define tu ingeniero."],
        ["Varillas 3/8\" y 1/2\"", "Alambre de amarre", "Cemento", "Arena y grava", "Separadores", "Plywood para encofrado"],
    ),
)
PAGES["varillas"] = dict(
    h1="Varillas y estribos para columnas y vigas",
    intro="Calcula las varillas longitudinales, los estribos, el peso en quintales y el alambre de amarre.",
    body=calc_body("varillas"),
    info=info(
        ["Varillas comerciales de 6 m con traslape de 40 diámetros cuando el elemento es más largo.", "Estribos = (longitud ÷ separación) + 1, con 20 cm de ganchos cada uno.", "Pesos por metro: 1/4\" 0.25 kg, 3/8\" 0.56 kg, 1/2\" 0.99 kg, 5/8\" 1.55 kg, 3/4\" 2.24 kg.", "1 quintal = 100 libras = 45.36 kg."],
        ["Pide las varillas cortadas y dobladas si tu obra no tiene espacio para trabajarlas.", "Cierra los estribos con ganchos a 135° en zonas sísmicas.", "Verifica los diámetros y separaciones con tu plano estructural."],
        ["Varillas corrugadas", "Alambre de amarre", "Estribos hechos", "Cortadora de varillas", "Dobladora"],
    ),
)
PAGES["bloques"] = dict(
    h1="Bloques y mortero para tu muro",
    intro="Mide el muro, descuenta puertas y ventanas, y te decimos cuántos bloques y cuánto mortero necesitas.",
    body=calc_body("bloques"),
    info=info(
        ["12.5 bloques por m² (bloque de 40 × 20 cm con junta de 1 cm).", "Mortero por m²: 0.009 m³ (4\"), 0.012 m³ (6\"), 0.016 m³ (8\").", "Mortero 1:4: 8.5 fundas de cemento y 1.1 m³ de arena por m³."],
        ["Moja los bloques antes de colocarlos para que no le roben agua al mortero.", "Usa hilo y nivel en cada hilada.", "Refuerza con varilla y concreto las celdas que indique el plano."],
        ["Bloques 4\", 6\" y 8\"", "Cemento", "Arena", "Varillas", "Nivel y plomada", "Cuchara de albañil"],
    ),
)
PAGES["panete"] = dict(
    h1="Pañete y repello sin desperdicio",
    intro="Calcula el cemento y la arena para pañetar tus paredes según el espesor y la proporción.",
    body=calc_body("panete"),
    info=info(
        ["Volumen de mortero = área × espesor, más el desperdicio.", "Cemento por m³: 1:3 → 10.4 fundas; 1:4 → 8.2; 1:5 → 6.8.", "Arena por m³: 1.00 (1:3), 1.05 (1:4) y 1.10 (1:5)."],
        ["Moja la pared antes de pañetar.", "Para exteriores y zonas húmedas usa 1:3 o 1:4.", "Aplica en capas de no más de 2 cm."],
        ["Cemento", "Arena fina", "Llana y regla", "Malla para pañete", "Aditivo adherente"],
    ),
)
PAGES["ceramica"] = dict(
    h1="Cerámica: cajas, pegamento y boquilla",
    intro="Mide el área, elige cómo la vas a colocar y obtén las cajas, el pegamento y la boquilla.",
    body=calc_body("ceramica"),
    info=info(
        ["Área × (1 + desperdicio) ÷ m² por caja.", "Desperdicio: 10 % en colocación recta, 15 % en diagonal.", "Pegamento: 5 kg por m² (sacos de 20 kg). Boquilla: 0.4 kg por m²."],
        ["Compra todas las cajas del mismo lote para que el tono sea igual.", "Guarda una caja extra para reparaciones futuras.", "Usa niveladores en piezas grandes para evitar cejas."],
        ["Cerámica y porcelanato", "Pegamento", "Boquilla", "Crucetas y niveladores", "Llana dentada", "Cortadora"],
    ),
)
PAGES["zinc"] = dict(
    h1="Techo de zinc: láminas, correas y tornillos",
    intro="Pon el ancho del techo y la caída de cada agua, y calcula láminas, caballetes, correas y tornillos.",
    body=calc_body("zinc"),
    info=info(
        ["Columnas de láminas = ancho ÷ 0.76 m de ancho útil.", "Filas = caída ÷ (largo de lámina − 15 cm de traslape).", "Caballetes de 65 cm útiles a lo largo de la cumbrera (techos de 2 aguas).", "8 tornillos por lámina y 4 por caballete. Correas cada metro."],
        ["Coloca las láminas en contra del viento dominante.", "Usa tornillos con arandela de goma en la cresta de la onda.", "Deja una pendiente mínima de 10 % para que el agua corra."],
        ["Zinc ondulado", "Caballetes", "Tornillos autorroscantes", "Correas metálicas", "Sellador para techos"],
    ),
)
PAGES["verjas"] = dict(
    h1="Verjas y mallas: todo para cercar",
    intro="Pon el perímetro y la altura, y calcula la malla ciclón, los tubos, el alambre de púas y el concreto.",
    body=calc_body("verjas"),
    info=info(
        ["Longitud a cercar = perímetro − ancho de portones.", "Postes cada 2.5 m más uno en cada esquina, enterrados 50 cm.", "Tubo superior a todo lo largo, en piezas de 6 m.", "Concreto: 0.054 m³ por poste (hoyo de 30 × 30 × 60 cm)."],
        ["Tensa la malla desde una esquina y fíjala cada 60 cm.", "Usa postes más gruesos en esquinas y portones.", "Pinta con anticorrosivo los cortes de tubo."],
        ["Malla ciclón", "Tubo galvanizado", "Alambre de púas", "Alambre galvanizado", "Cemento", "Anticorrosivo"],
    ),
)

PVC_HUD = '<ol class="hud-steps" id="pvcSteps"><li>Cortar</li><li>Limpiar</li><li>Cementar</li><li>Unir 1/4 de vuelta</li></ol><div class="hud-bottom"><p id="pvcMsg">Mira cómo se hace una unión perfecta.</p><div class="hud-bar"><i id="pvcBar"></i></div></div><button class="stage-btn" id="pvcReplay" type="button">Ver de nuevo</button>'
PAGES["pvc"] = dict(
    h1="Cemento PVC Lanco: el correcto y la cantidad exacta",
    intro="Elige el diámetro, el número de uniones y el tipo de línea. Te decimos qué producto Lanco usar y cuántos envases llevar, y te mostramos en 3D cómo hacer la unión.",
    body=calc_body("pvc", STAGE("pvcStage", "Animación 3D de una unión de PVC con limpiador y cemento", PVC_HUD)),
    extra_js=["pvc3d.js"], three=True,
    info=info(
        ["Uniones por cuarto de galón (946 ml): 1/2\" 300, 3/4\" 200, 1\" 125, 1-1/2\" 90, 2\" 60, 3\" 40, 4\" 30, 6\" 10.", "Sumamos 15 % de margen.", "El limpiador rinde un 25 % más que el cemento."],
        ["Respeta el tiempo de curado antes de dar presión a la línea.", "Usa cemento para CPVC en agua caliente: el de PVC no resiste la temperatura.", "Mantén el envase cerrado: el cemento se espesa con el aire.", "Confirma en tienda las presentaciones disponibles."],
        ["Lanco PVC Cleaner", "Lanco Super PVC Cement", "Lanco Wet-Dry", "Cemento CPVC", "Cortatubos", "Tubería y conexiones"],
    ),
)
CABLE_HUD = '<div class="hud-chips" id="cableChips"></div><div class="hud-bottom"><p id="cableMsg">La corriente fluye del breaker a la carga.</p></div>'
PAGES["cable"] = dict(
    h1="Calibre de cable y breaker para tu circuito",
    intro="Pon la carga, el voltaje y la distancia. Te damos el calibre, el breaker y la caída de tensión, y lo ves en 3D: el grosor del cable, el breaker y la corriente.",
    body=calc_body("cable", STAGE("cableStage", "Circuito 3D con breaker, cable y carga", CABLE_HUD)),
    extra_js=["cable3d.js"], three=True,
    info=info(
        ["Cable de cobre THHN a 75 °C: 14 AWG 20 A, 12 AWG 25 A, 10 AWG 35 A, 8 AWG 50 A, 6 AWG 65 A, 4 AWG 85 A, 2 AWG 115 A.", "Carga continua (más de 3 horas): se calcula al 125 %.", "Caída de tensión = 2 × distancia × corriente × resistencia del cable.", "Elegimos el calibre más delgado que cumpla la corriente y la caída máxima."],
        ["El breaker protege el cable: nunca pongas un breaker más grande que lo que aguanta el cable.", "Usa cable de tierra en todos los circuitos.", "Toda instalación debe hacerla o revisarla un electricista calificado."],
        ["Cable THHN", "Breakers", "Tubería conduit", "Cajas y tapas", "Tomacorrientes", "Cinta aislante"],
    ),
)
CONSUMO_HUD = '<div class="hud-chips" id="houseChips"></div><button class="stage-btn" id="outageBtn" type="button">Simular apagón</button>'
PAGES["consumo"] = dict(
    h1="Consumo eléctrico, inversor y baterías",
    intro="Marca los equipos de tu casa y cuántas horas los usas. Calculamos tu consumo al mes y el inversor y las baterías para pasar los apagones. Simula un apagón en la casa 3D.",
    body=STAGE("houseStage", "Casa 3D con equipos eléctricos y simulación de apagón", CONSUMO_HUD) + '<div id="consumoApp"></div>',
    extra_js=["consumo.js", "house3d.js"], three=True,
    info=info(
        ["kWh al mes = vatios × cantidad × horas al día × ciclo de trabajo × 30 ÷ 1000.", "La nevera y el aire trabajan por ciclos: no consumen su potencia todo el tiempo.", "Inversor: 125 % de la potencia de los equipos que mantendrás en el apagón.", "Baterías: energía del apagón ÷ profundidad de descarga ÷ 90 % de eficiencia."],
        ["Cambia los bombillos a LED: consumen hasta 80 % menos.", "Los aires inverter gastan bastante menos que los convencionales.", "Pon tu tarifa real de la factura para ver el costo exacto."],
        ["Inversores", "Baterías", "Bombillos LED", "Breakers", "Cable", "Regletas con protección"],
    ),
)

BANO_BODY = (
    '<div class="bano-grid">'
    + STAGE("banoStage", "Baño 3D con tuberías de agua fría, caliente y drenaje",
            '<div class="hud-legend"><span class="lg-cold">Agua fría</span><span class="lg-hot">Agua caliente</span><span class="lg-drain">Drenaje</span></div>'
            '<button class="stage-btn" id="banoXray" type="button" aria-pressed="true">Ver tuberías</button>')
    + '<div class="bano-panel" id="banoApp"></div></div>'
)
PAGES["bano"] = dict(
    h1="Arma tu baño y mira sus tuberías en 3D",
    intro="Elige los aparatos de tu baño. La vista 3D muestra el recorrido del agua fría, la caliente y el drenaje, y armamos la lista completa de tubos, conexiones y cemento Lanco.",
    body=BANO_BODY,
    extra_js=["bano.js", "bano3d.js"], three=True,
    info=info(
        ["Agua fría en PVC 1/2\" y agua caliente en CPVC 1/2\".", "Drenaje del inodoro en 4\" y del resto de aparatos en 2\".", "Contamos codos, tees, llaves angulares y adaptadores por aparato.", "Tubos en piezas de 6 m."],
        ["Prueba la presión de las líneas antes de cerrar la pared.", "Deja pendiente de 2 % en los drenajes.", "Pon una llave de paso general para poder cerrar el baño sin cortar la casa."],
        ["Tubería PVC y CPVC", "Codos y tees", "Llaves angulares", "Cera para inodoro", "Cemento Lanco", "Teflón"],
    ),
)

VIS_BODY = (
    '<div class="vis-grid">'
    + STAGE("visStage", "Habitación 3D para probar colores en paredes",
            '<div class="hud-chips" id="visRooms" role="group" aria-label="Espacio"></div>'
            '<div class="hud-bottom"><p id="visMsg">Toca una pared para elegirla y luego un color.</p></div>')
    + '<div class="vis-panel" id="visApp"></div></div>'
)
PAGES["visualizador"] = dict(
    h1="Pinta tu espacio antes de comprar la pintura",
    intro="Elige una sala, una cocina, una habitación o una fachada. Toca cada pared y pruébale un color de nuestra carta. Al final te decimos cuántos galones de cada color necesitas.",
    body=VIS_BODY,
    extra_js=["visualizador.js"], three=True,
    info=info(
        ["Cada superficie conoce su área real en m².", "Galones por color = área total de ese color × 2 manos ÷ 35 m² por galón.", "Los colores se muestran con la luz que elijas: día, tarde o noche."],
        ["La luz cambia mucho un color: pruébalo con la luz de la hora en que más usas el espacio.", "Una pared de acento oscura agranda la sensación de profundidad.", "Pide una muestra pequeña y píntala en tu pared antes de comprar todo."],
        ["Pintura acrílica", "Esmaltes para puertas", "Rodillos y brochas", "Cinta de enmascarar", "Sellador"],
    ),
)
FOTO_BODY = '<div id="fotoApp" class="foto-app"></div>'
PAGES["foto"] = dict(
    h1="Sube una foto y prueba colores encima",
    intro="Usa una foto de tu fachada o de tu pared. Toca una zona para rellenarla con un color de la carta. La textura y las sombras se mantienen.",
    body=FOTO_BODY,
    extra_js=["foto.js"],
    info=info(
        ["La zona se detecta por parecido de color con el punto que tocas.", "Ajusta la tolerancia si se pinta de más o de menos.", "Mantenemos la luz y las sombras de la foto para que el resultado se vea real."],
        ["Usa una foto con luz de día y de frente a la pared.", "Las superficies lisas y de un solo color dan mejor resultado.", "Tu foto se procesa en tu teléfono o computadora: no se sube a ningún servidor."],
        ["Pintura acrílica", "Pintura para exteriores", "Esmalte", "Sellador", "Rodillos"],
    ),
)
PAGES["guia-pintura"] = dict(
    h1="Qué pintura usar en cada superficie",
    intro="Elige la superficie y te decimos cómo prepararla, qué base aplicar, qué pintura usar y cuántas manos dar.",
    body='<div id="guiaApp" class="guia-app"></div>',
    extra_js=["guia.js"],
    info=info(
        ["Recomendaciones generales de preparación y sistema de pintura.", "Los tiempos de secado son orientativos a 25 °C.", "Cada fabricante indica rendimientos y tiempos exactos en la etiqueta."],
        ["La preparación es el 70 % de un buen trabajo de pintura.", "No pintes con lluvia ni con sol directo fuerte.", "Lee siempre la ficha técnica del producto."],
        ["Selladores", "Anticorrosivos", "Esmaltes", "Pintura acrílica", "Epóxicos", "Lijas y masillas"],
    ),
)

# ---------------------------------------------------------------- plantilla
HERO_BG = (
    '<div class="hex-drift" aria-hidden="true">'
    '<svg class="hx h1" viewBox="0 0 100 110"><path d="M50 3 96 29v52L50 107 4 81V29Z"/></svg>'
    '<svg class="hx h2" viewBox="0 0 100 110"><path d="M50 3 96 29v52L50 107 4 81V29Z"/></svg>'
    '<svg class="hx h3" viewBox="0 0 100 110"><path d="M50 3 96 29v52L50 107 4 81V29Z"/></svg>'
    '<img class="hx-logo" src="{root}assets/icono.png" alt="">'
    "</div>"
)

def page(slug, title, h1, intro, body, cat=None, root="../", extra_js=(), three=False, info_html="", crumbs=None, desc=""):
    c = CATS.get(cat) if cat else None
    color = c["color"] if c else "#D7261E"
    tag = (
        '<span class="ttag">' + ICONS[c["icon"]] + escape(c["name"]) + "</span>" if c else ""
    )
    crumb = crumbs or ('<a href="' + root + '">Inicio</a><span>/</span><a href="' + root + '#herramientas">Herramientas</a><span>/</span><span>' + escape(c["name"] if c else title) + "</span>")
    scripts = [THREE] if three else []
    scripts += ['<script src="' + root + "js/" + f + '"></script>' for f in ["config.js", "tools-data.js", "colors.js", "common.js", "calcs.js"]]
    scripts += ['<script src="' + root + "js/" + f + '"></script>' for f in (["scene3d.js"] if three else []) + list(extra_js)]
    t3d = '<span class="t3d">3D interactivo</span>' if three else ""
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{escape(title)} · Más Hierro Ferretería</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="{escape(desc or intro)}">
<link rel="icon" href="{root}assets/icono.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,800&family=Barlow:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="{root}css/styles.css">
<link rel="stylesheet" href="{root}css/tools.css">
</head>
<body data-root="{root}" data-page="{slug}"{' data-cat="' + cat + '"' if cat else ''} style="--cat:{color}">
<div id="mh-header"></div>
<main>
  <section class="thero">
    {HERO_BG.format(root=root)}
    <div class="wrap">
      <nav class="crumbs" aria-label="Ruta">{crumb}</nav>
      <div class="ttags">{tag}{t3d}</div>
      <h1>{escape(h1)}</h1>
      <p class="lead">{escape(intro)}</p>
    </div>
  </section>
  <section class="tbody"><div class="wrap">
    {body}
  </div></section>
  {info_html}
  <section class="trelated"><div class="wrap">
    <div class="rel-head"><h2>Otras herramientas</h2><a href="{root}#herramientas">Ver todas</a></div>
    <div class="rel-grid" id="relatedTools"></div>
  </div></section>
</main>
<div id="mh-footer"></div>
{chr(10).join(scripts)}
</body>
</html>
"""

# ---------------------------------------------------------------- centro de herramientas (portada)
def hub_html():
    feat = [
        ("visualizador", "Pinta una sala, cocina o fachada completa en 3D y mira cuántos galones necesitas de cada color."),
        ("bano", "Elige inodoro, lavamanos y ducha. Mira en 3D el agua fría, la caliente y el drenaje."),
        ("consumo", "Marca tus equipos, simula un apagón y descubre qué inversor y baterías necesitas."),
    ]
    out = ['<div class="hub-feat">']
    for slug, txt in feat:
        t = tool(slug)
        c = CATS[t[3]]
        out.append(
            f'<a class="hfeat" href="herramientas/{slug}.html" style="--cat:{c["color"]}">'
            f'<span class="hf-top"><span class="hf-ic">{ICONS[t[4]]}</span><span class="t3d">3D interactivo</span></span>'
            f'<small>{escape(c["name"])}</small><b>{escape(t[1])}</b><p>{escape(txt)}</p>'
            f'<span class="hf-go">Abrir herramienta <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span></a>'
        )
    out.append("</div>")
    out.append('<div class="hub-cats">')
    for key, c in CATS.items():
        items = [t for t in TOOLS if t[3] == key]
        out.append(f'<div class="hcat" style="--cat:{c["color"]}"><div class="hc-head"><span class="hc-ic">{ICONS[c["icon"]]}</span><h3>{escape(c["name"])}</h3><span class="hc-n">{len(items)}</span></div><ul>')
        for t in items:
            badge = '<em>3D</em>' if t[6] == "3D" else ""
            out.append(
                f'<li><a href="herramientas/{t[0]}.html"><span class="hl-ic">{ICONS[t[4]]}</span>'
                f'<span class="hl-t"><b>{escape(t[2])}{badge}</b><small>{escape(t[5])}</small></span>'
                f'<svg class="hl-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a></li>'
            )
        out.append("</ul></div>")
    out.append("</div>")
    out.append(
        '<div class="hub-strip">'
        f'<a class="hstrip" href="proyectos.html"><span class="hs-ic">{ICONS["list"]}</span><span><b>Listas de compras por proyecto</b><small>Pintar una habitación, hacer un baño, levantar una verja… La lista completa en un toque.</small></span></a>'
        f'<a class="hstrip" href="contratistas.html"><span class="hs-ic">{ICONS["helmet"]}</span><span><b>Zona de contratistas</b><small>Regístrate y guarda el historial de tus cotizaciones.</small></span></a>'
        "</div>"
    )
    return "\n".join(out)

def main():
    # registro para JS
    data = {
        "cats": CATS,
        "icons": ICONS,
        "tools": [
            {"slug": t[0], "href": "herramientas/" + t[0] + ".html", "name": t[1], "short": t[2], "cat": t[3], "icon": t[4], "desc": t[5], "is3d": t[6] == "3D"}
            for t in TOOLS
        ],
    }
    with open(os.path.join(BASE, "js", "tools-data.js"), "w", encoding="utf-8") as f:
        f.write("/* Generado por scripts/paginas.py. No editar a mano. */\nwindow.MH_TOOLS = " + json.dumps(data, ensure_ascii=False) + ";\n")

    os.makedirs(os.path.join(BASE, "herramientas"), exist_ok=True)
    for t in TOOLS:
        slug = t[0]
        p = PAGES[slug]
        html = page(slug, t[1], p["h1"], p["intro"], p["body"], cat=t[3], extra_js=p.get("extra_js", ()), three=p.get("three", False), info_html=p.get("info", ""), desc=t[5])
        with open(os.path.join(BASE, "herramientas", slug + ".html"), "w", encoding="utf-8") as f:
            f.write(html)

    # páginas raíz
    proyectos = page(
        "proyectos", "Listas de compras por proyecto", "Tu lista de compras completa, por proyecto",
        "Elige lo que vas a hacer, pon tus medidas y te armamos la lista de materiales y herramientas. Quita lo que ya tienes y envíala a cotizar.",
        '<div id="proyectosApp" class="proy-app"></div>', root="", extra_js=["proyectos.js"],
        crumbs='<a href="./">Inicio</a><span>/</span><span>Proyectos</span>',
    )
    contratistas = page(
        "contratistas", "Zona de contratistas", "Zona de contratistas",
        "Para maestros constructores, plomeros, electricistas, pintores y empresas. Regístrate para recibir atención preferente y guarda el historial de tus cotizaciones.",
        open(os.path.join(BASE, "scripts", "contratistas_body.html"), encoding="utf-8").read(), root="", extra_js=["contratistas.js"],
        crumbs='<a href="./">Inicio</a><span>/</span><span>Contratistas</span>',
    )
    for name, html in (("proyectos.html", proyectos), ("contratistas.html", contratistas)):
        with open(os.path.join(BASE, name), "w", encoding="utf-8") as f:
            f.write(html)

    # portada
    idx_path = os.path.join(BASE, "index.html")
    idx = open(idx_path, encoding="utf-8").read()
    new = re.sub(r"<!--TOOLS-HUB-->.*?<!--/TOOLS-HUB-->", "<!--TOOLS-HUB-->\n" + hub_html() + "\n<!--/TOOLS-HUB-->", idx, flags=re.S)
    new = re.sub(r"<!--TOOLS-COUNT-->.*?<!--/TOOLS-COUNT-->", "<!--TOOLS-COUNT-->" + str(len(TOOLS)) + "<!--/TOOLS-COUNT-->", new, flags=re.S)
    with open(idx_path, "w", encoding="utf-8") as f:
        f.write(new)
    print("Generadas", len(TOOLS), "herramientas + proyectos + contratistas")

if __name__ == "__main__":
    main()
