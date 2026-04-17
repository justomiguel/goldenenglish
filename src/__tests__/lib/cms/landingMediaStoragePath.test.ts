import { describe, expect, it } from "vitest";
import { buildLandingMediaStoragePath } from "@/lib/cms/landingMediaStoragePath";

describe("buildLandingMediaStoragePath", () => {
  it("builds a deterministic path with the right extension", () => {
    const path = buildLandingMediaStoragePath({
      themeId: "theme-1",
      section: "inicio",
      position: 1,
      mime: "image/png",
      now: 1_700_000_000_000,
    });
    expect(path).toMatch(/^theme-1\/inicio\/1-[a-z0-9]+\.png$/u);
  });

  it("maps each accepted mime to its canonical extension", () => {
    const png = buildLandingMediaStoragePath({
      themeId: "t",
      section: "historia",
      position: 2,
      mime: "image/png",
      now: 1,
    });
    const jpg = buildLandingMediaStoragePath({
      themeId: "t",
      section: "historia",
      position: 2,
      mime: "image/jpeg",
      now: 1,
    });
    const webp = buildLandingMediaStoragePath({
      themeId: "t",
      section: "historia",
      position: 2,
      mime: "image/webp",
      now: 1,
    });
    expect(png.endsWith(".png")).toBe(true);
    expect(jpg.endsWith(".jpg")).toBe(true);
    expect(webp.endsWith(".webp")).toBe(true);
  });
});
