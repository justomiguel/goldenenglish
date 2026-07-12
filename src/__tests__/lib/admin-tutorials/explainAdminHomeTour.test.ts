// REGRESSION CHECK: Admin home explain tour is the only chrome+content walkthrough;
// step order and optional banner / teacher portal must stay stable for Driver.js.
import { describe, expect, it } from "vitest";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import {
  buildExplainAdminHomeSteps,
  filterExplainScreenStepsForDom,
  type ExplainAdminHomeTourCopy,
} from "@/lib/admin-tutorials/explainAdminHomeTour";

const copy: ExplainAdminHomeTourCopy = {
  intro: { title: "Intro", description: "i" },
  sidebar: { title: "Sidebar", description: "s" },
  chromeHeader: { title: "Header", description: "h" },
  chromeBackToSite: { title: "Site", description: "site" },
  chromeTeacherPortal: { title: "Teacher", description: "teach" },
  chromeSignOut: { title: "Sign out", description: "out" },
  chromeLocale: { title: "Locale", description: "lang" },
  titleBlock: { title: "Title", description: "t" },
  studentsWithoutSection: { title: "Banner", description: "b" },
  birthdays: { title: "Birthdays", description: "bd" },
  traffic: { title: "Traffic", description: "tr" },
  users: { title: "Users", description: "u" },
  payments: { title: "Payments", description: "p" },
  registrations: { title: "Regs", description: "r" },
  messages: { title: "Messages", description: "m" },
  closing: { title: "Closing", description: "c" },
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
};

describe("buildExplainAdminHomeSteps", () => {
  it("orders chrome actions then content, ending with closing", () => {
    const steps = buildExplainAdminHomeSteps(copy);
    expect(steps.map((s) => s.anchor)).toEqual([
      null,
      ADMIN_TOUR_ANCHORS.sidebar,
      ADMIN_TOUR_ANCHORS.chromeHeader,
      ADMIN_TOUR_ANCHORS.chromeBackToSite,
      ADMIN_TOUR_ANCHORS.chromeTeacherPortal,
      ADMIN_TOUR_ANCHORS.chromeSignOut,
      ADMIN_TOUR_ANCHORS.chromeLocale,
      ADMIN_TOUR_ANCHORS.hubTitle,
      ADMIN_TOUR_ANCHORS.hubStudentsWithoutSection,
      ADMIN_TOUR_ANCHORS.hubBirthdays,
      ADMIN_TOUR_ANCHORS.hubTraffic,
      ADMIN_TOUR_ANCHORS.hubUsers,
      ADMIN_TOUR_ANCHORS.hubPayments,
      ADMIN_TOUR_ANCHORS.hubRegistrations,
      ADMIN_TOUR_ANCHORS.hubMessages,
      null,
    ]);
    expect(steps[0]?.title).toBe("Intro");
    expect(steps.at(-1)?.title).toBe("Closing");
  });

  it("omits banner step when includeStudentsWithoutSection is false", () => {
    const steps = buildExplainAdminHomeSteps(copy, {
      includeStudentsWithoutSection: false,
    });
    expect(steps.map((s) => s.anchor)).not.toContain(
      ADMIN_TOUR_ANCHORS.hubStudentsWithoutSection,
    );
  });

  it("marks banner and teacher portal steps optional", () => {
    const steps = buildExplainAdminHomeSteps(copy);
    expect(
      steps.find((s) => s.anchor === ADMIN_TOUR_ANCHORS.hubStudentsWithoutSection)
        ?.optional,
    ).toBe(true);
    expect(
      steps.find((s) => s.anchor === ADMIN_TOUR_ANCHORS.chromeTeacherPortal)?.optional,
    ).toBe(true);
  });
});

describe("filterExplainScreenStepsForDom", () => {
  it("drops optional steps when the anchor is missing", () => {
    const steps = buildExplainAdminHomeSteps(copy);
    const filtered = filterExplainScreenStepsForDom(steps, () => null);
    expect(filtered.map((s) => s.anchor)).not.toContain(
      ADMIN_TOUR_ANCHORS.hubStudentsWithoutSection,
    );
    expect(filtered.map((s) => s.anchor)).not.toContain(
      ADMIN_TOUR_ANCHORS.chromeTeacherPortal,
    );
    expect(filtered.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.hubTraffic)).toBe(
      true,
    );
  });

  it("keeps optional steps when the anchor exists", () => {
    const steps = buildExplainAdminHomeSteps(copy);
    const filtered = filterExplainScreenStepsForDom(steps, () => document.body);
    expect(filtered.map((s) => s.anchor)).toContain(
      ADMIN_TOUR_ANCHORS.hubStudentsWithoutSection,
    );
    expect(filtered.map((s) => s.anchor)).toContain(
      ADMIN_TOUR_ANCHORS.chromeTeacherPortal,
    );
  });
});
