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
export const ESPACIOZENIT_PRIVATE = {
  cyan: "#00aeef",
  ballet: "#dcb8bc",
  /** 35% cyan on black. The hairline fails 3:1. */
  line: "#005c80",
  displayFaces: ["espaciozenit-fast-blaze", "espaciozenit-rusted-vibe", "espaciozenit-ballet"] as const,
} as const;

export const ESPACIOZENIT_FONT_IDS = { heading: "bebas-neue", body: "plus-jakarta-sans" } as const;

const ESPACIOZENIT_COLOR: Partial<Record<(typeof COLOR_TOKEN_KEYS)[number], string>> = {
  background: "#000000",
  foreground: "#ffffff",
  surface: "#070b12",
  primary: "#4dd8ff",
  "primary.foreground": "#041018",
  muted: "#0b1220",
  "muted.foreground": "#c9cbce",
  border: "#00aeef",
};

export function espaciozenitDesignTokens(): DesignTokensV1 {
  const color = Object.fromEntries(
    COLOR_TOKEN_KEYS.map((key) => [key, ESPACIOZENIT_COLOR[key] ?? SYSTEM_PROPERTIES_DEFAULTS[`color.${key}`] ?? "#000000"]),
  ) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: ESPACIOZENIT_FONT_IDS.heading, body: ESPACIOZENIT_FONT_IDS.body },
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
