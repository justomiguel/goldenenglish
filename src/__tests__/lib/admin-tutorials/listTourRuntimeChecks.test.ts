// REGRESSION CHECK: listTourRuntimeChecks is the shared Vitest ↔ Playwright matrix (rule 33).
import { describe, expect, it } from "vitest";
import { listTourRuntimeChecks } from "@/lib/admin-tutorials/listTourRuntimeChecks";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { buildCreateCohortPreModalSteps } from "@/lib/admin-tutorials/createCohortTour";
import { buildExplainAdminHomeSteps } from "@/lib/admin-tutorials/explainAdminHomeTour";

const declared = new Set(Object.values(ADMIN_TOUR_ANCHORS));

describe("listTourRuntimeChecks", () => {
  it("only references declared ADMIN_TOUR_ANCHORS", () => {
    for (const check of listTourRuntimeChecks()) {
      for (const anchor of check.anchors) {
        expect(declared.has(anchor), `${check.id} → ${anchor}`).toBe(true);
      }
    }
  });

  it("builds paths for home, academic hub, create-user; create-section needs cohortId", () => {
    const byId = Object.fromEntries(listTourRuntimeChecks().map((c) => [c.id, c]));
    expect(byId["screen:admin-home"]?.pathFor("es", {})).toBe("/es/dashboard/admin");
    expect(byId["screen:admin-users"]?.pathFor("es", {})).toBe("/es/dashboard/admin/users");
    expect(byId["screen:admin-glossary"]?.pathFor("es", {})).toBe("/es/dashboard/admin/glossary");
    expect(byId["screen:admin-profile"]?.pathFor("es", {})).toBe("/es/dashboard/profile");
    expect(byId["task:create-cohort"]?.pathFor("es", {})).toBe("/es/dashboard/admin/academic");
    expect(byId["task:create-user"]?.pathFor("es", {})).toBe("/es/dashboard/admin/users/new");
    expect(byId["task:create-section"]?.pathFor("es", {})).toBeNull();
    expect(byId["task:create-section"]?.pathFor("es", { cohortId: "c1" })).toContain(
      "/es/dashboard/admin/academic/c1",
    );
  });

  it("create-cohort runtime anchors include New cohort from the pre-modal builder", () => {
    const check = listTourRuntimeChecks().find((c) => c.id === "task:create-cohort");
    const steps = buildCreateCohortPreModalSteps(
      {
        intro: { title: "t", description: "d" },
        navAcademic: { title: "t", description: "d" },
        newCohort: { title: "t", description: "d" },
        nameField: { title: "t", description: "d" },
        submit: { title: "t", description: "d" },
        detail: { title: "t", description: "d" },
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
        doneBtn: "d",
        nextBtn: "n",
        prevBtn: "p",
        closeBtn: "c",
        progressText: "{{current}}",
      },
      { includeNavStep: true },
    );
    const stepAnchors = new Set(steps.map((s) => s.anchor).filter(Boolean));
    expect(check?.anchors).toContain(ADMIN_TOUR_ANCHORS.newCohort);
    expect(stepAnchors.has(ADMIN_TOUR_ANCHORS.newCohort)).toBe(true);
  });

  it("admin-home runtime anchors are a subset of explain-home step anchors", () => {
    const check = listTourRuntimeChecks().find((c) => c.id === "screen:admin-home");
    const steps = buildExplainAdminHomeSteps({
      intro: { title: "t", description: "d" },
      sidebar: { title: "t", description: "d" },
      chromeHeader: { title: "t", description: "d" },
      chromeBackToSite: { title: "t", description: "d" },
      chromeTeacherPortal: { title: "t", description: "d" },
      chromeSignOut: { title: "t", description: "d" },
      chromeLocale: { title: "t", description: "d" },
      titleBlock: { title: "t", description: "d" },
      studentsWithoutSection: { title: "t", description: "d" },
      birthdays: { title: "t", description: "d" },
      traffic: { title: "t", description: "d" },
      users: { title: "t", description: "d" },
      payments: { title: "t", description: "d" },
      registrations: { title: "t", description: "d" },
      messages: { title: "t", description: "d" },
      closing: { title: "t", description: "d" },
      doneBtn: "d",
      nextBtn: "n",
      prevBtn: "p",
      closeBtn: "c",
      progressText: "{{current}}",
    });
    const stepAnchors = new Set(
      steps.map((s) => s.anchor).filter((a): a is NonNullable<typeof a> => a != null),
    );
    for (const anchor of check?.anchors ?? []) {
      expect(stepAnchors.has(anchor), anchor).toBe(true);
    }
  });
});
