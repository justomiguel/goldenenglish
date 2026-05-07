"use client";

import { Cake } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";

type BirthdaysDict = Dictionary["dashboard"]["birthdays"];

export interface UpcomingBirthdaysCardProps {
  locale: string;
  rows: UpcomingBirthdayCardRow[];
  dict: BirthdaysDict;
}

export function UpcomingBirthdaysCard({ locale, rows, dict }: UpcomingBirthdaysCardProps) {
  const dateFmt = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" });
  return (
    <section
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 shadow-[var(--shadow-soft)]"
      aria-labelledby="dashboard-birthdays-title"
    >
      <div className="flex items-center gap-2">
        <Cake className="h-5 w-5 shrink-0 text-[var(--color-secondary)]" aria-hidden />
        <h2 id="dashboard-birthdays-title" className="text-lg font-semibold text-[var(--color-foreground)]">
          {dict.cardTitle}
        </h2>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.cardLead}</p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const d = new Date(`${row.celebrationIso}T12:00:00`);
            const dateLine = Number.isFinite(d.getTime()) ? dateFmt.format(d) : row.celebrationIso;
            const today = row.isToday;
            return (
              <li
                key={`${row.studentId}-${row.celebrationIso}`}
                className={
                  today
                    ? "motion-safe:animate-pulse rounded-[var(--layout-border-radius)] border-2 border-[var(--color-secondary)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-surface))] px-3 py-2.5 shadow-[var(--shadow-soft)]"
                    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[var(--color-foreground)]">{row.displayName}</span>
                  <span className="text-sm text-[var(--color-muted-foreground)]">{dateLine}</span>
                </div>
                {today ? (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-secondary)]">
                    <span className="rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-xs font-semibold text-[var(--color-secondary-foreground)]">
                      {dict.todayBadge}
                    </span>
                    {dict.todayCelebrate}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
