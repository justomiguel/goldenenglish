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

/** Row shape of `public.site_themes`. */
export interface SiteThemeRow {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  properties: ThemePropertyOverrides;
  content: SiteThemeContent;
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
