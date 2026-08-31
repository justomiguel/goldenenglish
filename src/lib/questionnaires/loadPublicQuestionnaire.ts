import type { SupabaseClient } from "@supabase/supabase-js";
import { mapQuestion, mapQuestionnaire } from "@/lib/questionnaires/mapRows";
import type { QuestionnaireQuestion, QuestionnaireRecord } from "@/lib/questionnaires/types";

export async function loadPublicQuestionnaire(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ questionnaire: QuestionnaireRecord; questions: QuestionnaireQuestion[] } | null> {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("slug", slug)
    .is("archived_at", null)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const questionnaire = mapQuestionnaire(data as Record<string, unknown>);
  const { data: questionRows } = await supabase
    .from("questionnaire_questions")
    .select("*")
    .eq("questionnaire_id", questionnaire.id)
    .is("archived_at", null)
    .order("position", { ascending: true })
    .limit(50);
  return {
    questionnaire,
    questions: ((questionRows ?? []) as Record<string, unknown>[]).map(mapQuestion),
  };
}

export async function loadResponsesForLimitCheck(
  supabase: SupabaseClient,
  questionnaireId: string,
): Promise<Array<{ respondentUserId: string | null; respondentEmail: string | null }>> {
  const { data } = await supabase
    .from("questionnaire_responses")
    .select("respondent_user_id, respondent_email")
    .eq("questionnaire_id", questionnaireId)
    .limit(2000);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    respondentUserId: row.respondent_user_id ? String(row.respondent_user_id) : null,
    respondentEmail: row.respondent_email ? String(row.respondent_email) : null,
  }));
}
