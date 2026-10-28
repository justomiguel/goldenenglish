import {
  CENTROLISTO_FAVICON_PATH,
  CENTROLISTO_LOGO_PATH,
} from "@/lib/pulsar/centrolistoFavicon";
import { loadProperties, type ThemeProperties } from "@/lib/theme/themeParser";

/**
 * Warm, human-centered brand tokens for CentroListo.cl ("El Hilo que se Desenreda").
 * Warm Alabaster Paper (#FAF8F5) + Serene Forest Sage (#2D5A47) + Warm Terracotta (#C87D55) + Deep Forest Ink (#1C2420).
 * Every foreground/background pair is WCAG AA/AAA verified.
 */
export const CENTROLISTO_THEME_COLOR = "#2D5A47";

const CENTROLISTO_BRAND_OVERRIDES: Readonly<Record<string, string>> = {
  "app.name": "CentroListo",
  "app.legal.name": "CentroListo — Un lugar en calma para escuelas, centros e institutos",
  "app.tagline": "Para quienes abrieron una escuela por amor a enseñar, no por amor a las planillas",
  "app.tagline.en": "For those who opened a school for the love of teaching, not spreadsheets",
  "color.primary": CENTROLISTO_THEME_COLOR,
  "color.primary.light": "#3E755E",
  "color.primary.dark": "#1F4233",
  "color.primary.foreground": "#FFFFFF",
  "color.secondary": "#1C2420",
  "color.secondary.light": "#2C3832",
  "color.secondary.dark": "#111714",
  "color.secondary.foreground": "#FAF8F5",
  "color.accent": "#C87D55",
  "color.accent.foreground": "#1C2420",
  "color.background": "#FAF8F5",
  "color.surface": "#FFFFFF",
  "color.foreground": "#1C2420",
  "color.muted": "#F2EFE9",
  "color.muted.foreground": "#525E57",
  "color.border": "#E4E0D8",
  "app.favicon.path": CENTROLISTO_FAVICON_PATH,
  "app.logo.path": CENTROLISTO_LOGO_PATH,
};

export function loadPulsarPlatformProperties(): ThemeProperties {
  return {
    ...loadProperties(),
    ...CENTROLISTO_BRAND_OVERRIDES,
  };
}
