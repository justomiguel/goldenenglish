/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveSectionTrialOffer } from "@/lib/register/resolveSectionTrialOffer";

describe("resolveSectionTrialOffer", () => {
  it("inherits cohort offer and amount when the section leaves both null", () => {
    expect(
      resolveSectionTrialOffer(
        { offersTrial: null, trialFeeAmount: null },
        { offersTrial: true, trialFeeAmount: 15 },
      ),
    ).toEqual({ offers: true, amount: 15 });
  });

  it("lets the section turn trial off even when the cohort offers it", () => {
    expect(
      resolveSectionTrialOffer(
        { offersTrial: false, trialFeeAmount: 20 },
        { offersTrial: true, trialFeeAmount: 15 },
      ),
    ).toEqual({ offers: false, amount: 0 });
  });

  it("treats a stored 0 as a free trial, not as off", () => {
    expect(
      resolveSectionTrialOffer(
        { offersTrial: true, trialFeeAmount: 0 },
        { offersTrial: true, trialFeeAmount: 15 },
      ),
    ).toEqual({ offers: true, amount: 0 });
  });

  it("uses the section amount when the section offers trial", () => {
    expect(
      resolveSectionTrialOffer(
        { offersTrial: true, trialFeeAmount: 8 },
        { offersTrial: false, trialFeeAmount: 15 },
      ),
    ).toEqual({ offers: true, amount: 8 });
  });
});
