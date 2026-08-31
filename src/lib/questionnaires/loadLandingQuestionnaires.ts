import type { SupabaseClient } from "@supabase/supabase-js";
import { pickI18n } from "@/lib/questionnaires/pickI18n";
import { asI18nMap } from "@/lib/questionnaires/mapRows";
import type { QuestionnaireVisibility } from "@/lib/questionnaires/types";

export type LandingQuestionnaireCard = {
  slug: string;
  title: string;
  visibility: QuestionnaireVisibility;
};

export async function loadLandingQuestionnaires(
  supabase: SupabaseClient,
  locale: string,
): Promise<LandingQuestionnaireCard[]> {
  const { data, error } = await supabase
    .from("questionnaires")
    .select("slug, title_i18n, visibility")
    .eq("status", "published")
    .is("archived_at", null)
    .eq("show_on_landing", true)
    .order("published_at", { ascending: false })
    .limit(12);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    slug: String(row.slug),
    title: pickI18n(asI18nMap(row.title_i18n), locale),
    visibility: row.visibility as QuestionnaireVisibility,
  }));
}
