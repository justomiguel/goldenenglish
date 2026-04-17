import type { SupabaseClient } from "@supabase/supabase-js";
import { sectionAttendanceCyclePresentPct } from "@/lib/academics/sectionAttendanceMonthPct";
import { chunkedIn } from "@/lib/supabase/chunkedIn";

export type ParentChildLastGrade = {
  score: number;
  maxScore: number;
  assessmentName: string;
  assessmentOn: string;
};

export type ParentChildSummary = {
  studentId: string;
  firstName: string;
  lastName: string;
  attendancePercent: number | null;
  levelLabel: string | null;
  nextExamAt: string | null;
  nextEventAt: string | null;
  nextEventLabel: string | null;
  assignedTeacherId: string | null;
  assignedTeacherName: string | null;
  lastPublishedGrade: ParentChildLastGrade | null;
};

type AssessmentMeta = { name: string; max_score: number | string; assessment_on: string };
type GradeRow = {
  enrollment_id: string;
  score: number | string;
  cohort_assessments: AssessmentMeta | AssessmentMeta[] | null;
};

function parseAssessment(raw: AssessmentMeta | AssessmentMeta[] | null): AssessmentMeta | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export async function loadParentChildrenSummaries(
  supabase: SupabaseClient,
  tutorId: string,
): Promise<ParentChildSummary[]> {
  const { data: links } = await supabase
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", tutorId);

  const ids = (links ?? []).map((l) => l.student_id as string);
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, next_exam_at, student_portal_next_event_at, student_portal_next_event_label, assigned_teacher_id",
    )
    .in("id", ids);

  const teacherIds = [
    ...new Set(
      (profiles ?? [])
        .map((p) => p.assigned_teacher_id as string | null)
        .filter((x): x is string => typeof x === "string" && x.length > 0),
    ),
  ];
  const teacherNameById = new Map<string, string>();
  if (teacherIds.length) {
    const { data: teachers } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", teacherIds)
      .eq("role", "teacher");
    for (const t of teachers ?? []) {
      teacherNameById.set(
        t.id as string,
        `${t.first_name as string} ${t.last_name as string}`.trim(),
      );
    }
  }

  const out: ParentChildSummary[] = [];

  for (const p of profiles ?? []) {
    const sid = p.id as string;

    const { data: activeEnr } = await supabase
      .from("section_enrollments")
      .select("id")
      .eq("student_id", sid)
      .eq("status", "active");

    const enrollmentIds = (activeEnr ?? []).map((r) => r.id as string);
    let attendancePercent: number | null = null;
    let lastPublishedGrade: ParentChildLastGrade | null = null;
    if (enrollmentIds.length > 0) {
      const attRows = await chunkedIn<{ attended_on: string; status: string }>(
        supabase,
        "section_attendance",
        "enrollment_id",
        enrollmentIds,
        "attended_on, status",
      );
      attendancePercent = sectionAttendanceCyclePresentPct(attRows);

      const { data: gradeRowsRaw } = await supabase
        .from("enrollment_assessment_grades")
        .select(
          "enrollment_id, score, cohort_assessments(name, max_score, assessment_on)",
        )
        .eq("status", "published")
        .in("enrollment_id", enrollmentIds);
      const gradeRows = (gradeRowsRaw ?? []) as GradeRow[];
      let bestRow: { row: GradeRow; meta: AssessmentMeta } | null = null;
      for (const row of gradeRows) {
        const meta = parseAssessment(row.cohort_assessments);
        if (!meta) continue;
        if (!bestRow || meta.assessment_on > bestRow.meta.assessment_on) {
          bestRow = { row, meta };
        }
      }
      if (bestRow) {
        const score = Number(bestRow.row.score);
        const maxScore = Number(bestRow.meta.max_score);
        if (Number.isFinite(score) && Number.isFinite(maxScore) && maxScore > 0) {
          lastPublishedGrade = {
            score,
            maxScore,
            assessmentName: String(bestRow.meta.name),
            assessmentOn: String(bestRow.meta.assessment_on).slice(0, 10),
          };
        }
      }
    }

    const { data: enr } = await supabase
      .from("enrollments")
      .select("enrolled_at, courses (level, name)")
      .eq("student_id", sid)
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const course = enr?.courses;
    let levelLabel: string | null = null;
    if (course && typeof course === "object" && "level" in course) {
      levelLabel = String((course as { level: string }).level);
    }

    const assignedTeacherId = (p.assigned_teacher_id as string | null) ?? null;
    out.push({
      studentId: sid,
      firstName: p.first_name as string,
      lastName: p.last_name as string,
      attendancePercent,
      levelLabel,
      nextExamAt: p.next_exam_at ? String(p.next_exam_at).slice(0, 10) : null,
      nextEventAt: p.student_portal_next_event_at
        ? String(p.student_portal_next_event_at)
        : null,
      nextEventLabel:
        (p.student_portal_next_event_label as string | null) ?? null,
      assignedTeacherId,
      assignedTeacherName: assignedTeacherId
        ? (teacherNameById.get(assignedTeacherId) ?? null)
        : null,
      lastPublishedGrade,
    });
  }

  return out;
}
