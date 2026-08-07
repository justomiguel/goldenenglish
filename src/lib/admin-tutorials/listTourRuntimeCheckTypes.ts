import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";

export type TourRuntimeEnv = {
  /** Required for create-section / take-attendance when set. */
  cohortId?: string;
  /** Required for take-attendance when set. */
  sectionId?: string;
  /** Required for scholarship tours when set. */
  studentId?: string;
  /** Required for event payment tour when set. */
  eventId?: string;
  /** Required for message detail screen tour when set. */
  messageId?: string;
  /** Required for blog edit screen tour when set. */
  blogArticleId?: string;
  /** Required for finance receipt detail screen tour when set. */
  receiptId?: string;
};

export type TourRuntimeCheck = {
  /** Stable id for failures (`screen:admin-home`, `task:create-cohort`, …). */
  id: string;
  /**
   * Absolute path for the locale, or `null` when env is insufficient
   * (caller should skip that check).
   */
  pathFor: (locale: string, env: TourRuntimeEnv) => string | null;
  /** Anchors expected visible on that route without opening modals / creating data. */
  anchors: readonly AdminTourAnchor[];
};
