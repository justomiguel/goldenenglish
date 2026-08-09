/**
 * Runtime matrix for parent tours — every screen + task tour must appear here
 * so L1/L2/L3 stay aligned (sibling of admin listTourRuntimeChecks).
 */
import { parentTutorialTargetPath } from "@/lib/parent-tutorials/buildParentTaskTourSteps";
import { listParentTutorialIds, type ParentTutorialId } from "@/lib/parent-tutorials/catalog";
import {
  listParentScreenTourIds,
  parentChildDetailPath,
  parentHomePath,
  parentProfilePath,
  parentScreenPath,
  type ParentScreenTourId,
} from "@/lib/parent-tutorials/screenCatalog";
import {
  PARENT_TOUR_ANCHORS,
  type ParentTourAnchor,
} from "@/lib/parent-tutorials/selectors";

export type ParentTourRuntimeEnv = {
  /** Required for parent-child-detail and optional task paths. */
  studentId?: string;
};

export type ParentTourRuntimeCheck = {
  /** Stable id (`screen:parent-home`, `task:parent-pay-or-upload-receipt`, …). */
  id: string;
  pathFor: (locale: string, env: ParentTourRuntimeEnv) => string | null;
  /** Anchors expected visible on that route without opening modals. */
  anchors: readonly ParentTourAnchor[];
};

const PARENT_HOME_RUNTIME_ANCHORS: readonly ParentTourAnchor[] = [
  PARENT_TOUR_ANCHORS.portalTopNav,
  PARENT_TOUR_ANCHORS.homeTitle,
];

const SCREEN_RUNTIME_ANCHORS: Record<
  Exclude<ParentScreenTourId, "parent-home" | "parent-child-detail">,
  readonly ParentTourAnchor[]
> = {
  "parent-calendar": [PARENT_TOUR_ANCHORS.calendarBoard],
  "parent-child": [PARENT_TOUR_ANCHORS.childTitle],
  "parent-attendance": [PARENT_TOUR_ANCHORS.attendanceTitle],
  "parent-grades": [PARENT_TOUR_ANCHORS.gradesTitle],
  "parent-tasks": [PARENT_TOUR_ANCHORS.tasksTitle],
  "parent-feedback": [PARENT_TOUR_ANCHORS.feedbackTitle],
  "parent-badges": [PARENT_TOUR_ANCHORS.badgesTitle],
  "parent-payments": [PARENT_TOUR_ANCHORS.paymentsTitle],
  "parent-messages": [PARENT_TOUR_ANCHORS.messagesTitle],
  "parent-account": [PARENT_TOUR_ANCHORS.accountTitle],
  "parent-profile": [PARENT_TOUR_ANCHORS.profileForm],
  "parent-billing": [PARENT_TOUR_ANCHORS.billingBody],
};

const TASK_RUNTIME_ANCHORS: Record<ParentTutorialId, readonly ParentTourAnchor[]> = {
  "parent-pay-or-upload-receipt": [PARENT_TOUR_ANCHORS.paymentsTitle],
  "parent-view-child-progress": [PARENT_TOUR_ANCHORS.childTitle],
  "parent-read-reply-messages": [PARENT_TOUR_ANCHORS.messagesTitle],
  "parent-manage-child-or-tutor-profile": [
    PARENT_TOUR_ANCHORS.childDetailTitle,
    PARENT_TOUR_ANCHORS.profileForm,
  ],
  "parent-calendar-attendance": [PARENT_TOUR_ANCHORS.attendanceTitle],
  "parent-badges-overview": [PARENT_TOUR_ANCHORS.badgesTitle],
  // Class reminders live on the child's own screen, which is where this guide lands.
  "parent-settings-notifications": [PARENT_TOUR_ANCHORS.childDetailTitle],
};

function screenRuntimeCheck(id: ParentScreenTourId): ParentTourRuntimeCheck {
  if (id === "parent-home") {
    return {
      id: `screen:${id}`,
      pathFor: (locale) => parentHomePath(locale),
      anchors: PARENT_HOME_RUNTIME_ANCHORS,
    };
  }
  if (id === "parent-child-detail") {
    return {
      id: `screen:${id}`,
      pathFor: (locale, env) => {
        if (!env.studentId) return null;
        return parentChildDetailPath(locale, env.studentId);
      },
      anchors: [PARENT_TOUR_ANCHORS.childDetailTitle],
    };
  }
  if (id === "parent-profile") {
    return {
      id: `screen:${id}`,
      pathFor: (locale) => parentProfilePath(locale),
      anchors: SCREEN_RUNTIME_ANCHORS[id],
    };
  }
  return {
    id: `screen:${id}`,
    pathFor: (locale) => parentScreenPath(locale, id),
    anchors: SCREEN_RUNTIME_ANCHORS[id],
  };
}

function taskRuntimeCheck(id: ParentTutorialId): ParentTourRuntimeCheck {
  return {
    id: `task:${id}`,
    pathFor: (locale, env) => {
      if (id === "parent-manage-child-or-tutor-profile" && !env.studentId) {
        return null;
      }
      return parentTutorialTargetPath(id, locale, { studentId: env.studentId });
    },
    anchors: TASK_RUNTIME_ANCHORS[id],
  };
}

/** Shared matrix for Vitest consistency checks and Playwright `@parent-tours` smokes. */
export function listParentTourRuntimeChecks(): readonly ParentTourRuntimeCheck[] {
  return [
    ...listParentScreenTourIds().map(screenRuntimeCheck),
    ...listParentTutorialIds().map(taskRuntimeCheck),
  ];
}
