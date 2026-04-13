"use client";

import { useMemo } from "react";
import type { StudentHubSectionRow } from "@/types/studentHub";
import type { Dictionary } from "@/types/i18n";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";

type HubDict = Dictionary["dashboard"]["student"]["hub"];

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface StudentMyScheduleWeekProps {
  sections: StudentHubSectionRow[];
  dict: HubDict;
}

export function StudentMyScheduleWeek({ sections, dict }: StudentMyScheduleWeekProps) {
  const active = sections.filter((s) => s.status === "active");

  const byDay = useMemo(() => {
    const map: Record<number, { label: string }[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const s of active) {
      const slots = parseSectionScheduleSlots(s.scheduleSlots);
      const label = s.cohortName ? `${s.cohortName} — ${s.sectionName}` : s.sectionName;
      const days = new Set(slots.map((sl) => sl.dayOfWeek));
      for (const d of days) {
        if (d >= 0 && d <= 6) map[d].push({ label });
      }
    }
    return map;
  }, [active]);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">{dict.scheduleTitle}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.scheduleLead}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {DAY_KEYS.map((key, idx) => (
          <div
            key={key}
            className="min-h-[5.5rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2"
          >
            <p className="text-xs font-semibold text-[var(--color-primary)]">{dict.weekdays[key]}</p>
            <ul className="mt-2 space-y-1">
              {byDay[idx]?.map((item, i) => (
                <li key={`${item.label}-${i}`} className="text-xs font-medium text-[var(--color-foreground)]">
                  {item.label}
                </li>
              ))}
              {byDay[idx]?.length === 0 ? (
                <li className="text-xs text-[var(--color-muted-foreground)]">{dict.scheduleEmptyDay}</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
