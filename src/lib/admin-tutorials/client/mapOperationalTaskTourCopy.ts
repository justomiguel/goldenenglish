import type { EnableMercadoPagoTourCopy } from "@/lib/admin-tutorials/enableMercadoPagoTour";
import type { EnableFlowTourCopy } from "@/lib/admin-tutorials/enableFlowTour";
import type { ChangeBillingCurrencyTourCopy } from "@/lib/admin-tutorials/changeBillingCurrencyTour";
import type { CreateBlogArticleTourCopy } from "@/lib/admin-tutorials/createBlogArticleTour";
import type { ResetUserPasswordTourCopy } from "@/lib/admin-tutorials/resetUserPasswordTour";
import type { ImportUsersTourCopy } from "@/lib/admin-tutorials/importUsersTour";
import type { ApproveEventPaymentTourCopy } from "@/lib/admin-tutorials/approveEventPaymentTour";
import type { AssignSectionScholarshipBulkTourCopy } from "@/lib/admin-tutorials/assignSectionScholarshipBulkTour";
import type { ChangeSiteSetupCurrencyTourCopy } from "@/lib/admin-tutorials/changeSiteSetupCurrencyTour";
import type { CreateBlogArticleAsTeacherTourCopy } from "@/lib/admin-tutorials/createBlogArticleAsTeacherTour";
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

export function toEnableMercadoPagoCopy(
  d: Tours["enableMercadoPago"],
): EnableMercadoPagoTourCopy {
  return {
    intro: d.steps.intro,
    settingsRoot: d.steps.settingsRoot,
    card: d.steps.card,
    credentials: d.steps.credentials,
    saveGuide: d.steps.saveGuide,
    ...chromeButtons(d),
  };
}

export function toEnableFlowCopy(d: Tours["enableFlow"]): EnableFlowTourCopy {
  return {
    intro: d.steps.intro,
    settingsRoot: d.steps.settingsRoot,
    card: d.steps.card,
    credentials: d.steps.credentials,
    saveGuide: d.steps.saveGuide,
    ...chromeButtons(d),
  };
}

export function toChangeBillingCurrencyCopy(
  d: Tours["changeBillingCurrency"],
): ChangeBillingCurrencyTourCopy {
  return {
    intro: d.steps.intro,
    settingsRoot: d.steps.settingsRoot,
    currencySection: d.steps.currencySection,
    currencyField: d.steps.currencyField,
    warning: d.steps.warning,
    saveGuide: d.steps.saveGuide,
    ...chromeButtons(d),
  };
}

export function toCreateBlogArticleCopy(
  d: Tours["createBlogArticle"],
): CreateBlogArticleTourCopy {
  return {
    intro: d.steps.intro,
    editor: d.steps.editor,
    titleField: d.steps.titleField,
    body: d.steps.body,
    meta: d.steps.meta,
    saveGuide: d.steps.saveGuide,
    ...chromeButtons(d),
  };
}

export function toResetUserPasswordCopy(
  d: Tours["resetUserPassword"],
): ResetUserPasswordTourCopy {
  return {
    intro: d.steps.intro,
    securityTab: d.steps.securityTab,
    securityPanel: d.steps.securityPanel,
    passwordSection: d.steps.passwordSection,
    applyGuide: d.steps.applyGuide,
    ...chromeButtons(d),
  };
}

export function toImportUsersCopy(d: Tours["importUsers"]): ImportUsersTourCopy {
  return {
    intro: d.steps.intro,
    titleBlock: d.steps.titleBlock,
    chooseFile: d.steps.chooseFile,
    tip: d.steps.tip,
    ...chromeButtons(d),
  };
}

export function toApproveEventPaymentCopy(
  d: Tours["approveEventPayment"],
): ApproveEventPaymentTourCopy {
  return {
    intro: d.steps.intro,
    paymentsTab: d.steps.paymentsTab,
    panel: d.steps.panel,
    filters: d.steps.filters,
    approveGuide: d.steps.approveGuide,
    empty: d.steps.empty,
    ...chromeButtons(d),
  };
}

export function toAssignSectionScholarshipBulkCopy(
  d: Tours["assignSectionScholarshipBulk"],
): AssignSectionScholarshipBulkTourCopy {
  return {
    intro: d.steps.intro,
    collectionsRoot: d.steps.collectionsRoot,
    scholarshipsTab: d.steps.scholarshipsTab,
    bulkTrigger: d.steps.bulkTrigger,
    modalGuide: d.steps.modalGuide,
    ...chromeButtons(d),
  };
}

export function toChangeSiteSetupCurrencyCopy(
  d: Tours["changeSiteSetupCurrency"],
): ChangeSiteSetupCurrencyTourCopy {
  return {
    intro: d.steps.intro,
    stepIndicator: d.steps.stepIndicator,
    panel: d.steps.panel,
    currencyField: d.steps.currencyField,
    navGuide: d.steps.navGuide,
    ...chromeButtons(d),
  };
}

export function toCreateBlogArticleAsTeacherCopy(
  d: Tours["createBlogArticleAsTeacher"],
): CreateBlogArticleAsTeacherTourCopy {
  return {
    intro: d.steps.intro,
    editor: d.steps.editor,
    titleField: d.steps.titleField,
    body: d.steps.body,
    meta: d.steps.meta,
    reviewStatus: d.steps.reviewStatus,
    saveGuide: d.steps.saveGuide,
    ...chromeButtons(d),
  };
}
