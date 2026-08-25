import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  buildExplainAdminHomeSteps,
  filterExplainScreenStepsForDom,
  type ExplainAdminHomeTourCopy,
} from "@/lib/admin-tutorials/explainAdminHomeTour";
import {
  buildContentOnlyExplainSteps,
  type ExplainTourChromeCopy,
} from "@/lib/admin-tutorials/explainContentOnlyTour";
import {
  resolveAdminScreenTour,
  type AdminScreenTourId,
  type AdminScreenTourMetaKey,
} from "@/lib/admin-tutorials/screenCatalog";
import {
  getContentOnlyScreenTourDefs,
  type ContentOnlyScreenTourId,
} from "@/lib/admin-tutorials/screenTourDefs";
import { logClientWarn } from "@/lib/logging/clientLog";
import { trackEvent } from "@/lib/analytics/trackClient";
import type { Dictionary } from "@/types/i18n";

export const ADMIN_SCREEN_TOUR_ENTITY_ADMIN_HOME = "admin_screen_tour:admin-home";

export type StartExplainScreenTourInput = {
  locale: string;
  pathname: string;
  screenToursDict: Dictionary["dashboard"]["adminHelpScreenTours"];
};

function entityForId(id: AdminScreenTourId): string {
  return `admin_screen_tour:${id}`;
}

type ScreenTourDictEntry = {
  meta: { title: string; description: string };
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
  steps: Record<string, { title: string; description: string }>;
};

function chromeFromEntry(d: ScreenTourDictEntry): ExplainTourChromeCopy {
  return {
    doneBtn: d.doneBtn,
    nextBtn: d.nextBtn,
    prevBtn: d.prevBtn,
    closeBtn: d.closeBtn,
    progressText: d.progressText,
  };
}

function toExplainAdminHomeCopy(
  d: Dictionary["dashboard"]["adminHelpScreenTours"]["adminHome"],
): ExplainAdminHomeTourCopy {
  return {
    intro: d.steps.intro,
    sidebar: d.steps.sidebar,
    chromeHeader: d.steps.chromeHeader,
    chromeBackToSite: d.steps.chromeBackToSite,
    chromeTeacherPortal: d.steps.chromeTeacherPortal,
    chromeSignOut: d.steps.chromeSignOut,
    chromeLocale: d.steps.chromeLocale,
    chromeBell: d.steps.chromeBell,
    navInstitute: d.steps.navInstitute,
    hubBoost: d.steps.hubBoost,
    sidebarProfile: d.steps.sidebarProfile,
    titleBlock: d.steps.titleBlock,
    studentsWithoutSection: d.steps.studentsWithoutSection,
    birthdays: d.steps.birthdays,
    traffic: d.steps.traffic,
    users: d.steps.users,
    payments: d.steps.payments,
    registrations: d.steps.registrations,
    messages: d.steps.messages,
    closing: d.steps.closing,
    doneBtn: d.doneBtn,
    nextBtn: d.nextBtn,
    prevBtn: d.prevBtn,
    closeBtn: d.closeBtn,
    progressText: d.progressText,
  };
}

function entryForMeta(
  dict: Dictionary["dashboard"]["adminHelpScreenTours"],
  metaKey: AdminScreenTourMetaKey,
): ScreenTourDictEntry | null {
  const entry = dict[metaKey] as ScreenTourDictEntry | undefined;
  if (!entry?.steps || !entry.doneBtn) return null;
  return entry;
}

/** Starts the contextual explain-this-screen Driver.js tour for the current route. */
export async function startExplainScreenTour(
  input: StartExplainScreenTourInput,
): Promise<void> {
  const match = resolveAdminScreenTour(input.pathname, input.locale);
  if (!match) {
    logClientWarn("admin.tutorials.explainScreen", {
      reason: "no_screen_tour",
      pathname: input.pathname,
    });
    return;
  }

  const entity = entityForId(match.id);
  trackEvent("action", entity, { tutorialId: match.id, phase: "start" });

  const entry = entryForMeta(input.screenToursDict, match.metaKey);
  if (!entry) {
    logClientWarn("admin.tutorials.explainScreen", {
      reason: "missing_screen_tour_dict",
      id: match.id,
      metaKey: match.metaKey,
    });
    return;
  }

  const chrome = chromeFromEntry(entry);
  const onComplete = () => {
    trackEvent("action", entity, { tutorialId: match.id, phase: "complete" });
  };
  const onSkip = () => {
    trackEvent("action", entity, { tutorialId: match.id, phase: "skip" });
  };

  if (match.id === "admin-home") {
    const copy = toExplainAdminHomeCopy(
      entry as Dictionary["dashboard"]["adminHelpScreenTours"]["adminHome"],
    );
    const steps = filterExplainScreenStepsForDom(buildExplainAdminHomeSteps(copy));
    const result = await runDriverTour({
      steps,
      copy,
      onComplete,
      onSkip,
    });
    if (result === "error") {
      logClientWarn("admin.tutorials.explainScreen", {
        reason: "driver_error",
        tutorialId: match.id,
      });
    }
    return;
  }

  const defs = getContentOnlyScreenTourDefs(match.id as ContentOnlyScreenTourId);
  const steps = filterExplainScreenStepsForDom(
    buildContentOnlyExplainSteps(entry.steps, defs),
  );
  const result = await runDriverTour({
    steps,
    copy: chrome,
    onComplete,
    onSkip,
  });
  if (result === "error") {
    logClientWarn("admin.tutorials.explainScreen", {
      reason: "driver_error",
      tutorialId: match.id,
    });
  }
}
