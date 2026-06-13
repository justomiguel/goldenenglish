import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalCalendarEvent, PortalCalendarTeacherOption } from "@/types/portalCalendar";
import type { Dictionary } from "@/types/i18n";
import { birthdayRpcRowsToExpandedOccurrences } from "@/lib/birthdays/birthdayRpcRowsToExpandedOccurrences";
import { fetchPortalBirthdaysForViewer } from "@/lib/birthdays/fetchPortalBirthdaysForViewer";
import { loadPortalCalendarPageData, type PortalCalendarPageRole } from "@/lib/calendar/loadPortalCalendarPageData";
import { loadPortalSpecialCalendarEventsOverlapping } from "@/lib/calendar/loadPortalSpecialCalendarEvents";
import { composePortalCalendarPageEvents } from "@/lib/calendar/composePortalCalendarPageEvents";
import { mergeAndSortOccurrences } from "@/lib/calendar/expandPortalCalendarOccurrences";
import { expandedOccurrencesToPortalEvents } from "@/lib/calendar/portalCalendarEventCodec";
import { filterSpecialCalendarRowsForViewer } from "@/lib/calendar/filterSpecialCalendarRowsForViewer";
import {
  loadPortalInstituteEventsForCalendar,
  mapInstituteEventRowsToPortalCalendarEvents,
} from "@/lib/calendar/loadPortalInstituteEventsForCalendar";

/**
 * Date-only window (UTC) for composing portal calendar rows in one server pass.
 * Kept intentionally bounded for PostgREST load; wide enough for FullCalendar month/week navigation.
 * If the institute grows very large schedules, prefer a range-scoped server action instead of widening further.
 */
function defaultViewWindow(): { viewStartIso: string; viewEndIso: string } {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(todayUtc);
  start.setUTCMonth(start.getUTCMonth() - 12);
  const end = new Date(todayUtc);
  end.setUTCMonth(end.getUTCMonth() + 18);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { viewStartIso: iso(start), viewEndIso: iso(end) };
}

export async function buildPortalCalendarPagePayload(
  supabase: SupabaseClient,
  userId: string,
  role: PortalCalendarPageRole,
  opts: {
    locale: string;
    adminTeacherId?: string | null;
    adminRoom?: string | null;
    /** Required for i18n titles on birthday calendar rows. */
    birthdayCopy?: Dictionary["dashboard"]["birthdays"];
  },
): Promise<{
  events: PortalCalendarEvent[];
  teacherOptions: PortalCalendarTeacherOption[];
  roomOptions: string[];
  feedToken: string | null;
}> {
  const { viewStartIso, viewEndIso } = defaultViewWindow();
  const [page, specialRowsRaw, birthdayRows] = await Promise.all([
    loadPortalCalendarPageData(supabase, {
      role,
      userId,
      adminTeacherId: opts?.adminTeacherId ?? null,
      adminRoom: opts?.adminRoom ?? null,
    }),
    loadPortalSpecialCalendarEventsOverlapping(supabase, viewStartIso, viewEndIso),
    opts?.birthdayCopy
      ? fetchPortalBirthdaysForViewer(supabase, userId, viewStartIso, viewEndIso)
      : Promise.resolve([]),
  ]);
  const specialRows = filterSpecialCalendarRowsForViewer(specialRowsRaw, {
    role,
    userId,
    viewerSectionIds: page.viewerSectionIds,
    viewerCohortIds: page.viewerCohortIds,
  });
  const composed = composePortalCalendarPageEvents(page.sections, page.exams, specialRows, viewStartIso, viewEndIso);
  const birthdayExpanded =
    opts?.birthdayCopy != null
      ? birthdayRpcRowsToExpandedOccurrences(birthdayRows, {
          eventTitle: opts.birthdayCopy.calendarEventTitle,
          icsPrefix: opts.birthdayCopy.icsPrefix,
          icsDescription: opts.birthdayCopy.icsDescription,
        })
      : [];
  const expanded = mergeAndSortOccurrences([composed, birthdayExpanded]);
  const baseEvents = expandedOccurrencesToPortalEvents(expanded);
  const instituteRows = await loadPortalInstituteEventsForCalendar(supabase, {
    viewStartIso,
    viewEndIso,
    locale: opts.locale,
    role,
    viewerSectionIds: page.viewerSectionIds,
  });
  const instituteEvents = mapInstituteEventRowsToPortalCalendarEvents(instituteRows, opts.locale);
  const events = [...baseEvents, ...instituteEvents].sort((a, b) => a.start.localeCompare(b.start));

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
