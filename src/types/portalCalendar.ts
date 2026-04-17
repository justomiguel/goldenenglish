import type { PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";

export type PortalCalendarEventKind = "class" | "exam" | "special";

/** UI / JSON serialization for the portal calendar screen. */
export type PortalCalendarEvent = {
  id: string;
  kind: PortalCalendarEventKind;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  /** When `kind` is `special`, catalog type for chip color and tooltips. */
  specialEventType?: PortalSpecialEventTypeSlug;
  /** Virtual meeting link (e.g. parent meetings), optional. */
  meetingUrl?: string | null;
  sectionId?: string;
  cohortId?: string;
  teacherId?: string;
  roomLabel?: string | null;
};

export type PortalCalendarTeacherOption = { id: string; label: string };
