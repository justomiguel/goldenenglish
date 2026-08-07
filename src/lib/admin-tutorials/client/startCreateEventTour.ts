import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  ensureTourPath,
  eventsNewPath,
  isEventsNewPath,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import {
  buildCreateEventTourSteps,
  type CreateEventTourCopy,
} from "@/lib/admin-tutorials/createEventTour";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { trackEvent } from "@/lib/analytics/trackClient";

const ENTITY = "admin_tutorial:create-event";

export async function startCreateEventTour(input: {
  locale: string;
  pathname: string;
  copy: CreateEventTourCopy;
  push: (href: string) => void;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: "create-event", phase: "start" });

  const includeListCta = !isEventsNewPath(input.pathname, input.locale);
  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: eventsNewPath(input.locale),
    alreadyOnPath: isEventsNewPath(input.pathname, input.locale),
    waitAnchor: ADMIN_TOUR_ANCHORS.eventCreateForm,
    push: input.push,
    scope: "admin.tutorials.createEvent",
    reason: "event_create_form_missing",
  });
  if (!ready) return;

  await runDriverTour({
    steps: filterTourStepsForDom(buildCreateEventTourSteps(input.copy, { includeListCta })),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: "create-event", phase: "complete" }),
    onSkip: () => trackEvent("action", ENTITY, { tutorialId: "create-event", phase: "skip" }),
  });
}
