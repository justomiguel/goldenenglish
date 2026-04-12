import { describe, expect, it } from "vitest";
import { profileRoleFromUserMetadata } from "@/lib/profile/loadOrProvisionDashboardProfileRow";

describe("profileRoleFromUserMetadata", () => {
  it("returns role when valid", () => {
    expect(profileRoleFromUserMetadata({ role: "admin" })).toBe("admin");
    expect(profileRoleFromUserMetadata({ role: "teacher" })).toBe("teacher");
  });

  it("defaults to student for missing or invalid", () => {
    expect(profileRoleFromUserMetadata(undefined)).toBe("student");
    expect(profileRoleFromUserMetadata({ role: "superuser" })).toBe("student");
    expect(profileRoleFromUserMetadata({ role: 1 })).toBe("student");
  });
});
