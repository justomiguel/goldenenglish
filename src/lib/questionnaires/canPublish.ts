import type { QuestionnaireQuestionType } from "@/lib/questionnaires/types";

export type PublishQuestionInput = {
  questionType: QuestionnaireQuestionType;
  options: string[];
  archived: boolean;
};

export function canPublishQuestionnaire(
  questions: ReadonlyArray<PublishQuestionInput>,
): { ok: true } | { ok: false; code: "no_questions" | "choice_options" } {
  const active = questions.filter((q) => !q.archived);
  if (active.length === 0) return { ok: false, code: "no_questions" };
  for (const question of active) {
    if (question.questionType !== "single_choice" && question.questionType !== "multi_choice") {
      continue;
    }
    const options = question.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return { ok: false, code: "choice_options" };
  }
  return { ok: true };
}
