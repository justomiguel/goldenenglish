import type { Dictionary } from "@/types/i18n";

export type ParentAttendancePwaLabels = Dictionary["dashboard"]["parent"]["attendancePwa"];

/** Fallbacks when locale JSON is behind the component (partial deploy / stale cache). */
const LABEL_FALLBACKS = {
  sectionChildLabel: "Student: {{name}}",
  sectionAttendanceHeading: "Attendance this month",
  sectionMonthLine: "{{sessions}} class(es) recorded",
  recentMarksCount: "{{count}}",
  recentMarksExpandAria: "Show {{count}} latest records for {section}",
  recentMarksCollapseAria: "Hide latest records for {section}",
  childFilterLabel: "Student",
} as const satisfies Partial<ParentAttendancePwaLabels>;

export type ParentAttendancePwaLabelKey = keyof typeof LABEL_FALLBACKS;

export function parentAttendancePwaLabel(
  labels: ParentAttendancePwaLabels,
  key: ParentAttendancePwaLabelKey,
): string {
  const value = labels[key];
  return typeof value === "string" && value.length > 0 ? value : LABEL_FALLBACKS[key];
}

export function formatSectionMonthLine(
  labels: ParentAttendancePwaLabels,
  monthPercent: number,
  sessionsThisMonth: number,
): string {
  const template = parentAttendancePwaLabel(labels, "sectionMonthLine");
  return template
    .replace("{{sessions}}", String(sessionsThisMonth))
    .replace("{{pct}}", String(monthPercent));
}

export function recentMarksToggleAria(
  labels: ParentAttendancePwaLabels,
  expanded: boolean,
  markCount: number,
  sectionName: string,
): string {
  const section = sectionName || labels.sectionFallback;
  if (expanded) {
    return parentAttendancePwaLabel(labels, "recentMarksCollapseAria").replace("{section}", section);
  }
  return parentAttendancePwaLabel(labels, "recentMarksExpandAria")
    .replace("{count}", String(markCount))
    .replace("{section}", section);
}
