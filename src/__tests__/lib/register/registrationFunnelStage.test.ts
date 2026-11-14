import { describe, expect, it } from "vitest";
import {
  registrationFunnelStage,
  registrationFunnelStagesForCohort,
  visibleRegistrationInboxFilter,
} from "@/lib/register/registrationFunnelStage";

describe("registrationFunnelStage", () => {
  it("walks a fee lead from contact to paid without a section", () => {
    expect(registrationFunnelStage({ status: "new", snapshotTotal: 80 })).toBe("registered");
    expect(
      registrationFunnelStage({ status: "contacted", snapshotTotal: 80 }),
    ).toBe("contacted");
    expect(
      registrationFunnelStage({
        status: "contacted",
        snapshotTotal: 80,
        enrollmentFeeMailSentAt: "2026-11-10T00:00:00.000Z",
      }),
    ).toBe("awaiting_payment");
    expect(
      registrationFunnelStage({
        status: "new",
        snapshotTotal: 80,
        intakeState: "receipt_pending",
      }),
    ).toBe("awaiting_payment");
    expect(
      registrationFunnelStage({
        status: "new",
        snapshotTotal: 80,
        feeCaptured: true,
        acceptedStudentId: "stu-1",
        intakeState: "needs_section",
      }),
    ).toBe("paid_without_section");
    expect(
      registrationFunnelStage({ status: "enrolled", snapshotTotal: 80, feeCaptured: true }),
    ).toBeNull();
  });

  it("skips payment when the lead has no matrícula", () => {
    expect(registrationFunnelStage({ status: "new", snapshotTotal: 0 })).toBe("registered");
    expect(registrationFunnelStage({ status: "contacted", snapshotTotal: 0 })).toBe(
      "awaiting_section",
    );
    expect(
      registrationFunnelStage({
        status: "contacted",
        chargesEnrollmentFee: true,
        snapshotTotal: 0,
      }),
    ).toBe("contacted");
    expect(
      registrationFunnelStage({
        status: "contacted",
        snapshotTotal: 0,
        enrollmentFeeMailSentAt: "2026-11-10T00:00:00.000Z",
      }),
    ).toBe("awaiting_section");
    expect(
      registrationFunnelStage({
        status: "new",
        snapshotTotal: 0,
        acceptedStudentId: "stu-1",
      }),
    ).toBe("registered");
  });

  it("lists fee stages and hides the no-fee stage", () => {
    expect(registrationFunnelStagesForCohort(true)).toEqual([
      "registered",
      "contacted",
      "awaiting_payment",
      "paid_without_section",
      "enrolled_in_section",
    ]);
  });

  it("lists the three stages when the cohort has no matrícula", () => {
    expect(registrationFunnelStagesForCohort(false)).toEqual([
      "registered",
      "awaiting_section",
      "enrolled_in_section",
    ]);
  });

  it("opens pre-enrolled when the URL names a hidden stage", () => {
    expect(visibleRegistrationInboxFilter("awaiting_section", true)).toBe("registered");
    expect(visibleRegistrationInboxFilter("contacted", false)).toBe("registered");
    expect(visibleRegistrationInboxFilter("paid_without_section", true)).toBe(
      "paid_without_section",
    );
  });

  it("keeps an unpaid approved student out of the paid stage", () => {
    expect(
      registrationFunnelStage({
        status: "new",
        snapshotTotal: 80,
        feeCaptured: false,
        acceptedStudentId: "stu-1",
        intakeState: "needs_section",
      }),
    ).toBe("registered");
  });
});
