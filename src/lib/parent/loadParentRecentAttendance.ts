import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRecentAttendanceForStudentIds } from "@/lib/parent/loadRecentAttendanceForStudentIds";

export type {
  ParentAttendanceMark,
  ParentAttendanceChildOption,
  ParentRecentAttendanceModel,
} from "@/lib/parent/loadRecentAttendanceForStudentIds";

export async function loadParentRecentAttendance(
  supabase: SupabaseClient,
  tutorId: string,
) {
  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId);
  const studentIds = (links ?? []).map((l) => l.student_id as string);
  return loadRecentAttendanceForStudentIds(supabase, studentIds);
}
