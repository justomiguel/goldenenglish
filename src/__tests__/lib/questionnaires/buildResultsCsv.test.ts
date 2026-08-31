import { describe, expect, it } from "vitest";
import { buildQuestionnaireResultsCsv } from "@/lib/questionnaires/buildResultsCsv";

describe("buildQuestionnaireResultsCsv", () => {
  it("writes a header and one response row", () => {
    const csv = buildQuestionnaireResultsCsv({
      locale: "es",
      questions: [
        {
          id: "q1",
          questionType: "text",
          promptI18n: { es: "Nombre" },
          helpTextI18n: {},
          optionsI18n: {},
          required: false,
          position: 0,
          archivedAt: null,
        },
      ],
      responses: [{ id: "r1", submittedAt: "2026-08-30T12:00:00.000Z", label: "Ana" }],
      answersByResponse: { r1: [{ questionId: "q1", valueText: "hola" }] },
    });
    expect(csv.split("\n")[0]).toContain("Nombre");
    expect(csv).toContain("Ana");
    expect(csv).toContain("hola");
  });
});
