/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  parseTrialFeeCreditSnapshot,
  withTrialCreditRecorded,
} from "@/lib/billing/parseTrialFeeCreditSnapshot";

describe("parseTrialFeeCreditSnapshot", () => {
  it("reads paidTotal only after the trial fee was captured", () => {
    expect(
      parseTrialFeeCreditSnapshot(
        { kind: "trial_fee", total: 0, paidTotal: 15000, currency: "CLP" },
        true,
      ),
    ).toEqual({ trialPaid: 15000, alreadyCredited: 0 });
  });

  it("ignores a snapshot when the trial was not captured", () => {
    expect(
      parseTrialFeeCreditSnapshot({ kind: "trial_fee", total: 15000, currency: "CLP" }, false),
    ).toEqual({ trialPaid: 0, alreadyCredited: 0 });
  });

  it("subtracts credit already applied toward enroll", () => {
    expect(
      parseTrialFeeCreditSnapshot(
        { paidTotal: 15000, creditedTowardEnroll: 4000 },
        true,
      ),
    ).toEqual({ trialPaid: 15000, alreadyCredited: 4000 });
  });
});

describe("withTrialCreditRecorded", () => {
  it("adds to creditedTowardEnroll without dropping other snapshot fields", () => {
    expect(
      withTrialCreditRecorded({ kind: "trial_fee", paidTotal: 15000, currency: "CLP" }, 15000),
    ).toMatchObject({
      kind: "trial_fee",
      paidTotal: 15000,
      currency: "CLP",
      creditedTowardEnroll: 15000,
    });
  });
});
