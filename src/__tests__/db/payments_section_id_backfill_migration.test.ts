/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// REGRESSION CHECK: Finance cohort matrices and receipt uploads rely on
// `payments.section_id`; environments that missed migration 054 must be repaired
// by 060 without losing legacy payment rows.
describe("060_payments_section_id_backfill.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/060_payments_section_id_backfill.sql"),
    "utf-8",
  );

  it("adds payments.section_id idempotently", () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.payments[\s\S]*ADD COLUMN IF NOT EXISTS section_id UUID[\s\S]*REFERENCES public\.academic_sections/,
    );
  });

  it("keeps section-aware and legacy payment uniqueness", () => {
    expect(sql).toMatch(/payments_student_section_period_uidx/);
    expect(sql).toMatch(/WHERE section_id IS NOT NULL/);
    expect(sql).toMatch(/payments_student_legacy_period_uidx/);
    expect(sql).toMatch(/WHERE section_id IS NULL/);
  });

  it("backfills only students with one active section", () => {
    expect(sql).toMatch(/array_agg\(se\.section_id ORDER BY se\.section_id::text\)\)\[1\] AS section_id/);
    expect(sql).toMatch(/count\(DISTINCT se\.section_id\) AS section_count/);
    expect(sql).toMatch(/sas\.section_count = 1/);
  });
});
