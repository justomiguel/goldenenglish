"use client";

import Link from "next/link";
import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import { googleCalendarEventUrl } from "@/lib/calendar/googleCalendarUrl";
import type { Dictionary } from "@/types/i18n";
import type { ParentHubModel } from "@/types/parentHub";
import { ParentHubLogisticsTable } from "@/components/parent/ParentHubLogisticsTable";
import { ParentHubBillingCard } from "@/components/parent/ParentHubBillingCard";
import { ParentHubUpdatesList } from "@/components/parent/ParentHubUpdatesList";
import { ParentHubIcsDownload } from "@/components/parent/ParentHubIcsDownload";
import { ParentChildLastGradeLine } from "@/components/parent/ParentChildLastGradeLine";
import { ParentContactTeacherCta } from "@/components/parent/ParentContactTeacherCta";
import { ParentLearningTasksPanel } from "@/components/parent/ParentLearningTasksPanel";
import type { ParentLearningTaskRow } from "@/types/learningTasks";

export interface ParentDashboardFamilyViewProps {
  locale: string;
  summaries: ParentChildSummary[];
  selectedStudentId: string | undefined;
  navPay: string;
  payHrefBase: string;
  labels: Dictionary["dashboard"]["parent"];
  hub?: ParentHubModel | null;
  learningTasks?: ParentLearningTaskRow[];
}

export function ParentDashboardFamilyView({
  locale,
  summaries,
  selectedStudentId,
  navPay,
  payHrefBase,
  labels,
  hub = null,
  learningTasks = [],
}: ParentDashboardFamilyViewProps) {
  const selected =
    summaries.find((s) => s.studentId === selectedStudentId) ?? summaries[0];

  const calendarUrl =
    selected?.nextEventAt && selected.nextEventLabel
      ? googleCalendarEventUrl({
          title: selected.nextEventLabel,
          details: labels.calendarEventDetails,
          start: new Date(selected.nextEventAt),
          end: new Date(
            new Date(selected.nextEventAt).getTime() + 60 * 60 * 1000,
          ),
        })
      : null;

  return (
    <div className="mt-8 space-y-6">
      {summaries.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="navigation" aria-label={labels.selectChild}>
          {summaries.map((s) => {
            const active = s.studentId === selected?.studentId;
            return (
              <Link
                key={s.studentId}
                href={`/${locale}/dashboard/parent?child=${encodeURIComponent(s.studentId)}`}
                className={
                  active
                    ? "rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
                    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
                }
              >
                {s.firstName} {s.lastName}
              </Link>
            );
          })}
        </div>
      ) : null}

      {selected ? (
        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {selected.firstName} {selected.lastName}
              </p>
              <dl className="mt-3 grid gap-2 text-sm text-[var(--color-muted-foreground)] sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-[var(--color-foreground)]">
                    {labels.summaryAttendance}
                  </dt>
                  <dd>
                    {selected.attendancePercent != null
                      ? `${selected.attendancePercent}%`
                      : labels.emptyValue}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--color-foreground)]">
                    {labels.summaryLevel}
                  </dt>
                  <dd>{selected.levelLabel ?? labels.emptyValue}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--color-foreground)]">
                    {labels.summaryNextExam}
                  </dt>
                  <dd>{selected.nextExamAt ?? labels.emptyValue}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--color-foreground)]">
                    {labels.summaryNextEvent}
                  </dt>
                  <dd>
                    {selected.nextEventLabel && selected.nextEventAt
                      ? `${selected.nextEventLabel} · ${new Date(selected.nextEventAt).toLocaleString()}`
                      : labels.emptyValue}
                  </dd>
                </div>
                <ParentChildLastGradeLine
                  locale={locale}
                  grade={selected.lastPublishedGrade}
                  labels={labels}
                />
              </dl>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href={`/${locale}/dashboard/parent/children/${encodeURIComponent(selected.studentId)}`}
                className="text-sm font-semibold text-[var(--color-primary)] underline"
              >
                {labels.navEditChild}
              </Link>
              <Link
                href={`${payHrefBase}?child=${encodeURIComponent(selected.studentId)}`}
                className="text-sm font-semibold text-[var(--color-primary)] underline"
              >
                {navPay}
              </Link>
              {calendarUrl ? (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm font-medium text-[var(--color-primary)]"
                >
                  {labels.addGoogleCalendar}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <ParentContactTeacherCta
          locale={locale}
          assignedTeacherId={selected.assignedTeacherId}
          assignedTeacherName={selected.assignedTeacherName}
          labels={labels}
        />
      ) : null}

      {hub ? (
        <div className="space-y-6 border-t border-[var(--color-border)] pt-6">
          <ParentHubLogisticsTable
            rows={hub.logisticsRows}
            scheduleOverlap={hub.scheduleOverlap}
            dict={labels.hub}
          />
          {hub.icsDocument ? (
            <div className="flex flex-wrap items-center gap-3">
              <ParentHubIcsDownload icsDocument={hub.icsDocument} dict={labels.hub} />
            </div>
          ) : null}
          <ParentHubBillingCard
            locale={locale}
            studentId={selected?.studentId}
            pending={selected ? (hub.childPaymentPending[selected.studentId] ?? false) : false}
            payHrefBase={payHrefBase}
            dict={labels.hub}
          />
          <ParentLearningTasksPanel
            locale={locale}
            tasks={learningTasks}
            labels={labels}
            selectedStudentId={selected?.studentId}
          />
          <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">{labels.hub.attendanceTitle}</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.hub.attendanceLead}</p>
            {(() => {
              const lines = hub.attendanceLines.filter((l) =>
                selected ? l.studentId === selected.studentId : true,
              );
              if (lines.length === 0) {
                return (
                  <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.hub.attendanceEmpty}</p>
                );
              }
              return (
                <ul className="mt-3 space-y-2 text-sm text-[var(--color-foreground)]">
                  {lines.map((l) => (
                    <li key={l.studentId}>
                      {labels.hub.attendanceLine
                        .replace("{child}", l.childFirstName)
                        .replace("{pct}", String(l.pct))}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </section>
          <ParentHubUpdatesList updates={hub.updates} dict={labels.hub} />
        </div>
      ) : null}
    </div>
  );
}
