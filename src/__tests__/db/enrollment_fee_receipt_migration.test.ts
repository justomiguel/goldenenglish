/** @vitest-environment node */
// REGRESSION CHECK: Enrollment fee receipts must persist in `section_enrollments`.
// The upload action stores the file first, then calls this narrow RPC; without it
// RLS can make the row update affect 0 rows while the UI briefly reports success.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("067_enrollment_fee_receipt.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/067_enrollment_fee_receipt.sql"),
    "utf-8",
  );

  it("adds receipt columns to section enrollments", () => {
    expect(sql).toMatch(/ALTER TABLE public\.section_enrollments/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_url/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_status/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_uploaded_at/);
  });

  it("persists receipts through a narrow SECURITY DEFINER RPC", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.submit_enrollment_fee_receipt/);
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/public\.tutor_can_view_student_finance\(v_actor_id, p_student_id\)/);
    expect(sql).toMatch(/p_receipt_url NOT LIKE \(p_student_id::TEXT \|\| '\/enrollment-fee\/%'\)/);
    expect(sql).toMatch(/enrollment_fee_receipt_status = 'pending'/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.submit_enrollment_fee_receipt/);
  });
});
