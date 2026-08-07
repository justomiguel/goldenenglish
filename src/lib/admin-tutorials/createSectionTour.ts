import type { AdminTutorialId } from "@/lib/admin-tutorials/catalog";
import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type CreateSectionTourStepCopy = {
  title: string;
  description: string;
};

export type CreateSectionTourCopy = {
  intro: CreateSectionTourStepCopy;
  sectionsTab: CreateSectionTourStepCopy;
  newSection: CreateSectionTourStepCopy;
  basicsField: CreateSectionTourStepCopy;
  periodField: CreateSectionTourStepCopy;
  scheduleField: CreateSectionTourStepCopy;
  submit: CreateSectionTourStepCopy;
  detail: CreateSectionTourStepCopy;
  missingCohortNotice: {
    title: string;
    description: string;
    dismiss: string;
  };
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export const CREATE_SECTION_TUTORIAL_ID: AdminTutorialId = "create-section";

export function buildCreateSectionIntroStep(copy: CreateSectionTourCopy): AdminTourStepDef {
  return {
    anchor: null,
    title: copy.intro.title,
    description: copy.intro.description,
  };
}

/** Cohort sections tab + New section — stops before modal. */
export function buildCreateSectionPreModalSteps(copy: CreateSectionTourCopy): AdminTourStepDef[] {
  return [
    buildCreateSectionIntroStep(copy),
    {
      anchor: ADMIN_TOUR_ANCHORS.cohortSectionsTab,
      title: copy.sectionsTab.title,
      description: copy.sectionsTab.description,
      activateCohortSectionsTab: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.newSection,
      title: copy.newSection.title,
      description: copy.newSection.description,
      openNewSectionModal: true,
      endPreModal: true,
    },
  ];
}

export function buildCreateSectionModalSteps(copy: CreateSectionTourCopy): AdminTourStepDef[] {
  return [
    {
      anchor: ADMIN_TOUR_ANCHORS.newSectionBasics,
      title: copy.basicsField.title,
      description: copy.basicsField.description,
      openNewSectionModal: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.newSectionPeriod,
      title: copy.periodField.title,
      description: copy.periodField.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.newSectionSchedule,
      title: copy.scheduleField.title,
      description: copy.scheduleField.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.newSectionSubmit,
      title: copy.submit.title,
      description: copy.submit.description,
    },
  ];
}

export function buildCreateSectionPhaseBStep(copy: CreateSectionTourCopy): AdminTourStepDef {
  return {
    anchor: ADMIN_TOUR_ANCHORS.sectionDetail,
    title: copy.detail.title,
    description: copy.detail.description,
  };
}
