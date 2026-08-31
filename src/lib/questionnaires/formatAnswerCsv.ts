import type { QuestionnaireQuestionType } from "@/lib/questionnaires/types";

export function formatAnswerForCsv(input: {
  questionType: QuestionnaireQuestionType;
  valueText?: string;
  valueNumber?: number;
  valueOptions?: string[];
}): string {
  if (input.questionType === "multi_choice") {
    return (input.valueOptions ?? []).join("; ");
  }
  if (input.questionType === "number" || input.questionType === "scale") {
    return input.valueNumber == null ? "" : String(input.valueNumber);
  }
  return String(input.valueText ?? "");
}
