import { runParentDriverTour } from "@/lib/parent-tutorials/client/runParentDriverTour";
import {
  buildExplainParentHomeSteps,
  type ExplainParentHomeTourCopy,
} from "@/lib/parent-tutorials/explainParentHomeTour";
import { buildParentContentOnlyExplainSteps } from "@/lib/parent-tutorials/explainContentOnlyTour";
import { filterParentTourStepsForDom } from "@/lib/parent-tutorials/filterParentTourStepsForDom";
import {
  filterStepsForSurface,
  type ParentTourRuntimeSurface,
} from "@/lib/parent-tutorials/filterStepsForSurface";
import {
  resolveParentScreenTour,
  type ParentScreenTourId,
  type ParentScreenTourMetaKey,
} from "@/lib/parent-tutorials/screenCatalog";
import {
  getParentContentOnlyScreenTourDefs,
  type ParentContentOnlyScreenTourId,
} from "@/lib/parent-tutorials/screenTourDefs";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";
import { PARENT_TOUR_ANALYTICS } from "@/lib/parent-tutorials/analyticsEntities";
import type { Dictionary } from "@/types/i18n";

export function parentScreenTourEntity(id: ParentScreenTourId): string {
  return `${PARENT_TOUR_ANALYTICS.screenTourPrefix}${id}`;
}

export type StartExplainParentScreenTourInput = {
  locale: string;
  pathname: string;
  surface: ParentTourRuntimeSurface;
  screenToursDict: Dictionary["dashboard"]["parentHelpScreenTours"];
};

type ScreenTourDictEntry = {
  meta: { title: string; description: string };
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
  steps: Record<string, { title: string; description: string }>;
};

function entryForMeta(
  dict: Dictionary["dashboard"]["parentHelpScreenTours"],
  metaKey: ParentScreenTourMetaKey,
): ScreenTourDictEntry | null {
  const entry = dict[metaKey] as ScreenTourDictEntry | undefined;
  if (!entry?.steps || !entry.doneBtn) return null;
  return entry;
}

function toHomeCopy(entry: ScreenTourDictEntry): ExplainParentHomeTourCopy {
  const s = entry.steps;
  return {
    intro: s.intro,
    sidebar: s.sidebar,
    tabBar: s.tabBar,
    chromeHeader: s.chromeHeader,
    chromeProfile: s.chromeProfile,
    titleBlock: s.titleBlock,
    childSwitcher: s.childSwitcher,
    statusPillars: s.statusPillars,
    inbox: s.inbox,
    closing: s.closing,
    doneBtn: entry.doneBtn,
    nextBtn: entry.nextBtn,
    prevBtn: entry.prevBtn,
    closeBtn: entry.closeBtn,
    progressText: entry.progressText,
  };
}

/** Starts the contextual explain-this-screen Driver.js tour for the parent route. */
export async function startExplainParentScreenTour(
  input: StartExplainParentScreenTourInput,
): Promise<void> {
  const match = resolveParentScreenTour(input.pathname, input.locale);
  if (!match) {
    logClientWarn("parent.tutorials.explainScreen", {
      reason: "no_screen_tour",
      pathname: input.pathname,
    });
    return;
  }

  const entity = parentScreenTourEntity(match.id);
  trackEvent("action", entity, { tutorialId: match.id, phase: "start" });

  const entry = entryForMeta(input.screenToursDict, match.metaKey);
  if (!entry) {
    logClientWarn("parent.tutorials.explainScreen", {
      reason: "missing_screen_tour_dict",
      id: match.id,
      metaKey: match.metaKey,
    });
    return;
  }

  const chrome = {
    doneBtn: entry.doneBtn,
    nextBtn: entry.nextBtn,
    prevBtn: entry.prevBtn,
    closeBtn: entry.closeBtn,
    progressText: entry.progressText,
  };

  const onComplete = () => {
    trackEvent("action", entity, { tutorialId: match.id, phase: "complete" });
  };
  const onSkip = () => {
    trackEvent("action", entity, { tutorialId: match.id, phase: "skip" });
  };

  const prepare = (raw: ReturnType<typeof buildExplainParentHomeSteps>) =>
    filterParentTourStepsForDom(filterStepsForSurface(raw, input.surface));

  if (match.id === "parent-home") {
    const result = await runParentDriverTour({
      steps: prepare(buildExplainParentHomeSteps(toHomeCopy(entry))),
      copy: chrome,
      onComplete,
      onSkip,
    });
    if (result === "error") {
      logClientWarn("parent.tutorials.explainScreen", {
        reason: "driver_error",
        tutorialId: match.id,
      });
    }
    return;
  }

  const defs = getParentContentOnlyScreenTourDefs(
    match.id as ParentContentOnlyScreenTourId,
  );
  const steps = prepare(buildParentContentOnlyExplainSteps(entry.steps, defs));
  const result = await runParentDriverTour({
    steps,
    copy: chrome,
    onComplete,
    onSkip,
  });
  if (result === "error") {
    logClientWarn("parent.tutorials.explainScreen", {
      reason: "driver_error",
      tutorialId: match.id,
    });
  }
}
