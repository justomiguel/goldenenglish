import type { PortalCalendarEvent } from "@/types/portalCalendar";
import {
  portalCalendarEventIsOwn,
  portalCalendarEventIsVirtual,
  portalCalendarEventTiming,
  type PortalCalendarEventVisualContext,
} from "@/lib/calendar/portalCalendarEventVisual";

/** Semantic tone for narrow-agenda dot indicators (maps to design tokens). */
export type PortalCalendarEventDotTone =
  | "past"
  | "exam"
  | "special"
  | "birthday"
  | "today"
  | "virtual"
  | "inperson";

const DOT_TONE_CLASS: Record<PortalCalendarEventDotTone, string> = {
  past: "bg-[var(--color-muted-foreground)]",
  exam: "bg-[var(--color-error)]",
  special: "bg-[var(--color-accent)]",
  birthday: "bg-[var(--color-secondary)]",
  today: "bg-[var(--color-warning)]",
  virtual: "bg-[var(--color-primary)]",
  inperson: "bg-[var(--color-success)]",
};

export function portalCalendarEventDotTone(
  ev: PortalCalendarEvent,
  now: Date,
): PortalCalendarEventDotTone {
  const timing = portalCalendarEventTiming(ev, now);
  if (timing === "past") return "past";
  if (ev.kind === "exam") return "exam";
  if (ev.kind === "special") return "special";
  if (ev.kind === "birthday") return "birthday";
  if (timing === "today") return "today";
  if (portalCalendarEventIsVirtual(ev)) return "virtual";
  return "inperson";
}

export function portalCalendarEventDotClassName(
  ev: PortalCalendarEvent,
  now: Date,
  ctx: PortalCalendarEventVisualContext,
): string {
  const tone = portalCalendarEventDotTone(ev, now);
  const base = `h-2.5 w-2.5 shrink-0 rounded-full ${DOT_TONE_CLASS[tone]}`;
  if (portalCalendarEventIsOwn(ev, ctx)) {
    return `${base} ring-2 ring-[var(--color-secondary)] ring-offset-1 ring-offset-[var(--color-surface)]`;
  }
  return base;
}
