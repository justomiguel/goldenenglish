/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("195_cohort_default_fees.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/195_cohort_default_fees.sql"),
    "utf-8",
  );

  it("adds nullable cohort default fee columns with non-negative checks", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS default_enrollment_fee_amount NUMERIC\(12, 2\) NULL/,
    );
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS default_monthly_fee NUMERIC\(12, 2\) NULL/);
    expect(sql).toMatch(
      /default_enrollment_fee_amount IS NULL\s+OR default_enrollment_fee_amount >= 0/,
    );
    expect(sql).toMatch(/default_monthly_fee IS NULL OR default_monthly_fee >= 0/);
  });

  it("makes section enrollment_fee_amount nullable with a null-safe check", () => {
    expect(sql).toMatch(
      /ALTER COLUMN enrollment_fee_amount DROP NOT NULL/,
    );
    expect(sql).toMatch(/ALTER COLUMN enrollment_fee_amount SET DEFAULT NULL/);
    expect(sql).toMatch(
      /CHECK \(enrollment_fee_amount IS NULL OR enrollment_fee_amount >= 0\)/,
    );
  });

  it("does not rewrite existing section rows", () => {
    expect(sql).not.toMatch(/UPDATE\s+public\.academic_sections/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
