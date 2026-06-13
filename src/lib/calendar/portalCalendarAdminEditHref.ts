import type { PortalCalendarEventKind } from "@/types/portalCalendar";

const PORTAL_CALENDAR_ID_SUFFIX = /^(.+@goldenenglish)-\d+$/i;

function icsUidFromPortalCalendarEventId(portalEventId: string): string | null {
  const m = portalEventId.trim().match(PORTAL_CALENDAR_ID_SUFFIX);
  return m?.[1] ?? null;
}

/**
 * Admin edit URL for institute calendar rows backed by DB entities (not classes/exams).
 */
export function portalCalendarAdminEditHref(
  locale: string,
  portalEventId: string,
  kind: PortalCalendarEventKind,
): string | null {
  const icsUid = icsUidFromPortalCalendarEventId(portalEventId);
  if (!icsUid) return null;

  if (kind === "special") {
    const m = icsUid.match(/^ge-special-([0-9a-f-]{36})@goldenenglish$/i);
    if (!m) return null;
    return `/${locale}/dashboard/admin/calendar/special/${m[1]}`;
  }

  if (kind === "institute_event") {
    const m = icsUid.match(/^ge-institute-event-([0-9a-f-]{36})@goldenenglish$/i);
    if (!m) return null;
    return `/${locale}/dashboard/admin/events/${m[1]}`;
  }

  return null;
}
