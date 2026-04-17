import type { PortalCalendarPageRole } from "@/lib/calendar/loadPortalCalendarPageData";
import type { PortalSpecialCalendarEventRow } from "@/lib/calendar/portalSpecialCalendarEventRow";

export type SpecialCalendarViewerFilterContext = {
  role: PortalCalendarPageRole;
  userId: string;
  viewerSectionIds: string[];
  viewerCohortIds: string[];
};

function scopeIntersectsViewer(row: PortalSpecialCalendarEventRow, ctx: SpecialCalendarViewerFilterContext): boolean {
  if (row.calendar_scope === "global") return true;
  if (row.calendar_scope === "cohort" && row.cohort_id) {
    return ctx.viewerCohortIds.includes(row.cohort_id);
  }
  if (row.calendar_scope === "section" && row.section_id) {
    return ctx.viewerSectionIds.includes(row.section_id);
  }
  return false;
}

function rowVisibleForNonParentTypes(row: PortalSpecialCalendarEventRow, ctx: SpecialCalendarViewerFilterContext): boolean {
  return scopeIntersectsViewer(row, ctx);
}

function rowVisibleForParentMeeting(row: PortalSpecialCalendarEventRow, ctx: SpecialCalendarViewerFilterContext): boolean {
  if (ctx.role === "student") return false;
  if (ctx.role === "admin") return true;
  if (ctx.role === "parent") {
    return scopeIntersectsViewer(row, ctx) || row.calendar_scope === "global";
  }
  if (ctx.role === "teacher") {
    if (row.calendar_scope !== "section" || !row.section_id) return false;
    return ctx.viewerSectionIds.includes(row.section_id);
  }
  return false;
}

/**
 * Mirrors `public.portal_special_calendar_row_visible` for service-role reads (iCal)
 * and as a second line of defense with session clients.
 */
export function filterSpecialCalendarRowsForViewer(
  rows: PortalSpecialCalendarEventRow[],
  ctx: SpecialCalendarViewerFilterContext,
): PortalSpecialCalendarEventRow[] {
  if (ctx.role === "admin") return rows;

  return rows.filter((row) => {
    if (row.event_type === "parent_meeting") {
      return rowVisibleForParentMeeting(row, ctx);
    }
    return rowVisibleForNonParentTypes(row, ctx);
  });
}
