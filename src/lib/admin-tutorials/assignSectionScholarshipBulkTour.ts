import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type AssignSectionScholarshipBulkStepCopy = { title: string; description: string };

export type AssignSectionScholarshipBulkTourCopy = {
  intro: AssignSectionScholarshipBulkStepCopy;
  collectionsRoot: AssignSectionScholarshipBulkStepCopy;
  scholarshipsTab: AssignSectionScholarshipBulkStepCopy;
  bulkTrigger: AssignSectionScholarshipBulkStepCopy;
  modalGuide: AssignSectionScholarshipBulkStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

/** Guide-only: opens the modal for orientation but never confirms bulk apply. */
export function buildAssignSectionScholarshipBulkTourSteps(
  copy: AssignSectionScholarshipBulkTourCopy,
): AdminTourStepDef[] {
  return [
    { anchor: null, title: copy.intro.title, description: copy.intro.description },
    {
      anchor: ADMIN_TOUR_ANCHORS.sectionCollectionsRoot,
      title: copy.collectionsRoot.title,
      description: copy.collectionsRoot.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.sectionCollectionsScholarshipsTab,
      title: copy.scholarshipsTab.title,
      description: copy.scholarshipsTab.description,
      optional: true,
      activateSectionCollectionsScholarshipsTab: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.sectionCollectionsBulkScholarshipTrigger,
      title: copy.bulkTrigger.title,
      description: copy.bulkTrigger.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.sectionCollectionsBulkScholarshipModal,
      title: copy.modalGuide.title,
      description: copy.modalGuide.description,
      optional: true,
      openBulkScholarshipModal: true,
    },
  ];
}
