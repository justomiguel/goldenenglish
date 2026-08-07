/**
 * Order and ids for admin section workspace areas / legacy `?tab=` values.
 * Hub navigation omits `general` (overview lives on the hub). Keep `general` in
 * the parse union so old bookmarks resolve to the hub.
 */
export const ACADEMIC_SECTION_SHELL_TAB_ORDER = [
  "general",
  "configuration",
  "teachers",
  "learningRoute",
  "evaluations",
  "fees",
  "attendance",
  "students",
] as const;

export type AcademicSectionShellTabId = (typeof ACADEMIC_SECTION_SHELL_TAB_ORDER)[number];

/** Navigable hub cards / drill-down areas (no overview tab). Configuration last (WIP content). */
export const ACADEMIC_SECTION_SHELL_HUB_AREA_ORDER = [
  "teachers",
  "learningRoute",
  "evaluations",
  "fees",
  "attendance",
  "students",
  "configuration",
] as const;

export type AcademicSectionShellAreaId = (typeof ACADEMIC_SECTION_SHELL_HUB_AREA_ORDER)[number];

export function parseAcademicSectionShellTabParam(
  raw: string | string[] | undefined,
): AcademicSectionShellTabId | undefined {
  const t = Array.isArray(raw) ? raw[0] : raw;
  if (t == null || t === "") return undefined;
  return (ACADEMIC_SECTION_SHELL_TAB_ORDER as readonly string[]).includes(t)
    ? (t as AcademicSectionShellTabId)
    : undefined;
}
