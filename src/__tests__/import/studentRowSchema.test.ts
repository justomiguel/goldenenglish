import { describe, it, expect } from "vitest";
import { csvStudentRowSchema, csvStudentRowsSchema } from "@/lib/import/studentRowSchema";

describe("csvStudentRowSchema", () => {
  it("accepts minimal valid row", () => {
    const row = {
      first_name: "Ana",
      last_name: "López",
      dni_or_passport: "12345678",
    };
    expect(csvStudentRowSchema.parse(row)).toEqual(row);
  });

  it("coerces academic_year from string", () => {
    const parsed = csvStudentRowSchema.parse({
      first_name: "Ana",
      last_name: "López",
      dni_or_passport: "1",
      academic_year: "2026",
    });
    expect(parsed.academic_year).toBe(2026);
  });

  it("rejects invalid CEF level", () => {
    const r = csvStudentRowSchema.safeParse({
      first_name: "Ana",
      last_name: "López",
      dni_or_passport: "1",
      level: "X1",
    });
    expect(r.success).toBe(false);
  });

  it("accepts CEF levels", () => {
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"] as const) {
      const r = csvStudentRowSchema.safeParse({
        first_name: "Ana",
        last_name: "López",
        dni_or_passport: "1",
        level,
      });
      expect(r.success).toBe(true);
    }
  });

  it("rejects empty required fields", () => {
    expect(
      csvStudentRowSchema.safeParse({
        first_name: "",
        last_name: "López",
        dni_or_passport: "1",
      }).success,
    ).toBe(false);
  });
});

describe("csvStudentRowsSchema", () => {
  it("parses array of rows", () => {
    const rows = [
      { first_name: "A", last_name: "B", dni_or_passport: "1" },
      { first_name: "C", last_name: "D", dni_or_passport: "2" },
    ];
    expect(csvStudentRowsSchema.parse(rows)).toHaveLength(2);
  });
});
