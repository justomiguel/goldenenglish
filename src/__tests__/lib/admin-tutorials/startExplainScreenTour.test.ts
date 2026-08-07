// REGRESSION CHECK: Explain-screen starter must resolve admin-home, filter optional
// DOM steps, and call runDriverTour — never start when pathname has no match.
import { describe, expect, it, vi, beforeEach } from "vitest";

const runDriverTour = vi.fn().mockResolvedValue("completed");
const trackEvent = vi.fn();

vi.mock("@/lib/admin-tutorials/client/runDriverTour", () => ({
  runDriverTour: (...args: unknown[]) => runDriverTour(...args),
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

import { startExplainScreenTour } from "@/lib/admin-tutorials/client/startExplainScreenTour";

const screenToursDict = {
  adminHome: {
    meta: { title: "Admin home", description: "Hub" },
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    steps: {
      intro: { title: "i", description: "d" },
      sidebar: { title: "s", description: "d" },
      chromeHeader: { title: "h", description: "d" },
      chromeBackToSite: { title: "site", description: "d" },
      chromeTeacherPortal: { title: "teach", description: "d" },
      chromeSignOut: { title: "out", description: "d" },
      chromeLocale: { title: "lang", description: "d" },
      titleBlock: { title: "t", description: "d" },
      studentsWithoutSection: { title: "b", description: "d" },
      birthdays: { title: "bd", description: "d" },
      traffic: { title: "tr", description: "d" },
      users: { title: "u", description: "d" },
      payments: { title: "p", description: "d" },
      registrations: { title: "r", description: "d" },
      messages: { title: "m", description: "d" },
      closing: { title: "c", description: "d" },
    },
  },
};

describe("startExplainScreenTour", () => {
  beforeEach(() => {
    runDriverTour.mockClear();
    trackEvent.mockClear();
  });

  it("no-ops when pathname has no screen tour", async () => {
    await startExplainScreenTour({
      locale: "es",
      pathname: "/es/dashboard/admin/users/nested-id",
      screenToursDict: screenToursDict as never,
    });
    expect(runDriverTour).not.toHaveBeenCalled();
  });

  it("starts content-only tour for users when dict entry exists", async () => {
    const withUsers = {
      ...screenToursDict,
      adminUsers: {
        meta: { title: "Users", description: "Dir" },
        doneBtn: "Done",
        nextBtn: "Next",
        prevBtn: "Back",
        closeBtn: "Close",
        progressText: "{{current}} of {{total}}",
        steps: {
          intro: { title: "i", description: "d" },
          subnav: { title: "s", description: "d" },
          titleBlock: { title: "t", description: "d" },
          toolbar: { title: "tb", description: "d" },
          table: { title: "tbl", description: "d" },
          closing: { title: "c", description: "d" },
        },
      },
    };
    await startExplainScreenTour({
      locale: "es",
      pathname: "/es/dashboard/admin/users",
      screenToursDict: withUsers as never,
    });
    expect(trackEvent).toHaveBeenCalledWith(
      "action",
      "admin_screen_tour:admin-users",
      expect.objectContaining({ tutorialId: "admin-users", phase: "start" }),
    );
    expect(runDriverTour).toHaveBeenCalled();
  });

  it("starts driver tour for admin home and tracks start", async () => {
    await startExplainScreenTour({
      locale: "es",
      pathname: "/es/dashboard/admin",
      screenToursDict: screenToursDict as never,
    });
    expect(trackEvent).toHaveBeenCalledWith(
      "action",
      "admin_screen_tour:admin-home",
      expect.objectContaining({ tutorialId: "admin-home", phase: "start" }),
    );
    expect(runDriverTour).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: expect.any(Array),
        copy: expect.objectContaining({ doneBtn: "Done" }),
      }),
    );
  });
});
