import { describe, expect, it } from "vitest";
import { nagoGalleryPublicUrl } from "@/lib/landing/nagoGalleryImages";

describe("nagoGalleryPublicUrl", () => {
  it("encodes path segments for public URL", () => {
    expect(nagoGalleryPublicUrl("a b.png")).toBe("/images/nago/galeria/a%20b.png");
  });

  it("keeps an event folder in the public path", () => {
    expect(nagoGalleryPublicUrl("conexion-internacional-2025/01.jpg")).toBe(
      "/images/nago/galeria/conexion-internacional-2025/01.jpg",
    );
  });
});
