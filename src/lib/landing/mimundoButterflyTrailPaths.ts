export interface MimundoButterflyTrail {
  /** Stable id used to wire the visible path with the moving butterfly. */
  id: string;
  /** SVG path drawn behind the butterfly (the dashed trail). */
  d: string;
  /** Same shape used by `offset-path` for the butterfly motion. */
  offset: string;
  /** Color token used by the wing fill (via currentColor). */
  colorVar: string;
  /** Final wing size (px). */
  size: number;
  /** Animation duration in seconds. */
  duration: number;
  /** Negative delay so different butterflies enter at different points. */
  delay: number;
  /** When true, the butterfly travels backwards along the path. */
  reverse?: boolean;
  /** Hide the dashed line trail (used for "comet" butterflies up front). */
  hideTrail?: boolean;
}

/**
 * Paths are designed on a 1200x720 viewBox spanning the full hero.
 * `preserveAspectRatio="none"` lets them stretch to the parent on any device.
 */
export const MIMUNDO_BACK_BUTTERFLY_TRAILS: readonly MimundoButterflyTrail[] = [
  {
    id: "back-main",
    d:
      "M -40 540 C 180 360, 320 640, 540 460 S 880 240, 1100 320 S 1280 540, 1240 760",
    offset:
      "path('M -40 540 C 180 360, 320 640, 540 460 S 880 240, 1100 320 S 1280 540, 1240 760')",
    colorVar: "var(--mm-pink)",
    size: 96,
    duration: 22,
    delay: -2,
  },
  {
    id: "back-loop",
    d: "M 1240 80 C 1080 220, 940 80, 820 220 S 640 420, 480 280 S 220 80, 60 220",
    offset:
      "path('M 1240 80 C 1080 220, 940 80, 820 220 S 640 420, 480 280 S 220 80, 60 220')",
    colorVar: "var(--mm-violet)",
    size: 66,
    duration: 26,
    delay: -8,
    reverse: true,
  },
  {
    id: "back-low",
    d: "M -60 700 C 240 580, 420 760, 700 640 S 980 720, 1280 600",
    offset:
      "path('M -60 700 C 240 580, 420 760, 700 640 S 980 720, 1280 600')",
    colorVar: "var(--mm-yellow)",
    size: 58,
    duration: 24,
    delay: -5,
  },
  {
    id: "back-side",
    d: "M 80 100 C 220 240, 60 360, 200 480 S 340 640, 240 760",
    offset:
      "path('M 80 100 C 220 240, 60 360, 200 480 S 340 640, 240 760')",
    colorVar: "var(--mm-blue)",
    size: 48,
    duration: 20,
    delay: -3,
    reverse: true,
  },
] as const;

export const MIMUNDO_FRONT_BUTTERFLY_TRAILS: readonly MimundoButterflyTrail[] = [
  {
    id: "front-zoom",
    d: "M 1320 -40 C 1100 120, 800 220, 540 360 S 200 580, -60 780",
    offset:
      "path('M 1320 -40 C 1100 120, 800 220, 540 360 S 200 580, -60 780')",
    colorVar: "var(--mm-yellow-deep, #f5b800)",
    size: 38,
    duration: 9,
    delay: -1,
    hideTrail: true,
  },
  {
    id: "front-zip",
    d: "M -40 160 C 160 60, 320 200, 460 100 S 720 240, 880 160",
    offset:
      "path('M -40 160 C 160 60, 320 200, 460 100 S 720 240, 880 160')",
    colorVar: "var(--mm-pink)",
    size: 30,
    duration: 8,
    delay: -3,
  },
  {
    id: "front-bounce",
    d: "M 80 600 C 280 480, 460 620, 640 520 S 920 620, 1180 520",
    offset:
      "path('M 80 600 C 280 480, 460 620, 640 520 S 920 620, 1180 520')",
    colorVar: "var(--mm-blue)",
    size: 34,
    duration: 11,
    delay: -6,
    reverse: true,
  },
] as const;
