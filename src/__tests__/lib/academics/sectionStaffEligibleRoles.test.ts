import { describe, expect, it } from "vitest";
import {
  SECTION_ASSISTANT_ELIGIBLE_ROLES,
  SECTION_LEAD_TEACHER_ELIGIBLE_ROLES,
  isProfileEligibleAsSectionAssistant,
  isProfileEligibleAsSectionLeadTeacher,
} from "@/lib/academics/sectionStaffEligibleRoles";

describe("sectionStaffEligibleRoles — lead teacher", () => {
  it("includes both teacher and admin (admins can lead a section)", () => {
    expect([...SECTION_LEAD_TEACHER_ELIGIBLE_ROLES].sort()).toEqual(["admin", "teacher"]);
  });

  it("accepts admin as section lead teacher", () => {
    expect(isProfileEligibleAsSectionLeadTeacher("admin")).toBe(true);
  });

  it("accepts teacher as section lead teacher", () => {
    expect(isProfileEligibleAsSectionLeadTeacher("teacher")).toBe(true);
  });

  it("rejects assistant / student / parent / null / unknown as lead teacher", () => {
    expect(isProfileEligibleAsSectionLeadTeacher("assistant")).toBe(false);
    expect(isProfileEligibleAsSectionLeadTeacher("student")).toBe(false);
    expect(isProfileEligibleAsSectionLeadTeacher("parent")).toBe(false);
    expect(isProfileEligibleAsSectionLeadTeacher(null)).toBe(false);
    expect(isProfileEligibleAsSectionLeadTeacher(undefined)).toBe(false);
    expect(isProfileEligibleAsSectionLeadTeacher("guest")).toBe(false);
  });
});

describe("sectionStaffEligibleRoles — assistants", () => {
  it("includes admin alongside teacher / assistant / student", () => {
    expect([...SECTION_ASSISTANT_ELIGIBLE_ROLES].sort()).toEqual([
      "admin",
      "assistant",
      "student",
      "teacher",
    ]);
  });

  it("accepts admin as section assistant", () => {
    expect(isProfileEligibleAsSectionAssistant("admin")).toBe(true);
  });

  it("rejects parent and unknown roles as assistants", () => {
    expect(isProfileEligibleAsSectionAssistant("parent")).toBe(false);
    expect(isProfileEligibleAsSectionAssistant("guest")).toBe(false);
    expect(isProfileEligibleAsSectionAssistant(null)).toBe(false);
  });
});
