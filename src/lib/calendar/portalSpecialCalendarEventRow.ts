import type { PortalSpecialCalendarScope, PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";

/** Row shape from `portal_special_calendar_events` (portal calendar + admin). */
export type PortalSpecialCalendarEventRow = {
  id: string;
  title: string;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  event_type: PortalSpecialEventTypeSlug;
  calendar_scope: PortalSpecialCalendarScope;
  cohort_id: string | null;
  section_id: string | null;
  meeting_url: string | null;
};
