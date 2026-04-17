import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";

export function expandedOccurrencesToPortalEvents(rows: ExpandedPortalOccurrence[]): PortalCalendarEvent[] {
  return rows.map((e, idx) => ({
    id: `${e.icsUid}-${idx}`,
    kind: e.kind,
    title: e.title,
    start: new Date(e.startMs).toISOString(),
    end: new Date(e.endMs).toISOString(),
    allDay: e.allDay,
    specialEventType: e.specialEventType,
    meetingUrl: e.meetingUrl ?? null,
    sectionId: e.sectionId,
    cohortId: e.cohortId,
    teacherId: e.teacherId,
    roomLabel: e.roomLabel,
  }));
}
