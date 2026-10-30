import { describe, expect, it } from "vitest";
import { landingMediaSlotsForTheme } from "@/lib/cms/landingThemeEditorCatalog";

describe("landingMediaSlotsForTheme generic templates", () => {
  it("keeps one Inicio image and no other section images", () => {
    expect(landingMediaSlotsForTheme("deportes", "inicio")).toBe(1);
    expect(landingMediaSlotsForTheme("colegio", "modalidades")).toBe(1);
    expect(landingMediaSlotsForTheme("classic", "inicio")).toBeGreaterThan(1);
  });
});
