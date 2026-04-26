/**
 * Order and ids for admin “section workspace” tabs. Keep in sync with
 * `AcademicSectionShellTabs` (single source to validate `?tab=` in URLs).
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

export function parseAcademicSectionShellTabParam(
  raw: string | string[] | undefined,
): AcademicSectionShellTabId | undefined {
  const t = Array.isArray(raw) ? raw[0] : raw;
  if (t == null || t === "") return undefined;
  return (ACADEMIC_SECTION_SHELL_TAB_ORDER as readonly string[]).includes(t) ? (t as AcademicSectionShellTabId) : undefined;
}
