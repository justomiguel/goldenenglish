import { describe, expect, it } from "vitest";
import { matissSectionImageSrc } from "@/lib/landing/matissLandingImages";

const SLOTS = {
  inicio: 2,
  historia: 2,
  oferta: 4,
  modalidades: 2,
  niveles: 3,
  certificaciones: 8,
} as const;

function allVisibleSlots(): string[] {
  return Object.entries(SLOTS).flatMap(([section, count]) =>
    Array.from({ length: count }, (_, index) => index + 1)
      .filter((position) => !(section === "inicio" && position === 1))
      .map((position) => matissSectionImageSrc(section as keyof typeof SLOTS, `${position}.jpg`)),
  );
}

describe("matissSectionImageSrc", () => {
  it("keeps the illustrated share image and puts a real photo in the hero", () => {
    expect(matissSectionImageSrc("inicio", "1.jpg")).toBe("/images/matiss/ilustraciones/og.jpg");
    expect(matissSectionImageSrc("inicio", "2.jpg")).toBe("/images/matiss/fotos/roja.jpg");
  });

  it("uses only real studio photos in every visible slot", () => {
    const visible = allVisibleSlots();
    expect(visible).toHaveLength(20);
    for (const src of visible) {
      expect(src).toMatch(/^\/images\/matiss\/(fotos|galeria)\//);
    }
  });

  it("leaves the schedule story and the AI characters off the landing", () => {
    const joined = allVisibleSlots().join(" ");
    expect(joined).not.toContain("galeria/4");
    expect(joined).not.toContain("personajes");
  });
});
