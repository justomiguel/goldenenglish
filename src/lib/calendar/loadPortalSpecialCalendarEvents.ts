import type { SupabaseClient } from "@supabase/supabase-js";
import type { SpecialCalendarEventRow } from "@/lib/calendar/expandPortalCalendarOccurrences";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const SCOPE = "loadPortalSpecialCalendarEvents" as const;

/**
 * Rows overlapping [viewStartIso, viewEndIso] (inclusive civil dates, UTC midnight bounds).
 */
export async function loadPortalSpecialCalendarEventsOverlapping(
  supabase: SupabaseClient,
  viewStartIso: string,
  viewEndIso: string,
): Promise<SpecialCalendarEventRow[]> {
  const rangeStartIso = `${viewStartIso}T00:00:00.000Z`;
  const rangeEndIso = `${viewEndIso}T23:59:59.999Z`;
  const { data, error } = await supabase
    .from("portal_special_calendar_events")
    .select("id, title, notes, starts_at, ends_at, all_day, event_type, calendar_scope, cohort_id, section_id, meeting_url")
    .lte("starts_at", rangeEndIso)
    .gte("ends_at", rangeStartIso)
    .order("starts_at", { ascending: true })
    .limit(200);
  if (error) {
    logSupabaseClientError(`${SCOPE}:select`, error, { viewStartIso, viewEndIso });
    return [];
  }
  return (data ?? []) as SpecialCalendarEventRow[];
}
