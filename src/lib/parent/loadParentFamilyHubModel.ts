import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParentHubModel } from "@/types/parentHub";
import { loadFamilyHubModelForStudentIds } from "@/lib/parent/loadFamilyHubModelForStudentIds";

export async function loadParentFamilyHubModel(
  supabase: SupabaseClient,
  tutorId: string,
  locale: string,
  icsEventTitle: string,
): Promise<ParentHubModel> {
  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId);
  const ids = [...new Set((links ?? []).map((l) => l.student_id as string))];
  return loadFamilyHubModelForStudentIds(supabase, ids, locale, icsEventTitle);
}
