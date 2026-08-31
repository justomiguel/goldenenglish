/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("202_family_billing_policy.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/202_family_billing_policy.sql"),
    "utf-8",
  );

  it("seeds both family checkout keys without overwriting an existing value", () => {
    expect(sql).toMatch(/'credit_paid_trial_on_enroll', 'true'::jsonb/);
    expect(sql).toMatch(/'allow_parent_partial_section_payments', 'true'::jsonb/);
    expect(sql).toMatch(/ON CONFLICT \(key\) DO NOTHING/);
  });

  it("keeps every previously public site_settings key and adds the new ones", () => {
    for (const key of [
      "inscriptions_enabled",
      "initial_site_setup",
      "billing_currency",
      "bank_transfer_instructions",
      "billing_model",
      "public_cta_mode",
      "credit_paid_trial_on_enroll",
      "allow_parent_partial_section_payments",
    ]) {
      expect(sql).toContain(`'${key}'`);
    }
    expect(sql).toMatch(/TO anon, authenticated/);
  });
});
