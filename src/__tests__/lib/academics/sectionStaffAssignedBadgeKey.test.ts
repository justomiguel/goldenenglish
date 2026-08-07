// REGRESSION CHECK: Lead vs assistant badge keys must stay stable so Teachers-tab cards show the right role chip.
import { describe, expect, it } from "vitest";
import { sectionStaffAssignedBadgeKey } from "@/lib/academics/sectionStaffAssignedPerson";

describe("sectionStaffAssignedBadgeKey", () => {
  it("returns leadBadge for lead kind regardless of role", () => {
    expect(sectionStaffAssignedBadgeKey({ kind: "lead", role: "teacher" })).toBe("leadBadge");
    expect(sectionStaffAssignedBadgeKey({ kind: "lead", role: "admin" })).toBe("leadBadge");
  });

  it("maps assistant profile roles to badge keys", () => {
    expect(sectionStaffAssignedBadgeKey({ kind: "assistant", role: "student" })).toBe(
      "assistantBadgeStudent",
    );
    expect(sectionStaffAssignedBadgeKey({ kind: "assistant", role: "assistant" })).toBe(
      "assistantBadgePortalAssistant",
    );
    expect(sectionStaffAssignedBadgeKey({ kind: "assistant", role: "teacher" })).toBe(
      "assistantBadgeTeacher",
    );
  });
});
