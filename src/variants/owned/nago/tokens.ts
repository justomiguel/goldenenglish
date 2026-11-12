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
export const NAGO_PRIVATE = {
  goldSoft: "#e0c56a",
  green: "#1f6b3a",
  chileBlue: "#1d4e89",
  chileRed: "#9b1d2e",
  /** 32% of #c9a227 mixed into #070707. The hairline fails 3:1. */
  line: "#453911",
} as const;

export const NAGO_FONT_IDS = { heading: "oswald", body: "outfit" } as const;

const NAGO_COLOR: Partial<Record<(typeof COLOR_TOKEN_KEYS)[number], string>> = {
  background: "#070707",
  foreground: "#f3eee4",
  surface: "#141414",
  primary: "#c9a227",
  "primary.foreground": "#111111",
  muted: "#1c1c1c",
  "muted.foreground": "#c9c2b6",
  border: "#c9a227",
};

export function nagoDesignTokens(): DesignTokensV1 {
  const color = Object.fromEntries(
    COLOR_TOKEN_KEYS.map((key) => [key, NAGO_COLOR[key] ?? SYSTEM_PROPERTIES_DEFAULTS[`color.${key}`] ?? "#000000"]),
  ) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: NAGO_FONT_IDS.heading, body: NAGO_FONT_IDS.body },
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
