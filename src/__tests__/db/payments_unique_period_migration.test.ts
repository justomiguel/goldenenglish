/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Pin the database-side contract that backs the idempotent receipt upload.
 *
 * The student/parent flows rely on Postgres rejecting duplicate rows for the
 * same (student, section, month, year) tuple so the application-level
 * `INSERT ... ON CONFLICT`-equivalent retry in `resolveStudentPaymentSlot`
 * has something to react to. If a future migration accidentally drops these
 * partial unique indexes, double clicks / two-tutor races would silently
 * create duplicate payment rows. This test fails loud in that case.
 */
describe("054_section_fee_plans.sql — payments unique invariants", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/054_section_fee_plans.sql"),
    "utf-8",
  );

  it("removes the legacy single-section unique constraint", () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.payments[\s\S]*DROP CONSTRAINT IF EXISTS payments_student_period_uidx/,
    );
    expect(sql).toMatch(/DROP INDEX IF EXISTS public\.payments_student_period_uidx/);
  });

  it("creates a partial unique index for section-aware payments", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS payments_student_section_period_uidx[\s\S]*ON public\.payments \(student_id, section_id, month, year\)[\s\S]*WHERE section_id IS NOT NULL/,
    );
  });

  it("creates a partial unique index for legacy rows without section", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS payments_student_legacy_period_uidx[\s\S]*ON public\.payments \(student_id, month, year\)[\s\S]*WHERE section_id IS NULL/,
    );
  });
});
