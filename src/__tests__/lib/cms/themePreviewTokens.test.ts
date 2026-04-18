import { describe, expect, it } from "vitest";
import {
  extractThemePreviewTokens,
  themePreviewCssVars,
} from "@/lib/cms/themePreviewTokens";
import type { ThemeProperties } from "@/lib/theme/themeParser";

const DEFAULTS: ThemeProperties = {
  "color.primary": "#103A5C",
  "color.primary.foreground": "#FFFFFF",
  "color.secondary": "#A31A22",
  "color.secondary.foreground": "#FFFFFF",
  "color.accent": "#F0B932",
  "color.background": "#FAF9F6",
  "color.surface": "#FFFFFF",
  "color.foreground": "#103A5C",
  "color.muted": "#F0EFEA",
  "color.muted.foreground": "#5C6B7A",
  "color.border": "#E2E0D8",
  "layout.border.radius": "0.75rem",
};

describe("extractThemePreviewTokens", () => {
  it("returns the system.properties defaults when there are no overrides", () => {
    const tokens = extractThemePreviewTokens(DEFAULTS, null);
    expect(tokens.colorPrimary).toBe("#103A5C");
    expect(tokens.colorSecondary).toBe("#A31A22");
    expect(tokens.colorAccent).toBe("#F0B932");
    expect(tokens.layoutBorderRadius).toBe("0.75rem");
  });

  it("applies overrides on top of defaults", () => {
    const tokens = extractThemePreviewTokens(DEFAULTS, {
      "color.primary": "#FF00AA",
      "layout.border.radius": "1.5rem",
    });
    expect(tokens.colorPrimary).toBe("#FF00AA");
    expect(tokens.layoutBorderRadius).toBe("1.5rem");
    // unrelated tokens stay default
    expect(tokens.colorSecondary).toBe("#A31A22");
  });

  it("falls back when both override and default are missing", () => {
    const tokens = extractThemePreviewTokens({}, null);
    expect(tokens.colorPrimary).toBe("#103A5C");
    expect(tokens.colorSurface).toBe("#FFFFFF");
  });

  it("rejects unsafe override values that contain CSS injection chars", () => {
    const tokens = extractThemePreviewTokens(DEFAULTS, {
      "color.primary": "red; background: url('x')",
      "color.secondary": "blue\n;",
      "color.accent": "<script>",
    });
    expect(tokens.colorPrimary).toBe("#103A5C");
    expect(tokens.colorSecondary).toBe("#A31A22");
    expect(tokens.colorAccent).toBe("#F0B932");
  });

  it("trims whitespace-only overrides and uses defaults", () => {
    const tokens = extractThemePreviewTokens(DEFAULTS, {
      "color.primary": "   ",
    });
    expect(tokens.colorPrimary).toBe("#103A5C");
  });
});

describe("themePreviewCssVars", () => {
  it("maps every preview token to a --preview-* CSS custom property", () => {
    const tokens = extractThemePreviewTokens(DEFAULTS, {
      "color.primary": "#000000",
    });
    const vars = themePreviewCssVars(tokens);
    expect(vars["--preview-color-primary"]).toBe("#000000");
    expect(vars["--preview-color-secondary"]).toBe("#A31A22");
    expect(vars["--preview-layout-border-radius"]).toBe("0.75rem");
    expect(Object.keys(vars).length).toBe(12);
  });
});
