/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("203_nago_public_cta_both.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/203_nago_public_cta_both.sql"),
    "utf-8",
  );

  it("sets public_cta_mode to both on Nagô tenants", () => {
    expect(sql).toMatch(/key = 'public_cta_mode'/);
    expect(sql).toMatch(/'"both"'::jsonb/);
    expect(sql).toMatch(/template_kind::text = 'nago'/);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
  });
});
