import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import { studentDetailPath } from "@/lib/admin-tutorials/client/ensureTourPath";
import { fetchScholarshipTarget } from "@/lib/admin-tutorials/client/fetchTourTargets";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import {
  buildResetUserPasswordTourSteps,
  type ResetUserPasswordTourCopy,
} from "@/lib/admin-tutorials/resetUserPasswordTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import {
  ADMIN_TOUR_ANCHORS,
  ADMIN_TUTORIAL_ACTIVATE_SECURITY_TAB_EVENT,
  adminTourSelector,
} from "@/lib/admin-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";

const ENTITY = "admin_tutorial:reset-user-password";

function parseUserId(pathname: string, locale: string): string | null {
  const base = `/${locale}/dashboard/admin/users/`;
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length).replace(/\/$/, "");
  const id = rest.split("/")[0];
  return id && id !== "new" && id !== "import" ? id : null;
}

export async function startResetUserPasswordTour(input: {
  locale: string;
  pathname: string;
  copy: ResetUserPasswordTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: "reset-user-password", phase: "start" });

  const fromPath = parseUserId(input.pathname, input.locale);
  const target = fromPath ? { studentId: fromPath } : await fetchScholarshipTarget();
  const userId = target?.studentId;
  if (!userId) {
    logClientWarn("admin.tutorials.resetUserPassword", { reason: "no_user_target" });
    return;
  }

  const path = studentDetailPath(input.locale, userId);
  const onDetail =
    input.pathname === path ||
    input.pathname === `${path}/` ||
    input.pathname.startsWith(`${path}/`);
  if (!onDetail || input.pathname.includes("/billing")) {
    input.push(path);
  }

  await waitForLayoutSettle(200);
  window.dispatchEvent(new CustomEvent(ADMIN_TUTORIAL_ACTIVATE_SECURITY_TAB_EVENT));
  const panel = await waitForSelector(
    adminTourSelector(ADMIN_TOUR_ANCHORS.userDetailSecurityPanel),
    { timeoutMs: 12_000 },
  );
  if (!panel) {
    logClientWarn("admin.tutorials.resetUserPassword", { reason: "security_panel_missing" });
    return;
  }
  await waitForLayoutSettle(100);

  await runDriverTour({
    steps: filterTourStepsForDom(buildResetUserPasswordTourSteps(input.copy)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: "reset-user-password", phase: "complete" }),
    onSkip: () =>
      trackEvent("action", ENTITY, { tutorialId: "reset-user-password", phase: "skip" }),
  });
}
