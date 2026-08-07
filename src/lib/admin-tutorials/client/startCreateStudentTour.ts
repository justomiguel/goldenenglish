import { dispatchCreateUserTourDemo } from "@/lib/admin-tutorials/client/dispatchCreateUserTourDemo";
import { ensureCreateUserPage } from "@/lib/admin-tutorials/client/ensureCreateUserPage";
import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { isCreateUserPath } from "@/lib/admin-tutorials/createUserPath";
import {
  buildCreateStudentAdultPathSteps,
  buildCreateStudentMinorPathSteps,
  buildCreateStudentPreBranchSteps,
  type CreateStudentTourCopy,
} from "@/lib/admin-tutorials/createStudentTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { ADMIN_TOUR_ANCHORS, adminTourSelector } from "@/lib/admin-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";

export const ADMIN_TUTORIAL_ENTITY_CREATE_STUDENT = "admin_tutorial:create-student";

/** After demo birth is applied, guardian/email should mount quickly. */
const WAIT_FOR_PATH_PANEL_MS = 12_000;

export type StartCreateStudentTourInput = {
  locale: string;
  pathname: string;
  copy: CreateStudentTourCopy;
  push: (href: string) => void;
  pathPanelTimeoutMs?: number;
};

function tourDriverCopy(copy: CreateStudentTourCopy) {
  return {
    doneBtn: copy.doneBtn,
    nextBtn: copy.nextBtn,
    prevBtn: copy.prevBtn,
    closeBtn: copy.closeBtn,
    progressText: copy.progressText,
    studentBirthPathBranch: {
      minorPath: copy.birthDateBranch.minorPath,
      adultPath: copy.birthDateBranch.adultPath,
    },
  };
}

/** Guide-only create-student tour with birth-date minor/adult branch. */
export async function startCreateStudentTour(input: StartCreateStudentTourInput): Promise<void> {
  trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_STUDENT, {
    tutorialId: "create-student",
    phase: "start",
  });

  const ready = await ensureCreateUserPage({
    locale: input.locale,
    pathname: input.pathname,
    push: input.push,
    scope: "admin.tutorials.createStudent",
  });
  if (!ready) return;

  const includeNavSteps = !isCreateUserPath(input.pathname, input.locale);
  const preResult = await runDriverTour({
    steps: filterTourStepsForDom(
      buildCreateStudentPreBranchSteps(input.copy, { includeNavSteps }),
    ),
    copy: tourDriverCopy(input.copy),
    onSkip: () => {
      trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_STUDENT, {
        tutorialId: "create-student",
        phase: "skip",
      });
    },
  });

  const timeoutMs = input.pathPanelTimeoutMs ?? WAIT_FOR_PATH_PANEL_MS;

  if (preResult === "branch-student-minor") {
    dispatchCreateUserTourDemo({ role: "student", birthPath: "minor" });
    await waitForLayoutSettle(80);
    const guardian = await waitForSelector(
      adminTourSelector(ADMIN_TOUR_ANCHORS.createUserGuardian),
      { timeoutMs },
    );
    if (!guardian) {
      logClientWarn("admin.tutorials.createStudent", { reason: "guardian_panel_timeout" });
      return;
    }
    await waitForLayoutSettle(120);
    await runDriverTour({
      steps: filterTourStepsForDom(buildCreateStudentMinorPathSteps(input.copy)),
      copy: tourDriverCopy(input.copy),
      onComplete: () => {
        trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_STUDENT, {
          tutorialId: "create-student",
          phase: "complete",
          path: "minor",
        });
      },
      onSkip: () => {
        trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_STUDENT, {
          tutorialId: "create-student",
          phase: "skip",
          path: "minor",
        });
      },
    });
    return;
  }

  if (preResult === "branch-student-adult") {
    dispatchCreateUserTourDemo({ role: "student", birthPath: "adult" });
    await waitForLayoutSettle(80);
    const email = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.createUserEmail), {
      timeoutMs,
    });
    if (!email) {
      logClientWarn("admin.tutorials.createStudent", { reason: "adult_email_timeout" });
      return;
    }
    await waitForLayoutSettle(120);
    await runDriverTour({
      steps: filterTourStepsForDom(buildCreateStudentAdultPathSteps(input.copy)),
      copy: tourDriverCopy(input.copy),
      onComplete: () => {
        trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_STUDENT, {
          tutorialId: "create-student",
          phase: "complete",
          path: "adult",
        });
      },
      onSkip: () => {
        trackEvent("action", ADMIN_TUTORIAL_ENTITY_CREATE_STUDENT, {
          tutorialId: "create-student",
          phase: "skip",
          path: "adult",
        });
      },
    });
  }
}
