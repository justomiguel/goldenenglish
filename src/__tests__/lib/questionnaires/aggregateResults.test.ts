import { describe, expect, it } from "vitest";
import { aggregateQuestionnaireResults } from "@/lib/questionnaires/aggregateResults";
import type { QuestionnaireAnswerRow, QuestionnaireQuestion } from "@/lib/questionnaires/types";

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

describe("aggregateQuestionnaireResults", () => {
  it("counts yes/no and always shows scale 1-5 including zeros", () => {
    const answers: QuestionnaireAnswerRow[] = [
      { questionId: "y", valueText: "yes" },
      { questionId: "y", valueText: "yes" },
      { questionId: "y", valueText: "no" },
      { questionId: "s", valueNumber: 5 },
      { questionId: "s", valueNumber: 5 },
    ];
    const blocks = aggregateQuestionnaireResults({
      locale: "es",
      responseCount: 2,
      questions: [
        q({ id: "y", questionType: "yes_no", position: 0, promptI18n: { es: "¿Sí?" } }),
        q({ id: "s", questionType: "scale", position: 1, promptI18n: { es: "Nota" } }),
      ],
      answers,
    });
    expect(blocks[0]?.kind).toBe("bars");
    if (blocks[0]?.kind === "bars") {
      expect(blocks[0].bars.map((b) => b.count)).toEqual([2, 1]);
    }
    expect(blocks[1]?.kind).toBe("bars");
    if (blocks[1]?.kind === "bars") {
      expect(blocks[1].bars.map((b) => b.label)).toEqual(["1", "2", "3", "4", "5"]);
      expect(blocks[1].bars.map((b) => b.count)).toEqual([0, 0, 0, 0, 2]);
    }
  });

  it("lets multi_choice counts exceed N and skips charts for text", () => {
    const answers: QuestionnaireAnswerRow[] = [
      { questionId: "m", valueOptions: ["A", "B"] },
      { questionId: "m", valueOptions: ["A"] },
      { questionId: "t", valueText: "hola" },
    ];
    const blocks = aggregateQuestionnaireResults({
      locale: "es",
      responseCount: 2,
      questions: [
        q({
          id: "m",
          questionType: "multi_choice",
          optionsI18n: { es: ["A", "B"] },
          promptI18n: { es: "Pick" },
        }),
        q({ id: "t", questionType: "text", promptI18n: { es: "Libre" } }),
      ],
      answers,
    });
    expect(blocks[0]?.kind).toBe("bars");
    if (blocks[0]?.kind === "bars") {
      expect(blocks[0].answeredCount).toBe(2);
      expect(blocks[0].bars.find((b) => b.label === "A")?.count).toBe(2);
      expect(blocks[0].bars.reduce((sum, b) => sum + b.count, 0)).toBe(3);
    }
    expect(blocks[1]?.kind).toBe("list");
    if (blocks[1]?.kind === "list") {
      expect(blocks[1].values).toEqual(["hola"]);
    }
  });
});
