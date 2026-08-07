import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type TakeAttendanceTourStepCopy = { title: string; description: string };

export type TakeAttendanceTourCopy = {
  intro: TakeAttendanceTourStepCopy;
  root: TakeAttendanceTourStepCopy;
  viewTabs: TakeAttendanceTourStepCopy;
  matrix: TakeAttendanceTourStepCopy;
  tip: TakeAttendanceTourStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildTakeAttendanceTourSteps(copy: TakeAttendanceTourCopy): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.sectionAttendanceRoot,
      title: copy.root.title,
      description: copy.root.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.sectionAttendanceViewTabs,
      title: copy.viewTabs.title,
      description: copy.viewTabs.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.sectionAttendanceMatrix,
      title: copy.matrix.title,
      description: copy.matrix.description,
      optional: true,
    },
    { anchor: null, title: copy.tip.title, description: copy.tip.description },
  ];
}
