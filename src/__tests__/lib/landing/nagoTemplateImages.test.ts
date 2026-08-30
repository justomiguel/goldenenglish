import { describe, expect, it } from "vitest";
import {
  NAGO_HERO_SLIDES,
  NAGO_TEMPLATE,
  NAGO_TEMPLATE_GALLERY_URLS,
} from "@/lib/landing/nagoTemplateImages";

describe("NAGO_TEMPLATE", () => {
  it("points hero and programs at the regenerated template folder", () => {
    expect(NAGO_TEMPLATE.hero).toBe("/images/nago/template/nago-hero-roda.png");
    expect(NAGO_TEMPLATE.ninos).toContain("/images/nago/template/");
    expect(NAGO_TEMPLATE_GALLERY_URLS.length).toBeGreaterThan(4);
    expect(NAGO_HERO_SLIDES).toHaveLength(4);
    expect(NAGO_HERO_SLIDES[0]).toBe(NAGO_TEMPLATE.hero);
  });
});
