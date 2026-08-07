import type { ParentTourStepDef } from "@/lib/parent-tutorials/parentTourStepDef";
import {
  parentTourSelector,
  type ParentTourAnchor,
} from "@/lib/parent-tutorials/selectors";
import {
  bindTourLayoutSync,
  waitForLayoutSettle,
} from "@/lib/admin-tutorials/client/tourLayoutSync";

export type RunParentDriverTourResult = "completed" | "skipped" | "error";

export type RunParentDriverTourCopy = {
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export type RunParentDriverTourOptions = {
  steps: ParentTourStepDef[];
  copy: RunParentDriverTourCopy;
  onComplete?: () => void;
  onSkip?: () => void;
};

let activeDestroy: (() => void) | null = null;

export function destroyActiveParentTour(): void {
  activeDestroy?.();
  activeDestroy = null;
}

function resolveAnchorElement(anchor: ParentTourAnchor): Element {
  const el = document.querySelector(parentTourSelector(anchor));
  if (!el) return document.body;
  return el;
}

/** Runs a Driver.js tour for the parent portal. Dynamically imports the library. */
export async function runParentDriverTour(
  options: RunParentDriverTourOptions,
): Promise<RunParentDriverTourResult> {
  destroyActiveParentTour();
  const { driver } = await import("driver.js");
  await import("driver.js/dist/driver.css");
  let outcome: RunParentDriverTourResult = "skipped";
  let layoutSync: ReturnType<typeof bindTourLayoutSync> | null = null;

  const driveSteps = options.steps.map((step) => ({
    element: step.anchor
      ? () => resolveAnchorElement(step.anchor as ParentTourAnchor)
      : undefined,
    popover: {
      title: step.title,
      description: step.description,
      side: "bottom" as const,
      align: "start" as const,
    },
  }));

  return new Promise<RunParentDriverTourResult>((resolve) => {
    const d = driver({
      showProgress: true,
      animate: true,
      smoothScroll: false,
      allowClose: true,
      overlayColor: "rgb(0 0 0)",
      overlayOpacity: 0.55,
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "ge-admin-tour-popover ge-parent-tour-popover",
      nextBtnText: options.copy.nextBtn,
      prevBtnText: options.copy.prevBtn,
      doneBtnText: options.copy.doneBtn,
      progressText: options.copy.progressText,
      steps: driveSteps,
      onHighlighted: () => {
        void layoutSync?.alignToActiveElement();
      },
      onDestroyStarted: (_el, _step, { driver: drv }) => {
        if (!drv.hasNextStep() && outcome === "skipped") outcome = "completed";
        drv.destroy();
      },
      onDestroyed: () => {
        layoutSync?.dispose();
        layoutSync = null;
        activeDestroy = null;
        if (outcome === "completed") options.onComplete?.();
        else options.onSkip?.();
        resolve(outcome);
      },
    });

    layoutSync = bindTourLayoutSync(d);

    activeDestroy = () => {
      layoutSync?.dispose();
      layoutSync = null;
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
      outcome = "error";
      layoutSync?.dispose();
      layoutSync = null;
      activeDestroy = null;
      resolve("error");
    }
  });
}
