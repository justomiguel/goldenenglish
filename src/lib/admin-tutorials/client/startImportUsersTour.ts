import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  ensureTourPath,
  isUsersImportPath,
  usersImportPath,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import {
  buildImportUsersTourSteps,
  type ImportUsersTourCopy,
} from "@/lib/admin-tutorials/importUsersTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { trackEvent } from "@/lib/analytics/trackClient";

const ENTITY = "admin_tutorial:import-users";

export async function startImportUsersTour(input: {
  locale: string;
  pathname: string;
  copy: ImportUsersTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: "import-users", phase: "start" });

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: usersImportPath(input.locale),
    alreadyOnPath: isUsersImportPath(input.pathname, input.locale),
    waitAnchor: ADMIN_TOUR_ANCHORS.usersImportTitle,
    push: input.push,
    scope: "admin.tutorials.importUsers",
    reason: "users_import_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(buildImportUsersTourSteps(input.copy)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: "import-users", phase: "complete" }),
    onSkip: () => trackEvent("action", ENTITY, { tutorialId: "import-users", phase: "skip" }),
  });
}
