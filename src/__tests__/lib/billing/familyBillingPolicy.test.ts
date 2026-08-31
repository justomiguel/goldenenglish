/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_DEFAULT,
  ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY,
  CREDIT_PAID_TRIAL_ON_ENROLL_DEFAULT,
  CREDIT_PAID_TRIAL_ON_ENROLL_KEY,
  familyBillingPolicyFromRows,
  parseSiteSettingBoolean,
} from "@/lib/billing/familyBillingPolicy";

describe("familyBillingPolicy", () => {
  it("keeps both institute defaults on so current family flows stay unchanged", () => {
    expect(CREDIT_PAID_TRIAL_ON_ENROLL_DEFAULT).toBe(true);
    expect(ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_DEFAULT).toBe(true);
    expect(CREDIT_PAID_TRIAL_ON_ENROLL_KEY).toBe("credit_paid_trial_on_enroll");
    expect(ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY).toBe(
      "allow_parent_partial_section_payments",
    );
  });

  it("parses explicit JSON booleans and strings", () => {
    expect(parseSiteSettingBoolean(true)).toBe(true);
    expect(parseSiteSettingBoolean("true")).toBe(true);
    expect(parseSiteSettingBoolean(false)).toBe(false);
    expect(parseSiteSettingBoolean("false")).toBe(false);
  });

  it("returns null when unset so loaders can apply defaults", () => {
    expect(parseSiteSettingBoolean(null)).toBeNull();
    expect(parseSiteSettingBoolean(undefined)).toBeNull();
    expect(parseSiteSettingBoolean("")).toBeNull();
  });

  it("falls back to defaults when rows are missing", () => {
    expect(familyBillingPolicyFromRows([])).toEqual({
      creditPaidTrialOnEnroll: true,
      allowParentPartialSectionPayments: true,
    });
  });

  it("reads stored booleans over defaults", () => {
    expect(
      familyBillingPolicyFromRows([
        { key: CREDIT_PAID_TRIAL_ON_ENROLL_KEY, value: false },
        { key: ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY, value: false },
      ]),
    ).toEqual({
      creditPaidTrialOnEnroll: false,
      allowParentPartialSectionPayments: false,
    });
  });
});
