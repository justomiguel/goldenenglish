// REGRESSION CHECK: Gallery order is 15 photos, then v1–v6. A video before photo 15 breaks the preview.
import { describe, expect, it } from "vitest";
import {
  LIORA_GALLERY_ITEMS,
  lioraGalleryPublicUrl,
} from "@/lib/landing/lioraGalleryImages";
import { lioraSectionImageSrc } from "@/lib/landing/lioraLandingImages";

describe("lioraGalleryPublicUrl", () => {
  it("encodes path segments for public URL", () => {
    expect(lioraGalleryPublicUrl("a b.jpg")).toBe("/images/liora/galeria/a%20b.jpg");
  });
});

describe("LIORA_GALLERY_ITEMS", () => {
  it("lists 15 studio photos and then 6 videos", () => {
    expect(LIORA_GALLERY_ITEMS).toHaveLength(21);
    const photos = LIORA_GALLERY_ITEMS.filter((item) => item.kind === "photo");
    const videos = LIORA_GALLERY_ITEMS.filter((item) => item.kind === "video");
    expect(photos).toHaveLength(15);
    expect(videos).toHaveLength(6);
    expect(LIORA_GALLERY_ITEMS.findIndex((item) => item.kind === "video")).toBe(15);
    expect(photos[0]).toEqual({
      kind: "photo",
      src: "/images/liora/galeria/1.jpg",
    });
    expect(photos[14]).toEqual({
      kind: "photo",
      src: "/images/liora/galeria/15.jpg",
    });
    expect(videos[0]).toEqual({
      kind: "video",
      src: "/images/liora/galeria/v1.mp4",
      poster: "/images/liora/galeria/v1.jpg",
    });
    expect(videos[5]).toEqual({
      kind: "video",
      src: "/images/liora/galeria/v6.mp4",
      poster: "/images/liora/galeria/v6.jpg",
    });
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
