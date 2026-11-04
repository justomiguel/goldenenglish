import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/theme/contrastRatio";
import { paletteFromThemeProperties, parseTemplatePalette, templatePaletteOverrides, templatePreviewHref } from "@/lib/theme/templatePalette";

describe("templatePalette", () => {
  it("rejects a partial or unsafe color", () => {
    expect(parseTemplatePalette({ primary: "#112233", accent: "red", paper: "#FFFFFF" })).toBeNull();
    expect(parseTemplatePalette({ primary: "#112233;}", accent: "#AABBCC", paper: "#FFFFFF" })).toBeNull();
  });

  it("reads the saved colors and falls back to the template", () => {
    expect(
      paletteFromThemeProperties("jardin2", { "color.primary": "#112233", "color.accent": "#AABBCC" }),
    ).toMatchObject({ primary: "#112233", accent: "#AABBCC" });
    expect(paletteFromThemeProperties("deportes", {}).primary).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("keeps text readable on the chosen paper and builds the preview url", () => {
    const palette = parseTemplatePalette({ primary: "1b4332", accent: "#C4A484", paper: "#F6F1E8" });
    expect(palette).toEqual({ primary: "#1B4332", accent: "#C4A484", paper: "#F6F1E8" });
    const colors = templatePaletteOverrides(palette!);
    expect(contrastRatio(colors["color.foreground"], colors["color.background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors["color.primary.foreground"], colors["color.primary"])).toBeGreaterThanOrEqual(4.5);
    expect(templatePreviewHref("es", "deportes", palette!)).toBe(
      "/es/plantilla/deportes?primary=%231B4332&accent=%23C4A484&paper=%23F6F1E8",
    );
  });
});
