import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { AdminSectionHealthLearningRoute, AdminSectionHealthSnapshot } from "@/types/adminSectionHealth";
import {
  computeAssessmentCoveragePct,
  computeAttendanceRatePct,
  computeCapacityUtilizationPct,
} from "@/lib/academics/adminSectionHealthMetrics";
import { fetchAdminSectionHealthParallelCounts } from "@/lib/academics/fetchAdminSectionHealthParallelCounts";
import { loadAdminSectionHealthTaskProgress } from "@/lib/academics/loadAdminSectionHealthTaskProgress";

export async function loadAdminSectionHealthSnapshot(
  supabase: SupabaseClient,
  input: {
    sectionId: string;
    cohortId: string;
    effectiveMaxStudents: number;
    activeEnrollmentIds: string[];
    activeStudentIds: string[];
    debtByStudentId: Record<string, boolean>;
    learningRoute: AdminSectionHealthLearningRoute;
  },
): Promise<AdminSectionHealthSnapshot> {
  const {
    sectionId,
    cohortId,
    effectiveMaxStudents,
    activeEnrollmentIds,
    activeStudentIds,
    debtByStudentId,
    learningRoute,
  } = input;

  const activeStudents = activeStudentIds.length;
  const capacityUtilizationPct = computeCapacityUtilizationPct(activeStudents, effectiveMaxStudents);

  let withDebt = 0;
  let withoutDebt = 0;
  for (const sid of activeStudentIds) {
    if (debtByStudentId[sid]) withDebt += 1;
    else withoutDebt += 1;
  }

  const parallel = await fetchAdminSectionHealthParallelCounts(supabase, {
    sectionId,
    cohortId,
    activeEnrollmentIds,
    activeStudentIds,
  });

  if (parallel.cohortAssessmentCountRes.error) {
    logSupabaseClientError("loadAdminSectionHealthSnapshot:cohortAssessments", parallel.cohortAssessmentCountRes.error, {
      cohortId,
    });
  }
  if (parallel.taskInstancesRes.error) {
    logSupabaseClientError("loadAdminSectionHealthSnapshot:taskInstances", parallel.taskInstancesRes.error, { sectionId });
  }

  const cohortAssessmentCount = parallel.cohortAssessmentCountRes.count ?? 0;
  const publishedGradeRows = parallel.publishedGradeCount;
  const taskInstanceTotal = parallel.taskInstancesRes.count ?? 0;

  const ratePct = computeAttendanceRatePct(
    parallel.present,
    parallel.absent,
    parallel.late,
    parallel.excused,
  );

  let sumEngagementPoints = 0;
  for (const r of parallel.sumPointsRes.data ?? []) {
    sumEngagementPoints += Number(r.engagement_points ?? 0);
  }

  const materialViews30d = parallel.materialViewsCount;
  const learningEvents30d = parallel.learningEventsCount;

  const expectedSlots =
    cohortAssessmentCount > 0 && activeStudents > 0 ? cohortAssessmentCount * activeStudents : 0;
  const coveragePct = computeAssessmentCoveragePct(
    publishedGradeRows,
    cohortAssessmentCount,
    activeStudents,
  );

  const { notOpened, opened, completed, progressRows } = await loadAdminSectionHealthTaskProgress(supabase, {
    sectionId,
    activeEnrollmentIds,
    taskInstanceTotal,
  });

  const openOrDonePct =
    progressRows > 0 ? Math.round(((opened + completed) / progressRows) * 100) : null;
  const completedPct = progressRows > 0 ? Math.round((completed / progressRows) * 100) : null;

  return {
    activeStudents,
    effectiveMaxStudents,
    capacityUtilizationPct,
    attendance: {
      present: parallel.present,
      absent: parallel.absent,
      late: parallel.late,
      excused: parallel.excused,
      ratePct,
    },
    tasks: {
      instanceCount: taskInstanceTotal,
      progressRows,
      notOpened,
      opened,
      completed,
      openOrDonePct,
      completedPct,
    },
    payments: { activeWithDebt: withDebt, activeWithoutDebt: withoutDebt },
    engagement: {
      sumEngagementPoints,
      materialViews30d,
      learningEvents30d,
    },
    assessments: {
      cohortAssessmentCount,
      publishedGradeRows,
      expectedSlots,
      coveragePct,
    },
    learningRoute,
  };
}
