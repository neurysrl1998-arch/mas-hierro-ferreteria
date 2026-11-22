# Más Hierro Ferretería · Sitio web

Sitio web de **Más Hierro Ferretería**, construido alrededor de tres valores: fiabilidad, calidad y confianza. Publicado en Netlify.

## Qué incluye

**Portada:** preparador de pintura 3D, sección de herramientas, ofertas de la semana, marcas, zona de contratistas, preguntas frecuentes y horario con indicador "Abierto ahora".

**Herramientas**
| Página | Qué hace |
| --- | --- |
| `catalogo.html` | Catálogo 3D de productos: inodoros, lavamanos, grifería, tubería y conexiones PVC, cables THHN y NM-B, rollo de 100 m y comparador de calibres. Gira, acerca, medidas reales, opciones de color, acabado, diámetro o calibre, y agregar a cotización. |
| `calculadora.html` | Calculadora de materiales con pestañas: pintura, impermeabilizante, concreto, losa, varillas, bloques, cerámica, techo de zinc, cemento PVC, calibre de cable e inversor. Enlaces directos: `calculadora.html#pintura`, `#cable`… |
| `color.html` | Estudio de color: pinta tu foto y guía de pintura por superficie. |
| `proyectos.html` | Listas de compras por proyecto. |
| `contratistas.html` | Registro de contratistas e historial de cotizaciones. |

**Ventas:** carrito "Mi cotización" en todas las páginas, que se envía por WhatsApp o por formulario (Netlify Forms).

## Editar datos del negocio

| Qué | Dónde |
| --- | --- |
| Teléfono, WhatsApp, dirección, horario, marcas | `js/config.js` |
| Ofertas de la semana | `data/ofertas.json` |
| Textos de herramientas y menú | `scripts/paginas.py` y luego `python3 scripts/paginas.py` |
| Fórmulas de las calculadoras | `js/calcs.js` |

## Estructura

```
index.html, catalogo.html, calculadora.html, color.html, proyectos.html, contratistas.html
_redirects              Enlaces antiguos /herramientas/* → páginas nuevas
css/styles.css          Estilos base y componentes comunes (cabecera, menú, carrito, pie)
css/home.css            Secciones de la portada
css/tools.css           Páginas de herramientas, catálogo 3D y calculadora
js/config.js            Datos del negocio
js/common.js            Cabecera, submenú, pie, carrito, avisos y horario en vivo
js/catalogo3d.js        Visor y modelos 3D del catálogo (three.js r128)
js/calcs.js             Motor de calculadoras
js/mixer3d.js           Preparador de pintura 3D de la portada
scripts/paginas.py      Genera las páginas de herramientas y js/tools-data.js
assets/catalogo/        Imagen del catálogo para la portada
data/ofertas.json       Ofertas
```

**Agregar productos al catálogo 3D:** los modelos se definen en `js/catalogo3d.js` (lista `CATS`). Para mostrar el modelo exacto de una marca, la mejor opción es pedir al fabricante el archivo 3D (GLB) y cargarlo en el visor.

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
