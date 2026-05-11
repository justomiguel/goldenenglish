import { describe, expect, it } from "vitest";
import { profileRoleEligibleAsLinkedStudentGuardian } from "@/lib/register/linkedStudentGuardianProfileRoles";

describe("profileRoleEligibleAsLinkedStudentGuardian", () => {
  it("allows parent and admin roles used when reusing profile by DNI", () => {
    expect(profileRoleEligibleAsLinkedStudentGuardian("parent")).toBe(true);
    expect(profileRoleEligibleAsLinkedStudentGuardian("admin")).toBe(true);
    expect(profileRoleEligibleAsLinkedStudentGuardian("ADMIN")).toBe(true);
  });

  it("rejects other roles", () => {
    expect(profileRoleEligibleAsLinkedStudentGuardian("student")).toBe(false);
    expect(profileRoleEligibleAsLinkedStudentGuardian("teacher")).toBe(false);
    expect(profileRoleEligibleAsLinkedStudentGuardian(null)).toBe(false);
  });
});
