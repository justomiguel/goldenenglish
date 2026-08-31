import { pickI18n } from "@/lib/questionnaires/pickI18n";
import { formatAnswerForCsv } from "@/lib/questionnaires/formatAnswerCsv";
import type { QuestionnaireAnswerRow, QuestionnaireQuestion } from "@/lib/questionnaires/types";

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildQuestionnaireResultsCsv(input: {
  locale: string;
  questions: QuestionnaireQuestion[];
  responses: Array<{ id: string; submittedAt: string; label: string }>;
  answersByResponse: Record<string, QuestionnaireAnswerRow[]>;
}): string {
  const questions = [...input.questions].sort((a, b) => a.position - b.position);
  const header = ["submitted_at", "respondent", ...questions.map((q) => pickI18n(q.promptI18n, input.locale))];
  const lines = [header.map(csvCell).join(",")];
  for (const response of input.responses) {
    const answers = input.answersByResponse[response.id] ?? [];
    const cells = [
      response.submittedAt,
      response.label,
      ...questions.map((question) => {
        const answer = answers.find((row) => row.questionId === question.id);
        return formatAnswerForCsv({
          questionType: question.questionType,
          valueText: answer?.valueText,
          valueNumber: answer?.valueNumber,
          valueOptions: answer?.valueOptions,
        });
      }),
    ];
    lines.push(cells.map(csvCell).join(","));
  }
  return lines.join("\n");
}
