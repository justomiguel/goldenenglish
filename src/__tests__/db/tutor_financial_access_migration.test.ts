/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Pin the contract of `055_tutor_financial_access.sql` as text. We don't have
 * a Postgres harness in this repo, but the migration is the **single** place
 * that wires the privacy story (RLS + helper) for tutor ↔ student finance.
 * If any of these guarantees regresses we lose either privacy or the
 * tutor's ability to operate on the linked student's payments.
 */
describe("055_tutor_financial_access.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/055_tutor_financial_access.sql",
    ),
    "utf-8",
  );

  it("adds the financial-access opt-out columns idempotently", () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.tutor_student_rel[\s\S]*ADD COLUMN IF NOT EXISTS financial_access_revoked_at TIMESTAMPTZ NULL[\s\S]*ADD COLUMN IF NOT EXISTS financial_access_revoked_by UUID NULL/,
    );
  });

  it("creates a SECURITY DEFINER helper that returns true only when the link is active", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.tutor_can_view_student_finance/,
    );
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/financial_access_revoked_at IS NULL/);
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.tutor_can_view_student_finance/,
    );
  });

  it("rewrites payments_select to include the active-tutor branch", () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS payments_select ON public\.payments/);
    expect(sql).toMatch(
      /CREATE POLICY payments_select[\s\S]*public\.tutor_can_view_student_finance\(auth\.uid\(\), payments\.student_id\)/,
    );
  });

  it("requires active financial access for the tutor's INSERT and UPDATE on payments", () => {
    expect(sql).toMatch(
      /CREATE POLICY payments_insert_parent[\s\S]*parent_id = auth\.uid\(\)[\s\S]*public\.tutor_can_view_student_finance\(auth\.uid\(\), payments\.student_id\)/,
    );
    expect(sql).toMatch(
      /CREATE POLICY payments_update_parent[\s\S]*public\.tutor_can_view_student_finance\(auth\.uid\(\), payments\.student_id\)[\s\S]*parent_id = auth\.uid\(\)/,
    );
  });

  it("opens storage receipts on the linked student folder for the active tutor", () => {
    expect(sql).toMatch(/payment_receipts_insert_tutor_for_student/);
    expect(sql).toMatch(/payment_receipts_select_tutor_for_student/);
    expect(sql).toMatch(/payment_receipts_update_tutor_for_student/);
    expect(sql).toMatch(
      /bucket_id = 'payment-receipts'[\s\S]*public\.tutor_can_view_student_finance\(\s*auth\.uid\(\),\s*\(\(storage\.foldername\(name\)\)\[1\]\)::uuid\s*\)/,
    );
  });

  it("only lets the adult student toggle the financial-access columns", () => {
    expect(sql).toMatch(
      /CREATE POLICY tutor_student_rel_update_student_adult[\s\S]*auth\.uid\(\) = student_id[\s\S]*COALESCE\(p\.is_minor, false\) = false/,
    );
  });
});
