/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("207_tenant_merch_shop.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/207_tenant_merch_shop.sql"),
    "utf-8",
  );

  it("is additive and does not grant all to anon", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_products/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_product_variants/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_orders/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_order_items/);
    expect(sql).toMatch(/shop_order_id/);
    expect(sql).toMatch(/payment_flow_reserve_commerce_ref_merch/);
    expect(sql).toMatch(/shop_mark_paid_and_decrement_stock/);
    expect(sql).toMatch(/merch_enabled/);
    expect(sql).toMatch(/'false'::jsonb/);
    expect(sql).toMatch(/shop-media/);
    expect(sql).not.toMatch(/GRANT ALL ON ALL TABLES/);
    expect(sql).not.toMatch(/DROP TABLE/);
  });

  it("keeps prior checkout targets in the refs CHECK", () => {
    expect(sql).toMatch(/payment_id IS NOT NULL/);
    expect(sql).toMatch(/registration_id IS NOT NULL/);
    expect(sql).toMatch(/bundle_id IS NOT NULL/);
    expect(sql).toMatch(/shop_order_id IS NOT NULL/);
  });

  it("revokes SECURITY DEFINER execute from anon and authenticated", () => {
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.shop_mark_paid_and_decrement_stock\(UUID\) FROM anon, authenticated;/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.payment_flow_reserve_commerce_ref_merch\(UUID\) FROM anon, authenticated;/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.shop_mark_paid_and_decrement_stock\(UUID\) TO service_role;/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.payment_flow_reserve_commerce_ref_merch\(UUID\) TO service_role;/,
    );
  });
});
