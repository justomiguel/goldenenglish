import { isFontAllowedForTenant } from "@/lib/design-tokens/fontCatalog";
import {
  COLOR_TOKEN_KEYS,
  HEADING_WEIGHTS,
  INSTALL_STATUS_BARS,
  MOTION_LEVELS,
  SPACE_DENSITIES,
  TYPE_SCALES,
} from "@/lib/design-tokens/designTokensV1";
import { contrastRatio } from "@/lib/theme/contrastRatio";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import type { ThemeProperties } from "@/lib/theme/themeParser";

export type DesignTokenIssueCode =
  | "contrast_below_aa"
  | "token_invalid_color"
  | "token_invalid_value"
  | "font_not_in_catalog"
  | "install_theme_unreadable";

export interface DesignTokenIssue {
  code: DesignTokenIssueCode;
  token: string;
  pair?: string;
  ratio?: number;
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const INSTALL_TEXT_MIN = 4.5;

export const COLOR_CONTRAST_PAIRS: ReadonlyArray<{ token: string; pair: string; min: number }> = [
  { token: "color.background", pair: "color.foreground", min: 4.5 },
  { token: "color.surface", pair: "color.foreground", min: 4.5 },
  { token: "color.primary", pair: "color.primary.foreground", min: 4.5 },
  { token: "color.secondary", pair: "color.secondary.foreground", min: 4.5 },
  { token: "color.accent", pair: "color.accent.foreground", min: 4.5 },
  { token: "color.muted", pair: "color.muted.foreground", min: 4.5 },
  { token: "color.border", pair: "color.background", min: 3 },
];

function readValue(properties: ThemeProperties, key: string): string {
  const raw = properties[key]?.trim() ?? "";
  if (raw) return raw;
  return SYSTEM_PROPERTIES_DEFAULTS[key]?.trim() ?? "";
}

function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100;
}

function checkEnum(
  properties: ThemeProperties,
  key: string,
  allowed: readonly string[],
  issues: DesignTokenIssue[],
): void {
  if (!(key in properties)) return;
  const raw = properties[key]?.trim() ?? "";
  if (!raw || allowed.includes(raw)) return;
  issues.push({ code: "token_invalid_value", token: key });
}

function checkFont(
  properties: ThemeProperties,
  key: string,
  tenantSlug: string | null,
  issues: DesignTokenIssue[],
): void {
  if (!(key in properties)) return;
  const raw = properties[key]?.trim() ?? "";
  if (!raw || isFontAllowedForTenant(raw, tenantSlug)) return;
  issues.push({ code: "font_not_in_catalog", token: key });
}

function checkInstallTheme(properties: ThemeProperties, issues: DesignTokenIssue[]): void {
  const explicit = properties["install.theme"]?.trim() ?? "";
  if (explicit && !HEX_COLOR.test(explicit)) {
    issues.push({ code: "token_invalid_color", token: "install.theme" });
    return;
  }
  const background = properties["install.background"]?.trim() ?? "";
  if (background && !HEX_COLOR.test(background)) {
    issues.push({ code: "token_invalid_color", token: "install.background" });
  }
  const theme = explicit || readValue(properties, "color.primary");
  if (!HEX_COLOR.test(theme)) return;
  const onWhite = roundRatio(contrastRatio(theme, WHITE));
  const onBlack = roundRatio(contrastRatio(theme, BLACK));
  if (onWhite >= INSTALL_TEXT_MIN || onBlack >= INSTALL_TEXT_MIN) return;
  issues.push({ code: "install_theme_unreadable", token: "install.theme" });
}

export function validateDesignTokens(
  properties: ThemeProperties,
  options: { tenantSlug: string | null },
): { ok: true } | { ok: false; issues: DesignTokenIssue[] } {
  const issues: DesignTokenIssue[] = [];
  const invalidColors = new Set<string>();

  for (const key of COLOR_TOKEN_KEYS) {
    const token = `color.${key}`;
    const raw = readValue(properties, token);
    if (!raw || HEX_COLOR.test(raw)) continue;
    invalidColors.add(token);
    issues.push({ code: "token_invalid_color", token });
  }

  checkEnum(properties, "type.scale", TYPE_SCALES, issues);
  checkEnum(properties, "space.density", SPACE_DENSITIES, issues);
  checkEnum(properties, "motion.level", MOTION_LEVELS, issues);
  checkEnum(
    properties,
    "type.heading.weight",
    HEADING_WEIGHTS.map(String),
    issues,
  );
  checkFont(properties, "font.heading", options.tenantSlug, issues);
  checkFont(properties, "font.body", options.tenantSlug, issues);
  checkEnum(properties, "install.statusBar", INSTALL_STATUS_BARS, issues);
  checkInstallTheme(properties, issues);

  for (const pair of COLOR_CONTRAST_PAIRS) {
    if (invalidColors.has(pair.token) || invalidColors.has(pair.pair)) continue;
    const fill = readValue(properties, pair.token);
    const text = readValue(properties, pair.pair);
    if (!HEX_COLOR.test(fill) || !HEX_COLOR.test(text)) continue;
    const ratio = roundRatio(contrastRatio(fill, text));
    if (ratio >= pair.min) continue;
    issues.push({
      code: "contrast_below_aa",
      token: pair.token,
      pair: pair.pair,
      ratio,
    });
  }

  if (issues.length === 0) return { ok: true };
  return { ok: false, issues };
}
