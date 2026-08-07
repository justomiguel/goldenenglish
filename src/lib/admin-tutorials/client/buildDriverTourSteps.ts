import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import {
  adminTourSelector,
  ADMIN_TUTORIAL_ACTIVATE_SECTION_COLLECTIONS_SCHOLARSHIPS_TAB_EVENT,
  ADMIN_TUTORIAL_ACTIVATE_SITE_SETUP_LEGAL_BILLING_STEP_EVENT,
  ADMIN_TUTORIAL_OPEN_BULK_SCHOLARSHIP_MODAL_EVENT,
  type AdminTourAnchor,
} from "@/lib/admin-tutorials/selectors";
import {
  adminTourStepNeedsCustomNext,
  openNewCohortModalForTutorial,
  prepareAdminTourBeforeNext,
} from "@/lib/admin-tutorials/client/prepareAdminTourStep";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { applyCreateUserRole } from "@/lib/admin-tutorials/client/applyCreateUserRole";
import type {
  RunDriverTourHooks,
  RunDriverTourResult,
} from "@/lib/admin-tutorials/client/runDriverTourTypes";

function resolveAnchorElement(anchor: AdminTourAnchor): Element {
  const el = document.querySelector(adminTourSelector(anchor));
  if (!el) return document.body;
  return el;
}

export type BuildDriverTourStepsArgs = {
  steps: AdminTourStepDef[];
  hooks?: RunDriverTourHooks;
  refreshTour: () => void;
  setOutcome: (next: RunDriverTourResult) => void;
  alignLayout: () => void;
};

/** Maps AdminTourStepDef[] into Driver.js step config (popover + highlight hooks). */
export function buildDriverTourSteps(args: BuildDriverTourStepsArgs) {
  const { steps, hooks, refreshTour, setOutcome, alignLayout } = args;

  return steps.map((step, index) => {
    const needsCustomNext = adminTourStepNeedsCustomNext(step);
    const isBranch =
      Boolean(step.existingCohortBranch) || Boolean(step.studentBirthPathBranch);
    return {
      element: step.anchor
        ? () => resolveAnchorElement(step.anchor as AdminTourAnchor)
        : undefined,
      popover: {
        title: step.title,
        description: step.description,
        side: "bottom" as const,
        align: "start" as const,
        ...(isBranch
          ? {
              popoverClass: "ge-admin-tour-popover ge-admin-tour-popover-branch",
              showButtons: ["previous", "close"] as Array<"previous" | "close">,
              onNextClick: () => {
                /* branch step uses custom footer buttons */
              },
            }
          : {}),
        ...(step.handoffCreateSectionTour
          ? {
              popoverClass: "ge-admin-tour-popover ge-admin-tour-popover-branch",
              showButtons: ["close"] as Array<"close">,
              onNextClick: () => {
                /* handoff step uses custom footer buttons */
              },
            }
          : {}),
        ...(needsCustomNext
          ? {
              onNextClick: (
                _element: Element | undefined,
                _s: unknown,
                opts: {
                  driver: {
                    moveNext: () => void;
                    refresh: () => void;
                    destroy: () => void;
                    isLastStep: () => boolean;
                    moveTo: (i: number) => void;
                  };
                },
              ) => {
                void (async () => {
                  const prep = await prepareAdminTourBeforeNext(
                    step,
                    hooks,
                    () => refreshTour(),
                  );
                  if (prep === "abort") {
                    opts.driver.destroy();
                    return;
                  }
                  if (prep === "go-existing-cohort-branch") {
                    opts.driver.moveNext();
                    await waitForLayoutSettle(80);
                    refreshTour();
                    return;
                  }
                  if (prep === "end-pre-modal" || prep === "complete-phase") {
                    setOutcome("completed");
                    opts.driver.destroy();
                    return;
                  }
                  if (opts.driver.isLastStep()) {
                    opts.driver.destroy();
                    return;
                  }
                  opts.driver.moveTo(index + 1);
                  await waitForLayoutSettle(80);
                  refreshTour();
                  await waitForLayoutSettle(160);
                  refreshTour();
                })();
              },
            }
          : {}),
      },
      onHighlighted: () => {
        void alignLayout();
        if (step.openNewCohortModal) {
          void openNewCohortModalForTutorial().then(() => refreshTour());
        }
        if (step.setCreateUserRole) {
          applyCreateUserRole(step.setCreateUserRole);
          refreshTour();
        }
        if (step.activateSectionCollectionsScholarshipsTab) {
          window.dispatchEvent(
            new CustomEvent(ADMIN_TUTORIAL_ACTIVATE_SECTION_COLLECTIONS_SCHOLARSHIPS_TAB_EVENT),
          );
          void waitForLayoutSettle(80).then(() => refreshTour());
        }
        if (step.openBulkScholarshipModal) {
          window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_OPEN_BULK_SCHOLARSHIP_MODAL_EVENT));
          void waitForLayoutSettle(80).then(() => refreshTour());
        }
        if (step.activateSiteSetupLegalBillingStep) {
          window.dispatchEvent(
            new CustomEvent(ADMIN_TUTORIAL_ACTIVATE_SITE_SETUP_LEGAL_BILLING_STEP_EVENT),
          );
          void waitForLayoutSettle(80).then(() => refreshTour());
        }
      },
    };
  });
}
