import type { SupabaseClient } from "@supabase/supabase-js";
import { pickI18n } from "@/lib/questionnaires/pickI18n";
import { mapQuestion, mapQuestionnaire } from "@/lib/questionnaires/mapRows";
import type { QuestionnaireQuestion, QuestionnaireRecord } from "@/lib/questionnaires/types";

export type AdminQuestionnaireListRow = QuestionnaireRecord & {
  title: string;
  responseCount: number;
};

export async function loadAdminQuestionnaireList(
  supabase: SupabaseClient,
  locale: string,
): Promise<AdminQuestionnaireListRow[]> {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("id, slug, title_i18n, description_i18n, status, visibility, limit_one_response, show_on_landing, published_at, archived_at")
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  const rows = data as Record<string, unknown>[];
  const ids = rows.map((row) => String(row.id));
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: responses } = await supabase
      .from("questionnaire_responses")
      .select("questionnaire_id")
      .in("questionnaire_id", ids)
      .limit(5000);
    for (const row of responses ?? []) {
      const id = String((row as { questionnaire_id: string }).questionnaire_id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return rows.map((row) => {
    const mapped = mapQuestionnaire(row);
    return {
      ...mapped,
      title: pickI18n(mapped.titleI18n, locale),
      responseCount: counts.get(mapped.id) ?? 0,
    };
  });
}

export async function loadAdminQuestionnaireDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<{ questionnaire: QuestionnaireRecord; questions: QuestionnaireQuestion[] } | null> {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const { data: questionRows } = await supabase
    .from("questionnaire_questions")
    .select("*")
    .eq("questionnaire_id", id)
    .order("position", { ascending: true })
    .limit(80);
  return {
    questionnaire: mapQuestionnaire(data as Record<string, unknown>),
    questions: ((questionRows ?? []) as Record<string, unknown>[]).map(mapQuestion),
  };
}
