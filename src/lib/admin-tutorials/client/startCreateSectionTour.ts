import {
  academicCohortSectionsPath,
  isAcademicSectionDetailPath,
} from "@/lib/admin-tutorials/academicHubPath";
import { fetchCohortYearContext } from "@/lib/admin-tutorials/client/fetchCohortYearContext";
import { requestMissingCohortNotice } from "@/lib/admin-tutorials/client/missingCohortPrompt";
import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import {
  buildCreateSectionModalSteps,
  buildCreateSectionPhaseBStep,
  buildCreateSectionPreModalSteps,
  type CreateSectionTourCopy,
} from "@/lib/admin-tutorials/createSectionTour";
import {
  ADMIN_TUTORIAL_ACTIVATE_COHORT_SECTIONS_TAB_EVENT,
  ADMIN_TOUR_ANCHORS,
  adminTourSelector,
} from "@/lib/admin-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";

export const ADMIN_TUTORIAL_ENTITY_CREATE_SECTION = "admin_tutorial:create-section";

const WAIT_FOR_SECTION_DETAIL_MS = 15_000;

export type StartCreateSectionTourInput = {
  locale: string;
  pathname: string;
  copy: CreateSectionTourCopy;
  push: (href: string) => void;
  phaseBTimeoutMs?: number;
};

async function ensureCohortSectionsView(
  input: StartCreateSectionTourInput,
  cohortId: string,
): Promise<boolean> {
  input.push(academicCohortSectionsPath(input.locale, cohortId));
  const detail = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortDetail), {
    timeoutMs: 12_000,
  });
  if (!detail) return false;
  const tab = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortSectionsTab), {
    timeoutMs: 8000,
  });
  if (!tab) return false;
  window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_ACTIVATE_COHORT_SECTIONS_TAB_EVENT));
  const toolbar = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.newSection), {
    timeoutMs: 8000,
  });
  if (!toolbar) return false;
  await waitForLayoutSettle(120);
  return true;
}

async function waitForSectionDetailAfterCreate(
  locale: string,
  timeoutMs: number,
): Promise<boolean> {
  const detail = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionDetail), {
    timeoutMs,
  });
  if (!detail) return false;
  if (typeof window !== "undefined" && !isAcademicSectionDetailPath(window.location.pathname, locale)) {
    return false;
  }
  await waitForLayoutSettle(120);
  return true;
}

async function runPhaseBIfOnSectionDetail(input: StartCreateSectionTourInput): Promise<void> {
  const timeoutMs = input.phaseBTimeoutMs ?? WAIT_FOR_SECTION_DETAIL_MS;
  const onDetail =
    typeof window !== "undefined" &&
    isAcademicSectionDetailPath(window.location.pathname, input.locale);

  if (!onDetail) {
    const landed = await waitForSectionDetailAfterCreate(input.locale, timeoutMs);
    if (!landed) return;
  }

  await runDriverTour({
    steps: [buildCreateSectionPhaseBStep(input.copy)],
    copy: input.copy,
    onComplete: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_SECTION, {
        tutorialId: "create-section",
        phase: "complete",
      });
    },
  });
}

/** Create-section tour: cohort sections tab → modal → section detail. */
export async function startCreateSectionTour(input: StartCreateSectionTourInput): Promise<void> {
  trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_SECTION, {
    tutorialId: "create-section",
    phase: "start",
  });

  const ctx = await fetchCohortYearContext();
  const cohort = ctx?.targetCohort ?? null;
  if (!cohort) {
    trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_SECTION, {
      tutorialId: "create-section",
      phase: "missing_cohort",
    });
    await requestMissingCohortNotice(input.copy.missingCohortNotice);
    return;
  }

  const ready = await ensureCohortSectionsView(input, cohort.id);
  if (!ready) {
    logClientWarn("admin.tutorials.createSection", {
      reason: "cohort_sections_view_missing",
      cohortId: cohort.id,
    });
    return;
  }

  const preResult = await runDriverTour({
    steps: buildCreateSectionPreModalSteps(input.copy),
    copy: input.copy,
    onSkip: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_SECTION, {
        tutorialId: "create-section",
        phase: "skip_pre_modal",
      });
    },
  });

  if (preResult !== "completed") {
    await waitForSectionDetailAfterCreate(input.locale, 2_000);
    return;
  }

  trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_SECTION, {
    tutorialId: "create-section",
    phase: "pre_modal_complete",
    cohortId: cohort.id,
  });

  const modalResult = await runDriverTour({
    steps: buildCreateSectionModalSteps(input.copy),
    copy: input.copy,
    onComplete: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_SECTION, {
        tutorialId: "create-section",
        phase: "modal_steps_complete",
      });
    },
    onSkip: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_SECTION, {
        tutorialId: "create-section",
        phase: "modal_steps_skip",
      });
    },
  });

  if (modalResult === "completed" || modalResult === "skipped") {
    // Detach Phase B wait so Help launcher busy state clears after modal tour ends.
    void runPhaseBIfOnSectionDetail({
      ...input,
      phaseBTimeoutMs: input.phaseBTimeoutMs ?? 600_000,
    });
    return;
  }

  void waitForSectionDetailAfterCreate(input.locale, 2_000);
}
