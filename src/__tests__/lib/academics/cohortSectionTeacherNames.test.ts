import { describe, expect, it } from "vitest";
import { cohortSectionTeacherNames } from "@/lib/academics/cohortSectionTeacherNames";

const names = new Map<string, string>([
  ["lead", "Vargas Ana"],
  ["asst", "Perez Luis"],
]);

describe("cohortSectionTeacherNames", () => {
  it("puts the lead first, then assistants, and skips a repeated name", () => {
    expect(
      cohortSectionTeacherNames({
        leadId: "lead",
        assistantIds: ["lead", "asst"],
        externalNames: ["Vargas Ana", "Mora Sol"],
        nameById: names,
      }),
    ).toEqual(["Vargas Ana", "Perez Luis", "Mora Sol"]);
  });

  it("returns an empty list when nobody is assigned", () => {
    expect(
      cohortSectionTeacherNames({
        leadId: null,
        assistantIds: [],
        externalNames: ["  "],
        nameById: names,
      }),
    ).toEqual([]);
  });
});
