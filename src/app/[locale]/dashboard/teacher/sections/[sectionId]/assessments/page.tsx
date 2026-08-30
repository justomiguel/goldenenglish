import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { CreateCohortAssessmentForm } from "@/components/molecules/CreateCohortAssessmentForm";
import { AssessmentGradingPathStrip } from "@/components/molecules/AssessmentGradingPathStrip";
import { TeacherSectionAssessmentsTable } from "./TeacherSectionAssessmentsTable";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherAssessmentList.metaTitle);
}

export default async function TeacherSectionAssessmentsPage({ params }: PageProps) {
  const { locale, sectionId } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherAssessmentList;
  const pathDict = dict.dashboard.teacherAssessmentMatrix.path;
  const dAssessmentsPanel = dict.dashboard.academicSectionPage.assessmentsPanel;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: section, error: secErr } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, teacher_id")
    .eq("id", sectionId)
    .maybeSingle();
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  const isStaff = await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId);
  const canOpen = !secErr && section && (isAdmin || isStaff);
  if (!canOpen) notFound();

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed && !isAdmin) redirect(`/${locale}/dashboard`);

  const cohortId = section.cohort_id as string;

  const { data: assessments } = await supabase
    .from("cohort_assessments")
    .select("id, name, assessment_on, max_score, created_at")
    .eq("cohort_id", cohortId)
    .order("assessment_on", { ascending: false });

  const rows = (assessments ?? []) as {
    id: string;
    name: string;
    assessment_on: string;
    max_score: number | string;
    created_at: string;
  }[];

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backToSection}
        </Link>
        <div className="mt-2">
          <AdminPageHeader
            title={d.title}
            lead={`${section.name as string}. ${d.lead}`}
            iconId="academic"
          />
        </div>
      </div>

      <AssessmentGradingPathStrip currentStep={rows.length === 0 ? 1 : 2} labels={pathDict} countsText={null} />

      {rows.length ? (
        <TeacherSectionAssessmentsTable
          locale={locale}
          cohortId={cohortId}
          sectionId={sectionId}
          rows={rows}
          canDelete={isAdmin}
          tableName={d.tableName}
          tableDate={d.tableDate}
          tableMax={d.tableMax}
          colActions={dAssessmentsPanel.colActions}
          dict={dAssessmentsPanel}
        />
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">{d.empty}</p>
      )}

      <CreateCohortAssessmentForm locale={locale} sectionId={sectionId} defaultDate={todayIso} dict={d} />
    </div>
  );
}
