import { describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import {
  academicSectionAttendancePath,
  eventsNewPath,
  financeInboxPath,
  isEventsNewPath,
  isFinanceInboxPath,
  studentBillingPath,
} from "@/lib/admin-tutorials/tourPaths";
import {
  toAssignScholarshipCopy,
  toCreateEventCopy,
  toPaymentReviewCopy,
  toTakeAttendanceCopy,
} from "@/lib/admin-tutorials/client/mapAdminTutorialCopy";
import { buildCreateEventTourSteps } from "@/lib/admin-tutorials/createEventTour";
import { buildTakeAttendanceTourSteps } from "@/lib/admin-tutorials/takeAttendanceTour";
import { buildPaymentReviewTourSteps } from "@/lib/admin-tutorials/paymentReviewTour";
import { buildAssignScholarshipTourSteps } from "@/lib/admin-tutorials/assignScholarshipTour";
import { appSurfaceToParentTourSurface } from "@/lib/parent-tutorials/appSurfaceToParentTourSurface";
import { filterParentTourStepsForDom } from "@/lib/parent-tutorials/filterParentTourStepsForDom";
import { PARENT_TOUR_ANALYTICS } from "@/lib/parent-tutorials/analyticsEntities";
import type { ParentTourStepDef } from "@/lib/parent-tutorials/parentTourStepDef";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

describe("admin tourPaths", () => {
  it("builds and recognizes admin tour routes", () => {
    expect(eventsNewPath("es")).toBe("/es/dashboard/admin/events/new");
    expect(isEventsNewPath("/es/dashboard/admin/events/new/", "es")).toBe(true);
    expect(isEventsNewPath("/es/dashboard/admin/events", "es")).toBe(false);
    expect(financeInboxPath("en")).toContain("tab=inbox");
    expect(isFinanceInboxPath("/en/dashboard/admin/finance?tab=inbox", "en")).toBe(true);
    expect(studentBillingPath("pt", "stu-1")).toBe("/pt/dashboard/admin/users/stu-1/billing");
    expect(academicSectionAttendancePath("es", "c1", "s1")).toBe(
      "/es/dashboard/admin/academic/c1/s1/attendance",
    );
  });
});

describe("mapAdminTutorialCopy operational mappers", () => {
  const tours = en.dashboard.adminHelpTours;

  it("maps create-event / payment / attendance / scholarship tour copy", () => {
    const eventCopy = toCreateEventCopy(tours.createEvent);
    const paymentCopy = toPaymentReviewCopy(tours.approvePayment);
    const attendanceCopy = toTakeAttendanceCopy(tours.takeAttendance);
    const scholarshipCopy = toAssignScholarshipCopy(tours.assignScholarshipPercent);

    expect(eventCopy.intro.title).toBeTruthy();
    expect(buildCreateEventTourSteps(eventCopy, { includeListCta: true }).length).toBeGreaterThan(3);
    expect(buildCreateEventTourSteps(eventCopy, { includeListCta: false }).length).toBeGreaterThan(2);
    expect(buildPaymentReviewTourSteps(paymentCopy, "approve").length).toBeGreaterThan(3);
    expect(buildTakeAttendanceTourSteps(attendanceCopy).length).toBeGreaterThan(3);
    expect(buildAssignScholarshipTourSteps(scholarshipCopy, "percent").length).toBeGreaterThan(2);
  });
});

describe("parent tour surface helpers", () => {
  it("maps app surface to parent tour surface", () => {
    expect(appSurfaceToParentTourSurface("web-desktop")).toBe("desktop");
    expect(appSurfaceToParentTourSurface("web-mobile")).toBe("mobile");
    expect(appSurfaceToParentTourSurface("pwa-mobile")).toBe("mobile");
  });

  it("keeps non-optional steps and drops missing optional anchors", () => {
    const steps: ParentTourStepDef[] = [
      {
        anchor: null,
        title: "Intro",
        description: "Always",
        surfaces: ["both"],
      },
      {
        anchor: PARENT_TOUR_ANCHORS.homeInbox,
        title: "Optional",
        description: "Maybe",
        surfaces: ["both"],
        optional: true,
      },
    ];
    const query = vi.fn().mockReturnValue(null);
    const filtered = filterParentTourStepsForDom(steps, query);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Intro");
    expect(PARENT_TOUR_ANALYTICS.tutorialPrefix).toBe("parent_tutorial:");
  });
});
