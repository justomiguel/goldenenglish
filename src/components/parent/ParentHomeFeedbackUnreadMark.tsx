"use client";

import { UnreadCountPill } from "@/components/atoms/UnreadCountPill";
import { useProgressItemUnread } from "@/hooks/useProgressItemUnread";
import { PROGRESS_SECTION_FEEDBACK } from "@/lib/parent/buildProgressSections";

export interface ParentHomeFeedbackUnreadMarkProps {
  studentId: string | null;
  /** Timeline identity of the latest comment; null when the grade came without one. */
  feedbackItemKey: string | null;
  label: string;
  ariaLabel: string;
}

/**
 * Flags on the home screen that the latest teacher comment has not been read on this device, using
 * the same per-device store as the Progress picker, so opening Feedback clears it here too.
 */
export function ParentHomeFeedbackUnreadMark({
  studentId,
  feedbackItemKey,
  label,
  ariaLabel,
}: ParentHomeFeedbackUnreadMarkProps) {
  const isUnread = useProgressItemUnread({
    studentId,
    sectionId: PROGRESS_SECTION_FEEDBACK,
    itemKey: feedbackItemKey,
  });

  return <UnreadCountPill label={isUnread ? label : null} ariaLabel={ariaLabel} />;
}
