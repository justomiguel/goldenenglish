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
export const MIMUNDO_PRIVATE = {
  yellow: "#ffd426",
  pink: "#ec2e88",
  blue: "#2f7dbe",
  accent: "caveat",
  /** 28% of #3e5c33 mixed into #fff8ec. The hairline fails 3:1 on cream. */
  line: "#c9ccb8",
} as const;

export const MIMUNDO_FONT_IDS = { heading: "fraunces", body: "nunito" } as const;

const MIMUNDO_COLOR: Partial<Record<(typeof COLOR_TOKEN_KEYS)[number], string>> = {
  background: "#fff8ec",
  foreground: "#3b2f2a",
  surface: "#faf6ea",
  primary: "#3e5c33",
  "primary.foreground": "#fff8ec",
  muted: "#faf6ea",
  "muted.foreground": "#6d4c41",
  border: "#3e5c33",
};

export function mimundoDesignTokens(): DesignTokensV1 {
  const color = Object.fromEntries(
    COLOR_TOKEN_KEYS.map((key) => [key, MIMUNDO_COLOR[key] ?? SYSTEM_PROPERTIES_DEFAULTS[`color.${key}`] ?? "#000000"]),
  ) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: MIMUNDO_FONT_IDS.heading, body: MIMUNDO_FONT_IDS.body },
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
