import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";
import { formatIsoDateUtcFromMs } from "@/lib/calendar/civilGregorianDate";

export function expandedOccurrencesToPortalEvents(rows: ExpandedPortalOccurrence[]): PortalCalendarEvent[] {
  return rows.map((e, idx) => {
    const shared = {
      id: `${e.icsUid}-${idx}`,
      kind: e.kind,
      title: e.title,
      allDay: e.allDay,
      specialEventType: e.specialEventType,
      meetingUrl: e.meetingUrl ?? null,
      sectionId: e.sectionId,
      cohortId: e.cohortId,
      teacherId: e.teacherId,
      roomLabel: e.roomLabel,
    } satisfies Omit<PortalCalendarEvent, "start" | "end">;
    if (e.allDay) {
      return {
        ...shared,
        start: formatIsoDateUtcFromMs(e.startMs),
        end: formatIsoDateUtcFromMs(e.endMs),
      };
    }
    return {
      ...shared,
      start: new Date(e.startMs).toISOString(),
      end: new Date(e.endMs).toISOString(),
    };
  });
}
