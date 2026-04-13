"use client";

import type { StudentHubJourneyItem } from "@/types/studentHub";
import type { Dictionary } from "@/types/i18n";

type HubDict = Dictionary["dashboard"]["student"]["hub"];

export interface StudentAcademicJourneyProps {
  items: StudentHubJourneyItem[];
  dict: HubDict;
}

export function StudentAcademicJourney({ items, dict }: StudentAcademicJourneyProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">{dict.journeyTitle}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{dict.journeyEmpty}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">{dict.journeyTitle}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.journeyLead}</p>
      <ol className="relative mt-6 border-s border-[var(--color-accent)] ps-4">
        {items.map((it, i) => (
          <li key={`${it.title}-${i}`} className="mb-6 ms-1 last:mb-0">
            <span
              className={`absolute -start-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-[var(--color-surface)] ${
                it.variant === "active" ? "bg-[var(--color-accent)]" : "bg-[var(--color-muted-foreground)]"
              }`}
            />
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{it.title}</p>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {dict.journeyStatus[it.status as keyof typeof dict.journeyStatus] ?? it.status}
              {it.scheduleLine ? ` · ${it.scheduleLine}` : ""}
            </p>
            {it.attendanceMonthPct != null ? (
              <p className="mt-1 text-xs font-medium text-[var(--color-foreground)]">
                {dict.journeyAttendanceThisMonth.replace("{pct}", String(it.attendanceMonthPct))}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
