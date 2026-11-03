import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/234_lms_catalog_hierarchy.sql"), "utf8");

describe("234 lms catalog hierarchy", () => {
  it("adds catalog tables and keeps the old route graph", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.course_categories");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.learning_programs");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.section_program_assignments");
    expect(sql).toContain("program_set_completion");
    expect(sql).not.toContain("DROP TABLE");
    expect(sql).not.toContain("learning_route_steps");
  });

  it("lets a section program unlock the course for the student and the tutor", () => {
    const hits = sql.match(/section_program_assignments spa/g) ?? [];
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.course_visible_to_user");
  });
});
