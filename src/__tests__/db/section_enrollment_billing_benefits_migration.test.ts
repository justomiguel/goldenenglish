/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("064_section_enrollment_billing_benefits.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/064_section_enrollment_billing_benefits.sql",
    ),
    "utf-8",
  );

  it("stores enrollment-fee exemption and scholarship on section enrollments", () => {
    expect(sql).toMatch(/ALTER TABLE public\.section_enrollments/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS enrollment_fee_exempt/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS scholarship_discount_percent/);
    expect(sql).toMatch(/section_enrollments_student_section_benefits_idx/);
  });

  it("only backfills global benefits when one active section is unambiguous", () => {
    expect(sql).toMatch(/count\(\*\) AS active_count/);
    expect(sql).toMatch(/sas\.active_count = 1/);
    expect(sql).toMatch(/JOIN public\.student_scholarships sc/);
  });
});
