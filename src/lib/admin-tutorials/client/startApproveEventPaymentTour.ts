import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  ensureTourPath,
  eventPaymentsPath,
  isEventPaymentsPath,
  EVENT_PAYMENTS_WAIT_ANCHOR,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import { fetchEventTarget } from "@/lib/admin-tutorials/client/fetchTourTargets";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import {
  buildApproveEventPaymentTourSteps,
  type ApproveEventPaymentTourCopy,
} from "@/lib/admin-tutorials/approveEventPaymentTour";
import { trackEvent } from "@/lib/analytics/trackClient";
import { logClientWarn } from "@/lib/logging/clientLog";

const TUTORIAL_ID = "approve-event-payment" as const;
const ENTITY = `admin_tutorial:${TUTORIAL_ID}`;

function parseEventId(pathname: string, locale: string): string | null {
  const prefix = `/${locale}/dashboard/admin/events/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).replace(/\/$/, "");
  const id = rest.split("/")[0];
  return id && id !== "new" ? id : null;
}

export async function startApproveEventPaymentTour(input: {
  locale: string;
  pathname: string;
  copy: ApproveEventPaymentTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "start" });

  const fromPath = parseEventId(input.pathname, input.locale);
  const target = fromPath ? { eventId: fromPath } : await fetchEventTarget();
  const eventId = target?.eventId;
  if (!eventId) {
    logClientWarn("admin.tutorials.approveEventPayment", { reason: "no_event_target" });
    return;
  }

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: eventPaymentsPath(input.locale, eventId),
    alreadyOnPath: isEventPaymentsPath(input.pathname, input.locale, eventId),
    waitAnchor: EVENT_PAYMENTS_WAIT_ANCHOR,
    push: input.push,
    scope: "admin.tutorials.approveEventPayment",
    reason: "event_payments_panel_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(buildApproveEventPaymentTourSteps(input.copy)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "complete" }),
    onSkip: () => trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "skip" }),
  });
}
