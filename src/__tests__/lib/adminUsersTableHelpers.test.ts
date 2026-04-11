import { describe, it, expect } from "vitest";
import {
  ROLE_FILTER_ALL,
  applyUserRowToggle,
  filterAdminUsers,
  sortAdminUsers,
  type AdminUserRow,
} from "@/lib/dashboard/adminUsersTableHelpers";

const rows: AdminUserRow[] = [
  {
    id: "a",
    email: "z@x.com",
    firstName: "Ana",
    lastName: "Zed",
    role: "student",
    phone: "+1",
  },
  {
    id: "b",
    email: "a@x.com",
    firstName: "Bea",
    lastName: "A",
    role: "admin",
    phone: "+2",
  },
];

describe("filterAdminUsers", () => {
  it("filters by text across columns", () => {
    const r = filterAdminUsers(rows, "admin", ROLE_FILTER_ALL);
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("b");
  });

  it("filters by role when not all", () => {
    const r = filterAdminUsers(rows, "", "student");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("a");
  });
});

describe("applyUserRowToggle", () => {
  const self = "11111111-1111-1111-1111-111111111111";
  const other = "22222222-2222-2222-2222-222222222222";

  it("returns the same set when toggling the current user id", () => {
    const prev = new Set<string>([other]);
    const next = applyUserRowToggle(prev, self, self);
    expect(next).toBe(prev);
  });

  it("adds and removes other user ids", () => {
    expect(applyUserRowToggle(new Set(), other, self)).toEqual(new Set([other]));
    expect(applyUserRowToggle(new Set([other]), other, self)).toEqual(new Set());
  });
});

describe("sortAdminUsers", () => {
  it("sorts by email ascending", () => {
    const r = sortAdminUsers(rows, "email", "asc");
    expect(r.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("sorts by full name descending", () => {
    const r = sortAdminUsers(rows, "name", "desc");
    expect(r.map((x) => x.id)).toEqual(["b", "a"]);
  });
});
