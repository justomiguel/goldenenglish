import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../../..");

const fontRoots = [
  "src/variants/owned/matiss/font/v1/Web.tsx",
  "src/components/organisms/LioraFontRoot.tsx",
  "src/components/organisms/MozarthitosFontRoot.tsx",
  "src/components/organisms/MiMundoFontRoot.tsx",
  "src/components/organisms/NagoFontRoot.tsx",
  "src/components/organisms/EspacioZenitFontRoot.tsx",
];

describe("marketingFontPreload wiring", () => {
  it("catalog fonts use preload: false and never preload: true", () => {
    const src = readFileSync(
      resolve(root, "src/components/atoms/fonts/catalogFonts.ts"),
      "utf8",
    );
    expect(src).toContain("preload: false");
    expect(src).not.toContain("preload: true");
    const catalogDir = resolve(root, "src/components/atoms/fonts/catalog");
    for (const name of readdirSync(catalogDir)) {
      if (!name.endsWith(".ts")) continue;
      const file = readFileSync(resolve(catalogDir, name), "utf8");
      expect(file, name).toContain("preload: false");
      expect(file, name).not.toContain("preload: true");
      expect(file, name).not.toContain("next/font/google");
    }
  });

  it("font roots read the catalog and do not call next/font", () => {
    for (const rel of fontRoots) {
      const src = readFileSync(resolve(root, rel), "utf8");
      expect(src, rel).toContain("CATALOG_FONTS");
      expect(src, rel).not.toContain("next/font");
    }
  });
});
