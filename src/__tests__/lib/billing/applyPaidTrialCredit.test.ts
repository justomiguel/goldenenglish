/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { applyPaidTrialCredit } from "@/lib/billing/applyPaidTrialCredit";

describe("applyPaidTrialCredit", () => {
  it("leaves dues unchanged when the policy is off", () => {
    expect(
      applyPaidTrialCredit({
        enrollmentDue: 80000,
        tuitionDue: 40000,
        trialPaid: 15000,
        alreadyCredited: 0,
        enabled: false,
      }),
    ).toEqual({
      enrollmentDue: 80000,
      tuitionDue: 40000,
      creditApplied: 0,
      remainingCredit: 15000,
      total: 120000,
    });
  });

  it("subtracts the paid trial from enrollment first, then tuition", () => {
    expect(
      applyPaidTrialCredit({
        enrollmentDue: 10000,
        tuitionDue: 40000,
        trialPaid: 15000,
        alreadyCredited: 0,
        enabled: true,
      }),
    ).toEqual({
      enrollmentDue: 0,
      tuitionDue: 35000,
      creditApplied: 15000,
      remainingCredit: 0,
      total: 35000,
    });
  });

  it("never credits more than the remaining paid trial", () => {
    expect(
      applyPaidTrialCredit({
        enrollmentDue: 80000,
        tuitionDue: 40000,
        trialPaid: 15000,
        alreadyCredited: 5000,
        enabled: true,
      }),
    ).toEqual({
      enrollmentDue: 70000,
      tuitionDue: 40000,
      creditApplied: 10000,
      remainingCredit: 0,
      total: 110000,
    });
  });

  it("can cover the whole first invoice and leave leftover credit", () => {
    expect(
      applyPaidTrialCredit({
        enrollmentDue: 0,
        tuitionDue: 10000,
        trialPaid: 15000,
        alreadyCredited: 0,
        enabled: true,
      }),
    ).toEqual({
      enrollmentDue: 0,
      tuitionDue: 0,
      creditApplied: 10000,
      remainingCredit: 5000,
      total: 0,
    });
  });

  it("does nothing when no trial was paid", () => {
    expect(
      applyPaidTrialCredit({
        enrollmentDue: 80000,
        tuitionDue: 40000,
        trialPaid: 0,
        alreadyCredited: 0,
        enabled: true,
      }),
    ).toMatchObject({ creditApplied: 0, total: 120000 });
  });
});
