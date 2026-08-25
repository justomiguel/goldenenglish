import { describe, expect, it } from "vitest";
import {
  evaluateAdminFirstClassChecklist,
  type AdminFirstClassChecklistFacts,
} from "@/lib/dashboard/evaluateAdminFirstClassChecklist";

const EMPTY_FACTS: AdminFirstClassChecklistFacts = {
  hasStudent: false,
  hasTeacher: false,
  hasCohort: false,
  hasSection: false,
  hasTeacherAssignedToSection: false,
  hasStudentEnrolledInSection: false,
  hasSectionSchedule: false,
  hasSectionFees: false,
  hasPaymentMethod: false,
};

const COMPLETE_FACTS: AdminFirstClassChecklistFacts = {
  hasStudent: true,
  hasTeacher: true,
  hasCohort: true,
  hasSection: true,
  hasTeacherAssignedToSection: true,
  hasStudentEnrolledInSection: true,
  hasSectionSchedule: true,
  hasSectionFees: true,
  hasPaymentMethod: true,
};

describe("evaluateAdminFirstClassChecklist", () => {
  it("marks every item incomplete on an empty site", () => {
    const result = evaluateAdminFirstClassChecklist(EMPTY_FACTS, "es");

    expect(result.allDone).toBe(false);
    expect(result.doneCount).toBe(0);
    expect(result.totalCount).toBe(8);
    expect(result.items.map((item) => item.id)).toEqual([
      "createStudent",
      "createTeacher",
      "createCohortAndSection",
      "assignTeacher",
      "enrollStudent",
      "setSchedule",
      "setFees",
      "setPaymentMethod",
    ]);
    expect(result.items.every((item) => item.done === false)).toBe(true);
  });

  it("is complete only when every operational fact is true", () => {
    const result = evaluateAdminFirstClassChecklist(COMPLETE_FACTS, "es");

    expect(result.allDone).toBe(true);
    expect(result.doneCount).toBe(8);
    expect(result.items.every((item) => item.done)).toBe(true);
  });

  it("requires both a cohort and a section for the academic container item", () => {
    const cohortOnly = evaluateAdminFirstClassChecklist(
      { ...EMPTY_FACTS, hasCohort: true },
      "es",
    );
    const sectionOnly = evaluateAdminFirstClassChecklist(
      { ...EMPTY_FACTS, hasSection: true },
      "es",
    );
    const both = evaluateAdminFirstClassChecklist(
      { ...EMPTY_FACTS, hasCohort: true, hasSection: true },
      "es",
    );

    const id = "createCohortAndSection";
    expect(cohortOnly.items.find((item) => item.id === id)?.done).toBe(false);
    expect(sectionOnly.items.find((item) => item.id === id)?.done).toBe(false);
    expect(both.items.find((item) => item.id === id)?.done).toBe(true);
  });

  it("points incomplete items at the matching admin routes for the locale", () => {
    const result = evaluateAdminFirstClassChecklist(EMPTY_FACTS, "pt");
    const hrefById = Object.fromEntries(result.items.map((item) => [item.id, item.href]));

    expect(hrefById.createStudent).toBe("/pt/dashboard/admin/users/new?role=student");
    expect(hrefById.createTeacher).toBe("/pt/dashboard/admin/users/new?role=teacher");
    expect(hrefById.createCohortAndSection).toBe("/pt/dashboard/admin/academic");
    expect(hrefById.assignTeacher).toBe("/pt/dashboard/admin/academic");
    expect(hrefById.enrollStudent).toBe("/pt/dashboard/admin/academic");
    expect(hrefById.setSchedule).toBe("/pt/dashboard/admin/academic");
    expect(hrefById.setFees).toBe("/pt/dashboard/admin/academic");
    expect(hrefById.setPaymentMethod).toBe("/pt/dashboard/admin/finance?tab=settings");
  });

  it("opens the existing cohort when a section still needs to be created", () => {
    const result = evaluateAdminFirstClassChecklist(
      { ...EMPTY_FACTS, hasCohort: true },
      "es",
      { firstCohortId: "coh-1", sections: [] },
    );
    expect(result.items.find((item) => item.id === "createCohortAndSection")?.href).toBe(
      "/es/dashboard/admin/academic/coh-1",
    );
  });

  it("opens the matching section for teacher, enrollment, schedule, and fees", () => {
    const result = evaluateAdminFirstClassChecklist(
      { ...EMPTY_FACTS, hasCohort: true, hasSection: true },
      "en",
      {
        firstCohortId: "coh-1",
        sections: [
          {
            id: "sec-ready",
            cohortId: "coh-1",
            hasTeacher: true,
            hasSchedule: true,
            hasFees: true,
          },
          {
            id: "sec-gap",
            cohortId: "coh-1",
            hasTeacher: false,
            hasSchedule: false,
            hasFees: false,
          },
        ],
      },
    );
    const hrefById = Object.fromEntries(result.items.map((item) => [item.id, item.href]));

    expect(hrefById.assignTeacher).toBe("/en/dashboard/admin/academic/coh-1/sec-gap");
    expect(hrefById.enrollStudent).toBe("/en/dashboard/admin/academic/coh-1/sec-ready");
    expect(hrefById.setSchedule).toBe("/en/dashboard/admin/academic/coh-1/sec-gap");
    expect(hrefById.setFees).toBe("/en/dashboard/admin/academic/coh-1/sec-gap");
  });
});
