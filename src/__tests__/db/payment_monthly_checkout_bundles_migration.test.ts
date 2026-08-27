/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("192_payment_monthly_checkout_bundles.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/192_payment_monthly_checkout_bundles.sql"),
    "utf-8",
  );

  it("creates the bundle table and a service-role Flow reserve RPC", () => {
    expect(sql).toMatch(/CREATE TABLE public\.payment_monthly_checkout_bundles/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS bundle_id UUID/);
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.payment_flow_reserve_commerce_ref_bundle\(p_bundle_id UUID\)/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.payment_flow_reserve_commerce_ref_bundle\(UUID\) TO service_role/,
    );
    expect(sql).toMatch(/REVOKE ALL ON TABLE public\.payment_monthly_checkout_bundles FROM PUBLIC/);
  });
});
