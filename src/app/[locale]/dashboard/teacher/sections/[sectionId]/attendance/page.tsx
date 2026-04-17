import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { prepareTeacherSectionAttendancePage } from "@/lib/academics/prepareTeacherSectionAttendancePage";
import { SectionAttendanceMatrix } from "@/components/organisms/SectionAttendanceMatrix";
import {
  TeacherAttendanceScopeLinks,
  type TeacherAttendanceScope,
} from "@/components/molecules/TeacherAttendanceScopeLinks";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
  searchParams: Promise<{ scope?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.teacherSectionAttendance.metaTitle,
    robots: { index: false, follow: false },
  };
}

function parseScope(raw: string | string[] | undefined): TeacherAttendanceScope {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "full" ? "full" : "operational";
}

export default async function TeacherSectionAttendancePage({ params, searchParams }: PageProps) {
  const { locale, sectionId } = await params;
  const scope = parseScope((await searchParams).scope);
  const dict = await getDictionary(locale);
  const d = dict.dashboard.teacherSectionAttendance;
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
    .select("id, name, teacher_id, starts_on, ends_on, schedule_slots")
    .eq("id", sectionId)
    .maybeSingle();
  const canOpen =
    !secErr &&
    section &&
    (await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId));
  if (!canOpen) notFound();

  const prep = await prepareTeacherSectionAttendancePage({
    supabase,
    sectionId,
    scope,
    locale,
    scheduleSummaryLead: d.scheduleSummaryLead,
    section: section as { starts_on?: string | null; ends_on?: string | null; schedule_slots?: unknown },
  });

  const fullCourseHref = `/${locale}/dashboard/teacher/sections/${sectionId}/attendance?scope=full`;
  const scheduleLineNode = prep.scheduleLine ? (
    <p className="text-xs text-[var(--color-muted-foreground)]">{prep.scheduleLine}</p>
  ) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/teacher/sections/${sectionId}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backToSection}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{d.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{section.name as string}</p>
      </div>

      {prep.canShowMatrixShell ? (
        <TeacherAttendanceScopeLinks
          locale={locale}
          sectionId={sectionId}
          active={scope}
          dict={d.scopeLinks}
        />
      ) : null}

      {!prep.dateWindowOk || !prep.hasScheduleSlots || !prep.canShowMatrixShell ? (
        <>
          {scheduleLineNode}
          <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
            {prep.hasScheduleSlots ? d.noEligibleClassDates : d.noScheduleSlots}
          </p>
        </>
      ) : scope === "operational" && !prep.hasEligibleOperational && prep.hasEligibleFull ? (
        <>
          {scheduleLineNode}
          <div
            role="status"
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4 text-sm text-[var(--color-foreground)]"
          >
            <p>{d.scopeLinks.operationalOnlyEmptyLead}</p>
            <Link
              href={fullCourseHref}
              className="mt-3 inline-flex min-h-10 items-center rounded-[var(--layout-border-radius)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15"
            >
              {d.scopeLinks.fullCourse}
            </Link>
          </div>
        </>
      ) : !prep.hasEligibleForScope ? (
        <>
          {scheduleLineNode}
          <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
            {d.noEligibleClassDates}
          </p>
        </>
      ) : (
        <>
          {scheduleLineNode}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {scope === "full" ? d.scopeLinks.matrixContextFull : d.scopeLinks.matrixContextOperational}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{d.dateMinHint}</p>
          {prep.matrix ? (
            <SectionAttendanceMatrix
              variant="teacher"
              locale={locale}
              sectionId={sectionId}
              todayIso={prep.todayIso}
              initialPayloadJson={JSON.stringify(prep.matrix)}
              editableByDateJson={JSON.stringify(prep.editableByDate)}
              scheduleLine={prep.scheduleLine}
              matrixDict={d.matrix}
              offlineHint={d.offlineHint}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
