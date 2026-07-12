import type { PrepareAdminTourStepHooks } from "@/lib/admin-tutorials/client/prepareAdminTourStep";
import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";

export type RunDriverTourResult =
  | "completed"
  | "skipped"
  | "error"
  | "branch-use-existing"
  | "branch-create-new"
  | "branch-student-minor"
  | "branch-student-adult"
  | "handoff-start-section"
  | "handoff-dismiss";

export type RunDriverTourHooks = PrepareAdminTourStepHooks;

export type RunDriverTourCopy = {
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
  existingCohortBranch?: {
    useExisting: string;
    createNew: string;
  };
  studentBirthPathBranch?: {
    minorPath: string;
    adultPath: string;
  };
  handoffCreateSection?: {
    startSectionTour: string;
    dismiss: string;
  };
};

export type RunDriverTourOptions = {
  steps: AdminTourStepDef[];
  copy: RunDriverTourCopy;
  hooks?: RunDriverTourHooks;
  onComplete?: () => void;
  onSkip?: () => void;
};
