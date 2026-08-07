import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type AssignScholarshipTourStepCopy = { title: string; description: string };

export type AssignScholarshipTourCopy = {
  intro: AssignScholarshipTourStepCopy;
  panel: AssignScholarshipTourStepCopy;
  discountFields: AssignScholarshipTourStepCopy;
  saveGuide: AssignScholarshipTourStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export type ScholarshipTourKind = "percent" | "full";

export function buildAssignScholarshipTourSteps(
  copy: AssignScholarshipTourCopy,
  _kind: ScholarshipTourKind,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.scholarshipPanel,
      title: copy.panel.title,
      description: copy.panel.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.scholarshipDiscountFields,
      title: copy.discountFields.title,
      description: copy.discountFields.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.scholarshipSave,
      title: copy.saveGuide.title,
      description: copy.saveGuide.description,
    },
  ];
}
