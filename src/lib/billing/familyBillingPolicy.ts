/**
 * Institute-wide family checkout policy.
 * Stored in public.site_settings as JSON booleans.
 */

export const CREDIT_PAID_TRIAL_ON_ENROLL_KEY = "credit_paid_trial_on_enroll";
export const ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY =
  "allow_parent_partial_section_payments";

/** Default on: a paid trial should reduce the first enrollment + tuition invoice. */
export const CREDIT_PAID_TRIAL_ON_ENROLL_DEFAULT = true;

/** Default on: today's parent review asks whether to pay one section or every due section. */
export const ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_DEFAULT = true;

export type FamilyBillingPolicy = {
  creditPaidTrialOnEnroll: boolean;
  allowParentPartialSectionPayments: boolean;
};

export function parseSiteSettingBoolean(raw: unknown): boolean | null {
  if (raw === true || raw === "true") return true;
  if (raw === false || raw === "false") return false;
  return null;
}

export function familyBillingPolicyFromRows(
  rows: ReadonlyArray<{ key?: unknown; value?: unknown }>,
): FamilyBillingPolicy {
  const byKey = new Map(
    rows.map((row) => [String(row.key ?? ""), row.value] as const),
  );
  return {
    creditPaidTrialOnEnroll:
      parseSiteSettingBoolean(byKey.get(CREDIT_PAID_TRIAL_ON_ENROLL_KEY)) ??
      CREDIT_PAID_TRIAL_ON_ENROLL_DEFAULT,
    allowParentPartialSectionPayments:
      parseSiteSettingBoolean(byKey.get(ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY)) ??
      ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_DEFAULT,
  };
}
