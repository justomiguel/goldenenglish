/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("194_registration_enrollment_fee_checkout.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/194_registration_enrollment_fee_checkout.sql",
    ),
    "utf-8",
  );

  it("adds lead checkout columns without dropping existing ones", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS pay_token TEXT/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS intake_state TEXT NOT NULL DEFAULT 'none'/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS fee_snapshot JSONB NOT NULL DEFAULT '\{\}'/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS fee_captured BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS enrollment_fee_receipt_path TEXT/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS accepted_student_id UUID/);
    expect(sql).not.toMatch(/DROP COLUMN/i);
  });

  it("constrains intake_state and unique pay_token", () => {
    expect(sql).toMatch(/awaiting_fee/);
    expect(sql).toMatch(/receipt_pending/);
    expect(sql).toMatch(/needs_section/);
    expect(sql).toMatch(/section_full/);
    expect(sql).toMatch(/UNIQUE/);
    expect(sql).toMatch(/gen_random_bytes\(32\)/);
  });

  it("adds cohort enrollment_fee_mode defaulting to per_section", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS enrollment_fee_mode TEXT NOT NULL DEFAULT 'per_section'/,
    );
    expect(sql).toMatch(/once_for_all/);
  });

  it("maps Flow checkout refs to a registration and reserves MAT- refs", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS registration_id UUID/);
    expect(sql).toMatch(/payment_flow_checkout_refs_target_chk/);
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.payment_flow_reserve_commerce_ref_enrollment\(\s*p_registration_id UUID\s*\)/,
    );
    expect(sql).toMatch(/'MAT-'/);
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.payment_flow_reserve_commerce_ref_enrollment\(UUID\) TO service_role/,
    );
  });

  it("exposes open-seat and public pay-context RPCs to anon", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.registration_public_section_has_open_seat\(p_section_id uuid\)/,
    );
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.registration_public_pay_context\(p_token text\)/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.registration_public_section_has_open_seat\(uuid\) TO anon/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.registration_public_pay_context\(text\) TO anon/,
    );
  });
});
