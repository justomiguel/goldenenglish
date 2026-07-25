import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type ApproveEventPaymentStepCopy = { title: string; description: string };

export type ApproveEventPaymentTourCopy = {
  intro: ApproveEventPaymentStepCopy;
  paymentsTab: ApproveEventPaymentStepCopy;
  panel: ApproveEventPaymentStepCopy;
  filters: ApproveEventPaymentStepCopy;
  approveGuide: ApproveEventPaymentStepCopy;
  empty: ApproveEventPaymentStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

/** Guide-only: never click approve on a real pending payment. */
export function buildApproveEventPaymentTourSteps(
  copy: ApproveEventPaymentTourCopy,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventPaymentsTab,
      title: copy.paymentsTab.title,
      description: copy.paymentsTab.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventPaymentsPanel,
      title: copy.panel.title,
      description: copy.panel.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventPaymentsFilters,
      title: copy.filters.title,
      description: copy.filters.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventPaymentApprove,
      title: copy.approveGuide.title,
      description: copy.approveGuide.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.eventPaymentsEmpty,
      title: copy.empty.title,
      description: copy.empty.description,
      optional: true,
    },
  ];
}
