import type { CohortYearContext } from "@/lib/admin-tutorials/client/fetchCohortYearContext";
import {
  buildCreateCohortHandoffStep,
  buildCreateCohortModalSteps,
  buildCreateCohortPhaseBStep,
  type CreateCohortTourCopy,
} from "@/lib/admin-tutorials/createCohortTour";
import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import { openNewCohortModalForTutorial } from "@/lib/admin-tutorials/client/prepareAdminTourStep";
import { setAdminTourSessionActive } from "@/lib/admin-tutorials/client/adminTourSession";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import {
  ADMIN_TOUR_ANCHORS,
  adminTourSelector,
} from "@/lib/admin-tutorials/selectors";
import { academicCohortDetailPath, isAcademicCohortDetailPath } from "@/lib/admin-tutorials/academicHubPath";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";
import {
  ADMIN_TUTORIAL_ENTITY_CREATE_COHORT,
  type StartCreateCohortTourInput,
  tourDriverCopy,
} from "@/lib/admin-tutorials/client/startCreateCohortTourShared";

const WAIT_FOR_COHORT_DETAIL_MS = 15_000;
const WAIT_FOR_USER_CREATE_MS = 600_000;

export function branchContextFromYear(ctx: CohortYearContext | null) {
  if (!ctx?.existing) return null;
  return { year: ctx.year, existing: ctx.existing };
}

export async function openCohortDetail(
  input: StartCreateCohortTourInput,
  cohortId: string,
): Promise<boolean> {
  input.push(academicCohortDetailPath(input.locale, cohortId));
  const detail = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortDetail), {
    timeoutMs: WAIT_FOR_COHORT_DETAIL_MS,
  });
  if (!detail) {
    logClientWarn("admin.tutorials.createCohort", { reason: "cohort_detail_missing", cohortId });
    return false;
  }
  await waitForLayoutSettle(120);
  return true;
}

async function waitForCohortDetailAfterCreate(locale: string, timeoutMs: number): Promise<boolean> {
  const detail = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortDetail), {
    timeoutMs,
  });
  if (!detail) return false;
  if (typeof window !== "undefined" && !isAcademicCohortDetailPath(window.location.pathname, locale)) {
    return false;
  }
  await waitForLayoutSettle(120);
  return true;
}

export async function runHandoffToCreateSection(input: StartCreateCohortTourInput): Promise<void> {
  const handoffResult = await runDriverTour({
    steps: [buildCreateCohortHandoffStep(input.copy)],
    copy: tourDriverCopy(input),
    onSkip: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
        tutorialId: "create-cohort",
        phase: "handoff_dismiss",
      });
    },
  });

  if (handoffResult === "handoff-start-section" && input.startCreateSectionTour) {
    trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
      tutorialId: "create-cohort",
      phase: "handoff_start_section_tour",
    });
    await input.startCreateSectionTour();
    return;
  }

  if (handoffResult === "handoff-dismiss") {
    trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
      tutorialId: "create-cohort",
      phase: "handoff_dismiss",
    });
  }
}

async function runPhaseBIfOnCohortDetail(input: StartCreateCohortTourInput): Promise<void> {
  const timeoutMs = input.phaseBTimeoutMs ?? WAIT_FOR_COHORT_DETAIL_MS;
  const onDetail =
    typeof window !== "undefined" &&
    isAcademicCohortDetailPath(window.location.pathname, input.locale);

  if (!onDetail) {
    const landed = await waitForCohortDetailAfterCreate(input.locale, timeoutMs);
    if (!landed) return;
  }

  const phaseBResult = await runDriverTour({
    steps: [buildCreateCohortPhaseBStep(input.copy)],
    copy: tourDriverCopy(input),
    onComplete: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
        tutorialId: "create-cohort",
        phase: "complete",
      });
    },
  });

  if (phaseBResult === "completed" || phaseBResult === "skipped") {
    await runHandoffToCreateSection(input);
  }
}

export async function runModalTourAndPhaseB(input: StartCreateCohortTourInput): Promise<void> {
  const modalReady = await openNewCohortModalForTutorial();
  if (!modalReady) {
    setAdminTourSessionActive(false);
    logClientWarn("admin.tutorials.createCohort", { reason: "new_cohort_modal_missing" });
    return;
  }

  const modalResult = await runDriverTour({
    steps: buildCreateCohortModalSteps(input.copy),
    copy: tourDriverCopy(input),
    onComplete: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
        tutorialId: "create-cohort",
        phase: "modal_steps_complete",
      });
    },
    onSkip: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
        tutorialId: "create-cohort",
        phase: "modal_steps_skip",
      });
    },
  });

  if (modalResult === "completed" || modalResult === "skipped") {
    void runPhaseBIfOnCohortDetail({
      ...input,
      phaseBTimeoutMs: input.phaseBTimeoutMs ?? WAIT_FOR_USER_CREATE_MS,
    });
  }
}

// Re-export type for consumers that imported CreateCohortTourCopy via this path historically.
export type { CreateCohortTourCopy };
