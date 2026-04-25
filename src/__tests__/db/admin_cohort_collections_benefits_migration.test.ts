/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// REGRESSION CHECK: finance overview uses the bulk RPC. If the payload omits
// billing benefits, exempt students can be counted as owing enrollment fees.
describe("062_admin_cohort_collections_benefits.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/062_admin_cohort_collections_benefits.sql",
    ),
    "utf-8",
  );

  it("adds enrollment exemption fields to profile payload", () => {
    expect(sql).toMatch(/'enrollment_fee_exempt', p\.enrollment_fee_exempt/);
    expect(sql).toMatch(/'enrollment_exempt_reason', p\.enrollment_exempt_reason/);
  });

  it("returns active student promotions in the bulk payload", () => {
    expect(sql).toMatch(/v_promotions jsonb/);
    expect(sql).toMatch(/FROM public\.student_promotions sp/);
    expect(sql).toMatch(/'promotions', v_promotions/);
    expect(sql).toMatch(/monthly_months_remaining > 0/);
    expect(sql).toMatch(/NOT sp\.enrollment_consumed/);
  });
});
