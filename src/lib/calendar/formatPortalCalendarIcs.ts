import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";
import { icsCategoryForSpecialType } from "@/types/portalSpecialCalendar";

const MAX_EVENTS = 2000;

function foldIcsText(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsUtcProp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsValueDateFromUtcMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function categoryFor(ev: ExpandedPortalOccurrence): string {
  if (ev.kind === "class") return "GE_CLASS";
  if (ev.kind === "exam") return "GE_EXAM";
  if (ev.kind === "special" && ev.specialEventType) return icsCategoryForSpecialType(ev.specialEventType);
  return "GE_SPECIAL";
}

function icsProdId(brandName?: string): string {
  const safe = (brandName ?? "GE").replace(/[\\/\n\r]/g, " ").trim() || "GE";
  return `-//${safe}//Portal Calendar//EN`;
}

/**
 * RFC5545 calendar document for subscriptions (Google / Outlook “from URL”).
 * Caps the number of VEVENT rows for safety on large admin feeds.
 *
 * `params.brandName` should come from `getBrandPublic().name` /
 * `system.properties` (no hardcoded institute identity here).
 */
export function formatPortalCalendarIcs(
  rows: ExpandedPortalOccurrence[],
  params?: { calName?: string; brandName?: string },
): string {
  const slice = rows.slice(0, MAX_EVENTS);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${icsProdId(params?.brandName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (params?.calName) {
    lines.push(`X-WR-CALNAME:${foldIcsText(params.calName)}`);
  }
  if (rows.length > MAX_EVENTS) {
    lines.push(`X-GE-TRUNCATED:${rows.length - MAX_EVENTS}`);
  }
  const stamp = icsUtcProp(new Date());
  for (const ev of slice) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${foldIcsText(ev.icsUid)}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`CATEGORIES:${categoryFor(ev)}`);
    const summary = (ev.icsSummary ?? ev.title).trim();
    lines.push(`SUMMARY:${foldIcsText(summary)}`);
    const descSource = (ev.icsDescription ?? ev.description)?.trim();
    if (descSource) {
      lines.push(`DESCRIPTION:${foldIcsText(descSource)}`);
    }
    if (ev.allDay) {
      const ds = icsValueDateFromUtcMs(ev.startMs);
      const endEx = icsValueDateFromUtcMs(ev.startMs + 86400000);
      lines.push(`DTSTART;VALUE=DATE:${ds}`);
      lines.push(`DTEND;VALUE=DATE:${endEx}`);
    } else {
      lines.push(`DTSTART:${icsUtcProp(new Date(ev.startMs))}`);
      lines.push(`DTEND:${icsUtcProp(new Date(ev.endMs))}`);
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
