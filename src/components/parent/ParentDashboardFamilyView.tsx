"use client";

import Link from "next/link";
import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import { googleCalendarEventUrl } from "@/lib/calendar/googleCalendarUrl";
import type { Dictionary } from "@/types/i18n";

export interface ParentDashboardFamilyViewProps {
  locale: string;
  summaries: ParentChildSummary[];
  selectedStudentId: string | undefined;
  navPay: string;
  payHrefBase: string;
  labels: Dictionary["dashboard"]["parent"];
}

export function ParentDashboardFamilyView({
  locale,
  summaries,
  selectedStudentId,
  navPay,
  payHrefBase,
  labels,
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
    </div>
  );
}
