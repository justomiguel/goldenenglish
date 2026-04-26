import type { EventInput } from "@fullcalendar/core";
import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";
import {
  portalCalendarEventFcClassNames,
  portalCalendarEventIsOwn,
  portalCalendarEventIsVirtual,
  portalCalendarEventTiming,
  type PortalCalendarEventTiming,
  type PortalCalendarEventVisualContext,
} from "@/lib/calendar/portalCalendarEventVisual";

/** Serialized on FullCalendar `extendedProps` for client rendering (no HTML). */
export type PortalCalendarFcExtendedProps = {
  kind: PortalCalendarEvent["kind"];
  specialEventType?: PortalSpecialEventTypeSlug;
  meetingUrl: string | null;
  roomLabel: string | null;
  timing: PortalCalendarEventTiming;
  isVirtual: boolean;
  isOwn: boolean;
};

export type BuildPortalCalendarFcEventInputsContext = PortalCalendarEventVisualContext & {
  /** "Now" for past/today/upcoming — pass from client `useMemo` for stable rendering per tick. */
  now: Date;
};

export function buildPortalCalendarFcEventInputs(
  events: PortalCalendarEvent[],
  ctx: BuildPortalCalendarFcEventInputsContext,
): EventInput[] {
  return events.map((ev) => {
    const timing = portalCalendarEventTiming(ev, ctx.now);
    const isVirtual = portalCalendarEventIsVirtual(ev);
    const isOwn = portalCalendarEventIsOwn(ev, ctx);
    return {
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: Boolean(ev.allDay),
      classNames: portalCalendarEventFcClassNames(ev, ctx.now, ctx),
      extendedProps: {
        kind: ev.kind,
        specialEventType: ev.specialEventType,
        meetingUrl: ev.meetingUrl ?? null,
        roomLabel: ev.roomLabel ?? null,
        timing,
        isVirtual,
        isOwn,
      } satisfies PortalCalendarFcExtendedProps,
    };
  });
}
