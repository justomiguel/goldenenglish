import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalCalendarEvent, PortalCalendarTeacherOption } from "@/types/portalCalendar";
import { loadPortalCalendarPageData, type PortalCalendarPageRole } from "@/lib/calendar/loadPortalCalendarPageData";
import { loadPortalSpecialCalendarEventsOverlapping } from "@/lib/calendar/loadPortalSpecialCalendarEvents";
import { composePortalCalendarPageEvents } from "@/lib/calendar/composePortalCalendarPageEvents";
import { expandedOccurrencesToPortalEvents } from "@/lib/calendar/portalCalendarEventCodec";
import { filterSpecialCalendarRowsForViewer } from "@/lib/calendar/filterSpecialCalendarRowsForViewer";

function defaultViewWindow(): { viewStartIso: string; viewEndIso: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 120);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { viewStartIso: iso(start), viewEndIso: iso(end) };
}

export async function buildPortalCalendarPagePayload(
  supabase: SupabaseClient,
  userId: string,
  role: PortalCalendarPageRole,
  opts?: { adminTeacherId?: string | null; adminRoom?: string | null },
): Promise<{
  events: PortalCalendarEvent[];
  teacherOptions: PortalCalendarTeacherOption[];
  roomOptions: string[];
  feedToken: string | null;
}> {
  const page = await loadPortalCalendarPageData(supabase, {
    role,
    userId,
    adminTeacherId: opts?.adminTeacherId ?? null,
    adminRoom: opts?.adminRoom ?? null,
  });
  const { viewStartIso, viewEndIso } = defaultViewWindow();
  const specialRowsRaw = await loadPortalSpecialCalendarEventsOverlapping(supabase, viewStartIso, viewEndIso);
  const specialRows = filterSpecialCalendarRowsForViewer(specialRowsRaw, {
    role,
    userId,
    viewerSectionIds: page.viewerSectionIds,
    viewerCohortIds: page.viewerCohortIds,
  });
  const expanded = composePortalCalendarPageEvents(page.sections, page.exams, specialRows, viewStartIso, viewEndIso);
  const events = expandedOccurrencesToPortalEvents(expanded);

  const { data: tokRow } = await supabase
    .from("profiles")
    .select("calendar_feed_token")
    .eq("id", userId)
    .maybeSingle();
  const feedToken =
    tokRow && typeof tokRow === "object" && "calendar_feed_token" in tokRow
      ? ((tokRow as { calendar_feed_token?: string | null }).calendar_feed_token ?? null)
      : null;

  return {
    events,
    teacherOptions: page.teacherOptions,
    roomOptions: page.roomOptions,
    feedToken: typeof feedToken === "string" && feedToken.length > 0 ? feedToken : null,
  };
}
