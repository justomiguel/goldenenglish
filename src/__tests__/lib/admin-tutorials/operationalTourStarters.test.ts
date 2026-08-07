import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import {
  toAssignScholarshipCopy,
  toCreateEventCopy,
  toPaymentReviewCopy,
  toTakeAttendanceCopy,
} from "@/lib/admin-tutorials/client/mapAdminTutorialCopy";
import {
  toEnableMercadoPagoCopy,
  toCreateBlogArticleCopy,
  toImportUsersCopy,
  toResetUserPasswordCopy,
} from "@/lib/admin-tutorials/client/mapOperationalTaskTourCopy";

const runDriverTour = vi.fn();
const ensureTourPath = vi.fn();
const fetchAttendanceTarget = vi.fn();
const fetchScholarshipTarget = vi.fn();
const waitForSelector = vi.fn();
const waitForLayoutSettle = vi.fn();

vi.mock("@/lib/admin-tutorials/client/runDriverTour", () => ({
  runDriverTour: (...args: unknown[]) => runDriverTour(...args),
}));

vi.mock("@/lib/admin-tutorials/client/ensureTourPath", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/admin-tutorials/client/ensureTourPath")>();
  return {
    ...actual,
    ensureTourPath: (...args: unknown[]) => ensureTourPath(...args),
  };
});

vi.mock("@/lib/admin-tutorials/client/fetchTourTargets", () => ({
  fetchAttendanceTarget: () => fetchAttendanceTarget(),
  fetchScholarshipTarget: () => fetchScholarshipTarget(),
}));

vi.mock("@/lib/admin-tutorials/client/waitForSelector", () => ({
  waitForSelector: (...args: unknown[]) => waitForSelector(...args),
}));

vi.mock("@/lib/admin-tutorials/client/tourLayoutSync", () => ({
  waitForLayoutSettle: (...args: unknown[]) => waitForLayoutSettle(...args),
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/admin-tutorials/filterTourStepsForDom", () => ({
  filterTourStepsForDom: <T,>(steps: T[]) => steps,
}));

describe("operational admin tour starters", () => {
  const tours = en.dashboard.adminHelpTours;
  const push = vi.fn();

  beforeEach(() => {
    runDriverTour.mockReset().mockResolvedValue(undefined);
    ensureTourPath.mockReset().mockResolvedValue(true);
    fetchAttendanceTarget.mockReset().mockResolvedValue({
      cohortId: "c1",
      sectionId: "s1",
    });
    fetchScholarshipTarget.mockReset().mockResolvedValue({ studentId: "u1" });
    waitForSelector.mockReset().mockResolvedValue(document.createElement("div"));
    waitForLayoutSettle.mockReset().mockResolvedValue(undefined);
    push.mockReset();
  });

  it("starts create-event and approve-payment tours", async () => {
    const { startCreateEventTour } = await import(
      "@/lib/admin-tutorials/client/startCreateEventTour"
    );
    const { startApprovePaymentTour } = await import(
      "@/lib/admin-tutorials/client/startPaymentReviewTour"
    );

    await startCreateEventTour({
      locale: "es",
      pathname: "/es/dashboard/admin/events",
      copy: toCreateEventCopy(tours.createEvent),
      push,
    });
    await startApprovePaymentTour({
      locale: "es",
      pathname: "/es/dashboard/admin/finance",
      copy: toPaymentReviewCopy(tours.approvePayment),
      push,
    });

    expect(ensureTourPath).toHaveBeenCalled();
    expect(runDriverTour).toHaveBeenCalledTimes(2);
  });

  it("starts attendance and scholarship tours via targets", async () => {
    const { startTakeAttendanceTour } = await import(
      "@/lib/admin-tutorials/client/startTakeAttendanceTour"
    );
    const { startAssignScholarshipPercentTour } = await import(
      "@/lib/admin-tutorials/client/startAssignScholarshipTour"
    );

    await startTakeAttendanceTour({
      locale: "es",
      pathname: "/es/dashboard/admin",
      copy: toTakeAttendanceCopy(tours.takeAttendance),
      push,
    });
    await startAssignScholarshipPercentTour({
      locale: "es",
      pathname: "/es/dashboard/admin",
      copy: toAssignScholarshipCopy(tours.assignScholarshipPercent),
      push,
    });

    expect(runDriverTour).toHaveBeenCalledTimes(2);
  });

  it("starts finance settings, blog, password, and import tours", async () => {
    const { startEnableMercadoPagoTour } = await import(
      "@/lib/admin-tutorials/client/startFinanceSettingsTours"
    );
    const { startCreateBlogArticleTour } = await import(
      "@/lib/admin-tutorials/client/startCreateBlogArticleTour"
    );
    const { startResetUserPasswordTour } = await import(
      "@/lib/admin-tutorials/client/startResetUserPasswordTour"
    );
    const { startImportUsersTour } = await import(
      "@/lib/admin-tutorials/client/startImportUsersTour"
    );

    await startEnableMercadoPagoTour({
      locale: "es",
      pathname: "/es/dashboard/admin",
      copy: toEnableMercadoPagoCopy(tours.enableMercadoPago),
      push,
    });
    await startCreateBlogArticleTour({
      locale: "es",
      pathname: "/es/dashboard/admin",
      copy: toCreateBlogArticleCopy(tours.createBlogArticle),
      push,
    });
    await startResetUserPasswordTour({
      locale: "es",
      pathname: "/es/dashboard/admin",
      copy: toResetUserPasswordCopy(tours.resetUserPassword),
      push,
    });
    await startImportUsersTour({
      locale: "es",
      pathname: "/es/dashboard/admin",
      copy: toImportUsersCopy(tours.importUsers),
      push,
    });

    expect(runDriverTour).toHaveBeenCalledTimes(4);
  });
});
