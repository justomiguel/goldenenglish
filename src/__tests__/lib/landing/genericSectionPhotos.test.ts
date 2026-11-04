import { describe, expect, it } from "vitest";
import { genericSectionPhotos } from "@/lib/landing/genericSectionPhotos";

describe("genericSectionPhotos", () => {
  it("uses the uploaded photo and keeps the template file for the rest", () => {
    const photos = genericSectionPhotos(
      "deportes",
      new Map([["inicio::1", "https://cdn.example/hero.jpg"]]),
    );
    expect(photos.inicio).toBe("https://cdn.example/hero.jpg");
    expect(photos.historia).toBeUndefined();
  });

  it("leaves the designed template alone when nothing was uploaded", () => {
    expect(genericSectionPhotos("musica2")).toEqual({});
  });
});
