/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("132_payment_gateway_mercadopago.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/132_payment_gateway_mercadopago.sql"),
    "utf-8",
  );

  it("allows flow and mercadopago providers", () => {
    expect(sql).toMatch(/CHECK \(provider IN \('flow', 'mercadopago'\)\)/);
  });

  it("adds webhook_secret_encrypted and payments gateway columns", () => {
    expect(sql).toMatch(/webhook_secret_encrypted TEXT/);
    expect(sql).toMatch(/gateway_provider TEXT/);
    expect(sql).toMatch(/mp_preference_id TEXT/);
  });

  it("creates payment_mp_finalize_records with payment_id PRIMARY KEY", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.payment_mp_finalize_records/);
    expect(sql).toMatch(
      /payment_id UUID PRIMARY KEY REFERENCES public\.payments \(id\) ON DELETE CASCADE/,
    );
    expect(sql).toMatch(/mp_payment_id BIGINT NOT NULL/);
  });

  it("exposes enabled_payment_gateways_for_country RPC to authenticated", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.enabled_payment_gateways_for_country/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.enabled_payment_gateways_for_country\(text\) TO authenticated/);
  });
});
