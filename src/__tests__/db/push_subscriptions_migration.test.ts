/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("151_push_subscriptions.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/151_push_subscriptions.sql"),
    "utf-8",
  );

  it("creates push_subscriptions with RLS for owner access", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.push_subscriptions/);
    expect(sql).toMatch(/UNIQUE \(user_id, endpoint\)/);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/auth\.uid\(\) = user_id/);
  });
});
