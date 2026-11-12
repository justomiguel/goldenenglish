import { describe, expect, it } from "vitest";
import { genericKindToSections } from "@/lib/design-variants/genericKindToSections";
import { genericLandingComposition } from "@/lib/landing/genericLandingComposition";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";

describe("genericKindToSections", () => {
  it("pins the same layouts the composition returns today", () => {
    for (const kind of GENERIC_INSTITUTE_KINDS) {
      const composition = genericLandingComposition(kind);
      const sections = genericKindToSections(kind);
      expect(sections.map((section) => section.variantId)).toEqual([
        `hero.${composition.hero}`,
        `schedule.${composition.day}`,
        `band.${composition.bands}`,
        `close.${composition.close}`,
      ]);
      expect(sections.every((section) => section.major === 1)).toBe(true);
    }
  });
});
