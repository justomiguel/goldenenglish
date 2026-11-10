import { describe, expect, it } from "vitest";
import { matissSectionImageSrc } from "@/lib/landing/matissLandingImages";

describe("matissSectionImageSrc", () => {
  it("keeps the share image and leaves the schedule story off the gallery", () => {
    expect(matissSectionImageSrc("inicio", "1.jpg")).toBe("/images/matiss/ilustraciones/og.jpg");
    expect(matissSectionImageSrc("inicio", "2.jpg")).toBe("/images/matiss/personajes/pequena.jpg");
    expect(matissSectionImageSrc("modalidades", "1.jpg")).toBe("/images/matiss/personajes/grupo.jpg");

    const gallery = [1, 2, 3].map((position) => matissSectionImageSrc("certificaciones", `${position}.jpg`));
    expect(gallery.join(" ")).not.toContain("galeria/4");
    expect(gallery.join(" ")).not.toContain("/fotos/");
    expect(gallery[2]).toBe("/images/matiss/personajes/grupo.jpg");
  });
});
