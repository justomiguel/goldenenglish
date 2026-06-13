import type { SupabaseClient } from "@supabase/supabase-js";
import { isEventLocale, type EventLocale } from "@/lib/events/domain";
import { resolveEventTranslation } from "@/lib/events/resolveEventTranslation";
import { loadEventTranslationsByIds } from "@/lib/events/server/loadEventTranslations";
import type { PortalCalendarPageRole } from "@/lib/calendar/loadPortalCalendarPageData";
import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";
import type { PortalCalendarEvent } from "@/types/portalCalendar";

const INSTITUTE_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

export type PortalInstituteEventCalendarRow = {
  id: string;
  slug: string;
  title: string;
  eventDateIso: string;
  location: string | null;
  privateToSection: boolean;
  sectionId: string | null;
};

function viewWindowBoundsIso(viewStartIso: string, viewEndIso: string): { from: string; to: string } {
  return {
    from: `${viewStartIso}T00:00:00.000Z`,
    to: `${viewEndIso}T23:59:59.999Z`,
  };
}

export function filterInstituteEventRowsForViewer(
  rows: PortalInstituteEventCalendarRow[],
  params: { role: PortalCalendarPageRole; viewerSectionIds: string[] },
): PortalInstituteEventCalendarRow[] {
  if (params.role === "admin") return rows;
  const sectionSet = new Set(params.viewerSectionIds);
  return rows.filter((row) => {
    if (!row.privateToSection) return true;
    if (!row.sectionId) return false;
    return sectionSet.has(row.sectionId);
  });
}

export async function loadPortalInstituteEventsForCalendar(
  supabase: SupabaseClient,
  params: {
    viewStartIso: string;
    viewEndIso: string;
    locale: string;
    role: PortalCalendarPageRole;
    viewerSectionIds: string[];
  },
): Promise<PortalInstituteEventCalendarRow[]> {
  const { from, to } = viewWindowBoundsIso(params.viewStartIso, params.viewEndIso);
  const { data, error } = await supabase
    .from("events")
    .select("id, slug, title, description, event_date, location, private_to_section, section_id, default_locale")
    .eq("status", "published")
    .is("archived_at", null)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true });

  if (error || !data?.length) return [];

  const translationsByEvent = await loadEventTranslationsByIds(
    supabase,
    data.map((row) => String(row.id)),
  );

  const mapped: PortalInstituteEventCalendarRow[] = data.map((row) => {
    const defaultLocale = isEventLocale(String(row.default_locale ?? "es"))
      ? (String(row.default_locale) as EventLocale)
      : "es";
    const resolved = resolveEventTranslation(
      translationsByEvent.get(String(row.id)) ?? [],
      {
        title: String(row.title),
        description: String(row.description ?? ""),
        location: row.location != null ? String(row.location) : null,
        defaultLocale,
      },
      params.locale,
    );
    return {
      id: String(row.id),
      slug: String(row.slug),
      title: resolved.title,
      eventDateIso: String(row.event_date ?? ""),
      location: resolved.location,
      privateToSection: Boolean(row.private_to_section),
      sectionId: row.section_id != null ? String(row.section_id) : null,
    };
  });

  return filterInstituteEventRowsForViewer(mapped, {
    role: params.role,
    viewerSectionIds: params.viewerSectionIds,
  });
}

export function mapInstituteEventRowsToPortalCalendarEvents(
  rows: PortalInstituteEventCalendarRow[],
  locale: string,
): PortalCalendarEvent[] {
  return rows.map((row) => {
    const startMs = new Date(row.eventDateIso).getTime();
    const endMs = Number.isFinite(startMs) ? startMs + INSTITUTE_EVENT_DURATION_MS : startMs;
    return {
      id: `institute-event-${row.id}`,
      kind: "institute_event" as const,
      title: row.title,
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      roomLabel: row.location,
      publicHref: `/${locale}/events/${row.slug}`,
    };
  });
}

export function mapInstituteEventRowsToExpandedOccurrences(
  rows: PortalInstituteEventCalendarRow[],
): ExpandedPortalOccurrence[] {
  return rows.map((row) => {
    const startMs = new Date(row.eventDateIso).getTime();
    const endMs = Number.isFinite(startMs) ? startMs + INSTITUTE_EVENT_DURATION_MS : startMs;
    const locationNote = row.location?.trim();
    return {
      kind: "institute_event",
      title: row.title,
      startMs,
      endMs,
      allDay: false,
      icsUid: `ge-institute-event-${row.id}@goldenenglish`,
      description: locationNote ? locationNote : null,
      roomLabel: row.location,
    };
  });
}
