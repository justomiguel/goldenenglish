"use server";

import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";
import { loadQuestionnaireResults } from "@/lib/questionnaires/loadQuestionnaireResults";
import { buildQuestionnaireResultsCsv } from "@/lib/questionnaires/buildResultsCsv";

export async function downloadQuestionnaireCsvAction(input: {
  locale: string;
  questionnaireId: string;
  anonymousLabel: string;
}): Promise<{ ok: true; csv: string } | { ok: false }> {
  let session: Awaited<ReturnType<typeof assertAdmin>>;
  try {
    session = await assertAdmin();
  } catch {
    logServerAuthzDenied("downloadQuestionnaireCsvAction");
    return { ok: false };
  }
  const model = await loadQuestionnaireResults(
    session.supabase,
    input.questionnaireId,
    input.locale,
    input.anonymousLabel,
  );
  return {
    ok: true,
    csv: buildQuestionnaireResultsCsv({
      locale: input.locale,
      questions: model.questions,
      responses: model.responses,
      answersByResponse: model.answersByResponse,
    }),
  };
}
