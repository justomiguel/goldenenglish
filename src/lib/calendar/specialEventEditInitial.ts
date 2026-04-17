import { cordobaHmFromUtcMs, cordobaIsoDateFromUtcMs } from "@/lib/calendar/cordobaFormatFromUtc";
import type { PortalSpecialCalendarScope, PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";

export function specialEventEditInitialFromRow(row: {
  title: string;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  event_type: PortalSpecialEventTypeSlug;
  calendar_scope: PortalSpecialCalendarScope;
  cohort_id: string | null;
  section_id: string | null;
  meeting_url?: string | null;
}): {
  title: string;
  notes: string;
  eventDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  eventType: PortalSpecialEventTypeSlug;
  calendarScope: PortalSpecialCalendarScope;
  cohortId: string;
  sectionId: string;
  meetingUrl: string;
} {
  const s = new Date(row.starts_at).getTime();
  const e = new Date(row.ends_at).getTime();
  const eventDate = cordobaIsoDateFromUtcMs(s);
  const base = {
    title: row.title,
    notes: row.notes ?? "",
    eventDate,
    eventType: row.event_type,
    calendarScope: row.calendar_scope,
    cohortId: row.cohort_id ?? "",
    sectionId: row.section_id ?? "",
    meetingUrl: row.meeting_url ?? "",
  };
  if (row.all_day) {
    return { ...base, allDay: true, startTime: "09:00", endTime: "10:00" };
  }
  return {
    ...base,
    allDay: false,
    startTime: cordobaHmFromUtcMs(s),
    endTime: cordobaHmFromUtcMs(e),
  };
}
