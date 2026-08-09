import type { ParentTourStepDef } from "@/lib/parent-tutorials/parentTourStepDef";
import type { ParentTutorialId } from "@/lib/parent-tutorials/catalog";
import { parentChildDetailPath } from "@/lib/parent-tutorials/screenCatalog";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

export type ParentTaskTourStepCopy = { title: string; description: string };

export type ParentTaskTourChromeCopy = {
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
  steps: Record<string, ParentTaskTourStepCopy>;
};

export type ParentTutorialTargetEnv = {
  studentId?: string;
};

/** Target path under /{locale}/dashboard/parent (or absolute profile). */
export function parentTutorialTargetPath(
  id: ParentTutorialId,
  locale: string,
  env: ParentTutorialTargetEnv = {},
): string {
  const base = `/${locale}/dashboard/parent`;
  switch (id) {
    case "parent-pay-or-upload-receipt":
      return `${base}/payments`;
    case "parent-view-child-progress":
      return `${base}/child`;
    case "parent-read-reply-messages":
      return `${base}/messages`;
    case "parent-manage-child-or-tutor-profile":
      if (env.studentId) {
        return parentChildDetailPath(locale, env.studentId);
      }
      return `${base}/child/edit`;
    case "parent-calendar-attendance":
      return `${base}/child/attendance`;
    case "parent-badges-overview":
      return `${base}/child/badges`;
    case "parent-settings-notifications":
      // Notification channels are per-child, so this guide goes to the child's own form.
      return `${base}/child/edit`;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function stepCopy(
  steps: ParentTaskTourChromeCopy["steps"],
  key: string,
): ParentTaskTourStepCopy {
  return steps[key] ?? steps.intro;
}

function region(
  anchor: (typeof PARENT_TOUR_ANCHORS)[keyof typeof PARENT_TOUR_ANCHORS],
  copy: ParentTaskTourStepCopy,
): ParentTourStepDef {
  return {
    anchor,
    title: copy.title,
    description: copy.description,
    surfaces: ["both"],
    optional: true,
  };
}

/** Spotlight steps after navigation; optional anchors skip if missing. */
export function buildParentTaskTourSteps(
  id: ParentTutorialId,
  copy: ParentTaskTourChromeCopy,
): ParentTourStepDef[] {
  const s = copy.steps;
  const intro: ParentTourStepDef = {
    anchor: null,
    title: stepCopy(s, "intro").title,
    description: stepCopy(s, "intro").description,
    surfaces: ["both"],
  };

  switch (id) {
    case "parent-pay-or-upload-receipt":
      return [
        intro,
        region(PARENT_TOUR_ANCHORS.paymentsTitle, stepCopy(s, "title")),
        region(PARENT_TOUR_ANCHORS.paymentsBody, stepCopy(s, "body")),
      ];
    case "parent-view-child-progress":
      return [
        intro,
        region(PARENT_TOUR_ANCHORS.childTitle, stepCopy(s, "title")),
        region(PARENT_TOUR_ANCHORS.childBody, stepCopy(s, "body")),
      ];
    case "parent-read-reply-messages":
      return [
        intro,
        region(PARENT_TOUR_ANCHORS.messagesTitle, stepCopy(s, "title")),
        region(PARENT_TOUR_ANCHORS.messagesFeed, stepCopy(s, "feed")),
        region(PARENT_TOUR_ANCHORS.messagesCompose, stepCopy(s, "compose")),
      ];
    case "parent-manage-child-or-tutor-profile":
      return [
        intro,
        region(PARENT_TOUR_ANCHORS.childDetailTitle, stepCopy(s, "title")),
        region(PARENT_TOUR_ANCHORS.profileForm, stepCopy(s, "body")),
      ];
    case "parent-calendar-attendance":
      return [
        intro,
        region(PARENT_TOUR_ANCHORS.attendanceTitle, stepCopy(s, "title")),
        region(PARENT_TOUR_ANCHORS.attendanceBody, stepCopy(s, "board")),
      ];
    case "parent-badges-overview":
      return [
        intro,
        region(PARENT_TOUR_ANCHORS.badgesTitle, stepCopy(s, "title")),
        region(PARENT_TOUR_ANCHORS.badgesBody, stepCopy(s, "body")),
      ];
    case "parent-settings-notifications":
      return [
        intro,
        region(PARENT_TOUR_ANCHORS.childDetailTitle, stepCopy(s, "title")),
        region(PARENT_TOUR_ANCHORS.childDetailBody, stepCopy(s, "body")),
      ];
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
