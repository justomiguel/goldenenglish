import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type ChangeBillingCurrencyStepCopy = { title: string; description: string };

export type ChangeBillingCurrencyTourCopy = {
  intro: ChangeBillingCurrencyStepCopy;
  settingsRoot: ChangeBillingCurrencyStepCopy;
  currencySection: ChangeBillingCurrencyStepCopy;
  currencyField: ChangeBillingCurrencyStepCopy;
  warning: ChangeBillingCurrencyStepCopy;
  saveGuide: ChangeBillingCurrencyStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildChangeBillingCurrencyTourSteps(
  copy: ChangeBillingCurrencyTourCopy,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsRoot,
      title: copy.settingsRoot.title,
      description: copy.settingsRoot.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsCurrencySection,
      title: copy.currencySection.title,
      description: copy.currencySection.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsCurrencyField,
      title: copy.currencyField.title,
      description: copy.currencyField.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsCurrencyWarning,
      title: copy.warning.title,
      description: copy.warning.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsCurrencySave,
      title: copy.saveGuide.title,
      description: copy.saveGuide.description,
    },
  ];
}
