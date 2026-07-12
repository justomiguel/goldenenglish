import type { CreateCohortTourCopy } from "@/lib/admin-tutorials/createCohortTour";

export const ADMIN_TUTORIAL_ENTITY_CREATE_COHORT = "admin_tutorial:create-cohort";

export type StartCreateCohortTourInput = {
  locale: string;
  pathname: string;
  copy: CreateCohortTourCopy;
  push: (href: string) => void;
  phaseBTimeoutMs?: number;
  /** Starts the create-section tutorial after the cohort handoff step. */
  startCreateSectionTour?: () => Promise<void>;
};

export function tourDriverCopy(input: StartCreateCohortTourInput) {
  return {
    doneBtn: input.copy.doneBtn,
    nextBtn: input.copy.nextBtn,
    prevBtn: input.copy.prevBtn,
    closeBtn: input.copy.closeBtn,
    progressText: input.copy.progressText,
    existingCohortBranch: {
      useExisting: input.copy.existingCohortPrompt.useExisting,
      createNew: input.copy.existingCohortPrompt.createNew,
    },
    handoffCreateSection: {
      startSectionTour: input.copy.handoffToCreateSection.startSectionTour,
      dismiss: input.copy.handoffToCreateSection.dismiss,
    },
  };
}
