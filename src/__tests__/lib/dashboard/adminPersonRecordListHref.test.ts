import { describe, expect, it } from "vitest";
import { adminPersonRecordListHref } from "@/lib/dashboard/adminPersonRecordListHref";

describe("adminPersonRecordListHref", () => {
  it("returns Alumnos for a student profile", () => {
    expect(adminPersonRecordListHref("es", "student")).toBe("/es/dashboard/admin/students");
  });

  it("returns Profesores for a teacher profile", () => {
    expect(adminPersonRecordListHref("es", "teacher")).toBe("/es/dashboard/admin/teachers");
  });

  it("returns Usuarios for parents and other roles", () => {
    expect(adminPersonRecordListHref("en", "parent")).toBe("/en/dashboard/admin/users");
    expect(adminPersonRecordListHref("en", "admin")).toBe("/en/dashboard/admin/users");
  });
});
