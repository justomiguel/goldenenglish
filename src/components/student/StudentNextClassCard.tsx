"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudentHubSectionRow } from "@/types/studentHub";
import type { Dictionary } from "@/types/i18n";
import { parseSectionScheduleSlots, timeToMinutes } from "@/lib/academics/sectionScheduleSlots";

type HubDict = Dictionary["dashboard"]["student"]["hub"];

function nextClassFromRows(sections: StudentHubSectionRow[], now: Date) {
  const active = sections.filter((s) => s.status === "active");
  let best: { start: Date; teacher: string; label: string } | null = null;
  for (const s of active) {
    const slots = parseSectionScheduleSlots(s.scheduleSlots);
    for (let d = 0; d < 21; d++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 0, 0, 0, 0);
      const wd = day.getDay();
      for (const slot of slots) {
        if (slot.dayOfWeek !== wd) continue;
        const sm = timeToMinutes(slot.startTime);
        const em = timeToMinutes(slot.endTime);
        if (sm < 0 || em < 0 || sm >= em) continue;
        const sh = Math.floor(sm / 60);
        const smm = sm % 60;
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, smm, 0, 0);
        if (start.getTime() < now.getTime() - 60 * 1000) continue;
        const label = s.cohortName ? `${s.cohortName} — ${s.sectionName}` : s.sectionName;
        if (!best || start.getTime() < best.start.getTime()) {
          best = { start, teacher: s.teacherDisplayName, label };
        }
      }
    }
  }
  return best;
}

export interface StudentNextClassCardProps {
  sections: StudentHubSectionRow[];
  dict: HubDict;
}

export function StudentNextClassCard({ sections, dict }: StudentNextClassCardProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const next = useMemo(() => nextClassFromRows(sections, now), [sections, now]);

  if (!next) {
    return (
      <section
        className="rounded-2xl border-2 border-[var(--color-accent)]/50 bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
        aria-label={dict.nextClassTitle}
      >
        <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.nextClassTitle}</p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{dict.noUpcoming}</p>
      </section>
    );
  }

  const diffMs = next.start.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  let when: string;
  if (diffMs <= 0) when = dict.started;
  else if (diffH >= 1) when = dict.startsInHours.replace("{hours}", String(diffH));
  else when = dict.startsInMinutes.replace("{minutes}", String(Math.max(1, diffM)));

  const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long" });
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <section
      className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
      aria-label={dict.nextClassTitle}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-foreground)]">
        {dict.nextClassKicker}
      </p>
      <h2 className="mt-1 font-display text-xl font-bold text-[var(--color-primary)]">{next.label}</h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {dayFmt.format(next.start)} · {timeFmt.format(next.start)}
      </p>
      {next.teacher ? (
        <p className="mt-1 text-sm text-[var(--color-foreground)]">
          {dict.teacherLabel}: <span className="font-medium">{next.teacher}</span>
        </p>
      ) : null}
      <p className="mt-3 inline-flex rounded-full bg-[var(--color-accent)]/25 px-3 py-1 text-sm font-semibold text-[var(--color-foreground)]">
        {when}
      </p>
    </section>
  );
}
