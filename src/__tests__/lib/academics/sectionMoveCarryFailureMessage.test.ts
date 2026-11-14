import { describe, expect, it } from "vitest";
import { dictEn } from "@/test/dictEn";
import {
  mapSectionMoveCarryRpcError,
  sectionMoveCarryFailureMessage,
} from "@/lib/academics/sectionMoveCarryFailureMessage";

const errors = dictEn.dashboard.academics.errors;
const funnel = dictEn.admin.registrations.funnel;

describe("sectionMoveCarryFailureMessage", () => {
  it("names the month and keeps the code", () => {
    const text = sectionMoveCarryFailureMessage(
      "carry_choice_missing",
      "March 2026",
      errors,
      errors.unknownError,
    );
    expect(text).toContain("March 2026");
    expect(text).toContain("carry_choice_missing");
    expect(text).not.toBe(dictEn.dashboard.academicSectionPage.genericError);
  });

  it("uses the known section sentence", () => {
    const text = sectionMoveCarryFailureMessage(
      "section_move_same",
      null,
      funnel.errors,
      funnel.unknownError,
    );
    expect(text).toContain("already in that section");
    expect(text).toContain("section_move_same");
  });

  it("shows an unknown code in the message", () => {
    const text = sectionMoveCarryFailureMessage("mystery_move", null, errors, errors.unknownError);
    expect(text).toContain("mystery_move");
    expect(text).not.toBe(dictEn.dashboard.academicSectionPage.genericError);
  });
});

describe("mapSectionMoveCarryRpcError", () => {
  it("reads the missing choice detail", () => {
    expect(mapSectionMoveCarryRpcError("CARRY_CHOICE_MISSING:2026-3")).toEqual({
      code: "carry_choice_missing",
      detail: "2026-3",
    });
  });

  it("maps a full section to the same-section code", () => {
    expect(mapSectionMoveCarryRpcError("ACADEMIC_CAPACITY_EXCEEDED")).toEqual({
      code: "CAPACITY_EXCEEDED",
    });
  });
});
