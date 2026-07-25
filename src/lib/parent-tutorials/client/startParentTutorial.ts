import { runParentDriverTour } from "@/lib/parent-tutorials/client/runParentDriverTour";
import {
  buildParentTaskTourSteps,
  parentTutorialTargetPath,
  type ParentTaskTourChromeCopy,
} from "@/lib/parent-tutorials/buildParentTaskTourSteps";
import type { ParentTutorialId } from "@/lib/parent-tutorials/catalog";
import { resolveParentTutorialStudentId } from "@/lib/parent-tutorials/screenCatalog";
import { filterParentTourStepsForDom } from "@/lib/parent-tutorials/filterParentTourStepsForDom";
import {
  filterStepsForSurface,
  type ParentTourRuntimeSurface,
} from "@/lib/parent-tutorials/filterStepsForSurface";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { parentTourSelector, PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";
import { PARENT_TOUR_ANALYTICS } from "@/lib/parent-tutorials/analyticsEntities";
import type { Dictionary } from "@/types/i18n";

export function parentTutorialEntity(id: ParentTutorialId): string {
  return `${PARENT_TOUR_ANALYTICS.tutorialPrefix}${id}`;
}

export type StartParentTutorialInput = {
  id: ParentTutorialId;
  locale: string;
  pathname: string;
  surface: ParentTourRuntimeSurface;
  toursDict: Dictionary["dashboard"]["parentHelpTours"];
  push: (href: string) => void;
  /** First linked ward when not already on a child-detail route. */
  defaultStudentId?: string;
};

function primaryAnchorFor(id: ParentTutorialId): string {
  switch (id) {
    case "parent-pay-or-upload-receipt":
      return parentTourSelector(PARENT_TOUR_ANCHORS.paymentsTitle);
    case "parent-view-child-progress":
      return parentTourSelector(PARENT_TOUR_ANCHORS.progressTitle);
    case "parent-read-reply-messages":
      return parentTourSelector(PARENT_TOUR_ANCHORS.messagesTitle);
    case "parent-manage-child-or-tutor-profile":
      return parentTourSelector(PARENT_TOUR_ANCHORS.childDetailTitle);
    case "parent-settings-notifications":
      return parentTourSelector(PARENT_TOUR_ANCHORS.settingsTitle);
    case "parent-calendar-attendance":
      return parentTourSelector(PARENT_TOUR_ANCHORS.calendarTitle);
    case "parent-badges-overview":
      return parentTourSelector(PARENT_TOUR_ANCHORS.badgesTitle);
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export async function startParentTutorial(
  input: StartParentTutorialInput,
): Promise<void> {
  const entity = parentTutorialEntity(input.id);
  trackEvent("action", entity, { tutorialId: input.id, phase: "start" });

  const entry = input.toursDict[input.id] as ParentTaskTourChromeCopy | undefined;
  if (!entry?.steps?.intro) {
    logClientWarn("parent.tutorials.task", {
      reason: "missing_tour_dict",
      tutorialId: input.id,
    });
    return;
  }

  const studentId = resolveParentTutorialStudentId(
    input.pathname,
    input.locale,
    input.defaultStudentId,
  );
  const target = parentTutorialTargetPath(input.id, input.locale, { studentId });
  const targetPath = target.split("?")[0]!;
  if (!input.pathname.startsWith(targetPath)) {
    input.push(target);
    const found = await waitForSelector(primaryAnchorFor(input.id), {
      timeoutMs: 8000,
    });
    if (!found) {
      logClientWarn("parent.tutorials.task", {
        reason: "anchor_timeout",
        tutorialId: input.id,
      });
    }
  }

  const steps = filterParentTourStepsForDom(
    filterStepsForSurface(buildParentTaskTourSteps(input.id, entry), input.surface),
  );

  const result = await runParentDriverTour({
    steps,
    copy: {
      doneBtn: entry.doneBtn,
      nextBtn: entry.nextBtn,
      prevBtn: entry.prevBtn,
      closeBtn: entry.closeBtn,
      progressText: entry.progressText,
    },
    onComplete: () => {
      trackEvent("action", entity, { tutorialId: input.id, phase: "complete" });
    },
    onSkip: () => {
      trackEvent("action", entity, { tutorialId: input.id, phase: "skip" });
    },
  });

  if (result === "error") {
    logClientWarn("parent.tutorials.task", {
      reason: "driver_error",
      tutorialId: input.id,
    });
  }
}
