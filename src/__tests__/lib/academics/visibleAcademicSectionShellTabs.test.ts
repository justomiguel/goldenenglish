// REGRESSION CHECK: Section hub must omit Evaluations / Learning route when
// flags are off; deep-link ?tab= must not open a hidden area (falls back to hub).
import { describe, expect, it } from "vitest";
import {
  resolveAcademicSectionShellArea,
  visibleAcademicSectionHubAreas,
} from "@/lib/academics/visibleAcademicSectionShellTabs";
import { ACADEMIC_SECTION_SHELL_HUB_AREA_ORDER } from "@/lib/academics/academicSectionShellTabOrder";

describe("visibleAcademicSectionHubAreas", () => {
  it("omits evaluations, learningRoute, and general when both flags are false", () => {
    const areas = visibleAcademicSectionHubAreas({
      requiresEvaluationsToPass: false,
      usesLearningRoute: false,
    });
    expect(areas).not.toContain("evaluations");
    expect(areas).not.toContain("learningRoute");
    expect(areas).not.toContain("general");
    expect(areas).toContain("configuration");
    expect(areas).toEqual([
      "teachers",
      "fees",
      "attendance",
      "students",
      "configuration",
    ]);
  });

  it("includes evaluations only when requiresEvaluationsToPass", () => {
    const areas = visibleAcademicSectionHubAreas({
      requiresEvaluationsToPass: true,
      usesLearningRoute: false,
    });
    expect(areas).toContain("evaluations");
    expect(areas).not.toContain("learningRoute");
  });

  it("includes learningRoute only when usesLearningRoute", () => {
    const areas = visibleAcademicSectionHubAreas({
      requiresEvaluationsToPass: false,
      usesLearningRoute: true,
    });
    expect(areas).toContain("learningRoute");
    expect(areas).not.toContain("evaluations");
  });

  it("preserves canonical hub order when all optional areas are enabled", () => {
    const areas = visibleAcademicSectionHubAreas({
      requiresEvaluationsToPass: true,
      usesLearningRoute: true,
    });
    expect(areas).toEqual([...ACADEMIC_SECTION_SHELL_HUB_AREA_ORDER]);
  });
});

describe("resolveAcademicSectionShellArea", () => {
  const flagsOff = {
    requiresEvaluationsToPass: false,
    usesLearningRoute: false,
  };

  it("returns null (hub) when requested area is hidden", () => {
    expect(resolveAcademicSectionShellArea("evaluations", flagsOff)).toBeNull();
    expect(resolveAcademicSectionShellArea("learningRoute", flagsOff)).toBeNull();
  });

  it("returns null (hub) for general or undefined (compat)", () => {
    expect(resolveAcademicSectionShellArea("general", flagsOff)).toBeNull();
    expect(resolveAcademicSectionShellArea(undefined, flagsOff)).toBeNull();
  });

  it("keeps a visible requested area", () => {
    expect(
      resolveAcademicSectionShellArea("evaluations", {
        requiresEvaluationsToPass: true,
        usesLearningRoute: false,
      }),
    ).toBe("evaluations");
  });
});
