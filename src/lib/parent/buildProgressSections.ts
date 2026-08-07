import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { StudentMiniTestAssessment } from "@/types/learningContent";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { StudentBadgeRowModel } from "@/types/studentBadges";
import type { StudentExamResult } from "@/types/studentExams";

export const PROGRESS_SECTION_EXAMS = "exams";
export const PROGRESS_SECTION_TASKS = "tasks";
export const PROGRESS_SECTION_ASSESSMENTS = "assessments";
export const PROGRESS_SECTION_FEEDBACK = "feedback";
export const PROGRESS_SECTION_BADGES = "badges";

export type ProgressSectionId =
  | typeof PROGRESS_SECTION_EXAMS
  | typeof PROGRESS_SECTION_TASKS
  | typeof PROGRESS_SECTION_ASSESSMENTS
  | typeof PROGRESS_SECTION_FEEDBACK
  | typeof PROGRESS_SECTION_BADGES;

export type ProgressSection = {
  id: ProgressSectionId;
  count: number;
  /** One stable key per item; drives the unread comparison against what this device has seen. */
  itemKeys: string[];
};

export type BuildProgressSectionsInput = {
  exams: StudentExamResult[];
  tasks: StudentLearningTaskRow[];
  assessments: StudentMiniTestAssessment[];
  feedback: ParentFeedbackTimeline;
  badgeRows: StudentBadgeRowModel[];
};

/**
 * Sections offered by the Progress picker, in reading order, skipping anything with no content.
 *
 * Keys fold in the state that makes an item worth a second look (task progress, latest attempt), so
 * a graded task counts as unread again even though its id never changed.
 */
export function buildProgressSections(input: BuildProgressSectionsInput): ProgressSection[] {
  const candidates: ProgressSection[] = [
    {
      id: PROGRESS_SECTION_EXAMS,
      count: input.exams.length,
      itemKeys: input.exams.map((exam) => `${exam.id}:${exam.state}`),
    },
    {
      id: PROGRESS_SECTION_TASKS,
      count: input.tasks.length,
      itemKeys: input.tasks.map((row) => `${row.taskInstanceId}:${row.status}`),
    },
    {
      id: PROGRESS_SECTION_ASSESSMENTS,
      count: input.assessments.length,
      itemKeys: input.assessments.map((row) => `${row.id}:${row.latestAttemptStatus ?? ""}`),
    },
    {
      id: PROGRESS_SECTION_FEEDBACK,
      count: input.feedback.items.length,
      itemKeys: input.feedback.items.map((item) => item.id),
    },
    earnedBadgesSection(input.badgeRows),
  ];

  return candidates.filter((section) => section.count > 0);
}

/** Locked catalog rows ship with every response, so only earned grants count as content. */
function earnedBadgesSection(rows: StudentBadgeRowModel[]): ProgressSection {
  const earned = rows.filter((row) => !row.locked);
  return {
    id: PROGRESS_SECTION_BADGES,
    count: earned.length,
    itemKeys: earned.map((row) => row.id),
  };
}
