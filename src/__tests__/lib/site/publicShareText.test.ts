import { describe, expect, it } from "vitest";
import { buildPublicShareTitle, clipShareDescription } from "@/lib/site/publicShareText";

describe("publicShareText", () => {
  it("joins the page name and the academy", () => {
    expect(buildPublicShareTitle("Taller", "Nago")).toBe("Taller · Nago");
    expect(buildPublicShareTitle("Nago", "Nago")).toBe("Nago");
    expect(buildPublicShareTitle("  ", "Nago")).toBe("Nago");
  });

  it("clips a long description on a word boundary", () => {
    const words = Array.from({ length: 40 }, () => "palabra").join(" ");
    const clipped = clipShareDescription(words);
    expect(clipped.length).toBeLessThanOrEqual(180);
    expect(clipped.endsWith("palabra")).toBe(true);
    expect(clipped.includes("  ")).toBe(false);
  });

  it("keeps a short description", () => {
    expect(clipShareDescription("  Capoeira\n y comunidad  ")).toBe("Capoeira y comunidad");
  });
});
