export const TYPE_SCALES = ["compact", "standard", "generous"] as const;
export const SPACE_DENSITIES = ["compact", "standard", "airy"] as const;
export const MOTION_LEVELS = ["none", "subtle", "expressive"] as const;
export const INSTALL_STATUS_BARS = ["default", "black", "black-translucent"] as const;
export const HEADING_WEIGHTS = [400, 500, 600, 700, 800] as const;

export const COLOR_TOKEN_KEYS = [
  "background",
  "foreground",
  "surface",
  "primary",
  "primary.foreground",
  "secondary",
  "secondary.foreground",
  "accent",
  "accent.foreground",
  "muted",
  "muted.foreground",
  "border",
  "success",
  "warning",
  "error",
  "info",
] as const;

export type TypeScale = (typeof TYPE_SCALES)[number];
export type SpaceDensity = (typeof SPACE_DENSITIES)[number];
export type MotionLevel = (typeof MOTION_LEVELS)[number];
export type InstallStatusBar = (typeof INSTALL_STATUS_BARS)[number];
export type HeadingWeight = (typeof HEADING_WEIGHTS)[number];
export type ColorTokenKey = (typeof COLOR_TOKEN_KEYS)[number];

export const DEFAULT_HEADING_FONT_ID = "fraunces";
export const DEFAULT_BODY_FONT_ID = "dm-sans";
export const DEFAULT_TYPE_SCALE: TypeScale = "standard";
export const DEFAULT_HEADING_WEIGHT: HeadingWeight = 600;
export const DEFAULT_RADIUS = "0.75rem";
export const DEFAULT_SPACE_DENSITY: SpaceDensity = "standard";
export const DEFAULT_MOTION_LEVEL: MotionLevel = "subtle";
export const DEFAULT_INSTALL_STATUS_BAR: InstallStatusBar = "default";

export interface DesignInstallTokens {
  theme: string;
  background: string;
  statusBar: InstallStatusBar;
}

export interface DesignTokensV1 {
  version: 1;
  color: Record<ColorTokenKey, string>;
  font: { heading: string; body: string };
  type: { scale: TypeScale; headingWeight: HeadingWeight };
  radius: { control: string; card: string };
  space: { density: SpaceDensity };
  shadow: { soft: string; card: string };
  motion: { level: MotionLevel };
  install?: DesignInstallTokens;
}
