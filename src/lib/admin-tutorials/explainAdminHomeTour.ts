import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type ExplainAdminHomeStepCopy = {
  title: string;
  description: string;
};

export type ExplainAdminHomeTourCopy = {
  intro: ExplainAdminHomeStepCopy;
  sidebar: ExplainAdminHomeStepCopy;
  chromeHeader: ExplainAdminHomeStepCopy;
  chromeBackToSite: ExplainAdminHomeStepCopy;
  chromeTeacherPortal: ExplainAdminHomeStepCopy;
  chromeSignOut: ExplainAdminHomeStepCopy;
  chromeLocale: ExplainAdminHomeStepCopy;
  titleBlock: ExplainAdminHomeStepCopy;
  studentsWithoutSection: ExplainAdminHomeStepCopy;
  birthdays: ExplainAdminHomeStepCopy;
  traffic: ExplainAdminHomeStepCopy;
  users: ExplainAdminHomeStepCopy;
  payments: ExplainAdminHomeStepCopy;
  registrations: ExplainAdminHomeStepCopy;
  messages: ExplainAdminHomeStepCopy;
  closing: ExplainAdminHomeStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

export type BuildExplainAdminHomeStepsOptions = {
  /** When false, omit the students-without-section step (banner not on page). */
  includeStudentsWithoutSection?: boolean;
};

/** Driver steps for explaining the admin hub (chrome + content). */
export function buildExplainAdminHomeSteps(
  copy: ExplainAdminHomeTourCopy,
  options: BuildExplainAdminHomeStepsOptions = {},
): AdminTourStepDef[] {
  const includeBanner = options.includeStudentsWithoutSection !== false;

  const steps: AdminTourStepDef[] = [
    {
      anchor: null,
      title: copy.intro.title,
      description: copy.intro.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.sidebar,
      title: copy.sidebar.title,
      description: copy.sidebar.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.chromeHeader,
      title: copy.chromeHeader.title,
      description: copy.chromeHeader.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.chromeBackToSite,
      title: copy.chromeBackToSite.title,
      description: copy.chromeBackToSite.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.chromeTeacherPortal,
      title: copy.chromeTeacherPortal.title,
      description: copy.chromeTeacherPortal.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.chromeSignOut,
      title: copy.chromeSignOut.title,
      description: copy.chromeSignOut.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.chromeLocale,
      title: copy.chromeLocale.title,
      description: copy.chromeLocale.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.hubTitle,
      title: copy.titleBlock.title,
      description: copy.titleBlock.description,
    },
  ];

  if (includeBanner) {
    steps.push({
      anchor: ADMIN_TOUR_ANCHORS.hubStudentsWithoutSection,
      title: copy.studentsWithoutSection.title,
      description: copy.studentsWithoutSection.description,
      optional: true,
    });
  }

  steps.push(
    {
      anchor: ADMIN_TOUR_ANCHORS.hubTraffic,
      title: copy.traffic.title,
      description: copy.traffic.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.hubUsers,
      title: copy.users.title,
      description: copy.users.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.hubPayments,
      title: copy.payments.title,
      description: copy.payments.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.hubRegistrations,
      title: copy.registrations.title,
      description: copy.registrations.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.hubMessages,
      title: copy.messages.title,
      description: copy.messages.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.hubBirthdays,
      title: copy.birthdays.title,
      description: copy.birthdays.description,
    },
    {
      anchor: null,
      title: copy.closing.title,
      description: copy.closing.description,
    },
  );

  return steps;
}

import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";

/** @deprecated Prefer `filterTourStepsForDom` — kept for explain-screen call sites. */
export function filterExplainScreenStepsForDom(
  steps: AdminTourStepDef[],
  query?: (selector: string) => Element | null,
): AdminTourStepDef[] {
  return filterTourStepsForDom(steps, query);
}
