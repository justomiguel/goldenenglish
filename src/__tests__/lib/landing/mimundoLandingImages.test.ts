import { describe, expect, it } from "vitest";
import { mimundoSectionImageSrc } from "@/lib/landing/mimundoLandingImages";
import {
  MIMUNDO_GALLERY_FILENAMES,
  MIMUNDO_GALLERY_URLS,
  mimundoGalleryPublicUrl,
} from "@/lib/landing/mimundoGalleryImages";

describe("mimundoSectionImageSrc", () => {
  it("constructs paths rooted at /images/mimundo/", () => {
    expect(mimundoSectionImageSrc("modalidades", "burbujas.jpg")).toBe(
      "/images/mimundo/modalidades/burbujas.jpg",
    );
  });

  it("encodes spaces in filenames", () => {
    expect(mimundoSectionImageSrc("inicio", "hero image.jpg")).toBe(
      "/images/mimundo/inicio/hero%20image.jpg",
    );
  });

  it("encodes spaces in filenames with special chars", () => {
    // encodeURI is used — spaces become %20; & is a valid URI char and is not encoded
    const result = mimundoSectionImageSrc("oferta", "arte & música.jpg");
    expect(result).not.toContain(" ");
    expect(result).toContain("%20");
  });

  it("does not double-encode already valid paths", () => {
    const result = mimundoSectionImageSrc("historia", "propuesta.jpg");
    expect(result).toBe("/images/mimundo/historia/propuesta.jpg");
  });
});

describe("mimundoGalleryPublicUrl", () => {
  it("produces a URL under /images/mimundo/galeria/", () => {
    expect(mimundoGalleryPublicUrl("galeria-1.jpg")).toBe(
      "/images/mimundo/galeria/galeria-1.jpg",
    );
  });

  it("encodes spaces in gallery filenames", () => {
    expect(mimundoGalleryPublicUrl("my photo.jpg")).toBe(
      "/images/mimundo/galeria/my%20photo.jpg",
    );
  });
});

describe("MIMUNDO_GALLERY_URLS", () => {
  it("has the same length as MIMUNDO_GALLERY_FILENAMES", () => {
    expect(MIMUNDO_GALLERY_URLS.length).toBe(MIMUNDO_GALLERY_FILENAMES.length);
  });

  it("all URLs start with /images/mimundo/galeria/", () => {
    for (const url of MIMUNDO_GALLERY_URLS) {
      expect(url).toMatch(/^\/images\/mimundo\/galeria\//);
    }
  });

  it("no URL contains unencoded spaces", () => {
    for (const url of MIMUNDO_GALLERY_URLS) {
      expect(url).not.toContain(" ");
    }
  });
});
