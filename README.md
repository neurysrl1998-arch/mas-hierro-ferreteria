# Más Hierro Ferretería · Sitio web

Sitio web de **Más Hierro Ferretería**, construido alrededor de tres valores: fiabilidad, calidad y confianza.

## Qué incluye

- **Preparador de pintura 3D** (three.js): una máquina tintométrica hexagonal dosifica los colorantes, agita la cubeta y un rodillo prueba el color en la pared.
- **Carta de colores**: 56 tonos en 7 familias, igualador de color libre, índice de reflexión de luz (IRL), combinaciones sugeridas y una fórmula de tinte ilustrativa (oz e Y por galón o cubeta).
- **Calculadoras**: pintura, concreto, bloques y cerámica. Cada resultado se puede pasar al formulario de cotización.
- Pilares de la marca, catálogo por categorías, marca destacada (cementos PVC Lanco), servicios, proceso de cotización, contacto y horario.
- Diseño adaptable a móvil, modo claro y oscuro, y respeto a `prefers-reduced-motion`.

## Estructura

```
index.html        Página principal
css/styles.css    Estilos
js/main.js        Carta de colores, fórmula de tinte, calculadoras, formulario y menú
js/mixer3d.js     Escena 3D del preparador de pintura (three.js r128 desde cdnjs)
assets/           Logo, icono y fotos de la tienda
```

## Ver en local

Sirve la carpeta con un servidor estático, porque abrir `index.html` directamente bloquea la textura del logo en la cubeta 3D:

```bash
python3 -m http.server 8000
```

Después abre http://localhost:8000.

## Publicar en Netlify

El repositorio ya incluye `netlify.toml`, así que no hay que configurar nada:

1. Entra en https://app.netlify.com y elige **Add new site → Import an existing project**.
2. Conecta GitHub y selecciona `mas-hierro-ferreteria`.
3. Deja el comando de build vacío y la carpeta de publicación en `.`, y pulsa **Deploy**.
4. En **Site configuration → Change site name** puedes dejar la dirección como `mas-hierro-ferreteria.netlify.app`, si el nombre está libre.

Cada `git push` a `main` vuelve a publicar el sitio automáticamente.

**Formulario de cotización:** usa Netlify Forms. En el sitio publicado en `*.netlify.app`, las solicitudes llegan a **Forms → cotizacion** en el panel de Netlify, donde puedes activar avisos por correo. Fuera de Netlify, el formulario solo muestra un mensaje de demostración.

## Pendiente antes de publicar

- Sustituir la dirección, el teléfono y el horario de ejemplo en `index.html`.
- Activar en Netlify los avisos por correo del formulario `cotizacion`.
- Ajustar los rendimientos de las calculadoras a los productos que vende la tienda.
