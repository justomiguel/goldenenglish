import { describe, expect, it } from "vitest";
import {
  countSelectOptionFacet,
  directoryFieldsForColumns,
  parseAcademicDirectoryParams,
  studentMatchesAcademicDirectoryFilters,
} from "@/lib/academic-profile/matchAcademicProfileDirectoryFilter";

const level = {
  id: "11111111-1111-4111-8111-111111111111",
  fieldType: "select" as const,
  showInDirectory: true,
  archivedAt: null,
  selectOptions: ["B1", "B2"],
};
const note = {
  id: "22222222-2222-4222-8222-222222222222",
  fieldType: "text" as const,
  showInDirectory: true,
  archivedAt: null,
  selectOptions: [],
};
const file = {
  id: "33333333-3333-4333-8333-333333333333",
  fieldType: "file" as const,
  showInDirectory: true,
  archivedAt: null,
  selectOptions: [],
};

describe("parseAcademicDirectoryParams", () => {
  it("keeps only acf_ uuid params", () => {
    expect(
      parseAcademicDirectoryParams({
        "acf_11111111-1111-4111-8111-111111111111": "B1",
        q: "ana",
        acf_not_a_uuid: "x",
      }),
    ).toEqual({ "11111111-1111-4111-8111-111111111111": "B1" });
  });

  it("skips a list value and a blank value", () => {
    expect(
      parseAcademicDirectoryParams({
        "acf_11111111-1111-4111-8111-111111111111": ["B1"],
        "acf_22222222-2222-4222-8222-222222222222": "  ",
      }),
    ).toEqual({});
  });
});

describe("directoryFieldsForColumns", () => {
  it("drops files and archived fields", () => {
    expect(
      directoryFieldsForColumns([level, { ...note, archivedAt: "2026-10-27" }, file]).map((field) => field.id),
    ).toEqual([level.id]);
  });

  it("drops a hidden field and an image", () => {
    expect(
      directoryFieldsForColumns([
        { ...note, showInDirectory: false },
        { ...file, fieldType: "image" },
      ]),
    ).toEqual([]);
  });
});

describe("studentMatchesAcademicDirectoryFilters", () => {
  it("AND-matches exact select and contains text", () => {
    const values = [
      { fieldId: level.id, studentId: "s1", valueText: "B1", valueNumber: null, valueDate: null },
      { fieldId: note.id, studentId: "s1", valueText: "Habla bien", valueNumber: null, valueDate: null },
    ];
    const params = { [level.id]: "B1", [note.id]: "habla" };
    expect(studentMatchesAcademicDirectoryFilters("s1", [level, note], values, params)).toBe(true);
    expect(studentMatchesAcademicDirectoryFilters("s1", [level, note], values, { [level.id]: "B2" })).toBe(false);
  });

  it("matches a number and a date and skips an unknown field", () => {
    const score = { ...note, id: "44444444-4444-4444-8444-444444444444", fieldType: "number" as const };
    const start = { ...note, id: "55555555-5555-4555-8555-555555555555", fieldType: "date" as const };
    const values = [
      { fieldId: score.id, studentId: "s1", valueText: null, valueNumber: 7, valueDate: null },
      { fieldId: start.id, studentId: "s1", valueText: null, valueNumber: null, valueDate: "2026-03-01" },
    ];
    expect(
      studentMatchesAcademicDirectoryFilters("s1", [score, start], values, {
        [score.id]: "7",
        [start.id]: "2026-03-01",
        "99999999-9999-4999-8999-999999999999": "x",
      }),
    ).toBe(true);
    expect(studentMatchesAcademicDirectoryFilters("s1", [score], [], { [score.id]: "7" })).toBe(false);
  });

  it("counts students on one select option", () => {
    const values = [
      { fieldId: level.id, studentId: "s1", valueText: "B1", valueNumber: null, valueDate: null },
    ];
    expect(countSelectOptionFacet(level.id, "B1", ["s1", "s2"], [level], values, {})).toBe(1);
  });
});
