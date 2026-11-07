import { describe, expect, it } from "vitest";
import {
  publicExperienceThemeClass,
  publicExperienceVariant,
  publicPwaCoursesHref,
} from "@/lib/theme/publicExperienceNav";

describe("publicExperienceNav", () => {
  // REGRESSION CHECK: The Mozarthitos courses tab opens the family guide.
  // Other tenants keep their landing anchor. A path change here moves only that tenant's tab.
  it("maps each theme to its courses anchor", () => {
    expect(publicPwaCoursesHref("nago", "es")).toBe("/es#clases");
    expect(publicPwaCoursesHref("espaciozenit", "es")).toBe("/es#disciplinas");
    expect(publicPwaCoursesHref("mimundo", "pt")).toBe("/pt#salas");
    expect(publicPwaCoursesHref("classic", "en")).toBe("/en#niveles");
    expect(publicPwaCoursesHref("liora", "es")).toBe("/es#clases");
  });

  it("opens the Mozarthitos family guide from the courses tab", () => {
    expect(publicPwaCoursesHref("mozarthitos", "es")).toBe("/es/encuentra-tu-clase");
  });

  it("keeps classic, editorial, and minimal on the default dock", () => {
    expect(publicExperienceVariant("editorial")).toBe("default");
    expect(publicExperienceVariant("liora")).toBe("liora");
    expect(publicExperienceThemeClass("espaciozenit")).toBe("ez-landing mz-landing");
    expect(publicExperienceThemeClass("default")).toBe("");
  });
});
