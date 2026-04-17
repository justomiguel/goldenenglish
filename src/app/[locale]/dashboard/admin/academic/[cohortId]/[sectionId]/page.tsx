import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { pgDateToInputValue } from "@/lib/academics/pgDateToInputValue";
import { buildAdminSectionMoveTargets } from "@/lib/academics/buildAdminSectionMoveTargets";
import { loadAdminSectionTeachersAndAssistants } from "@/lib/academics/loadAdminSectionTeachersAndAssistants";
import { loadParentPaymentPendingMap } from "@/lib/academics/parentPaymentPending";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { AcademicSectionScheduleEditor } from "@/components/organisms/AcademicSectionScheduleEditor";
import { AcademicSectionEnrollCard } from "@/components/organisms/AcademicSectionEnrollCard";
import { AcademicSectionRosterTable } from "@/components/organisms/AcademicSectionRosterTable";
import { AcademicSectionLifecycleBar } from "@/components/organisms/AcademicSectionLifecycleBar";
import { AcademicSectionPeriodEditor } from "@/components/organisms/AcademicSectionPeriodEditor";
import { AcademicSectionStaffEditor } from "@/components/organisms/AcademicSectionStaffEditor";
import { AcademicSectionShellTabs } from "@/components/organisms/AcademicSectionShellTabs";
import { AcademicSectionCapacityEditor } from "@/components/organisms/AcademicSectionCapacityEditor";
import { AcademicSectionRoomLabelEditor } from "@/components/organisms/AcademicSectionRoomLabelEditor";

interface PageProps {
  params: Promise<{ locale: string; cohortId: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.academicSectionPage.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AcademicSectionPage({ params }: PageProps) {
  const { locale, cohortId, sectionId } = await params;
  const dict = await getDictionary(locale);
  const enDict = locale === "en" ? dict : await getDictionary("en");
  const d = dict.dashboard.academicSectionPage;
  const dEn = enDict.dashboard.academicSectionPage;
  const shellTabLabels = d.shellTabs ?? dEn.shellTabs;
  const scheduleEditorDict = d.scheduleEditor ?? dEn.scheduleEditor;
  const periodDict = d.period ?? dEn.period;
  const capacityDict = d.capacity ?? dEn.capacity;
  const roomLabelDict = d.roomLabel ?? dEn.roomLabel;
  const lifecycleDict = d.lifecycle ?? dEn.lifecycle;
  const staffDict = d.staff ?? dEn.staff;
  const supabase = await createClient();

  const { data: sec, error: sErr } = await supabase
    .from("academic_sections")
    .select(
      "id, name, cohort_id, teacher_id, schedule_slots, max_students, archived_at, starts_on, ends_on, room_label, academic_cohorts(name, archived_at)",
    )
    .eq("id", sectionId)
    .maybeSingle();

  if (sErr) {
    logSupabaseClientError("academicSectionPage:sectionSelect", sErr, { sectionId, cohortId });
    notFound();
  }
  if (!sec || (sec.cohort_id as string) !== cohortId) notFound();

  const secRow = sec as {
    id: string;
    name: string;
    cohort_id: string;
    teacher_id: string;
    schedule_slots: unknown;
    max_students?: number | null;
    room_label?: string | null;
    archived_at: string | null;
    starts_on: string;
    ends_on: string;
    academic_cohorts:
      | { name: string; archived_at?: string | null }
      | { name: string; archived_at?: string | null }[]
      | null;
  };
  const cohortRaw = secRow.academic_cohorts;
  const cohortSingle = Array.isArray(cohortRaw) ? (cohortRaw[0] ?? null) : cohortRaw;
  const cohortName = cohortSingle?.name ?? "";
  const cohortArchivedAt = cohortSingle?.archived_at ?? null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const sectionStartsOn = pgDateToInputValue((secRow as { starts_on?: unknown }).starts_on) || todayIso;
  const sectionEndsOn = pgDateToInputValue((secRow as { ends_on?: unknown }).ends_on) || sectionStartsOn;
  const sectionLabel = `${cohortName} — ${secRow.name}`;
  const slots = parseSectionScheduleSlots(secRow.schedule_slots);
  const siteDefaultMax = getDefaultSectionMaxStudents();
  const storedMax = secRow.max_students;
  const effectiveMaxStudents = storedMax != null && Number.isFinite(storedMax) ? Math.floor(storedMax) : siteDefaultMax;

  const { data: enrollments } = await supabase
    .from("section_enrollments")
    .select("id, status, student_id, profiles(first_name,last_name)")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });

