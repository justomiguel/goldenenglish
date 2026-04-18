import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadAdminSectionPageData } from "@/lib/academics/loadAdminSectionPageData";
import { AcademicSectionScheduleEditor } from "@/components/organisms/AcademicSectionScheduleEditor";
import { AcademicSectionEnrollCard } from "@/components/organisms/AcademicSectionEnrollCard";
import { AcademicSectionRosterTable } from "@/components/organisms/AcademicSectionRosterTable";
import { AcademicSectionLifecycleBar } from "@/components/organisms/AcademicSectionLifecycleBar";
import { AcademicSectionPeriodEditor } from "@/components/organisms/AcademicSectionPeriodEditor";
import { AcademicSectionStaffEditor } from "@/components/organisms/AcademicSectionStaffEditor";
import { AcademicSectionShellTabs } from "@/components/organisms/AcademicSectionShellTabs";
import { AcademicSectionCapacityEditor } from "@/components/organisms/AcademicSectionCapacityEditor";
import { AcademicSectionRoomLabelEditor } from "@/components/organisms/AcademicSectionRoomLabelEditor";
import { AcademicSectionFeePlansEditor } from "@/components/organisms/AcademicSectionFeePlansEditor";

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
  const feePlansDict = d.feePlans ?? dEn.feePlans;
  const supabase = await createClient();

  const data = await loadAdminSectionPageData(supabase, cohortId, sectionId);
  if (!data) notFound();
  const { section, cohort, slots, rows, debtByStudentId, staff, feePlansWithUsage, moveTargets } = data;

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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">{section.name}</h1>
        <p className="text-sm font-medium text-[var(--color-primary)]">{cohort.name}</p>
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
              sectionArchivedAt={section.archivedAt}
              cohortArchivedAt={cohort.archivedAt}
              dict={lifecycleDict}
            />
            <AcademicSectionPeriodEditor
              locale={locale}
              sectionId={sectionId}
              initialStartsOn={section.startsOn}
              initialEndsOn={section.endsOn}
              dict={periodDict}
            />
            <AcademicSectionCapacityEditor
              locale={locale}
              sectionId={sectionId}
              initialMaxStudents={section.effectiveMaxStudents}
              activeEnrollments={section.activeEnrollmentCount}
              siteDefaultMax={section.siteDefaultMax}
              dict={capacityDict}
            />
            <AcademicSectionStaffEditor
              locale={locale}
              sectionId={sectionId}
              teachers={staff.teachers}
              assistantPortalStaffOptions={staff.assistantPortalStaffOptions}
              initialTeacherId={section.teacherId}
              initialAssistants={staff.initialAssistants}
              initialExternalAssistants={staff.initialExternalAssistants}
              dict={staffDict}
            />
            <AcademicSectionRoomLabelEditor
              locale={locale}
              sectionId={sectionId}
              initialRoomLabel={section.roomLabel}
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
        fees={
          <AcademicSectionFeePlansEditor
            locale={locale}
            sectionId={sectionId}
            initialPlans={feePlansWithUsage}
            dict={feePlansDict}
          />
        }
        enroll={
          <AcademicSectionEnrollCard
            locale={locale}
            sectionId={sectionId}
            sectionLabel={cohort.label}
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
