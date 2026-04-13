import type { SupabaseClient } from "@supabase/supabase-js";
import type { RubricDimensionDef } from "@/types/rubricDimensions";
import {
  defaultRubricDimensionsFromI18n,
  parseCohortRubricDimensionsJson,
} from "@/lib/academics/cohortRubricDimensions";

export async function loadRubricDimensionsForCohort(
  supabase: SupabaseClient,
  cohortId: string,
  i18nCriteriaLabels: Record<string, string>,
): Promise<RubricDimensionDef[]> {
  const { data } = await supabase
    .from("academic_cohorts")
    .select("rubric_dimensions")
    .eq("id", cohortId)
    .maybeSingle();
  const raw = data && typeof data === "object" && "rubric_dimensions" in data ? (data as { rubric_dimensions: unknown }).rubric_dimensions : null;
  const parsed = parseCohortRubricDimensionsJson(raw);
  if (parsed.length) return parsed;
  return defaultRubricDimensionsFromI18n(i18nCriteriaLabels);
}
