import { describe, expect, it } from "vitest";
import {
  NAGO_HERO_SLIDES,
  NAGO_TEMPLATE,
  NAGO_TEMPLATE_GALLERY_URLS,
} from "@/lib/landing/nagoTemplateImages";

describe("NAGO_TEMPLATE", () => {
  it("points hero and programs at gallery photos and keeps the Mestre file", () => {
    expect(NAGO_TEMPLATE.hero).toBe(
      "/images/nago/galeria/conexion-internacional-2025/38.jpg",
    );
    expect(NAGO_TEMPLATE.ninos).toContain("/images/nago/galeria/");
    expect(NAGO_TEMPLATE.mestre).toBe("/images/nago/template/nago-mestre.png");
    expect(NAGO_TEMPLATE_GALLERY_URLS.length).toBeGreaterThan(4);
    expect(NAGO_HERO_SLIDES).toHaveLength(4);
    expect(NAGO_HERO_SLIDES[0]).toBe(NAGO_TEMPLATE.hero);
  });
});
