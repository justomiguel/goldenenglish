/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("178_section_billing_mode.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/178_section_billing_mode.sql"),
    "utf-8",
  );

  it("adds billing_mode defaulting to the current behaviour", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS billing_mode TEXT NOT NULL DEFAULT 'section_monthly_fee'/,
    );
  });

  it("constrains billing_mode to the two supported modes", () => {
    expect(sql).toMatch(/CHECK \(billing_mode IN \('section_monthly_fee', 'class_pack'\)\)/);
  });

  it("seeds the institute-level billing_model without overwriting an existing value", () => {
    expect(sql).toMatch(/'billing_model', '"section_monthly_fee"'::jsonb/);
    expect(sql).toMatch(/ON CONFLICT \(key\) DO NOTHING/);
  });

  // REGRESSION CHECK: `site_settings_select_public` is recreated wholesale, so every key granted by an
  // earlier migration must be repeated. Dropping one silently breaks registration gating, the setup
  // wizard, portal currency resolution, or the bank transfer instructions.
  it("keeps every previously public site_settings key and adds billing_model", () => {
    for (const key of [
      "inscriptions_enabled",
      "initial_site_setup",
      "billing_currency",
      "bank_transfer_instructions",
      "billing_model",
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
