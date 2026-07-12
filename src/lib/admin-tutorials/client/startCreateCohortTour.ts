import {
  academicHubPath,
  isAcademicHubPath,
} from "@/lib/admin-tutorials/academicHubPath";
import { fetchCohortYearContext } from "@/lib/admin-tutorials/client/fetchCohortYearContext";
import { buildCreateCohortPreModalSteps } from "@/lib/admin-tutorials/createCohortTour";
import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import {
  ADMIN_TOUR_ANCHORS,
  adminTourSelector,
} from "@/lib/admin-tutorials/selectors";
import { trackEvent } from "@/lib/analytics/trackClient";
import {
  ADMIN_TUTORIAL_ENTITY_CREATE_COHORT,
  type StartCreateCohortTourInput,
  tourDriverCopy,
} from "@/lib/admin-tutorials/client/startCreateCohortTourShared";
import {
  branchContextFromYear,
  openCohortDetail,
  runHandoffToCreateSection,
  runModalTourAndPhaseB,
} from "@/lib/admin-tutorials/client/startCreateCohortTourPhases";

export {
  ADMIN_TUTORIAL_ENTITY_CREATE_COHORT,
  type StartCreateCohortTourInput,
} from "@/lib/admin-tutorials/client/startCreateCohortTourShared";

async function ensureAcademicHub(locale: string, push: (href: string) => void): Promise<boolean> {
  push(academicHubPath(locale));
  const el = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohort), {
    timeoutMs: 10_000,
  });
  if (!el) return false;
  await waitForLayoutSettle(100);
  return true;
}

/**
 * Pre-modal tour (with in-tour branch when a year cohort exists), modal tour, then phase B.
 */
export async function startCreateCohortTour(input: StartCreateCohortTourInput): Promise<void> {
  const includeNavStep = !isAcademicHubPath(input.pathname, input.locale);
  const yearContext = await fetchCohortYearContext();
  const branchContext = branchContextFromYear(yearContext);
  const preModalSteps = buildCreateCohortPreModalSteps(input.copy, { includeNavStep }, branchContext);

  trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
    tutorialId: "create-cohort",
    phase: "start",
  });

  const preResult = await runDriverTour({
    steps: preModalSteps,
    copy: tourDriverCopy(input),
    hooks: {
      ensureAcademicHub: () => ensureAcademicHub(input.locale, input.push),
      beforeOpenNewCohortModal: async () => {
        if (branchContext) return "stop-for-existing-prompt";
        return "create-new";
      },
    },
    onSkip: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
        tutorialId: "create-cohort",
        phase: "skip",
      });
    },
  });

  if (preResult === "branch-use-existing") {
    const cohortId = yearContext?.existing?.id;
    if (cohortId) {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
        tutorialId: "create-cohort",
        phase: "use_existing_cohort",
        cohortId,
      });
      const opened = await openCohortDetail(input, cohortId);
      if (opened) {
        trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
          tutorialId: "create-cohort",
          phase: "complete_use_existing",
          cohortId,
        });
        await runHandoffToCreateSection(input);
      }
    }
    return;
  }

  if (preResult === "branch-create-new") {
    trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
      tutorialId: "create-cohort",
      phase: "confirm_create_duplicate_year",
    });
    await runModalTourAndPhaseB(input);
    return;
  }

  if (preResult !== "completed") return;

  trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_COHORT, {
    tutorialId: "create-cohort",
    phase: "pre_modal_complete",
  });

  await runModalTourAndPhaseB(input);
}
