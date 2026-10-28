/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("227_register_show_all_sections.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/227_register_show_all_sections.sql"),
    "utf-8",
  );

  it("seeds the register picker key off without overwriting an existing value", () => {
    expect(sql).toMatch(/'register_show_all_sections', 'false'::jsonb/);
    expect(sql).toMatch(/ON CONFLICT \(key\) DO NOTHING/);
  });

  it("keeps every previously public site_settings key and adds the picker key", () => {
    for (const key of [
      "inscriptions_enabled",
      "initial_site_setup",
      "billing_currency",
      "bank_transfer_instructions",
      "billing_model",
      "public_cta_mode",
      "credit_paid_trial_on_enroll",
      "allow_parent_partial_section_payments",
      "register_show_all_sections",
    ]) {
      expect(sql).toContain(`'${key}'`);
    }
    expect(sql).toMatch(/TO anon, authenticated/);
  });

  it("is additive: no destructive statement on existing data", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
