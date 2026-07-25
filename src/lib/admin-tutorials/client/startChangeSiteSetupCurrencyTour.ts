import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  ensureTourPath,
  isSiteSetupPath,
  siteSetupPath,
  SITE_SETUP_WAIT_ANCHOR,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import {
  buildChangeSiteSetupCurrencyTourSteps,
  type ChangeSiteSetupCurrencyTourCopy,
} from "@/lib/admin-tutorials/changeSiteSetupCurrencyTour";
import {
  ADMIN_TOUR_ANCHORS,
  ADMIN_TUTORIAL_ACTIVATE_SITE_SETUP_LEGAL_BILLING_STEP_EVENT,
  adminTourSelector,
} from "@/lib/admin-tutorials/selectors";
import { trackEvent } from "@/lib/analytics/trackClient";
import { logClientWarn } from "@/lib/logging/clientLog";

const TUTORIAL_ID = "change-site-setup-currency" as const;
const ENTITY = `admin_tutorial:${TUTORIAL_ID}`;

export async function startChangeSiteSetupCurrencyTour(input: {
  locale: string;
  pathname: string;
  copy: ChangeSiteSetupCurrencyTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "start" });

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: siteSetupPath(input.locale),
    alreadyOnPath: isSiteSetupPath(input.pathname, input.locale),
    waitAnchor: SITE_SETUP_WAIT_ANCHOR,
    push: input.push,
    scope: "admin.tutorials.changeSiteSetupCurrency",
    reason: "site_setup_missing",
  });
  if (!ready) return;

  window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_ACTIVATE_SITE_SETUP_LEGAL_BILLING_STEP_EVENT));
  await waitForLayoutSettle(150);

  const currency = await waitForSelector(
    adminTourSelector(ADMIN_TOUR_ANCHORS.siteSetupBillingCurrency),
    { timeoutMs: 8000 },
  );
  if (!currency) {
    logClientWarn("admin.tutorials.changeSiteSetupCurrency", {
      reason: "billing_currency_missing",
    });
  }

  await runDriverTour({
    steps: filterTourStepsForDom(buildChangeSiteSetupCurrencyTourSteps(input.copy)),
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
