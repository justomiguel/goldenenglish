import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import type { AdminTutorialId } from "@/lib/admin-tutorials/catalog";
import { fillTourTemplate } from "@/lib/admin-tutorials/fillTourTemplate";
import {
  ADMIN_TOUR_ANCHORS,
  adminTourSelector,
  type AdminTourAnchor,
} from "@/lib/admin-tutorials/selectors";

export type CreateCohortYearBranchContext = {
  year: number;
  existing: { id: string; name: string };
};

export type CreateCohortTourStepCopy = {
  title: string;
  description: string;
};

export type CreateCohortTourCopy = {
  intro: CreateCohortTourStepCopy;
  navAcademic: CreateCohortTourStepCopy;
  newCohort: CreateCohortTourStepCopy;
  nameField: CreateCohortTourStepCopy;
  submit: CreateCohortTourStepCopy;
  detail: CreateCohortTourStepCopy;
  existingCohortPrompt: {
    title: string;
    description: string;
    body: string;
    useExisting: string;
    createNew: string;
  };
  handoffToCreateSection: {
    title: string;
    description: string;
    startSectionTour: string;
    dismiss: string;
  };
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export const CREATE_COHORT_TUTORIAL_ID: AdminTutorialId = "create-cohort";

export function buildCreateCohortIntroStep(copy: CreateCohortTourCopy): AdminTourStepDef {
  return {
    anchor: null,
    title: copy.intro.title,
    description: copy.intro.description,
  };
}

export function buildExistingCohortBranchStep(
  copy: CreateCohortTourCopy,
  branch: CreateCohortYearBranchContext,
): AdminTourStepDef {
  const vars = { year: String(branch.year), name: branch.existing.name };
  const prompt = copy.existingCohortPrompt;
  return {
    anchor: ADMIN_TOUR_ANCHORS.newCohort,
    title: fillTourTemplate(prompt.title, vars),
    description: `${fillTourTemplate(prompt.description, vars)}\n\n${fillTourTemplate(prompt.body, vars)}`,
    existingCohortBranch: true,
  };
}

/** Intro, optional nav, New cohort, and optional in-tour branch when a year cohort already exists. */
export function buildCreateCohortPreModalSteps(
  copy: CreateCohortTourCopy,
  options: { includeNavStep: boolean },
  branchContext?: CreateCohortYearBranchContext | null,
): AdminTourStepDef[] {
  const steps: AdminTourStepDef[] = [buildCreateCohortIntroStep(copy)];
  if (options.includeNavStep) {
    steps.push({
      anchor: ADMIN_TOUR_ANCHORS.navAcademic,
      title: copy.navAcademic.title,
      description: copy.navAcademic.description,
      navigateToAcademicHub: true,
    });
  }
  steps.push({
    anchor: ADMIN_TOUR_ANCHORS.newCohort,
    title: copy.newCohort.title,
    description: copy.newCohort.description,
    checkExistingCohortOnNext: true,
  });
  if (branchContext) {
    steps.push(buildExistingCohortBranchStep(copy, branchContext));
  }
  return steps;
}

/** Modal name + submit steps after the pre-modal gate allows creation. */
export function buildCreateCohortModalSteps(copy: CreateCohortTourCopy): AdminTourStepDef[] {
  return [
    {
      anchor: ADMIN_TOUR_ANCHORS.newCohortName,
      title: copy.nameField.title,
      description: copy.nameField.description,
      openNewCohortModal: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.newCohortSubmit,
      title: copy.submit.title,
      description: copy.submit.description,
    },
  ];
}

/** @deprecated Use buildCreateCohortPreModalSteps + buildCreateCohortModalSteps. */
export function buildCreateCohortPhaseASteps(
  copy: CreateCohortTourCopy,
  options: { includeNavStep: boolean },
): AdminTourStepDef[] {
  return [...buildCreateCohortPreModalSteps(copy, options), ...buildCreateCohortModalSteps(copy)];
}

export function buildCreateCohortHandoffStep(copy: CreateCohortTourCopy): AdminTourStepDef {
  return {
    anchor: ADMIN_TOUR_ANCHORS.cohortDetail,
    title: copy.handoffToCreateSection.title,
    description: copy.handoffToCreateSection.description,
    handoffCreateSectionTour: true,
  };
}

export function buildCreateCohortPhaseBStep(copy: CreateCohortTourCopy): AdminTourStepDef {
  return {
    anchor: ADMIN_TOUR_ANCHORS.cohortDetail,
    title: copy.detail.title,
    description: copy.detail.description,
  };
}

export function createCohortAnchorSelector(anchor: AdminTourAnchor): string {
  return adminTourSelector(anchor);
}
