import { describe, expect, it } from "vitest";
import { resolveCourseAccess } from "@/lib/courses/resolveCourseAccess";

const SECTION = "section-1";

describe("resolveCourseAccess", () => {
  it("hides a draft even when the student is enrolled", () => {
    expect(
      resolveCourseAccess({
        published: false,
        grantingSectionIds: [SECTION],
        activeEnrollmentSectionIds: [SECTION],
        personalGrant: null,
      }),
    ).toEqual({ visible: false, origins: [] });
  });

  it("shows a section course while the enrollment is active", () => {
    expect(
      resolveCourseAccess({
        published: true,
        grantingSectionIds: [SECTION],
        activeEnrollmentSectionIds: [SECTION],
        personalGrant: null,
      }),
    ).toEqual({ visible: true, origins: ["section"] });
  });

  it("hides a section course after the student leaves", () => {
    expect(
      resolveCourseAccess({
        published: true,
        grantingSectionIds: [SECTION],
        activeEnrollmentSectionIds: [],
        personalGrant: null,
      }).visible,
    ).toBe(false);
  });

  it("keeps a purchase after the student leaves the section", () => {
    expect(
      resolveCourseAccess({
        published: true,
        grantingSectionIds: [SECTION],
        activeEnrollmentSectionIds: [],
        personalGrant: "purchase",
      }),
    ).toEqual({ visible: true, origins: ["purchase"] });
  });

  it("reports section and purchase together", () => {
    expect(
      resolveCourseAccess({
        published: true,
        grantingSectionIds: [SECTION],
        activeEnrollmentSectionIds: [SECTION],
        personalGrant: "purchase",
      }).origins,
    ).toEqual(["section", "purchase"]);
  });
});
