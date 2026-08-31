import { describe, expect, it } from "vitest";
import { validateQuestionnaireAnswers } from "@/lib/questionnaires/validateAnswers";
import type { QuestionnaireQuestion } from "@/lib/questionnaires/types";

function q(
  partial: Partial<QuestionnaireQuestion> & Pick<QuestionnaireQuestion, "id" | "questionType">,
): QuestionnaireQuestion {
  return {
    promptI18n: { es: "Q" },
    helpTextI18n: {},
    optionsI18n: {},
    required: false,
    position: 0,
    archivedAt: null,
    ...partial,
  };
}

describe("validateQuestionnaireAnswers", () => {
  const locale = "es";

  it("requires missing required fields", () => {
    const result = validateQuestionnaireAnswers({
      locale,
      questions: [q({ id: "1", questionType: "text", required: true })],
      answers: {},
    });
    expect(result).toEqual({ ok: false, code: "validation" });
  });

  it("rejects a forged single-choice option", () => {
    const result = validateQuestionnaireAnswers({
      locale,
      questions: [
        q({
          id: "1",
          questionType: "single_choice",
          optionsI18n: { es: ["Rojo", "Azul"] },
        }),
      ],
      answers: { "1": { valueText: "Verde" } },
    });
    expect(result).toEqual({ ok: false, code: "invalid_option" });
  });

  it("accepts scale 1-5 and stores a number", () => {
    const result = validateQuestionnaireAnswers({
      locale,
      questions: [q({ id: "1", questionType: "scale", required: true })],
      answers: { "1": { valueNumber: 4 } },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toEqual([{ questionId: "1", valueNumber: 4 }]);
    }
  });

  it("rejects scale outside 1-5", () => {
    expect(
      validateQuestionnaireAnswers({
        locale,
        questions: [q({ id: "1", questionType: "scale" })],
        answers: { "1": { valueNumber: 6 } },
      }),
    ).toEqual({ ok: false, code: "validation" });
  });

  it("skips archived questions", () => {
    const result = validateQuestionnaireAnswers({
      locale,
      questions: [q({ id: "1", questionType: "text", required: true, archivedAt: "2026-01-01" })],
      answers: {},
    });
    expect(result.ok).toBe(true);
  });
});
