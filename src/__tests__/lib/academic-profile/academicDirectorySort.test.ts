import { describe, expect, it } from "vitest";
import { sortAdminUsers } from "@/lib/dashboard/sortAdminUserRows";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";
import {
  academicDirectorySortValue,
  academicFieldSortKey,
  resolveDirectorySortCriteria,
} from "@/lib/academic-profile/academicDirectorySort";

const FIELD_ID = "11111111-1111-4111-8111-111111111111";
const SORT_KEY = academicFieldSortKey(FIELD_ID);

function row(id: string, value: string | number | null): AdminUserRow {
  return {
    id,
    email: `${id}@example.com`,
    firstName: id,
    lastName: "Student",
    role: "student",
    phone: "",
    avatarDisplayUrl: null,
    missingSection: false,
    sections: [],
    parents: [],
    children: [],
    monthlyDue: [],
    monthlyStatus: "na",
    enrollmentFeeStatus: "na",
    lastEnrollmentAt: null,
    lastSessionStartAt: null,
    emailDeliverable: true,
    academicSortValues: { [SORT_KEY]: value },
  };
}

describe("resolveDirectorySortCriteria", () => {
  it("falls back to name when the field is not a column", () => {
    expect(resolveDirectorySortCriteria([{ key: SORT_KEY, dir: "desc" }], new Set())).toEqual([
      { key: "name", dir: "asc" },
    ]);
  });

  it("keeps a built-in key when the field is not a column", () => {
    expect(
      resolveDirectorySortCriteria(
        [
          { key: "email", dir: "desc" },
          { key: SORT_KEY, dir: "asc" },
        ],
        new Set(),
      ),
    ).toEqual([{ key: "email", dir: "desc" }]);
  });

  it("keeps a field that is a column", () => {
    expect(
      resolveDirectorySortCriteria([{ key: SORT_KEY, dir: "desc" }], new Set([FIELD_ID])),
    ).toEqual([{ key: SORT_KEY, dir: "desc" }]);
  });
});

describe("academic directory sort", () => {
  it("sorts numbers and keeps an empty value last in both directions", () => {
    const rows = [row("a", null), row("b", 2), row("c", 10)];
    expect(sortAdminUsers(rows, [{ key: SORT_KEY, dir: "asc" }]).map((item) => item.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(sortAdminUsers(rows, [{ key: SORT_KEY, dir: "desc" }]).map((item) => item.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("sorts text without case and keeps a date order", () => {
    expect(academicDirectorySortValue("text", { valueText: "  Beta ", valueNumber: null, valueDate: null })).toBe(
      "Beta",
    );
    const textRows = [row("a", "beta"), row("b", "Alpha")];
    expect(sortAdminUsers(textRows, [{ key: SORT_KEY, dir: "asc" }]).map((item) => item.id)).toEqual([
      "b",
      "a",
    ]);
    expect(academicDirectorySortValue("date", { valueText: null, valueNumber: null, valueDate: "2026-03-01" })).toBe(
      "2026-03-01",
    );
  });

  it("returns null when the value is missing or blank", () => {
    const blank = { valueText: "  ", valueNumber: null, valueDate: "  " };
    expect(academicDirectorySortValue("number", undefined)).toBeNull();
    expect(academicDirectorySortValue("number", { ...blank, valueNumber: 4 })).toBe(4);
    expect(academicDirectorySortValue("date", blank)).toBeNull();
    expect(academicDirectorySortValue("text", blank)).toBeNull();
  });
});
