import { describe, expect, it } from "vitest";
import {
  EZ_GALLERY_ALL_URLS,
  EZ_GALLERY_PREVIEW_URLS,
} from "@/lib/landing/espacioZenitGalleryImages";
import { EZ_HORARIOS_URLS } from "@/lib/landing/espacioZenitLandingMedia";

describe("espacioZenitGalleryImages", () => {
  it("lists preview grid URLs and carousel includes horarios class photos", () => {
    expect(EZ_GALLERY_PREVIEW_URLS).toHaveLength(4);
    expect(EZ_HORARIOS_URLS).toHaveLength(3);
    expect(EZ_GALLERY_ALL_URLS.length).toBe(10 + EZ_HORARIOS_URLS.length);
    for (const url of EZ_GALLERY_PREVIEW_URLS) {
      expect(url.startsWith("/images/espaciozenit/galeria/")).toBe(true);
    }
    for (const url of EZ_HORARIOS_URLS) {
      expect(url.startsWith("/images/espaciozenit/horarios/")).toBe(true);
      expect(EZ_GALLERY_ALL_URLS).toContain(url);
    }
  });
});
