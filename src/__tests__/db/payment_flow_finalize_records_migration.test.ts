/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Pins the schema/RLS contract behind regenerated payment receipts.
 *
 * The receipt loader (`loadPaymentForReceipt`) and the finalize hook
 * (`finalizeMonthlyPaymentFromFlowGateway`) both rely on this table having:
 *  - `payment_id` as PRIMARY KEY (so concurrent finalize calls upsert idempotently),
 *  - SELECT-only RLS aligned to `payments_select`,
 *  - no INSERT/UPDATE/DELETE policies (writes go through service_role).
 *
 * If a future migration drops this contract, the receipts feature degrades silently
 * (loader keeps working with the legacy fallback, but new payments lose authoritative
 * paid_at + flow_order). Failing loud here forces that change to be intentional.
 */
describe("116_payment_flow_finalize_records.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/116_payment_flow_finalize_records.sql"),
    "utf-8",
  );

  it("creates payment_flow_finalize_records with payment_id PRIMARY KEY", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.payment_flow_finalize_records/);
    expect(sql).toMatch(
      /payment_id UUID PRIMARY KEY REFERENCES public\.payments \(id\) ON DELETE CASCADE/,
    );
  });

  it("stores authoritative finalize fields (flow_order, commerce_order, paid_at, raw_payload)", () => {
    expect(sql).toMatch(/flow_order BIGINT NOT NULL/);
    expect(sql).toMatch(/commerce_order TEXT NOT NULL/);
    expect(sql).toMatch(/paid_at TIMESTAMPTZ NOT NULL/);
    expect(sql).toMatch(/raw_payload JSONB NOT NULL/);
  });

  it("enables RLS and exposes a SELECT policy aligned to payments visibility", () => {
    expect(sql).toMatch(/ALTER TABLE public\.payment_flow_finalize_records ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/CREATE POLICY payment_flow_finalize_records_select[\s\S]*FOR SELECT/);
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(/p\.student_id = auth\.uid\(\)/);
    expect(sql).toMatch(/p\.parent_id = auth\.uid\(\)/);
    expect(sql).toMatch(/public\.tutor_can_view_student_finance\(auth\.uid\(\), p\.student_id\)/);
  });

  it("does NOT expose user-facing INSERT/UPDATE/DELETE policies (service_role only)", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^\n]*FOR INSERT/);
    expect(sql).not.toMatch(/CREATE POLICY[^\n]*FOR UPDATE/);
    expect(sql).not.toMatch(/CREATE POLICY[^\n]*FOR DELETE/);
  });
});
