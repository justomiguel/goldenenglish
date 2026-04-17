import type { SectionScheduleSlot } from "@/types/academics";
import type { PortalCalendarEventKind } from "@/types/portalCalendar";
import type { PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";
import type { PortalSpecialCalendarEventRow } from "@/lib/calendar/portalSpecialCalendarEventRow";
import {
  civilWeekdayUtcNoon,
  compareIsoDate,
  forEachIsoDateInRange,
  maxIso,
  minIso,
  parseIsoDateParts,
} from "@/lib/calendar/civilGregorianDate";
import { cordobaWallClockToUtcMs } from "@/lib/calendar/argentinaCordobaUtc";
import { parseWallTimeHm } from "@/lib/calendar/parseWallTime";

export type ExpandedPortalOccurrence = {
  kind: PortalCalendarEventKind;
  title: string;
  startMs: number;
  endMs: number;
  allDay: boolean;
  /** Stable UID fragment for ICS (no spaces). */
  icsUid: string;
  /** Optional body for ICS DESCRIPTION (sanitized upstream). */
  description?: string | null;
  /** When kind is `special`, closed catalog type (drives color + ICS category). */
  specialEventType?: PortalSpecialEventTypeSlug;
  meetingUrl?: string | null;
  /** ICS SUMMARY when different from `title` (e.g. type prefix). */
  icsSummary?: string;
  /** Full ICS DESCRIPTION (legend + notes + meeting URL). */
  icsDescription?: string;
  sectionId?: string;
  cohortId?: string;
  teacherId?: string;
  roomLabel?: string | null;
};

export type SpecialCalendarEventRow = PortalSpecialCalendarEventRow;

export function mapSpecialCalendarRowsToExpanded(rows: SpecialCalendarEventRow[]): ExpandedPortalOccurrence[] {
  return rows.map((r) => {
    const startMs = new Date(r.starts_at).getTime();
    const endMs = new Date(r.ends_at).getTime();
    const notes = r.notes?.trim();
    return {
      kind: "special",
      title: r.title,
      startMs,
      endMs,
      allDay: r.all_day,
      icsUid: `ge-special-${r.id}@goldenenglish`,
      description: notes ? notes : null,
      specialEventType: r.event_type,
      meetingUrl: r.meeting_url ?? null,
    };
  });
}

export type SectionOccurrenceInput = {
  sectionId: string;
  cohortId: string;
  /** Cohort display name (without section), for exam titles. */
  cohortLabel: string;
  teacherId: string;
  roomLabel?: string | null;
  title: string;
  startsOn: string;
  endsOn: string;
  scheduleSlots: SectionScheduleSlot[];
};

export type ExamOccurrenceInput = {
  assessmentId: string;
  cohortId: string;
  title: string;
  assessmentOn: string;
};

export function expandSectionClassOccurrences(
  sections: SectionOccurrenceInput[],
  viewStartIso: string,
  viewEndIso: string,
): ExpandedPortalOccurrence[] {
  const out: ExpandedPortalOccurrence[] = [];
  for (const sec of sections) {
    const p0 = parseIsoDateParts(sec.startsOn);
    const p1 = parseIsoDateParts(sec.endsOn);
    if (!p0 || !p1) continue;
    const periodStart = sec.startsOn;
    const periodEnd = sec.endsOn;
    const winStart = maxIso(periodStart, viewStartIso);
    const winEnd = minIso(periodEnd, viewEndIso);
    if (compareIsoDate(winStart, winEnd) > 0) continue;

    for (const slot of sec.scheduleSlots) {
      const st = parseWallTimeHm(slot.startTime);
      const en = parseWallTimeHm(slot.endTime);
      if (!st || !en) continue;

      forEachIsoDateInRange(winStart, winEnd, (_iso, y, m, d) => {
        if (civilWeekdayUtcNoon(y, m, d) !== slot.dayOfWeek) return;
        const startMs = cordobaWallClockToUtcMs(y, m, d, st[0], st[1]);
        const endMs = cordobaWallClockToUtcMs(y, m, d, en[0], en[1]);
        if (endMs <= startMs) return;
        const icsUid = `ge-class-${sec.sectionId}-${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}-${slot.startTime.replace(":", "")}-${slot.endTime.replace(":", "")}@goldenenglish`;
        out.push({
          kind: "class",
          title: sec.title,
          startMs,
          endMs,
          allDay: false,
          icsUid,
          sectionId: sec.sectionId,
          cohortId: sec.cohortId,
          teacherId: sec.teacherId,
          roomLabel: sec.roomLabel ?? null,
        });
      });
    }
  }
  out.sort((a, b) => a.startMs - b.startMs);
  return out;
}

export function expandExamOccurrences(
  exams: ExamOccurrenceInput[],
  viewStartIso?: string,
  viewEndIso?: string,
): ExpandedPortalOccurrence[] {
  const out: ExpandedPortalOccurrence[] = [];
  for (const ex of exams) {
    if (viewStartIso && viewEndIso && ex.assessmentOn) {
      if (compareIsoDate(ex.assessmentOn, viewStartIso) < 0 || compareIsoDate(ex.assessmentOn, viewEndIso) > 0) {
        continue;
      }
    }
    const p = parseIsoDateParts(ex.assessmentOn);
    if (!p) continue;
    const startMs = Date.UTC(p.y, p.m - 1, p.d, 12, 0, 0);
    const endMs = startMs + 86400000;
    out.push({
      kind: "exam",
      title: ex.title,
      startMs,
      endMs,
      allDay: true,
      icsUid: `ge-exam-${ex.assessmentId}@goldenenglish`,
      cohortId: ex.cohortId,
    });
  }
  out.sort((a, b) => a.startMs - b.startMs);
  return out;
}

export function mergeAndSortOccurrences(chunks: ExpandedPortalOccurrence[][]): ExpandedPortalOccurrence[] {
  const out = chunks.flat();
  out.sort((a, b) => a.startMs - b.startMs);
  return out;
}
