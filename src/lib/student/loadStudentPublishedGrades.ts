import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/types/i18n";
import type { StudentGradeRubricPoint, StudentHubPublishedGrade } from "@/types/studentHub";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  defaultRubricDimensionsFromI18n,
  parseCohortRubricDimensionsJson,
} from "@/lib/academics/cohortRubricDimensions";
import type { RubricDimensionDef } from "@/types/rubricDimensions";

function parseRubricObject(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}

function labelsForRubric(rubric: Record<string, number>, dimensions: RubricDimensionDef[]): Record<string, string> {
  const m = new Map(dimensions.map((d) => [d.key, d.label]));
  const o: Record<string, string> = {};
  for (const k of Object.keys(rubric)) {
    o[k] = m.get(k) ?? k;
  }
  return o;
}

function radarFromRubric(rubric: Record<string, number>, dimensions: RubricDimensionDef[]): StudentGradeRubricPoint[] {
  return dimensions
    .filter((d) => typeof rubric[d.key] === "number" && Number.isFinite(rubric[d.key]))
    .map((d) => ({
      subjectLabel: d.label,
      value: rubric[d.key] as number,
      fullMark: d.scaleMax,
    }));
}

export async function loadStudentPublishedGrades(
  supabase: SupabaseClient,
  enrollmentIds: string[],
  enrollmentToCohortId: Map<string, string>,
  enrollmentToSectionName: Map<string, string>,
  locale: string,
): Promise<StudentHubPublishedGrade[]> {
  if (!enrollmentIds.length) return [];
  const loc = (locale === "es" ? "es" : "en") as Locale;
  const dict = await getDictionary(loc);
  const dimLabels = dict.dashboard.student.grades.dimensionLabels as unknown as Record<string, string>;

  const uniqueCohortIds = [...new Set(Array.from(enrollmentToCohortId.values()))];
  const cohortDims = new Map<string, RubricDimensionDef[]>();
  if (uniqueCohortIds.length) {
    const { data: cohortRows } = await supabase
      .from("academic_cohorts")
      .select("id, rubric_dimensions")
      .in("id", uniqueCohortIds);
    for (const c of cohortRows ?? []) {
      const id = c.id as string;
      const raw = (c as { rubric_dimensions?: unknown }).rubric_dimensions;
      const parsed = parseCohortRubricDimensionsJson(raw);
      cohortDims.set(id, parsed.length ? parsed : defaultRubricDimensionsFromI18n(dimLabels));
    }
  }

  const { data: gRows } = await supabase
    .from("enrollment_assessment_grades")
    .select(
      "enrollment_id, assessment_id, score, rubric_data, teacher_feedback, cohort_assessments ( name, max_score, assessment_on, cohort_id )",
    )
    .eq("status", "published")
    .in("enrollment_id", enrollmentIds);

  type Row = {
    enrollment_id: string;
    assessment_id: string;
    score: number | string;
    rubric_data: unknown;
    teacher_feedback: string | null;
    cohort_assessments:
      | { name: string; max_score: number | string; assessment_on: string; cohort_id: string }
      | { name: string; max_score: number | string; assessment_on: string; cohort_id: string }[]
      | null;
  };

  const out: StudentHubPublishedGrade[] = [];
  for (const row of (gRows ?? []) as Row[]) {
    const asmt = Array.isArray(row.cohort_assessments) ? row.cohort_assessments[0] : row.cohort_assessments;
    if (!asmt) continue;
    const cohortId = asmt.cohort_id || enrollmentToCohortId.get(row.enrollment_id) || "";
    let dimensions = cohortDims.get(cohortId);
    if (!dimensions?.length) {
      dimensions = defaultRubricDimensionsFromI18n(dimLabels);
      if (cohortId) cohortDims.set(cohortId, dimensions);
    }

    const rubricData = parseRubricObject(row.rubric_data);
    const rubricLabels = labelsForRubric(rubricData, dimensions);
    const radarPoints = radarFromRubric(rubricData, dimensions);
    const score = Number(row.score);

    out.push({
      enrollmentId: row.enrollment_id,
      assessmentId: row.assessment_id,
      sectionName: enrollmentToSectionName.get(row.enrollment_id) ?? "",
      assessmentName: String(asmt.name),
      assessmentOn: String(asmt.assessment_on),
      maxScore: Number(asmt.max_score),
      score: Number.isFinite(score) ? score : 0,
      rubricData,
      rubricLabels,
      radarPoints,
      teacherFeedback: row.teacher_feedback,
    });
  }

  return out.sort((a, b) => (a.assessmentOn < b.assessmentOn ? 1 : -1));
}
