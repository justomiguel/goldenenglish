import { describe, expect, it } from "vitest";
import {
  NAGO_GALLERY_FILENAMES,
  NAGO_GALLERY_URLS,
  nagoGalleryPublicUrl,
} from "@/lib/landing/nagoGalleryImages";

describe("nagoGalleryPublicUrl", () => {
  it("encodes path segments for public URL", () => {
    expect(nagoGalleryPublicUrl("a b.png")).toBe("/images/nago/galeria/a%20b.png");
  });
});

describe("NAGO_GALLERY_URLS", () => {
  it("aligns with filename list length", () => {
    expect(NAGO_GALLERY_URLS.length).toBe(NAGO_GALLERY_FILENAMES.length);
  });

  it("uses encodeURI for spaces in bundled filenames", () => {
    expect(NAGO_GALLERY_URLS[0]).not.toContain(" ");
    expect(NAGO_GALLERY_URLS[0]).toMatch(/^\/images\/nago\/galeria\//);
  });
});
