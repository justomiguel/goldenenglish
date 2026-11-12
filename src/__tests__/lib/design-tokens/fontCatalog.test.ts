import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => {
  const load = (options: { variable: string }) => ({
    className: `cls${options.variable}`,
    variable: options.variable,
  });
  return {
    Allura: load,
    Baloo_2: load,
    Bebas_Neue: load,
    Caveat: load,
    Cormorant_Garamond: load,
    DM_Sans: load,
    Fraunces: load,
    JetBrains_Mono: load,
    Jost: load,
    Nunito: load,
    Oswald: load,
    Outfit: load,
    Pacifico: load,
    Playfair_Display: load,
    Plus_Jakarta_Sans: load,
  };
});

vi.mock("next/font/local", () => ({
  default: (options: { variable: string }) => ({
    className: `cls${options.variable}`,
    variable: options.variable,
  }),
}));

import { CATALOG_FONTS } from "@/components/atoms/fonts/catalogFonts";
import { findFontByFamily, FONT_CATALOG } from "@/lib/design-tokens/fontCatalog";

const OPEN_IDS = [
  "dm-sans",
  "fraunces",
  "oswald",
  "outfit",
  "cormorant-garamond",
  "jost",
  "nunito",
  "caveat",
  "baloo-2",
  "bebas-neue",
  "pacifico",
  "plus-jakarta-sans",
  "jetbrains-mono",
];

describe("font catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the open families and the Espacio Zenit files", () => {
    for (const id of OPEN_IDS) {
      expect(FONT_CATALOG.find((font) => font.id === id)?.owner).toBeNull();
    }
    expect(
      FONT_CATALOG.filter((font) => font.owner === "espaciozenit").map((font) => font.id),
    ).toEqual([
      "espaciozenit-fast-blaze",
      "espaciozenit-rusted-vibe",
      "espaciozenit-ballet",
    ]);
  });

  it("uses unique kebab-case ids", () => {
    const ids = FONT_CATALOG.map((font) => font.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("finds a family from a loose name", () => {
    expect(findFontByFamily("dm sans")?.id).toBe("dm-sans");
  });

  it("declares a CSS variable for every catalog id", () => {
    for (const font of FONT_CATALOG) {
      expect(CATALOG_FONTS[font.id]?.variable).toBe(`--font-catalog-${font.id}`);
    }
  });
});
