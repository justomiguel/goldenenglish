import { describe, it, expect } from "vitest";
import {
  EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
  ROLE_FILTER_ALL,
  applyUserRowToggle,
  filterAdminUsers,
  isAdminParentsDirectory,
  isAdminStudentsDirectory,
  isAdminTeachersDirectory,
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
    avatarDisplayUrl: null,
    missingSection: false,
    ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
  },
  {
    id: "b",
    email: "a@x.com",
    firstName: "Bea",
    lastName: "A",
    role: "admin",
    phone: "+2",
    avatarDisplayUrl: null,
    missingSection: false,
    ...EMPTY_ADMIN_STUDENT_DIRECTORY_FIELDS,
  },
];

describe("isAdminTeachersDirectory", () => {
  it("is true only for the locked teachers list", () => {
    expect(isAdminTeachersDirectory("teacher")).toBe(true);
    expect(isAdminTeachersDirectory("student")).toBe(false);
    expect(isAdminTeachersDirectory()).toBe(false);
  });
});

describe("isAdminParentsDirectory", () => {
  it("is true only for the locked parents list", () => {
    expect(isAdminParentsDirectory("parent")).toBe(true);
    expect(isAdminParentsDirectory("student")).toBe(false);
  });
});

describe("isAdminStudentsDirectory", () => {
  it("is true only for the locked students list", () => {
    expect(isAdminStudentsDirectory("student")).toBe(true);
    expect(isAdminStudentsDirectory("teacher")).toBe(false);
    expect(isAdminStudentsDirectory()).toBe(false);
  });
});

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

  it("finds students missing section via filter tokens", () => {
    const withFlag: AdminUserRow[] = [
      { ...rows[0], missingSection: true },
      rows[1],
    ];
    const r = filterAdminUsers(withFlag, "no-section", ROLE_FILTER_ALL);
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("a");
  });

  it("finds students by section or parent name", () => {
    const withFamily: AdminUserRow[] = [
      {
        ...rows[0],
        sections: [{ id: "sec-1", name: "A1 Morning", cohortId: "coh-1", discountPercent: null }],
        parents: [{ id: "p1", firstName: "Carlos", lastName: "Tutor" }],
      },
      rows[1],
    ];
    expect(filterAdminUsers(withFamily, "morning", ROLE_FILTER_ALL)[0]?.id).toBe("a");
    expect(filterAdminUsers(withFamily, "tutor carlos", ROLE_FILTER_ALL)[0]?.id).toBe("a");
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
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("sorts by sections, parent, and monthly due", () => {
    const withExtras: AdminUserRow[] = [
      {
        ...rows[0],
        sections: [{ id: "z", name: "Zeta", cohortId: null, discountPercent: null }],
        parents: [{ id: "p2", firstName: "Zoe", lastName: "Tutor" }],
        monthlyDue: [{ amount: 40, currency: "CLP" }],
      },
      {
        ...rows[1],
        sections: [{ id: "a", name: "Alfa", cohortId: null, discountPercent: null }],
        parents: [{ id: "p1", firstName: "Ana", lastName: "Tutor" }],
        monthlyDue: [{ amount: 10, currency: "CLP" }],
      },
    ];
    expect(sortAdminUsers(withExtras, "sections", "asc")[0]?.id).toBe("b");
    expect(sortAdminUsers(withExtras, "parent", "asc")[0]?.id).toBe("b");
    expect(sortAdminUsers(withExtras, "monthlyDue", "asc")[0]?.id).toBe("b");
  });

  it("sorts by last enrollment and keeps empty dates last in both directions", () => {
    const withDates: AdminUserRow[] = [
      { ...rows[0], lastEnrollmentAt: "2026-01-01T00:00:00.000Z" },
      { ...rows[1], lastEnrollmentAt: "2026-08-01T00:00:00.000Z" },
      {
        ...rows[0],
        id: "c",
        email: "c@x.com",
        lastEnrollmentAt: null,
      },
    ];
    expect(sortAdminUsers(withDates, "lastEnrollment", "asc").map((x) => x.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(sortAdminUsers(withDates, "lastEnrollment", "desc").map((x) => x.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("sorts matrícula no before na before yes", () => {
    const withMarks: AdminUserRow[] = [
      { ...rows[0], enrollmentFeeStatus: "yes" },
      { ...rows[1], enrollmentFeeStatus: "no" },
      { ...rows[0], id: "c", email: "c@x.com", enrollmentFeeStatus: "na" },
    ];
    expect(sortAdminUsers(withMarks, "enrollmentFee", "asc").map((x) => x.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });
});
