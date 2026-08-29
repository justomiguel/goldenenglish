import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function loadParentIdsForActiveSection(
  admin: SupabaseClient,
  sectionId: string,
): Promise<string[]> {
  const sid = sectionId.trim();
  if (!sid) return [];

  const enroll = await admin
    .from("section_enrollments")
    .select("student_id")
    .eq("section_id", sid)
    .eq("status", "active");
  if (enroll.error) {
    logSupabaseClientError("loadParentIdsForActiveSection:enrollments", enroll.error, { sectionId: sid });
    return [];
  }
  const studentIds = [
    ...new Set((enroll.data ?? []).map((r) => String((r as { student_id: string }).student_id))),
  ];
  if (studentIds.length === 0) return [];

  const rels = await admin.from("tutor_student_rel").select("tutor_id").in("student_id", studentIds);
  if (rels.error) {
    logSupabaseClientError("loadParentIdsForActiveSection:rels", rels.error, { sectionId: sid });
    return [];
  }
  return [...new Set((rels.data ?? []).map((r) => String((r as { tutor_id: string }).tutor_id)))];
}
