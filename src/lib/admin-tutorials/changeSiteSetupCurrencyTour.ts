import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type ChangeSiteSetupCurrencyStepCopy = { title: string; description: string };

export type ChangeSiteSetupCurrencyTourCopy = {
  intro: ChangeSiteSetupCurrencyStepCopy;
  stepIndicator: ChangeSiteSetupCurrencyStepCopy;
  panel: ChangeSiteSetupCurrencyStepCopy;
  currencyField: ChangeSiteSetupCurrencyStepCopy;
  navGuide: ChangeSiteSetupCurrencyStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildChangeSiteSetupCurrencyTourSteps(
  copy: ChangeSiteSetupCurrencyTourCopy,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.siteSetupStepIndicator,
      title: copy.stepIndicator.title,
      description: copy.stepIndicator.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.siteSetupPanel,
      title: copy.panel.title,
      description: copy.panel.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.siteSetupBillingCurrency,
      title: copy.currencyField.title,
      description: copy.currencyField.description,
      activateSiteSetupLegalBillingStep: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.siteSetupNav,
      title: copy.navGuide.title,
      description: copy.navGuide.description,
    },
  ];
}
