import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../../..");

const fontRoots = [
  "src/components/organisms/LioraFontRoot.tsx",
  "src/components/organisms/MozarthitosFontRoot.tsx",
  "src/components/organisms/MiMundoFontRoot.tsx",
  "src/components/organisms/NagoFontRoot.tsx",
  "src/components/organisms/EspacioZenitFontRoot.tsx",
];

describe("marketingFontPreload wiring", () => {
  it("root layout uses preload: false literals and never preload: true", () => {
    const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
    expect(src).toContain("preload: false");
    expect(src).not.toContain("preload: true");
  });

  it("each FontRoot uses both preload: true and preload: false literals", () => {
    for (const rel of fontRoots) {
      const src = readFileSync(resolve(root, rel), "utf8");
      expect(src, rel).toContain("preload: true");
      expect(src, rel).toContain("preload: false");
    }
  });
});
