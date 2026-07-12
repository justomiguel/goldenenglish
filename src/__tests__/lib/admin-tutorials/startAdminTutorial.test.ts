// REGRESSION CHECK: startAdminTutorial is the only switchboard for FAB Play actions.
import { describe, expect, it, vi, beforeEach } from "vitest";
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

const staffSteps = {
  intro: { title: "Intro", description: "d" },
  navUsers: { title: "Nav", description: "d" },
  navAdd: { title: "Add", description: "d" },
  role: { title: "Role", description: "d" },
  nameFields: { title: "Name", description: "d" },
  email: { title: "Email", description: "d" },
  password: { title: "Password", description: "d" },
  submitGuide: { title: "Submit", description: "d" },
};

const toursDict = {
  createCohort: {
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    existingCohortPrompt: {
      title: "t",
      description: "d",
      body: "b",
      useExisting: "u",
      createNew: "n",
      cancel: "c",
    },
    handoffToCreateSection: {
      title: "h",
      description: "d",
      startSectionTour: "s",
      dismiss: "x",
    },
    steps: {
      intro: { title: "Intro", description: "d" },
      navAcademic: { title: "Nav", description: "d" },
      newCohort: { title: "New", description: "d" },
      nameField: { title: "Name", description: "d" },
      submit: { title: "Submit", description: "d" },
      detail: { title: "Detail", description: "d" },
    },
  },
  createSection: {
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    missingCohortNotice: { title: "t", description: "d", dismiss: "OK" },
    steps: {
      intro: { title: "Intro", description: "d" },
      sectionsTab: { title: "Tab", description: "d" },
      newSection: { title: "New", description: "d" },
      basicsField: { title: "Basics", description: "d" },
      periodField: { title: "Period", description: "d" },
      scheduleField: { title: "Schedule", description: "d" },
      submit: { title: "Submit", description: "d" },
      detail: { title: "Detail", description: "d" },
    },
  },
  createStudent: {
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    birthDateBranch: {
      title: "b",
      description: "d",
      minorPath: "m",
      adultPath: "a",
    },
    steps: {
      intro: { title: "Intro", description: "d" },
      navUsers: { title: "Nav", description: "d" },
      navAdd: { title: "Add", description: "d" },
      role: { title: "Role", description: "d" },
      nameFields: { title: "Name", description: "d" },
      dni: { title: "Dni", description: "d" },
      birthDate: { title: "Birth", description: "d" },
      minorHint: { title: "Hint", description: "d" },
      guardianPanel: { title: "G", description: "d" },
      guardianMode: { title: "Mode", description: "d" },
      guardianExistingVsNew: { title: "Ex", description: "d" },
      relationship: { title: "Rel", description: "d" },
      adultEmail: { title: "Email", description: "d" },
      phone: { title: "Phone", description: "d" },
      password: { title: "Password", description: "d" },
      submitGuide: { title: "Submit", description: "d" },
    },
  },
  createTeacher: {
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    steps: staffSteps,
  },
  createAdmin: {
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    steps: staffSteps,
  },
};

describe("startAdminTutorial", () => {
  beforeEach(() => {
    startCreateCohort.mockClear();
    startCreateSection.mockClear();
    startCreateStudent.mockClear();
    startCreateTeacher.mockClear();
    startCreateAdmin.mockClear();
  });

  it("routes create-cohort to startCreateCohortTour", async () => {
    await startAdminTutorial({
      id: "create-cohort",
      locale: "es",
      pathname: "/es/dashboard/admin",
      toursDict,
      push: vi.fn(),
    });
    expect(startCreateCohort).toHaveBeenCalledTimes(1);
  });

  it("routes create-section to startCreateSectionTour", async () => {
    await startAdminTutorial({
      id: "create-section",
      locale: "es",
      pathname: "/es/dashboard/admin",
      toursDict,
      push: vi.fn(),
    });
    expect(startCreateSection).toHaveBeenCalledTimes(1);
  });

  it("routes create-student to startCreateStudentTour", async () => {
    await startAdminTutorial({
      id: "create-student",
      locale: "es",
      pathname: "/es/dashboard/admin",
      toursDict,
      push: vi.fn(),
    });
    expect(startCreateStudent).toHaveBeenCalledTimes(1);
  });

  it("routes create-teacher and create-admin to staff tours", async () => {
    await startAdminTutorial({
      id: "create-teacher",
      locale: "es",
      pathname: "/es/dashboard/admin",
      toursDict,
      push: vi.fn(),
    });
    await startAdminTutorial({
      id: "create-admin",
      locale: "es",
      pathname: "/es/dashboard/admin",
      toursDict,
      push: vi.fn(),
    });
    expect(startCreateTeacher).toHaveBeenCalledTimes(1);
    expect(startCreateAdmin).toHaveBeenCalledTimes(1);
  });
});
