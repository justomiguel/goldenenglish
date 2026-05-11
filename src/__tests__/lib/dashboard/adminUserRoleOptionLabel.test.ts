import { describe, it, expect } from "vitest";
import type { Dictionary } from "@/types/i18n";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";

const labels = {
  roleOptionAdmin: "Admin",
  roleOptionTeacher: "Teacher",
  roleOptionStudent: "Student",
  roleOptionParent: "Parent",
  roleOptionAssistant: "Assistant",
} as Dictionary["admin"]["users"];

describe("adminUserRoleOptionLabel", () => {
  it("returns raw role when unknown", () => {
    expect(adminUserRoleOptionLabel(labels, "custom_role")).toBe("custom_role");
  });
});
