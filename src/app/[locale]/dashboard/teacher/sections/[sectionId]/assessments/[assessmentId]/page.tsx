import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { normalizeRubricValuesForDimensions } from "@/lib/academics/cohortRubricDimensions";
import { loadRubricDimensionsForCohort } from "@/lib/academics/loadRubricDimensionsForCohort";
import type { AssessmentMatrixRosterRow, EnrollmentAssessmentGradeStatusDb } from "@/types/assessmentGrades";
import { AssessmentRosterGradingClient } from "@/components/organisms/AssessmentRosterGradingClient";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string; assessmentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.teacherAssessmentMatrix.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function TeacherAssessmentMatrixPage({ params }: PageProps) {
  const { locale, sectionId, assessmentId } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherAssessmentMatrix;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) {
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (isAdmin) redirect(`/${locale}/dashboard/admin/academic`);
    redirect(`/${locale}/dashboard`);
  }

  const { data: section, error: secErr } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, teacher_id")
    .eq("id", sectionId)
    .maybeSingle();
  const canOpen =
    !secErr &&
    section &&
    (await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId));
  if (!canOpen) notFound();

  const cohortId = section.cohort_id as string;

  const { data: asmt, error: aErr } = await supabase
    .from("cohort_assessments")
    .select("id, name, assessment_on, max_score, cohort_id")
    .eq("id", assessmentId)
    .maybeSingle();
  if (aErr || !asmt || (asmt as { cohort_id: string }).cohort_id !== cohortId) notFound();

  const assessment = asmt as {
    id: string;
    name: string;
    assessment_on: string;
    max_score: number | string;
  };
  const maxScore = Number(assessment.max_score);

  const criteria = d.rubric.criteria as unknown as Record<string, string>;
  const dimensions = await loadRubricDimensionsForCohort(supabase, cohortId, criteria);

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, profiles!student_id(first_name,last_name)")
    .eq("section_id", sectionId)
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false });

  const { data: grades } = await supabase
    .from("enrollment_assessment_grades")
    .select("enrollment_id, score, rubric_data, teacher_feedback, status")
    .eq("assessment_id", assessmentId);

  const gradeByEnr = new Map(
    (grades ?? []).map((g) => [
      (g as { enrollment_id: string }).enrollment_id,
      g as {
        score: number | string | null;
        rubric_data: unknown;
        teacher_feedback: string | null;
        status: EnrollmentAssessmentGradeStatusDb;
      },
    ]),
  );

  const raw = (enrollments ?? []) as {
    id: string;
    profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
    student_id: string;
  }[];

  const rosterRows: AssessmentMatrixRosterRow[] = raw.map((r) => {
    const pRaw = r.profiles;
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    const label = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
    const g = gradeByEnr.get(r.id);
    const scoreNum = g?.score != null ? Number(g.score) : null;
    return {
      enrollmentId: r.id,
      studentLabel: label,
      gradeStatus: g?.status ?? null,
      score: scoreNum != null && Number.isFinite(scoreNum) ? scoreNum : null,
      rubric: normalizeRubricValuesForDimensions(g?.rubric_data, dimensions),
      teacherFeedback: g?.teacher_feedback ?? null,
    };
  });

  const dateFmt = new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { dateStyle: "medium" });
  const assessmentDateLabel = dateFmt.format(new Date(`${assessment.assessment_on}T12:00:00`));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}/assessments`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backToAssessments}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{section.name as string}</p>
      </div>

      <AssessmentRosterGradingClient
        locale={locale}
        sectionId={sectionId}
        assessmentId={assessmentId}
        assessmentName={assessment.name}
        assessmentDateLabel={assessmentDateLabel}
        maxScore={maxScore}
        dimensions={dimensions}
        rows={rosterRows}
        dict={d}
      />
    </div>
  );
}
