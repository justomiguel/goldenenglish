import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type PaymentReviewTourStepCopy = { title: string; description: string };

export type PaymentReviewTourCopy = {
  intro: PaymentReviewTourStepCopy;
  tabs: PaymentReviewTourStepCopy;
  inbox: PaymentReviewTourStepCopy;
  typeNav: PaymentReviewTourStepCopy;
  bulkToolbar: PaymentReviewTourStepCopy;
  action: PaymentReviewTourStepCopy;
  empty: PaymentReviewTourStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export type PaymentReviewTourMode = "approve" | "reject";

/** Guide-only: never click approve/reject confirmations. */
export function buildPaymentReviewTourSteps(
  copy: PaymentReviewTourCopy,
  mode: PaymentReviewTourMode,
): AdminTourStepDef[] {
  const actionAnchor =
    mode === "approve"
      ? ADMIN_TOUR_ANCHORS.financeInboxApprove
      : ADMIN_TOUR_ANCHORS.financeInboxReject;

  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeTabs,
      title: copy.tabs.title,
      description: copy.tabs.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeInboxRoot,
      title: copy.inbox.title,
      description: copy.inbox.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeInboxTypeNav,
      title: copy.typeNav.title,
      description: copy.typeNav.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeInboxBulkToolbar,
      title: copy.bulkToolbar.title,
      description: copy.bulkToolbar.description,
      optional: true,
    },
    {
      anchor: actionAnchor,
      title: copy.action.title,
      description: copy.action.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeInboxEmpty,
      title: copy.empty.title,
      description: copy.empty.description,
      optional: true,
    },
  ];
}
