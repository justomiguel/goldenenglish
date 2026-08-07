import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import type { RunDriverTourCopy, RunDriverTourResult } from "@/lib/admin-tutorials/client/runDriverTourTypes";

export const BRANCH_BTN_ATTR = "data-ge-admin-tour-branch-btn";
export const BRANCH_ACTIONS_ATTR = "data-ge-admin-tour-branch-actions";

type PopoverLike = {
  wrapper: HTMLElement;
  footer: HTMLElement;
  progress: HTMLElement;
  nextButton: HTMLElement;
  previousButton: HTMLElement;
};

function clearBranchFooterButtons(container: ParentNode): void {
  container.querySelectorAll(`[${BRANCH_BTN_ATTR}]`).forEach((node) => node.remove());
}

function ensureBranchActionsRow(footer: HTMLElement): HTMLElement {
  let row = footer.querySelector<HTMLElement>(`[${BRANCH_ACTIONS_ATTR}]`);
  if (!row) {
    row = document.createElement("div");
    row.setAttribute(BRANCH_ACTIONS_ATTR, "");
    row.className = "ge-admin-tour-branch-actions";
    footer.appendChild(row);
  }
  return row;
}

function makeBranchButton(
  attr: string,
  className: string,
  text: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute(BRANCH_BTN_ATTR, attr);
  btn.className = className;
  btn.textContent = text;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

/** Clears prior branch chrome and paints custom footer actions for branch/handoff steps. */
export function renderAdminTourBranchFooter(input: {
  popover: PopoverLike;
  stepDef: AdminTourStepDef;
  copy: RunDriverTourCopy;
  setOutcomeAndDestroy: (outcome: RunDriverTourResult) => void;
}): void {
  const { popover, stepDef, copy, setOutcomeAndDestroy } = input;
  popover.wrapper.classList.remove("ge-admin-tour-popover-branch");
  popover.footer.classList.remove("ge-admin-tour-popover-branch-footer");
  popover.footer.querySelector(`[${BRANCH_ACTIONS_ATTR}]`)?.remove();
  clearBranchFooterButtons(popover.footer);
  popover.nextButton.style.removeProperty("display");
  popover.previousButton.style.removeProperty("display");

  if (stepDef.existingCohortBranch && copy.existingCohortBranch) {
    const branchCopy = copy.existingCohortBranch;
    popover.wrapper.classList.add("ge-admin-tour-popover-branch");
    popover.footer.classList.add("ge-admin-tour-popover-branch-footer");
    popover.nextButton.style.display = "none";
    if (popover.progress.parentElement !== popover.footer) {
      popover.footer.prepend(popover.progress);
    }
    const actionsRow = ensureBranchActionsRow(popover.footer);
    clearBranchFooterButtons(actionsRow);
    // Do not use driver-popover-next-btn — Driver.js delegates those clicks to onNextClick.
    actionsRow.append(
      makeBranchButton(
        "create-new",
        "ge-admin-tour-branch-btn ge-admin-tour-branch-btn-secondary",
        branchCopy.createNew,
        () => setOutcomeAndDestroy("branch-create-new"),
      ),
      makeBranchButton(
        "use-existing",
        "ge-admin-tour-branch-btn ge-admin-tour-branch-btn-primary",
        branchCopy.useExisting,
        () => setOutcomeAndDestroy("branch-use-existing"),
      ),
    );
    return;
  }

  if (stepDef.studentBirthPathBranch && copy.studentBirthPathBranch) {
    const branchCopy = copy.studentBirthPathBranch;
    popover.wrapper.classList.add("ge-admin-tour-popover-branch");
    popover.footer.classList.add("ge-admin-tour-popover-branch-footer");
    popover.nextButton.style.display = "none";
    if (popover.progress.parentElement !== popover.footer) {
      popover.footer.prepend(popover.progress);
    }
    const actionsRow = ensureBranchActionsRow(popover.footer);
    clearBranchFooterButtons(actionsRow);
    actionsRow.append(
      makeBranchButton(
        "student-adult",
        "ge-admin-tour-branch-btn ge-admin-tour-branch-btn-secondary",
        branchCopy.adultPath,
        () => setOutcomeAndDestroy("branch-student-adult"),
      ),
      makeBranchButton(
        "student-minor",
        "ge-admin-tour-branch-btn ge-admin-tour-branch-btn-primary",
        branchCopy.minorPath,
        () => setOutcomeAndDestroy("branch-student-minor"),
      ),
    );
    return;
  }

  if (stepDef.handoffCreateSectionTour && copy.handoffCreateSection) {
    const handoffCopy = copy.handoffCreateSection;
    popover.wrapper.classList.add("ge-admin-tour-popover-branch");
    popover.footer.classList.add("ge-admin-tour-popover-branch-footer");
    popover.nextButton.style.display = "none";
    popover.previousButton.style.display = "none";
    const actionsRow = ensureBranchActionsRow(popover.footer);
    clearBranchFooterButtons(actionsRow);
    actionsRow.append(
      makeBranchButton(
        "handoff-dismiss",
        "ge-admin-tour-branch-btn ge-admin-tour-branch-btn-secondary",
        handoffCopy.dismiss,
        () => setOutcomeAndDestroy("handoff-dismiss"),
      ),
      makeBranchButton(
        "handoff-start",
        "ge-admin-tour-branch-btn ge-admin-tour-branch-btn-primary",
        handoffCopy.startSectionTour,
        () => setOutcomeAndDestroy("handoff-start-section"),
      ),
    );
  }
}

export function isBranchOrHandoffOutcome(outcome: RunDriverTourResult): boolean {
  return (
    outcome === "branch-use-existing" ||
    outcome === "branch-create-new" ||
    outcome === "branch-student-minor" ||
    outcome === "branch-student-adult" ||
    outcome === "handoff-start-section" ||
    outcome === "handoff-dismiss"
  );
}
