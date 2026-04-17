import type { Dictionary } from "@/types/i18n";
import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";
import type { PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";

type SpecialTypeDict = Dictionary["dashboard"]["portalCalendar"]["specialTypes"];

function typeEntry(dict: SpecialTypeDict, t: PortalSpecialEventTypeSlug) {
  return dict[t as keyof SpecialTypeDict];
}

/**
 * Sets `icsSummary` / `icsDescription` on special occurrences for RFC5545 export.
 */
export function applyPortalSpecialEventIcsPresentation(
  rows: ExpandedPortalOccurrence[],
  specialTypesDict: SpecialTypeDict,
): ExpandedPortalOccurrence[] {
  return rows.map((ev) => {
    if (ev.kind !== "special" || !ev.specialEventType) return ev;
    const entry = typeEntry(specialTypesDict, ev.specialEventType);
    const prefix = entry.icsPrefix.trim();
    const legend = entry.legend.trim();
    const summary = `${prefix} ${ev.title}`.trim();
    const parts = [legend];
    if (ev.description?.trim()) parts.push(ev.description.trim());
    if (ev.meetingUrl?.trim()) parts.push(ev.meetingUrl.trim());
    const description = parts.join("\n\n");
    return { ...ev, icsSummary: summary, icsDescription: description };
  });
}
