import { describe, expect, it } from "vitest";
import {
  publicExperienceThemeClass,
  publicExperienceVariant,
  publicPwaCoursesHref,
} from "@/lib/theme/publicExperienceNav";

describe("publicExperienceNav", () => {
  it("maps each theme to its courses anchor", () => {
    expect(publicPwaCoursesHref("nago", "es")).toBe("/es#clases");
    expect(publicPwaCoursesHref("espaciozenit", "es")).toBe("/es#disciplinas");
    expect(publicPwaCoursesHref("mimundo", "pt")).toBe("/pt#salas");
    expect(publicPwaCoursesHref("classic", "en")).toBe("/en#niveles");
  });

  it("keeps classic, editorial, and minimal on the default dock", () => {
    expect(publicExperienceVariant("editorial")).toBe("default");
    expect(publicExperienceVariant("liora")).toBe("liora");
    expect(publicExperienceThemeClass("espaciozenit")).toBe("ez-landing mz-landing");
    expect(publicExperienceThemeClass("default")).toBe("");
  });
});
