import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertCanEditClassReminderPrefs(
  supabase: SupabaseClient,
  actorId: string,
  studentId: string,
): Promise<boolean> {
  if (actorId === studentId) {
    const { data } = await supabase.from("profiles").select("is_minor").eq("id", studentId).maybeSingle();
    return !Boolean((data as { is_minor?: boolean } | null)?.is_minor);
  }
  const { data: link } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", actorId)
    .eq("student_id", studentId)
    .maybeSingle();
  return Boolean(link);
}
