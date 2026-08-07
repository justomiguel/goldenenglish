import { dispatchCreateUserTourDemo } from "@/lib/admin-tutorials/client/dispatchCreateUserTourDemo";
import { ensureCreateUserPage } from "@/lib/admin-tutorials/client/ensureCreateUserPage";
import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { isCreateUserPath } from "@/lib/admin-tutorials/createUserPath";
import {
  buildCreateStaffUserTourSteps,
  type CreateStaffUserRole,
  type CreateStaffUserTourCopy,
} from "@/lib/admin-tutorials/createStaffUserTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { trackEvent } from "@/lib/analytics/trackClient";

export type StartCreateStaffUserTourInput = {
  locale: string;
  pathname: string;
  copy: CreateStaffUserTourCopy;
  push: (href: string) => void;
  role: CreateStaffUserRole;
  tutorialId: "create-teacher" | "create-admin";
  entity: string;
  scope: string;
};

/** Guide-only create teacher or admin user tour. */
export async function startCreateStaffUserTour(input: StartCreateStaffUserTourInput): Promise<void> {
  trackEvent("action", input.entity, {
    tutorialId: input.tutorialId,
    phase: "start",
  });

  const ready = await ensureCreateUserPage({
    locale: input.locale,
    pathname: input.pathname,
    push: input.push,
    scope: input.scope,
  });
  if (!ready) return;

  const includeNavSteps = !isCreateUserPath(input.pathname, input.locale);
  // Ensure staff role (and email field) before Driver highlights — React-controlled select.
  dispatchCreateUserTourDemo({ role: input.role });
  await waitForLayoutSettle(80);

  await runDriverTour({
    steps: filterTourStepsForDom(
      buildCreateStaffUserTourSteps(input.copy, {
        includeNavSteps,
        role: input.role,
      }),
    ),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () => {
      trackEvent("action", input.entity, {
        tutorialId: input.tutorialId,
        phase: "complete",
      });
    },
    onSkip: () => {
      trackEvent("action", input.entity, {
        tutorialId: input.tutorialId,
        phase: "skip",
      });
    },
  });
}

export async function startCreateTeacherTour(
  input: Omit<StartCreateStaffUserTourInput, "role" | "tutorialId" | "entity" | "scope">,
): Promise<void> {
  await startCreateStaffUserTour({
    ...input,
    role: "teacher",
    tutorialId: "create-teacher",
    entity: "admin_tutorial:create-teacher",
    scope: "admin.tutorials.createTeacher",
  });
}

export async function startCreateAdminTour(
  input: Omit<StartCreateStaffUserTourInput, "role" | "tutorialId" | "entity" | "scope">,
): Promise<void> {
  await startCreateStaffUserTour({
    ...input,
    role: "admin",
    tutorialId: "create-admin",
    entity: "admin_tutorial:create-admin",
    scope: "admin.tutorials.createAdmin",
  });
}
