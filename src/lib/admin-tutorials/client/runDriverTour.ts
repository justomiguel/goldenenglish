import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import {
  adminTourSelector,
  type AdminTourAnchor,
} from "@/lib/admin-tutorials/selectors";
import {
  adminTourStepNeedsCustomNext,
  openNewCohortModalForTutorial,
  prepareAdminTourBeforeNext,
} from "@/lib/admin-tutorials/client/prepareAdminTourStep";
import {
  bindTourLayoutSync,
  waitForLayoutSettle,
} from "@/lib/admin-tutorials/client/tourLayoutSync";
import { applyCreateUserRole } from "@/lib/admin-tutorials/client/applyCreateUserRole";
import { setAdminTourSessionActive } from "@/lib/admin-tutorials/client/adminTourSession";
import {
  isBranchOrHandoffOutcome,
  renderAdminTourBranchFooter,
} from "@/lib/admin-tutorials/client/runDriverTourBranchFooter";
import type {
  RunDriverTourOptions,
  RunDriverTourResult,
} from "@/lib/admin-tutorials/client/runDriverTourTypes";

export type {
  RunDriverTourCopy,
  RunDriverTourHooks,
  RunDriverTourOptions,
  RunDriverTourResult,
} from "@/lib/admin-tutorials/client/runDriverTourTypes";

let activeDestroy: (() => void) | null = null;

export function destroyActiveAdminTour(): void {
  activeDestroy?.();
  activeDestroy = null;
}

function resolveAnchorElement(anchor: AdminTourAnchor): Element {
  const el = document.querySelector(adminTourSelector(anchor));
  if (!el) return document.body;
  return el;
}

/** Runs a Driver.js tour. Dynamically imports the library. Resolves when destroyed. */
export async function runDriverTour(options: RunDriverTourOptions): Promise<RunDriverTourResult> {
  destroyActiveAdminTour();
  const { driver } = await import("driver.js");
  await import("driver.js/dist/driver.css");
  let outcome: RunDriverTourResult = "skipped";
  let layoutSync: ReturnType<typeof bindTourLayoutSync> | null = null;
  let refreshTour: (() => void) | null = null;
  let driverRef: {
    destroy: () => void;
    moveNext: () => void;
    refresh: () => void;
    hasNextStep: () => boolean;
  } | null = null;

  const driveSteps = options.steps.map((step, index) => {
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
                    options.hooks,
                    () => refreshTour?.(),
                  );
                  if (prep === "abort") {
                    opts.driver.destroy();
                    return;
                  }
                  if (prep === "go-existing-cohort-branch") {
                    opts.driver.moveNext();
                    await waitForLayoutSettle(80);
                    refreshTour?.();
                    return;
                  }
                  if (prep === "end-pre-modal" || prep === "complete-phase") {
                    outcome = "completed";
                    opts.driver.destroy();
                    return;
                  }
                  if (opts.driver.isLastStep()) {
                    opts.driver.destroy();
                    return;
                  }
                  opts.driver.moveTo(index + 1);
                  await waitForLayoutSettle(80);
                  refreshTour?.();
                  await waitForLayoutSettle(160);
                  refreshTour?.();
                })();
              },
            }
          : {}),
      },
      onHighlighted: () => {
        void layoutSync?.alignToActiveElement();
        if (step.openNewCohortModal) {
          void openNewCohortModalForTutorial().then(() => refreshTour?.());
        }
        if (step.setCreateUserRole) {
          applyCreateUserRole(step.setCreateUserRole);
          refreshTour?.();
        }
      },
    };
  });

  return new Promise<RunDriverTourResult>((resolve) => {
    setAdminTourSessionActive(true);

    const d = driver({
      showProgress: true,
      animate: true,
      smoothScroll: false,
      allowClose: true,
      overlayColor: "rgb(0 0 0)",
      overlayOpacity: 0.55,
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "ge-admin-tour-popover",
      nextBtnText: options.copy.nextBtn,
      prevBtnText: options.copy.prevBtn,
      doneBtnText: options.copy.doneBtn,
      progressText: options.copy.progressText,
      steps: driveSteps,
      onHighlighted: () => {
        void layoutSync?.alignToActiveElement();
      },
      onPopoverRender: (popover, { state }) => {
        const activeIndex = state.activeIndex ?? 0;
        const stepDef = options.steps[activeIndex];
        if (!driverRef || !stepDef) return;
        renderAdminTourBranchFooter({
          popover,
          stepDef,
          copy: options.copy,
          setOutcomeAndDestroy: (next) => {
            outcome = next;
            driverRef?.destroy();
          },
        });
      },
      onDestroyStarted: (_el, _step, { driver: drv }) => {
        if (!drv.hasNextStep() && outcome === "skipped") outcome = "completed";
        drv.destroy();
      },
      onDestroyed: () => {
        setAdminTourSessionActive(false);
        layoutSync?.dispose();
        layoutSync = null;
        activeDestroy = null;
        driverRef = null;
        if (outcome === "completed") options.onComplete?.();
        else if (!isBranchOrHandoffOutcome(outcome)) options.onSkip?.();
        resolve(outcome);
      },
    });

    driverRef = d;
    layoutSync = bindTourLayoutSync(d);
    refreshTour = () => {
      try {
        void layoutSync?.alignToActiveElement();
      } catch {
        /* ignore */
      }
    };

    activeDestroy = () => {
      layoutSync?.dispose();
      layoutSync = null;
      driverRef = null;
      try {
        d.destroy();
      } catch {
        /* ignore */
      }
    };

    try {
      d.drive();
      void waitForLayoutSettle(40).then(() => layoutSync?.alignToActiveElement());
    } catch {
      setAdminTourSessionActive(false);
      outcome = "error";
      layoutSync?.dispose();
      layoutSync = null;
      activeDestroy = null;
      driverRef = null;
      resolve("error");
    }
  });
}
