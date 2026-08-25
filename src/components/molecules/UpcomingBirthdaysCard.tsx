"use client";

import { Cake } from "lucide-react";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import type { Dictionary } from "@/types/i18n";
import type { UpcomingBirthdayCardRow } from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";
import { ADMIN_HUB_CARD_RELIEF } from "@/lib/dashboard/adminHubCardRelief";

type BirthdaysDict = Dictionary["dashboard"]["birthdays"];

export interface UpcomingBirthdaysCardProps {
  locale: string;
  rows: UpcomingBirthdayCardRow[];
  dict: BirthdaysDict;
  className?: string;
}

export function UpcomingBirthdaysCard({ locale, rows, dict, className }: UpcomingBirthdaysCardProps) {
  const dateFmt = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" });
  return (
    <section
      className={`flex min-h-0 flex-col rounded-2xl border border-[var(--color-border)] px-5 py-5 ${ADMIN_HUB_CARD_RELIEF} ${className ?? ""}`}
      aria-labelledby="dashboard-birthdays-title"
    >
      <div className="flex items-center gap-2">
        <Cake className="h-5 w-5 shrink-0 text-[var(--color-secondary)]" aria-hidden />
        <h2 id="dashboard-birthdays-title" className="text-base font-semibold text-[var(--color-foreground)]">
          {dict.cardTitle}
        </h2>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.cardLead}</p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      ) : (
        <ul className="mt-3 min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/70">
          {rows.map((row) => {
            const d = new Date(`${row.celebrationIso}T12:00:00`);
            const dateLine = Number.isFinite(d.getTime()) ? dateFmt.format(d) : row.celebrationIso;
            const today = row.isToday;
            return (
              <li
                key={`${row.studentId}-${row.celebrationIso}`}
                className="py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    url={row.avatarUrl}
                    displayName={row.displayName}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--color-foreground)]">{row.displayName}</p>
                    <p className="mt-0.5 truncate text-sm text-[var(--color-muted-foreground)]">
                      {row.sectionLabel ?? dict.noSection}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-[var(--color-muted-foreground)]">{dateLine}</span>
                </div>
                {today ? (
                  <p className="mt-2 flex flex-wrap items-center gap-2 pl-[4.25rem] text-sm font-medium text-[var(--color-secondary)]">
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
