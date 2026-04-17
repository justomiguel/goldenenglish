import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { instituteCalendarDateIso } from "@/lib/datetime/instituteCalendarDateIso";
import { getInstituteTimeZone } from "@/lib/datetime/instituteTimeZone";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { formatAcademicScheduleSummary } from "@/lib/academics/formatAcademicScheduleSummary";
import {
  adminAttendanceMatrixColumnMaxIso,
  adminAttendanceMatrixEffMinIso,
  hasEligibleClassDayInWindow,
} from "@/lib/academics/teacherSectionAttendanceCalendar";
import { loadAdminSectionAttendanceMatrix } from "@/lib/academics/loadAdminSectionAttendanceMatrix";
import { SectionAttendanceMatrix } from "@/components/organisms/SectionAttendanceMatrix";

interface PageProps {
  params: Promise<{ locale: string; cohortId: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicSectionAttendance.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminSectionAttendanceMatrixPage({ params }: PageProps) {
  const { locale, cohortId, sectionId } = await params;
  const dict = await getDictionary(locale);
  const dAdmin = dict.dashboard.academicSectionAttendance;
  const dTeacher = dict.dashboard.teacherSectionAttendance;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const { data: sec, error: sErr } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, starts_on, ends_on, schedule_slots")
    .eq("id", sectionId)
    .maybeSingle();
  if (sErr || !sec || (sec.cohort_id as string) !== cohortId) notFound();

  const instituteTz = getInstituteTimeZone();
  const today = instituteCalendarDateIso(new Date(), instituteTz);
  const scheduleSlots = parseSectionScheduleSlots((sec as { schedule_slots?: unknown }).schedule_slots);
  const sectionStartsOn = (sec as { starts_on?: string | null }).starts_on;
  const sectionEndsOn = (sec as { ends_on?: string | null }).ends_on;
  const adminEffMin = adminAttendanceMatrixEffMinIso(today, sectionStartsOn);
  const columnMaxIso = adminAttendanceMatrixColumnMaxIso(today, sectionEndsOn);
  const dateWindowOk = adminEffMin <= columnMaxIso;
  const hasScheduleSlots = scheduleSlots.length > 0;
  const hasEligible =
    hasScheduleSlots && hasEligibleClassDayInWindow(adminEffMin, columnMaxIso, scheduleSlots, instituteTz);

  const scheduleSummary = formatAcademicScheduleSummary(
    (sec as { schedule_slots?: unknown }).schedule_slots,
    locale,
  );
  const scheduleLine = scheduleSummary ? `${dTeacher.scheduleSummaryLead} ${scheduleSummary}` : "";

  const matrix = hasEligible ? await loadAdminSectionAttendanceMatrix(supabase, sectionId) : null;

  const editableByDate: Record<string, boolean> = {};
  if (matrix?.classDays.length) {
    for (const day of matrix.classDays) editableByDate[day] = day <= today;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {dAdmin.backSection}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">{dAdmin.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{sec.name as string}</p>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-foreground)]">{dAdmin.lead}</p>
      </div>

      {!dateWindowOk ? (
        <>
          {scheduleLine ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">{scheduleLine}</p>
          ) : null}
          <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
            {dTeacher.noEligibleClassDates}
          </p>
        </>
      ) : !hasScheduleSlots ? (
        <>
          {scheduleLine ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">{scheduleLine}</p>
          ) : null}
          <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
            {dTeacher.noScheduleSlots}
          </p>
        </>
      ) : !hasEligible ? (
        <>
          {scheduleLine ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">{scheduleLine}</p>
          ) : null}
          <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
            {dTeacher.noEligibleClassDates}
          </p>
        </>
      ) : (
        <>
          {scheduleLine ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">{scheduleLine}</p>
          ) : null}
          {matrix ? (
            <SectionAttendanceMatrix
              variant="admin"
              locale={locale}
              sectionId={sectionId}
              todayIso={today}
              initialPayloadJson={JSON.stringify(matrix)}
              editableByDateJson={JSON.stringify(editableByDate)}
              scheduleLine={scheduleLine}
              matrixDict={dTeacher.matrix}
              offlineHint={dTeacher.offlineHint}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
