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
      lockedDirectory: true,
    });
  });

  it("forces teacher", () => {
    expect(lockedRoleUsersParams("teacher", { role: "admin" }).role).toBe("teacher");
  });

  it("keeps parent section and access filters", () => {
    expect(
      lockedRoleUsersParams("parent", {
        role: "student",
        section: "sec-1",
        access: "never",
        sort: "lastAccess",
      }),
    ).toMatchObject({
      role: "parent",
      section: "sec-1",
      access: "never",
      sort: "lastAccess",
    });
  });

  it("keeps student and teacher directory filters and drops invalid ones", () => {
    expect(
      lockedRoleUsersParams("student", {
        section: "sec-9",
        access: "entered",
        parentLink: "without",
        teachingRole: "lead",
        email: "none",
      }),
    ).toMatchObject({
      role: "student",
      section: "sec-9",
      access: "entered",
      parentLink: "without",
    });
    expect(lockedRoleUsersParams("student", { teachingRole: "lead" }).teachingRole).toBeUndefined();
    expect(
      lockedRoleUsersParams("teacher", { teachingRole: "assistant", enrollment: "without" }),
    ).toMatchObject({
      role: "teacher",
      teachingRole: "assistant",
      enrollment: "without",
    });
  });

  it("accepts student directory column sort keys", () => {
    expect(lockedRoleUsersParams("student", { sort: "sections" }).sort).toBe("sections");
    expect(lockedRoleUsersParams("student", { sort: "email" }).sort).toBe("email");
    expect(lockedRoleUsersParams("student", { sort: "lastEnrollment" }).sort).toBe(
      "lastEnrollment",
    );
    expect(lockedRoleUsersParams("parent", { sort: "enrollmentFee" }).sort).toBe(
      "enrollmentFee",
    );
  });
});
