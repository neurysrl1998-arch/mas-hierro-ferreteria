# Más Hierro Ferretería · Sitio web

Sitio web de **Más Hierro Ferretería**, construido alrededor de tres valores: fiabilidad, calidad y confianza. Publicado en Netlify.

## Qué incluye

**Portada**
- Preparador de pintura 3D: máquina tintométrica, agitado de la cubeta y prueba del color en la pared.
- Centro de herramientas con 17 herramientas organizadas por área y fondo animado con el logo.
- Ofertas de la semana, marcas, zona de contratistas, preguntas frecuentes y horario con indicador "Abierto ahora".

**Herramientas** (`herramientas/`)
| Área | Herramientas |
| --- | --- |
| Pinturas | Visualizador de habitaciones 3D · Pinta tu foto · Guía por superficie · Pintura · Impermeabilizante |
| Construcción | Concreto · Losa · Varillas · Bloques · Pañete y repello · Cerámica · Techo de zinc · Verjas y mallas |
| Plomería (3D) | Configurador de baño con tuberías en 3D · Cemento PVC Lanco con unión animada en 3D |
| Electricidad (3D) | Calibre de cable con circuito 3D · Consumo eléctrico con casa 3D y simulación de apagón |

**Ventas**
- Carrito "Mi cotización" en todas las páginas: se envía por WhatsApp o por formulario (Netlify Forms).
- Listas de compras por proyecto (`proyectos.html`).
- Zona de contratistas con registro e historial de cotizaciones (`contratistas.html`).

## Editar datos del negocio

| Qué | Dónde |
| --- | --- |
| Teléfono, WhatsApp, dirección, horario, marcas | `js/config.js` |
| Ofertas de la semana | `data/ofertas.json` |
| Textos de las páginas de herramientas | `scripts/paginas.py` y luego `python3 scripts/paginas.py` |
| Fórmulas de las calculadoras | `js/calcs.js` |

## Estructura

```
index.html              Portada
proyectos.html          Listas de compras por proyecto
contratistas.html       Zona de contratistas
herramientas/*.html     Una página por herramienta (generadas por scripts/paginas.py)
css/styles.css          Estilos base y componentes comunes
css/home.css            Secciones de la portada
css/tools.css           Páginas de herramientas
js/config.js            Datos del negocio
js/common.js            Cabecera, pie, carrito, avisos y horario en vivo
js/colors.js            Carta de colores y fórmula de tinte
js/calcs.js             Motor de calculadoras
js/scene3d.js           Base compartida de las escenas 3D (three.js r128)
js/*3d.js, js/*.js      Escenas 3D y lógica de cada herramienta
data/ofertas.json       Ofertas
```

## Ver en local

```bash
python3 -m http.server 8000
```

Abre http://localhost:8000. Los formularios solo se envían de verdad en el sitio publicado en Netlify.

## Publicar en Netlify

El repositorio incluye `netlify.toml`. Cada `git push` a `main` vuelve a publicar el sitio.
Los formularios `cotizacion` y `contratistas` aparecen en **Forms** del panel de Netlify (activa **Enable form detection** si es la primera vez).

## Pendiente antes de publicar para clientes

- Poner teléfono, WhatsApp, dirección y horario reales en `js/config.js`.
- Confirmar las marcas que vende la tienda y los precios reales en `data/ofertas.json`.
- Revisar las respuestas de preguntas frecuentes en `index.html`.
- Ajustar los rendimientos de las calculadoras a los productos de la tienda.
