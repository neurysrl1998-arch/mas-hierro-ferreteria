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

## Pendiente antes de publicar

- Sustituir la dirección, el teléfono y el horario de ejemplo en `index.html`.
- Conectar el formulario de cotización a un correo, a WhatsApp o a un servicio de formularios. Ahora solo muestra un mensaje de demostración.
- Ajustar los rendimientos de las calculadoras a los productos que vende la tienda.
