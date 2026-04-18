import type { ThemeProperties } from "@/lib/theme/themeParser";
import type { ThemePropertyOverrides } from "@/types/theming";

/** Subset of design tokens that are visually meaningful in the small theme
 *  preview card shown in the admin templates grid. Each value is a CSS color
 *  string already merged from `system.properties` defaults + the theme's
 *  `properties` overrides — the consumer just spreads them into `style`. */
export interface ThemePreviewTokens {
  colorPrimary: string;
  colorPrimaryForeground: string;
  colorSecondary: string;
  colorSecondaryForeground: string;
  colorAccent: string;
  colorBackground: string;
  colorSurface: string;
  colorForeground: string;
  colorMuted: string;
  colorMutedForeground: string;
  colorBorder: string;
  layoutBorderRadius: string;
}

const FALLBACK: ThemePreviewTokens = {
  colorPrimary: "#103A5C",
  colorPrimaryForeground: "#FFFFFF",
  colorSecondary: "#A31A22",
  colorSecondaryForeground: "#FFFFFF",
  colorAccent: "#F0B932",
  colorBackground: "#FAF9F6",
  colorSurface: "#FFFFFF",
  colorForeground: "#103A5C",
  colorMuted: "#F0EFEA",
  colorMutedForeground: "#5C6B7A",
  colorBorder: "#E2E0D8",
  layoutBorderRadius: "0.75rem",
};

/** Conservative inline-style sanitizer mirroring `sanitizeCssValue` in
 *  `themeOverrides.ts` so an admin-supplied value can never inject `;` or
 *  break out of the inline style object. Returns null when unsafe. */
function safeValue(raw: string | undefined): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (/[<>{};]/.test(value)) return null;
  if (/[\n\r]/.test(value)) return null;
  return value;
}

function pick(
  defaults: ThemeProperties,
  overrides: ThemePropertyOverrides | null | undefined,
  key: string,
  fallback: string,
): string {
  const fromOverride = safeValue(overrides?.[key]);
  if (fromOverride) return fromOverride;
  const fromDefault = safeValue(defaults[key]);
  if (fromDefault) return fromDefault;
  return fallback;
}

/** Pure: build the preview tokens for one theme. `defaults` should be the
 *  loaded `system.properties` map (so we don't I/O per theme), `overrides`
 *  the row's `properties` JSON. Unsafe values silently fall back. */
export function extractThemePreviewTokens(
  defaults: ThemeProperties,
  overrides: ThemePropertyOverrides | null | undefined,
): ThemePreviewTokens {
  return {
    colorPrimary: pick(defaults, overrides, "color.primary", FALLBACK.colorPrimary),
    colorPrimaryForeground: pick(
      defaults,
      overrides,
      "color.primary.foreground",
      FALLBACK.colorPrimaryForeground,
    ),
    colorSecondary: pick(
      defaults,
      overrides,
      "color.secondary",
      FALLBACK.colorSecondary,
    ),
    colorSecondaryForeground: pick(
      defaults,
      overrides,
      "color.secondary.foreground",
      FALLBACK.colorSecondaryForeground,
    ),
    colorAccent: pick(defaults, overrides, "color.accent", FALLBACK.colorAccent),
    colorBackground: pick(
      defaults,
      overrides,
      "color.background",
      FALLBACK.colorBackground,
    ),
    colorSurface: pick(defaults, overrides, "color.surface", FALLBACK.colorSurface),
    colorForeground: pick(
      defaults,
      overrides,
      "color.foreground",
      FALLBACK.colorForeground,
    ),
    colorMuted: pick(defaults, overrides, "color.muted", FALLBACK.colorMuted),
    colorMutedForeground: pick(
      defaults,
      overrides,
      "color.muted.foreground",
      FALLBACK.colorMutedForeground,
    ),
    colorBorder: pick(defaults, overrides, "color.border", FALLBACK.colorBorder),
    layoutBorderRadius: pick(
      defaults,
      overrides,
      "layout.border.radius",
      FALLBACK.layoutBorderRadius,
    ),
  };
}

/** Pure: returns a `style` object ready to spread on the preview surface. */
export function themePreviewCssVars(
  tokens: ThemePreviewTokens,
): Record<string, string> {
  return {
    "--preview-color-primary": tokens.colorPrimary,
    "--preview-color-primary-foreground": tokens.colorPrimaryForeground,
    "--preview-color-secondary": tokens.colorSecondary,
    "--preview-color-secondary-foreground": tokens.colorSecondaryForeground,
    "--preview-color-accent": tokens.colorAccent,
    "--preview-color-background": tokens.colorBackground,
    "--preview-color-surface": tokens.colorSurface,
    "--preview-color-foreground": tokens.colorForeground,
    "--preview-color-muted": tokens.colorMuted,
    "--preview-color-muted-foreground": tokens.colorMutedForeground,
    "--preview-color-border": tokens.colorBorder,
    "--preview-layout-border-radius": tokens.layoutBorderRadius,
  };
}
