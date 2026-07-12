import type { CreateCohortTourCopy } from "@/lib/admin-tutorials/createCohortTour";
import type { CreateSectionTourCopy } from "@/lib/admin-tutorials/createSectionTour";
import type { CreateStudentTourCopy } from "@/lib/admin-tutorials/createStudentTour";
import type { CreateStaffUserTourCopy } from "@/lib/admin-tutorials/createStaffUserTour";
import { startCreateCohortTour } from "@/lib/admin-tutorials/client/startCreateCohortTour";
import { startCreateSectionTour } from "@/lib/admin-tutorials/client/startCreateSectionTour";
import { startCreateStudentTour } from "@/lib/admin-tutorials/client/startCreateStudentTour";
import {
  startCreateAdminTour,
  startCreateTeacherTour,
} from "@/lib/admin-tutorials/client/startCreateStaffUserTour";
import type { AdminTutorialId } from "@/lib/admin-tutorials/catalog";
import type { Dictionary } from "@/types/i18n";
import { logClientWarn } from "@/lib/logging/clientLog";

export type StartAdminTutorialInput = {
  id: AdminTutorialId;
  locale: string;
  pathname: string;
  toursDict: Dictionary["dashboard"]["adminHelpTours"];
  push: (href: string) => void;
};

function chromeButtons(d: {
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
}) {
  return {
    doneBtn: d.doneBtn,
    nextBtn: d.nextBtn,
    prevBtn: d.prevBtn,
    closeBtn: d.closeBtn,
    progressText: d.progressText,
  };
}

function toCreateCohortCopy(
  d: Dictionary["dashboard"]["adminHelpTours"]["createCohort"],
): CreateCohortTourCopy {
  return {
    intro: d.steps.intro,
    navAcademic: d.steps.navAcademic,
    newCohort: d.steps.newCohort,
    nameField: d.steps.nameField,
    submit: d.steps.submit,
    detail: d.steps.detail,
    existingCohortPrompt: d.existingCohortPrompt,
    handoffToCreateSection: d.handoffToCreateSection,
    ...chromeButtons(d),
  };
}

function toCreateSectionCopy(
  d: Dictionary["dashboard"]["adminHelpTours"]["createSection"],
): CreateSectionTourCopy {
  return {
    intro: d.steps.intro,
    sectionsTab: d.steps.sectionsTab,
    newSection: d.steps.newSection,
    basicsField: d.steps.basicsField,
    periodField: d.steps.periodField,
    scheduleField: d.steps.scheduleField,
    submit: d.steps.submit,
    detail: d.steps.detail,
    missingCohortNotice: d.missingCohortNotice,
    ...chromeButtons(d),
  };
}

function toCreateStudentCopy(
  d: Dictionary["dashboard"]["adminHelpTours"]["createStudent"],
): CreateStudentTourCopy {
  return {
    intro: d.steps.intro,
    navUsers: d.steps.navUsers,
    navAdd: d.steps.navAdd,
    role: d.steps.role,
    nameFields: d.steps.nameFields,
    dni: d.steps.dni,
    birthDate: d.steps.birthDate,
    birthDateBranch: d.birthDateBranch,
    minorHint: d.steps.minorHint,
    guardianPanel: d.steps.guardianPanel,
    guardianMode: d.steps.guardianMode,
    guardianExistingVsNew: d.steps.guardianExistingVsNew,
    relationship: d.steps.relationship,
    adultEmail: d.steps.adultEmail,
    phone: d.steps.phone,
    password: d.steps.password,
    submitGuide: d.steps.submitGuide,
    ...chromeButtons(d),
  };
}

function toCreateStaffCopy(
  d: Dictionary["dashboard"]["adminHelpTours"]["createTeacher"],
): CreateStaffUserTourCopy {
  return {
    intro: d.steps.intro,
    navUsers: d.steps.navUsers,
    navAdd: d.steps.navAdd,
    role: d.steps.role,
    nameFields: d.steps.nameFields,
    email: d.steps.email,
    password: d.steps.password,
    submitGuide: d.steps.submitGuide,
    ...chromeButtons(d),
  };
}

/** Dispatches a catalog tutorial id to its Driver.js runner. */
export async function startAdminTutorial(input: StartAdminTutorialInput): Promise<void> {
  switch (input.id) {
    case "create-cohort":
      await startCreateCohortTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateCohortCopy(input.toursDict.createCohort),
        push: input.push,
        startCreateSectionTour: () =>
          startCreateSectionTour({
            locale: input.locale,
            pathname: input.pathname,
            copy: toCreateSectionCopy(input.toursDict.createSection),
            push: input.push,
          }),
      });
      return;
    case "create-section":
      await startCreateSectionTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateSectionCopy(input.toursDict.createSection),
        push: input.push,
      });
      return;
    case "create-student":
      await startCreateStudentTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateStudentCopy(input.toursDict.createStudent),
        push: input.push,
      });
      return;
    case "create-teacher":
      await startCreateTeacherTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateStaffCopy(input.toursDict.createTeacher),
        push: input.push,
      });
      return;
    case "create-admin":
      await startCreateAdminTour({
        locale: input.locale,
        pathname: input.pathname,
        copy: toCreateStaffCopy(input.toursDict.createAdmin),
        push: input.push,
      });
      return;
    default: {
      logClientWarn("admin.tutorials.start", { reason: "unknown_tutorial_id", id: String(input.id) });
    }
  }
}
