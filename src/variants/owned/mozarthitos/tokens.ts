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
export const MOZARTHITOS_PRIVATE = {
  yellow: "#f3c94e",
  pink: "#ff455d",
  blue: "#37a4ff",
  headerRed: "#c41e3a",
  /** 22% of #9b1428 mixed into #fff8f2. The hairline fails 3:1 on white. */
  line: "#e9c6c6",
} as const;

export const MOZARTHITOS_FONT_IDS = { heading: "baloo-2", body: "dm-sans" } as const;

const MOZARTHITOS_COLOR: Partial<Record<(typeof COLOR_TOKEN_KEYS)[number], string>> = {
  background: "#ffffff",
  foreground: "#2a2a2a",
  surface: "#fff8f2",
  primary: "#9b1428",
  "primary.foreground": "#ffffff",
  muted: "#fff8f2",
  "muted.foreground": "#545454",
  border: "#545454",
};

export function mozarthitosDesignTokens(): DesignTokensV1 {
  const color = Object.fromEntries(
    COLOR_TOKEN_KEYS.map((key) => [key, MOZARTHITOS_COLOR[key] ?? SYSTEM_PROPERTIES_DEFAULTS[`color.${key}`] ?? "#000000"]),
  ) as DesignTokensV1["color"];
  return {
    version: 1,
    color,
    font: { heading: MOZARTHITOS_FONT_IDS.heading, body: MOZARTHITOS_FONT_IDS.body },
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
