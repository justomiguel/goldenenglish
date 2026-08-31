import { createAdminClient } from "@/lib/supabase/admin";
import { hasExistingResponse, normalizeRespondentEmail } from "@/lib/questionnaires/hasExistingResponse";
import { loadPublicQuestionnaire } from "@/lib/questionnaires/loadPublicQuestionnaire";
import { validateQuestionnaireAnswers, isValidGuestEmail } from "@/lib/questionnaires/validateAnswers";
import type { QuestionnaireAnswerInput, QuestionnaireSubmitCode } from "@/lib/questionnaires/types";
import type { AppLocale } from "@/lib/i18n/dictionaries";

export async function submitQuestionnaireResponse(input: {
  slug: string;
  locale: AppLocale;
  userId: string | null;
  guestEmail: string | null;
  answers: Record<string, QuestionnaireAnswerInput | undefined>;
}): Promise<{ ok: true } | { ok: false; code: QuestionnaireSubmitCode }> {
  const admin = createAdminClient();
  const loaded = await loadPublicQuestionnaire(admin, input.slug);
  if (!loaded) return { ok: false, code: "not_found" };
  const { questionnaire, questions } = loaded;
  if (questionnaire.status !== "published") return { ok: false, code: "closed" };
  if (questionnaire.visibility === "private" && !input.userId) {
    return { ok: false, code: "login_required" };
  }

  let email: string | null = null;
  if (!input.userId && questionnaire.limitOneResponse) {
    if (!input.guestEmail || !isValidGuestEmail(input.guestEmail)) {
      return { ok: false, code: "validation" };
    }
    email = normalizeRespondentEmail(input.guestEmail);
  }

  await admin.rpc("lock_questionnaire_for_submit", { p_id: questionnaire.id });

  if (questionnaire.limitOneResponse) {
    const { data: existing } = await admin
      .from("questionnaire_responses")
      .select("respondent_user_id, respondent_email")
      .eq("questionnaire_id", questionnaire.id)
      .limit(2000);
    const rows = ((existing ?? []) as Record<string, unknown>[]).map((row) => ({
      respondentUserId: row.respondent_user_id ? String(row.respondent_user_id) : null,
      respondentEmail: row.respondent_email ? String(row.respondent_email) : null,
    }));
    if (hasExistingResponse(rows, { userId: input.userId, email })) {
      return { ok: false, code: "already_submitted" };
    }
  }

  const validated = validateQuestionnaireAnswers({
    locale: input.locale,
    questions,
    answers: input.answers,
  });
  if (!validated.ok) return validated;

  const { data: response, error: insertError } = await admin
    .from("questionnaire_responses")
    .insert({
      questionnaire_id: questionnaire.id,
      respondent_user_id: input.userId,
      respondent_email: email,
      locale: input.locale,
    })
    .select("id")
    .single();
  if (insertError || !response) return { ok: false, code: "closed" };

  if (validated.rows.length > 0) {
    const { error: answersError } = await admin.from("questionnaire_answers").insert(
      validated.rows.map((row) => ({
        response_id: (response as { id: string }).id,
        question_id: row.questionId,
        value_text: row.valueText ?? null,
        value_number: row.valueNumber ?? null,
        value_options: row.valueOptions ?? null,
      })),
    );
    if (answersError) return { ok: false, code: "closed" };
  }
  return { ok: true };
}
