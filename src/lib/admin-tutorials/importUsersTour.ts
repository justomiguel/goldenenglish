import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type ImportUsersStepCopy = { title: string; description: string };

export type ImportUsersTourCopy = {
  intro: ImportUsersStepCopy;
  titleBlock: ImportUsersStepCopy;
  chooseFile: ImportUsersStepCopy;
  tip: ImportUsersStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export function buildImportUsersTourSteps(copy: ImportUsersTourCopy): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.usersImportTitle,
      title: copy.titleBlock.title,
      description: copy.titleBlock.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.usersImportChooseFile,
      title: copy.chooseFile.title,
      description: copy.chooseFile.description,
    },
    { anchor: null, title: copy.tip.title, description: copy.tip.description },
  ];
}