  const rows =
    (enrollments ?? []).map((raw) => {
      const r = raw as {
        id: string;
        status: string;
        student_id: string;
        profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
      };
      const pRaw = r.profiles;
      const p = Array.isArray(pRaw) ? (pRaw[0] ?? null) : pRaw;
      const label = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
      return {
        enrollmentId: r.id,
        studentId: r.student_id,
        label,
        status: r.status,
      };
    }) ?? [];

  const activeEnrollmentCount = rows.filter((r) => r.status === "active").length;

  const studentIds = [...new Set(rows.map((r) => r.studentId))];
  const debtMap = await loadParentPaymentPendingMap(supabase, studentIds);
  const debtByStudentId = Object.fromEntries(debtMap);

  const { teachers, assistantPortalStaffOptions, initialAssistants, initialExternalAssistants } =
    await loadAdminSectionTeachersAndAssistants(supabase, sectionId, secRow.teacher_id);

  const { data: allSections } = await supabase
    .from("academic_sections")
    .select("id, name, cohort_id, archived_at, academic_cohorts(name, archived_at)")
    .neq("id", sectionId)
    .is("archived_at", null)
    .order("name")
    .limit(2000);

  const moveTargets = buildAdminSectionMoveTargets(allSections, sectionId);

  const attendanceBlock = dict.dashboard.academicSectionAttendance;
  const attendanceTitle =
    (attendanceBlock && attendanceBlock.title) || enDict.dashboard.academicSectionAttendance.title;

  return (
    <div className="space-y-6">
      <div className="min-w-0 space-y-1 border-b border-[var(--color-border)] pb-4">
        <Link
          href={`/${locale}/dashboard/admin/academic/${cohortId}`}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {d.backCohort}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">{secRow.name}</h1>
        <p className="text-sm font-medium text-[var(--color-primary)]">{cohortName}</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">{d.sectionLead}</p>
      </div>

      <AcademicSectionShellTabs
        labels={shellTabLabels}
        general={
          <>
            <AcademicSectionLifecycleBar
              locale={locale}
              cohortId={cohortId}
              sectionId={sectionId}
              sectionArchivedAt={secRow.archived_at ?? null}
              cohortArchivedAt={cohortArchivedAt}
              dict={lifecycleDict}
            />
            <AcademicSectionPeriodEditor
              locale={locale}
              sectionId={sectionId}
              initialStartsOn={sectionStartsOn}
              initialEndsOn={sectionEndsOn}
              dict={periodDict}
            />
            <AcademicSectionCapacityEditor
              locale={locale}
              sectionId={sectionId}
              initialMaxStudents={effectiveMaxStudents}
              activeEnrollments={activeEnrollmentCount}
              siteDefaultMax={siteDefaultMax}
              dict={capacityDict}
            />
            <AcademicSectionStaffEditor
              locale={locale}
              sectionId={sectionId}
              teachers={teachers}
              assistantPortalStaffOptions={assistantPortalStaffOptions}
              initialTeacherId={secRow.teacher_id}
              initialAssistants={initialAssistants}
              initialExternalAssistants={initialExternalAssistants}
              dict={staffDict}
            />
            <AcademicSectionRoomLabelEditor
              locale={locale}
              sectionId={sectionId}
              initialRoomLabel={secRow.room_label ?? null}
              dict={roomLabelDict}
            />
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`}
                title={attendanceTitle}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
              >
                <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
                {attendanceTitle}
              </Link>
            </div>
          </>
        }
        schedule={
          <AcademicSectionScheduleEditor
            locale={locale}
            sectionId={sectionId}
            initialSlots={slots}
            dict={scheduleEditorDict}
          />
        }
        enroll={
          <AcademicSectionEnrollCard
            locale={locale}
            sectionId={sectionId}
            sectionLabel={sectionLabel}
            dict={d}
            conflictDict={dict.dashboard.academics.conflictModal}
            errors={dict.dashboard.academics.errors}
          />
        }
        roster={
          <AcademicSectionRosterTable
            locale={locale}
            sectionId={sectionId}
            rows={rows}
            moveTargets={moveTargets}
            dict={d}
            conflictDict={dict.dashboard.academics.conflictModal}
            errors={dict.dashboard.academics.errors}
            debtByStudentId={debtByStudentId}
          />
        }
      />
    </div>
  );
}
