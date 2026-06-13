/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("150_billing_currency_portal_read.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/150_billing_currency_portal_read.sql"),
    "utf-8",
  );

  it("allows authenticated portal reads of billing_currency", () => {
    expect(sql).toMatch(/site_settings_select_public/);
    expect(sql).toMatch(/billing_currency/);
    expect(sql).toMatch(/TO anon, authenticated/);
  });
});
