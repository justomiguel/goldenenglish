export const PORTAL_SPECIAL_EVENT_TYPES = [
  "holiday",
  "institutional_exam",
  "parent_meeting",
  "social",
  "trimester_admin",
] as const;

export type PortalSpecialEventTypeSlug = (typeof PORTAL_SPECIAL_EVENT_TYPES)[number];

export const PORTAL_SPECIAL_CALENDAR_SCOPES = ["global", "cohort", "section"] as const;

export type PortalSpecialCalendarScope = (typeof PORTAL_SPECIAL_CALENDAR_SCOPES)[number];

export function isPortalSpecialEventTypeSlug(s: string): s is PortalSpecialEventTypeSlug {
  return (PORTAL_SPECIAL_EVENT_TYPES as readonly string[]).includes(s);
}

export function isPortalSpecialCalendarScope(s: string): s is PortalSpecialCalendarScope {
  return (PORTAL_SPECIAL_CALENDAR_SCOPES as readonly string[]).includes(s);
}

export function icsCategoryForSpecialType(t: PortalSpecialEventTypeSlug): string {
  switch (t) {
    case "holiday":
      return "GE_SPECIAL_HOLIDAY";
    case "institutional_exam":
      return "GE_SPECIAL_INSTITUTIONAL_EXAM";
    case "parent_meeting":
      return "GE_SPECIAL_PARENT_MEETING";
    case "social":
      return "GE_SPECIAL_SOCIAL";
    case "trimester_admin":
      return "GE_SPECIAL_TRIMESTER_ADMIN";
    default:
      return "GE_SPECIAL";
  }
}
