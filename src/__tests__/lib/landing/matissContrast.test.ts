import { describe, expect, it } from "vitest";

/** Text pairs used by the Matiss landing. Decorative logo colors are excluded. */
const PAIRS: ReadonlyArray<readonly [string, string, string]> = [
  ["button label on primary", "#FFFFFF", "#6B4C9E"],
  ["button label on secondary", "#FFFFFF", "#A6458E"],
  ["body on paper", "#3A2A52", "#FCF4F7"],
  ["muted on paper", "#665A78", "#FCF4F7"],
  ["body on white", "#3A2A52", "#FFFFFF"],
  ["muted on lavender", "#665A78", "#F0E4F0"],
  ["footer text", "#FFFFFF", "#2C2040"],
];

function channel(hex: string, index: number): number {
  const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

function ratio(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("matiss text contrast", () => {
  it.each(PAIRS)("%s reaches 4.5:1", (_name, foreground, background) => {
    expect(ratio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
