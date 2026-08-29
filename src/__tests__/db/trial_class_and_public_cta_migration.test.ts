/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("196_trial_class_and_public_cta.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/196_trial_class_and_public_cta.sql"),
    "utf-8",
  );

  it("seeds public_cta_mode and keeps every previous public site_settings key", () => {
    expect(sql).toMatch(/'public_cta_mode'/);
    expect(sql).toMatch(/ON CONFLICT \(key\) DO NOTHING/);
    expect(sql).toMatch(
      /template_kind::text IN \('mozarthitos', 'espaciozenit', 'liora'\)/,
    );
    for (const key of [
      "inscriptions_enabled",
      "initial_site_setup",
      "billing_currency",
      "bank_transfer_instructions",
      "billing_model",
      "public_cta_mode",
    ]) {
      expect(sql).toContain(`'${key}'`);
    }
    expect(sql).toMatch(/TO anon, authenticated/);
  });

  it("adds cohort and section trial offer columns with inherit semantics", () => {
    expect(sql).toMatch(
      /academic_cohorts[\s\S]*offers_trial BOOLEAN NOT NULL DEFAULT false/,
    );
    expect(sql).toMatch(
      /academic_cohorts[\s\S]*trial_fee_amount NUMERIC\(12, 2\) NOT NULL DEFAULT 0/,
    );
    expect(sql).toMatch(
      /academic_sections[\s\S]*offers_trial BOOLEAN NULL/,
    );
    expect(sql).toMatch(
      /academic_sections[\s\S]*trial_fee_amount NUMERIC\(12, 2\) NULL/,
    );
  });

  it("adds registration intent, trial tokens, and the trial seats table", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS intent TEXT NOT NULL DEFAULT 'reserve'/);
    expect(sql).toMatch(/intent IN \('reserve', 'trial'\)/);
    expect(sql).toMatch(/trial_convert_token/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.registration_trial_seats/);
    expect(sql).toMatch(/status IN \('booked', 'attended', 'absent', 'released'\)/);
  });

  it("is additive", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
