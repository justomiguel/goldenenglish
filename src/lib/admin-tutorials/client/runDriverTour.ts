import {
  bindTourLayoutSync,
  waitForLayoutSettle,
} from "@/lib/admin-tutorials/client/tourLayoutSync";
import { setAdminTourSessionActive } from "@/lib/admin-tutorials/client/adminTourSession";
import {
  isBranchOrHandoffOutcome,
  renderAdminTourBranchFooter,
} from "@/lib/admin-tutorials/client/runDriverTourBranchFooter";
import { buildDriverTourSteps } from "@/lib/admin-tutorials/client/buildDriverTourSteps";
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

  const driveSteps = buildDriverTourSteps({
    steps: options.steps,
    hooks: options.hooks,
    refreshTour: () => refreshTour?.(),
    setOutcome: (next) => {
      outcome = next;
    },
    alignLayout: () => {
      void layoutSync?.alignToActiveElement();
    },
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
