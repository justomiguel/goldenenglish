import type { CreateCohortTourCopy } from "@/lib/admin-tutorials/createCohortTour";
import type { CreateSectionTourCopy } from "@/lib/admin-tutorials/createSectionTour";
import type { CreateStudentTourCopy } from "@/lib/admin-tutorials/createStudentTour";
import type { CreateStaffUserTourCopy } from "@/lib/admin-tutorials/createStaffUserTour";
import type { CreateEventTourCopy } from "@/lib/admin-tutorials/createEventTour";
import type { PaymentReviewTourCopy } from "@/lib/admin-tutorials/paymentReviewTour";
import type { TakeAttendanceTourCopy } from "@/lib/admin-tutorials/takeAttendanceTour";
import type { AssignScholarshipTourCopy } from "@/lib/admin-tutorials/assignScholarshipTour";
import type { Dictionary } from "@/types/i18n";

type Tours = Dictionary["dashboard"]["adminHelpTours"];

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

export function toCreateCohortCopy(d: Tours["createCohort"]): CreateCohortTourCopy {
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

export function toCreateSectionCopy(d: Tours["createSection"]): CreateSectionTourCopy {
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

export function toCreateStudentCopy(d: Tours["createStudent"]): CreateStudentTourCopy {
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

export function toCreateStaffCopy(d: Tours["createTeacher"]): CreateStaffUserTourCopy {
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

export function toCreateEventCopy(d: Tours["createEvent"]): CreateEventTourCopy {
  return {
    intro: d.steps.intro,
    createCta: d.steps.createCta,
    form: d.steps.form,
    titleField: d.steps.titleField,
    dateField: d.steps.dateField,
    pricing: d.steps.pricing,
    submitGuide: d.steps.submitGuide,
    ...chromeButtons(d),
  };
}

export function toPaymentReviewCopy(d: Tours["approvePayment"]): PaymentReviewTourCopy {
  return {
    intro: d.steps.intro,
    tabs: d.steps.tabs,
    inbox: d.steps.inbox,
    typeNav: d.steps.typeNav,
    bulkToolbar: d.steps.bulkToolbar,
    action: d.steps.action,
    empty: d.steps.empty,
    ...chromeButtons(d),
  };
}

export function toTakeAttendanceCopy(d: Tours["takeAttendance"]): TakeAttendanceTourCopy {
  return {
    intro: d.steps.intro,
    root: d.steps.root,
    viewTabs: d.steps.viewTabs,
    matrix: d.steps.matrix,
    tip: d.steps.tip,
    ...chromeButtons(d),
  };
}

export function toAssignScholarshipCopy(
  d: Tours["assignScholarshipPercent"],
): AssignScholarshipTourCopy {
  return {
    intro: d.steps.intro,
    panel: d.steps.panel,
    discountFields: d.steps.discountFields,
    saveGuide: d.steps.saveGuide,
    ...chromeButtons(d),
  };
}
