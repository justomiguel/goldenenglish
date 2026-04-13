"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
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

type StudentLabels = Dictionary["dashboard"]["student"];

function StudentDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-48 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface StudentDashboardEntryProps {
  locale: string;
  title: string;
  engagementPoints: number;
  rows: AttendanceRow[];
  labels: StudentLabels;
  hub?: StudentHubModel | null;
}

export function StudentDashboardEntry({
  locale,
  title,
  engagementPoints,
  rows,
  labels,
  hub = null,
}: StudentDashboardEntryProps) {
  const hubDict = labels.hub;
  const body = (
    <>
      <h1 className="mb-8 font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      {hub ? (
        <div className="mb-8 space-y-4">
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
      <StudentAttendanceCalendar rows={rows} labels={labels} />
      <AttendancePlayboard rows={rows} labels={labels} />
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<StudentDashboardSkeleton />}
      desktop={<div>{body}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{body}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
