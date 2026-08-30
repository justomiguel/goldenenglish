import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/theme/contrastRatio";

const BG = "#070707";
const SURFACE = "#141414";
const INK = "#f3eee4";
const MUTED = "#c9c2b6";
const HEADING = "#fff8e7";
const GOLD_SOFT = "#e0c56a";
const GOLD_ON_BUTTON = "#c9a227";
const INK_ON_GOLD = "#111111";

describe("nago dark-surface contrast", () => {
  it("keeps body, muted, and heading text AA on graphite", () => {
    expect(contrastRatio(INK, BG)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(MUTED, BG)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(HEADING, SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(GOLD_SOFT, BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps gold solid buttons AA for label text", () => {
    expect(contrastRatio(INK_ON_GOLD, GOLD_ON_BUTTON)).toBeGreaterThanOrEqual(4.5);
  });
});
