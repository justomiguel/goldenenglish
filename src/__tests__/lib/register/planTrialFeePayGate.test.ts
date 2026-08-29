/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { planTrialFeePayGate } from "@/lib/register/planTrialFeePayGate";

describe("planTrialFeePayGate", () => {
  it("allows pay when a trial lead has a positive uncaptured quote and open seats", () => {
    expect(
      planTrialFeePayGate({
        intent: "trial",
        status: "new",
        trialFeeCaptured: false,
        snapshotKind: "trial_fee",
        snapshotTotal: 15000,
        seatsHaveCupo: true,
      }),
    ).toEqual({ ok: true });
  });

  it("allows a reschedule delta after the original trial fee was captured", () => {
    expect(
      planTrialFeePayGate({
        intent: "trial",
        status: "new",
        trialFeeCaptured: true,
        snapshotKind: "trial_fee_delta",
        snapshotTotal: 5000,
        seatsHaveCupo: true,
      }),
    ).toEqual({ ok: true });
  });

  it("blocks pay after capture, enrol, empty quote, or a full seat", () => {
    expect(
      planTrialFeePayGate({
        intent: "trial",
        status: "new",
        trialFeeCaptured: true,
        snapshotTotal: 15000,
        seatsHaveCupo: true,
      }),
    ).toEqual({ ok: false, code: "already_captured" });
    expect(
      planTrialFeePayGate({
        intent: "trial",
        status: "enrolled",
        trialFeeCaptured: false,
        snapshotTotal: 15000,
        seatsHaveCupo: true,
      }),
    ).toEqual({ ok: false, code: "enrolled" });
    expect(
      planTrialFeePayGate({
        intent: "trial",
        status: "new",
        trialFeeCaptured: false,
        snapshotTotal: 0,
        seatsHaveCupo: true,
      }),
    ).toEqual({ ok: false, code: "no_amount" });
    expect(
      planTrialFeePayGate({
        intent: "trial",
        status: "new",
        trialFeeCaptured: false,
        snapshotTotal: 15000,
        seatsHaveCupo: false,
      }),
    ).toEqual({ ok: false, code: "section_full" });
  });
});
