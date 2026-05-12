/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Migration 117 adds the settlement fields admin finance reporting consumes from
 * Flow.cl `paymentData`. All columns are optional (Flow does not always report fee
 * for older orders / sandbox), but the admin "Flow detail" modal expects them by
 * name. If a future migration drops or renames any of these, the modal silently
 * shows `—` everywhere — failing loud here forces that to be intentional.
 */
describe("117_payment_flow_finalize_records_settlement_fields.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/117_payment_flow_finalize_records_settlement_fields.sql",
    ),
    "utf-8",
  );

  it("adds the optional settlement columns admin reporting needs", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS fee NUMERIC\(12, 2\)/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS balance NUMERIC\(12, 2\)/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS transfer_date TIMESTAMPTZ/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC\(20, 8\)/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMPTZ/);
  });

  it("guards fee and balance against negative values when populated", () => {
    expect(sql).toMatch(
      /CONSTRAINT payment_flow_finalize_records_fee_nonneg[\s\S]*CHECK \(fee IS NULL OR fee >= 0\)/,
    );
    expect(sql).toMatch(
      /CONSTRAINT payment_flow_finalize_records_balance_nonneg[\s\S]*CHECK \(balance IS NULL OR balance >= 0\)/,
    );
  });

  it("does not destroy data on existing rows (purely additive)", () => {
    expect(sql).not.toMatch(/\bDROP TABLE\b/);
    expect(sql).not.toMatch(/\bTRUNCATE\b/);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/);
    expect(sql).not.toMatch(/\bDELETE FROM\b/);
  });
});
