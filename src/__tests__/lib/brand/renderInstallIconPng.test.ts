import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decodePngRgba } from "@/lib/brand/scalePng";
import { renderInstallIconPng } from "@/lib/brand/renderInstallIconPng";

const logo = new Uint8Array(
  readFileSync(path.join(process.cwd(), "public/images/matiss/logo/logo.png")),
);

describe("renderInstallIconPng", () => {
  it("scales the Matiss logo to 192 and 512", () => {
    for (const size of [192, 512]) {
      const png = renderInstallIconPng({ size, name: "Matiss Studio", sourcePng: logo });
      const decoded = decodePngRgba(png);
      expect(decoded?.width).toBe(size);
      expect(decoded?.height).toBe(size);
    }
  });

  it("draws a letter mark when the source is not a PNG", () => {
    const png = renderInstallIconPng({
      size: 180,
      name: "Matiss Studio",
      sourcePng: new Uint8Array([1, 2, 3]),
    });
    const decoded = decodePngRgba(png);
    expect(decoded?.width).toBe(180);
    expect(decoded?.height).toBe(180);
  });
});
