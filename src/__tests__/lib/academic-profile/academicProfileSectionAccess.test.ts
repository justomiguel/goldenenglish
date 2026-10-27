import { describe, expect, it } from "vitest";
import { canEditAcademicProfileValue } from "@/lib/academic-profile/academicProfileSectionAccess";

describe("canEditAcademicProfileValue", () => {
  it("allows admin", () => {
    expect(
      canEditAcademicProfileValue({
        isAdmin: true,
        isLeadOrListedAssistant: false,
        studentEnrolledInSection: false,
      }),
    ).toBe(true);
  });

  it("allows a lead or listed assistant when the student is enrolled", () => {
    expect(
      canEditAcademicProfileValue({
        isAdmin: false,
        isLeadOrListedAssistant: true,
        studentEnrolledInSection: true,
      }),
    ).toBe(true);
  });

  it("rejects the institute-wide assistant who is not listed on the section", () => {
    expect(
      canEditAcademicProfileValue({
        isAdmin: false,
        isLeadOrListedAssistant: false,
        studentEnrolledInSection: true,
      }),
    ).toBe(false);
  });
});
