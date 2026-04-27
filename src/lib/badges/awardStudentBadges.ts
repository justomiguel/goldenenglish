import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { computeEligibleStudentBadgeCodes } from "@/lib/badges/badgeEligibility";
import { loadStudentBadgeEvaluationData } from "@/lib/badges/loadStudentBadgeEvaluationData";
import { recordStudentBadgeEarnedEvent } from "@/lib/analytics/server/recordStudentBadgeEarnedEvent";

export type AwardStudentBadgesInput = {
  studentId: string;
  /** When set, revalidates student dashboard and badges pages. */
  locale?: string;
};

/**
 * Evaluates rules, inserts new `student_badge_grants` via service role, emits analytics. Idempotent.
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
    const ctx = await loadStudentBadgeEvaluationData(studentId);
    const eligible = computeEligibleStudentBadgeCodes(ctx);
    const toInsert = eligible.filter((c) => !have.has(c));
    if (toInsert.length === 0) return;

    for (const badge_code of toInsert) {
      const { error } = await admin.from("student_badge_grants").insert({ student_id: studentId, badge_code });
      if (error) {
        logServerException("awardStudentBadges:insert", error, { studentId, badge_code });
        continue;
      }
      await recordStudentBadgeEarnedEvent({ userId: studentId, badgeCode: badge_code });
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
