/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// REGRESSION CHECK: finance cohort collections read `student_scholarships`.
// Environments missing the older billing migration must be repaired by 061 so
// the RPC does not fail before the matrix can render.
describe("061_student_scholarships_repair.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/061_student_scholarships_repair.sql"),
    "utf-8",
  );

  it("creates student_scholarships idempotently", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.student_scholarships/);
    expect(sql).toMatch(/student_id UUID NOT NULL REFERENCES public\.profiles/);
    expect(sql).toMatch(/student_scholarships_one_per_student UNIQUE \(student_id\)/);
  });

  it("keeps RLS policies for students, parents, tutors and admins", () => {
    expect(sql).toMatch(/ALTER TABLE public\.student_scholarships ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(/to_regclass\('public\.parent_student'\) IS NOT NULL/);
    expect(sql).toMatch(/ps\.parent_id = auth\.uid\(\)/);
    expect(sql).toMatch(/to_regclass\('public\.tutor_student_rel'\) IS NOT NULL/);
    expect(sql).toMatch(/ts\.financial_access_revoked_at IS NULL/);
  });

  it("repairs coupon support used by payment rows", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.discount_coupons/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS coupon_id UUID/);
    expect(sql).toMatch(/payments_coupon_idx/);
  });
});
