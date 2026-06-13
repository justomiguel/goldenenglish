/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("154_section_billing_defaults.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/154_section_billing_defaults.sql"),
    "utf-8",
  );

  it("sets advance monthly payment default to true and backfills rows", () => {
    expect(sql).toMatch(/allow_advance_monthly_payment SET DEFAULT true/);
    expect(sql).toMatch(/SET allow_advance_monthly_payment = true/);
  });

  it("sets monthly fee charge mode default to full_month_fee and backfills rows", () => {
    expect(sql).toMatch(/monthly_fee_charge_mode SET DEFAULT 'full_month_fee'/);
    expect(sql).toMatch(/SET monthly_fee_charge_mode = 'full_month_fee'/);
  });
});
