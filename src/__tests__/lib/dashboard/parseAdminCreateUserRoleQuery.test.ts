import { describe, expect, it } from "vitest";
import { parseAdminCreateUserRoleQuery } from "@/lib/dashboard/parseAdminCreateUserRoleQuery";

describe("parseAdminCreateUserRoleQuery", () => {
  it("accepts known create-user roles", () => {
    expect(parseAdminCreateUserRoleQuery("teacher")).toBe("teacher");
    expect(parseAdminCreateUserRoleQuery("student")).toBe("student");
    expect(parseAdminCreateUserRoleQuery("admin")).toBe("admin");
  });

  it("falls back to student when the query is missing or unknown", () => {
    expect(parseAdminCreateUserRoleQuery(undefined)).toBe("student");
    expect(parseAdminCreateUserRoleQuery("")).toBe("student");
    expect(parseAdminCreateUserRoleQuery("not-a-role")).toBe("student");
  });
});
