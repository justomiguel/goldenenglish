import type { PortalCalendarEvent } from "@/types/portalCalendar";
import type { PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";

export const SPECIAL_EVENT_CHIP_CLASS: Record<PortalSpecialEventTypeSlug, string> = {
  holiday:
    "border-[color:var(--color-calendarSpecial-holiday)] bg-[color-mix(in_srgb,var(--color-calendarSpecial-holiday)_18%,var(--color-surface))] text-[var(--color-foreground)]",
  institutional_exam:
    "border-[var(--color-error)] bg-[var(--color-error)]/10 text-[var(--color-error)]",
  parent_meeting:
    "border-[color:var(--color-calendarSpecial-parentMeeting)] bg-[color-mix(in_srgb,var(--color-calendarSpecial-parentMeeting)_16%,var(--color-surface))] text-[var(--color-foreground)]",
  social:
    "border-[color:var(--color-calendarSpecial-social)] bg-[color-mix(in_srgb,var(--color-calendarSpecial-social)_14%,var(--color-surface))] text-[var(--color-foreground)]",
  trimester_admin:
    "border-[color:var(--color-calendarSpecial-trimesterAdmin)] bg-[color-mix(in_srgb,var(--color-calendarSpecial-trimesterAdmin)_14%,var(--color-surface))] text-[var(--color-foreground)]",
};

/** Compact swatch for legend (drops text color tokens). */
export function specialTypeSwatchClass(t: PortalSpecialEventTypeSlug): string {
  return SPECIAL_EVENT_CHIP_CLASS[t].replace(/\s*text-\[[^\]]+\]/gu, "");
}

export function chipClassForPortalCalendarEvent(ev: PortalCalendarEvent): string {
  if (ev.kind === "exam") return "border-[var(--color-error)] bg-[var(--color-error)]/10 text-[var(--color-error)]";
  if (ev.kind === "class") return "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]";
  if (ev.kind === "special" && ev.specialEventType) {
    return (
      SPECIAL_EVENT_CHIP_CLASS[ev.specialEventType] ??
      "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-foreground)]"
    );
  }
  return "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-foreground)]";
}
