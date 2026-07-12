import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CreateStudentTourCopy } from "@/lib/admin-tutorials/createStudentTour";

const waitForSelector = vi.fn();
const waitForLayoutSettle = vi.fn();
const runDriverTour = vi.fn();
const ensureCreateUserPage = vi.fn();
const dispatchCreateUserTourDemo = vi.fn();

vi.mock("@/lib/admin-tutorials/client/waitForSelector", () => ({
  waitForSelector: (...args: unknown[]) => waitForSelector(...args),
}));
vi.mock("@/lib/admin-tutorials/client/tourLayoutSync", () => ({
  waitForLayoutSettle: (...args: unknown[]) => waitForLayoutSettle(...args),
}));
vi.mock("@/lib/admin-tutorials/client/runDriverTour", () => ({
  runDriverTour: (...args: unknown[]) => runDriverTour(...args),
}));
vi.mock("@/lib/admin-tutorials/client/ensureCreateUserPage", () => ({
  ensureCreateUserPage: (...args: unknown[]) => ensureCreateUserPage(...args),
}));
vi.mock("@/lib/admin-tutorials/client/dispatchCreateUserTourDemo", () => ({
  dispatchCreateUserTourDemo: (...args: unknown[]) => dispatchCreateUserTourDemo(...args),
}));
vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: vi.fn(),
}));

import { startCreateStudentTour } from "@/lib/admin-tutorials/client/startCreateStudentTour";

const step = (title: string) => ({ title, description: `${title} body` });

const copy: CreateStudentTourCopy = {
  intro: step("intro"),
  navUsers: step("navUsers"),
  navAdd: step("navAdd"),
  role: step("role"),
  nameFields: step("name"),
  dni: step("dni"),
  birthDate: step("birth"),
  birthDateBranch: {
    title: "branch",
    description: "branch body",
    minorPath: "minor",
    adultPath: "adult",
  },
  minorHint: step("hint"),
  guardianPanel: step("guardian"),
  guardianMode: step("mode"),
  guardianExistingVsNew: step("existing"),
  relationship: step("rel"),
  adultEmail: step("email"),
  phone: step("phone"),
  password: step("password"),
  submitGuide: step("submit"),
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}}",
};

describe("startCreateStudentTour branch demos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureCreateUserPage.mockResolvedValue(true);
    waitForLayoutSettle.mockResolvedValue(undefined);
    waitForSelector.mockResolvedValue(document.createElement("div"));
    runDriverTour.mockResolvedValue("branch-student-minor");
  });

  it("applies minor demo birth before waiting for guardian panel", async () => {
    await startCreateStudentTour({
      locale: "es",
      pathname: "/es/dashboard/admin/users/new",
      copy,
      push: vi.fn(),
      pathPanelTimeoutMs: 100,
    });
    expect(dispatchCreateUserTourDemo).toHaveBeenCalledWith({
      role: "student",
      birthPath: "minor",
    });
    expect(waitForSelector).toHaveBeenCalled();
    expect(runDriverTour).toHaveBeenCalledTimes(2);
  });

  it("applies adult demo birth before waiting for email", async () => {
    runDriverTour.mockResolvedValueOnce("branch-student-adult");
    await startCreateStudentTour({
      locale: "es",
      pathname: "/es/dashboard/admin/users/new",
      copy,
      push: vi.fn(),
      pathPanelTimeoutMs: 100,
    });
    expect(dispatchCreateUserTourDemo).toHaveBeenCalledWith({
      role: "student",
      birthPath: "adult",
    });
  });
});
