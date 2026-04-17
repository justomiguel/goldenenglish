import type { PortalCalendarPageRole } from "@/lib/calendar/loadPortalCalendarPageData";

export function calendarFeedRoleFromProfileRole(role: string): PortalCalendarPageRole | null {
  if (role === "admin") return "admin";
  if (role === "teacher" || role === "assistant") return "teacher";
  if (role === "student") return "student";
  if (role === "parent") return "parent";
  return null;
}
