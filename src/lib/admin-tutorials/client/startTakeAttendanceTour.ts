import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  academicSectionAttendancePath,
  ensureTourPath,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import { fetchAttendanceTarget } from "@/lib/admin-tutorials/client/fetchTourTargets";
import {
  buildTakeAttendanceTourSteps,
  type TakeAttendanceTourCopy,
} from "@/lib/admin-tutorials/takeAttendanceTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";

const ENTITY = "admin_tutorial:take-attendance";

function parseSectionPath(
  pathname: string,
  locale: string,
): { cohortId: string; sectionId: string } | null {
  const base = `/${locale}/dashboard/admin/academic/`;
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length).replace(/\/$/, "");
  const parts = rest.split("/");
  if (parts.length < 2) return null;
  const [cohortId, sectionId] = parts;
  if (!cohortId || !sectionId) return null;
  return { cohortId, sectionId };
}

export async function startTakeAttendanceTour(input: {
  locale: string;
  pathname: string;
  copy: TakeAttendanceTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: "take-attendance", phase: "start" });

  const fromPath = parseSectionPath(input.pathname, input.locale);
  const target = fromPath ?? (await fetchAttendanceTarget());
  const cohortId = fromPath?.cohortId ?? target?.cohortId;
  const sectionId = fromPath?.sectionId ?? target?.sectionId;

  if (!cohortId || !sectionId) {
    logClientWarn("admin.tutorials.takeAttendance", { reason: "no_section_target" });
    return;
  }

  const path = academicSectionAttendancePath(input.locale, cohortId, sectionId);
  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: path,
    alreadyOnPath: input.pathname.includes(`/academic/${cohortId}/${sectionId}`),
    waitAnchor: ADMIN_TOUR_ANCHORS.sectionAttendanceRoot,
    push: input.push,
    scope: "admin.tutorials.takeAttendance",
    reason: "attendance_root_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(buildTakeAttendanceTourSteps(input.copy)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: "take-attendance", phase: "complete" }),
    onSkip: () =>
      trackEvent("action", ENTITY, { tutorialId: "take-attendance", phase: "skip" }),
  });
}
