import { describe, expect, it } from "vitest";
import {
  publicExperienceThemeClass,
  publicExperienceVariant,
  publicPwaCoursesHref,
} from "@/lib/theme/publicExperienceNav";

describe("publicExperienceNav", () => {
  // REGRESSION CHECK: The Mozarthitos courses tab opens #cursos.
  // The family guide has one entry, the hero button. Do not point this tab at the guide.
  it("maps each theme to its courses anchor", () => {
    expect(publicPwaCoursesHref("nago", "es")).toBe("/es#clases");
    expect(publicPwaCoursesHref("espaciozenit", "es")).toBe("/es#disciplinas");
    expect(publicPwaCoursesHref("mimundo", "pt")).toBe("/pt#salas");
    expect(publicPwaCoursesHref("classic", "en")).toBe("/en#niveles");
    expect(publicPwaCoursesHref("liora", "es")).toBe("/es#clases");
    expect(publicPwaCoursesHref("mozarthitos", "es")).toBe("/es#cursos");
  });

  it("keeps classic, editorial, and minimal on the default dock", () => {
    expect(publicExperienceVariant("editorial")).toBe("default");
    expect(publicExperienceVariant("liora")).toBe("liora");
    expect(publicExperienceThemeClass("espaciozenit")).toBe("ez-landing mz-landing");
    expect(publicExperienceThemeClass("default")).toBe("");
  });
});
