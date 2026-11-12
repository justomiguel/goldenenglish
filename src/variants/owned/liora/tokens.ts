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
export const LIORA_PRIVATE = {
  rose: "#e48a94",
  roseTitle: "#c25a6a",
  roseText: "#9f4255",
  blush: "#f6dfe0",
  line: "#f0d9da",
  footer: "#4a3f40",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  script: "allura",
} as const;

export const LIORA_FONT_IDS = { heading: "playfair-display", body: "jost" } as const;

const LIORA_COLOR: Partial<Record<(typeof COLOR_TOKEN_KEYS)[number], string>> = {
  background: "#fcf2f1",
  foreground: "#4a3f40",
  surface: "#fff8f8",
  primary: "#b84f61",
  "primary.foreground": "#ffffff",
  muted: "#f3e4e2",
  "muted.foreground": "#6b5f58",
  border: "#6b5f58",
};

export function lioraDesignTokens(): DesignTokensV1 {
  const color = Object.fromEntries(
    COLOR_TOKEN_KEYS.map((key) => [key, LIORA_COLOR[key] ?? SYSTEM_PROPERTIES_DEFAULTS[`color.${key}`] ?? "#000000"]),
  ) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: LIORA_FONT_IDS.heading, body: LIORA_FONT_IDS.body },
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
