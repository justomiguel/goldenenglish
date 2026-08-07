import { describe, expect, it } from "vitest";
import {
  LIORA_GALLERY_FILENAMES,
  LIORA_GALLERY_URLS,
  lioraGalleryPublicUrl,
} from "@/lib/landing/lioraGalleryImages";
import { lioraSectionImageSrc } from "@/lib/landing/lioraLandingImages";

describe("lioraGalleryPublicUrl", () => {
  it("encodes path segments for public URL", () => {
    expect(lioraGalleryPublicUrl("a b.jpg")).toBe("/images/liora/galeria/a%20b.jpg");
  });
});

describe("LIORA_GALLERY_URLS", () => {
  it("aligns with filename list length", () => {
    expect(LIORA_GALLERY_URLS.length).toBe(LIORA_GALLERY_FILENAMES.length);
  });

  it("points every entry at the bundled gallery folder", () => {
    for (const url of LIORA_GALLERY_URLS) {
      expect(url).toMatch(/^\/images\/liora\/galeria\//);
      expect(url).not.toContain(" ");
    }
  });
});

describe("lioraSectionImageSrc", () => {
  it("builds a section-scoped public path", () => {
    expect(lioraSectionImageSrc("oferta", "1.jpg")).toBe("/images/liora/oferta/1.jpg");
  });

  it("encodes spaces in filenames", () => {
    expect(lioraSectionImageSrc("inicio", "hero bg.jpg")).toBe(
      "/images/liora/inicio/hero%20bg.jpg",
    );
  });
});
