/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("240_section_delivery_mode_and_daily_rooms.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/240_section_delivery_mode_and_daily_rooms.sql"),
    "utf-8",
  );

  it("adds delivery_mode and section_daily_rooms with RLS and no client policies", () => {
    expect(sql).toContain("public.academic_sections");
    expect(sql).toContain("delivery_mode");
    expect(sql).toContain("public.section_daily_rooms");
    expect(sql.toLowerCase()).toContain("enable row level security");
    expect(sql.toLowerCase()).not.toMatch(/create policy[\s\S]*\b(anon|authenticated)\b/);
  });
});
