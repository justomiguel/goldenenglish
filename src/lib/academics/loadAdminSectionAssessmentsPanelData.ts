import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { chunkedIn } from "@/lib/supabase/chunkedIn";
import type {
  AdminSectionAssessmentsPanelData,
  AdminSectionCohortAssessmentSummary,
  AdminSectionLearningAssessmentSummary,
} from "@/types/adminSectionAssessments";

type LearningRow = {
  id: string;
  title: string;
  assessment_kind: string;
  grading_mode: string;
  passing_score: string | number | null;
  created_at: string;
};

type AttemptAgg = {
  n: number;
  reviewed: number;
  sumScore: number;
  nScores: number;
  passed: number;
};

const LEARNING_ASSESSMENT_CAP = 120;
const COHORT_ASSESSMENT_CAP = 80;

/**
 * Loads learning-route assessments (per section) and cohort rubric exams, with
 * result counts for this section’s active enrollments.
 */
export async function loadAdminSectionAssessmentsPanelData(
  supabase: SupabaseClient,
  sectionId: string,
  cohortId: string,
  activeEnrollmentIds: string[],
): Promise<AdminSectionAssessmentsPanelData> {
  const activeEnrollmentCount = activeEnrollmentIds.length;

  const { data: learningRows, error: lErr } = await supabase
    .from("learning_assessments")
    .select("id, title, assessment_kind, grading_mode, passing_score, created_at")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false })
    .limit(LEARNING_ASSESSMENT_CAP);
  if (lErr) logSupabaseClientError("loadAdminSectionAssessmentsPanel:learning", lErr, { sectionId });
  const learningList = (learningRows ?? []) as LearningRow[];
  const learningIds = learningList.map((r) => r.id);

  const byAss = new Map<string, AttemptAgg>();
  for (const id of learningIds) {
    byAss.set(id, { n: 0, reviewed: 0, sumScore: 0, nScores: 0, passed: 0 });
  }
  if (learningIds.length > 0) {
    const attemptRows = await chunkedIn<{
      assessment_id: string;
      score: string | number | null;
      passed: boolean | null;
      status: string;
    }>(supabase, "student_assessment_attempts", "assessment_id", learningIds, "assessment_id, score, passed, status");
    for (const a of attemptRows) {
      const g = byAss.get(a.assessment_id);
      if (!g) continue;
      g.n += 1;
      if (a.status === "reviewed") g.reviewed += 1;
      if (a.passed === true) g.passed += 1;
      if (a.score != null && a.score !== "") {
        const s = Number(a.score);
        if (!Number.isNaN(s)) {
          g.sumScore += s;
          g.nScores += 1;
        }
      }
    }
  }

  const learning: AdminSectionLearningAssessmentSummary[] = learningList.map((row) => {
    const agg = byAss.get(row.id) ?? { n: 0, reviewed: 0, sumScore: 0, nScores: 0, passed: 0 };
    const passNum = row.passing_score == null || row.passing_score === "" ? null : Number(row.passing_score);
    return {
      id: row.id,
      title: row.title,
      assessmentKind: row.assessment_kind,
      gradingMode: row.grading_mode,
      passingScore: passNum == null || Number.isNaN(passNum) ? null : passNum,
      createdAt: row.created_at,
      attemptCount: agg.n,
      reviewedCount: agg.reviewed,
      avgScore: agg.nScores > 0 ? Math.round((agg.sumScore / agg.nScores) * 10) / 10 : null,
      passedCount: agg.passed,
    };
  });

  const { data: cohortRows, error: cErr } = await supabase
    .from("cohort_assessments")
    .select("id, name, assessment_on, max_score")
    .eq("cohort_id", cohortId)
    .order("assessment_on", { ascending: false })
    .limit(COHORT_ASSESSMENT_CAP);
  if (cErr) logSupabaseClientError("loadAdminSectionAssessmentsPanel:cohort", cErr, { cohortId, sectionId });

  const cohortList = (cohortRows ?? []) as {
    id: string;
    name: string;
    assessment_on: string;
    max_score: string | number;
  }[];
  const cohortIds = cohortList.map((c) => c.id);

  const publishedByCohort = new Map<string, number>();
  for (const cid of cohortIds) publishedByCohort.set(cid, 0);
  if (activeEnrollmentIds.length > 0 && cohortIds.length > 0) {
    const gradeRows = await chunkedIn<{
      assessment_id: string;
      status: string;
    }>(supabase, "enrollment_assessment_grades", "enrollment_id", activeEnrollmentIds, "assessment_id, status");
    for (const g of gradeRows) {
      if (g.status !== "published") continue;
      if (!cohortIds.includes(g.assessment_id)) continue;
      publishedByCohort.set(g.assessment_id, (publishedByCohort.get(g.assessment_id) ?? 0) + 1);
    }
  }

  const cohort: AdminSectionCohortAssessmentSummary[] = cohortList.map((c) => ({
    id: c.id,
    name: c.name,
    assessmentOn: c.assessment_on,
    maxScore: Number(c.max_score) || 0,
    publishedInSection: publishedByCohort.get(c.id) ?? 0,
  }));

  return { learning, cohort, activeEnrollmentCount };
}
