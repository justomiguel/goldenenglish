import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type EnableFlowTourStepCopy = { title: string; description: string };

export type EnableFlowTourCopy = {
  intro: EnableFlowTourStepCopy;
  settingsRoot: EnableFlowTourStepCopy;
  card: EnableFlowTourStepCopy;
  credentials: EnableFlowTourStepCopy;
  saveGuide: EnableFlowTourStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildEnableFlowTourSteps(copy: EnableFlowTourCopy): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsRoot,
      title: copy.settingsRoot.title,
      description: copy.settingsRoot.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsFlowCard,
      title: copy.card.title,
      description: copy.card.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsFlowCredentials,
      title: copy.credentials.title,
      description: copy.credentials.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.financeSettingsFlowSave,
      title: copy.saveGuide.title,
      description: copy.saveGuide.description,
    },
  ];
}
