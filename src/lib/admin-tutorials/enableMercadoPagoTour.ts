import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type FinanceSettingsStepCopy = { title: string; description: string };

export type EnableMercadoPagoTourCopy = {
  intro: FinanceSettingsStepCopy;
  settingsRoot: FinanceSettingsStepCopy;
  card: FinanceSettingsStepCopy;
  credentials: FinanceSettingsStepCopy;
  saveGuide: FinanceSettingsStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildEnableMercadoPagoTourSteps(
  copy: EnableMercadoPagoTourCopy,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsRoot,
      title: copy.settingsRoot.title,
      description: copy.settingsRoot.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsMercadoPagoCl,
      title: copy.card.title,
      description: copy.card.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsMercadoPagoCredentials,
      title: copy.credentials.title,
      description: copy.credentials.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsMercadoPagoSave,
      title: copy.saveGuide.title,
      description: copy.saveGuide.description,
    },
  ];
}
