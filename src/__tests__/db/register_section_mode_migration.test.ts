/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("265_register_section_mode.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/265_register_section_mode.sql"),
    "utf-8",
  );

  it("seeds student choice only when the old boolean is true", () => {
    expect(sql).toMatch(/WHEN value = 'true'::jsonb THEN '"student_choice"'::jsonb/);
    expect(sql).toMatch(/ELSE '"first_open"'::jsonb/);
    expect(sql).toMatch(/ON CONFLICT \(key\) DO NOTHING/);
  });

  it("keeps the public site_settings keys and adds the mode key", () => {
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
      "register_section_mode",
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
