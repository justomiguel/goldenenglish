import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { aggregateQuestionnaireResults, type QuestionResultBlock } from "@/lib/questionnaires/aggregateResults";
import { mapQuestion } from "@/lib/questionnaires/mapRows";
import { questionnaireRespondentLabel } from "@/lib/questionnaires/respondentLabel";
import type { QuestionnaireAnswerRow, QuestionnaireQuestion } from "@/lib/questionnaires/types";

export type ResultsResponseRow = {
  id: string;
  submittedAt: string;
  label: string;
};

export type QuestionnaireResultsModel = {
  responseCount: number;
  lastSubmittedAt: string | null;
  blocks: QuestionResultBlock[];
  responses: ResultsResponseRow[];
  questions: QuestionnaireQuestion[];
  answersByResponse: Record<string, QuestionnaireAnswerRow[]>;
};

export async function loadQuestionnaireResults(
  supabase: SupabaseClient,
  questionnaireId: string,
  locale: string,
  anonymousLabel: string,
): Promise<QuestionnaireResultsModel> {
  const [{ data: questionRows }, { data: responseRows }] = await Promise.all([
    supabase
      .from("questionnaire_questions")
      .select("*")
      .eq("questionnaire_id", questionnaireId)
      .order("position", { ascending: true })
      .limit(80),
    supabase
      .from("questionnaire_responses")
      .select("id, submitted_at, respondent_user_id, respondent_email")
      .eq("questionnaire_id", questionnaireId)
      .order("submitted_at", { ascending: false })
      .limit(500),
  ]);
  const questions = ((questionRows ?? []) as Record<string, unknown>[]).map(mapQuestion);
  const responsesRaw = (responseRows ?? []) as Record<string, unknown>[];
  const userIds = [
    ...new Set(responsesRaw.map((r) => r.respondent_user_id).filter(Boolean).map(String)),
  ];
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds)
      .limit(500);
    for (const profile of profiles ?? []) {
      const row = profile as { id: string; first_name: string | null; last_name: string | null };
      names.set(row.id, formatProfileNameSurnameFirst(row.first_name, row.last_name));
    }
  }
  const responseIds = responsesRaw.map((r) => String(r.id));
  const { data: answerRows } =
    responseIds.length > 0
      ? await supabase
          .from("questionnaire_answers")
          .select("response_id, question_id, value_text, value_number, value_options")
          .in("response_id", responseIds)
          .limit(4000)
      : { data: [] };
  const answersByResponse: Record<string, QuestionnaireAnswerRow[]> = {};
  const flatAnswers: QuestionnaireAnswerRow[] = [];
  for (const raw of (answerRows ?? []) as Record<string, unknown>[]) {
    const row: QuestionnaireAnswerRow = {
      questionId: String(raw.question_id),
      valueText: raw.value_text ? String(raw.value_text) : undefined,
      valueNumber: typeof raw.value_number === "number" ? raw.value_number : undefined,
      valueOptions: Array.isArray(raw.value_options) ? raw.value_options.map(String) : undefined,
    };
    const responseId = String(raw.response_id);
    answersByResponse[responseId] = [...(answersByResponse[responseId] ?? []), row];
    flatAnswers.push(row);
  }
  const responses = responsesRaw.map((row) => {
    const userId = row.respondent_user_id ? String(row.respondent_user_id) : null;
    return {
      id: String(row.id),
      submittedAt: String(row.submitted_at),
      label: questionnaireRespondentLabel(
        {
          userId,
          email: row.respondent_email ? String(row.respondent_email) : null,
          displayName: userId ? names.get(userId) ?? null : null,
        },
        anonymousLabel,
      ),
    };
  });
  return {
    responseCount: responses.length,
    lastSubmittedAt: responses[0]?.submittedAt ?? null,
    blocks: aggregateQuestionnaireResults({
      locale,
      responseCount: responses.length,
      questions,
      answers: flatAnswers,
    }),
    responses,
    questions,
    answersByResponse,
  };
}
