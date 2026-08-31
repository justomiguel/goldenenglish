import { describe, expect, it } from "vitest";
import { formatAnswerForCsv } from "@/lib/questionnaires/formatAnswerCsv";

describe("formatAnswerForCsv", () => {
  it("joins multi_choice with semicolon", () => {
    expect(formatAnswerForCsv({ questionType: "multi_choice", valueOptions: ["A", "B"] })).toBe(
      "A; B",
    );
  });

  it("stringifies numbers and empty missing values", () => {
    expect(formatAnswerForCsv({ questionType: "scale", valueNumber: 3 })).toBe("3");
    expect(formatAnswerForCsv({ questionType: "text" })).toBe("");
  });
});
