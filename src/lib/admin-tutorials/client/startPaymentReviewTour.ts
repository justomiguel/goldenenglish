import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  ensureTourPath,
  financeInboxPath,
  isFinanceInboxPath,
  FINANCE_INBOX_WAIT_ANCHOR,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import {
  buildPaymentReviewTourSteps,
  type PaymentReviewTourCopy,
  type PaymentReviewTourMode,
} from "@/lib/admin-tutorials/paymentReviewTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { trackEvent } from "@/lib/analytics/trackClient";

async function startPaymentReviewTour(input: {
  locale: string;
  pathname: string;
  copy: PaymentReviewTourCopy;
  push: (href: string) => void;
  mode: PaymentReviewTourMode;
  tutorialId: "approve-payment" | "reject-payment";
}): Promise<void> {
  const entity = `admin_tutorial:${input.tutorialId}`;
  trackEvent("action", entity, { tutorialId: input.tutorialId, phase: "start" });

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: financeInboxPath(input.locale),
    alreadyOnPath: isFinanceInboxPath(input.pathname, input.locale),
    waitAnchor: FINANCE_INBOX_WAIT_ANCHOR,
    push: input.push,
    scope: `admin.tutorials.${input.tutorialId}`,
    reason: "finance_inbox_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(buildPaymentReviewTourSteps(input.copy, input.mode)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", entity, { tutorialId: input.tutorialId, phase: "complete" }),
    onSkip: () =>
      trackEvent("action", entity, { tutorialId: input.tutorialId, phase: "skip" }),
  });
}

export async function startApprovePaymentTour(
  input: Omit<Parameters<typeof startPaymentReviewTour>[0], "mode" | "tutorialId">,
): Promise<void> {
  await startPaymentReviewTour({ ...input, mode: "approve", tutorialId: "approve-payment" });
}

export async function startRejectPaymentTour(
  input: Omit<Parameters<typeof startPaymentReviewTour>[0], "mode" | "tutorialId">,
): Promise<void> {
  await startPaymentReviewTour({ ...input, mode: "reject", tutorialId: "reject-payment" });
}
