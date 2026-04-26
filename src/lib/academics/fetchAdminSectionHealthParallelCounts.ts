import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import {
  ADMIN_SECTION_HEALTH_CHUNK,
  adminSectionHealthIsoDaysAgo,
  countAttendanceByEnrollmentChunk,
} from "@/lib/academics/adminSectionHealthSnapshotChunk";

const EVENT_LOOKBACK_DAYS = 30;

export type AdminSectionHealthParallelCounts = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  cohortAssessmentCountRes: { count: number | null; error: Error | null };
  publishedGradeCount: number;
  taskInstancesRes: { count: number | null; error: Error | null };
  sumPointsRes: { data: { engagement_points: number | null }[]; error: null };
  materialViewsCount: number;
  learningEventsCount: number;
};

export async function fetchAdminSectionHealthParallelCounts(
  supabase: SupabaseClient,
  input: {
    sectionId: string;
    cohortId: string;
    activeEnrollmentIds: string[];
    activeStudentIds: string[];
  },
): Promise<AdminSectionHealthParallelCounts> {
  const { sectionId, cohortId, activeEnrollmentIds, activeStudentIds } = input;
  const sinceIso = adminSectionHealthIsoDaysAgo(EVENT_LOOKBACK_DAYS);
  const chunk = ADMIN_SECTION_HEALTH_CHUNK;

  const [
    present,
    absent,
    late,
    excused,
    cohortAssessmentCountRes,
    publishedGradeCountRes,
    taskInstancesRes,
    sumPointsRes,
    materialViewsRes,
    learningEventsRes,
  ] = await Promise.all([
    countAttendanceByEnrollmentChunk(supabase, activeEnrollmentIds, "present", chunk),
    countAttendanceByEnrollmentChunk(supabase, activeEnrollmentIds, "absent", chunk),
    countAttendanceByEnrollmentChunk(supabase, activeEnrollmentIds, "late", chunk),
    countAttendanceByEnrollmentChunk(supabase, activeEnrollmentIds, "excused", chunk),
    supabase.from("cohort_assessments").select("id", { count: "exact", head: true }).eq("cohort_id", cohortId),
    activeEnrollmentIds.length === 0
      ? Promise.resolve({ count: 0, error: null })
      : (async () => {
          let c = 0;
          for (let i = 0; i < activeEnrollmentIds.length; i += chunk) {
            const batch = activeEnrollmentIds.slice(i, i + chunk);
            const { count, error } = await supabase
              .from("enrollment_assessment_grades")
              .select("id", { count: "exact", head: true })
              .eq("status", "published")
              .in("enrollment_id", batch);
            if (error) {
              logSupabaseClientError("loadAdminSectionHealthSnapshot:publishedGrades", error, {});
              continue;
            }
            c += count ?? 0;
          }
          return { count: c, error: null };
        })(),
    supabase
      .from("task_instances")
      .select("id", { count: "exact", head: true })
      .eq("section_id", sectionId)
      .is("archived_at", null),
    activeStudentIds.length === 0
      ? Promise.resolve({ data: [] as { engagement_points: number | null }[], error: null })
      : (async () => {
          const rows: { engagement_points: number | null }[] = [];
          for (let i = 0; i < activeStudentIds.length; i += chunk) {
            const batch = activeStudentIds.slice(i, i + chunk);
            const { data, error } = await supabase.from("profiles").select("engagement_points").in("id", batch);
            if (error) {
              logSupabaseClientError("loadAdminSectionHealthSnapshot:profilesPoints", error, {});
              continue;
            }
            rows.push(...((data ?? []) as { engagement_points: number | null }[]));
          }
          return { data: rows, error: null };
        })(),
    activeStudentIds.length === 0
      ? Promise.resolve({ count: 0, error: null })
      : (async () => {
          let c = 0;
          for (let i = 0; i < activeStudentIds.length; i += chunk) {
            const batch = activeStudentIds.slice(i, i + chunk);
            const { count, error } = await supabase
              .from("user_events")
              .select("id", { count: "exact", head: true })
              .in("user_id", batch)
              .gte("created_at", sinceIso)
              .like("entity", "material:%");
            if (error) {
              logSupabaseClientError("loadAdminSectionHealthSnapshot:materialViews", error, {});
              continue;
            }
            c += count ?? 0;
          }
          return { count: c, error: null };
        })(),
    activeStudentIds.length === 0
      ? Promise.resolve({ count: 0, error: null })
      : (async () => {
          let c = 0;
          for (let i = 0; i < activeStudentIds.length; i += chunk) {
            const batch = activeStudentIds.slice(i, i + chunk);
            const { count, error } = await supabase
              .from("user_events")
              .select("id", { count: "exact", head: true })
              .in("user_id", batch)
              .gte("created_at", sinceIso)
              .eq("entity", AnalyticsEntity.learningTasks);
            if (error) {
              logSupabaseClientError("loadAdminSectionHealthSnapshot:learningEvents", error, {});
              continue;
            }
            c += count ?? 0;
          }
          return { count: c, error: null };
        })(),
  ]);

  return {
    present,
    absent,
    late,
    excused,
    cohortAssessmentCountRes,
    publishedGradeCount: (publishedGradeCountRes as { count: number }).count ?? 0,
    taskInstancesRes,
    sumPointsRes,
    materialViewsCount: (materialViewsRes as { count: number }).count ?? 0,
    learningEventsCount: (learningEventsRes as { count: number }).count ?? 0,
  };
}
