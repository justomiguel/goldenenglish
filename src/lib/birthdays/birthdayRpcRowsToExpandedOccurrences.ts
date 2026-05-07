import type { ExpandedPortalOccurrence } from "@/lib/calendar/expandPortalCalendarOccurrences";
import type { PortalBirthdayRpcRow } from "@/types/birthdays";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type BirthdayCalendarCopy = {
  eventTitle: string;
  icsPrefix: string;
  icsDescription: string;
};

export function birthdayRpcRowsToExpandedOccurrences(
  rows: PortalBirthdayRpcRow[],
  copy: BirthdayCalendarCopy,
): ExpandedPortalOccurrence[] {
  return rows.map((r) => {
    const display = formatProfileSnakeSurnameFirst({
      first_name: r.first_name,
      last_name: r.last_name,
    });
    const cel = String(r.celebration_date).slice(0, 10);
    const [y, m, d] = cel.split("-").map(Number);
    const startMs = Date.UTC(y, m - 1, d, 12, 0, 0, 0);
    const endMs = startMs + 86400000;
    const yearTag = String(y);
    const icsSummary = `${copy.icsPrefix} ${display}`.trim();
    return {
      kind: "birthday",
      title: `${copy.eventTitle}: ${display}`.trim(),
      startMs,
      endMs,
      allDay: true,
      icsUid: `ge-birthday-${r.student_id}-${yearTag}@goldenenglish`,
      description: null,
      icsSummary,
      icsDescription: copy.icsDescription.trim(),
    } satisfies ExpandedPortalOccurrence;
  });
}
