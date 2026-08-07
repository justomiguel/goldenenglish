import {
  PROGRESS_SECTION_ASSESSMENTS,
  PROGRESS_SECTION_BADGES,
  PROGRESS_SECTION_EXAMS,
  PROGRESS_SECTION_FEEDBACK,
  PROGRESS_SECTION_TASKS,
  type ProgressSection,
  type ProgressSectionId,
} from "@/lib/parent/buildProgressSections";

const KNOWN_SECTION_IDS = new Set<string>([
  PROGRESS_SECTION_EXAMS,
  PROGRESS_SECTION_TASKS,
  PROGRESS_SECTION_ASSESSMENTS,
  PROGRESS_SECTION_FEEDBACK,
  PROGRESS_SECTION_BADGES,
]);

export function isProgressSectionId(
  value: string | null | undefined,
): value is ProgressSectionId {
  return typeof value === "string" && KNOWN_SECTION_IDS.has(value);
}

/**
 * Which section the screen should show for a requested `?tab=`.
 *
 * Deep links and parent tours (`?tab=tasks|assessments|badges|feedback|exams`) must open that panel
 * even when it has nothing to show, so empty-state copy and `data-tour` anchors still mount. Unknown
 * or missing requests fall back to the first section that does have content.
 */
export function resolveActiveProgressSection(
  requested: string | null | undefined,
  sections: ProgressSection[],
): string {
  if (isProgressSectionId(requested)) return requested;
  if (sections.length === 0) return "";
  return sections[0]!.id;
}
