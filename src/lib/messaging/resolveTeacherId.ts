import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns assigned teacher or the first teacher profile in the institute (fallback).
 */
export async function resolveTeacherIdForStudent(
  supabase: SupabaseClient,
  studentId: string,
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("assigned_teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  const assigned = profile?.assigned_teacher_id;
  if (assigned && typeof assigned === "string") {
    const { data: t } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assigned)
      .eq("role", "teacher")
      .maybeSingle();
    if (t?.id) return t.id as string;
  }

  const { data: first } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .limit(1)
    .maybeSingle();

  return (first?.id as string | undefined) ?? null;
}
