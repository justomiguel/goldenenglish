import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { awardStudentBadges } from "@/lib/badges/awardStudentBadges";

/**
 * Resolves `student_id` from `section_enrollments.id` and runs badge evaluation (deduped).
 */
export async function awardStudentBadgesForEnrollments(
  enrollmentIds: string[],
  locale: string,
): Promise<void> {
  const unique = [...new Set(enrollmentIds.filter(Boolean))];
  if (unique.length === 0) return;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("section_enrollments")
      .select("student_id")
      .in("id", unique);
    if (error) {
      logServerException("awardStudentBadgesForEnrollments:select", error, { n: unique.length });
      return;
    }
    const students = [...new Set((data ?? []).map((r) => r.student_id as string))];
    for (const studentId of students) {
      await awardStudentBadges({ studentId, locale });
    }
  } catch (e) {
    logServerException("awardStudentBadgesForEnrollments", e, { n: unique.length });
  }
}
