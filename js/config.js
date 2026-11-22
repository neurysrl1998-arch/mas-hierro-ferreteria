/* ============================================================
   Más Hierro Ferretería · Datos del negocio
   Edita este archivo para cambiar teléfono, horario y marcas
   en TODO el sitio a la vez.
   ============================================================ */
window.MH_CONFIG = {
  nombre: 'Más Hierro Ferretería',
  telefono: '809-000-0000',          // se muestra en la web
  whatsapp: '18090000000',            // solo números, con código de país (1 para RD)
  direccion: 'Av. Principal #00, Ciudad',
  zonaHoraria: 'America/Santo_Domingo',

  // Horario: 0 = domingo … 6 = sábado. null = cerrado.
  horario: {
    0: null,
    1: ['07:30', '18:00'],
    2: ['07:30', '18:00'],
    3: ['07:30', '18:00'],
    4: ['07:30', '18:00'],
    5: ['07:30', '18:00'],
    6: ['07:30', '14:00']
  },

  // Marcas que se muestran en la portada. Ajusta a las marcas reales de la tienda.
  marcas: ['Lanco', 'Truper', 'Stanley', 'DeWalt', 'Makita', 'Pretul', 'Black+Decker', 'Tigre']
};
