// REGRESSION CHECK: listTourRuntimeChecks is the shared Vitest ↔ Playwright matrix (rule 33).
// Every AdminScreenTourId + AdminTutorialId must have a row — new tour without matrix = fail.
import { describe, expect, it } from "vitest";
import { listAdminTutorials } from "@/lib/admin-tutorials/catalog";
import { listTourRuntimeChecks } from "@/lib/admin-tutorials/listTourRuntimeChecks";
import { listAdminScreenTourIds } from "@/lib/admin-tutorials/screenCatalog";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { buildCreateCohortPreModalSteps } from "@/lib/admin-tutorials/createCohortTour";
import { buildExplainAdminHomeSteps } from "@/lib/admin-tutorials/explainAdminHomeTour";
import {
  CONTENT_ONLY_SCREEN_TOUR_DEFS,
  type ContentOnlyScreenTourId,
} from "@/lib/admin-tutorials/screenTourDefs";
import { requiredAnchorsFromContentOnlyDefs } from "@/lib/admin-tutorials/requiredAnchorsFromContentOnlyDefs";

const declared = new Set(Object.values(ADMIN_TOUR_ANCHORS));

describe("listTourRuntimeChecks", () => {
  it("covers every registered screen tour and every task tutorial (L3 contract)", () => {
    const ids = new Set(listTourRuntimeChecks().map((c) => c.id));
    for (const screenId of listAdminScreenTourIds()) {
      expect(ids.has(`screen:${screenId}`), `missing screen:${screenId}`).toBe(true);
    }
    for (const { id } of listAdminTutorials()) {
      expect(ids.has(`task:${id}`), `missing task:${id}`).toBe(true);
    }
  });

  it("only references declared ADMIN_TOUR_ANCHORS", () => {
    for (const check of listTourRuntimeChecks()) {
      for (const anchor of check.anchors) {
        expect(declared.has(anchor), `${check.id} → ${anchor}`).toBe(true);
      }
    }
  });

  it("content-only screen checks require non-optional anchors from tour defs", () => {
    const byId = Object.fromEntries(listTourRuntimeChecks().map((c) => [c.id, c]));
    for (const screenId of Object.keys(CONTENT_ONLY_SCREEN_TOUR_DEFS) as ContentOnlyScreenTourId[]) {
      const expected = requiredAnchorsFromContentOnlyDefs(
        CONTENT_ONLY_SCREEN_TOUR_DEFS[screenId],
      );
      expect(byId[`screen:${screenId}`]?.anchors).toEqual(expected);
    }
  });

  it("builds paths for home, academic hub, create-user tasks; create-section needs cohortId", () => {
    const byId = Object.fromEntries(listTourRuntimeChecks().map((c) => [c.id, c]));
    expect(byId["screen:admin-home"]?.pathFor("es", {})).toBe("/es/dashboard/admin");
    expect(byId["screen:admin-users"]?.pathFor("es", {})).toBe("/es/dashboard/admin/users");
    expect(byId["screen:admin-users-new"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/users/new",
    );
    expect(byId["screen:admin-users-import"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/users/import",
    );
    expect(byId["screen:admin-events-new"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/events/new",
    );
    expect(byId["screen:admin-event-detail"]?.pathFor("es", {})).toBeNull();
    expect(byId["screen:admin-event-detail"]?.pathFor("es", { eventId: "e1" })).toBe(
      "/es/dashboard/admin/events/e1",
    );
    expect(byId["screen:admin-messages-compose"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/messages/compose",
    );
    expect(byId["screen:admin-message-detail"]?.pathFor("es", {})).toBeNull();
    expect(byId["screen:admin-message-detail"]?.pathFor("es", { messageId: "m1" })).toBe(
      "/es/dashboard/admin/messages/m1",
    );
    expect(byId["screen:admin-user-detail"]?.pathFor("es", {})).toBeNull();
    expect(byId["screen:admin-user-detail"]?.pathFor("es", { studentId: "u1" })).toBe(
      "/es/dashboard/admin/users/u1",
    );
    expect(byId["screen:admin-user-billing"]?.pathFor("es", {})).toBeNull();
    expect(byId["screen:admin-user-billing"]?.pathFor("es", { studentId: "u1" })).toBe(
      "/es/dashboard/admin/users/u1/billing",
    );
    expect(byId["screen:admin-blog-new"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/cms/blog/new",
    );
    expect(byId["screen:admin-blog-edit"]?.pathFor("es", {})).toBeNull();
    expect(byId["screen:admin-blog-edit"]?.pathFor("es", { blogArticleId: "a1" })).toBe(
      "/es/dashboard/admin/cms/blog/a1/edit",
    );
    expect(byId["screen:admin-cohort-detail"]?.pathFor("es", {})).toBeNull();
    expect(byId["screen:admin-cohort-detail"]?.pathFor("es", { cohortId: "c1" })).toBe(
      "/es/dashboard/admin/academic/c1",
    );
    expect(byId["screen:admin-section-attendance"]?.pathFor("es", { cohortId: "c1" })).toBeNull();
    expect(
      byId["screen:admin-section-attendance"]?.pathFor("es", {
        cohortId: "c1",
        sectionId: "s1",
      }),
    ).toBe("/es/dashboard/admin/academic/c1/s1/attendance");
    expect(byId["screen:admin-section-detail"]?.pathFor("es", { cohortId: "c1" })).toBeNull();
    expect(
      byId["screen:admin-section-detail"]?.pathFor("es", {
        cohortId: "c1",
        sectionId: "s1",
      }),
    ).toBe("/es/dashboard/admin/academic/c1/s1");
    expect(byId["screen:admin-finance-collections-section"]?.pathFor("es", {})).toBeNull();
    expect(
      byId["screen:admin-finance-collections-section"]?.pathFor("es", { sectionId: "s1" }),
    ).toBe("/es/dashboard/admin/finance/collections/s1");
    expect(byId["screen:admin-finance-receipt-detail"]?.pathFor("es", {})).toBeNull();
    expect(
      byId["screen:admin-finance-receipt-detail"]?.pathFor("es", { receiptId: "r1" }),
    ).toBe("/es/dashboard/admin/finance/receipts/r1");
    expect(byId["screen:admin-settings-integrations"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/settings/integrations",
    );
    expect(byId["screen:admin-finance"]?.pathFor("es", {})).toBe("/es/dashboard/admin/finance");
    expect(byId["screen:admin-glossary"]?.pathFor("es", {})).toBe("/es/dashboard/admin/glossary");
    expect(byId["screen:admin-profile"]?.pathFor("es", {})).toBe("/es/dashboard/profile");
    expect(byId["task:create-cohort"]?.pathFor("es", {})).toBe("/es/dashboard/admin/academic");
    expect(byId["task:create-student"]?.pathFor("es", {})).toBe("/es/dashboard/admin/users/new");
    expect(byId["task:create-teacher"]?.pathFor("es", {})).toBe("/es/dashboard/admin/users/new");
    expect(byId["task:create-admin"]?.pathFor("es", {})).toBe("/es/dashboard/admin/users/new");
    expect(byId["task:create-event"]?.pathFor("es", {})).toBe("/es/dashboard/admin/events/new");
    expect(byId["task:approve-payment"]?.pathFor("es", {})).toContain(
      "/es/dashboard/admin/finance?tab=inbox",
    );
    expect(byId["task:create-section"]?.pathFor("es", {})).toBeNull();
    expect(byId["task:create-section"]?.pathFor("es", { cohortId: "c1" })).toContain(
      "/es/dashboard/admin/academic/c1",
    );
    expect(byId["task:take-attendance"]?.pathFor("es", { cohortId: "c1" })).toBeNull();
    expect(
      byId["task:take-attendance"]?.pathFor("es", { cohortId: "c1", sectionId: "s1" }),
    ).toBe("/es/dashboard/admin/academic/c1/s1/attendance");
    expect(byId["task:assign-scholarship-percent"]?.pathFor("es", {})).toBeNull();
    expect(byId["task:assign-scholarship-percent"]?.pathFor("es", { studentId: "u1" })).toBe(
      "/es/dashboard/admin/users/u1/billing",
    );
    expect(byId["task:enable-mercadopago"]?.pathFor("es", {})).toContain(
      "/es/dashboard/admin/finance?tab=settings",
    );
    expect(byId["task:create-blog-article"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/cms/blog/new",
    );
    expect(byId["task:reset-user-password"]?.pathFor("es", {})).toBeNull();
    expect(byId["task:reset-user-password"]?.pathFor("es", { studentId: "u1" })).toBe(
      "/es/dashboard/admin/users/u1",
    );
    expect(byId["task:import-users"]?.pathFor("es", {})).toBe("/es/dashboard/admin/users/import");
    expect(byId["task:approve-event-payment"]?.pathFor("es", {})).toBeNull();
    expect(byId["task:approve-event-payment"]?.pathFor("es", { eventId: "e1" })).toBe(
      "/es/dashboard/admin/events/e1?tab=payments",
    );
    expect(byId["task:assign-section-scholarship-bulk"]?.pathFor("es", {})).toBeNull();
    expect(byId["task:assign-section-scholarship-bulk"]?.pathFor("es", { sectionId: "s1" })).toBe(
      "/es/dashboard/admin/finance/collections/s1",
    );
    expect(byId["task:change-site-setup-currency"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/site-setup",
    );
    expect(byId["task:create-blog-article-as-teacher"]?.pathFor("es", {})).toBe(
      "/es/dashboard/admin/cms/blog/new",
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
    expect(check?.anchors).not.toContain(ADMIN_TOUR_ANCHORS.chromeLocale);
  });
});
