import { describe, expect, it } from "vitest";
import { lockedRoleUsersParams } from "@/lib/dashboard/lockedRoleUsersParams";

describe("lockedRoleUsersParams", () => {
  it("forces student even when the query asks for teacher", () => {
    expect(lockedRoleUsersParams("student", { role: "teacher", q: "a" })).toEqual({
      page: 1,
      q: "a",
      role: "student",
      sort: "name",
      dir: "asc",
    });
  });

  it("forces teacher", () => {
    expect(lockedRoleUsersParams("teacher", { role: "admin" }).role).toBe("teacher");
  });

  it("keeps students list sorted by name", () => {
    expect(lockedRoleUsersParams("student", { sort: "email" }).sort).toBe("name");
  });
});
