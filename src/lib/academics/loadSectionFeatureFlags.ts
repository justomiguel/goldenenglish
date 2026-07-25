import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { AcademicSectionFeatureFlags } from "@/lib/academics/visibleAcademicSectionShellTabs";

export async function loadSectionFeatureFlags(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<AcademicSectionFeatureFlags | null> {
  const { data, error } = await supabase
    .from("academic_sections")
    .select("requires_evaluations_to_pass, uses_learning_route")
    .eq("id", sectionId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("loadSectionFeatureFlags", error, { sectionId });
    return null;
  }
  if (!data) return null;
  const row = data as {
    requires_evaluations_to_pass?: boolean | null;
    uses_learning_route?: boolean | null;
  };
  return {
    requiresEvaluationsToPass: row.requires_evaluations_to_pass === true,
    usesLearningRoute: row.uses_learning_route === true,
  };
}
