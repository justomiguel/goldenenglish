/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("267_payment_method_cash.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/267_payment_method_cash.sql"),
    "utf-8",
  );

  it("adds the method and paid-date columns with the shared method list", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS payment_method TEXT");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS paid_on DATE");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS enrollment_fee_paid_method TEXT");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS enrollment_fee_paid_amount NUMERIC(12, 2)");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS enrollment_fee_paid_on DATE");
    for (const method of ["cash", "transfer", "card", "gateway", "other"]) {
      expect(sql).toContain(`'${method}'`);
    }
  });

  it("returns the new fields from the cohort collections RPC", () => {
    expect(sql).toContain("'enrollment_fee_paid_method', e.enrollment_fee_paid_method");
    expect(sql).toContain("'payment_method', pay.payment_method");
    expect(sql).toContain("'paid_on', pay.paid_on");
  });

  it("is additive: no destructive statement on existing data", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
