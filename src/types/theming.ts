import type { ThemeProperties } from "@/lib/theme/themeParser";

/** Cache tag invalidated when admin activates/edits the live theme. */
export const SITE_THEME_ACTIVE_CACHE_TAG = "site-theme-active";

/** Closed catalog of landing sections that admit media + content overrides. */
export const LANDING_SECTION_SLUGS = [
  "inicio",
  "historia",
  "oferta",
  "modalidades",
  "niveles",
  "certificaciones",
] as const;

export type LandingSectionSlug = (typeof LANDING_SECTION_SLUGS)[number];

/** Subset of `system.properties` keys that DB overrides are allowed to touch. */
export const THEME_OVERRIDE_KEY_PREFIXES = [
  "color.",
  "layout.",
  "shadow.",
  "app.",
  "contact.",
  "social.",
] as const;

export type ThemePropertyOverrides = Readonly<Record<string, string>>;

/** Locale-aware copy bag (es/en) used inside `SiteThemeContent`. */
export interface LocalizedCopy {
  es?: string;
  en?: string;
}

/** Map of arbitrary keys (per section) → localized copy. Shape stays open
 *  so admin editor can grow without a migration; readers default to dict. */
export type SiteThemeSectionContent = Readonly<Record<string, LocalizedCopy>>;

export type SiteThemeContent = Partial<
  Readonly<Record<LandingSectionSlug, SiteThemeSectionContent>>
>;

/** Personalidad visual del template:
 *  - 'classic'   = layout original (orden hero → story → modalidades …).
 *  - 'editorial' = shell full-bleed con bandas y agrupaciones densas.
 *  - 'minimal'   = shell aireado, secciones centradas y separadas por mucho whitespace. */
export const SITE_THEME_KINDS = ["classic", "editorial", "minimal"] as const;

export type SiteThemeKind = (typeof SITE_THEME_KINDS)[number];

/** Catálogo cerrado de tipos de bloque dinámico. Ampliarlo requiere agregar
 *  helper, renderer y entradas en diccionarios — ver ADR PR 6 / PR 7.
 *
 *  - `card`     genérico (border + surface).
 *  - `callout`  destacado con tinte de `--color-primary`.
 *  - `quote`    cita en cursiva con tinte de `--color-secondary`.
 *  - `feature`  card ancha con barra acento (presentar 1 característica).
 *  - `stat`     número/dato grande + descripción corta.
 *  - `cta`      tarjeta enfática para llamadas a la acción.
 *  - `divider`  separador horizontal con título centrado. */
export const LANDING_BLOCK_KINDS = [
  "card",
  "callout",
  "quote",
  "feature",
  "stat",
  "cta",
  "divider",
] as const;

export type LandingBlockKind = (typeof LANDING_BLOCK_KINDS)[number];

/** Copy de un bloque para un locale: título y/o cuerpo plain-text. */
export interface LandingBlockLocaleCopy {
  title?: string;
  body?: string;
}

/** Subsección dinámica anclada a una sección canónica. */
export interface LandingBlock {
  id: string;
  section: LandingSectionSlug;
  kind: LandingBlockKind;
  position: number;
  copy: {
    es: LandingBlockLocaleCopy;
    en: LandingBlockLocaleCopy;
  };
  mediaPath?: string;
}

/** Cap suave por template (ver `13-postgrest-pagination-bounded-queries.mdc`). */
export const LANDING_BLOCKS_PER_TEMPLATE_CAP = 24;

/** Cap suave por sección (UI lo refleja antes de llegar al server). */
export const LANDING_BLOCKS_PER_SECTION_CAP = 8;

/** Slug fijo del row "Tema por defecto" del sistema. Solo un row puede tener
 *  `isSystemDefault = true` (índice parcial UNIQUE en la migración 052) y ese
 *  row siempre existe gracias al seed idempotente. */
export const SYSTEM_DEFAULT_THEME_SLUG = "default";

/** Row shape of `public.site_themes`. */
export interface SiteThemeRow {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  /** Cuando es `true`, este row representa el "Tema por defecto" del sistema:
   *  con `properties = {}` y `content = {}` reproduce exactamente lo que vivía
   *  en `system.properties` + diccionarios. Las server actions bloquean
   *  archivarlo/borrarlo para garantizar fallback consistente. */
  isSystemDefault: boolean;
  templateKind: SiteThemeKind;
  properties: ThemePropertyOverrides;
  content: SiteThemeContent;
  blocks: ReadonlyArray<LandingBlock>;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

/** Row shape of `public.site_theme_media`. */
export interface SiteThemeMediaRow {
  id: string;
  themeId: string;
  section: LandingSectionSlug;
  position: number;
  storagePath: string;
  altEs: string | null;
  altEn: string | null;
}

/** Snapshot returned by `loadActiveTheme()` and consumed by the layout. */
export interface ActiveThemeSnapshot {
  theme: SiteThemeRow;
  media: ReadonlyArray<SiteThemeMediaRow>;
}

/** Merged result handed to the layout / brand layer. */
export interface EffectiveProperties {
  /** Defaults from `system.properties` overlaid with active theme overrides. */
  properties: ThemeProperties;
  /** Active theme metadata (for audit / preview), null if no override active. */
  activeThemeSlug: string | null;
}
