/**
 * Defaults canónicos del sistema (única fuente de verdad para los valores base).
 *
 * Se mantienen los mismos valores Golden para no romper tenants existentes que
 * heredan defaults "por omisión". Cada tenant sobreescribe lo que necesita en
 * la BD:
 *
 *   - identidad / marca / contacto / social / tokens visuales → `public.site_themes.properties`
 *     (merge runtime vía `loadEffectiveProperties()`).
 *   - parámetros operativos (edad legal, billing terms, académicos, analytics,
 *     etc.) → `public.site_settings` con loaders dedicados en `src/lib/<contexto>/`.
 *
 * Cualquier nueva clave que se quiera "globalizar" debe entrar aquí (con su
 * valor por defecto) y, si afecta runtime UI o copy visible, también en el
 * wizard / editor CMS / loader correspondiente.
 */

/* ---------- Identidad de marca (nombre legal, eslogan, activos) ---------- */
/* Uso: textos y assets de marca en layouts, landing, dashboard, SEO; no duplicar
 * nombres legales ni rutas de logo en código ni en diccionarios. */
const IDENTITY = {
  "app.name": "Golden English",
  "app.legal.name": "Instituto de Lenguas Golden English",
  "app.tagline": "Más de 20 años enseñando inglés, creando oportunidades",
  "app.tagline.en": "Over 20 years teaching English, creating opportunities",
  "app.legal.registry":
    "Resolución 1297/05 - Ministerio de Educación, Formosa",
  "app.logo.path": "/images/logo.png",
  "app.logo.alt": "Logo GE Golden English",
  "app.favicon.path": "/favicon_io/favicon.ico",
} as const;

/* ---------- Paleta primaria ---------- */
const COLOR_PRIMARY = {
  "color.primary": "#103A5C",
  "color.primary.light": "#2A5B84",
  "color.primary.dark": "#0A253D",
  "color.primary.foreground": "#FFFFFF",
} as const;

/* ---------- Paleta secundaria (acento rojo del logo) ---------- */
const COLOR_SECONDARY = {
  "color.secondary": "#A31A22",
  "color.secondary.light": "#D43D46",
  "color.secondary.dark": "#730F15",
  "color.secondary.foreground": "#FFFFFF",
} as const;

/* ---------- Acento (dorado / banners) ---------- */
const COLOR_ACCENT = {
  "color.accent": "#F0B932",
  "color.accent.foreground": "#0F1F33",
} as const;

/* ---------- Neutros (fondo, texto, bordes) ---------- */
const COLOR_NEUTRAL = {
  "color.background": "#FAF9F6",
  "color.surface": "#FFFFFF",
  "color.foreground": "#103A5C",
  "color.muted": "#F0EFEA",
  "color.muted.foreground": "#4B5563",
  "color.border": "#8A8275",
} as const;

/* ---------- Estado (success / warning / error / info) ---------- */
const COLOR_STATE = {
  "color.success": "#16A34A",
  "color.warning": "#EAB308",
  "color.error": "#DC2626",
  "color.info": "#2563EB",
} as const;

/* ---------- Sombras ---------- */
const SHADOWS = {
  "shadow.soft": "0 4px 24px -4px rgb(16 58 92 / 12%)",
  "shadow.card": "0 12px 40px -12px rgb(16 58 92 / 18%)",
} as const;

/* ---------- Calendario portal — tipos de evento especiales ---------- */
const COLOR_CALENDAR_SPECIAL = {
  "color.calendarSpecial.holiday": "#374151",
  "color.calendarSpecial.institutionalExam": "#991B1B",
  "color.calendarSpecial.parentMeeting": "#6D28D9",
  "color.calendarSpecial.social": "#166534",
  "color.calendarSpecial.trimesterAdmin": "#1E40AF",
} as const;

/* ---------- Tipografía ---------- */
const FONTS = {
  "font.primary": "DM Sans",
  "font.secondary": "Fraunces",
  "font.mono": "JetBrains Mono",
} as const;

/* ---------- Layout ---------- */
const LAYOUT = {
  "layout.max.width": "1280px",
  "layout.border.radius": "0.75rem",
} as const;

/* ---------- Contacto público ---------- */
const CONTACT = {
  "contact.email": "crisins@hotmail.com",
  "contact.phone": "+54 9 3718 528-383 ",
  "contact.address": "Riacho He Hé, Provincia de Formosa, Argentina",
} as const;

/* ---------- Redes y WhatsApp ---------- */
const SOCIAL = {
  "social.facebook": "https://www.facebook.com/Lateachergolden",
  "social.instagram": "https://www.instagram.com/goldenenglishok/",
  "social.whatsapp": "https://wa.me/5493718528383",
} as const;

/* ---------- Operativos (legal / facturación / académicos / analytics) ---------- */
/* Defaults de fallback si la BD no tiene aún la clave en `site_settings`. */
const OPERATIONAL = {
  "legal.age.majority": "18",
  "student.enrollment.renewal.warn.days": "300",
  "billing.term.enrollment": "Matrícula",
  "billing.term.enrollment.en": "Enrollment fee",
  "billing.term.monthly": "Mensualidad",
  "billing.term.monthly.en": "Monthly fee",
  "billing.term.promotion": "Promoción",
  "billing.term.promotion.en": "Promotion",
  "academics.section.max_students": "60",
  "academics.parent.attendance.minPercent": "75",
  "academics.teacherPortal.allowedProfileRoles": "teacher,assistant",
  "academics.attendance.matrix.teacher.scanLookbackBufferDays": "7",
  "academics.attendance.matrix.teacher.operationalCivilLookbackDays": "14",
  "academics.attendance.matrix.teacher.operationalMaxClassDays": "28",
  "academics.attendance.matrix.teacher.fullCourseMaxClassDays": "156",
  "academics.attendance.matrix.admin.fallbackLookbackDays": "400",
  "academics.attendance.matrix.admin.maxClassDays": "520",
  "academics.attendance.matrix.pickAdjacentCivilDays": "14",
  "academics.attendance.matrix.hasEligibleWindowMaxScans": "400",
  "analytics.event.namespace": "goldenenglish",
  "analytics.event.version": "1",
  "analytics.timezone": "America/Argentina/Cordoba",
} as const;

export const SYSTEM_PROPERTIES_DEFAULTS: Readonly<Record<string, string>> = {
  ...IDENTITY,
  ...COLOR_PRIMARY,
  ...COLOR_SECONDARY,
  ...COLOR_ACCENT,
  ...COLOR_NEUTRAL,
  ...COLOR_STATE,
  ...SHADOWS,
  ...COLOR_CALENDAR_SPECIAL,
  ...FONTS,
  ...LAYOUT,
  ...CONTACT,
  ...SOCIAL,
  ...OPERATIONAL,
};

/** Brand-related keys that the precommit guardrail flags when hardcoded outside
 *  the brand layer (mirrors the historical BRAND_KEYS list in
 *  `scripts/precommit-verify.mjs`). */
export const BRAND_LITERAL_KEYS = [
  "app.name",
  "app.legal.name",
  "app.tagline",
  "app.logo.alt",
  "app.legal.registry",
  "contact.email",
  "contact.phone",
  "contact.address",
  "social.facebook",
  "social.instagram",
  "social.whatsapp",
] as const;
