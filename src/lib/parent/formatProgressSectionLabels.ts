import type { Dictionary } from "@/types/i18n";
import type { ProgressSectionId } from "@/lib/parent/buildProgressSections";

export type ProgressPickerCopy = Dictionary["dashboard"]["parent"]["progressPicker"];

const COUNT_KEYS: Record<ProgressSectionId, { one: keyof ProgressPickerCopy; many: keyof ProgressPickerCopy }> = {
  exams: { one: "examsOne", many: "examsMany" },
  tasks: { one: "tasksOne", many: "tasksMany" },
  assessments: { one: "miniTestsOne", many: "miniTestsMany" },
  feedback: { one: "feedbackOne", many: "feedbackMany" },
  badges: { one: "badgesOne", many: "badgesMany" },
};

const LABEL_KEYS: Record<ProgressSectionId, keyof ProgressPickerCopy> = {
  exams: "sectionExams",
  tasks: "sectionTasks",
  assessments: "sectionMiniTests",
  feedback: "sectionFeedback",
  badges: "sectionBadges",
};

/**
 * The picker names its own sections rather than borrowing the sidebar's, because "Evaluaciones" here
 * means the teacher's exams while the learning-route section is a mini-test.
 */
export function progressSectionLabel(
  sectionId: ProgressSectionId,
  copy: ProgressPickerCopy,
): string {
  return copy[LABEL_KEYS[sectionId]];
}

/** "3 comments" / "1 task": the noun belongs to the section, so the count reads on its own. */
export function formatProgressSectionCount(
  sectionId: ProgressSectionId,
  count: number,
  copy: ProgressPickerCopy,
): string {
  const keys = COUNT_KEYS[sectionId];
  if (count === 1) return copy[keys.one];
  return copy[keys.many].replace("{count}", String(count));
}

export function formatProgressUnread(count: number, copy: ProgressPickerCopy): string | null {
  if (count <= 0) return null;
  if (count === 1) return copy.unreadOne;
  return copy.unreadMany.replace("{count}", String(count));
}

export function formatProgressUnreadAria(
  count: number,
  sectionLabel: string,
  copy: ProgressPickerCopy,
): string {
  return copy.unreadAria.replace("{count}", String(count)).replace("{section}", sectionLabel);
}
