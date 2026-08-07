import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  ensureTourPath,
  financeSettingsPath,
  isFinanceSettingsPath,
  FINANCE_SETTINGS_WAIT_ANCHOR,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import {
  buildEnableMercadoPagoTourSteps,
  type EnableMercadoPagoTourCopy,
} from "@/lib/admin-tutorials/enableMercadoPagoTour";
import {
  buildEnableFlowTourSteps,
  type EnableFlowTourCopy,
} from "@/lib/admin-tutorials/enableFlowTour";
import {
  buildChangeBillingCurrencyTourSteps,
  type ChangeBillingCurrencyTourCopy,
} from "@/lib/admin-tutorials/changeBillingCurrencyTour";
import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { trackEvent } from "@/lib/analytics/trackClient";

type ChromeCopy = {
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

async function startFinanceSettingsTour(input: {
  locale: string;
  pathname: string;
  push: (href: string) => void;
  copy: ChromeCopy;
  tutorialId: "enable-mercadopago" | "enable-flow" | "change-billing-currency";
  steps: AdminTourStepDef[];
}): Promise<void> {
  const entity = `admin_tutorial:${input.tutorialId}`;
  trackEvent("action", entity, { tutorialId: input.tutorialId, phase: "start" });

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: financeSettingsPath(input.locale),
    alreadyOnPath: isFinanceSettingsPath(input.pathname, input.locale),
    waitAnchor: FINANCE_SETTINGS_WAIT_ANCHOR,
    push: input.push,
    scope: `admin.tutorials.${input.tutorialId}`,
    reason: "finance_settings_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(input.steps),
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

export async function startEnableMercadoPagoTour(input: {
  locale: string;
  pathname: string;
  copy: EnableMercadoPagoTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  await startFinanceSettingsTour({
    ...input,
    tutorialId: "enable-mercadopago",
    steps: buildEnableMercadoPagoTourSteps(input.copy),
  });
}

export async function startEnableFlowTour(input: {
  locale: string;
  pathname: string;
  copy: EnableFlowTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  await startFinanceSettingsTour({
    ...input,
    tutorialId: "enable-flow",
    steps: buildEnableFlowTourSteps(input.copy),
  });
}

export async function startChangeBillingCurrencyTour(input: {
  locale: string;
  pathname: string;
  copy: ChangeBillingCurrencyTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  await startFinanceSettingsTour({
    ...input,
    tutorialId: "change-billing-currency",
    steps: buildChangeBillingCurrencyTourSteps(input.copy),
  });
}
