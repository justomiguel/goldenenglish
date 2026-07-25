import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type ResetUserPasswordStepCopy = { title: string; description: string };

export type ResetUserPasswordTourCopy = {
  intro: ResetUserPasswordStepCopy;
  securityTab: ResetUserPasswordStepCopy;
  securityPanel: ResetUserPasswordStepCopy;
  passwordSection: ResetUserPasswordStepCopy;
  applyGuide: ResetUserPasswordStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildResetUserPasswordTourSteps(
  copy: ResetUserPasswordTourCopy,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.userDetailSecurityTab,
      title: copy.securityTab.title,
      description: copy.securityTab.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.userDetailSecurityPanel,
      title: copy.securityPanel.title,
      description: copy.securityPanel.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.userDetailPasswordSection,
      title: copy.passwordSection.title,
      description: copy.passwordSection.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.userDetailPasswordApply,
      title: copy.applyGuide.title,
      description: copy.applyGuide.description,
    },
  ];
}
