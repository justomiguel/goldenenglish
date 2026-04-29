import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { computeEligibleBadgesFromCatalog } from "@/lib/badges/evaluateBadgeCatalogEligibility";
import { loadActiveBadgeCatalog } from "@/lib/badges/loadBadgeCatalog";
import { loadStudentBadgeEvaluationData } from "@/lib/badges/loadStudentBadgeEvaluationData";
import { recordStudentBadgeEarnedEvent } from "@/lib/analytics/server/recordStudentBadgeEarnedEvent";

export type AwardStudentBadgesInput = {
  studentId: string;
  /** When set, revalidates student dashboard and badges pages. */
  locale?: string;
};

/**
 * Evaluates active catalog rules, inserts new `student_badge_grants` via service role,
 * emits analytics. Idempotent. Pauses (`is_active = false`) skip eligible badges,
 * but already-granted ones remain visible to the student.
 */
export async function awardStudentBadges(input: AwardStudentBadgesInput): Promise<void> {
  const { studentId, locale } = input;
  try {
    const admin = createAdminClient();
    const { data: existing, error: exErr } = await admin
      .from("student_badge_grants")
      .select("badge_code")
      .eq("student_id", studentId);
    if (exErr) {
      logServerException("awardStudentBadges:selectExisting", exErr, { studentId });
      return;
    }
    const have = new Set((existing ?? []).map((r) => r.badge_code as string));
    const [ctx, catalog] = await Promise.all([
      loadStudentBadgeEvaluationData(studentId),
      loadActiveBadgeCatalog(),
    ]);
    const eligible = computeEligibleBadgesFromCatalog(ctx, catalog).filter(
      (entry) => !have.has(entry.code),
    );
    if (eligible.length === 0) return;

    for (const entry of eligible) {
      const { error } = await admin.from("student_badge_grants").insert({
        student_id: studentId,
        badge_code: entry.code,
        badge_id: entry.id,
      });
      if (error) {
        logServerException("awardStudentBadges:insert", error, {
          studentId,
          badge_code: entry.code,
        });
        continue;
      }
      await recordStudentBadgeEarnedEvent({ userId: studentId, badgeCode: entry.code });
    }
    if (locale) revalidateStudentBadgePaths(locale);
  } catch (e) {
    logServerException("awardStudentBadges", e, { studentId });
  }
}

function revalidateStudentBadgePaths(locale: string) {
  revalidatePath(`/${locale}/dashboard/student/badges`);
  revalidatePath(`/${locale}/dashboard/student`);
}
