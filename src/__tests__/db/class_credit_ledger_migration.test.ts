/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("180_class_credit_ledger.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/180_class_credit_ledger.sql"),
    "utf-8",
  );

  it("creates the consumption ledger and the recovery credits table", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.class_credit_consumptions/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.class_recovery_credits/);
  });

  // REGRESSION CHECK: these two properties are the whole reason the ledger is derived rather than a
  // counter. UNIQUE makes re-running the trigger for a corrected attendance idempotent; CASCADE makes
  // deleting an attendance row return the credit. Losing either one silently descuadra the balance.
  it("keys each consumption to one attendance row and cascades its deletion", () => {
    expect(sql).toMatch(
      /attendance_id\s+UUID NOT NULL UNIQUE\s*\n\s*REFERENCES public\.section_attendance \(id\) ON DELETE CASCADE/,
    );
  });

  it("keys each recovery credit to one attendance row and cascades its deletion", () => {
    expect(sql).toMatch(
      /origin_attendance_id\s+UUID NOT NULL UNIQUE\s*\n\s*REFERENCES public\.section_attendance \(id\) ON DELETE CASCADE/,
    );
  });

  it("fires the ledger trigger on insert and update of attendance", () => {
    expect(sql).toMatch(
      /CREATE TRIGGER section_attendance_sync_class_credit_ledger\s*\n\s*AFTER INSERT OR UPDATE ON public\.section_attendance\s*\n\s*FOR EACH ROW/,
    );
  });

  it("runs the trigger as SECURITY DEFINER with a pinned search_path", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.sync_class_credit_ledger\(\)/);
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public, pg_temp/);
  });

  it("consumes a credit for present, absent and late, and only those", () => {
    expect(sql).toMatch(/NEW\.status IN \('present', 'absent', 'late'\)/);
  });

  it("turns an excused absence into a recovery credit and removes any consumption", () => {
    expect(sql).toMatch(/ELSIF NEW\.status = 'excused' THEN/);
    expect(sql).toMatch(
      /ELSIF NEW\.status = 'excused' THEN[\s\S]*?DELETE FROM public\.class_credit_consumptions WHERE attendance_id = NEW\.id/,
    );
    expect(sql).toMatch(
      /ELSIF NEW\.status = 'excused' THEN[\s\S]*?INSERT INTO public\.class_recovery_credits/,
    );
  });

  it("re-consumes and drops the recovery credit when an excused record is corrected back", () => {
    expect(sql).toMatch(
      /NEW\.status IN \('present', 'absent', 'late'\)[\s\S]*?DELETE FROM public\.class_recovery_credits WHERE origin_attendance_id = NEW\.id/,
    );
  });

  it("upserts instead of inserting, so correcting an attendance record is idempotent", () => {
    expect(sql).toMatch(/ON CONFLICT \(attendance_id\) DO UPDATE/);
    expect(sql).toMatch(/ON CONFLICT \(origin_attendance_id\) DO UPDATE/);
  });

  // REGRESSION CHECK: switching a section to class-pack mode must not invent charges for months
  // already settled under a monthly fee, and a monthly-fee section must produce no ledger rows at all.
  it("writes nothing for sections that are not billed by class packs", () => {
    expect(sql).toMatch(/v_billing_mode IS DISTINCT FROM 'class_pack'[\s\S]*?RETURN NULL/);
  });

  // REGRESSION CHECK: a teacher taking attendance must never receive a billing error. If this function
  // ever raises on balance or configuration, the register becomes unusable at zero balance.
  it("never raises from the trigger", () => {
    expect(sql).not.toMatch(/RAISE EXCEPTION/);
  });

  it("grants no write policy on the ledger to authenticated: the trigger is the only writer", () => {
    expect(sql).not.toMatch(/class_credit_consumptions FOR INSERT/);
    expect(sql).not.toMatch(/class_credit_consumptions FOR UPDATE/);
    expect(sql).not.toMatch(/class_credit_consumptions FOR ALL/);
    expect(sql).not.toMatch(/class_recovery_credits FOR INSERT/);
    expect(sql).not.toMatch(/class_recovery_credits FOR UPDATE/);
    expect(sql).not.toMatch(/class_recovery_credits FOR ALL/);
  });

  it("enables RLS and revokes table-level writes as defence in depth", () => {
    expect(sql).toMatch(/ALTER TABLE public\.class_credit_consumptions ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE public\.class_recovery_credits ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(
      /REVOKE INSERT, UPDATE, DELETE ON public\.class_credit_consumptions FROM authenticated, anon/,
    );
    expect(sql).toMatch(
      /REVOKE INSERT, UPDATE, DELETE ON public\.class_recovery_credits FROM authenticated, anon/,
    );
  });

  it("restricts ledger reads to admin and the student's family", () => {
    expect(sql).toMatch(
      /CREATE POLICY class_credit_consumptions_select_scope[\s\S]*?public\.user_is_family_of_student/,
    );
    expect(sql).toMatch(
      /CREATE POLICY class_recovery_credits_select_scope[\s\S]*?public\.user_is_family_of_student/,
    );
  });

  it("is additive: no destructive statement on existing data", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
