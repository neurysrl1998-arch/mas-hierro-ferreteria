/* Barra del desarrollador · datos de esta web (los usa js/dev-dock.js) */
window.NR_DOCK = {
  site: 'Más Hierro Ferretería',
  email: 'ing_neurysr@outlook.com',
  whatsapp: '18299685199',
  whatsappLabel: '829-968-5199',
  phrase: '¡Weo aquí!',                  // lo que dice el programador al saludar en cada sección
  root: '../',                           // raíz del sitio, relativa a este archivo
  avoidRight: 90, avoidRightMobile: 84,  // espacio para el botón del carrito
  liftWhen: '#mhToast:not([hidden])',    // sube cuando aparece el aviso "Agregado a tu cotización"
  sections: 'main section, #mh-footer',
  titleFont: "'Barlow Condensed','Arial Narrow',sans-serif",
  colors: { accent: '#D7261E', accent2: '#E3342B', gold: '#F2B33D', shirt: '#D7261E' },
  intro: 'Las webs genéricas de tiendas cuestan caro y solo muestran productos. Esta se diseñó y programó desde cero, con herramientas que ayudan al cliente a comprar bien.',
  features: [
    { t: 'Catálogo 3D', d: 'Inodoros, lavamanos, grifería, tubería y cables en 3D, con medidas reales y opciones.', href: 'catalogo.html' },
    { t: 'Calculadora de materiales', d: 'Pintura, concreto, bloques, varillas, cerámica, zinc, PVC, cable e inversor en una sola página.', href: 'calculadora.html' },
    { t: 'Estudio de color', d: 'El cliente prueba colores sobre la foto de su casa antes de comprar la pintura.', href: 'color.html' },
    { t: 'Preparador de pintura 3D', d: 'Una mezcladora 3D que prepara el color en la portada.', href: 'index.html' },
    { t: 'Listas por proyecto', d: 'La lista de compras completa para pintar, hacer un baño, levantar una verja y más.', href: 'proyectos.html' },
    { t: 'Mi cotización', d: 'Un carrito en todas las páginas que se envía por WhatsApp o por formulario.', href: 'catalogo.html' },
    { t: 'Zona de contratistas', d: 'Registro, precios por volumen e historial de cotizaciones.', href: 'contratistas.html' },
    { t: 'Abierto ahora', d: 'Horario con indicador en vivo de si la ferretería está abierta.', href: 'index.html' }
  ],
  compare: [
    ['Diseño', 'Plantilla repetida en miles de webs', 'Único, con la marca de Más Hierro'],
    ['Herramientas', 'Solo una lista de productos', 'Calculadoras, catálogo 3D y estudio de color'],
    ['Ventas', 'Carrito genérico con comisión', 'Cotización directa por WhatsApp'],
    ['Velocidad', 'Constructor pesado con plugins', 'Código limpio y ligero'],
    ['Licencias', 'Pago mensual de la plataforma', 'Sin licencia de plataforma'],
    ['Celular', 'Ajuste automático', 'Probada en celular, tablet y PC']
  ]
};
