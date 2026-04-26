"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { DashboardGreetingHero } from "@/components/molecules/DashboardGreetingHero";
import { AttendancePlayboard } from "@/components/student/AttendancePlayboard";
import { EngagementBar } from "@/components/student/EngagementBar";
import { StudentAttendanceCalendar } from "@/components/student/StudentAttendanceCalendar";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";
import type { AttendanceRow } from "@/lib/attendance/stats";
import type { StudentHubModel } from "@/types/studentHub";
import { StudentNextClassCard } from "@/components/student/StudentNextClassCard";
import { StudentMyScheduleWeek } from "@/components/student/StudentMyScheduleWeek";
import { StudentAcademicJourney } from "@/components/student/StudentAcademicJourney";
import { StudentScheduleUpdateStrip } from "@/components/student/StudentScheduleUpdateStrip";
import { StudentPushPermissionBanner } from "@/components/student/StudentPushPermissionBanner";
import { StudentBillingStrip } from "@/components/student/StudentBillingStrip";
import { StudentPublishedGradesSection } from "@/components/student/StudentPublishedGradesSection";
import { StudentAttendanceDonut } from "@/components/student/StudentAttendanceDonut";
import { StudentEnrollmentRenewalBanner } from "@/components/student/StudentEnrollmentRenewalBanner";
import type { StudentEnrollmentRenewalKind } from "@/lib/student/studentEnrollmentRenewalNotice";
import {
  StudentClassReminderInbox,
  type ClassReminderInboxRow,
} from "@/components/student/StudentClassReminderInbox";
import { StudentLearningTasksSection } from "@/components/student/StudentLearningTasksSection";
import { StudentLearningFeedbackSection } from "@/components/student/StudentLearningFeedbackSection";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { LearningFeedbackRow } from "@/types/learningContent";

type StudentLabels = Dictionary["dashboard"]["student"];

function StudentDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-32 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
      <div className="h-48 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface StudentDashboardEntryProps {
  locale: string;
  title: string;
  kicker: string;
  greeting: string;
  fullDateLine: string;
  firstName: string | null;
  engagementPoints: number;
  rows: AttendanceRow[];
  labels: StudentLabels;
  hub?: StudentHubModel | null;
  enrollmentRenewalKind?: StudentEnrollmentRenewalKind;
  classReminderInbox?: ClassReminderInboxRow[];
  learningTasks?: StudentLearningTaskRow[];
  learningFeedback?: LearningFeedbackRow[];
}

export function StudentDashboardEntry({
  locale,
  title,
  kicker,
  greeting,
  fullDateLine,
  firstName,
  engagementPoints,
  rows,
  labels,
  hub = null,
  enrollmentRenewalKind = "none",
  classReminderInbox = [],
  learningTasks = [],
  learningFeedback = [],
}: StudentDashboardEntryProps) {
  const hubDict = labels.hub;
  const body = (
    <div className="space-y-6">
      <DashboardGreetingHero
        kicker={kicker}
        greeting={greeting}
        firstName={firstName}
        fullDateLine={fullDateLine}
        lead={title}
      />
      <StudentEnrollmentRenewalBanner locale={locale} kind={enrollmentRenewalKind} dict={labels.enrollmentRenewal} />
      <StudentClassReminderInbox
        locale={locale}
        rows={classReminderInbox}
        labels={labels}
      />
      <StudentLearningTasksSection locale={locale} tasks={learningTasks} labels={labels} />
      <StudentLearningFeedbackSection rows={learningFeedback} labels={labels} />
      {hub ? (
        <div className="space-y-4">
          <StudentNextClassCard sections={hub.sections} dict={hubDict} />
          <StudentScheduleUpdateStrip pings={hub.approvedTransfers} dict={hubDict} />
          <StudentPushPermissionBanner dict={hubDict} />
          <StudentMyScheduleWeek sections={hub.sections} dict={hubDict} />
          <StudentAcademicJourney items={hub.journey} dict={hubDict} />
          <StudentBillingStrip locale={locale} pending={hub.billingPending} dict={hubDict} />
          <StudentPublishedGradesSection locale={locale} grades={hub.publishedGrades ?? []} dict={labels.grades} />
        </div>
      ) : null}
      <EngagementBar
        points={engagementPoints}
        title={labels.engagementTitle}
        hint={labels.engagementHint}
      />
      <StudentAttendanceDonut locale={locale} rows={rows} dict={labels.attendanceDonut} />
      <StudentAttendanceCalendar rows={rows} labels={labels} />
      <AttendancePlayboard rows={rows} labels={labels} />
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={<StudentDashboardSkeleton />}
      desktop={<div>{body}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">{body}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
