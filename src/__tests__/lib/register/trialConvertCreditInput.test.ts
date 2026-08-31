/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { trialConvertCreditInput } from "@/lib/register/trialConvertCreditInput";

describe("trialConvertCreditInput", () => {
  it("exposes captured paidTotal when the institute credits trials", () => {
    expect(
      trialConvertCreditInput(
        {
          trial_fee_captured: true,
          trial_fee_snapshot: { paidTotal: 15000, creditedTowardEnroll: 0 },
        },
        true,
      ),
    ).toEqual({
      trialPaid: 15000,
      trialAlreadyCredited: 0,
      creditEnabled: true,
    });
  });

  it("keeps creditEnabled false when the admin turned the policy off", () => {
    expect(
      trialConvertCreditInput(
        { trial_fee_captured: true, trial_fee_snapshot: { paidTotal: 15000 } },
        false,
      ),
    ).toMatchObject({ trialPaid: 15000, creditEnabled: false });
  });
});
