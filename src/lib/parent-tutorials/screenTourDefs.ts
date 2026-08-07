import type { ParentContentOnlyStepDef } from "@/lib/parent-tutorials/explainContentOnlyTour";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";
import type { ParentScreenTourId } from "@/lib/parent-tutorials/screenCatalog";

export type ParentContentOnlyScreenTourId = Exclude<
  ParentScreenTourId,
  "parent-home"
>;

const DEFS: Record<ParentContentOnlyScreenTourId, readonly ParentContentOnlyStepDef[]> = {
  "parent-calendar": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.calendarTitle, optional: true },
    { key: "board", anchor: PARENT_TOUR_ANCHORS.calendarBoard, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-progress": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.progressTitle, optional: true },
    { key: "body", anchor: PARENT_TOUR_ANCHORS.progressBody, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-payments": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.paymentsTitle, optional: true },
    { key: "body", anchor: PARENT_TOUR_ANCHORS.paymentsBody, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-messages": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.messagesTitle, optional: true },
    { key: "feed", anchor: PARENT_TOUR_ANCHORS.messagesFeed, optional: true },
    { key: "compose", anchor: PARENT_TOUR_ANCHORS.messagesCompose, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-settings": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.settingsTitle, optional: true },
    { key: "body", anchor: PARENT_TOUR_ANCHORS.settingsBody, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-profile": [
    { key: "intro", anchor: null },
    { key: "form", anchor: PARENT_TOUR_ANCHORS.profileForm, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-billing": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.billingTitle, optional: true },
    { key: "body", anchor: PARENT_TOUR_ANCHORS.billingBody, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-tasks": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.tasksTitle, optional: true },
    { key: "list", anchor: PARENT_TOUR_ANCHORS.tasksList, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-assessments": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.assessmentsTitle, optional: true },
    { key: "body", anchor: PARENT_TOUR_ANCHORS.assessmentsBody, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-badges": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.badgesTitle, optional: true },
    { key: "body", anchor: PARENT_TOUR_ANCHORS.badgesBody, optional: true },
    { key: "closing", anchor: null },
  ],
  "parent-child-detail": [
    { key: "intro", anchor: null },
    { key: "title", anchor: PARENT_TOUR_ANCHORS.childDetailTitle, optional: true },
    { key: "body", anchor: PARENT_TOUR_ANCHORS.childDetailBody, optional: true },
    { key: "closing", anchor: null },
  ],
};

export function getParentContentOnlyScreenTourDefs(
  id: ParentContentOnlyScreenTourId,
): readonly ParentContentOnlyStepDef[] {
  return DEFS[id];
}
