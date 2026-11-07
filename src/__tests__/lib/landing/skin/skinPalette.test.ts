import { describe, expect, it } from "vitest";
import { swapSkinPalette } from "@/lib/landing/skin/skinPalette";
import { genericKindColorOverrides } from "@/lib/theme/genericInstituteTemplates";

// REGRESSION CHECK: owner-chosen colors must survive a skin change.
describe("swapSkinPalette", () => {
  it("moves an untouched palette to the new skin", () => {
    const props = { ...genericKindColorOverrides("deportes"), "brand.name": "Club" };
    const out = swapSkinPalette({ from: "deportes", to: "jardin", properties: props });
    expect(out["color.primary"]).toBe(genericKindColorOverrides("jardin")["color.primary"]);
    expect(out["brand.name"]).toBe("Club");
  });

  it("keeps owner colors", () => {
    const props = { ...genericKindColorOverrides("deportes"), "color.primary": "#123456" };
    expect(swapSkinPalette({ from: "deportes", to: "jardin", properties: props })).toEqual(props);
  });

  it("writes the new palette when no color is set", () => {
    const out = swapSkinPalette({ from: "deportes", to: "musica", properties: {} });
    expect(out).toEqual(genericKindColorOverrides("musica"));
  });
});
