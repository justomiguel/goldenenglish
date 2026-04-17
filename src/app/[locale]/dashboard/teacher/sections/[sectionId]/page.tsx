import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { TeacherSectionRoster } from "@/components/organisms/TeacherSectionRoster";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { loadTeacherSectionDetailModel } from "@/lib/academics/loadTeacherSectionDetailModel";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.teacherMySections.metaTitle,
    robots: { index: false, follow: false },
  };
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
    .select("id, name, cohort_id, teacher_id, academic_cohorts(name)")
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/teacher/sections`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.rosterBack}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{sec.name}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{cohortName}</p>
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
      </div>
      <TeacherSectionRoster
        locale={locale}
        sectionId={sectionId}
        rows={model.rows}
        sectionTargetsFull={model.sectionTargets}
        cohortTargetsFull={model.cohortTargets}
        pendingStudentIds={model.pendingStudentIds}
        attendanceByStudent={model.attendanceByStudent}
        dict={d}
      />
    </div>
  );
}
