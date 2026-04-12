import { describe, it, expect } from "vitest";
import { mergeStudentProfileCsvPatch } from "@/lib/import/mergeStudentProfileCsv";
import type { CsvStudentRow } from "@/lib/import/studentRowSchema";

function row(p: Partial<CsvStudentRow>): CsvStudentRow {
  return {
    first_name: "A",
    last_name: "B",
    dni_or_passport: "100",
    ...p,
  };
}

describe("mergeStudentProfileCsvPatch", () => {
  it("fills phone when empty", () => {
    const profile = {
      id: "1",
      role: "student",
      phone: null,
      birth_date: null,
      dni_or_passport: "100",
    };
    const m = mergeStudentProfileCsvPatch(profile, row({ phone: "123" }), "100");
    expect(m.dniConflict).toBe(false);
    expect(m.hasNew).toBe(true);
    expect(m.patch).toMatchObject({ phone: "123" });
  });

  it("does not overwrite phone", () => {
    const profile = {
      id: "1",
      role: "student",
      phone: "999",
      birth_date: null,
      dni_or_passport: "100",
    };
    const m = mergeStudentProfileCsvPatch(profile, row({ phone: "123" }), "100");
    expect(m.hasNew).toBe(false);
    expect(Object.keys(m.patch)).toHaveLength(0);
  });

  it("detects dni conflict", () => {
    const profile = {
      id: "1",
      role: "student",
      phone: null,
      birth_date: null,
      dni_or_passport: "200",
    };
    const m = mergeStudentProfileCsvPatch(profile, row({ dni_or_passport: "100" }), "100");
    expect(m.dniConflict).toBe(true);
    expect(m.hasNew).toBe(false);
  });
});
