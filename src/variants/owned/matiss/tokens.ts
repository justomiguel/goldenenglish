import {
  COLOR_TOKEN_KEYS,
  DEFAULT_HEADING_WEIGHT,
  DEFAULT_RADIUS,
  DEFAULT_SPACE_DENSITY,
  DEFAULT_TYPE_SCALE,
  type DesignTokensV1,
} from "@/lib/design-tokens/designTokensV1";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

/** Colors the token contract does not have. The landing CSS keeps these names. */
export const MATISS_PRIVATE = {
  pink: "#f0bee6",
  violet: "#9a78c6",
  violetHover: "#5a3e88",
  roseDeep: "#a6458e",
  footer: "#2c2040",
  line: "#d8c0e4",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const MATISS_FONT_IDS = { heading: "fraunces", body: "nunito" } as const;

const MATISS_COLOR: Partial<Record<(typeof COLOR_TOKEN_KEYS)[number], string>> = {
  background: "#fcf4f7",
  foreground: "#3a2a52",
  surface: "#ffffff",
  primary: "#6b4c9e",
  "primary.foreground": "#ffffff",
  muted: "#f0e4f0",
  "muted.foreground": "#665a78",
  border: "#a080b0",
};

export function matissDesignTokens(): DesignTokensV1 {
  const color = Object.fromEntries(
    COLOR_TOKEN_KEYS.map((key) => [key, MATISS_COLOR[key] ?? SYSTEM_PROPERTIES_DEFAULTS[`color.${key}`] ?? "#000000"]),
  ) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: MATISS_FONT_IDS.heading, body: MATISS_FONT_IDS.body },
    type: { scale: DEFAULT_TYPE_SCALE, headingWeight: DEFAULT_HEADING_WEIGHT },
    radius: { control: DEFAULT_RADIUS, card: DEFAULT_RADIUS },
    space: { density: DEFAULT_SPACE_DENSITY },
    shadow: {
      soft: SYSTEM_PROPERTIES_DEFAULTS["shadow.soft"] ?? "none",
      card: SYSTEM_PROPERTIES_DEFAULTS["shadow.card"] ?? "none",
    },
    motion: { level: "expressive" },
  };
}
