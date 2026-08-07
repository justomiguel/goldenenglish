import type { ParentFeedbackItem, ParentFeedbackTimeline } from "@/types/parentFeedback";

/** Feedback written within this many days still deserves a "new" affordance. */
export const PARENT_FEEDBACK_NEW_WINDOW_DAYS = 14;

export const PARENT_FEEDBACK_DEFAULT_LIMIT = 20;

/** An entry before recency is resolved; loaders build these, this module stamps `isNew`. */
export type ParentFeedbackDraft = Omit<ParentFeedbackItem, "isNew">;

const MS_PER_DAY = 86_400_000;

function parseDay(occurredOn: string): number | null {
  if (!occurredOn) return null;
  const parsed = Date.parse(occurredOn.length <= 10 ? `${occurredOn}T00:00:00Z` : occurredOn);
  return Number.isFinite(parsed) ? parsed : null;
}

function startOfUtcDay(at: number): number {
  return Math.floor(at / MS_PER_DAY) * MS_PER_DAY;
}

/**
 * Recency is measured in whole UTC days: cohort grades only carry a date, so comparing
 * against a timestamped "now" would silently shorten the window by up to a day.
 */
export function isRecentParentFeedback(
  occurredOn: string,
  now: Date,
  windowDays = PARENT_FEEDBACK_NEW_WINDOW_DAYS,
): boolean {
  const at = parseDay(occurredOn);
  if (at == null) return false;
  return startOfUtcDay(now.getTime()) - startOfUtcDay(at) <= windowDays * MS_PER_DAY;
}

export interface BuildParentFeedbackTimelineParams {
  entries: ParentFeedbackDraft[];
  now: Date;
  limit?: number;
  windowDays?: number;
}

/**
 * Merges the cohort-grade and learning-attempt feedback streams into one family-facing
 * timeline: text-bearing entries only, newest first, bounded, with a "new" count.
 */
export function buildParentFeedbackTimeline({
  entries,
  now,
  limit = PARENT_FEEDBACK_DEFAULT_LIMIT,
  windowDays = PARENT_FEEDBACK_NEW_WINDOW_DAYS,
}: BuildParentFeedbackTimelineParams): ParentFeedbackTimeline {
  const withText = entries.flatMap((entry) => {
    const feedback = entry.feedback.trim();
    if (!feedback) return [];
    const at = parseDay(entry.occurredOn);
    if (at == null) return [];
    return [{ at, item: { ...entry, feedback } }];
  });

  withText.sort((left, right) => right.at - left.at);

  const items = withText.slice(0, Math.max(0, limit)).map(({ item }) => ({
    ...item,
    isNew: isRecentParentFeedback(item.occurredOn, now, windowDays),
  }));

  return { items, newCount: items.filter((item) => item.isNew).length };
}
