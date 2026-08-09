import type { ProgressSection } from "@/lib/parent/buildProgressSections";
import { isProgressSectionId } from "@/lib/parent/resolveActiveProgressSection";

/** Keep a deep-linked empty section in the picker so the trigger matches the mounted panel. */
export function sectionsForProgressPicker(
  sections: ProgressSection[],
  requested: string | null,
): ProgressSection[] {
  if (!isProgressSectionId(requested)) return sections;
  if (sections.some((section) => section.id === requested)) return sections;
  return [...sections, { id: requested, count: 0, itemKeys: [] }];
}
