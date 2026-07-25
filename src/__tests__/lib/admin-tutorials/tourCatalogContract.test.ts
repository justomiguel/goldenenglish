// REGRESSION CHECK: Catalog ids, dictionary keys (en/es/pt), and startAdminTutorial coverage
// must stay aligned — rule 33 / staleness guards.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listAdminTutorials, type AdminTutorialId } from "@/lib/admin-tutorials/catalog";
import {
  listAdminScreenTourMetaKeys,
  resolveAdminScreenTour,
} from "@/lib/admin-tutorials/screenCatalog";
import { startAdminTutorial } from "@/lib/admin-tutorials/client/startAdminTutorial";

const startCreateCohort = vi.fn().mockResolvedValue(undefined);
const startCreateSection = vi.fn().mockResolvedValue(undefined);
const startCreateStudent = vi.fn().mockResolvedValue(undefined);
const startCreateTeacher = vi.fn().mockResolvedValue(undefined);
const startCreateAdmin = vi.fn().mockResolvedValue(undefined);
const startCreateEvent = vi.fn().mockResolvedValue(undefined);
const startApprovePayment = vi.fn().mockResolvedValue(undefined);
const startRejectPayment = vi.fn().mockResolvedValue(undefined);
const startTakeAttendance = vi.fn().mockResolvedValue(undefined);
const startAssignScholarshipPercent = vi.fn().mockResolvedValue(undefined);
const startAssignScholarshipFull = vi.fn().mockResolvedValue(undefined);
const startEnableMercadoPago = vi.fn().mockResolvedValue(undefined);
const startEnableFlow = vi.fn().mockResolvedValue(undefined);
const startChangeBillingCurrency = vi.fn().mockResolvedValue(undefined);
const startCreateBlogArticle = vi.fn().mockResolvedValue(undefined);
const startResetUserPassword = vi.fn().mockResolvedValue(undefined);
const startImportUsers = vi.fn().mockResolvedValue(undefined);
const startApproveEventPayment = vi.fn().mockResolvedValue(undefined);
const startAssignSectionScholarshipBulk = vi.fn().mockResolvedValue(undefined);
const startChangeSiteSetupCurrency = vi.fn().mockResolvedValue(undefined);
const startCreateBlogArticleAsTeacher = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/admin-tutorials/client/startCreateCohortTour", () => ({
  startCreateCohortTour: (...args: unknown[]) => startCreateCohort(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startCreateSectionTour", () => ({
  startCreateSectionTour: (...args: unknown[]) => startCreateSection(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startCreateStudentTour", () => ({
  startCreateStudentTour: (...args: unknown[]) => startCreateStudent(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startCreateStaffUserTour", () => ({
  startCreateTeacherTour: (...args: unknown[]) => startCreateTeacher(...args),
  startCreateAdminTour: (...args: unknown[]) => startCreateAdmin(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startCreateEventTour", () => ({
  startCreateEventTour: (...args: unknown[]) => startCreateEvent(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startPaymentReviewTour", () => ({
  startApprovePaymentTour: (...args: unknown[]) => startApprovePayment(...args),
  startRejectPaymentTour: (...args: unknown[]) => startRejectPayment(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startTakeAttendanceTour", () => ({
  startTakeAttendanceTour: (...args: unknown[]) => startTakeAttendance(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startAssignScholarshipTour", () => ({
  startAssignScholarshipPercentTour: (...args: unknown[]) =>
    startAssignScholarshipPercent(...args),
  startAssignScholarshipFullTour: (...args: unknown[]) => startAssignScholarshipFull(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startFinanceSettingsTours", () => ({
  startEnableMercadoPagoTour: (...args: unknown[]) => startEnableMercadoPago(...args),
  startEnableFlowTour: (...args: unknown[]) => startEnableFlow(...args),
  startChangeBillingCurrencyTour: (...args: unknown[]) => startChangeBillingCurrency(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startCreateBlogArticleTour", () => ({
  startCreateBlogArticleTour: (...args: unknown[]) => startCreateBlogArticle(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startResetUserPasswordTour", () => ({
  startResetUserPasswordTour: (...args: unknown[]) => startResetUserPassword(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startImportUsersTour", () => ({
  startImportUsersTour: (...args: unknown[]) => startImportUsers(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startApproveEventPaymentTour", () => ({
  startApproveEventPaymentTour: (...args: unknown[]) => startApproveEventPayment(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startAssignSectionScholarshipBulkTour", () => ({
  startAssignSectionScholarshipBulkTour: (...args: unknown[]) =>
    startAssignSectionScholarshipBulk(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startChangeSiteSetupCurrencyTour", () => ({
  startChangeSiteSetupCurrencyTour: (...args: unknown[]) => startChangeSiteSetupCurrency(...args),
}));
vi.mock("@/lib/admin-tutorials/client/startCreateBlogArticleAsTeacherTour", () => ({
  startCreateBlogArticleAsTeacherTour: (...args: unknown[]) =>
    startCreateBlogArticleAsTeacher(...args),
}));

const DICT_DIR = join(process.cwd(), "src/dictionaries");

function loadDict(locale: "en" | "es" | "pt"): Record<string, unknown> {
  return JSON.parse(readFileSync(join(DICT_DIR, `${locale}.json`), "utf8")) as Record<
    string,
    unknown
  >;
}

function dashboard(dict: Record<string, unknown>): Record<string, unknown> {
  return dict.dashboard as Record<string, unknown>;
}

const TOUR_DICT_KEY: Record<AdminTutorialId, string> = {
  "create-cohort": "createCohort",
  "create-section": "createSection",
  "create-student": "createStudent",
  "create-teacher": "createTeacher",
  "create-admin": "createAdmin",
  "create-event": "createEvent",
  "approve-payment": "approvePayment",
  "reject-payment": "rejectPayment",
  "take-attendance": "takeAttendance",
  "assign-scholarship-percent": "assignScholarshipPercent",
  "assign-scholarship-full": "assignScholarshipFull",
  "enable-mercadopago": "enableMercadoPago",
  "enable-flow": "enableFlow",
  "change-billing-currency": "changeBillingCurrency",
  "approve-event-payment": "approveEventPayment",
  "assign-section-scholarship-bulk": "assignSectionScholarshipBulk",
  "change-site-setup-currency": "changeSiteSetupCurrency",
  "create-blog-article": "createBlogArticle",
  "create-blog-article-as-teacher": "createBlogArticleAsTeacher",
  "reset-user-password": "resetUserPassword",
  "import-users": "importUsers",
};

const chrome = {
  doneBtn: "d",
  nextBtn: "n",
  prevBtn: "p",
  closeBtn: "c",
  progressText: "{{current}}",
};

const step = { title: "t", description: "d" };

const minimalToursDict = {
  createCohort: {
    ...chrome,
    existingCohortPrompt: {
      title: "t",
      description: "d",
      body: "b",
      useExisting: "u",
      createNew: "n",
    },
    handoffToCreateSection: {
      title: "h",
      description: "d",
      startSectionTour: "s",
      dismiss: "x",
    },
    steps: {
      intro: step,
      navAcademic: step,
      newCohort: step,
      nameField: step,
      submit: step,
      detail: step,
    },
  },
  createSection: {
    ...chrome,
    missingCohortNotice: { title: "t", description: "d", dismiss: "OK" },
    steps: {
      intro: step,
      sectionsTab: step,
      newSection: step,
      basicsField: step,
      periodField: step,
      scheduleField: step,
      submit: step,
      detail: step,
    },
  },
  createStudent: {
    ...chrome,
    birthDateBranch: {
      title: "t",
      description: "d",
      continueMinor: "m",
      continueAdult: "a",
    },
    steps: {
      intro: step,
      navUsers: step,
      navAdd: step,
      role: step,
      nameFields: step,
      dni: step,
      birthDate: step,
      minorHint: step,
      guardianPanel: step,
      guardianMode: step,
      guardianExistingVsNew: step,
      relationship: step,
      adultEmail: step,
      phone: step,
      password: step,
      submitGuide: step,
    },
  },
  createTeacher: {
    ...chrome,
    steps: {
      intro: step,
      navUsers: step,
      navAdd: step,
      role: step,
      nameFields: step,
      email: step,
      password: step,
      submitGuide: step,
    },
  },
  createAdmin: {
    ...chrome,
    steps: {
      intro: step,
      navUsers: step,
      navAdd: step,
      role: step,
      nameFields: step,
      email: step,
      password: step,
      submitGuide: step,
    },
  },
  createEvent: {
    ...chrome,
    steps: {
      intro: step,
      createCta: step,
      form: step,
      titleField: step,
      dateField: step,
      pricing: step,
      submitGuide: step,
    },
  },
  approvePayment: {
    ...chrome,
    steps: {
      intro: step,
      tabs: step,
      inbox: step,
      typeNav: step,
      bulkToolbar: step,
      action: step,
      empty: step,
    },
  },
  rejectPayment: {
    ...chrome,
    steps: {
      intro: step,
      tabs: step,
      inbox: step,
      typeNav: step,
      bulkToolbar: step,
      action: step,
      empty: step,
    },
  },
  takeAttendance: {
    ...chrome,
    steps: {
      intro: step,
      root: step,
      viewTabs: step,
      matrix: step,
      tip: step,
    },
  },
  assignScholarshipPercent: {
    ...chrome,
    steps: {
      intro: step,
      panel: step,
      discountFields: step,
      saveGuide: step,
    },
  },
  assignScholarshipFull: {
    ...chrome,
    steps: {
      intro: step,
      panel: step,
      discountFields: step,
      saveGuide: step,
    },
  },
  enableMercadoPago: {
    ...chrome,
    steps: {
      intro: step,
      settingsRoot: step,
      card: step,
      credentials: step,
      saveGuide: step,
    },
  },
  enableFlow: {
    ...chrome,
    steps: {
      intro: step,
      settingsRoot: step,
      card: step,
      credentials: step,
      saveGuide: step,
    },
  },
  changeBillingCurrency: {
    ...chrome,
    steps: {
      intro: step,
      settingsRoot: step,
      currencySection: step,
      currencyField: step,
      warning: step,
      saveGuide: step,
    },
  },
  createBlogArticle: {
    ...chrome,
    steps: {
      intro: step,
      editor: step,
      titleField: step,
      body: step,
      meta: step,
      saveGuide: step,
    },
  },
  resetUserPassword: {
    ...chrome,
    steps: {
      intro: step,
      securityTab: step,
      securityPanel: step,
      passwordSection: step,
      applyGuide: step,
    },
  },
  importUsers: {
    ...chrome,
    steps: {
      intro: step,
      titleBlock: step,
      chooseFile: step,
      tip: step,
    },
  },
  approveEventPayment: {
    ...chrome,
    steps: {
      intro: step,
      paymentsTab: step,
      panel: step,
      filters: step,
      approveGuide: step,
      empty: step,
    },
  },
  assignSectionScholarshipBulk: {
    ...chrome,
    steps: {
      intro: step,
      collectionsRoot: step,
      scholarshipsTab: step,
      bulkTrigger: step,
      modalGuide: step,
    },
  },
  changeSiteSetupCurrency: {
    ...chrome,
    steps: {
      intro: step,
      stepIndicator: step,
      panel: step,
      currencyField: step,
      navGuide: step,
    },
  },
  createBlogArticleAsTeacher: {
    ...chrome,
    steps: {
      intro: step,
      editor: step,
      titleField: step,
      body: step,
      meta: step,
      reviewStatus: step,
      saveGuide: step,
    },
  },
};

describe("tourCatalogContract", () => {
  beforeEach(() => {
    startCreateCohort.mockClear();
    startCreateSection.mockClear();
    startCreateStudent.mockClear();
    startCreateTeacher.mockClear();
    startCreateAdmin.mockClear();
    startCreateEvent.mockClear();
    startApprovePayment.mockClear();
    startRejectPayment.mockClear();
    startTakeAttendance.mockClear();
    startAssignScholarshipPercent.mockClear();
    startAssignScholarshipFull.mockClear();
    startEnableMercadoPago.mockClear();
    startEnableFlow.mockClear();
    startChangeBillingCurrency.mockClear();
    startCreateBlogArticle.mockClear();
    startResetUserPassword.mockClear();
    startImportUsers.mockClear();
    startApproveEventPayment.mockClear();
    startAssignSectionScholarshipBulk.mockClear();
    startChangeSiteSetupCurrency.mockClear();
    startCreateBlogArticleAsTeacher.mockClear();
  });

  it("lists every catalog tutorial with an icon and group", () => {
    const rows = listAdminTutorials();
    expect(rows.map((t) => t.id)).toEqual([
      "create-cohort",
      "create-section",
      "take-attendance",
      "approve-payment",
      "reject-payment",
      "assign-scholarship-percent",
      "assign-scholarship-full",
      "enable-mercadopago",
      "enable-flow",
      "change-billing-currency",
      "approve-event-payment",
      "assign-section-scholarship-bulk",
      "change-site-setup-currency",
      "create-student",
      "create-teacher",
      "create-admin",
      "reset-user-password",
      "import-users",
      "create-event",
      "create-blog-article",
      "create-blog-article-as-teacher",
    ]);
    expect(rows.every((r) => Boolean(r.icon) && Boolean(r.group))).toBe(true);
  });

  it("has adminHelpCatalog title+description and adminHelpTours entry in en/es/pt", () => {
    for (const locale of ["en", "es", "pt"] as const) {
      const dash = dashboard(loadDict(locale));
      const catalog = dash.adminHelpCatalog as Record<string, Record<string, string>>;
      const groups = dash.adminHelpCatalogGroups as Record<string, string>;
      const tours = dash.adminHelpTours as Record<string, unknown>;
      expect(groups.academic).toBeTruthy();
      expect(groups.billing).toBeTruthy();
      expect(groups.users).toBeTruthy();
      expect(groups.content).toBeTruthy();
      for (const row of listAdminTutorials()) {
        const entry = catalog[row.id];
        expect(entry?.title, `${locale} catalog ${row.id}.title`).toBeTruthy();
        expect(entry?.description, `${locale} catalog ${row.id}.description`).toBeTruthy();
        const tourKey = TOUR_DICT_KEY[row.id];
        expect(tours[tourKey], `${locale} tours.${tourKey}`).toBeTruthy();
      }
      const explain = dash.adminHelpExplainScreen as Record<string, string>;
      expect(explain.startCta).toBeTruthy();
      const screenTours = dash.adminHelpScreenTours as Record<
        string,
        { meta?: { title?: string }; steps?: Record<string, unknown> }
      >;
      for (const metaKey of listAdminScreenTourMetaKeys()) {
        expect(screenTours[metaKey]?.meta?.title, `${locale} ${metaKey}.meta.title`).toBeTruthy();
        expect(screenTours[metaKey]?.steps, `${locale} ${metaKey}.steps`).toBeTruthy();
      }
    }
  });

  it("dispatches every catalog id through startAdminTutorial", async () => {
    for (const row of listAdminTutorials()) {
      await startAdminTutorial({
        id: row.id,
        locale: "es",
        pathname: "/es/dashboard/admin",
        toursDict: minimalToursDict as never,
        push: vi.fn(),
      });
    }

    expect(startCreateCohort).toHaveBeenCalled();
    expect(startCreateSection).toHaveBeenCalled();
    expect(startCreateStudent).toHaveBeenCalled();
    expect(startCreateTeacher).toHaveBeenCalled();
    expect(startCreateAdmin).toHaveBeenCalled();
    expect(startCreateEvent).toHaveBeenCalled();
    expect(startApprovePayment).toHaveBeenCalled();
    expect(startRejectPayment).toHaveBeenCalled();
    expect(startTakeAttendance).toHaveBeenCalled();
    expect(startAssignScholarshipPercent).toHaveBeenCalled();
    expect(startAssignScholarshipFull).toHaveBeenCalled();
    expect(startEnableMercadoPago).toHaveBeenCalled();
    expect(startEnableFlow).toHaveBeenCalled();
    expect(startChangeBillingCurrency).toHaveBeenCalled();
    expect(startCreateBlogArticle).toHaveBeenCalled();
    expect(startResetUserPassword).toHaveBeenCalled();
    expect(startImportUsers).toHaveBeenCalled();
    expect(startApproveEventPayment).toHaveBeenCalled();
    expect(startAssignSectionScholarshipBulk).toHaveBeenCalled();
    expect(startChangeSiteSetupCurrency).toHaveBeenCalled();
    expect(startCreateBlogArticleAsTeacher).toHaveBeenCalled();
  });

  it("resolves admin-home screen tour on the hub path", () => {
    const match = resolveAdminScreenTour("/es/dashboard/admin", "es");
    expect(match?.id).toBe("admin-home");
    expect(match?.scope).toBe("chrome-and-content");
  });
});
