import { describe, expect, it } from "vitest";
import { parseAdminUsersListRoleCountsPayload } from "@/lib/dashboard/parseAdminUsersListRoleCountsPayload";

describe("parseAdminUsersListRoleCountsPayload", () => {
  it("returns zeros for invalid input", () => {
    expect(parseAdminUsersListRoleCountsPayload(null)).toEqual({ total: 0, byRole: {} });
    expect(parseAdminUsersListRoleCountsPayload({})).toEqual({ total: 0, byRole: {} });
  });

  it("parses total and lowercase by_role entries", () => {
    expect(
      parseAdminUsersListRoleCountsPayload({
        total: 12,
        by_role: { Student: "3", parent: 2, ADMIN: 1 },
      }),
    ).toEqual({
      total: 12,
      byRole: {
        student: 3,
        parent: 2,
        admin: 1,
      },
    });
  });

  it("drops empty keys and zero counts", () => {
    expect(
      parseAdminUsersListRoleCountsPayload({
        total: 5,
        by_role: { "": 99, orphan: 0 },
      }),
    ).toEqual({ total: 5, byRole: {} });
  });
});
