import { describe, expect, it } from "vitest";
import { resolveCareViewerRole, type CareViewerFacts } from "@/lib/students/care/careViewerAccess";

const NOBODY: CareViewerFacts = {
  isAdmin: false,
  isTutorOfStudent: false,
  sharesSectionWithStudent: false,
  isStudentThemselves: false,
};

describe("resolveCareViewerRole", () => {
  it("lets an admin in", () => {
    expect(resolveCareViewerRole({ ...NOBODY, isAdmin: true })).toBe("admin");
  });

  it("lets the student's own tutor in", () => {
    expect(resolveCareViewerRole({ ...NOBODY, isTutorOfStudent: true })).toBe("tutor");
  });

  it("lets a teacher or assistant of one of the student's sections in", () => {
    expect(resolveCareViewerRole({ ...NOBODY, sharesSectionWithStudent: true })).toBe(
      "section_staff",
    );
  });

  it("denies a teacher who does not share a section with the student", () => {
    expect(resolveCareViewerRole(NOBODY)).toBeNull();
  });

  it("denies the student themselves", () => {
    // Care notes are written about a student by the adults around them; a minor
    // reading their own file is a conversation, not a database read.
    expect(resolveCareViewerRole({ ...NOBODY, isStudentThemselves: true })).toBeNull();
  });

  it("denies the student themselves even when they share a section", () => {
    expect(
      resolveCareViewerRole({
        ...NOBODY,
        isStudentThemselves: true,
        sharesSectionWithStudent: true,
      }),
    ).toBeNull();
  });

  it("still lets an admin in when they are also the student", () => {
    // Defensive: an admin account should never be its own student, but if the
    // data ever says so, the admin grant is the one that wins.
    expect(resolveCareViewerRole({ ...NOBODY, isAdmin: true, isStudentThemselves: true })).toBe(
      "admin",
    );
  });

  it("reports the strongest reason when several apply", () => {
    expect(
      resolveCareViewerRole({
        ...NOBODY,
        isAdmin: true,
        isTutorOfStudent: true,
        sharesSectionWithStudent: true,
      }),
    ).toBe("admin");

    expect(
      resolveCareViewerRole({
        ...NOBODY,
        isTutorOfStudent: true,
        sharesSectionWithStudent: true,
      }),
    ).toBe("tutor");
  });
});
