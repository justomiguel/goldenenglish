import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import {
  ADMIN_TUTORIAL_ACTIVATE_COHORT_SECTIONS_TAB_EVENT,
  ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT,
  ADMIN_TUTORIAL_OPEN_NEW_SECTION_EVENT,
  ADMIN_TOUR_ANCHORS,
  adminTourSelector,
} from "@/lib/admin-tutorials/selectors";
import { setAdminTourSessionActive } from "@/lib/admin-tutorials/client/adminTourSession";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { logClientWarn } from "@/lib/logging/clientLog";

export type PrepareAdminTourStepHooks = {
  ensureAcademicHub?: () => Promise<boolean>;
  beforeOpenNewCohortModal?: () => Promise<
    "create-new" | "stop-for-existing-prompt" | "abort"
  >;
};

export type PrepareBeforeNextResult =
  | "continue"
  | "complete-phase"
  | "abort"
  | "go-existing-cohort-branch"
  | "end-pre-modal";

async function openNewCohortModalAndWait(): Promise<boolean> {
  window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT));
  const el = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohortName), {
    timeoutMs: 5000,
  });
  return Boolean(el);
}

function isDialogTopLayerModal(dialog: HTMLDialogElement): boolean {
  try {
    return dialog.matches(":modal");
  } catch {
    // jsdom does not implement :modal
    return false;
  }
}

function isNewCohortModalStacked(): boolean {
  const field = document.querySelector(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohortName));
  const dialog = field?.closest("dialog");
  if (!field || !(dialog instanceof HTMLDialogElement) || !dialog.open) return false;
  return !isDialogTopLayerModal(dialog);
}

/** Wait until the new-cohort dialog is open with show() (not top-layer showModal). */
export async function waitForNewCohortModalStacked(timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isNewCohortModalStacked()) return true;
    await waitForLayoutSettle(40);
  }
  return isNewCohortModalStacked();
}

/**
 * Opens the new-cohort modal under an active tour session so Modal uses show() + stackBelowTour
 * (never showModal top-layer, which hides Driver.js).
 */
export async function openNewCohortModalForTutorial(): Promise<boolean> {
  setAdminTourSessionActive(true);
  await waitForLayoutSettle(60);
  const ok = await openNewCohortModalAndWait();
  if (!ok) return false;
  const stacked = await waitForNewCohortModalStacked();
  if (!stacked) {
    logClientWarn("admin.tutorials.createCohort", { reason: "new_cohort_modal_not_stacked" });
  }
  await waitForLayoutSettle(120);
  return stacked;
}

async function activateCohortSectionsTabAndWait(): Promise<boolean> {
  window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_ACTIVATE_COHORT_SECTIONS_TAB_EVENT));
  const el = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.newSection), {
    timeoutMs: 8000,
  });
  return Boolean(el);
}

async function openNewSectionModalAndWait(): Promise<boolean> {
  window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_OPEN_NEW_SECTION_EVENT));
  const el = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.newSectionBasics), {
    timeoutMs: 5000,
  });
  return Boolean(el);
}

export async function prepareAdminTourBeforeNext(
  step: AdminTourStepDef,
  hooks: PrepareAdminTourStepHooks | undefined,
  refreshTour?: () => void,
): Promise<PrepareBeforeNextResult> {
  if (step.navigateToAcademicHub && hooks?.ensureAcademicHub) {
    const ok = await hooks.ensureAcademicHub();
    if (!ok) {
      logClientWarn("admin.tutorials.createCohort", { reason: "academic_hub_missing" });
    }
    await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohort), { timeoutMs: 10000 });
    await waitForLayoutSettle(80);
  }
  if (step.checkExistingCohortOnNext) {
    const decision = (await hooks?.beforeOpenNewCohortModal?.()) ?? "create-new";
    if (decision === "abort") return "abort";
    if (decision === "stop-for-existing-prompt") return "go-existing-cohort-branch";
    // Defer modal open to runModalTourAndPhaseB (tour session + stacked dialog).
    return "end-pre-modal";
  }
  if (step.activateCohortSectionsTab) {
    const ok = await activateCohortSectionsTabAndWait();
    if (!ok) {
      logClientWarn("admin.tutorials.createSection", { reason: "sections_tab_missing" });
    }
    await waitForLayoutSettle(100);
    refreshTour?.();
  }
  if (step.openNewCohortModal) {
    const ok = await openNewCohortModalAndWait();
    if (!ok) {
      logClientWarn("admin.tutorials.createCohort", { reason: "new_cohort_modal_missing" });
    }
    await waitForLayoutSettle(120);
    refreshTour?.();
    await waitForLayoutSettle(160);
    refreshTour?.();
  }
  if (step.openNewSectionModal) {
    const ok = await openNewSectionModalAndWait();
    if (!ok) {
      logClientWarn("admin.tutorials.createSection", { reason: "new_section_modal_missing" });
    }
    await waitForLayoutSettle(120);
    refreshTour?.();
    await waitForLayoutSettle(160);
    refreshTour?.();
  }
  if (step.endPreModal) return "end-pre-modal";
  return "continue";
}

export function adminTourStepNeedsCustomNext(step: AdminTourStepDef): boolean {
  return Boolean(
    step.navigateToAcademicHub ||
      step.checkExistingCohortOnNext ||
      step.openNewCohortModal ||
      step.activateCohortSectionsTab ||
      step.openNewSectionModal ||
      step.endPreModal,
  );
}
