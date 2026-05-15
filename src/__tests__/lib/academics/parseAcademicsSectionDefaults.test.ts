import { describe, expect, it } from "vitest";
import {
  ACADEMICS_SECTION_DEFAULTS,
  parseAcademicsSectionDefaults,
} from "@/lib/academics/parseAcademicsSectionDefaults";

describe("parseAcademicsSectionDefaults", () => {
  it("returns canonical defaults when the row is missing", () => {
    expect(parseAcademicsSectionDefaults(null)).toEqual(
      ACADEMICS_SECTION_DEFAULTS,
    );
    expect(parseAcademicsSectionDefaults(undefined)).toEqual(
      ACADEMICS_SECTION_DEFAULTS,
    );
  });

  it("parses maxStudents as number or numeric string", () => {
    expect(
      parseAcademicsSectionDefaults({ maxStudents: 80 }).maxStudents,
    ).toBe(80);
    expect(
      parseAcademicsSectionDefaults({ maxStudents: "45" }).maxStudents,
    ).toBe(45);
  });

  it("ignores invalid maxStudents values", () => {
    expect(
      parseAcademicsSectionDefaults({ maxStudents: 0 }).maxStudents,
    ).toBe(ACADEMICS_SECTION_DEFAULTS.maxStudents);
    expect(
      parseAcademicsSectionDefaults({ maxStudents: "abc" }).maxStudents,
    ).toBe(ACADEMICS_SECTION_DEFAULTS.maxStudents);
  });

  it("parses teacherPortalRoles as array or csv string", () => {
    expect(
      parseAcademicsSectionDefaults({ teacherPortalRoles: ["teacher"] })
        .teacherPortalRoles,
    ).toEqual(["teacher"]);
    expect(
      parseAcademicsSectionDefaults({ teacherPortalRoles: "teacher, admin" })
        .teacherPortalRoles,
    ).toEqual(["teacher", "admin"]);
  });

  it("falls back to default roles when value is empty/invalid", () => {
    expect(
      parseAcademicsSectionDefaults({ teacherPortalRoles: [] })
        .teacherPortalRoles,
    ).toEqual(ACADEMICS_SECTION_DEFAULTS.teacherPortalRoles);
    expect(
      parseAcademicsSectionDefaults({ teacherPortalRoles: 42 })
        .teacherPortalRoles,
    ).toEqual(ACADEMICS_SECTION_DEFAULTS.teacherPortalRoles);
  });
});
