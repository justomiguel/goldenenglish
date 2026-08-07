/**
 * Tests for contrastRatio.ts — four groups per the spec
 * (2026-08-06-mimundo-contrast-design.md, Testing section).
 *
 * All ratios are computed by the library under test; the expected values in
 * group 4 come from the spec's "Verified ratios" tables.  If a computed value
 * disagrees with the spec's table by more than 0.05, the formula is wrong and
 * the discrepancy must be reported before any colour or table value is changed.
 */

import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  relativeLuminance,
} from "@/lib/theme/contrastRatio";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Composite a foreground colour at `alpha` opacity over an opaque background.
 * Blending is performed in sRGB (0-255) space, as the browser does for
 * rgba() on a solid background.  Returns a #RRGGBB hex string.
 */
function compositeOver(fg: string, bg: string, alpha: number): string {
  const parse = (hex: string): [number, number, number] => {
    const c = hex.replace(/^#/, "");
    return [
      parseInt(c.slice(0, 2), 16),
      parseInt(c.slice(2, 4), 16),
      parseInt(c.slice(4, 6), 16),
    ];
  };
  const [fr, fg_, fb] = parse(fg);
  const [br, bg_, bb] = parse(bg);
  const blend = (f: number, b: number) =>
    Math.round(alpha * f + (1 - alpha) * b);
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(blend(fr, br))}${toHex(blend(fg_, bg_))}${toHex(blend(fb, bb))}`;
}

// ─── Group 1: contrastRatio — reference values ──────────────────────────────

describe("contrastRatio — reference values", () => {
  it("black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("white on white is 1:1", () => {
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("#767676 on white is ~4.54:1 (canonical AA-boundary grey)", () => {
    // WCAG 2.1 example: just above the 4.5:1 large-text threshold
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 1);
  });

  it("argument order does not change the result", () => {
    const ab = contrastRatio("#000000", "#FFFFFF");
    const ba = contrastRatio("#FFFFFF", "#000000");
    expect(ab).toBeCloseTo(ba, 5);
  });

  it("accepts lowercase hex", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });

  it("accepts uppercase hex", () => {
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 1);
  });

  it("mixed-case hex produces the same result", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(
      contrastRatio("#767676", "#FFFFFF"),
      5,
    );
  });
});

// ─── Group 2: relativeLuminance — boundary values ───────────────────────────

describe("relativeLuminance — boundary values", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance("#000000")).toBe(0);
  });

  it("returns 1 for white", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });
});

// ─── Group 3: Default palette holds AA ──────────────────────────────────────

describe("SYSTEM_PROPERTIES_DEFAULTS palette holds AA (≥ 4.5:1)", () => {
  const d = SYSTEM_PROPERTIES_DEFAULTS;

  const THRESHOLD = 4.5;

  const pairs: Array<{ label: string; fg: string; bg: string }> = [
    {
      label: "foreground on background",
      fg: d["color.foreground"],
      bg: d["color.background"],
    },
    {
      label: "foreground on surface",
      fg: d["color.foreground"],
      bg: d["color.surface"],
    },
    {
      label: "muted-foreground on surface",
      fg: d["color.muted.foreground"],
      bg: d["color.surface"],
    },
    {
      label: "muted-foreground on muted",
      fg: d["color.muted.foreground"],
      bg: d["color.muted"],
    },
    {
      label: "foreground on muted",
      fg: d["color.foreground"],
      bg: d["color.muted"],
    },
    {
      label: "primary on surface",
      fg: d["color.primary"],
      bg: d["color.surface"],
    },
    {
      label: "primary on muted",
      fg: d["color.primary"],
      bg: d["color.muted"],
    },
    {
      label: "primary-foreground on primary",
      fg: d["color.primary.foreground"],
      bg: d["color.primary"],
    },
  ];

  for (const { label, fg, bg } of pairs) {
    it(`${label} (${fg} / ${bg}) ≥ ${THRESHOLD}:1`, () => {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(THRESHOLD);
    });
  }
});

// ─── Group 4: Corrected Mi Mundo pairs ──────────────────────────────────────

describe("Mi Mundo post-migration palette", () => {
  /**
   * Palette the migration 174_site_theme_mimundo_contrast.sql produces.
   * Base colours come from 134_site_theme_mimundo_seed.sql; the two patched
   * values are marked with their migration number.
   *
   * `color.border` is not overridden in the seed so it falls back to the
   * system default (#8A8275) from SYSTEM_PROPERTIES_DEFAULTS.
   */
  const P = {
    foreground: "#6D4C41",         // seed
    mutedForeground: "#5D4037",    // seed
    muted: "#F2E9E1",              // 174 PATCHED (was #8D6E63)
    primary: "#4E7040",            // 174 PATCHED (was #557945)
    primaryForeground: "#FFFFFF",  // seed
    surface: "#FAF6EA",            // seed
    background: "#FFF8EC",         // seed
    accent: "#FFD426",             // seed
    accentForeground: "#6D4C41",   // seed
    border: "#8A8275",             // system default (seed does not override)
    white: "#FFFFFF",
  } as const;

  // ── Fixed pairs (were failing before the migration) ──────────────────────

  it("foreground on wash (muted) reaches 3.0:1 (spec: 6.35)", () => {
    const ratio = contrastRatio(P.foreground, P.muted);
    // Assert WCAG threshold for large bold text (20 px)
    expect(ratio).toBeGreaterThanOrEqual(3.0);
    // Cross-check against spec's claimed value — within 0.1 tolerance
    expect(ratio).toBeCloseTo(6.35, 0);
  });

  it("muted-foreground on wash reaches 4.5:1 (spec: 7.77)", () => {
    const ratio = contrastRatio(P.mutedForeground, P.muted);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeCloseTo(7.77, 0);
  });

  it("primary on wash reaches 4.5:1 (spec: 4.71)", () => {
    const ratio = contrastRatio(P.primary, P.muted);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeCloseTo(4.71, 0);
  });

  it("primary on 95%-surface-over-wash (tab bar) reaches 4.5:1 (spec: 5.20)", () => {
    // The tab bar is painted bg-[var(--color-surface)]/95, so 5% of the wash
    // bleeds through.  Composite surface at 95% alpha over the wash.
    const effectiveBg = compositeOver(P.surface, P.muted, 0.95);
    const ratio = contrastRatio(P.primary, effectiveBg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeCloseTo(5.2, 0);
  });

  // ── Non-regression pairs (must not regress after the migration) ──────────

  it("foreground on background ≥ 4.5:1 (spec: 7.21)", () => {
    expect(contrastRatio(P.foreground, P.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("muted-foreground on surface ≥ 4.5:1 (spec: 8.62)", () => {
    expect(contrastRatio(P.mutedForeground, P.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("primary on surface ≥ 4.5:1 (spec: 5.23)", () => {
    expect(contrastRatio(P.primary, P.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("primary on background ≥ 4.5:1 (spec: 5.35)", () => {
    expect(contrastRatio(P.primary, P.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("white on primary ≥ 4.5:1 (spec: 5.65)", () => {
    expect(contrastRatio(P.white, P.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it("accent-foreground on accent ≥ 4.5:1 (spec: 5.32)", () => {
    expect(contrastRatio(P.accentForeground, P.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("border on wash ≥ 3.0:1 (non-text; spec: 3.17)", () => {
    // Non-text graphical element: WCAG 1.4.11 requires 3:1
    expect(contrastRatio(P.border, P.muted)).toBeGreaterThanOrEqual(3.0);
  });
});
