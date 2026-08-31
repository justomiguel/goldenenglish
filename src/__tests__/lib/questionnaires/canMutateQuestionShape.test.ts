import { describe, expect, it } from "vitest";
import { canMutateQuestionShape } from "@/lib/questionnaires/canMutateQuestionShape";

describe("canMutateQuestionShape", () => {
  it("allows type and option edits when the question has no answers", () => {
    expect(canMutateQuestionShape({ hasAnswers: false, typeChanged: true, optionsChanged: true })).toEqual({
      ok: true,
    });
  });

  it("blocks type or option changes after answers exist", () => {
    expect(canMutateQuestionShape({ hasAnswers: true, typeChanged: true, optionsChanged: false })).toEqual({
      ok: false,
      code: "shape_locked",
    });
    expect(canMutateQuestionShape({ hasAnswers: true, typeChanged: false, optionsChanged: true })).toEqual({
      ok: false,
      code: "shape_locked",
    });
  });

  it("allows prompt-only edits after answers exist", () => {
    expect(canMutateQuestionShape({ hasAnswers: true, typeChanged: false, optionsChanged: false })).toEqual({
      ok: true,
    });
  });
});
