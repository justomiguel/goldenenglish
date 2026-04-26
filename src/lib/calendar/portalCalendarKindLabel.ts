import type { PortalCalendarEventKind } from "@/types/portalCalendar";
import type { PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";

type SpecialChipSource = Record<PortalSpecialEventTypeSlug, { chip: string }>;

/** Matches `dashboard.portalCalendar.legend` keys in dictionaries. */
type PortalCalendarLegendLabels = { class: string; exam: string; special: string };

export function portalCalendarKindLabel(
  kind: PortalCalendarEventKind,
  specialEventType: PortalSpecialEventTypeSlug | undefined,
  legend: PortalCalendarLegendLabels,
  specialTypes: SpecialChipSource,
): string {
  if (kind === "exam") return legend.exam;
  if (kind === "special" && specialEventType) return specialTypes[specialEventType].chip;
  if (kind === "special") return legend.special;
  return legend.class;
}
