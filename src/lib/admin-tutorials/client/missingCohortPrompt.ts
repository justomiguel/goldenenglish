export const ADMIN_TUTORIAL_MISSING_COHORT_NOTICE_EVENT =
  "ge:admin-tutorial:missing-cohort-notice";

export type MissingCohortNoticeCopy = {
  title: string;
  description: string;
  dismiss: string;
};

export type MissingCohortNoticeDetail = {
  copy: MissingCohortNoticeCopy;
  resolve: () => void;
};

export function requestMissingCohortNotice(
  copy: MissingCohortNoticeCopy,
): Promise<void> {
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<MissingCohortNoticeDetail>(ADMIN_TUTORIAL_MISSING_COHORT_NOTICE_EVENT, {
        detail: { copy, resolve },
      }),
    );
  });
}
