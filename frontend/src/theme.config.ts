/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║              ARCHIVO DE PERSONALIZACIÓN DEL CLIENTE              ║
 * ║                                                                  ║
 * ║  Editá SOLO este archivo para adaptar la app a cada negocio.     ║
 * ║  Todos los textos, datos de contacto y colores están acá.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

export const THEME = {

  // ── Información del negocio ──────────────────────────────────────────────
  store: {
    /** Nombre que aparece en el encabezado, emails y panel admin */
    name: 'SistemaApple',

    /** Subtítulo del hero de la home */
    tagline: 'Los mejores iPhones al mejor precio.',

    /** Descripción breve del negocio (usada en la home) */
    description:
      'Somos especialistas en iPhone con garantía oficial. ' +
      'Encontrá el modelo que necesitás y reservá tu turno de atención.',

    /** Teléfono de contacto (visible en la home) */
    phone: '+54 9 11 1234-5678',

    /**
     * Número de WhatsApp en formato internacional sin + ni espacios.
     * Ejemplo: '5491112345678' para +54 9 11 1234-5678
     * Se usa en el botón de WhatsApp de la home.
     */
    whatsapp: '5491112345678',

    /** Email de contacto público */
    email: 'contacto@sistemaapple.com',

    /** Dirección física del local */
    address: 'Av. Corrientes 1234, CABA',

    /** Ciudad (se muestra junto a la dirección) */
    city: 'Buenos Aires',

    /** Handle de Instagram sin @ */
    instagram: 'sistemaapple',
  },

  // ── SEO / Metadatos ──────────────────────────────────────────────────────
  meta: {
    /** Título de la pestaña del navegador */
    title: 'SistemaApple — iPhone Store',

    /** Meta description para buscadores */
    description:
      'Comprá tu iPhone con garantía y al mejor precio en Buenos Aires. ' +
      'Stock disponible de iPhone 15 y 16. Reservá tu turno online.',
  },

  // ── Moneda y locale ──────────────────────────────────────────────────────
  locale: {
    /** Código de moneda ISO 4217 */
    currency: 'ARS',

    /** Locale para formatear precios y fechas */
    locale: 'es-AR',

    /**
     * Tipo de cambio para el selector ARS/USD en el catálogo.
     * Actualizar manualmente cuando cambie la cotización.
     * Ejemplo: 1000 → USD 1 = ARS 1.000
     */
    usdRate: 1000,
  },

  // ── Acceso a la demo ─────────────────────────────────────────────────────
  /**
   * Contraseña para acceder al sitio.
   * Vacío ('') → acceso libre (ideal para producción con cliente real).
   * Con valor → se muestra pantalla de acceso antes de cualquier página.
   */
  gate: {
    password: '',
  },

  // ── Analítica ────────────────────────────────────────────────────────────
  /**
   * Google Analytics 4. Pegá tu ID de medición (formato 'G-XXXXXXXXXX').
   * Vacío ('') → no se carga ningún script de analítica.
   *
   * IMPORTANTE: GA solo se activa DESPUÉS de que el visitante acepta las
   * cookies en el banner. Si rechaza, no se carga nada. (Ver ConsentService.)
   */
  analytics: {
    googleAnalyticsId: 'G-T8NF7T9FJC',
  },

  // ── Datos legales (Términos, Privacidad, Cookies) ────────────────────────
  /**
   * Completá estos datos con la información real del negocio.
   * Aparecen en las páginas legales. Recomendamos que un abogado las revise.
   */
  legal: {
    /** Razón social o nombre legal del responsable. */
    companyName: 'SistemaApple',
    /** CUIT del responsable (opcional, recomendado). */
    cuit: '',
    /** Jurisdicción para resolución de conflictos. */
    jurisdiction: 'la Ciudad Autónoma de Buenos Aires',
    /** Fecha de última actualización de los textos legales. */
    lastUpdated: 'Junio de 2026',
  },

  // ── Colores del tema ─────────────────────────────────────────────────────
  /**
   * Valores RGB separados por espacio (sin comas) para CSS custom properties.
   * Se inyectan automáticamente en :root al iniciar la app.
   *
   * Ejemplos:
   *   primary: '0 0 0'        → negro
   *   primary: '29 78 216'    → azul (blue-700)
   *   primary: '220 38 38'    → rojo (red-600)
   */
  colors: {
    /** Color principal — botones CTA, links activos */
    primary: '0 0 0',

    /** Color de acento — indicadores, badges */
    accent: '0 122 255',
  },

} as const;

export type Theme = typeof THEME;
