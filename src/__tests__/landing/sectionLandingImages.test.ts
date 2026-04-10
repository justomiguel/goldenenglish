import { describe, it, expect } from "vitest";
import {
  HISTORIA_IMAGES,
  INICIO_IMAGES,
  MODALIDADES_IMAGES,
  modalidadesCollageSrc,
  sectionImageSrc,
} from "@/lib/landing/sectionLandingImages";

describe("sectionLandingImages", () => {
  it("builds encoded paths per section", () => {
    expect(sectionImageSrc("inicio", "1.png")).toBe("/images/sections/inicio/1.png");
    const spaced = sectionImageSrc("oferta", "a b.png");
    expect(spaced).toContain("%20");
    expect(() => decodeURIComponent(spaced)).not.toThrow();
  });

  it("exports image lists for each block", () => {
    expect(INICIO_IMAGES.length).toBe(3);
    expect(HISTORIA_IMAGES.length).toBe(2);
    expect(MODALIDADES_IMAGES.length).toBe(4);
  });

  it("maps collage index to modalidades filenames", () => {
    expect(modalidadesCollageSrc(0)).toBe("/images/sections/modalidades/1.png");
    expect(modalidadesCollageSrc(3)).toBe("/images/sections/modalidades/4.png");
  });
});
