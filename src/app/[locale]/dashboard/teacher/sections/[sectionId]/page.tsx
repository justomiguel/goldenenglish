import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { TeacherSectionRoster } from "@/components/organisms/TeacherSectionRoster";
import { TeacherSectionNotices } from "@/components/teacher/TeacherSectionNotices";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { loadTeacherSectionDetailModel } from "@/lib/academics/loadTeacherSectionDetailModel";
import { loadSectionEnrollmentLinkState } from "@/lib/academics/sectionEnrollmentLinkAdmin";
import { SectionEnrollmentLinkPanel } from "@/components/molecules/SectionEnrollmentLinkPanel";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { SectionReferenceThumb } from "@/components/molecules/SectionReferenceThumb";
import { sectionReferenceImagePublicUrl } from "@/lib/register/sectionReferenceImage";
import { readRequestSupabasePublicEnv } from "@/lib/supabase/requestPublicEnv";
import { TeacherSectionJoinButton } from "@/components/teacher/TeacherSectionJoinButton";
import { loadTeacherOpenDailyJoin } from "@/lib/academics/loadOpenDailyJoin";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherMySections.metaTitle);
}

export default async function TeacherSectionDetailPage({ params }: PageProps) {
  const { locale, sectionId } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherMySections;
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
    .select("id, name, cohort_id, teacher_id, reference_image_path, academic_cohorts(name)")
    .eq("id", sectionId)
    .maybeSingle();

  const canOpen =
    !secErr &&
    section &&
    (await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId));
  if (!canOpen) notFound();

  const sec = section as {
    id: string;
    name: string;
    cohort_id: string;
    reference_image_path?: string | null;
    academic_cohorts: { name: string } | { name: string }[] | null;
  };
  const c = sec.academic_cohorts;
  const cohortName = Array.isArray(c) ? (c[0]?.name ?? "") : (c?.name ?? "");

  const model = await loadTeacherSectionDetailModel(supabase, {
    locale,
    userId: user.id,
    sectionId,
    cohortId: sec.cohort_id,
    attendanceStatusLabels: d.attendanceStatus,
  });

  const [enrollmentLinkState, { url: supabaseUrl }, noticeResult, dailyJoin] = await Promise.all([
    loadSectionEnrollmentLinkState(supabase, sectionId),
    readRequestSupabasePublicEnv(),
    supabase
      .from("section_notices")
      .select("id, body_text")
      .eq("section_id", sectionId)
      .is("archived_at", null)
      .order("published_at", { ascending: false })
      .limit(5),
    loadTeacherOpenDailyJoin({ locale, sectionId, userId: user.id }),
  ]);
  const notices = ((noticeResult.data ?? []) as { id: string; body_text: string }[]).map((row) => ({
    id: row.id,
    body: row.body_text,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/teacher/sections`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.rosterBack}
        </Link>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <SectionReferenceThumb
              src={sectionReferenceImagePublicUrl(sec.reference_image_path, supabaseUrl)}
              alt={sec.name}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <AdminPageHeader title={sec.name} lead={cohortName} iconId="academic" />
            </div>
          </div>
          {dailyJoin ? <TeacherSectionJoinButton href={dailyJoin.joinHref} label={d.joinClass} /> : null}
        </div>
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-primary)]">{d.rosterTitle}</h2>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}/attendance`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          {d.rosterLinkAttendance}
        </Link>
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}/assessments`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          {d.rosterLinkAssessments}
        </Link>
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}/tasks`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          {d.rosterLinkTasks}
        </Link>
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}/contents`}
          className="inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
        >
          {d.rosterLinkContents}
        </Link>
      </div>
      <SectionEnrollmentLinkPanel
        locale={locale}
        sectionId={sectionId}
        sectionName={sec.name}
        state={enrollmentLinkState}
        labels={dict.dashboard.sectionEnrollmentLink}
        canRevoke
      />
      <TeacherSectionNotices
        locale={locale}
        sectionId={sectionId}
        notices={notices}
        labels={d}
      />
      <TeacherSectionRoster
        locale={locale}
        sectionId={sectionId}
        rows={model.rows}
        sectionTargetsFull={model.sectionTargets}
        cohortTargetsFull={model.cohortTargets}
        pendingStudentIds={model.pendingStudentIds}
        attendanceByStudent={model.attendanceByStudent}
        dict={d}
        academicFieldLabels={dict.admin.users.academicFields}
        canEditAcademicProfile
      />
    </div>
  );
}
