import { letterMarkPng } from "@/lib/brand/letterMarkPng";
import { scalePngNearest } from "@/lib/brand/scalePng";

export const INSTALL_ICON_SIZES = [180, 192, 512] as const;

export type InstallIconSize = (typeof INSTALL_ICON_SIZES)[number];

const DEFAULT_INK: [number, number, number] = [58, 42, 82];
const DEFAULT_PAPER: [number, number, number] = [252, 244, 247];

export function isInstallIconSize(value: string): value is `${InstallIconSize}` {
  return (INSTALL_ICON_SIZES as readonly number[]).includes(Number(value));
}

/** `#RRGGBB` to RGB. Any other string keeps the fallback. */
export function rgbFromCssColor(
  value: string,
  fallback: [number, number, number],
): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match?.[1]) return fallback;
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** PNG of `size`×`size`. A non-PNG source becomes a letter mark. */
export function renderInstallIconPng(input: {
  size: number;
  name: string;
  sourcePng: Uint8Array | null;
  ink?: [number, number, number];
  paper?: [number, number, number];
}): Uint8Array {
  const scaled = input.sourcePng
    ? scalePngNearest(input.sourcePng, input.size, input.size)
    : null;
  if (scaled) return scaled;
  return letterMarkPng({
    name: input.name,
    size: input.size,
    ink: input.ink ?? DEFAULT_INK,
    paper: input.paper ?? DEFAULT_PAPER,
  });
}
