import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { loadActiveBadgeCatalog } from "@/lib/badges/loadBadgeCatalog";
import { loadStudentBadgeEvaluationData } from "@/lib/badges/loadStudentBadgeEvaluationData";
import {
  buildStudentBadgeDisplayRows,
  type BadgeGrantRow,
} from "@/lib/badges/buildStudentBadgeDisplayRows";
import type { StudentBadgeRowModel } from "@/types/studentBadges";

/**
 * Full achievements list for student/parent UIs (earned + locked with progress).
 */
export async function loadStudentBadgeDisplayRows(
  studentId: string,
  shareUrlForToken: (token: string) => string,
): Promise<StudentBadgeRowModel[]> {
  const admin = createAdminClient();
  const [grantsRes, catalog, ctx] = await Promise.all([
    admin
      .from("student_badge_grants")
      .select("id, badge_code, earned_at, public_share_token")
      .eq("student_id", studentId)
      .order("earned_at", { ascending: false }),
    loadActiveBadgeCatalog(),
    loadStudentBadgeEvaluationData(studentId),
  ]);

  if (grantsRes.error) {
    logSupabaseClientError("loadStudentBadgeDisplayRows:grants", grantsRes.error, { studentId });
  }

  const grants = (grantsRes.data ?? []) as BadgeGrantRow[];

  return buildStudentBadgeDisplayRows({
    catalog,
    grants,
    ctx,
    shareUrlForToken,
  });
}
