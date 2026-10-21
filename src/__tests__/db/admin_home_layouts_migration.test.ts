/** @vitest-environment node */
// REGRESSION CHECK: The home layout table is personal. RLS requires the
// session user and an admin, and the migration does not drop data.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/217_admin_home_layouts.sql"),
  "utf8",
);

describe("217_admin_home_layouts", () => {
  it("stores one layout per admin and locks the row to that admin", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public.admin_home_layouts/);
    expect(sql).toMatch(/profile_id uuid PRIMARY KEY REFERENCES public.profiles/);
    expect(sql).toMatch(/ON DELETE CASCADE/);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/profile_id = auth.uid\(\)/);
    expect(sql).toMatch(/is_current_user_admin\(\)/);
    expect(sql).not.toMatch(/DROP TABLE/);
    expect(sql).not.toMatch(/TRUNCATE/);
  });
});
