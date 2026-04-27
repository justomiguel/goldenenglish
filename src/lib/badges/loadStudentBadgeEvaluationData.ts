import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { StudentBadgeEvaluationContext } from "@/lib/badges/badgeEligibility";

const GOOD_ATTENDANCE = ["present", "late", "excused"] as const;

/**
 * Loads inputs for badge rules using the service role (invoked only from trusted server).
 */
export async function loadStudentBadgeEvaluationData(
  studentId: string,
): Promise<StudentBadgeEvaluationContext> {
  const supabase = createAdminClient();

  const [taskRes, attRes, profile, passedRes] = await Promise.all([
    supabase
      .from("student_task_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .in("status", ["COMPLETED", "COMPLETED_LATE"]),
    supabase
      .from("section_attendance")
      .select("attended_on, status, section_enrollments!inner(student_id)")
      .eq("section_enrollments.student_id", studentId)
      .in("status", [...GOOD_ATTENDANCE]),
    supabase
      .from("profiles")
      .select("phone, birth_date, avatar_url")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("student_assessment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("passed", true),
  ]);

  if (taskRes.error) {
    logSupabaseClientError("loadStudentBadgeEvaluationData:tasks", taskRes.error, { studentId });
  }
  if (attRes.error) {
    logSupabaseClientError("loadStudentBadgeEvaluationData:att", attRes.error, { studentId });
  }
  if (passedRes.error) {
    logSupabaseClientError("loadStudentBadgeEvaluationData:attempts", passedRes.error, { studentId });
  }
  if (profile.error) {
    logSupabaseClientError("loadStudentBadgeEvaluationData:profile", profile.error, { studentId });
  }

  const completedTaskCount = taskRes.error ? 0 : (taskRes.count ?? 0);
  const passedAssessmentCount = passedRes.error ? 0 : (passedRes.count ?? 0);

  const byDay = new Map<string, true>();
  for (const row of (attRes.error ? [] : attRes.data) ?? []) {
    const d = String((row as { attended_on: string }).attended_on);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      byDay.set(d, true);
    }
  }
  const goodAttendanceDatesSorted = [...byDay.keys()].sort();

  const p = (profile.error ? null : profile.data) as
    | { phone: string | null; birth_date: string | null; avatar_url: string | null }
    | null;

  return {
    completedTaskCount,
    goodAttendanceDatesSorted,
    profile: {
      phone: p?.phone ?? null,
      birth_date: p?.birth_date != null ? String(p.birth_date) : null,
      avatar_url: p?.avatar_url ?? null,
    },
    passedAssessmentCount,
  };
}
