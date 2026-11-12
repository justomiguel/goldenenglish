import { findFontByFamily, FONT_CATALOG } from "@/lib/design-tokens/fontCatalog";
import {
  COLOR_TOKEN_KEYS,
  DEFAULT_BODY_FONT_ID,
  DEFAULT_HEADING_FONT_ID,
  DEFAULT_HEADING_WEIGHT,
  DEFAULT_INSTALL_STATUS_BAR,
  DEFAULT_MOTION_LEVEL,
  INSTALL_STATUS_BARS,
  DEFAULT_RADIUS,
  DEFAULT_SPACE_DENSITY,
  DEFAULT_TYPE_SCALE,
  HEADING_WEIGHTS,
  MOTION_LEVELS,
  SPACE_DENSITIES,
  TYPE_SCALES,
  type ColorTokenKey,
  type DesignTokensV1,
  type HeadingWeight,
} from "@/lib/design-tokens/designTokensV1";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import type { ThemeProperties } from "@/lib/theme/themeParser";

function readTrimmed(properties: ThemeProperties, key: string): string {
  return properties[key]?.trim() ?? "";
}

function pickEnum<T extends string>(
  raw: string,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

function pickWeight(raw: string): HeadingWeight {
  const value = Number(raw);
  return (HEADING_WEIGHTS as readonly number[]).includes(value)
    ? (value as HeadingWeight)
    : DEFAULT_HEADING_WEIGHT;
}

function resolveFontId(explicit: string, legacyName: string, fallback: string): string {
  if (explicit) {
    const byId = FONT_CATALOG.find((font) => font.id === explicit);
    if (byId) return byId.id;
    return findFontByFamily(explicit)?.id ?? fallback;
  }
  return findFontByFamily(legacyName)?.id ?? fallback;
}

function colorValue(properties: ThemeProperties, key: ColorTokenKey): string {
  const raw = readTrimmed(properties, `color.${key}`);
  if (raw) return raw;
  return SYSTEM_PROPERTIES_DEFAULTS[`color.${key}`] ?? "#000000";
}

function radiusCard(properties: ThemeProperties): string {
  const card = readTrimmed(properties, "radius.card");
  if (card) return card;
  const layout = readTrimmed(properties, "layout.border.radius");
  if (layout) return layout;
  return DEFAULT_RADIUS;
}

export function parseDesignTokens(properties: ThemeProperties): DesignTokensV1 {
  const color = {} as Record<ColorTokenKey, string>;
  for (const key of COLOR_TOKEN_KEYS) {
    color[key] = colorValue(properties, key);
  }

  return {
    version: 1,
    color,
    font: {
      heading: resolveFontId(
        readTrimmed(properties, "font.heading"),
        readTrimmed(properties, "font.secondary"),
        DEFAULT_HEADING_FONT_ID,
      ),
      body: resolveFontId(
        readTrimmed(properties, "font.body"),
        readTrimmed(properties, "font.primary"),
        DEFAULT_BODY_FONT_ID,
      ),
    },
    type: {
      scale: pickEnum(readTrimmed(properties, "type.scale"), TYPE_SCALES, DEFAULT_TYPE_SCALE),
      headingWeight: pickWeight(readTrimmed(properties, "type.heading.weight")),
    },
    radius: {
      control: readTrimmed(properties, "radius.control") || DEFAULT_RADIUS,
      card: radiusCard(properties),
    },
    space: {
      density: pickEnum(
        readTrimmed(properties, "space.density"),
        SPACE_DENSITIES,
        DEFAULT_SPACE_DENSITY,
      ),
    },
    shadow: {
      soft:
        readTrimmed(properties, "shadow.soft") ||
        SYSTEM_PROPERTIES_DEFAULTS["shadow.soft"] ||
        "none",
      card:
        readTrimmed(properties, "shadow.card") ||
        SYSTEM_PROPERTIES_DEFAULTS["shadow.card"] ||
        "none",
    },
    motion: {
      level: pickEnum(readTrimmed(properties, "motion.level"), MOTION_LEVELS, DEFAULT_MOTION_LEVEL),
    },
    install: {
      theme: readTrimmed(properties, "install.theme") || color.primary,
      background: readTrimmed(properties, "install.background") || color.background,
      statusBar: pickEnum(
        readTrimmed(properties, "install.statusBar"),
        INSTALL_STATUS_BARS,
        DEFAULT_INSTALL_STATUS_BAR,
      ),
    },
  };
}
