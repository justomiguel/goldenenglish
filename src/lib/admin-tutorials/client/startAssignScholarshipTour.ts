import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import { studentBillingPath } from "@/lib/admin-tutorials/client/ensureTourPath";
import { fetchScholarshipTarget } from "@/lib/admin-tutorials/client/fetchTourTargets";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import {
  buildAssignScholarshipTourSteps,
  type AssignScholarshipTourCopy,
  type ScholarshipTourKind,
} from "@/lib/admin-tutorials/assignScholarshipTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import {
  ADMIN_TOUR_ANCHORS,
  ADMIN_TUTORIAL_ACTIVATE_SCHOLARSHIPS_TAB_EVENT,
  adminTourSelector,
} from "@/lib/admin-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";

function parseUserId(pathname: string, locale: string): string | null {
  const base = `/${locale}/dashboard/admin/users/`;
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length).replace(/\/$/, "");
  const id = rest.split("/")[0];
  return id && id !== "new" && id !== "import" ? id : null;
}

async function startAssignScholarshipTour(input: {
  locale: string;
  pathname: string;
  copy: AssignScholarshipTourCopy;
  push: (href: string) => void;
  kind: ScholarshipTourKind;
  tutorialId: "assign-scholarship-percent" | "assign-scholarship-full";
}): Promise<void> {
  const entity = `admin_tutorial:${input.tutorialId}`;
  trackEvent("action", entity, { tutorialId: input.tutorialId, phase: "start" });

  const fromPath = parseUserId(input.pathname, input.locale);
  const target = fromPath ? { studentId: fromPath } : await fetchScholarshipTarget();
  const studentId = target?.studentId;
  if (!studentId) {
    logClientWarn(`admin.tutorials.${input.tutorialId}`, { reason: "no_student_target" });
    return;
  }

  const path = studentBillingPath(input.locale, studentId);
  const onBilling = input.pathname.includes(`/users/${studentId}/billing`);
  if (!onBilling) {
    input.push(path);
  }

  // Billing shell mounts with History tab first — switch to Scholarships, then wait.
  await waitForLayoutSettle(200);
  window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_ACTIVATE_SCHOLARSHIPS_TAB_EVENT));
  const panel = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.scholarshipPanel), {
    timeoutMs: 12_000,
  });
  if (!panel) {
    logClientWarn(`admin.tutorials.${input.tutorialId}`, { reason: "scholarship_panel_missing" });
    return;
  }
  await waitForLayoutSettle(100);

  await runDriverTour({
    steps: filterTourStepsForDom(buildAssignScholarshipTourSteps(input.copy, input.kind)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", entity, { tutorialId: input.tutorialId, phase: "complete" }),
    onSkip: () =>
      trackEvent("action", entity, { tutorialId: input.tutorialId, phase: "skip" }),
  });
}

export async function startAssignScholarshipPercentTour(
  input: Omit<Parameters<typeof startAssignScholarshipTour>[0], "kind" | "tutorialId">,
): Promise<void> {
  await startAssignScholarshipTour({
    ...input,
    kind: "percent",
    tutorialId: "assign-scholarship-percent",
  });
}

export async function startAssignScholarshipFullTour(
  input: Omit<Parameters<typeof startAssignScholarshipTour>[0], "kind" | "tutorialId">,
): Promise<void> {
  await startAssignScholarshipTour({
    ...input,
    kind: "full",
    tutorialId: "assign-scholarship-full",
  });
}
