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
};

const minimalToursDict = {
  createCohort: {
    doneBtn: "d",
    nextBtn: "n",
    prevBtn: "p",
    closeBtn: "c",
    progressText: "{{current}}",
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
      intro: { title: "t", description: "d" },
      navAcademic: { title: "t", description: "d" },
      newCohort: { title: "t", description: "d" },
      nameField: { title: "t", description: "d" },
      submit: { title: "t", description: "d" },
      detail: { title: "t", description: "d" },
    },
  },
  createSection: {
    doneBtn: "d",
    nextBtn: "n",
    prevBtn: "p",
    closeBtn: "c",
    progressText: "{{current}}",
    missingCohortNotice: { title: "t", description: "d", dismiss: "OK" },
    steps: {
      intro: { title: "t", description: "d" },
      sectionsTab: { title: "t", description: "d" },
      newSection: { title: "t", description: "d" },
      basicsField: { title: "t", description: "d" },
      periodField: { title: "t", description: "d" },
      scheduleField: { title: "t", description: "d" },
      submit: { title: "t", description: "d" },
      detail: { title: "t", description: "d" },
    },
  },
  createStudent: {
    doneBtn: "d",
    nextBtn: "n",
    prevBtn: "p",
    closeBtn: "c",
    progressText: "{{current}}",
    birthDateBranch: {
      title: "t",
      description: "d",
      continueMinor: "m",
      continueAdult: "a",
    },
    steps: {
      intro: { title: "t", description: "d" },
      navUsers: { title: "t", description: "d" },
      navAdd: { title: "t", description: "d" },
      role: { title: "t", description: "d" },
      nameFields: { title: "t", description: "d" },
      dni: { title: "t", description: "d" },
      birthDate: { title: "t", description: "d" },
      minorHint: { title: "t", description: "d" },
      guardianPanel: { title: "t", description: "d" },
      guardianMode: { title: "t", description: "d" },
      guardianExistingVsNew: { title: "t", description: "d" },
      relationship: { title: "t", description: "d" },
      adultEmail: { title: "t", description: "d" },
      phone: { title: "t", description: "d" },
      password: { title: "t", description: "d" },
      submitGuide: { title: "t", description: "d" },
    },
  },
  createTeacher: {
    doneBtn: "d",
    nextBtn: "n",
    prevBtn: "p",
    closeBtn: "c",
    progressText: "{{current}}",
    steps: {
      intro: { title: "t", description: "d" },
      navUsers: { title: "t", description: "d" },
      navAdd: { title: "t", description: "d" },
      role: { title: "t", description: "d" },
      nameFields: { title: "t", description: "d" },
      email: { title: "t", description: "d" },
      password: { title: "t", description: "d" },
      submitGuide: { title: "t", description: "d" },
    },
  },
  createAdmin: {
    doneBtn: "d",
    nextBtn: "n",
    prevBtn: "p",
    closeBtn: "c",
    progressText: "{{current}}",
    steps: {
      intro: { title: "t", description: "d" },
      navUsers: { title: "t", description: "d" },
      navAdd: { title: "t", description: "d" },
      role: { title: "t", description: "d" },
      nameFields: { title: "t", description: "d" },
      email: { title: "t", description: "d" },
      password: { title: "t", description: "d" },
      submitGuide: { title: "t", description: "d" },
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
  });

  it("lists every catalog tutorial with an icon", () => {
    const rows = listAdminTutorials();
    expect(rows.map((t) => t.id)).toEqual([
      "create-cohort",
      "create-section",
      "create-student",
      "create-teacher",
      "create-admin",
    ]);
    expect(rows.every((r) => Boolean(r.icon))).toBe(true);
  });

  it("has adminHelpCatalog title+description and adminHelpTours entry in en/es/pt", () => {
    for (const locale of ["en", "es", "pt"] as const) {
      const dash = dashboard(loadDict(locale));
      const catalog = dash.adminHelpCatalog as Record<string, Record<string, string>>;
      const tours = dash.adminHelpTours as Record<string, unknown>;
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
  });

  it("resolves admin-home screen tour on the hub path", () => {
    const match = resolveAdminScreenTour("/es/dashboard/admin", "es");
    expect(match?.id).toBe("admin-home");
    expect(match?.scope).toBe("chrome-and-content");
  });
});
